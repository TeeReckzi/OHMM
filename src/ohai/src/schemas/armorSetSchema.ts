import { z } from "zod";

export const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);
export const translationConfidenceSchema = z.enum(["approved", "high", "medium", "low", "unknown"]);
export const systemVersionSchema = z.enum(["legacy_pre_overhaul", "current_post_overhaul", "hybrid_player_inventory", "unknown"]);
export const availabilitySchema = z.enum(["currently_farmable", "legacy_retained_only", "deprecated_unavailable", "event_limited", "unknown"]);
export const legacyStatusSchema = z.enum(["not_legacy", "legacy", "mixed", "unknown"]);
export const terminologySourceSchema = z.enum(["project_glossary", "terminology_registry", "translation_dictionary", "overlay_candidate", "unknown"]);

export const parsedStatSchema = z.object({
  statName: z.string(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  sourceText: z.string()
});

export const effectTierSchema = z.object({
  piecesRequired: z.number().int().positive().nullable(),
  labelOriginal: z.string().nullable(),
  labelEnglish: z.string().nullable(),
  effectOriginal: z.string(),
  effectEnglish: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  parsedStats: z.array(parsedStatSchema),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string())
});

export const normalizedArmorSetSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string().nullable(),
  nameEnglish: z.string().nullable(),
  setFamilyOriginal: z.string().nullable(),
  setFamilyEnglish: z.string().nullable(),
  variantOriginal: z.string().nullable(),
  variantEnglish: z.string().nullable(),
  effectOriginal: z.string().nullable(),
  effectEnglish: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  effectTiers: z.array(effectTierSchema),
  parsedStats: z.array(parsedStatSchema),
  keywordOriginal: z.string().nullable(),
  keywordEnglish: z.string().nullable(),
  elementOriginal: z.string().nullable(),
  elementEnglish: z.string().nullable(),
  terminologySource: terminologySourceSchema,
  translationConfidence: translationConfidenceSchema,
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  systemVersion: systemVersionSchema,
  availability: availabilitySchema,
  legacyStatus: legacyStatusSchema,
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

export const armorSetsRawSchema = z.object({
  module: z.literal("armor_sets"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("套裝"),
  sourceSheetEnglish: z.literal("Armor Sets"),
  importedAt: z.string(),
  locked: z.boolean(),
  confidence: importConfidenceSchema,
  languagePolicy: z.object({
    projectLanguage: z.literal("English"),
    preserveOriginalSourceValues: z.literal(true),
    originalValuesLocation: z.literal("items[].original"),
    normalizedEnglishValuesLocation: z.literal("items[].normalized")
  }),
  workbook: workbookSchema,
  extraction: extractionSchema,
  items: z.array(z.object({
    sourceId: z.string(),
    sourceOriginalName: z.string(),
    sourceSheetOriginal: z.literal("套裝"),
    sourceSheetEnglish: z.literal("Armor Sets"),
    importedAt: z.string(),
    confidence: importConfidenceSchema,
    locked: z.boolean(),
    originalRowNumber: z.number().int().positive(),
    original: z.record(z.unknown()),
    normalized: normalizedArmorSetSchema
  }))
});

export type NormalizedArmorSet = z.infer<typeof normalizedArmorSetSchema>;
export type EffectTier = z.infer<typeof effectTierSchema>;
export type ParsedStat = z.infer<typeof parsedStatSchema>;
export type ArmorSetsRaw = z.infer<typeof armorSetsRawSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
