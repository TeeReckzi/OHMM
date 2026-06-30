import type {
  RawObservation,
  NormalizedObservation,
  ClassificationHint,
  NormalizationConfig,
  ObservationGroup,
} from "./observationTypes";
import { DEFAULT_NORMALIZATION_CONFIG } from "./observationTypes";
import type { Confidence } from "./types";
import type { FormulaFamily } from "./formulaTypes";
import { listMechanicBehaviors } from "./mechanicRegistry";
import { dedupeObservations } from "./observationDeduper";

let observationCounter = 0;

function nextObsId(): string {
  observationCounter++;
  return `obs_${observationCounter}`;
}

function sourceTypeToConfidence(
  sourceType: string
): Confidence {
  switch (sourceType) {
    case "manual":
      return "observed_in_game_needs_testing";
    case "ocr":
      return "reported_current_patch_needs_testing";
    case "inferred":
    case "json_import":
    case "csv_import":
      return "inferred";
    default:
      return "unknown";
  }
}

function classifyObservation(
  raw: RawObservation
): ClassificationHint {
  const hint: ClassificationHint = { confidence: 0.5 };

  const registeredMechanics = listMechanicBehaviors();
  if (registeredMechanics.length > 0 && raw.metadata?.mechanicId) {
    const match = registeredMechanics.find(
      (m) => m.mechanicId === raw.metadata!.mechanicId
    );
    if (match) {
      hint.mechanicGuess = match.mechanicId;
      hint.formulaFamilyGuess = guessFamilyFromMechanic(match.mechanicId);
      hint.confidence = 0.8;
      return hint;
    }
  }

  const tags: string[] = [];
  if (raw.metadata?.tags && Array.isArray(raw.metadata.tags)) {
    tags.push(...(raw.metadata.tags as string[]));
  }
  if (raw.rawText) {
    const lower = raw.rawText.toLowerCase();
    if (lower.includes("burn") || lower.includes("blaze")) {
      hint.mechanicGuess = "burn";
      hint.formulaFamilyGuess = "status_tick_damage";
      hint.statusGuess = true;
      hint.elementalGuess = true;
      hint.confidence = 0.6;
    } else if (
      lower.includes("power surge") ||
      lower.includes("shock")
    ) {
      hint.mechanicGuess = "powerSurge";
      hint.formulaFamilyGuess = "status_tick_damage";
      hint.statusGuess = true;
      hint.elementalGuess = true;
      hint.confidence = 0.6;
    } else if (
      lower.includes("frost vortex") ||
      lower.includes("frost")
    ) {
      hint.mechanicGuess = "frostVortex";
      hint.formulaFamilyGuess = "status_tick_damage";
      hint.statusGuess = true;
      hint.elementalGuess = true;
      hint.confidence = 0.6;
    } else if (
      lower.includes("unstable bomber") ||
      lower.includes("blast")
    ) {
      hint.mechanicGuess = "unstableBomber";
      hint.formulaFamilyGuess = "status_tick_damage";
      hint.statusGuess = true;
      hint.elementalGuess = true;
      hint.confidence = 0.6;
    }
    if (lower.includes("crit")) {
      hint.critGuess = true;
    }
    if (lower.includes("weakspot") || lower.includes("weak spot")) {
      hint.weakspotGuess = true;
    }
    if (lower.includes("proc") || lower.includes("explosion")) {
      hint.procGuess = true;
    }
  }

  if (tags.includes("crit")) hint.critGuess = true;
  if (tags.includes("weakspot")) hint.weakspotGuess = true;
  if (tags.includes("status")) hint.statusGuess = true;
  if (tags.includes("elemental")) hint.elementalGuess = true;
  if (tags.includes("proc")) hint.procGuess = true;

  return hint;
}

