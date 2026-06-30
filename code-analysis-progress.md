# OHMM Code Analysis Progress

## Workflow Instructions

Continue in analysis-only mode unless the user explicitly approves cleanup changes. Do not delete or modify code during discovery, scanning, or reporting. Present findings with impact and rollback notes before any cleanup.

Use this file as the handoff document for future chats. Update it after each major phase with completed work, current findings, and next steps.

## Project Context

- Project root: `C:\Users\tyr3x\Downloads\makeoh\OHMM`
- Current target: OHMM React/Vite app with nested OHAI TypeScript domain app under `src/ohai`.
- Root app: React 18 + Vite, entry through `src/main.tsx` and shim `src/app/App.tsx`.
- Nested OHAI app: React 19 + Vite/CommonJS toolchain, domain source under `src/ohai/src`.
- New local apps from prior work: `apps/overwolf-bridge` and `apps/vision-service`.
- Important exclusions: `node_modules`, `dist`, `src/ohai/node_modules`, generated build output, copied package folders at OHMM root, binary assets, screenshots, archives.
- Safety constraints from `src/ohai/AGENTS.md`: locked verified data can be consumed but not modified; do not invent game data; do not wire unresolved Sprint 10/PvP candidate values into UI.

## Completed Phases

- Started workflow from attached `Code Analysis & Cleanup Workflow` request.
- Read root and nested project instructions.
- Confirmed no cleanup changes have been made.
- Initial structure discovery showed OHMM contains many copied package/vendor directories at the repository root, so analysis scope should focus on authored source and config.
- Created `code-analysis-report.md` with initial findings and cleanup order.
- Ran root build and nested TypeScript diagnostics.
- Implemented the first approved baseline-fix batch and a small touched-file cleanup pass.

## Current Analysis Scope

Conservative full-code analysis over authored code:

- Include: `src`, `apps`, root configs/scripts/docs needed to understand architecture.
- Include nested authored OHAI code: `src/ohai/src`, `src/ohai/scripts`, `src/ohai/docs`, `src/ohai/data` metadata where relevant.
- Exclude: root copied packages (`react`, `react-dom`, `postcss`, etc.), `node_modules`, `dist`, `dist-ui`, generated image/audio assets, archives, `.make` files, screenshots.

## Current Findings

- Root package scripts only expose `build` and `dev`; nested `src/ohai/package.json` has the useful `typecheck`, `typecheck:ui`, and smoke-test scripts.
- Root `vite.config.ts` intentionally aliases React to the root React 18 install to avoid React 18/19 duplication from nested OHAI imports. Do not remove this without retesting runtime.
- `src/ohai/AGENTS.md` says three `test:combat:validation` failures are expected until in-game validation resolves them.
- Root `npm run build` passes with a large chunk warning.
- Nested `npm run typecheck` and `npm run typecheck:ui` now pass.
- Root `npm run build` still passes, with the existing large chunk warning.
- `npm run test:build:persistence` passed 80/80.
- `npm run test:loadout:options` passed 35/35.
- `npm run test:registry:validation` exited 0 but still reports 39 registry validation failures; these appear to be data-quality issues, not introduced by this cleanup.
- Fixed blockers:
  - `src/ohai/src/ui/App.tsx` missing imports and string-ID selector context.
  - Armor string/object selection boundary via `getArmorSelectionId`.
  - `armorSetBonusResolver.ts` stale `partialEffect` type assumption.
  - Saved-build armor piece schema now narrows `stars` and `tier` to the app literal unions.
- Cleaned low-risk unused imports/locals in touched files.
- Full `--noUnusedLocals --noUnusedParameters` still reports 201 diagnostics: `src/ui` 116, `src/engine` 34, `src/utils` 32, `src/parsers` 12, `src/presentation` 4, `src/resolvers` 3.
- `ts-prune` still contains many expected false positives around barrel exports, generated registries, and public helpers.

## Next Steps

1. Generate an authored-source inventory with file counts by extension and major directory.
2. Run safe static checks where available:
   - root `npm run build`
   - nested `npm run typecheck`
   - nested `npm run typecheck:ui`
3. Scan for low-risk cleanup candidates:
   - obvious unused imports via TypeScript diagnostics/tooling
   - unreferenced authored files, excluding smoke tests and generated registries
   - duplicate root vs nested data/config copies
4. Produce a cleanup report before any code changes.

Recommended next phase: continue cleanup area-by-area, starting with UI component imports/props, and verify after each batch.

## Approval Rule

No code cleanup, deletion, formatting rewrite, data migration, or generated-file refresh is approved yet.
