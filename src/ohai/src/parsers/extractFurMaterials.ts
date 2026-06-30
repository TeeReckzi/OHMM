import fs from "node:fs";
import path from "node:path";
import { furMaterialRawSchema, formatZodError } from "../schemas/furMaterialSchema";
import type { FurMaterialItem } from "../schemas/furMaterialSchema";
import { normalizeFurRow, parseStatsFromText } from "../utils/normalizeFurMaterial";
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

  const detectedSheetName = "毛皮";
  if (!sheetNames.includes(detectedSheetName)) {
    console.log(`Sheet "${detectedSheetName}" not found.`);
    console.log("Available sheets:", sheetNames.join(", "));
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

  const headersEnglishBestEffort: string[] = [
    "Fur Name",
    "Helmet (2-3 Fur)",
    "Top, Pants (3-4 Fur)",
    "Gloves (2-3 Fur)",
    "Shoes (2-3 Fur)",
    "Mask (2-3 Fur)"
  ];
  const headerConfidence = "high" as const;

  const externalRefPath = path.join(ROOT_DIR, "data", "extracted", "external-references", "external-reference-index.raw.json");
  let externalRefIndex: { id: string; englishName: string; generatedSlug: string; sourceSlug: string | null; sourceUrlBase: string | null; canonicalSourceUrl: string | null }[] = [];
  if (fs.existsSync(externalRefPath)) {
    try {
      const extRefRaw = JSON.parse(fs.readFileSync(externalRefPath, "utf8"));
      if (extRefRaw.references && Array.isArray(extRefRaw.references)) {
        externalRefIndex = extRefRaw.references.map((r: { id: string; englishName: string; generatedSlug: string; sourceSlug: string | null; sourceUrlBase: string | null; canonicalSourceUrl: string | null }) => ({
          id: r.id ?? "",
          englishName: r.englishName ?? "",
          generatedSlug: r.generatedSlug ?? "",
          sourceSlug: r.sourceSlug ?? null,
          sourceUrlBase: r.sourceUrlBase ?? null,
          canonicalSourceUrl: r.canonicalSourceUrl ?? null
        }));
      }
      console.log(`External references loaded: ${externalRefIndex.length}`);
    } catch {
      console.log("Warning: Could not parse external references index.");
    }
  } else {
    console.log("Warning: External references index not found.");
  }

  const items: FurMaterialItem[] = [];
  const warnings: string[] = [];
  let blankRowsSkipped = 0;

  for (let i = detectedHeaderRow; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const nameCell = row[0];
    if (nameCell === null || nameCell === undefined || String(nameCell).trim() === "") {
      blankRowsSkipped++;
      continue;
    }

    const nameOriginal = String(nameCell).trim();
    const effectTexts: (string | null)[] = [null, null, null, null, null, null];
    for (let c = 1; c <= 5; c++) {
      const cell = row[c];
      effectTexts[c] = cell !== null && cell !== undefined ? String(cell).trim() : null;
    }

    const originalRowNumber = i + 1;
    const furItems = normalizeFurRow(nameOriginal, effectTexts, originalRowNumber, externalRefIndex);
    items.push(...furItems);
  }

  const rowCount = items.length;
  console.log(`Data rows (items): ${rowCount}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);

  const externalReferenceMatches = items.filter((i) => i.externalReference.matched).length;
  const needsReviewCount = items.filter((i) => i.normalized.needsReview).length;
  const generatedUrlCount = items.filter((i) => i.externalReference.generatedSlug !== null).length;
  const canonicalSourceUrlCount = items.filter((i) => i.externalReference.canonicalSourceUrl !== null).length;
  const sourceSlugMissingCount = items.filter(
    (i) => i.externalReference.matched && i.externalReference.sourceSlug === null
  ).length;

  const slotCoverage: Record<string, number> = {};
  const qualityCoverage: Record<string, number> = {};
  const needsReviewReasons: Record<string, number> = {};
  const parsedStatsByStat: Record<string, number> = {};
  let rowsWithParsedStats = 0;
  let rowsNoParsedStats = 0;
  let totalParsedEntries = 0;

  for (const item of items) {
    const slot = item.normalized.targetGearSlotEnglish;
    slotCoverage[slot] = (slotCoverage[slot] || 0) + 1;
    const q = item.normalized.qualityEnglish ?? "unknown";
    qualityCoverage[q] = (qualityCoverage[q] || 0) + 1;

    for (const reason of item.normalized.reviewReasons) {
      needsReviewReasons[reason] = (needsReviewReasons[reason] || 0) + 1;
    }

    if (item.normalized.parsedStats.length > 0) {
      rowsWithParsedStats++;
      totalParsedEntries += item.normalized.parsedStats.length;
      for (const ps of item.normalized.parsedStats) {
        parsedStatsByStat[ps.statEnglish] = (parsedStatsByStat[ps.statEnglish] || 0) + 1;
      }
    } else {
      rowsNoParsedStats++;
    }
  }

  const uniqueUnmatchedNames = new Set(
    items.filter((i) => i.normalized.needsReview).map((i) => i.normalized.nameOriginal)
  );

  const output = {
    module: "fur_materials" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: "七日世界.xlsx",
    sourceSheetOriginal: "毛皮" as const,
    sourceSheetEnglish: "Fur / Armor Crafting Materials" as const,
    importedAt: new Date().toISOString(),
    locked: false as const,
    confidence: "B_pending_verification" as const,
    languagePolicy: {
      projectLanguage: "English" as const,
      preserveOriginalSourceValues: true as const,
      originalValuesLocation: "items[].original" as const,
      normalizedEnglishValuesLocation: "items[].normalized" as const,
      externalReferenceLocation: "items[].externalReference" as const
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
      rowCount,
      blankRowsSkipped,
      externalReferenceMatches,
      generatedUrlCount,
      canonicalSourceUrlCount,
      sourceSlugMissingCount,
      slotCoverage,
      qualityCoverage,
      needsReviewCount,
      needsReviewReasons,
      parsedStatsCoverage: {
        rowsWithParsedStats,
        rowsNoParsedStats,
        totalEntries: totalParsedEntries,
        byStat: parsedStatsByStat
      },
      unmatchedUniqueFurCount: uniqueUnmatchedNames.size,
      warnings
    },
    items
  };

  const parsed = furMaterialRawSchema.safeParse(output);
  if (!parsed.success) {
    const errorLines = formatZodError(parsed.error);
    console.error("Schema validation FAILED:");
    errorLines.forEach((line) => console.error(`  ${line}`));
    process.exitCode = 1;
    return;
  }
  console.log("Schema validation: pass");

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "fur-materials.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");
  console.log(`Output written: ${outputPath}`);

  const idSet = new Set<string>();
  let dupCount = 0;
  items.forEach((item) => {
    if (idSet.has(item.normalized.id)) {
      dupCount++;
    }
    idSet.add(item.normalized.id);
  });
  console.log(`Duplicate IDs: ${dupCount}`);

  const needsReviewItems = items.filter((item) => item.normalized.needsReview);
  console.log(`needsReview count: ${needsReviewItems.length}`);
  if (needsReviewItems.length > 0) {
    console.log(`Unique names needing review: ${uniqueUnmatchedNames.size}`);
  }

  writeUnmatchedReviewDoc(items, uniqueUnmatchedNames);
  writeQaReport(output, dupCount, needsReviewItems.length, externalRefIndex.length, totalParsedEntries, parsedStatsByStat, needsReviewReasons);
  console.log(`Module 8 was not locked.`);
}

function writeUnmatchedReviewDoc(
  items: FurMaterialItem[],
  unmatchedNames: Set<string>
): void {
  const lines: string[] = [
    "# Module 8 - Unmatched Fur Name Review",
    "",
    `Total unique fur/hide names: ${new Set(items.map((i) => i.normalized.nameOriginal)).size}`,
    `Unique names needing review: ${unmatchedNames.size}`,
    `Total items needing review: ${items.filter((i) => i.normalized.needsReview).length}`,
    "",
    "---",
    ""
  ];

  const nameOriginalToItems = new Map<string, FurMaterialItem[]>();
  for (const item of items) {
    const key = item.normalized.nameOriginal;
    if (!nameOriginalToItems.has(key)) nameOriginalToItems.set(key, []);
    nameOriginalToItems.get(key)!.push(item);
  }

  const sortedNames = [...unmatchedNames].sort();
  for (const name of sortedNames) {
    const sampleItems = nameOriginalToItems.get(name) || [];
    const rowCount = sampleItems.length;
    const sample = sampleItems[0];

    const isEndgame = sample.normalized.reviewReasons.includes("ambiguous_endgame_event_fur");
    const hasRef = sample.externalReference.matched;
    const nameEnglish = sample.normalized.nameEnglish;
    const reasons = sample.normalized.reviewReasons.filter((r) => r !== "quality_missing_from_source" && r !== "parsedStats_incomplete" && r !== "sourceSlug_missing" && r !== "inferred_source_droppedBy");
    const effectOriginal = sample.normalized.effectOriginal;

    lines.push(`## ${name}`);
    lines.push("");
    lines.push(`- Row count (fur × 5 slots): ${rowCount}`);
    lines.push(`- Suggested English name: ${nameEnglish || "(none — needs owner input)"}`);
    lines.push(`- External reference matched: ${hasRef ? "yes" : "no"}`);
    lines.push(`- Endgame/event variant: ${isEndgame ? "yes" : "no"}`);
    lines.push(`- Review reasons: ${reasons.join(", ")}`);
    lines.push("");
    lines.push("### Sample slot effects");
    lines.push("");

    const sampleHelmet = sampleItems.find((si) => si.normalized.targetGearSlotEnglish === "Helmet");
    const sampleMask = sampleItems.find((si) => si.normalized.targetGearSlotEnglish === "Mask");
    if (sampleHelmet && sampleHelmet.normalized.effectOriginal) {
      lines.push(`- Helmet: "${sampleHelmet.normalized.effectOriginal}"`);
    }
    if (sampleMask && sampleMask.normalized.effectOriginal) {
      lines.push(`- Mask: "${sampleMask.normalized.effectOriginal}"`);
    }
    lines.push("");

    if (isEndgame) {
      lines.push("### Recommended action");
      lines.push("");
      lines.push(`- **Leave candidate only** — "${nameEnglish || name}" is an endgame/event variant without official localization evidence.`);
      lines.push(`- Owner should review and either approve the candidate name or provide an official translation.`);
    } else if (!hasRef && nameEnglish) {
      lines.push("### Recommended action");
      lines.push("");
      lines.push(`- **Map to external reference** — "${name}" has a candidate English name ("${nameEnglish}") but no matching external reference entry.`);
      lines.push(`- Owner should verify and either add the reference or approve the name independently.`);
    } else if (!nameEnglish) {
      lines.push("### Recommended action");
      lines.push("");
      lines.push(`- **Approve name** — "${name}" has no English name candidate. Owner should provide a translation.`);
    }

    lines.push("---");
    lines.push("");
  }

  const docPath = path.join(ROOT_DIR, "docs", "module-8-fur-materials-unmatched-review.md");
  fs.writeFileSync(docPath, lines.join("\n"), "utf8");
  console.log(`Unmatched review doc written: ${docPath}`);
}

