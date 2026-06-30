import fs from "node:fs";
import path from "node:path";
import { ingredientRawSchema, formatZodError } from "../schemas/ingredientSchema";
import type { IngredientItem } from "../schemas/ingredientSchema";
import { normalizeIngredientRow } from "../utils/normalizeIngredient";
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

  const detectedSheetName = "食材";
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
    "Category 1", "Category 2", "Category 3", "Category 4", "Ingredient Name",
    "Effect", "Effect Sub", "Notes", "Effect Power", "Effect Duration (min)",
    "Base Satiety", "Base Hydration", "Base Sanity", "Durability (h)"
  ];

  const layoutType = "multi_row_header_category_sections";

  const items: IngredientItem[] = [];
  const warnings: string[] = [];
  let blankRowsSkipped = 0;

  const typeCounts: Record<string, number> = {};

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const nameCell = row[4];
    const catCell = row[0];

    const nameStr = nameCell !== null && nameCell !== undefined ? String(nameCell).trim() : "";
    const catStr = catCell !== null && catCell !== undefined ? String(catCell).trim() : "";

    if (!nameStr && !catStr) {
      blankRowsSkipped++;
      continue;
    }

    if (!nameStr) {
      blankRowsSkipped++;
      continue;
    }

    const effectStr = row[5] !== null && row[5] !== undefined ? String(row[5]).trim() : null;
    const effectPowerStr = row[8] !== null && row[8] !== undefined ? String(row[8]).trim() : null;
    const durationStr = row[9] !== null && row[9] !== undefined ? String(row[9]).trim() : null;
    const notesStr = row[7] !== null && row[7] !== undefined ? String(row[7]).trim() : null;

    const satietyCell = row[10];
    const hydrationCell = row[11];
    const sanityCell = row[12];
    const durabilityCell = row[13];

    const baseSatiety = satietyCell !== null && satietyCell !== undefined && satietyCell !== "無"
      ? Number(satietyCell) || null : null;
    const baseHydration = hydrationCell !== null && hydrationCell !== undefined && hydrationCell !== "無"
      ? Number(hydrationCell) || null : null;
    const baseSanity = sanityCell !== null && sanityCell !== undefined && sanityCell !== "無"
      ? Number(sanityCell) || null : null;
    const durabilityHours = durabilityCell !== null && durabilityCell !== undefined && durabilityCell !== "無"
      ? Number(durabilityCell) || null : null;

    const originalRowNumber = i + 1;

    typeCounts[catStr] = (typeCounts[catStr] || 0) + 1;

    const item = normalizeIngredientRow({
      categoryOriginal: catStr,
      nameOriginal: nameStr,
      effectOriginal: effectStr,
      effectPowerOriginal: effectPowerStr,
      effectDurationOriginal: durationStr,
      notesOriginal: notesStr,
      baseSatiety,
      baseHydration,
      baseSanity,
      durabilityHours,
      originalRowNumber
    });

    items.push(item);
  }

  const rowCount = items.length;
  console.log(`Data rows: ${rowCount}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`Types: ${JSON.stringify(typeCounts)}`);

  const needsReviewCount = items.filter((i) => i.normalized.needsReview).length;
  const nameTranslationCoverage = items.filter((i) => i.normalized.nameEnglish !== null).length;

  const needsReviewReasons: Record<string, number> = {};
  for (const item of items) {
    for (const reason of item.normalized.reviewReasons) {
      needsReviewReasons[reason] = (needsReviewReasons[reason] || 0) + 1;
    }
  }

  const externalMatchCounts: Record<string, number> = {};
  for (const item of items) {
    const m = item.externalReference.matchConfidence;
    externalMatchCounts[m] = (externalMatchCounts[m] || 0) + 1;
  }

  const categoryFlagCounts: Record<string, number> = {};
  for (const item of items) {
    const n = item.normalized;
    if (n.isMeat) categoryFlagCounts["meat"] = (categoryFlagCounts["meat"] || 0) + 1;
    if (n.isFish) categoryFlagCounts["fish"] = (categoryFlagCounts["fish"] || 0) + 1;
    if (n.isDairy) categoryFlagCounts["dairy"] = (categoryFlagCounts["dairy"] || 0) + 1;
    if (n.isEgg) categoryFlagCounts["egg"] = (categoryFlagCounts["egg"] || 0) + 1;
    if (n.isSeasoning) categoryFlagCounts["seasoning"] = (categoryFlagCounts["seasoning"] || 0) + 1;
    if (n.isHerb) categoryFlagCounts["herb"] = (categoryFlagCounts["herb"] || 0) + 1;
    if (n.isDeviated) categoryFlagCounts["deviated"] = (categoryFlagCounts["deviated"] || 0) + 1;
    if (n.isGrafted) categoryFlagCounts["grafted"] = (categoryFlagCounts["grafted"] || 0) + 1;
    if (n.isContaminated) categoryFlagCounts["contaminated"] = (categoryFlagCounts["contaminated"] || 0) + 1;
    if (n.isCrop) categoryFlagCounts["crop"] = (categoryFlagCounts["crop"] || 0) + 1;
    if (n.isFoodItem) categoryFlagCounts["food"] = (categoryFlagCounts["food"] || 0) + 1;
    if (n.isDrinkItem) categoryFlagCounts["drink"] = (categoryFlagCounts["drink"] || 0) + 1;
  }

  const output = {
    module: "ingredients" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: "七日世界.xlsx",
    sourceSheetOriginal: "食材" as const,
    sourceSheetEnglish: "Ingredients" as const,
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
      typeCounts,
      nameTranslationCoverage,
      categoryFlagCounts,
      externalMatchCounts,
      needsReviewCount,
      needsReviewReasons,
      warnings
    },
    items
  };

  const parsed = ingredientRawSchema.safeParse(output);
  if (!parsed.success) {
    const errorLines = formatZodError(parsed.error);
    console.error("Schema validation FAILED:");
    errorLines.forEach((line) => console.error(`  ${line}`));
    process.exitCode = 1;
    return;
  }
  console.log("Schema validation: pass");

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "ingredients.raw.json");
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
  if (needsReviewItems.length > 0) {
    console.log("Items needing review:");
    needsReviewItems.forEach((item) => {
      console.log(`  ${item.normalized.nameOriginal} (${item.normalized.reviewReasons.join(", ")})`);
    });
  }

  writeQaReport(output, dupCount);
  console.log(`Module 11: Ingredients — no verified file created.`);
}

function writeQaReport(
  output: Record<string, unknown>,
  duplicateIds: number
): void {
  const items = output.items as IngredientItem[];
  const extraction = output.extraction as Record<string, unknown>;

  const nameCoverage = extraction.nameTranslationCoverage as number;
  const needsReviewCount = extraction.needsReviewCount as number;
  const needsReviewReasons = extraction.needsReviewReasons as Record<string, number>;
  const extMatchCounts = extraction.externalMatchCounts as Record<string, number>;
  const typeCounts = extraction.typeCounts as Record<string, number>;
  const catFlags = extraction.categoryFlagCounts as Record<string, number>;

  const unmatchedNames = items
    .filter((i) => !i.normalized.nameEnglish)
    .map((i) => i.normalized.nameOriginal);

  const qa = [
    "# Module 11 — Ingredients Import QA",
    "",
    "## Extraction Summary",
    "",
    `- Extraction status: complete`,
    `- Layout type: multi_row_header_category_sections`,
    `- Schema validation: pass`,
    `- Detected sheet: 食材`,
    `- Row count: ${items.length}`,
    `- Blank rows skipped: ${extraction.blankRowsSkipped}`,
    `- Duplicate ID count: ${duplicateIds}`,
    `- Output: data/extracted/ingredients.raw.json`,
    "",
    "## Ingredient Types",
    ...Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- ${t}: ${c}`),
    "",
    "## Name Translation",
    `- Translated names: ${nameCoverage} / ${items.length}`,
    unmatchedNames.length > 0
      ? `- Untranslated names: ${unmatchedNames.length} — ${unmatchedNames.join(", ")}`
      : "- All names have translations",
    "",
    "## Category Flags",
    ...Object.entries(catFlags).sort((a, b) => b[1] - a[1]).map(([f, c]) => `- ${f}: ${c}`),
    "",
    "## External Reference Match",
    ...Object.entries(extMatchCounts).sort((a, b) => b[1] - a[1]).map(([m, n]) => `- ${m}: ${n}`),
    "",
    "## Needs Review",
    `- Total items needing review: ${needsReviewCount}`,
    "",
    "### Review reason counts",
    ...Object.entries(needsReviewReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => `- ${reason}: ${count}`),
    "",
    "## Unmatched Names (need owner review)",
    unmatchedNames.length > 0
      ? unmatchedNames.map((n) => `- ${n}`).join("\n")
      : "- None",
    "",
    "## Warnings / Gaps",
    `- ${unmatchedNames.length} ingredient names have no known English equivalent; left null pending owner review`,
    `- Effect text uses partialTranslate only; full English effect is null by design`,
    `- Creative cooking scaling columns (levels 1-5) not extracted`,
    `- Some rich-text cells in effect column may have incomplete extraction`,
    `- External reference (foodlist.normalized.json) used as candidate only — not authoritative`,
    "",
    "## Recommendation",
    `Ready for lock review: ${needsReviewCount === 0 && unmatchedNames.length === 0 ? "yes" : "no — needs owner review for unmatched names"}`
  ].join("\n");

  const qaPath = path.join(ROOT_DIR, "docs", "module-11-ingredients-qa.md");
  fs.writeFileSync(qaPath, qa, "utf8");
  console.log(`QA report written: ${qaPath}`);
}
