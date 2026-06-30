# LEGACY / DEPRECATED SOURCE TREES

**DO NOT EDIT THESE DIRECTORIES**

This project has suffered from repeated extraction, migration, and Figma Make copies.

## Active Source of Truth
- `src/ohai/src/` (especially `src/ohai/src/ui/` and `src/ohai/src/engine/`)
- All new work and fixes must land here.

## Legacy Trees (frozen)

These directories contain older/parallel copies of the same logic:
- `components/`
- `engine/`
- `parsers/`
- `registries/`
- `resolvers/`
- `schemas/`
- `selectors/`
- `utils/` (partial)
- `verification/`
- `presentation/`

## Other copies
- `src/imports/` — another historical dump (mostly unused)
- `src/ohai/node_modules/`, `dist-ui/`, etc. — build artifacts of the inner project

## Rules
1. **DEPRECATED - DO NOT EDIT**. Never edit files under the legacy trees listed above.
2. If you find a bug in a legacy copy, port the fix to the active tree instead.
3. **These trees have been deleted in this cleanup** (see git history or backup if needed).
4. The root-level copies + src/imports/ were **not** used by the running app.

## Cleanup Status (2026)
- Root legacy dirs (components/, engine/, etc.) and src/imports/ removed as part of crash fix priority #2.
- All development must happen under `src/ohai/src/`.
- Active shim: src/app/App.tsx -> ../ohai/src/ui/App

## src/ohai Nesting Analysis (crash fix priority #3)
The `src/ohai/` directory is a **self-contained nested project** (own package.json, node_modules, vite.config.mjs, full src/ui + src/engine, public, etc.).

Why it exists: Likely from Figma Make export + inner "OHAI" project extraction.

Problems it causes:
- Resolution conflicts (vites, modules, zod alias was symptom)
- Duplication of node_modules (root + inside ohai)
- Confusing import paths (shim does deep ../ohai/src/...)
- Dev server / HMR issues

**Current decision (minimal risk):** Left in place for now.
**Recommended future (flattening plan):**
1. Move contents of `src/ohai/src/*` to `src/*` (or keep under `src/ohai` but clean inner package).
2. Update shim to `import ... from './ohai/ui/App'`
3. Update all internal relative imports in the moved code (hundreds of changes - use codemod).
4. Remove or ignore the inner `src/ohai/{package.json,node_modules,vite.config,...}` (keep only source if needed).
5. Clean the zod alias (already done) and other hacks.

Do this only after stable build/dev. Use `npm run build` frequently as smoke test.

## Guardrail
Add this to .github/workflows or a pre-commit hook:
```bash
if git diff --name-only | grep -E '^(components/|engine/|registries/|src/imports/)'; then
  echo "ERROR: Modifying legacy trees is forbidden"
  exit 1
fi
```

## Guardrail Recommendation (before any deletion)
Add a lint / pre-commit / CI rule that fails or warns on modifications to:
- components/**
- engine/**
- registries/** (root-level)
- parsers/**
- resolvers/**
- selectors/** (root-level)
- schemas/** (root-level)

Example (simple Node check or eslint with overrides):
```js
// scripts/check-legacy.js
const legacyGlobs = ['components/**', 'engine/**', ...];
if (modifiedFiles match legacy && not in src/ohai) { process.exit(1); }
```
This prevents accidental revival of dead code by agents or contributors.

Generated: 2026-06-24 during immediate hardening sprint.
