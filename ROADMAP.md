# OHMM — Implementation Roadmap

**Created**: 2026-06-30 (Phase 1 Planning)
**Last Updated**: 2026-06-30
**Status**: Approved for execution

---

## Phase Progression

```
Phase 0: Audit ─────────────────────── COMPLETE
Phase 2: Stabilization ─────────────── NEXT (see recommendation)
Phase 3: Architecture ──────────────── Blocked by Phase 2
Phase 4A: Persistence & Sharing ────── Blocked by Phase 3
Phase 4B: Theorycraft Features ─────── Blocked by Phase 3
Phase 5: UI Polish & Accessibility ─── Blocked by Phase 4
```

---

## Phase 2: Stabilization

**Objective**: Remove dead code, fix validation gaps, establish test baseline.
**Duration**: 2-3 days
**Risk**: Low
**Agent Ownership**: Frontend Architect (primary), QA Lead (validation)

### Milestones

| ID | Milestone | Effort | Risk | Validation Gate |
|----|-----------|--------|------|-----------------|
| 2.1 | Remove duplicate `src/lib/ohmm/formulas/` directory (5 unused files) | 0.5 hr | Very Low | Build passes |
| 2.2 | Remove unused shadcn/Radix stubs (identify + delete unused `ui/*.tsx`) | 1-2 hr | Low | Build passes, no import errors |
| 2.3 | Fix `index.html` title to "OHMM — Once Human Meta Metrics" | 5 min | None | Visual |
| 2.4 | Fix `package.json` name from `@figma/my-make-file` to `ohmm` | 5 min | None | Build passes |
| 2.5 | Add root `tsconfig.json` for IDE support | 0.5 hr | Low | tsc --noEmit passes or is configured to skip ohai |
| 2.6 | Add error boundary wrapper around App | 1 hr | Low | Runtime: errors show fallback UI |
| 2.7 | Fix calibration input validation (clamp on text input onChange) | 0.5 hr | Low | Manual test: can't enter <25 or >50 |
| 2.8 | Remove or hide SimulationTimeline placeholder | 0.5 hr | Low | Visual: no confusing placeholder |
| 2.9 | Silence console.warn in production (Supabase fallback) | 0.5 hr | Low | Console clean in prod build |
| 2.10 | Add `manualChunks` to Vite config (react, recharts, registries) | 1 hr | Low | Build passes, chunks < 500KB each |

### Dependency Graph

```
2.1 ──┐
2.2 ──┤
2.3 ──┤── All independent (can parallelize)
2.4 ──┤
2.5 ──┤
2.6 ──┘
2.7 ──── Independent
2.8 ──── Independent
2.9 ──── Independent
2.10 ─── Independent (but validate last, touches vite.config.ts)
```

### Exit Criteria

- `npm run build` passes with no errors
- Bundle split into ≥3 chunks, each < 600KB
- No console warnings in production mode
- Zero dead imports (verify via build success after deletions)

---

## Phase 3: Architecture

**Objective**: Extract App.tsx to <500 LOC. Establish component boundaries.
**Duration**: 3-5 days
**Risk**: Medium (behavior must remain identical)
**Agent Ownership**: Frontend Architect (primary), QA Lead (regression)

### Milestones

