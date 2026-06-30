# OHMM Validation Boundary

**Created**: 2026-06-30 (Phase 3.0)
**Last Updated**: 2026-06-30

This document defines the validation boundary between browser UI code and Node.js scripts within the `src/ohai/` subproject.

---

## Problem Statement

The `src/ohai/` subproject contains both:
1. **Browser UI code** — React components, registries, formula engine, resolvers
2. **Node.js CLI scripts** — data parsers, workbook processors, terminology generators

The original `tsconfig.ui.json` included all of `src/utils/**/*.ts` which mixed both worlds, causing `typecheck:ui` to fail with ~68 errors.

---

## Solution: Explicit Include Boundaries

`tsconfig.ui.json` now uses an **explicit include list** for utils that are actually imported by browser code:

```json
{
  "include": [
    "src/ui/**/*.ts",
    "src/ui/**/*.tsx",
    "src/utils/statKeyMapper.ts",
    "src/utils/parseAttachmentEffect.ts", 
    "src/utils/verifiedModifierLoader.ts",
    "src/utils/externalResearch/**/*.ts",
    "src/utils/scorer/normalizer.ts",
    "src/utils/scorer/scenarioProfiles.ts",
    "src/utils/scorer/scoringWeights.ts",
    "src/utils/scorer/types.ts"
  ],
  "exclude": [
    "src/ui/**/*SmokeTest*",
    "src/ui/**/*smokeTest*"
  ]
}
```

### Node-Only Files (excluded from UI typecheck)

These files use Node.js APIs (`fs`, `path`, `crypto`, `process`, `require`, `module`, `__dirname`):

| File | Node APIs Used |
|------|----------------|
| `utils/buildGoalProfiles.ts` | fs, path, __dirname, require, module, process |
| `utils/modTerminology.ts` | node:fs, node:path, __dirname, require, module, process |
| `utils/englishNameMapper.ts` | node:fs, node:path, __dirname |
| `utils/workbook.ts` | node:fs, node:path, exceljs |
| `utils/normalizeArmor.ts` | node:crypto |
| `utils/normalizeModCoreEffect.ts` | node:crypto |
| `utils/normalizeModSuffixEffect.ts` | node:crypto |
| `utils/normalizeWeapon.ts` | node:crypto |
| `utils/translationOverlay.ts` | node:fs, node:path |

These are properly typechecked by `npm run typecheck` (which uses `tsconfig.json` with `module: "CommonJS"` and full Node type access).

---

## Validation Commands

### Browser UI Typecheck
```bash
cd src/ohai && npm run typecheck:ui
# Checks: UI components, registries, formulas, browser-safe utils
# Resolves: ESNext modules, Bundler resolution
# Should: PASS with 0 errors
```

### Node Engine + Script Typecheck
```bash
cd src/ohai && npm run typecheck
# Checks: Everything under src/ (Node + Browser)
# Resolves: CommonJS, Node resolution
# Should: PASS (deprecation warning about moduleResolution=node10 is expected)
```

### Full Test Suite
```bash
cd src/ohai && npm run test:all
# Runs all smoke tests
# Known issue: test:staging:validation fails (staging/ directory removed)
# All other tests should PASS
```

---

## Known Pre-Existing Issues (Not addressed in Phase 3.0)

| Issue | Files | Root Cause | Status |
|-------|-------|------------|--------|
| `test:staging:validation` script references non-existent file | `package.json` | Staging directory was cleaned up but script not removed | Document only — no behavioral impact |
| `moduleResolution=node10` deprecation | `tsconfig.json` | TypeScript 7.0 deprecation warning | Harmless — will need update eventually |

---

## Rules for Adding New Utility Files

1. If the file uses Node.js APIs (fs, path, crypto, process, etc.) → do NOT add to `tsconfig.ui.json` include
2. If the file is browser-safe and imported by `src/ui/` → add to the explicit include list
3. If uncertain → leave it out of `tsconfig.ui.json` (the main `typecheck` covers it)

---

*Validation Boundary — OHMM Engineering Council*
