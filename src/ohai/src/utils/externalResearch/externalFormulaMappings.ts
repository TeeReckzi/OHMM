import type { StatKey } from "../../schemas/buildGoalSchema";

/**
 * External formula mapping reference.
 *
 * Source: lReDragol/OnceHuman_Tools (V4.6, Mar 2026)
 * File: context_module.py (lines 52-88, 3331-3377, 374-433, 3452-3616, 3912-3926)
 *
 * Maps external damage formula patterns to our internal stat keys.
 * REFERENCE ONLY — does not affect runtime calculations.
 */

/**
 * External Burn DoT formula structure.
 * Matches PERSISTENT_MANNEQUIN_EFFECT_DEFINITIONS['burn'] (context_module.py:53-65)
 * and update_status_effects burn branch (context_module.py:2915-2953).
 *
 * External formula:
 *   psi_intensity * 0.4 * (1 + status_damage%/100) * (1 + elemental_damage%/100)
 *   * (1 + burn_damage%/100) * (1 + vulnerability%/100)
 *   * (1 + burn_elemental_damage%/100) * stacks
 *
 * Our formula:
 *   weaponDMG * 0.04 * (1 + statusDMG) * (1 + elementalDMG) * (1 + keywordSuffixDMGBonus)
 *   * (1 + humanDamageBonus) * (1 - dotResistanceReduction) * (1 - burnResistanceDebuffLevel*0.15)
 *   * (1 + statusVulnerability) * (1 + enemyTypeDMGBonus)
 *   * critMult * weakspotMult * stacks
 */
export const EXTERNAL_BURN_FORMULA = {
  label: "External Burn DoT Formula",
  baseStat: "psi_intensity" as const,
  baseMultiplier: 0.4,
  tickIntervalSeconds: 1.0,
  maxStacks: 16,
  stackDecayModel: "independent_timers" as const,
  supportsCrit: false,
  supportsWeakspot: false,
  frequencyModifier: false,
  externalStatDependencies: [
    "psi_intensity",
    "status_damage_percent",
    "elemental_damage_percent",
    "burn_damage_percent",
    "vulnerability_percent",
    "burn_elemental_damage_percent",
  ],
  ourStatDependencies: [
    "weaponDMG",
    "statusDMG",
    "elementalDMG",
    "keywordSuffixDMGBonus",
    "humanDamageBonus",
    "dotResistanceReduction",
    "burnResistanceDebuffLevel",
    "statusVulnerability",
    "enemyTypeDMGBonus",
  ] as readonly StatKey[],
  unmatchedExternalStats: [
    "psi_intensity" as const,
  ],
  unmatchedOurStats: [
    "humanDamageBonus" as const,
    "dotResistanceReduction" as const,
    "burnResistanceDebuffLevel" as const,
    "keywordSuffixDMGBonus" as const,
  ],
} as const;

/**
 * External Power Surge formula structure.
 * Matches trigger_ability('power_surge') (context_module.py:3529-3547).
 *
 * External formula:
 *   psi_intensity * 0.5 * (1 + status_damage%/100) * (1 + elemental_damage%/100)
 *   * (1 + shock_damage%/100) * (1 + power_surge_damage%/100)
 *   * (1 + vulnerability%/100) * (1 + shock_elemental_damage%/100)
 *   * (1 + trigger_bonus%/100)  [conditional]
 */
export const EXTERNAL_POWER_SURGE_FORMULA = {
  label: "External Power Surge Formula",
  baseStat: "psi_intensity" as const,
  baseMultiplier: 0.5,
  hasDoTTick: true,
  supportsCrit: false,
  supportsWeakspot: false,
  globalAmplifier: true,
  amplifierStat: "damage_to_shocked_target_percent" as const,
  externalStatDependencies: [
    "psi_intensity",
    "status_damage_percent",
    "elemental_damage_percent",
    "shock_damage_percent",
    "power_surge_damage_percent",
    "vulnerability_percent",
    "shock_elemental_damage_percent",
  ],
} as const;

/**
 * External Frost Vortex formula structure.
 * Matches trigger_ability('frost_vortex') (context_module.py:3594-3616).
 *
 * External formula:
 *   psi_intensity * 0.6 * (1 + status_damage%/100) * (1 + elemental_damage%/100)
 *   * (1 + frost_vortex_damage%/100)
 *   * (1 + vulnerability%/100) * (1 + frost_elemental_damage%/100)
 *
 * NOTE: External has NO DoT tick for Frost Vortex — single hit only.
 * Frostbite stacks are applied separately via frost_vortex_applies handlers.
 */
export const EXTERNAL_FROST_VORTEX_FORMULA = {
  label: "External Frost Vortex Formula",
  baseStat: "psi_intensity" as const,
  baseMultiplier: 0.6,
  hasDoTTick: false,
  supportsCrit: false,
  supportsWeakspot: false,
  appliesFrostbiteStacks: true,
  externalStatDependencies: [
    "psi_intensity",
    "status_damage_percent",
    "elemental_damage_percent",
    "frost_vortex_damage_percent",
    "vulnerability_percent",
    "frost_elemental_damage_percent",
  ],
} as const;

/**
 * External Unstable Bomber formula structure.
 * Matches trigger_ability('unstable_bomber') (context_module.py:3452-3500).
 *
 * External formula:
 *   psi_intensity * 1.0 * calculate_status_damage(... 'blast', bonus_stats)
 *   * (1 + trigger_bonus%/100)  [conditional]
 *   * delay_scaling  [conditional]
 *   * (1 + crit_bonus%/100)  [if crit]
 *   * apply_dynamic_damage_bonuses(damage, is_crit, damage_kind='unstable_bomber')
 *
 * bonus_stats: psi_intensity_damage_percent, explosion_elemental_damage_percent,
 *              unstable_bomber_damage_percent, unstable_bomber_final_damage_percent
 */
export const EXTERNAL_UNSTABLE_BOMBER_FORMULA = {
  label: "External Unstable Bomber Formula",
  baseStat: "psi_intensity" as const,
  baseMultiplier: 1.0,
  supportsCrit: true,
  supportsWeakspot: false,
  hasDelayScaling: true,
  delayScalingStat: "unstable_bomber_damage_per_delay_step_percent" as const,
  hasGuaranteedCrit: true,
  guaranteedCritStat: "unstable_bomber_guaranteed_crit" as const,
  bonusStats: [
    "psi_intensity_damage_percent",
    "explosion_elemental_damage_percent",
    "unstable_bomber_damage_percent",
    "unstable_bomber_final_damage_percent",
  ],
  externalStatDependencies: [
    "psi_intensity",
    "status_damage_percent",
    "elemental_damage_percent",
    "vulnerability_percent",
  ],
} as const;

/**
 * External physical weapon damage pipeline.
 * Matches DamageCalculator.calculate_damage_per_projectile (context_module.py:374-433).
 */
export const EXTERNAL_PHYSICAL_WEAPON_PIPELINE = {
  label: "External Physical Weapon Damage Pipeline",
  baseStat: "damage_per_projectile" as const,
  steps: [
    "get_base_damage",
    "apply_weapon_and_status_bonus",
    "apply_enemy_type_bonus",
    "apply_crit_bonus",
    "apply_weakspot_bonus (conditional)",
    "apply_dynamic_damage_bonuses (damage_kind='weapon')",
  ],
  weaponStatusMerge: "additive" as const,
  mergeFormula: "weapon_damage_percent + status_damage_percent + melee_damage_percent",
} as const;
