# OHMM — Decision Log

**Created**: 2026-06-30 (Phase 1 Planning)
**Last Updated**: 2026-06-30

Record of key architectural and product decisions with rationale, alternatives considered, and dissenting opinions.

---

## DL-001: App.tsx Extraction Before Major Features

**Decision**: Component extraction (Phase 3) must complete before any Phase 4 feature work begins.

**Date**: 2026-06-30
**Status**: Approved
**Owner**: Frontend Architect

### Context

App.tsx is 2,060 lines containing 5 modal components, 6 chart panels, the full AnalysisHub, LoadoutPanel, AppHeader, ModalDispatcher, and all data-fetching helpers. Adding features into this file would:

1. Create merge conflicts between any two parallel workstreams
2. Make each feature harder to test in isolation
3. Increase cognitive load for every future change
4. Make rollback of individual features impossible without reverting unrelated code

### Rationale

- **Testability**: Extracted components can be unit-tested independently.
- **Parallelism**: After extraction, multiple agents can work on different panels simultaneously without file conflicts.
- **Reviewability**: PRs touching 50-line components are reviewable. PRs touching 2,000-line files are not.
- **Risk isolation**: A bug in CalibrationModal doesn't risk corrupting CombatResolver rendering.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Add features directly to App.tsx | Compounds the monolith problem. Every future PR becomes harder. |
| Full rewrite with new architecture | Violates "evolutionary improvement" principle. High risk of regression. |
| Extract only the components needed for next feature | Creates inconsistent architecture. Some modals extracted, others not. Confusing. |

### Dissenting Opinion (Product Architect)

"Shipping Save/Load (F-001) gives immediate user value and could be done by adding a 50-line panel without full extraction."

**Resolution**: Acknowledged. However, the full extraction is estimated at 3-5 days total, and doing it first prevents the compounding debt problem. Save/Load in Phase 4A (immediately after extraction) ensures minimal delay to user-facing value.

### Risks

- Extraction introduces subtle rendering differences (e.g., component boundary changes context)
- Mitigation: Manual visual smoke test after each extraction. Build verification gate.

---

## DL-002: Engine Correctness Protection

**Decision**: No Phase 4 feature may modify files in `src/ohai/src/engine/` unless the change is (a) additive-only and (b) accompanied by a smoke test.

**Date**: 2026-06-30
**Status**: Approved
**Owner**: Game Systems Engineer

### Context

The formula engine (`src/ohai/src/engine/`, 67 files) represents the project's most valuable asset. It has:
- 20+ smoke tests validating damage calculations
- Verified against in-game observations
- Complex bucket-based multiplication
- Conditional effects with uptime profiles

A single regression in this layer would produce incorrect DPS numbers for every user, destroying trust.

### Rationale

- **Trust is the product**: If numbers are wrong, no amount of UI polish matters.
- **Engine is already excellent** (9/10 in audit): It doesn't need modification for most Phase 4 features.
- **New features read from engine output** — they don't need to change how the engine works.
- **Stat Weight Calculator** (F-003) works by running the existing pipeline multiple times with small input changes. It doesn't modify the engine itself.

### Rules

1. All engine reads are safe. Any component can import and call engine functions.
2. Engine writes require:
   - A new smoke test proving the change is correct
   - Review by Game Systems Engineer agent
   - Existing smoke tests still pass
3. No engine file may be moved, renamed, or restructured during Phase 3 or 4.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Freeze engine entirely | Too restrictive. Some features (e.g., Stat Weights) may need new helper functions in engine layer. |
| Allow unrestricted engine changes | Too risky. One broken formula poisons all calculations. |

### Risks

- Over-protection could slow development of features that genuinely need engine enhancements.
- Mitigation: "Additive-only + smoke test" rule allows growth without risking existing behavior.

---

## DL-003: Save/Load/Share Before Advanced Optimizers

**Decision**: Phase 4A (Persistence & Sharing) executes before Phase 4B (Theorycraft Features).

**Date**: 2026-06-30
**Status**: Approved
**Owner**: Product Architect

### Context