| ID | Milestone | Effort | Risk | Validation Gate |
|----|-----------|--------|------|-----------------|
| 3.1 | Extract `SettingsModal` to `components/modals/SettingsModal.tsx` | 1 hr | Very Low | Build + visual parity |
| 3.2 | Extract `DeviationModal` to `components/modals/DeviationModal.tsx` | 1 hr | Low | Build + visual parity |
| 3.3 | Extract `BuffModal` to `components/modals/BuffModal.tsx` | 1 hr | Low | Build + visual parity |
| 3.4 | Extract `AttachmentModal` to `components/modals/AttachmentModal.tsx` | 1 hr | Low | Build + visual parity |
| 3.5 | Extract `CradleModal` to `components/modals/CradleModal.tsx` | 1 hr | Low | Build + visual parity |
| 3.6 | Extract `CalibrationModal` to `components/modals/CalibrationModal.tsx` | 1.5 hr | Low | Build + visual parity |
| 3.7 | Extract `LoadoutPanel` to `components/panels/LoadoutPanel.tsx` | 1.5 hr | Medium | Build + visual parity |
| 3.8 | Extract `AnalysisHub` + sub-panels to `components/panels/AnalysisHub.tsx` | 2 hr | Medium | Build + visual parity |
| 3.9 | Extract `CombatResolver`, `StatusEngine`, `CombatTelemetry`, `MitigationAnalysis` to `components/panels/analysis/` | 2 hr | Medium | Build + visual parity |
| 3.10 | Extract `AppHeader` to `components/layout/AppHeader.tsx` | 0.5 hr | Very Low | Build + visual parity |
| 3.11 | Extract `ModalDispatcher` to `components/modals/ModalDispatcher.tsx` | 1 hr | Low | Build + visual parity |
| 3.12 | Move `CALIBRATION_STAT_TO_FORMULA_STAT` to engine/schemas | 0.5 hr | Low | Build passes |
| 3.13 | Move `applyCalibrationRollToCalculationInput` to resolvers layer | 1 hr | Medium | Calculation results unchanged |
| 3.14 | Move data-fetching helpers (getWeaponItems, getArmorItems, etc.) to `lib/ohmm/itemResolvers.ts` | 2 hr | Medium | Modal data unchanged |

### Dependency Graph

```
3.1 ──┐
3.2 ──┤
3.3 ──┤── All modal extractions independent
3.4 ──┤
3.5 ──┤
3.6 ──┘
       ↓ (merge all modals)
3.11 ── Depends on 3.1-3.6 complete
3.10 ── Independent
3.7 ─── Independent (but after modals for clean diff)
3.8 ─── Independent
3.9 ─── Depends on 3.8
3.12 ── Independent
3.13 ── Depends on 3.12
3.14 ── Depends on 3.11 (ModalDispatcher references these)
```

### Exit Criteria

- `npm run build` passes
- App.tsx < 500 lines
- All visual behavior identical (manual smoke test)
- No new dependencies added
- Every extraction is a pure refactor (no logic changes)

---

## Phase 4A: Persistence & Sharing

**Objective**: Allow users to save, load, and share builds.
**Duration**: 2-3 days
**Risk**: Low-Medium
**Agent Ownership**: Frontend Architect (state), Product Architect (UX flow)

### Milestones

| ID | Milestone | Effort | Risk | Validation Gate |
|----|-----------|--------|------|-----------------|
| 4A.1 | Add Zustand store for build state (offLoadout, defLoadout) | 2 hr | Low | State works identically |
| 4A.2 | Add localStorage persistence middleware | 1 hr | Low | Refresh preserves build |
| 4A.3 | Add Save/Load UI (named builds, max 20) | 3 hr | Low | Can save, name, load builds |
| 4A.4 | Add URL-based build encoding (share link) | 3 hr | Medium | Share URL loads correct build |
| 4A.5 | Add "Copy Build Link" button to header | 1 hr | Low | Copies URL to clipboard |
| 4A.6 | Add build reset confirmation | 0.5 hr | Low | No accidental data loss |

### Dependency Graph

```
4A.1 → 4A.2 → 4A.3 (sequential)
4A.1 → 4A.4 → 4A.5 (sequential, can parallelize with 4A.3)
4A.6 ── Independent
```

### Exit Criteria

- Build persists across browser refresh
- Named builds can be saved and loaded
- Share URLs produce identical loadouts
- State migration from useState to Zustand is transparent

---

## Phase 4B: Theorycraft Features

**Objective**: Implement the tools experienced theorycrafters need.
**Duration**: 8-12 days
**Risk**: Medium
**Agent Ownership**: Game Systems Engineer + Theorycraft Lead (logic), Frontend Architect (UI)

### Milestones

