import { registerInitialOverrides } from "./overrides";
import { registerModifierSource, getModifierSource, listModifierSources } from "./modifierRegistry";
import { aggregateModifiers, formatBreakdown, formatAggregationReport } from "./modifierAggregation";
import { aggregatedStatsToPartialRecord, resolveDamageForMechanic } from "./modifierResolver";
import type { ModifierSource, AggregationReport } from "./modifierTypes";
import { buildFormulaInput } from "./formulaContext";
import { calculateExpectedDamage } from "./formulaApplicator";

function runModifierSmokeTest(): void {
  console.log("=== Module 20: Modifier Source Aggregation Engine Smoke Test ===\n");

  registerInitialOverrides();

  let totalTests = 0;
  let passCount = 0;

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

  function checkFalsy(desc: string, actual: unknown): void {
    totalTests++;
    const ok = !actual;
    if (ok) passCount++;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${desc}`);
    if (!ok) {
      console.log(`    actual: ${JSON.stringify(actual)} (expected falsy)`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Registry loads sample sources
  // ---------------------------------------------------------------------------
  const allSources = listModifierSources();
  checkTruthy("Modifier registry has sources", allSources.length > 0);
  check("At least 16 sample sources loaded", allSources.length >= 16, true);

  const scorched = getModifierSource("mod_scorched");
  checkTruthy("Scorched mod exists in registry", scorched);
  check("Scorched mod stat is burnDMGBonus", scorched?.stat, "burnDMGBonus");

  // ---------------------------------------------------------------------------
  // 2. Baseline aggregation — single source
  // ---------------------------------------------------------------------------
  const singleSource: ModifierSource[] = [
    {
      id: "test_single",
      sourceType: "mod",
      sourceLabel: "Test Single",
      stat: "burnDMGBonus",
      value: 0.15,
      behavior: "additive",
      confidence: "inferred",
    },
  ];

  const singleReport = aggregateModifiers(singleSource);
  check("Single source totalSources=1", singleReport.totalSources, 1);
  check("Single source activeSources=1", singleReport.activeSources, 1);
  check("Single source suppressed=0", singleReport.suppressedCount, 0);
  check("Single source burnDMGBonus=0.15", singleReport.stats.stats.burnDMGBonus, 0.15);

  // ---------------------------------------------------------------------------
  // 3. Additive stacking from multiple sources
  // ---------------------------------------------------------------------------
  const additiveSources: ModifierSource[] = [
    {
      id: "src_a",
      sourceType: "mod",
      sourceLabel: "Source A",
      stat: "elementalDMGBonus",
      value: 0.10,
      behavior: "additive",
      confidence: "inferred",
    },
    {
      id: "src_b",
      sourceType: "food",
      sourceLabel: "Source B",
      stat: "elementalDMGBonus",
      value: 0.12,
      behavior: "additive",
      confidence: "inferred",
    },
    {
      id: "src_c",
      sourceType: "calibration",
      sourceLabel: "Source C",
      stat: "elementalDMGBonus",
      value: 0.15,
      behavior: "additive",
      confidence: "inferred",
    },
  ];

  const additiveReport = aggregateModifiers(additiveSources);
  check("Additive stack elementalDMGBonus=0.37", additiveReport.stats.stats.elementalDMGBonus, 0.37);
  check("Additive sources=3", additiveReport.activeSources, 3);
  check("Additive suppressed=0", additiveReport.suppressedCount, 0);
  checkTruthy("Additive breakdown has 3 entries", additiveReport.stats.breakdown.elementalDMGBonus?.length === 3);

  // ---------------------------------------------------------------------------
  // 4. Duplicate suppression — same source type + same label
  // ---------------------------------------------------------------------------
  const dupSources: ModifierSource[] = [
    {
      id: "dup_1",
      sourceType: "mod",
      sourceLabel: "Duplicate Mod",
      stat: "critRate",
      value: 0.05,
      behavior: "additive",
      confidence: "inferred",
    },
    {
      id: "dup_2",
      sourceType: "mod",
      sourceLabel: "Duplicate Mod",
      stat: "critRate",
      value: 0.08,
      behavior: "additive",
      confidence: "inferred",
    },
  ];

  const dupReport = aggregateModifiers(dupSources);
  check("Duplicate suppression activeSources=1", dupReport.activeSources, 1);
  check("Duplicate suppression suppressed=1", dupReport.suppressedCount, 1);
  checkTruthy("Duplicate report has entry", dupReport.duplicates.length > 0);

  // ---------------------------------------------------------------------------
  // 5. Conditional modifier excluded when inactive
  // ---------------------------------------------------------------------------
  const conditionalSources: ModifierSource[] = [
    {
      id: "inactive_buff",
      sourceType: "temporaryBuff",
      sourceLabel: "Inactive Buff",
      stat: "weaponDMG",
      value: 0.25,
      behavior: "multiplicative",
      conditional: {
        description: "Only during Rage mode",
        isActive: false,
      },
      confidence: "inferred",
    },
    {
      id: "always_active",
      sourceType: "mod",
      sourceLabel: "Always Active",
      stat: "weaponDMG",
      value: 0.10,
      behavior: "additive",
      confidence: "inferred",
    },
  ];

  const conditionalReport = aggregateModifiers(conditionalSources);
  check("Inactive conditional excluded, weaponDMG=0.10", conditionalReport.stats.stats.weaponDMG, 0.10);
  check("Conditional activeSources=1", conditionalReport.activeSources, 1);

  // ---------------------------------------------------------------------------
  // 6. Multiplicative modifier stacking
  // ---------------------------------------------------------------------------
  const multSources: ModifierSource[] = [
    {
      id: "base_add",
      sourceType: "mod",
      sourceLabel: "Base Add",
      stat: "burnDMGBonus",
      value: 0.20,
      behavior: "additive",
      confidence: "inferred",
    },
    {
      id: "mult_bonus",
      sourceType: "keywordEffect",
      sourceLabel: "Multiplier",
      stat: "burnDMGBonus",
      value: 1.25,
      behavior: "multiplicative",
      conditional: {
        description: "Active at max stacks",
        isActive: true,
      },
      confidence: "inferred",
    },
  ];

  const multReport = aggregateModifiers(multSources);
  check("Multiplicative: 0.20*1.25=0.25", multReport.stats.stats.burnDMGBonus, 0.25);

  // ---------------------------------------------------------------------------
  // 7. Burn PvE build — end-to-end
  // ---------------------------------------------------------------------------
  const burnBuild: ModifierSource[] = [
    {
      id: "weapon_psi",
      sourceType: "weapon",
      sourceLabel: "Status Weapon (Psi)",
      stat: "psiIntensity",
      value: 100,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "armor_status",
      sourceType: "armor",
      sourceLabel: "Armor: Status DMG",
      stat: "statusDMGBonus",
      value: 0.10,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "food_elemental_burn",
      sourceType: "food",
      sourceLabel: "Food: Elemental DMG",
      stat: "elementalDMGBonus",
      value: 0.12,
      behavior: "additive",
      confidence: "reported_current_patch_needs_testing",
    },
    {
      id: "mod_scorched_burn",
      sourceType: "mod",
      sourceLabel: "Scorched Mod",
      stat: "burnDMGBonus",
      value: 0.15,
      behavior: "additive",
      mechanicId: "burn",
      confidence: "reported_current_patch_needs_testing",
    },
    {
      id: "set_burn_2pc_bonus",
      sourceType: "setBonus",
      sourceLabel: "Burn Set 2pc",
      stat: "burnDMGBonus",
      value: 0.20,
      behavior: "additive",
      mechanicId: "burn",
      confidence: "reported_current_patch_needs_testing",
    },
    {
      id: "mod_suffix_blaze",
      sourceType: "modSuffix",
      sourceLabel: "Mod Suffix: Blaze",
      stat: "burnDMGBonus",
      value: 0.08,
      behavior: "additive",
      mechanicId: "burn",
      confidence: "observed_in_game_needs_testing",
    },
  ];

  const burnReport = aggregateModifiers(burnBuild);
  check("Burn build psiIntensity=100", burnReport.stats.stats.psiIntensity, 100);
  check("Burn build statusDMGBonus=0.10", burnReport.stats.stats.statusDMGBonus, 0.10);
  check("Burn build elementalDMGBonus=0.12", burnReport.stats.stats.elementalDMGBonus, 0.12);
  check("Burn build burnDMGBonus=0.43", burnReport.stats.stats.burnDMGBonus, 0.43);
  check("Burn build sources=6", burnReport.activeSources, 6);

  // ---------------------------------------------------------------------------
  // 8. Power Surge PvP build
  // ---------------------------------------------------------------------------
  const psBuild: ModifierSource[] = [
    {
      id: "ps_weapon_psi",
      sourceType: "weapon",
      sourceLabel: "Status Weapon (Psi)",
      stat: "psiIntensity",
      value: 100,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "ps_armor_status",
      sourceType: "armor",
      sourceLabel: "Armor: Status DMG",
      stat: "statusDMGBonus",
      value: 0.15,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "ps_calibration_elemental",
      sourceType: "calibration",
      sourceLabel: "Calibration: Elemental",
      stat: "elementalDMGBonus",
      value: 0.10,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "ps_mod_charged",
      sourceType: "mod",
      sourceLabel: "Charged Mod",
      stat: "powerSurgeDMGBonus",
      value: 0.18,
      behavior: "additive",
      mechanicId: "powerSurge",
      confidence: "reported_current_patch_needs_testing",
    },
  ];

  const psReport = aggregateModifiers(psBuild);
  check("PS build psiIntensity=100", psReport.stats.stats.psiIntensity, 100);
  check("PS build statusDMGBonus=0.15", psReport.stats.stats.statusDMGBonus, 0.15);
  check("PS build elementalDMGBonus=0.10", psReport.stats.stats.elementalDMGBonus, 0.10);
  check("PS build powerSurgeDMGBonus=0.18", psReport.stats.stats.powerSurgeDMGBonus, 0.18);
  check("PS build sources=4", psReport.activeSources, 4);

  // ---------------------------------------------------------------------------
  // 9. Physical weakspot rifle build
  // ---------------------------------------------------------------------------
  const physBuild: ModifierSource[] = [
    {
      id: "phys_weapon",
      sourceType: "weapon",
      sourceLabel: "Rifle (base)",
      stat: "weaponDMG",
      value: 100,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "phys_cal_attack",
      sourceType: "calibration",
      sourceLabel: "Calibration: Attack%",
      stat: "attackPercent",
      value: 0.10,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "phys_mod_crit_rate",
      sourceType: "mod",
      sourceLabel: "Crit Rate Mod",
      stat: "critRate",
      value: 0.08,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "phys_mod_crit_dmg",
      sourceType: "mod",
      sourceLabel: "Crit DMG Mod",
      stat: "critDMG",
      value: 0.15,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "phys_food_weakspot",
      sourceType: "food",
      sourceLabel: "Weakspot Food",
      stat: "weakspotDMG",
      value: 0.20,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
  ];

  const physReport = aggregateModifiers(physBuild);
  check("Phys build weaponDMG=100", physReport.stats.stats.weaponDMG, 100);
  check("Phys build attackPercent=0.10", physReport.stats.stats.attackPercent, 0.10);
  check("Phys build critRate=0.08", physReport.stats.stats.critRate, 0.08);
  check("Phys build critDMG=0.15", physReport.stats.stats.critDMG, 0.15);
  check("Phys build weakspotDMG=0.20", physReport.stats.stats.weakspotDMG, 0.20);

  // ---------------------------------------------------------------------------
  // 10. Hybrid elemental build
  // ---------------------------------------------------------------------------
  const hybridBuild: ModifierSource[] = [
    {
      id: "hybrid_weapon",
      sourceType: "weapon",
      sourceLabel: "Hybrid Weapon",
      stat: "psiIntensity",
      value: 100,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "hybrid_weapon_dmg",
      sourceType: "weapon",
      sourceLabel: "Weapon Base DMG",
      stat: "weaponDMG",
      value: 100,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "hybrid_armor_status",
      sourceType: "armor",
      sourceLabel: "Armor: Status DMG",
      stat: "statusDMGBonus",
      value: 0.10,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "hybrid_elemental_set",
      sourceType: "setBonus",
      sourceLabel: "Elemental Set 3pc",
      stat: "elementalDMGBonus",
      value: 0.15,
      behavior: "additive",
      confidence: "reported_current_patch_needs_testing",
    },
    {
      id: "hybrid_cal_elemental",
      sourceType: "calibration",
      sourceLabel: "Calibration: Elemental",
      stat: "elementalDMGBonus",
      value: 0.10,
      behavior: "additive",
      confidence: "observed_in_game_needs_testing",
    },
    {
      id: "hybrid_food_elemental",
      sourceType: "food",
      sourceLabel: "Food: Elemental DMG",
      stat: "elementalDMGBonus",
      value: 0.12,
      behavior: "additive",
      confidence: "reported_current_patch_needs_testing",
    },
  ];

  const hybridReport = aggregateModifiers(hybridBuild);
  check("Hybrid build psiIntensity=100", hybridReport.stats.stats.psiIntensity, 100);
  check("Hybrid build statusDMGBonus=0.10", hybridReport.stats.stats.statusDMGBonus, 0.10);
  check("Hybrid build elementalDMGBonus=0.37", hybridReport.stats.stats.elementalDMGBonus, 0.37);
  check("Hybrid build sources=6", hybridReport.activeSources, 6);
  check("Hybrid build elementalDMGBonus=0.37", hybridReport.stats.stats.elementalDMGBonus, 0.37);
  check("Hybrid build weaponDMG=100", hybridReport.stats.stats.weaponDMG, 100);

  // ---------------------------------------------------------------------------
  // 11. Source attribution — breakdown entries
  // ---------------------------------------------------------------------------
  const breakdownEntries = hybridReport.stats.breakdown.elementalDMGBonus;
  checkTruthy("Hybrid build elementalDMGBonus breakdown exists", breakdownEntries);
  check("Hybrid build elementalDMGBonus 3 sources", breakdownEntries?.length, 3);
  if (breakdownEntries) {
    check("Breakdown[0] sourceLabel Elemental Set", breakdownEntries[0]?.sourceLabel, "Elemental Set 3pc");
    check("Breakdown[1] sourceLabel Calibration", breakdownEntries[1]?.sourceLabel, "Calibration: Elemental");
    check("Breakdown[2] sourceLabel Food", breakdownEntries[2]?.sourceLabel, "Food: Elemental DMG");
  }

  // ---------------------------------------------------------------------------
  // 12. Format breakdown text
  // ---------------------------------------------------------------------------
  if (breakdownEntries) {
    const fmtLines = formatBreakdown("elementalDMGBonus", breakdownEntries);
    checkTruthy("formatBreakdown produces lines", fmtLines.length > 0);
    check("formatBreakdown first line shows total", fmtLines[0]?.includes("elementalDMGBonus"), true);
    check("formatBreakdown has source attribution", fmtLines.some((l) => l.includes("from")), true);
  }

  // ---------------------------------------------------------------------------
  // 13. Format aggregation report
  // ---------------------------------------------------------------------------
  const reportLines = formatAggregationReport(hybridReport);
  checkTruthy("formatAggregationReport produces lines", reportLines.length > 0);
  check("Report contains MODIFIER AGGREGATION REPORT header", 
    reportLines.some((l) => l.includes("MODIFIER AGGREGATION REPORT")), true);
  check("Report contains total sources", 
    reportLines.some((l) => l.includes("Total sources:")), true);

  // ---------------------------------------------------------------------------
  // 14. aggregatedStatsToPartialRecord produces correct format for formula engine
  // ---------------------------------------------------------------------------
  const partialRecord = aggregatedStatsToPartialRecord(hybridReport.stats);
  check("PartialRecord has psiIntensity=100", partialRecord.psiIntensity, 100);
  check("PartialRecord has statusDMGBonus=0.10", partialRecord.statusDMGBonus, 0.10);
  check("PartialRecord has elementalDMGBonus=0.37", partialRecord.elementalDMGBonus, 0.37);
  check("PartialRecord has weaponDMG=100", partialRecord.weaponDMG, 100);

  // ---------------------------------------------------------------------------
  // 15. Compatibility with Module 17 formula engine
  // ---------------------------------------------------------------------------
  const formulaInput = buildFormulaInput("burn", partialRecord, []);
  checkFalsy("buildFormulaInput succeeds with aggregated stats", "error" in formulaInput);

  if (!("error" in formulaInput)) {
    const result = calculateExpectedDamage(formulaInput);
    checkTruthy("calculateExpectedDamage returns result", result);
    check("Formula result expectedDamage > 0", result.expectedDamage > 0, true);
  }

  // ---------------------------------------------------------------------------
  // 16. Resolver: resolveDamageForMechanic
  // ---------------------------------------------------------------------------
  const resolved = resolveDamageForMechanic("burn", hybridReport.stats, []);
  checkFalsy("resolveDamageForMechanic succeeds", "error" in resolved);

  if (!("error" in resolved)) {
    checkTruthy("Resolved has expectedDamage", resolved.expectedDamage > 0);
  }

  // ---------------------------------------------------------------------------
  // 17. Empty input handling
  // ---------------------------------------------------------------------------
  const emptyReport = aggregateModifiers([]);
  check("Empty input totalSources=0", emptyReport.totalSources, 0);
  check("Empty input activeSources=0", emptyReport.activeSources, 0);
  check("Empty input suppressed=0", emptyReport.suppressedCount, 0);

  // ---------------------------------------------------------------------------
  // 18. Enemy-type bonus does not pollute unrelated stats
  // ---------------------------------------------------------------------------
  const enemyTypeSources: ModifierSource[] = [
    {
      id: "enemy_boss",
      sourceType: "enemyTypeBonus",
      sourceLabel: "Boss Bonus",
      stat: "enemyTypeDMGBonus",
      value: 0.10,
      behavior: "additive",
      enemyType: "boss",
      confidence: "inferred",
    },
    {
      id: "normal_mod",
      sourceType: "mod",
      sourceLabel: "Normal Mod",
      stat: "burnDMGBonus",
      value: 0.15,
      behavior: "additive",
      mechanicId: "burn",
      confidence: "inferred",
    },
  ];

  const enemyReport = aggregateModifiers(enemyTypeSources);
  check("Enemy type bonus: enemyTypeDMGBonus=0.10", enemyReport.stats.stats.enemyTypeDMGBonus, 0.10);
  check("Enemy type bonus: burnDMGBonus=0.15", enemyReport.stats.stats.burnDMGBonus, 0.15);
  check("Enemy type sources=2", enemyReport.activeSources, 2);

  // ---------------------------------------------------------------------------
  // 19. Burn frequency bonus from BBQ Gloves
  // ---------------------------------------------------------------------------
  const bbqSource = getModifierSource("bbq_gloves_frequency");
  checkTruthy("BBQ Gloves modifier exists", bbqSource);
  check("BBQ Gloves stat is burnTickFrequencyBonus", bbqSource?.stat, "burnTickFrequencyBonus");
  check("BBQ Gloves value 1.0", bbqSource?.value, 1.0);

  // ---------------------------------------------------------------------------
  // 20. Human damage bonus modifier
  // ---------------------------------------------------------------------------
  const humanSource = getModifierSource("human_damage_keyword");
  checkTruthy("Human DMG modifier exists", humanSource);
  check("Human DMG stat is humanDamageBonus", humanSource?.stat, "humanDamageBonus");
  check("Human DMG value 0.10", humanSource?.value, 0.10);

  // ---------------------------------------------------------------------------
  // Print example aggregation reports
  // ---------------------------------------------------------------------------
  console.log("\n=== Example Aggregation Reports ===\n");

  console.log("--- Burn PvE Build ---");
  console.log(formatAggregationReport(burnReport).join("\n"));

  console.log("--- Physical Rifle Build ---");
  console.log(formatAggregationReport(physReport).join("\n"));

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`${"=".repeat(50)}`);
  console.log(
    `Modifier smoke tests: ${passCount}/${totalTests} passed${
      passCount === totalTests ? " \u2713" : ""
    }`
  );
  console.log(`${"=".repeat(50)}\n`);
}

runModifierSmokeTest();
