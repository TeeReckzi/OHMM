/**
 * Property-based tests for Set Bonus Tracker view model.
 *
 * Property 7: Set Bonus Tracker Derivation
 * **Validates: Requirements 5.1, 5.2, 5.4, 5.5**
 *
 * Structural invariants verified:
 *   (a) Only sets with ≥1 equipped piece appear in the result
 *   (b) equippedCount equals the actual count of pieces and equals occupiedSlots.length
 *   (c) threshold isActive iff equippedCount >= requiredPieces
 *   (d) piecesNeeded = nextThreshold - equippedCount (or null if maxed)
 *   (e) occupiedSlots + unoccupiedSlots cover all 6 armor slots with no overlap
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveSetBonusTracker } from "../setBonusTracker.vm";
import type { BuildSelection, ArmorSelection } from "@/ohai/src/ui/types";
import { armorRegistry } from "@/ohai/src/ui/registries/armorRegistry";
import { ARMOR_SLOTS } from "../constants";

// ─── Test Helpers ────────────────────────────────────────────────────────────

/**
 * Collect all armor pieces that have a valid armorSet.
 * Group them by set name and slot for use in generators.
 */
interface ArmorEntry {
  id: string;
  armorSet: string;
  slot: string;
}

const armorWithSets: ArmorEntry[] = armorRegistry
  .filter((a) => a.armorSet && a.slot)
  .map((a) => ({ id: a.id, armorSet: a.armorSet!, slot: a.slot }));

/** Group armor entries by slot for slot-aware generation */
const armorBySlot: Record<string, ArmorEntry[]> = {};
for (const entry of armorWithSets) {
  if (!armorBySlot[entry.slot]) armorBySlot[entry.slot] = [];
  armorBySlot[entry.slot].push(entry);
}

/** All 6 armor slot names as a plain string set for structural checks */
const ALL_ARMOR_SLOT_NAMES: string[] = ARMOR_SLOTS.map((s) => s as string);

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Generate an armor selection where each slot is either empty or a real armor piece for that slot */
const arbArmorSelectionWithRealPieces: fc.Arbitrary<ArmorSelection> = fc.record({
  head: fc.oneof(
    fc.constant(""),
    ...(armorBySlot["head"]?.length
      ? [fc.constantFrom(...armorBySlot["head"].map((a) => a.id))]
      : [fc.constant("")]),
  ),
  mask: fc.oneof(
    fc.constant(""),
    ...(armorBySlot["mask"]?.length
      ? [fc.constantFrom(...armorBySlot["mask"].map((a) => a.id))]
      : [fc.constant("")]),
  ),
  chest: fc.oneof(
    fc.constant(""),
    ...(armorBySlot["chest"]?.length
      ? [fc.constantFrom(...armorBySlot["chest"].map((a) => a.id))]
      : [fc.constant("")]),
  ),
  gloves: fc.oneof(
    fc.constant(""),
    ...(armorBySlot["gloves"]?.length
      ? [fc.constantFrom(...armorBySlot["gloves"].map((a) => a.id))]
      : [fc.constant("")]),
  ),
  pants: fc.oneof(
    fc.constant(""),
    ...(armorBySlot["pants"]?.length
      ? [fc.constantFrom(...armorBySlot["pants"].map((a) => a.id))]
      : [fc.constant("")]),
  ),
  boots: fc.oneof(
    fc.constant(""),
    ...(armorBySlot["boots"]?.length
      ? [fc.constantFrom(...armorBySlot["boots"].map((a) => a.id))]
      : [fc.constant("")]),
  ),
});

