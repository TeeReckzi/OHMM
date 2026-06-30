# Phase 0.5 — Clean Repository Workspace Transition

> Status: IN PROGRESS
> Date: 2026-06-16
> Purpose: Create clean workspace for MVP development, free from stale artifacts

---

## Objective

Create a clean project workspace so future OHAI development is not polluted by:
- Stale experiments and placeholders
- Duplicate data paths
- Old generated artifacts
- Abandoned UI branches
- Misleading sample logic

This phase is **mandatory** before major UI/user-testing work continues.

---

## Current State Analysis

### Repository Root (33 entries)

**Required for MVP:**
- ✅ `src/` — Main source code (already reorganized)
- ✅ `public/` — Static assets
- ✅ `package.json` — Dependencies
- ✅ `tsconfig.json`, `tsconfig.ui.json` — TypeScript config
- ✅ `vite.config.mjs` — Build config
- ✅ `tailwind.config.js` — Styling config
- ✅ `index.html` — Entry point
- ✅ `AGENTS.md` — Project instructions
- ✅ `README.md` — Project documentation
- ✅ `.gitignore`, `.gitattributes` — Git config

**Stale/Obsolete (Exclude):**
- ❌ `CHANGELOG.md` — Historical, not needed for MVP
- ❌ `CURRENT_STATE.md` — Stale state tracker
- ❌ `NEXT_TASK.md` — Stale task tracker
- ❌ `PROJECT_RULES.md` — Superseded by AGENTS.md
- ❌ `dev.log` — Development log
- ❌ `explore_sheets.js` — Old exploration script
- ❌ `oh_calc_scanner.py` — Old Python scanner
- ❌ `oncehumandatatables.xlsx` — Root-level workbook copy (gitignored)
- ❌ `七日世界.xlsx` — Source workbook (should be in data/raw/ only)
- ❌ `dist-ui/` — Build output
- ❌ `node_modules/` — Dependencies (will reinstall)
- ❌ `.local_phase_backup/` — Local backup

**Questionable (Review):**
- ⚠️ `tools/` — Python reverse-engineering tools (reference only)
- ⚠️ `data/` — Source data directory (needs review)
- ⚠️ `docs/` — Documentation (needs curation)
- ⚠️ `scripts/` — Build/audit scripts (needs review)

---

## Source Code Analysis (src/)

### Already Reorganized (Keep)

**Engine Layer:**
- ✅ `src/engine/` — 62 combat engine files (Batch 1)
- ✅ Pure combat logic, no React
- ✅ All tests passing

**Resolver Layer:**
- ✅ `src/resolvers/` — 6 effect resolver files (Batch 2)
- ✅ Pure logic, no React
- ✅ All tests passing

**Presentation Layer:**
- ✅ `src/presentation/` — 21 OHDB/presentation files (Batch 3)
- ✅ `src/presentation/ohdb/` — OHDB-specific data
- ✅ Image resolvers, presentation bridges
- ✅ All tests passing

**Schema Layer:**
- ✅ `src/schemas/` — 16 Zod schemas (Batch 2 audit)
- ✅ Already in correct location
- ✅ No moves needed

**UI Layer:**
- ✅ `src/ui/` — React components and state
- ✅ `src/ui/App.tsx` — Main app component
- ✅ `src/ui/components/` — 46 React components
- ✅ `src/ui/registries/` — Item registries (delayed for rewrite)
- ✅ `src/ui/data/` — Catalog and recovered data

**Support Layers:**
- ✅ `src/parsers/` — Data extractors (offline, not bundled)
- ✅ `src/utils/` — Shared utilities
- ✅ `src/verification/` — Verification metadata

### Stale/Obsolete in src/ (Exclude)

**Legacy Stubs:**
- ❌ `src/App.tsx` — Legacy stub placeholder (real app is src/ui/App.tsx)

**Old Combat Path:**
- ❌ `src/utils/combat/` — Already moved to src/engine/ (Batch 1)
- ❌ Directory should be empty/removed

**Old Resolver Path:**
- ❌ `src/ui/resolvers/` — Already moved to src/resolvers/ (Batch 2)
- ❌ Directory should be empty/removed

**Old OHDB Path:**
- ❌ `src/data/external/ohdb/` — Already moved to src/presentation/ohdb/ (Batch 3)
- ❌ Directory should be empty/removed

---

