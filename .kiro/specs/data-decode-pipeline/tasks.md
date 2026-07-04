# Tasks

## Task 1: Create pipeline directory structure and types
- [x] Create the output directory and core type definitions
  - [x] Create `src/ohai/data/generated/decoded/.gitkeep` to ensure the output directory exists in version control
  - [x] Create `src/ohai/src/pipeline/types.ts` with all TypeScript interfaces: `ConfidenceLevel`, `ExtractionMethod`, `VerificationStatus`, `MetaBlock`, `TableInventoryEntry`, `TableInventoryManifest`, `PipelineConfig`

## Task 2: Implement pipeline config module
- [x] Create the pipeline configuration with constants and path resolution
  - [x] Create `src/ohai/src/pipeline/config.ts` with `createPipelineConfig()` factory function
  - [x] Config must resolve `decodedOutputDir` to absolute path `src/ohai/data/generated/decoded/`
  - [x] Config must include `defaultSourceScanPath` pointing to `C:\Users\tyr3x\Downloads\makeoh\.codex\neox_probe\script_extract_full\bindict_scan.json`
  - [x] Config must include `pipelineVersion: '0.1.0'`

**Dependencies:** Task 1

## Task 3: Implement safe output writer
- [x] Create a writer that enforces the output boundary and refuses writes outside `generated/decoded/`
  - [x] Create `src/ohai/src/pipeline/safeWriter.ts` with `safeWrite(relativePath, content, config)` function
  - [x] Writer must resolve paths via `path.resolve()` and verify the resolved path starts with `config.decodedOutputDir`
  - [x] Writer must use case-insensitive comparison on Windows
  - [x] Writer must throw Error with descriptive message if path escapes boundary (no file written)
  - [x] Writer must create parent directories automatically via `fs.mkdir({ recursive: true })`
  - [x] Writer must reject absolute paths and paths starting with `/` or `\`

**Dependencies:** Task 2

## Task 4: Implement _meta generator
- [x] Create the metadata block factory for provenance tracking
  - [x] Create `src/ohai/src/pipeline/metaGenerator.ts` with `generateMeta(options)` function
  - [x] Must compute SHA-256 hex digest of `sourceContent` string
  - [x] Must produce ISO 8601 timestamp with timezone `Z` for `decodedAt`
  - [x] Must include `pipelineVersion` from config

**Dependencies:** Task 2

## Task 5: Implement inventory scanner
- [x] Create the core logic that scans bindict_scan.json and produces table inventory entries
  - [x] Create `src/ohai/src/pipeline/inventoryScanner.ts` with `buildInventory(scanData, config)` and `scanTable(fileEntry)` functions
  - [x] Scanner must iterate `files[]` array and process only entries with truthy `parsed` field
  - [x] Must extract all unique field names from records (union of all keys across all records in a table)
  - [x] Must identify likely primary key: first field matching `/^id$/i`, or first field where all sampled values are integers
  - [x] Must count records (array length or dict key count)
  - [x] Must take up to 3 sample records verbatim (no field renaming)
  - [x] Must set confidence to `'decoded'` when fully parsed, `'inferred'` when parseWarnings is non-empty
  - [x] Must catch parse errors per-table and record them in `parseWarnings` instead of crashing

**Dependencies:** Task 3, Task 4

## Task 6: Create npm script entry points
- [x] Add script entry points and wire up npm commands
  - [x] Create `src/ohai/scripts/decodeInventory.ts` entry point that reads bindict_scan.json (from CLI arg or default path), calls buildInventory, and writes via safeWrite
  - [x] Create `src/ohai/scripts/decodeAll.ts` stub that prints "Phase 0: decode:all not yet implemented" and exits 0
  - [x] Create `src/ohai/scripts/validateDecoded.ts` stub that prints "Phase 0: validate:decoded not yet implemented" and exits 0
  - [x] Add npm scripts to `src/ohai/package.json`: `decode:inventory`, `decode:all`, `validate:decoded`

**Dependencies:** Task 5

## Task 7: Implement smoke tests
- [x] Create tests proving the pipeline infrastructure works correctly
  - [x] Create `src/ohai/scripts/pipeline/__tests__/safeWriterSmokeTest.ts` — tests that safeWrite rejects `../escape.json`, `/absolute/path.json`, and `../../etc/hosts` while accepting valid relative paths
  - [x] Create `src/ohai/scripts/pipeline/__tests__/inventorySmokeTest.ts` — tests with a small inline fixture (3 fake file entries) verifying fieldNames extraction, recordCount, sampleRecords bound, likelyPrimaryKey detection, and parseWarnings for broken entries
  - [x] Create `src/ohai/scripts/pipeline/__tests__/metaSmokeTest.ts` — tests that sourceHash is deterministic, decodedAt is valid ISO, pipelineVersion matches config
  - [x] Add npm scripts to `src/ohai/package.json`: `test:pipeline:writer`, `test:pipeline:inventory`, `test:pipeline:meta`

**Dependencies:** Task 6

## Task 8: Run decode:inventory and verify output
- [x] Execute the pipeline against the real bindict_scan.json and verify the output
  - [x] Run all pipeline smoke tests (`test:pipeline:writer`, `test:pipeline:inventory`, `test:pipeline:meta`) and fix any failures
  - [x] Run `npm run decode:inventory` against the real `bindict_scan.json` and capture output
  - [x] Verify `table-inventory.json` was written to `src/ohai/data/generated/decoded/table-inventory.json`
  - [x] Verify output includes `_meta` block with all required fields (sourceFile, sourceScannedPath, extractionMethod, decodedAt, recordCount, sourceHash, pipelineVersion)
  - [x] Report: number of tables discovered, any parse warnings, exact output paths

**Dependencies:** Task 7
