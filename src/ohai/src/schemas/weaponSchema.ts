import { z } from "zod";

const translationConfidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
const importConfidenceSchema = z.enum(["B_pending_verification", "B_pending_row_verification"]);

const normalizedWeaponSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string().nullable(),
  nameEnglish: z.string().nullable(),
  weaponTypeOriginal: z.string().nullable(),
  weaponTypeEnglish: z.string().nullable(),
  keywordOriginal: z.string().nullable(),
  keywordEnglish: z.string().nullable(),
  elementOriginal: z.string().nullable(),
  elementEnglish: z.string().nullable(),
  rarityOriginal: z.string().nullable(),
  rarityEnglish: z.string().nullable(),
  specialEffectOriginal: z.string().nullable(),
  specialEffectEnglish: z.string().nullable(),
  specialEffectEnglishPartial: z.string().nullable(),
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

export const weaponsRawSchema = z.object({
  module: z.literal("weapons"),
  moduleStatus: z.enum(["raw_extracted_not_verified", "verified_snapshot_locked"]),
  sourceId: z.string(),
  sourceOriginalName: z.string(),
  sourceWorkbook: z.string(),
  sourceSheetOriginal: z.string(),
  sourceSheetEnglish: z.literal("Weapons"),
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
  items: z.array(
    z.object({
      sourceId: z.string(),
      sourceOriginalName: z.string(),
      sourceSheetOriginal: z.string(),
      sourceSheetEnglish: z.literal("Weapons"),
      importedAt: z.string(),
      confidence: importConfidenceSchema,
      locked: z.boolean(),
      originalRowNumber: z.number().int().positive(),
      original: z.record(z.unknown()),
      normalized: normalizedWeaponSchema
    })
  )
});

export type WeaponsRawData = z.infer<typeof weaponsRawSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
