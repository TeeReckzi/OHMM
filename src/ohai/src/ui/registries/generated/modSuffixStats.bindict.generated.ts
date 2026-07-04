// Auto-generated from bindict_scan.json table 04192 (mod affix stat definitions).
// Do not edit directly. Regenerate with: npm run generate:mod-suffix-stats
// Only includes affix entries with fully-resolved attr codes → StatKeys.

import type { StatModifier } from "../../itemTypes";

/**
 * Mod suffix stat values keyed by affix ID.
 * Each entry contains the StatKey and tier values (tiers 1-6).
 * Use these to populate statModifiers on mod suffix registry entries.
 */
export interface BindictAffixStat {
  affixId: number;
  nameZhCn: string;
  statKey: string;
  attrCodes: string[];
  tierValues: number[];
  maxTier: number;
}

export const bindictAffixStats: BindictAffixStat[] = [
  { affixId: 1101, nameZhCn: "暴击率", statKey: "critRate", attrCodes: ["E0100"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 1102, nameZhCn: "暴击伤害", statKey: "critDMG", attrCodes: ["E0200"], tierValues: [0.03,0.06,0.09,0.12,0.15,0.18], maxTier: 6 },
  { affixId: 1103, nameZhCn: "弱点伤害", statKey: "weakspotDMG", attrCodes: ["E0300"], tierValues: [0.018,0.036,0.054,0.072,0.09,0.108], maxTier: 6 },
  { affixId: 1104, nameZhCn: "弹匣容量", statKey: "magazineCapacity", attrCodes: ["Q1101"], tierValues: [0.024,0.048,0.072,0.096,0.12,0.144], maxTier: 6 },
  { affixId: 1105, nameZhCn: "射速", statKey: "fireRate", attrCodes: ["Q0900"], tierValues: [0.01,0.02,0.03,0.04,0.05,0.06], maxTier: 6 },
  { affixId: 1106, nameZhCn: "换弹速度", statKey: "reloadSpeed", attrCodes: ["Q2400"], tierValues: [0.018,0.036,0.054,0.072,0.09,0.108], maxTier: 6 },
  { affixId: 1107, nameZhCn: "超感", statKey: "psiIntensity", attrCodes: ["D4101"], tierValues: [0.008,0.016,0.024,0.032,0.04,0.048], maxTier: 6 },
  { affixId: 1108, nameZhCn: "枪械伤害", statKey: "weaponDMGBonus", attrCodes: ["E4200"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 1109, nameZhCn: "异常伤害", statKey: "statusDMGBonus", attrCodes: ["E4300"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 1409, nameZhCn: "近战伤害", statKey: "meleeDMGBonus", attrCodes: ["E4100"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 3101, nameZhCn: "耐力提升", statKey: "stamina", attrCodes: ["A1100"], tierValues: [0.02,0.04,0.06,0.08,0.1,0.12], maxTier: 6 },
  { affixId: 3102, nameZhCn: "耐力减免", statKey: "stamina", attrCodes: ["A1300"], tierValues: [-0.02,-0.04,-0.06,-0.08,-0.1,-0.12], maxTier: 6 },
  { affixId: 3102, nameZhCn: "耐力减免", statKey: "stamina", attrCodes: ["A1400"], tierValues: [-0.02,-0.04,-0.06,-0.08,-0.1,-0.12], maxTier: 6 },
  { affixId: 3103, nameZhCn: "耐力恢复", statKey: "stamina", attrCodes: ["A1200"], tierValues: [-0.02,-0.04,-0.06,-0.08,-0.1,-0.12], maxTier: 6 },
  { affixId: 3104, nameZhCn: "移动速度", statKey: "movementSpeed", attrCodes: ["S0100"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 3105, nameZhCn: "冲刺速度", statKey: "movementSpeedBonus", attrCodes: ["S0400"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 4401, nameZhCn: "对普通敌人伤害", statKey: "enemyTypeDMGBonus", attrCodes: ["E10100"], tierValues: [0.02,0.04,0.06,0.08,0.1,0.12], maxTier: 6 },
  { affixId: 4402, nameZhCn: "对精英敌人伤害", statKey: "enemyTypeDMGBonus", attrCodes: ["E9900"], tierValues: [0.015,0.03,0.045,0.06,0.075,0.09], maxTier: 6 },
  { affixId: 4402, nameZhCn: "对精英敌人伤害", statKey: "enemyTypeDMGBonus", attrCodes: ["E10200"], tierValues: [0.015,0.03,0.045,0.06,0.075,0.09], maxTier: 6 },
  { affixId: 4403, nameZhCn: "对上位者伤害", statKey: "enemyTypeDMGBonus", attrCodes: ["E10000"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 5101, nameZhCn: "生命", statKey: "maxHP", attrCodes: ["A0202"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 5102, nameZhCn: "暴击防御", statKey: "critDMGReduction", attrCodes: ["E0500"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 5103, nameZhCn: "弱点防御", statKey: "weakspotDMGReduction", attrCodes: ["E0600"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 5104, nameZhCn: "受疗增益", statKey: "healingReceived", attrCodes: ["A2100"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 5105, nameZhCn: "药物增益", statKey: "medicineEffectBonus", attrCodes: ["A2300"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 5201, nameZhCn: "头部防御", statKey: "dmgReduction", attrCodes: ["G8100"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 5202, nameZhCn: "躯干防御", statKey: "dmgReduction", attrCodes: ["G8200"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 5203, nameZhCn: "四肢防御", statKey: "dmgReduction", attrCodes: ["G8300"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6101, nameZhCn: "炽能", statKey: "burnDMGBonus", attrCodes: ["E3200"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 6102, nameZhCn: "霜寒", statKey: "frostVortexDMGBonus", attrCodes: ["E3300"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 6103, nameZhCn: "电离", statKey: "powerSurgeDMGBonus", attrCodes: ["E3400"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 6104, nameZhCn: "爆炸", statKey: "unstableBomberDMGBonus", attrCodes: ["E3800"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 6201, nameZhCn: "炽能防御", statKey: "resistances", attrCodes: ["G4200"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6202, nameZhCn: "霜寒", statKey: "resistances", attrCodes: ["G4300"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6203, nameZhCn: "电离", statKey: "resistances", attrCodes: ["G4400"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6204, nameZhCn: "枪械防御", statKey: "weaponDMGReduction", attrCodes: ["G5200"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 6205, nameZhCn: "异常防御", statKey: "statusDMGReduction", attrCodes: ["G5300"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 6206, nameZhCn: "炽能、爆炸防御", statKey: "resistances", attrCodes: ["G4200"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6206, nameZhCn: "炽能、爆炸防御", statKey: "resistances", attrCodes: ["G4500"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6207, nameZhCn: "霜寒、电离防御", statKey: "resistances", attrCodes: ["G4300"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 6207, nameZhCn: "霜寒、电离防御", statKey: "resistances", attrCodes: ["G4400"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 7205, nameZhCn: "持续效果", statKey: "dotEffectDMGBonus", attrCodes: ["E11100"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7205, nameZhCn: "持续效果", statKey: "dotEffectDMGBonus", attrCodes: ["E12200"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7206, nameZhCn: "瞬时性效果", statKey: "instantEffectDMGBonus", attrCodes: ["E12100"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7206, nameZhCn: "瞬时性效果", statKey: "instantEffectDMGBonus", attrCodes: ["E12300"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7313, nameZhCn: "碎弹暴击", statKey: "shrapnelCritDMGBonus", attrCodes: ["J6100"], tierValues: [0.05,0.1,0.15,0.2,0.25,0.3], maxTier: 6 },
  { affixId: 7314, nameZhCn: "碎弹弱点", statKey: "shrapnelDMGBonus", attrCodes: ["J8100"], tierValues: [0.03,0.06,0.09,0.12,0.15,0.18], maxTier: 6 },
  { affixId: 7321, nameZhCn: "灼烧伤害", statKey: "dotEffectDMGBonus", attrCodes: ["E11100"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7331, nameZhCn: "电涌伤害", statKey: "instantEffectDMGBonus", attrCodes: ["E12100"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7333, nameZhCn: "对电涌增伤", statKey: "damageVsPowerSurgeTargetBonus", attrCodes: ["F7600"], tierValues: [0.016,0.032,0.048,0.064,0.08,0.096], maxTier: 6 },
  { affixId: 7341, nameZhCn: "冰霜旋涡伤害", statKey: "dotEffectDMGBonus", attrCodes: ["E12200"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7353, nameZhCn: "猎人印记伤害", statKey: "markedTargetDMGBonus", attrCodes: ["F7300"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7354, nameZhCn: "猎人印记弱点", statKey: "markedTargetWeakspotDMGBonus", attrCodes: ["F10300"], tierValues: [0.024,0.048,0.072,0.096,0.12,0.144], maxTier: 6 },
  { affixId: 7355, nameZhCn: "猎人印记暴击", statKey: "markedTargetCritDMGBonus", attrCodes: ["F9300"], tierValues: [0.036,0.072,0.108,0.144,0.18,0.216], maxTier: 6 },
  { affixId: 7363, nameZhCn: "重装阵地伤害", statKey: "fortressWarfareZoneDMGBonus", attrCodes: ["L9800"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 7373, nameZhCn: "弹射暴击", statKey: "bounceDMGBonus", attrCodes: ["J6200"], tierValues: [0.05,0.1,0.15,0.2,0.25,0.3], maxTier: 6 },
  { affixId: 7374, nameZhCn: "弹射弱点", statKey: "bounceDMGBonus", attrCodes: ["J8200"], tierValues: [0.03,0.06,0.09,0.12,0.15,0.18], maxTier: 6 },
  { affixId: 7381, nameZhCn: "不稳定爆弹伤害", statKey: "instantEffectDMGBonus", attrCodes: ["E12300"], tierValues: [0.012,0.024,0.036,0.048,0.06,0.072], maxTier: 6 },
  { affixId: 8701, nameZhCn: "冷箭流矢", statKey: "weakspotDMG", attrCodes: ["E0300"], tierValues: [0.05,0.1,0.15,0.2,0.25,0.3], maxTier: 6 },
  { affixId: 8801, nameZhCn: "重型武器", statKey: "weaponDMGBonus", attrCodes: ["E4200"], tierValues: [0.03,0.06,0.09,0.12,0.15,0.18], maxTier: 6 },
  { affixId: 8901, nameZhCn: "冷兵利刃", statKey: "meleeDMGBonus", attrCodes: ["E4100"], tierValues: [0.04,0.08,0.12,0.16,0.2,0.24], maxTier: 6 },
  { affixId: 9511, nameZhCn: "暴击强化", statKey: "critRate", attrCodes: ["E0100"], tierValues: [0.03,0.06,0.09,0.12,0.15], maxTier: 5 },
  { affixId: 9512, nameZhCn: "暴伤强化", statKey: "critRate", attrCodes: ["E0100"], tierValues: [0.02,0.02,0.02,0.05,0.1], maxTier: 5 },
  { affixId: 9512, nameZhCn: "暴伤强化", statKey: "critDMG", attrCodes: ["E0200"], tierValues: [0.04,0.08,0.12,0.15,0.15], maxTier: 5 },
  { affixId: 9513, nameZhCn: "弱点强化", statKey: "weakspotDMG", attrCodes: ["E0300"], tierValues: [0.05,0.1,0.15,0.2,0.25], maxTier: 5 },
  { affixId: 9514, nameZhCn: "生命强化", statKey: "maxHP", attrCodes: ["A0202"], tierValues: [0.04,0.06,0.08,0.1,0.12], maxTier: 5 },
  { affixId: 9515, nameZhCn: "异常强化", statKey: "statusDMGBonus", attrCodes: ["E4300"], tierValues: [0.04,0.08,0.12,0.16,0.2], maxTier: 5 },
  { affixId: 9516, nameZhCn: "枪械强化", statKey: "weaponDMGBonus", attrCodes: ["E4200"], tierValues: [0.03,0.06,0.09,0.12,0.15], maxTier: 5 },
  { affixId: 9517, nameZhCn: "近战强化", statKey: "meleeDMGBonus", attrCodes: ["E4100"], tierValues: [0.04,0.08,0.12,0.16,0.2], maxTier: 5 },
  { affixId: 9521, nameZhCn: "灼烧伤害", statKey: "dotEffectDMGBonus", attrCodes: ["E11100"], tierValues: [0.024,0.048,0.072,0.096,0.12], maxTier: 5 },
  { affixId: 9522, nameZhCn: "电涌伤害", statKey: "instantEffectDMGBonus", attrCodes: ["E12100"], tierValues: [0.024,0.048,0.072,0.096,0.12], maxTier: 5 },
];

/**
 * Lookup affix stats by affix ID. Returns all stat entries for that affix.
 * Multiple entries per affix ID means the affix provides multiple stats.
 */
export function getAffixStats(affixId: number): BindictAffixStat[] {
  return bindictAffixStats.filter(s => s.affixId === affixId);
}

/**
 * Convert affix stats to StatModifier[] format for registry consumption.
 */
export function affixToStatModifiers(affixId: number, tier?: number): StatModifier[] {
  const stats = getAffixStats(affixId);
  return stats.map(s => ({
    stat: s.statKey,
    value: tier && tier <= s.tierValues.length ? s.tierValues[tier - 1] : s.tierValues[0],
    unit: "percent" as const,
    tierValues: s.tierValues,
  }));
}
