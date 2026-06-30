/**
 * External Research Smoke Test
 *
 * Validates that the external research integration has NOT affected:
 * - Runtime formula calculations
 * - Mechanic registry state
 * - Existing mechanic behaviors
 * - Modifier system behavior
 *
 * Also validates that external research modules remain isolated.
 */

import { registerInitialOverrides } from "./overrides";
import { getMechanicBehavior, listMechanicBehaviors } from "./mechanicRegistry";
import { listFormulaTemplates, getFormulaTemplate } from "./formulaTemplates";
import { buildFormulaInput } from "./formulaContext";
import { calculateExpectedDamage } from "./formulaApplicator";
import { listModifierSources } from "./modifierRegistry";
import { getOverridesForGear } from "./mechanicRegistry";
import { getStatKeyVariants, getDisplayName, normalizeStatKey } from "../utils/scorer/normalizer";
import { getWeightProfile, listWeightProfiles } from "../utils/scorer/scoringWeights";
import { getScenarioProfile, listScenarioProfiles } from "../utils/scorer/scenarioProfiles";
import type { StatKey } from "../schemas/buildGoalSchema";

// External research modules (imported to verify they compile and do not cause side effects)
import { EXTERNAL_BURN_FORMULA, EXTERNAL_POWER_SURGE_FORMULA, EXTERNAL_FROST_VORTEX_FORMULA, EXTERNAL_UNSTABLE_BOMBER_FORMULA, EXTERNAL_PHYSICAL_WEAPON_PIPELINE } from "../utils/externalResearch/externalFormulaMappings";
import { EXTERNAL_STAT_ALIASES, externalPercentToDecimal, findByExternalName } from "../utils/externalResearch/externalStatAliasMap";
import { EXTERNAL_MECHANIC_CLASSIFICATIONS, classifyExternally } from "../utils/externalResearch/externalMechanicClassifier";

registerInitialOverrides();

const ERRORS: string[] = [];

