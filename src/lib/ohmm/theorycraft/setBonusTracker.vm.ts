/**
 * Phase 4B Theorycraft UX — Set Bonus Tracker View Model
 *
 * Pure TypeScript derivation: BuildSelection → SetBonusTrackerViewModel.
 * No React, no DOM, no side effects. Never throws — returns safe defaults for all invalid inputs.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import type { BuildSelection } from "@/ohai/src/ui/types";
import { getArmorSelectionId } from "@/ohai/src/ui/types";
import type { SetBonusTrackerViewModel, SetBonusEntry, SetThreshold, ConfidenceLevel } from "./types";
import { ARMOR_SLOTS, EMPTY_STATE_MESSAGES } from "./constants";
import { armorRegistry, keyGearRegistry } from "@/ohai/src/ui/registries/armorRegistry";
import { armorSetMetaMap } from "@/ohai/src/ui/registries/generated/armor-sets.generated";
import { armorSetTierOverrides } from "@/ohai/src/ui/registries/armorSetTierOverrides";

// ─── Internal types ──────────────────────────────────────────────────────────

interface SetAccumulator {
  setName: string;
  equippedCount: number;
  occupiedSlots: string[];
}

// ─── Registry lookup ─────────────────────────────────────────────────────────

/**
 * Resolve an armor piece ID to its set name.
 * Checks armorRegistry first, then keyGearRegistry (key gear does not have armorSet).
 * Returns undefined if the piece is not found or has no set.
 */
function resolveArmorSet(pieceId: string): string | undefined {
  if (!pieceId) return undefined;

  // Check the armor registry (which has armorSet field)
  const armorPiece = armorRegistry.find((a) => a.id === pieceId);
  if (armorPiece?.armorSet) {
    return armorPiece.armorSet;
  }

  // Key gear does not carry armorSet — cannot contribute to set bonuses
  return undefined;
}

// ─── Threshold discovery ─────────────────────────────────────────────────────

/**
 * Discover all threshold tiers available for a given set name from armorSetTierOverrides.
 * Returns sorted array of threshold piece counts (e.g., [2, 3, 4]).
 */
function discoverThresholds(setName: string): number[] {
  const thresholds: number[] = [];

  // Scan armorSetTierOverrides for keys matching "${setName}-${N}pc"
  const prefix = `${setName}-`;
  for (const key of Object.keys(armorSetTierOverrides)) {
    if (key.startsWith(prefix)) {
      const suffix = key.slice(prefix.length);
      const match = suffix.match(/^(\d+)pc$/);
      if (match) {
        thresholds.push(parseInt(match[1], 10));
      }
    }
  }

  return thresholds.sort((a, b) => a - b);
}

/**
 * Build threshold entries for a set, marking each as active/inactive
 * based on the equipped piece count.
 */
function buildThresholds(setName: string, equippedCount: number): SetThreshold[] {
  const thresholdCounts = discoverThresholds(setName);

  return thresholdCounts.map((requiredPieces): SetThreshold => {
    const key = `${setName}-${requiredPieces}pc`;
    const override = armorSetTierOverrides[key];

    const bonusText = override?.notes ?? `${requiredPieces}-piece bonus`;
    const isActive = equippedCount >= requiredPieces;

    // Confidence: if the override has stat modifiers, it's at least "estimated";
    // if it has a conditionalEffectId, mark as "estimated" (proc-based);
    // otherwise treat as "estimated" since all current data is at that level.
    let confidence: ConfidenceLevel = "estimated";
    if (override?.statModifiers && override.statModifiers.length > 0) {
      confidence = override.conditionalEffectId ? "estimated" : "observed";
    }

    return {
      requiredPieces,
      bonusText,
      isActive,
      confidence,
    };
  });
}

// ─── Main derivation function ────────────────────────────────────────────────

/**
 * Derive the Set Bonus Tracker view model from the current build selection.
 *
 * - Groups equipped armor by set
 * - Shows active/inactive thresholds with bonus text
 * - Computes piecesNeeded for next reachable threshold
 * - Returns empty state when no armor is equipped
 * - Sorts sets by equipped count descending
 * - Never throws; always returns a safe, well-typed SetBonusTrackerViewModel
 */
