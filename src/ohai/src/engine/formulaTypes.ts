import type { EffectiveMechanicBehavior } from "./types";

export type DamageModelHypothesis =
  | "frost-vortex-DoT-tick"
  | "frost-vortex-single-hit"
  | "power-surge-DoT-tick"
  | "power-surge-hybrid"
  | "ebr-fire-ring-provisional";

export type FormulaFamily =
  | "status_tick_damage"
  | "burn_stack_dot"
  | "charged_status_damage"
  | "physical_weapon_damage"
  | "deviation_skill_damage"
  | "unsupported";

export interface FormulaInput {
  baseWeaponDMG?: number;
  attackPercent?: number;
  weaponDMGBonus?: number;
  statusDMGBonus?: number;
  elementalDMGBonus?: number;
  keywordSuffixDMGBonus?: number;
  psiIntensity?: number;
  critRate?: number;
  critDMG?: number;
  weakspotDMG?: number;
  weaponVulnerability?: number;
  statusVulnerability?: number;
  enemyTypeDMGBonus?: number;
  currentStacks?: number;
  flatBurnBonus?: number;
  humanDamageBonus?: number;
  dotResistanceReduction?: number;
  burnResistanceDebuffLevel?: number;
  tickFrequencyMultiplier?: number;
  mechanicId: string;
  effectiveBehavior: EffectiveMechanicBehavior;
  stackCount?: number;
  damageModelOverride?: Partial<Record<"frostVortex" | "powerSurge" | "ebrFireRing", DamageModelHypothesis>>;
}

export interface FormulaMultiplierBreakdown {
  label: string;
  multiplier: number;
  source: string;
}

export interface FormulaEffectiveBehaviorSnapshot {
  canCrit: boolean;
  canWeakspot: boolean;
  critWeakspotBucket: string;
  damageScalingBucket: string;
  scalingStat: string;
  vulnerabilityType: string;
  baseFactor: number | undefined;
  appliedOverrides: string[];
}

export interface FormulaResult {
  mechanicId: string;
  formulaFamily: FormulaFamily;
  formulaTemplateId: string | undefined;
  baseDamage: number;
  expectedDamage: number;
  expectedCritMultiplier: number;
  expectedWeakspotMultiplier: number;
  multipliers: FormulaMultiplierBreakdown[];
  effectiveBehavior: FormulaEffectiveBehaviorSnapshot;
  warnings: string[];
  explanation: string[];
  burnDetails?: BurnDetails;
}

export interface BurnDetails {
  stacks: number;
  maxStacks: number;
  damagePerStackFactor: number;
  basePerStack: number;
  stackContribution: number;
  flatBonusApplied: number;
  perTickDamage: number;
  baseTickIntervalSeconds: number;
  tickFrequencyMultiplier: number;
  effectiveTickIntervalSeconds: number;
  ticksPerSecond: number;
  damagePerSecond: number;
  dotResistanceApplied: number;
  burnResistanceApplied: number;
  frequencyBonus: number;
}

export function computeExpectedCritMultiplier(
  critRate: number,
  critDMG: number,
  canCrit: boolean
): number {
  if (!canCrit) return 1.0;
  if (critDMG <= 1.0) return 1.0;
  return 1 + critRate * (critDMG - 1);
}

export function computeExpectedWeakspotMultiplier(weakspotDMG: number, canWeakspot: boolean): number {
  if (!canWeakspot) return 1.0;
  return 1 + weakspotDMG;
}

export function computeCombinedCritWeakspotMultiplier(
  critRate: number,
  critDMG: number,
  weakspotDMG: number,
  canCrit: boolean,
  canWeakspot: boolean
): number {
  const critContrib = canCrit ? critRate * (critDMG - 1) : 0;
  const wsContrib = canWeakspot ? weakspotDMG : 0;
  return 1 + critContrib + wsContrib;
}