## Data Directory Analysis (data/)

### Required for MVP

**Verified/Locked Data:**
- ✅ `data/verified/` — 13 locked JSON files (Tier 3 authority)
  - weapons.verified.json
  - armor.verified.json
  - armor-sets.verified.json
  - mod-core-effects.verified.json
  - mod-suffix-effects.verified.json
  - mod-system-registry.verified.json
  - mod-terminology-registry.verified.json
  - star-tier-scaling.verified.json
  - deviations.verified.json
  - food-buffs.verified.json
  - fur-materials.verified.json
  - build-goal-profiles.verified.json
  - ingredients.verified.json

**Official/Decoded Data:**
- ✅ `data/official/interpreted/semantic-graph/` — Tier 1 evidence
  - semantic-table-graph.json
  - canonical-runtime-promotion-seed.json

**Source Data:**
- ✅ `data/raw/七日世界.xlsx` — Immutable source workbook

### Generated/Regenerable (Exclude from clean repo)

**Extracted Data:**
- ❌ `data/extracted/` — 13 raw JSON files (regenerable from source)
  - armor-sets.raw.json
  - armor.raw.json
  - deviations.raw.json
  - food-buffs.raw.json
  - fur-materials.raw.json
  - ingredients.raw.json
  - mod-core-effects.raw.json
  - mod-suffix-effects.raw.json
  - star-tier-scaling.raw.json
  - weapons.raw.json
  - external-references/
  - translation-overlay.summary.json

**Normalized Data:**
- ❌ `data/normalized/official-tables/` — Normalized official table data (regenerable)

**Audit/Research:**
- ❌ `data/audit/` — Old audit files (historical)
- ❌ `data/research/` — Research data (reference only)
- ❌ `data/sample-builds/` — Sample build documentation (reference only)
- ❌ `data/dumped_pyc/` — Empty directory
- ❌ `data/oh_calc_inventory_report.json` — Old inventory report

---

## Documentation Analysis (docs/)

### Required for MVP

**Migration Documentation:**
- ✅ `docs/migration/` — Migration planning docs
  - rebuild-inventory.md
  - migration-decisions.md
  - proposed-new-structure.md

**Validation Documentation:**
- ✅ `docs/validation/` — Validation reports
  - migration-validation-report.md
  - registry-blockers.md

**Core Documentation:**
- ✅ `docs/data-authority.md` — Authority tier model
- ✅ `docs/mod-selection-model.md` — Core+suffix mod model
- ✅ `docs/image-resolution-policy.md` — Image pipeline policy

**Research Documentation:**
- ✅ `docs/research-notes/` — Research notes (curated subset)
- ✅ `docs/formula-recovery/` — Formula recovery docs
- ✅ `docs/reverse-engineering/` — Reverse engineering docs

### Stale/Obsolete (Exclude)

**Historical Reports:**
- ❌ `docs/app-tsx-*.md` — Old stabilization reports
- ❌ `docs/live-ui-regression-report.md` — Old regression report
- ❌ `docs/ohai-*.md` — Old OHAI reports
- ❌ `docs/ohdb-*.md` — Old OHDB reports
- ❌ `docs/privacy-audit-fix-report.md` — Old audit report
- ❌ `docs/project-map.md` — Old project map
- ❌ `docs/runtime-combat-architecture.md` — Old architecture doc
- ❌ `docs/session-analysis-*.md` — Old session analysis
- ❌ `docs/source-registry.md` — Old source registry
- ❌ `docs/sprint-*.md` — Old sprint reviews
- ❌ `docs/status.md` — Old status doc
- ❌ `docs/testing.md` — Old testing doc
- ❌ `docs/translation-overlay.md` — Old translation doc

**Module QA Reports:**
- ❌ `docs/module-*.md` — 20+ module QA reports (historical)

**External Research:**
- ⚠️ `docs/external-research/` — External research corpus (reference only)
  - Keep OHMM audit reports
  - Exclude raw corpus files

**Agentic Tasks:**
- ❌ `docs/agentic-tasks/` — Old batch task tickets (historical)

---

## Scripts Analysis (scripts/)

### Required for MVP

**Validation Scripts:**
- ✅ `scripts/audit-privacy.ts` — Privacy audit
- ✅ `scripts/audit-build-data-integrity.ts` — Build data integrity
- ✅ `scripts/check-stale.ts` — Stale path checker (Batch 1.5)
- ✅ `scripts/validate-data.ts` — Data validator (Batch 4)
- ✅ `scripts/validate-images.ts` — Image validator (Batch 4)

