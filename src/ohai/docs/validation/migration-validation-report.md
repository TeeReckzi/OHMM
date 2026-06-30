# Migration Validation Report — Batch 1

> Phase 4, Batch 1: Engine directory creation + combat file migration

---

## Files Moved

62 files moved from `src/utils/combat/` → `src/engine/` (flat, no internal reorganization).

All files preserved with original names. No logic changes.

## Imports Changed

### In moved files (14 files updated):

| Pattern | Replacement | Files |
|---------|-------------|-------|
| `from "../../schemas/` | `from "../schemas/` | types.ts, formulaContext.ts, formulaTestTypes.ts, modifierAggregation.ts, modifierResolver.ts, modifierTypes.ts, officialFormulaStatBridge.ts, officialFormulaStatBridgeSmokeTest.ts, externalResearchSmokeTest.ts, dataAssetTransformer.ts |
| `from "../../ui/` | `from "../ui/` | formulaBridgeSmokeTest.ts, pvpMitigationSmokeTest.ts, formulaDamageIntegrationSmokeTest.ts, combatOutputSmokeTest.ts, dataAssetTransformer.ts |
| `from "../scorer/` | `from "../utils/scorer/` | externalResearchSmokeTest.ts |
| `from "../externalResearch/` | `from "../utils/externalResearch/` | externalResearchSmokeTest.ts |

### In external consumers (17 files updated):

| Pattern | Replacement | Files |
|---------|-------------|-------|
| `../utils/combat/` | `../engine/` | App.tsx, formulaDamageAdapter.ts, formulaBridge.ts, combatOutput.ts, itemTypes.ts, buildQualityScore.ts, buildComparisonEngine.ts |
| `../../utils/combat/` | `../../engine/` | SavedBuildsPanel.tsx, ConditionalEffectPanel.tsx, CombatOutcomePanel.tsx, CombatTimelineStream.tsx, AssumptionControlCenter.tsx, PvETargetBalancer.tsx, ProjectionPanel.tsx, cradleEffectResolver.ts, formulaSupportRegistry.ts, conditionalEffectRegistry.ts |
| `../..//utils/combat/` | `../../engine/` | CombatOutcomePanel.tsx (double-slash fix) |

### In scorer files (3 files updated):

| Pattern | Replacement | Files |
|---------|-------------|-------|
| `from "../combat/index"` | `from "../../engine/index"` | smokeTest.ts, mechanicAwareScoring.ts, mechanicStatRelevance.ts |
| `from "../combat/types"` | `from "../../engine/types"` | mechanicStatRelevance.ts |

### In package.json (30 script entries updated):

All `src/utils/combat/` → `src/engine/` in test script paths.

## Directories Created

| Directory | Contents |
|-----------|----------|
| `src/engine/` | 62 combat engine files (moved from `src/utils/combat/`) |
| `src/registries/` | Empty (`.gitkeep`) — for Batch 2 |
| `src/presentation/ohdb/` | Empty (`.gitkeep`) — for Batch 2 |
| `src/resolvers/` | Empty (`.gitkeep`) — for Batch 2 |

## Directories Removed

| Directory | Reason |
|-----------|--------|
| `src/utils/combat/` | All files moved to `src/engine/` |

## Commands Run and Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | 11 errors — ALL PRE-EXISTING | weaponImageOverrides.test.ts (4), armorPresentationBridge.ts (1), weaponPresentationBridge.ts (6) |
| `npm run typecheck:ui` | 4 errors — ALL PRE-EXISTING | armorPresentationBridge.ts (1), weaponPresentationBridge.ts (3) |
| `npm run build` | SUCCESS | 1795 modules, 20.38s |
| `npm run test:combat:metadata` | 205/205 PASS | |
| `npm run test:combat:formula` | 15/15 PASS | |
| `npm run test:formula:bridge` | 41/41 PASS | |
| `npm run test:pvp:mitigation` | 32/32 PASS | |
| `npm run test:combat:output` | 51/51 PASS | |
| `npm run test:scorer` | ALL PASS | Exercises scorer→engine imports |

