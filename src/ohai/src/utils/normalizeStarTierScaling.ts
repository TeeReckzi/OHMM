import { lookupSlotTranslation, lookupTranslation, translatePartialEffectText } from "./translationDictionary";

export type StarTierBlockKind =
  | "armor_star_up_materials"
  | "weapon_star_up_materials"
  | "armor_quality_scaling"
  | "max_stat_reference"
  | "unknown";

export type StarTierRowInput = {
  blockType: StarTierBlockKind;
  blockTitleOriginal: string | null;
  rowLabelOriginal: string | null;
  rowValues: Array<{ column: number; headerOriginal: string | null; value: unknown }>;
  headersOriginal: string[];
  originalRowNumber: number;
};

export type StarTierNormalizedRow = {
  id: string;
  category: "weapon" | "armor" | "blueprint" | "tier" | "unknown";
  blockType: StarTierBlockKind;
  armorSlot: "mask" | "helmet" | "chest" | "gloves" | "pants" | "shoes" | "unknown" | null;
  starLevelOriginal: string | null;
  starLevel: number | null;
  tierOriginal: string | null;
  tier: string | null;
  furQualityOriginal: string | null;
  furQuality: string | null;
  itemTypeOriginal: string | null;
  itemTypeEnglish: string | null;
  itemSlotOriginal: string | null;
  itemSlotEnglish: string | null;
  statOriginal: string | null;
  statEnglish: string | null;
  valueOriginal: string | number | null;
  valueParsed: number | null;
  valueUnit: string | null;
  scalingType: "flat" | "percent" | "multiplier" | "cost" | "unknown";
  notes: string[];
};

const armorSlotNames: Record<string, string> = {
  "面具": "Mask",
  "頭盔": "Helmet",
  "衣服": "Top",
  "手套": "Gloves",
  "褲子": "Bottoms",
  "鞋子": "Shoes"
};

const armorSlotKinds: Record<string, StarTierNormalizedRow["armorSlot"]> = {
  "面具": "mask",
  "頭盔": "helmet",
  "衣服": "chest",
  "手套": "gloves",
  "褲子": "pants",
  "鞋子": "shoes"
};

const furQualityMap: Record<string, string> = {
  "完美": "perfect",
  "卓越": "excellent",
  "精良": "rare",
  "一般": "common"
};

const tierMap: Record<string, string> = {
  "1 → 2": "1 to 2",
  "2 → 3": "2 to 3",
  "3 → 4": "3 to 4",
  "4 → 5": "4 to 5",
  "5 → 6": "5 to 6"
};

const rowReferenceMap: Record<string, string> = {
  "全T5六星金品質 + 金品質毛皮": "All T5 6-Star Gold Quality + Gold Fur",
  "全T5六星金品質 + 紫品質毛皮": "All T5 6-Star Gold Quality + Purple Fur",
  "T5頭盔": "T5 Helmet Reference",
  "T5面具": "T5 Mask Reference",
  "T5褲子": "T5 Pants Reference",
  "T5手套": "T5 Gloves Reference",
  "T5衣服": "T5 Top Reference",
  "T5鞋子": "T5 Shoes Reference",
  "合計": "Total"
};

export function normalizeStarTierRow(input: StarTierRowInput): StarTierNormalizedRow {
  const notes: string[] = [];
  const rowLabel = normalizeString(input.rowLabelOriginal);
  const itemTypeOriginal = normalizeString(input.blockTitleOriginal ?? input.rowLabelOriginal);
  const itemTypeEnglish = translateItemType(input.blockTitleOriginal, input.rowLabelOriginal, input.blockType);

  const category = input.blockType === "weapon_star_up_materials"
    ? "tier"
    : input.blockType === "armor_star_up_materials"
      ? "tier"
      : "armor";

  const armorSlot = translateArmorSlot(input.blockTitleOriginal);
  const tierOriginal = rowLabel && furQualityMap[rowLabel] ? rowLabel : null;
  const tier = tierOriginal ? furQualityMap[tierOriginal] : null;

  const starLevelOriginal = input.blockType === "armor_quality_scaling"
    ? "6★ perfect / 5★ excellent"
    : null;
  const starLevel = null;

  const furQualityOriginal = tierOriginal;
  const furQuality = tier;

  const statOriginal = inferStatOriginal(input);
  const statEnglish = inferStatEnglish(statOriginal);

  const valueSummary = summarizeValues(input.rowValues.map((entry) => entry.value));
  const parsed = parseSingleValue(valueSummary);

  if (input.blockType === "armor_quality_scaling") {
    notes.push("Mixed 6-star perfect and 5-star excellent scaling preserved in original row data.");
  }
  if (input.blockType === "armor_star_up_materials" || input.blockType === "weapon_star_up_materials") {
    notes.push("Upgrade transition costs preserved across original columns.");
  }
  if (input.blockType === "max_stat_reference") {
    notes.push("Reference table contains mixed sub-sections; preserved conservatively.");
  }

  return {
    id: makeRowId(input.blockType, input.originalRowNumber, rowLabel),
    category,
    blockType: input.blockType,
    armorSlot,
    starLevelOriginal,
    starLevel,
    tierOriginal,
    tier,
    furQualityOriginal,
    furQuality,
    itemTypeOriginal,
    itemTypeEnglish,
    itemSlotOriginal: itemTypeOriginal,
    itemSlotEnglish: itemTypeEnglish,
    statOriginal,
    statEnglish,
    valueOriginal: valueSummary,
    valueParsed: parsed.valueParsed,
    valueUnit: parsed.valueUnit,
    scalingType: input.blockType === "armor_star_up_materials" || input.blockType === "weapon_star_up_materials"
      ? "cost"
      : "flat",
    notes
  };
}

