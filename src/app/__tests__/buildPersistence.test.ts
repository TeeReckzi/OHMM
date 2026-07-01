/**
 * Unit tests for the build persistence module.
 * Tests serialization, deserialization, sanitization, and localStorage operations.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  serializeBuildState,
  deserializeBuildState,
  sanitizeLoadedBuild,
  saveBuildToLocalStorage,
  loadBuildsFromLocalStorage,
  deleteSavedBuild,
  renameSavedBuild,
  autoSaveSession,
  restoreSession,
  CURRENT_SCHEMA_VERSION,
} from '../persistence/buildPersistence';
import type { LoadoutMap } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('serializeBuildState', () => {
  it('creates a SavedBuild with correct structure', () => {
    const off: LoadoutMap = { primary: { id: 'acs12', name: 'ACS12', category: 'AR', rarity: 'Legendary', tier: 4, stars: 3 } };
    const def: LoadoutMap = {};

    const result = serializeBuildState('My Build', off, def);

    expect(result.name).toBe('My Build');
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.offLoadout).toEqual(off);
    expect(result.defLoadout).toEqual(def);
    expect(result.id).toMatch(/^build-/);
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });

  it('trims whitespace from name', () => {
    const result = serializeBuildState('  Burn DPS  ', {}, {});
    expect(result.name).toBe('Burn DPS');
  });

  it('defaults empty name to "Unnamed Build"', () => {
    const result = serializeBuildState('', {}, {});
    expect(result.name).toBe('Unnamed Build');
  });

  it('uses provided ID for updates', () => {
    const result = serializeBuildState('Test', {}, {}, 'existing-id');
    expect(result.id).toBe('existing-id');
  });
});

describe('deserializeBuildState', () => {
  it('parses a valid saved build', () => {
    const raw = {
      id: 'test-1',
      name: 'Test Build',
      schemaVersion: 1,
      createdAt: '2026-06-30T00:00:00Z',
      updatedAt: '2026-06-30T00:00:00Z',
      offLoadout: { primary: { id: 'de50', name: 'DE.50', category: 'Sniper', rarity: 'Epic', tier: 4, stars: 5 } },
      defLoadout: {},
    };

    const result = deserializeBuildState(raw);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('test-1');
    expect(result!.name).toBe('Test Build');
    expect(result!.offLoadout.primary).toBeDefined();
  });

  it('returns null for null input', () => {
    expect(deserializeBuildState(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(deserializeBuildState('string')).toBeNull();
    expect(deserializeBuildState(42)).toBeNull();
  });

  it('returns null for missing id', () => {
    expect(deserializeBuildState({ name: 'Test', offLoadout: {} })).toBeNull();
  });

  it('returns null for missing name', () => {
    expect(deserializeBuildState({ id: 'x', offLoadout: {} })).toBeNull();
  });

  it('defaults schemaVersion to 1 if missing', () => {
    const result = deserializeBuildState({ id: 'x', name: 'X', offLoadout: {} });
    expect(result!.schemaVersion).toBe(1);
  });

  it('defaults defLoadout to empty if missing', () => {
    const result = deserializeBuildState({ id: 'x', name: 'X', offLoadout: {} });
    expect(result!.defLoadout).toEqual({});
  });
});

describe('sanitizeLoadedBuild', () => {
  it('passes through valid builds without warnings', () => {
    const build = serializeBuildState('Valid', {
      primary: { id: 'acs12', name: 'ACS12', category: 'AR', rarity: 'Legendary', tier: 4, stars: 3 },
    }, {});

    const { build: sanitized, warnings } = sanitizeLoadedBuild(build);
    expect(warnings).toHaveLength(0);
    expect(sanitized.offLoadout.primary).toBeDefined();
  });

  it('removes items with missing id and produces warning', () => {
    const build = serializeBuildState('Bad', {
      primary: { id: '', name: 'NoID', category: 'AR', rarity: 'Rare', tier: 3, stars: 2 } as any,
    }, {});

    const { build: sanitized, warnings } = sanitizeLoadedBuild(build);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('missing valid id');
    expect(sanitized.offLoadout.primary).toBeUndefined();
  });

  it('clamps stars to 0-6 range', () => {
    const build = serializeBuildState('Clamp', {
      primary: { id: 'x', name: 'X', category: 'AR', rarity: 'Rare', tier: 4, stars: 99 },
    }, {});

    const { build: sanitized } = sanitizeLoadedBuild(build);
    expect(sanitized.offLoadout.primary!.stars).toBe(6);
  });

  it('clamps tier to 0-5 range', () => {
    const build = serializeBuildState('Clamp', {
      primary: { id: 'x', name: 'X', category: 'AR', rarity: 'Rare', tier: -1, stars: 3 },
    }, {});

    const { build: sanitized } = sanitizeLoadedBuild(build);
    expect(sanitized.offLoadout.primary!.tier).toBe(0);
  });

  it('handles null loadout gracefully', () => {
    const build = serializeBuildState('Null', {}, {});
    (build as any).offLoadout = null;

    const { build: sanitized, warnings } = sanitizeLoadedBuild(build);
    expect(warnings.length).toBeGreaterThan(0);
    expect(sanitized.offLoadout).toEqual({});
  });

  it('skips non-object items with warning', () => {
    const build = serializeBuildState('Bad', {}, {});
    (build.offLoadout as any).primary = "not-an-object";

    const { build: sanitized, warnings } = sanitizeLoadedBuild(build);
    expect(warnings.length).toBeGreaterThan(0);
    expect(sanitized.offLoadout.primary).toBeUndefined();
  });
});

describe('localStorage operations', () => {
  it('saves and loads a build', () => {
    const build = serializeBuildState('Test', { primary: { id: 'a', name: 'A', category: 'AR', rarity: 'Rare', tier: 4, stars: 3 } }, {});

    saveBuildToLocalStorage(build);
    const loaded = loadBuildsFromLocalStorage();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Test');
    expect(loaded[0].offLoadout.primary!.id).toBe('a');
  });

  it('returns empty array when nothing saved', () => {
    expect(loadBuildsFromLocalStorage()).toEqual([]);
  });

  it('enforces max 20 builds', () => {
    for (let i = 0; i < 25; i++) {
      saveBuildToLocalStorage(serializeBuildState(`Build ${i}`, {}, {}));
    }
    const loaded = loadBuildsFromLocalStorage();
    expect(loaded.length).toBeLessThanOrEqual(20);
  });

  it('updates existing build by ID', () => {
    const build = serializeBuildState('Original', {}, {});
    saveBuildToLocalStorage(build);

    const updated = { ...build, name: 'Updated', offLoadout: { primary: { id: 'x', name: 'X', category: 'AR', rarity: 'Rare', tier: 4, stars: 3 } } };
    saveBuildToLocalStorage(updated);

    const loaded = loadBuildsFromLocalStorage();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Updated');
    expect(loaded[0].offLoadout.primary!.id).toBe('x');
  });

  it('deletes a build by ID', () => {
    const b1 = serializeBuildState('Build 1', {}, {});
    const b2 = serializeBuildState('Build 2', {}, {});
    saveBuildToLocalStorage(b1);
    saveBuildToLocalStorage(b2);

    deleteSavedBuild(b1.id);
    const loaded = loadBuildsFromLocalStorage();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(b2.id);
  });

  it('renames a build by ID', () => {
    const build = serializeBuildState('Old Name', {}, {});
    saveBuildToLocalStorage(build);

    renameSavedBuild(build.id, 'New Name');
    const loaded = loadBuildsFromLocalStorage();
    expect(loaded[0].name).toBe('New Name');
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValueOnce('not-valid-json{{{');
    expect(loadBuildsFromLocalStorage()).toEqual([]);
  });
});

describe('autoSaveSession / restoreSession', () => {
  it('saves and restores current session', () => {
    const off: LoadoutMap = { primary: { id: 'acs12', name: 'ACS12', category: 'AR', rarity: 'Legendary', tier: 4, stars: 3 } };
    const def: LoadoutMap = { primary: { id: 'de50', name: 'DE.50', category: 'Sniper', rarity: 'Epic', tier: 4, stars: 5 } };

    autoSaveSession(off, def);
    const restored = restoreSession();

    expect(restored).not.toBeNull();
    expect(restored!.offLoadout.primary!.id).toBe('acs12');
    expect(restored!.defLoadout.primary!.id).toBe('de50');
  });

  it('returns null when nothing saved', () => {
    expect(restoreSession()).toBeNull();
  });

  it('sanitizes restored data (invalid items removed)', () => {
    // Manually write corrupt data
    localStorageMock.setItem('ohmm-current-session', JSON.stringify({
      schemaVersion: 1,
      offLoadout: { primary: 'not-an-object' },
      defLoadout: {},
    }));

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'ohmm-current-session') {
        return JSON.stringify({
          schemaVersion: 1,
          offLoadout: { primary: 'not-an-object' },
          defLoadout: {},
        });
      }
      return null;
    });

    const restored = restoreSession();
    expect(restored).not.toBeNull();
    // Invalid item should be sanitized out
    expect(restored!.offLoadout.primary).toBeUndefined();
  });
});
