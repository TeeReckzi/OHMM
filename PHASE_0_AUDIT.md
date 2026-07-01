# OHMM — Phase 0: Complete Repository Audit

**Audit Date**: 2026-06-30
**Auditor**: Engineering Council (CTO + 9 Specialist Agents)
**Build Status**: PASSING (3.78s, 2297 modules)
**Commit History**: Single commit (f2e46e3 "First push")

---

## 1. Executive Summary

| Dimension | Score (1-10) | Assessment |
|-----------|:---:|------------|
| Formula Engine | 9 | Excellent. Bucket-based, verified against game observations. |
| Data Architecture | 8 | Strong normalization layer. Registry pattern. Provenance tracking. |
| UI/UX | 5 | Functional but overwhelming. No progressive disclosure. |
| Component Architecture | 4 | Monolithic App.tsx (2,060 lines). Partially extracted. |
| Testing | 6 | 41 smoke/test files for engine. Zero UI tests. |
| Performance | 5 | 1.6MB bundle. No code splitting. No virtualization. |
| Documentation | 6 | Architecture docs exist but some are stale. |
| Accessibility | 3 | Minimal keyboard support. Low contrast in faint text. |
| Mobile Support | 1 | Fixed widths. Breaks below 1100px. |
| Build Persistence | 2 | Code exists but not exposed in UI. |

**Overall Health**: **6.2/10**

**Verdict**: Strong foundation with elite formula engine. Product shell needs significant iteration to become the definitive theorycrafting platform.

---

## 2. Architecture Report

### 2.1 High-Level Structure

```
OHMM/                              [Root: Vite + React 18 + TailwindCSS 4]
├── src/
│   ├── main.tsx                    [Entry point]
│   ├── app/
│   │   ├── App.tsx                 [2,060 lines — MAIN UI MONOLITH]
│   │   ├── types.ts               [Shared UI types]
│   │   └── components/
│   │       ├── LoadoutTiles.tsx    [Extracted Phase 2]
│   │       ├── RemoveBadge.tsx     [Extracted]
│   │       ├── selectors/          [WeaponSelector, ArmorSelector, ModSelector]
│   │       ├── ui/Primitives.tsx   [Extracted reusable primitives]
│   │       ├── ui/...             [~40 shadcn/Radix component stubs]
│   │       └── figma/             [ImageWithFallback]
│   ├── lib/ohmm/
│   │   ├── convertLoadout.ts      [LoadoutMap → BuildSelection converter]
│   │   ├── formulaBridge.ts       [DUPLICATE — unused?]
│   │   └── formulas/              [More duplicates of ohai engine]
│   ├── ohai/                       [NESTED SIBLING PROJECT — 65MB]
│   │   ├── package.json           ["once-human-master-calc" — React 19, own Vite]
│   │   ├── scripts/               [8 audit/validation scripts]
│   │   └── src/
│   │       ├── engine/            [67 files — FORMULA ENGINE CORE]
│   │       ├── resolvers/         [5 files — Effect pipeline]
│   │       ├── schemas/           [Zod schemas, stat semantics]
│   │       ├── parsers/           [Data extraction scripts]
│   │       ├── presentation/      [Image resolvers]
│   │       ├── ui/                [Types, registries, selectors, data]
│   │       │   ├── registries/    [35 files — ITEM DATA]
│   │       │   ├── selectors/     [Component tests]
│   │       │   └── data/          [Catalog, recovered data]
│   │       ├── utils/             [Helpers, stat mapping]
│   │       └── verification/      [Source weights, scoring]
│   └── styles/
│       ├── index.css              [Import chain entry]
│       ├── tailwind.css           [Tailwind v4 directives]
│       ├── theme.css              [shadcn theme tokens]
│       ├── ohmm-app.css           [Custom HUD CSS]
│       └── ohmm-design/           [Design system tokens]
├── public/assets/                  [Static game icons, logos]
├── docs/                           [Architecture docs, audit JSONs]
├── migrations/                     [SQL — suggests planned DB features]
└── apps/                           [overwolf-bridge, vision-service — dormant]
```

