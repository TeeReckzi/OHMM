import { z } from "zod";

export const importConfidenceSchema = z.enum([
  "A_project_verified",
  "B_pending_verification",
  "B_pending_row_verification",
  "C_draft",
]);

export const blockTypeSchema = z.enum([
  "armor_star_up_materials",
  "weapon_star_up_materials",
  "armor_quality_scaling",
  "max_stat_reference",
  "notes",
  "unknown",
]);

export const categorySchema = z.enum([
  "weapon",
  "armor",
  "blueprint",
  "tier",
  "material",
  "unknown",
]);

export const scalingTypeSchema = z.enum([
  "flat",
  "percent",
  "multiplier",
  "cost",
  "unknown",
]);

export const armorSlotSchema = z.enum([
  "mask",
  "helmet",
  "chest",
  "gloves",
  "pants",
  "shoes",
  "unknown",
]);

export const furQualitySchema = z.enum([
  "perfect",
  "excellent",
  "rare",
  "common",
  "unknown",
]);

export const starLevelSchema = z.number().int().min(1).max(6).nullable();

export const normalizedStarTierRowSchema = z.object({
  id: z.string().min(1),
  category: categorySchema,
  blockType: blockTypeSchema,
  armorSlot: armorSlotSchema.nullable(),
  starLevelOriginal: z.string().nullable(),
  starLevel: starLevelSchema,
  tierOriginal: z.string().nullable(),
  tier: z.string().nullable(),
  furQualityOriginal: z.string().nullable(),
  furQuality: furQualitySchema.nullable(),
  itemSlotOriginal: z.string().nullable(),
  itemSlotEnglish: z.string().nullable(),
  statOriginal: z.string().nullable(),
  statEnglish: z.string().nullable(),
  valueOriginal: z.union([z.string(), z.number()]).nullable(),
  valueParsed: z.number().nullable(),
  valueUnit: z.string().nullable(),
  scalingType: scalingTypeSchema,
  notes: z.array(z.string()),
});

export const blockSchema = z.object({
  blockId: z.string().min(1),
  blockType: blockTypeSchema,
  blockTitleOriginal: z.string().nullable(),
  blockTitleEnglish: z.string().nullable(),
  startRow: z.number().int().positive(),
  endRow: z.number().int().positive(),
  headerRow: z.number().int().positive().nullable(),
  headerConfidence: z.enum(["high", "medium", "low", "none"]),
  headersOriginal: z.array(z.string()),
  headersEnglishBestEffort: z.array(z.string().nullable()),
  rows: z.array(
    z.object({
      sourceId: z.string(),
      sourceSheetOriginal: z.string(),
      sourceSheetEnglish: z.string(),
      originalRowNumber: z.number().int().positive(),
      locked: z.boolean(),
      confidence: importConfidenceSchema,
      original: z.record(z.unknown()),
      normalized: normalizedStarTierRowSchema,
    })
  ),
  warnings: z.array(z.string()),
});

export const extractionSchema = z.object({
  detectedSheetName: z.string(),
  layoutType: z.enum(["single_table", "multi_block", "key_value", "notes_heavy", "unknown"]),
  detectedBlocks: z.number().int().nonnegative(),
  rowCount: z.number().int().nonnegative(),
  blankRowsSkipped: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
});

export const workbookSchema = z.object({
  detectedWorkbookPath: z.string(),
  sheetCount: z.number().int().nonnegative(),
  sheetNamesOriginal: z.array(z.string()),
  sheetNamesEnglish: z.array(z.string()),
});

export const starTierScalingRawSchema = z.object({
  module: z.literal("star_tier_scaling"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.string(),
  sourceSheetEnglish: z.string(),
  importedAt: z.string(),
  locked: z.boolean(),
  confidence: importConfidenceSchema,
  languagePolicy: z.object({
    projectLanguage: z.literal("English"),
    preserveOriginalSourceValues: z.literal(true),
    originalValuesLocation: z.literal("blocks[].rows[].original"),
    normalizedEnglishValuesLocation: z.literal("blocks[].rows[].normalized"),
  }),
  workbook: workbookSchema,
  extraction: extractionSchema,
  blocks: z.array(blockSchema),
});

export type NormalizedStarTierRow = z.infer<typeof normalizedStarTierRowSchema>;
export type Block = z.infer<typeof blockSchema>;
export type StarTierScalingRaw = z.infer<typeof starTierScalingRawSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
