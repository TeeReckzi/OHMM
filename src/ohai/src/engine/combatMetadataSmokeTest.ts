import {
  getMechanicBehavior,
  listMechanicBehaviors,
  getOverridesForMechanic,
  getOverridesForGear,
  applyGearOverridesToMechanic,
  registerInitialOverrides,
  getFormulaTemplate,
  listFormulaTemplates,
} from "./index";
import { _testCloneMechanicBehavior } from "./mechanicRegistry";

function runCombatMetadataSmokeTest(): void {
  console.log("=== Module 15: Combat Metadata Registry Smoke Test ===\n");

  registerInitialOverrides();

  let passCount = 0;
  let totalTests = 0;

  function check(desc: string, actual: unknown, expected: unknown): void {
    totalTests++;
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) passCount++;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${desc}`);
    if (!ok) {
      console.log(`    actual:   ${JSON.stringify(actual)}`);
      console.log(`    expected: ${JSON.stringify(expected)}`);
    }
  }

  function checkTruthy(desc: string, actual: unknown): void {
    totalTests++;
    const ok = !!actual;
    if (ok) passCount++;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${desc}`);
    if (!ok) {
      console.log(`    actual: ${JSON.stringify(actual)} (expected truthy)`);
    }
  }

  function checkMechanicProperty(
    desc: string,
    mechanicId: string,
    property: string,
    expected: unknown
  ): void {
    const m = getMechanicBehavior(mechanicId);
    const actual = m ? (m as unknown as Record<string, unknown>)[property] : undefined;
    check(desc, actual, expected);
  }

  function checkFalsy(desc: string, actual: unknown): void {
    totalTests++;
    const ok = !actual;
    if (ok) passCount++;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${desc}`);
    if (!ok) {
      console.log(`    actual: ${JSON.stringify(actual)} (expected falsy)`);
    }
  }

  console.log("1. Mechanic count");
  const allMechanics = listMechanicBehaviors();
  check("at least 6 mechanics loaded", allMechanics.length >= 6, true);

  console.log("\n2. Burn default behavior");
  checkMechanicProperty("Burn cannot crit by default", "burn", "canCrit", false);
  checkMechanicProperty("Burn cannot weakspot by default", "burn", "canWeakspot", false);
  checkMechanicProperty("Burn has status vulnerability type", "burn", "vulnerabilityType", "status");
  checkMechanicProperty("Burn is damage_over_time", "burn", "displayBehavior", "damage_over_time");
  checkMechanicProperty("Burn element is blaze", "burn", "element", "blaze");
  checkMechanicProperty("Burn has tickIntervalSeconds 0.5", "burn", "tickIntervalSeconds", 0.5);
  checkMechanicProperty("Burn has durationSeconds 6", "burn", "durationSeconds", 6);
  checkMechanicProperty("Burn has maxStacks 5", "burn", "maxStacks", 5);
  checkMechanicProperty("Burn has needsRetest true", "burn", "needsRetest", true);
  checkMechanicProperty("Burn scalingStat is statusDMG", "burn", "scalingStat", "statusDMG");
  checkMechanicProperty("Burn critWeakspotBucket is none", "burn", "critWeakspotBucket", "none");
  checkMechanicProperty("Burn has baseStacks 1", "burn", "baseStacks", 1);
  checkMechanicProperty("Burn has damagePerStackFactor 0.04", "burn", "damagePerStackFactor", 0.04);
  checkMechanicProperty("Burn refreshesDurationOnReapply true", "burn", "refreshesDurationOnReapply", true);
  checkMechanicProperty("Burn extendsDurationOnReapply false", "burn", "extendsDurationOnReapply", false);
  checkMechanicProperty("Burn formulaTemplateId is burn_stack_dot", "burn", "formulaTemplateId", "burn_stack_dot");

  console.log("\n3. Frost Vortex default behavior");
  checkMechanicProperty("Frost Vortex cannot crit by default", "frostVortex", "canCrit", false);
  checkMechanicProperty("Frost Vortex has status vulnerability", "frostVortex", "vulnerabilityType", "status");
  checkMechanicProperty("Frost Vortex element is frost", "frostVortex", "element", "frost");
  checkMechanicProperty("Frost Vortex has needsRetest true", "frostVortex", "needsRetest", true);

  console.log("\n4. Power Surge default behavior");
  checkMechanicProperty("Power Surge cannot crit by default", "powerSurge", "canCrit", false);
  checkMechanicProperty("Power Surge element is shock", "powerSurge", "element", "shock");
  checkMechanicProperty("Power Surge has needsRetest true", "powerSurge", "needsRetest", true);

  console.log("\n5. Unstable Bomber default behavior");
  checkMechanicProperty("Unstable Bomber cannot crit by default", "unstableBomber", "canCrit", false);
  checkMechanicProperty("Unstable Bomber element is blast", "unstableBomber", "element", "blast");
  checkMechanicProperty("Unstable Bomber has needsRetest true", "unstableBomber", "needsRetest", true);
  checkMechanicProperty("Unstable Bomber has baseFactor 1.2", "unstableBomber", "baseFactor", 1.2);

  console.log("\n6. Charged Hybrid Status Shot behavior");
  checkMechanicProperty("Charged Hybrid has damageScalingBucket status", "chargedHybridStatusShot", "damageScalingBucket", "status");
  checkMechanicProperty("Charged Hybrid canCrit true", "chargedHybridStatusShot", "canCrit", true);
  checkMechanicProperty("Charged Hybrid canWeakspot true", "chargedHybridStatusShot", "canWeakspot", true);
  checkMechanicProperty("Charged Hybrid has additive critWeakspotBucket", "chargedHybridStatusShot", "critWeakspotBucket", "additive_when_both_apply");
  checkMechanicProperty("Charged Hybrid has charged_shot display", "chargedHybridStatusShot", "displayBehavior", "charged_shot");

  console.log("\n7. Crit/weakspot eligibility NOT inferred from damageScalingBucket");
  const charged = getMechanicBehavior("chargedHybridStatusShot");
  if (charged) {
    const bucket = charged.damageScalingBucket;
    const crit = charged.canCrit;
    const weakspot = charged.canWeakspot;
    check("Status bucket + canCrit=true is valid", bucket === "status" && crit === true, true);
    check("Status bucket + canWeakspot=true is valid", bucket === "status" && weakspot === true, true);
  }
  const burn = getMechanicBehavior("burn");
  if (burn) {
    check("Burn has status bucket but canCrit=false", burn.damageScalingBucket === "status" && burn.canCrit === false, true);
    check("Burn has status bucket but canWeakspot=false", burn.damageScalingBucket === "status" && burn.canWeakspot === false, true);
  }

  console.log("\n8. Gilded Gloves override");
  const ggOverrides = getOverridesForGear("Gilded Gloves");
  checkTruthy("Gilded Gloves override exists", ggOverrides.length > 0);
  if (ggOverrides.length > 0) {
    const gg = ggOverrides[0];
    check("Gilded Gloves affects burn", gg.affectedMechanicId, "burn");
    check("GG enablesCritRollPerTick true", gg.enablesCritRollPerTick, true);
    check("GG critChanceSource is characterCritRate", gg.critChanceSource, "characterCritRate");
    check("GG critDamageSource is characterCritDMG", gg.critDamageSource, "characterCritDMG");
  }

  console.log("\n9. Gilded Gloves override does NOT affect other mechanics");
  const frostOverrides = getOverridesForGear("Gilded Gloves").filter((o) => o.affectedMechanicId === "frostVortex");
  const surgeOverrides = getOverridesForGear("Gilded Gloves").filter((o) => o.affectedMechanicId === "powerSurge");
  const bomberOverrides = getOverridesForGear("Gilded Gloves").filter((o) => o.affectedMechanicId === "unstableBomber");
  check("GG does not affect Frost Vortex", frostOverrides.length, 0);
  check("GG does not affect Power Surge", surgeOverrides.length, 0);
  check("GG does not affect Unstable Bomber", bomberOverrides.length, 0);

  console.log("\n10. applyGearOverridesToMechanic — Burn with Gilded Gloves");
  const effective = applyGearOverridesToMechanic("burn", ["Gilded Gloves"]);
  checkTruthy("effective behavior returned", effective);
  if (effective) {
    check("Effective Burn canCrit becomes true", effective.canCrit, true);
    check("Effective Burn canWeakspot stays false", effective.canWeakspot, false);
    check("Effective Burn damageScalingBucket unchanged", effective.damageScalingBucket, "status");
    check("Effective Burn scalingStat unchanged", effective.scalingStat, "statusDMG");
    check("appliedOverrides has entries", effective.appliedOverrides.length > 0, true);

    const applied = effective.appliedOverrides.find((a) => a.wasApplied);
    checkTruthy("Gilded Gloves override was applied", applied);
  }

  console.log("\n11. applyGearOverridesToMechanic — Frost Vortex with Gilded Gloves (no effect)");
  const frostEffective = applyGearOverridesToMechanic("frostVortex", ["Gilded Gloves"]);
  checkTruthy("Frost Vortex effective returned", frostEffective);
  if (frostEffective) {
    check("Frost Vortex canCrit remains false", frostEffective.canCrit, false);
    check("Frost Vortex canWeakspot remains false", frostEffective.canWeakspot, false);
  }

  console.log("\n12. applyGearOverridesToMechanic does NOT mutate base registry");
  const before = getMechanicBehavior("burn");
  const baseCanCritBefore = before?.canCrit;
  applyGearOverridesToMechanic("burn", ["Gilded Gloves"]);
  const after = getMechanicBehavior("burn");
  check("Base Burn canCrit unchanged after applyGearOverridesToMechanic", after?.canCrit, baseCanCritBefore);
  check("Base Burn canCrit still false", after?.canCrit, false);

  console.log("\n13. Gilded Gauntlets alias resolves to Gilded Gloves");
  const ggAlias = getOverridesForGear("Gilded Gauntlets");
  check("Gilded Gauntlets returns same overrides as Gilded Gloves", ggAlias.length, ggOverrides.length);
  if (ggAlias.length > 0 && ggOverrides.length > 0) {
    check("Gilded Gauntlets override affects burn", ggAlias[0].affectedMechanicId, "burn");
    check("Gilded Gauntlets override has enablesCritRollPerTick", ggAlias[0].enablesCritRollPerTick, true);
  }
  const ggAliasEffective = applyGearOverridesToMechanic("burn", ["Gilded Gauntlets"]);
  checkTruthy("Gilded Gauntlets effective behavior returned", ggAliasEffective);
  if (ggAliasEffective) {
    check("Gilded Gauntlets makes Burn canCrit true", ggAliasEffective.canCrit, true);
  }

  console.log("\n14. Registry returns immutable copies");
  const burnCopy = getMechanicBehavior("burn");
  if (burnCopy) {
    const originalCanCrit = burnCopy.canCrit;
    (burnCopy as unknown as Record<string, unknown>).canCrit = true;
    const afterMutate = getMechanicBehavior("burn");
    check("Mutating returned copy does not affect registry", afterMutate?.canCrit, originalCanCrit);
    check("Registry still returns canCrit=false after mutation attempt", afterMutate?.canCrit, false);
  }

  console.log("\n15. Repeated calls return stable output");
  const call1 = getMechanicBehavior("burn");
  const call2 = getMechanicBehavior("burn");
  check("Two calls return identical structure", JSON.stringify(call1), JSON.stringify(call2));
  check("Two calls return different object references", call1 !== call2, true);

  console.log("\n16. Unknown mechanic returns undefined");
  checkFalsy("getMechanicBehavior('nonexistent') is undefined", getMechanicBehavior("nonexistent"));
  checkFalsy("getMechanicBehavior('') is undefined", getMechanicBehavior(""));

  console.log("\n17. Unknown gear override returns empty array");
  check("getOverridesForGear('NonexistentGear') is empty", getOverridesForGear("NonexistentGear").length, 0);

  console.log("\n18. Unknown gear in applyGearOverridesToMechanic returns no-op");
  const noopResult = applyGearOverridesToMechanic("burn", ["NonexistentGear"]);
  checkTruthy("result exists for unknown gear", noopResult);
  if (noopResult) {
    check("Burn canCrit still false with unknown gear", noopResult.canCrit, false);
    check("appliedOverrides has entry", noopResult.appliedOverrides.length, 1);
    check("unknown gear override was NOT applied", noopResult.appliedOverrides[0].wasApplied, false);
    checkTruthy("reason mentions gear name", noopResult.appliedOverrides[0].reason?.includes("NonexistentGear"));
  }

  console.log("\n19. Empty equipped gear list returns base with no overrides");
  const emptyResult = applyGearOverridesToMechanic("burn", []);
  checkTruthy("empty gear list returns result", emptyResult);
  if (emptyResult) {
    check("empty gear list canCrit equals base canCrit", emptyResult.canCrit, false);
  }

  console.log("\n20. chargedHybridStatusShot canCrit does NOT propagate to Burn");
  const chargedAfter = getMechanicBehavior("chargedHybridStatusShot");
  const burnAfter = getMechanicBehavior("burn");
  checkTruthy("charged record still exists", chargedAfter);
  checkTruthy("burn record still exists", burnAfter);
  if (chargedAfter && burnAfter) {
    check("charged canCrit is true (not affected by Burn)", chargedAfter.canCrit, true);
    check("burn canCrit is false (not affected by Charged)", burnAfter.canCrit, false);
    check("charged canWeakspot is true", chargedAfter.canWeakspot, true);
    check("burn canWeakspot is false", burnAfter.canWeakspot, false);
  }

  console.log("\n21. Every mechanic has confidence and needsRetest");
  for (const m of allMechanics) {
    checkTruthy(`Mechanic ${m.mechanicId} has confidence`, m.confidence);
    checkTruthy(`Mechanic ${m.mechanicId} has source`, m.source);
    checkTruthy(`Mechanic ${m.mechanicId} has source.kind`, m.source.kind);
    check("Mechanic " + m.mechanicId + " has needsRetest", m.needsRetest, true);
  }

  console.log("\n22. Every formula template has confidence, patchContext, needsRetest");
  const templates = listFormulaTemplates();
  check("At least 4 formula templates", templates.length >= 4, true);
  for (const t of templates) {
    checkTruthy(`Template ${t.templateId} has confidence`, t.confidence);
    checkTruthy(`Template ${t.templateId} has patchContext`, t.patchContext);
    check(`Template ${t.templateId} has needsRetest`, t.needsRetest, true);
    checkTruthy(`Template ${t.templateId} has source`, t.source);
    checkTruthy(`Template ${t.templateId} has source.kind`, t.source.kind);
  }

  console.log("\n23. Formula templates — individual checks");
  const chargedFormula = getFormulaTemplate("charged_status_damage_current_patch");
  checkTruthy("Charged status formula exists", chargedFormula);
  if (chargedFormula) {
    check("Charged formula has needed confidence", chargedFormula.confidence, "reported_current_patch_needs_testing");
    check("Charged formula has patchContext", !!chargedFormula.patchContext, true);
    check("Charged formula has needsRetest true", chargedFormula.needsRetest, true);
    check("Charged formula has variables", chargedFormula.variables.length > 0, true);
  }

  const physFormula = getFormulaTemplate("physical_weapon_damage_current_patch");
  checkTruthy("Physical weapon formula exists", physFormula);
  if (physFormula) {
    check("Physical weapon formula has confidence set", physFormula.confidence, "reported_current_patch_needs_testing");
    check("Physical weapon formula has needsRetest true", physFormula.needsRetest, true);
  }

  const devFormula = getFormulaTemplate("deviation_skill_damage_current_patch");
  checkTruthy("Deviation skill formula exists", devFormula);
  if (devFormula) {
    check("Deviation formula has confidence set", devFormula.confidence, "reported_current_patch_needs_testing");
    check("Deviation formula has needsRetest true", devFormula.needsRetest, true);
  }

  const burnFormula = getFormulaTemplate("burn_stack_dot");
  checkTruthy("Burn stack formula exists", burnFormula);
  if (burnFormula) {
    check("Burn stack formula has confidence set", burnFormula.confidence, "reported_current_patch_needs_testing");
    check("Burn stack formula has needsRetest true", burnFormula.needsRetest, true);
    check("Burn stack formula has variables", (burnFormula.variables.length > 0), true);
  }

  console.log("\n24. Deviation skill mechanics");
  checkMechanicProperty("Butterfly Emissary has deviation bucket", "butterflyEmissary", "damageScalingBucket", "deviation");
  checkMechanicProperty("Butterfly Emissary scalingStat psiIntensity", "butterflyEmissary", "scalingStat", "psiIntensity");
  checkMechanicProperty("Butterfly Emissary baseFactor 1.2", "butterflyEmissary", "baseFactor", 1.2);
  checkMechanicProperty("ZapCam has deviation bucket", "zapCamLoneWolf", "damageScalingBucket", "deviation");
  checkMechanicProperty("ZapCam baseFactor 8.0", "zapCamLoneWolf", "baseFactor", 8.0);
  checkMechanicProperty("Soul Summoner has deviation bucket", "soulSummoner", "damageScalingBucket", "deviation");
  checkMechanicProperty("Soul Summoner baseFactor 6.0", "soulSummoner", "baseFactor", 6.0);

  console.log("\n25. All mechanics have required fields");
  for (const m of allMechanics) {
    checkTruthy(`Mechanic ${m.mechanicId} has mechanicId`, m.mechanicId);
    checkTruthy(`Mechanic ${m.mechanicId} has displayName`, m.displayName);
    checkTruthy(`Mechanic ${m.mechanicId} has damageScalingBucket`, m.damageScalingBucket);
    checkTruthy(`Mechanic ${m.mechanicId} has vulnerabilityType`, m.vulnerabilityType);
    checkTruthy(`Mechanic ${m.mechanicId} has critWeakspotBucket`, m.critWeakspotBucket);
    checkTruthy(`Mechanic ${m.mechanicId} has displayBehavior`, m.displayBehavior);
  }

  console.log("\n=== Results ===");
  console.log(`  Passed: ${passCount}/${totalTests}`);
  console.log(`  Failed: ${totalTests - passCount}/${totalTests}`);
  console.log(`  Pass rate: ${(passCount / totalTests * 100).toFixed(1)}%\n`);
}

runCombatMetadataSmokeTest();
