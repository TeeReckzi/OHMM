# Once Human Master Calculator

## What this is

A data-driven combat calculator and build optimizer for the game Once Human. All computation runs client-side in the browser — no backend, no telemetry, no online requirement. Build, mod, weapon, armor, food, deviation, and Cradle data are sourced from locked project registries, with full source preservation and confidence metadata on every entry.

## Install + run

```bash
npm install
npm run setup:xdis   # one-time: patch Once Human magic 3496 into xdis.magics
npm run dev          # start Vite dev server at http://localhost:5173
```

## What works today

Modules M0–M15 are **Locked** and consumed by the build pipeline. Modules M17–M20 are **Functional / Smoke-tested**:

- **M0** Source Registry — Locked.
- **M1** Weapons Import — Locked.
- **M2** Armor + Key Gear Import — Locked.
- **M3** Mod System Registry — Locked (policy-only).
- **M4** Mod Core Effects Import — Locked.
- **M5** Mod Suffix Effects Import — Locked.
- **M7–M12** External References, Food, Deviations, Ingredients, Star Tier, Fur Materials — Locked.
- **M13** Gear Scorer System — Locked.
- **M14** Build Goal Profiles — Locked.
- **M15** Combat Metadata Registry — Locked.
- **M16** Gear Mechanic Overrides — Locked.
- **M17** Combat Formula Application Layer — Functional / Smoke-tested. **Damage / Shot is formula-backed.**
- **M18** Formula Validation Harness — Functional / Smoke-tested.
- **M19** Real Combat Data Ingestion (OCR/Observation Pipeline) — Functional / Smoke-tested.
- **M20** Modifier Source Aggregation & Build Calculator — Functional / Smoke-tested.
- Build persistence, share, import/export via the **Saved Builds** drawer.
- Per-item registries: weapon, armor, key gear, mod, food buff, deviation, cradle, ammo, PvE target.

## What does not work yet

- **PvP TTK Window** in the projection panel is blocked. The mitigation engine is not yet wired. Tracked by `docs/agentic-tasks/batch-2-resolve-expected-fails.md`.
- **Encounter Lab** shows "Enemy profile data pending". Deviation skill ranges and ammo V2+ data are not yet decoded. Tracked by `docs/agentic-tasks/batch-3-bindict-v2-pipeline.md`.
- **3 documented expected-FAILs** remain in `test:combat:validation`: `ebr-fire-ring`, `frost-vortex` model conflict, `power-surge` model conflict. They are model-selection questions, not code bugs. Tracked by `docs/agentic-tasks/batch-2-resolve-expected-fails.md`.
- **Asset pipeline is partial.** Static image/icon assets are sparse; numerical data is complete. See `docs/project-map.md` for what is and isn't in-repo.
- **Sample build files** in `data/sample-builds/` are forward-looking one-pagers; the in-app build-loader UI ships in Batch 4 (`docs/agentic-tasks/batch-4-release-packaging.md`).

## Data confidence model

Every entry in the project registries carries a confidence label. The calculator UI surfaces that label on each item card so the user can tell at a glance whether a number is **verified** (recovery-locked), **observed** (recovered from a verified reference), **estimated** (project-best-fit, pending in-game confirmation), or **placeholder** (synthetic, quarantined). The full internal taxonomy (e.g., `experimental`) and downgrade rules are documented in `AGENTS.md`; the calculator never silently drops a confidence flag.

## Test commands

```bash
npm run typecheck       # Full-tree tsc (CommonJS)
npm run typecheck:ui    # UI-only tsc (ESNext/Bundler)
npm run test:all        # Full smoke test suite (sequential, no test framework)
npm run setup:xdis      # Idempotent patch of Once Human magic 3496 into xdis.magics
```

`npm run test:combat` runs the 15 combat sub-tests. `npm run test:all` includes the 3 documented expected-FAILs in `test:combat:validation`; this is the intended current state, see `AGENTS.md` Known issues.

## Project docs map

- `docs/project-map.md` — repo layout, module ownership, and the asset pipeline partial status.
- `docs/roadmap.md` — the 4-batch MVP push plan (Honest Shell → Resolve expected-FAILs → Bindict V2+ → Release packaging) and broader project context.
- `docs/BINDICT_ARCHITECTURE_DISCOVERY.md` — the strategy for decoding Once Human `.pyc` `client_data` files via the 3496 magic patch.
- `docs/agentic-tasks/` — the scoped, single-source-of-truth work tickets for each batch. Each ticket lists its subagent owners, evidence to read first, and pass criteria.

## License / contribution

There is **no LICENSE file** in this repository. See the "License" notice at the end of this file for the copyright / trademark statement.

---

## Project Status

This project uses a **module-locked data pipeline** with strict source preservation, English normalization, and controlled terminology.

Current phase: **Combat formula application, validation engine, and build calculator layer** (Modules 0–15 locked, Modules 16–20 in various stages).

## Locked Modules

