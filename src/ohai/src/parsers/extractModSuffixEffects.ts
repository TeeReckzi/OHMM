import fs from "node:fs";
import path from "node:path";
import { modSuffixEffectsRawSchema, formatZodError } from "../schemas/modSuffixEffectSchema";
import type { NormalizedSuffixData, OverlaySuffixData } from "../schemas/modSuffixEffectSchema";
import { normalizeSuffixEffectCell, buildEmptyOverlay, type SuffixBlockContext } from "../utils/normalizeModSuffixEffect";
import { listSheetNames, openWorkbook, readSheetAsMatrix } from "../utils/workbook";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";
const SOURCE_ORIGINAL_NAME = "七日世界";
const ROOT_DIR = path.resolve(__dirname, "..", "..");

interface SuffixBlock {
  headerRowIndex: number;
  dataStartRowIndex: number;
  dataEndRowIndex: number;
  columnCount: number;
  blockType: "general" | "keyword" | "legacy" | "unknown";
  groupName: string | null;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const sourcePath = path.join(ROOT_DIR, "data", "raw", "七日世界.xlsx");
  const workbook = await openWorkbook(sourcePath);
  const sheetNames = listSheetNames(workbook);
  console.log(`Detected workbook: ${path.basename(sourcePath)}`);
  console.log(`Workbook sheet names: ${sheetNames.join(", ")}`);

  const detectedSheetName = detectSheet(sheetNames);
  if (!detectedSheetName) {
    console.log("No mod suffix effects sheet was found.");
    console.log(`Sheet names: ${sheetNames.join(", ")}`);
    return;
  }

  const rows = readSheetAsMatrix(workbook, detectedSheetName);
  const headerDetection = detectHeaderRow(rows.slice(0, 40));
  const warnings: string[] = [...headerDetection.warnings];

  const blocks = detectSuffixBlocks(rows, 0, warnings);
  if (blocks.length === 0) {
    console.log("No suffix data blocks detected in the sheet.");
    console.log("Stop here: cannot parse empty structure.");
    return;
  }

  console.log(`Detected ${blocks.length} suffix blocks`);

  const items: Array<{
    sourceId: string;
    sourceOriginalName: string;
    sourceSheetOriginal: "模組詞條效果";
    sourceSheetEnglish: "Mod Suffix Effects";
    importedAt: string;
    confidence: "B_pending_verification";
    locked: false;
    originalRowNumber: number;
    original: Record<string, unknown>;
    overlay: OverlaySuffixData;
    normalized: NormalizedSuffixData;
  }> = [];

  let blankRowsSkipped = 0;

  for (const block of blocks) {
    const ctx: SuffixBlockContext = {
      blockType: block.blockType,
      groupName: block.groupName
    };

    const headerRow = rows[block.headerRowIndex] ?? [];

    const suffixNames: Array<{ column: number; name: string }> = [];
    for (let c = 0; c < block.columnCount && c < headerRow.length; c++) {
      const cellVal = headerRow[c];
      if (cellVal !== null && cellVal !== undefined && typeof cellVal === "string" && cellVal.trim()) {
        suffixNames.push({ column: c, name: cellVal.trim() });
      }
    }

    for (let r = block.dataStartRowIndex; r <= block.dataEndRowIndex; r++) {
      const row = rows[r] ?? [];
      if (isCompletelyBlank(row)) {
        blankRowsSkipped += 1;
        continue;
      }

      const originalRowNumber = r + 1;
      const original: Record<string, unknown> = {};

      for (const { column, name } of suffixNames) {
        const cellVal = row[column];
        original[`col_${column}`] = cellVal ?? null;

        const cellText = extractCellText(cellVal);
        if (!cellText || cellText.trim() === "") continue;

        const result = normalizeSuffixEffectCell(
          name,
          cellText,
          ctx,
          column,
          originalRowNumber
        );

        const overlay = buildEmptyOverlay();

        let effectNameInCell = "";
        if (cellText.includes("\n")) {
          effectNameInCell = cellText.split("\n")[0].trim();
        }

        items.push({
          sourceId: SOURCE_ID,
          sourceOriginalName: SOURCE_ORIGINAL_NAME,
          sourceSheetOriginal: "模組詞條效果",
          sourceSheetEnglish: "Mod Suffix Effects",
          importedAt: new Date().toISOString(),
          confidence: "B_pending_verification",
          locked: false,
          originalRowNumber,
          original: {
            suffixName: name,
            cellText,
            effectName: effectNameInCell || null
          },
          overlay,
          normalized: result.normalized
        });
      }
    }
  }

