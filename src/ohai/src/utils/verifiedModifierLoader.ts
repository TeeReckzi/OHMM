/**
 * Loads verified JSON data and provides statModifier entries with real tier values.
 * Used as a post-processing layer in registries to replace empty statModifiers.
 */
import type { StatModifier } from "../ui/itemTypes";

// ── Stat name to StatKey mapping (covers all patterns from verified data) ──

const STAT_ENGLISH_TO_KEY: Record<string, string> = {
  "crit dmg": "critDMG",
  "crit rate": "critRate",
  "weakspot dmg": "weakspotDMG",
  "status dmg": "statusDMGBonus",
  "elemental dmg": "elementalDMGBonus",
  "max hp": "maxHP",
  "magazine capacity": "magazineCapacity",
  "melee dmg": "meleeDMGBonus",
  "blast dmg": "unstableBomberDMGBonus",
  "blaze dmg": "burnDMGBonus",
  "frost dmg": "frostVortexDMGBonus",
  "shock dmg": "powerSurgeDMGBonus",
  "reload efficiency": "reloadSpeed",
  "weapon dmg": "weaponDMG",
  "movement speed": "movementSpeed",
};

const STAT_CN_PATTERNS: [string, string][] = [
  ["槍械Damage", "weaponDMG"],
  ["灼燒Damage", "burnDMGBonus"],
  ["冰霜漩渦Damage", "frostVortexDMGBonus"],
  ["電湧Damage", "powerSurgeDMGBonus"],
  ["不穩定炸彈Damage", "unstableBomberDMGBonus"],
  ["彈射Damage", "bounceDMGBonus"],
  ["碎彈Damage", "shrapnelDMGBonus"],
  ["彈射Crit DMG", "shrapnelCritDMGBonus"],
  ["快槍手", "fastGunnerDMGBonus"],
  ["重裝陣地", "fortressWarfareDMGBonus"],
  ["獵人印記", "huntersMarkDMGBonus"],
  ["對所有怪物Damage提升", "enemyTypeDMGBonus"],
  ["受到怪物Damage降低", "dmgReduction"],
  ["正面受到非玩家Damage", "playerDMGReduction"],
  ["受到的15公尺外非玩家Damage", "playerDMGReduction"],
  ["HP低於50%", "dmgReduction"],
  ["元素", "elementalDMGBonus"],
  ["Damage提升", "weaponDMGBonus"],
];

function resolveStatKey(label: string): string | undefined {
  const lower = label.toLowerCase().trim();
  const exact = STAT_ENGLISH_TO_KEY[lower];
  if (exact) return exact;
  for (const [en, key] of Object.entries(STAT_ENGLISH_TO_KEY)) {
    if (lower.includes(en)) return key;
  }
  for (const [cn, key] of STAT_CN_PATTERNS) {
    if (label.includes(cn)) return key;
  }
  return undefined;
}

function normalizeId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Verified JSON data loaders ──

interface VerifiedValueEntry {
  value: number;
  unit: string | null;
  tierValues?: number[];
  valueType?: string;
}

let modSuffixLookup: Map<string, { statKey: string; tierValues: number[]; unit: string | null }[]> | null = null;
let foodBuffLookup: Map<string, { statKey: string; value: number; unit: string }[]> | null = null;
let deviationLookup: Map<string, { statKey: string; value: number; unit: string }[]> | null = null;

function ensureModSuffixLookup(): Map<string, { statKey: string; tierValues: number[]; unit: string | null }[]> {
  if (modSuffixLookup) return modSuffixLookup;
  modSuffixLookup = new Map();
  try {
    const data = require("../../data/verified/mod-suffix-effects.verified.json");
    if (!data || !data.items) return modSuffixLookup;
    for (const item of data.items) {
      const n = item.normalized;
      if (!n || !n.statEnglish || !n.valueParsed) continue;
      const key = resolveStatKey(n.statEnglish);
      if (!key) continue;
      // Collect unique tier values from valueParsed
      let tierValues: number[] | undefined;
      const first = n.valueParsed[0];
      if (first && Array.isArray(first.tierValues) && first.tierValues.length > 0) {
        tierValues = first.tierValues;
      }
      const unit = first?.unit ?? null;
      // Map suffix name → entries
      const suffixName = n.suffixEnglish ?? n.suffixOriginal ?? "";
      const suffixKey = normalizeId(suffixName);
      if (!suffixKey) continue;
      const entry = { statKey: key, tierValues: tierValues ?? [first?.value ?? 0], unit };
      const existing = modSuffixLookup.get(suffixKey);
      if (existing) existing.push(entry);
      else modSuffixLookup.set(suffixKey, [entry]);
    }
  } catch {}
  return modSuffixLookup;
}

