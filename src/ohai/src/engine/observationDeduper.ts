import type {
  NormalizedObservation,
  NormalizationConfig,
  NormalizationAudit,
  DedupeAuditEntry,
} from "./observationTypes";
import { DEFAULT_NORMALIZATION_CONFIG } from "./observationTypes";

function areSimilar(
  a: NormalizedObservation,
  b: NormalizedObservation,
  tolerance: number
): boolean {
  if (a.normalizedDamage === 0 && b.normalizedDamage === 0) return true;
  if (a.normalizedDamage === 0 || b.normalizedDamage === 0) return false;
  const ratio = Math.abs(a.normalizedDamage - b.normalizedDamage) /
    Math.max(Math.abs(a.normalizedDamage), Math.abs(b.normalizedDamage));
  return ratio <= tolerance;
}

function withinWindow(
  a: NormalizedObservation,
  b: NormalizedObservation,
  windowMs: number
): boolean {
  if (!a.timestamp || !b.timestamp) return false;
  return Math.abs(a.timestamp.getTime() - b.timestamp.getTime()) <= windowMs;
}

export function dedupeObservations(
  observations: NormalizedObservation[],
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): {
  normalized: NormalizedObservation[];
  audit: NormalizationAudit;
} {
  const sorted = [...observations].sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  const kept: NormalizedObservation[] = [];
  let groupCounter = 0;
  const audits: DedupeAuditEntry[] = [];

  for (const obs of sorted) {
    let found = false;

    for (const candidate of kept) {
      // Only dedupe if both observations have timestamps (untimestamped are never dupes)
      if (!obs.timestamp || !candidate.timestamp) continue;

      // Dedupe when: similar damage value AND within time window AND
      // either the candidate already has a group (proven duplicate) or both share same damage
      if (
        areSimilar(obs, candidate, config.numericTolerance) &&
        withinWindow(obs, candidate, config.dedupeWindowMs)
      ) {
        // Establish a group for the candidate if not already set
        if (!candidate.duplicateGroupId) {
          groupCounter++;
          candidate.duplicateGroupId = `dup_group_${groupCounter}`;
        }
        // Assign same group to the suppressed observation
        obs.duplicateGroupId = candidate.duplicateGroupId;
        candidate.rawIds.push(obs.id);
        audits.push({
          keptId: candidate.id,
          suppressedIds: [obs.id],
          groupId: candidate.duplicateGroupId,
          reason: `Similar damage (tolerance=${config.numericTolerance}) within ${config.dedupeWindowMs}ms window`,
        });
        found = true;
        break;
      }
    }

    if (!found) {
      groupCounter++;
      obs.duplicateGroupId = `dup_group_${groupCounter}`;
      kept.push(obs);
    }
  }

  const totalDeduped = observations.length - kept.length;

  return {
    normalized: kept,
    audit: {
      totalRaw: observations.length,
      totalNormalized: kept.length,
      totalDeduped,
      groups: groupCounter,
      duplicates: audits,
    },
  };
}
