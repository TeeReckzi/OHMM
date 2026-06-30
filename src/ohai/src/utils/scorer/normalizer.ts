import type { StatKey } from "../../schemas/buildGoalSchema";

const STAT_KEY_MAP: Record<string, StatKey> = {
  "weapon dmg": "weaponDMG",
  "weapon damage": "weaponDMG",
  "weapon_dmg": "weaponDMG",
  "weapon_damage": "weaponDMG",
  "weapondmg": "weaponDMG",
  "weapon dmg bonus": "weaponDMGBonus",
  "weapon damage bonus": "weaponDMGBonus",
  "weapon_dmg_bonus": "weaponDMGBonus",

  "melee dmg": "meleeDMG",
  "melee damage": "meleeDMG",
  "melee_dmg": "meleeDMG",
  "meleedmg": "meleeDMG",

  "status dmg": "statusDMGBonus",
  "status damage": "statusDMGBonus",
  "status_dmg": "statusDMGBonus",
  "statusdm g": "statusDMGBonus",
  "anomaly dmg": "statusDMGBonus",
  "anomaly damage": "statusDMGBonus",
  "status dmg bonus": "statusDMGBonus",
  "status damage bonus": "statusDMGBonus",

  "elemental dmg": "elementalDMGBonus",
  "elemental damage": "elementalDMGBonus",
  "elemental_dmg": "elementalDMGBonus",
  "elementaldmg": "elementalDMGBonus",
  "elemental dmg bonus": "elementalDMGBonus",
  "elemental damage bonus": "elementalDMGBonus",

  "burn dmg": "burnDMG",
  "burn damage": "burnDMG",
  "blaze dmg": "burnDMGBonus",
  "blaze damage": "burnDMGBonus",
  "burn_dmg": "burnDMG",
  "blaze_dmg": "burnDMGBonus",
  "burn dmg bonus": "burnDMGBonus",
  "burn damage bonus": "burnDMGBonus",
  "blaze dmg bonus": "burnDMGBonus",

  "power surge dmg": "powerSurgeDMG",
  "power surge damage": "powerSurgeDMG",
  "shock dmg": "powerSurgeDMGBonus",
  "shock damage": "powerSurgeDMGBonus",
  "power_surge_dmg": "powerSurgeDMG",
  "shock_dmg": "powerSurgeDMGBonus",
  "power surge dmg bonus": "powerSurgeDMGBonus",
  "power surge damage bonus": "powerSurgeDMGBonus",
  "shock dmg bonus": "powerSurgeDMGBonus",

  "frost vortex dmg": "frostVortexDMG",
  "frost vortex damage": "frostVortexDMG",
  "frost dmg": "frostVortexDMG",
  "frost damage": "frostVortexDMG",
  "frost_vortex_dmg": "frostVortexDMG",
  "frost_dmg": "frostVortexDMG",
  "frost vortex dmg bonus": "frostVortexDMGBonus",
  "frost vortex damage bonus": "frostVortexDMGBonus",
  "frost dmg bonus": "frostVortexDMGBonus",

  "bounce dmg": "bounceDMG",
  "bounce damage": "bounceDMG",
  "bounce_dmg": "bounceDMG",

  "shrapnel dmg": "shrapnelDMG",
  "shrapnel damage": "shrapnelDMG",
  "shrapnel_dmg": "shrapnelDMG",

  "fast gunner dmg": "fastGunnerDMG",
  "fast gunner damage": "fastGunnerDMG",

  "unstable bomber dmg": "unstableBomberDMG",
  "unstable bomber damage": "unstableBomberDMG",
  "blast dmg": "unstableBomberDMG",
  "blast damage": "unstableBomberDMG",
  "unstable_bomber_dmg": "unstableBomberDMG",
  "blast_dmg": "unstableBomberDMG",
  "unstable bomber dmg bonus": "unstableBomberDMGBonus",
  "unstable bomber damage bonus": "unstableBomberDMGBonus",
  "blast dmg bonus": "unstableBomberDMGBonus",

  "bullseye dmg": "bullseyeDMG",
  "bullseye damage": "bullseyeDMG",

  "crit rate": "critRate",
  "critical rate": "critRate",
  "crit_rate": "critRate",
  "criticalrate": "critRate",
  "critrate": "critRate",
  "crit chance": "critRate",
  "critical chance": "critRate",

  "crit dmg": "critDMG",
  "crit damage": "critDMG",
  "critical damage": "critDMG",
  "crit_dmg": "critDMG",
  "critdmg": "critDMG",
  "criticaldmg": "critDMG",

  "weakspot dmg": "weakspotDMG",
  "weakspot damage": "weakspotDMG",
  "weak spot dmg": "weakspotDMG",
  "weak spot damage": "weakspotDMG",
  "weakspot_dmg": "weakspotDMG",
  "weakspotdmg": "weakspotDMG",

  "fire rate": "fireRate",
  "rate of fire": "fireRate",
  "fire_rate": "fireRate",
  "firerate": "fireRate",
  "attack speed": "fireRate",

  "reload speed": "reloadSpeed",
  "reload_speed": "reloadSpeed",
  "reloadspeed": "reloadSpeed",

  "reload efficiency": "reloadEfficiency",
  "reload_efficiency": "reloadEfficiency",

  "magazine capacity": "magazineCapacity",
  "mag capacity": "magazineCapacity",
  "mag size": "magazineCapacity",
  "magazine_capacity": "magazineCapacity",
  "magazinecapacity": "magazineCapacity",

  "psi intensity": "psiIntensity",
  "psi_intensity": "psiIntensity",
  "psiintensity": "psiIntensity",

  "super anomaly strength": "superAnomalyStrength",
  "super_anomaly_strength": "superAnomalyStrength",

  "max hp": "maxHP",
  "maximum hp": "maxHP",
  "max_hp": "maxHP",
  "maxhp": "maxHP",
  "health": "maxHP",

  "hp recovery": "hpRecovery",
  "hp regen": "hpRecovery",
  "hp_recovery": "hpRecovery",
  "hprecovery": "hpRecovery",

  "shield": "shield",
  "shield capacity": "shield",

  "shield strength": "shieldStrength",
  "shield_strength": "shieldStrength",

  "dmg reduction": "dmgReduction",
  "damage reduction": "dmgReduction",
  "dm greduction": "dmgReduction",
  "dmg_reduction": "dmgReduction",

  "player dmg reduction": "playerDMGReduction",
  "player damage reduction": "playerDMGReduction",
  "pvp dmg reduction": "playerDMGReduction",
  "player_dmg_reduction": "playerDMGReduction",

  "status dmg reduction": "statusDMGReduction",
  "status damage reduction": "statusDMGReduction",
  "status_dmg_reduction": "statusDMGReduction",

  "weakspot dmg reduction": "weakspotDMGReduction",
  "weakspot damage reduction": "weakspotDMGReduction",
  "weakspot_dmg_reduction": "weakspotDMGReduction",

  "crit dmg reduction": "critDMGReduction",
  "crit damage reduction": "critDMGReduction",
  "critical dmg reduction": "critDMGReduction",
  "crit_dmg_reduction": "critDMGReduction",

  "healing received": "healingReceived",
  "healing_received": "healingReceived",
  "incoming healing": "healingReceived",

  "movement speed": "movementSpeed",
  "move speed": "movementSpeed",
  "movement_speed": "movementSpeed",
  "movespeed": "movementSpeed",

  "stamina": "stamina",
  "max stamina": "stamina",
  "maximum stamina": "stamina",

  "resistances": "resistances",
  "resistance": "resistances",
  "elemental resist": "resistances",
  "heat resist": "resistances",

  "gathering yield": "gatheringYield",
  "gathering_yield": "gatheringYield",

  "mining yield": "miningYield",
  "mining_yield": "miningYield",

  "logging yield": "loggingYield",
  "logging_yield": "loggingYield",

  "fishing yield": "fishingYield",
  "fishing_yield": "fishingYield",

  "crafting efficiency": "craftingEfficiency",
  "crafting_efficiency": "craftingEfficiency",

  "food duration": "foodDuration",
  "food_duration": "foodDuration",

  "deviation support": "deviationSupport",
  "deviation_support": "deviationSupport"
};