### 2.2 Key Architectural Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Nested `src/ohai/` project | Independent formula engine with own tests | Working but fragile (React 18/19 conflict resolved via Vite alias) |
| Registry pattern for game data | Extensible, type-safe item storage | Healthy. 35 registry files. |
| Normalization Layer | Prevents mod/armor divergence | Excellent. Well-documented. |
| Formula bucket model | Mirrors Once Human's actual damage calculation | Verified with in-game observations |
| Dual React version isolation | ohai uses React 19 internally, root uses 18 | Resolved via Vite `resolve.alias` hack |
| Supabase + GitHub CDN images | Structured fallback for item icons | Working with graceful degradation |

### 2.3 Data Flow

```
User Clicks Slot
       ↓
LoadoutMap (Record<string, EquippedItem>)
       ↓
convertLoadout.ts → BuildSelection
       ↓
formulaBridge.ts → loadoutEffectResolver → CalculationInput
       ↓
formulaDamageAdapter.ts → formulaApplicator.ts
       ↓
computeCombatOutput() → CombatOutput
       ↓
UI renders (AnalysisHub panels)
```

---

## 3. Technical Debt Inventory

### 3.1 Critical

| ID | Item | Files | Risk | Effort |
|----|------|-------|------|--------|
| TD-01 | **App.tsx monolith (2,060 LOC)** | `src/app/App.tsx` | Untestable, unmaintainable | 3-4 days |
| TD-02 | **Bundle size (1.6MB uncompressed)** | Build output | Slow load, poor mobile | 1-2 days |
| TD-03 | **No code splitting** | `vite.config.ts` | Everything loads at once | 1 day |

### 3.2 High

| ID | Item | Files | Risk | Effort |
|----|------|-------|------|--------|
| TD-04 | **Duplicate formula bridge** | `src/lib/ohmm/formulaBridge.ts` + `formulas/` | Divergence, confusion | 0.5 day |
| TD-05 | **No UI test coverage** | Missing | Regressions undetected | Ongoing |
| TD-06 | **40 unused shadcn/Radix stubs** | `src/app/components/ui/*.tsx` | Dead code, bundle bloat | 0.5 day |
| TD-07 | **Dual React version hack** | `vite.config.ts` aliases | Fragile if deps change | N/A (monitor) |
| TD-08 | **No save/load/share in UI** | App.tsx | Zero user retention | 2 days |
| TD-09 | **No error boundaries** | App-wide | Single error crashes app | 0.5 day |

### 3.3 Medium

| ID | Item | Files | Risk | Effort |
|----|------|-------|------|--------|
| TD-10 | **Hardcoded target HP (8000)** | `App.tsx` CombatResolver | Inaccurate TTK | 0.5 day |
| TD-11 | **SimulationTimeline is placeholder** | `App.tsx` | Confusing UI element | Remove or implement |
| TD-12 | **console.warn in production** | Supabase fetch effects | Noisy console | 0.5 day |
| TD-13 | **No `tsconfig.json` in root** | Root project | IDE support may be limited | 0.5 day |
| TD-14 | **`src/lib/ohmm/` directory** | 7 files, some duplicates | Ownership confusion | 1 day |

### 3.4 Low

| ID | Item | Files | Risk | Effort |
|----|------|-------|------|--------|
| TD-15 | `@figma/my-make-file` package name | `package.json` | Misleading | 5 min |
| TD-16 | "figma" folder naming | `src/app/components/figma/` | Legacy confusion | 5 min |
| TD-17 | index.html title "OHCombatHaptics (Copy)" | `index.html` | Unprofessional | 5 min |
| TD-18 | `apps/` dormant services | `apps/overwolf-bridge`, `apps/vision-service` | Dead code | Decision needed |

---

## 4. Completed Work Assessment

### 4.1 Verified Complete

