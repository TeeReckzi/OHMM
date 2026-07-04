# Requirements Document

## Introduction

The Data Decode Pipeline is a structural decoding and provenance-preserving normalization system for OHMM. It reverse-engineers Once Human binary data tables (bindict format, NPK archives, compiled Python bytecode) into typed JSON outputs, builds cross-reference maps between game entities, and compares decoded records against existing verified data — all without inventing gameplay interpretations or modifying the application UI.

The pipeline produces a decoded table inventory, raw JSON outputs, normalized candidate records, a conflict report against verified registries, validator scripts, and a list of questions requiring human verification. Decoded outputs are written to a separate `generated/decoded` directory and never overwrite existing verified data.

## Glossary

- **Decoder**: The Python `bindict_parser.py` module that reads binary dictionary (bindict) format files into raw Python data structures
- **Extractor**: A TypeScript or Python script that transforms raw parsed data into structured JSON (e.g., `extractWeapons.ts`, `extract_script_npk.py`)
- **Bindict**: NetEase's proprietary binary serialization format used for game data tables in Once Human (NeoX engine)
- **Bindict_Scan**: The pre-parsed JSON index at the configurable source path (default: `C:\Users\tyr3x\Downloads\makeoh\.codex\neox_probe\script_extract_full\bindict_scan.json`) containing decoded payloads for all extracted `.pyc` table files
- **NPK_Archive**: A compressed archive (NXPK header) containing game scripts and data tables, optionally encrypted and Zstandard-compressed
- **Registry**: A TypeScript module in `src/ohai/src/ui/registries/` that provides typed item data to the UI and engine
- **Verified_Data**: Locked JSON snapshots in `src/ohai/data/verified/` confirmed via in-game observation or authoritative sources (modules M0–M15)
- **Canonical_ID**: A deterministic, human-readable identifier derived from record source fields (e.g., `weapon-deserteagle-10111100`)
- **Provenance_Record**: Metadata attached to every normalized record documenting its source file, extraction method, confidence level, and verification status
- **Confidence_Level**: One of `project_verified`, `observed`, `decoded`, `inferred`, or `placeholder` — indicating trust in a record's accuracy
- **Cross_Reference_Map**: A JSON structure linking entity IDs across tables (e.g., weapon → ammo → buff → keyword effect)
- **Conflict_Report**: A structured comparison between decoded records and existing verified data identifying exact matches, partial matches, discrepancies, and missing entries
- **Generated_Decoded_Directory**: The output path `src/ohai/data/generated/decoded/` where all new decoded outputs are written before human review
- **Source_Scan_Path**: The configurable filesystem path to the Bindict_Scan JSON file, passed as a CLI argument or environment variable to pipeline scripts

## Requirements

### Requirement 1: Table Inventory Discovery

**User Story:** As a data engineer, I want a complete inventory of every available data table in the extraction pipeline, so that I can understand the full scope of decodable game data.

#### Acceptance Criteria

1. WHEN the inventory script is executed with a Source_Scan_Path argument, THE Decoder SHALL scan all table entries in the Bindict_Scan JSON (not limited to the 9 currently named tables) and produce a manifest JSON file
2. THE Inventory_Manifest SHALL include for each table: source file path, record count, field names, likely primary key, likely foreign keys, up to 3 sample records, and a Confidence_Level
3. WHEN a source file cannot be fully parsed, THE Decoder SHALL record the table entry with a Confidence_Level of `inferred` and include a `parseWarnings` array describing the failure points
4. THE Inventory_Manifest SHALL be written to the Generated_Decoded_Directory as `table-inventory.json`
5. THE Decoder SHALL not modify or overwrite any file outside the Generated_Decoded_Directory during inventory generation
6. THE Inventory_Manifest SHALL include a `sourceScannedPath` field recording the Source_Scan_Path used for reproducibility

### Requirement 2: Raw Record Decoding

**User Story:** As a data engineer, I want every discovered table decoded into raw JSON without field renaming or interpretation, so that I have a faithful representation of the source binary data.

#### Acceptance Criteria