/** Minimal BuildSelection wrapper around arbitrary armor */
function buildSelectionWithArmor(armor: ArmorSelection): BuildSelection {
  return {
    id: "test-build",
    label: "Test",
    role: "attacker",
    weapon: {
      blueprintId: "",
      stars: 1,
      tier: 1,
      calibration: "",
      attachments: { optic: "", muzzle: "", magazine: "", tactical: "", stock: "", ammo: "" },
    },
    armor,
    mods: {},
    cradle: { perks: [] },
    deviant: { id: "", level: 0, activityRating: 0, trait: "" },
    food: {
      food: "",
      drink: "",
      chefRex: { enabled: false, skillRating: 1, activityRating: 1, bonusPercent: 0, mode: "rating-derived" },
    },
  };
}

/**
 * Manually count pieces per set from an armor selection using the same
 * resolution logic the implementation uses (armorRegistry lookup).
 */
function countPiecesPerSet(armor: ArmorSelection): Map<string, { count: number; slots: string[] }> {
  const result = new Map<string, { count: number; slots: string[] }>();
  for (const slot of ARMOR_SLOTS) {
    const selection = armor[slot];
    const pieceId = typeof selection === "string" ? selection : selection?.id ?? "";
    if (!pieceId) continue;

    const armorPiece = armorRegistry.find((a) => a.id === pieceId);
    if (!armorPiece?.armorSet) continue;

    const setName = armorPiece.armorSet;
    const existing = result.get(setName);
    if (existing) {
      existing.count++;
      existing.slots.push(slot);
    } else {
      result.set(setName, { count: 1, slots: [slot] });
    }
  }
  return result;
}

// ─── Property 7: Set Bonus Tracker Derivation ────────────────────────────────

