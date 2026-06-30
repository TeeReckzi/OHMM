import { calculateExpectedDamage } from "./formulaApplicator";
import { buildFormulaInput } from "./formulaContext";
import { formatFormulaExplanation } from "./formulaExplainer";
import { applyGearOverridesToMechanic, getMechanicBehavior } from "./mechanicRegistry";
import { registerInitialOverrides } from "./overrides";

registerInitialOverrides();

const PLAYER_STATS = {
  weaponDMG: 0.15,
  statusDMGBonus: 0.15,
  elementalDMGBonus: 0.10,
  psiIntensity: 100,
  critRate: 0.30,
  critDMG: 2.00,
  weakspotDMG: 0.50,
};

function runSmokeTest(): void {
  console.log("=== Module 17: Combat Formula Application Smoke Test ===\n");

  let passed = 0;
  let failed = 0;
  const tests: { name: string; fn: () => boolean }[] = [];

  function test(name: string, fn: () => boolean): void {
    tests.push({ name, fn });
  }

  function runAll(): void {
    for (const t of tests) {
      try {
        const ok = t.fn();
        if (ok) {
          passed++;
          console.log(`  PASS ${t.name}`);
        } else {
          failed++;
          console.log(`  FAIL ${t.name}`);
        }
      } catch (e: unknown) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  FAIL ${t.name} (threw: ${msg})`);
      }
    }
  }

  // --- 1. Burn tick without Gilded Gloves → expectedCritMultiplier=1.0 ---
  test("1. Burn tick no GG → expectedCritMultiplier=1.0", () => {
    const input = buildFormulaInput("burn", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.expectedCritMultiplier === 1.0;
  });

  // --- 2. Burn tick with Gilded Gloves → expectedCritMultiplier uses standard expected crit ---
  test("2. Burn tick with GG → expectedCritMultiplier > 1.0 (standard expected crit)", () => {
    const input = buildFormulaInput("burn", PLAYER_STATS, ["Gilded Gloves"]);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    const expected = 1 + 0.30 * (2.00 - 1);
    return Math.abs(result.expectedCritMultiplier - expected) < 0.001;
  });

  // --- 3. Frost Vortex with Gilded Gloves → expectedCritMultiplier=1.0 ---
  test("3. Frost Vortex with GG → expectedCritMultiplier=1.0", () => {
    const input = buildFormulaInput("frostVortex", PLAYER_STATS, ["Gilded Gloves"]);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.expectedCritMultiplier === 1.0;
  });

  // --- 4. chargedHybridStatusShot → uses status + elemental + crit + weakspot ---
  test("4. chargedHybridStatusShot → all four multipliers in breakdown", () => {
    const input = buildFormulaInput("chargedHybridStatusShot", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    const labels = result.multipliers.map((m) => m.label);
    return (
      labels.some((l) => l.includes("Status DMG")) &&
      labels.some((l) => l.includes("Elemental DMG")) &&
      labels.some((l) => l.includes("Crit")) &&
      labels.some((l) => l.includes("Weakspot"))
    );
  });

  // --- 5. chargedHybridStatusShot → critWeakspotBucket additive ---
  test("5. chargedHybridStatusShot → combined mult is additive", () => {
    const input = buildFormulaInput("chargedHybridStatusShot", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    const expectedCombined = 1 + 0.30 * (2.00 - 1) + 0.50;
    return Math.abs(result.expectedCritMultiplier - expectedCombined) < 0.001;
  });

  // --- 6. Physical weapon → uses weaponDMG + weaponVulnerability ---
  test("6. Physical weapon → no status or elemental multipliers", () => {
    const input = buildFormulaInput("burn", { ...PLAYER_STATS, weaponDMG: 0.15 }, []);
    if ("error" in input) return false;
    const eb = input.effectiveBehavior;
    const modifiedEb = { ...eb, damageScalingBucket: "weapon" as const, displayBehavior: "direct_hit" as const, formulaTemplateId: undefined };
    const modifiedInput = { ...input, effectiveBehavior: modifiedEb, weaponDMGBonus: 0.15 };
    const result = calculateExpectedDamage(modifiedInput);
    const labels = result.multipliers.map((m) => m.label);
    return (
      labels.some((l) => l.includes("Weapon DMG")) &&
      !labels.some((l) => l.includes("Status DMG")) &&
      !labels.some((l) => l.includes("Elemental"))
    );
  });

  // --- 7. Status mechanic → uses statusVulnerability ---
  test("7. Status mechanic → uses status vulnerability", () => {
    const input = buildFormulaInput("burn", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.effectiveBehavior.vulnerabilityType === "status";
  });

  // --- 8. Deviation skill → psiIntensity × baseFactor only ---
  test("8. Deviation skill → no vulnerability/crit/weakspot multipliers", () => {
    const input = buildFormulaInput("butterflyEmissary", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    const psi = PLAYER_STATS.psiIntensity;
    const baseFactor = input.effectiveBehavior.baseFactor ?? 1.0;
    const expected = psi * baseFactor;
    return (
      Math.abs(result.expectedDamage - expected) < 0.01 &&
      result.expectedCritMultiplier === 1.0 &&
      result.expectedWeakspotMultiplier === 1.0
    );
  });

  // --- 9. Unknown mechanic → returns error ---
  test("9. Unknown mechanic → returns error", () => {
    const result = buildFormulaInput("nonexistent", PLAYER_STATS, []);
    if ("error" in result) {
      return result.error.includes("Unknown mechanic");
    }
    return false;
  });

  // --- 10. needsRetest → warning ---
  test("10. needsRetest=true behavior produces warning", () => {
    const input = buildFormulaInput("burn", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.warnings.some((w) => w.includes("needsRetest"));
  });

  // --- 11. Override source annotation ---
  test("11. Override that changed canCrit produces source-of-change warning", () => {
    const input = buildFormulaInput("burn", PLAYER_STATS, ["Gilded Gloves"]);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.warnings.some((w) => w.includes("Override") && w.includes("gilded-gloves-burn-crit"));
  });

  // --- 12. Burn burn_stack_dot multiplier breakdown matches expected terms ---
  test("12. Burn burn_stack_dot multiplier breakdown matches expected terms", () => {
    const input = buildFormulaInput("burn", PLAYER_STATS, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    const labels = result.multipliers.map((m) => m.label);
    return (
      labels.some((l) => l.includes("Status DMG")) &&
      labels.some((l) => l.includes("Elemental DMG")) &&
      result.formulaFamily === "burn_stack_dot" &&
      result.expectedDamage > 0
    );
  });

  // --- 13. critRate=0 with canCrit=true → expectedCritMultiplier=1.0 ---
  test("13. critRate=0 + canCrit=true → expectedCritMultiplier=1.0", () => {
    const zeroCritStats = { ...PLAYER_STATS, critRate: 0 };
    const input = buildFormulaInput("burn", zeroCritStats, ["Gilded Gloves"]);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.expectedCritMultiplier === 1.0;
  });

  // --- 14. canCrit=true but critDMG=1.0 → expectedCritMultiplier=1.0 ---
  test("14. canCrit=true + critDMG=1.0 → expectedCritMultiplier=1.0", () => {
    const noCdStats = { ...PLAYER_STATS, critDMG: 1.0 };
    const input = buildFormulaInput("burn", noCdStats, ["Gilded Gloves"]);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return result.expectedCritMultiplier === 1.0;
  });

  // --- 15. Burn stack dot burnDetails returned ---
  test("15. Burn stack formula returns burnDetails", () => {
    const stackStats = { ...PLAYER_STATS, weaponDMG: 100, burnCurrentStacks: 3 };
    const input = buildFormulaInput("burn", stackStats, []);
    if ("error" in input) return false;
    const result = calculateExpectedDamage(input);
    return (
      result.burnDetails !== undefined &&
      result.burnDetails.stacks === 3 &&
      result.burnDetails.damagePerSecond > 0
    );
  });

  // --- Run all tests ---
  runAll();

  // --- Bonus: print example explanations ---
  console.log("\n=== Example Explanations ===\n");

  const burnNoGG = buildFormulaInput("burn", PLAYER_STATS, []);
  if (!("error" in burnNoGG)) {
    const r1 = calculateExpectedDamage(burnNoGG);
    console.log(formatFormulaExplanation(r1).join("\n"));
    console.log();
  }

  const burnWithGG = buildFormulaInput("burn", PLAYER_STATS, ["Gilded Gloves"]);
  if (!("error" in burnWithGG)) {
    const r2 = calculateExpectedDamage(burnWithGG);
    console.log(formatFormulaExplanation(r2).join("\n"));
    console.log();
  }

  const burnStacked = buildFormulaInput("burn", { weaponDMG: 100, burnCurrentStacks: 5, statusDMGBonus: 0.15, elementalDMGBonus: 0.10, psiIntensity: 100 }, []);
  if (!("error" in burnStacked)) {
    const r3 = calculateExpectedDamage(burnStacked);
    console.log(formatFormulaExplanation(r3).join("\n"));
    console.log();
  }

  const chargedHybrid = buildFormulaInput("chargedHybridStatusShot", PLAYER_STATS, []);
  if (!("error" in chargedHybrid)) {
    const r4 = calculateExpectedDamage(chargedHybrid);
    console.log(formatFormulaExplanation(r4).join("\n"));
    console.log();
  }

  const deviation = buildFormulaInput("butterflyEmissary", PLAYER_STATS, []);
  if (!("error" in deviation)) {
    const r5 = calculateExpectedDamage(deviation);
    console.log(formatFormulaExplanation(r5).join("\n"));
    console.log();
  }

  console.log(`\n=== Results ===`);
  console.log(`  Passed: ${passed}/${tests.length}`);
  console.log(`  Failed: ${failed}/${tests.length}`);
  const passRate = tests.length > 0 ? ((passed / tests.length) * 100).toFixed(1) : "0.0";
  console.log(`  Pass rate: ${passRate}%`);
  console.log();
}

runSmokeTest();
