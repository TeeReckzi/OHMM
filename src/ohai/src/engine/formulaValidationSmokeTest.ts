import { getObservedDamageCases } from "./formulaObservedCases";
import { validateAllCases, formatValidationReport } from "./formulaTestHarness";
import { registerInitialOverrides } from "./overrides";

function runValidationSmokeTest(): void {
  console.log(
    "=== Module 18: Formula Validation Harness Smoke Test ===\n"
  );

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

  // ---------------------------------------------------------------------------
  // 1. Load observed cases
  // ---------------------------------------------------------------------------
  const cases = getObservedDamageCases();
  checkTruthy("getObservedDamageCases returns cases", cases.length > 0);
  check("At least 22 cases loaded (including EBR fire ring + Frost Vortex scaffolding)", cases.length >= 22, true);

  // ---------------------------------------------------------------------------
  // 2. Validate all cases through harness
  // ---------------------------------------------------------------------------
  const results = validateAllCases(cases);

  checkTruthy("validateAllCases returns results", results.length > 0);
  check("Results length matches cases", results.length, cases.length);

  // ---------------------------------------------------------------------------
  // 3. Each case produces a result
  // ---------------------------------------------------------------------------
  for (const r of results) {
    checkTruthy(`Result exists for ${r.caseId}`, r);
    check(
      `${r.caseId}: predictedDamage is a number`,
      typeof r.predictedDamage === "number" && !isNaN(r.predictedDamage),
      true
    );
    checkTruthy(
      `${r.caseId}: multiplierBreakdown is array`,
      Array.isArray(r.multiplierBreakdown)
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Known-good synthetic cases should pass (≤5% error)
  // ---------------------------------------------------------------------------
  const passCases = results.filter((r) => r.classification === "pass");
  checkTruthy("At least 18 cases classified as pass", passCases.length >= 18);

  for (const r of passCases) {
    check(
      `${r.caseId}: percent error ≤ 5%`,
      r.percentError <= 5.0,
      true
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Physical weapon fallback (no registry mechanic) works
  // ---------------------------------------------------------------------------
  const physicalBaseline = results.find(
    (r) => r.caseId === "physical-weapon-baseline"
  );
  checkTruthy("physical-weapon-baseline result exists", physicalBaseline);
  if (physicalBaseline) {
    check(
      "physical-weapon-baseline: formulaFamily is physical_weapon_damage",
      physicalBaseline.formulaFamily,
      "physical_weapon_damage"
    );
    check(
      "physical-weapon-baseline: predicted matches observed",
      physicalBaseline.predictedDamage,
      physicalBaseline.observedAverage
    );
  }

  const physicalCrit = results.find(
    (r) => r.caseId === "physical-weapon-crit-weakspot"
  );
  checkTruthy(
    "physical-weapon-crit-weakspot result exists",
    physicalCrit
  );
  if (physicalCrit) {
    check(
      "physical-weapon-crit-weakspot: predicted 255",
      physicalCrit.predictedDamage,
      255
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Burn cases have correct formula families
  // ---------------------------------------------------------------------------
  const burnBaseline = results.find((r) => r.caseId === "burn-baseline");
  if (burnBaseline) {
    check(
      "burn-baseline: formulaFamily is burn_stack_dot",
      burnBaseline.formulaFamily,
      "burn_stack_dot"
    );
  }

  const burnGG = results.find((r) => r.caseId === "burn-gilded-gloves");
  if (burnGG) {
    check(
      "burn-gilded-gloves: formulaFamily is burn_stack_dot",
      burnGG.formulaFamily,
      "burn_stack_dot"
    );
    checkTruthy(
      "burn-gilded-gloves: warnings include needsRetest",
      burnGG.warnings.some((w) => w.includes("needsRetest"))
    );
    checkTruthy(
      "burn-gilded-gloves: warnings include Gilded Gloves override",
      burnGG.warnings.some((w) => w.includes("Gilded Gloves"))
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Charged hybrid shot uses charged_status_damage
  // ---------------------------------------------------------------------------
  const charged = results.find((r) => r.caseId === "charged-hybrid-shot");
  if (charged) {
    check(
      "charged-hybrid-shot: formulaFamily is charged_status_damage",
      charged.formulaFamily,
      "charged_status_damage"
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Keyword suffix bucket appears for Burn with keywordSuffixDMGBonus
  // ---------------------------------------------------------------------------
  const burnKeyword = results.find((r) => r.caseId === "burn-keyword-suffix");
  if (burnKeyword) {
    checkTruthy(
      "burn-keyword-suffix: multiplier includes Keyword/Suffix DMG",
      burnKeyword.multiplierBreakdown.some((m) =>
        m.label.includes("Keyword/Suffix")
      )
    );
    check(
      "burn-keyword-suffix: predicted 18.22",
      burnKeyword.predictedDamage,
      18.22
    );
  }

  const psKeyword = results.find(
    (r) => r.caseId === "power-surge-keyword-suffix"
  );
  if (psKeyword) {
    checkTruthy(
      "power-surge-keyword-suffix: multiplier includes Keyword/Suffix DMG",
      psKeyword.multiplierBreakdown.some((m) =>
        m.label.includes("Keyword/Suffix")
      )
    );
    check(
      "power-surge-keyword-suffix: predicted 151.8",
      psKeyword.predictedDamage,
      151.8
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Status vulnerability bucket appears
  // ---------------------------------------------------------------------------
  const burnVuln = results.find(
    (r) => r.caseId === "burn-status-vulnerability"
  );
  if (burnVuln) {
    checkTruthy(
      "burn-status-vulnerability: multiplier includes Status Vulnerability",
      burnVuln.multiplierBreakdown.some((m) =>
        m.label.includes("Status Vulnerability")
      )
    );
    check(
      "burn-status-vulnerability: predicted 18.97",
      burnVuln.predictedDamage,
      18.97
    );
  }

  // ---------------------------------------------------------------------------
  // 10. Weapon vulnerability bucket appears for physical weapon
  // ---------------------------------------------------------------------------
  const physVuln = results.find(
    (r) => r.caseId === "physical-weapon-vulnerability"
  );
  if (physVuln) {
    checkTruthy(
      "physical-weapon-vulnerability: multiplier includes Weapon Vulnerability",
      physVuln.multiplierBreakdown.some((m) =>
        m.label.includes("Weapon Vulnerability")
      )
    );
    check(
      "physical-weapon-vulnerability: predicted 130",
      physVuln.predictedDamage,
      130
    );
  }

  // ---------------------------------------------------------------------------
  // 11. Enemy type DMG bonus bucket appears
  // ---------------------------------------------------------------------------
  const enemyBonus = results.find(
    (r) => r.caseId === "burn-enemy-type-bonus"
  );
  if (enemyBonus) {
    checkTruthy(
      "burn-enemy-type-bonus: multiplier includes Enemy Type DMG Bonus",
      enemyBonus.multiplierBreakdown.some((m) =>
        m.label.includes("Enemy Type DMG")
      )
    );
    check(
      "burn-enemy-type-bonus: predicted 17.46",
      enemyBonus.predictedDamage,
      17.46
    );
  }

  // ---------------------------------------------------------------------------
  // 12. Unsupported formula families (EBR + Frost Vortex single-hit + Power Surge hybrid)
  // ---------------------------------------------------------------------------
  const unsupported = results.filter(
    (r) => r.formulaFamily === "unsupported"
  );
  check(
    "Three unsupported formula families (EBR + Frost Vortex single-hit + Power Surge hybrid)",
    unsupported.length,
    3
  );

  const ebrResult = results.find(
    (r) => r.caseId === "ebr-fire-ring-provisional"
  );
  checkTruthy("ebr-fire-ring-provisional result exists", ebrResult);
  if (ebrResult) {
    check(
      "ebr-fire-ring-provisional: formulaFamily is unsupported",
      ebrResult.formulaFamily,
      "unsupported"
    );
    check(
      "ebr-fire-ring-provisional: classification is fail",
      ebrResult.classification,
      "fail"
    );
    check(
      "ebr-fire-ring-provisional: predictedDamage is 0",
      ebrResult.predictedDamage,
      0
    );
    checkTruthy(
      "ebr-fire-ring-provisional: warning mentions PROC FORMULA UNKNOWN",
      ebrResult.warnings.some((w) =>
        w.includes("PROC FORMULA UNKNOWN")
      )
    );
    checkTruthy(
      "ebr-fire-ring-provisional: warning mentions scaling source unknown",
      ebrResult.warnings.some((w) =>
        w.includes("scaling source") || w.includes("Scaling source")
      )
    );
    checkTruthy(
      "ebr-fire-ring-provisional: warning mentions in-game testing",
      ebrResult.warnings.some((w) =>
        w.includes("in-game testing") || w.includes("In-game testing")
      )
    );
    checkTruthy(
      "ebr-fire-ring-provisional: warning references investigation doc",
      ebrResult.warnings.some((w) =>
        w.includes("ebr-fire-ring-investigation.md")
      )
    );
    check(
      "ebr-fire-ring-provisional: needsRetest is true",
      ebrResult.needsRetest,
      true
    );
  }

  // ---------------------------------------------------------------------------
  // 13. Frost Vortex scaffolding — Hypothesis A (DoT) still passes
  // ---------------------------------------------------------------------------
  const frostDot = results.find((r) => r.caseId === "frost-vortex-baseline");
  checkTruthy("frost-vortex-baseline result exists", frostDot);
  if (frostDot) {
    check(
      "frost-vortex-baseline: formulaFamily is status_tick_damage",
      frostDot.formulaFamily,
      "status_tick_damage"
    );
    check(
      "frost-vortex-baseline: classification is pass",
      frostDot.classification,
      "pass"
    );
    check(
      "frost-vortex-baseline: predicted matches existing formula",
      frostDot.predictedDamage,
      126.5
    );
    checkTruthy(
      "frost-vortex-baseline: warning mentions MODEL CONFLICT",
      frostDot.warnings.some((w) => w.includes("MODEL CONFLICT"))
    );
    checkTruthy(
      "frost-vortex-baseline: warning mentions Hypothesis B",
      frostDot.warnings.some((w) => w.includes("Hypothesis B"))
    );
    checkTruthy(
      "frost-vortex-baseline: warning links to investigation doc",
      frostDot.warnings.some((w) => w.includes("frost-vortex-investigation.md"))
    );
  }

  // ---------------------------------------------------------------------------
  // 14. Frost Vortex scaffolding — Hypothesis B (single hit) is unsupported
  // ---------------------------------------------------------------------------
  const frostSingle = results.find(
    (r) => r.caseId === "frost-vortex-single-hit-hypothesis"
  );
  checkTruthy("frost-vortex-single-hit-hypothesis result exists", frostSingle);
  if (frostSingle) {
    check(
      "frost-vortex-single-hit-hypothesis: formulaFamily is unsupported",
      frostSingle.formulaFamily,
      "unsupported"
    );
    check(
      "frost-vortex-single-hit-hypothesis: classification is fail",
      frostSingle.classification,
      "fail"
    );
    check(
      "frost-vortex-single-hit-hypothesis: predictedDamage is 0",
      frostSingle.predictedDamage,
      0
    );
    checkTruthy(
      "frost-vortex-single-hit-hypothesis: warning mentions PROC FORMULA UNKNOWN",
      frostSingle.warnings.some((w) => w.includes("PROC FORMULA UNKNOWN"))
    );
    checkTruthy(
      "frost-vortex-single-hit-hypothesis: warning mentions model conflict",
      frostSingle.warnings.some((w) => w.includes("unresolved hypothesis"))
    );
    checkTruthy(
      "frost-vortex-single-hit-hypothesis: warning links to investigation doc",
      frostSingle.warnings.some((w) => w.includes("frost-vortex-investigation.md"))
    );
    check(
      "frost-vortex-single-hit-hypothesis: needsRetest is true",
      frostSingle.needsRetest,
      true
    );
  }

  // ---------------------------------------------------------------------------
  // 15. Power Surge scaffolding — Hypothesis A (pure DoT) still passes
  // ---------------------------------------------------------------------------
  const psDot = results.find((r) => r.caseId === "power-surge-baseline");
  checkTruthy("power-surge-baseline result exists", psDot);
  if (psDot) {
    check(
      "power-surge-baseline: formulaFamily is status_tick_damage",
      psDot.formulaFamily,
      "status_tick_damage"
    );
    check(
      "power-surge-baseline: classification is pass",
      psDot.classification,
      "pass"
    );
    check(
      "power-surge-baseline: predicted matches existing formula",
      psDot.predictedDamage,
      126.5
    );
    checkTruthy(
      "power-surge-baseline: warning mentions MODEL CONFLICT",
      psDot.warnings.some((w) => w.includes("MODEL CONFLICT"))
    );
    checkTruthy(
      "power-surge-baseline: warning mentions Hypothesis C",
      psDot.warnings.some((w) => w.includes("Hypothesis C"))
    );
    checkTruthy(
      "power-surge-baseline: warning links to investigation doc",
      psDot.warnings.some((w) => w.includes("power-surge-investigation.md"))
    );
  }

  // ---------------------------------------------------------------------------
  // 16. Power Surge scaffolding — Hypothesis C (hybrid) is unsupported
  // ---------------------------------------------------------------------------
  const psHybrid = results.find(
    (r) => r.caseId === "power-surge-hybrid-hypothesis"
  );
  checkTruthy("power-surge-hybrid-hypothesis result exists", psHybrid);
  if (psHybrid) {
    check(
      "power-surge-hybrid-hypothesis: formulaFamily is unsupported",
      psHybrid.formulaFamily,
      "unsupported"
    );
    check(
      "power-surge-hybrid-hypothesis: classification is fail",
      psHybrid.classification,
      "fail"
    );
    check(
      "power-surge-hybrid-hypothesis: predictedDamage is 0",
      psHybrid.predictedDamage,
      0
    );
    checkTruthy(
      "power-surge-hybrid-hypothesis: warning mentions PROC FORMULA UNKNOWN",
      psHybrid.warnings.some((w) => w.includes("PROC FORMULA UNKNOWN"))
    );
    checkTruthy(
      "power-surge-hybrid-hypothesis: warning mentions model conflict",
      psHybrid.warnings.some((w) => w.includes("unresolved hypothesis"))
    );
    checkTruthy(
      "power-surge-hybrid-hypothesis: warning links to investigation doc",
      psHybrid.warnings.some((w) => w.includes("power-surge-investigation.md"))
    );
    check(
      "power-surge-hybrid-hypothesis: needsRetest is true",
      psHybrid.needsRetest,
      true
    );
  }

  // ---------------------------------------------------------------------------
  // 17. New Burn stack cases produce correct predictions
  // ---------------------------------------------------------------------------
  const burn3Stacks = results.find((r) => r.caseId === "burn-3-stacks");
  if (burn3Stacks) {
    check("burn-3-stacks: predicted 15.18", burn3Stacks.predictedDamage, 15.18);
  }

  const burn5Stacks = results.find((r) => r.caseId === "burn-5-stacks");
  if (burn5Stacks) {
    check("burn-5-stacks: predicted 25.30", burn5Stacks.predictedDamage, 25.30);
  }

  const burnDOT = results.find((r) => r.caseId === "burn-dot-resistance");
  if (burnDOT) {
    check("burn-dot-resistance: predicted 12.14", burnDOT.predictedDamage, 12.14);
  }

  const burnResist = results.find((r) => r.caseId === "burn-resistance-debuff");
  if (burnResist) {
    check("burn-resistance-debuff: predicted 10.63", burnResist.predictedDamage, 10.63);
  }

  const burnHuman = results.find((r) => r.caseId === "burn-human-damage");
  if (burnHuman) {
    checkTruthy(
      "burn-human-damage: multiplier includes Human Damage Bonus",
      burnHuman.multiplierBreakdown.some((m) => m.label.includes("Human Damage"))
    );
    check("burn-human-damage: predicted 16.70", burnHuman.predictedDamage, 16.70);
  }

  const burnFlat = results.find((r) => r.caseId === "burn-flat-bonus");
  if (burnFlat) {
    check("burn-flat-bonus: predicted 18.97", burnFlat.predictedDamage, 18.97);
  }

  // ---------------------------------------------------------------------------
  // 14. BBQ frequency case: per-tick matches 3-stack baseline, DPS doubles
  // ---------------------------------------------------------------------------
  const burnBBQ = results.find((r) => r.caseId === "burn-bbq-frequency");
  if (burnBBQ) {
    check("burn-bbq-frequency: predicted 15.18 (same as 3-stack)", burnBBQ.predictedDamage, 15.18);
  }

  // ---------------------------------------------------------------------------
  // 17. Formatted report is produced
  // ---------------------------------------------------------------------------
  const reportLines = formatValidationReport(results);
  checkTruthy("formatValidationReport returns lines", reportLines.length > 0);
  check(
    "Report contains SUMMARY section",
    reportLines.some((l) => l.includes("SUMMARY")),
    true
  );
  check(
    "Report contains formula assumptions",
    reportLines.some((l) => l.includes("Formula Assumptions")),
    true
  );

  // ---------------------------------------------------------------------------
  // Print the full report
  // ---------------------------------------------------------------------------
  console.log("");
  for (const line of reportLines) {
    console.log(line);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`${"=".repeat(50)}`);
  console.log(
    `Validation smoke tests: ${passCount}/${totalTests} passed${
      passCount === totalTests ? " \u2713" : ""
    }`
  );
  console.log(`${"=".repeat(50)}\n`);
}

runValidationSmokeTest();
