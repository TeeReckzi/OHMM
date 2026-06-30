import { z } from "zod";

export const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);

export const externalReferenceSchema = z.object({
  matched: z.boolean(),
  matchConfidence: z.enum(["high", "medium", "low", "none"]),
  candidateEnglishName: z.string().nullable(),
  iconUrl: z.string().nullable(),
  needsReview: z.boolean()
});

export const ingredientNormalizedSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string(),
  nameEnglish: z.string().nullable(),
  ingredientTypeOriginal: z.string(),
  ingredientTypeEnglish: z.string(),
  categoryOriginal: z.string(),
  categoryEnglish: z.string(),
  effectOriginal: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  effectPowerOriginal: z.string().nullable(),
  effectDurationOriginal: z.string().nullable(),
  baseSatiety: z.number().nullable(),
  baseHydration: z.number().nullable(),
  baseSanity: z.number().nullable(),
  durabilityHours: z.number().nullable(),
  isFoodItem: z.boolean(),
  isDrinkItem: z.boolean(),
  isCrop: z.boolean(),
  isMeat: z.boolean(),
  isFish: z.boolean(),
  isDairy: z.boolean(),
  isEgg: z.boolean(),
  isSeasoning: z.boolean(),
  isHerb: z.boolean(),
  isDeviated: z.boolean(),
  isContaminated: z.boolean(),
  isGrafted: z.boolean(),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  notes: z.array(z.string())
});

export const ingredientItemSchema = z.object({
  sourceId: z.string(),
  sourceSheetOriginal: z.literal("食材"),
  sourceSheetEnglish: z.literal("Ingredients"),
  importedAt: z.string(),
  confidence: importConfidenceSchema,
  locked: z.literal(false),
  originalRowNumber: z.number().int().positive(),
  original: z.record(z.unknown()),
  externalReference: externalReferenceSchema,
  normalized: ingredientNormalizedSchema
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
  typeCounts: z.record(z.number().int().nonnegative()),
  nameTranslationCoverage: z.number().int().nonnegative(),
  categoryFlagCounts: z.record(z.number().int().nonnegative()),
  externalMatchCounts: z.record(z.number().int().nonnegative()),
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

export const ingredientRawSchema = z.object({
  module: z.literal("ingredients"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("食材"),
  sourceSheetEnglish: z.literal("Ingredients"),
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
  items: z.array(ingredientItemSchema)
});

export type IngredientNormalized = z.infer<typeof ingredientNormalizedSchema>;
export type IngredientItem = z.infer<typeof ingredientItemSchema>;
export type IngredientRaw = z.infer<typeof ingredientRawSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
