/**
 * Property-based tests for Hero Metrics view model.
 *
 * Property 1: Hero Metrics Safe Display
 * Property 2: Hero Metrics Correct Mapping
 *
 * **Validates: Requirements 1.1, 1.2, 1.6, 1.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deriveHeroMetrics } from '../heroMetrics.vm';
import type { CombatOutput } from '@/ohai/src/ui/combatOutput';
import type { CalculationInput } from '@/ohai/src/ui/formulaBridge';
import type { BuildSelection } from '@/ohai/src/ui/types';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Arbitrary for numeric values that specifically include dangerous edge cases:
 * NaN, Infinity, -Infinity, undefined, null, and normal numbers.
 */
const arbDangerousNumeric = fc.oneof(
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
  fc.constant(undefined as unknown as number),
  fc.constant(null as unknown as number),
  fc.double({ min: -1e12, max: 1e12, noNaN: true }),
  fc.integer({ min: -100000, max: 100000 }),
  fc.constant(0),
);

/** Arbitrary for optional numeric (number | undefined) */
const arbOptionalNumeric = fc.oneof(
  fc.constant(undefined),
  fc.double({ min: -1e6, max: 1e6, noNaN: false }),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
  fc.integer({ min: 0, max: 100000 }),
);

/** Arbitrary for DamageOutputMetrics */
const arbDamageOutput = fc.record({
  baseDamage: arbDangerousNumeric,
  expectedDamage: arbDangerousNumeric,
  critMultiplier: arbDangerousNumeric,
  weakspotMultiplier: arbDangerousNumeric,
  totalMultiplier: arbDangerousNumeric,
  DPS: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  tickIntervalSeconds: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  ticksPerSecond: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
});

/** Arbitrary for SurvivabilityMetrics */
const arbSurvivability = fc.record({
  damageTakenMultiplier: arbDangerousNumeric,
  effectiveHealthMultiplier: arbDangerousNumeric,
  effectiveHealth: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  incomingDamageAfterMitigation: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  shotsToDie: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  survivabilityGainPercent: arbDangerousNumeric,
});

/** Arbitrary for PvPDuelContext */
const arbPvpDuel = fc.record({
  outgoingTTK: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  incomingTTK: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  duelPressure: fc.constantFrom(
    "You kill faster",
    "You die faster",
    "Survivability favored",
    "Damage favored",
    "Unknown",
  ) as fc.Arbitrary<any>,
});

/** Arbitrary for buildMode */
const arbBuildMode = fc.constantFrom("pve", "pvp") as fc.Arbitrary<"pve" | "pvp">;

/** Arbitrary for CombatOutput with a specific buildMode */
function arbCombatOutputWithMode(mode: "pve" | "pvp"): fc.Arbitrary<CombatOutput> {
  return fc.record({
    damageOutput: arbDamageOutput,
    survivability: arbSurvivability,
    pvpDuel: arbPvpDuel,
    warnings: fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
    assumptions: fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
    buildMode: fc.constant(mode),
    incomingDPSProvided: fc.boolean(),
    targetHealthProvided: fc.boolean(),
    officialFormula: fc.record({
      status: fc.constantFrom("not-attempted", "partial", "terminal-only", "validated") as fc.Arbitrary<any>,
      warnings: fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 0, maxLength: 2 }),
      officialDamageAvailable: fc.boolean(),
      officialDamage: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
      unresolvedLeaves: fc.array(fc.string({ minLength: 0, maxLength: 10 }), { minLength: 0, maxLength: 2 }),
      accuracyNote: fc.string({ minLength: 0, maxLength: 30 }),
    }),
  }) as fc.Arbitrary<CombatOutput>;
}

/** Arbitrary for CombatOutput with any buildMode */
const arbCombatOutput: fc.Arbitrary<CombatOutput> = arbBuildMode.chain(mode =>
  arbCombatOutputWithMode(mode)
);

/** Arbitrary for ModifierSource (simplified for property testing) */
const arbModifierSource = fc.record({
  id: fc.string({ minLength: 1, maxLength: 15 }),
  sourceType: fc.constantFrom(
    "weapon", "armor", "mod", "modSuffix", "calibration",
    "food", "setBonus", "keywordEffect", "temporaryBuff", "enemyTypeBonus", "gloves",
  ) as fc.Arbitrary<any>,
  sourceLabel: fc.string({ minLength: 1, maxLength: 20 }),
  stat: fc.constantFrom(
    "weaponDMGBonus", "statusDMGBonus", "elementalDMGBonus",
    "critRate", "critDMG", "weakspotDMG", "psiIntensity",
    "burnDMGBonus", "frostVortexDMGBonus",
  ) as fc.Arbitrary<any>,
  value: fc.double({ min: -2, max: 2, noNaN: true }),
  behavior: fc.constantFrom("additive", "multiplicative", "conditional") as fc.Arbitrary<any>,
  confidence: fc.constantFrom("verified", "observed", "estimated", "placeholder") as fc.Arbitrary<any>,
});

