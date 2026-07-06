# OHMM — Once Human Meta Metrics

A client-side combat calculator, build optimizer, and theorycrafting assistant for [Once Human](https://www.oncehuman.game/) (NetEase Games). Runs entirely in the browser — zero backend, zero telemetry, zero network requests.

## What It Does

- Select weapons, armor, mods, calibrations, cradle perks, food/drink buffs, deviations, and ammo
- Calculate expected damage per shot, DPS, TTK, and status effect contributions using reverse-engineered game formulas
- Compare builds under PvE and PvP combat assumptions
- Save, load, rename, and manage multiple named builds (localStorage)
- Track data confidence levels so users know which numbers are verified vs estimated

## Quick Start

```bash
npm install
npm run build     # verify production build succeeds
npm run dev       # Vite dev server → http://localhost:5173
```

### Core Engine (src/ohai/)

```bash
cd src/ohai
npm install
npm run setup:xdis      # one-time: patch Once Human magic 3496 into xdis
npm run typecheck       # full-tree tsc
npm run typecheck:ui    # UI-layer tsc
npm run test:all        # full smoke test suite
```

## Architecture

```
UI (React 18 + Tailwind + shadcn/ui + MUI)
    ↓
Bridge Layer (src/lib/ohmm/)
    convertLoadout → formulaBridge → CalculationInput
    ↓
Core Engine (src/ohai/src/engine/) — pure TypeScript, no React
    officialFormula* → CombatOutput
    ↓
Registries (src/ohai/src/ui/registries/)
    weapons, armor, mods, food, deviations, cradle, ammo, PvE targets
    ↓
Data Pipeline (src/ohai/data/)
    raw/ → extracted/ → verified/ (locked modules M0–M16)
```

### Key Layers

| Layer | Location | Role |
|-------|----------|------|
| UI Shell | `src/app/` | React components, layout, modals, selectors |
| Bridge | `src/lib/ohmm/` | Converts UI state → engine input |
| Engine | `src/ohai/src/engine/` | Pure formula computation (no DOM/React) |
| Resolvers | `src/ohai/src/resolvers/` | Modifier aggregation across loadout |
| Registries | `src/ohai/src/ui/registries/` | Item data with confidence metadata |
| Persistence | `src/app/` | localStorage save/load (schema v1) |

## Project Status

### Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Full Audit / Baseline Assessment | ✅ Complete |
| 1 | Planning / Roadmap / Backlog | ✅ Complete |
| 2 | Stabilization / Dead Code Reduction | ✅ Complete |
| 3 | Architecture Extraction / UI Decomposition | ✅ Complete |
| 3.5 | Pre-Phase-4 Cleanups | ✅ Complete |
| 4A | Build Persistence (save/load/restore) | ✅ Complete |
| 4B | Theorycrafting UX / Decision-Support Layer | ✅ Complete |
| 4C | Neural Build Graph v2 (3D Interactive Analysis) | ✅ Complete |

### Current Phase

**Phase 4D — Share / Import / Export** (in progress)

Goal: URL sharing, JSON import/export, and build optimization tools.

### Future Phases

| Phase | Description |
|-------|-------------|
| 4E | Build Quality / Recommendations (upgrade suggestions, warnings) |
| 5 | Progressive Disclosure / Selector UX / Workflow Polish |
| 6 | Data Quality / Provenance / Confidence UI |
| 7 | Responsive / Accessibility |
| 8 | Advanced Saved Builds / Library |
| 9 | Advanced Simulation / Encounter Modeling |
| 10 | Polish / Public Launch |

## Data Confidence Model

Every registry entry carries a confidence label:

| Label | Meaning |
|-------|---------|
| `project_verified` | Recovery-locked, confirmed against game data |
| `observed` | Recovered from verified reference material |
| `estimated` | Project best-fit, pending in-game confirmation |
| `placeholder` | Synthetic/quarantined, flagged in UI |

The calculator surfaces these labels so users always know the trustworthiness of displayed numbers.

## Module System

Modules M0–M16 are **locked** (immutable verified data). Modules M17–M20 are **functional** (smoke-tested engine layers):

- **M0–M16**: Source registry, weapons, armor, mods, food, deviations, sets, scorer, combat metadata
- **M17**: Combat Formula Application Layer
- **M18**: Formula Validation Harness
- **M19**: Real Combat Data Ingestion (OCR/Observation Pipeline)
- **M20**: Modifier Source Aggregation & Build Calculator

## Tech Stack

### Root Project (UI)
- React 18, TypeScript, Vite 6
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- shadcn/ui + MUI 7
- Recharts, React Router 7, react-dnd, Framer Motion
- Zod 4, react-hook-form, Sonner

### Core Engine (src/ohai/)
- React 19, TypeScript, Vite 8
- Zod 3 (aliased separately)
- tsx for scripts and smoke tests
- ExcelJS for workbook parsing
- Python for offline data extraction (NPK/bindict)

## Testing

All tests are custom smoke tests using `tsx` — no Jest/Vitest. Tests exit non-zero on failure.

```bash
# From src/ohai/
npm run test:all           # full suite (30+ sub-tests)
npm run test:combat        # combat formula tests
npm run test:scorer        # gear scorer
npm run test:registry:validation    # registry data validation
npm run test:build:persistence      # saved build tests
npm run test:pvp:mitigation         # PvP mitigation model
```

## Companion Apps

| App | Location | Purpose |
|-----|----------|---------|
| Overwolf Bridge | `apps/overwolf-bridge/` | In-game overlay for screenshot capture |
| Vision Service | `apps/vision-service/` | Node.js OCR server (port 8080) |

## Development Commands

```bash
# Root project
npm run dev              # Vite dev server
npm run build            # production build

# Core engine (src/ohai/)
npm run typecheck        # full tsc (CommonJS)
npm run typecheck:ui     # UI-only tsc (ESNext/Bundler)
npm run test:all         # all smoke tests

# Data extraction (src/ohai/)
npm run extract:weapons
npm run extract:armor
npm run extract:mod-core
npm run extract:mod-suffixes
npm run extract:armor-sets
npm run extract:food-buffs
npm run extract:deviations
```

## Privacy

OHMM runs entirely client-side. No `fetch`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon` calls originate from application code. No data leaves your machine.

## Documentation

- `docs/architecture_flow.dot` — system architecture (Graphviz)
- `docs/NORMALIZATION_LAYER.md` — data normalization design
- `docs/NPK_RUNTIME_NOTES.md` — binary data extraction notes
- `LEGACY_TREES.md` — historical cleanup record
- `guidelines/Guidelines.md` — AI development guidelines

## License

All rights reserved. This project uses terminology and data from Once Human (© NetEase Games). No official affiliation or endorsement.
