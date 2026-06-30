import fs from "node:fs";
import path from "node:path";
import { weaponsRawSchema, formatZodError } from "../schemas/weaponSchema";
import { makeUniqueWeaponId, normalizeWeaponRow } from "../utils/normalizeWeapon";
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
    console.log('Place the workbook in the project root or data/raw/ and rerun `npm run extract:weapons`.');
    return;
  }

  if (candidates.length > 1) {
    console.log("Multiple .xlsx workbooks were found:");
    for (const candidate of candidates) {
      console.log(`- ${candidate.path}`);
    }
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

  const weaponSheet = detectWeaponSheet(sheetNames);
  if (!weaponSheet) {
    console.log("No weapon sheet was found.");
    console.log(`Sheet names: ${sheetNames.join(", ")}`);
    console.log("Stop here: the workbook does not contain a recognizable weapon sheet.");
    return;
  }

  const rows = readSheetAsMatrix(workbook, weaponSheet);
  const headerDetection = detectHeaderRow(rows.slice(0, 30));
  const dataRows = rows.slice(headerDetection.rowIndex + 1);
  const headers = buildHeaders(rows[headerDetection.rowIndex] ?? [], headerDetection.warnings);
  const headersEnglishBestEffort = headers.map((header) => bestEffortHeaderEnglish(header));

  const items = [] as ReturnType<typeof buildItem>[];
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
    const normalized = normalizeWeaponRow(rowObject, originalRowNumber);
    const hasWeaponName = Boolean(normalized.nameOriginal || normalized.nameEnglish);
    if (!hasWeaponName) {
      rowWarnings.push(`Row ${originalRowNumber}: no detectable weapon name.`);
    }

    items.push(buildItem(rowObject, normalized, originalRowNumber));
  }

  const idCounts = new Map<string, number>();
  for (const item of items) {
    const baseId = item.normalized.id;
    idCounts.set(baseId, (idCounts.get(baseId) ?? 0) + 1);
  }

  for (const item of items) {
    const baseId = item.normalized.id;
    const occurrenceCount = idCounts.get(baseId) ?? 1;
    const uniqueId = makeUniqueWeaponId(baseId, item.originalRowNumber, occurrenceCount);
    if (uniqueId !== baseId) {
      item.normalized.id = uniqueId;
      item.normalized.notes = [...item.normalized.notes, `ID collision resolved with row suffix at row ${item.originalRowNumber}.`];
      rowWarnings.push(`Row ${item.originalRowNumber}: duplicate normalized.id resolved using row suffix.`);
    }
  }

  const output = {
    module: "weapons",
    moduleStatus: "raw_extracted_not_verified",
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceWorkbook: path.basename(rawWorkbookPath),
    sourceSheetOriginal: weaponSheet,
    sourceSheetEnglish: "Weapons",
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
      sheetNamesEnglish: sheetNames.map((name) => (name === weaponSheet ? "Weapons" : name))
    },
    extraction: {
      detectedSheetName: weaponSheet,
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

  const parsed = weaponsRawSchema.safeParse(output);
  if (!parsed.success) {
    console.error("Weapon extraction failed validation:");
    for (const line of formatZodError(parsed.error)) {
      console.error(`- ${line}`);
    }
    return;
  }

  const outputPath = path.join(ROOT_DIR, "data", "extracted", "weapons.raw.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed.data, null, 2), "utf8");

  const rawText = JSON.stringify(parsed.data);
  const hasAugOriginal = rawText.includes("AUG-電子雲");
  const hasAugEnglish = rawText.includes("AUG - Electron Cloud");
  const hasCompoundOriginal = rawText.includes("復合弓-無處可逃");
  const hasCompoundEnglish = rawText.includes("Compound Bow - Nowhere to Run");

  console.log(`Detected weapon sheet name: ${weaponSheet}`);
  console.log(`Detected header row: ${headerDetection.rowNumber}`);
  console.log(`Header confidence: ${headerDetection.confidence}`);
  const duplicateIdGroups = [...idCounts.values()].filter((count) => count > 1).length;
  console.log(`Weapon rows extracted: ${items.length}`);
  console.log(`Duplicate normalized.id groups before resolution: ${duplicateIdGroups}`);
  console.log(`Blank rows skipped: ${blankRowsSkipped}`);
  console.log(`AUG-電子雲 present: ${hasAugOriginal}`);
  console.log(`AUG - Electron Cloud normalized correctly: ${hasAugEnglish}`);
  console.log(`復合弓-無處可逃 present: ${hasCompoundOriginal}`);
  console.log(`Compound Bow - Nowhere to Run normalized correctly: ${hasCompoundEnglish}`);
  console.log(`Output written: ${outputPath}`);
  console.log(`Warnings: ${parsed.data.extraction.warnings.length ? parsed.data.extraction.warnings.join(" | ") : "none"}`);
  console.log("Stop here and wait for approval before Module 2.");
}

function detectWeaponSheet(sheetNames: string[]): string | null {
  const exact = sheetNames.find((name) => name === "武器");
  if (exact) return exact;

  const likely = sheetNames.find((name) => /武器/i.test(name) || /weapon/i.test(name) || /weapons/i.test(name));
  return likely ?? null;
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
  const top = sorted[0];
  const second = sorted[1];
  const warnings: string[] = [];
  if (second && top && second.score > 0 && Math.abs(top.score - second.score) <= 2) {
    warnings.push(`Header row candidates are close: ${sorted.slice(0, 3).map((item) => `row ${item.index + 1} (${item.score})`).join(", ")}`);
  }
  const confidence: "high" | "medium" | "low" = bestScore >= 12 ? "high" : bestScore >= 7 ? "medium" : "low";
  if (confidence === "low") warnings.push(`Header confidence is low for row ${bestIndex + 1}.`);

  return { rowIndex: bestIndex, rowNumber: bestIndex + 1, confidence, warnings };
}

function scoreHeaderRow(row: unknown[]): number {
  let score = 0;
  let textCount = 0;
  let nonEmptyCount = 0;
  const hints = [
    "武器",
    "名稱",
    "武器名稱",
    "類型",
    "種類",
    "關鍵詞",
    "效果",
    "傷害",
    "射速",
    "彈匣",
    "暴擊",
    "弱點",
    "元素",
    "weapon",
    "name",
    "type",
    "keyword",
    "effect",
    "damage",
    "fire rate",
    "magazine",
    "crit",
    "weakspot",
    "element"
  ];

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
    } else if (typeof cell === "number") {
      score -= 1;
    }
  }

  score += Math.min(nonEmptyCount, 12) * 0.4;
  if (textCount >= 3) score += 2;
  if (nonEmptyCount > 0 && textCount === 0) score -= 3;
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

function buildItem(original: Record<string, unknown>, normalized: ReturnType<typeof normalizeWeaponRow>, originalRowNumber: number) {
  return {
    sourceId: SOURCE_ID,
    sourceOriginalName: SOURCE_ORIGINAL_NAME,
    sourceSheetOriginal: "武器",
    sourceSheetEnglish: "Weapons" as const,
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
  const lowered = header.toLowerCase();
  if (lowered.includes("weapon") || lowered.includes("name") || lowered.includes("type") || lowered.includes("keyword") || lowered.includes("effect") || lowered.includes("damage") || lowered.includes("fire rate") || lowered.includes("magazine") || lowered.includes("crit") || lowered.includes("weakspot") || lowered.includes("element")) {
    return header;
  }
  if (header === "名稱") return "Name";
  if (header === "類型") return "Type";
  if (header === "關鍵詞") return "Keyword";
  if (header === "效果" || header === "特性") return "Effect";
  if (header === "元素") return "Element";
  if (header === "稀有度") return "Rarity";
  return null;
}
