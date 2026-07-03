/**
 * Property-based tests for shared theorycraft utilities.
 *
 * Property 3: Build Completeness Derivation
 * Property 15: View Model Safe Defaults (partial — utilities)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeCompleteness, safeFormat } from '../utils';
import type { BuildSelection } from '@/ohai/src/ui/types';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for ArmorPieceSelection — either a string ID or an object with id */
const arbArmorPiece = fc.oneof(
  fc.string({ minLength: 0, maxLength: 20 }),
  fc.record({
    id: fc.string({ minLength: 0, maxLength: 20 }),
    stars: fc.oneof(fc.constant(undefined), fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>),
    tier: fc.oneof(fc.constant(undefined), fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>),
  }),
);

/** Arbitrary for WeaponSelection */
const arbWeaponSelection = fc.record({
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
});

/** Arbitrary for ArmorSelection */
const arbArmorSelection = fc.record({
  head: arbArmorPiece,
  mask: arbArmorPiece,
  chest: arbArmorPiece,
  gloves: arbArmorPiece,
  pants: arbArmorPiece,
  boots: arbArmorPiece,
});

/** Arbitrary for ModSelection — sparse record of optional strings */
const arbModSelection = fc.record({
  weaponCore: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
  weaponSuffix: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
  headCore: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
  headSuffix: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
  weapon: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
  head: fc.oneof(fc.constant(undefined), fc.string({ minLength: 0, maxLength: 10 })),
});

/** Arbitrary for CradleSelection */
const arbCradleSelection = fc.record({
  perks: fc.array(fc.string({ minLength: 0, maxLength: 15 }), { minLength: 0, maxLength: 5 }),
});

/** Arbitrary for DeviantSelection */
const arbDeviantSelection = fc.record({
  id: fc.string({ minLength: 0, maxLength: 20 }),
  level: fc.integer({ min: 0, max: 30 }),
  activityRating: fc.integer({ min: 0, max: 5 }),
  trait: fc.string({ minLength: 0, maxLength: 15 }),
});

/** Arbitrary for FoodBuffSelection */
const arbFoodBuffSelection = fc.record({
  food: fc.string({ minLength: 0, maxLength: 20 }),
  drink: fc.string({ minLength: 0, maxLength: 20 }),
  chefRex: fc.record({
    enabled: fc.boolean(),
    skillRating: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>,
    activityRating: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1|2|3|4|5>,
    bonusPercent: fc.double({ min: 0, max: 100, noNaN: true }),
    mode: fc.constantFrom('rating-derived', 'manual') as fc.Arbitrary<'rating-derived' | 'manual'>,
  }),
});

/** Arbitrary for a full BuildSelection */
const arbBuildSelection: fc.Arbitrary<BuildSelection> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 0, maxLength: 30 }),
  role: fc.constantFrom('attacker', 'defender') as fc.Arbitrary<'attacker' | 'defender'>,
  weapon: arbWeaponSelection,
  armor: arbArmorSelection,
  mods: arbModSelection as fc.Arbitrary<any>,
  cradle: arbCradleSelection,
  deviant: arbDeviantSelection,
  food: arbFoodBuffSelection,
});

// ─── Property 3: Build Completeness Derivation ───────────────────────────────

describe('Property 3: Build Completeness Derivation', () => {
  /**
   * **Validates: Requirements 1.3**
   *
   * For any BuildSelection, computeCompleteness SHALL return a value
   * always in the range [0.0, 1.0].
   */
  it('computeCompleteness always returns a value in [0.0, 1.0] for any BuildSelection', () => {
    fc.assert(
      fc.property(arbBuildSelection, (build) => {
        const result = computeCompleteness(build);

        // Must be a finite number
        expect(typeof result).toBe('number');
        expect(Number.isNaN(result)).toBe(false);
        expect(Number.isFinite(result)).toBe(true);

        // Must be in [0.0, 1.0]
        expect(result).toBeGreaterThanOrEqual(0.0);
        expect(result).toBeLessThanOrEqual(1.0);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 15: View Model Safe Defaults (partial — utilities) ─────────────

describe('Property 15: View Model Safe Defaults (partial — utilities)', () => {
  /**
   * **Validates: Requirements 10.3**
   *
   * For any input to safeFormat (including null, undefined, NaN, Infinity,
   * -Infinity), the function SHALL never produce strings containing "NaN",
   * "undefined", "Infinity".
   */
  it('safeFormat never returns strings containing "NaN", "undefined", or "Infinity"', () => {
    // Generate a wide variety of inputs including special values
    const arbInput = fc.oneof(
      fc.double({ noNaN: false }), // includes NaN, Infinity, -Infinity
      fc.constant(NaN),
      fc.constant(Infinity),
      fc.constant(-Infinity),
      fc.constant(undefined as unknown as number),
      fc.constant(null as unknown as number),
      fc.integer({ min: -1_000_000, max: 1_000_000 }),
      fc.double({ min: -1e15, max: 1e15, noNaN: true }),
    );

    const arbDecimals = fc.oneof(
      fc.constant(undefined),
      fc.integer({ min: 0, max: 10 }),
    );

    fc.assert(
      fc.property(arbInput, arbDecimals, (value, decimals) => {
        const result = safeFormat(value as any, decimals);

        // Must be a string
        expect(typeof result).toBe('string');

        // Must never contain forbidden substrings
        expect(result).not.toContain('NaN');
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('Infinity');
      }),
      { numRuns: 500 },
    );
  });
});