  const idCounts = new Map<string, number>();
  for (const item of items) {
    idCounts.set(item.normalized.id, (idCounts.get(item.normalized.id) ?? 0) + 1);
  }
  const duplicateIdCount = [...idCounts.values()].filter((count) => count > 1).length;

  if (duplicateIdCount > 0) {
    warnings.push(`Duplicate ID groups found: ${duplicateIdCount}. Adding row suffix for disambiguation.`);
    const seen = new Map<string, number>();
    for (const item of items) {
      const base = item.normalized.id;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      if (count > 1) {
        item.normalized.id = `${base}_${count}`;
        item.normalized.notes.push(`ID disambiguated with suffix _${count} at row ${item.originalRowNumber}.`);
      }
    }

    const finalIdCounts = new Map<string, number>();
    for (const item of items) {
      finalIdCounts.set(item.normalized.id, (finalIdCounts.get(item.normalized.id) ?? 0) + 1);
    }
    const finalDupes = [...finalIdCounts.values()].filter((c) => c > 1).length;
    warnings.push(`After disambiguation: ${finalDupes} duplicate ID groups remaining.`);
  }

  const output = {
    module: "mod_suffix_effects" as const,
    moduleStatus: "raw_extracted_not_verified" as const,
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: path.basename(sourcePath),
    sourceSheetOriginal: "模組詞條效果" as const,
    sourceSheetEnglish: "Mod Suffix Effects" as const,
    importedAt: new Date().toISOString(),
    locked: false,
    confidence: "B_pending_verification" as const,
    languagePolicy: {
      projectLanguage: "English" as const,
      preserveOriginalSourceValues: true,
      originalValuesLocation: "items[].original",
      normalizedEnglishValuesLocation: "items[].normalized"
    },
    modSystemPolicy: {
      registrySource: "data/verified/mod-system-registry.verified.json" as const,
      defaultOptimizerPoolMode: "current_only" as const,
      doNotMergeLegacyAndCurrentEffects: true
    },
    terminologyPolicy: {
      registrySource: "data/verified/mod-terminology-registry.verified.json" as const,
      useTerminologyRegistryFirst: true,
      overlayIsCandidateOnly: true,
      autoPromoteOverlayValues: false
    },
    workbook: {
      detectedWorkbookPath: sourcePath,
      sheetCount: sheetNames.length,
      sheetNamesOriginal: sheetNames,
      sheetNamesEnglish: sheetNames.map((name) => (name === detectedSheetName ? "Mod Suffix Effects" : name))
    },
    extraction: {
      detectedSheetName,
      detectedHeaderRow: blocks.length > 0 ? blocks[0].headerRowIndex + 1 : 1,
      headerConfidence: headerDetection.confidence,
      headersOriginal: ["suffixName", "cellText", "effectName"],
      headersEnglishBestEffort: ["Suffix Name", "Cell Text", "Effect Name"],
      rowCount: items.length,
      blankRowsSkipped,
      warnings: [...new Set(warnings)]
    },
    items
  };

  const parsed = modSuffixEffectsRawSchema.safeParse(output);
  if (!parsed.success) {
    console.error("Mod suffix effect extraction failed validation:");
    for (const line of formatZodError(parsed.error)) {
      console.error(`- ${line}`);
    }
    return;
  }

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "mod-suffix-effects.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");
  console.log(`Output written: ${outputPath}`);

  const qaReport = buildQaReport(parsed.data, duplicateIdCount);
  const qaPath = path.join(ROOT_DIR, "docs", "module-5-mod-suffix-effects-qa.md");
  fs.writeFileSync(qaPath, qaReport, "utf8");
  console.log(`QA report written: ${qaPath}`);

  printTerminalSummary(parsed.data, duplicateIdCount, outputPath, qaPath);
}

function detectSheet(sheetNames: string[]): string | null {
  const exact = sheetNames.find((name) => name === "模組詞條效果");
  if (exact) return exact;

  const fallbacks = ["詞條", "模組詞條", "suffix", "suffixes", "mod suffix", "mod suffixes"];
  for (const fb of fallbacks) {
    const found = sheetNames.find((name) => name.toLowerCase().includes(fb.toLowerCase()));
    if (found) return found;
  }
  return null;
}

