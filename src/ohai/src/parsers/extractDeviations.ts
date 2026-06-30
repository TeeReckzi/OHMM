import fs from "node:fs";
import path from "node:path";
import { deviationRawSchema, formatZodError } from "../schemas/deviationSchema";
import type { DeviationItem } from "../schemas/deviationSchema";
import { normalizeDeviationRow } from "../utils/normalizeDeviation";
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

  const detectedSheetName = "異常物";
  if (!sheetNames.includes(detectedSheetName)) {
    console.log(`Sheet "${detectedSheetName}" not found.`);
    console.log("Available sheets:", sheetNames.join(", "));
    return;
  }
  console.log(`Detected sheet: ${detectedSheetName}`);

  const rows = readSheetAsMatrix(workbook, detectedSheetName);
  console.log(`Total rows read: ${rows.length}`);

  const detectedHeaderRow = 9;
  const headersOriginal: string[] = [];
  if (rows.length >= detectedHeaderRow && Array.isArray(rows[detectedHeaderRow - 1])) {
    const headerRow = rows[detectedHeaderRow - 1] as unknown[];
    headerRow.forEach((cell) => {
      headersOriginal.push(cell !== null && cell !== undefined ? String(cell).replace(/\n/g, " ") : "");
    });
  }

  const headersEnglishBestEffort: string[] = [
    "Name", "Ability / Skill", "Notes", "Eternal Dream", "Sky Touch", "Branch Path", "Way of Winter", "Padding"
  ];

  const layoutType = "two_row_header_category_sections";

  const items: DeviationItem[] = [];
  const warnings: string[] = [];
  let blankRowsSkipped = 0;
  let infoRowsSkipped = 0;
  let categoryCount = 0;

  const deviationTypeCounts: Record<string, number> = {};
  let currentCategory = "";

  const dataStartRow = 10;
  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const nameCell = row[0];
    const abilityCell = row[1];
    const notesCell = row[2];
    const scenarioEternalCell = row[3];
    const scenarioSkyCell = row[4];
    const scenarioBranchCell = row[5];
    const scenarioWinterCell = row[6];

    const nameStr = nameCell !== null && nameCell !== undefined ? String(nameCell).trim() : "";
    const abilityStr = abilityCell !== null && abilityCell !== undefined ? String(abilityCell).trim() : "";
    const notesStr = notesCell !== null && notesCell !== undefined ? String(notesCell).trim() : "";

    if (!nameStr && !abilityStr) {
      blankRowsSkipped++;
      continue;
    }

    if (nameStr === "戰鬥型" || nameStr === "造物型" || nameStr === "領地型") {
      currentCategory = nameStr;
      categoryCount++;
      continue;
    }

    if (!nameStr) {
      blankRowsSkipped++;
      continue;
    }

    const sourceStr = buildSourceString(scenarioEternalCell, scenarioSkyCell, scenarioBranchCell, scenarioWinterCell);

    deviationTypeCounts[currentCategory] = (deviationTypeCounts[currentCategory] || 0) + 1;

    const item = normalizeDeviationRow({
      nameOriginal: nameStr,
      abilityOriginal: abilityStr || null,
      notesOriginal: notesStr || null,
      sourceOriginal: sourceStr || null,
      categoryOriginal: currentCategory,
      scenarioEternalDream: scenarioEternalCell !== null && scenarioEternalCell !== undefined ? String(scenarioEternalCell).trim() : null,
      scenarioSkyTouch: scenarioSkyCell !== null && scenarioSkyCell !== undefined ? String(scenarioSkyCell).trim() : null,
      scenarioBranchPath: scenarioBranchCell !== null && scenarioBranchCell !== undefined ? String(scenarioBranchCell).trim() : null,
      scenarioWayOfWinter: scenarioWinterCell !== null && scenarioWinterCell !== undefined ? String(scenarioWinterCell).trim() : null
    }, i + 1);

    items.push(item);
  }

  const rowCount = items.length;
  console.log(`Data rows: ${rowCount}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`Info rows skipped: ${infoRowsSkipped}`);
  console.log(`Category count: ${categoryCount}`);
  console.log(`Deviation types: ${JSON.stringify(deviationTypeCounts)}`);

  const needsReviewCount = items.filter((i) => i.normalized.needsReview).length;
  const nameTranslationCoverage = items.filter((i) => i.normalized.nameEnglish !== null).length;
  const parsedEffectCount = items.filter((i) => i.normalized.parsedEffects.length > 0).length;
  const variantCount = items.filter((i) => i.normalized.isVariant).length;
  const baseDeviationCount = items.filter((i) => !i.normalized.isVariant).length;

  const needsReviewReasons: Record<string, number> = {};
  for (const item of items) {
    for (const reason of item.normalized.reviewReasons) {
      needsReviewReasons[reason] = (needsReviewReasons[reason] || 0) + 1;
    }
  }

  const combatRelevanceCounts: Record<string, number> = {};
  for (const item of items) {
    const c = item.normalized.combatRelevance;
    combatRelevanceCounts[c] = (combatRelevanceCounts[c] || 0) + 1;
  }

  const externalMatchCounts: Record<string, number> = {};
  for (const item of items) {
    const m = item.externalReference.matchConfidence;
    externalMatchCounts[m] = (externalMatchCounts[m] || 0) + 1;
  }

  const output = {
    module: "deviations" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: "七日世界.xlsx",
    sourceSheetOriginal: "異常物" as const,
    sourceSheetEnglish: "Deviations" as const,
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
      categoryCount,
      deviationTypeCounts,
      nameTranslationCoverage,
      variantCount,
      baseDeviationCount,
      combatRelevanceCounts,
      externalMatchCounts,
      parsedEffectCount,
      needsReviewCount,
      needsReviewReasons,
      warnings
    },
    items
  };

  const parsed = deviationRawSchema.safeParse(output);
  if (!parsed.success) {
    const errorLines = formatZodError(parsed.error);
    console.error("Schema validation FAILED:");
    errorLines.forEach((line) => console.error(`  ${line}`));
    process.exitCode = 1;
    return;
  }
  console.log("Schema validation: pass");

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "deviations.raw.json");
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
  console.log(`Module 10: Deviations — no verified file created.`);
}

function buildSourceString(
  eternal: unknown,
  sky: unknown,
  branch: unknown,
  winter: unknown
): string | null {
  const parts: string[] = [];
  const addIfPresent = (cell: unknown, scenarioName: string) => {
    if (cell !== null && cell !== undefined) {
      const str = String(cell).trim();
      if (str) parts.push(`${scenarioName}: ${str}`);
    }
  };
  addIfPresent(eternal, "Eternal Dream");
  addIfPresent(sky, "Sky Touch");
  addIfPresent(branch, "Branch Path");
  addIfPresent(winter, "Way of Winter");
  return parts.length > 0 ? parts.join("\n") : null;
}

function writeQaReport(
  output: Record<string, unknown>,
  duplicateIds: number
): void {
  const items = output.items as DeviationItem[];
  const extraction = output.extraction as Record<string, unknown>;

  const nameCoverage = extraction.nameTranslationCoverage as number;
  const effectParsed = extraction.parsedEffectCount as number;
  const needsReviewCount = extraction.needsReviewCount as number;
  const needsReviewReasons = extraction.needsReviewReasons as Record<string, number>;
  const variantCount = extraction.variantCount as number;
  const baseCount = extraction.baseDeviationCount as number;
  const combatRelCounts = extraction.combatRelevanceCounts as Record<string, number>;
  const extMatchCounts = extraction.externalMatchCounts as Record<string, number>;
  const typeCounts = extraction.deviationTypeCounts as Record<string, number>;

  const unmatchedNames = items
    .filter((i) => !i.normalized.nameEnglish)
    .map((i) => i.normalized.nameOriginal);

  const qa = [
    "# Module 10 — Deviations Import QA",
    "",
    "## Extraction Summary",
    "",
    `- Extraction status: complete`,
    `- Layout type: two_row_header_category_sections`,
    `- Schema validation: pass`,
    `- Detected sheet: 異常物`,
    `- Row count: ${items.length}`,
    `- Category count: ${extraction.categoryCount}`,
    `- Blank rows skipped: ${extraction.blankRowsSkipped}`,
    `- Info rows skipped: ${extraction.infoRowsSkipped}`,
    `- Duplicate ID count: ${duplicateIds}`,
    `- Output: data/extracted/deviations.raw.json`,
    "",
    "## Deviation Types",
    ...Object.entries(typeCounts).map(([t, c]) => `- ${t}: ${c}`),
    "",
    "## Name Translation",
    `- Translated names: ${nameCoverage} / ${items.length}`,
    unmatchedNames.length > 0
      ? `- Untranslated names: ${unmatchedNames.length} — ${unmatchedNames.join(", ")}`
      : "- All names have translations",
    "",
    "## Variants",
    `- Base deviations: ${baseCount}`,
    `- Variants (skins/scenario): ${variantCount}`,
    "",
    "## Combat Relevance",
    ...Object.entries(combatRelCounts).sort((a, b) => b[1] - a[1]).map(([c, n]) => `- ${c}: ${n}`),
    "",
    "## External Reference Match",
    ...Object.entries(extMatchCounts).sort((a, b) => b[1] - a[1]).map(([m, n]) => `- ${m}: ${n}`),
    "",
    "## Parsed Effects",
    `- Items with parsed effects: ${effectParsed}`,
    `- Items with no parsed effects: ${items.length - effectParsed}`,
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
    `- ${unmatchedNames.length} deviation names have no known English equivalent; left null pending owner review`,
    `- Effect text translation uses partialTranslate only; full English effect is null by design`,
    `- Parsed effects cover common combat/stat terms; non-buff utility effects not matched`,
    `- External reference (deviationlist.normalized.json) used as candidate only — not authoritative`,
    `- Variant/base distinction uses " · " separator in Chinese name; may need refinement`,
    "",
    "## Recommendation",
    `Ready for lock review: ${needsReviewCount === 0 && unmatchedNames.length === 0 ? "yes" : "no — needs owner review for unmatched names"}`
  ].join("\n");

  const qaPath = path.join(ROOT_DIR, "docs", "module-10-deviations-qa.md");
  fs.writeFileSync(qaPath, qa, "utf8");
  console.log(`QA report written: ${qaPath}`);
}
