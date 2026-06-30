import type { StatKey } from "../schemas/buildGoalSchema";
import type { Confidence } from "./types";
import type { FormulaFamily, FormulaMultiplierBreakdown } from "./formulaTypes";

export type ObservedHitSource = "manual" | "OCR" | "inferred";

export interface ObservedHit {
  rawValue: number;
  normalizedValue?: number;
  timestamp?: string;
  source: ObservedHitSource;
  confidence: Confidence;
  tags?: string[];
}

export interface DamageCaseFlags {
  crit?: boolean;
  weakspot?: boolean;
  status?: boolean;
  elemental?: boolean;
  procSource?: string;
}

export interface ObservedDamageCase {
  caseId: string;
  displayName: string;
  mechanicId: string;
  formulaFamily: FormulaFamily;
  weaponId?: string;
  sourceGear?: string;
  enemyType?: string;
  playerStats: Partial<Record<StatKey, number>>;
  activeGear: string[];
  observedHits: ObservedHit[];
  expectedFlags: DamageCaseFlags;
  confidence: Confidence;
  notes?: string;
  warnings?: string[];
}

export type ValidationClassification = "pass" | "warn" | "fail";

export interface ValidationThresholds {
  passPercent: number;
  warnPercent: number;
}

export const DEFAULT_THRESHOLDS: ValidationThresholds = {
  passPercent: 5,
  warnPercent: 20,
};

export interface ValidationResult {
  caseId: string;
  displayName: string;
  mechanicId: string;
  formulaFamily: FormulaFamily;
  predictedDamage: number;
  observedAverage: number;
  observedMedian: number;
  hitCount: number;
  absoluteError: number;
  percentError: number;
  predictedUnder: boolean;
  classification: ValidationClassification;
  likelyMissingBucket?: string;
  multiplierBreakdown: FormulaMultiplierBreakdown[];
  formulaAssumptions: string[];
  warnings: string[];
  needsRetest: boolean;
  observedHits: ObservedHit[];
}

export function classifyError(
  percentError: number,
  thresholds: ValidationThresholds = DEFAULT_THRESHOLDS
): ValidationClassification {
  const absErr = Math.abs(percentError);
  if (absErr <= thresholds.passPercent) return "pass";
  if (absErr <= thresholds.warnPercent) return "warn";
  return "fail";
}

export function computeAverage(hits: ObservedHit[]): number {
  if (hits.length === 0) return 0;
  let sum = 0;
  for (const h of hits) {
    sum += h.normalizedValue ?? h.rawValue;
  }
  return sum / hits.length;
}

export function computeMedian(hits: ObservedHit[]): number {
  if (hits.length === 0) return 0;
  const values = hits
    .map((h) => h.normalizedValue ?? h.rawValue)
    .sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[mid - 1] + values[mid]) / 2
    : values[mid];
}

const MISSING_BUCKET_HINTS: Array<{
  ratioLow: number;
  ratioHigh: number;
  suggestion: string;
}> = [
  {
    ratioLow: 1.05,
    ratioHigh: 1.25,
    suggestion:
      "Predicted is 5-25% below observed — likely missing a keyword-specific damage bucket (Burn DMG, Power Surge DMG, etc.) or a secondary elemental multiplier.",
  },
  {
    ratioLow: 1.25,
    ratioHigh: 1.50,
    suggestion:
      "Predicted is 25-50% below observed — likely missing the vulnerability/target-side damage taken multiplier, or a weapon-specific damage bucket.",
  },
  {
    ratioLow: 1.50,
    ratioHigh: 1.80,
    suggestion:
      "Predicted is 50-80% below observed — likely missing both keyword-specific damage and vulnerability buckets, or an additive crit+weakspot bucket is mis-modeled.",
  },
  {
    ratioLow: 1.80,
    ratioHigh: Infinity,
    suggestion:
      "Predicted is >80% below observed — fundamental formula family may be wrong, or a major multiplier (e.g. baseFactor, elemental scaling) is missing.",
  },
];

export function suggestMissingBucket(
  predicted: number,
  observed: number
): string | undefined {
  if (predicted <= 0 || observed <= 0) return undefined;
  const ratio = observed / predicted;
  if (ratio < 0.95 || (ratio >= 0.95 && ratio <= 1.05)) return undefined;
  for (const hint of MISSING_BUCKET_HINTS) {
    if (ratio >= hint.ratioLow && ratio < hint.ratioHigh) {
      return hint.suggestion;
    }
  }
  if (ratio < 0.95) {
    return "Predicted is higher than observed — overcounted multipliers or bucket overlap overestimated.";
  }
  return undefined;
}