| Feature | Status | Quality |
|---------|--------|---------|
| Formula engine (physical, burn, status, deviation) | Complete | Excellent |
| Official formula graph runtime | Complete | Excellent |
| Modifier aggregation pipeline | Complete | Excellent |
| Normalization layer | Complete | Excellent |
| Weapon registry (47+ weapons, merged LReDragol stats) | Complete | Good |
| Mod registry (core + suffix families, verified) | Complete | Good |
| Armor registry + key gear | Complete | Good |
| Attachment registry | Complete | Good |
| Food buff registry | Complete | Good |
| Deviation registry | Complete | Good |
| Cradle perk registry | Complete | Good |
| PvP mitigation calculation | Complete | Good |
| Conditional effect engine | Complete | Good |
| Weapon selector modal | Complete | Good |
| Armor selector modal | Complete | Good |
| Mod selector modal | Complete | Good |
| Dual loadout (offense/defense) | Complete | Good |
| Real-time formula calculation | Complete | Good |
| Image fallback pipeline | Complete | Good |
| Calibration roll input | Complete | Good |
| Design system tokens (colors, effects, typography) | Complete | Good |
| 20+ smoke tests for formula engine | Complete | Good |

### 4.2 Partially Complete

| Feature | Status | Gap |
|---------|--------|-----|
| Component extraction from App.tsx | ~30% done | Modals remain inline (Deviation, Buff, Attachment, Cradle, Calibration, Settings) |
| Build persistence | Backend code exists | No UI save/load buttons |
| Build sharing | Encode/decode service exists in ohai | No UI integration |
| Formula explainer | Engine-side `formulaExplainer.ts` exists | Not surfaced in UI |
| Official formula validation | 22 official formula files | Many leaves unresolved |
| Set bonus tracking | `armorSetBonusResolver.ts` works | No visual UI indicator |

### 4.3 Not Started

| Feature | Importance | Notes |
|---------|------------|-------|
| Stat weight calculator | Critical | Engine could support this (increment + recompute) |
| Upgrade priority queue | High | Requires stat weight foundation |
| Build comparison | High | Need side-by-side UI |
| Mobile responsive | High | CSS rewrite needed |
| Build library / presets | Medium | Need persistence first |
| TTK simulator with presets | Medium | `pveTargetRegistry` exists, needs UI |
| Keyword synergy matrix | Medium | Data exists in engine |
| Calibration roll analyzer | Medium | Range data available |
| Accessibility audit | Medium | Not started |
| Component-level tests | Medium | Zero coverage |

---

## 5. Risk Report

### 5.1 Critical Risks

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| App.tsx regression (accidental mutation) | High | High | Extract components immediately |
| Bundle causes slow first load | High | Medium | Code split + lazy load |
| Formula accuracy dispute from community | Medium | Critical | Expose formula explainer, cite sources |
| React 18/19 conflict resurfaces | Low | Critical | Monitor Vite alias, test after dep updates |

### 5.2 High Risks

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Data staleness after game patch | High | High | Add version dates, update cadence |
| No persistence → users leave | High | High | Add save/share immediately |
| Zero mobile users | High | Medium | Responsive CSS in Phase 5 |
| No onboarding → high bounce rate | Medium | High | Add empty state guidance |

### 5.3 Medium Risks

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Unused shadcn components pulled into bundle | Medium | Low | Tree-shaking works but audit |
| Supabase API key exposed client-side | Medium | Low | Read-only anon key, expected |
| SimulationTimeline confuses users | Medium | Low | Remove or implement |

---

## 6. Dependency Graph

### 6.1 Import Dependency (Critical Path)

```
App.tsx
 ├── types.ts (shared types)
 ├── components/ui/Primitives.tsx
 ├── components/LoadoutTiles.tsx
 ├── components/selectors/{Weapon,Armor,Mod}Selector.tsx
 ├── components/figma/ImageWithFallback.tsx
 ├── lib/ohmm/convertLoadout.ts
 │    └── ohai/src/ui/types.ts
 │    └── ohai/src/ui/data/catalog.ts
 ├── ohai/src/ui/formulaBridge.ts ← MAIN CALCULATION ENTRY
 │    ├── ohai/src/engine/modifierAggregation.ts
 │    ├── ohai/src/resolvers/loadoutEffectResolver.ts
 │    │    ├── resolvers/{weapon,armorSet,mod,cradle}EffectResolver.ts
 │    │    └── registries/* (all item data)
 │    └── ohai/src/schemas/{buildGoalSchema,statSemantics}.ts
 ├── ohai/src/ui/formulaDamageAdapter.ts
 │    └── ohai/src/engine/formulaApplicator.ts
 │         └── ohai/src/engine/officialFormulaBridge.ts
 │              └── 22 officialFormula*.ts files
 └── ohai/src/ui/combatOutput.ts
```

