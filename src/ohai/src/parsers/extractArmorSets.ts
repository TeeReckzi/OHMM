import fs from "node:fs";
import path from "node:path";
import { armorSetsRawSchema, formatZodError } from "../schemas/armorSetSchema";
import type { NormalizedArmorSet } from "../schemas/armorSetSchema";
import { normalizeArmorSet, parseSetName, splitEffectTiers } from "../utils/normalizeArmorSet";
import { listSheetNames, openWorkbook, readSheetAsMatrix } from "../utils/workbook";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";
const SOURCE_ORIGINAL_NAME = "七日世界";
const ROOT_DIR = path.resolve(__dirname, "..", "..");

const SHEET_NAMES_ORIGINAL: string[] = [
  "", "搖籃", "關鍵詞", "武器", "圖紙", "防具", "套裝", "毛皮", "武器防具星級",
  "模組來源", "模組核心效果", "模組詞條效果", "料理", "食材", "創意料理", "種植",
  "養殖", "養殖(特性)", "養殖(食物、水)", "釣魚", "電", "油", "酸", "異常物",
  "異常物特性", "異常物(非正常收容) ", "商人", "公開事件", "經驗", "溫控塔",
  "願望箱(舊)", "夢域(舊)", "區域資源(舊)", "專精表(舊)", "專精材料(舊)",
  "模組來源(舊)", "模組強化.置換(舊)", "模組核心效果(舊)", "模組詞條效果(舊)",
  "養殖(繼承規則)(舊)", "料理(舊)", "物品(舊)", "電(舊)"
];

const SHEET_NAMES_ENGLISH: (string | null)[] = [
  "", "Cradle", "Keywords", "Weapons", "Blueprints", "Armor", "Armor Sets", "Fur",
  "Weapon/Armor Stars", "Mod Sources", "Mod Core Effects", "Mod Suffix Effects",
  "Cooking", "Ingredients", "Creative Cooking", "Farming", "Breeding",
  "Breeding (Traits)", "Breeding (Food/Water)", "Fishing", "Electricity", "Oil",
  "Acid", "Deviant Beings", "Deviant Being Traits",
  "Deviant Beings (Non-standard Containment)", "Merchants", "Public Events",
  "Experience", "Temp Control Tower", "Wish Box (Legacy)", "Dream Realm (Legacy)",
  "Regional Resources (Legacy)", "Specializations (Legacy)",
  "Specialization Materials (Legacy)", "Mod Sources (Legacy)",
  "Mod Enhancement/Replacement (Legacy)", "Mod Core Effects (Legacy)",
  "Mod Suffix Effects (Legacy)", "Breeding Inheritance (Legacy)",
  "Cooking (Legacy)", "Items (Legacy)", "Electricity (Legacy)"
];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const sourcePath = path.join(ROOT_DIR, "data", "raw", "七日世界.xlsx");
  const workbook = await openWorkbook(sourcePath);
  const sheetNames = listSheetNames(workbook);
  console.log(`Detected workbook: ${path.basename(sourcePath)}`);

  const detectedSheetName = "套裝";
  if (!sheetNames.includes(detectedSheetName)) {
    console.log(`Sheet "${detectedSheetName}" not found.`);
    return;
  }
  console.log(`Detected sheet: ${detectedSheetName}`);

  const rows = readSheetAsMatrix(workbook, detectedSheetName);
  console.log(`Total rows read: ${rows.length}`);

  const headersOriginal: string[] = [];
  const detectedHeaderRow = 1;

  if (rows.length >= detectedHeaderRow && Array.isArray(rows[detectedHeaderRow - 1])) {
    const headerRow = rows[detectedHeaderRow - 1] as unknown[];
    headerRow.forEach((cell) => {
      headersOriginal.push(cell !== null && cell !== undefined ? String(cell) : "");
    });
  }
  console.log(`Headers: ${JSON.stringify(headersOriginal)}`);

  const headersEnglishBestEffort: (string | null)[] = ["Set Name", "Set Effect Text", null, null, null, null, null, null];
  const headerConfidence = "high" as const;

  const items: Array<{
    sourceId: string;
    sourceOriginalName: string;
    sourceSheetOriginal: "套裝";
    sourceSheetEnglish: "Armor Sets";
    importedAt: string;
    confidence: "B_pending_verification";
    locked: false;
    originalRowNumber: number;
    original: Record<string, unknown>;
    normalized: NormalizedArmorSet;
  }> = [];

  const warnings: string[] = [];
  let blankRowsSkipped = 0;

  for (let i = detectedHeaderRow; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const nameCell = row[0];
    if (nameCell === null || nameCell === undefined || String(nameCell).trim() === "") {
      blankRowsSkipped++;
      continue;
    }

    const setName = String(nameCell).trim();
    const effectCell = row[1];
    const effectText = effectCell !== null && effectCell !== undefined ? String(effectCell).trim() : null;

    const originalRowNumber = i + 1;

    const normalized = normalizeArmorSet(setName, effectText);

    const original: Record<string, unknown> = {
      name: setName,
      effectText: effectText
    };

    items.push({
      sourceId: SOURCE_ID,
      sourceOriginalName: SOURCE_ORIGINAL_NAME,
      sourceSheetOriginal: "套裝",
      sourceSheetEnglish: "Armor Sets",
      importedAt: new Date().toISOString(),
      confidence: "B_pending_verification",
      locked: false,
      originalRowNumber,
      original,
      normalized
    });
  }

  console.log(`Data rows: ${items.length}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);

  const output = {
    module: "armor_sets" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: "七日世界.xlsx",
    sourceSheetOriginal: "套裝" as const,
    sourceSheetEnglish: "Armor Sets" as const,
    importedAt: new Date().toISOString(),
    locked: false,
    confidence: "B_pending_verification" as const,
    languagePolicy: {
      projectLanguage: "English" as const,
      preserveOriginalSourceValues: true as const,
      originalValuesLocation: "items[].original" as const,
      normalizedEnglishValuesLocation: "items[].normalized" as const
    },
    workbook: {
      detectedWorkbookPath: sourcePath,
      sheetCount: sheetNames.length,
      sheetNamesOriginal: SHEET_NAMES_ORIGINAL,
      sheetNamesEnglish: SHEET_NAMES_ENGLISH
    },
    extraction: {
      detectedSheetName,
      detectedHeaderRow,
      headerConfidence,
      headersOriginal,
      headersEnglishBestEffort,
      rowCount: items.length,
      blankRowsSkipped,
      warnings
    },
    items
  };

  const parsed = armorSetsRawSchema.safeParse(output);
  if (!parsed.success) {
    const errorLines = formatZodError(parsed.error);
    console.error("Schema validation FAILED:");
    errorLines.forEach((line) => console.error(`  ${line}`));
    process.exitCode = 1;
    return;
  }
  console.log("Schema validation: pass");

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "armor-sets.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");
  console.log(`Output written: ${outputPath}`);

  const needsReview = items.filter((item) => item.normalized.needsReview);
  console.log(`needsReview count: ${needsReview.length}`);
  needsReview.forEach((item) => {
    console.log(`  ${item.normalized.id}: ${item.normalized.reviewReasons.join(", ")}`);
  });

  const idSet = new Set<string>();
  let dupCount = 0;
  items.forEach((item) => {
    if (idSet.has(item.normalized.id)) {
      dupCount++;
    }
    idSet.add(item.normalized.id);
  });
  console.log(`Duplicate IDs: ${dupCount}`);

  console.log(`Module 6 was not locked.`);
}
