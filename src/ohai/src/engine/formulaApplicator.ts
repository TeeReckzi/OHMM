import type {
  FormulaInput,
  FormulaResult,
  FormulaMultiplierBreakdown,
  FormulaFamily,
  BurnDetails,
  DamageModelHypothesis,
} from "./formulaTypes";
import {
  computeExpectedCritMultiplier,
  computeExpectedWeakspotMultiplier,
  computeCombinedCritWeakspotMultiplier,
} from "./formulaTypes";
import { calculateOfficialPhysicalDamage } from "./officialFormulaBridge";

const BURN_PSI_DAMAGE_PER_STACK_FACTOR = 0.12;

function snapshotBehavior(input: FormulaInput): FormulaResult["effectiveBehavior"] {
  const eb = input.effectiveBehavior;
  return {
    canCrit: eb.canCrit,
    canWeakspot: eb.canWeakspot,
    critWeakspotBucket: eb.critWeakspotBucket,
    damageScalingBucket: eb.damageScalingBucket,
    scalingStat: eb.scalingStat,
    vulnerabilityType: eb.vulnerabilityType,
    baseFactor: eb.baseFactor,
    appliedOverrides: eb.appliedOverrides
      .filter((ao) => ao.wasApplied)
      .map((ao) => ao.override.overrideId),
  };
}

/**
 * Maps mechanic IDs to their override key for damage model hypothesis selection.
 */
function mechanicIdToOverrideKey(mechanicId: string): "frostVortex" | "powerSurge" | "ebrFireRing" | undefined {
  switch (mechanicId) {
    case "frostVortex":
    case "frostVortexSingleHit":
      return "frostVortex";
    case "powerSurge":
    case "powerSurgeHybrid":
      return "powerSurge";
    case "ebr_fire_ring":
      return "ebrFireRing";
    default:
      return undefined;
  }
}

/**
 * Maps a damage model hypothesis to its corresponding formula family.
 * Returns undefined if the hypothesis has no implemented formula yet.
 */
function hypothesisToFormulaFamily(hypothesis: DamageModelHypothesis): FormulaFamily | undefined {
  switch (hypothesis) {
    case "frost-vortex-DoT-tick": return "status_tick_damage";
    case "power-surge-DoT-tick": return "status_tick_damage";
    // The following hypotheses have no implemented formula yet
    case "frost-vortex-single-hit": return undefined;
    case "power-surge-hybrid": return undefined;
    case "ebr-fire-ring-provisional": return undefined;
  }
}

