import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

export type WorkbookCandidate = {
  path: string;
  fileName: string;
};

export function ensureDataFolders(rootDir: string): void {
  for (const relative of ["data/raw", "data/extracted", "data/verified"]) {
    fs.mkdirSync(path.join(rootDir, relative), { recursive: true });
  }
}

export function findWorkbookCandidates(rootDir: string): WorkbookCandidate[] {
  const candidates = new Map<string, WorkbookCandidate>();
  const rawRoot = path.join(rootDir, "data", "raw");

  if (fs.existsSync(rawRoot)) {
    scanRecursive(rawRoot, candidates);
    if (candidates.size > 0) {
      return [...candidates.values()].sort((a, b) => a.path.localeCompare(b.path));
    }
  }

  if (fs.existsSync(rootDir)) {
    scanRecursive(rootDir, candidates);
  }

  return [...candidates.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function scanRecursive(dir: string, candidates: Map<string, WorkbookCandidate>): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      scanRecursive(fullPath, candidates);
      continue;
    }

    if (/\.xlsx$/i.test(entry.name)) {
      candidates.set(fullPath.toLowerCase(), { path: fullPath, fileName: entry.name });
    }
  }
}

export function copyWorkbookToRaw(rootDir: string, workbookPath: string): string {
  const rawDir = path.join(rootDir, "data", "raw");
  fs.mkdirSync(rawDir, { recursive: true });
  const targetPath = path.join(rawDir, path.basename(workbookPath));
  if (path.resolve(targetPath).toLowerCase() !== path.resolve(workbookPath).toLowerCase()) {
    fs.copyFileSync(workbookPath, targetPath);
  }
  return targetPath;
}

export async function openWorkbook(workbookPath: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  return workbook;
}

export function readSheetAsMatrix(workbook: ExcelJS.Workbook, sheetName: string): unknown[][] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];

  const maxColumns = sheet.actualColumnCount || sheet.columnCount || 0;
  const rows: unknown[][] = [];

  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const values: unknown[] = [];
    for (let columnNumber = 1; columnNumber <= maxColumns; columnNumber += 1) {
      values.push(readCellValue(row.getCell(columnNumber)));
    }
    rows.push(values);
  }

  return rows;
}

export function listSheetNames(workbook: ExcelJS.Workbook): string[] {
  return workbook.worksheets.map((sheet) => sheet.name);
}

function readCellValue(cell: ExcelJS.Cell): unknown {
  if (cell.isMerged && cell.master && cell.master.address !== cell.address) {
    return readCellValue(cell.master);
  }

  const value = cell.value;
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    const anyValue = value as { formula?: string; result?: unknown; text?: string; richText?: Array<{ text: string }> };
    if (anyValue.result !== undefined && anyValue.result !== null) {
      return anyValue.result;
    }
    if (anyValue.richText && Array.isArray(anyValue.richText)) {
      const text = anyValue.richText.map((part) => part.text).join("");
      return text || null;
    }
    if (anyValue.text !== undefined && anyValue.text !== null && String(anyValue.text).trim()) {
      return anyValue.text;
    }
    if (anyValue.formula) {
      return `=${anyValue.formula}`;
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return value;
}