function makeRowId(blockType: string, rowNumber: number, rowLabel: string | null): string {
  const label = (rowLabel ?? "row").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
  return `star-tier-${blockType}-${rowNumber}-${label || "row"}`;
}

function translateArmorSlot(value: string | null): StarTierNormalizedRow["armorSlot"] {
  if (!value) return null;
  const normalized = value.replace(/^T5/, "");
  const hit = lookupSlotTranslation(normalized);
  if (!hit.english) return "unknown";
  switch (hit.english) {
    case "Helmet": return "helmet";
    case "Mask": return "mask";
    case "Top": return "chest";
    case "Gloves": return "gloves";
    case "Bottoms": return "pants";
    case "Shoes": return "shoes";
    default: return "unknown";
  }
}

function translateItemType(blockTitle: string | null, rowLabel: string | null, blockType: StarTierBlockKind): string | null {
  if (blockType === "armor_quality_scaling") {
    if (blockTitle) {
      const stripped = blockTitle.replace(/^T5/, "");
      return lookupSlotTranslation(stripped).english ?? rowReferenceMap[blockTitle] ?? rowReferenceMap[stripped] ?? blockTitle;
    }
    return null;
  }
  if (blockType === "armor_star_up_materials") return "Armor Star-Up Material";
  if (blockType === "weapon_star_up_materials") return "Weapon Star-Up Material";
  if (blockType === "max_stat_reference" && rowLabel) return lookupSlotTranslation(rowLabel).english ?? rowReferenceMap[rowLabel] ?? rowLabel;
  return null;
}

function inferStatOriginal(input: StarTierRowInput): string | null {
  if (input.blockType === "armor_star_up_materials" || input.blockType === "weapon_star_up_materials") return "經驗";
  if (input.blockType === "armor_quality_scaling") {
    const hasNumericValue = input.rowValues.some((entry) => typeof entry.value === "number");
    return hasNumericValue ? "生命值 / 超感強度" : null;
  }
  if (input.blockType === "max_stat_reference") return "生命值 / 超感強度 / 汙染抗性";
  return null;
}

function inferStatEnglish(statOriginal: string | null): string | null {
  if (!statOriginal) return null;
  if (statOriginal === "經驗") return "Experience";
  if (statOriginal === "生命值 / 超感強度") return "HP / Super Anomaly Strength";
  if (statOriginal === "生命值 / 超感強度 / 汙染抗性") return "HP / Super Anomaly Strength / Pollution Resist";
  if (statOriginal === "T5汙染抗性") return "T5 Pollution Resist";
  const translated = translatePartialEffectText(statOriginal).text;
  return translated ?? lookupTranslation("keywords", statOriginal).english ?? null;
}

function summarizeValues(values: unknown[]): string | null {
  const parts = values
    .map((value) => normalizeString(value))
    .filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" | ") : null;
}

function parseSingleValue(summary: string | null): { valueParsed: number | null; valueUnit: string | null } {
  if (!summary) return { valueParsed: null, valueUnit: null };
  if (/\|/.test(summary) || /\//.test(summary)) return { valueParsed: null, valueUnit: null };
  const percent = summary.match(/([+-]?\d+(?:\.\d+)?)%/);
  if (percent) return { valueParsed: Number(percent[1]), valueUnit: "%" };
  const flat = summary.match(/([+-]?\d+(?:\.\d+)?)/);
  if (flat) return { valueParsed: Number(flat[1]), valueUnit: null };
  return { valueParsed: null, valueUnit: null };
}

function normalizeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}
