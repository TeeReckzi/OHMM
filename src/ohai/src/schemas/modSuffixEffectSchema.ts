import { z } from "zod";

export const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);
export const translationConfidenceSchema = z.enum(["approved", "high", "medium", "low", "unknown"]);
export const overlayMatchConfidenceSchema = z.enum(["high", "medium", "low", "none"]);
export const systemVersionSchema = z.enum(["legacy_pre_overhaul", "current_post_overhaul", "hybrid_player_inventory", "unknown"]);
export const availabilitySchema = z.enum(["currently_farmable", "legacy_retained_only", "deprecated_unavailable", "event_limited", "unknown"]);
export const legacyStatusSchema = z.enum(["not_legacy", "legacy", "mixed", "unknown"]);
export const termTypeSchema = z.enum(["suffix_name", "stat", "keyword", "effect_phrase", "unknown"]);
export const terminologySourceSchema = z.enum(["project_glossary", "terminology_registry", "translation_dictionary", "overlay_candidate", "unknown"]);
export const rarityTierSchema = z.enum(["common", "fine", "rare", "epic", "legendary"]).nullable();

export const parsedValueSchema = z.object({
  value: z.number(),
  unit: z.string().nullable(),
  tierValues: z.array(z.number()).nullable(),
  valueType: z.enum(["percentage", "flat_number", "duration_seconds", "stack_count", "cooldown", "unknown"]),
  sourceText: z.string()
});

export const normalizedSuffixSchema = z.object({
  id: z.string().min(1),
  suffixOriginal: z.string().nullable(),
  suffixEnglish: z.string().nullable(),
  suffixCategoryOriginal: z.string().nullable(),
  suffixCategoryEnglish: z.string().nullable(),
  termType: termTypeSchema,
  statOriginal: z.string().nullable(),
  statEnglish: z.string().nullable(),
  keywordOriginal: z.string().nullable(),
  keywordEnglish: z.string().nullable(),
  effectOriginal: z.string().nullable(),
  effectEnglish: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  valueOriginal: z.string().nullable(),
  valueParsed: z.array(parsedValueSchema).nullable(),
  valueUnit: z.string().nullable(),
  slotOriginal: z.string().nullable(),
  slotEnglish: z.string().nullable(),
  rarityOriginal: z.string().nullable(),
  rarityEnglish: z.string().nullable(),
  rarityTier: rarityTierSchema,
  systemVersion: systemVersionSchema,
  availability: availabilitySchema,
  legacyStatus: legacyStatusSchema,
  introducedPatch: z.string().nullable(),
  retiredPatch: z.string().nullable(),
  canDropNow: z.boolean().nullable(),
  canExistInPlayerInventory: z.boolean(),
  requiresLegacyOwnership: z.boolean(),
  terminologySource: terminologySourceSchema,
  translationConfidence: translationConfidenceSchema,
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  notes: z.array(z.string())
});

export const overlaySuffixSchema = z.object({
  used: z.boolean(),
  candidateEnglishName: z.string().nullable(),
  candidateEnglishEffect: z.string().nullable(),
  matchConfidence: overlayMatchConfidenceSchema,
  translationConfidence: translationConfidenceSchema,
  needsReview: z.boolean(),
  reason: z.string().nullable()
});

const extractionSchema = z.object({
  detectedSheetName: z.string(),
  detectedHeaderRow: z.number().int().positive(),
  headerConfidence: z.enum(["high", "medium", "low"]),
  headersOriginal: z.array(z.string()),
  headersEnglishBestEffort: z.array(z.string().nullable()),
  rowCount: z.number().int().nonnegative(),
  blankRowsSkipped: z.number().int().nonnegative(),
  warnings: z.array(z.string())
});

const workbookSchema = z.object({
  detectedWorkbookPath: z.string(),
  sheetCount: z.number().int().nonnegative(),
  sheetNamesOriginal: z.array(z.string()),
  sheetNamesEnglish: z.array(z.string())
});

export const modSuffixEffectsRawSchema = z.object({
  module: z.literal("mod_suffix_effects"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("模組詞條效果"),
  sourceSheetEnglish: z.literal("Mod Suffix Effects"),
  importedAt: z.string(),
  locked: z.boolean(),
  confidence: importConfidenceSchema,
  languagePolicy: z.object({
    projectLanguage: z.literal("English"),
    preserveOriginalSourceValues: z.literal(true),
    originalValuesLocation: z.literal("items[].original"),
    normalizedEnglishValuesLocation: z.literal("items[].normalized")
  }),
  modSystemPolicy: z.object({
    registrySource: z.literal("data/verified/mod-system-registry.verified.json"),
    defaultOptimizerPoolMode: z.literal("current_only"),
    doNotMergeLegacyAndCurrentEffects: z.literal(true)
  }),
  terminologyPolicy: z.object({
    registrySource: z.literal("data/verified/mod-terminology-registry.verified.json"),
    useTerminologyRegistryFirst: z.literal(true),
    overlayIsCandidateOnly: z.literal(true),
    autoPromoteOverlayValues: z.literal(false)
  }),
  workbook: workbookSchema,
  extraction: extractionSchema,
  items: z.array(z.object({
    sourceId: z.string(),
    sourceOriginalName: z.string(),
    sourceSheetOriginal: z.literal("模組詞條效果"),
    sourceSheetEnglish: z.literal("Mod Suffix Effects"),
    importedAt: z.string(),
    confidence: importConfidenceSchema,
    locked: z.boolean(),
    originalRowNumber: z.number().int().positive(),
    original: z.record(z.unknown()),
    overlay: overlaySuffixSchema,
    normalized: normalizedSuffixSchema
  }))
});

export type NormalizedSuffixData = z.infer<typeof normalizedSuffixSchema>;
export type OverlaySuffixData = z.infer<typeof overlaySuffixSchema>;
export type ParsedValue = z.infer<typeof parsedValueSchema>;
export type ModSuffixEffectsRaw = z.infer<typeof modSuffixEffectsRawSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
