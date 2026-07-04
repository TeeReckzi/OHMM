/**
 * Attribute Code → StatKey Mapping
 *
 * Maps internal game attribute codes (from decoded bindict data, table 04192)
 * to the OHMM canonical StatKey system (defined in buildGoalSchema.ts).
 *
 * Confidence levels:
 *   - 'confirmed': Game tooltip text + verified terminology match
 *   - 'high': Strong semantic match from Chinese name translation
 *   - 'inferred': Best guess based on context, needs verification
 *   - 'unmapped': No StatKey equivalent (or intentionally left out)
 *
 * Prefix meanings (from game binary data):
 *   A = Survival (HP, stamina, healing)
 *   D = Psychic/Perception (超感)
 *   E = Damage (crit, elemental, damage types, keyword groups)
 *   F = Special conditionals (hunter mark, surge, keyword-target)
 *   G = Defense (elemental defense, body parts)
 *   J = Bullet effects (split/ricochet crit/weakspot)
 *   L = Triggers (negative/buff/area/zone)
 *   Q = Weapon handling (stability, accuracy, fire rate, reload)
 *   S = Mobility (move speed, sprint)
 */

import type { StatKey } from '../schemas/buildGoalSchema';

export type MappingConfidence = 'confirmed' | 'high' | 'inferred' | 'unmapped';

export interface AttrMapping {
  attrCode: string;
  nameZhCn: string;
  nameEn: string;
  statKey: StatKey | null;
  category: string;
  confidence: MappingConfidence;
  notes: string;
}

/** Legacy aliases for backward compatibility */
export const LEGACY_ALIASES: Record<string, StatKey> = {
  bullseyeDMG: 'markedTargetDMGBonus',
};

