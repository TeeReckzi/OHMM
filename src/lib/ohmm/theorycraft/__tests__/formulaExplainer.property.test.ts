/**
 * Property-based tests for Formula Explainer view model.
 *
 * Property 4: Formula Explainer Grouping Integrity
 * Property 5: No Invented Data Invariant
 * Property 6: Confidence Label Propagation
 *
 * **Validates: Requirements 3.2, 3.3, 3.6, 3.7, 11.1, 11.2, 11.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveFormulaExplainer } from "../formulaExplainer.vm";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import type { ModifierSource } from "@/ohai/src/engine/modifierTypes";
import type { Confidence } from "@/ohai/src/engine/types";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for engine Confidence values */
const arbConfidence: fc.Arbitrary<Confidence> = fc.constantFrom(
  "confirmed",
  "observed_in_game_needs_testing",
  "reported_current_patch_needs_testing",
  "outdated_reference",
  "inferred",
  "unknown",
);

/** Confidence values that map to "estimated" or "placeholder" in the presentation layer */
const arbLowConfidence: fc.Arbitrary<Confidence> = fc.constantFrom(
  "reported_current_patch_needs_testing",
  "inferred",
  "unknown",
);

/** Arbitrary for ModifierSourceType */
const arbSourceType = fc.constantFrom(
  "weapon" as const,
  "armor" as const,
  "mod" as const,
  "modSuffix" as const,
  "calibration" as const,
  "food" as const,
  "setBonus" as const,
  "keywordEffect" as const,
  "temporaryBuff" as const,
  "enemyTypeBonus" as const,
  "gloves" as const,
);

/** Arbitrary for ModifierBehavior */
const arbBehavior = fc.constantFrom(
  "additive" as const,
  "multiplicative" as const,
  "conditional" as const,
);

/** Subset of StatKeys relevant for modifiers */
const arbStatKey = fc.constantFrom(
  "weaponDMGBonus",
  "statusDMGBonus",
  "elementalDMGBonus",
  "critRate",
  "critDMG",
  "weakspotDMG",
  "psiIntensity",
  "fireRate",
  "burnDMGBonus",
  "meleeDMGBonus",
  "attackPercent",
);

/** Arbitrary for a non-zero numeric value (to ensure line items are counted) */
const arbNonZeroValue = fc.oneof(
  fc.double({ min: 0.001, max: 2.0, noNaN: true, noDefaultInfinity: true }),
  fc.double({ min: -2.0, max: -0.001, noNaN: true, noDefaultInfinity: true }),
);

/** Arbitrary for a ModifierSource with non-zero value */
const arbModifierSourceNonZero: fc.Arbitrary<ModifierSource> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  sourceType: arbSourceType,
  sourceLabel: fc.string({ minLength: 1, maxLength: 30 }),
  stat: arbStatKey as fc.Arbitrary<any>,
  value: arbNonZeroValue,
  behavior: arbBehavior,
  confidence: arbConfidence,
});

/** Arbitrary for a ModifierSource with exactly zero value */
const arbModifierSourceZero: fc.Arbitrary<ModifierSource> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  sourceType: arbSourceType,
  sourceLabel: fc.string({ minLength: 1, maxLength: 30 }),
  stat: arbStatKey as fc.Arbitrary<any>,
  value: fc.constant(0),
  behavior: arbBehavior,
  confidence: arbConfidence,
});

/** Arbitrary for a ModifierSource with low confidence and non-zero value */
const arbModifierSourceLowConfidence: fc.Arbitrary<ModifierSource> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  sourceType: arbSourceType,
  sourceLabel: fc.string({ minLength: 1, maxLength: 30 }),
  stat: arbStatKey as fc.Arbitrary<any>,
  value: arbNonZeroValue,
  behavior: arbBehavior,
  confidence: arbLowConfidence,
});

/** Build a minimal CalculationInput with given modifier sources */
function buildCalcInput(
  modifierSources: ModifierSource[],
  overrides: Partial<CalculationInput> = {},
): CalculationInput {
  return {
    modifierSources,
    aggregationReport: {
      stats: { stats: {}, breakdown: {}, sourceCount: 0 },
      duplicates: [],
      totalSources: modifierSources.length,
      activeSources: modifierSources.length,
      suppressedCount: 0,
    },
    pvpMitigation: {
      pvpMode: false,
      totalReductionPercent: 0,
      sources: [],
      warnings: [],
    },
    conditionalEffects: [],
    uptimeProfile: "sustained" as any,
    modeledEffects: [],
    partiallyModeledEffects: [],
    displayOnlyEffects: [],
    unresolvedEffects: [],
    ignoredEffects: [],
    formulaWarnings: [],
    partialSupportNotes: [],
    availableMechanics: [],
    buildMode: "pve",
    enemyType: "unknown",
    totalItemsConsidered: modifierSources.length,
    totalModifiersExtracted: modifierSources.length,
    baseWeaponDMG: 100,
    ...overrides,
  } as CalculationInput;
}