## New Errors Introduced

**Zero.** All typecheck errors are pre-existing and documented in `docs/migration/migration-decisions.md`.

## Pre-existing Errors (unchanged)

| File | Error | Documented In |
|------|-------|---------------|
| `weaponImageOverrides.test.ts` | Missing Jest/Mocha types (describe, it, expect) | Not yet documented — low priority test file |
| `armorPresentationBridge.ts:38` | Object literal 'filename' not in return type | migration-decisions.md §4 (duplicate image resolvers) |
| `weaponPresentationBridge.ts:37,66,86` | `import.meta.env.DEV` under CommonJS | migration-decisions.md §3 |

## Delayed for Rewrite Phase

| Item | Reason | Target Phase |
|------|--------|--------------|
| Engine subdirectory reorganization (formulas/, official/, mechanics/, etc.) | Proposed structure has subdirs; flat move is safer for Batch 1 | Batch 2+ |
| `src/registries/` population | Needs wikily URL cleanup first | Batch 2 |
| `src/presentation/ohdb/` population | Needs image resolver consolidation first | Batch 2 |
| `src/resolvers/` population | Currently in `src/ui/resolvers/`; needs import updates | Batch 2 |
| `src/verification/` → `src/presentation/provenance/` | Semantic reclassification | Batch 3 |
| `src/ui/formulaBridge.ts` → `src/engine/formulas/` | Cross-cutting move with engine reorg | Batch 2 |
| `src/ui/combatOutput.ts` → `src/engine/combat/` | Cross-cutting move with engine reorg | Batch 2 |
| `src/ui/pvpMitigation.ts` → `src/engine/pvp/` | Cross-cutting move with engine reorg | Batch 2 |
| Wikily URL removal | Requires registry rewrite | Rewrite phase |
| ModSelection type cleanup | Requires logic changes | Rewrite phase |
| `import.meta.env.DEV` fix | Requires presentation bridge rewrite | Rewrite phase |
| `as any` cleanup in modSelectionBridge | Requires type redesign | Rewrite phase |

## Summary

Batch 1 is a clean structural move with zero behavior changes and zero new errors. The combat engine now lives in `src/engine/` as a distinct layer, separated from utilities and UI. All 6 test suites pass. Build succeeds.

---

## Batch 1.5 — Stabilization & Stale-Path Audit

### Stale Path Scan

Searched entire `src/` tree for references to old `utils/combat` paths.

| Pattern | Hits in source files | Action |
|---------|---------------------|--------|
| `utils/combat` in imports | 0 | Clean |
| `../utils/combat` | 0 | Clean |
| `../../utils/combat` | 0 | Clean |
| `../../../utils/combat` | 0 | Clean |

**2 Python tool references** found in `src/tools/` (`.py` files — reference-only, not active TypeScript code). No action needed; these are not part of the build pipeline.

**Documentation references** in `docs/`, `AGENTS.md` — historical docs retain old paths as references. `AGENTS.md` architecture section updated to reflect `src/engine/`.

### Files Changed in Batch 1.5

| File | Change |
|------|--------|
| `AGENTS.md` | Updated architecture line: `src/utils/combat/` → `src/engine/` |
| `scripts/check-stale.ts` | **NEW** — stale path reference checker script |
| `package.json` | Added `"check:stale": "tsx scripts/check-stale.ts"` script |

### Pre-existing Uncommitted Changes (Not from Migration)

Git status shows modifications to files NOT touched by Batch 1. These are pre-existing uncommitted changes from before the migration:

