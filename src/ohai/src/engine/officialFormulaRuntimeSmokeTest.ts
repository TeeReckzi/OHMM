import {
  DAMAGE_FORMULA_BRANCH_SELECTOR,
  FORMULA_TARGETS,
  FORMULA_TREE_NAMES,
  getDefaultFormulaLeafValues,
  getPrimaryFormulaTargetBinding,
  mapRuntimeAttackTypeToDamageFormulaBranch,
} from "./officialFormulaMetadata";
import { buildOfficialDamageFormulaLeaves, createOfficialDamageFormulaRuntime } from "./officialFormulaGraphRuntime";

let passed = 0;
let failed = 0;

function check(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}`);
  }
}

function eq<T>(actual: T, expected: T, label: string): void {
  check(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log("\n=== Official Formula Runtime Smoke Test ===\n");

const damageTarget = getPrimaryFormulaTargetBinding(FORMULA_TREE_NAMES.DAMAGE);
eq(damageTarget.targetName, FORMULA_TARGETS.FINAL_ATTACK, "damage tree output key");
eq(damageTarget.soulId, 331, "damage tree output soul_id");

const cureTarget = getPrimaryFormulaTargetBinding(FORMULA_TREE_NAMES.CURE);
eq(cureTarget.targetName, FORMULA_TARGETS.FINAL_TREAT, "cure tree output key");
eq(cureTarget.soulId, 11, "cure tree output soul_id");

const buildingTarget = getPrimaryFormulaTargetBinding(FORMULA_TREE_NAMES.BUILDING_DAMAGE);
eq(buildingTarget.targetName, FORMULA_TARGETS.FINAL_DAMAGE, "building tree output key");
eq(buildingTarget.soulId, 21, "building tree output soul_id");

const vehicleTarget = getPrimaryFormulaTargetBinding(FORMULA_TREE_NAMES.VEHICLE_DAMAGE);
eq(vehicleTarget.targetName, FORMULA_TARGETS.FINAL_DAMAGE, "vehicle tree output key");
eq(vehicleTarget.soulId, 13, "vehicle tree output soul_id");

eq(mapRuntimeAttackTypeToDamageFormulaBranch("melee"), DAMAGE_FORMULA_BRANCH_SELECTOR.MELEE, "melee branch");
eq(mapRuntimeAttackTypeToDamageFormulaBranch("dot"), DAMAGE_FORMULA_BRANCH_SELECTOR.BUFF, "dot branch");
eq(mapRuntimeAttackTypeToDamageFormulaBranch("skill"), DAMAGE_FORMULA_BRANCH_SELECTOR.SKILL, "skill branch");
eq(mapRuntimeAttackTypeToDamageFormulaBranch("item"), DAMAGE_FORMULA_BRANCH_SELECTOR.ITEM, "item branch");
eq(mapRuntimeAttackTypeToDamageFormulaBranch("remote"), DAMAGE_FORMULA_BRANCH_SELECTOR.REMOTE, "remote branch is recovered 8");
eq(mapRuntimeAttackTypeToDamageFormulaBranch("normal"), DAMAGE_FORMULA_BRANCH_SELECTOR.REMOTE, "normal branch defaults to remote 8");

const defaults = getDefaultFormulaLeafValues();
eq(defaults.skill_rate, 1, "skill_rate default");
eq(defaults.dis_dam_rate, 1, "dis_dam_rate default");
eq(defaults.use_final_ignore_dam_rate, 1, "use_final_ignore_dam_rate default");
eq(defaults.use_final_dam_add_rate, 1, "use_final_dam_add_rate default");
eq(defaults.pvp_adjust_factor, 1, "pvp_adjust_factor default");
eq(defaults.special_regulate_factor, 1, "special_regulate_factor default");
eq(defaults.crit_random_speed_factor, 0.8, "crit_random_speed_factor default");
eq(defaults.anomaly_random_speed_factor, 0.8, "anomaly_random_speed_factor default");
eq(defaults.weak_random_speed_factor, 0.8, "weak_random_speed_factor default");

const leaves = buildOfficialDamageFormulaLeaves({
  formulaAttackType: "remote",
  attack: 1234,
  critRate: 0.35,
  weakRate: 0.2,
  randomSeed: 0.42,
  elementType: "blaze",
  keywordType: "SCORCH",
  pvpAdjustFactor: 0.6,
  specialRegulateFactor: 0.9,
  useFinalIgnoreDamageRate: false,
});
eq(leaves.formula_attack_type, 8, "leaf adapter maps remote to 8");
eq(leaves.attack, 1234, "leaf adapter attack");
eq(leaves.crit_rate, 0.35, "leaf adapter crit_rate");
eq(leaves.final_weak_rate, 0.2, "leaf adapter final_weak_rate");
eq(leaves._RANDOM, 0.42, "leaf adapter random seed");
eq(leaves.element_type, "blaze", "leaf adapter element_type");
eq(leaves.keyword_type, "SCORCH", "leaf adapter keyword_type");
eq(leaves.pvp_adjust_factor, 0.6, "leaf adapter pvp factor");
eq(leaves.special_regulate_factor, 0.9, "leaf adapter special factor");
eq(leaves.use_final_ignore_dam_rate, 0, "leaf adapter ignore gate off");
eq(leaves.use_final_dam_add_rate, 1, "leaf adapter damage-add gate default on");

const runtime = createOfficialDamageFormulaRuntime({ formulaAttackType: "remote", attack: 100 });
eq(runtime.getLeafValue("formula_attack_type"), 8, "runtime stores mapped branch leaf");
eq(runtime.getLeafValue("attack"), 100, "runtime stores attack leaf");
eq(runtime.getTargetValue("final_attack"), 0, "runtime exposes final_attack before graph recipes");
runtime.setValueBySoulId(331, 777);
eq(runtime.getTargetValue("final_attack"), 777, "runtime reads recovered soul_id 331");
eq(runtime.getPrimaryTargetValue(), 777, "runtime primary target reads output");

console.log(`\nOfficial Formula Runtime Smoke Test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