export const ATTR_TO_STATKEY_MAP: AttrMapping[] = [
  // ═══ A — Survival ═══
  { attrCode: 'A0202', nameZhCn: '生命', nameEn: 'HP', statKey: 'maxHP', category: 'survival', confidence: 'confirmed', notes: '' },
  { attrCode: 'A1100', nameZhCn: '耐力提升', nameEn: 'Stamina Up', statKey: 'stamina', category: 'survival', confidence: 'confirmed', notes: '' },
  { attrCode: 'A1200', nameZhCn: '耐力恢复', nameEn: 'Stamina Recovery', statKey: 'stamina', category: 'survival', confidence: 'high', notes: 'Recovery aspect' },
  { attrCode: 'A1300', nameZhCn: '耐力减免', nameEn: 'Stamina Cost Reduction', statKey: 'stamina', category: 'survival', confidence: 'high', notes: 'Cost reduction aspect' },
  { attrCode: 'A1400', nameZhCn: '耐力减免', nameEn: 'Stamina Cost Reduction 2', statKey: 'stamina', category: 'survival', confidence: 'high', notes: 'Duplicate code, different context' },
  { attrCode: 'A2100', nameZhCn: '受疗增益', nameEn: 'Healing Received', statKey: 'healingReceived', category: 'survival', confidence: 'confirmed', notes: '' },
  { attrCode: 'A2300', nameZhCn: '药物增益', nameEn: 'Medicine Effect', statKey: 'medicineEffectBonus', category: 'survival', confidence: 'confirmed', notes: '' },

  // ═══ D — Psychic ═══
  { attrCode: 'D4101', nameZhCn: '超感', nameEn: 'Psi Intensity', statKey: 'psiIntensity', category: 'psychic', confidence: 'confirmed', notes: '' },

  // ═══ E — Damage (crit, weakspot, elements, keyword groups) ═══
  { attrCode: 'E0100', nameZhCn: '暴击率', nameEn: 'Crit Rate', statKey: 'critRate', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E0200', nameZhCn: '暴击伤害', nameEn: 'Crit Damage', statKey: 'critDMG', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E0300', nameZhCn: '弱点伤害', nameEn: 'Weakspot Damage', statKey: 'weakspotDMG', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E0500', nameZhCn: '暴击防御', nameEn: 'Crit DMG Reduction', statKey: 'critDMGReduction', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E0600', nameZhCn: '弱点防御', nameEn: 'Weakspot DMG Reduction', statKey: 'weakspotDMGReduction', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E10000', nameZhCn: '对上位者伤害', nameEn: 'DMG vs Superiors', statKey: 'enemyTypeDMGBonus', category: 'damage', confidence: 'high', notes: 'Superior = mob rank' },
  { attrCode: 'E10100', nameZhCn: '对普通敌人伤害', nameEn: 'DMG vs Normal Enemies', statKey: 'enemyTypeDMGBonus', category: 'damage', confidence: 'high', notes: '' },
  { attrCode: 'E10200', nameZhCn: '对精英敌人伤害', nameEn: 'DMG vs Elite Enemies', statKey: 'enemyTypeDMGBonus', category: 'damage', confidence: 'high', notes: '' },
  { attrCode: 'E9900', nameZhCn: '对精英敌人伤害', nameEn: 'DMG vs Elites (alt code)', statKey: 'enemyTypeDMGBonus', category: 'damage', confidence: 'high', notes: 'Duplicate of E10200' },
  { attrCode: 'E3200', nameZhCn: '炽能', nameEn: 'Blaze (Burn keyword)', statKey: 'burnDMGBonus', category: 'damage', confidence: 'confirmed', notes: '炽能 = Blaze. Keyword-specific status/proc bonus for Burn family.' },
  { attrCode: 'E3300', nameZhCn: '霜寒', nameEn: 'Frost (Frost Vortex keyword)', statKey: 'frostVortexDMGBonus', category: 'damage', confidence: 'confirmed', notes: '霜寒 = Frost. Keyword-specific status/proc bonus for Frost Vortex family.' },
  { attrCode: 'E3400', nameZhCn: '电离', nameEn: 'Ionization (Power Surge keyword)', statKey: 'powerSurgeDMGBonus', category: 'damage', confidence: 'confirmed', notes: '电离 = Ionization. Keyword-specific status/proc bonus for Power Surge family.' },
  { attrCode: 'E3800', nameZhCn: '爆炸', nameEn: 'Explosion (Unstable Bomber keyword)', statKey: 'unstableBomberDMGBonus', category: 'damage', confidence: 'confirmed', notes: '爆炸 = Explosion. Keyword-specific status/proc bonus for Unstable Bomber family.' },
  { attrCode: 'E4100', nameZhCn: '近战伤害', nameEn: 'Melee Damage', statKey: 'meleeDMGBonus', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E4200', nameZhCn: '枪械伤害', nameEn: 'Gun/Weapon Damage', statKey: 'weaponDMGBonus', category: 'damage', confidence: 'confirmed', notes: '' },
  { attrCode: 'E4300', nameZhCn: '异常伤害', nameEn: 'Status/Anomaly Damage (global)', statKey: 'statusDMGBonus', category: 'damage', confidence: 'confirmed', notes: 'Global all-status. Tooltip: 异常伤害 = all status damage' },
  { attrCode: 'E7400', nameZhCn: '战术强化', nameEn: 'Tactical Item Damage', statKey: null, category: 'damage', confidence: 'unmapped', notes: 'Throwable/tactical damage. Not tracked yet.' },

  // ═══ E — Keyword Group Bonuses (DoT vs Instant split) ═══
  // These are NOT generic statusDMGBonus. They apply only to their listed keyword families.
  { attrCode: 'E11100', nameZhCn: '持续效果', nameEn: 'DoT Effect DMG (Burn, Frost Vortex)', statKey: 'dotEffectDMGBonus', category: 'damage', confidence: 'confirmed', notes: 'Tooltip: 持续伤害（灼烧、冰霜漩涡）伤害+X%' },
  { attrCode: 'E12100', nameZhCn: '瞬时性效果', nameEn: 'Instant Effect DMG (Unstable Bomber, Power Surge)', statKey: 'instantEffectDMGBonus', category: 'damage', confidence: 'confirmed', notes: 'Tooltip: 瞬时性伤害（不稳定爆弹、电涌）伤害+X%' },
  { attrCode: 'E12200', nameZhCn: '持续效果', nameEn: 'DoT Effect DMG (duplicate)', statKey: 'dotEffectDMGBonus', category: 'damage', confidence: 'confirmed', notes: 'Same as E11100, different code context' },
  { attrCode: 'E12300', nameZhCn: '瞬时性效果', nameEn: 'Instant Effect DMG (duplicate)', statKey: 'instantEffectDMGBonus', category: 'damage', confidence: 'confirmed', notes: 'Same as E12100, different code context' },

  // ═══ F — Conditional (target-keyword, marked target) ═══
  { attrCode: 'F7300', nameZhCn: '猎人印记伤害', nameEn: 'Marked Target DMG', statKey: 'markedTargetDMGBonus', category: 'conditional', confidence: 'confirmed', notes: 'Tooltip: 对猎人印记目标伤害+X%' },
  { attrCode: 'F9300', nameZhCn: '猎人印记暴击', nameEn: 'Marked Target Crit DMG', statKey: 'markedTargetCritDMGBonus', category: 'conditional', confidence: 'confirmed', notes: 'Tooltip: 对猎人印记目标暴击伤害+X%' },
  { attrCode: 'F10300', nameZhCn: '猎人印记弱点', nameEn: 'Marked Target Weakspot DMG', statKey: 'markedTargetWeakspotDMGBonus', category: 'conditional', confidence: 'confirmed', notes: 'Tooltip: 对猎人印记目标弱点伤害+X%' },
  { attrCode: 'F7600', nameZhCn: '对电涌增伤', nameEn: 'DMG vs Power Surge Target', statKey: 'damageVsPowerSurgeTargetBonus', category: 'conditional', confidence: 'confirmed', notes: 'Tooltip: 对电涌异常目标伤害+X%' },

  // ═══ G — Defense ═══
  { attrCode: 'G4200', nameZhCn: '炽能防御', nameEn: 'Fire/Blaze Defense', statKey: 'resistances', category: 'defense', confidence: 'high', notes: 'Elemental resistance (fire)' },
  { attrCode: 'G4300', nameZhCn: '霜寒防御', nameEn: 'Frost Defense', statKey: 'resistances', category: 'defense', confidence: 'high', notes: 'Elemental resistance (frost)' },
  { attrCode: 'G4400', nameZhCn: '电离防御', nameEn: 'Electric Defense', statKey: 'resistances', category: 'defense', confidence: 'high', notes: 'Elemental resistance (electric)' },
  { attrCode: 'G4500', nameZhCn: '炽能、爆炸防御', nameEn: 'Fire+Explosion Defense', statKey: 'resistances', category: 'defense', confidence: 'high', notes: 'Combined elemental resistance' },
  { attrCode: 'G5200', nameZhCn: '枪械防御', nameEn: 'Gun/Weapon DMG Reduction', statKey: 'weaponDMGReduction', category: 'defense', confidence: 'confirmed', notes: '' },
  { attrCode: 'G5300', nameZhCn: '异常防御', nameEn: 'Status DMG Reduction', statKey: 'statusDMGReduction', category: 'defense', confidence: 'confirmed', notes: '' },
  { attrCode: 'G8100', nameZhCn: '头部防御', nameEn: 'Head Defense', statKey: 'dmgReduction', category: 'defense', confidence: 'inferred', notes: 'Body-part defense. May need own key later.' },
  { attrCode: 'G8200', nameZhCn: '躯干防御', nameEn: 'Torso Defense', statKey: 'dmgReduction', category: 'defense', confidence: 'inferred', notes: 'Body-part defense.' },
  { attrCode: 'G8300', nameZhCn: '四肢防御', nameEn: 'Limb Defense', statKey: 'dmgReduction', category: 'defense', confidence: 'inferred', notes: 'Body-part defense.' },

  // ═══ J — Bullet Effects ═══
  { attrCode: 'J1200', nameZhCn: '子弹效果', nameEn: 'Bullet Effect 1', statKey: null, category: 'bullet_effect', confidence: 'unmapped', notes: 'Unclear mechanic. Needs investigation.' },
  { attrCode: 'J1300', nameZhCn: '子弹效果', nameEn: 'Bullet Effect 2', statKey: null, category: 'bullet_effect', confidence: 'unmapped', notes: 'Unclear mechanic.' },
  { attrCode: 'J6100', nameZhCn: '碎弹暴击', nameEn: 'Shrapnel Crit', statKey: 'shrapnelCritDMGBonus', category: 'bullet_effect', confidence: 'confirmed', notes: '' },
  { attrCode: 'J6200', nameZhCn: '弹射暴击', nameEn: 'Bounce Crit', statKey: 'bounceDMGBonus', category: 'bullet_effect', confidence: 'high', notes: 'Bounce keyword crit bonus' },
  { attrCode: 'J8100', nameZhCn: '碎弹弱点', nameEn: 'Shrapnel Weakspot', statKey: 'shrapnelDMGBonus', category: 'bullet_effect', confidence: 'high', notes: 'Shrapnel weakspot component' },
  { attrCode: 'J8200', nameZhCn: '弹射弱点', nameEn: 'Bounce Weakspot', statKey: 'bounceDMGBonus', category: 'bullet_effect', confidence: 'high', notes: 'Bounce weakspot component' },

  // ═══ L — Triggers / Zone / Conditional Mechanics ═══
  { attrCode: 'L0100', nameZhCn: '负面效果', nameEn: 'Negative Effect 1', statKey: null, category: 'trigger', confidence: 'unmapped', notes: 'Trigger mechanic, not a flat stat' },
  { attrCode: 'L0200', nameZhCn: '负面效果', nameEn: 'Negative Effect 2', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L0300', nameZhCn: '负面效果', nameEn: 'Negative Effect 3', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L12200', nameZhCn: '电涌暴击', nameEn: 'Power Surge Crit', statKey: null, category: 'trigger', confidence: 'unmapped', notes: 'Power Surge proc crit. Needs own key if tracked.' },
  { attrCode: 'L12400', nameZhCn: '不稳定爆弹暴击', nameEn: 'Unstable Bomber Crit', statKey: null, category: 'trigger', confidence: 'unmapped', notes: 'Unstable Bomber proc crit.' },
  { attrCode: 'L2100', nameZhCn: '增益效果', nameEn: 'Buff Effect 1', statKey: null, category: 'trigger', confidence: 'unmapped', notes: 'Buff trigger mechanic' },
  { attrCode: 'L2200', nameZhCn: '增益效果', nameEn: 'Buff Effect 2', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L3100', nameZhCn: '范围效果', nameEn: 'AoE Effect 1', statKey: null, category: 'trigger', confidence: 'unmapped', notes: 'AoE trigger mechanic' },
  { attrCode: 'L3200', nameZhCn: '范围效果', nameEn: 'AoE Effect 2', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L3300', nameZhCn: '范围效果', nameEn: 'AoE Effect 3', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4100', nameZhCn: '子弹触发', nameEn: 'Bullet Trigger 1', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4200', nameZhCn: '子弹触发', nameEn: 'Bullet Trigger 2', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4300', nameZhCn: '负面触发', nameEn: 'Negative Trigger 1', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4400', nameZhCn: '瞬时性触发', nameEn: 'Instant Trigger', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4500', nameZhCn: '负面触发', nameEn: 'Negative Trigger 2', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4600', nameZhCn: '负面触发', nameEn: 'Negative Trigger 3', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4700', nameZhCn: '增益触发', nameEn: 'Buff Trigger 1', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4800', nameZhCn: '范围触发', nameEn: 'AoE Trigger', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L4900', nameZhCn: '增益触发', nameEn: 'Buff Trigger 2', statKey: null, category: 'trigger', confidence: 'unmapped', notes: '' },
  { attrCode: 'L9800', nameZhCn: '重装阵地伤害', nameEn: 'Fortress Warfare Zone DMG', statKey: 'fortressWarfareZoneDMGBonus', category: 'trigger', confidence: 'confirmed', notes: 'Tooltip: 重装阵地内伤害+X%. Zone-gated bonus.' },

  // ═══ Q — Weapon Handling ═══
  { attrCode: 'Q0100', nameZhCn: '稳定度加成', nameEn: 'Stability Bonus', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Recoil stability. No StatKey yet.' },
  { attrCode: 'Q0300', nameZhCn: '准确度加成', nameEn: 'Accuracy Bonus', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Spread/accuracy. No StatKey yet.' },
  { attrCode: 'Q0600', nameZhCn: '射程加成', nameEn: 'Range Bonus', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Effective range. No StatKey yet.' },
  { attrCode: 'Q0900', nameZhCn: '射速', nameEn: 'Fire Rate', statKey: 'fireRate', category: 'weapon_handling', confidence: 'confirmed', notes: '' },
  { attrCode: 'Q1101', nameZhCn: '弹匣容量', nameEn: 'Magazine Capacity', statKey: 'magazineCapacity', category: 'weapon_handling', confidence: 'confirmed', notes: '' },
  { attrCode: 'Q1400', nameZhCn: '收枪速度', nameEn: 'Holster Speed', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Weapon holster speed. No StatKey.' },
  { attrCode: 'Q1500', nameZhCn: '拔枪速度', nameEn: 'Draw Speed', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Weapon draw speed. No StatKey.' },
  { attrCode: 'Q2000', nameZhCn: '抬枪速度', nameEn: 'Raise Speed', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Weapon raise speed. No StatKey.' },
  { attrCode: 'Q2100', nameZhCn: '开镜稳定度', nameEn: 'ADS Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Aim-down-sight stability.' },
  { attrCode: 'Q2400', nameZhCn: '换弹速度', nameEn: 'Reload Speed', statKey: 'reloadSpeed', category: 'weapon_handling', confidence: 'confirmed', notes: '' },
  // Weapon-type specific stability (Q8xxx) and accuracy (Q9xxx) codes
  { attrCode: 'Q8100', nameZhCn: '手枪稳定度', nameEn: 'Pistol Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: 'Weapon-type specific' },
  { attrCode: 'Q8200', nameZhCn: '霰弹枪稳定度', nameEn: 'Shotgun Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q8300', nameZhCn: '步枪稳定度', nameEn: 'Rifle Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q8400', nameZhCn: '狙击枪稳定度', nameEn: 'Sniper Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q8500', nameZhCn: '轻机枪稳定度', nameEn: 'LMG Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q8600', nameZhCn: '冲锋枪稳定度', nameEn: 'SMG Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q8700', nameZhCn: '弓弩稳定度', nameEn: 'Bow/Crossbow Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q8800', nameZhCn: '重武器稳定度', nameEn: 'Heavy Weapon Stability', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9100', nameZhCn: '手枪准确度', nameEn: 'Pistol Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9200', nameZhCn: '霰弹枪准确度', nameEn: 'Shotgun Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9300', nameZhCn: '步枪准确度', nameEn: 'Rifle Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9400', nameZhCn: '狙击枪准确度', nameEn: 'Sniper Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9500', nameZhCn: '轻机枪准确度', nameEn: 'LMG Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9600', nameZhCn: '冲锋枪准确度', nameEn: 'SMG Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9700', nameZhCn: '弓弩准确度', nameEn: 'Bow/Crossbow Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },
  { attrCode: 'Q9800', nameZhCn: '重武器准确度', nameEn: 'Heavy Weapon Accuracy', statKey: null, category: 'weapon_handling', confidence: 'unmapped', notes: '' },

  // ═══ S — Mobility ═══
  { attrCode: 'S0100', nameZhCn: '移动速度', nameEn: 'Movement Speed', statKey: 'movementSpeed', category: 'mobility', confidence: 'confirmed', notes: '' },
  { attrCode: 'S0400', nameZhCn: '冲刺速度', nameEn: 'Sprint Speed', statKey: 'movementSpeedBonus', category: 'mobility', confidence: 'high', notes: 'Sprint speed maps to movement speed bonus' },
];

/** Keyword group definitions for DoT vs Instant effect classification */
export type StatusKeyword =
  | 'burn'
  | 'frostVortex'
  | 'unstableBomber'
  | 'powerSurge'
  | 'shrapnel'
  | 'bounce'
  | 'fastGunner'
  | 'fortressWarfare'
  | 'theBullsEye'
  | string;

export type KeywordGroup = 'dotEffect' | 'instantEffect';

export const KEYWORD_GROUPS: Record<KeywordGroup, StatusKeyword[]> = {
  dotEffect: ['burn', 'frostVortex'],
  instantEffect: ['unstableBomber', 'powerSurge'],
};

export interface KeywordGroupBonuses {
  dotEffect?: number;
  instantEffect?: number;
}

/**
 * Get the keyword group bonus that applies to a given status keyword.
 *
 * Damage formula structure (additive within bucket, multiplicative between):
 *
 * finalStatusProcDamage =
 *   baseDamage
 *   * (1 + statusDMGBonus)        // global all-status damage bonus
 *   * (1 + keywordSpecificBonus)  // Burn / Frost Vortex / Power Surge / Unstable Bomber specific
 *   * (1 + keywordGroupBonus)     // DoT Effect or Instant Effect group
 *   * otherMultipliers;
 *
 * Within each bucket, sources are ADDITIVE:
 *   burnDMGBonus = weaponBurnBonus + modBurnBonus + foodBurnBonus
 *   Then: * (1 + burnDMGBonus) — single multiplication
 *
 * Do NOT compound same-bucket sources multiplicatively unless proven by game observation.
 */
export function getKeywordGroupBonus(
  keyword: StatusKeyword,
  bonuses: KeywordGroupBonuses
): number {
  let total = 0;

  if (KEYWORD_GROUPS.dotEffect.includes(keyword)) {
    total += bonuses.dotEffect ?? 0;
  }

  if (KEYWORD_GROUPS.instantEffect.includes(keyword)) {
    total += bonuses.instantEffect ?? 0;
  }

  return total;
}

/**
 * Look up the StatKey for a given game attribute code.
 * Returns null if the attr code is unknown or unmapped.
 */
export function resolveAttrToStatKey(attrCode: string): StatKey | null {
  const entry = ATTR_TO_STATKEY_MAP.find(m => m.attrCode === attrCode);
  return entry?.statKey ?? null;
}

/**
 * Get the full mapping entry for an attr code (includes confidence, notes, etc.)
 */
export function getAttrMapping(attrCode: string): AttrMapping | null {
  return ATTR_TO_STATKEY_MAP.find(m => m.attrCode === attrCode) ?? null;
}
