import * as fs from 'fs/promises';
import * as path from 'path';
import { createPipelineConfig } from '../src/pipeline/config';
import { generateMeta } from '../src/pipeline/metaGenerator';
import { safeWrite } from '../src/pipeline/safeWriter';

interface BindictFileEntry {
  path?: string;
  file?: string;
  source?: string;
  output?: string;
  parsed?: unknown;
  parseWarnings?: string[];
  [key: string]: unknown;
}

/**
 * Sanitize a file path into a safe filename for output.
 * Takes the basename, strips extension, and replaces unsafe chars.
 */
function sanitizeTableName(filePath: string): string {
  const base = path.basename(filePath).replace(/\.[^.]+$/, '');
  return base.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

/**
 * Convert parsed field to a record array (same logic as inventoryScanner).
 */
function toRecordArray(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );
  }

  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    const keys = Object.keys(obj);

    // Unwrap {data: {...}} wrapper
    if (keys.length === 1 && keys[0] === 'data' && obj.data !== null &&
        typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      const inner = obj.data as Record<string, unknown>;
      return Object.values(inner).filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      );
    }

    return Object.values(obj).filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );
  }

  return [];
}

async function main(): Promise<void> {
  const config = createPipelineConfig();
  const scanPath = process.argv[2] || config.defaultSourceScanPath;

  console.log(`[decode:all] Reading: ${scanPath}`);
  const raw = await fs.readFile(scanPath, 'utf-8');
  const scanData = JSON.parse(raw);

  const files: BindictFileEntry[] = scanData.files || [];
  console.log(`[decode:all] Found ${files.length} file entries in scan data`);

  let decoded = 0;
  let skipped = 0;
  let errored = 0;
  const errors: Array<{ file: string; error: string }> = [];

  for (const fileEntry of files) {
    if (!fileEntry || !fileEntry.parsed) {
      skipped++;
      continue;
    }

    const sourceFile = fileEntry.path || fileEntry.file || fileEntry.source || 'unknown';
    const tableName = sanitizeTableName(sourceFile);

    try {
      const records = toRecordArray(fileEntry.parsed);

      if (records.length === 0) {
        skipped++;
        continue;
      }

      // Serialize just this table's parsed content for hashing
      const tableContent = JSON.stringify(fileEntry.parsed);

      const meta = generateMeta({
        sourceFile: path.basename(sourceFile),
        sourceScannedPath: sourceFile,
        extractionMethod: 'bindict',
        recordCount: records.length,
        sourceContent: tableContent,
        config,
      });

      const output = {
        _meta: meta,
        records,
      };

      const outputJson = JSON.stringify(output, null, 2);
      await safeWrite(`raw/${tableName}.raw.json`, outputJson, config);
      decoded++;

      if (decoded % 100 === 0) {
        console.log(`[decode:all] Progress: ${decoded} tables decoded...`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ file: sourceFile, error: msg });
      errored++;
    }
  }

  // Write a decode summary
  const summary = {
    _meta: generateMeta({
      sourceFile: 'bindict_scan.json',
      sourceScannedPath: config.defaultSourceScanPath,
      extractionMethod: 'bindict',
      recordCount: decoded,
      sourceContent: raw.slice(0, 1000), // Just use first 1KB for summary hash
      config,
    }),
    totalFileEntries: files.length,
    decoded,
    skipped,
    errored,
    errors: errors.slice(0, 50), // Cap error list at 50
  };

  await safeWrite('raw/_decode-summary.json', JSON.stringify(summary, null, 2), config);

  console.log(`[decode:all] Complete.`);
  console.log(`  Decoded: ${decoded} tables`);
  console.log(`  Skipped: ${skipped} (no parsed data or empty records)`);
  console.log(`  Errors:  ${errored}`);
  console.log(`  Output:  ${path.resolve(config.decodedOutputDir, 'raw/')}`);

  if (errors.length > 0) {
    console.log(`\n  First few errors:`);
    for (const e of errors.slice(0, 5)) {
      console.log(`    ${path.basename(e.file)}: ${e.error}`);
    }
  }
}

main().catch((err) => {
  console.error('[decode:all] FATAL:', err.message);
  process.exit(1);
});
