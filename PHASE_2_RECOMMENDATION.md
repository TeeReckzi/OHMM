# Phase 2 Recommendation: Next Implementation Milestone

**Decision**: **Option A — Stabilization and Dead-Code Cleanup**

---

## Why Stabilization First

### Reasoning

| Candidate | Why Not First |
|-----------|---------------|
| A) Stabilization ✅ | **Selected.** Low risk. Reduces surface area. Establishes validation gates. |
| B) App.tsx extraction | Should not happen while dead code pollutes the tree. Extraction is cleaner after stabilization removes noise. |
| C) Save/load/share | Requires state management migration (Phase 4A). Premature before architecture is stable. |
| D) Hero metrics dashboard | Feature work belongs in Phase 4B. Architecture must be clean first. |
| E) UI test harness | Part of stabilization (milestone 2.11). Included in Option A. |

### Core Argument

Stabilization removes obstacles that make every subsequent phase harder:

1. **Dead code removal** → Fewer files to reason about during Phase 3 extraction.
2. **Bundle splitting** → Faster dev iteration (HMR improves) and validates that tree-shaking works.
3. **Validation fixes** → Prevents user confusion during any subsequent demo or feedback session.
4. **Test harness setup** → Every phase after this can verify behavior automatically.
5. **Low risk** → No behavior changes. Only removals and config additions.

If Phase 2 fails (unlikely), rollback is trivial (git revert). If Phase 3 fails without Phase 2, diagnosis is harder because dead code and missing validation obscure the real issues.

---

## Files Likely Affected

### Deletions (Dead Code)

| File/Directory | Reason for Deletion |
|----------------|---------------------|
| `src/lib/ohmm/formulas/combatOutput.ts` | Duplicate of `src/ohai/src/ui/combatOutput.ts` |
| `src/lib/ohmm/formulas/formulaBridge.ts` | Duplicate of `src/ohai/src/ui/formulaBridge.ts` |
| `src/lib/ohmm/formulas/formulaDamageAdapter.ts` | Duplicate of `src/ohai/src/ui/formulaDamageAdapter.ts` |
| `src/lib/ohmm/formulas/loadoutOptions.ts` | Appears unused (verify via build) |
| `src/lib/ohmm/formulas/pvpMitigation.ts` | Duplicate of `src/ohai/src/ui/pvpMitigation.ts` |
| `src/lib/ohmm/formulas/types.ts` | Duplicate types |
| `src/lib/ohmm/formulaBridge.ts` | Duplicate (root-level copy) |
| `src/app/components/ui/[35+ unused stubs]` | Shadcn scaffolding never imported |

### Modifications

| File | Change |
|------|--------|
| `index.html` | Fix title: "OHMM — Once Human Meta Metrics" |
| `package.json` | Fix name: `"ohmm"` |
| `vite.config.ts` | Add `build.rollupOptions.output.manualChunks` |
| `src/app/App.tsx` | Wrap in ErrorBoundary. Fix calibration input clamp. Hide SimulationTimeline. |

### Additions

| File | Purpose |
|------|---------|
| `tsconfig.json` (root) | IDE support + path aliases |
| `src/app/components/ErrorBoundary.tsx` | Crash recovery UI |
| `vitest.config.ts` | Test harness configuration |
| `src/app/__tests__/App.smoke.test.tsx` | Minimal render test |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Delete a file that's actually imported | Low | Build fails (caught immediately) | Run `npm run build` after each deletion |
| manualChunks config causes runtime issue | Low | App doesn't load | Test in dev mode + preview mode |
| Error boundary swallows real errors | Very Low | Silent failures | Log errors before displaying fallback |
| Vitest config conflicts with existing ohai tests | Low | Test runner confusion | Vitest runs root only; ohai keeps its own runner |

---

## Validation Commands

Execute in order after all Phase 2 changes:

```bash
# 1. Build verification (no dead imports, chunks split)
npm run build

# 2. Check chunk sizes (should see 3+ chunks, each < 600KB)
ls -la dist/assets/*.js

# 3. Dev server smoke test (starts without errors)
npm run dev
# Open http://localhost:5173 → verify app loads, no console errors

# 4. Test harness (new)
npx vitest run

# 5. Type check (if tsconfig.json added)
npx tsc --noEmit --project tsconfig.json
```

### Exit Criteria Checklist

- [ ] `npm run build` succeeds
- [ ] Bundle split into ≥ 3 JS chunks
- [ ] Largest chunk < 600KB (from current 1,645KB)
- [ ] `npx vitest run` passes (1+ smoke test)
- [ ] App loads in browser without console errors
- [ ] HTML title shows "OHMM — Once Human Meta Metrics"
- [ ] SimulationTimeline placeholder is hidden or removed
- [ ] Calibration input rejects values outside 25-50

---

## Rollback Strategy

Phase 2 consists entirely of:
- File deletions (reversible via git checkout)
- Config additions (reversible via git revert)
- Inline fixes (< 20 lines changed in App.tsx)

**Rollback command**: `git revert HEAD~N` where N is the number of Phase 2 commits.

**Alternative**: Each milestone within Phase 2 should be a separate commit. Individual milestones can be reverted independently.

**Commit strategy**:
```
commit 1: "phase-2.1: remove duplicate src/lib/ohmm/formulas/"
commit 2: "phase-2.2: remove unused shadcn component stubs"
commit 3: "phase-2.3-2.4: fix HTML title and package name"
commit 4: "phase-2.5: add root tsconfig.json"
commit 5: "phase-2.6: add ErrorBoundary"
commit 6: "phase-2.7: fix calibration input validation"
commit 7: "phase-2.8: hide SimulationTimeline placeholder"
commit 8: "phase-2.9: silence Supabase console warnings"
commit 9: "phase-2.10: add manualChunks to Vite config"
commit 10: "phase-2.11: add Vitest harness + smoke test"
```

Each commit is independently revertible. Build must pass after every commit.

---

## Estimated Effort

| Milestone | Time |
|-----------|------|
| 2.1: Remove duplicate formulas directory | 30 min |
| 2.2: Remove unused shadcn stubs | 1-2 hr |
| 2.3-2.4: Fix title + package name | 10 min |
| 2.5: Root tsconfig.json | 30 min |
| 2.6: ErrorBoundary | 45 min |
| 2.7: Calibration validation fix | 30 min |
| 2.8: Hide SimulationTimeline | 20 min |
| 2.9: Silence console warnings | 30 min |
| 2.10: manualChunks Vite config | 1 hr |
| 2.11: Vitest harness + smoke test | 1.5 hr |
| **Total** | **~7-8 hours** |

---

## Summary

Phase 2 is the safest possible first step because:
1. It **reduces** the codebase (fewer files = less confusion)
2. It **establishes** validation infrastructure (test harness = confidence)
3. It **improves** performance measurably (bundle splitting)
4. It has **near-zero regression risk** (deletions + config only)
5. It makes **Phase 3 cleaner** (extraction operates on a tidy tree)

**Recommendation: Proceed with Phase 2 immediately upon approval.**

---

*Phase 2 Recommendation — OHMM Engineering Council*
