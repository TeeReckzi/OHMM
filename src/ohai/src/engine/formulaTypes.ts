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

  // ── Game-aligned BB.* variables (discovered from damage_formula.pyc) ──
  // STATUS: UNVERIFIED. These names were extracted from the game binary.
  // Semantics (sign, units, identity value, multiplicative vs additive,
  // call-site behavior) are NOT proven. Do NOT use in calculations until
  // each field has a verification entry in the formula alignment audit
  // with evidence from game expressions, observed hits, or formula graph nodes.
  //
  // Verification checklist per field:
  //   [ ] Proven sign/direction (does higher value increase or decrease damage?)
  //   [ ] Proven units (percentage as 0.15 vs 15? multiplier vs additive?)
  //   [ ] Proven identity value (what value means "no effect"? 0 or 1?)
  //   [ ] Proven position in formula (which bucket? multiplicative or additive with others?)
  //   [ ] At least one observed hit or formula-graph path confirming behavior

  /** UNVERIFIED. Enemy crit rate reduction? Or attacker ignores enemy crit resistance? (BB.crit_rate_dis_count) */
  critRateDiscount?: number;
  /** UNVERIFIED. Bonus damage when target has a specific debuff type (BB.debuff_type_dam_add_rate). Additive bucket unknown. */
  debuffTypeDamAddRate?: number;
  /** UNVERIFIED. Bonus damage when target is in their species "field" (BB.species_field_dam_add_rate). Additive bucket unknown. */
  speciesFieldDamAddRate?: number;
  /** UNVERIFIED. Amplification debuff on target? Or something else? (BB.hurt_deepen_rate) */
  hurtDeepenRate?: number;
  /** UNVERIFIED. Distance factor. Identity value unknown (0? 1?). Direction unknown. (dis_dam_rate) */
  distanceDamRate?: number;
  /** UNVERIFIED. Keyword weakspot bonus? Or keyword ignores weakspot resistance? (keyword_proc_weak_dam_add_rate) */
  keywordProcWeakDamAddRate?: number;
  /** UNVERIFIED. Per-attack-type crit rate bonus (attack_type_crit_rate_add_rate) */
  attackTypeCritRateAddRate?: number;
  /** UNVERIFIED. Per-attack-type crit damage bonus (attack_type_crit_dam_add_rate) */
  attackTypeCritDamAddRate?: number;
  /** UNVERIFIED. Height advantage crit damage bonus (highland_crit_dam_rate). Mutually exclusive with lowland? */
  highlandCritDamRate?: number;
  /** UNVERIFIED. Height disadvantage crit damage penalty (lowland_crit_dam_rate). Mutually exclusive with highland? */
  lowlandCritDamRate?: number;
  /** UNVERIFIED. Direction ambiguous — could be "enemy ignores X" or "attacker ignores enemy's X" (BB.ignore_crit_rate) */
  ignoreCritRate?: number;
  /** UNVERIFIED. Direction ambiguous — same issue as ignoreCritRate (BB.ignore_crit_dam_rate) */
  ignoreCritDamRate?: number;
  /** UNVERIFIED. Enemy reduces weakspot? Or non-weakspot penalty? (weak_ignore_dam_rate) */
  weakIgnoreDamRate?: number;
  /** UNVERIFIED. Damage bonus vs specific boss prototype (BB.unit_prototype_dam_add_rate) */
  unitPrototypeDamAddRate?: number;
  /** UNVERIFIED. Could be armor mitigation, stagger damage, or a formula coefficient. DO NOT use as direct multiplier. (toughness_dam_rate) */
  toughnessDamRate?: number;
  /** UNVERIFIED. Inline PvP scaling — relationship to existing pvpMitigation system unclear (BB.pvp_adjust_factor) */
  pvpAdjustFactor?: number;
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
