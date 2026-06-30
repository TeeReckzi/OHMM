export interface ExtractionScorecardEntry {
  readonly extractorId: string;
  readonly dataset: string;
  readonly totalEntries: number;
  readonly validatedEntries: number;
  readonly correctedEntries: number;
  readonly rejectedEntries: number;
  readonly timestamp: string;
}

export interface ExtractionHealthReport {
  readonly extractorId: string;
  readonly dataset: string;
  readonly validationRate: number;
  readonly correctionRate: number;
  readonly rejectionRate: number;
  readonly reliabilityScore: number;
  readonly recommendation: string;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function buildExtractionHealthReport(
  entry: ExtractionScorecardEntry
): ExtractionHealthReport {
  const total = Math.max(1, entry.totalEntries);

  const validationRate = entry.validatedEntries / total;
  const correctionRate = entry.correctedEntries / total;
  const rejectionRate = entry.rejectedEntries / total;

  const reliabilityScore = clamp01(
    validationRate - correctionRate * 0.45 - rejectionRate * 0.85
  );

  let recommendation = "stable";

  if (reliabilityScore < 0.45) {
    recommendation = "rewrite-or-retrain";
  } else if (reliabilityScore < 0.7) {
    recommendation = "needs-review";
  }

  return {
    extractorId: entry.extractorId,
    dataset: entry.dataset,
    validationRate,
    correctionRate,
    rejectionRate,
    reliabilityScore,
    recommendation
  };
}
