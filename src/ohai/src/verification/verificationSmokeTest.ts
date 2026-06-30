import { resolveCanonicalEvidence } from "./conflictResolver";
import { buildExtractionHealthReport } from "./extractionScorecard";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`[verificationSmokeTest] ${message}`);
  }
}

const burnEvidence = [
  {
    sourceId: "manual-burn-test",
    sourceType: "manual-test" as const,
    value: true,
    fieldPath: "statusEffects.burn.canCrit"
  },
  {
    sourceId: "ocr-pass-12",
    sourceType: "ocr-extraction" as const,
    value: false,
    fieldPath: "statusEffects.burn.canCrit"
  },
  {
    sourceId: "gear-validation",
    sourceType: "manual-override" as const,
    value: true,
    fieldPath: "statusEffects.burn.canCrit"
  }
];

const burnResolution = resolveCanonicalEvidence<boolean>(burnEvidence);

assert(burnResolution.canonicalValue === true, "Expected manual-tested Burn crit result to win");
assert(burnResolution.contested === true, "Expected contested verification state");
assert(burnResolution.reviewRecommended === true, "Expected contested state to recommend review");
assert(burnResolution.confidence > 0.9, "Expected high confidence canonical resolution");

const extractionHealth = buildExtractionHealthReport({
  extractorId: "cradle-ocr-v2",
  dataset: "cradle-overrides",
  totalEntries: 100,
  validatedEntries: 82,
  correctedEntries: 11,
  rejectedEntries: 7,
  timestamp: new Date().toISOString()
});

assert(extractionHealth.reliabilityScore > 0.65, "Expected healthy extraction reliability score");
assert(extractionHealth.recommendation === "stable", "Expected stable extraction recommendation");

console.log("[verificationSmokeTest] All verification assertions passed.");