function detectFormulaFamily(input: FormulaInput): FormulaFamily {
  const eb = input.effectiveBehavior;

  if (eb.formulaTemplateId === "burn_stack_dot") return "burn_stack_dot";
  if (eb.formulaTemplateId === "charged_status_damage_current_patch") return "charged_status_damage";
  if (eb.formulaTemplateId === "deviation_skill_damage_current_patch") return "deviation_skill_damage";
  if (eb.formulaTemplateId === "physical_weapon_damage_current_patch") return "physical_weapon_damage";

  if (eb.damageScalingBucket === "deviation") return "deviation_skill_damage";
  if (eb.damageScalingBucket === "weapon") return "physical_weapon_damage";
  if (eb.damageScalingBucket === "status" && eb.displayBehavior === "charged_shot") return "charged_status_damage";
  if (eb.damageScalingBucket === "status") return "status_tick_damage";

  // Check for damage model override on unsupported mechanics
  const overrideKey = mechanicIdToOverrideKey(input.mechanicId);
  if (overrideKey && input.damageModelOverride) {
    const overrideHypothesis = input.damageModelOverride[overrideKey];
    if (overrideHypothesis) {
      const family = hypothesisToFormulaFamily(overrideHypothesis);
      if (family) return family;
    }
  }

  return "unsupported";
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function applyStatusTickDamage(input: FormulaInput): FormulaResult {
  const eb = input.effectiveBehavior;
  const baseFactor = eb.baseFactor ?? 1.0;
  const psi = input.psiIntensity ?? 0;

  const baseDamage = psi * baseFactor;

  const multipliers: FormulaMultiplierBreakdown[] = [];
  let product = 1.0;

  const addMult = (label: string, mult: number, source: string) => {
    if (mult === 1.0) return;
    multipliers.push({ label, multiplier: round2(mult), source });
    product *= mult;
  };

  addMult("Status DMG Bonus", 1 + (input.statusDMGBonus ?? 0),
    `player stat: statusDMGBonus=${(input.statusDMGBonus ?? 0).toFixed(3)}`);
  addMult("Elemental DMG Bonus", 1 + (input.elementalDMGBonus ?? 0),
    `player stat: elementalDMGBonus=${(input.elementalDMGBonus ?? 0).toFixed(3)}`);
  addMult("Keyword/Suffix DMG Bonus", 1 + (input.keywordSuffixDMGBonus ?? 0),
    `player stat: keywordSuffixDMGBonus=${(input.keywordSuffixDMGBonus ?? 0).toFixed(3)}`);
  addMult("Status Vulnerability", 1 + (input.statusVulnerability ?? 0),
    `behavior.vulnerabilityType=${eb.vulnerabilityType}, statusVulnerability=${(input.statusVulnerability ?? 0).toFixed(3)}`);
  addMult("Enemy Type DMG Bonus", 1 + (input.enemyTypeDMGBonus ?? 0),
    `player stat: enemyTypeDMGBonus=${(input.enemyTypeDMGBonus ?? 0).toFixed(3)}`);

  const critMult = computeExpectedCritMultiplier(input.critRate ?? 0, input.critDMG ?? 1.0, eb.canCrit);
  const wsMult = computeExpectedWeakspotMultiplier(input.weakspotDMG ?? 0, eb.canWeakspot);
  const critLabel = `Crit Multiplier (canCrit=${eb.canCrit}, cr=${(input.critRate ?? 0).toFixed(2)}×cd=${(input.critDMG ?? 1.0).toFixed(2)})`;
  const wsLabel = `Weakspot Multiplier (canWeakspot=${eb.canWeakspot})`;
  addMult("Crit Modifier", critMult, critLabel);
  addMult("Weakspot Modifier", wsMult, wsLabel);

  const expectedDamage = baseDamage * product;

  return {
    mechanicId: input.mechanicId,
    formulaFamily: "status_tick_damage",
    formulaTemplateId: eb.formulaTemplateId,
    baseDamage: round2(baseDamage),
    expectedDamage: round2(expectedDamage),
    expectedCritMultiplier: round2(critMult),
    expectedWeakspotMultiplier: round2(wsMult),
    multipliers,
    effectiveBehavior: snapshotBehavior(input),
    warnings: [],
    explanation: [],
  };
}

function applyBurnStackDotDamage(input: FormulaInput): FormulaResult {
  const eb = input.effectiveBehavior;
  const psi = input.psiIntensity ?? 0;
  const stacks = input.currentStacks ?? 1;
  const factor = BURN_PSI_DAMAGE_PER_STACK_FACTOR;
  const flatBonus = input.flatBurnBonus ?? 0;
  const baseTickInterval = eb.tickIntervalSeconds ?? 0.5;
  const freqMult = input.tickFrequencyMultiplier ?? 1.0;

  const basePerStack = psi * factor;
  const stackContrib = (basePerStack + flatBonus) * stacks;
  const baseDamage = round2(stackContrib);

  const multipliers: FormulaMultiplierBreakdown[] = [];
  let product = 1.0;

  const addMult = (label: string, mult: number, source: string) => {
    if (mult === 1.0) return;
    multipliers.push({ label, multiplier: round2(mult), source });
    product *= mult;
  };

  addMult("Status DMG Bonus", 1 + (input.statusDMGBonus ?? 0),
    `player stat: statusDMGBonus=${(input.statusDMGBonus ?? 0).toFixed(3)}`);
  addMult("Elemental DMG Bonus", 1 + (input.elementalDMGBonus ?? 0),
    `player stat: elementalDMGBonus=${(input.elementalDMGBonus ?? 0).toFixed(3)}`);
  addMult("Keyword/Suffix DMG Bonus", 1 + (input.keywordSuffixDMGBonus ?? 0),
    `player stat: keywordSuffixDMGBonus=${(input.keywordSuffixDMGBonus ?? 0).toFixed(3)}`);

  const humanDmg = input.humanDamageBonus ?? 0;
  addMult("Human Damage Bonus", 1 + humanDmg,
    `player stat: humanDamageBonus=${humanDmg.toFixed(3)}`);

  const dotResist = input.dotResistanceReduction ?? 0;
  const dotResistMult = 1 - dotResist;
  if (dotResist > 0) {
    addMult("DoT Resistance", dotResistMult,
      `target stat: dotResistanceReduction=${dotResist.toFixed(3)}`);
  }

  const burnResistLevel = input.burnResistanceDebuffLevel ?? 0;
  const burnResistReduction = burnResistLevel * 0.15;
  const burnResistMult = 1 - burnResistReduction;
  if (burnResistLevel > 0) {
    addMult("Burn Resistance Debuff", burnResistMult,
      `target stat: burnResistanceDebuffLevel=${burnResistLevel} × 0.15`);
  }

  addMult("Status Vulnerability", 1 + (input.statusVulnerability ?? 0),
    `behavior.vulnerabilityType=${eb.vulnerabilityType}, statusVulnerability=${(input.statusVulnerability ?? 0).toFixed(3)}`);
  addMult("Enemy Type DMG Bonus", 1 + (input.enemyTypeDMGBonus ?? 0),
    `player stat: enemyTypeDMGBonus=${(input.enemyTypeDMGBonus ?? 0).toFixed(3)}`);

  const critMult = computeExpectedCritMultiplier(input.critRate ?? 0, input.critDMG ?? 1.0, eb.canCrit);
  const wsMult = computeExpectedWeakspotMultiplier(input.weakspotDMG ?? 0, eb.canWeakspot);
  const critLabel = `Crit Multiplier (canCrit=${eb.canCrit}, cr=${(input.critRate ?? 0).toFixed(2)}×cd=${(input.critDMG ?? 1.0).toFixed(2)})`;
  const wsLabel = `Weakspot Multiplier (canWeakspot=${eb.canWeakspot})`;
  addMult("Crit Modifier", critMult, critLabel);
  addMult("Weakspot Modifier", wsMult, wsLabel);

  const perTickDamage = baseDamage * product;
  const effectiveTickInterval = baseTickInterval / freqMult;
  const ticksPerSec = 1 / effectiveTickInterval;
  const dps = perTickDamage * ticksPerSec;

  const burnDetails: BurnDetails = {
    stacks,
    maxStacks: eb.maxStacks ?? 5,
    damagePerStackFactor: factor,
    basePerStack: round2(basePerStack),
    stackContribution: round2(stackContrib),
    flatBonusApplied: flatBonus,
    perTickDamage: round2(perTickDamage),
    baseTickIntervalSeconds: baseTickInterval,
    tickFrequencyMultiplier: round2(freqMult),
    effectiveTickIntervalSeconds: round2(effectiveTickInterval),
    ticksPerSecond: round2(ticksPerSec),
    damagePerSecond: round2(dps),
    dotResistanceApplied: dotResist,
    burnResistanceApplied: burnResistReduction,
    frequencyBonus: round2(freqMult - 1),
  };

  return {
    mechanicId: input.mechanicId,
    formulaFamily: "burn_stack_dot",
    formulaTemplateId: eb.formulaTemplateId,
    baseDamage: round2(baseDamage),
    expectedDamage: round2(perTickDamage),
    expectedCritMultiplier: round2(critMult),
    expectedWeakspotMultiplier: round2(wsMult),
    multipliers,
    effectiveBehavior: snapshotBehavior(input),
    warnings: ["Burn DoT now uses PSI Intensity scaling. Legacy weapon-DMG Burn model was removed from active calculation."],
    explanation: [],
    burnDetails,
  };
}

function applyChargedStatusDamage(input: FormulaInput): FormulaResult {
  const eb = input.effectiveBehavior;
  const baseFactor = eb.baseFactor ?? 1.0;
  const psi = input.psiIntensity ?? 0;

  const baseDamage = psi * baseFactor;

  const multipliers: FormulaMultiplierBreakdown[] = [];
  let product = 1.0;

  const addMult = (label: string, mult: number, source: string) => {
    if (mult === 1.0) return;
    multipliers.push({ label, multiplier: round2(mult), source });
    product *= mult;
  };

  addMult("Elemental DMG Bonus", 1 + (input.elementalDMGBonus ?? 0),
    `player stat: elementalDMGBonus=${(input.elementalDMGBonus ?? 0).toFixed(3)}`);
  addMult("Status DMG Bonus", 1 + (input.statusDMGBonus ?? 0),
    `player stat: statusDMGBonus=${(input.statusDMGBonus ?? 0).toFixed(3)}`);
  addMult("Keyword/Suffix DMG Bonus", 1 + (input.keywordSuffixDMGBonus ?? 0),
    `player stat: keywordSuffixDMGBonus=${(input.keywordSuffixDMGBonus ?? 0).toFixed(3)}`);

  const combinedMult = computeCombinedCritWeakspotMultiplier(
    input.critRate ?? 0,
    input.critDMG ?? 1.0,
    input.weakspotDMG ?? 0,
    eb.canCrit,
    eb.canWeakspot
  );
  const critContrib = eb.canCrit ? (input.critRate ?? 0) * ((input.critDMG ?? 1.0) - 1) : 0;
  const wsContrib = eb.canWeakspot ? (input.weakspotDMG ?? 0) : 0;
  addMult("Crit + Weakspot (additive)", combinedMult,
    `canCrit=${eb.canCrit} contribution=${critContrib.toFixed(4)} + canWeakspot=${eb.canWeakspot} contribution=${wsContrib.toFixed(4)}, bucket=${eb.critWeakspotBucket}`);

  addMult("Status Vulnerability", 1 + (input.statusVulnerability ?? 0),
    `behavior.vulnerabilityType=${eb.vulnerabilityType}, statusVulnerability=${(input.statusVulnerability ?? 0).toFixed(3)}`);
  addMult("Enemy Type DMG Bonus", 1 + (input.enemyTypeDMGBonus ?? 0),
    `player stat: enemyTypeDMGBonus=${(input.enemyTypeDMGBonus ?? 0).toFixed(3)}`);

  const expectedDamage = baseDamage * product;

  return {
    mechanicId: input.mechanicId,
    formulaFamily: "charged_status_damage",
    formulaTemplateId: eb.formulaTemplateId,
    baseDamage: round2(baseDamage),
    expectedDamage: round2(expectedDamage),
    expectedCritMultiplier: round2(combinedMult),
    expectedWeakspotMultiplier: round2(computeExpectedWeakspotMultiplier(input.weakspotDMG ?? 0, eb.canWeakspot)),
    multipliers,
    effectiveBehavior: snapshotBehavior(input),
    warnings: [],
    explanation: [],
  };
}

function applyPhysicalWeaponDamage(input: FormulaInput): FormulaResult {
  const eb = input.effectiveBehavior;
  const baseWpn = input.baseWeaponDMG ?? 0;
  const atkPct = input.attackPercent ?? 0;

  const baseDamage = baseWpn * (1 + atkPct);

  const multipliers: FormulaMultiplierBreakdown[] = [];
  let product = 1.0;

  const addMult = (label: string, mult: number, source: string) => {
    if (mult === 1.0) return;
    multipliers.push({ label, multiplier: round2(mult), source });
    product *= mult;
  };

  addMult("Weapon DMG Bonus", 1 + (input.weaponDMGBonus ?? 0),
    `player stat: weaponDMGBonus=${(input.weaponDMGBonus ?? 0).toFixed(3)}`);

  const combinedMult = computeCombinedCritWeakspotMultiplier(
    input.critRate ?? 0,
    input.critDMG ?? 1.0,
    input.weakspotDMG ?? 0,
    eb.canCrit,
    eb.canWeakspot
  );
  const critContrib = eb.canCrit ? (input.critRate ?? 0) * ((input.critDMG ?? 1.0) - 1) : 0;
  const wsContrib = eb.canWeakspot ? (input.weakspotDMG ?? 0) : 0;
  addMult("Crit + Weakspot (additive)", combinedMult,
    `canCrit=${eb.canCrit} contribution=${critContrib.toFixed(4)} + canWeakspot=${eb.canWeakspot} contribution=${wsContrib.toFixed(4)}`);

  addMult("Weapon Vulnerability", 1 + (input.weaponVulnerability ?? 0),
    `behavior.vulnerabilityType=${eb.vulnerabilityType}, weaponVulnerability=${(input.weaponVulnerability ?? 0).toFixed(3)}`);
  addMult("Enemy Type DMG Bonus", 1 + (input.enemyTypeDMGBonus ?? 0),
    `player stat: enemyTypeDMGBonus=${(input.enemyTypeDMGBonus ?? 0).toFixed(3)}`);

  const expectedDamage = baseDamage * product;

  return {
    mechanicId: input.mechanicId,
    formulaFamily: "physical_weapon_damage",
    formulaTemplateId: eb.formulaTemplateId,
    baseDamage: round2(baseDamage),
    expectedDamage: round2(expectedDamage),
    expectedCritMultiplier: round2(combinedMult),
    expectedWeakspotMultiplier: round2(computeExpectedWeakspotMultiplier(input.weakspotDMG ?? 0, eb.canWeakspot)),
    multipliers,
    effectiveBehavior: snapshotBehavior(input),
    warnings: [],
    explanation: [],
  };
}

function applyDeviationSkillDamage(input: FormulaInput): FormulaResult {
  const eb = input.effectiveBehavior;
  const baseFactor = eb.baseFactor ?? 1.0;
  const psi = input.psiIntensity ?? 0;

  const expectedDamage = psi * baseFactor;

  const multipliers: FormulaMultiplierBreakdown[] = [];
  if (baseFactor !== 1.0) {
    multipliers.push({
      label: "Base Factor",
      multiplier: round2(baseFactor),
      source: `behavior.baseFactor=${baseFactor}`,
    });
  }

  return {
    mechanicId: input.mechanicId,
    formulaFamily: "deviation_skill_damage",
    formulaTemplateId: eb.formulaTemplateId,
    baseDamage: round2(psi),
    expectedDamage: round2(expectedDamage),
    expectedCritMultiplier: 1.0,
    expectedWeakspotMultiplier: 1.0,
    multipliers,
    effectiveBehavior: snapshotBehavior(input),
    warnings: [],
    explanation: [],
  };
}

export function calculateExpectedDamage(input: FormulaInput): FormulaResult {
  const family = detectFormulaFamily(input);

  let result: FormulaResult;

  switch (family) {
    case "burn_stack_dot":
      result = applyBurnStackDotDamage(input);
      break;
    case "status_tick_damage":
      result = applyStatusTickDamage(input);
      break;
    case "charged_status_damage":
      result = applyChargedStatusDamage(input);
      break;
    case "physical_weapon_damage": {
      const playerStatsFromInput: Partial<Record<string, number>> = {
        elementalDMGBonus: input.elementalDMGBonus ?? 0,
        weaponDMGBonus: input.weaponDMGBonus ?? 0,
        enemyTypeDMGBonus: input.enemyTypeDMGBonus ?? 0,
        humanDamageBonus: input.humanDamageBonus ?? 0,
      };
      const officialResult = calculateOfficialPhysicalDamage(input, playerStatsFromInput);
      if (officialResult) {
        result = officialResult;
      } else {
        result = applyPhysicalWeaponDamage(input);
      }
      break;
    }
    case "deviation_skill_damage":
      result = applyDeviationSkillDamage(input);
      break;
    default: {
      const eb = input.effectiveBehavior;
      result = {
        mechanicId: input.mechanicId,
        formulaFamily: "unsupported",
        formulaTemplateId: eb.formulaTemplateId,
        baseDamage: 0,
        expectedDamage: 0,
        expectedCritMultiplier: 1.0,
        expectedWeakspotMultiplier: 1.0,
        multipliers: [],
        effectiveBehavior: snapshotBehavior(input),
        warnings: [`Unsupported formula family for mechanic "${input.mechanicId}" (bucket=${eb.damageScalingBucket}, display=${eb.displayBehavior})`],
        explanation: [],
      };
      break;
    }
  }

  if (result.formulaFamily !== "unsupported") {
    const eb = input.effectiveBehavior;
    if (eb.needsRetest) {
      result.warnings.push(
        `⚠ Mechanic "${input.mechanicId}" metadata marked needsRetest=true. Formula values are provisional.`
      );
    }
  }

  if (result.formulaFamily !== "unsupported") {
    const eb = input.effectiveBehavior;
    if (eb.appliedOverrides.length > 0) {
      const changed = eb.appliedOverrides.filter((ao) => ao.wasApplied);
      for (const ao of changed) {
        const gn = ao.override.sourceGearName;
        result.warnings.push(
          `Override "${ao.override.overrideId}" from ${gn} applied to "${input.mechanicId}".`
        );
      }
    }
  }

  return result;
}