function writeQaReport(
  output: Record<string, unknown>,
  duplicateIds: number,
  needsReviewCount: number,
  externalRefTotal: number,
  totalParsedEntries: number,
  parsedStatsByStat: Record<string, number>,
  needsReviewReasons: Record<string, number>
): void {
  const items = output.items as FurMaterialItem[];
  const extraction = output.extraction as Record<string, unknown>;
  const slotCoverage = extraction.slotCoverage as Record<string, number>;
  const qualityCoverage = extraction.qualityCoverage as Record<string, number>;
  const psCoverage = extraction.parsedStatsCoverage as { rowsWithParsedStats: number; rowsNoParsedStats: number; totalEntries: number; byStat: Record<string, number> };

  const uniqueNames = new Set(items.map((i) => i.normalized.nameOriginal));
  const unmatchedNames = new Set(
    items.filter((i) => i.normalized.needsReview).map((i) => i.normalized.nameOriginal)
  );

  const qa = [
    "# Module 8 - Fur / Armor Crafting Materials QA",
    "",
    "## Extraction Summary",
    "",
    `- Extraction status: complete`,
    `- Schema validation: pass`,
    `- Detected sheet: 毛皮`,
    `- Row count (expanded items): ${items.length}`,
    `- Unique fur/hide names: ${uniqueNames.size}`,
    `- Blank rows skipped: ${extraction.blankRowsSkipped}`,
    `- Duplicate ID count: ${duplicateIds}`,
    `- Output: data/extracted/fur-materials.raw.json`,
    "",
    "## External References",
    "",
    `- External reference index size: ${externalRefTotal}`,
    `- External reference matches: ${extraction.externalReferenceMatches} / ${items.length}`,
    `- generatedSlug count: ${extraction.generatedUrlCount}`,
    `- canonicalSourceUrl count: ${extraction.canonicalSourceUrlCount}`,
    `- sourceSlug missing: ${extraction.sourceSlugMissingCount} (all matched refs have null sourceSlug)`,
    "",
    "## Parsed Stats Coverage",
    "",
    `- Rows with parsed stats: ${psCoverage.rowsWithParsedStats}`,
    `- Rows with no parsed stats: ${psCoverage.rowsNoParsedStats}`,
    `- Total parsed stat entries: ${totalParsedEntries}`,
    "",
    "### Parsed stats by statEnglish",
    Object.entries(psCoverage.byStat).length > 0
      ? Object.entries(psCoverage.byStat).sort((a, b) => b[1] - a[1]).map(([stat, count]) => `- ${stat}: ${count}`).join("\n")
      : "- None parsed",
    "",
    "## Needs Review",
    "",
    `- Total items needing review: ${needsReviewCount}`,
    `- Unmatched unique fur count: ${unmatchedNames.size}`,
    "",
    "### Review reason counts",
    ...Object.entries(needsReviewReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => `- ${reason}: ${count}`),
    "",
    "## Slot Coverage",
    ...Object.entries(slotCoverage).map(([slot, count]) => `- ${slot}: ${count}`),
    "",
    "## Quality Coverage",
    ...Object.entries(qualityCoverage).map(([q, count]) => `- ${q}: ${count}`),
    "",
    "## Warnings / Gaps",
    `- Quality data not present in source sheet; all quality fields are null`,
    `- canonicalSourceUrl not generated: all material sourceSlug values are null`,
    `- Source and droppedBy are inferred from fur name, not explicit columns`,
    `- effectEnglish is null by design; effectEnglishPartial covers partial translation only`,
    `- Parsed stats implemented but covers only simple numeric patterns — conditional/scaling effects left unparsed`,
    "",
    "### True blockers",
    `- ${unmatchedNames.size} unique fur names need owner review for English name approval`,
    `- No external reference match exists for ${unmatchedNames.size} unique names`,
    "",
    "### Non-blocking gaps",
    `- quality_missing_from_source: known source limitation, not actionable`,
    `- sourceSlug_missing: external reference limitation, all material refs have null sourceSlug`,
    `- parsedStats_incomplete: some complex/conditional effects not parsed; not a blocker for extraction`,
    `- inferred_source_droppedBy: source is implicit in animal name, no explicit column`,
    "",
    "## Recommendation",
    `Ready for lock review: ${unmatchedNames.size === 0 ? "yes" : "no — needs owner review for unmatched names"}`,
    `See docs/module-8-fur-materials-unmatched-review.md for detailed unmatched name analysis`
  ].join("\n");

  const qaPath = path.join(ROOT_DIR, "docs", "module-8-fur-materials-qa.md");
  fs.writeFileSync(qaPath, qa, "utf8");
  console.log(`QA report written: ${qaPath}`);
}
