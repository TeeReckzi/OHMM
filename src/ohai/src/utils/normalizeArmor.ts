import crypto from "node:crypto";
import { lookupSlotTranslation, lookupTranslation, translatePartialEffectText, type TranslationConfidence } from "./translationDictionary";
import { matchArmorToEnglish } from "./englishNameMapper";
import { matchArmorByPattern } from "./armorPatternMatcher";

type KeyValue = { key: string; value: unknown };

export type NormalizedArmorRow = {
  id: string;
  nameOriginal: string | null;
  nameEnglish: string | null;
  slotOriginal: string | null;
  slotEnglish: string | null;
  armorTypeOriginal: string | null;
  armorTypeEnglish: string | null;
  rarityOriginal: string | null;
  rarityEnglish: string | null;
  setOriginal: string | null;
  setEnglish: string | null;
  isKeyGear: boolean;
  keywordOriginal: string | null;
  keywordEnglish: string | null;
  elementOriginal: string | null;
  elementEnglish: string | null;
  specialEffectOriginal: string | null;
  specialEffectEnglish: string | null;
  specialEffectEnglishPartial: string | null;
  translationConfidence: TranslationConfidence;
  notes: string[];
};

export function normalizeArmorRow(row: Record<string, unknown>, originalRowNumber: number): NormalizedArmorRow {
  const entries = Object.entries(row).map(([key, value]) => ({ key, value }));
  const nameEntry = findField(entries, ["名稱", "裝備名稱", "道具名稱", "name"]);
  const slotEntry = findField(entries, ["部位", "槽位", "slot"]);
  const typeEntry = findField(entries, ["類型", "種類", "armor type", "type"]);
  const keywordEntry = findField(entries, ["關鍵詞", "關鍵字", "標籤", "流派", "特性", "keyword"]);
  const elementEntry = findField(entries, ["元素", "屬性", "傷害屬性", "element"]);
  const rarityEntry = findField(entries, ["稀有度", "品質", "顏色", "rarity"]);
  const effectEntry = findField(entries, ["關鍵效果", "武器效果", "專屬效果", "效果", "特效", "說明", "描述", "介紹", "特性", "effect"]);
  const setEntry = findField(entries, ["套裝", "set"]);

  const nameOriginal = asString(nameEntry?.value);
  const slotOriginal = asString(slotEntry?.value);
  const armorTypeOriginal = asString(typeEntry?.value);
  const keywordOriginal = asString(keywordEntry?.value);
  const elementOriginal = asString(elementEntry?.value);
  const rarityOriginal = asString(rarityEntry?.value);
  const specialEffectOriginal = asString(effectEntry?.value);
  const setOriginal = asString(setEntry?.value);

  const nameEnglish = lookupArmorNameEnglish(nameOriginal);
  const slotTranslation = lookupSlotTranslation(slotOriginal);
  const armorTypeTranslation = translateArmorType(armorTypeOriginal);
  const keywordTranslation = lookupTranslation("keywords", keywordOriginal);
  const elementTranslation = lookupTranslation("elements", elementOriginal);
  const rarityTranslation = lookupTranslation("rarities", rarityOriginal);
  const partialEffectTranslation = translatePartialEffectText(specialEffectOriginal);
  const isKeyGear = determineKeyGear({ armorTypeOriginal, nameOriginal, keywordOriginal, specialEffectOriginal, nameEnglish });

  const notes = [
    ...slotTranslation.notes,
    ...armorTypeTranslation.notes,
    ...keywordTranslation.notes,
    ...elementTranslation.notes,
    ...rarityTranslation.notes,
    ...partialEffectTranslation.notes
  ];

  if (isKeyGear) {
    notes.push("Row identified as key gear.");
  }

  const translationConfidence = determineConfidence({
    nameEnglish,
    slotEnglish: slotTranslation.english,
    armorTypeEnglish: armorTypeTranslation.english,
    keywordEnglish: keywordTranslation.english,
    elementEnglish: elementTranslation.english,
    rarityEnglish: rarityTranslation.english,
    hasPartialEffect: Boolean(partialEffectTranslation.text)
  });

  return {
    id: buildBaseId(nameEnglish, nameOriginal, slotOriginal, keywordOriginal, originalRowNumber),
    nameOriginal,
    nameEnglish,
    slotOriginal,
    slotEnglish: slotTranslation.english,
    armorTypeOriginal,
    armorTypeEnglish: armorTypeTranslation.english,
    rarityOriginal,
    rarityEnglish: rarityTranslation.english,
    setOriginal,
    setEnglish: null,
    isKeyGear,
    keywordOriginal,
    keywordEnglish: keywordTranslation.english,
    elementOriginal,
    elementEnglish: elementTranslation.english,
    specialEffectOriginal,
    specialEffectEnglish: null,
    specialEffectEnglishPartial: partialEffectTranslation.text,
    translationConfidence,
    notes: nameOriginal && !nameEnglish ? [...notes, "English armor name needs verification."] : notes
  };
}

