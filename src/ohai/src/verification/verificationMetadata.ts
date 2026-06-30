import type { SourceEvidence } from "./sourceWeights";
import { resolveCanonicalEvidence } from "./conflictResolver";

export type VerificationStatus =
  | "verified"
  | "observed"
  | "estimated"
  | "experimental"
  | "placeholder"
  | "contested";

export interface VerificationFlag {
  readonly code: string;
  readonly severity: "info" | "warning" | "error";
  readonly message: string;
}

export interface CanonicalVerificationMetadata {
  readonly status: VerificationStatus;
  readonly confidenceScore: number;
  readonly contested: boolean;
  readonly reviewRecommended: boolean;
  readonly sourceCount: number;
  readonly winningSourceId?: string;
  readonly winningSourceType?: SourceEvidence["sourceType"];
  readonly contestedFields: readonly string[];
  readonly flags: readonly VerificationFlag[];
  readonly lastEvaluatedAt: string;
}

export interface BuildVerificationMetadataInput {
  readonly evidence: SourceEvidence[];
  readonly fallbackStatus?: VerificationStatus;
  readonly lastEvaluatedAt?: string;
}

function statusFromConfidence(confidenceScore: number, contested: boolean): VerificationStatus {
  if (contested) return "contested";
  if (confidenceScore >= 0.9) return "verified";
  if (confidenceScore >= 0.75) return "observed";
  if (confidenceScore >= 0.55) return "estimated";
  if (confidenceScore > 0) return "experimental";
  return "placeholder";
}

export function buildVerificationMetadata(
  input: BuildVerificationMetadataInput
): CanonicalVerificationMetadata {
  const resolution = resolveCanonicalEvidence(input.evidence);
  const status = input.fallbackStatus ?? statusFromConfidence(
    resolution.confidence,
    resolution.contested
  );

  const flags: VerificationFlag[] = [];

  if (!input.evidence.length) {
    flags.push({
      code: "NO_EVIDENCE",
      severity: "error",
      message: "No source evidence is attached to this canonical entry."
    });
  }

  if (resolution.contested) {
    flags.push({
      code: "CONTESTED_VALUE",
      severity: "warning",
      message: "Multiple source values disagree and require review before high-trust promotion."
    });
  }

  if (resolution.reviewRecommended) {
    flags.push({
      code: "REVIEW_RECOMMENDED",
      severity: "warning",
      message: "Verification score or source disagreement recommends manual review."
    });
  }

  return {
    status,
    confidenceScore: Number(resolution.confidence.toFixed(4)),
    contested: resolution.contested,
    reviewRecommended: resolution.reviewRecommended,
    sourceCount: input.evidence.length,
    winningSourceId: resolution.winningEvidence?.sourceId,
    winningSourceType: resolution.winningEvidence?.sourceType,
    contestedFields: resolution.contestedFields.map((field) => field.fieldPath),
    flags,
    lastEvaluatedAt: input.lastEvaluatedAt ?? new Date().toISOString()
  };
}

export function hasBlockingVerificationIssue(metadata?: CanonicalVerificationMetadata): boolean {
  if (!metadata) return true;
  return metadata.flags.some((flag) => flag.severity === "error");
}

export function shouldShowReviewBadge(metadata?: CanonicalVerificationMetadata): boolean {
  if (!metadata) return true;
  return metadata.contested || metadata.reviewRecommended || metadata.status === "placeholder";
}
