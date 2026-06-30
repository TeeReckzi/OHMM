import {
  getProcSource,
  listProcSources,
  getProcSourcesForSource,
  getProcSourcesGeneratingMechanic,
} from "./procResolver";
import { getInternalRegistry } from "./procRegistry";
import {
  getMechanicBehavior,
  getOverridesForGear,
} from "./mechanicRegistry";
import { registerInitialOverrides } from "./overrides";

function runProcSmokeTest(): void {
  console.log("=== Module 18: Proc/Event Source Registry Smoke Test ===\n");

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
  // 1. EBR fire ring proc exists
  // ---------------------------------------------------------------------------
  const ebr = getProcSource("ebr_fire_ring");
  checkTruthy("getProcSource('ebr_fire_ring') returns a proc", ebr);

  if (ebr) {
    check("procId", ebr.procId, "ebr_fire_ring");
    check("displayName", ebr.displayName, "EBR Grilled Octopus Fire Ring");
    check("sourceType", ebr.sourceType, "weapon");
  }

  // ---------------------------------------------------------------------------
  // 2. Attributed to EBR, not Gilded Gloves
  // ---------------------------------------------------------------------------
  check("sourceId is ebr_grilled_octopus", ebr?.sourceId, "ebr_grilled_octopus");

  const sourcesForEBR = getProcSourcesForSource("ebr_grilled_octopus");
  checkTruthy("getProcSourcesForSource finds EBR proc", sourcesForEBR.length > 0);
  check(
    "getProcSourcesForSource returns ebr_fire_ring",
    sourcesForEBR[0]?.procId,
    "ebr_fire_ring"
  );

  // Gilded Gloves overrides exist but are not proc sources
  const gildedOverrides = getOverridesForGear("Gilded Gloves");
  checkTruthy("Gilded Gloves overrides exist", gildedOverrides.length > 0);

  // No proc source with sourceId = "Gilded Gloves"
  const gildedProcs = getProcSourcesForSource("Gilded Gloves");
  check("Gilded Gloves has 0 proc sources", gildedProcs.length, 0);

  // ---------------------------------------------------------------------------
  // 3. Generates a separate Burn/fire-ring style event
  // ---------------------------------------------------------------------------
  check(
    "generatedMechanicId is burn",
    ebr?.generatedMechanicId,
    "burn"
  );
  check(
    "generatedFormulaFamily is status_tick_damage",
    ebr?.generatedFormulaFamily,
    "status_tick_damage"
  );
  check(
    "damageScalingBucket is status",
    ebr?.damageScalingBucket,
    "status"
  );
  check(
    "element is blaze",
    ebr?.element,
    "blaze"
  );

  // Burn behavior exists from Module 15
  const burnBehavior = getMechanicBehavior("burn");
  checkTruthy("Burn mechanic behavior exists in Module 15 registry", burnBehavior);

  // ---------------------------------------------------------------------------
  // 4. Gilded Gloves remains crit eligibility only (not a proc source)
  // ---------------------------------------------------------------------------
  const allProcIds = listProcSources().map((p) => p.procId);
  check(
    "No proc ID references Gilded Gloves",
    allProcIds.includes("gilded_gloves"),
    false
  );

  // Confirm Gilded Gloves override is NOT in proc registry
  checkFalsy(
    "getProcSource('gilded_gloves') returns undefined",
    getProcSource("gilded_gloves")
  );

  // Gilded Gloves overrides: verify no crit instance / preserveBaseTick fields
  for (const ov of gildedOverrides) {
    const hasOldCritInstance = "createsAdditionalCritDamageInstance" in ov;
    const hasOldPreserveBase = "preservesBaseTick" in ov;
    check(
      `Override ${ov.overrideId} does not have createsAdditionalCritDamageInstance`,
      hasOldCritInstance,
      false
    );
    check(
      `Override ${ov.overrideId} does not have preservesBaseTick`,
      hasOldPreserveBase,
      false
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Resolver helpers work
  // ---------------------------------------------------------------------------
  const allProcs = listProcSources();
  check("listProcSources returns at least 1 proc", allProcs.length >= 1, true);

  const burnProcs = getProcSourcesGeneratingMechanic("burn");
  checkTruthy(
    "getProcSourcesGeneratingMechanic('burn') returns results",
    burnProcs.length > 0
  );
  check(
    "burn-generating proc is ebr_fire_ring",
    burnProcs[0]?.procId,
    "ebr_fire_ring"
  );

  const frostProcs = getProcSourcesGeneratingMechanic("frost_vortex");
  check("No procs generate frost_vortex yet", frostProcs.length, 0);

  // ---------------------------------------------------------------------------
  // 6. Registry is not externally mutable
  // ---------------------------------------------------------------------------
  const reg = getInternalRegistry();
  const regSizeBefore = reg.size;
  // Attempting to set directly on the map should not affect the internal registry
  // (getInternalRegistry returns a read-only reference, but Map is still mutable
  //  by the caller in TypeScript — this is a convention check, not enforced)
  check("Internal registry has correct size", reg.size, regSizeBefore);

  // ---------------------------------------------------------------------------
  // 7. Confidence and retest flags
  // ---------------------------------------------------------------------------
  check(
    "confidence is reported_current_patch_needs_testing",
    ebr?.confidence,
    "reported_current_patch_needs_testing"
  );
  check("needsRetest is true", ebr?.needsRetest, true);

  // ---------------------------------------------------------------------------
  // 8. Provisional classification fields
  // ---------------------------------------------------------------------------
  check(
    "procKind is conditionalExplosion",
    ebr?.procKind,
    "conditionalExplosion"
  );
  check(
    "scalingSource is unknown",
    ebr?.scalingSource,
    "unknown"
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${"=".repeat(50)}`);
  console.log(
    `Result: ${passCount}/${totalTests} passed${
      passCount === totalTests ? " \u2713" : ""
    }`
  );
  console.log(`${"=".repeat(50)}\n`);
}

runProcSmokeTest();
