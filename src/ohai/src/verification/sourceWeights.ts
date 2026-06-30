export type VerificationSourceType =
  | "manual-test"
  | "manual-override"
  | "verified-game-data"
  | "datamined-source"
  | "trusted-external-db"
  | "official-patch-notes"
  | "ocr-extraction"
  | "community-source"
  | "inference"
  | "unknown";

export interface SourceWeightProfile {
  readonly type: VerificationSourceType;
  readonly baseWeight: number;
  readonly description: string;
  readonly canonicalEligible: boolean;
}

export interface SourceEvidence {
  readonly sourceId: string;
  readonly sourceType: VerificationSourceType;
  readonly value: unknown;
  readonly fieldPath?: string;
  readonly label?: string;
  readonly observedAt?: string;
  readonly notes?: string;
  readonly confidenceOverride?: number;
  readonly penalty?: number;
  readonly bonus?: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const SOURCE_WEIGHT_PROFILES: Record<VerificationSourceType, SourceWeightProfile> = {
  "manual-test": {
    type: "manual-test",
    baseWeight: 0.96,
    canonicalEligible: true,
    description: "Direct in-game testing or controlled observation. Highest trust unless the test protocol is incomplete."
  },
  "manual-override": {
    type: "manual-override",
    baseWeight: 0.93,
    canonicalEligible: true,
    description: "Human-reviewed correction intentionally overriding extracted or imported data."
  },
  "verified-game-data": {
    type: "verified-game-data",
    baseWeight: 0.9,
    canonicalEligible: true,
    description: "Data already promoted into a verified project snapshot."
  },
  "official-patch-notes": {
    type: "official-patch-notes",
    baseWeight: 0.86,
    canonicalEligible: true,
    description: "Official patch/update text. Strong source, but still needs project normalization."
  },
  "datamined-source": {
    type: "datamined-source",
    baseWeight: 0.82,
    canonicalEligible: true,
    description: "Raw or semi-raw game data. Strong but may need localization/context interpretation."
  },
  "trusted-external-db": {
    type: "trusted-external-db",
    baseWeight: 0.74,
    canonicalEligible: true,
    description: "External database with recurring usefulness, but not controlled by this project."
  },
  "community-source": {
    type: "community-source",
    baseWeight: 0.58,
    canonicalEligible: false,
    description: "Community/wiki/Discord source. Useful for leads, not enough alone for canonical promotion."
  },
  "ocr-extraction": {
    type: "ocr-extraction",
    baseWeight: 0.48,
    canonicalEligible: false,
    description: "OCR or frame extraction output. Must be validated before canonical use."
  },
  "inference": {
    type: "inference",
    baseWeight: 0.36,
    canonicalEligible: false,
    description: "Reasoned deduction from related facts. Useful for review queues, not canonical by itself."
  },
  unknown: {
    type: "unknown",
    baseWeight: 0.2,
    canonicalEligible: false,
    description: "Unlabeled or untrusted source. Should not promote without review."
  }
};

export function getSourceWeightProfile(sourceType: VerificationSourceType): SourceWeightProfile {
  return SOURCE_WEIGHT_PROFILES[sourceType] ?? SOURCE_WEIGHT_PROFILES.unknown;
}

export function scoreSourceEvidence(evidence: SourceEvidence): number {
  const profile = getSourceWeightProfile(evidence.sourceType);

  if (typeof evidence.confidenceOverride === "number") {
    return clamp01(evidence.confidenceOverride);
  }

  const bonus = evidence.bonus ?? 0;
  const penalty = evidence.penalty ?? 0;
  return clamp01(profile.baseWeight + bonus - penalty);
}

export function isCanonicalEligible(evidence: SourceEvidence): boolean {
  return getSourceWeightProfile(evidence.sourceType).canonicalEligible;
}

export function normalizeComparableValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "<missing>";
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}