/** Build a minimal CombatOutput */
function buildCombatOutput(
  overrides: Partial<CombatOutput> = {},
): CombatOutput {
  return {
    damageOutput: {
      baseDamage: 100,
      expectedDamage: 500,
      critMultiplier: 1.5,
      weakspotMultiplier: 1.3,
      totalMultiplier: 1.95,
      DPS: 1000,
      tickIntervalSeconds: undefined,
      ticksPerSecond: undefined,
    },
    survivability: {
      damageTakenMultiplier: 1,
      effectiveHealthMultiplier: 1,
      effectiveHealth: undefined,
      incomingDamageAfterMitigation: undefined,
      shotsToDie: undefined,
      survivabilityGainPercent: 0,
    },
    pvpDuel: {
      outgoingTTK: undefined,
      incomingTTK: undefined,
      duelPressure: "Unknown",
    },
    warnings: [],
    assumptions: [],
    buildMode: "pve",
    incomingDPSProvided: false,
    targetHealthProvided: false,
    officialFormula: {
      status: "metadata-only",
      warnings: [],
      officialDamageAvailable: false,
      unresolvedLeaves: [],
      accuracyNote: "Not validated.",
    },
    ...overrides,
  } as CombatOutput;
}

// ─── Property 4: Formula Explainer Grouping Integrity ────────────────────────

