/**
 * Phase 4B Theorycraft UX — Stat Weight Calculator View Model
 *
 * Pure perturbation engine: deep-clones CalculationInput, injects a
 * synthetic modifier for each perturbable stat, re-runs the engine,
 * and derives ranked stat weights by DPS gain.
 *
 * No React or DOM dependencies.
 */

import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import { computeCombatOutput } from "@/ohai/src/ui/combatOutput";
import { aggregateModifiers } from "@/ohai/src/engine/modifierAggregation";
import type { ModifierSource } from "@/ohai/src/engine/modifierTypes";
import type { StatWeightEntry, StatWeightViewModel, PerturbableStat } from "./types";
import {
  PERTURBATION_DELTAS,
  STAT_CATEGORY_LABELS,
  STAT_WEIGHT_DISCLAIMER,
  STAT_WEIGHT_NO_BASELINE_MESSAGE,
} from "./constants";

// ─── Safe default result ─────────────────────────────────────────────────────

const EMPTY_RESULT: StatWeightViewModel = {
  entries: [],
  baselineDPS: 0,
  disclaimer: STAT_WEIGHT_DISCLAIMER,
  isComputable: false,
  errorMessage: STAT_WEIGHT_NO_BASELINE_MESSAGE,
};

// ─── Deep clone helper ───────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  try {
    return structuredClone(obj);
  } catch {
    // Fallback for environments where structuredClone may fail on exotic objects
    return JSON.parse(JSON.stringify(obj));
  }
}

// ─── Perturbation engine ─────────────────────────────────────────────────────

/**
 * Deep-clones the calculation input, injects a synthetic modifier source
 * for the given stat with the specified delta, re-aggregates modifiers,
 * re-runs the combat engine, and returns the new DPS value.
 *
 * Never mutates the original calcInput.
 */
function perturbAndCompute(
  calcInput: CalculationInput,
  stat: PerturbableStat,
  delta: number,
): number {
  // 1. Deep clone
  const cloned = deepClone(calcInput);

  // 2. Inject synthetic modifier source
  const syntheticModifier: ModifierSource = {
    id: `perturbation_${stat}`,
    sourceType: "calibration",
    sourceLabel: "Stat Weight Perturbation",
    stat: stat,
    value: delta,
    behavior: "additive",
    confidence: "confirmed",
  };

  cloned.modifierSources.push(syntheticModifier);

  // 3. Re-aggregate modifiers with the injected perturbation
  cloned.aggregationReport = aggregateModifiers(cloned.modifierSources);

  // 4. Re-run engine
  const output = computeCombatOutput(cloned, cloned.pvpMitigation);

  // 5. Return DPS (default to 0 if undefined)
  return output.damageOutput.DPS ?? 0;
}

// ─── Main derivation function ────────────────────────────────────────────────

/**
 * Derives stat weights by perturbing each of 7 stat categories and measuring
 * the resulting DPS gain relative to the baseline.
 *
 * Returns a sorted, ranked list of stat weight entries with bar scaling.
 *
 * Never throws — returns safe defaults on any error.
 * Never mutates the original calcInput or combatOutput.
 */
export function deriveStatWeights(
  calcInput: CalculationInput,
  combatOutput: CombatOutput,
): StatWeightViewModel {
  try {
    // Extract baseline DPS
    const baselineDPS = combatOutput.damageOutput.DPS ?? 0;

    // Guard: cannot compute stat weights without a valid baseline
    if (baselineDPS <= 0) {
      return EMPTY_RESULT;
    }

    // Iterate all 7 stat categories
    const results: StatWeightEntry[] = [];
    for (const [stat, delta] of Object.entries(PERTURBATION_DELTAS)) {
      const perturbedDPS = perturbAndCompute(
        calcInput,
        stat as PerturbableStat,
        delta,
      );
      const absoluteGain = perturbedDPS - baselineDPS;

      results.push({
        stat: stat as PerturbableStat,
        label: STAT_CATEGORY_LABELS[stat as PerturbableStat],
        absoluteGain,
        relativeGainPercent: 0, // Computed below after sorting
        barWidth: 0, // Computed below after sorting
        rank: 0, // Assigned below after sorting
      });
    }

    // Sort descending by absoluteGain
    results.sort((a, b) => b.absoluteGain - a.absoluteGain);

    // Compute ranks, barWidths, and relative gain percentages
    const maxGain = results[0]?.absoluteGain || 1;
    results.forEach((r, i) => {
      r.rank = i + 1;
      r.barWidth = maxGain > 0 ? Math.max(0, r.absoluteGain / maxGain) : 0;
      r.relativeGainPercent = (r.absoluteGain / baselineDPS) * 100;
    });

    return {
      entries: results,
      baselineDPS,
      disclaimer: STAT_WEIGHT_DISCLAIMER,
      isComputable: true,
      errorMessage: null,
    };
  } catch {
    // Never throw — return safe default on any error
    return EMPTY_RESULT;
  }
}
