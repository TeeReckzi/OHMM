/**
 * Property-based tests for Stat Weight Calculator view model.
 *
 * Property 8: Perturbation Non-Mutation
 * Property 9: Perturbation Stat Coverage
 * Property 10: Perturbation Result Ordering
 * Property 11: Stat Weight Bar Scaling
 *
 * **Validates: Requirements 6.2, 6.3, 6.4, 7.2, 7.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deriveStatWeights } from '../statWeightCalculator.vm';
import type { CalculationInput } from '@/ohai/src/ui/formulaBridge';
import type { CombatOutput } from '@/ohai/src/ui/combatOutput';
import { computeCombatOutput } from '@/ohai/src/ui/combatOutput';
import { aggregateModifiers } from '@/ohai/src/engine/modifierAggregation';
import type { ModifierSource } from '@/ohai/src/engine/modifierTypes';
import type { PerturbableStat } from '../types';

// ─── Expected Stats ──────────────────────────────────────────────────────────

const ALL_PERTURBABLE_STATS: PerturbableStat[] = [
  "weaponDMGBonus",
  "statusDMGBonus",
  "elementalDMGBonus",
  "critRate",
  "critDMG",
  "weakspotDMG",
  "psiIntensity",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds a minimal but valid CalculationInput that produces non-zero DPS.
 * Key requirements for DPS > 0:
 * - baseWeaponDMG > 0 (provides formula damage)
 * - baseFireRate > 0 (provides shots per second for DPS)
 * - modifierSources can be empty or have some entries
 * - aggregationReport must be computed from modifierSources
 */
function buildValidCalcInput(opts: {
  baseWeaponDMG: number;
  baseFireRate: number;
  modifierSources?: ModifierSource[];
}): CalculationInput {
  const modifierSources = opts.modifierSources ?? [];
  const aggregationReport = aggregateModifiers(modifierSources);

  return {
    modifierSources,
    aggregationReport,
    pvpMitigation: { pvpMode: false, applied: false, totalReductionPercent: 0, reductionPercent: "0%", sources: [], warnings: [] } as any,
    conditionalEffects: [],
    uptimeProfile: "always-on" as any,
    modeledEffects: [],
    partiallyModeledEffects: [],
    displayOnlyEffects: [],
    unresolvedEffects: [],
    ignoredEffects: [],
    formulaWarnings: [],
    partialSupportNotes: [],
    availableMechanics: [],
    buildMode: "pve",
    enemyType: "pve-generic",
    totalItemsConsidered: 0,
    totalModifiersExtracted: modifierSources.length,
    baseWeaponDMG: opts.baseWeaponDMG,
    baseCritRate: 0.05,
    baseCritDamage: 0.50,
    baseWeakspotDamage: 0.60,
    baseFireRate: opts.baseFireRate,
  };
}

/**
 * Computes a CombatOutput from a CalculationInput, providing a real baseline.
 */
function computeBaseline(calcInput: CalculationInput): CombatOutput {
  return computeCombatOutput(calcInput, calcInput.pvpMitigation);
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for weapon damage that guarantees positive, reasonable values */
const arbPositiveWeaponDMG = fc.integer({ min: 50, max: 2000 });

/** Arbitrary for fire rate that guarantees positive values (rounds per minute) */
const arbPositiveFireRate = fc.integer({ min: 60, max: 900 });

/** Arbitrary for a valid modifier source */
const arbModifierSource: fc.Arbitrary<ModifierSource> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 15 }).map(s => `mod_${s}`),
  sourceType: fc.constantFrom(
    "weapon", "armor", "mod", "calibration", "food", "setBonus",
  ) as fc.Arbitrary<any>,
  sourceLabel: fc.string({ minLength: 1, maxLength: 20 }),
  stat: fc.constantFrom(
    "weaponDMGBonus", "statusDMGBonus", "elementalDMGBonus",
    "critRate", "critDMG", "weakspotDMG", "psiIntensity",
  ) as fc.Arbitrary<any>,
  value: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
  behavior: fc.constant("additive") as fc.Arbitrary<any>,
  confidence: fc.constantFrom("confirmed", "observed_in_game_needs_testing") as fc.Arbitrary<any>,
});

/** Arbitrary for a valid CalculationInput that produces non-zero DPS */
const arbValidCalcInput: fc.Arbitrary<CalculationInput> = fc.tuple(
  arbPositiveWeaponDMG,
  arbPositiveFireRate,
  fc.array(arbModifierSource, { minLength: 0, maxLength: 5 }),
).map(([dmg, fireRate, mods]) => buildValidCalcInput({
  baseWeaponDMG: dmg,
  baseFireRate: fireRate,
  modifierSources: mods,
}));

// ─── Property 8: Perturbation Non-Mutation ───────────────────────────────────