| ID | Milestone | Effort | Risk | Validation Gate |
|----|-----------|--------|------|-----------------|
| 4B.1 | **Hero Metrics Dashboard** — persistent top bar with DPS/TTK/Crit/Meta | 3 hr | Low | Visual: numbers match existing panels |
| 4B.2 | **Formula Explainer Panel** — surface `formulaExplainer.ts` output in UI | 4 hr | Low | Trace output matches engine |
| 4B.3 | **Stat Weight Calculator** — marginal value of +1% per stat | 6 hr | Medium | Results mathematically correct |
| 4B.4 | **Set Bonus Progress Tracker** — visual indicator per set | 4 hr | Low | Correct count, correct bonuses shown |
| 4B.5 | **Upgrade Priority Queue** — ranked list of highest-value upgrades | 6 hr | Medium | Rankings match stat weight order |
| 4B.6 | **Build Diff Viewer** — before/after comparison on item swap | 4 hr | Low | Differences accurately displayed |
| 4B.7 | **Keyword Synergy Matrix** — interactive keyword reference | 4 hr | Low | Data matches verified game mechanics |
| 4B.8 | **Calibration Roll Analyzer** — percentile + DPS impact | 3 hr | Low | Percentiles mathematically correct |
| 4B.9 | **TTK Simulator with Target Presets** — configurable enemy HP/resists | 5 hr | Medium | TTK matches manual calculation |
| 4B.10 | **Build Comparison Mode** — side-by-side builds | 5 hr | Medium | Both builds compute independently |

### Dependency Graph

```
4B.1 ──── Independent (high priority, do first)
4B.2 ──── Independent
4B.3 ──── Independent (engine supports this already)
4B.4 ──── Independent (armorSetBonusResolver exists)
4B.5 ──── Depends on 4B.3 (needs stat weights)
4B.6 ──── Depends on 4A.1 (needs state snapshots)
4B.7 ──── Independent (data in registries)
4B.8 ──── Independent
4B.9 ──── Independent (pveTargetRegistry exists)
4B.10 ─── Depends on 4A.1 (needs multiple build states)
```

### Exit Criteria (per feature)

- Build passes
- Feature produces mathematically correct results
- No regressions in existing calculation pipeline
- New component has documentation header

---

## Phase 5: UI Polish & Accessibility

**Objective**: Responsive design, progressive disclosure, motion, accessibility.
**Duration**: 5-7 days
**Risk**: Low
**Agent Ownership**: UI/UX Designer (primary), QA Lead (accessibility audit)

### Milestones

| ID | Milestone | Effort | Risk | Validation Gate |
|----|-----------|--------|------|-----------------|
| 5.1 | Mobile responsive layout (tab-based navigation below 768px) | 8 hr | Medium | Usable on 375px viewport |
| 5.2 | Progressive disclosure (collapsed sections, expand on demand) | 4 hr | Low | Info density maintained for power users |
| 5.3 | Empty state guidance (hints when no items equipped) | 2 hr | Low | New users understand next action |
| 5.4 | Number change animations (flash on recalculation) | 2 hr | Low | Visual only, no logic change |
| 5.5 | ARIA live regions for calculation updates | 2 hr | Low | Screen reader announces DPS changes |
| 5.6 | Keyboard navigation for all interactive elements | 4 hr | Low | Tab through all slots, Enter to open |
| 5.7 | Color contrast fixes (minimum 4.5:1 for body text) | 2 hr | Low | Passes WCAG AA |
| 5.8 | Virtual scrolling for selector modals (91+ items) | 3 hr | Low | Smooth scroll with 100+ items |

### Exit Criteria

- Lighthouse accessibility score ≥ 85
- Usable on 375px viewport
- Keyboard-only navigation possible for full workflow
- No information density loss for desktop power users

---

## Summary Timeline

```
Week 1:   Phase 2 (Stabilization)         [2-3 days]
Week 1-2: Phase 3 (Architecture)          [3-5 days]
Week 2-3: Phase 4A (Persistence/Sharing)  [2-3 days]
Week 3-5: Phase 4B (Theorycraft Features) [8-12 days]
Week 5-6: Phase 5 (Polish/Accessibility)  [5-7 days]
```

**Total estimated effort**: 20-30 working days

---

## Risk Summary

| Phase | Risk Level | Primary Concern | Mitigation |
|-------|:----------:|-----------------|------------|
| Phase 2 | Low | Accidental deletion of used file | Build verification after each deletion |
| Phase 3 | Medium | Visual regression during extraction | Manual smoke test after each extraction |
| Phase 4A | Low-Medium | State migration breaks calculation | Keep useState fallback until verified |
| Phase 4B | Medium | Incorrect math in new features | Compare against manual spreadsheet calculations |
| Phase 5 | Low | Mobile layout breaks desktop | Desktop-first, mobile additive |

---

*Phase 1 Planning — OHMM Engineering Council*
