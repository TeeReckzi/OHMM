/**
 * Phase 4B Theorycraft UX — ViewModel Type Definitions
 *
 * All view model interfaces consumed by React components and derived by
 * pure TypeScript helper modules. Components receive these as props —
 * no direct engine access.
 */

import type { ConfidenceLevel as EngineConfidenceLevel } from "@/ohai/src/ui/itemTypes";

/**
 * Theorycraft presentation-layer confidence levels.
 * Maps from engine confidence to display-friendly labels.
 * "project_verified" corresponds to engine "verified".
 * "experimental" from the engine is mapped to "estimated" in this layer.
 */
export type ConfidenceLevel = "project_verified" | "observed" | "estimated" | "placeholder";

// Re-export engine confidence for mapping purposes
export type { EngineConfidenceLevel };

// ─── Hero Metrics ────────────────────────────────────────────────────────────

export interface MetricCardData {
  id: string;
  label: string;
  /** Formatted string, never NaN/undefined/Infinity — "—" for missing */
  value: string;
  /** Raw number for animations (0 for missing) */
  numericValue: number;
  /** Lucide icon name */
  icon: string;
  /** Plain-language explanation */
  tooltip: string;
  confidence: ConfidenceLevel;
}

export interface HeroMetricsViewModel {
  metrics: MetricCardData[];
  /** 0.0–1.0 ratio of filled slots */
  buildCompleteness: number;
  /** Aggregated across all input sources */
  confidenceScore: ConfidenceLevel;
  buildMode: "pve" | "pvp";
}

// ─── Formula Explainer ───────────────────────────────────────────────────────

export type MultiplierGroupType = "additive" | "multiplicative";

export interface ExplainerLineItem {
  id: string;
  label: string;
  /** e.g. "Calibration", "Mod: XXX", "Set Bonus: YYY" */
  source: string;
  value: number;
  /** "+12.5%" or "×1.125" */
  formattedValue: string;
  groupType: MultiplierGroupType;
  confidence: ConfidenceLevel;
  /** 0–100, share of total output */
  contributionPercent: number;
}

export interface TargetAssumption {
  label: string;
  value: string;
  source: string;
}

export interface FormulaExplainerViewModel {
  /** Formatted, or "—" */
  baseWeaponDamage: string;
  /** Formatted summary */
  totalExpectedDamage: string;
  activeContributorCount: number;
  additiveGroup: ExplainerLineItem[];
  multiplicativeGroup: ExplainerLineItem[];
  targetAssumptions: TargetAssumption[];
  pvpMitigationSection: { applied: boolean; reductionPercent: string } | null;
  /** e.g. "12 active contributors → 4,523 expected damage" */
  summaryLine: string;
  /** UI state (not derived — passed through) */
  isExpanded: boolean;
}

// ─── Set Bonus Tracker ───────────────────────────────────────────────────────

export interface SetThreshold {
  requiredPieces: number;
  bonusText: string;
  isActive: boolean;
  confidence: ConfidenceLevel;
}

export interface SetBonusEntry {
  setName: string;
  equippedCount: number;
  /** Always 6 (head, mask, chest, gloves, pants, boots) */
  totalSlots: number;
  /** e.g. ["head", "chest", "boots"] */
  occupiedSlots: string[];
  /** e.g. ["mask", "gloves", "pants"] */
  unoccupiedSlots: string[];
  thresholds: SetThreshold[];
  /** Next reachable threshold count, or null if maxed */
  nextThreshold: number | null;
  /** nextThreshold - equippedCount, or null */
  piecesNeeded: number | null;
}

export interface SetBonusTrackerViewModel {
  sets: SetBonusEntry[];
  isEmpty: boolean;
  emptyStateMessage: string;
}

// ─── Stat Weight Calculator ──────────────────────────────────────────────────

export type PerturbableStat =
  | "weaponDMGBonus"
  | "statusDMGBonus"
  | "elementalDMGBonus"
  | "critRate"
  | "critDMG"
  | "weakspotDMG"
  | "psiIntensity";

export interface StatWeightEntry {
  stat: PerturbableStat;
  /** Human-readable: "Crit Rate", "Weapon DMG%" */
  label: string;
  /** DPS delta from +1 perturbation */
  absoluteGain: number;
  /** (absoluteGain / baselineDPS) × 100 */
  relativeGainPercent: number;
  /** 0.0–1.0, scaled relative to max gain */
  barWidth: number;
  /** 1 = highest gain */
  rank: number;
}

export interface StatWeightViewModel {
  /** Sorted descending by absoluteGain */
  entries: StatWeightEntry[];
  baselineDPS: number;
  disclaimer: string;
  /** false if baseline is 0/undefined */
  isComputable: boolean;
  /** Message when !isComputable */
  errorMessage: string | null;
}

// ─── Build Comparison ────────────────────────────────────────────────────────

export type DeltaDirection = "gain" | "loss" | "unchanged";

export interface MetricDelta {
  label: string;
  currentValue: string;
  savedValue: string;
  /** "+1,234" or "-567" */
  delta: string;
  direction: DeltaDirection;
  /** Lucide icon names */
  icon: "arrow-up" | "arrow-down" | "minus";
}

export interface SlotDiff {
  /** "weapon", "head", "chest", etc. */
  slot: string;
  /** Item name or "Empty" */
  currentItem: string;
  /** Item name or "Empty" */
  savedItem: string;
  hasChanged: boolean;
}

export interface BuildComparisonViewModel {
  currentBuildName: string;
  savedBuildName: string;
  metricDeltas: MetricDelta[];
  slotDiffs: SlotDiff[];
  /** false if no saved builds or validation error */
  isAvailable: boolean;
  errorMessage: string | null;
  emptyStateMessage: string | null;
}

// ─── Orchestrator State ──────────────────────────────────────────────────────

export interface TheoryCraftState {
  heroMetrics: HeroMetricsViewModel;
  formulaExplainer: FormulaExplainerViewModel;
  setBonusTracker: SetBonusTrackerViewModel;
  statWeights: StatWeightViewModel;
  buildComparison: BuildComparisonViewModel | null;
  /** Date.now() timestamp */
  lastComputedAt: number;
}