const KNOWN_BAD_TRANSLATIONS: Record<string, StatKey> = {
  "crit rate +x%": "critRate",
  "crit dmg +x%": "critDMG",
  "weapon dmg +x%": "weaponDMG",
  "status dmg +x%": "statusDMG",
  "elemental dmg +x%": "elementalDMG",
  "+crit rate": "critRate",
  "+crit dmg": "critDMG",
  "+weapon dmg": "weaponDMG"
};

const REVERSE_MAP = {} as Record<StatKey, string[]>;

function buildReverseMap(): void {
  for (const [variant, key] of Object.entries(STAT_KEY_MAP)) {
    if (!REVERSE_MAP[key]) REVERSE_MAP[key] = [];
    if (!REVERSE_MAP[key].includes(variant)) REVERSE_MAP[key].push(variant);
  }
}
buildReverseMap();

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[+%#]/g, "")
    .replace(/\s+/g, " ")
    .replace(/['']/g, "")
    .trim();
}

export function normalizeStatKey(label: string): StatKey | null {
  const normalized = normalizeLabel(label);
  const direct = STAT_KEY_MAP[normalized];
  if (direct) return direct;

  const badMatch = KNOWN_BAD_TRANSLATIONS[normalized];
  if (badMatch) return badMatch;

  for (const [variant, key] of Object.entries(STAT_KEY_MAP)) {
    if (normalized.includes(variant) || variant.includes(normalized)) {
      return key;
    }
  }

  return null;
}