The Feature Backlog contains both "table stakes" features (Save/Load/Share) and "differentiating" features (Stat Weights, Upgrade Queue). The question is ordering.

### Rationale

1. **Retention**: Without persistence, users lose all work on page close. No incentive to return. Zero retention = zero engagement with advanced features.
2. **Foundation**: Save/Load requires Zustand state management, which Phase 4B features also need (build snapshots for Diff Viewer, multiple builds for Comparison).
3. **Viral loop**: Share URLs drive organic growth. Every shared build is a new potential user.
4. **Low risk**: Save/Load is well-understood, low-complexity work. It won't delay Phase 4B significantly (2-3 days).
5. **Validation**: If the state migration (useState → Zustand) has issues, better to discover them before building 10 features on top.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Ship Stat Weights first | Higher complexity, higher risk, and users can't save the builds they optimize. |
| Ship both simultaneously | Creates merge conflicts in shared state layer. Serialization needed. |
| Skip persistence, go straight to features | Destroys retention. Users optimize a build, close browser, lose everything. |

### Dissenting Opinion (Theorycraft Lead)

"Stat Weights is the #1 tool theorycrafters need. Persistence is generic web app plumbing."

**Resolution**: Acknowledged. However, Stat Weights without persistence means users can see weights, optimize their build, and then lose everything. The optimization workflow requires persistence to be complete. Stat Weights ships in Phase 4B.1 immediately after persistence.

---

## DL-004: Zustand State Migration Timing

**Decision**: Zustand replaces useState in Phase 4A.1, immediately before persistence.

**Date**: 2026-06-30
**Status**: Approved (conditional on Phase 3 completion)
**Owner**: Frontend Architect

### Context

Current state management uses React useState at the App.tsx root level. This works but has limitations:
- No built-in persistence
- No cross-component access without prop drilling
- No state snapshots for comparison features
- All state changes re-render the entire tree

### Why Now (Phase 4A) and Not Earlier (Phase 3)

1. **Phase 3 is pure refactoring** — it must preserve identical behavior. Changing state management during extraction would conflate two changes and make regressions harder to diagnose.
2. **Phase 4A is the natural moment** — persistence is the first feature that requires state management beyond useState.
3. **Zustand is minimal** — it's essentially a hook around a store. Migration is:
   ```typescript
   // Before: const [offLoadout, setOffLoadout] = useState({});
   // After:  const { offLoadout, setOffLoadout } = useBuildStore();
   ```

### Why Zustand (Not Redux, Jotai, or Context)

| Library | Verdict | Reason |
|---------|---------|--------|
| **Zustand** | Selected | Minimal API, built-in persist middleware, no boilerplate, works outside React (for tests) |
| Redux Toolkit | Rejected | Overkill for this state shape. Boilerplate overhead. |
| Jotai | Considered | Atomic model good for fine-grained reactivity, but persistence middleware less mature. |
| React Context | Rejected | No built-in persistence. Performance issues with large state. |
| Valtio | Considered | Proxy-based, good DX, but less ecosystem support for middleware. |

### Risks

- State shape change could break serialization of existing (hypothetical) saved data → Mitigated by version field in persisted schema.
- Components accessing state via props must be updated to use hook → Phase 3 extraction makes this straightforward.

### Rollback Strategy

If Zustand migration fails or causes issues:
- Keep useState in parallel during transition
- Zustand store can delegate to useState internally
- Only remove useState after full verification

---

## DL-005: UI Tests Required Before High-Risk UI Work

**Decision**: A minimal UI test harness must exist before Phase 4B features modify interactive components.

**Date**: 2026-06-30
**Status**: Approved
**Owner**: QA Lead

### Context

Currently there are **zero UI tests**. The engine has 41 smoke tests, but no test verifies:
- That equipping an item updates DPS display
- That modals open and close correctly
- That calibration input clamps values
- That set bonus tracker shows correct counts

Phase 4B adds complex interactive panels (Stat Weight UI, TTK Simulator, Build Comparison). Without a test harness, regressions in these new features or existing features would go undetected.

### What "Minimal Harness" Means

Not full test coverage. The requirement is:

1. **Vitest configured** in root project
2. **React Testing Library** available
3. **3-5 integration tests** covering:
   - App renders without crash
   - Equipping a weapon updates calculation output
   - Modal opens on slot click and closes on X
   - Calibration input stays within 25-50 range
4. These tests run as part of the validation gate for every phase.

### Timing

- Harness setup: Phase 2 (Stabilization) — add Vitest config + 1 smoke render test
- Additional tests: Added incrementally per Phase 4B feature

### Why Not Full TDD From The Start

| Approach | Why Rejected |
|----------|--------------|
| Full TDD before any features | Delays Phase 4B by 1-2 weeks for minimal current benefit |
| No tests at all | Unacceptable risk. Phase 4B features interact with calculation pipeline. |
| Tests only for new features | Acceptable as minimum, but one existing-behavior test catches regressions |

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Playwright/Cypress E2E only | Too slow for development feedback loop. Good to add later. |
| Manual testing only | Doesn't scale. Humans miss regressions. |
| Storybook component testing | Useful for visual, but doesn't test logic integration. |

### Dissenting Opinion (Frontend Architect)

"Vitest setup in Phase 2 adds 1-2 hours and delays stabilization."

**Resolution**: 1-2 hours is acceptable overhead. A single undetected regression in the calculation display pipeline would cost more time to diagnose than the harness costs to build. Include in Phase 2 as milestone 2.11.

---

## DL-006: Keep `src/ohai/` Nested Structure (For Now)

**Decision**: Do not flatten `src/ohai/` into root `src/` during Phases 2-4.

**Date**: 2026-06-30
**Status**: Approved
**Owner**: Frontend Architect

### Context

`src/ohai/` is a 65MB nested project with its own `package.json`, `tsconfig.json`, and originally its own `node_modules`. It contains 332 TypeScript files including the formula engine, all registries, parsers, and verification tools.

### Rationale

1. **Flattening is a multi-day effort** with high regression risk (every import path changes).
2. **The Vite alias hack works** — React 18/19 conflict is resolved and stable.
3. **ohai has its own test infrastructure** (`npm run pretest` runs typecheck). Flattening would require migrating this.
4. **No Phase 4 feature is blocked by the nesting** — all needed imports work via relative paths.
5. **Risk/reward ratio is poor**: Days of work for zero user-facing benefit.

### When to Revisit

- If a new dependency conflict emerges that aliases can't resolve
- If bundle analysis reveals the nesting causes tree-shaking failures
- If a new contributor reports confusion that documentation can't address

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Flatten now (Phase 2) | High risk, zero user value, delays features by a week |
| Flatten in Phase 3 | Same risks. Architecture phase should not introduce import churn. |
| Publish ohai as internal package | Adds build tooling complexity (workspace setup) for no immediate benefit |

---

## DL-007: Unused Shadcn Components — Delete vs Keep

**Decision**: Delete unused shadcn/Radix component stubs during Phase 2 stabilization.

**Date**: 2026-06-30
**Status**: Approved
**Owner**: Frontend Architect

### Context

`src/app/components/ui/` contains ~40 component files generated from shadcn/ui scaffolding. Analysis shows only 4-5 are actually imported anywhere in the application:
- `Primitives.tsx` (custom)
- Possibly `tooltip`, `scroll-area`, `tabs` via Radix

The remaining ~35 files add to bundle analysis noise, IDE autocomplete pollution, and maintenance surface area.

### Rationale

1. **Dead code is technical debt** — it confuses contributors and may import unused dependencies.
2. **Vite tree-shakes unused exports** — but the files still appear in analysis tools and IDE search.
3. **Re-adding is trivial** — `npx shadcn-ui@latest add button` regenerates any component in seconds.
4. **Build verification** catches any accidental deletion of actually-used component.

### Approach

1. Run build.
2. Delete component.
3. Run build again.
4. If build fails → that component was used. Restore and keep.
5. If build succeeds → component was dead code. Commit deletion.

### Risk

- A component may be dynamically imported or conditionally used. Build success doesn't guarantee runtime success.
- Mitigation: Run app in dev mode after deletions and click through all modals.

---

*Decision Log — OHMM Engineering Council*
