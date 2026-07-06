/**
 * Phase 4B — TheoryCraftPanel Layout Wrapper
 *
 * Top-level layout component that mounts all 5 theorycraft feature components
 * in a vertical stack. Consumes the useTheoryCraft hook to derive state from
 * upstream inputs, then distributes view model slices to each feature panel.
 *
 * Validates: Requirements 10.2, 10.4, 11.9
 */

import React, { useMemo } from "react";
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
      <HeroMetricsBar viewModel={state.heroMetrics} />

      {/* 2. Formula Explainer */}
      <FormulaExplainer viewModel={formulaExplainerViewModel} />

      {/* 3. Set Bonus Tracker */}
      <SetBonusTracker viewModel={state.setBonusTracker} />

      {/* 4. Stat Weight Calculator */}
      <StatWeightCalculator viewModel={state.statWeights} />

      {/* 5. Build Comparison — show EmptyState when null */}
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
    </div>
  );
}

export default TheoryCraftPanel;