export function getStatKeyVariants(statKey: StatKey): string[] {
  return REVERSE_MAP[statKey] ?? [statKey];
}

export function getDisplayName(statKey: StatKey): string {
  const preferred: Partial<Record<StatKey, string>> = {
    weaponDMG: "Weapon DMG",
    meleeDMG: "Melee DMG",
    statusDMG: "Status DMG",
    elementalDMG: "Elemental DMG",
    burnDMG: "Burn DMG",
    powerSurgeDMG: "Power Surge DMG",
    frostVortexDMG: "Frost Vortex DMG",
    weaponDMGBonus: "Weapon DMG Bonus",
    statusDMGBonus: "Status DMG Bonus",
    elementalDMGBonus: "Elemental DMG Bonus",
    burnDMGBonus: "Burn DMG Bonus",
    frostVortexDMGBonus: "Frost Vortex DMG Bonus",
    powerSurgeDMGBonus: "Power Surge DMG Bonus",
    unstableBomberDMGBonus: "Unstable Bomber DMG Bonus",
    bounceDMG: "Bounce DMG",
    shrapnelDMG: "Shrapnel DMG",
    fastGunnerDMG: "Fast Gunner DMG",
    unstableBomberDMG: "Unstable Bomber DMG",
    bullseyeDMG: "Bullseye DMG",
    critRate: "Crit Rate",
    critDMG: "Crit DMG",
    weakspotDMG: "Weakspot DMG",
    fireRate: "Fire Rate",
    reloadSpeed: "Reload Speed",
    reloadEfficiency: "Reload Efficiency",
    magazineCapacity: "Magazine Capacity",
    psiIntensity: "Psi Intensity",
    superAnomalyStrength: "Super Anomaly Strength",
    maxHP: "Max HP",
    hpRecovery: "HP Recovery",
    shield: "Shield",
    shieldStrength: "Shield Strength",
    dmgReduction: "DMG Reduction",
    playerDMGReduction: "Player DMG Reduction",
    statusDMGReduction: "Status DMG Reduction",
    weakspotDMGReduction: "Weakspot DMG Reduction",
    critDMGReduction: "Crit DMG Reduction",
    healingReceived: "Healing Received",
    movementSpeed: "Movement Speed",
    stamina: "Stamina",
    resistances: "Resistances",
    gatheringYield: "Gathering Yield",
    miningYield: "Mining Yield",
    loggingYield: "Logging Yield",
    fishingYield: "Fishing Yield",
    craftingEfficiency: "Crafting Efficiency",
    foodDuration: "Food Duration",
    deviationSupport: "Deviation Support",
    burnCurrentStacks: "Burn Current Stacks",
    burnTickFrequencyBonus: "Burn Tick Frequency Bonus",
    flatBurnBonus: "Flat Burn Bonus",
    humanDamageBonus: "Human Damage Bonus",
    dotResistanceReduction: "DoT Resistance Reduction",
    burnResistanceDebuffLevel: "Burn Resistance Debuff Level",
    weaponVulnerability: "Weapon Vulnerability",
    statusVulnerability: "Status Vulnerability",
    enemyTypeDMGBonus: "Enemy Type DMG Bonus",
    keywordSuffixDMGBonus: "Keyword Suffix DMG Bonus",
    attackPercent: "Attack Percent"
  };
  return preferred[statKey] ?? statKey;
}

export function normalizeRawStats(rawStats: Record<string, number>): Partial<Record<StatKey, number>> {
  const result: Partial<Record<StatKey, number>> = {};
  for (const [label, value] of Object.entries(rawStats)) {
    const key = normalizeStatKey(label);
    if (key) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}
