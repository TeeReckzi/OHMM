/** Trust level for a decoded record — ordered from highest to lowest confidence */
export type ConfidenceLevel =
  | 'project_verified'
  | 'observed'
  | 'decoded'
  | 'inferred'
  | 'placeholder';

/** How the data was extracted from source */
export type ExtractionMethod =
  | 'bindict'
  | 'npk_script'
  | 'pyc_bytecode'
  | 'workbook';

/** Lifecycle status of a record's verification */
export type VerificationStatus =
  | 'verified'
  | 'manual'
  | 'generated'
  | 'decoded'
  | 'inferred';

/** Provenance metadata attached to every decoded output file */
export interface MetaBlock {
  sourceFile: string;
  sourceScannedPath: string;
  extractionMethod: ExtractionMethod;
  decodedAt: string;
  recordCount: number;
  sourceHash: string;
  pipelineVersion: string;
}

/** A single table entry in the inventory manifest */
export interface TableInventoryEntry {
  sourceFile: string;
  sourcePath: string;
  fieldNames: string[];
  likelyPrimaryKey: string | null;
  recordCount: number;
  sampleRecords: Record<string, unknown>[];
  confidence: ConfidenceLevel;
  parseWarnings: string[];
}

/** Top-level structure of table-inventory.json */
export interface TableInventoryManifest {
  _meta: MetaBlock;
  sourceScannedPath: string;
  tableCount: number;
  tables: TableInventoryEntry[];
}

/** Pipeline configuration constants */
export interface PipelineConfig {
  decodedOutputDir: string;
  defaultSourceScanPath: string;
  pipelineVersion: string;
}