/** Arbitrary for BridgedEffect (simplified) */
const arbBridgedEffect = fc.record({
  itemId: fc.string({ minLength: 1, maxLength: 15 }),
  itemName: fc.string({ minLength: 1, maxLength: 20 }),
  category: fc.constantFrom("weapon", "armor", "mod", "food", "deviant") as fc.Arbitrary<any>,
  formulaSupport: fc.record({
    status: fc.constantFrom("fully-modeled", "partially-modeled", "display-only", "unmodeled") as fc.Arbitrary<any>,
  }),
  contributesModifiers: fc.boolean(),
  modifierCount: fc.integer({ min: 0, max: 5 }),
});

/** Arbitrary for CalculationInput (partial — enough fields for heroMetrics) */
const arbCalculationInput: fc.Arbitrary<CalculationInput> = fc.record({
  modifierSources: fc.array(arbModifierSource, { minLength: 0, maxLength: 8 }),
  aggregationReport: fc.constant({ totalSources: 0, statBreakdown: {} } as any),
  pvpMitigation: fc.constant({ applied: false, reductionPercent: 0 } as any),
  conditionalEffects: fc.constant([]) as fc.Arbitrary<any>,
  uptimeProfile: fc.constant("always-on") as fc.Arbitrary<any>,
  modeledEffects: fc.array(arbBridgedEffect, { minLength: 0, maxLength: 5 }),
  partiallyModeledEffects: fc.constant([]) as fc.Arbitrary<any>,
  displayOnlyEffects: fc.constant([]) as fc.Arbitrary<any>,
  unresolvedEffects: fc.constant([]) as fc.Arbitrary<any>,
  ignoredEffects: fc.constant([]) as fc.Arbitrary<any>,
  formulaWarnings: fc.constant([]) as fc.Arbitrary<any>,
  partialSupportNotes: fc.constant([]) as fc.Arbitrary<any>,
  availableMechanics: fc.constant([]) as fc.Arbitrary<any>,
  buildMode: arbBuildMode,
  enemyType: fc.constantFrom("pve-generic", "pvp-player") as fc.Arbitrary<any>,
  totalItemsConsidered: fc.integer({ min: 0, max: 20 }),
  totalModifiersExtracted: fc.integer({ min: 0, max: 50 }),
  baseWeaponDMG: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  baseCritRate: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  baseCritDamage: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  baseWeakspotDamage: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
  baseFireRate: arbOptionalNumeric as fc.Arbitrary<number | undefined>,
}) as fc.Arbitrary<CalculationInput>;

/** Arbitrary for ArmorPiece */
const arbArmorPiece = fc.oneof(
  fc.string({ minLength: 0, maxLength: 20 }),
  fc.record({
    id: fc.string({ minLength: 0, maxLength: 20 }),
    stars: fc.oneof(fc.constant(undefined), fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>),
    tier: fc.oneof(fc.constant(undefined), fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>),
  }),
);

/** Arbitrary for BuildSelection (minimal for heroMetrics testing) */
const arbBuildSelection: fc.Arbitrary<BuildSelection> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 0, maxLength: 30 }),
  role: fc.constantFrom('attacker', 'defender') as fc.Arbitrary<'attacker' | 'defender'>,
  weapon: fc.record({
    blueprintId: fc.string({ minLength: 0, maxLength: 30 }),
    stars: fc.constantFrom(1, 2, 3, 4, 5, 6) as fc.Arbitrary<1|2|3|4|5|6>,
    tier: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>,
    calibration: fc.string({ minLength: 0, maxLength: 20 }),
    attachments: fc.record({
      optic: fc.string({ minLength: 0, maxLength: 10 }),
      muzzle: fc.string({ minLength: 0, maxLength: 10 }),
      magazine: fc.string({ minLength: 0, maxLength: 10 }),
      tactical: fc.string({ minLength: 0, maxLength: 10 }),
      stock: fc.string({ minLength: 0, maxLength: 10 }),
      ammo: fc.string({ minLength: 0, maxLength: 10 }),
    }),
  }),
  armor: fc.record({
    head: arbArmorPiece,
    mask: arbArmorPiece,
    chest: arbArmorPiece,
    gloves: arbArmorPiece,
    pants: arbArmorPiece,
    boots: arbArmorPiece,
  }),
  mods: fc.record({
    weaponCore: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
    weaponSuffix: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
  }) as fc.Arbitrary<any>,
  cradle: fc.record({
    perks: fc.array(fc.string({ minLength: 0, maxLength: 15 }), { minLength: 0, maxLength: 5 }),
  }),
  deviant: fc.record({
    id: fc.string({ minLength: 0, maxLength: 20 }),
    level: fc.integer({ min: 0, max: 30 }),
    activityRating: fc.integer({ min: 0, max: 5 }),
    trait: fc.string({ minLength: 0, maxLength: 15 }),
  }),
  food: fc.record({
    food: fc.string({ minLength: 0, maxLength: 20 }),
    drink: fc.string({ minLength: 0, maxLength: 20 }),
    chefRex: fc.record({
      enabled: fc.boolean(),
      skillRating: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>,
      activityRating: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>,
      bonusPercent: fc.double({ min: 0, max: 100, noNaN: true }),
      mode: fc.constantFrom('rating-derived', 'manual') as fc.Arbitrary<'rating-derived' | 'manual'>,
    }),
  }),
});

