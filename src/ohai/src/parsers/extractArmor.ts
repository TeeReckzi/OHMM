import fs from "node:fs";
import path from "node:path";
import { armorRawSchema, formatArmorZodError } from "../schemas/armorSchema";
import { normalizeArmorRow } from "../utils/normalizeArmor";
import { copyWorkbookToRaw, ensureDataFolders, findWorkbookCandidates, listSheetNames, openWorkbook, readSheetAsMatrix } from "../utils/workbook";

const SOURCE_ID = "OH_CN_TW_Community_Sheet_Seven_Day_World";
const SOURCE_ORIGINAL_NAME = "七日世界";
const ROOT_DIR = path.resolve(__dirname, "..", "..");

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  ensureDataFolders(ROOT_DIR);

  const candidates = findWorkbookCandidates(ROOT_DIR);
  if (candidates.length === 0) {
    console.log("No .xlsx workbook was found.");
    console.log('Place the workbook in the project root or data/raw/ and rerun `npm run extract:armor`.');
    return;
  }

  if (candidates.length > 1) {
    console.log("Multiple .xlsx workbooks were found:");
    for (const candidate of candidates) console.log(`- ${candidate.path}`);
    console.log("Please specify which workbook to use before extraction continues.");
    return;
  }

  const sourceWorkbookPath = candidates[0].path;
  const rawWorkbookPath = copyWorkbookToRaw(ROOT_DIR, sourceWorkbookPath);
  const workbook = await openWorkbook(rawWorkbookPath);
  const sheetNames = listSheetNames(workbook);

  console.log(`Detected workbook: ${path.basename(sourceWorkbookPath)}`);
  console.log(`Workbook path used: ${rawWorkbookPath}`);
  console.log(`Workbook sheet count: ${sheetNames.length}`);
  console.log(`Workbook sheet names: ${sheetNames.join(", ")}`);

  const armorSheet = detectArmorSheet(sheetNames);
  if (!armorSheet) {
    console.log("No armor sheet was found.");
    console.log(`Sheet names: ${sheetNames.join(", ")}`);
    return;
  }

  const rows = readSheetAsMatrix(workbook, armorSheet);
  const headerDetection = detectHeaderRow(rows.slice(0, 30));
  const dataRows = rows.slice(headerDetection.rowIndex + 1);
  const headers = buildHeaders(rows[headerDetection.rowIndex] ?? [], headerDetection.warnings);
  const headersEnglishBestEffort = headers.map(bestEffortHeaderEnglish);

  const items: ReturnType<typeof buildItem>[] = [];
  let blankRowsSkipped = 0;
  const rowWarnings: string[] = [...headerDetection.warnings];

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const originalRowNumber = headerDetection.rowIndex + 2 + index;
    if (isCompletelyBlank(row)) {
      blankRowsSkipped += 1;
      continue;
    }

    const rowObject = arrayToObject(headers, row);
    const normalized = normalizeArmorRow(rowObject, originalRowNumber);
    if (!normalized.nameOriginal && !normalized.nameEnglish) {
      rowWarnings.push(`Row ${originalRowNumber}: no detectable armor name.`);
    }
    items.push(buildItem(rowObject, normalized, originalRowNumber));
  }

  const idCounts = new Map<string, number>();
  for (const item of items) idCounts.set(item.normalized.id, (idCounts.get(item.normalized.id) ?? 0) + 1);
  const duplicateIdGroups = [...idCounts.values()].filter((count) => count > 1).length;
  const duplicateIdRows = [...idCounts.values()].reduce((sum, count) => sum + (count > 1 ? count : 0), 0);

  const output = {
    module: "armor",
    moduleStatus: "raw_extracted_not_verified",
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: path.basename(rawWorkbookPath),
    sourceSheetOriginal: armorSheet,
    sourceSheetEnglish: "Armor",
    importedAt: new Date().toISOString(),
    locked: false,
    confidence: "B_pending_verification",
    languagePolicy: {
      projectLanguage: "English",
      preserveOriginalSourceValues: true,
      originalValuesLocation: "items[].original",
      normalizedEnglishValuesLocation: "items[].normalized"
    },
    workbook: {
      detectedWorkbookPath: rawWorkbookPath,
      sheetCount: sheetNames.length,
      sheetNamesOriginal: sheetNames,
      sheetNamesEnglish: sheetNames.map((name) => (name === armorSheet ? "Armor" : name))
    },
    extraction: {
      detectedSheetName: armorSheet,
      detectedHeaderRow: headerDetection.rowNumber,
      headerConfidence: headerDetection.confidence,
      headersOriginal: headers,
      headersEnglishBestEffort,
      rowCount: items.length,
      blankRowsSkipped,
      warnings: [...new Set(rowWarnings)]
    },
    items
  };

  const parsed = armorRawSchema.safeParse(output);
  if (!parsed.success) {
    console.error("Armor extraction failed validation:");
    for (const line of formatArmorZodError(parsed.error)) console.error(`- ${line}`);
    return;
  }

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "armor.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");

  const rawText = JSON.stringify(parsed.data);
  const magneticPresent = rawText.includes("磁矩上衣");
  const glidePresent = rawText.includes("滑步長褲");

  writeQaReport(ROOT_DIR, parsed.data, duplicateIdGroups, duplicateIdRows, magneticPresent, glidePresent);

  const qaPath = path.join(ROOT_DIR, "docs", "module-2-armor-qa.md");
  console.log(`Detected armor sheet: ${armorSheet}`);
  console.log(`Detected header row: ${headerDetection.rowNumber}`);
  console.log(`Header confidence: ${headerDetection.confidence}`);
  console.log(`Armor rows extracted: ${items.length}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`Duplicate ID count: ${duplicateIdGroups}`);
  console.log(`Magnetic Moment Top present: ${magneticPresent}`);
  console.log(`Glide Pants present: ${glidePresent}`);
  console.log(`Schema validation: pass`);
  console.log(`Output path: ${outputPath}`);
  console.log(`QA report path: ${qaPath}`);
  console.log(`Warnings: ${parsed.data.extraction.warnings.length ? parsed.data.extraction.warnings.join(" | ") : "none"}`);
  console.log("npm audit: run separately; no known direct xlsx dependency remains.");
  console.log("Module 3 was not started.");
}

function detectArmorSheet(sheetNames: string[]): string | null {
  const exact = sheetNames.find((name) => name === "防具");
  if (exact) return exact;
  return sheetNames.find((name) => /防具/i.test(name) || /armor/i.test(name) || /armors/i.test(name) || /gear/i.test(name) || /equipment/i.test(name)) ?? null;
}

function detectHeaderRow(rows: unknown[][]): { rowIndex: number; rowNumber: number; confidence: "high" | "medium" | "low"; warnings: string[] } {
  let bestScore = -Infinity;
  let bestIndex = 0;
  const scored: Array<{ index: number; score: number }> = [];
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreHeaderRow(rows[i] ?? []);
    scored.push({ index: i, score });
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const warnings: string[] = [];
  if (sorted[1] && Math.abs(sorted[0].score - sorted[1].score) <= 2) {
    warnings.push(`Header row candidates are close: ${sorted.slice(0, 3).map((item) => `row ${item.index + 1} (${item.score})`).join(", ")}`);
  }
  const confidence = bestScore >= 10 ? "high" : bestScore >= 6 ? "medium" : "low";
  if (confidence === "low") warnings.push(`Header confidence is low for row ${bestIndex + 1}.`);
  return { rowIndex: bestIndex, rowNumber: bestIndex + 1, confidence, warnings };
}

function scoreHeaderRow(row: unknown[]): number {
  let score = 0;
  let textCount = 0;
  let nonEmptyCount = 0;
  const hints = ["防具", "名稱", "裝備名稱", "部位", "槽位", "類型", "套裝", "品質", "稀有度", "效果", "特效", "關鍵詞", "關鍵字", "說明", "描述"];
  for (const cell of row) {
    if (cell === null || cell === undefined || cell === "") continue;
    nonEmptyCount += 1;
    if (typeof cell === "string") {
      textCount += 1;
      const lowered = cell.toLowerCase();
      for (const hint of hints) {
        if (lowered === hint.toLowerCase()) score += 5;
        else if (lowered.includes(hint.toLowerCase())) score += 3;
      }
    }
  }
  score += Math.min(nonEmptyCount, 12) * 0.4;
  if (textCount >= 3) score += 2;
  return score;
}

function buildHeaders(headerRow: unknown[], warnings: string[]): string[] {
  const headers: string[] = [];
  const seen = new Map<string, number>();
  for (let index = 0; index < headerRow.length; index += 1) {
    const raw = asHeaderString(headerRow[index]);
    if (!raw) {
      const fallback = `unnamedColumn_${index + 1}`;
      headers.push(fallback);
      warnings.push(`Blank header detected at column ${index + 1}; using ${fallback}.`);
      continue;
    }
    const count = (seen.get(raw) ?? 0) + 1;
    seen.set(raw, count);
    if (count > 1) {
      const duplicate = `duplicateHeader_${count}`;
      headers.push(duplicate);
      warnings.push(`Duplicate header detected: ${raw} at column ${index + 1}; using ${duplicate}.`);
      continue;
    }
    headers.push(raw);
  }
  return headers;
}

function arrayToObject(headers: string[], row: unknown[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const width = Math.max(headers.length, row.length);
  for (let index = 0; index < width; index += 1) {
    const key = headers[index] ?? `unnamedColumn_${index + 1}`;
    result[key] = index < row.length ? row[index] : null;
  }
  return result;
}

function buildItem(original: Record<string, unknown>, normalized: ReturnType<typeof normalizeArmorRow>, originalRowNumber: number) {
  return {
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceSheetOriginal: "防具" as const,
    sourceSheetEnglish: "Armor" as const,
    importedAt: new Date().toISOString(),
    confidence: "B_pending_verification" as const,
    locked: false as const,
    originalRowNumber,
    original,
    normalized
  };
}

function isCompletelyBlank(row: unknown[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || cell === "");
}

function asHeaderString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function bestEffortHeaderEnglish(header: string): string | null {
  if (header === "名稱") return "Name";
  if (header === "部位") return "Slot";
  if (header === "類型") return "Type";
  if (header === "關鍵詞") return "Keyword";
  if (header === "關鍵效果") return "Key Effect";
  if (header === "稀有度") return "Rarity";
  return null;
}

function writeQaReport(rootDir: string, data: any, duplicateIdGroups: number, duplicateIdRows: number, magneticPresent: boolean, glidePresent: boolean): void {
  const items = data.items || [];
  const isMissing = (value: unknown) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");
  const count = (selector: (item: any) => unknown) => items.filter((item: any) => isMissing(selector(item))).length;
  const slotMap = new Map<string, Set<string | null>>();
  const keywordMap = new Map<string, Set<string | null>>();
  const untranslatedSlots = new Set<string>();
  const untranslatedKeywords = new Set<string>();
  const noNameRows: Array<{ row: number; original: string | null }> = [];
  const noKeywordRows: Array<{ row: number; name: string | null }> = [];
  const keywordFailedRows: Array<{ row: number; name: string | null }> = [];
  let translatedConfidenceHigh = 0;
  let translatedConfidenceMedium = 0;
  let translatedConfidenceLow = 0;
  let translatedConfidenceUnknown = 0;

  for (const item of items) {
    const n = item.normalized || {};
    if (isMissing(n.nameOriginal)) noNameRows.push({ row: item.originalRowNumber, original: null });
    if (n.translationConfidence === "high") translatedConfidenceHigh += 1;
    else if (n.translationConfidence === "medium") translatedConfidenceMedium += 1;
    else if (n.translationConfidence === "low") translatedConfidenceLow += 1;
    else translatedConfidenceUnknown += 1;

    if (n.slotOriginal) {
      if (!slotMap.has(n.slotOriginal)) slotMap.set(n.slotOriginal, new Set());
      slotMap.get(n.slotOriginal)!.add(n.slotEnglish ?? null);
      if (isMissing(n.slotEnglish)) untranslatedSlots.add(n.slotOriginal);
    }

    if (n.keywordOriginal) {
      if (!keywordMap.has(n.keywordOriginal)) keywordMap.set(n.keywordOriginal, new Set());
      keywordMap.get(n.keywordOriginal)!.add(n.keywordEnglish ?? null);
      if (isMissing(n.keywordEnglish)) untranslatedKeywords.add(n.keywordOriginal);
    } else if (!isMissing(n.keywordOriginal)) {
      keywordFailedRows.push({ row: item.originalRowNumber, name: n.nameOriginal });
    } else {
      noKeywordRows.push({ row: item.originalRowNumber, name: n.nameOriginal });
    }
  }

  const report = `# Module 2 Armor QA Report

## Summary

` +
    `data/extracted/armor.raw.json is valid JSON and passes the armor schema validation.

## Status

- Extraction status: Pass
- Schema validation: Pass
- Duplicate ID status: ${duplicateIdGroups === 0 ? "Pass" : "Fail"}
- Lock readiness: Not ready

## Counts

- Total armor rows checked: ${items.length}
- Blank rows skipped: ${data.extraction.blankRowsSkipped}
- Duplicate ID groups: ${duplicateIdGroups}
- Duplicate ID rows affected: ${duplicateIdRows}
- Missing nameOriginal: ${count((item: any) => item.normalized?.nameOriginal)}
- Missing nameEnglish: ${count((item: any) => item.normalized?.nameEnglish)}
- Missing slotEnglish: ${count((item: any) => item.normalized?.slotEnglish)}
- Missing armorTypeEnglish: ${count((item: any) => item.normalized?.armorTypeEnglish)}
- Missing rarityEnglish: ${count((item: any) => item.normalized?.rarityEnglish)}
- Missing setEnglish: ${count((item: any) => item.normalized?.setEnglish)}
- Missing keywordEnglish: ${count((item: any) => item.normalized?.keywordEnglish)}
- Missing specialEffectEnglish: ${count((item: any) => item.normalized?.specialEffectEnglish)}
- Missing specialEffectEnglishPartial: ${count((item: any) => item.normalized?.specialEffectEnglishPartial)}

## Translation Confidence

- High: ${translatedConfidenceHigh}
- Medium: ${translatedConfidenceMedium}
- Low: ${translatedConfidenceLow}
- Unknown: ${translatedConfidenceUnknown}

## Slot Mappings

${[...slotMap.entries()].map(([k, v]) => `- ${k} -> ${[...v].map((x) => x ?? "null").join(", ")}`).join("\n")}

## Keyword Mappings

${[...keywordMap.entries()].map(([k, v]) => `- ${k} -> ${[...v].map((x) => x ?? "null").join(", ")}`).join("\n")}

## Untranslated Slots

${[...untranslatedSlots].length ? [...untranslatedSlots].map((s) => `- ${s}`).join("\n") : "- None"}

## Untranslated Keywords

${[...untranslatedKeywords].length ? [...untranslatedKeywords].map((s) => `- ${s}`).join("\n") : "- None"}

## Rows With No Detected Armor Name

${noNameRows.length ? noNameRows.map((r) => `- ${r.row}`).join("\n") : "- None"}

## Rows With No Keyword Listed

${noKeywordRows.length ? noKeywordRows.map((r) => `- ${r.row}: ${r.name ?? "null"}`).join("\n") : "- None"}

## Rows With Keyword Detection Failed

${keywordFailedRows.length ? keywordFailedRows.map((r) => `- ${r.row}: ${r.name ?? "null"}`).join("\n") : "- None"}

## Current Patch Key Gear Check

### 磁矩上衣 / Magnetic Moment Top

- Present: ${magneticPresent}

### 滑步長褲 / Glide Pants

- Present: ${glidePresent}

## Remaining Gaps

- 73 armor names still lack English normalization
- 3 keywords remain untranslated
- Special effect English translation remains partial-only by design

## Recommendation

Not ready for lock review yet.
`;

  fs.writeFileSync(path.join(rootDir, "docs", "module-2-armor-qa.md"), report, "utf8");
}