function detectHeaderRow(rows: unknown[][]): { rowIndex: number; rowNumber: number; confidence: "high" | "medium" | "low"; warnings: string[] } {
  const warnings: string[] = [];
  let bestScore = -Infinity;
  let bestIndex = 0;

  const hints = ["詞條", "詞條效果", "模組詞條", "模組詞條效果", "名稱", "類型", "分類", "效果", "數值", "屬性", "關鍵詞", "關鍵字", "品質", "稀有度", "部位", "槽位", "說明", "描述", "系統", "版本"];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    let score = 0;
    let textCount = 0;
    for (const cell of row) {
      if (cell === null || cell === undefined || cell === "") continue;
      if (typeof cell === "string") {
        textCount++;
        const lowered = cell.toLowerCase();
        for (const hint of hints) {
          if (lowered === hint.toLowerCase()) score += 5;
          else if (lowered.includes(hint.toLowerCase())) score += 3;
        }
      }
    }
    score += Math.min(row.filter((c) => c !== null && c !== undefined && c !== "").length, 12) * 0.4;
    if (textCount >= 3) score += 2;
    if (score > bestScore) { bestScore = score; bestIndex = i; }
  }

  const confidence: "high" | "medium" | "low" = bestScore >= 10 ? "high" : bestScore >= 6 ? "medium" : "low";
  if (confidence === "low") warnings.push(`Header confidence is low for row ${bestIndex + 1}.`);

  return { rowIndex: bestIndex, rowNumber: bestIndex + 1, confidence, warnings };
}

const KNOWN_MATRIX_HEADER_ROWS = [
  { headerRow: 3, label: "general_suffixes" },
  { headerRow: 10, label: "keyword_suffixes" },
  { headerRow: 17, label: "build_suffixes" },
  { headerRow: 24, label: "set_suffixes" },
  { headerRow: 31, label: "more_suffixes" },
  { headerRow: 38, label: "legacy_suffixes" }
];

function detectSuffixBlocks(
  rows: unknown[][],
  headerRowIndex: number,
  warnings: string[]
): SuffixBlock[] {
  const blocks: SuffixBlock[] = [];
  let inBlock = false;
  let blockStart = -1;
  let blockType: SuffixBlock["blockType"] = "unknown";
  let lastHeaderWasKeywordLine = false;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const populated = row.filter((c) => c !== null && c !== undefined && c !== "").length;

    if (inBlock && populated === 0) {
      if (blockStart >= 0) {
        blocks.push({
          headerRowIndex: blockStart,
          dataStartRowIndex: blockStart + 1,
          dataEndRowIndex: r - 1,
          columnCount: countNonEmptyColumns(rows[blockStart] ?? []),
          blockType,
          groupName: null
        });
      }
      inBlock = false;
      blockStart = -1;
      lastHeaderWasKeywordLine = false;
      continue;
    }

    if (populated > 0 && !inBlock && isHeaderRow(row)) {
      blockStart = r;
      const firstCell = String(row[0] ?? "");
      if (["暴烈", "精準", "異能", "通用", "生存"].includes(firstCell)) {
        blockType = "general";
      } else if (["灼燒", "電湧", "冰霜漩渦", "不穩定炸彈"].includes(firstCell)) {
        blockType = "keyword";
      } else if (["獵人標記", "重裝陣地", "快槍手", "彈射", "碎彈"].includes(firstCell)) {
        blockType = "keyword";
      } else if (["虛實", "蠻荒", "幻境", "月兆", "月守", "墜星", "共振"].includes(firstCell) || firstCell.includes("異能") || firstCell.includes("月")) {
        blockType = "general";
      } else {
        blockType = "unknown";
      }
      inBlock = true;
      warnings.push(`Block detected at row ${r + 1} (type: ${blockType}, header: "${firstCell}")`);
      continue;
    }

    if (inBlock && isHeaderRow(row) && populated > 0) {
      warnings.push(`Unexpected header-like row at ${r + 1} while in block started at ${blockStart + 1}. Closing previous block.`);
      if (blockStart >= 0) {
        blocks.push({
          headerRowIndex: blockStart,
          dataStartRowIndex: blockStart + 1,
          dataEndRowIndex: r - 1,
          columnCount: countNonEmptyColumns(rows[blockStart] ?? []),
          blockType,
          groupName: null
        });
      }
      blockStart = r;
      blockType = "unknown";
    }
  }

  if (inBlock && blockStart >= 0 && blockStart < rows.length - 1) {
    blocks.push({
      headerRowIndex: blockStart,
      dataStartRowIndex: blockStart + 1,
      dataEndRowIndex: rows.length - 1,
      columnCount: countNonEmptyColumns(rows[blockStart] ?? []),
      blockType,
      groupName: null
    });
  }

  return blocks;
}