| Module | Description | Status |
|---|---|---|
| M0 | Source Registry | Locked |
| M1 | Weapons Import | Locked |
| M2 | Armor + Key Gear Import | Locked |
| M3 | Mod System Registry | Locked (policy-only) |
| M4 | Mod Core Effects Import | Locked |
| M5 | Mod Suffix Effects Import | Locked |
| M6 | Armor Sets (套裝) | Extracted / Pending verification |
| M7–M12 | External References, Food, Deviations, Ingredients, Star Tier, Fur Materials | Extracted / Locked |
| M13 | Gear Scorer System | Locked |
| M14 | Build Goal Profiles | Locked |
| M15 | Combat Metadata Registry | Locked |
| M16 | Gear Mechanic Overrides | Locked |
| M17 | Combat Formula Application Layer | Functional / Smoke-tested |
| M18 | Formula Validation Harness | Functional / Smoke-tested |
| M19 | Real Combat Data Ingestion (OCR/Observation Pipeline) | Functional / Smoke-tested |
| M20 | Modifier Source Aggregation & Build Calculator | Functional / Smoke-tested |

## Architecture Overview

```
Raw Data (workbooks/OCR) → Extractors → Verified Snapshots
                                            ↓
                                    Scorer System (M13)
                                            ↓
                              Build Goal Profiles (M14)
                                            ↓
                              Combat Metadata Registry (M15)
                              Gear Mechanic Overrides (M16)
                                            ↓
                              Combat Formula Application (M17)
                              Formula Validation Harness (M18)
                                            ↓
                        Observation Ingestion Pipeline (M19)
                        OCR Parsing → Normalization → Dedupe
                                            ↓
                        Modifier Aggregation (M20)
                        Build Calculator Layer (planned)
```

## Current Data Policy

- **Source workbook**: `七日世界.xlsx` (CN/TW community sheet) — immutable source of truth.
- **Language**: All project-facing output is English. Original Chinese/TW source values are preserved separately inside `original` fields.
- **Module lock rule**: Verified data in `data/verified/` may not be modified without explicit approval. Raw extracted data in `data/extracted/` may be regenerated from source.
- **Mod system**: All current data uses `current_post_overhaul` system version. Legacy sheets are excluded.

## Translation / Terminology Caveat

- **Terminology is project-verified, not official localization evidence.**
- English labels were determined through combination of:
  - Locked terminology registry (`data/verified/mod-terminology-registry.verified.json`)
  - Project-owner gameplay knowledge
  - Translation dictionary
  - External reference cross-checks
- Do not claim all English labels are official game localization unless confirmed by official sources.
- Original Chinese/TW source values are preserved separately from normalized English values.

## Combat Formula System

### Damage Model

The combat formula engine supports multiple damage families:

| Family | Base | Mechanics |
|---|---|---|
| `status_tick_damage` | Psi Intensity × Base Factor | Power Surge, Frost Vortex, Unstable Bomber |
| `burn_stack_dot` | Weapon DMG × 0.04 × Stacks | Burn (stack/frequency-aware DoT) |
| `charged_status_damage` | Psi Intensity × Base Factor | Charged hybrid status weapons |
| `physical_weapon_damage` | Weapon DMG × (1 + Attack%) | Direct weapon hits |
| `deviation_skill_damage` | Psi Intensity × Deviation Base Factor | Deviation skills |

### Burn (Stack-Driven DoT)

- Stacks up to 5 by default
- Each stack contributes 4% of weapon damage per tick
- Per-tick = (weaponDMG × 0.04 + flatBurnBonus) × stacks × modifiers
- Tick interval: 0.5s base, modified by BBQ Gloves (up to +100% frequency)
- DPS = per-tick damage × ticks per second
- Burn Resistance debuff reduces effectiveness by 15% per level
- DoT resistance reduces each tick

## Development Commands

```bash
# Extract modules
npm run extract:weapons
npm run extract:armor
npm run extract:mod-core
npm run extract:mod-suffixes
npm run extract:armor-sets
npm run extract:external-references

# Generate terminology registry
npm run generate:terminology

# Test combat systems
npm run test:combat:metadata
npm run test:combat:formula
npm run test:combat:validation
npm run test:combat:observation
npm run test:combat:modifier

# Test scorer
npm run test:scorer

# Run all smoke tests
npm run test:all

# Verify
npm audit
npx tsc --noEmit
```

## Repository Structure

```
data/
  raw/               # Immutable source files (workbooks, overlays, external references)
  extracted/         # Raw extracted JSON output (not yet locked)
  verified/          # Locked verified snapshots
  audit/             # QA reports and review artifacts
docs/                # Module plans, QA docs, lock summaries, candidate reviews
src/
  parsers/           # Extraction scripts
  schemas/           # Zod validation schemas
  utils/
    scorers/         # Gear scorer system (M13)
    combat/          # Combat metadata, formulas, validation, observation, modifiers
    ...              # Normalizers, terminology, dictionary, workbook helpers
```

## Privacy

OHAI runs entirely client-side. Zero network requests originate from `src/` — no `fetch`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon`. The app does not collect, store, or transmit any user data. All computation happens in your browser; no data leaves your machine.

## License

All rights reserved. This project uses terminology and data from Once Human (© NetEase Games). No official affiliation or endorsement.
