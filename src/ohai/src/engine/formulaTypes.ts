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

  // ── Game-aligned BB.* variables (from damage_formula.pyc) ──
  // Verification status documented in: data/extracted/structured/FORMULA_ALIGNMENT_AUDIT.md
  //
  // Fields marked VERIFIED have proven semantics from officialAttributes.generated.ts
  // (calcType, min, max, parentAttrKey) + formula graph recipe + defaults tests.
  // Fields marked UNVERIFIED have name-only evidence. Do NOT use in calculations.

  // ── VERIFIED: Additive inside final_attack_additional_rate ──
  /** VERIFIED. Bonus damage when target has debuff. Additive with other _dam_add_rate leaves. Identity=0, range [0, 10]. */
  debuffTypeDamAddRate?: number;
  /** VERIFIED. Bonus vs species in field zone. Additive. Identity=0, range [-0.9, 3.0]. Sub-keys: rosetta/vulcher/alters/ascender/creatures/machina/deviation. */
  speciesFieldDamAddRate?: number;
  /** VERIFIED. Bonus vs target prototype class. Additive. Identity=0, range [-0.9, 10]. Sub-keys: boss/elite/creeps/leader. */
  unitPrototypeDamAddRate?: number;

  // ── VERIFIED: Multiplicative factors (identity = 1 unless noted) ──
  /** VERIFIED. Distance falloff multiplier. Identity=1 (proven default). <1 means reduced damage at range. */
  distanceDamRate?: number;
  /** VERIFIED. PvP weapon-tier scaling. Identity=1 (proven default). Attacker-side, separate from pvpMitigation (defender-side). */
  pvpAdjustFactor?: number;
  /** VERIFIED. Target vulnerability amplification. Apply as ×(1+value). Identity=0, range [0, 1]. */
  hurtDeepenRate?: number;

  // ── VERIFIED: Crit modifiers ──
  /** VERIFIED. TARGET attribute. Subtracts from attacker crit rate. Identity=0, range [-1, 1]. */
  targetIgnoreCritRate?: number;
  /** VERIFIED. TARGET attribute. Reduces crit damage bonus. Identity=0, range [-1, 0.9]. Apply: effectiveCritBonus × (1 - value). */
  targetIgnoreCritDamRate?: number;
  /** VERIFIED. ATTACKER per-attack-type crit rate bonus. Identity=0, range [-1, 10]. Resolved by attack type. */
  attackTypeCritRateAddRate?: number;
  /** VERIFIED. ATTACKER per-attack-type crit DMG bonus. Identity=0, range [-1, 10]. Resolved by attack type. */
  attackTypeCritDamAddRate?: number;
  /** VERIFIED. ATTACKER height-advantage crit DMG bonus. Identity=0, range [-1, 2]. Context: attacker above target. */
  highlandCritDamRate?: number;
  /** VERIFIED. ATTACKER low-ground crit DMG bonus. Identity=0, range [-1, 2]. Context: attacker below target. */
  lowlandCritDamRate?: number;
  /** VERIFIED. Bonus crit rate when target has debuff. Identity=0, range [0, 1]. Sub-keys: scorch/frozen/mark/bleeding/surge/vortex. */
  debuffTypeCritRateAddRate?: number;
  /** VERIFIED. Bonus crit DMG when target has debuff. Identity=0, range [0, 10]. Sub-keys: scorch/frozen/mark/bleeding/surge/vortex. */
  debuffTypeCritDamAddRate?: number;

  // ── VERIFIED: Weakspot modifiers ──
  /** VERIFIED. Keyword-specific weakspot DMG bonus. Identity=0, range [-1, 10]. Sub-keys: proj (Bounce), shrap (Shrapnel). */
  keywordProcWeakDamAddRate?: number;
  /** VERIFIED. TARGET reduces non-weakspot damage. Identity=0, range [-1, 1]. Apply: if !weakspot, damage × (1-value). */
  nonWeakIgnoreDamRate?: number;

  // ── UNVERIFIED: Do NOT use in calculations ──
  /** UNVERIFIED. Could be "discount" or "dispatch count" — no call-site proof. */
  critRateDiscount?: number;
  /** 🚫 EXCLUDED. Proven to be stagger/structure damage (max=9999999), NOT HP damage. DO NOT USE. */
  toughnessDamRate?: number;
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