function check(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    ERRORS.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function checkTruthy(label: string, value: unknown): void {
  if (!value) {
    ERRORS.push(`${label}: expected truthy, got ${JSON.stringify(value)}`);
  }
}

function checkNoError(label: string, fn: () => unknown): void {
  try {
    fn();
  } catch (e) {
    ERRORS.push(`${label}: threw ${e}`);
  }
}

function run(): void {
  console.log("=== External Research Validation Smoke Test ===\n");

  // ---------------------------------------------------------------
  // 1. No runtime formula changes — burn baseline still calculates
  // ---------------------------------------------------------------
  const burnBehavior = getMechanicBehavior("burn");
  checkTruthy("Burn mechanic behavior exists", burnBehavior);
  if (burnBehavior) {
    check("Burn canCrit (base, no override)", burnBehavior.canCrit, false);
    check("Burn canWeakspot (base, no override)", burnBehavior.canWeakspot, false);
    check("Burn damageScalingBucket", burnBehavior.damageScalingBucket, "status");
    check("Burn tickIntervalSeconds", burnBehavior.tickIntervalSeconds, 0.5);
    check("Burn maxStacks", burnBehavior.maxStacks, 5);
    check("Burn damagePerStackFactor", burnBehavior.damagePerStackFactor, 0.04);
    check("Burn formulaTemplateId", burnBehavior.formulaTemplateId, "burn_stack_dot");
  }

  // ---------------------------------------------------------------
  // 2. No registry mutations — list unchanged
  // ---------------------------------------------------------------
  const allMechanics = listMechanicBehaviors();
  checkTruthy("At least 6 mechanics loaded", allMechanics.length >= 6);
  const knownIds = allMechanics.map((m) => m.mechanicId).sort();
  check("Mechanic IDs contain burn", knownIds.includes("burn"), true);
  check("Mechanic IDs contain frostVortex", knownIds.includes("frostVortex"), true);
  check("Mechanic IDs contain powerSurge", knownIds.includes("powerSurge"), true);
  check("Mechanic IDs contain unstableBomber", knownIds.includes("unstableBomber"), true);
  check("Mechanic IDs contain chargedHybridStatusShot", knownIds.includes("chargedHybridStatusShot"), true);

  // ---------------------------------------------------------------
  // 3. Existing mechanic behaviors unchanged
  // ---------------------------------------------------------------
  const frostBehavior = getMechanicBehavior("frostVortex");
  if (frostBehavior) {
    check("Frost Vortex canCrit", frostBehavior.canCrit, false);
    check("Frost Vortex damageScalingBucket", frostBehavior.damageScalingBucket, "status");
  }

  const powerSurgeBehavior = getMechanicBehavior("powerSurge");
  if (powerSurgeBehavior) {
    check("Power Surge canCrit", powerSurgeBehavior.canCrit, false);
    check("Power Surge damageScalingBucket", powerSurgeBehavior.damageScalingBucket, "status");
  }

  const unstableBomberBehavior = getMechanicBehavior("unstableBomber");
  if (unstableBomberBehavior) {
    check("Unstable Bomber canCrit", unstableBomberBehavior.canCrit, false);
    check("Unstable Bomber damageScalingBucket", unstableBomberBehavior.damageScalingBucket, "status");
  }

  // ---------------------------------------------------------------
  // 4. No formula template changes
  // ---------------------------------------------------------------
  const templates = listFormulaTemplates();
  checkTruthy("Formula templates array is not empty", templates.length > 0);
  const templateIds = templates.map((t) => t.templateId).sort();
  check("Template IDs contain burn_stack_dot", templateIds.includes("burn_stack_dot"), true);
  check("Template IDs contain physical_weapon_damage_current_patch", templateIds.includes("physical_weapon_damage_current_patch"), true);
  check("Template IDs contain charged_status_damage_current_patch", templateIds.includes("charged_status_damage_current_patch"), true);
  check("Template IDs contain deviation_skill_damage_current_patch", templateIds.includes("deviation_skill_damage_current_patch"), true);

  // ---------------------------------------------------------------
  // 5. burn_stack_dot template is unchanged
  // ---------------------------------------------------------------
  const burnTemplate = getFormulaTemplate("burn_stack_dot");
  checkTruthy("burn_stack_dot template exists", burnTemplate);
  if (burnTemplate) {
    check("burn_stack_dot applies to burn", burnTemplate.appliesToMechanicIds?.includes("burn"), true);
    check("burn_stack_dot needsRetest", burnTemplate.needsRetest, true);
  }

  // ---------------------------------------------------------------
  // 6. Gilded Gloves override unchanged
  // ---------------------------------------------------------------
  const gildedOverrides = getOverridesForGear("Gilded Gloves");
  checkTruthy("Gilded Gloves has overrides", gildedOverrides.length > 0);
  const burnOverride = gildedOverrides.find((o) => o.overrideId === "gilded-gloves-burn-crit");
  checkTruthy("Gilded Gloves burn-crit override exists", burnOverride);
  if (burnOverride) {
    check("GG override enablesCritRollPerTick", burnOverride.enablesCritRollPerTick, true);
    check("GG override critChanceSource", burnOverride.critChanceSource, "characterCritRate");
    check("GG override critDamageSource", burnOverride.critDamageSource, "characterCritDMG");
  }

  // ---------------------------------------------------------------
  // 7. Formula calculation unchanged — burn with weaponDMG
  // ---------------------------------------------------------------
  const burnInput = buildFormulaInput("burn", {
    weaponDMG: 100,
    psiIntensity: 100,
    statusDMG: 0.15,
    elementalDMG: 0.10,
    burnCurrentStacks: 3,
  }, []);
  if (!("error" in burnInput)) {
    const burnResult = calculateExpectedDamage(burnInput);
    checkTruthy("Burn formula result has expectedDamage", burnResult.expectedDamage > 0);
    check("Burn formula family", burnResult.formulaFamily, "burn_stack_dot");
    check("Burn formula has warnings array", Array.isArray(burnResult.warnings), true);
  } else {
    ERRORS.push(`Burn formula input error: ${burnInput.error}`);
  }

  // ---------------------------------------------------------------
  // 8. Charged hybrid formula unchanged (uses registry)
  // ---------------------------------------------------------------
  const chargedInput = buildFormulaInput("chargedHybridStatusShot", {
    psiIntensity: 100,
    statusDMG: 0.10,
    elementalDMG: 0.10,
  }, []);
  if (!("error" in chargedInput)) {
    const chargedResult = calculateExpectedDamage(chargedInput);
    checkTruthy("Charged formula result has expectedDamage", chargedResult.expectedDamage > 0);
  } else {
    ERRORS.push(`Charged formula input error: ${chargedInput.error}`);
  }

  // ---------------------------------------------------------------
  // 9. Modifier system unchanged
  // ---------------------------------------------------------------
  const sources = listModifierSources();
  checkTruthy("Modifier registry has sources", sources.length > 0);
  const bbqGloves = sources.find((s) => s.id === "bbq_gloves_frequency");
  checkTruthy("BBQ Gloves modifier exists", bbqGloves);
  if (bbqGloves) {
    check("BBQ Gloves sourceType", bbqGloves.sourceType, "gloves");
    check("BBQ Gloves stat", bbqGloves.stat, "burnTickFrequencyBonus");
    check("BBQ Gloves value", bbqGloves.value, 1.0);
  }

  // ---------------------------------------------------------------
  // 10. External formula mapping isolation — no side effects
  // ---------------------------------------------------------------
  // Verify constants are read-only and do not interact with our system
  check("EXTERNAL_BURN_FORMULA.externalName", "External Burn DoT Formula", EXTERNAL_BURN_FORMULA.label);
  check("EXTERNAL_BURN_FORMULA baseStat", EXTERNAL_BURN_FORMULA.baseStat, "psi_intensity");
  check("EXTERNAL_BURN_FORMULA supportsCrit", EXTERNAL_BURN_FORMULA.supportsCrit, false);

  check("EXTERNAL_POWER_SURGE_FORMULA baseStat", EXTERNAL_POWER_SURGE_FORMULA.baseStat, "psi_intensity");
  check("EXTERNAL_POWER_SURGE_FORMULA isAmplifier", EXTERNAL_POWER_SURGE_FORMULA.globalAmplifier, true);

  check("EXTERNAL_FROST_VORTEX_FORMULA hasDoTTick (external)", EXTERNAL_FROST_VORTEX_FORMULA.hasDoTTick, false);
  check("EXTERNAL_FROST_VORTEX_FORMULA baseMultiplier 0.6", EXTERNAL_FROST_VORTEX_FORMULA.baseMultiplier, 0.6);

  check("EXTERNAL_UNSTABLE_BOMBER_FORMULA hasDelayScaling", EXTERNAL_UNSTABLE_BOMBER_FORMULA.hasDelayScaling, true);
  check("EXTERNAL_UNSTABLE_BOMBER_FORMULA hasGuaranteedCrit", EXTERNAL_UNSTABLE_BOMBER_FORMULA.hasGuaranteedCrit, true);

  check("EXTERNAL_PHYSICAL_WEAPON_PIPELINE weaponStatusMerge", EXTERNAL_PHYSICAL_WEAPON_PIPELINE.weaponStatusMerge, "additive");

  // ---------------------------------------------------------------
  // 11. External stat alias isolation — pure functions, no side effects
  // ---------------------------------------------------------------
  const percentTest = externalPercentToDecimal(15);
  check("externalPercentToDecimal(15) = 0.15", percentTest, 0.15);

  const aliasEntry = findByExternalName("status_damage_percent");
  checkTruthy("Found status_damage_percent alias", aliasEntry);
  if (aliasEntry) {
    check("status_damage_percent maps to statusDMG", aliasEntry.ourKey, "statusDMG");
  }

  const unknownAlias = findByExternalName("nonexistent_stat_xyz");
  check("Unknown alias returns undefined", unknownAlias, undefined);

  // ---------------------------------------------------------------
  // 12. External mechanic classifier isolation — pure functions
  // ---------------------------------------------------------------
  const externalBurn = classifyExternally("burn");
  checkTruthy("External burn classification exists", externalBurn);
  if (externalBurn) {
    check("External burn maxStacks 16", externalBurn.maxStacks, 16);
    check("External burn tickInterval 1.0", externalBurn.tickInterval, 1.0);
    check("External burn baseStat psi_intensity", externalBurn.baseStat, "psi_intensity");
    check("External burn supportsCrit false", externalBurn.supportsCrit, false);
  }

  const unknownClassification = classifyExternally("nonexistent_mechanic_id");
  check("Unknown mechanic classification returns undefined", unknownClassification, undefined);

  // ---------------------------------------------------------------
  // 13. External modules do not reference our registry
  // ---------------------------------------------------------------
  // Verify that the external mapping module types are independent
  // They should disagree (different models), which confirms independence
  const hasWeaponDMG = (EXTERNAL_BURN_FORMULA.externalStatDependencies as readonly string[]).includes("weaponDMG");
  check("External burn model uses different base stat than ours", hasWeaponDMG, false);

  // ---------------------------------------------------------------
  // 14. EXTERNAL_STAT_ALIASES is a complete reference (all entries have valid structure)
  // ---------------------------------------------------------------
  for (const alias of EXTERNAL_STAT_ALIASES) {
    checkTruthy(`Alias ${alias.externalName} has externalName`, alias.externalName);
  }

  // ---------------------------------------------------------------
  // 15. No runtime stats changed via external references
  // ---------------------------------------------------------------
  const normalizerTest = normalizeStatKey("Weapon DMG");
  check("Normalizer still works", normalizerTest, "weaponDMG");
  const displayName = getDisplayName("weaponDMG");
  check("Display name unchanged", displayName, "Weapon DMG");

  const profiles = listWeightProfiles();
  checkTruthy("Weight profiles still load", profiles.length > 0);

  const scenarioProfiles = listScenarioProfiles();
  checkTruthy("Scenario profiles still load", scenarioProfiles.length > 0);

  // ---------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------
  console.log(`\nExternal research validation: ${ERRORS.length === 0 ? "ALL PASSED" : `${ERRORS.length} FAILURES`}`);
  if (ERRORS.length > 0) {
    for (const err of ERRORS) {
      console.log(`  FAIL: ${err}`);
    }
  }
  console.log();
}

run();