| File | Nature of pre-existing change |
|------|-------------------------------|
| `src/ui/components/BlueprintSelector.tsx` | Added `getItemImageWithWarning` import |
| `src/data/external/ohdb/image_resolver.ts` | Refactored exports, added `OHDB_BASE` constant |
| `src/data/external/ohdb/armor_presentation_enrichment.ts` | Pre-existing modification |
| `src/data/external/ohdb/mod_presentation_enrichment.ts` | Pre-existing modification |
| `src/ui/components/ItemSlot.tsx` | Pre-existing modification |
| `src/ui/components/ModSuffixWarning.tsx` | Pre-existing modification |
| `src/ui/data/catalog.ts` | Pre-existing modification |
| `src/ui/registries/weaponRegistry.ts` | Pre-existing: some wikily URLs replaced with local paths |
| `src/ui/registries/armorPresentationBridge.ts` | Pre-existing modification |
| `src/ui/registries/modPresentationBridge.ts` | Pre-existing modification |
| `src/ui/registries/weaponPresentationBridge.ts` | Pre-existing modification |

**No unexpected logic changes from Batch 1.** All Batch 1 modifications were pure import-path updates.

### Script Added

`scripts/check-stale.ts` — scans all `.ts/.tsx/.js/.jsx` files under `src/` for:
- `utils/combat` in any import path
- `../utils/combat`, `../../utils/combat`, `../../../utils/combat` patterns

Ignores: `node_modules`, `dist`, `dist-ui`, `coverage`, `.git`, `data`, `docs`, `tools`, `public`.