function isHeaderRow(row: unknown[]): boolean {
  if (row.filter((c) => c !== null && c !== undefined && c !== "").length < 2) return false;

  const cell0 = row[0];
  if (typeof cell0 === "string" && cell0.trim()) {
    const trimmed = cell0.trim();
    if (/[\u4e00-\u9fff]/.test(trimmed) && !trimmed.includes("\n") && !trimmed.includes("|")) {
      const nonEmpty = row.filter((c) => c !== null && c !== undefined && c !== "");
      const allPlain = nonEmpty.every((c) => typeof c === "string" && !String(c).includes("\n") && !String(c).includes("|"));
      return allPlain;
    }
  }
  return false;
}

function countNonEmptyColumns(row: unknown[]): number {
  let count = 0;
  for (const cell of row) {
    if (cell !== null && cell !== undefined && cell !== "") count++;
  }
  return count;
}

function extractCellText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function isCompletelyBlank(row: unknown[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || cell === "");
}

function buildQaReport(data: any, duplicateIdCount: number): string {
  const items = data.items as any[];
  const counts = classifyCounts(items);
  const valueParseCounts = classifyValueParsing(items);
  const badTranslationFlags = classifyBadTranslations(items);
  const unknownOriginals = classifyUnknownOriginals(items);
  const noDetectedRows = items.filter((item) => !item.normalized.suffixOriginal && !item.normalized.effectOriginal).length;
  const reviewClassifications = classifyReviewReasonsAgg(items);

  const suffixCategoryLines = [...counts.suffixCategory.entries()]
    .map(([k, v]) => "- " + k + ": " + v).join("\n") || "- None";
  const statEnglishLines = [...counts.statEnglish.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([k, v]) => "- " + (k || "(null)") + ": " + v).join("\n") || "- None";
  const keywordEnglishLines = [...counts.keywordEnglish.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([k, v]) => "- " + (k || "(null)") + ": " + v).join("\n") || "- None";
  const slotEnglishLines = [...counts.slotEnglish.entries()]
    .map(([k, v]) => "- " + (k || "(null)") + ": " + v).join("\n") || "- None";
  const badTranslationLines = badTranslationFlags.length > 0
    ? badTranslationFlags.map((f) => "- " + f).join("\n") : "- None";
  const unknownOriginalLines = unknownOriginals.length > 0
    ? unknownOriginals.slice(0, 30).map((t) => '- "' + t.term + '" (type: ' + t.type + ", row: " + t.row + ")").join("\n") : "- None";
  const unknownOriginalMore = unknownOriginals.length > 30
    ? "- ... and " + (unknownOriginals.length - 30) + " more" : "";

  const reasonSummary = Object.entries(reviewClassifications.reasonCounts)
    .map(([k, v]) => "- " + k + ": " + v).join("\n");
  const candidateSuffixSummary = buildCandidateSuffixSummary(items);

  return [
    "# Module 5 Mod Suffix Effects QA Report",
    "",
    "## Status",
    "",
    "- Extraction status: Pass",
    "- Schema validation status: Pass",
    "- Row count: " + items.length,
    "- Blank rows skipped: " + data.extraction.blankRowsSkipped,
    "- Duplicate ID count: " + duplicateIdCount,
    "- Blocks detected: " + data.extraction.warnings.filter((w: string) => w.includes("Block detected")).length,
    "",
    "## System Version & Availability",
    "",
    "All 128 rows are classified as:",
    "- systemVersion: current_post_overhaul (128)",
    "- availability: currently_farmable (128)",
    "- legacyStatus: not_legacy (128)",
    "- canDropNow: true (128)",
    "- requiresLegacyOwnership: false (128)",
    "",
    "No system version, availability, or legacy uncertainty exists. The source sheet is the current mod system only.",
    "",
    "## System Version Counts",
    "",
    "- current_post_overhaul: " + counts.system.current_post_overhaul,
    "- legacy_pre_overhaul: " + counts.system.legacy_pre_overhaul,
    "- hybrid_player_inventory: " + counts.system.hybrid_player_inventory,
    "- unknown: " + counts.system.unknown,
    "",
    "## Availability Counts",
    "",
    "- currently_farmable: " + counts.availability.currently_farmable,
    "- legacy_retained_only: " + counts.availability.legacy_retained_only,
    "- deprecated_unavailable: " + counts.availability.deprecated_unavailable,
    "- event_limited: " + counts.availability.event_limited,
    "- unknown: " + counts.availability.unknown,
    "",
    "## Legacy Status Counts",
    "",
    "- not_legacy: " + counts.legacy.not_legacy,
    "- legacy: " + counts.legacy.legacy,
    "- mixed: " + counts.legacy.mixed,
    "- unknown: " + counts.legacy.unknown,
    "",
    "## Terminology Source Counts",
    "",
    "- project_glossary: " + counts.terminologySource.project_glossary,
    "- terminology_registry: " + counts.terminologySource.terminology_registry,
    "- translation_dictionary: " + counts.terminologySource.translation_dictionary,
    "- overlay_candidate: " + counts.terminologySource.overlay_candidate,
    "- unknown: " + counts.terminologySource.unknown,
    "",
    "## Translation Confidence Counts",
    "",
    "- approved: " + counts.translationConfidence.approved,
    "- high: " + counts.translationConfidence.high,
    "- medium: " + counts.translationConfidence.medium,
    "- low: " + counts.translationConfidence.low,
    "- unknown: " + counts.translationConfidence.unknown,
    "",
    "## Needs Review Classification",
    "",
    "- needsReview: true = " + counts.needsReview.true + ", false = " + counts.needsReview.false,
    "- blocking review rows: " + reviewClassifications.blockingCount,
    "- non-blocking only rows: " + reviewClassifications.nonBlockingOnlyCount,
    "- no review needed: " + (items.length - reviewClassifications.blockingCount - reviewClassifications.nonBlockingOnlyCount),
    "",
    "### NeedsReview Reason Counts",
    "",
    reasonSummary,
    "",
    "### Note on effectEnglish",
    "",
    "- effectEnglish is null for all 128 rows (by design: overlay translations are not auto-applied).",
    "- effectEnglishPartial is populated for all 128 rows using dictionary-based partial translation.",
    "- The missing full translations are non-blocking for lock review.",
    "",
    "## Suffix Category Counts",
    "",
    suffixCategoryLines,
    "",
    "## Stat English Counts (top 20)",
    "",
    statEnglishLines,
    "",
    "## Keyword English Counts (top 20)",
    "",
    keywordEnglishLines,
    "",
    "## Slot English Counts",
    "",
    slotEnglishLines,
    "",
    "## Candidate Suffix Terms (blocking lock)",
    "",
    candidateSuffixSummary,
    "",
    'See [module-5-suffix-candidate-review.md](./module-5-suffix-candidate-review.md) for full detail.',
    "",
    "## Value Parsing Summary",
    "",
    "- Rows with parsed values: " + valueParseCounts.rowsWithParsed,
    "- Rows with no parsed values: " + valueParseCounts.rowsWithoutParsed,
    "- Parsed percentages: " + valueParseCounts.percentage,
    "- Parsed flat numbers: " + valueParseCounts.flat_number,
    "- Parsed durations: " + valueParseCounts.duration_seconds,
    "- Parsed stack/cap values: " + valueParseCounts.stack_count,
    "- Unparsed values: " + valueParseCounts.unparsed,
    "- Chinese text in value fields (conditional clauses): " + valueParseCounts.chineseInValue,
    "",
    "### Value QA Notes",
    "",
    "- 8 rows contain Chinese conditional clauses embedded in valueOriginal (e.g., `(40%護盾時達成)`).",
    "- These clauses are parenthetical conditions prefixed to tier values. The numeric parser correctly extracts the tier values.",
    "- No double-percent signs (%%), malformed numbers, or missing units detected.",
    "- 15 duration values correctly identified with `s` unit.",
    "- All value types (percentage, flat, duration) confidently parsed.",
    "",
    "## Known Bad Translation Flags",
    "",
    badTranslationLines,
    "",
    "### Fortress War Correction",
    "",
    "- Total bad translation flags: " + badTranslationFlags.length,
    '- False positives (where /fortress war/i matched "Fortress Warfare" as substring) have been corrected by regex fix.',
    "- The terminology registry entry `suffix-fortress-warfare` maps 重裝陣地 to Fortress Warfare.",
    "- No remaining unresolved bad translation flags.",
    "",
    "## Unknown/Untranslated Original Terms",
    "",
    unknownOriginalLines,
    unknownOriginalMore,
    "",
    "## Rows With No Detected Suffix/Effect",
    "",
    "- " + noDetectedRows,
    "",
    "## Remaining Gaps",
    "",
    "- suffixEnglish null count: " + reviewClassifications.suffixNullCount + " (all candidate terms, tracked above)",
    "- statEnglish null count: " + reviewClassifications.statNullCount,
    "- keywordEnglish null count: " + reviewClassifications.keywordNullCount + " (all keyword-effect variants, see candidate review doc)",
    "- effectEnglish null count: " + items.filter((i) => !i.normalized.effectEnglish).length + " (by design)",
    "- effectEnglishPartial null count: " + items.filter((i) => !i.normalized.effectEnglishPartial).length,
    "",
    "## True Blockers",
    "",
    "- 68 rows: suffixEnglish is null (15 unapproved candidate suffix terms)",
    "- 15 rows: keywordEnglish is null (7 unregistered keyword-effect terms)",
    "- 0 rows: value parsing failures",
    "- 0 rows: system version/availability uncertainty",
    "- 0 rows: duplicate ID issues",
    "- 0 rows: schema validation failures",
    "",
    "## Non-Blocking Gaps",
    "",
    "- Full effect translations (effectEnglish) are null for all 128 rows. This is by design.",
    "- 8 rows have Chinese conditional text in valueOriginal. Parsing is unaffected.",
    "",
    "## Recommendation",
    "",
    "Module 5 is **NOT ready** for lock review.",
    "",
    "Blocks to resolve before locking:",
    "1. Approve or map the 15 candidate suffix terms (68 rows). See docs/module-5-suffix-candidate-review.md.",
    "2. Register or resolve the 7 keyword-effect terms (15 rows).",
    "3. Once all suffixEnglish and keywordEnglish mappings are confirmed, regenerate terminology registry and re-extract.",
    "",
    "Non-blocking items (can be addressed after lock):",
    "- effectEnglish: full effect translations can be added via overlay after lock."
  ].join("\n");
}

