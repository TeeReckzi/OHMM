/**
 * External stat alias mapping reference.
 *
 * Source: lReDragol/OnceHuman_Tools
 * - player.py: apply_stat_delta alias_map (~line 2817)
 * - context_module.py: various stat lookups
 * - mechanics.py: TRIGGER_CHANCE_BONUS_STATS (~line 165)
 *
 * Maps external naming conventions to our internal stat keys.
 * REFERENCE ONLY — does not affect runtime calculations.
 *
 * Naming convention differences:
 *   External: snake_case with _percent suffix (e.g. weapon_damage_percent)
 *   Ours: camelCase with no suffix (e.g. weaponDMG)
 *   External stores % as whole numbers (e.g. 15 for 15%)
 *   Ours stores % as decimals (e.g. 0.15 for 15%)
 */

import type { StatKey } from "../../schemas/buildGoalSchema";

/**
 * Maps external stat names to our internal stat keys,
 * accounting for unit differences (percent vs decimal).
 *
 * When `unitFactor: 0.01`, external value 15 → our value 0.15.
 */
export interface ExternalAliasEntry {
  externalName: string;
  ourKey: StatKey | null;
  unitFactor: number;
  verified: boolean;
  notes: string;
}

export const EXTERNAL_STAT_ALIASES: ExternalAliasEntry[] = [
  { externalName: "damage_per_projectile", ourKey: "weaponDMG", unitFactor: 1, verified: false, notes: "External uses pre-scaled per-projectile base; we use raw weaponDMG" },
  { externalName: "weapon_damage_percent", ourKey: "weaponDMG", unitFactor: 0.01, verified: false, notes: "External treats as ADDITIVE with status_damage_percent; mapping ambiguous" },
  { externalName: "status_damage_percent", ourKey: "statusDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "elemental_damage_percent", ourKey: "elementalDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "crit_rate_percent", ourKey: "critRate", unitFactor: 0.01, verified: true, notes: "Direct match (0-100 vs 0-1)" },
  { externalName: "crit_damage_percent", ourKey: "critDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "weakspot_damage_percent", ourKey: "weakspotDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "psi_intensity", ourKey: "psiIntensity", unitFactor: 1, verified: true, notes: "Direct match" },
  { externalName: "fire_rate_percent", ourKey: "fireRate", unitFactor: 0.01, verified: false, notes: "Fire rate as percent bonus" },
  { externalName: "reload_speed_percent", ourKey: "reloadSpeed", unitFactor: 0.01, verified: false, notes: "Reload speed percent" },
  { externalName: "vulnerability_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "External uses single vulnerability; we split into weaponVulnerability + statusVulnerability" },
  { externalName: "burn_damage_percent", ourKey: "burnDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "shock_damage_percent", ourKey: "powerSurgeDMG", unitFactor: 0.01, verified: false, notes: "External has both shock_damage% and power_surge_damage% separately" },
  { externalName: "frost_vortex_damage_percent", ourKey: "frostVortexDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "bounce_damage_percent", ourKey: "bounceDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "shrapnel_damage_percent", ourKey: "shrapnelDMG", unitFactor: 0.01, verified: true, notes: "Direct match after unit conversion" },
  { externalName: "burn_elemental_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "No direct equivalent in our stat taxonomy — split burn damage flame/elemental?" },
  { externalName: "frost_elemental_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "No direct equivalent in our stat taxonomy" },
  { externalName: "shock_elemental_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "No direct equivalent in our stat taxonomy" },
  { externalName: "explosion_elemental_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "No direct equivalent in our stat taxonomy" },
  { externalName: "unstable_bomber_damage_percent", ourKey: "unstableBomberDMG", unitFactor: 0.01, verified: false, notes: "Direct match after unit conversion" },
  { externalName: "unstable_bomber_final_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "External has separate final damage multiplier" },
  { externalName: "unstable_bomber_crit_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Separate crit damage stat for UB" },
  { externalName: "unstable_bomber_guaranteed_crit", ourKey: null, unitFactor: 1, verified: false, notes: "Boolean flag for guaranteed UB crit" },
  { externalName: "damage_to_shocked_target_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Global damage amp vs shocked targets" },
  { externalName: "marked_target_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Bull's Eye marked target damage bonus" },
  { externalName: "marked_target_weakspot_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Bull's Eye weakspot bonus" },
  { externalName: "marked_target_crit_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Bull's Eye crit bonus" },
  { externalName: "fast_gunner_weapon_damage_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Fast Gunner conditional weapon damage" },
  { externalName: "damage_bonus_normal", ourKey: "enemyTypeDMGBonus", unitFactor: 0.01, verified: false, notes: "External splits enemy type bonus into 3 stats" },
  { externalName: "damage_bonus_elite", ourKey: "enemyTypeDMGBonus", unitFactor: 0.01, verified: false, notes: "External splits enemy type bonus into 3 stats" },
  { externalName: "damage_bonus_boss", ourKey: "enemyTypeDMGBonus", unitFactor: 0.01, verified: false, notes: "External splits enemy type bonus into 3 stats" },
  { externalName: "burn_trigger_chance_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Burn proc trigger chance" },
  { externalName: "shock_trigger_chance_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Power Surge proc trigger chance" },
  { externalName: "frost_vortex_trigger_chance_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Frost Vortex proc trigger chance" },
  { externalName: "unstable_bomber_trigger_chance_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Unstable Bomber proc trigger chance" },
  { externalName: "burn_duration_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Burn duration extension" },
  { externalName: "power_surge_duration_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Power Surge duration extension" },
  { externalName: "frost_vortex_duration_percent", ourKey: null, unitFactor: 0.01, verified: false, notes: "Frost Vortex duration extension" },
];

/**
 * Converts an external stat value to our decimal format.
 * Example: externalPercent(15) => 0.15
 */
export function externalPercentToDecimal(value: number): number {
  return value / 100;
}

/**
 * Converts our decimal value to external percent format.
 * Example: decimalToExternalPercent(0.15) => 15
 */
export function decimalToExternalPercent(value: number): number {
  return Math.round(value * 100);
}

/**
 * Finds the external alias entry by external name.
 */
export function findByExternalName(name: string): ExternalAliasEntry | undefined {
  return EXTERNAL_STAT_ALIASES.find((e) => e.externalName === name);
}

/**
 * Finds all external aliases that map to a given our key.
 */
export function findByOurKey(key: StatKey): ExternalAliasEntry[] {
  return EXTERNAL_STAT_ALIASES.filter((e) => e.ourKey === key);
}
