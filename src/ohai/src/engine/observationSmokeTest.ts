import { registerInitialOverrides } from "./overrides";
import { normalizeObservations, normalizedToObservedHits, buildObservationGroup } from "./observationNormalizer";
import { parseOcrExport, parseManualJson, parseStructuredJson, parseOcrExportLine } from "./observationParser";
import type { RawObservation, NormalizedObservation } from "./observationTypes";
import { DEFAULT_NORMALIZATION_CONFIG } from "./observationTypes";
import { getOverridesForGear } from "./mechanicRegistry";

function runObservationSmokeTest(): void {
  console.log("=== Module 19: Real Combat Data Ingestion Pipeline Smoke Test ===\n");

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
  // 1. OCR Parser correctness
  // ---------------------------------------------------------------------------
  const ocrText = [
    "# Combat log extract",
    "2024-01-15T14:30:22.123 Damage: 126 (Burn) [status]",
    "2024-01-15T14:30:22.623 Damage: 127 (Burn) [status]",
    "2024-01-15T14:30:23.123 Damage: 164 (Burn) [crit,status]",
    "2024-01-16 10:05:00 Damage: 255 (Physical) [crit,weakspot]",
    "// comment line",
  ].join("\n");

  const ocrParsed = parseOcrExport(ocrText);
  check("OCR parser returns 4 observations", ocrParsed.length, 4);
  check("OCR obs[0] rawDamage 126", ocrParsed[0]?.rawDamage, 126);
  check("OCR obs[0] sourceType ocr", ocrParsed[0]?.sourceType, "ocr");
  checkTruthy("OCR obs[0] has timestamp", ocrParsed[0]?.timestamp);
  check("OCR obs[0] mechanicId burn", ocrParsed[0]?.metadata?.mechanicId, "burn");
  checkTruthy("OCR obs[2] crit tag present", ocrParsed[2]?.metadata?.tags);

  // ---------------------------------------------------------------------------
  // 2. Manual JSON parser
  // ---------------------------------------------------------------------------
  const manualJson = JSON.stringify({
    mechanicId: "burn",
    displayName: "Manual Burn Test",
    playerStats: { psiIntensity: 100, statusDMG: 0.15 },
    hits: [
      { rawValue: 126, tags: ["status"] },
      { rawValue: 127, tags: ["status"] },
    ],
  });

  const manualParsed = parseManualJson(manualJson);
  check("Manual parser returns 2 observations", manualParsed.length, 2);
  check("Manual obs[0] rawDamage 126", manualParsed[0]?.rawDamage, 126);
  check("Manual obs[0] sourceType manual", manualParsed[0]?.sourceType, "manual");

  // ---------------------------------------------------------------------------
  // 3. Structured JSON parser
  // ---------------------------------------------------------------------------
  const structuredJson = JSON.stringify({
    observations: [
      {
        timestamp: "2024-01-15T14:30:22.123Z",
        rawDamage: 150,
        mechanicId: "powerSurge",
        tags: ["status", "elemental"],
      },
    ],
  });

  const structParsed = parseStructuredJson(structuredJson);
  check("Structured JSON returns 1 observation", structParsed.length, 1);
  check("Structured obs[0] rawDamage 150", structParsed[0]?.rawDamage, 150);
  check("Structured obs[0] sourceType json_import", structParsed[0]?.sourceType, "json_import");

  // ---------------------------------------------------------------------------
  // 4. Normalization stability
  // ---------------------------------------------------------------------------
  const rawBatch: RawObservation[] = [
    {
      id: "r1",
      rawDamage: 126,
      timestamp: "2024-01-15T14:30:22.123Z",
      sourceType: "ocr",
      rawText: "Damage: 126 (Burn) [status]",
      metadata: { mechanicId: "burn" },
    },
    {
      id: "r2",
      rawDamage: 127,
      timestamp: "2024-01-15T14:30:22.623Z",
      sourceType: "ocr",
      rawText: "Damage: 127 (Burn) [status]",
      metadata: { mechanicId: "burn" },
    },
  ];

  const { normalized: normBatch, audit } = normalizeObservations(rawBatch);
  check("Normalization produces 2 results after dedup", normBatch.length, 2);
  checkTruthy("Normalized obs[0] has mechanicId", normBatch[0]?.mechanicId);
  check("Normalized obs[0] mechanicId burn", normBatch[0]?.mechanicId, "burn");
  check("Normalized obs[0] has classification", normBatch[0]?.classification.confidence > 0, true);
  checkTruthy("Audit exists", audit);

  // ---------------------------------------------------------------------------
  // 5. OCR duplicate suppression
  // ---------------------------------------------------------------------------
  const dupConfig = { dedupeWindowMs: 500, numericTolerance: 0.02 };
  const duplicates: RawObservation[] = [
    {
      id: "d1",
      rawDamage: 126,
      timestamp: "2024-01-15T14:30:22.100Z",
      sourceType: "ocr",
      rawText: "Damage: 126 (Burn) [status]",
      metadata: { mechanicId: "burn" },
    },
    {
      id: "d2",
      rawDamage: 126,
      timestamp: "2024-01-15T14:30:22.150Z",
      sourceType: "ocr",
      rawText: "Damage: 126 (Burn) [status]",
      metadata: { mechanicId: "burn" },
    },
    {
      id: "d3",
      rawDamage: 126,
      timestamp: "2024-01-15T14:30:22.200Z",
      sourceType: "ocr",
      rawText: "Damage: 126 (Burn) [status]",
      metadata: { mechanicId: "burn" },
    },
    {
      id: "d4",
      rawDamage: 164,
      timestamp: "2024-01-15T14:30:23.100Z",
      sourceType: "ocr",
      rawText: "Damage: 164 (Burn) [crit,status]",
      metadata: { mechanicId: "burn" },
    },
  ];

  const { normalized: deduped, audit: dupAudit } =
    normalizeObservations(duplicates, dupConfig);
  check("Dedup reduces 4 OCR reads to 2 unique values", deduped.length, 2);
  check("Dedup audit totalRaw 4", dupAudit.totalRaw, 4);
  check("Dedup audit totalDeduped 2", dupAudit.totalDeduped, 2);
  check("Dedup audit groups 2", dupAudit.groups, 2);
  check("Dedup audit has 2 duplicate entries", dupAudit.duplicates.length, 2);

  // ---------------------------------------------------------------------------
  // 6. Group building from normalized observations
  // ---------------------------------------------------------------------------
  const group = buildObservationGroup(deduped, "test_group_1");
  checkTruthy("Group has observations", group.observations.length > 0);
  check("Group hitCount matches deduped length", group.hitCount, deduped.length);
  checkTruthy("Group averageDamage > 0", group.averageDamage > 0);
  checkTruthy("Group medianDamage > 0", group.medianDamage > 0);
  checkTruthy("Group classification has mechanicGuess", group.classification.mechanicGuess);

  // ---------------------------------------------------------------------------
  // 7. Conversion to Module 18 ObservedHit array
  // ---------------------------------------------------------------------------
  const hits = normalizedToObservedHits(group);
  check("ObservedHits count matches observations", hits.length, deduped.length);
  check("ObservedHit[0] rawValue matches", hits[0]?.rawValue, deduped[0]?.rawDamage);
  checkTruthy("ObservedHit[0] has confidence", hits[0]?.confidence);
  check("ObservedHit source is inferred for non-OCR/manual groups", hits[0]?.source, "OCR");

  // ---------------------------------------------------------------------------
  // 8. Parser handles empty/invalid input gracefully
  // ---------------------------------------------------------------------------
  const emptyOcr = parseOcrExport("");
  check("Empty OCR produces empty array", emptyOcr.length, 0);

  const emptyManual = parseManualJson("[]");
  check("Empty manual JSON array produces empty", emptyManual.length, 0);

  const emptyStructured = parseStructuredJson("{}");
  check("Empty structured JSON produces empty", emptyStructured.length, 0);

  const badOcr = parseOcrExport("# just a comment\n// another comment");
  check("Comment-only OCR produces empty", badOcr.length, 0);

  // ---------------------------------------------------------------------------
  // 9. Confidence propagation from sourceType
  // ---------------------------------------------------------------------------
  const confidenceCases: RawObservation[] = [
    {
      id: "c1",
      rawDamage: 100,
      sourceType: "manual",
      metadata: { mechanicId: "burn" },
    },
    {
      id: "c2",
      rawDamage: 100,
      sourceType: "ocr",
      metadata: { mechanicId: "burn" },
    },
    {
      id: "c3",
      rawDamage: 100,
      sourceType: "inferred",
      metadata: { mechanicId: "burn" },
    },
  ];

  const { normalized: confNorm } = normalizeObservations(confidenceCases);
  check("Manual confidence is observed_in_game_needs_testing", confNorm[0]?.confidence, "observed_in_game_needs_testing");
  check("OCR confidence is reported_current_patch_needs_testing", confNorm[1]?.confidence, "reported_current_patch_needs_testing");
  check("Inferred confidence is inferred", confNorm[2]?.confidence, "inferred");

  // ---------------------------------------------------------------------------
  // 10. OCR line regex handles various formats
  // ---------------------------------------------------------------------------
  const formatVariants = [
    "2024-01-15 14:30:22.123 Damage: 126 (Burn) [status]",
    "2024-01-15T14:30:22 Damage: 255 (Physical) [crit,weakspot]",
    "2024/01/15 14:30:22 Damage: 100",
  ].join("\n");
  const formatParsed = parseOcrExport(formatVariants);
  check("OCR parser handles 3 format variants", formatParsed.length, 3);
  check("Variant[0] rawDamage 126", formatParsed[0]?.rawDamage, 126);
  check("Variant[1] rawDamage 255", formatParsed[1]?.rawDamage, 255);
  check("Variant[2] rawDamage 100", formatParsed[2]?.rawDamage, 100);

  // ---------------------------------------------------------------------------
  // 11. OCR parser supports frame/time OCR format
  // ---------------------------------------------------------------------------
  const frameLine = "frame=0 time=0.0s damage=4490 raw=4490 confidence=0.5224";
  const frameParsed = parseOcrExportLine(frameLine);
  checkTruthy("Frame/time OCR line parses", frameParsed);
  if (frameParsed) {
    check("Frame/time rawDamage 4490", frameParsed.rawDamage, 4490);
    check("Frame/time sourceType ocr", frameParsed.sourceType, "ocr");
    check("Frame/time timestamp undefined (no absolute time)", frameParsed.timestamp, undefined);
    check("Frame/time metadata frame 0", frameParsed.metadata?.frame, 0);
    check("Frame/time metadata relativeTimeSeconds 0.0", frameParsed.metadata?.relativeTimeSeconds, 0.0);
    check("Frame/time metadata confidence 0.5224", frameParsed.metadata?.confidence, 0.5224);
    check("Frame/time metadata ocrFormat frame_time", frameParsed.metadata?.ocrFormat, "frame_time");
  }

  // ---------------------------------------------------------------------------
  // 12. OCR parser handles mixed formats in a single export
  // ---------------------------------------------------------------------------
  const mixedText = [
    "# Mixed format export",
    "2024-01-15T14:30:22.123 Damage: 126 (Burn) [status]",
    "frame=1 time=0.5s damage=127 raw=127.0 confidence=0.9100",
    "frame=2 time=1.0s damage=164 raw=164 confidence=0.8800",
  ].join("\n");
  const mixedParsed = parseOcrExport(mixedText);
  check("Mixed format OCR returns 3 observations", mixedParsed.length, 3);
  check("Mixed[0] rawDamage 126 (timestamp format)", mixedParsed[0]?.rawDamage, 126);
  check("Mixed[1] rawDamage 127 (frame format)", mixedParsed[1]?.rawDamage, 127);
  check("Mixed[2] rawDamage 164 (frame format)", mixedParsed[2]?.rawDamage, 164);
  checkTruthy("Mixed[0] has timestamp", mixedParsed[0]?.timestamp);
  check("Mixed[1] timestamp undefined (frame format)", mixedParsed[1]?.timestamp, undefined);
  check("Mixed[1] metadata.frame 1", mixedParsed[1]?.metadata?.frame, 1);
  check("Mixed[1] metadata.relativeTimeSeconds 0.5", mixedParsed[1]?.metadata?.relativeTimeSeconds, 0.5);

  // ---------------------------------------------------------------------------
  // 13. Legacy OCR format still works
  // ---------------------------------------------------------------------------
  const legacyLine = "2024-01-15 14:30:22.123 Damage: 255 (Physical) [crit,weakspot]";
  const legacyParsed = parseOcrExportLine(legacyLine);
  checkTruthy("Legacy OCR format still parses", legacyParsed);
  if (legacyParsed) {
    check("Legacy rawDamage 255", legacyParsed.rawDamage, 255);
    checkTruthy("Legacy has timestamp", legacyParsed.timestamp);
    check("Legacy mechanicId physical", legacyParsed.metadata?.mechanicId, "physical");
  }

  // ---------------------------------------------------------------------------
  // 14. Stale override fields removed from GearMechanicOverride
  // ---------------------------------------------------------------------------
  const gildedOverrides = getOverridesForGear("Gilded Gloves");
  checkTruthy("Gilded Gloves overrides exist", gildedOverrides.length > 0);
  for (const ov of gildedOverrides) {
    const hasOldCritInstance = "createsAdditionalCritDamageInstance" in ov;
    const hasOldPreserveBase = "preservesBaseTick" in ov;
    check(
      `Override ${ov.overrideId} does not have stale createsAdditionalCritDamageInstance`,
      hasOldCritInstance,
      false
    );
    check(
      `Override ${ov.overrideId} does not have stale preservesBaseTick`,
      hasOldPreserveBase,
      false
    );
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${"=".repeat(50)}`);
  console.log(
    `Observation smoke tests: ${passCount}/${totalTests} passed${
      passCount === totalTests ? " \u2713" : ""
    }`
  );
  console.log(`${"=".repeat(50)}\n`);
}

runObservationSmokeTest();