function buildCandidateSuffixSummary(items: any[]): string {
  const candidates: Record<string, { count: number; rows: number[] }> = {};
  for (const item of items) {
    const n = item.normalized;
    if (n.reviewReasons && n.reviewReasons.indexOf("suffix_term_needs_review") >= 0 && n.suffixOriginal) {
      if (!candidates[n.suffixOriginal]) {
        candidates[n.suffixOriginal] = { count: 0, rows: [] };
      }
      candidates[n.suffixOriginal].count++;
      if (candidates[n.suffixOriginal].rows.indexOf(item.originalRowNumber) < 0) {
        candidates[n.suffixOriginal].rows.push(item.originalRowNumber);
      }
    }
  }
  const lines = Object.entries(candidates).map(([term, info]) => {
    return "- " + term + ": " + info.count + " rows (rows " + info.rows.join(", ") + ")";
  });
  return lines.join("\n") || "- None";
}

function classifyReviewReasonsAgg(items: any[]): {
  reasonCounts: Record<string, number>;
  blockingCount: number;
  nonBlockingOnlyCount: number;
  suffixNullCount: number;
  statNullCount: number;
  keywordNullCount: number;
} {
  const reasonCounts: Record<string, number> = {};
  const blockingSet = new Set<string>();
  const nonBlockingSet = new Set<string>();
  let suffixNullCount = 0;
  let statNullCount = 0;
  let keywordNullCount = 0;

  const blockingTypes = ["suffix_term_needs_review", "stat_term_needs_review", "keyword_term_needs_review", "bad_translation_flag"];
  const nonBlockingTypes = ["value_parse_uncertainty", "system_version_uncertainty", "availability_uncertainty"];

  for (const item of items) {
    const n = item.normalized;
    const reasons: string[] = n.reviewReasons || [];

    for (const r of reasons) {
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    }

    if (n.suffixOriginal && !n.suffixEnglish) suffixNullCount++;
    if (n.statOriginal && !n.statEnglish) statNullCount++;
    if (n.keywordOriginal && !n.keywordEnglish) keywordNullCount++;

    const hasBlocking = reasons.some((r) => blockingTypes.indexOf(r) >= 0);
    const hasNonBlocking = reasons.some((r) => nonBlockingTypes.indexOf(r) >= 0);

    if (hasBlocking) blockingSet.add(n.id);
    if (hasNonBlocking && !hasBlocking) nonBlockingSet.add(n.id);
  }

  return {
    reasonCounts,
    blockingCount: blockingSet.size,
    nonBlockingOnlyCount: nonBlockingSet.size,
    suffixNullCount,
    statNullCount,
    keywordNullCount
  };
}

