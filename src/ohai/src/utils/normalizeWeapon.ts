import crypto from "node:crypto";
import { lookupTranslation, translatePartialEffectText, type TranslationConfidence } from "./translationDictionary";
import { matchWeaponToEnglish } from "./englishNameMapper";

type KeyValue = { key: string; value: unknown };

export type NormalizedWeaponRow = {
  id: string;
  nameOriginal: string | null;
  nameEnglish: string | null;
  weaponTypeOriginal: string | null;
  weaponTypeEnglish: string | null;
  keywordOriginal: string | null;
  keywordEnglish: string | null;
  elementOriginal: string | null;
  elementEnglish: string | null;
  rarityOriginal: string | null;
  rarityEnglish: string | null;
  specialEffectOriginal: string | null;
  specialEffectEnglish: string | null;
  specialEffectEnglishPartial: string | null;
  translationConfidence: TranslationConfidence;
  notes: string[];
};

export function normalizeWeaponRow(row: Record<string, unknown>, originalRowNumber: number): NormalizedWeaponRow {
  const entries = Object.entries(row).map(([key, value]) => ({ key, value }));

  const nameEntry = findField(entries, ["武器名稱", "名稱", "裝備名稱", "道具名稱", "name", "weapon"]);
  const weaponTypeEntry = findField(entries, ["武器類型", "武器種類", "類型", "種類", "分類", "type"]);
  const keywordEntry = findField(entries, ["關鍵詞", "關鍵字", "標籤", "流派", "特性", "keyword"]);
  const elementEntry = findField(entries, ["傷害屬性", "元素", "屬性", "element"]);
  const rarityEntry = findField(entries, ["稀有度", "品質", "顏色", "rarity"]);
  const effectEntry = findField(entries, ["武器效果", "專屬效果", "效果", "特效", "說明", "描述", "介紹", "特性", "effect"]);

  const nameOriginal = asString(nameEntry?.value);
  const weaponTypeOriginal = asString(weaponTypeEntry?.value);
  const keywordOriginal = asString(keywordEntry?.value);
  const elementOriginal = asString(elementEntry?.value);
  const rarityOriginal = asString(rarityEntry?.value);
  const specialEffectOriginal = asString(effectEntry?.value);

  const nameTranslation = lookupTranslation("names", nameOriginal);
  const weaponTypeTranslation = lookupTranslation("weaponTypes", weaponTypeOriginal);
  const keywordTranslation = lookupTranslation("keywords", keywordOriginal);
  const elementTranslation = lookupTranslation("elements", elementOriginal);
  const rarityTranslation = lookupTranslation("rarities", rarityOriginal);
  const partialEffectTranslation = translatePartialEffectText(specialEffectOriginal);

  const notes = [
    ...nameTranslation.notes,
    ...weaponTypeTranslation.notes,
    ...keywordTranslation.notes,
    ...elementTranslation.notes,
    ...rarityTranslation.notes,
    ...partialEffectTranslation.notes
  ];

  const nameEnglish = getNameEnglish(nameOriginal, nameTranslation.english);
  const translationConfidence = determineConfidence({
    nameEnglish,
    weaponTypeEnglish: weaponTypeTranslation.english,
    keywordEnglish: keywordTranslation.english,
    elementEnglish: elementTranslation.english,
    rarityEnglish: rarityTranslation.english,
    hasPartialEffect: Boolean(partialEffectTranslation.text)
  });

  return {
    id: buildBaseId(nameEnglish, nameOriginal, weaponTypeOriginal, keywordOriginal, originalRowNumber),
    nameOriginal,
    nameEnglish,
    weaponTypeOriginal,
    weaponTypeEnglish: weaponTypeTranslation.english,
    keywordOriginal,
    keywordEnglish: keywordTranslation.english,
    elementOriginal,
    elementEnglish: elementTranslation.english,
    rarityOriginal,
    rarityEnglish: rarityTranslation.english,
    specialEffectOriginal,
    specialEffectEnglish: null,
    specialEffectEnglishPartial: partialEffectTranslation.text,
    translationConfidence,
    notes: nameOriginal
      ? (!nameEnglish ? [...notes, "English weapon name needs verification."] : notes)
      : [...notes, "ID generated from row number because no reliable weapon name was detected."]
  };
}

function getNameEnglish(nameOriginal: string | null, translatedName: string | null): string | null {
  if (translatedName) return translatedName;
  if (nameOriginal && /^[A-Za-z0-9 .,'"\-()]+$/.test(nameOriginal)) {
    return nameOriginal.trim();
  }
  const referenceMatch = matchWeaponToEnglish(nameOriginal);
  if (referenceMatch) return referenceMatch;
  return null;
}

function determineConfidence(input: {
  nameEnglish: string | null;
  weaponTypeEnglish: string | null;
  keywordEnglish: string | null;
  elementEnglish: string | null;
  rarityEnglish: string | null;
  hasPartialEffect: boolean;
}): TranslationConfidence {
  const hasName = Boolean(input.nameEnglish);
  const hasCore = Boolean(input.weaponTypeEnglish && input.keywordEnglish);
  const hasAny = hasName || Boolean(input.weaponTypeEnglish) || Boolean(input.keywordEnglish) || Boolean(input.elementEnglish) || Boolean(input.rarityEnglish) || input.hasPartialEffect;

  if (hasName && hasCore) return "high";
  if (hasCore) return "medium";
  if (hasAny) return "low";
  return "unknown";
}

function buildBaseId(
  nameEnglish: string | null,
  nameOriginal: string | null,
  weaponTypeOriginal: string | null,
  keywordOriginal: string | null,
  originalRowNumber: number
): string {
  if (nameEnglish) {
    return slugify(nameEnglish);
  }

  if (nameOriginal) {
    const hash = shortHash([nameOriginal, weaponTypeOriginal, keywordOriginal].filter(Boolean).join("|"));
    return `weapon_${hash}`;
  }

  return `weapon_row_${originalRowNumber}`;
}

export function makeUniqueWeaponId(baseId: string, originalRowNumber: number, occurrenceCount: number): string {
  if (occurrenceCount <= 1) return baseId;
  return `${baseId}_row_${originalRowNumber}`;
}

function shortHash(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "weapon";
}

function findField(entries: KeyValue[], aliases: string[]): KeyValue | undefined {
  const loweredAliases = aliases.map((alias) => alias.toLowerCase());

  const exact = entries.find(({ key }) => loweredAliases.includes(key.toLowerCase().trim()));
  if (exact) return exact;

  const partial = entries.find(({ key }) => {
    const lowered = key.toLowerCase();
    return loweredAliases.some((alias) => lowered.includes(alias));
  });
  if (partial) return partial;

  return undefined;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}
