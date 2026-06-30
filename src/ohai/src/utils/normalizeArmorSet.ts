import type { NormalizedArmorSet, EffectTier, ParsedStat } from "../schemas/armorSetSchema";
import { lookupApprovedModTerm } from "./modTerminology";
import { lookupTranslation } from "./translationDictionary";

const SYSTEM_VERSION = "current_post_overhaul" as const;
const AVAILABILITY = "currently_farmable" as const;
const LEGACY_STATUS = "not_legacy" as const;

const variantPattern = /^(.+?)\((.+?)\)$/;

interface NameParts {
  nameOriginal: string;
  setFamilyOriginal: string | null;
  variantOriginal: string | null;
}

export function parseSetName(name: string): NameParts {
  const match = name.match(variantPattern);
  if (match) {
    return {
      nameOriginal: name,
      setFamilyOriginal: match[1].trim(),
      variantOriginal: match[2].trim()
    };
  }
  return {
    nameOriginal: name,
    setFamilyOriginal: null,
    variantOriginal: null
  };
}

function buildSetId(nameOriginal: string): string {
  const cleaned = nameOriginal
    .replace(/[()（）]/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff\u3000-\u303f\uff00-\uffef-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const prefix = "set";
  return `${prefix}-${cleaned}`;
}

interface TierSplitResult {
  tiers: Array<{ piecesRequired: number | null; label: string | null; text: string }>;
  fullText: string;
}

export function splitEffectTiers(effectText: string | null): TierSplitResult {
  if (!effectText) return { tiers: [], fullText: "" };
  const trimmed = effectText.trim();
  const tierRegex = /(?:^|\n)\s*(\d+)\s*[.、．]\s*/;
  const parts = trimmed.split(tierRegex);
  if (parts.length < 3) {
    return {
      tiers: [{ piecesRequired: null, label: null, text: trimmed }],
      fullText: trimmed
    };
  }
  const tiers: Array<{ piecesRequired: number | null; label: string | null; text: string }> = [];
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const pieceNum = parseInt(parts[i], 10);
    const text = parts[i + 1]?.trim() || "";
    if (text) {
      tiers.push({ piecesRequired: isNaN(pieceNum) ? null : pieceNum, label: null, text });
    }
  }
  if (tiers.length === 0) {
    return {
      tiers: [{ piecesRequired: null, label: null, text: trimmed }],
      fullText: trimmed
    };
  }
  return { tiers, fullText: trimmed };
}

export function normalizeArmorSet(
  nameOriginal: string,
  effectText: string | null
): NormalizedArmorSet {
  const notes: string[] = [];
  const reviewReasons: string[] = [];

  const nameParts = parseSetName(nameOriginal);

  const setFamilyEnglish = nameParts.setFamilyOriginal
    ? (armorSetNameMap[nameParts.setFamilyOriginal] ?? null)
    : null;

  const variantEnglish = nameParts.variantOriginal && nameParts.setFamilyOriginal
    ? (armorSetVariantMap[nameParts.setFamilyOriginal]?.[nameParts.variantOriginal] ?? null)
    : null;

  const nameEnglish = armorSetNameMap[nameOriginal] ?? variantEnglish ?? null;

  const { tiers, fullText } = splitEffectTiers(effectText);
  const effectOriginal = fullText || null;

  const effectTiers: EffectTier[] = tiers.map((tier) => {
    const tierReviewReasons: string[] = [];
    const effectEnglishPartial = translateEffectPartial(tier.text);
    const parsedStats = parseStatsFromText(tier.text);
    const tierNeedsReview = !effectEnglishPartial;
    if (tierNeedsReview) {
      tierReviewReasons.push("set_effect_tier_needs_review");
    }
    return {
      piecesRequired: tier.piecesRequired,
      labelOriginal: tier.label,
      labelEnglish: null,
      effectOriginal: tier.text,
      effectEnglish: null,
      effectEnglishPartial,
      parsedStats,
      needsReview: tierNeedsReview,
      reviewReasons: tierReviewReasons
    };
  });

  const effectEnglishPartial = fullText ? translateEffectPartial(fullText) : null;
  const effectEnglish = null;

  const allStats: ParsedStat[] = [];
  effectTiers.forEach((t) => t.parsedStats.forEach((s) => allStats.push(s)));

  const keywordOriginal = null;
  const keywordEnglish = null;
  const elementOriginal = null;
  const elementEnglish = null;

  let terminologySource: "terminology_registry" | "translation_dictionary" | "unknown" = "unknown";
  let translationConfidence: "high" | "medium" | "low" | "unknown" = "unknown";

  if (!nameEnglish) {
    reviewReasons.push("set_name_needs_review");
  }
  if (!effectEnglishPartial) {
    reviewReasons.push("set_effect_needs_review");
  }
  if (nameParts.variantOriginal && !variantEnglish) {
    reviewReasons.push("set_variant_needs_review");
  }
  if (effectTiers.some((t) => t.needsReview)) {
    reviewReasons.push("set_effect_tier_parse_needs_review");
  }

  const needsReview = reviewReasons.length > 0;

  return {
    id: buildSetId(nameOriginal),
    nameOriginal,
    nameEnglish,
    setFamilyOriginal: nameParts.setFamilyOriginal,
    setFamilyEnglish,
    variantOriginal: nameParts.variantOriginal,
    variantEnglish,
    effectOriginal,
    effectEnglish,
    effectEnglishPartial,
    effectTiers,
    parsedStats: allStats,
    keywordOriginal,
    keywordEnglish,
    elementOriginal,
    elementEnglish,
    terminologySource,
    translationConfidence,
    needsReview,
    reviewReasons,
    systemVersion: SYSTEM_VERSION,
    availability: AVAILABILITY,
    legacyStatus: LEGACY_STATUS,
    notes
  };
}

