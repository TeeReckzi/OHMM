/**
 * Integration tests for the TheoryCraft Orchestrator.
 *
 * Validates:
 * - Memoization: same BuildSelection → same stat weight result
 * - Single computation: CombatOutput is passed through, not recomputed
 * - safeDerive: graceful fallback on view model errors
 *
 * **Validates: Requirements 10.2, 11.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { computeTheoryCraftState, resetStatWeightCache } from '../orchestrator';
import { computeCombatOutput } from '@/ohai/src/ui/combatOutput';
import { aggregateModifiers } from '@/ohai/src/engine/modifierAggregation';
import type { BuildSelection } from '@/ohai/src/ui/types';
import type { CalculationInput } from '@/ohai/src/ui/formulaBridge';
import type { CombatOutput } from '@/ohai/src/ui/combatOutput';
import type { PvPMitigationResult } from '@/ohai/src/ui/pvpMitigation';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

function createMinimalBuildSelection(overrides?: Partial<BuildSelection>): BuildSelection {
  return {
    id: 'test-build-1',
    label: 'Test Build',
    role: 'attacker',
    weapon: {
      blueprintId: 'test-weapon',
      stars: 3,
      tier: 3,
      calibration: 'none',
      attachments: {
        optic: 'none',
        muzzle: 'none',
        magazine: 'none',
        tactical: 'none',
        stock: 'none',
        ammo: 'none',
      },
    },
    armor: {
      head: 'test-head',
      mask: 'test-mask',
      chest: 'test-chest',
      gloves: 'test-gloves',
      pants: 'test-pants',
      boots: 'test-boots',
    },
    mods: {},
    cradle: { perks: [] },
    deviant: { id: '', level: 0, activityRating: 0, trait: '' },
    food: {
      food: '',
      drink: '',
      chefRex: {
        enabled: false,
        skillRating: 1,
        activityRating: 1,
        bonusPercent: 0,
        mode: 'rating-derived',
      },
    },
    ...overrides,
  };
}

function createMinimalPvpMitigation(): PvPMitigationResult {
  return {
    sources: [],
    totalReductionPercent: 0,
    incomingDamageExample: 1000,
    finalDamageTaken: 1000,
    pvpMode: false,
    warnings: [],
  };
}

function createMinimalCalcInput(overrides?: Partial<CalculationInput>): CalculationInput {
  const modifierSources = overrides?.modifierSources ?? [
    {
      id: 'test-weapon-dmg',
      sourceType: 'weapon',
      sourceLabel: 'Test Weapon',
      stat: 'weaponDMGBonus',
      value: 0.15,
      behavior: 'additive',
      confidence: 'verified',
    },
  ];

  const aggregationReport = aggregateModifiers(modifierSources as any);

  return {
    modifierSources: modifierSources as any,
    aggregationReport,
    pvpMitigation: createMinimalPvpMitigation(),
    conditionalEffects: [],
    uptimeProfile: 'always-on' as any,
    modeledEffects: [],
    partiallyModeledEffects: [],
    displayOnlyEffects: [],
    unresolvedEffects: [],
    ignoredEffects: [],
    formulaWarnings: [],
    partialSupportNotes: [],
    availableMechanics: [],
    buildMode: 'pve',
    enemyType: 'pve-generic',
    totalItemsConsidered: 1,
    totalModifiersExtracted: 1,
    baseWeaponDMG: 100,
    baseCritRate: 0.05,
    baseCritDamage: 0.5,
    baseWeakspotDamage: 0.6,
    baseFireRate: 600,
    ...overrides,
  } as CalculationInput;
}

function createMinimalCombatOutput(calcInput: CalculationInput): CombatOutput {
  return computeCombatOutput(calcInput, calcInput.pvpMitigation);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Orchestrator Integration Tests', () => {
  beforeEach(() => {
    resetStatWeightCache();
  });

  // ── Memoization Tests ──────────────────────────────────────────────────────

  describe('Memoization: same BuildSelection → same stat weight result', () => {
    it('returns identical stat weight entries for the same BuildSelection called twice', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();
      const combatOutput = createMinimalCombatOutput(calcInput);

      const result1 = computeTheoryCraftState(buildSelection, calcInput, combatOutput);
      const result2 = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      // Stat weights should be referentially identical (same object from cache)
      expect(result2.statWeights).toBe(result1.statWeights);
    });

    it('returns different stat weight objects after cache reset', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();
      const combatOutput = createMinimalCombatOutput(calcInput);

      const result1 = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      resetStatWeightCache();

      const result2 = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      // After reset, a new computation happens — objects are no longer referentially identical
      expect(result2.statWeights).not.toBe(result1.statWeights);
      // But the content should still be equivalent
      expect(result2.statWeights.entries).toEqual(result1.statWeights.entries);
      expect(result2.statWeights.baselineDPS).toEqual(result1.statWeights.baselineDPS);
    });

    it('recomputes stat weights when BuildSelection changes', () => {
      const buildSelection1 = createMinimalBuildSelection({ id: 'build-a' });
      const buildSelection2 = createMinimalBuildSelection({
        id: 'build-b',
        weapon: {
          blueprintId: 'different-weapon',
          stars: 5,
          tier: 5,
          calibration: 'none',
          attachments: {
            optic: 'none',
            muzzle: 'none',
            magazine: 'none',
            tactical: 'none',
            stock: 'none',
            ammo: 'none',
          },
        },
      });

      const calcInput = createMinimalCalcInput();
      const combatOutput = createMinimalCombatOutput(calcInput);

      const result1 = computeTheoryCraftState(buildSelection1, calcInput, combatOutput);
      const result2 = computeTheoryCraftState(buildSelection2, calcInput, combatOutput);

      // Different build selections → stat weights are not referentially identical
      expect(result2.statWeights).not.toBe(result1.statWeights);
    });
  });

  // ── Single Computation Tests ───────────────────────────────────────────────

  describe('Single computation: CombatOutput passed through, not recomputed', () => {
    it('output reflects the passed-in combatOutput DPS in hero metrics', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();
      const combatOutput = createMinimalCombatOutput(calcInput);

      const state = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      // Hero metrics should reflect the DPS from the provided combatOutput
      const dpsMetric = state.heroMetrics.metrics.find(m => m.id === 'dps');
      expect(dpsMetric).toBeDefined();

      // If combatOutput has a valid DPS, it should be reflected in the metric
      if (combatOutput.damageOutput.DPS !== undefined && combatOutput.damageOutput.DPS > 0) {
        expect(dpsMetric!.numericValue).toBeGreaterThan(0);
      }
    });

    it('stat weights use the passed-in combatOutput as baseline', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();
      const combatOutput = createMinimalCombatOutput(calcInput);

      const state = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      // The stat weight baselineDPS should match the combatOutput DPS
      const expectedDPS = combatOutput.damageOutput.DPS ?? 0;
      if (expectedDPS > 0) {
        expect(state.statWeights.baselineDPS).toBe(expectedDPS);
        expect(state.statWeights.isComputable).toBe(true);
      }
    });

    it('returns all five view model sections in the result', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();
      const combatOutput = createMinimalCombatOutput(calcInput);

      const state = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      expect(state.heroMetrics).toBeDefined();
      expect(state.formulaExplainer).toBeDefined();
      expect(state.setBonusTracker).toBeDefined();
      expect(state.statWeights).toBeDefined();
      expect(state.lastComputedAt).toBeGreaterThan(0);
      // buildComparison is null when no savedBuild provided
      expect(state.buildComparison).toBeNull();
    });

    it('buildMode propagates from combatOutput to heroMetrics', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput({ buildMode: 'pve' });
      const combatOutput = createMinimalCombatOutput(calcInput);

      const state = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      expect(state.heroMetrics.buildMode).toBe('pve');
    });
  });

  // ── safeDerive Tests ───────────────────────────────────────────────────────

  describe('safeDerive: graceful fallback on view model errors', () => {
    it('returns complete TheoryCraftState even with null combatOutput', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();

      // Pass null as combatOutput — this will cause derive functions to fail
      const state = computeTheoryCraftState(
        buildSelection,
        calcInput,
        null as unknown as CombatOutput,
      );

      // Should still return a complete state with fallback values
      expect(state).toBeDefined();
      expect(state.heroMetrics).toBeDefined();
      expect(state.formulaExplainer).toBeDefined();
      expect(state.setBonusTracker).toBeDefined();
      expect(state.statWeights).toBeDefined();
      expect(state.lastComputedAt).toBeGreaterThan(0);
    });

    it('returns complete TheoryCraftState with undefined calcInput', () => {
      const buildSelection = createMinimalBuildSelection();
      const combatOutput: CombatOutput = {
        damageOutput: {
          baseDamage: 100,
          expectedDamage: 150,
          critMultiplier: 1.5,
          weakspotMultiplier: 1.6,
          totalMultiplier: 2.4,
          DPS: 1500,
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
          duelPressure: 'Unknown',
        },
        warnings: [],
        assumptions: [],
        buildMode: 'pve',
        incomingDPSProvided: false,
        targetHealthProvided: false,
        officialFormula: {
          status: 'metadata-only' as any,
          warnings: [],
          officialDamageAvailable: false,
          unresolvedLeaves: [],
          accuracyNote: 'Not validated',
        },
      };

      // Pass undefined calcInput — derive functions that need it should fall back
      const state = computeTheoryCraftState(
        buildSelection,
        undefined as unknown as CalculationInput,
        combatOutput,
      );

      expect(state).toBeDefined();
      expect(state.heroMetrics).toBeDefined();
      expect(state.formulaExplainer).toBeDefined();
      expect(state.setBonusTracker).toBeDefined();
      expect(state.statWeights).toBeDefined();
      expect(state.lastComputedAt).toBeGreaterThan(0);
    });

    it('hero metrics falls back to safe defaults with corrupted combatOutput', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput();

      // Construct a combatOutput with all NaN/undefined values
      const corruptedOutput: CombatOutput = {
        damageOutput: {
          baseDamage: NaN,
          expectedDamage: NaN,
          critMultiplier: NaN,
          weakspotMultiplier: NaN,
          totalMultiplier: NaN,
          DPS: undefined,
          tickIntervalSeconds: undefined,
          ticksPerSecond: undefined,
        },
        survivability: {
          damageTakenMultiplier: NaN,
          effectiveHealthMultiplier: Infinity,
          effectiveHealth: undefined,
          incomingDamageAfterMitigation: undefined,
          shotsToDie: undefined,
          survivabilityGainPercent: NaN,
        },
        pvpDuel: {
          outgoingTTK: undefined,
          incomingTTK: undefined,
          duelPressure: 'Unknown',
        },
        warnings: [],
        assumptions: [],
        buildMode: 'pve',
        incomingDPSProvided: false,
        targetHealthProvided: false,
        officialFormula: {
          status: 'metadata-only' as any,
          warnings: [],
          officialDamageAvailable: false,
          unresolvedLeaves: [],
          accuracyNote: 'Not validated',
        },
      };

      const state = computeTheoryCraftState(buildSelection, calcInput, corruptedOutput);

      // Orchestrator should not crash — all sections present
      expect(state.heroMetrics).toBeDefined();
      expect(state.heroMetrics.metrics).toBeDefined();
      expect(Array.isArray(state.heroMetrics.metrics)).toBe(true);

      // No metric value should contain forbidden strings
      for (const metric of state.heroMetrics.metrics) {
        expect(metric.value).not.toContain('NaN');
        expect(metric.value).not.toContain('undefined');
        expect(metric.value).not.toContain('Infinity');
      }
    });

    it('stat weights gracefully handles zero-DPS baseline', () => {
      const buildSelection = createMinimalBuildSelection();
      const calcInput = createMinimalCalcInput({ baseWeaponDMG: 0, baseFireRate: 0 });
      const combatOutput: CombatOutput = {
        damageOutput: {
          baseDamage: 0,
          expectedDamage: 0,
          critMultiplier: 1,
          weakspotMultiplier: 1,
          totalMultiplier: 1,
          DPS: 0,
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
          duelPressure: 'Unknown',
        },
        warnings: [],
        assumptions: [],
        buildMode: 'pve',
        incomingDPSProvided: false,
        targetHealthProvided: false,
        officialFormula: {
          status: 'metadata-only' as any,
          warnings: [],
          officialDamageAvailable: false,
          unresolvedLeaves: [],
          accuracyNote: 'Not validated',
        },
      };

      const state = computeTheoryCraftState(buildSelection, calcInput, combatOutput);

      // Stat weights should fall back to non-computable state
      expect(state.statWeights).toBeDefined();
      expect(state.statWeights.isComputable).toBe(false);
      expect(state.statWeights.entries).toHaveLength(0);
    });
  });
});
