import crypto from "node:crypto";
import type { NormalizedSuffixData, OverlaySuffixData, ParsedValue, terminologySourceSchema } from "../schemas/modSuffixEffectSchema";
import { lookupTranslation, translatePartialEffectText, slotTranslations } from "./translationDictionary";
import { lookupApprovedModTerm } from "./modTerminology";
import type { TranslationConfidence } from "./translationDictionary";

export type SuffixBlockContext = {
  blockType: "general" | "keyword" | "legacy" | "unknown";
  groupName: string | null;
};

export function buildEmptyOverlay(): OverlaySuffixData {
  return {
    used: false,
    candidateEnglishName: null,
    candidateEnglishEffect: null,
    matchConfidence: "none",
    translationConfidence: "unknown",
    needsReview: false,
    reason: null
  };
}

export function normalizeSuffixEffectCell(
  suffixOriginal: string,
  effectRichText: string,
  blockContext: SuffixBlockContext,
  columnIndex: number,
  rowIndex: number
): { normalized: NormalizedSuffixData; overlay: OverlaySuffixData } {
  const notes: string[] = [];
  const parsed = parseEffectRichText(effectRichText);
  const effectOriginal = parsed.effectName || null;
  const valueOriginal = parsed.valueText || null;
  const parsedValues = parsed.parsedValues;

  const suffixCategory = classifySuffixCategory(suffixOriginal, blockContext);
  const termType = classifyTermType(suffixOriginal, blockContext);

  const suffixEnglish = lookupSuffixEnglish(suffixOriginal, blockContext, termType, notes);
  const statOriginal = detectStatOriginal(effectOriginal, blockContext, suffixOriginal);
  const keywordOriginal = detectKeywordOriginal(effectOriginal, blockContext, suffixOriginal);

  const statEnglish = statOriginal ? lookupStatEnglish(statOriginal, notes) : null;
  const keywordEnglish = keywordOriginal ? lookupKeywordEnglish(keywordOriginal, notes) : null;
  const effectEnglish = null;
  const effectEnglishPartial = effectOriginal
    ? translatePartialEffectText(effectOriginal).text
    : null;

  if (effectOriginal && !effectEnglishPartial) {
    notes.push("Full suffix effect translation pending manual verification.");
  }

  const slotEnglish = null;
  const rarityEnglish = null;

  const terminologySource = determineTerminologySource(suffixEnglish, statEnglish, keywordEnglish);
  const translationConfidence = determineTranslationConfidence(suffixEnglish, statEnglish, keywordEnglish, effectEnglishPartial);
  const suffixResolutionBlocking = !suffixEnglish;
  const statResolutionBlocking = !statEnglish && !!statOriginal;
  const keywordResolutionBlocking = !keywordEnglish && !!keywordOriginal;
  const reviewReasons = classifyReviewReasons(suffixOriginal, suffixEnglish, statOriginal, statEnglish, keywordOriginal, keywordEnglish, effectOriginal, effectEnglish, parsedValues, blockContext, notes);
  const needsReview = suffixResolutionBlocking || statResolutionBlocking || keywordResolutionBlocking || reviewReasons.length > 0;

  if (valueOriginal && parsedValues.length === 0) {
    notes.push("Value parsing inconclusive; raw text preserved in valueOriginal.");
  }

  return {
    overlay: buildEmptyOverlay(),
    normalized: {
      id: buildSuffixId(suffixEnglish, suffixOriginal, statOriginal, keywordOriginal, columnIndex, rowIndex),
      reviewReasons,
      suffixOriginal,
      suffixEnglish,
      suffixCategoryOriginal: blockContext.groupName,
      suffixCategoryEnglish: suffixCategory,
      termType,
      statOriginal,
      statEnglish,
      keywordOriginal,
      keywordEnglish,
      effectOriginal,
      effectEnglish,
      effectEnglishPartial,
      valueOriginal,
      valueParsed: parsedValues.length > 0 ? parsedValues : null,
      valueUnit: parsedValues.length > 0 ? parsedValues[0].unit : null,
      slotOriginal: null,
      slotEnglish,
      rarityOriginal: null,
      rarityEnglish,
      rarityTier: null,
      systemVersion: "current_post_overhaul",
      availability: "currently_farmable",
      legacyStatus: "not_legacy",
      introducedPatch: null,
      retiredPatch: null,
      canDropNow: true,
      canExistInPlayerInventory: true,
      requiresLegacyOwnership: false,
      terminologySource,
      translationConfidence,
      needsReview,
      notes
    }
  };
}

