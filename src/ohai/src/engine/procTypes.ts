import type {
  DamageScalingBucket,
  ElementType,
  Confidence,
  MechanicSource,
} from "./types";
import type { FormulaFamily } from "./formulaTypes";

export type ProcSourceType =
  | "weapon"
  | "gear"
  | "mod"
  | "set"
  | "food"
  | "unknown";

export type ProcKind =
  | "conditionalExplosion"
  | "timerTick"
  | "onHit"
  | "stackTrigger"
  | "unknown";

export type ScalingSource =
  | "psiIntensity"
  | "weaponDMG"
  | "unknown";

export interface ProcSource {
  procId: string;
  displayName: string;
  sourceType: ProcSourceType;
  sourceId: string;
  trigger: string;
  generatedMechanicId: string;
  generatedFormulaFamily: FormulaFamily;
  element: ElementType;
  damageScalingBucket: DamageScalingBucket;
  canCrit: boolean;
  canWeakspot: boolean;
  confidence: Confidence;
  needsRetest: boolean;
  notes?: string;
  source: MechanicSource;
  procKind?: ProcKind;
  scalingSource?: ScalingSource;
}
