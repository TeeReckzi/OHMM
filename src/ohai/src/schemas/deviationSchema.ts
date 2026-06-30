import { z } from "zod";

export const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);

export const parsedDeviationEffectSchema = z.object({
  effectEnglish: z.string(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  condition: z.string().nullable(),
  rawText: z.string()
});

export const externalReferenceSchema = z.object({
  matched: z.boolean(),
  matchConfidence: z.enum(["high", "medium", "low", "none"]),
  candidateEnglishName: z.string().nullable(),
  candidateBaseName: z.string().nullable(),
  candidateVariantName: z.string().nullable(),
  iconUrl: z.string().nullable(),
  needsReview: z.boolean()
});

export const deviationNormalizedSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string(),
  nameEnglish: z.string().nullable(),
  baseNameEnglish: z.string().nullable(),
  variantNameEnglish: z.string().nullable(),
  isVariant: z.boolean(),
  deviationTypeOriginal: z.string(),
  deviationTypeEnglish: z.string(),
  roleOriginal: z.string().nullable(),
  roleEnglish: z.string().nullable(),
  categoryOriginal: z.string().nullable(),
  categoryEnglish: z.string().nullable(),
  combatRelevance: z.enum(["combat", "territory", "crafting", "gathering", "utility", "unknown"]),
  pveRelevance: z.string().nullable(),
  pvpRelevance: z.string().nullable(),
  activeEffectOriginal: z.string().nullable(),
  activeEffectEnglish: z.string().nullable(),
  activeEffectEnglishPartial: z.string().nullable(),
  passiveEffectOriginal: z.string().nullable(),
  passiveEffectEnglish: z.string().nullable(),
  passiveEffectEnglishPartial: z.string().nullable(),
  traitOriginal: z.string().nullable(),
  traitEnglish: z.string().nullable(),
  sourceOriginal: z.string().nullable(),
  sourceEnglish: z.string().nullable(),
  scenarioRestrictionOriginal: z.string().nullable(),
  scenarioRestrictionEnglish: z.string().nullable(),
  parsedEffects: z.array(parsedDeviationEffectSchema),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  notes: z.array(z.string())
});

export const deviationItemSchema = z.object({
  sourceId: z.string(),
  sourceSheetOriginal: z.literal("異常物"),
  sourceSheetEnglish: z.literal("Deviations"),
  importedAt: z.string(),
  confidence: importConfidenceSchema,
  locked: z.literal(false),
  originalRowNumber: z.number().int().positive(),
  original: z.record(z.unknown()),
  externalReference: externalReferenceSchema,
  normalized: deviationNormalizedSchema
});

const extractionSchema = z.object({
  detectedSheetName: z.string(),
  layoutType: z.string(),
  detectedHeaderRow: z.number().int().positive(),
  headerConfidence: z.enum(["high", "medium", "low"]),
  headersOriginal: z.array(z.string()),
  headersEnglishBestEffort: z.array(z.string()),
  rowCount: z.number().int().nonnegative(),
  blankRowsSkipped: z.number().int().nonnegative(),
  infoRowsSkipped: z.number().int().nonnegative(),
  categoryCount: z.number().int().nonnegative(),
  deviationTypeCounts: z.record(z.number().int().nonnegative()),
  nameTranslationCoverage: z.number().int().nonnegative(),
  variantCount: z.number().int().nonnegative(),
  baseDeviationCount: z.number().int().nonnegative(),
  combatRelevanceCounts: z.record(z.number().int().nonnegative()),
  externalMatchCounts: z.record(z.number().int().nonnegative()),
  parsedEffectCount: z.number().int().nonnegative(),
  needsReviewCount: z.number().int().nonnegative(),
  needsReviewReasons: z.record(z.number().int().nonnegative()),
  warnings: z.array(z.string())
});

const workbookSchema = z.object({
  detectedWorkbookPath: z.string(),
  sheetCount: z.number().int().nonnegative(),
  sheetNamesOriginal: z.array(z.string()),
  sheetNamesEnglish: z.array(z.string().nullable())
});

export const deviationRawSchema = z.object({
  module: z.literal("deviations"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("異常物"),
  sourceSheetEnglish: z.literal("Deviations"),
  importedAt: z.string(),
  locked: z.literal(false),
  confidence: importConfidenceSchema,
  languagePolicy: z.object({
    projectLanguage: z.literal("English"),
    preserveOriginalSourceValues: z.literal(true),
    originalValuesLocation: z.literal("items[].original"),
    normalizedEnglishValuesLocation: z.literal("items[].normalized")
  }),
  workbook: workbookSchema,
  extraction: extractionSchema,
  items: z.array(deviationItemSchema)
});

export type DeviationNormalized = z.infer<typeof deviationNormalizedSchema>;
export type DeviationItem = z.infer<typeof deviationItemSchema>;
export type DeviationRaw = z.infer<typeof deviationRawSchema>;
export type ParsedDeviationEffect = z.infer<typeof parsedDeviationEffectSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
