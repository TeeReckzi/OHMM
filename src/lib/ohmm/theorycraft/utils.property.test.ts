import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeCompleteness, safeFormat } from './utils';
import type {
  BuildSelection,
  WeaponSelection,
  ArmorSelection,
  ArmorPieceSelection,
  CradleSelection,
  DeviantSelection,
  FoodBuffSelection,
  ChefRexSelection,
  ModSelection,
  BlueprintStars,
  GearTier,
  ChefRexSkillRating,
  ChefRexActivityRating,
  AttachmentSelection,
} from '@/ohai/src/ui/types';

// ─── Generators ──────────────────────────────────────────────────────────────

const arbBlueprintStars: fc.Arbitrary<BlueprintStars> = fc.constantFrom(1, 2, 3, 4, 5, 6);
const arbGearTier: fc.Arbitrary<GearTier> = fc.constantFrom(1, 2, 3, 4, 5);
const arbChefRexSkillRating: fc.Arbitrary<ChefRexSkillRating> = fc.constantFrom(1, 2, 3, 4, 5);
const arbChefRexActivityRating: fc.Arbitrary<ChefRexActivityRating> = fc.constantFrom(1, 2, 3, 4, 5);

const arbAttachmentSelection: fc.Arbitrary<AttachmentSelection> = fc.record({
  optic: fc.string({ maxLength: 10 }),
  muzzle: fc.string({ maxLength: 10 }),
  magazine: fc.string({ maxLength: 10 }),
  tactical: fc.string({ maxLength: 10 }),
  stock: fc.string({ maxLength: 10 }),
  ammo: fc.string({ maxLength: 10 }),
});

const arbWeaponSelection: fc.Arbitrary<WeaponSelection> = fc.record({
  blueprintId: fc.string({ maxLength: 20 }),
  stars: arbBlueprintStars,
  tier: arbGearTier,
  calibration: fc.string({ maxLength: 15 }),
  attachments: arbAttachmentSelection,
});

const arbArmorPieceSelection: fc.Arbitrary<ArmorPieceSelection> = fc.record({
  id: fc.string({ maxLength: 20 }),
  stars: fc.option(arbBlueprintStars, { nil: undefined }),
  tier: fc.option(arbGearTier, { nil: undefined }),
});

// Each armor slot can be a string ID or an ArmorPieceSelection object
const arbArmorSlotValue: fc.Arbitrary<ArmorPieceSelection | string> = fc.oneof(
  fc.string({ maxLength: 20 }),
  arbArmorPieceSelection,
);

const arbArmorSelection: fc.Arbitrary<ArmorSelection> = fc.record({
  head: arbArmorSlotValue,
  mask: arbArmorSlotValue,
  chest: arbArmorSlotValue,
  gloves: arbArmorSlotValue,
  pants: arbArmorSlotValue,
  boots: arbArmorSlotValue,
});

const arbCradleSelection: fc.Arbitrary<CradleSelection> = fc.record({
  perks: fc.array(fc.string({ maxLength: 15 }), { maxLength: 5 }),
});

const arbDeviantSelection: fc.Arbitrary<DeviantSelection> = fc.record({
  id: fc.string({ maxLength: 20 }),
  level: fc.integer({ min: 0, max: 60 }),
  activityRating: fc.integer({ min: 0, max: 5 }),
  trait: fc.string({ maxLength: 15 }),
});

const arbChefRexSelection: fc.Arbitrary<ChefRexSelection> = fc.record({
  enabled: fc.boolean(),
  skillRating: arbChefRexSkillRating,
  activityRating: arbChefRexActivityRating,
  bonusPercent: fc.double({ min: 0, max: 100, noNaN: true }),
  mode: fc.constantFrom('rating-derived' as const, 'manual' as const),
});

const arbFoodBuffSelection: fc.Arbitrary<FoodBuffSelection> = fc.record({
  food: fc.string({ maxLength: 20 }),
  drink: fc.string({ maxLength: 20 }),
  chefRex: arbChefRexSelection,
});

const arbModSelection: fc.Arbitrary<ModSelection> = fc.record({
  weapon: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
  head: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
  mask: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
  chest: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
  gloves: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
  pants: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
  boots: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
}) as fc.Arbitrary<ModSelection>;

const arbBuildSelection: fc.Arbitrary<BuildSelection> = fc.record({
  id: fc.string({ maxLength: 20 }),
  label: fc.string({ maxLength: 30 }),
  role: fc.constantFrom('attacker' as const, 'defender' as const),
  weapon: arbWeaponSelection,
  armor: arbArmorSelection,
  mods: arbModSelection,
  cradle: arbCradleSelection,
  deviant: arbDeviantSelection,
  food: arbFoodBuffSelection,
});

// ─── Property 3: Build Completeness Derivation ───────────────────────────────

describe('Property 3: Build Completeness Derivation', () => {
  /**
   * **Validates: Requirements 1.3**
   * computeCompleteness always returns a value in [0.0, 1.0] for any BuildSelection.
   */
  it('computeCompleteness always returns value in [0.0, 1.0] for any BuildSelection', () => {
    fc.assert(
      fc.property(arbBuildSelection, (build) => {
        const result = computeCompleteness(build);
        expect(result).toBeGreaterThanOrEqual(0.0);
        expect(result).toBeLessThanOrEqual(1.0);
      }),
      { numRuns: 500 },
    );
  });

  it('computeCompleteness returns a finite number for any BuildSelection', () => {
    fc.assert(
      fc.property(arbBuildSelection, (build) => {
        const result = computeCompleteness(build);
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 15: View Model Safe Defaults (utilities) ───────────────────────

describe('Property 15: View Model Safe Defaults (utilities)', () => {
  /**
   * **Validates: Requirements 10.3**
   * safeFormat never returns strings containing "NaN", "undefined", or "Infinity".
   */

  // Arbitrary that includes edge cases: NaN, Infinity, -Infinity, very large/small numbers
  const arbAnyNumber: fc.Arbitrary<number> = fc.oneof(
    fc.double({ noDefaultInfinity: false, noNaN: false }),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity),
    fc.constant(0),
    fc.constant(-0),
    fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
    fc.double({ min: -1e15, max: 1e15, noNaN: true }),
  );

  // Arbitrary for the input parameter (number | undefined | null)
  const arbSafeFormatInput: fc.Arbitrary<number | undefined | null> = fc.oneof(
    arbAnyNumber,
    fc.constant(undefined),
    fc.constant(null),
  );

  const arbDecimals: fc.Arbitrary<number> = fc.integer({ min: 0, max: 10 });

  it('safeFormat never returns strings containing "NaN", "undefined", or "Infinity"', () => {
    fc.assert(
      fc.property(arbSafeFormatInput, arbDecimals, (value, decimals) => {
        const result = safeFormat(value, decimals);
        expect(result).not.toContain('NaN');
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('Infinity');
      }),
      { numRuns: 1000 },
    );
  });

  it('safeFormat always returns a non-empty string', () => {
    fc.assert(
      fc.property(arbSafeFormatInput, arbDecimals, (value, decimals) => {
        const result = safeFormat(value, decimals);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 500 },
    );
  });
});