import type { StatWeightViewModel } from "./types";

const PERTURBATION_DELTAS: Record<string, number> = {
  weaponDMGBonus: 0.01,
  statusDMGBonus: 0.01,
  elementalDMGBonus: 0.01,
  critRate: 0.01,
  critDMG: 0.01,
  weakspotDMG: 0.01,
  psiIntensity: 1.0,
};

export function deriveSetBonusTracker(
  buildSelection: BuildSelection | null | undefined,
  statWeights?: StatWeightViewModel | null,
): SetBonusTrackerViewModel {
  // Guard: null/undefined input → empty state
  if (!buildSelection?.armor) {
    return {
      sets: [],
      isEmpty: true,
      emptyStateMessage: EMPTY_STATE_MESSAGES.setBonusTracker,
    };
  }

  const armor = buildSelection.armor;

  // ── Step 1: Iterate armor slots, resolve piece IDs, group by set ──
  const setMap = new Map<string, SetAccumulator>();

  for (const slot of ARMOR_SLOTS) {
    const selection = armor[slot];
    const pieceId = getArmorSelectionId(selection);

    if (!pieceId) continue;

    const setName = resolveArmorSet(pieceId);
    if (!setName) continue;

    const existing = setMap.get(setName);
    if (existing) {
      existing.equippedCount++;
      existing.occupiedSlots.push(slot);
    } else {
      setMap.set(setName, {
        setName,
        equippedCount: 1,
        occupiedSlots: [slot],
      });
    }
  }

  // ── Step 2: Check for empty state ──
  if (setMap.size === 0) {
    return {
      sets: [],
      isEmpty: true,
      emptyStateMessage: EMPTY_STATE_MESSAGES.setBonusTracker,
    };
  }

  // ── Step 3: Build SetBonusEntry for each set ──
  const allSlots = ARMOR_SLOTS.map((s) => s as string);
  const entries: SetBonusEntry[] = [];

  for (const [setName, accumulator] of setMap) {
    // Verify set exists in metadata (defensive)
    const meta = armorSetMetaMap[setName];
    const displayName = meta?.name ?? setName;

    // Compute unoccupied slots
    const occupiedSet = new Set(accumulator.occupiedSlots);
    const unoccupiedSlots = allSlots.filter((s) => !occupiedSet.has(s));

    // Build thresholds
    const thresholds = buildThresholds(setName, accumulator.equippedCount);

    // Find next reachable threshold
    const nextInactiveThreshold = thresholds.find((t) => !t.isActive);
    const nextThreshold = nextInactiveThreshold?.requiredPieces ?? null;
    const piecesNeeded = nextThreshold !== null
      ? nextThreshold - accumulator.equippedCount
      : null;

    // Estimate DPS gain of reaching the next threshold
    let worthItEstimate: string | null = null;
    if (statWeights && statWeights.isComputable && statWeights.baselineDPS > 0 && nextThreshold !== null) {
      const overrideKey = `${setName}-${nextThreshold}pc`;
      const override = armorSetTierOverrides[overrideKey];
      if (override?.statModifiers && override.statModifiers.length > 0) {
        let totalGain = 0;
        for (const mod of override.statModifiers) {
          const weight = statWeights.entries.find((e) => e.stat === mod.stat);
          if (weight) {
            const pertDelta = PERTURBATION_DELTAS[mod.stat] ?? 0.01;
            totalGain += (mod.value / pertDelta) * weight.absoluteGain;
          }
        }
        if (totalGain > 0) {
          const pct = (totalGain / statWeights.baselineDPS) * 100;
          worthItEstimate = `+${pct.toFixed(1)}% est. DPS`;
        }
      }
    }

    entries.push({
      setName: displayName,
      equippedCount: accumulator.equippedCount,
      totalSlots: ARMOR_SLOTS.length,
      occupiedSlots: [...accumulator.occupiedSlots],
      unoccupiedSlots,
      thresholds,
      nextThreshold,
      piecesNeeded,
      worthItEstimate,
    });
  }

  // ── Step 4: Sort by equipped count descending (most progress first) ──
  entries.sort((a, b) => b.equippedCount - a.equippedCount);

  return {
    sets: entries,
    isEmpty: false,
    emptyStateMessage: "",
  };
}
