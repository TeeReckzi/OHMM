import {
  SourceEvidence,
  isCanonicalEligible,
  normalizeComparableValue,
  scoreSourceEvidence
} from "./sourceWeights";

export interface ContestedField {
  readonly fieldPath: string;
  readonly values: string[];
  readonly evidenceCount: number;
}

export interface VerificationResolution<T = unknown> {
  readonly canonicalValue: T | null;
  readonly confidence: number;
  readonly contested: boolean;
  readonly contestedFields: ContestedField[];
  readonly winningEvidence?: SourceEvidence;
  readonly evidence: SourceEvidence[];
  readonly reviewRecommended: boolean;
}

export function resolveCanonicalEvidence<T = unknown>(
  evidence: SourceEvidence[]
): VerificationResolution<T> {
  if (!evidence.length) {
    return {
      canonicalValue: null,
      confidence: 0,
      contested: false,
      contestedFields: [],
      evidence: [],
      reviewRecommended: true
    };
  }

  const scored = evidence
    .map((entry) => ({
      entry,
      score: scoreSourceEvidence(entry),
      normalizedValue: normalizeComparableValue(entry.value)
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const grouped = new Map<string, typeof scored>();

  for (const item of scored) {
    const existing = grouped.get(item.normalizedValue) ?? [];
    existing.push(item);
    grouped.set(item.normalizedValue, existing);
  }

  const contestedFields: ContestedField[] = [];

  if (grouped.size > 1) {
    contestedFields.push({
      fieldPath: top.entry.fieldPath ?? "unknown",
      values: [...grouped.keys()],
      evidenceCount: evidence.length
    });
  }

  const canonicalEvidence = scored.find(({ entry }) => isCanonicalEligible(entry)) ?? top;

  const reviewRecommended =
    grouped.size > 1 ||
    canonicalEvidence.score < 0.75 ||
    !isCanonicalEligible(canonicalEvidence.entry);

  return {
    canonicalValue: canonicalEvidence.entry.value as T,
    confidence: canonicalEvidence.score,
    contested: grouped.size > 1,
    contestedFields,
    winningEvidence: canonicalEvidence.entry,
    evidence,
    reviewRecommended
  };
}
