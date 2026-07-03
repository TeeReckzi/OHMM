import { describe, it, expect } from 'vitest';
import {
  isDisplayable,
  safeFormat,
  clamp,
  hashBuildSelection,
  aggregateConfidence,
  formatDelta,
  computeCompleteness,
} from './utils';
import type { BuildSelection } from '@/ohai/src/ui/types';

describe('isDisplayable', () => {
  it('returns true for valid numbers', () => {
    expect(isDisplayable(0)).toBe(true);
    expect(isDisplayable(42)).toBe(true);
    expect(isDisplayable(-3.14)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isDisplayable(NaN)).toBe(false);
  });

  it('returns false for Infinity and -Infinity', () => {
    expect(isDisplayable(Infinity)).toBe(false);
    expect(isDisplayable(-Infinity)).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isDisplayable(null)).toBe(false);
    expect(isDisplayable(undefined)).toBe(false);
  });

  it('returns false for non-number types', () => {
    expect(isDisplayable('42')).toBe(false);
    expect(isDisplayable(true)).toBe(false);
    expect(isDisplayable({})).toBe(false);
  });
});

describe('safeFormat', () => {
  it('formats valid numbers with thousands separator', () => {
    expect(safeFormat(1234)).toBe('1,234');
    expect(safeFormat(1000000)).toBe('1,000,000');
  });

  it('formats with specified decimals', () => {
    expect(safeFormat(3.14159, 2)).toBe('3.14');
    expect(safeFormat(1000.5, 1)).toBe('1,000.5');
  });

  it('returns "—" for null, undefined, NaN, Infinity', () => {
    expect(safeFormat(null)).toBe('—');
    expect(safeFormat(undefined)).toBe('—');
    expect(safeFormat(NaN)).toBe('—');
    expect(safeFormat(Infinity)).toBe('—');
    expect(safeFormat(-Infinity)).toBe('—');
  });

  it('formats zero correctly', () => {
    expect(safeFormat(0)).toBe('0');
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max when above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles edge cases at boundaries', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('hashBuildSelection', () => {
  const baseBuild: BuildSelection = {
    id: 'test-1',
    label: 'Test Build',
    role: 'attacker',
    weapon: { blueprintId: 'wpn-1', stars: 5, tier: 5, calibration: '', attachments: { optic: '', muzzle: '', magazine: '', tactical: '', stock: '', ammo: '' } },
    armor: { head: '', mask: '', chest: '', gloves: '', pants: '', boots: '' },
    mods: {},
    cradle: { perks: [] },
    deviant: { id: '', level: 0, activityRating: 0, trait: '' },
    food: { food: '', drink: '', chefRex: { enabled: false, skillRating: 1, activityRating: 1, bonusPercent: 0, mode: 'rating-derived' } },
  };

  it('returns a string', () => {
    expect(typeof hashBuildSelection(baseBuild)).toBe('string');
  });

  it('returns same hash for same build', () => {
    const hash1 = hashBuildSelection(baseBuild);
    const hash2 = hashBuildSelection(baseBuild);
    expect(hash1).toBe(hash2);
  });

  it('returns different hash for different builds', () => {
    const modified = { ...baseBuild, weapon: { ...baseBuild.weapon, blueprintId: 'wpn-2' } };
    expect(hashBuildSelection(baseBuild)).not.toBe(hashBuildSelection(modified));
  });

  it('ignores id and label fields (not part of loadout)', () => {
    const same = { ...baseBuild, id: 'test-2', label: 'Different Label' };
    expect(hashBuildSelection(baseBuild)).toBe(hashBuildSelection(same));
  });
});

describe('aggregateConfidence', () => {
  it('returns "placeholder" for empty array', () => {
    expect(aggregateConfidence([])).toBe('placeholder');
  });

  it('returns the single level for single-element array', () => {
    expect(aggregateConfidence(['observed'])).toBe('observed');
  });

  it('returns worst-case confidence', () => {
    expect(aggregateConfidence(['project_verified', 'observed', 'estimated'])).toBe('estimated');
    expect(aggregateConfidence(['project_verified', 'placeholder'])).toBe('placeholder');
  });

  it('"placeholder" is the worst confidence', () => {
    expect(aggregateConfidence(['project_verified', 'observed', 'estimated', 'placeholder'])).toBe('placeholder');
  });

  it('"project_verified" is the best confidence', () => {
    expect(aggregateConfidence(['project_verified', 'project_verified'])).toBe('project_verified');
  });
});

describe('formatDelta', () => {
  it('formats positive deltas with + prefix', () => {
    expect(formatDelta(1234)).toBe('+1,234');
    expect(formatDelta(0.5, 1)).toBe('+0.5');
  });

  it('formats negative deltas with − (unicode minus) prefix', () => {
    expect(formatDelta(-567)).toBe('\u2212567');
    expect(formatDelta(-1234.5, 1)).toBe('\u22121,234.5');
  });

  it('formats zero as "0"', () => {
    expect(formatDelta(0)).toBe('0');
  });

  it('returns "—" for non-displayable values', () => {
    expect(formatDelta(NaN)).toBe('—');
    expect(formatDelta(Infinity)).toBe('—');
  });
});

describe('computeCompleteness', () => {
  const emptyBuild: BuildSelection = {
    id: 'empty',
    label: 'Empty',
    role: 'attacker',
    weapon: { blueprintId: '', stars: 1, tier: 1, calibration: '', attachments: { optic: '', muzzle: '', magazine: '', tactical: '', stock: '', ammo: '' } },
    armor: { head: '', mask: '', chest: '', gloves: '', pants: '', boots: '' },
    mods: {},
    cradle: { perks: [] },
    deviant: { id: '', level: 0, activityRating: 0, trait: '' },
    food: { food: '', drink: '', chefRex: { enabled: false, skillRating: 1, activityRating: 1, bonusPercent: 0, mode: 'rating-derived' } },
  };

  const fullBuild: BuildSelection = {
    id: 'full',
    label: 'Full',
    role: 'attacker',
    weapon: { blueprintId: 'wpn-1', stars: 5, tier: 5, calibration: 'crit', attachments: { optic: '', muzzle: '', magazine: '', tactical: '', stock: '', ammo: '' } },
    armor: { head: 'armor-1', mask: 'armor-2', chest: 'armor-3', gloves: 'armor-4', pants: 'armor-5', boots: 'armor-6' },
    mods: { weaponCore: 'mod-1' },
    cradle: { perks: ['perk1'] },
    deviant: { id: 'dev-1', level: 5, activityRating: 5, trait: 'trait-a' },
    food: { food: 'food-1', drink: '', chefRex: { enabled: false, skillRating: 1, activityRating: 1, bonusPercent: 0, mode: 'rating-derived' } },
  };

  it('returns 0 for completely empty build', () => {
    expect(computeCompleteness(emptyBuild)).toBe(0);
  });

  it('returns 1.0 for fully equipped build', () => {
    expect(computeCompleteness(fullBuild)).toBe(1.0);
  });

  it('returns value between 0 and 1 for partial build', () => {
    const partial: BuildSelection = {
      ...emptyBuild,
      weapon: { ...emptyBuild.weapon, blueprintId: 'wpn-1' },
      armor: { ...emptyBuild.armor, head: 'armor-1', chest: 'armor-2' },
    };
    const result = computeCompleteness(partial);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    // weapon (1) + 2 armor = 3 / 11 ≈ 0.2727
    expect(result).toBeCloseTo(3 / 11, 5);
  });

  it('always returns value in [0.0, 1.0]', () => {
    expect(computeCompleteness(emptyBuild)).toBeGreaterThanOrEqual(0);
    expect(computeCompleteness(emptyBuild)).toBeLessThanOrEqual(1);
    expect(computeCompleteness(fullBuild)).toBeGreaterThanOrEqual(0);
    expect(computeCompleteness(fullBuild)).toBeLessThanOrEqual(1);
  });
});
