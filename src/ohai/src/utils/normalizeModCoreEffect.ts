import crypto from "node:crypto";
import { lookupTranslation, translatePartialEffectText, type TranslationConfidence } from "./translationDictionary";

export type OverlayCandidate = {
  candidateEnglishName: string | null;
  candidateEnglishEffect: string | null;
  matchConfidence: "high" | "medium" | "low" | "none";
  translationConfidence: "approved" | "high" | "medium" | "low" | "unknown";
  needsReview: boolean;
  reason: string | null;
};

export type NormalizedModCoreContext = {
  currentSection: "武器" | "防具" | null;
  overlayCandidate: OverlayCandidate;
};

export type NormalizedModCoreEffectRow = {
  id: string;
  nameOriginal: string | null;
  nameEnglish: string | null;
  slotOriginal: string | null;
  slotEnglish: string | null;
  modTypeOriginal: string | null;
  modTypeEnglish: string | null;
  rarityOriginal: string | null;
  rarityEnglish: string | null;
  rarityTier: "common" | "fine" | "rare" | "epic" | "legendary" | null;
  rarityColorEnglish: string | null;
  raritySourceKind: "rarity_name" | "color_label" | "unknown";
  keywordOriginal: string | null;
  keywordEnglish: string | null;
  effectOriginal: string | null;
  effectEnglish: string | null;
  effectEnglishPartial: string | null;
  sourceOriginal: string | null;
  sourceEnglish: string | null;
  systemVersion: "legacy_pre_overhaul" | "current_post_overhaul" | "hybrid_player_inventory" | "unknown";
  availability: "currently_farmable" | "legacy_retained_only" | "deprecated_unavailable" | "event_limited" | "unknown";
  legacyStatus: "not_legacy" | "legacy" | "mixed" | "unknown";
  introducedPatch: string | null;
  retiredPatch: string | null;
  canDropNow: boolean | null;
  canExistInPlayerInventory: boolean;
  requiresLegacyOwnership: boolean;
  translationConfidence: TranslationConfidence;
  notes: string[];
};

export function normalizeModCoreEffectRow(
  row: Record<string, unknown>,
  originalRowNumber: number,
  context: NormalizedModCoreContext
): { overlay: { used: boolean; candidateEnglishName: string | null; candidateEnglishEffect: string | null; confidence: "high" | "medium" | "low" | "none"; matchConfidence: "high" | "medium" | "low" | "none"; translationConfidence: "approved" | "high" | "medium" | "low" | "unknown"; needsReview: boolean; reason: string | null; }; normalized: NormalizedModCoreEffectRow } {
  const nameOriginal = asString(row["模組名稱"]);
  const effectOriginal = asString(row["核心效果"]);
  const firstColumn = asString(row["流派/部位"]);
  const rarityOriginal = null;
  const sourceOriginal = null;

  const overlayUsedForName = Boolean(context.overlayCandidate.candidateEnglishName && context.overlayCandidate.matchConfidence !== "none");
  const overlayUsedForEffect = Boolean(context.overlayCandidate.candidateEnglishEffect && context.overlayCandidate.matchConfidence === "high");

  const nameEnglish = overlayUsedForName ? context.overlayCandidate.candidateEnglishName : null;
  const slotOriginal = context.currentSection === "武器" ? "武器" : firstColumn;
  const slotEnglish = translateSlot(slotOriginal);
  const keywordOriginal = context.currentSection === "武器" ? firstColumn : null;
  const keywordTranslation = lookupTranslation("keywords", keywordOriginal);
  const effectPartial = overlayUsedForEffect ? context.overlayCandidate.candidateEnglishEffect : translatePartialEffectText(effectOriginal).text;
  const overlayUsed = overlayUsedForName || overlayUsedForEffect;

  const notes: string[] = [];
  if (!nameEnglish && context.overlayCandidate.candidateEnglishName) {
    notes.push("Overlay candidate for name exists but was not promoted automatically.");
  }
  if (effectOriginal && !effectPartial) {
    notes.push("Full effect translation pending manual verification.");
  }
  if (context.currentSection === null) {
    notes.push("Section context missing; slot and keyword mapping require review.");
  }

  const normalized: NormalizedModCoreEffectRow = {
    id: buildId(nameEnglish, nameOriginal, slotOriginal, keywordOriginal, originalRowNumber),
    nameOriginal,
    nameEnglish,
    slotOriginal,
    slotEnglish,
    modTypeOriginal: "核心效果",
    modTypeEnglish: "Core Effect",
    rarityOriginal,
    rarityEnglish: null,
    rarityTier: null,
    rarityColorEnglish: null,
    raritySourceKind: "unknown",
    keywordOriginal,
    keywordEnglish: keywordTranslation.english,
    effectOriginal,
    effectEnglish: null,
    effectEnglishPartial: effectPartial,
    sourceOriginal,
    sourceEnglish: null,
    systemVersion: "current_post_overhaul",
    availability: "currently_farmable",
    legacyStatus: "not_legacy",
    introducedPatch: null,
    retiredPatch: null,
    canDropNow: true,
    canExistInPlayerInventory: true,
    requiresLegacyOwnership: false,
    translationConfidence: determineConfidence(nameEnglish, slotEnglish, keywordTranslation.english, effectPartial),
    notes
  };

  return {
    overlay: {
      used: overlayUsed,
      candidateEnglishName: context.overlayCandidate.candidateEnglishName,
      candidateEnglishEffect: context.overlayCandidate.candidateEnglishEffect,
      confidence: context.overlayCandidate.matchConfidence,
      matchConfidence: context.overlayCandidate.matchConfidence,
      translationConfidence: context.overlayCandidate.translationConfidence,
      needsReview: context.overlayCandidate.needsReview,
      reason: context.overlayCandidate.reason
    },
    normalized
  };
}

function determineConfidence(nameEnglish: string | null, slotEnglish: string | null, keywordEnglish: string | null, effectEnglishPartial: string | null): TranslationConfidence {
  if (nameEnglish && slotEnglish && keywordEnglish) return "high";
  if ((slotEnglish && keywordEnglish) || (nameEnglish && slotEnglish)) return "medium";
  if (nameEnglish || slotEnglish || keywordEnglish || effectEnglishPartial) return "low";
  return "unknown";
}

function translateSlot(value: string | null): string | null {
  if (!value) return null;
  const mapping: Record<string, string> = {
    "武器": "Weapon",
    "遠程武器": "Ranged Weapon",
    "近戰武器": "Melee Weapon",
    "頭盔": "Helmet",
    "面具": "Mask",
    "面罩": "Mask",
    "上衣": "Top",
    "上半身": "Top",
    "手套": "Gloves",
    "褲子": "Bottoms",
    "長褲": "Bottoms",
    "下半身": "Bottoms",
    "鞋子": "Shoes",
    "靴子": "Shoes"
  };
  return mapping[value] ?? null;
}

function buildId(nameEnglish: string | null, nameOriginal: string | null, slotOriginal: string | null, keywordOriginal: string | null, originalRowNumber: number): string {
  if (nameEnglish) return slugify(nameEnglish);
  if (nameOriginal) return `mod_core_${shortHash([nameOriginal, slotOriginal, keywordOriginal].filter(Boolean).join("|"))}`;
  return `mod_core_row_${originalRowNumber}`;
}

function shortHash(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);
}

function slugify(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "mod_core";
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}