function ensureFoodBuffLookup(): Map<string, { statKey: string; value: number; unit: string }[]> {
  if (foodBuffLookup) return foodBuffLookup;
  foodBuffLookup = new Map();
  try {
    const data = require("../../data/verified/food-buffs.verified.json");
    if (!data || !data.items) return foodBuffLookup;
    for (const item of data.items) {
      const n = item.normalized;
      if (!n || !n.parsedBuffs || !n.parsedBuffs.length || !n.nameEnglish) continue;
      const idKey = normalizeId(n.nameEnglish);
      const entries: { statKey: string; value: number; unit: string }[] = [];
      for (const buff of n.parsedBuffs) {
        const key = resolveStatKey(buff.buffEnglish ?? "");
        if (!key || buff.unit === "s") continue;
        let val = buff.value;
        if (buff.unit === "%") val = val / 100;
        entries.push({ statKey: key, value: val, unit: buff.unit === "%" ? "percent" : "flat" });
      }
      if (entries.length > 0) foodBuffLookup.set(idKey, entries);
    }
  } catch {}
  return foodBuffLookup;
}

function ensureDeviationLookup(): Map<string, { statKey: string; value: number; unit: string }[]> {
  if (deviationLookup) return deviationLookup;
  deviationLookup = new Map();
  try {
    const data = require("../../data/verified/deviations.verified.json");
    if (!data || !data.items) return deviationLookup;
    for (const item of data.items) {
      const n = item.normalized;
      if (!n || !n.parsedEffects || !n.parsedEffects.length || !n.nameEnglish) continue;
      const idKey = normalizeId(n.nameEnglish);
      const entries: { statKey: string; value: number; unit: string }[] = [];
      for (const eff of n.parsedEffects) {
        const key = resolveStatKey(eff.effectEnglish ?? "");
        if (!key || eff.unit === "s") continue;
        let val = eff.value;
        if (eff.unit === "%") val = val / 100;
        entries.push({ statKey: key, value: val, unit: eff.unit === "%" ? "percent" : "flat" });
      }
      if (entries.length > 0) deviationLookup.set(idKey, entries);
    }
  } catch {}
  return deviationLookup;
}

// ── Public API ──

export function getVerifiedStatModifiers(
  category: "mod-suffix" | "mod-core" | "food" | "deviation" | "key-gear",
  id: string,
): StatModifier[] | undefined {
  switch (category) {
    case "mod-suffix": {
      const map = ensureModSuffixLookup();
      // Extract suffix name from id like "suffix-violent" → "violent"
      const suffixName = id.replace(/^suffix-/, "");
      const entries = map.get(suffixName);
      if (!entries) return undefined;
      return entries.map((e) => {
        const val = e.tierValues[0];
        return { stat: e.statKey, value: val, unit: e.unit === "percent" ? "percent" : "flat", tierValues: e.tierValues };
      });
    }
    case "food": {
      const map = ensureFoodBuffLookup();
      const entries = map.get(id);
      if (!entries) return undefined;
      return entries.map((e) => ({ stat: e.statKey, value: e.value, unit: e.unit as "percent" | "flat" }));
    }
    case "deviation": {
      const map = ensureDeviationLookup();
      const entries = map.get(id);
      if (!entries) return undefined;
      return entries.map((e) => ({ stat: e.statKey, value: e.value, unit: e.unit as "percent" | "flat" }));
    }
    default:
      return undefined;
  }
}