function translateEffectPartial(text: string): string | null {
  if (!text) return null;
  let result = text;

  const knownTerms: Array<[RegExp, string]> = [
    [/暴擊率/g, "Crit Rate"],
    [/暴擊傷害/g, "Crit DMG"],
    [/弱點傷害/g, "Weakspot DMG"],
    [/槍械傷害/g, "Gun DMG"],
    [/武器傷害/g, "Weapon DMG"],
    [/異常傷害/g, "Status DMG"],
    [/元素傷害/g, "Elemental DMG"],
    [/近戰傷害/g, "Melee DMG"],
    [/傷害減免/g, "DMG Reduction"],
    [/傷害豁免/g, "DMG Immunity"],
    [/換彈效率/g, "Reload Efficiency"],
    [/換彈速度/g, "Reload Speed"],
    [/彈匣容量/g, "Magazine Capacity"],
    [/射擊速度/g, "Fire Rate"],
    [/移動速度/g, "Movement Speed"],
    [/採集速度/g, "Gather Speed"],
    [/跳躍高度/g, "Jump Height"],
    [/最大生命值/g, "Max HP"],
    [/生命值(?![率])/g, "HP"],
    [/護盾/g, "Shield"],
    [/耐力/g, "Stamina"],
    [/冷卻/g, "Cooldown"],
    [/持續時間/g, "Duration"],
    [/每秒/g, "per second"],
    [/層(?!數)/g, "stack(s)"],
    [/灼燒/g, "Burn"],
    [/冰霜漩渦/g, "Frost Vortex"],
    [/電湧/g, "Power Surge"],
    [/不穩定爆彈/g, "Unstable Bomber"],
    [/不穩定炸彈/g, "Unstable Bomber"],
    [/獵人標記/g, "Bullseye"],
    [/標記/g, "Mark"],
    [/重裝陣地/g, "Fortress Warfare"],
    [/快槍手/g, "Fast Gunner"],
    [/彈射/g, "Bounce"],
    [/碎彈/g, "Shrapnel"],
    [/熾能/g, "Blaze"],
    [/寒霜/g, "Frost"],
    [/電離/g, "Shock"],
    [/爆炸/g, "Blast"],
    [/受到/g, "incoming"],
    [/攻擊/g, "ATK"],
    [/防禦/g, "DEF"],
    [/命中/g, "on hit"],
    [/寒冷抗性/g, "Cold Resistance"],
    [/炎熱抗性/g, "Heat Resistance"],
    [/汙染抗性/g, "Pollution Resistance"],
    [/哨戒砲/g, "Auto-Turret"],
    [/負重上限/g, "Weight Limit"],
  ];

  let changed = false;
  knownTerms.forEach(([pattern, replacement]) => {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      changed = true;
    }
  });

  if (/秒/.test(result) && !/秒鐘/.test(result)) {
    result = result.replace(/(\d+(?:\.\d+)?)\s*秒/g, "$1s");
    changed = true;
  }

  return changed ? result : null;
}

