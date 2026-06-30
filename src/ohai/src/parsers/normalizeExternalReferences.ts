import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const REF_DIR = path.join(ROOT_DIR, "data", "extracted", "external-references");

interface ReferenceEntry {
  index: number;
  englishName: string;
  iconUrl: string;
  sourceFile: string;
}

interface NormalizedFile {
  module: string;
  sourceFile: string;
  importedAt: string;
  rawLines: number;
  uniqueNames: number;
  duplicatesRemoved: number;
  entries: ReferenceEntry[];
}

type ParsedRow = { name: string; url: string } | null;

function parseTxtLine(line: string, sourceFile: string): ParsedRow {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const tabIdx = trimmed.indexOf("\t");
  if (tabIdx === -1) return null;

  const name = trimmed.slice(0, tabIdx).trim();
  const url = trimmed.slice(tabIdx + 1).trim();

  if (!name || !url) return null;
  if (!url.startsWith("http")) return null;

  return { name, url };
}

function shouldSkipWeaponTag(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith("#t(")) return true;
  if (lower.startsWith("unlock items for testing")) return true;
  return false;
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function parseWeaponlist(lines: string[], sourceFile: string): NormalizedFile {
  const entries: ReferenceEntry[] = [];
  const seen = new Set<string>();
  let rawLines = 0;
  let skippedHeader = false;

  for (const line of lines) {
    if (!skippedHeader) {
      skippedHeader = true;
      continue;
    }
    rawLines++;
    const parsed = parseTxtLine(line, sourceFile);
    if (!parsed) continue;
    if (shouldSkipWeaponTag(parsed.name)) continue;

    const normalized = normalizeName(parsed.name);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    entries.push({
      index: entries.length + 1,
      englishName: normalized,
      iconUrl: parsed.url,
      sourceFile,
    });
  }

  return {
    module: "external_reference_weaponlist",
    sourceFile,
    importedAt: new Date().toISOString(),
    rawLines,
    uniqueNames: entries.length,
    duplicatesRemoved: rawLines - entries.length,
    entries,
  };
}

function parseGenericList(lines: string[], sourceFile: string): NormalizedFile {
  const entries: ReferenceEntry[] = [];
  const seen = new Set<string>();
  let rawLines = 0;
  let skippedHeader = false;

  for (const line of lines) {
    if (!skippedHeader) {
      skippedHeader = true;
      continue;
    }
    rawLines++;
    const parsed = parseTxtLine(line, sourceFile);
    if (!parsed) continue;

    const normalized = normalizeName(parsed.name);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    entries.push({
      index: entries.length + 1,
      englishName: normalized,
      iconUrl: parsed.url,
      sourceFile,
    });
  }

  const fileId = sourceFile.replace(/\.txt$/i, "").toLowerCase();

  return {
    module: `external_reference_${fileId}`,
    sourceFile,
    importedAt: new Date().toISOString(),
    rawLines,
    uniqueNames: entries.length,
    duplicatesRemoved: rawLines - entries.length,
    entries,
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const files = fs.readdirSync(REF_DIR);
  const txtFiles = files.filter((f) => f.endsWith(".txt"));

  for (const txtFile of txtFiles) {
    const content = fs.readFileSync(path.join(REF_DIR, txtFile), "utf8");
    const lines = content.split(/\r?\n/);
    const jsonOutputPath = path.join(
      REF_DIR,
      txtFile.replace(/\.txt$/i, ".normalized.json")
    );

    let result: NormalizedFile;

    if (txtFile.toLowerCase() === "weaponlist.txt") {
      result = parseWeaponlist(lines, txtFile);
    } else {
      result = parseGenericList(lines, txtFile);
    }

    fs.writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2), "utf8");

    console.log(
      `${txtFile} -> ${path.basename(jsonOutputPath)}: ` +
        `${result.rawLines} raw lines, ${result.uniqueNames} unique, ` +
        `${result.duplicatesRemoved} dups removed`
    );
  }
}