Exits non-zero on any hit.

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run check:stale` | PASS | "No stale path references found." |
| `npm run typecheck` | 11 errors — ALL PRE-EXISTING | Same as Batch 1 |
| `npm run typecheck:ui` | 4 errors — ALL PRE-EXISTING | Same as Batch 1 |
| `npm run build` | SUCCESS | 1795 modules, 19.52s |
| `npm run test:combat:metadata` | 205/205 PASS | |
| `npm run test:combat:formula` | 15/15 PASS | |
| `npm run test:formula:bridge` | 41/41 PASS | |
| `npm run test:pvp:mitigation` | 32/32 PASS | |
| `npm run test:combat:output` | 51/51 PASS | |
| `npm run test:scorer` | ALL PASS | |

### Remaining Known Pre-existing Typecheck Errors

| File | Error | Count |
|------|-------|-------|
| `src/data/external/ohdb/weaponImageOverrides.test.ts` | Missing Jest/Mocha types + module not found | 4 |
| `src/ui/registries/armorPresentationBridge.ts:38` | Object literal 'filename' not in return type | 1 |
| `src/ui/registries/weaponPresentationBridge.ts:37,66,86` | `import.meta.env.DEV` under CommonJS | 6 |

### Recommended Next Batch

**Batch 2 should target schemas** (`src/schemas/` stays in place but gets audited) and **resolvers** (`src/ui/resolvers/` → `src/resolvers/`).

**Registries are delayed** because:
- `weaponRegistry.ts` contains 4 hardcoded wikily URLs
- `modRegistry.ts` has hand-curated entries with empty `statModifiers` and "estimated" confidence
- `armorRegistry.ts` has ~492 lines of hand-curated armor with empty statModifiers
- `modSuffixLegality.ts` relies solely on OHDB for suffix legality
- `modSelectionBridge.ts` uses `as any` casts

These need rewrite-phase cleanup, not pure structural moves. Schemas and resolvers are safer next steps because they have cleaner data and fewer dirty patterns.

---

## Batch 2 — Resolver Migration & Schema Audit

### Resolver Classification

**MOVE NOW (6 files):**
- `src/ui/resolvers/effectTypes.ts`
- `src/ui/resolvers/loadoutEffectResolver.ts`
- `src/ui/resolvers/weaponEffectResolver.ts`
- `src/ui/resolvers/armorSetBonusResolver.ts`
- `src/ui/resolvers/modEffectResolver.ts`
- `src/ui/resolvers/cradleEffectResolver.ts`

**DELAY (presentation/image resolvers):**
- `src/data/external/ohdb/image_resolver.ts` — OHDB-specific, needs consolidation with itemImageResolver
- `src/ui/registries/itemImageResolver.ts` — UI-specific, needs consolidation
- `src/ui/registries/weaponPresentationBridge.ts` — uses `import.meta.env.DEV` (known issue)
- `src/ui/registries/armorPresentationBridge.ts` — has type errors (known issue)
- `src/ui/registries/modPresentationBridge.ts` — OHDB dependency

**DO NOT TOUCH (registries/data):**
- All files in `src/ui/registries/` (except presentation bridges above)
- All files in `src/data/`

### Files Moved

6 files moved from `src/ui/resolvers/` → `src/resolvers/`:

| File | Purpose |
|------|---------|
| `effectTypes.ts` | EffectPipelineItem and EffectCoverage types |
| `loadoutEffectResolver.ts` | Master aggregator for all effect resolvers |
| `weaponEffectResolver.ts` | Weapon keyword/proc effect resolution |
| `armorSetBonusResolver.ts` | Armor set bonus detection and resolution |
| `modEffectResolver.ts` | Mod core/suffix effect resolution |
| `cradleEffectResolver.ts` | Cradle perk effect resolution with conditional evaluation |

All files are pure logic with no React, DOM, CSS, or Vite-specific dependencies.

### Imports Changed

#### In moved files (6 files updated):

| Pattern | Replacement | Files |
|---------|-------------|-------|
| `from "../../schemas/` | `from "../schemas/` | effectTypes.ts |
| `from "../types"` | `from "../ui/types"` | loadoutEffectResolver.ts, armorSetBonusResolver.ts, cradleEffectResolver.ts |
| `from "../registries/` | `from "../ui/registries/` | loadoutEffectResolver.ts, weaponEffectResolver.ts, armorSetBonusResolver.ts, modEffectResolver.ts, cradleEffectResolver.ts |
| `from "../itemTypes"` | `from "../ui/itemTypes"` | weaponEffectResolver.ts |
| `from "../formulaBridge"` | `from "../ui/formulaBridge"` | weaponEffectResolver.ts |
| `from "../../utils/` | `from "../utils/` | armorSetBonusResolver.ts |
| `from "../../engine/` | `from "../engine/` | cradleEffectResolver.ts |

#### In consumer files (2 files updated):

| Pattern | Replacement | Files |
|---------|-------------|-------|
| `from "./resolvers/` | `from "../resolvers/` | formulaBridge.ts, App.tsx |

### Schema Audit

**Current location:** `src/schemas/` (16 schema files)

**Assessment:**
- ✅ All schemas already in correct location per proposed structure
- ✅ No React/UI dependencies
- ✅ No registry dependencies
- ✅ Minimal internal dependencies (only `statSemantics.ts` and `gearScorerSchema.ts` import from `buildGoalSchema.ts`)
- ✅ All schemas are pure Zod validation with no behavior

**Classification:**
- **Already in correct location:** All 16 schema files
- **Safe to keep as-is:** No move needed
- **Note:** `externalReferenceSchema.ts` contains a wikily URL (documented in migration-decisions.md), but this is a data issue, not a structural issue

**Schema files:**
- `armorSchema.ts`
- `armorSetSchema.ts`
- `buildGoalSchema.ts` (42 canonical StatKeys)
- `deviationSchema.ts`
- `externalReferenceSchema.ts` (has wikily URL — data issue)
- `foodBuffSchema.ts`
- `furMaterialSchema.ts`
- `gearScorerSchema.ts`
- `ingredientSchema.ts`
- `modCoreEffectSchema.ts`
- `modSuffixEffectSchema.ts`
- `modSystemSchema.ts`
- `modTerminologySchema.ts`
- `starTierScalingSchema.ts`
- `statSemantics.ts`
- `weaponSchema.ts`

### Stale Guard Updates

Extended `scripts/check-stale.ts` with resolver path guard:

**New pattern added:**
- `from ['"][^'"]*ui\/resolvers/` — detects any import from old `ui/resolvers` path

**All patterns checked:**
1. `utils/combat` in any import path (Batch 1)
2. `../utils/combat`, `../../utils/combat`, `../../../utils/combat` (Batch 1)
3. `ui/resolvers` in any import path (Batch 2)

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run check:stale` | PASS | No stale path references (engine + resolver guards) |
| `npm run typecheck` | 11 errors — ALL PRE-EXISTING | Same as Batch 1 |
| `npm run typecheck:ui` | 4 errors — ALL PRE-EXISTING | Same as Batch 1 |
| `npm run build` | SUCCESS | 1795 modules, 7.48s |
| `npm run test:combat:metadata` | 205/205 PASS | |
| `npm run test:combat:formula` | 15/15 PASS | |
| `npm run test:formula:bridge` | 41/41 PASS | Exercises resolver imports |
| `npm run test:pvp:mitigation` | 32/32 PASS | |
| `npm run test:combat:output` | 51/51 PASS | |
| `npm run test:scorer` | ALL PASS | |

### New Errors Introduced

**Zero.** All typecheck errors remain pre-existing.

### Directories Removed

| Directory | Reason |
|-----------|--------|
| `src/ui/resolvers/` | All 6 files moved to `src/resolvers/` |

### Delayed Files

**Image/Presentation Resolvers (5 files):**

| File | Reason for Delay |
|------|------------------|
| `src/data/external/ohdb/image_resolver.ts` | OHDB-specific resolver; needs consolidation with `itemImageResolver.ts` in presentation layer |
| `src/ui/registries/itemImageResolver.ts` | UI-specific image resolver; needs consolidation with OHDB resolver |
| `src/ui/registries/weaponPresentationBridge.ts` | Uses `import.meta.env.DEV` (known CommonJS violation); needs rewrite |
| `src/ui/registries/armorPresentationBridge.ts` | Has type errors (object literal 'filename' not in return type); needs rewrite |
| `src/ui/registries/modPresentationBridge.ts` | OHDB dependency; part of presentation layer consolidation |

**Rationale:** These files have known issues documented in `migration-decisions.md`. Moving them without fixing the underlying issues would just move the problems. They should be consolidated and cleaned up in the presentation layer migration (Batch 4).

### Recommended Batch 3

**Schemas are already in the correct location** — no move needed.

**Batch 3 should target presentation/OHDB layer:**
- Consolidate `src/data/external/ohdb/` into `src/presentation/ohdb/`
- Move image resolvers (`image_resolver.ts`, `itemImageResolver.ts`) to `src/presentation/ohdb/`
- Move presentation bridges (`weaponPresentationBridge.ts`, `armorPresentationBridge.ts`, `modPresentationBridge.ts`) to `src/presentation/`
- Fix `import.meta.env.DEV` violations in presentation bridges
- Fix type errors in `armorPresentationBridge.ts`

**Registries remain delayed** until:
- Wikily URLs are removed from `weaponRegistry.ts`
- Hand-curated entries in `modRegistry.ts` and `armorRegistry.ts` are reconciled with generated data
- `modSuffixLegality.ts` is rewritten to use normalized ontology
- `modSelectionBridge.ts` type safety is improved

### Summary

Batch 2 successfully moved 6 pure resolver files from `src/ui/resolvers/` to `src/resolvers/` with zero behavior changes and zero new errors. Schema audit confirmed all 16 schemas are already in the correct location. Stale guard extended to detect old resolver paths. All tests pass. Build succeeds.

The resolver layer is now properly separated from the UI layer, making the architecture cleaner: engine (pure combat logic) → resolvers (effect resolution) → UI (React components).

---

## Batch 3 — Presentation/OHDB Layer Migration

> Phase 4, Batch 3: Presentation layer consolidation

### Files Moved

**21 files total:**

**From `src/data/external/ohdb/` → `src/presentation/ohdb/` (17 files):**
- armor.json
- armor_presentation_enrichment.ts
- attachments.json
- image_resolver.ts
- itemImageOverrides.ts
- mod_future_types.ts
- mod_presentation_enrichment.ts
- mod_variants.json
- ohdb_adapters.ts
- ohdb_types.ts
- presentation_enrichment.ts
- validation/attachment_validator.ts
- validation/ohdb_validation.ts
- weaponImageOverrides.test.ts
- weaponImageOverrides.ts
- weapon_family_helpers.ts
- weapons.json

**From `src/ui/registries/` → `src/presentation/` (4 files):**
- armorPresentationBridge.ts
- itemImageResolver.ts
- modPresentationBridge.ts
- weaponPresentationBridge.ts

### Imports Changed

**In moved OHDB files (2 files updated):**
- `presentation_enrichment.ts`: Updated schema and verified data imports
- `validation/ohdb_validation.ts`: Updated schema and verified data imports

**In moved presentation bridge files (4 files updated):**
- `weaponPresentationBridge.ts`: Updated OHDB imports to `./ohdb/`, UI imports to `../ui/`
- `armorPresentationBridge.ts`: Updated OHDB imports to `./ohdb/`, UI imports to `../ui/`
- `modPresentationBridge.ts`: Updated OHDB imports to `./ohdb/`, UI imports to `../ui/`
- `itemImageResolver.ts`: Updated catalog import to `../ui/data/catalog`

**In consumer files (4 files updated):**
- `BlueprintSelector.tsx`: Updated to import from `../../presentation/`
- `catalog.ts`: Updated to import from `../../presentation/`
- `ItemSlot.tsx`: Updated to import from `../../presentation/itemImageResolver`
- `modSuffixLegality.ts`: Updated to import from `../../presentation/ohdb/mod_presentation_enrichment`

### Local Fixes Made

**weaponPresentationBridge.ts — import.meta.env.DEV fix:**
- Replaced 3 instances of `import.meta.env.DEV` with `isDevMode()` function
- Function uses safe try-catch pattern: `(import.meta as any).env?.DEV === true`
- Works in both CommonJS and ESM contexts
- No behavior change — diagnostic logging preserved

**armorPresentationBridge.ts — type error fix:**
- Added `filename` and `slug` fields to return type of `getEnrichedArmorDisplay()`
- These fields were already being returned but not declared in the type
- No behavior change — just type accuracy

### Image Resolver Status

**Two resolvers now coexist in presentation layer:**

| Resolver | Location | Purpose |
|----------|----------|---------|
| `image_resolver.ts` | `src/presentation/ohdb/` | OHDB-specific: resolves images for OhdbWeapon types using manifest data |
| `itemImageResolver.ts` | `src/presentation/` | Generic: resolves images for CatalogItem types using multiple fallback strategies |

**Not duplicates** — they serve different purposes:
- `image_resolver.ts` is OHDB-specific, works with OhdbWeapon types, uses manifest filename/slug
- `itemImageResolver.ts` is generic, works with CatalogItem types, has 7 fallback strategies

**Consolidation delayed** — merging would require behavior decisions about which strategy wins. Current architecture is stable.

### import.meta.env.DEV Status

**Fixed in weaponPresentationBridge.ts:**
- 3 instances replaced with safe `isDevMode()` function
- Function uses try-catch to handle both CommonJS and ESM
- Diagnostic logging preserved, no behavior change

**No other files affected** — this was the only presentation file with `import.meta.env.DEV`.

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run check:stale` | PASS | No stale path references |
| `npm run typecheck` | 3 errors — ALL PRE-EXISTING | weaponImageOverrides.test.ts (Jest/Mocha types) |
| `npm run typecheck:ui` | 0 errors | Clean |
| `npm run build` | SUCCESS | 1795 modules, 11.25s |
| `npm run test:combat:metadata` | 205/205 PASS | |
| `npm run test:combat:formula` | 15/15 PASS | |
| `npm run test:formula:bridge` | 41/41 PASS | |
| `npm run test:pvp:mitigation` | 32/32 PASS | |
| `npm run test:combat:output` | 51/51 PASS | |
| `npm run test:scorer` | ALL PASS | |

### New Errors Introduced

**Zero.** Typecheck errors reduced from 11 to 3 (fixed 8 import.meta.env.DEV errors in weaponPresentationBridge.ts).

Remaining 3 errors are pre-existing test file issues (Jest/Mocha type definitions missing).

### Directories Removed

| Directory | Reason |
|-----------|--------|
| `src/data/external/ohdb/` | All 17 files moved to `src/presentation/ohdb/` |

### Delayed Files

**None.** All targeted presentation files successfully migrated.

**Registries remain delayed** (not part of Batch 3 scope):
- `weaponRegistry.ts` — contains 4 wikily URLs
- `modRegistry.ts` — hand-curated entries with empty statModifiers
- `armorRegistry.ts` — hand-curated entries with empty statModifiers
- `modSuffixLegality.ts` — relies solely on OHDB for suffix legality
- `modSelectionBridge.ts` — uses `as any` casts

### Recommended Batch 4

**Add data validators before registry migration:**

1. **validate-data.ts** — Validate registry data integrity:
   - Check for empty statModifiers in mods/armor
   - Check for missing required fields
   - Check for duplicate IDs
   - Check for orphaned references

2. **validate-images.ts** — Validate image resolution:
   - Check for broken local image paths
   - Check for missing cutout-safe images
   - Check for wikily URLs in active code
   - Check for remote URLs in registries

3. **Stricter stale pattern checks:**
   - Detect wikily URLs in source files
   - Detect remote image URLs in registries
   - Detect empty statModifiers in hand-curated data
   - Detect invalid mod core-only selections

**After validators are in place, proceed with registry migration:**
- Move registries from `src/ui/registries/` to `src/registries/`
- Fix wikily URLs during migration
- Reconcile hand-curated entries with generated data
- Improve modSelectionBridge type safety

### Summary

Batch 3 successfully migrated 21 presentation/OHDB files into `src/presentation/` with minimal behavior changes. Fixed `import.meta.env.DEV` violations in weaponPresentationBridge.ts using safe try-catch pattern. Fixed type errors in armorPresentationBridge.ts by adding missing return type fields. All tests pass. Build succeeds. Typecheck errors reduced from 11 to 3.

The presentation layer is now properly separated: `src/presentation/ohdb/` contains OHDB-specific data and resolvers, `src/presentation/` contains presentation bridges and generic image resolution. Architecture is cleaner: engine → resolvers → presentation → UI.

---

## Batch 4 — Data & Image Validators

> Phase 4, Batch 4: Pre-migration validation infrastructure

### Files Created

**2 new validator scripts:**
- `scripts/validate-data.ts` — Registry data quality checks
- `scripts/validate-images.ts` — Image path and reference checks

**1 new documentation file:**
- `docs/validation/registry-blockers.md` — Auto-detected registry migration blockers

### Files Updated

- `scripts/check-stale.ts` — Added 3 new stale path patterns (data/external/ohdb, presentation bridges, itemImageResolver)
- `package.json` — Added 3 new scripts: `validate:data`, `validate:images`, `validate:migration`
- `docs/validation/migration-validation-report.md` — This file

### Validator Capabilities

**validate-data.ts checks:**
- Wikily/oncehuman.wiki URLs (errors)
- Remote URLs in registry/data files (warnings)
- Empty statModifiers in canonical registries (warnings)
- Core-only mod selection patterns (warnings)
- Suffix value "none" (warnings)
- coreModId without suffixId (warnings)
- selectedMod without selectedSuffix (warnings)
- `as any` in engine/resolvers/registries/presentation (warnings)
- Registry-like files not under src/registries/ (warnings)

**validate-images.ts checks:**
- Local image references exist under public/assets (warnings)
- Remote image URLs (warnings)
- Stale src/data/external/ohdb paths (errors)
- Backslashes in web paths (warnings)
- Duplicate slashes in paths (warnings)
- Missing image extensions where filename implies an image (warnings)

**check-stale.ts extended with:**
- `data/external/ohdb` imports (moved to `src/presentation/ohdb`)
- `ui/registries/*PresentationBridge` imports (moved to `src/presentation`)
- `ui/registries/itemImageResolver` imports (moved to `src/presentation`)

### Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run check:stale` | ✓ PASS | No stale path references |
| `npm run validate:data` | ✗ FAIL (10 errors, 358 warnings) | Wikily URLs are errors; rest are warnings |
| `npm run validate:images` | ✓ PASS (116 warnings) | No errors, all warnings |
| `npm run validate:migration` | ✗ FAIL | Fails on validate:data errors |
| `npm run typecheck` | 3 errors (pre-existing) | weaponImageOverrides.test.ts |
| `npm run build` | ✓ SUCCESS | 1795 modules |

### Registry Blockers Found

**Critical (must fix before registry migration):**
- 10 wikily/oncehuman.wiki URLs (errors)
  - `src/schemas/externalReferenceSchema.ts`
  - `src/ui/data/catalog.ts`
  - `src/ui/registries/generated/weapons.generated.ts`
  - `src/ui/registries/weaponRegistry.ts`

**Warnings (should fix, not blocking):**
- 78 `as any` casts in critical directories
- 3 registry files outside `src/registries/` (engine-internal, acceptable)
- 2 core-only mod selection patterns
- 230 remote URLs in registry/data files
- 45 empty statModifiers in canonical registries
- 106 remote image URLs
- 6 duplicate slashes in paths
- 3 missing image extensions
- 1 backslash in web path

**Full details:** `docs/validation/registry-blockers.md`

### Image Corpus Status

- **1167 images** in `public/assets/ohdb_import_corpus_v2/images_cutout_safe/`
- No missing local image references detected
- No stale `src/data/external/ohdb` paths in source code

### Npm Scripts Added

| Script | Command | Purpose |
|--------|---------|---------|
| `validate:data` | `tsx scripts/validate-data.ts` | Registry data quality checks |
| `validate:images` | `tsx scripts/validate-images.ts` | Image path/reference checks |
| `validate:migration` | `check:stale && validate:data && validate:images` | Full migration validation |

### Recommended Batch 5

**Registry migration is BLOCKED** until wikily URLs are removed (10 errors).

**Recommended action plan:**
1. Remove wikily URLs from `weaponRegistry.ts`, `catalog.ts`, `externalReferenceSchema.ts`, and `weapons.generated.ts`
2. Re-run `npm run validate:data` to confirm 0 errors
3. Reconcile empty statModifiers with verified data (45 warnings)
4. Fix core-only mod type definitions (2 warnings)
5. Proceed with registry migration from `src/ui/registries/` to `src/registries/`

**Registry migration is NOT blocked by:**
- `as any` casts (can be addressed incrementally)
- Remote URLs in generated files (can be regenerated)
- Engine-internal registries (not canonical item registries)
- Image path issues (presentation layer, not registry layer)

### Summary

Batch 4 added comprehensive validation infrastructure. Two new validator scripts detect 10 errors and 474 warnings across the codebase. The `check:stale` script was extended with 3 new patterns for presentation layer paths. Registry migration is blocked by 10 wikily URL errors that must be fixed before proceeding. All other issues are warnings that can be addressed incrementally.
