# OHMM Changelog

## Phase 3.6.5 — Modal Extraction Checkpoint (2026-06-30)

### Summary
All 6 inline modal components extracted from App.tsx. Full smoke test coverage for every modal.

### Modal Extractions Complete
| Component | File | Props |
|-----------|------|-------|
| SettingsModal | `src/app/components/modals/SettingsModal.tsx` | `onClose`, `onResetOffensive`, `onResetDefensive` |
| DeviationModal | `src/app/components/modals/DeviationModal.tsx` | `onClose`, `onSelect`, `items?` |
| BuffModal | `src/app/components/modals/BuffModal.tsx` | `isFood`, `onClose`, `onSelect`, `items?` |
| AttachmentModal | `src/app/components/modals/AttachmentModal.tsx` | `slotLabel`, `onClose`, `onSelect`, `items?` |
| CradleModal | `src/app/components/modals/CradleModal.tsx` | `slotIndex`, `onClose`, `onSelect`, `items?` |
| CalibrationModal | `src/app/components/modals/CalibrationModal.tsx` | `onClose`, `onSelect`, `items?` |

### Tests Added
- 18 total smoke tests (was 2 at Phase 2.2)
- Every extracted modal verified to open correctly

### Metrics
- App.tsx: 2,060 → 1,461 lines (29% reduction, -599 lines)
- Bundle CSS: 109KB → 42KB (61% reduction from dead code removal)
- Main JS chunk: 1,645KB → 1,080KB (34% reduction from bundle splitting)

---

## Phase 3.0 — Validation Baseline (2026-06-30)

- Fixed `typecheck:ui` (68 errors → 0)
- Narrowed `tsconfig.ui.json` to exclude Node-only scripts
- Added `src/ui/env.d.ts` for CSS module declarations
- Added `@types/node` for hybrid utility files
- Created `docs/VALIDATION_BOUNDARY.md`

---

## Phase 2 — Stabilization (2026-06-30)

- Removed 56 verified dead files (-7,012 LOC)
- Added Vitest + React Testing Library test harness
- Added 13 critical smoke tests
- Added bundle splitting (recharts separated)
- Fixed HTML title and package.json name

---

## Phase 1 — Planning (2026-06-30)

- Created ROADMAP.md, FEATURE_BACKLOG.md, DECISION_LOG.md, COMPONENT_MAP.md
- Phase 2 recommendation approved

---

## Phase 0 — Audit (2026-06-30)

- Complete repository audit (PHASE_0_AUDIT.md)
- Overall health score: 6.2/10
- Formula engine: 9/10
- 399 TypeScript files, 267,096 LOC in ohai engine
