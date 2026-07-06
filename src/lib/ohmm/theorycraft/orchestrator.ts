/**
 * Phase 4B Theorycraft UX — Orchestrator
 *
 * Coordinates all view model derivations from a single CombatOutput computation.
 * Memoizes expensive stat weight calculations by hashing BuildSelection.
 * Wraps each derive call defensively — a failure in one view model does not
 * cascade to others.
 *
 * No React or DOM dependencies. Pure TypeScript orchestration.
 *
 * Validates: Requirements 10.2, 10.4, 11.4
 */

import type { BuildSelection } from "@/ohai/src/ui/types";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import type { SavedBuild } from "@/ohai/src/ui/savedBuildSchema";
import type {
  TheoryCraftState,
  HeroMetricsViewModel,
  FormulaExplainerViewModel,
  SetBonusTrackerViewModel,
  StatWeightViewModel,
  BuildComparisonViewModel,
} from "./types";
import { STAT_WEIGHT_DISCLAIMER, STAT_WEIGHT_NO_BASELINE_MESSAGE, EMPTY_STATE_MESSAGES } from "./constants";
import { hashBuildSelection } from "./utils";
import { deriveHeroMetrics } from "./heroMetrics.vm";
import { deriveFormulaExplainer } from "./formulaExplainer.vm";
import { deriveSetBonusTracker } from "./setBonusTracker.vm";
import { deriveStatWeights } from "./statWeightCalculator.vm";
import { deriveBuildComparison } from "./buildComparison.vm";

// ─── Safe default fallbacks ──────────────────────────────────────────────────

const FALLBACK_HERO_METRICS: HeroMetricsViewModel = {
  metrics: [],
  buildCompleteness: 0,
  confidenceScore: "placeholder",
  buildMode: "pve",
};

const FALLBACK_FORMULA_EXPLAINER: Omit<FormulaExplainerViewModel, "isExpanded"> = {
  baseWeaponDamage: "—",
  totalExpectedDamage: "—",
  activeContributorCount: 0,
  additiveGroup: [],
  multiplicativeGroup: [],
  targetAssumptions: [],
  pvpMitigationSection: null,
  summaryLine: "0 active contributors → — expected damage",
};

const FALLBACK_SET_BONUS_TRACKER: SetBonusTrackerViewModel = {
  sets: [],
  isEmpty: true,
  emptyStateMessage: EMPTY_STATE_MESSAGES.setBonusTracker,
};

const FALLBACK_STAT_WEIGHTS: StatWeightViewModel = {
  entries: [],
  baselineDPS: 0,
  disclaimer: STAT_WEIGHT_DISCLAIMER,
  isComputable: false,
  errorMessage: STAT_WEIGHT_NO_BASELINE_MESSAGE,
};

const FALLBACK_BUILD_COMPARISON: BuildComparisonViewModel = {
  currentBuildName: "",
  savedBuildName: "",
  metricDeltas: [],
  slotDiffs: [],
  isAvailable: false,
  errorMessage: null,
  emptyStateMessage: EMPTY_STATE_MESSAGES.buildComparison,
};

// ─── Memoization state (module-level closure) ────────────────────────────────

let cachedStatWeightsHash: string | null = null;
let cachedStatWeights: StatWeightViewModel = FALLBACK_STAT_WEIGHTS;

// ─── Defensive wrapper ───────────────────────────────────────────────────────

/**
 * Wraps a derivation call — catches any thrown errors and returns the
 * provided fallback instead. Ensures one failing view model does not
 * bring down the entire orchestrator.
 */
function safeDerive<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Computes the full TheoryCraftState by distributing the already-computed
 * CombatOutput to all view model derivation functions.
 *
 * Key behaviors:
 * - Does NOT recompute CombatOutput — receives it as input (computed upstream)
 * - Memoizes stat weights: hashes BuildSelection, only recomputes when hash changes
 * - Wraps each derive call in safeDerive — errors return safe fallbacks
 * - Returns complete TheoryCraftState with all 5 view models + timestamp
 *
 * @param buildSelection - Current user loadout
 * @param calcInput - Normalized calculation input (already computed upstream)
 * @param combatOutput - Engine result (already computed upstream)
 * @param savedBuild - Optional saved build for comparison (null if none selected)
 */
export function computeTheoryCraftState(
  buildSelection: BuildSelection,
  calcInput: CalculationInput,
  combatOutput: CombatOutput,
  savedBuild?: SavedBuild | null,
): TheoryCraftState {
  // 1. Derive hero metrics
  const heroMetrics = safeDerive(
    () => deriveHeroMetrics(combatOutput, calcInput, buildSelection),
    FALLBACK_HERO_METRICS,
  );

  // 2. Derive formula explainer (cast to full type with isExpanded default)
  const formulaExplainerPartial = safeDerive(
    () => deriveFormulaExplainer(combatOutput, calcInput),
    FALLBACK_FORMULA_EXPLAINER,
  );
  const formulaExplainer: FormulaExplainerViewModel = {
    ...formulaExplainerPartial,
    isExpanded: false,
  };

  // 3. Derive stat weights (memoized by BuildSelection hash)
  const currentHash = safeDerive(() => hashBuildSelection(buildSelection), "");
  let statWeights: StatWeightViewModel;

  if (currentHash !== "" && currentHash === cachedStatWeightsHash) {
    // Cache hit — reuse previous result
    statWeights = cachedStatWeights;
  } else {
    // Cache miss — recompute
    statWeights = safeDerive(
      () => deriveStatWeights(calcInput, combatOutput),
      FALLBACK_STAT_WEIGHTS,
    );
    // Update cache
    cachedStatWeightsHash = currentHash;
    cachedStatWeights = statWeights;
  }

  // 4. Derive set bonus tracker
  const setBonusTracker = safeDerive(
    () => deriveSetBonusTracker(buildSelection, statWeights),
    FALLBACK_SET_BONUS_TRACKER,
  );

  // 5. Derive build comparison (null when no saved build provided)
  const buildComparison: BuildComparisonViewModel | null = savedBuild
    ? safeDerive(
        () => deriveBuildComparison(buildSelection, combatOutput, savedBuild),
        FALLBACK_BUILD_COMPARISON,
      )
    : null;

  return {
    heroMetrics,
    formulaExplainer,
    setBonusTracker,
    statWeights,
    buildComparison,
    lastComputedAt: Date.now(),
  };
}

/**
 * Resets the stat weight memoization cache.
 * Useful for testing or when a full recomputation is forced.
 */
export function resetStatWeightCache(): void {
  cachedStatWeightsHash = null;
  cachedStatWeights = FALLBACK_STAT_WEIGHTS;
}
