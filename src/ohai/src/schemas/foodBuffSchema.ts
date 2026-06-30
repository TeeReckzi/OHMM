import { z } from "zod";

export const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);

export const parsedBuffSchema = z.object({
  buffEnglish: z.string(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  condition: z.string().nullable(),
  rawText: z.string()
});

export const foodBuffNormalizedSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string(),
  nameEnglish: z.string().nullable(),
  foodTypeOriginal: z.string(),
  foodTypeEnglish: z.string(),
  effectOriginal: z.string().nullable(),
  effectEnglish: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  effectPowerOriginal: z.string().nullable(),
  effectPowerEnglish: z.string().nullable(),
  durationOriginal: z.string().nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  ingredientEffectOriginal: z.string().nullable(),
  ingredientEffectEnglishPartial: z.string().nullable(),
  ingredientsOriginal: z.string().nullable(),
  ingredientsEnglish: z.string().nullable(),
  baseEffectOriginal: z.string().nullable(),
  baseEffectEnglish: z.string().nullable(),
  recipeUnlockOriginal: z.string().nullable(),
  recipeUnlockEnglish: z.string().nullable(),
  durabilityHours: z.number().nonnegative().nullable(),
  craftTimeSeconds: z.number().nonnegative().nullable(),
  merchantBatteryCost: z.number().nonnegative().nullable(),
  scenarioRestrictionOriginal: z.string().nullable(),
  scenarioRestrictionEnglish: z.string().nullable(),
  parsedBuffs: z.array(parsedBuffSchema),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  notes: z.array(z.string())
});

export const foodBuffItemSchema = z.object({
  sourceId: z.string(),
  sourceSheetOriginal: z.literal("料理"),
  sourceSheetEnglish: z.literal("Cooking / Food Buffs"),
  importedAt: z.string(),
  confidence: importConfidenceSchema,
  locked: z.literal(false),
  originalRowNumber: z.number().int().positive(),
  original: z.record(z.unknown()),
  normalized: foodBuffNormalizedSchema
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
  referenceSectionSkipped: z.number().int().nonnegative(),
  foodTypeCounts: z.record(z.number().int().nonnegative()),
  nameTranslationCoverage: z.number().int().nonnegative(),
  durationParsedCount: z.number().int().nonnegative(),
  parsedBuffCount: z.number().int().nonnegative(),
  ingredientParsedCount: z.number().int().nonnegative(),
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

export const foodBuffRawSchema = z.object({
  module: z.literal("food_buffs"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("料理"),
  sourceSheetEnglish: z.literal("Cooking / Food Buffs"),
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
  items: z.array(foodBuffItemSchema)
});

export type FoodBuffNormalized = z.infer<typeof foodBuffNormalizedSchema>;
export type FoodBuffItem = z.infer<typeof foodBuffItemSchema>;
export type FoodBuffRaw = z.infer<typeof foodBuffRawSchema>;
export type ParsedBuff = z.infer<typeof parsedBuffSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