1. WHEN the decode script is executed for a given table, THE Decoder SHALL produce a JSON file containing all records with original field names preserved exactly as recovered from the binary source
2. THE Decoder SHALL not rename, translate, or reformat any field name or string value during raw decoding
3. THE Decoder SHALL preserve numeric precision: integers remain integers, floats retain their binary32 or binary64 representation
4. WHEN a field contains a raw token, generated text, or machine-translated string, THE Decoder SHALL preserve the value verbatim without cleanup
5. EACH raw decoded output file SHALL include a top-level `_meta` object containing: `sourceFile`, `extractionMethod` (one of `bindict`, `npk_script`, `pyc_bytecode`, `workbook`), `decodedAt` (ISO 8601 timestamp), and `recordCount`
6. THE Decoder SHALL write raw decoded outputs to `{Generated_Decoded_Directory}/raw/{tableName}.raw.json`

### Requirement 3: Provenance Tracking

**User Story:** As a data engineer, I want every normalized record to carry provenance metadata, so that I can trace any value back to its origin and assess its reliability.

#### Acceptance Criteria

1. THE Normalizer SHALL attach a Provenance_Record to every output record containing: `sourceFile`, `extractionMethod`, `confidence` (one of the defined Confidence_Level values), and `verificationStatus` (one of `verified`, `manual`, `generated`, `decoded`, `inferred`)
2. WHEN a record matches an existing entry in Verified_Data, THE Normalizer SHALL set the `verificationStatus` to `verified` and the `confidence` to `project_verified`
3. WHEN a record is decoded from binary without any corroborating verified source, THE Normalizer SHALL set `verificationStatus` to `decoded` and `confidence` to `decoded`
4. WHEN provenance cannot be fully determined for a record, THE Normalizer SHALL set `confidence` to `inferred` and include a `provenanceNotes` string describing what is uncertain
5. THE Normalizer SHALL not assign `project_verified` confidence to any record that has not been matched against Verified_Data

### Requirement 4: Cross-Reference Map Construction

**User Story:** As a data engineer, I want cross-reference maps linking weapons, armor, mods, suffixes, foods, deviations, cradle perks, and effect tables, so that I can understand foreign key relationships between game entities.

#### Acceptance Criteria

1. WHEN the cross-reference builder is executed, THE Pipeline SHALL produce a `cross-references.json` file mapping entity IDs across decoded tables
2. THE Cross_Reference_Map SHALL include mappings for: weapons to ammo types, weapons to compatible mod families, armor to set bonuses, mods to suffix pools, food buffs to stat effects, deviations to stat effects, cradle perks to conditional effects, and keyword effects to stat/modifier tables
3. WHEN a foreign key reference in a decoded record points to an ID not found in any decoded table, THE Pipeline SHALL record it in a `unresolvedReferences` array within the cross-reference output
4. THE Pipeline SHALL not invent or guess relationships that are not explicitly present as ID references in the decoded data
5. THE Cross_Reference_Map SHALL be written to `{Generated_Decoded_Directory}/cross-references.json`

### Requirement 5: Conflict Detection Against Verified Data

**User Story:** As a data engineer, I want a conflict report comparing decoded records against existing verified registries, so that I can identify discrepancies, missing data, and validate decode accuracy.

#### Acceptance Criteria

1. WHEN the conflict detector is executed, THE Pipeline SHALL compare decoded records against all files in `src/ohai/data/verified/` and the `verifiedModFamilies.ts` registry
2. THE Conflict_Report SHALL categorize each comparison result as one of: `exact_match`, `partial_match`, `conflict`, `missing_in_decoded`, `missing_in_verified`, or `unknown_field`
3. WHEN a decoded record conflicts with a verified record, THE Conflict_Report SHALL include both values, the field path where divergence occurs, and the source files for each side
4. THE Conflict_Report SHALL identify records containing raw token text or generated effect descriptions that differ from verified human-written descriptions
5. THE Conflict_Report SHALL flag duplicate canonical names within the decoded data set
6. THE Conflict_Report SHALL be written to `{Generated_Decoded_Directory}/conflict-report.json`
7. THE Pipeline SHALL not modify any verified data file regardless of conflict detection results

### Requirement 6: Normalized Candidate Output

**User Story:** As a data engineer, I want normalized candidate JSON files that are structurally compatible with existing registries, so that verified records can eventually be promoted into the staging pipeline.

#### Acceptance Criteria