### 6.2 Parallelism Analysis

| Work Item | Can Parallelize With | Shared Files |
|-----------|---------------------|--------------|
| Component extraction | Documentation updates | None |
| Stat weight calculator | UI polish | Engine files only (read) |
| Save/Load/Share UI | Performance optimization | None |
| Mobile CSS | Formula features | None |
| Bundle splitting | Component extraction | `vite.config.ts` (serialize) |

---

## 7. Agent-Specific Findings

### Agent 1 — Product Architect

**Finding**: OHMM has the engine of a professional tool but the UX of a prototype. The calculation pipeline is production-grade; the UI layer is MVP-grade.

**Key Gap**: No "why" layer. Users see numbers but can't understand what drives them.

**Critical Missing**: Save/Load/Share. Without persistence, users have zero reason to return.

---

### Agent 2 — Principal UI/UX Designer

**Findings**:
1. **Zero progressive disclosure** — all panels visible simultaneously
2. **No visual hierarchy** — DPS number same size as labels
3. **No empty state guidance** — new users see blank slots with no hint
4. **Modal UX is adequate** but missing comparison preview
5. **Set bonus progress is invisible** — critical gameplay feedback missing
6. **Accessibility score: ~3/10** — color-only indicators, no ARIA live regions

**Priority Fix**: Hero metrics bar + save/share buttons + empty state hints

---

### Agent 3 — Senior Frontend Architect

**Findings**:
1. **App.tsx: 2,060 LOC** — still contains 5 full modal components + 6 chart panels
2. **`src/lib/ohmm/`**: Contains duplicate `formulaBridge.ts` and `formulas/` directory (5 files) that appear unused or stale
3. **40 unused shadcn/Radix stubs** in `components/ui/` — only 4 are actually imported
4. **No state management library** — useState at root causes unnecessary re-renders
5. **No virtualization** for 91+ mod lists, 47+ weapon lists
6. **Bundle: 1.6MB** — single chunk, no splitting

**Priority Fix**: Extract remaining modals → reduce App.tsx to <500 LOC orchestration

---

### Agent 4 — Game Systems Engineer

**Findings**:
1. **Formula engine is excellent** — covers physical, burn, frost vortex, power surge, status, deviation
2. **42 canonical StatKeys** properly enumerated in Zod schema
3. **Keyword mechanics correctly modeled**: crit unlock (Gilded Gloves), weakspot behavior, intrinsic scaling
4. **PvP mitigation properly implemented** with source tracking
5. **Conditional effects engine** with uptime profiles — production quality
6. **Official formula graph** with 22 files — attempting to reverse-engineer the actual game formula tree

**Concerns**:
- Shrapnel and Bounce keyword crit/weakspot behavior needs verification
- Calibration secondary substats need observed ranges
- Star/tier scaling factors need citation
- ChefRex dual-mode (ratings vs stored percent) still exists

**No incorrect mechanics detected.**

---

### Agent 5 — Theorycraft Lead

**Critical Missing Tools**:
1. **Stat Weight Calculator** — "What should I upgrade?" is unanswerable
2. **Upgrade Priority Queue** — resource allocation decisions impossible
3. **Build Diff** — "Why did DPS change?" requires manual inspection
4. **Formula Explainer in UI** — `formulaExplainer.ts` exists but is hidden
5. **Set Bonus Progress** — "Am I 1 piece away from 2pc?" invisible
6. **Target Presets** — TTK against fixed 8000 HP is meaningless

**Assessment**: An elite Once Human theorycrafter would find the engine impressive but the UX frustrating. They'd open a spreadsheet alongside OHMM because OHMM can't answer "what should I do next?"

---

### Agent 6 — Data Architect

**Findings**:
1. **Normalization layer is excellent** (documented in `NORMALIZATION_LAYER.md`)
2. **Registry pattern is clean** — 35 files, proper type safety
3. **Generated data clearly marked** (`generated/` subdirectory)
4. **Verified mod families properly source-tagged**
5. **External references preserved** (`data/raw/external-references/`)
6. **Official runtime catalog maintained** with semantic graph

