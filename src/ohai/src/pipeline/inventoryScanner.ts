import { PipelineConfig, TableInventoryEntry, TableInventoryManifest } from './types';
import { generateMeta } from './metaGenerator';

/** Shape of a file entry in bindict_scan.json */
interface BindictFileEntry {
  path?: string;
  file?: string;
  source?: string;
  output?: string;
  extension?: string;
  parsed?: unknown;
  parseWarnings?: string[];
  [key: string]: unknown;
}

interface BindictScan {
  files?: BindictFileEntry[];
  [key: string]: unknown;
}

/**
 * Identify the most likely primary key field from a set of records.
 * Priority: field named "id" (case-insensitive), then first field with all-integer values.
 */
function identifyPrimaryKey(records: Record<string, unknown>[]): string | null {
  if (records.length === 0) return null;

  const firstRecord = records[0];
  const keys = Object.keys(firstRecord);

  // Priority 1: field named "id" (case-insensitive)
  const idField = keys.find((k) => /^id$/i.test(k));
  if (idField) return idField;

  // Priority 2: first field where all sampled values are integers
  const sample = records.slice(0, 10);
  for (const key of keys) {
    const allIntegers = sample.every((r) => {
      const v = r[key];
      return typeof v === 'number' && Number.isInteger(v);
    });
    if (allIntegers) return key;
  }

  return null;
}

/**
 * Convert a parsed field (array or dict) into an array of records.
 * Handles the common bindict_scan pattern where parsed is {data: {key: record, ...}}.
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

    // Unwrap common {data: {...}} wrapper pattern from bindict_scan
    // If the object has exactly one key "data" whose value is a non-array object,
    // treat the inner object's values as the records.
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === 'data' && obj.data !== null &&
        typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      const inner = obj.data as Record<string, unknown>;
      return Object.values(inner).filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      );
    }

    // Dict-keyed table: each value is a record
    return Object.values(obj).filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );
  }

  return [];
}

/**
 * Truncate a sample record to stay within a maximum serialized size.
 * This prevents the inventory manifest from exceeding V8 string limits
 * when processing thousands of tables with large records.
 */
const MAX_SAMPLE_BYTES = 10_000; // 10 KB per sample record

function truncateSample(record: Record<string, unknown>): Record<string, unknown> {
  const serialized = JSON.stringify(record);
  if (serialized.length <= MAX_SAMPLE_BYTES) return record;

  // Build a shallow copy with truncated field values
  const truncated: Record<string, unknown> = {};
  let currentSize = 2; // '{}'
  const keys = Object.keys(record);

  for (const key of keys) {
    const value = record[key];
    const fieldStr = JSON.stringify({ [key]: value });
    const fieldSize = fieldStr.length - 2; // minus the outer braces

    if (currentSize + fieldSize + 1 > MAX_SAMPLE_BYTES) {
      truncated['_truncated'] = true;
      truncated['_originalFieldCount'] = keys.length;
      break;
    }
    truncated[key] = value;
    currentSize += fieldSize + 1; // +1 for comma
  }

  return truncated;
}

/**
 * Scan a single file entry and produce a TableInventoryEntry.
 */
export function scanTable(fileEntry: BindictFileEntry): TableInventoryEntry {
  const sourceFile = fileEntry.path || fileEntry.file || fileEntry.source || 'unknown';
  const sourcePath = fileEntry.output || sourceFile;
  const parseWarnings: string[] = [];

  // Carry over any existing parseWarnings from the file entry
  if (Array.isArray(fileEntry.parseWarnings)) {
    for (const w of fileEntry.parseWarnings) {
      if (typeof w === 'string') parseWarnings.push(w);
    }
  }

  let records: Record<string, unknown>[] = [];

  try {
    records = toRecordArray(fileEntry.parsed);
    if (records.length === 0 && fileEntry.parsed != null) {
      parseWarnings.push(
        `Parsed field present but yielded 0 valid records (type: ${typeof fileEntry.parsed})`
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    parseWarnings.push(`Error processing parsed field: ${msg}`);
  }

  // Extract unique field names (union of all keys)
  const fieldNameSet = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      fieldNameSet.add(key);
    }
  }

  const fieldNames = Array.from(fieldNameSet);
  const likelyPrimaryKey = identifyPrimaryKey(records);
  const recordCount = records.length;
  const sampleRecords = records.slice(0, 3).map(truncateSample);
  const confidence = parseWarnings.length > 0 ? 'inferred' as const : 'decoded' as const;

  return {
    sourceFile,
    sourcePath,
    fieldNames,
    likelyPrimaryKey,
    recordCount,
    sampleRecords,
    confidence,
    parseWarnings,
  };
}

/**
 * Build the full inventory manifest from a bindict scan.
 */
export async function buildInventory(
  scanData: { files: Array<{ file?: string; path?: string; parsed?: unknown; parseWarnings?: string[]; [key: string]: unknown }> },
  config: PipelineConfig,
  rawSourceContent?: string
): Promise<TableInventoryManifest> {
  const files = scanData.files || [];
  const tables: TableInventoryEntry[] = [];

  for (const fileEntry of files) {
    if (!fileEntry || !fileEntry.parsed) continue;

    try {
      const entry = scanTable(fileEntry as BindictFileEntry);
      tables.push(entry);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const sourceFile = fileEntry.path || fileEntry.file || 'unknown';
      tables.push({
        sourceFile,
        sourcePath: sourceFile,
        fieldNames: [],
        likelyPrimaryKey: null,
        recordCount: 0,
        sampleRecords: [],
        confidence: 'inferred',
        parseWarnings: [`Fatal scan error: ${msg}`],
      });
    }
  }

  const totalRecords = tables.reduce((sum, t) => sum + t.recordCount, 0);
  const sourceContent = rawSourceContent || JSON.stringify(scanData);

  const meta = generateMeta({
    sourceFile: 'bindict_scan.json',
    sourceScannedPath: config.defaultSourceScanPath,
    extractionMethod: 'bindict',
    recordCount: totalRecords,
    sourceContent,
    config,
  });

  return {
    _meta: meta,
    sourceScannedPath: config.defaultSourceScanPath,
    tableCount: tables.length,
    tables,
  };
}