**Audit Scripts:**
- ✅ `scripts/audit-ohmm-corpus.ts` — OHMM corpus audit

### Stale/Obsolete (Exclude)

**Old Scripts:**
- ❌ `scripts/patch-xdis-magics.py` — xdis patching script (one-time setup)
- ❌ `scripts/patch-xdis-magics.test.ts` — xdis patch test

---

## Tools Analysis (tools/)

### Reference Only (Exclude from clean repo)

**Python Tools:**
- ❌ `tools/` — 7 Python reverse-engineering tools
  - extract_bindict_string_pool.py
  - extract_opcode_table_from_pyc.py
  - infer_bindict_records.py
  - remap_custom_pyc_opcodes.py
  - row_value_relationship_analyzer.py
  - run_official_table_pipeline.py
  - semantic_table_decoder.py

**Rationale:** These are reference-only tools, not part of the runtime application. Keep in separate tools repo or docs/research/.

---

## Public Assets Analysis (public/)

### Required for MVP

**OHAI Branding:**
- ✅ `public/assets/ohai/ohai-logo.png` — OHAI logo

**OHDB Image Corpus:**
- ✅ `public/assets/ohdb_import_corpus_v2/images_cutout_safe/` — 1167 cutout-safe images
  - weapons/
  - armor/
  - attachments/
  - mods/
- ✅ `public/assets/ohdb_import_corpus_v2/images/` — Original images (fallback)

### Stale/Obsolete (Exclude)

**Old Corpus Files:**
- ❌ `public/assets/ohdb_import_corpus_v2/data/` — OHDB corpus data
- ❌ `public/assets/ohdb_import_corpus_v2/reports/` — OHDB import reports
- ❌ `public/assets/ohdb_import_corpus_v2/scripts/` — OHDB import scripts
- ❌ `public/assets/ohdb_import_corpus_v2/README.md` — OHDB corpus readme

---

## Migration Plan

### Step 1: Create Clean Workspace

Create new directory structure:
```
once-human-combat-haptics/
├── src/
│   ├── engine/           (62 files from Batch 1)
│   ├── resolvers/        (6 files from Batch 2)
│   ├── presentation/     (21 files from Batch 3)
│   ├── schemas/          (16 files)
│   ├── ui/               (React components)
│   ├── parsers/          (Data extractors)
│   ├── utils/            (Shared utilities)
│   └── verification/     (Verification metadata)
├── data/
│   ├── verified/         (13 locked JSON files)
│   ├── official/         (Semantic graph data)
│   └── raw/              (Source workbook)
├── public/
│   └── assets/
│       ├── ohai/         (Logo)
│       └── ohdb_import_corpus_v2/
│           ├── images_cutout_safe/  (1167 images)
│           └── images/              (Fallback images)
├── scripts/              (Validation scripts)
├── docs/                 (Curated documentation)
├── package.json
├── tsconfig.json
├── tsconfig.ui.json
├── vite.config.mjs
├── tailwind.config.js
├── index.html
├── AGENTS.md
├── README.md
├── .gitignore
└── .gitattributes
```

### Step 2: Copy Required Files

**Source Code:**
- Copy `src/engine/` (62 files)
- Copy `src/resolvers/` (6 files)
- Copy `src/presentation/` (21 files)
- Copy `src/schemas/` (16 files)
- Copy `src/ui/` (all UI files)
- Copy `src/parsers/` (14 files)
- Copy `src/utils/` (all utilities)
- Copy `src/verification/` (5 files)

**Data:**
- Copy `data/verified/` (13 files)
- Copy `data/official/interpreted/semantic-graph/` (3 files)
- Copy `data/raw/七日世界.xlsx` (1 file)

**Public Assets:**
- Copy `public/assets/ohai/` (1 file)
- Copy `public/assets/ohdb_import_corpus_v2/images_cutout_safe/` (1167 files)
- Copy `public/assets/ohdb_import_corpus_v2/images/` (fallback images)

**Scripts:**
- Copy `scripts/audit-privacy.ts`
- Copy `scripts/audit-build-data-integrity.ts`
- Copy `scripts/check-stale.ts`
- Copy `scripts/validate-data.ts`
- Copy `scripts/validate-images.ts`
- Copy `scripts/audit-ohmm-corpus.ts`