function parseEffectRichText(text: string): {
  effectName: string | null;
  valueText: string | null;
  parsedValues: ParsedValue[];
} {
  if (!text) return { effectName: null, valueText: null, parsedValues: [] };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { effectName: null, valueText: null, parsedValues: [] };

  const effectName = lines[0] || null;
  const valueText = lines.length > 1 ? lines.slice(1).join(" | ") : null;

  const parsedValues: ParsedValue[] = [];

  if (valueText) {
    const segments = valueText.split("|").map((s) => s.trim()).filter(Boolean);

    if (segments.length > 0) {
      const tierValues: number[] = [];
      for (const seg of segments) {
        const num = parseConservativeNumber(seg);
        if (num !== null) tierValues.push(num);
      }

      if (tierValues.length > 0) {
        const isPercent = valueText.includes("%") || (effectName !== null && effectName.includes("%"));
        const isDuration = effectName !== null && /持續|duration|秒|seconds|cooldown|冷卻/i.test(effectName);
        const isStack = effectName !== null && /層|stack/i.test(effectName);

        let valueType: ParsedValue["valueType"] = "unknown";
        if (isPercent) valueType = "percentage";
        else if (isDuration) valueType = "duration_seconds";
        else if (isStack) valueType = "stack_count";
        else if (tierValues.some((v) => v >= 100)) valueType = "flat_number";
        else valueType = "flat_number";

        for (const tv of tierValues) {
          parsedValues.push({
            value: tv,
            unit: isPercent ? "%" : null,
            tierValues: tierValues.length > 1 ? tierValues : null,
            valueType,
            sourceText: valueText
          });
        }
      }
    }

    const complexMatch = valueText.match(/__/);
    if (complexMatch && parsedValues.length === 0) {
      const extractedNumbers = valueText.match(/[\d.]+/g);
      if (extractedNumbers) {
        for (const numStr of extractedNumbers) {
          const num = parseFloat(numStr);
          if (!isNaN(num)) {
            parsedValues.push({
              value: num,
              unit: null,
              tierValues: null,
              valueType: "unknown",
              sourceText: valueText
            });
          }
        }
      }
    }
  }

  if (parsedValues.length === 0 && valueText) {
    const flatNum = parseConservativeNumber(valueText);
    if (flatNum !== null) {
      parsedValues.push({
        value: flatNum,
        unit: valueText.includes("%") ? "%" : null,
        tierValues: null,
        valueType: "flat_number",
        sourceText: valueText
      });
    }
  }

  return { effectName, valueText, parsedValues };
}

function parseConservativeNumber(text: string): number | null {
  const cleaned = text.replace(/[+%]/g, "").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  const round = Math.round(num * 100) / 100;
  return round;
}

function classifySuffixCategory(suffixOriginal: string, ctx: SuffixBlockContext): string | null {
  if (ctx.blockType === "general") return "general_suffix";
  if (ctx.blockType === "keyword") return "keyword_suffix";
  return null;
}

function classifyTermType(suffixOriginal: string, ctx: SuffixBlockContext): NormalizedSuffixData["termType"] {
  if (ctx.blockType === "keyword") return "keyword";
  if (ctx.blockType === "general") return "suffix_name";
  return "unknown";
}

function lookupSuffixEnglish(
  suffixOriginal: string,
  ctx: SuffixBlockContext,
  termType: NormalizedSuffixData["termType"],
  notes: string[]
): string | null {
  const registryHit = lookupApprovedModTerm(suffixOriginal, termType);
  if (registryHit?.approvedEnglish) {
    return registryHit.approvedEnglish;
  }

  const dictHit = lookupTranslation(termType === "keyword" ? "keywords" : "names", suffixOriginal);
  if (dictHit.english) {
    return dictHit.english;
  }

  notes.push(`Suffix "${suffixOriginal}" not found in registry or dictionary.`);
  return null;
}

