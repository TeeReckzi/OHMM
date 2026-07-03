import type { BuildSelection, ArmorSelection } from '@/ohai/src/ui/types';
import type { ConfidenceLevel } from './types';

/** Confidence hierarchy — lower index = higher trust */
const CONFIDENCE_ORDER: ConfidenceLevel[] = [
  "project_verified",
  "observed",
  "estimated",
  "placeholder",
];

/**
 * Returns true if value is a displayable number
 * (not NaN, not Infinity, not null, not undefined).
 */
export function isDisplayable(value: unknown): value is number {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  return true;
}

/**
 * Format a number for display, returning "—" for invalid values.
 * Uses thousands separator and specified decimal places (default 0).
 */
export function safeFormat(value: number | undefined | null, decimals: number = 0): string {
  if (!isDisplayable(value)) return "—";
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Clamp a number to a [min, max] range.
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Compute a stable hash of a BuildSelection for memoization.
 * Uses JSON.stringify of key fields for a deterministic string.
 */
export function hashBuildSelection(build: BuildSelection): string {
  const key = {
    weapon: build.weapon,
    armor: build.armor,
    mods: build.mods,
    modSelections: build.modSelections,
    cradle: build.cradle,
    deviant: build.deviant,
    food: build.food,
  };
  return JSON.stringify(key);
}

/**
 * Aggregate confidence levels: returns worst-case (lowest trust) across all sources.
 * Returns "placeholder" for empty arrays (no sources = lowest confidence).
 */
export function aggregateConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return "placeholder";

  let worstIndex = 0;
  for (const level of levels) {
    const idx = CONFIDENCE_ORDER.indexOf(level);
    if (idx > worstIndex) {
      worstIndex = idx;
    }
  }
  return CONFIDENCE_ORDER[worstIndex];
}

/**
 * Format a delta value with +/- prefix and thousands separator.
 * Positive values get "+" prefix, negative get "−" (unicode minus U+2212).
 * Zero stays "0".
 */
export function formatDelta(value: number, decimals: number = 0): string {
  if (!isDisplayable(value)) return "—";
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `\u2212${formatted}`;
  return `0`;
}

/**
 * Compute build completeness ratio: filled loadout slots / total slots.
 * Slots: weapon (1), armor (6: head, mask, chest, gloves, pants, boots),
 * mods (1), food (1), deviant (1), cradle (1) = 11 total.
 * Returns a value clamped to [0.0, 1.0].
 */
export function computeCompleteness(build: BuildSelection): number {
  const TOTAL_SLOTS = 11;
  let filled = 0;

  // Weapon: filled if blueprintId is non-empty
  if (build.weapon && build.weapon.blueprintId) {
    filled++;
  }

  // Armor: 6 slots — filled if piece has a non-empty id
  const armorSlots: (keyof ArmorSelection)[] = ['head', 'mask', 'chest', 'gloves', 'pants', 'boots'];
  for (const slot of armorSlots) {
    const piece = build.armor?.[slot];
    if (piece) {
      const id = typeof piece === 'string' ? piece : piece.id;
      if (id) filled++;
    }
  }

  // Mods: filled if mods have at least one non-empty entry
  if (build.mods && Object.values(build.mods).some((m) => !!m)) {
    filled++;
  }

  // Food: filled if food or drink is selected
  if (build.food && (build.food.food || build.food.drink)) {
    filled++;
  }

  // Deviant: filled if id is non-empty
  if (build.deviant && build.deviant.id) {
    filled++;
  }

  // Cradle: filled if perks array has at least one entry
  if (build.cradle && build.cradle.perks && build.cradle.perks.length > 0) {
    filled++;
  }

  return clamp(filled / TOTAL_SLOTS, 0.0, 1.0);
}
