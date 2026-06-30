import { z } from "zod";

const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);
const translationConfidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
const systemVersionSchema = z.enum(["legacy_pre_overhaul", "current_post_overhaul", "hybrid_player_inventory", "unknown"]);
const availabilitySchema = z.enum(["currently_farmable", "legacy_retained_only", "deprecated_unavailable", "event_limited", "unknown"]);
const legacyStatusSchema = z.enum(["not_legacy", "legacy", "mixed", "unknown"]);
const rarityTierSchema = z.enum(["common", "fine", "rare", "epic", "legendary"]).nullable();
const raritySourceKindSchema = z.enum(["rarity_name", "color_label", "unknown"]);
const overlayMatchConfidenceSchema = z.enum(["high", "medium", "low", "none"]);
const overlayTranslationConfidenceSchema = z.enum(["approved", "high", "medium", "low", "unknown"]);

const overlaySchema = z.object({
  used: z.boolean(),
  candidateEnglishName: z.string().nullable(),
  candidateEnglishEffect: z.string().nullable(),
  confidence: overlayMatchConfidenceSchema,
  matchConfidence: overlayMatchConfidenceSchema,
  translationConfidence: overlayTranslationConfidenceSchema,
  needsReview: z.boolean(),
  reason: z.string().nullable()
});

const normalizedSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string().nullable(),
  nameEnglish: z.string().nullable(),
  slotOriginal: z.string().nullable(),
  slotEnglish: z.string().nullable(),
  modTypeOriginal: z.string().nullable(),
  modTypeEnglish: z.string().nullable(),
  rarityOriginal: z.string().nullable(),
  rarityEnglish: z.string().nullable(),
  rarityTier: rarityTierSchema,
  rarityColorEnglish: z.string().nullable(),
  raritySourceKind: raritySourceKindSchema,
  keywordOriginal: z.string().nullable(),
  keywordEnglish: z.string().nullable(),
  effectOriginal: z.string().nullable(),
  effectEnglish: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  sourceOriginal: z.string().nullable(),
  sourceEnglish: z.string().nullable(),
  systemVersion: systemVersionSchema,
  availability: availabilitySchema,
  legacyStatus: legacyStatusSchema,
  introducedPatch: z.string().nullable(),
  retiredPatch: z.string().nullable(),
  canDropNow: z.boolean().nullable(),
  canExistInPlayerInventory: z.boolean(),
  requiresLegacyOwnership: z.boolean(),
  translationConfidence: translationConfidenceSchema,
  notes: z.array(z.string())
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

export const modCoreEffectsRawSchema = z.object({
  module: z.literal("mod_core_effects"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("模組核心效果"),
  sourceSheetEnglish: z.literal("Mod Core Effects"),
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
  translationOverlayPolicy: z.object({
    overlayWorkbook: z.literal("data/raw/translation-overlays/oncehumandatatables.xlsx"),
    overlayIsSourceOfTruth: z.literal(false),
    autoPromoteOverlayValues: z.literal(false)
  }),
  workbook: workbookSchema,
  extraction: extractionSchema,
  items: z.array(z.object({
    sourceId: z.string(),
    sourceOriginalName: z.string(),
    sourceSheetOriginal: z.literal("模組核心效果"),
    sourceSheetEnglish: z.literal("Mod Core Effects"),
    importedAt: z.string(),
    confidence: importConfidenceSchema,
    locked: z.boolean(),
    originalRowNumber: z.number().int().positive(),
    original: z.record(z.unknown()),
    overlay: overlaySchema,
    normalized: normalizedSchema
  }))
});

export function formatModCoreZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
