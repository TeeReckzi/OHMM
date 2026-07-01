# OHMM Project Status

## Current Architecture State

The Once Human Meta Metrics (OHMM) project is structured as a React-based web application containing a main UI frontend (`OHMM/src/app/`) and an internal core mathematical simulation engine and registry module (`OHMM/src/ohai/`).

### Recent Changes (Phase 3 — In Progress)

**All 6 inline modal components extracted from App.tsx:**
- SettingsModal → `src/app/components/modals/SettingsModal.tsx`
- DeviationModal → `src/app/components/modals/DeviationModal.tsx`
- BuffModal → `src/app/components/modals/BuffModal.tsx`
- AttachmentModal → `src/app/components/modals/AttachmentModal.tsx`
- CradleModal → `src/app/components/modals/CradleModal.tsx`
- CalibrationModal → `src/app/components/modals/CalibrationModal.tsx`

**App.tsx reduced from 2,060 to 1,461 lines (29% reduction).**

### Phase 2 Stabilization (Complete)
- Removed 56 dead files (-7,012 LOC)
- Added Vitest + React Testing Library (18 smoke tests)
- Bundle splitting (recharts chunk separated)
- Fixed metadata (title, package name)
- Fixed `typecheck:ui` validation (68 errors → 0)

### Folder Structure
- `OHMM/package.json`: Configuration for the outer Figma canvas app. Uses React 18, Vite 6, and Tailwind CSS 4.
- `OHMM/src/app/App.tsx`: The primary frontend UI (~3,100 lines), defining the layout, state, and user selections.
- `OHMM/src/lib/ohmm/convertLoadout.ts`: Mapper converting the UI loadout selection map to the legacy `BuildSelection` object format.
- `OHMM/src/ohai/`: Sibling project (nested under `src/`) housing the math engine, data registries, parsers, and verification smoke tests. Uses React 19 and Vite 8 (for internal verification/tests).
  - `src/engine/`: Mathematical calculations and formula applicator.
  - `src/resolvers/`: Unified loaders aggregating modifiers across loadout pieces.
  - `src/schemas/`: Zod models and classification rules (42 canonical StatKeys).
  - `src/ui/registries/`: Item data registries for weapons, armor, mods, targets, etc.
  - `src/ui/registries/staging/`: Pipeline for importing and validating community/database data before promoting to canonical registries.

### Data Flow & Boundaries
1. **Selection Layer**: Users select weapons, armor, mods, foods, and deviants in the UI (`App.tsx`).
2. **Translation Layer**: `convertLoadout.ts` maps selections into a canonical `BuildSelection` object.
3. **Resolution Layer**: `loadoutEffectResolver.ts` aggregates active items, checks set counts, and generates `modifierSources`.
4. **Mitigation & Aggregation Layer**: `formulaBridge.ts` filters out incoming/utility stats and forwards PvP mitigation values to `pvpMitigation.ts`, generating a final list of active DPS modifiers.
5. **Formula Applicator**: `formulaApplicator.ts` detects the appropriate calculation template (e.g., Burn stack, hybrid status, physical weapon DMG) and computes expected damage per shot/tick and DPS.
6. **Presentation Layer**: Calculation outputs are rendered in the dashboard and graphs.

---

## Completed Milestones

- **Phase 0.1: Clean-up & De-duplication**
  - Relocated 16 duplicate package directories (e.g., `react`, `react-dom`) and 3 unused config files from the `OHMM` root to an external backup folder (`backup_unrelated`) to prevent package manager peer dependency conflicts.
  - Verified that `npm run build` completes successfully in the root directory.
- **Phase 1: Restore Test Suite Stability**
  - Fixed regression issues REG-01 through REG-05.
  - Resolved stat mapping key drift, normalized mod tags, restored missing staging translation entries, fixed PSI-based Burn test fixtures, and established complete PvP mitigation scaling and clamping.
  - Confirmed 100% pass rate for all registry, staging, and formula validation tests.

---

## Known Issues

- **Supabase Connectivity**: Supabase image cache queries attempt to fetch but fall back to direct GitHub CDN URLs when local credentials aren't configured or fail (Informational/Low).
- **Privacy Audit Compliance**: The `audit:privacy` script fails due to detected external URLs (Supabase) and network calls (`fetch`) used by the image resolver and database adapter. This is expected as part of the database-backed design but flaggable by local static verification rules.

---

## Technical Debt & Gaps

1. **Massive Component Size**: `App.tsx` contains over 3,100 lines of UI layout, state, charting, and rendering logic, making it difficult to maintain and test.
2. **Dual-Project Isolation**: Sibling packages use mismatching React versions (18 vs 19) and Vite configs, necessitating hardcoded aliases in `vite.config.ts` to prevent runtime crashes.
3. **No ESLint Setup**: No linting script or config exists in either the root project or the `src/ohai` subproject.
4. **Missing Core Docs**: The migration manifest lists three planned documents that were never created:
   - `docs/data-authority.md` (trust levels)
   - `docs/mod-selection-model.md` (suffix requirements)
   - `docs/image-resolution-policy.md` (Supabase paths)

---

## Validation Results

- **Root Build Health**: Pass (Build succeeds in 5.41s)
- **Subproject Typecheck**: Pass
- **Subproject Functional Test Suite**: Pass (all functional unit/smoke tests are green)
- **Subproject Privacy Audit**: Fail (due to Supabase integration)

---

## Next Recommended Task

**Phase 2: UI Component Extraction and Refactoring**
Extract sub-components (such as modals, charts, and calculation panels) out of the massive `App.tsx` into clean, testable React components, improving code readability and reducing the file size.