**Documentation:**
- Copy `docs/migration/` (3 files)
- Copy `docs/validation/` (2 files)
- Copy `docs/data-authority.md`
- Copy `docs/mod-selection-model.md`
- Copy `docs/image-resolution-policy.md`
- Copy curated subset of `docs/research-notes/`
- Copy `docs/formula-recovery/`
- Copy `docs/reverse-engineering/`
- Copy `docs/external-research/` (OHMM audit reports only)

**Config:**
- Copy `package.json`
- Copy `tsconfig.json`
- Copy `tsconfig.ui.json`
- Copy `vite.config.mjs`
- Copy `tailwind.config.js`
- Copy `index.html`
- Copy `AGENTS.md`
- Copy `README.md`
- Copy `.gitignore`
- Copy `.gitattributes`

### Step 3: Exclude/Quarantine Files

**Root-Level Stale Files:**
- Exclude `CHANGELOG.md`
- Exclude `CURRENT_STATE.md`
- Exclude `NEXT_TASK.md`
- Exclude `PROJECT_RULES.md`
- Exclude `dev.log`
- Exclude `explore_sheets.js`
- Exclude `oh_calc_scanner.py`
- Exclude `oncehumandatatables.xlsx`
- Exclude `七日世界.xlsx` (root copy)
- Exclude `dist-ui/`
- Exclude `node_modules/`
- Exclude `.local_phase_backup/`

**Source Code Stale Files:**
- Exclude `src/App.tsx` (legacy stub)
- Exclude `src/utils/combat/` (already moved)
- Exclude `src/ui/resolvers/` (already moved)
- Exclude `src/data/external/ohdb/` (already moved)

**Data Stale Files:**
- Exclude `data/extracted/` (regenerable)
- Exclude `data/normalized/` (regenerable)
- Exclude `data/audit/` (historical)
- Exclude `data/research/` (reference only)
- Exclude `data/sample-builds/` (reference only)
- Exclude `data/dumped_pyc/` (empty)
- Exclude `data/oh_calc_inventory_report.json` (old report)

**Documentation Stale Files:**
- Exclude all `docs/app-tsx-*.md`
- Exclude all `docs/ohai-*.md`
- Exclude all `docs/ohdb-*.md`
- Exclude all `docs/module-*.md`
- Exclude all `docs/sprint-*.md`
- Exclude all `docs/session-analysis-*.md`
- Exclude `docs/agentic-tasks/`

**Tools:**
- Exclude `tools/` (reference only)

**Public Assets Stale Files:**
- Exclude `public/assets/ohdb_import_corpus_v2/data/`
- Exclude `public/assets/ohdb_import_corpus_v2/reports/`
- Exclude `public/assets/ohdb_import_corpus_v2/scripts/`
- Exclude `public/assets/ohdb_import_corpus_v2/README.md`

### Step 4: Create Migration Manifest

Document:
- Copied files (with counts)
- Excluded files (with reasons)
- Quarantined files (with reasons)
- Known files requiring review

### Step 5: Rebuild Dependencies

```bash
cd once-human-combat-haptics
npm install
npm run typecheck
npm run build
npm run test:all
```

### Step 6: Validate MVP Flow

Confirm clean repo supports:
- Weapon blueprint selection
- Armor selection by slot
- Legal mod selection (core + suffix)
- Compatible ammo selection
- Assumption control
- Formula/provisional output
- Warnings/confidence display
- Build comparison

---

## Execution Plan

**Phase 0.5a:** Create clean workspace structure
**Phase 0.5b:** Copy required files
**Phase 0.5c:** Create migration manifest
**Phase 0.5d:** Rebuild dependencies
**Phase 0.5e:** Validate MVP flow
**Phase 0.5f:** Final validation and documentation

---

## Success Criteria

✅ Clean repo exists
✅ Copied files are documented
✅ Excluded/quarantined files are documented
✅ No sample/demo data is active in user-facing paths
✅ Dependency install works from scratch
✅ package-lock reflects the clean repo state
✅ Build/typecheck/test baseline is known
✅ Formula/resolver/registry paths still work after migration

---

## Gate 0.5 — Required to Continue

Continue only when all success criteria are met.

**Do not proceed to UI polish or user-testing work until this gate passes.**
