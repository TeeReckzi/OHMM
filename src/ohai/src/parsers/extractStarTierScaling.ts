import fs from "node:fs";
import path from "node:path";
import { openWorkbook, readSheetAsMatrix, listSheetNames, ensureDataFolders } from "../utils/workbook";
import { formatZodError, starTierScalingRawSchema } from "../schemas/starTierScalingSchema";
import { normalizeStarTierRow } from "../utils/normalizeStarTierScaling";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";
const SOURCE_ORIGINAL_NAME = "七日世界";
const SOURCE_SHEET_ORIGINAL = "武器防具星級";
const SOURCE_SHEET_ENGLISH = "Weapon & Armor Stars";
const ROOT_DIR = path.resolve(__dirname, "..", "..");

type BlockSpec = {
  blockId: string;
  blockType: "armor_star_up_materials" | "weapon_star_up_materials" | "armor_quality_scaling" | "max_stat_reference";
  blockTitleOriginal: string | null;
  blockTitleEnglish: string | null;
  startRow: number;
  endRow: number;
  headerRow: number | null;
  headerRows: number[];
  dataRows: number[];
  headerConfidence: "high" | "medium" | "low" | "none";
  warnings: string[];
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  ensureDataFolders(ROOT_DIR);

  const sourcePath = path.join(ROOT_DIR, "data", "raw", "七日世界.xlsx");
  const workbook = await openWorkbook(sourcePath);
  const sheetNames = listSheetNames(workbook);

  console.log(`Detected workbook: ${path.basename(sourcePath)}`);
  console.log(`Workbook sheet count: ${sheetNames.length}`);

  const detectedSheetName = detectSheetName(sheetNames);
  if (!detectedSheetName) {
    console.log("No star/tier sheet was found.");
    console.log(`Sheet names: ${sheetNames.join(", ")}`);
    return;
  }

  console.log(`Detected sheet: ${detectedSheetName}`);

  const rows = readSheetAsMatrix(workbook, detectedSheetName);
  const blankRowsSkipped = countBlankRows(rows);
  const blockSpecs = buildBlockSpecs(rows);

  const blocks = blockSpecs.map((spec) => buildBlock(sourcePath, detectedSheetName, rows, spec));
  const extractedRows = blocks.flatMap((block) => block.rows);

  const output = {
    module: "star_tier_scaling" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: path.basename(sourcePath),
    sourceSheetOriginal: SOURCE_SHEET_ORIGINAL,
    sourceSheetEnglish: SOURCE_SHEET_ENGLISH,
    importedAt: new Date().toISOString(),
    locked: false,
    confidence: "B_pending_verification" as const,
    languagePolicy: {
      projectLanguage: "English" as const,
      preserveOriginalSourceValues: true as const,
      originalValuesLocation: "blocks[].rows[].original" as const,
      normalizedEnglishValuesLocation: "blocks[].rows[].normalized" as const
    },
    workbook: {
      detectedWorkbookPath: sourcePath,
      sheetCount: sheetNames.length,
      sheetNamesOriginal: sheetNames,
      sheetNamesEnglish: sheetNames.map((name) => (name === detectedSheetName ? SOURCE_SHEET_ENGLISH : name))
    },
    extraction: {
      detectedSheetName,
      layoutType: "multi_block" as const,
      detectedBlocks: blocks.length,
      rowCount: extractedRows.length,
      blankRowsSkipped,
      warnings: [...new Set(blocks.flatMap((block) => block.warnings))]
    },
    blocks
  };

  const parsed = starTierScalingRawSchema.safeParse(output);
  if (!parsed.success) {
    console.error("Schema validation FAILED:");
    for (const line of formatZodError(parsed.error)) console.error(`- ${line}`);
    return;
  }

  console.log("Schema validation: pass");

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "star-tier-scaling.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");

  const duplicateIds = countDuplicates(extractedRows.map((row) => row.normalized.id));
  console.log(`Output written: ${outputPath}`);
  console.log(`Detected blocks: ${blocks.length}`);
  console.log(`Rows extracted: ${extractedRows.length}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`Duplicate ID count: ${duplicateIds}`);
  console.log(`Warnings: ${output.extraction.warnings.length ? output.extraction.warnings.join(" | ") : "none"}`);
  console.log("Module 7 was not locked.");

  writeQaReport(ROOT_DIR, parsed.data, duplicateIds, outputPath, blocks.length, blankRowsSkipped, rows.length);
}

function detectSheetName(sheetNames: string[]): string | null {
  const exact = sheetNames.find((name) => name === SOURCE_SHEET_ORIGINAL);
  if (exact) return exact;

  const aliases = ["武器防具星級", "星級", "武器星級", "防具星級", "tier", "tiers", "star", "stars", "blueprint", "blueprint stars", "weapon armor stars"];
  for (const alias of aliases) {
    const hit = sheetNames.find((name) => simplify(name).includes(simplify(alias)) || simplify(alias).includes(simplify(name)));
    if (hit) return hit;
  }
  return null;
}

function buildBlockSpecs(rows: unknown[][]): BlockSpec[] {
  const specs: BlockSpec[] = [];
  specs.push({ blockId: "armor-star-up-materials", blockType: "armor_star_up_materials", blockTitleOriginal: "防具升星星之彩", blockTitleEnglish: "Armor Star-Up Materials", startRow: 1, endRow: 3, headerRow: 2, headerRows: [2], dataRows: [3], headerConfidence: "high", warnings: [] });
  specs.push({ blockId: "weapon-star-up-materials", blockType: "weapon_star_up_materials", blockTitleOriginal: "武器升星星之彩", blockTitleEnglish: "Weapon Star-Up Materials", startRow: 4, endRow: 6, headerRow: 5, headerRows: [5], dataRows: [6], headerConfidence: "high", warnings: [] });
  specs.push({ blockId: "max-stat-reference", blockType: "max_stat_reference", blockTitleOriginal: null, blockTitleEnglish: "T5 Reference Matrix", startRow: 11, endRow: 18, headerRow: 11, headerRows: [11], dataRows: [12, 13, 14, 15, 16, 17, 18], headerConfidence: "medium", warnings: ["Mixed reference table preserved conservatively."] });

  const armorTitles = [
    { row: 20, title: "T5面具", english: "T5 Mask" },
    { row: 27, title: "T5頭盔", english: "T5 Helmet" },
    { row: 34, title: "T5褲子", english: "T5 Bottoms" },
    { row: 41, title: "T5手套", english: "T5 Gloves" },
    { row: 48, title: "T5衣服", english: "T5 Top" },
    { row: 55, title: "T5鞋子", english: "T5 Shoes" }
  ];

  for (const title of armorTitles) {
    specs.push({
      blockId: simplify(title.title),
      blockType: "armor_quality_scaling",
      blockTitleOriginal: title.title,
      blockTitleEnglish: title.english,
      startRow: title.row,
      endRow: title.row + 6,
      headerRow: title.row + 1,
      headerRows: [title.row + 1, title.row + 2],
      dataRows: [title.row + 3, title.row + 4, title.row + 5, title.row + 6],
      headerConfidence: "high",
      warnings: []
    });
  }

  return specs;
}

function buildBlock(sourcePath: string, detectedSheetName: string, rows: unknown[][], spec: BlockSpec) {
  const headerRows = spec.headerRows.map((rowNumber) => rows[rowNumber - 1] ?? []);
  const headersOriginal = headerRows.flatMap((row) => row.map((cell) => asText(cell)).filter(Boolean) as string[]);
  const headersEnglishBestEffort = headersOriginal.map((header) => bestEffortEnglish(header));

  const blockRows = spec.dataRows.map((rowNumber) => {
    const row = rows[rowNumber - 1] ?? [];
    const rowLabel = firstNonEmpty(row);
    const rowValues = row.map((value, index) => ({
      column: index + 1,
      headerOriginal: headersOriginal[index] ?? null,
      value
    }));
    const normalized = normalizeStarTierRow({
      blockType: spec.blockType,
      blockTitleOriginal: spec.blockTitleOriginal,
      rowLabelOriginal: rowLabel,
      rowValues,
      headersOriginal,
      originalRowNumber: rowNumber
    });

    return {
      sourceId: SOURCE_ID,
      sourceSheetOriginal: detectedSheetName,
      sourceSheetEnglish: SOURCE_SHEET_ENGLISH,
      originalRowNumber: rowNumber,
      locked: false as const,
      confidence: "B_pending_verification" as const,
      original: {
        rowNumber,
        blockTitleOriginal: spec.blockTitleOriginal,
        headersOriginal,
        cells: rowValues.map((cell) => ({
          column: cell.column,
          headerOriginal: cell.headerOriginal,
          valueOriginal: cell.value
        }))
      },
      normalized
    };
  });

  return {
    blockId: spec.blockId,
    blockType: spec.blockType,
    blockTitleOriginal: spec.blockTitleOriginal,
    blockTitleEnglish: spec.blockTitleEnglish,
    startRow: spec.startRow,
    endRow: spec.endRow,
    headerRow: spec.headerRow,
    headerConfidence: spec.headerConfidence,
    headersOriginal,
    headersEnglishBestEffort,
    rows: blockRows,
    warnings: spec.warnings
  };
}

function writeQaReport(
  rootDir: string,
  data: unknown,
  duplicateIds: number,
  outputPath: string,
  detectedBlocks: number,
  blankRowsSkipped: number,
  totalRows: number
): void {
  const parsed = data as { blocks: Array<{ blockId: string; blockType: string; blockTitleOriginal: string | null; startRow: number; endRow: number; headerConfidence: string; warnings: string[]; rows: Array<{ normalized: { category: string; starLevelOriginal: string | null; tierOriginal: string | null; statEnglish: string | null; valueParsed: number | null; valueOriginal: string | number | null; scalingType: string; } }> }> };
  const rows = parsed.blocks.flatMap((block) => block.rows.map((row) => row.normalized));
  const categoryCounts = countBy(rows.map((row) => row.category));
  const starLevels = [...new Set(rows.map((row) => row.starLevelOriginal).filter(Boolean) as string[])].sort();
  const tiers = [...new Set(rows.map((row) => row.tierOriginal).filter(Boolean) as string[])].sort();
  const statTerms = [...new Set(rows.map((row) => row.statEnglish).filter(Boolean) as string[])].sort();
  const parsedValues = rows.filter((row) => row.valueParsed !== null).length;
  const unparsedValues = rows.filter((row) => row.valueParsed === null).length;

  const qa = [
    "# Module 7 - Star / Tier Scaling QA",
    "",
    `- Extraction status: complete`,
    `- Schema validation: pass`,
    `- Detected sheet: ${SOURCE_SHEET_ORIGINAL}`,
    `- Layout type: multi_block`,
    `- Row count: ${rows.length}`,
    `- Blank rows skipped: ${blankRowsSkipped}`,
    `- Detected blocks: ${detectedBlocks}`,
    `- Duplicate ID count: ${duplicateIds}`,
    `- Output: ${outputPath}`,
    "",
    "## Block List",
    "",
    "| blockId | blockType | title | startRow | endRow | rowCount | headerConfidence |",
    "|---|---|---|---:|---:|---:|---|",
    ...parsed.blocks.map((block) => `| ${block.blockId} | ${block.blockType} | ${block.blockTitleOriginal ?? ""} | ${block.startRow} | ${block.endRow} | ${block.rows.length} | ${block.headerConfidence} |`),
    "",
    "## Counts",
    "",
    `- Category counts: ${formatCounts(categoryCounts)}`,
    `- Star levels detected: ${starLevels.join(", ") || "none"}`,
    `- Tier values detected: ${tiers.join(", ") || "none"}`,
    `- Stat terms translated: ${statTerms.join(", ") || "none"}`,
    `- Parsed values: ${parsedValues}`,
    `- Unparsed values: ${unparsedValues}`,
    "",
    "## Warnings",
    "",
    ...collectWarnings(parsed.blocks),
    "",
    "## Recommendation",
    "",
    "Ready for lock review"
  ].join("\n");

  fs.writeFileSync(path.join(rootDir, "docs", "module-7-star-tier-scaling-qa.md"), qa, "utf8");
}

function countBlankRows(rows: unknown[][]): number {
  return rows.filter((row) => row.every((cell) => cell === null || cell === undefined || cell === "")).length;
}

function countDuplicates(values: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const value of values) {
    if (seen.has(value)) duplicates += 1;
    seen.add(value);
  }
  return duplicates;
}

function countBy(values: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return result;
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts).map(([key, value]) => `${key}: ${value}`).join(", ") || "none";
}

function collectWarnings(blocks: Array<{ warnings: string[] }>): string[] {
  const warnings = blocks.flatMap((block) => block.warnings);
  return warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- none"];
}

function firstNonEmpty(row: unknown[]): string | null {
  for (const cell of row) {
    const text = asText(cell);
    if (text) return text;
  }
  return null;
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function bestEffortEnglish(value: string): string {
  const map: Record<string, string> = {
    "星級": "Star Level",
    "經驗": "Experience",
    "生命值": "HP",
    "超感強度": "Super Anomaly Strength",
    "T5汙染抗性": "T5 Pollution Resist",
    "完美": "Perfect",
    "卓越": "Excellent",
    "精良": "Rare",
    "一般": "Common",
    "面具": "Mask",
    "頭盔": "Helmet",
    "衣服": "Top",
    "手套": "Gloves",
    "褲子": "Bottoms",
    "鞋子": "Shoes",
    "合計": "Total"
  };
  return map[value] ?? value;
}

function simplify(value: string): string {
  return value.replace(/[\s\-_/()（）·.]+/g, "").toLowerCase();
}