function parseStatsFromText(text: string): ParsedStat[] {
  const stats: ParsedStat[] = [];
  const statPatterns = [
    { name: "Crit Rate", pattern: /(\d+(?:\.\d+)?)%?\s*Crit\s*Rate/ },
    { name: "Crit DMG", pattern: /(\d+(?:\.\d+)?)%?\s*Crit\s*DMG/ },
    { name: "Weakspot DMG", pattern: /(\d+(?:\.\d+)?)%?\s*Weakspot\s*DMG/ },
    { name: "Gun DMG", pattern: /(\d+(?:\.\d+)?)%?\s*Gun\s*DMG/ },
    { name: "Status DMG", pattern: /(\d+(?:\.\d+)?)%?\s*Status\s*DMG/ },
    { name: "Elemental DMG", pattern: /(\d+(?:\.\d+)?)%?\s*Elemental\s*DMG/ },
    { name: "DMG Reduction", pattern: /(\d+(?:\.\d+)?)%?\s*DMG\s*Reduction/ },
    { name: "Reload Efficiency", pattern: /(\d+(?:\.\d+)?)%?\s*Reload\s*Efficiency/ },
    { name: "Reload Speed", pattern: /(\d+(?:\.\d+)?)%?\s*Reload\s*Speed/ },
    { name: "Magazine Capacity", pattern: /(\d+(?:\.\d+)?)%?\s*Magazine\s*Capacity/ },
    { name: "Fire Rate", pattern: /(\d+(?:\.\d+)?)%?\s*Fire\s*Rate/ },
    { name: "Movement Speed", pattern: /(\d+(?:\.\d+)?)%?\s*Movement\s*Speed/ },
    { name: "Max HP", pattern: /(\d+(?:\.\d+)?)%?\s*Max\s*HP/ },
  ];
  statPatterns.forEach(({ name, pattern }) => {
    const match = text.match(pattern);
    if (match) {
      stats.push({
        statName: name,
        value: parseFloat(match[1]),
        unit: text.includes(match[1]) && text.indexOf("%") >= 0 ? "%" : null,
        sourceText: match[0]
      });
    }
  });
  return stats;
}

const armorSetNameMap: Record<string, string> = {
  "孤狼": "Lone Wolf",
  "黑石": "Blackstone",
  "堡壘": "Bastille",
  "叛客": "Renegade",
  "飆風": "Stormweaver",
  "拯救者": "Savior",
  "庇護者": "Shelterer",
  "末土危潮": "Treacherous Tides",
  "引力潮汐": "Gravity Tide",
  "暗骸共鳴": "Dark Resonance",
  "特勤": "Agent",
  "重裝": "Heavy Duty",
  "獵鷹": "Falcon",
  "雪豹": "Snow Leopard",
  "突襲": "Raid",
  "爆破": "Blast",
  "斥侯": "Scout",
  "被研究者": "Test Subject",
  "樸實": "Rustic",
  "雪地樸實": "Rustic (Tundra)",
};

const armorSetVariantMap: Record<string, Record<string, string>> = {
  "黑石": {
    "炙熱": "Blackstone (Heat)",
    "嚴寒": "Blackstone (Cold)",
  },
};

const knownNamedMechanics: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /孤影/g, name: "Lone Wolf" },
  { pattern: /溫感/g, name: "Thermal Sense" },
  { pattern: /溫和/g, name: "Temperate" },
  { pattern: /熱情/g, name: "Ardor" },
  { pattern: /冷酷/g, name: "Stern" },
  { pattern: /堡壘狀態/g, name: "Fortress State" },
  { pattern: /射手專注/g, name: "Archer's Focus" },
  { pattern: /蓄能裝甲/g, name: "Powered Armor" },
  { pattern: /護盾/g, name: "Shield" },
  { pattern: /異能(?!傷害)/g, name: "Deviant Energy" },
  { pattern: /裝甲/g, name: "Armor (stack)" },
];




