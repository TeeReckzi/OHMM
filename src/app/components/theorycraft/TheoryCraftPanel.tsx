/**
 * Phase 4B — TheoryCraftPanel Layout Wrapper
 *
 * Top-level layout component that mounts all 5 theorycraft feature components
 * in a vertical stack. Consumes the useTheoryCraft hook to derive state from
 * upstream inputs, then distributes view model slices to each feature panel.
 *
 * Validates: Requirements 10.2, 10.4, 11.9
 */

import React, { useMemo, useState, useEffect } from "react";
import { Clock } from "lucide-react";
import "./shared/theorycraft-tokens.css";
import type { BuildSelection } from "@/ohai/src/ui/types";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import { useTheoryCraft } from "@/lib/ohmm/theorycraft/useTheoryCraft";
import { HeroMetricsBar } from "./HeroMetricsBar";
import { FormulaExplainer } from "./FormulaExplainer";
import { SetBonusTracker } from "./SetBonusTracker";
import { StatWeightCalculator } from "./StatWeightCalculator";
import { BuildComparisonView } from "./BuildComparisonView";
import { EmptyState } from "./shared/EmptyState";
import { FirstTimeHints } from "./shared/FirstTimeHints";
import { EMPTY_STATE_MESSAGES } from "@/lib/ohmm/theorycraft/constants";
import { NeuralBuildGraph } from "./NeuralBuildGraph";
import { deriveBuildGraph } from "@/lib/ohmm/theorycraft/buildGraph.vm";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TheoryCraftPanelProps {
  buildSelection: BuildSelection;
  calcInput: CalculationInput;
  combatOutput: CombatOutput;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats a Date.now() timestamp as a relative time string.
 * Validates: Requirements 11.11
 */
function formatTimestamp(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 2) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * TheoryCraftPanel — layout wrapper for all theorycraft features.
 *
 * - Calls useTheoryCraft to derive TheoryCraftState from upstream inputs
 * - Mounts all 5 feature components in a vertical stack
 * - Passes appropriate view model slices to each feature
 * - Shows EmptyState for BuildComparison when no comparison data exists
 * - Does NOT add orchestration logic to App.tsx (Requirement 10.4)
 */
export function TheoryCraftPanel({
  buildSelection,
  calcInput,
  combatOutput,
}: TheoryCraftPanelProps) {
  const state = useTheoryCraft(buildSelection, calcInput, combatOutput);

  // Derive the Neural Build Graph view model from upstream inputs
  const buildGraphViewModel = useMemo(
    () => deriveBuildGraph(buildSelection, calcInput, combatOutput),
    [buildSelection, calcInput, combatOutput]
  );

  // FormulaExplainer receives the view model without the isExpanded UI state
  // (component manages its own expand/collapse state internally)
  const { isExpanded: _isExpanded, ...formulaExplainerViewModel } = state.formulaExplainer;

  const [rankHistory, setRankHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (state.statWeights?.entries && state.statWeights.isComputable) {
      setRankHistory((prev) => {
        const next = { ...prev };
        for (const entry of state.statWeights.entries) {
          const hist = prev[entry.stat] ? [...prev[entry.stat]] : [];
          hist.push(entry.rank);
          if (hist.length > 5) {
            hist.shift();
          }
          next[entry.stat] = hist;
        }
        return next;
      });
    }
  }, [state.lastComputedAt]);

  const [hideTips, setHideTips] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ohmm-hide-tips") === "true";
    }
    return false;
  });

  const toggleHideTips = () => {
    setHideTips((prev) => {
      const next = !prev;
      localStorage.setItem("ohmm-hide-tips", String(next));
      return next;
    });
  };

  const contextualTip = useMemo(() => {
    const weaponId = buildSelection?.weapon?.blueprintId?.toLowerCase() ?? "";
    if (weaponId.includes("corrosion") || weaponId.includes("acid")) {
      return "Your weapon deals elemental/corrosion damage. Buffing status and elemental stats will yield the highest DPS gains!";
    }
    if (weaponId.includes("mp7") || weaponId.includes("smg")) {
      return "Fast Gunner weapons scale exceptionally well with firing rate boosts and extra magazine capacity.";
    }
    if (weaponId.includes("memento") || weaponId.includes("sniper") || weaponId.includes("bow")) {
      return "Bullseye and weakspot effects trigger massive multipliers. Target weakspots whenever possible!";
    }
    
    // Check armor sets in set bonus tracker
    const hasLoneWolf = state.setBonusTracker?.sets?.some(s => s.setName.toLowerCase().includes("lone wolf"));
    if (hasLoneWolf) {
      return "Lone Wolf set bonus increases crit capability. Stack Crit Rate and Crit DMG to reach maximum stacks quickly!";
    }

    return "Calibrating weapon and gear is the most cost-effective way to get flat stat upgrades without changing gear pieces.";
  }, [buildSelection, state.setBonusTracker]);

  return (
    <div className="flex flex-col gap-3 w-full" aria-label="Theorycraft Panel">
      {/* Panel Header — title + last engine update timestamp */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-400">Theorycraft</span>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Clock size={12} />
          <span>{formatTimestamp(state.lastComputedAt)}</span>
        </div>
      </div>

      {/* 1. Hero Metrics Bar */}
      <div>
        <FirstTimeHints
          hintKey="hero-metrics"
          title="Hero Metrics"
          description="Displays core combat output, TTK (Time to Kill), and the data confidence rating for your current loadout."
        />
        <HeroMetricsBar viewModel={state.heroMetrics} />
      </div>

      {/* 2. Formula Explainer */}
      <div>
        <FirstTimeHints
          hintKey="formula-explainer"
          title="Formula Explainer"
          description="Deconstructs your total damage into base weapon, additive, and multiplicative layers, showing the contribution of each."
        />
        <FormulaExplainer viewModel={formulaExplainerViewModel} />
      </div>

      {/* 3. Set Bonus Tracker */}
      <div>
        <FirstTimeHints
          hintKey="set-bonus"
          title="Set Bonuses"
          description="Tracks active armor set bonuses and shows the estimated DPS value of upgrading to the next set tier."
        />
        <SetBonusTracker viewModel={state.setBonusTracker} />
      </div>

      {/* 4. Stat Weight Calculator */}
      <div>
        <FirstTimeHints
          hintKey="stat-weights"
          title="Stat Weights"
          description="Calculates the relative DPS value of key combat stats by running perturbations. Look for the Crown indicating your best upgrade."
        />
        <StatWeightCalculator viewModel={state.statWeights} rankHistory={rankHistory} />
      </div>

      {/* 5. Build Comparison — show EmptyState when null */}
      <div>
        <FirstTimeHints
          hintKey="build-comparison"
          title="Build Comparison"
          description="Provides a side-by-side comparison of slot changes and computes a net verdict on performance shifts."
        />
        {state.buildComparison !== null ? (
          <BuildComparisonView viewModel={state.buildComparison} />
        ) : (
          <section
            aria-label="Build Comparison"
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
          >
            <EmptyState
              message={EMPTY_STATE_MESSAGES.buildComparison}
              icon="scale"
            />
          </section>
        )}
      </div>

      {/* 6. Neural Build Graph */}
      <section aria-label="Build Neural Graph" className="mt-3">
        <h3 className="text-xs font-medium text-gray-400 mb-2">Build Neural Graph</h3>
        <NeuralBuildGraph
          viewModel={buildGraphViewModel}
          showCohesion={true}
          showAnalytics={false}
          enableFailureMode={true}
          enableTemporalPlayback={true}
        />
      </section>

      {/* 7. Global Tips & Contextual tip */}
      <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300">Contextual Tips & Tricks</span>
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none">
            <input
              type="checkbox"
              checked={hideTips}
              onChange={toggleHideTips}
              className="rounded bg-gray-800 border-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            Hide tips
          </label>
        </div>
        {!hideTips && (
          <p className="text-xs text-cyan-300/85 bg-cyan-950/15 border border-cyan-800/10 p-2.5 rounded-lg leading-relaxed">
            <strong>Did you know?</strong> {contextualTip}
          </p>
        )}
      </div>
    </div>
  );
}

export default TheoryCraftPanel;