// ─── Forbidden value strings ─────────────────────────────────────────────────

const FORBIDDEN_STRINGS = ["NaN", "undefined", "Infinity", "-Infinity"];

// ─── Property 1: Hero Metrics Safe Display ───────────────────────────────────

describe('Property 1: Hero Metrics Safe Display', () => {
  /**
   * **Validates: Requirements 1.6, 1.7**
   *
   * For any CombatOutput (including those with NaN, Infinity, undefined, null),
   * deriveHeroMetrics SHALL never produce a MetricCardData.value containing
   * "NaN", "undefined", "Infinity", or "-Infinity".
   */
  it('deriveHeroMetrics never produces metric values containing forbidden strings', () => {
    fc.assert(
      fc.property(
        arbCombatOutput,
        arbCalculationInput,
        arbBuildSelection,
        (combatOutput, calcInput, buildSelection) => {
          const result = deriveHeroMetrics(combatOutput, calcInput, buildSelection);

          for (const metric of result.metrics) {
            for (const forbidden of FORBIDDEN_STRINGS) {
              expect(metric.value).not.toContain(forbidden);
            }
            // value must be a string
            expect(typeof metric.value).toBe('string');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deriveHeroMetrics handles null/undefined CombatOutput safely', () => {
    fc.assert(
      fc.property(
        arbCalculationInput,
        arbBuildSelection,
        (calcInput, buildSelection) => {
          // Test with null and undefined combatOutput
          for (const combatOutput of [null, undefined]) {
            const result = deriveHeroMetrics(combatOutput, calcInput, buildSelection);

            for (const metric of result.metrics) {
              for (const forbidden of FORBIDDEN_STRINGS) {
                expect(metric.value).not.toContain(forbidden);
              }
              expect(typeof metric.value).toBe('string');
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 2: Hero Metrics Correct Mapping ────────────────────────────────

describe('Property 2: Hero Metrics Correct Mapping', () => {
  /**
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any valid CombatOutput with buildMode === "pve", deriveHeroMetrics
   * SHALL produce exactly 5 metric cards. For buildMode === "pvp", it SHALL
   * produce exactly 6 metric cards.
   */
  it('PvE mode produces exactly 5 metrics', () => {
    fc.assert(
      fc.property(
        arbCombatOutputWithMode("pve"),
        arbCalculationInput,
        arbBuildSelection,
        (combatOutput, calcInput, buildSelection) => {
          const result = deriveHeroMetrics(combatOutput, calcInput, buildSelection);

          expect(result.metrics).toHaveLength(5);
          expect(result.buildMode).toBe("pve");
        },
      ),
      { numRuns: 200 },
    );
  });

  it('PvP mode produces exactly 6 metrics', () => {
    fc.assert(
      fc.property(
        arbCombatOutputWithMode("pvp"),
        arbCalculationInput,
        arbBuildSelection,
        (combatOutput, calcInput, buildSelection) => {
          const result = deriveHeroMetrics(combatOutput, calcInput, buildSelection);

          expect(result.metrics).toHaveLength(6);
          expect(result.buildMode).toBe("pvp");
        },
      ),
      { numRuns: 200 },
    );
  });

  it('PvE metrics contain the expected IDs', () => {
    fc.assert(
      fc.property(
        arbCombatOutputWithMode("pve"),
        arbCalculationInput,
        arbBuildSelection,
        (combatOutput, calcInput, buildSelection) => {
          const result = deriveHeroMetrics(combatOutput, calcInput, buildSelection);
          const ids = result.metrics.map(m => m.id);

          expect(ids).toContain("dps");
          expect(ids).toContain("expected-hit");
          expect(ids).toContain("ttk");
          expect(ids).toContain("status-dmg");
          expect(ids).toContain("build-mode");
        },
      ),
      { numRuns: 100 },
    );
  });

  it('PvP metrics contain the expected IDs including pvp-mitigation', () => {
    fc.assert(
      fc.property(
        arbCombatOutputWithMode("pvp"),
        arbCalculationInput,
        arbBuildSelection,
        (combatOutput, calcInput, buildSelection) => {
          const result = deriveHeroMetrics(combatOutput, calcInput, buildSelection);
          const ids = result.metrics.map(m => m.id);

          expect(ids).toContain("dps");
          expect(ids).toContain("expected-hit");
          expect(ids).toContain("ttk");
          expect(ids).toContain("status-dmg");
          expect(ids).toContain("build-mode");
          expect(ids).toContain("pvp-mitigation");
        },
      ),
      { numRuns: 100 },
    );
  });
});