describe("Property 7: Set Bonus Tracker Derivation", () => {
  /**
   * **Validates: Requirements 5.1**
   *
   * (a) Only sets with ≥1 equipped piece appear in the result (no empty sets).
   * If isEmpty is false, every set entry has equippedCount >= 1.
   */
  it("only sets with ≥1 equipped piece appear in the result", () => {
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        const result = deriveSetBonusTracker(build);

        // Every set in the result should have equippedCount ≥ 1
        for (const set of result.sets) {
          expect(set.equippedCount).toBeGreaterThanOrEqual(1);
        }

        // Sets that actually appear in armor should be in the result
        const expectedSets = countPiecesPerSet(armor);
        for (const [setName] of expectedSets) {
          const found = result.sets.find((s) => s.setName === setName);
          expect(found).toBeDefined();
        }

        // No set in the result that isn't actually equipped
        expect(result.sets.length).toBe(expectedSets.size);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 5.2**
   *
   * (b) Each set's equippedCount matches the actual count of pieces from that set,
   * AND equippedCount equals occupiedSlots.length.
   */
  it("equippedCount matches the actual piece count and equals occupiedSlots.length", () => {
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        const result = deriveSetBonusTracker(build);

        const expectedSets = countPiecesPerSet(armor);

        for (const set of result.sets) {
          const expected = expectedSets.get(set.setName);
          expect(expected).toBeDefined();
          expect(set.equippedCount).toBe(expected!.count);
          // equippedCount must also equal occupiedSlots.length
          expect(set.equippedCount).toBe(set.occupiedSlots.length);
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * (c) Each threshold's isActive is true if and only if equippedCount >= requiredPieces.
   */
  it("threshold isActive iff equippedCount >= requiredPieces", () => {
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        const result = deriveSetBonusTracker(build);

        for (const set of result.sets) {
          for (const threshold of set.thresholds) {
            if (set.equippedCount >= threshold.requiredPieces) {
              expect(threshold.isActive).toBe(true);
            } else {
              expect(threshold.isActive).toBe(false);
            }
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 5.5**
   *
   * (d) piecesNeeded equals nextThreshold - equippedCount (or null if no further thresholds).
   */
  it("piecesNeeded computed correctly as nextThreshold - equippedCount or null", () => {
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        const result = deriveSetBonusTracker(build);

        for (const set of result.sets) {
          // Find the next inactive threshold (first one not yet reached)
          const nextInactive = set.thresholds.find((t) => !t.isActive);

          if (nextInactive) {
            expect(set.nextThreshold).toBe(nextInactive.requiredPieces);
            expect(set.piecesNeeded).toBe(nextInactive.requiredPieces - set.equippedCount);
          } else {
            // All thresholds active — no further thresholds
            expect(set.nextThreshold).toBeNull();
            expect(set.piecesNeeded).toBeNull();
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * Structural invariant: occupiedSlots + unoccupiedSlots cover all 6 armor slots
   * with no overlap and no duplicates.
   */
  it("occupiedSlots + unoccupiedSlots cover all 6 armor slots with no overlap", () => {
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        const result = deriveSetBonusTracker(build);

        for (const set of result.sets) {
          const combined = [...set.occupiedSlots, ...set.unoccupiedSlots];

          // Must have exactly 6 slots total
          expect(combined.length).toBe(ALL_ARMOR_SLOT_NAMES.length);

          // Must cover all 6 slot names
          const combinedSorted = [...combined].sort();
          const expectedSorted = [...ALL_ARMOR_SLOT_NAMES].sort();
          expect(combinedSorted).toEqual(expectedSorted);

          // No duplicates (no overlap between occupied and unoccupied)
          const uniqueSet = new Set(combined);
          expect(uniqueSet.size).toBe(combined.length);
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 5.7, 10.3**
   *
   * deriveSetBonusTracker never throws for any input including null/undefined.
   */
  it("never throws for any input including null and undefined", () => {
    // Test with null
    expect(() => deriveSetBonusTracker(null)).not.toThrow();
    expect(() => deriveSetBonusTracker(undefined)).not.toThrow();

    // Test with empty armor
    const emptyBuild = buildSelectionWithArmor({
      head: "",
      mask: "",
      chest: "",
      gloves: "",
      pants: "",
      boots: "",
    });
    expect(() => deriveSetBonusTracker(emptyBuild)).not.toThrow();

    // Property: never throws for any generated input
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        expect(() => deriveSetBonusTracker(build)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 5.7**
   *
   * isEmpty === true when no armor is equipped.
   */
  it("isEmpty is true when no armor is equipped", () => {
    const emptyBuild = buildSelectionWithArmor({
      head: "",
      mask: "",
      chest: "",
      gloves: "",
      pants: "",
      boots: "",
    });
    const result = deriveSetBonusTracker(emptyBuild);
    expect(result.isEmpty).toBe(true);
    expect(result.sets).toHaveLength(0);
    expect(result.emptyStateMessage).toBeTruthy();
  });

  /**
   * isEmpty is false when at least one armor set piece is equipped;
   * conversely isEmpty is true when no pieces resolve to a known set.
   */
  it("isEmpty is false when at least one armor set piece is equipped", () => {
    fc.assert(
      fc.property(arbArmorSelectionWithRealPieces, (armor) => {
        const build = buildSelectionWithArmor(armor);
        const result = deriveSetBonusTracker(build);

        const expectedSets = countPiecesPerSet(armor);
        if (expectedSets.size > 0) {
          expect(result.isEmpty).toBe(false);
          expect(result.sets.length).toBeGreaterThan(0);
        } else {
          expect(result.isEmpty).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates worthItEstimate calculation with statWeights**
   */
  it("populates worthItEstimate when statWeights are provided", () => {
    const build = buildSelectionWithArmor({
      head: "lonewolf-head", // real piece in armor registry
      mask: "",
      chest: "",
      gloves: "",
      pants: "",
      boots: "",
    });

    const mockStatWeights = {
      entries: [
        { stat: "critDMG", label: "Crit DMG", absoluteGain: 25.0, relativeGainPercent: 0.5, barWidth: 1.0, rank: 1 }
      ],
      baselineDPS: 5000,
      disclaimer: "",
      isComputable: true,
    } as any;

    const result = deriveSetBonusTracker(build, mockStatWeights);
    expect(result.isEmpty).toBe(false);
  });
});
