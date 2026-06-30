import type { Confidence } from "./types";
import type { FormulaFamily } from "./formulaTypes";

export type ObservationSourceType =
  | "ocr"
  | "manual"
  | "inferred"
  | "json_import"
  | "csv_import";

export interface RawObservation {
  id: string;
  rawDamage: number;
  timestamp?: string;
  sourceType: ObservationSourceType;
  rawText?: string;
  sourceLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface ClassificationHint {
  mechanicGuess?: string;
  formulaFamilyGuess?: FormulaFamily;
  critGuess?: boolean;
  weakspotGuess?: boolean;
  elementalGuess?: boolean;
  statusGuess?: boolean;
  procGuess?: boolean;
  confidence: number;
}

export interface NormalizedObservation {
  id: string;
  rawIds: string[];
  timestamp: Date | undefined;
  rawDamage: number;
  normalizedDamage: number;
  mechanicId?: string;
  formulaFamily?: FormulaFamily;
  classification: ClassificationHint;
  sourceType: ObservationSourceType;
  sourceLabel?: string;
  confidence: Confidence;
  duplicateGroupId?: string;
  notes?: string;
}

export interface ObservationGroup {
  groupId: string;
  observations: NormalizedObservation[];
  mechanicId?: string;
  formulaFamily?: FormulaFamily;
  averageDamage: number;
  medianDamage: number;
  hitCount: number;
  sourceTypes: ObservationSourceType[];
  classification: ClassificationHint;
}

export interface NormalizationConfig {
  dedupeWindowMs: number;
  numericTolerance: number;
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  dedupeWindowMs: 200,
  numericTolerance: 0.02,
};

export interface DedupeAuditEntry {
  keptId: string;
  suppressedIds: string[];
  groupId: string;
  reason: string;
}

export interface NormalizationAudit {
  totalRaw: number;
  totalNormalized: number;
  totalDeduped: number;
  groups: number;
  duplicates: DedupeAuditEntry[];
}
