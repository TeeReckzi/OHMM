import { scoreGearSet, scoreGearItem, compareScenarios, applyMechanicMaskToWeights, resolveMechanicRelevance } from "./index";
import { formatExplanationText } from "./explainer";
import { normalizeStatKey } from "./normalizer";
import { getScenarioProfile, listScenarioProfiles } from "./scenarioProfiles";
import { listWeightProfiles, getWeightProfile } from "./scoringWeights";
import { registerInitialOverrides, getMechanicBehavior } from "../../engine/index";
import type { StatKey } from "../../schemas/buildGoalSchema";

registerInitialOverrides();

function runSmokeTest(): void {
  console.log("=== Module 13: Gear Scorer Smoke Test ===\n");

  console.log("1. Normalizer Tests");
  const normTests: [string, string | null][] = [
    ["Weapon DMG", "weaponDMG"],
    ["Weapon Damage", "weaponDMG"],
    ["Crit Rate", "critRate"],
    ["Crit DMG", "critDMG"],
    ["Weakspot DMG", "weakspotDMG"],
    ["Blaze DMG", "burnDMGBonus"],
    ["Shock DMG", "powerSurgeDMGBonus"],
    ["Status Dmg", "statusDMGBonus"],
    ["Elemental Damage", "elementalDMGBonus"],
    ["Max HP", "maxHP"],
    ["Movement Speed", "movementSpeed"],
    ["Player DMG Reduction", "playerDMGReduction"],
    ["Magazine Capacity", "magazineCapacity"],
    ["Gathering Yield", "gatheringYield"],
    ["Unknown Stat", null]
  ];
  let normPass = 0;
  for (const [input, expected] of normTests) {
    const result = normalizeStatKey(input);
    const pass = result === expected;
    if (pass) normPass++;
    console.log(`  ${pass ? "PASS" : "FAIL"} normalizeStatKey("${input}") = ${result} (expected ${expected})`);
  }
  console.log(`  Normalizer: ${normPass}/${normTests.length} passed\n`);

  console.log("2. Scenario Profile Count");
  const scenarios = listScenarioProfiles();
  console.log(`  ${scenarios.length} scenario profiles loaded`);
  const profileNames = scenarios.map((s) => s.id).join(", ");
  console.log(`  IDs: ${profileNames}\n`);

  console.log("3. Weight Profile Count");
  const weights = listWeightProfiles();
  console.log(`  ${weights.length} weight profiles loaded\n`);

  console.log("4. Gear Item Scoring (single item)");
  const weapon = {
    id: "test_weapon_1",
    sourceType: "weapon" as const,
    name: "Test Rifle",
    statValues: {
      weaponDMG: 15,
      critRate: 10,
      critDMG: 20,
      fireRate: 5,
      reloadSpeed: 8
    },
    keywords: ["crit", "weakspot"],
    element: "physical"
  };

  const singleResult = scoreGearItem(weapon, "crit_build", { buildGoalId: "crit_burst" });
  console.log(`  Score: ${singleResult.score.toFixed(2)}`);
  console.log(`  Category: damage=${singleResult.breakdown.damage.toFixed(2)}, total=${singleResult.breakdown.total.toFixed(2)}`);
  console.log(`  Contributions: ${singleResult.contributions.length} stat lines\n`);

  console.log("5. Full Gear Set Scoring");
  const set = [
    weapon,
    {
      id: "test_armor_1",
      sourceType: "armor" as const,
      name: "Test Chest",
      statValues: { maxHP: 200, dmgReduction: 5, critRate: 3 },
      keywords: ["crit", "defense"],
      armorSet: "Test Set",
      element: "physical"
    },
    {
      id: "test_armor_2",
      sourceType: "armor" as const,
      name: "Test Helmet",
      statValues: { maxHP: 150, critDMG: 10 },
      keywords: ["crit"],
      armorSet: "Test Set",
      element: "physical"
    },
    {
      id: "test_mod_1",
      sourceType: "mod_suffix" as const,
      name: "Violent Suffix",
      statValues: { critDMG: 15, critRate: 5 },
      keywords: ["crit", "violent"]
    }
  ];

  const setResult = scoreGearSet(set, "crit_build", {
    buildGoalId: "crit_burst",
    enableSynergy: true,
    enableConditionals: true
  });

  console.log(`  Scenario: ${setResult.scenarioName}`);
  console.log(`  Total Score: ${setResult.totalScore.toFixed(2)}`);
  console.log(`  Breakdown: damage=${setResult.breakdown.damage.toFixed(2)}, survivability=${setResult.breakdown.survivability.toFixed(2)}, synergy=${setResult.breakdown.synergy.toFixed(2)}`);
  console.log(`  Synergies found: ${setResult.explanation.synergies.length}`);
  for (const syn of setResult.explanation.synergies) {
    console.log(`    [${syn.type}] ${syn.description}: +${syn.score}`);
  }
  console.log(`  Item contributions: ${setResult.itemContributions.length}`);
  for (const ic of setResult.itemContributions) {
    console.log(`    ${ic.itemName}: base=${ic.baseScore.toFixed(2)}, synergy=${ic.synergyScore.toFixed(2)}, total=${ic.totalScore.toFixed(2)}`);
  }

  console.log("\n6. Scenario Comparison");
  const comparison = compareScenarios(weapon, ["crit_build", "status_build", "pve_boss", "pvp_prismverse"], {
    buildGoalId: "crit_burst"
  });
  for (const c of comparison) {
    const scenario = getScenarioProfile(c.scenarioId);
    console.log(`  ${scenario?.name ?? c.scenarioId}: ${c.score.toFixed(2)}`);
  }

  console.log("\n7. Explanation Text");
  const text = formatExplanationText(setResult.explanation);
  const lines = text.split("\n");
  console.log(`  ${lines.length} lines generated`);
  console.log(`  First line: ${lines[0]}`);
  console.log(`  Last line: ${lines[lines.length - 1]}`);

  console.log("\n8. Mechanic-Aware Scoring — Backward Compatibility (no mechanic)");
  const noMechResult = scoreGearSet(set, "crit_build", {
    buildGoalId: "crit_burst",
    enableSynergy: true,
    enableConditionals: true,
  });
  const withMechResult = scoreGearSet(set, "crit_build", {
    buildGoalId: "crit_burst",
    enableSynergy: true,
    enableConditionals: true,
    mechanicContext: { selectedMechanicIds: [] }
  });
  const noMechCompat = Math.abs(noMechResult.totalScore - withMechResult.totalScore) < 0.001;
  console.log(`  No mechanic vs empty list: ${noMechCompat ? "PASS" : "FAIL"} (${noMechResult.totalScore.toFixed(2)} vs ${withMechResult.totalScore.toFixed(2)})`);

  console.log("\n9. Mechanic Stat Relevance — Burn (status, no crit, no weakspot)");
  const burnRelevance = resolveMechanicRelevance(["burn"], [], false);
  console.log(`  Mechanic: burn`);
  console.log(`  Damage scaling: status`);
  console.log(`  Status DMG relevant: ${burnRelevance.relevantStats.has("statusDMGBonus")}`);
  console.log(`  Crit Rate relevant: ${burnRelevance.relevantStats.has("critRate")} (expected false)`);
  console.log(`  Crit DMG relevant: ${burnRelevance.relevantStats.has("critDMG")} (expected false)`);
  console.log(`  Weakspot DMG relevant: ${burnRelevance.relevantStats.has("weakspotDMG")} (expected false)`);
  console.log(`  Burn DMG relevant: ${burnRelevance.relevantStats.has("burnDMGBonus")}`);
  console.log(`  Elemental DMG relevant: ${burnRelevance.relevantStats.has("elementalDMGBonus")}`);
  const burnSuppressedCrit = burnRelevance.statNotes.some(n => n.statKey === "critRate" && n.status === "suppressed");
  console.log(`  Crit suppressed note: ${burnSuppressedCrit ? "PASS" : "FAIL"}`);

  console.log("\n10. Mechanic-Aware Scoring — Burn Stat Weight Masking (status_anomaly base)");
  const anomalyWeights = getWeightProfile("status_anomaly")?.statWeights ?? {};
  const burnMasked = applyMechanicMaskToWeights(anomalyWeights, { selectedMechanicIds: ["burn"] });
  const statusDMGBonusWeighted = anomalyWeights.statusDMGBonus ?? 0;
  const statusDMGBonusMasked = burnMasked.statWeights.statusDMGBonus ?? -1;
  const weaponDMGMasked = burnMasked.statWeights.weaponDMG ?? -1;
  console.log(`  Base statusDMGBonus weight: ${statusDMGBonusWeighted.toFixed(3)}`);
  console.log(`  Burn-masked statusDMGBonus weight: ${statusDMGBonusMasked.toFixed(3)} (preserved)`);
  console.log(`  Status DMG preserved: ${statusDMGBonusMasked > 0 ? "PASS" : "FAIL"}`);
  console.log(`  Weapon DMG zeroed (status scaling): ${weaponDMGMasked === 0 ? "PASS" : "FAIL"}`);
  console.log(`  Masked stats: ${burnMasked.maskedStats.join(", ")}`);

  console.log("\n11. Mechanic-Aware Scoring — Frost Vortex Weight Masking (status_anomaly base)");
  const frostMasked = applyMechanicMaskToWeights(anomalyWeights, { selectedMechanicIds: ["frostVortex"] });
  const frostRel = resolveMechanicRelevance(["frostVortex"], [], false);
  console.log(`  FrostVortexDMG weight: ${(frostMasked.statWeights.frostVortexDMGBonus ?? 0).toFixed(3)}`);
  console.log(`  FrostVortexDMG in relevance mask: ${frostRel.relevantStats.has("frostVortexDMGBonus") ? "PASS" : "FAIL"}`);
  console.log(`  Weapon DMG zeroed: ${(frostMasked.statWeights.weaponDMG ?? -1) === 0 ? "PASS" : "FAIL"}`);

  console.log("\n12. Mechanic-Aware Scoring — Power Surge (status_anomaly base)");
  const psMasked = applyMechanicMaskToWeights(anomalyWeights, { selectedMechanicIds: ["powerSurge"] });
  const psRel = resolveMechanicRelevance(["powerSurge"], [], false);
  console.log(`  PowerSurgeDMG in relevance mask: ${psRel.relevantStats.has("powerSurgeDMGBonus") ? "PASS" : "FAIL"}`);
  console.log(`  Weapon DMG zeroed: ${(psMasked.statWeights.weaponDMG ?? -1) === 0 ? "PASS" : "FAIL"}`);

  console.log("\n13. Mechanic-Aware Scoring — Unstable Bomber (status_anomaly base)");
  const ubMasked = applyMechanicMaskToWeights(anomalyWeights, { selectedMechanicIds: ["unstableBomber"] });
  const ubRel = resolveMechanicRelevance(["unstableBomber"], [], false);
  console.log(`  UnstableBomberDMG in relevance mask: ${ubRel.relevantStats.has("unstableBomberDMGBonus") ? "PASS" : "FAIL"}`);
  console.log(`  Weapon DMG zeroed: ${(ubMasked.statWeights.weaponDMG ?? -1) === 0 ? "PASS" : "FAIL"}`);

  console.log("\n14. Gilded Gloves Override — Burn");
  const gildedBurn = resolveMechanicRelevance(["burn"], ["Gilded Gloves"], false);
  const gildedCritEnabled = gildedBurn.relevantStats.has("critRate");
  const gildedCritNote = gildedBurn.overrideNotes.some(n => n.includes("enablesCritRollPerTick"));
  console.log(`  Crit enabled with Gilded Gloves: ${gildedCritEnabled ? "PASS" : "FAIL"}`);
  console.log(`  Override note present: ${gildedCritNote ? "PASS" : "FAIL"}`);
  console.log(`  Override notes: ${gildedBurn.overrideNotes.length}`);

  console.log("\n15. Gilded Gloves Override — Frost Vortex (should NOT get crit)");
  const gildedFrost = resolveMechanicRelevance(["frostVortex"], ["Gilded Gloves"], false);
  const frostCritWithGilded = gildedFrost.relevantStats.has("critRate");
  console.log(`  Crit enabled for Frost Vortex with Gilded Gloves: ${frostCritWithGilded} (expected false)`);

  console.log("\n16. Unknown Mechanic ID — Graceful Fallback + Warning");
  const unknownResult = resolveMechanicRelevance(["nonexistent_mechanic"], [], false);
  console.log(`  Zero effective behaviors: ${unknownResult.effectiveBehaviors.length === 0 ? "PASS" : "FAIL"}`);
  console.log(`  Empty relevant stats: ${unknownResult.relevantStats.size === 0 ? "PASS" : "FAIL"}`);
  console.log(`  Unrecognized IDs includes "nonexistent_mechanic": ${unknownResult.unrecognizedIds.includes("nonexistent_mechanic") ? "PASS" : "FAIL"}`);

  const unknownThroughScorer = scoreGearSet([
    { id: "w1", sourceType: "weapon", name: "w", statValues: { weaponDMG: 10 } }
  ], "crit_build", {
    mechanicContext: { selectedMechanicIds: ["nonexistent_mechanic", "nope"] }
  });
  const unknownNotes = (unknownThroughScorer.explanation as Record<string, unknown>).mechanicNotes as string[] | undefined;
  const hasWarning = Array.isArray(unknownNotes) && unknownNotes.some(n => n.includes("Unrecognized mechanic ID"));
  console.log(`  Warning note in explanation: ${hasWarning ? "PASS" : "FAIL"}`);
  if (Array.isArray(unknownNotes)) console.log(`  Sample: ${unknownNotes[0]}`);

  console.log("\n17. Mechanic Notes on Explanation Object");
  const burnSetResult = scoreGearSet(set, "crit_build", {
    buildGoalId: "crit_burst",
    mechanicContext: { selectedMechanicIds: ["burn"] }
  });
  const notes = (burnSetResult.explanation as Record<string, unknown>).mechanicNotes as string[] | undefined;
  console.log(`  Mechanic notes attached: ${Array.isArray(notes) && notes.length > 0 ? "PASS" : "FAIL"}`);
  if (Array.isArray(notes)) {
  console.log(`  First note: ${notes[0]}`);
  const hasSuppressNote = notes.some(n => n.includes("cannot crit") || n.includes("suppress"));
  console.log(`  Crit suppressed note present: ${hasSuppressNote ? "PASS" : "FAIL"}`);
  }

  console.log("\n18. includeUncertainMetadata Flag");
  const uncertainRelevance = resolveMechanicRelevance(["chargedHybridStatusShot"], [], true);
  const hasUncertainNote = uncertainRelevance.statNotes.some(n => n.status === "uncertain");
  console.log(`  Uncertain note present when includeUncertain=true: ${hasUncertainNote ? "PASS" : "FAIL"}`);

  const noUncertainRelevance = resolveMechanicRelevance(["chargedHybridStatusShot"], [], false);
  const hasUncertainNote2 = noUncertainRelevance.statNotes.some(n => n.status === "uncertain");
  console.log(`  Uncertain note suppressed when includeUncertain=false: ${!hasUncertainNote2 ? "PASS" : "FAIL"}`);

  console.log("\n19. Mechanic Stat Relevance — chargedHybridStatusShot (crit + weakspot enabled)");
  const hybridRel = resolveMechanicRelevance(["chargedHybridStatusShot"], [], false);
  console.log(`  Damage scaling: status`);
  console.log(`  Status DMG relevant: ${hybridRel.relevantStats.has("statusDMGBonus")}`);
  console.log(`  Crit Rate relevant: ${hybridRel.relevantStats.has("critRate")} (expected true)`);
  console.log(`  Weakspot DMG relevant: ${hybridRel.relevantStats.has("weakspotDMG")} (expected true)`);
  console.log(`  Enables crit: ${hybridRel.relevantStats.has("critRate") ? "PASS" : "FAIL"}`);

  console.log("\n20. Gilded Gauntlets Alias — Same Effect Through Scorer Pipeline");
  const gauntletsRel = resolveMechanicRelevance(["burn"], ["Gilded Gauntlets"], false);
  const gauntletsCritEnabled = gauntletsRel.relevantStats.has("critRate");
  console.log(`  Crit enabled with Gilded Gauntlets: ${gauntletsCritEnabled ? "PASS" : "FAIL"}`);
  const gauntletsOverrideNote = gauntletsRel.overrideNotes.some(n => n.includes("enablesCritRollPerTick"));
  console.log(`  Override note present: ${gauntletsOverrideNote ? "PASS" : "FAIL"}`);

  const glovesRel = resolveMechanicRelevance(["burn"], ["Gilded Gloves"], false);
  const parity = gauntletsCritEnabled === glovesRel.relevantStats.has("critRate");
  console.log(`  Gilded Gloves vs Gilded Gauntlets parity: ${parity ? "PASS" : "FAIL"}`);

  console.log("\n21. Weight Profile Immutability — Masking Does Not Mutate Input");
  const beforeWeights = { ...anomalyWeights };
  const maskCall = applyMechanicMaskToWeights(anomalyWeights, { selectedMechanicIds: ["burn"] });
  const weightsUnchanged = Object.keys(beforeWeights).every(k => beforeWeights[k as StatKey] === anomalyWeights[k as StatKey]);
  console.log(`  Original weights unchanged: ${weightsUnchanged ? "PASS" : "FAIL"}`);
  console.log(`  Returned object !== input: ${maskCall.statWeights !== anomalyWeights ? "PASS" : "FAIL"}`);

  console.log("\n22. Module 15 Registry Non-Mutation — Burn canCrit still false after mechanic scoring");
  const preBurn = getMechanicBehavior("burn");
  scoreGearSet([
    { id: "w1", sourceType: "weapon", name: "w", statValues: { weaponDMG: 10 } }
  ], "crit_build", {
    mechanicContext: { selectedMechanicIds: ["burn"], equippedGearNames: ["Gilded Gloves"] }
  });
  const postBurn = getMechanicBehavior("burn");
  console.log(`  Pre canCrit: ${preBurn?.canCrit} (expected false)`);
  console.log(`  Post canCrit: ${postBurn?.canCrit} (expected false)`);
  console.log(`  Registry unmutated: ${preBurn?.canCrit === postBurn?.canCrit && preBurn?.canCrit === false ? "PASS" : "FAIL"}`);

  console.log(`  Registry unmutated: ${preBurn?.canCrit === postBurn?.canCrit && preBurn?.canCrit === false ? "PASS" : "FAIL"}`);

  console.log("\n23. Formula-internal stats intentionally unscored");
  const formulaInternalStats: StatKey[] = [
    "weaponVulnerability",
    "statusVulnerability",
    "enemyTypeDMGBonus",
    "keywordSuffixDMGBonus",
  ];
  const weightProfile = getWeightProfile("default_offense");
  if (weightProfile) {
    for (const stat of formulaInternalStats) {
      const weight = weightProfile.statWeights[stat] ?? 0;
      console.log(`  ${stat} weight: ${weight} (expected 0 — formula-internal, not scored on gear) — ${weight === 0 ? "PASS" : "FAIL"}`);
    }
  }
  const scenarioProfile = getScenarioProfile("crit_build");
  if (scenarioProfile) {
    for (const stat of formulaInternalStats) {
      const overrides = scenarioProfile.statWeightOverrides as Partial<Record<StatKey, number>> | undefined;
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides ?? {}, stat);
      console.log(`  ${stat} in scenario overrides: ${hasOverride} (expected false) — ${!hasOverride ? "PASS" : "FAIL"}`);
    }
  }

  console.log("\n=== Smoke Test Complete ===");
}

runSmokeTest();
