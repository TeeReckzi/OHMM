# OHMM Project Status

## Current Architecture State

The Once Human Meta Metrics (OHMM) project is structured as a React-based web application containing a main Figma-derived UI frontend wrapper (`OHMM/`) and an internal core mathematical simulation engine and registry module (`OHMM/src/ohai/`).

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
- **Phase 2: Neural Build Graph v2 (Interactive 3D Visualizer & Advanced Analysis)**
  - Implemented 3D Force-Directed Graph (`d3-force-3d`) with customizable layer layout and settlement camera zoom-to-fit.
  - Wired `HeartbeatEngine` for node scaling, brightness pulsing, and sinusoidal breathing.
  - Integrated selective post-processing bloom for high-emissive nodes.
  - Created multi-colored instanced particle system with per-category custom colors and active-conduit bursts.
  - Added cinematic camera auto-orbit and focus transitions.
  - Developed **Temporal Playback Engine** animating combat sequences via energy pulses and conduit particle bursts.
  - Integrated **Failure Mode Overlay** analyzing the hypothetical impact of removing a selected node on graph cohesion, severed edges, and split communities.
  - Refined **Graph Cohesion** to use average eigenvector centrality and network density.
  - Added Level of Detail (LOD) tier management with hysteresis and performance auto-throttling.
  - Built 2D SVG Accessibility Fallback with full keyboard navigation and ARIA labels.
  - Established a 138-test property-based validation suite running successfully under Vitest.

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
5. **Outstanding Neural Build Graph v2 Spec Tasks**:
   - Write the property test for LOD tier hysteresis (`Property 16` / Task 14.2).
   - Implement and wire the explainability/insights engine (`generateBuildInsights` / Task 13).

---

## Validation Results

- **Root Build Health**: Pass (Build succeeds in 5.41s)
- **Subproject Typecheck**: Pass
- **Subproject Functional Test Suite**: Pass (all functional unit/smoke tests are green)
- **Subproject Privacy Audit**: Fail (due to Supabase integration)

---

## Next Recommended Task

**Phase 3: Explainability Engine and Analytics Panel**
Implement the natural language explainability/insights engine (`generateBuildInsights` in `buildGraphInsights.ts`) and mount the collapsible `AnalyticsPanel` and floating `CohesionIndicator` in `GraphScene.tsx` as outlined in Task 13 of the Neural Build Graph v2 specification.
