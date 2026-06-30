import fs from "node:fs";
import path from "node:path";
import { foodBuffRawSchema, formatZodError } from "../schemas/foodBuffSchema";
import type { FoodBuffItem } from "../schemas/foodBuffSchema";
import { normalizeFoodRow } from "../utils/normalizeFoodBuff";
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

  const detectedSheetName = "料理";
  if (!sheetNames.includes(detectedSheetName)) {
    console.log(`Sheet "${detectedSheetName}" not found.`);
    console.log("Available sheets:", sheetNames.join(", "));
    return;
  }
  console.log(`Detected sheet: ${detectedSheetName}`);

  const rows = readSheetAsMatrix(workbook, detectedSheetName);
  console.log(`Total rows read: ${rows.length}`);

  const detectedHeaderRow = 1;
  const headersOriginal: string[] = [];
  if (rows.length >= detectedHeaderRow && Array.isArray(rows[detectedHeaderRow - 1])) {
    const headerRow = rows[detectedHeaderRow - 1] as unknown[];
    headerRow.forEach((cell) => {
      headersOriginal.push(cell !== null && cell !== undefined ? String(cell).replace(/\n/g, " ") : "");
    });
  }

  const headersEnglishBestEffort: string[] = [
    "Type", "Name", "Effect", "Effect Power", "Effect Duration (min)",
    "Ingredient Effect Duration (min)", "Ingredient Effect", "Ingredients",
    "Base Effect", "Durability (h)", "Craft Time (s)", "Merchant Battery",
    "Recipe Unlock", "", "", "Sort Order", "Ingredient Sort"
  ];

  const layoutType = "single_table_two_sections";

  const items: FoodBuffItem[] = [];
  const warnings: string[] = [];
  let blankRowsSkipped = 0;
  let infoRowsSkipped = 0;
  let referenceSectionSkipped = 0;

  const foodTypeCounts: Record<string, number> = {};

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const typeCell = row[0];
    const nameCell = row[1];

    const typeStr = typeCell !== null && typeCell !== undefined ? String(typeCell).trim() : "";
    const nameStr = nameCell !== null && nameCell !== undefined ? String(nameCell).trim() : "";

    if (!typeStr && !nameStr) {
      blankRowsSkipped++;
      continue;
    }

    if (!nameStr && typeStr === "食物") {
      blankRowsSkipped++;
      continue;
    }

    if (!nameStr && !typeStr) {
      blankRowsSkipped++;
      continue;
    }

    const isInfoOrReference = nameStr.includes("料理分為") || nameStr.includes("各食材可製作");
    if (isInfoOrReference) {
      if (nameStr.includes("各食材可製作")) {
        referenceSectionSkipped++;
      } else if (nameStr.includes("料理分為")) {
        infoRowsSkipped++;
      }
      continue;
    }

    if (!typeStr && nameStr) {
      if (nameStr === "變質料理") {
      } else if (nameStr.length > 30) {
        infoRowsSkipped++;
        continue;
      } else {
        referenceSectionSkipped++;
        continue;
      }
    }

    if (typeStr !== "食物" && typeStr !== "飲品" && typeStr) {
      infoRowsSkipped++;
      continue;
    }

    if (!typeStr || typeStr === "") {
      referenceSectionSkipped++;
      continue;
    }

    const effectOriginal = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : null;
    const effectPowerOriginal = row[3] !== null && row[3] !== undefined ? String(row[3]).trim() : null;
    const durationOriginal = row[4] !== null && row[4] !== undefined ? String(row[4]).trim() : null;
    const ingredientEffectOriginal = row[6] !== null && row[6] !== undefined ? String(row[6]).trim() : null;

    const ingredientsOriginal = row[7] !== null && row[7] !== undefined ? String(row[7]).trim() : null;

    const baseEffectOriginal = row[8] !== null && row[8] !== undefined ? String(row[8]).trim() : null;

    const durabilityCell = row[9];
    const durabilityHours = durabilityCell !== null && durabilityCell !== undefined && durabilityCell !== "無"
      ? Number(durabilityCell) || null : null;

    const craftCell = row[10];
    const craftTimeSeconds = craftCell !== null && craftCell !== undefined && craftCell !== "無"
      ? Number(craftCell) || null : null;

    const batteryCell = row[11];
    const merchantBatteryCost = batteryCell !== null && batteryCell !== undefined && batteryCell !== ""
      ? Number(batteryCell) || null : null;

    const recipeUnlockOriginal = row[12] !== null && row[12] !== undefined ? String(row[12]).trim() : null;

    const originalRowNumber = i + 1;

    foodTypeCounts[typeStr] = (foodTypeCounts[typeStr] || 0) + 1;

    const item = normalizeFoodRow({
      typeOriginal: typeStr,
      nameOriginal: nameStr,
      effectOriginal,
      effectPowerOriginal,
      durationOriginal,
      ingredientEffectOriginal,
      ingredientsOriginal,
      baseEffectOriginal,
      durabilityHours,
      craftTimeSeconds,
      merchantBatteryCost,
      recipeUnlockOriginal
    }, originalRowNumber);

    items.push(item);
  }

  const rowCount = items.length;
  console.log(`Data rows: ${rowCount}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`Info rows skipped: ${infoRowsSkipped}`);
  console.log(`Reference section skipped: ${referenceSectionSkipped}`);
  console.log(`Food types: ${JSON.stringify(foodTypeCounts)}`);

  const needsReviewCount = items.filter((i) => i.normalized.needsReview).length;
  const nameTranslationCoverage = items.filter((i) => i.normalized.nameEnglish !== null).length;
  const durationParsedCount = items.filter((i) => i.normalized.durationSeconds !== null && i.normalized.durationOriginal !== null && i.normalized.durationOriginal !== "無").length;
  const parsedBuffCount = items.filter((i) => i.normalized.parsedBuffs.length > 0).length;
  const ingredientParsedCount = items.filter((i) => i.normalized.ingredientsEnglish !== null).length;

  const needsReviewReasons: Record<string, number> = {};
  for (const item of items) {
    for (const reason of item.normalized.reviewReasons) {
      needsReviewReasons[reason] = (needsReviewReasons[reason] || 0) + 1;
    }
  }

  const output = {
    module: "food_buffs" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: "七日世界.xlsx",
    sourceSheetOriginal: "料理" as const,
    sourceSheetEnglish: "Cooking / Food Buffs" as const,
    importedAt: new Date().toISOString(),
    locked: false as const,
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
      layoutType,
      detectedHeaderRow,
      headerConfidence: "high" as const,
      headersOriginal,
      headersEnglishBestEffort,
      rowCount,
      blankRowsSkipped,
      infoRowsSkipped,
      referenceSectionSkipped,
      foodTypeCounts,
      nameTranslationCoverage,
      durationParsedCount,
      parsedBuffCount,
      ingredientParsedCount,
      needsReviewCount,
      needsReviewReasons,
      warnings
    },
    items
  };

  const parsed = foodBuffRawSchema.safeParse(output);
  if (!parsed.success) {
    const errorLines = formatZodError(parsed.error);
    console.error("Schema validation FAILED:");
    errorLines.forEach((line) => console.error(`  ${line}`));
    process.exitCode = 1;
    return;
  }
  console.log("Schema validation: pass");

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "food-buffs.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");
  console.log(`Output written: ${outputPath}`);

  const idSet = new Set<string>();
  let dupCount = 0;
  items.forEach((item) => {
    if (idSet.has(item.normalized.id)) {
      dupCount++;
      console.log(`Duplicate ID: ${item.normalized.id}`);
    }
    idSet.add(item.normalized.id);
  });
  console.log(`Duplicate IDs: ${dupCount}`);

  const needsReviewItems = items.filter((item) => item.normalized.needsReview);
  console.log(`needsReview count: ${needsReviewItems.length}`);

  writeQaReport(output, dupCount, needsReviewItems.length);
  console.log(`Module 9 was not locked.`);
}

function writeQaReport(
  output: Record<string, unknown>,
  duplicateIds: number,
  needsReviewCount: number
): void {
  const items = output.items as FoodBuffItem[];
  const extraction = output.extraction as Record<string, unknown>;

  const foodCount = (extraction.foodTypeCounts as Record<string, number>)["食物"] || 0;
  const drinkCount = (extraction.foodTypeCounts as Record<string, number>)["飲品"] || 0;
  const nameCoverage = extraction.nameTranslationCoverage as number;
  const durationParsed = extraction.durationParsedCount as number;
  const buffParsed = extraction.parsedBuffCount as number;
  const ingredientParsed = extraction.ingredientParsedCount as number;
  const needsReviewReasons = extraction.needsReviewReasons as Record<string, number>;

  const untranslatedNames = items.filter((i) => !i.normalized.nameEnglish).map((i) => i.normalized.nameOriginal);

  const buffStats: Record<string, number> = {};
  for (const item of items) {
    for (const buff of item.normalized.parsedBuffs) {
      buffStats[buff.buffEnglish] = (buffStats[buff.buffEnglish] || 0) + 1;
    }
  }

  const restrictionCounts: Record<string, number> = {};
  for (const item of items) {
    const r = item.normalized.scenarioRestrictionEnglish;
    if (r) {
      restrictionCounts[r] = (restrictionCounts[r] || 0) + 1;
    }
  }

  const qa = [
    "# Module 9 - Cooking / Food Buffs QA",
    "",
    "## Extraction Summary",
    "",
    `- Extraction status: complete`,
    `- Layout type: single_table_two_sections`,
    `- Schema validation: pass`,
    `- Detected sheet: 料理`,
    `- Row count: ${items.length}`,
    `- Food items: ${foodCount}`,
    `- Drink items: ${drinkCount}`,
    `- Blank rows skipped: ${extraction.blankRowsSkipped}`,
    `- Info rows skipped: ${extraction.infoRowsSkipped}`,
    `- Reference section skipped: ${extraction.referenceSectionSkipped}`,
    `- Duplicate ID count: ${duplicateIds}`,
    `- Output: data/extracted/food-buffs.raw.json`,
    "",
    "## Name Translation",
    `- Translated names: ${nameCoverage} / ${items.length}`,
    untranslatedNames.length > 0
      ? `- Untranslated names: ${untranslatedNames.length} — ${untranslatedNames.join(", ")}`
      : "- All names have translations",
    "",
    "## Duration Parsing",
    `- Duration parsed to seconds: ${durationParsed} / ${items.filter((i) => i.normalized.durationOriginal !== null && i.normalized.durationOriginal !== "無").length}`,
    "",
    "## Parsed Buffs",
    `- Items with parsed buffs: ${buffParsed}`,
    `- Items with no parsed buffs: ${items.length - buffParsed}`,
    "",
    "### Buff coverage",
    ...Object.entries(buffStats).sort((a, b) => b[1] - a[1]).map(([buff, count]) => `- ${buff}: ${count}`),
    "",
    "## Ingredients",
    `- Items with ingredient parsing: ${ingredientParsed}`,
    "",
    "## Restrictions",
    Object.keys(restrictionCounts).length > 0
      ? Object.entries(restrictionCounts).map(([r, c]) => `- ${r}: ${c}`).join("\n")
      : "- No scenario restrictions detected",
    "",
    "## Needs Review",
    `- Total items needing review: ${needsReviewCount}`,
    "",
    "### Review reason counts",
    ...Object.entries(needsReviewReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => `- ${reason}: ${count}`),
    "",
    "## Warnings / Gaps",
    `- No item-specific English names applied yet; all nameEnglish is null pending owner review`,
    `- Effect text translation uses partialTranslate only; effectEnglish is null by design`,
    `- Duration parsing handles Stardust Fusion Stove format; other stove variants preserved as original`,
    `- Buff parsing covers common patterns; complex conditional/scaling effects may be missed`,
    `- Ingredient parsing uses partialTranslate without structured splitting`,
    `- No external reference index used for Module 9`,
    "",
    "## Recommendation",
    `Ready for lock review: ${needsReviewCount === 0 && untranslatedNames.length === 0 ? "yes" : "no — needs owner review for untranslated names"}`
  ].join("\n");

  const qaPath = path.join(ROOT_DIR, "docs", "module-9-food-buffs-qa.md");
  fs.writeFileSync(qaPath, qa, "utf8");
  console.log(`QA report written: ${qaPath}`);
}
