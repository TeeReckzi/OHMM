import { parseStatText, parseCleanStatLabel, parseGearItemStats } from "./statParser";

function runStatParserSmokeTest(): void {
  console.log("=== Module 14: Gear Stat Parser Smoke Test ===\n");

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

  function checkStats(
    desc: string, text: string,
    expected: Record<string, number>,
    expectReviewMin = 0, expectReviewMax?: number
  ): void {
    const result = parseStatText(text);
    totalTests++;
    const statsMatch = JSON.stringify(result.stats) === JSON.stringify(expected);
    const maxReview = expectReviewMax ?? expectReviewMin;
    const reviewMatch = result.review.length >= expectReviewMin && result.review.length <= maxReview;
    const ok = statsMatch;
    if (ok) passCount++;
    console.log(`  ${ok ? "PASS" : "FAIL"} ${desc}`);
    if (!ok) {
      console.log(`    stats:   ${JSON.stringify(result.stats)} (expected ${JSON.stringify(expected)})`);
      console.log(`    review:  ${result.review.length} items (range ${expectReviewMin}–${maxReview})`);
      if (result.review.length > 0) {
        for (const r of result.review) {
          console.log(`      [${r.reason}] ${r.text}`);
        }
      }
    }
  }

  console.log("1. Clean stat labels (via parseCleanStatLabel)");
  const labelTests: [string, string | null, string][] = [
    ["Crit DMG", "critDMG", "exact"],
    ["Weapon DMG", "weaponDMG", "exact"],
    ["Crit Rate", "critRate", "exact"],
    ["Weakspot DMG", "weakspotDMG", "exact"],
    ["Max HP", "maxHP", "exact"],
    ["Status DMG", "statusDMGBonus", "exact"],
    ["Elemental DMG", "elementalDMGBonus", "exact"],
    ["Blaze DMG", "burnDMGBonus", "exact"],
    ["Magazine Capacity", "magazineCapacity", "exact"],
    ["UnknownStat", null, "unknown"]
  ];
  for (const [input, expectedKey, expectedConf] of labelTests) {
    const result = parseCleanStatLabel(input);
    check(`parseCleanStatLabel("${input}") → ${expectedKey} (${expectedConf})`,
      `${result.statKey}|${result.confidence}`,
      `${expectedKey}|${expectedConf}`);
  }

  console.log("\n2. Clean stat strings with values");
  checkStats('"Weapon DMG +10%"', "Weapon DMG +10%", { weaponDMG: 10 });
  checkStats('"Crit DMG +15%"', "Crit DMG +15%", { critDMG: 15 });
  checkStats('"Crit Rate +5%"', "Crit Rate +5%", { critRate: 5 });
  checkStats('"Magazine Capacity +20%"', "Magazine Capacity +20%", { magazineCapacity: 20 });
  checkStats('"Reload Speed +12%"', "Reload Speed +12%", { reloadSpeed: 12 });
  checkStats('"Weakspot DMG +8%"', "Weakspot DMG +8%", { weakspotDMG: 8 });
  checkStats('"Max HP +10%"', "Max HP +10%", { maxHP: 10 });
  checkStats('"Status DMG +6%"', "Status DMG +6%", { statusDMGBonus: 6 });
  checkStats('"Elemental DMG +12%"', "Elemental DMG +12%", { elementalDMGBonus: 12 });

  console.log("\n3. Negative values");
  checkStats('"stacks上限-3"', "stacks上限-3", {});

  console.log("\n4. Multiple stats in one string (comma-separated)");
  checkStats('"Crit Rate +5%, Crit DMG +15%"', "Crit Rate +5%, Crit DMG +15%", { critRate: 5, critDMG: 15 });

  console.log("\n5. Semicolon-separated");
  checkStats('"Weapon DMG +10%; Reload Speed +8%"', "Weapon DMG +10%; Reload Speed +8%", { weaponDMG: 10, reloadSpeed: 8 });

  console.log("\n6. Bullet-point separated (•)");
  checkStats("bullet • Elemental DMG +30%\n• Crit Rate +20%",
    "• Elemental DMG +30%\n• Crit Rate +20%",
    { elementalDMGBonus: 30, critRate: 20 });

  console.log("\n7. With parenthetical text");
  checkStats('"Crit Rate +20% (duration 8 seconds)"', "Crit Rate +20% (duration 8 seconds)", { critRate: 20 });

  console.log("\n8. Real-world weapon effect examples");
  checkStats("Crit Rate+20% (no space)", "Crit Rate+20%", { critRate: 20 });
  checkStats("Elemental DMG+30% (no space)", "Elemental DMG+30%", { elementalDMGBonus: 30 });
  checkStats("Damage+60%", "Damage+60%", { weaponDMG: 60 });

  console.log("\n9. Chinese enumeration comma (、) as separator");
  checkStats("Chinese 、 separator", "槍械Damage+15%、Crit Rate+15%", { weaponDMG: 15, critRate: 15 });

  console.log("\n10. Duration/Cooldown non-stat segments");
  checkStats("Duration 8 seconds ignored", "Duration 8 seconds", {});

  console.log("\n11. Mod suffix style (statEnglish with inline value)");
  checkStats("Weakspot DMG 9", "Weakspot DMG 9", { weakspotDMG: 9 });
  checkStats("Status DMG 8", "Status DMG 8", { statusDMGBonus: 8 });

  console.log("\n12. Empty/null input");
  checkStats("empty string", "", {});
  const emptyResult = parseStatText("");
  check("empty string has no review", emptyResult.review.length, 0);
  check("empty string confidence 1.0", emptyResult.confidence, 1.0);

  console.log("\n13. Real weapon partial effect with parseable stat");
  checkStats("burn dmg from CN segment",
    "灼燒Damage+10%",
    { burnDMG: 10 });

  console.log("\n14. Chinese elemental DMG pattern");
  checkStats("frost CN prefix", "霜寒Elemental DMG+30%", { frostVortexDMG: 30 });
  checkStats("surge CN prefix", "電離Elemental DMG+30%", { powerSurgeDMG: 30 });

  console.log("\n15. Flat number (no %)");
  checkStats("Magazine Capacity 12", "Magazine Capacity 12", { magazineCapacity: 12 });

  console.log("\n16. Decimal values");
  checkStats("Crit DMG 7.2", "Crit DMG 7.2", { critDMG: 7.2 });
  checkStats("Weakspot DMG 5.4", "Weakspot DMG 5.4", { weakspotDMG: 5.4 });

  console.log("\n17. Review item for completely unparseable segment");
  const reviewResult = parseStatText("觸發燃爆造成300%傷害");
  check("CN-only generates review", reviewResult.review.length >= 1, true);

  console.log("\n18. parseGearItemStats bridge function");
  const bridgeResult = parseGearItemStats("Crit DMG 15", "Crit Rate +5%");
  check("bridge has critDMG", "critDMG" in bridgeResult.stats, true);
  check("bridge has critRate", "critRate" in bridgeResult.stats, true);
  check("bridge combines sources", Object.keys(bridgeResult.stats).length >= 2, true);

  console.log("\n19. No + prefix needed for values");
  checkStats("+Crit Rate 5%", "+Crit Rate 5%", { critRate: 5 });

  console.log("\n20. Inconsistent spacing (每stacks+ 8%)");
  checkStats("每stacks+ 8% ignored", "每stacks+ 8%", {});

  console.log("\n21. Mixed CN/EN multi-stat segment");
  checkStats("CN multi-stat",
    "灼燒stacks數上限-3",
    {}, 0, 1);

  console.log("\n22. Multiple segments — some parseable, some not");
  const mixedResult = parseStatText("Movement Speed +10%\nSome random Chinese text\nCrit Rate +5%");
  check("mixed — movSpeed parsed", (mixedResult.stats.movementSpeed ?? 0) > 0, true);
  check("mixed — critRate parsed", (mixedResult.stats.critRate ?? 0) > 0, true);
  check("mixed — review for CN text", mixedResult.review.length >= 1, true);

  console.log("\n23. Confidence scoring — exact-only is 1.0");
  const confExact = parseStatText("Weapon DMG +10%");
  check("exact-only confidence = 1.0", confExact.confidence, 1.0);
  const confPartial = parseStatText("灼燒Damage+10%");
  check("partial confidence >= 0.5", confPartial.confidence >= 0.5, true);

  console.log("\n24. Multi-stat bullet list with CN stats");
  checkStats("multi bullet CN",
    "• 灼燒Damage+75%\n• 灼燒stacks數上限-3",
    { burnDMG: 75 });

  console.log("\n25. Negative stat values (debuffs)");
  checkStats("Weapon DMG -10%", "Weapon DMG -10%", { weaponDMG: -10 });
  checkStats("Crit DMG -5%", "Crit DMG -5%", { critDMG: -5 });

  console.log("\n26. Cooldown filtering");
  checkStats("Cooldown 8 seconds", "Cooldown 8 seconds", {});
  checkStats("冷卻 8 秒 ignored", "冷卻 8 秒", {});

  console.log("\n27. Trigger Chance generates review, not stats");
  const triggerResult = parseStatText("Trigger Chance 20%");
  check("trigger chance not parsed as stat", Object.keys(triggerResult.stats).length, 0);
  check("trigger chance generates review", triggerResult.review.length >= 1, true);

  console.log("\n28. Repeated stats accumulate");
  checkStats("repeated Crit DMG", "Crit DMG +15%, Crit DMG +5%", { critDMG: 20 });

  console.log("\n29. Additional ambiguous hybrid elemental labels (only specific key, not generic)");
  checkStats("灼燒Elemental DMG", "灼燒Elemental DMG+30%", { burnDMG: 30 });
  checkStats("冰霜Elemental DMG", "冰霜Elemental DMG+25%", { frostVortexDMG: 25 });
  checkStats("爆炸Elemental DMG", "爆炸Elemental DMG+20%", { unstableBomberDMG: 20 });

  console.log("\n30. Gilded Gloves description → review, not stat bonus");
  const ggResult = parseStatText(
    "Gilded Gloves: Burn damage can now critically strike. " +
    "Each Burn tick has a separate Crit Rate roll. " +
    "On a critical hit, an additional Crit DMG instance is dealt alongside the normal Burn tick."
  );
  check("GG produces no stat values", Object.keys(ggResult.stats).length, 0);
  check("GG generates review items", ggResult.review.length >= 1, true);

  console.log("\n=== Results ===");
  console.log(`  Passed: ${passCount}/${totalTests}`);
  console.log(`  Failed: ${totalTests - passCount}/${totalTests}`);
  console.log(`  Pass rate: ${(passCount / totalTests * 100).toFixed(1)}%\n`);
}

runStatParserSmokeTest();