function lookupArmorNameEnglish(nameOriginal: string | null): string | null {
  if (!nameOriginal) return null;
  const dictionary: Record<string, string> = {
    "磁矩上衣": "Magnetic Moment Top",
    "滑步長褲": "Glide Pants"
  };
  if (dictionary[nameOriginal]) return dictionary[nameOriginal];
  const referenceMatch = matchArmorToEnglish(nameOriginal);
  if (referenceMatch) return referenceMatch;
  const patternMatch = matchArmorByPattern(nameOriginal);
  if (patternMatch) return patternMatch;
  return null;
}

function translateArmorType(armorTypeOriginal: string | null): { english: string | null; confidence: TranslationConfidence; notes: string[] } {
  if (!armorTypeOriginal) return { english: null, confidence: "unknown", notes: [] };
  if (armorTypeOriginal.includes("關鍵防具")) {
    return { english: "Key Gear", confidence: "high", notes: [] };
  }
  if (armorTypeOriginal.includes("套裝")) {
    return { english: "Set", confidence: "high", notes: [] };
  }
  return { english: null, confidence: "unknown", notes: [] };
}

function determineKeyGear(input: { armorTypeOriginal: string | null; nameOriginal: string | null; keywordOriginal: string | null; specialEffectOriginal: string | null; nameEnglish: string | null; }): boolean {
  if (input.armorTypeOriginal && input.armorTypeOriginal.includes("關鍵")) return true;
  if (input.nameOriginal && ["磁矩上衣", "滑步長褲"].includes(input.nameOriginal)) return true;
  const haystack = [input.keywordOriginal, input.specialEffectOriginal, input.nameEnglish].filter(Boolean).join(" ");
  return /關鍵裝備|關鍵防具|金裝|專屬效果|特效/.test(haystack);
}

function determineConfidence(input: {
  nameEnglish: string | null;
  slotEnglish: string | null;
  armorTypeEnglish: string | null;
  keywordEnglish: string | null;
  elementEnglish: string | null;
  rarityEnglish: string | null;
  hasPartialEffect: boolean;
}): TranslationConfidence {
  const hasName = Boolean(input.nameEnglish);
  const hasCore = Boolean(input.slotEnglish && input.armorTypeEnglish && input.keywordEnglish);
  const hasAny = hasName || Boolean(input.slotEnglish) || Boolean(input.armorTypeEnglish) || Boolean(input.keywordEnglish) || Boolean(input.elementEnglish) || Boolean(input.rarityEnglish) || input.hasPartialEffect;

  if (hasName && hasCore) return "high";
  if (hasCore) return "medium";
  if (hasAny) return "low";
  return "unknown";
}

function buildBaseId(nameEnglish: string | null, nameOriginal: string | null, slotOriginal: string | null, keywordOriginal: string | null, originalRowNumber: number): string {
  if (nameEnglish) return slugify(nameEnglish);
  if (nameOriginal) return `armor_${shortHash([nameOriginal, slotOriginal, keywordOriginal].filter(Boolean).join("|"))}`;
  return `armor_row_${originalRowNumber}`;
}

function shortHash(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);
}

function slugify(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "armor";
}

function findField(entries: KeyValue[], aliases: string[]): KeyValue | undefined {
  const loweredAliases = aliases.map((alias) => alias.toLowerCase());
  const exact = entries.find(({ key }) => loweredAliases.includes(key.toLowerCase().trim()));
  if (exact) return exact;
  return entries.find(({ key }) => loweredAliases.some((alias) => key.toLowerCase().includes(alias)));
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}