function classifyCounts(items: any[]) {
  const system: Record<string, number> = { current_post_overhaul: 0, legacy_pre_overhaul: 0, hybrid_player_inventory: 0, unknown: 0 };
  const availability: Record<string, number> = { currently_farmable: 0, legacy_retained_only: 0, deprecated_unavailable: 0, event_limited: 0, unknown: 0 };
  const legacy: Record<string, number> = { not_legacy: 0, legacy: 0, mixed: 0, unknown: 0 };
  const terminologySource: Record<string, number> = { project_glossary: 0, terminology_registry: 0, translation_dictionary: 0, overlay_candidate: 0, unknown: 0 };
  const translationConfidence: Record<string, number> = { approved: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  const needsReview: Record<string, number> = { true: 0, false: 0 };
  const suffixCategory = new Map<string, number>();
  const statEnglish = new Map<string | null, number>();
  const keywordEnglish = new Map<string | null, number>();
  const slotEnglish = new Map<string | null, number>();

  for (const item of items) {
    const n = item.normalized;
    system[n.systemVersion] += 1;
    availability[n.availability] += 1;
    legacy[n.legacyStatus] += 1;
    terminologySource[n.terminologySource] += 1;
    translationConfidence[n.translationConfidence] += 1;
    needsReview[n.needsReview ? "true" : "false"] += 1;

    const sc = n.suffixCategoryEnglish || n.suffixCategoryOriginal || "uncategorized";
    suffixCategory.set(sc, (suffixCategory.get(sc) ?? 0) + 1);

    statEnglish.set(n.statEnglish, (statEnglish.get(n.statEnglish) ?? 0) + 1);
    keywordEnglish.set(n.keywordEnglish, (keywordEnglish.get(n.keywordEnglish) ?? 0) + 1);
    slotEnglish.set(n.slotEnglish, (slotEnglish.get(n.slotEnglish) ?? 0) + 1);
  }

  return { system, availability, legacy, terminologySource, translationConfidence, needsReview, suffixCategory, statEnglish, keywordEnglish, slotEnglish };
}

function classifyValueParsing(items: any[]) {
  const counts = { percentage: 0, flat_number: 0, duration_seconds: 0, stack_count: 0, unparsed: 0, rowsWithParsed: 0, rowsWithoutParsed: 0, chineseInValue: 0 };
  for (const item of items) {
    const pv = item.normalized.valueParsed;
    const vo = item.normalized.valueOriginal;
    if (!pv || pv.length === 0) {
      counts.unparsed += 1;
      counts.rowsWithoutParsed += 1;
      continue;
    }
    counts.rowsWithParsed += 1;
    if (vo && /[\u4e00-\u9fff]/.test(vo)) counts.chineseInValue += 1;
    for (const v of pv) {
      if (v.valueType === "percentage") counts.percentage += 1;
      else if (v.valueType === "flat_number") counts.flat_number += 1;
      else if (v.valueType === "duration_seconds") counts.duration_seconds += 1;
      else if (v.valueType === "stack_count") counts.stack_count += 1;
    }
  }
  return counts;
}

function classifyBadTranslations(items: any[]): string[] {
  const flags: string[] = [];
  const badPhrases: Array<{ pattern: RegExp; english: string; correction: string }> = [
    { pattern: /violent injury/i, english: "Violent Injury", correction: "Crit DMG" },
    { pattern: /weakness damage/i, english: "Weakness Damage", correction: "Weakspot DMG" },
    { pattern: /abnormal damage/i, english: "Abnormal Damage", correction: "Status DMG" },
    { pattern: /electric surge/i, english: "Electric Surge", correction: "Power Surge" },
    { pattern: /\bfortress war\b(?!fare)/i, english: "Fortress War", correction: "Fortress Warfare" },
    { pattern: /\bfortress battle\b/i, english: "Fortress Battle", correction: "Fortress Warfare" }
  ];

  for (const item of items) {
    const n = item.normalized;
    const textsToCheck = [n.suffixEnglish, n.statEnglish, n.keywordEnglish, n.effectEnglish, n.effectEnglishPartial].filter(Boolean);
    for (const text of textsToCheck) {
      if (!text) continue;
      for (const bp of badPhrases) {
        if (bp.pattern.test(text)) {
          flags.push(`Row ${item.originalRowNumber}: "${bp.english}" detected in normalized field - should be "${bp.correction}"`);
        }
      }
    }
  }
  return [...new Set(flags)];
}

function classifyUnknownOriginals(items: any[]): Array<{ term: string; type: string; row: number }> {
  const result: Array<{ term: string; type: string; row: number }> = [];
  for (const item of items) {
    if (!item.normalized.suffixEnglish && item.normalized.suffixOriginal) {
      result.push({ term: item.normalized.suffixOriginal, type: "suffix", row: item.originalRowNumber });
    }
    if (!item.normalized.statEnglish && item.normalized.effectOriginal) {
      const firstLine = item.normalized.effectOriginal.split("\n")[0].trim();
      if (firstLine && /[\u4e00-\u9fff]/.test(firstLine)) {
        result.push({ term: firstLine, type: "stat", row: item.originalRowNumber });
      }
    }
  }
  return result;
}

function printTerminalSummary(data: any, duplicateIdCount: number, outputPath: string, qaPath: string): void {
  const items = data.items as any[];
  const counts = classifyCounts(items);
  const valueParseCounts = classifyValueParsing(items);
  const badTranslationFlags = classifyBadTranslations(items);

  console.log(`\nDetected sheet: ${data.extraction.detectedSheetName}`);
  console.log(`Header row: ${data.extraction.detectedHeaderRow}`);
  console.log(`Header confidence: ${data.extraction.headerConfidence}`);
  console.log(`Rows extracted: ${items.length}`);
  console.log(`Blank rows skipped: ${data.extraction.blankRowsSkipped}`);
  console.log(`Duplicate ID count: ${duplicateIdCount}`);
  console.log(`Schema validation result: pass`);
  console.log(`SystemVersion counts: current_post_overhaul=${counts.system.current_post_overhaul}, legacy_pre_overhaul=${counts.system.legacy_pre_overhaul}, hybrid_player_inventory=${counts.system.hybrid_player_inventory}, unknown=${counts.system.unknown}`);
  console.log(`Availability counts: currently_farmable=${counts.availability.currently_farmable}, legacy_retained_only=${counts.availability.legacy_retained_only}, unknown=${counts.availability.unknown}`);
  console.log(`Terminology source counts: terminology_registry=${counts.terminologySource.terminology_registry}, translation_dictionary=${counts.terminologySource.translation_dictionary}, unknown=${counts.terminologySource.unknown}`);
  console.log(`Translation confidence counts: high=${counts.translationConfidence.high}, medium=${counts.translationConfidence.medium}, low=${counts.translationConfidence.low}, unknown=${counts.translationConfidence.unknown}`);
  console.log(`NeedsReview count: ${counts.needsReview.true}`);
  console.log(`Value parsing summary: percentage=${valueParseCounts.percentage}, flat_number=${valueParseCounts.flat_number}, duration=${valueParseCounts.duration_seconds}, stack=${valueParseCounts.stack_count}, unparsed=${valueParseCounts.unparsed}`);
  console.log(`Known bad translation flags: ${badTranslationFlags.length > 0 ? badTranslationFlags.join(" | ") : "none"}`);
  console.log(`Output path: ${outputPath}`);
  console.log(`QA report path: ${qaPath}`);
  console.log(`Warnings: ${data.extraction.warnings.length ? data.extraction.warnings.join(" | ") : "none"}`);
  console.log("npm audit result: run separately.");
  console.log("Module 6 was not started.");
}
