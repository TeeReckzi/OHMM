import type { StatKey } from "./buildGoalSchema";

export type ValueKind = "flat" | "percent" | "multiplier" | "context";
export type AppliesTo = "outgoing" | "incoming" | "utility" | "conditional" | "display";
export type AllowedContext = "pve" | "pvp" | "both";
export type AggregationBehavior = "additive" | "multiplicative" | "max" | "ignored";
export type FormulaSupportStatus = "supported" | "partial" | "pending" | "unmodeled";

export interface StatSemantic {
  valueKind: ValueKind;
  appliesTo: AppliesTo;
  allowedContexts: AllowedContext;
  formulaSupportStatus: FormulaSupportStatus;
  aggregationBehavior: AggregationBehavior;
  description: string;
}

export const STAT_SEMANTICS: Record<StatKey, StatSemantic> = {
  // ── Flat base damage ──
  weaponDMGFlat: {
    valueKind: "flat",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Flat base weapon damage used as the foundation for physical weapon formulas.",
  },
  meleeDMGFlat: {
    valueKind: "flat",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Flat base melee damage for melee weapon formulas.",
  },

  // ── Percent bonuses ──
  weaponDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Percentage bonus to weapon damage. Additive with other weaponDMGBonus sources. Applied as 1 + sum in physical weapon formula.",
  },
  statusDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Percentage bonus to status/mechanic damage. Applied as 1 + sum in status tick / DoT formulas.",
  },
  elementalDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Percentage bonus to elemental damage. Applied as 1 + sum in status formulas.",
  },
  burnDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Percentage bonus to burn mechanic damage. Applied as 1 + sum in burn formula as keywordSuffixDMGBonus.",
  },
  frostVortexDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Percentage bonus to Frost Vortex damage. Applied as 1 + sum. DoT vs single-hit model conflict pending.",
  },
  powerSurgeDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Percentage bonus to Power Surge damage. Applied as 1 + sum. Model conflict: DoT vs hybrid pending.",
  },
  unstableBomberDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Percentage bonus to Unstable Bomber damage. Applied as 1 + sum.",
  },
  shrapnelDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Percentage bonus to Shrapnel damage. Pending shrapnel mechanic modeling.",
  },
  shrapnelCritDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Percentage bonus to Shrapnel crit damage. Pending shrapnel mechanic modeling.",
  },
  bounceDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Percentage bonus to Bounce damage. Pending bounce mechanic modeling.",
  },
  meleeDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Percentage bonus to melee damage. Applied as 1 + sum.",
  },
  keywordSuffixDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Catch-all keyword/suffix damage bonus. Applied as 1 + sum in status formulas.",
  },
  enemyTypeDMGBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Bonus damage against specific enemy types. Applied as 1 + sum.",
  },
  attackPercent: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Attack power percentage. Applied as baseWeaponDMG × (1 + attackPercent) in physical weapon formula.",
  },
  humanDamageBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Bonus damage against human-type enemies. Applied as 1 + sum in burn formula.",
  },

  // ── Crit / Weakspot ──
  critRate: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Critical hit rate. Used in expected crit multiplier calculation.",
  },
  critDMG: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Critical damage multiplier above base. Used as 1 + critDMG in formulas.",
  },
  weakspotDMG: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Weakspot damage bonus. Used as 1 + weakspotDMG or additive in combined bucket.",
  },

  // ── Rate / speed ──
  fireRate: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Fire rate / attack speed increase. Modifies shots per second.",
  },
  reloadSpeed: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Reload speed increase. Modifies reload time.",
  },
  reloadEfficiency: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Reload efficiency / partial reload bonus. Not currently modeled in formulas.",
  },
  magazineCapacity: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Magazine capacity increase. Not currently modeled in formulas.",
  },
  movementSpeedBonus: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Movement speed percentage bonus. Display-only, does not affect DPS.",
  },
  medicineSpeedBonus: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Medicine/item use speed bonus. Display-only, does not affect DPS.",
  },

  // ── Psi / anomaly ──
  psiIntensity: {
    valueKind: "flat",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Psi intensity. Used as base damage in status/anomaly formulas: base = psiIntensity × baseFactor.",
  },
  superAnomalyStrength: {
    valueKind: "flat",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Super anomaly strength. Not currently modeled in formulas.",
  },

  // ── Defensive incoming ──
  maxHP: {
    valueKind: "flat",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Maximum HP. Used for effective health calculations.",
  },
  hpRecovery: {
    valueKind: "flat",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "HP recovery per tick/second. Not currently modeled.",
  },
  shield: {
    valueKind: "flat",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Shield amount. Used for effective health calculations.",
  },
  shieldStrength: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Shield strength multiplier. Not currently modeled.",
  },
  dmgReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Generic damage reduction. Routed away from outgoing DPS to survivability.",
  },
  playerDMGReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "pvp",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "PvP player damage reduction. Routed to PvP mitigation engine. Does not affect outgoing DPS.",
  },
  weaponDMGReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Weapon damage reduction (incoming). Routed away from outgoing DPS.",
  },
  statusDMGReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Status damage reduction (incoming). Routed away from outgoing DPS.",
  },
  weakspotDMGReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Weakspot damage reduction (incoming). Not fully modeled in survivability.",
  },
  critDMGReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Crit damage reduction (incoming). Not fully modeled in survivability.",
  },
  deviantDMGReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Deviant damage reduction (incoming). Not fully modeled.",
  },

  // ── Healing / utility ──
  healingReceived: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Healing received multiplier. Display-only, does not affect DPS.",
  },
  medicineEffectBonus: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Medicine effect bonus. Display-only, does not affect DPS.",
  },
  movementSpeed: {
    valueKind: "flat",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Flat movement speed. Display-only, does not affect DPS.",
  },
  stamina: {
    valueKind: "flat",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Stamina. Display-only, does not affect DPS.",
  },
  resistances: {
    valueKind: "flat",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Elemental/status resistances. Not currently modeled.",
  },
  foodDuration: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Food buff duration extension. Display-only.",
  },
  deviationSupport: {
    valueKind: "flat",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Deviation support stat. Display-only.",
  },

  // ── Vulnerabilities (target debuffs) ──
  weaponVulnerability: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Weapon vulnerability on target. Applied as late multiplier in physical weapon formula.",
  },
  statusVulnerability: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Status vulnerability on target. Applied as late multiplier in status formulas.",
  },

  // ── DoT mechanics ──
  burnCurrentStacks: {
    valueKind: "context",
    appliesTo: "conditional",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "ignored",
    description: "Current burn stacks on target. Used contextually in burn DoT formula, not aggregated.",
  },
  burnTickFrequencyBonus: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Burn tick frequency increase. Multiplier on base tick rate in burn formula.",
  },
  flatBurnBonus: {
    valueKind: "flat",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Flat damage bonus per burn stack. Added per-stack in burn formula.",
  },
  dotResistanceReduction: {
    valueKind: "percent",
    appliesTo: "incoming",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "DoT resistance reduction on target. Applied as 1 - reduction in burn formula.",
  },
  burnResistanceDebuffLevel: {
    valueKind: "context",
    appliesTo: "conditional",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "ignored",
    description: "Burn resistance debuff level on target. Used contextually in burn formula, not aggregated.",
  },

  // ── Legacy keys (backward compat, display-only) ──
  weaponDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous weaponDMG key. Use weaponDMGFlat for flat or weaponDMGBonus for percent.",
  },
  meleeDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous meleeDMG key. Use meleeDMGFlat for flat or meleeDMGBonus for percent.",
  },
  statusDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous statusDMG key. Use statusDMGBonus for percent bonus.",
  },
  elementalDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous elementalDMG key. Use elementalDMGBonus for percent bonus.",
  },
  burnDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "supported",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous burnDMG key. Use burnDMGBonus for percent bonus.",
  },
  frostVortexDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous frostVortexDMG key. Use frostVortexDMGBonus for percent bonus.",
  },
  powerSurgeDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous powerSurgeDMG key. Use powerSurgeDMGBonus for percent bonus.",
  },
  unstableBomberDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Legacy ambiguous unstableBomberDMG key. Use unstableBomberDMGBonus for percent bonus.",
  },

  // ── Legacy / pending mechanic keys ──
  bounceDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Legacy key for Bounce damage display. Use bounceDMGBonus for actual percent bonus.",
  },
  shrapnelDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Legacy key for Shrapnel damage display. Use shrapnelDMGBonus for actual percent bonus.",
  },
  fastGunnerDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Legacy key for Fast Gunner damage display. Pending fastGunner mechanic modeling.",
  },
  fastGunnerDMGBonus: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Fast Gunner DMG percent bonus. Pending fastGunner mechanic modeling.",
  },
  deviationSkillDMG: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Deviation skill damage modifier. Partially modeled via baseFactor scaling.",
  },
  foodBonusPercent: {
    valueKind: "percent",
    appliesTo: "outgoing",
    allowedContexts: "both",
    formulaSupportStatus: "partial",
    aggregationBehavior: "additive",
    description: "Food bonus percent from Chef Rex rating. Affects all food buff magnitudes.",
  },
  bullseyeDMG: {
    valueKind: "percent",
    appliesTo: "display",
    allowedContexts: "both",
    formulaSupportStatus: "pending",
    aggregationBehavior: "additive",
    description: "Legacy key for Bullseye damage display. Pending bullseye mechanic modeling.",
  },

  // ── Gathering (utility) ──
  gatheringYield: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Gathering yield bonus. Display-only, does not affect combat.",
  },
  miningYield: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Mining yield bonus. Display-only, does not affect combat.",
  },
  loggingYield: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Logging yield bonus. Display-only, does not affect combat.",
  },
  fishingYield: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Fishing yield bonus. Display-only, does not affect combat.",
  },
  craftingEfficiency: {
    valueKind: "percent",
    appliesTo: "utility",
    allowedContexts: "both",
    formulaSupportStatus: "unmodeled",
    aggregationBehavior: "additive",
    description: "Crafting efficiency bonus. Display-only, does not affect combat.",
  },
};

export function getStatSemantic(key: string): StatSemantic | undefined {
  return STAT_SEMANTICS[key as StatKey];
}

export function isOutgoingStat(key: string): boolean {
  const sem = getStatSemantic(key);
  return sem?.appliesTo === "outgoing";
}

export function isIncomingStat(key: string): boolean {
  const sem = getStatSemantic(key);
  return sem?.appliesTo === "incoming";
}

export function isUtilityStat(key: string): boolean {
  const sem = getStatSemantic(key);
  return sem?.appliesTo === "utility";
}

export function isDisplayOnlyStat(key: string): boolean {
  const sem = getStatSemantic(key);
  return sem?.appliesTo === "display";
}

export function isDPSAffectingStat(key: string): boolean {
  const sem = getStatSemantic(key);
  return sem?.appliesTo === "outgoing" || sem?.appliesTo === "conditional";
}

export function isSupportedStat(key: string): boolean {
  const sem = getStatSemantic(key);
  return sem?.formulaSupportStatus === "supported";
}
