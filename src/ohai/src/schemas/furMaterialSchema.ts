import { z } from "zod";

export const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);
export const matchConfidenceSchema = z.enum(["high", "medium", "low", "none"]);

export const parsedStatSchema = z.object({
  statEnglish: z.string(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  condition: z.string().nullable(),
  rawText: z.string()
});

export const externalReferenceSchema = z.object({
  matched: z.boolean(),
  matchConfidence: matchConfidenceSchema,
  candidateEnglishName: z.string().nullable(),
  sourceSlug: z.string().nullable(),
  generatedSlug: z.string().nullable(),
  canonicalSourceUrl: z.string().nullable(),
  needsReview: z.boolean()
});

export const furMaterialNormalizedSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string(),
  nameEnglish: z.string().nullable(),
  materialTypeOriginal: z.string().nullable(),
  materialTypeEnglish: z.string().nullable(),
  qualityOriginal: z.string().nullable(),
  qualityEnglish: z.string().nullable(),
  qualityTier: z.number().int().nonnegative().nullable(),
  targetGearSlotOriginal: z.string(),
  targetGearSlotEnglish: z.string(),
  buffClassificationOriginal: z.string().nullable(),
  buffClassificationEnglish: z.string().nullable(),
  effectOriginal: z.string().nullable(),
  effectEnglish: z.string().nullable(),
  effectEnglishPartial: z.string().nullable(),
  sourceOriginal: z.string().nullable(),
  sourceEnglish: z.string().nullable(),
  droppedByOriginal: z.string().nullable(),
  droppedByEnglish: z.string().nullable(),
  aliasesEnglish: z.array(z.string()),
  parsedStats: z.array(parsedStatSchema),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  notes: z.array(z.string())
});

export const furMaterialItemSchema = z.object({
  sourceId: z.string(),
  sourceSheetOriginal: z.string(),
  sourceSheetEnglish: z.literal("Fur / Armor Crafting Materials"),
  importedAt: z.string(),
  confidence: importConfidenceSchema,
  locked: z.literal(false),
  originalRowNumber: z.number().int().positive(),
  original: z.record(z.unknown()),
  externalReference: externalReferenceSchema,
  normalized: furMaterialNormalizedSchema
});

const extractionSchema = z.object({
  detectedSheetName: z.string(),
  detectedHeaderRow: z.number().int().positive(),
  headerConfidence: z.enum(["high", "medium", "low"]),
  headersOriginal: z.array(z.string()),
  headersEnglishBestEffort: z.array(z.string()),
  rowCount: z.number().int().nonnegative(),
  blankRowsSkipped: z.number().int().nonnegative(),
  externalReferenceMatches: z.number().int().nonnegative(),
  generatedUrlCount: z.number().int().nonnegative(),
  canonicalSourceUrlCount: z.number().int().nonnegative(),
  sourceSlugMissingCount: z.number().int().nonnegative(),
  slotCoverage: z.record(z.number().int().nonnegative()),
  qualityCoverage: z.record(z.number().int().nonnegative()),
  needsReviewCount: z.number().int().nonnegative(),
  needsReviewReasons: z.record(z.number().int().nonnegative()),
  parsedStatsCoverage: z.object({
    rowsWithParsedStats: z.number().int().nonnegative(),
    rowsNoParsedStats: z.number().int().nonnegative(),
    totalEntries: z.number().int().nonnegative(),
    byStat: z.record(z.number().int().nonnegative())
  }),
  unmatchedUniqueFurCount: z.number().int().nonnegative(),
  warnings: z.array(z.string())
});

const workbookSchema = z.object({
  detectedWorkbookPath: z.string(),
  sheetCount: z.number().int().nonnegative(),
  sheetNamesOriginal: z.array(z.string()),
  sheetNamesEnglish: z.array(z.string().nullable())
});

export const furMaterialRawSchema = z.object({
  module: z.literal("fur_materials"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.literal("毛皮"),
  sourceSheetEnglish: z.literal("Fur / Armor Crafting Materials"),
  importedAt: z.string(),
  locked: z.literal(false),
  confidence: importConfidenceSchema,
  languagePolicy: z.object({
    projectLanguage: z.literal("English"),
    preserveOriginalSourceValues: z.literal(true),
    originalValuesLocation: z.literal("items[].original"),
    normalizedEnglishValuesLocation: z.literal("items[].normalized"),
    externalReferenceLocation: z.literal("items[].externalReference")
  }),
  workbook: workbookSchema,
  extraction: extractionSchema,
  items: z.array(furMaterialItemSchema)
});

export type FurMaterialNormalized = z.infer<typeof furMaterialNormalizedSchema>;
export type FurMaterialItem = z.infer<typeof furMaterialItemSchema>;
export type FurMaterialRaw = z.infer<typeof furMaterialRawSchema>;
export type ExternalReference = z.infer<typeof externalReferenceSchema>;
export type MatchConfidence = z.infer<typeof matchConfidenceSchema>;
export type ParsedStat = z.infer<typeof parsedStatSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