1. THE Normalizer SHALL produce candidate JSON files using the same schema structure as existing verified JSON files (matching field names, nesting, and types)
2. THE Normalizer SHALL assign a Canonical_ID to every record using a deterministic derivation from source fields (entity type prefix + identifying fields)
3. WHEN a decoded field value contains raw binary tokens, untranslated placeholder text, or machine-generated descriptions, THE Normalizer SHALL preserve the raw value in an `_raw` suffixed field and leave the canonical field empty rather than inventing a description
4. THE Normalizer SHALL not assign any Confidence_Level higher than `decoded` to records that have not been human-verified
5. THE Normalizer SHALL write candidate outputs to `{Generated_Decoded_Directory}/normalized/{tableName}.candidate.json`
6. THE Normalizer SHALL not overwrite any file in `src/ohai/data/verified/` or `src/ohai/src/ui/registries/`

### Requirement 7: Validation Scripts

**User Story:** As a data engineer, I want automated validators that check structural integrity of decoded outputs, so that I can catch data corruption, duplicates, and broken references before human review.

#### Acceptance Criteria

1. THE Validator SHALL check that no two records within the same decoded table share the same Canonical_ID
2. THE Validator SHALL check that every record contains all required fields defined by the table schema (no missing required fields)
3. WHEN a record contains a foreign key reference that cannot be resolved against any decoded or verified table, THE Validator SHALL emit a warning (not a hard failure) identifying the unresolved reference
4. THE Validator SHALL check that no record marked with `verificationStatus: "verified"` or `confidence: "project_verified"` exposes raw token text or generated descriptions in user-facing fields
5. THE Validator SHALL verify that all records present in existing Verified_Data still produce matching outputs when re-decoded (regression guard)
6. WHEN validation completes, THE Validator SHALL produce a `validation-report.json` in the Generated_Decoded_Directory summarizing pass/fail counts, warning counts, and specific failure details
7. THE Validator SHALL exit with a non-zero status code when any hard failure (duplicate IDs, missing required fields, verified record regression) is detected

### Requirement 8: Human Verification Queue

**User Story:** As a data engineer, I want a list of questions and ambiguities that require human verification, so that I can prioritize manual review of decoded data.

#### Acceptance Criteria

1. WHEN the pipeline encounters a decoded record with ambiguous field semantics, conflicting cross-references, or Confidence_Level below `decoded`, THE Pipeline SHALL add an entry to the human verification queue
2. THE Human_Verification_Queue SHALL include for each entry: the record's Canonical_ID, source file, the specific field or relationship in question, a plain-language description of the ambiguity, and a suggested resolution action
3. THE Pipeline SHALL not auto-resolve ambiguities by inventing descriptions, stat meanings, or Once Human game mechanics
4. THE Human_Verification_Queue SHALL be written to `{Generated_Decoded_Directory}/human-verification-queue.json`

### Requirement 9: Output Isolation

**User Story:** As a data engineer, I want all decoded pipeline outputs written to a separate directory, so that existing verified registries and UI code remain untouched until human review is complete.

#### Acceptance Criteria

1. THE Pipeline SHALL write all outputs (raw decoded JSON, normalized candidates, cross-references, conflict reports, validation reports, human verification queue) exclusively to the Generated_Decoded_Directory (`src/ohai/data/generated/decoded/`)
2. THE Pipeline SHALL not modify, overwrite, or delete any file in `src/ohai/data/verified/`, `src/ohai/src/ui/registries/`, or any UI component file
3. THE Pipeline SHALL not modify the application UI or any presentation-layer code
4. WHEN the Generated_Decoded_Directory does not exist, THE Pipeline SHALL create it before writing outputs

### Requirement 10: Existing Pipeline Integration

**User Story:** As a data engineer, I want the decode pipeline to reuse existing decoder, extractor, and bindict tooling, so that I avoid duplicating complex binary parsing logic.

#### Acceptance Criteria

1. THE Pipeline SHALL use the existing `bindict_parser.py` module for all bindict format decoding
2. THE Pipeline SHALL use the existing `npk_archive_reader.py` and `npk_decrypt_helpers.py` modules for NPK archive extraction
3. THE Pipeline SHALL use the existing `index_bindict_scan.py` scoring logic to prioritize tables for decoding
4. WHEN the existing decoder encounters an unknown marker type or parse failure, THE Pipeline SHALL log the failure with source offset and marker byte, skip the record, and continue processing remaining records
5. THE Pipeline SHALL be executable via npm scripts registered in the `src/ohai/package.json` file (e.g., `npm run decode:inventory`, `npm run decode:all`, `npm run validate:decoded`)
6. THE Pipeline SHALL accept the Source_Scan_Path as a CLI argument (defaulting to the path recorded in `official-runtime-catalog.json`) so the source location is configurable without code changes