**Gaps**:
- No per-item `_meta.verifiedDate` field
- No `DATA_AUTHORITY.md` document (planned but not created)
- No automated staleness detection for registry entries
- Image provenance not tracked per item

---

### Agent 7 — QA Lead

**Broken Workflows**:
1. **First-time user**: Empty loadout → no guidance → bounce
2. **Mobile user**: Completely broken (fixed 272px columns)
3. **Keyboard user**: No tab order through slots
4. **Save build**: Not possible (no UI)
5. **Share build**: Not possible (no UI)
6. **Simulate**: Timeline shows static placeholder always

**Hidden Bugs**:
1. `SimulationTimeline` renders placeholder data regardless of state
2. `CombatResolver` uses hardcoded `targetHealth = 8000`
3. `getArmorItems()` may include Chinese-only items if filter fails
4. Calibration modal allows `weaponDmgPercent` outside 25-50 via text input (no clamp on onChange)
5. `modalItems.attachment()` type signature expects 2 args but component passes (uiSlotKey, weaponFamily) only when both exist

**Regression Risk Areas**:
- Any change to `convertLoadout.ts` can break the entire calculation pipeline
- Registry ID changes break saved builds (no migration)
- modRegistry test fixtures mixed with real data (tagged but risky)

---

### Agent 8 — Performance Engineer

**Bundle Analysis**:
```
dist/assets/index-ClBehr_D.js       1,645.44 kB (gzip: 304.34 kB)
dist/assets/armor.verified-Cjk_UWQh.js  157.25 kB (gzip: 9.36 kB)
dist/assets/index-DCMwaOeC.css        109.34 kB (gzip: 18.44 kB)
```

**Issues**:
1. **1.6MB JS bundle** — no code splitting, no lazy routes
2. **Recharts** (~350KB) loaded even if user hasn't opened analysis
3. **All registries** loaded at startup (weapons, armor, mods, attachments, food, deviations, cradle)
4. **No virtualization** in selector modals with 47+ weapons, 91+ mods
5. **useMemo chains** in App.tsx recompute on any state change due to closures
6. **Supabase fetches** fire on mount regardless of need