function detectStatOriginal(
  effectOriginal: string | null,
  ctx: SuffixBlockContext,
  suffixOriginal: string
): string | null {
  if (!effectOriginal) return null;
  const firstLine = effectOriginal.split("\n")[0]?.trim();
  if (!firstLine) return null;

  if (ctx.blockType === "general") {
    return firstLine;
  }
  if (ctx.blockType === "keyword") {
    return firstLine;
  }
  return firstLine;
}

function detectKeywordOriginal(
  effectOriginal: string | null,
  ctx: SuffixBlockContext,
  suffixOriginal: string
): string | null {
  if (!effectOriginal) return null;
  const firstLine = effectOriginal.split("\n")[0]?.trim();
  if (!firstLine) return null;

  if (ctx.blockType === "keyword") {
    if (firstLine.includes(suffixOriginal) && suffixOriginal.length > 0) {
      return suffixOriginal;
    }
    return firstLine;
  }
  return null;
}

function lookupStatEnglish(statOriginal: string, notes: string[]): string | null {
  const registryHit = lookupApprovedModTerm(statOriginal, "stat");
  if (registryHit?.approvedEnglish) return registryHit.approvedEnglish;

  const partialResult = translatePartialEffectText(statOriginal);
  if (partialResult.text) return partialResult.text;

  notes.push(`Stat "${statOriginal}" not found in registry.`);
  return null;
}

function lookupKeywordEnglish(keywordOriginal: string, notes: string[]): string | null {
  const registryHit = lookupApprovedModTerm(keywordOriginal, "keyword");
  if (registryHit?.approvedEnglish) return registryHit.approvedEnglish;

  const anyHit = lookupApprovedModTerm(keywordOriginal);
  if (anyHit?.approvedEnglish) return anyHit.approvedEnglish;

  const dictHit = lookupTranslation("keywords", keywordOriginal);
  if (dictHit.english) return dictHit.english;

  notes.push(`Keyword "${keywordOriginal}" not found in registry.`);
  return null;
}

function determineTerminologySource(
  suffixEnglish: string | null,
  statEnglish: string | null,
  keywordEnglish: string | null
): NormalizedSuffixData["terminologySource"] {
  if (suffixEnglish || statEnglish || keywordEnglish) return "terminology_registry";
  return "unknown";
}

function determineTranslationConfidence(
  suffixEnglish: string | null,
  statEnglish: string | null,
  keywordEnglish: string | null,
  effectPartial: string | null
): NormalizedSuffixData["translationConfidence"] {
  if (suffixEnglish) return "high";
  if (statEnglish || keywordEnglish) return "medium";
  if (effectPartial) return "low";
  return "unknown";
}

function classifyReviewReasons(
  suffixOriginal: string | null,
  suffixEnglish: string | null,
  statOriginal: string | null,
  statEnglish: string | null,
  keywordOriginal: string | null,
  keywordEnglish: string | null,
  effectOriginal: string | null,
  effectEnglish: string | null,
  parsedValues: ParsedValue[],
  ctx: SuffixBlockContext,
  notes: string[]
): string[] {
  const reasons: string[] = [];
  if (!suffixEnglish && suffixOriginal) reasons.push("suffix_term_needs_review");
  if (statOriginal && !statEnglish) reasons.push("stat_term_needs_review");
  if (keywordOriginal && !keywordEnglish) reasons.push("keyword_term_needs_review");
  if (notes.some(n => n.includes("bad") || n.includes("flagged") || n.includes("Bad"))) reasons.push("bad_translation_flag");
  if (notes.some(n => n.includes("inconclusive"))) reasons.push("value_parse_uncertainty");
  return reasons;
}

function buildSuffixId(
  suffixEnglish: string | null,
  suffixOriginal: string | null,
  statOriginal: string | null,
  keywordOriginal: string | null,
  columnIndex: number,
  rowIndex: number
): string {
  if (suffixEnglish && statOriginal) {
    const statSlug = slugify(statOriginal);
    return `${slugify(suffixEnglish)}_${statSlug}`;
  }
  if (suffixOriginal && statOriginal) {
    return `suffix_${shortHash(suffixOriginal + statOriginal)}`;
  }
  return `mod_suffix_c${columnIndex}_r${rowIndex}`;
}

function slugify(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "suffix";
}

function shortHash(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);
}