describe("Property 4: Formula Explainer Grouping Integrity", () => {
  /**
   * **Validates: Requirements 3.2, 3.3**
   *
   * For any CalculationInput with N modifier sources, the deriveFormulaExplainer
   * function SHALL partition all line items into exactly two groups (additive and
   * multiplicative), and the total count of line items across both groups SHALL
   * equal the count of non-zero modifier sources in the input.
   */
  it("line items partition into exactly two groups whose total count equals non-zero modifier sources", () => {
    const arbSources = fc.tuple(
      fc.array(arbModifierSourceNonZero, { minLength: 0, maxLength: 15 }),
      fc.array(arbModifierSourceZero, { minLength: 0, maxLength: 5 }),
    );

    fc.assert(
      fc.property(arbSources, ([nonZeroSources, zeroSources]) => {
        const allSources = [...nonZeroSources, ...zeroSources];
        const calcInput = buildCalcInput(allSources);
        const combatOutput = buildCombatOutput();

        const result = deriveFormulaExplainer(combatOutput, calcInput);

        // All items in additiveGroup must have groupType "additive"
        for (const item of result.additiveGroup) {
          expect(item.groupType).toBe("additive");
        }
        // All items in multiplicativeGroup must have groupType "multiplicative"
        for (const item of result.multiplicativeGroup) {
          expect(item.groupType).toBe("multiplicative");
        }

        // Total count of line items should equal the count of non-zero modifier sources
        const totalLineItems = result.additiveGroup.length + result.multiplicativeGroup.length;
        const expectedCount = nonZeroSources.length;
        expect(totalLineItems).toBe(expectedCount);

        // activeContributorCount should match total line items
        expect(result.activeContributorCount).toBe(totalLineItems);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 5: No Invented Data Invariant ─────────────────────────────────

describe("Property 5: No Invented Data Invariant", () => {
  /**
   * **Validates: Requirements 3.7, 11.1**
   *
   * Every ExplainerLineItem produced by deriveFormulaExplainer SHALL have a
   * source that maps to an existing entry in calcInput.modifierSources — no
   * line item may reference a mechanic not present in the input.
   */
  it("every line item source maps to an existing modifier source in the input", () => {
    const arbSources = fc.array(arbModifierSourceNonZero, { minLength: 1, maxLength: 15 });

    fc.assert(
      fc.property(arbSources, (sources) => {
        const calcInput = buildCalcInput(sources);
        const combatOutput = buildCombatOutput();

        const result = deriveFormulaExplainer(combatOutput, calcInput);

        const allLineItems = [...result.additiveGroup, ...result.multiplicativeGroup];

        // We should never produce more line items than there are modifier sources
        expect(allLineItems.length).toBeLessThanOrEqual(sources.length);

        // Total line items must equal the number of non-zero sources (no invented extras)
        const nonZeroSources = sources.filter((s) => s.value !== 0);
        expect(allLineItems.length).toBe(nonZeroSources.length);

        // Every line item must trace back to a real source in the input.
        // Verify by checking that each line item's numeric value exists among the
        // source values. Use a multiset comparison to handle duplicates correctly.
        const sourceValues = nonZeroSources.map((s) => s.value);
        const lineItemValues = allLineItems.map((item) => item.value);

        // Sort both arrays so we can compare element-by-element
        sourceValues.sort((a, b) => a - b);
        lineItemValues.sort((a, b) => a - b);

        expect(lineItemValues.length).toBe(sourceValues.length);
        for (let i = 0; i < sourceValues.length; i++) {
          // Use closeTo to handle floating-point representation differences
          expect(lineItemValues[i]).toBeCloseTo(sourceValues[i], 10);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 6: Confidence Label Propagation ────────────────────────────────

describe("Property 6: Confidence Label Propagation", () => {
  /**
   * **Validates: Requirements 3.6, 11.2, 11.3**
   *
   * CalculationInput containing effects with confidence levels "estimated" or
   * "placeholder" → derived view models SHALL preserve and propagate those
   * confidence levels to the corresponding line items.
   */
  it('modifier sources with low confidence propagate "estimated" or "placeholder" to derived line items', () => {
    fc.assert(
      fc.property(arbModifierSourceLowConfidence, (source) => {
        const calcInput = buildCalcInput([source]);
        const combatOutput = buildCombatOutput();

        const result = deriveFormulaExplainer(combatOutput, calcInput);

        // Should have exactly 1 line item from our 1 non-zero source
        const allLineItems = [...result.additiveGroup, ...result.multiplicativeGroup];
        expect(allLineItems.length).toBe(1);

        const lineItem = allLineItems[0];

        // The confidence on the line item must be "estimated" or "placeholder"
        // since the source confidence maps to one of those in the presentation layer.
        // Per mapEngineConfidence:
        //   "reported_current_patch_needs_testing" → "estimated"
        //   "inferred" → "estimated"
        //   "unknown" → "estimated" (default case)
        expect(lineItem.confidence).toBe("estimated");
      }),
      { numRuns: 200 },
    );
  });

  it('modifier sources with "placeholder" engine confidence propagate to "placeholder" presentation confidence', () => {
    // Test that the explicit "placeholder" confidence value propagates correctly
    const arbPlaceholderSource: fc.Arbitrary<ModifierSource> = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      sourceType: arbSourceType,
      sourceLabel: fc.string({ minLength: 1, maxLength: 30 }),
      stat: arbStatKey as fc.Arbitrary<any>,
      value: arbNonZeroValue,
      behavior: arbBehavior,
      confidence: fc.constant("unknown" as Confidence),
    }).map((s) => ({ ...s, confidence: "placeholder" as any }));

    fc.assert(
      fc.property(arbPlaceholderSource, (source) => {
        const calcInput = buildCalcInput([source]);
        const combatOutput = buildCombatOutput();

        const result = deriveFormulaExplainer(combatOutput, calcInput);

        const allLineItems = [...result.additiveGroup, ...result.multiplicativeGroup];
        expect(allLineItems.length).toBe(1);

        // "placeholder" engine confidence → "placeholder" presentation confidence
        expect(allLineItems[0].confidence).toBe("placeholder");
      }),
      { numRuns: 100 },
    );
  });

  it("high-confidence sources do NOT produce estimated/placeholder labels", () => {
    const arbHighConfidence: fc.Arbitrary<Confidence> = fc.constantFrom(
      "confirmed",
      "observed_in_game_needs_testing",
    );

    const arbHighConfidenceSource: fc.Arbitrary<ModifierSource> = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      sourceType: arbSourceType,
      sourceLabel: fc.string({ minLength: 1, maxLength: 30 }),
      stat: arbStatKey as fc.Arbitrary<any>,
      value: arbNonZeroValue,
      behavior: arbBehavior,
      confidence: arbHighConfidence,
    });

    fc.assert(
      fc.property(arbHighConfidenceSource, (source) => {
        const calcInput = buildCalcInput([source]);
        const combatOutput = buildCombatOutput();

        const result = deriveFormulaExplainer(combatOutput, calcInput);

        const allLineItems = [...result.additiveGroup, ...result.multiplicativeGroup];
        expect(allLineItems.length).toBe(1);

        const lineItem = allLineItems[0];

        // "confirmed" → "project_verified", "observed_in_game_needs_testing" → "observed"
        // Neither should be "estimated" or "placeholder"
        expect(lineItem.confidence).not.toBe("estimated");
        expect(lineItem.confidence).not.toBe("placeholder");
      }),
      { numRuns: 100 },
    );
  });
});