function guessFamilyFromMechanic(
  mechanicId: string
): FormulaFamily | undefined {
  const m = listMechanicBehaviors().find(
    (b) => b.mechanicId === mechanicId
  );
  if (!m) return undefined;
  if (m.formulaTemplateId === "charged_status_damage_current_patch")
    return "charged_status_damage";
  if (m.formulaTemplateId === "deviation_skill_damage_current_patch")
    return "deviation_skill_damage";
  if (m.formulaTemplateId === "physical_weapon_damage_current_patch")
    return "physical_weapon_damage";
  if (m.damageScalingBucket === "deviation") return "deviation_skill_damage";
  if (m.damageScalingBucket === "weapon") return "physical_weapon_damage";
  if (m.damageScalingBucket === "status") return "status_tick_damage";
  return undefined;
}

export function normalizeObservation(
  raw: RawObservation,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): NormalizedObservation {
  const classification = classifyObservation(raw);
  const confidence = sourceTypeToConfidence(raw.sourceType);

  let normalizedDamage = raw.rawDamage;
  if (raw.metadata?.normalizationFactor) {
    normalizedDamage =
      raw.rawDamage / (raw.metadata.normalizationFactor as number);
  }
  normalizedDamage = Math.round(normalizedDamage * 100) / 100;

  const timestamp = raw.timestamp
    ? new Date(raw.timestamp)
    : undefined;

  return {
    id: raw.id,
    rawIds: [raw.id],
    timestamp,
    rawDamage: raw.rawDamage,
    normalizedDamage,
    mechanicId: classification.mechanicGuess,
    formulaFamily: classification.formulaFamilyGuess,
    classification,
    sourceType: raw.sourceType,
    sourceLabel: raw.sourceLabel,
    confidence,
    notes: raw.metadata?.notes as string | undefined,
  };
}

export function normalizeObservations(
  raws: RawObservation[],
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): { normalized: NormalizedObservation[]; audit: import("./observationTypes").NormalizationAudit } {
  const normalized = raws.map((r) => normalizeObservation(r, config));
  const dedupResult = dedupeObservations(normalized, config);
  return dedupResult;
}

export function normalizedToObservedHits(
  group: ObservationGroup
): import("./formulaTestTypes").ObservedHit[] {
  return group.observations.map((o) => ({
    rawValue: o.rawDamage,
    normalizedValue: o.normalizedDamage,
    timestamp: o.timestamp?.toISOString(),
    source: o.sourceType === "ocr"
      ? ("OCR" as const)
      : o.sourceType === "manual"
        ? ("manual" as const)
        : ("inferred" as const),
    confidence: o.confidence,
    tags: [],
  }));
}

export function buildObservationGroup(
  observations: NormalizedObservation[],
  groupId: string
): ObservationGroup {
  const values = observations.map((o) => o.normalizedDamage);
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const sourceTypes = [
    ...new Set(observations.map((o) => o.sourceType)),
  ];

  const mergedClassification: import("./observationTypes").ClassificationHint = {
    confidence: 0,
  };
  for (const o of observations) {
    if (o.classification.mechanicGuess)
      mergedClassification.mechanicGuess = o.classification.mechanicGuess;
    if (o.classification.formulaFamilyGuess)
      mergedClassification.formulaFamilyGuess =
        o.classification.formulaFamilyGuess;
    if (o.classification.critGuess)
      mergedClassification.critGuess = true;
    if (o.classification.weakspotGuess)
      mergedClassification.weakspotGuess = true;
    if (o.classification.elementalGuess)
      mergedClassification.elementalGuess = true;
    if (o.classification.statusGuess)
      mergedClassification.statusGuess = true;
    if (o.classification.procGuess)
      mergedClassification.procGuess = true;
    if (o.classification.confidence > mergedClassification.confidence)
      mergedClassification.confidence = o.classification.confidence;
  }

  return {
    groupId,
    observations,
    mechanicId: mergedClassification.mechanicGuess,
    formulaFamily: mergedClassification.formulaFamilyGuess,
    averageDamage:
      values.reduce((a, b) => a + b, 0) / values.length,
    medianDamage: median,
    hitCount: values.length,
    sourceTypes,
    classification: mergedClassification,
  };
}