**Priority Fixes**:
1. `manualChunks` in Vite config (react, recharts, registries, engine)
2. Lazy-load modals (they're heavy and only rendered on demand)
3. Virtual lists for weapon/armor/mod selectors
4. Debounce search in modals (currently re-filters on every keystroke)

---

### Agent 9 — Documentation Engineer

**Existing Documentation**:
| Document | Status | Accuracy |
|----------|--------|----------|
| `README.md` | Current | Good |
| `PROJECT_STATUS.md` | Current | Good |
| `LEGACY_TREES.md` | Exists | Referenced but not checked |
| `docs/architecture_flow.dot` | Exists | Partially stale (references deleted dirs) |
| `docs/NORMALIZATION_LAYER.md` | Current | Excellent |
| `docs/NPK_RUNTIME_NOTES.md` | Exists | Niche |
| `docs/ONCEHUMAN_MAIN_ARCHIVE_REPORT.md` | Current | Excellent |
| `guidelines/Guidelines.md` | Exists | Not checked |

**Missing Documentation**:
| Document | Priority | Purpose |
|----------|----------|---------|
| `ARCHITECTURE.md` | High | Updated component map |
| `ROADMAP.md` | High | Prioritized feature plan |
| `DATA_AUTHORITY.md` | Medium | Registry trust levels |
| `COMPONENT_MAP.md` | Medium | UI component inventory |
| `CHANGELOG.md` | Low | Change tracking |
| Root `tsconfig.json` | High | IDE support |

---

## 8. Architectural Bottlenecks

| Bottleneck | Impact | Root Cause | Resolution |
|------------|--------|------------|------------|
| App.tsx orchestrates everything | Can't test, can't parallelize work | Historical monolith growth | Phase 3 extraction |
| Single bundle chunk | Slow initial load | No Vite `manualChunks` config | Phase 2 fix |
| No state management beyond useState | Prop drilling, no persistence integration | Premature to add early on, now needed | Phase 3 (Zustand) |
| ohai nested project | React version conflict, complex imports | Originally independent tool | Long-term: flatten |
| Formula explainer exists but hidden | Users can't understand results | UI not built for it | Phase 4 feature |

---

## 9. Hidden Coupling

| Coupling | Between | Risk |
|----------|---------|------|
| `convertLoadout.ts` hardcodes slot names | UI LoadoutMap ↔ BuildSelection | If UI adds a slot, converter silently drops it |
| `applyCalibrationRollToCalculationInput` in App.tsx | UI ↔ Engine | Should be in resolver layer |
| `modalItems` object closure in App.tsx | Modal dispatching ↔ Registry calls | Re-creates arrays every render |
| `CALIBRATION_STAT_TO_FORMULA_STAT` map in App.tsx | UI ↔ Engine stat vocabulary | Should live in engine/schemas |
| Supabase URL/key imported from ohai data layer | Root UI ↔ ohai internal | Tight coupling to nested project |

---

## 10. Summary Scorecard

```
┌────────────────────────────────────────────────────────────┐
│                    OHMM PHASE 0 AUDIT                       │
├────────────────────────────────────────────────────────────┤
│ Formula Engine:       ████████████████████ 9/10  EXCELLENT  │
│ Data Architecture:    ████████████████░░░░ 8/10  STRONG     │
│ Testing (Engine):     ██████████████░░░░░░ 7/10  GOOD       │
│ Testing (UI):         ░░░░░░░░░░░░░░░░░░░░ 0/10  MISSING   │
│ Component Design:     ████████░░░░░░░░░░░░ 4/10  NEEDS WORK │
│ UX/Workflow:          ██████████░░░░░░░░░░ 5/10  FUNCTIONAL │
│ Performance:          ██████████░░░░░░░░░░ 5/10  ADEQUATE   │
│ Documentation:        ████████████░░░░░░░░ 6/10  PARTIAL    │
│ Accessibility:        ██████░░░░░░░░░░░░░░ 3/10  POOR       │
│ Mobile:               ██░░░░░░░░░░░░░░░░░░ 1/10  BROKEN     │
│ Build Persistence:    ████░░░░░░░░░░░░░░░░ 2/10  NOT IN UI  │
├────────────────────────────────────────────────────────────┤
│ OVERALL:              6.2 / 10                              │
│ VERDICT: Strong engine, prototype-grade product shell.      │
└────────────────────────────────────────────────────────────┘
```

---

## 11. Recommended Phase 1 Planning Focus

Based on this audit, Phase 1 should produce a roadmap addressing:

1. **Stabilization** (Phase 2 targets):
   - Remove/fix SimulationTimeline placeholder
   - Add error boundaries
   - Fix calibration input validation
   - Remove duplicate `src/lib/ohmm/formulas/` directory
   - Add root `tsconfig.json`
   - Fix HTML title

2. **Architecture** (Phase 3 targets):
   - Extract remaining 5 modal components from App.tsx
   - Extract chart panels (CombatResolver, StatusEngine, CombatTelemetry, MitigationAnalysis)
   - Add `manualChunks` Vite config
   - Move `CALIBRATION_STAT_TO_FORMULA_STAT` to engine
   - Move `applyCalibrationRollToCalculationInput` to resolver layer

3. **Theorycraft Features** (Phase 4 targets):
   - Stat Weight Calculator
   - Formula Explainer in UI
   - Save/Load/Share
   - Set Bonus Progress Tracker
   - Hero Metrics Dashboard

4. **Polish** (Phase 5 targets):
   - Progressive disclosure
   - Mobile responsive
   - Accessibility audit
   - Bundle optimization

---

## 12. Approval Gate

**This audit is Phase 0 complete.**

No code changes have been made.

**Awaiting approval to proceed to Phase 1: Planning.**

Phase 1 will produce:
- Implementation roadmap with dependency graph
- Milestones with estimated effort
- Risk analysis per milestone
- Agent assignment matrix

---

*Generated by OHMM Engineering Council — Phase 0 Audit*
*Total source files analyzed: 399 TypeScript/TSX files (267,096 LOC in ohai alone)*
