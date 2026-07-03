/**
 * Phase 4B Theorycraft UX — Constants
 *
 * Perturbation deltas, confidence display mapping, stat category labels,
 * and slot enumerations used across all theorycraft view models.
 */

import type { ConfidenceLevel, PerturbableStat } from "./types";

// ─── Perturbation Deltas ─────────────────────────────────────────────────────

/**
 * Fixed perturbation amounts for stat weight simulation.
 * Percentage-based stats use +0.01 (1 percentage point).
 * Flat stats use +1.0 (1 unit).
 */
export const PERTURBATION_DELTAS: Record<PerturbableStat, number> = {
  weaponDMGBonus: 0.01,
  statusDMGBonus: 0.01,
  elementalDMGBonus: 0.01,
  critRate: 0.01,
  critDMG: 0.01,
  weakspotDMG: 0.01,
  psiIntensity: 1.0,
};

// ─── Confidence Display ──────────────────────────────────────────────────────

/**
 * Display metadata for each confidence level.
 * Icons reference Lucide icon names.
 */
export const CONFIDENCE_DISPLAY: Record<ConfidenceLevel, { label: string; icon: string }> = {
  project_verified: { label: "Verified", icon: "check-circle" },
  observed: { label: "Observed", icon: "eye" },
  estimated: { label: "Estimated", icon: "alert-triangle" },
  placeholder: { label: "Placeholder", icon: "help-circle" },
};

// ─── Stat Category Labels ────────────────────────────────────────────────────

/**
 * Human-readable labels for each perturbable stat category.
 * Used in the Stat Weight Calculator display.
 */
export const STAT_CATEGORY_LABELS: Record<PerturbableStat, string> = {
  weaponDMGBonus: "Weapon DMG%",
  statusDMGBonus: "Status DMG%",
  elementalDMGBonus: "Elemental DMG%",
  critRate: "Crit Rate",
  critDMG: "Crit Damage",
  weakspotDMG: "Weakspot DMG",
  psiIntensity: "Psi Intensity",
};

// ─── Slot Enumerations ───────────────────────────────────────────────────────

/**
 * All armor slot identifiers in equip order.
 */
export const ARMOR_SLOTS = [
  "head",
  "mask",
  "chest",
  "gloves",
  "pants",
  "boots",
] as const;

export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

/**
 * All loadout slots considered for build completeness and comparison.
 * Includes weapon (1) + armor (6) + mods (1) + food (1) + deviant (1) + cradle (1) = 11.
 */
export const ALL_LOADOUT_SLOTS = [
  "weapon",
  "head",
  "mask",
  "chest",
  "gloves",
  "pants",
  "boots",
  "mods",
  "food",
  "deviant",
  "cradle",
] as const;

export type LoadoutSlot = (typeof ALL_LOADOUT_SLOTS)[number];

/**
 * Total number of loadout slots used for build completeness calculation.
 */
export const TOTAL_LOADOUT_SLOTS = ALL_LOADOUT_SLOTS.length; // 11

/**
 * Stat weight disclaimer text shown alongside simulation results.
 */
export const STAT_WEIGHT_DISCLAIMER = "Estimate — based on simulation";

/**
 * Error message when stat weights cannot be computed (zero baseline).
 */
export const STAT_WEIGHT_NO_BASELINE_MESSAGE =
  "Equip a weapon to compute stat weights — a valid baseline DPS is required.";

/**
 * Empty state messages for each panel.
 */
export const EMPTY_STATE_MESSAGES = {
  setBonusTracker: "No armor equipped — equip armor pieces to track set bonuses.",
  buildComparison: "Save a build first to compare against your current loadout.",
  heroMetrics: "Equip a weapon to see DPS metrics.",
  statWeights: "Equip a weapon to compute stat weights.",
} as const;