describe('Property 8: Perturbation Non-Mutation', () => {
  /**
   * **Validates: Requirements 6.4**
   *
   * For any CalculationInput, after running deriveStatWeights, the original
   * CalculationInput SHALL be deeply equal to its state before the function
   * was called — no fields mutated, no references changed.
   */
  it('deriveStatWeights does not mutate the original CalculationInput', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          // Deep clone for comparison before calling deriveStatWeights
          const snapshot = JSON.parse(JSON.stringify(calcInput));

          const combatOutput = computeBaseline(calcInput);
          deriveStatWeights(calcInput, combatOutput);

          // After the call, the original must be identical to the snapshot
          expect(JSON.parse(JSON.stringify(calcInput))).toEqual(snapshot);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('modifierSources array length is preserved after deriveStatWeights', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const originalLength = calcInput.modifierSources.length;
          const combatOutput = computeBaseline(calcInput);

          deriveStatWeights(calcInput, combatOutput);

          expect(calcInput.modifierSources.length).toBe(originalLength);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ─── Property 9: Perturbation Stat Coverage ──────────────────────────────────

describe('Property 9: Perturbation Stat Coverage', () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any valid CalculationInput with non-zero baseline DPS,
   * deriveStatWeights SHALL return entries for exactly 7 stats:
   * weaponDMGBonus, statusDMGBonus, elementalDMGBonus, critRate,
   * critDMG, weakspotDMG, and psiIntensity.
   */
  it('returns exactly 7 entries for valid inputs with non-zero DPS', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);

          // Pre-condition: baseline DPS must be positive
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);

          expect(result.isComputable).toBe(true);
          expect(result.entries).toHaveLength(7);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('covers all 7 perturbable stats exactly once', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);
          const stats = result.entries.map(e => e.stat).sort();
          const expected = [...ALL_PERTURBABLE_STATS].sort();

          expect(stats).toEqual(expected);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('returns isComputable: false when baseline DPS is 0', () => {
    // CalculationInput with no weapon damage → DPS = 0
    const zeroDPSInput = buildValidCalcInput({
      baseWeaponDMG: 0,
      baseFireRate: 600,
    });
    const combatOutput = computeBaseline(zeroDPSInput);

    const result = deriveStatWeights(zeroDPSInput, combatOutput);

    expect(result.isComputable).toBe(false);
    expect(result.entries).toHaveLength(0);
    expect(result.errorMessage).toBeTruthy();
  });
});

// ─── Property 10: Perturbation Result Ordering ───────────────────────────────

describe('Property 10: Perturbation Result Ordering', () => {
  /**
   * **Validates: Requirements 6.3, 7.5**
   *
   * For any stat weight result produced by deriveStatWeights, the entries
   * array SHALL be sorted in non-increasing order of absoluteGain — that is,
   * for all adjacent pairs entries[i] and entries[i+1],
   * entries[i].absoluteGain >= entries[i+1].absoluteGain.
   */
  it('entries are sorted in non-increasing order of absoluteGain', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);

          for (let i = 0; i < result.entries.length - 1; i++) {
            expect(result.entries[i].absoluteGain).toBeGreaterThanOrEqual(
              result.entries[i + 1].absoluteGain,
            );
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('rank assignment matches sort position (rank 1 = highest gain)', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);

          for (let i = 0; i < result.entries.length; i++) {
            expect(result.entries[i].rank).toBe(i + 1);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ─── Property 11: Stat Weight Bar Scaling ────────────────────────────────────

describe('Property 11: Stat Weight Bar Scaling', () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * For any stat weight result with at least one positive-gain entry,
   * the highest-ranked entry SHALL have barWidth === 1.0, and all other
   * entries SHALL have barWidth in [0.0, 1.0].
   */
  it('top entry has barWidth === 1.0 when max gain is positive', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);
          fc.pre(result.entries.length > 0);

          const maxGain = result.entries[0].absoluteGain;
          fc.pre(maxGain > 0);

          expect(result.entries[0].barWidth).toBe(1.0);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('all entries have barWidth in [0.0, 1.0]', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);
          fc.pre(result.entries.length > 0 && result.entries[0].absoluteGain > 0);

          for (const entry of result.entries) {
            expect(entry.barWidth).toBeGreaterThanOrEqual(0.0);
            expect(entry.barWidth).toBeLessThanOrEqual(1.0);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('barWidth is proportional to absoluteGain / maxAbsoluteGain', () => {
    fc.assert(
      fc.property(
        arbValidCalcInput,
        (calcInput) => {
          const combatOutput = computeBaseline(calcInput);
          const baselineDPS = combatOutput.damageOutput.DPS ?? 0;
          fc.pre(baselineDPS > 0);

          const result = deriveStatWeights(calcInput, combatOutput);
          fc.pre(result.entries.length > 0 && result.entries[0].absoluteGain > 0);

          const maxGain = result.entries[0].absoluteGain;

          for (const entry of result.entries) {
            const expectedBarWidth = entry.absoluteGain / maxGain;
            expect(entry.barWidth).toBeCloseTo(expectedBarWidth, 10);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
