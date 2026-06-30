/**
 * Maps English and Chinese stat names/descriptions to StatKey values.
 * Used to populate statModifiers from effectSummary text across all registries.
 */
import type { StatModifier } from "../ui/itemTypes";

const ENGLISH_STAT_MAP: Record<string, string> = {
  "weapon dmg": "weaponDMG",
  "weapon damage": "weaponDMG",
  "gun dmg": "weaponDMG",
  "gun damage": "weaponDMG",
  "crit dmg": "critDMG",
  "crit rate": "critRate",
  "weakspot dmg": "weakspotDMG",
  "status dmg": "statusDMGBonus",
  "elemental dmg": "elementalDMGBonus",
  "burn dmg": "burnDMGBonus",
  "frost vortex dmg": "frostVortexDMGBonus",
  "power surge dmg": "powerSurgeDMGBonus",
  "unstable bomber dmg": "unstableBomberDMGBonus",
  "shrapnel dmg": "shrapnelDMGBonus",
  "bounce dmg": "bounceDMGBonus",
  "melee dmg": "meleeDMGBonus",
  "fire rate": "fireRate",
  "reload speed": "reloadSpeed",
  "reload efficiency": "reloadEfficiency",
  "reload": "reloadEfficiency",
  "movement speed": "movementSpeed",
  "magazine capacity": "magazineCapacity",
  "magazine": "magazineCapacity",
  "psi intensity": "psiIntensity",
  "max hp": "maxHP",
  "shield": "shield",
  "stamina": "stamina",
  "hp recovery": "hpRecovery",
  "defence": "defence",
  "damage reduction": "playerDMGReduction",
  "dmg reduction": "playerDMGReduction",
  "range": "range",
  "accuracy": "accuracy",
  "stability": "stability",
  "mobility": "mobility",
};

const CN_STAT_MAP: Record<string, string> = {
  "灼燒": "burnDMGBonus",
  "熾能": "burnDMGBonus",
  "霜寒": "frostVortexDMGBonus",
  "冰霜": "frostVortexDMGBonus",
  "電離": "powerSurgeDMGBonus",
  "爆炸": "unstableBomberDMGBonus",
  "不穩定": "unstableBomberDMGBonus",
  "槍械": "weaponDMG",
  "攻擊力": "weaponDMG",
  "暴擊": "critRate",
  "弱點": "weakspotDMG",
  "元素": "elementalDMGBonus",
  "異常": "statusDMGBonus",
  "耐力": "stamina",
  "生命": "maxHP",
  "回復": "hpRecovery",
  "護盾": "shield",
  "移動": "movementSpeed",
  "彈射": "bounceDMGBonus",
  "碎彈": "shrapnelDMGBonus",
  "速射": "fastGunnerDMGBonus",
  "傷害": "weaponDMG",
  "換彈": "reloadEfficiency",
  "彈匣": "magazineCapacity",
  "減傷": "playerDMGReduction",
  "傷害降低": "playerDMGReduction",
  "傷害減免": "playerDMGReduction",
};

export function effectSummaryToStatKey(effectSummary: string): string | undefined {
  if (!effectSummary) return undefined;
  const lower = effectSummary.toLowerCase().trim();
  const exact = ENGLISH_STAT_MAP[lower];
  if (exact) return exact;
  for (const [cn, key] of Object.entries(CN_STAT_MAP)) {
    if (lower.includes(cn)) return key;
  }
  for (const [en, key] of Object.entries(ENGLISH_STAT_MAP)) {
    if (lower.includes(en)) return key;
  }
  return undefined;
}

const DEFAULT_TIER1_VALUES: Record<string, number> = {
  "critDMG": 0.03,
  "critRate": 0.03,
  "weakspotDMG": 0.06,
  "statusDMGBonus": 0.03,
  "elementalDMGBonus": 0.03,
  "burnDMGBonus": 0.04,
  "frostVortexDMGBonus": 0.04,
  "powerSurgeDMGBonus": 0.04,
  "unstableBomberDMGBonus": 0.04,
  "shrapnelDMGBonus": 0.04,
  "bounceDMGBonus": 0.04,
  "weaponDMG": 0.05,
  "weaponDMGBonus": 0.03,
};

function extractExplicitValue(text: string, statKey: string): number | null {
  if (!text) return null;
  // Prefer patterns like +12%, +5.5 %, 8% etc.
  const pct = text.match(/\+?\s*(\d+(?:\.\d+)?)\s*[%％]/);
  if (pct) {
    return parseFloat(pct[1]) / 100;
  }
  // Fallback: bare number near + or after common keywords (e.g. +10 or HP+300)
  const num = text.match(/\+?\s*(\d+(?:\.\d+)?)(?=\s*(?:$|[\s,，;；]|stack|層|秒|s\b))/i);
  if (num) {
    let v = parseFloat(num[1]);
    const isPercentStat = statKey.endsWith("Bonus") || ["critRate", "critDMG", "weakspotDMG", "fireRate"].includes(statKey);
    if (isPercentStat && v > 1) v = v / 100; // e.g. 10 → 0.10 if it looks percent-y but no % sign
    return v;
  }
  return null;
}

export function effectSummaryToStatModifiers(
  effectSummary: string,
  defaultValue?: number
): StatModifier[] {
  if (!effectSummary || effectSummary.trim() === "") return [];
  let statKey = effectSummaryToStatKey(effectSummary);
  if (!statKey) return [];
  const hasPct = /[%％]/.test(effectSummary);
  // Prefer Bonus variant for % damage increases expressed as "Gun DMG +xx%"
  if (hasPct && (statKey === "weaponDMG" || /dmg/i.test(statKey))) {
    if (statKey !== "critDMG" && statKey !== "weakspotDMG" && !statKey.endsWith("Bonus")) {
      statKey = statKey.replace(/DMG$/i, "DMGBonus");
    }
  }
  const explicit = extractExplicitValue(effectSummary, statKey);
  const value = explicit ?? defaultValue ?? DEFAULT_TIER1_VALUES[statKey] ?? 0.05;
  const isPercent = hasPct || statKey.endsWith("Bonus") || statKey === "critRate" || statKey === "critDMG" || statKey === "weakspotDMG" || statKey === "magazineCapacity";
  return [{
    stat: statKey,
    value: Math.round(value * 10000) / 10000,
    unit: isPercent ? "percent" : "flat",
  }];
}
