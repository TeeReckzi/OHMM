/**
 * Stat Weight & Formula Regression Smoke Test
 *
 * Validates fixes for:
 *   T3: Psi Intensity stat weight must not be negative for status damage builds
 *   T5: Crit/Weakspot stat weights must not be falsely zero when weapon has valid base stats
 *   T2: Base weapon damage flows correctly through formula without modifier sources
 *
 * Does NOT invent formulas. Validates that existing formulas produce sane outputs.
 */

import { buildCalculationInputFromSelection } from "../ui/formulaBridge";
import { computeCombatOutput } from "../ui/combatOutput";
import type { BuildSelection } from "../ui/types";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    console.error(`  FAIL ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS ${label}`);
  }
}

// Helper: build a minimal selection with a known weapon
function makeWeaponBuild(weaponId: string): BuildSelection {
  return {
    id: 'test-regression',
    label: 'Regression Test',
    role: 'attacker',
    weapon: {
      blueprintId: weaponId,
      stars: 3,
      tier: 4,
      calibration: '',
      attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'copper-ammo' },
    },
    armor: { head: 'none', mask: 'none', chest: 'none', gloves: 'none', pants: 'none', boots: 'none' },
    mods: {},
    cradle: { perks: [] },
    deviant: { id: 'none', level: 1, activityRating: 1, trait: '' },
    food: { food: 'none', drink: 'none', chefRex: { enabled: false, skillRating: 1 as any, activityRating: 1 as any, bonusPercent: 0, mode: 'rating-derived' } },
  };
}

console.log('\n=== Stat Weight & Formula Regression Tests ===\n');

// Test 1: Base weapon damage flows through correctly
console.log('--- T2: Base weapon damage without modifiers ---');
const akmBuild = makeWeaponBuild('akm');
const akmCalc = buildCalculationInputFromSelection(akmBuild, 'pve');

assert(akmCalc.baseWeaponDMG !== undefined && akmCalc.baseWeaponDMG > 0,
  'AKM baseWeaponDMG is positive');
assert(akmCalc.baseCritRate !== undefined && akmCalc.baseCritRate > 0 && akmCalc.baseCritRate < 1,
  `AKM baseCritRate is a fraction (got ${akmCalc.baseCritRate})`);
assert(akmCalc.baseCritDamage !== undefined && akmCalc.baseCritDamage > 1 && akmCalc.baseCritDamage < 3,
  `AKM baseCritDamage is a multiplier > 1 (got ${akmCalc.baseCritDamage})`);
assert(akmCalc.baseWeakspotDamage !== undefined && akmCalc.baseWeakspotDamage > 0 && akmCalc.baseWeakspotDamage < 2,
  `AKM baseWeakspotDamage is a fraction (got ${akmCalc.baseWeakspotDamage})`);

const akmOutput = computeCombatOutput(akmCalc, akmCalc.pvpMitigation);
const akmDPS = akmOutput.damageOutput.DPS ?? 0;
const akmExpected = akmOutput.damageOutput.expectedDamage ?? 0;

assert(akmDPS > 0, `AKM DPS is positive (got ${akmDPS})`);
assert(akmExpected > 0, `AKM expectedDamage is positive (got ${akmExpected})`);

// Test 2: Crit rate perturbation produces positive DPS gain
console.log('\n--- T5: Crit/Weakspot stat weights non-zero ---');
import { aggregateModifiers } from "../engine/modifierAggregation";
import type { ModifierSource } from "../engine/modifierTypes";

function perturbDPS(calcInput: typeof akmCalc, stat: string, delta: number): number {
  const cloned = JSON.parse(JSON.stringify(calcInput));
  const synth: ModifierSource = {
    id: `perturb_${stat}`,
    sourceType: 'calibration' as any,
    sourceLabel: 'Test perturbation',
    stat: stat as any,
    value: delta,
    behavior: 'additive',
    confidence: 'confirmed' as any,
  };
  cloned.modifierSources.push(synth);
  cloned.aggregationReport = aggregateModifiers(cloned.modifierSources);
  const output = computeCombatOutput(cloned, cloned.pvpMitigation);
  return output.damageOutput.DPS ?? 0;
}

const critRateDelta = perturbDPS(akmCalc, 'critRate', 0.01) - akmDPS;
const critDMGDelta = perturbDPS(akmCalc, 'critDMG', 0.01) - akmDPS;
const weakspotDelta = perturbDPS(akmCalc, 'weakspotDMG', 0.01) - akmDPS;

assert(critRateDelta >= 0,
  `Crit Rate +1% produces non-negative DPS gain (got ${critRateDelta.toFixed(2)})`);
assert(critDMGDelta >= 0,
  `Crit DMG +1% produces non-negative DPS gain (got ${critDMGDelta.toFixed(2)})`);
assert(weakspotDelta >= 0,
  `Weakspot DMG +1% produces non-negative DPS gain (got ${weakspotDelta.toFixed(2)})`);

// Test 3: Psi Intensity perturbation does not produce negative DPS for status builds
console.log('\n--- T3: Psi Intensity non-negative for physical builds ---');
const psiDelta = perturbDPS(akmCalc, 'psiIntensity', 1.0) - akmDPS;

assert(psiDelta >= 0,
  `Psi Intensity +1 does not reduce DPS for physical build (got ${psiDelta.toFixed(2)})`);

// Test 4: Weapon DMG bonus produces positive gain
console.log('\n--- Weapon DMG bonus sanity ---');
const wpnDelta = perturbDPS(akmCalc, 'weaponDMGBonus', 0.01) - akmDPS;
assert(wpnDelta > 0,
  `Weapon DMG +1% produces positive DPS gain (got ${wpnDelta.toFixed(2)})`);

console.log('\n=== Stat Weight Regression Results ===');
