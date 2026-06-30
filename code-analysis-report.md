# OHMM Code Analysis Report

## Summary

Analysis started from `C:\Users\tyr3x\Downloads\makeoh\OHMM` using the attached cleanup workflow. No cleanup edits were made.

The repo currently has a split personality:

- Root Vite app builds successfully.
- Nested `src/ohai` TypeScript checks now pass after the first baseline-fix batch.
- Unused-code scans still find broad cleanup inventory; only the safest touched-file items have been pruned.

## Commands Run

- `npm run build` from OHMM root: passed, with one large chunk warning.
- `npm run typecheck` from `src/ohai`: passed after fixes.
- `npm run typecheck:ui` from `src/ohai`: passed after fixes.
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false` from `src/ohai`: still reports 201 remaining no-unused diagnostics outside the cleaned touched-file set.
- `npx --yes ts-prune --project tsconfig.json` from `src/ohai`: completed, but output contains many expected false positives.
- `npm run test:build:persistence` from `src/ohai`: passed 80/80.
- `npm run test:loadout:options` from `src/ohai`: passed 35/35.
- `npm run test:registry:validation` from `src/ohai`: command exited 0, but report still shows 39 known/data-quality failures around unapproved stat keys and non-normalized tags.

## Completed Fixes

1. `src/ohai/src/ui/App.tsx`
   - Restored missing imports for React hooks, lucide icons, and local UI types.
   - Converted selector modal armor context to string IDs.
   - Removed unused locals/imports exposed by the cleanup scan.

2. Armor selection boundaries
   - Added `getArmorSelectionId` in `src/ohai/src/ui/types.ts`.
   - Used it in `LoadoutMatrix.tsx`, `VisualLoadoutBoard.tsx`, and `TacticalBuildDashboard.tsx` where UI code requires string IDs.

3. Resolver/schema mismatch
   - Made `armorSetBonusResolver.ts` tolerant of generated armor set metadata that does not include `partialEffect`.
   - Tightened saved-build armor piece validation so `stars` and `tier` match `BuildSelection` literal unions.

## Remaining Conservative Cleanup Candidates

These are candidates only; do not delete automatically.

- Many React component files still import default `React` even though the project uses the automatic JSX runtime.
- Several smoke tests contain unused assertion helpers/imports. These are lower risk but should be cleaned only after confirming the tests still run.
- `ts-prune` flags many exported helpers and barrel exports under `src/ohai/src/engine`, `src/ohai/src/schemas`, and generated registries. Treat these as public/internal API candidates, not deletion candidates.
- Current `--noUnusedLocals --noUnusedParameters` area counts: `src/ui` 116, `src/engine` 34, `src/utils` 32, `src/parsers` 12, `src/presentation` 4, `src/resolvers` 3.

## Suggested Cleanup Order

1. Continue with UI-only cleanup in small batches:
   - Remove unused default `React` imports and unused icon imports.
   - Remove unused component props only where callers and behavior are obvious.
   - Avoid changing public exports or generated registries.

2. Re-run smoke tests relevant to changed areas:
   - `npm run test:build:persistence`
   - `npm run test:loadout:options`
   - `npm run test:registry:validation`
   - `npm run test:combat` only if resolver/formula behavior changes.

## Open Approval Point

The first narrow baseline-fix batch is complete. Broad dead-code deletion is still not recommended without area-by-area review.
