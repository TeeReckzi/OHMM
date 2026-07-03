# Project Structure

## High-Level Layout

```
OHMM/
├── src/                          # All application source code
│   ├── main.tsx                  # React entry point
│   ├── app/                      # Root UI layer (Figma-derived wrapper)
│   │   ├── App.tsx               # Primary frontend (~3,100 lines — tech debt)
│   │   ├── types.ts
│   │   └── components/
│   │       ├── ui/               # shadcn/ui component library (Radix + CVA)
│   │       ├── figma/            # Image/asset handling
│   │       └── selectors/        # Armor/Mod/Weapon selector modals
│   ├── lib/ohmm/                 # Bridge: UI ↔ Engine
│   │   ├── convertLoadout.ts     # UI loadout → BuildSelection mapper
│   │   ├── formulaBridge.ts      # BuildSelection → CalculationInput
│   │   └── formulas/             # Formula helpers
│   ├── styles/                   # CSS architecture
│   │   ├── tailwind.css          # Tailwind entry
│   │   ├── theme.css             # Design tokens
│   │   ├── globals.css           # Global styles
│   │   └── ohmm-design/         # Game-specific design tokens
│   └── ohai/                     # Core engine subproject (own package.json)
│       ├── src/
│       │   ├── engine/           # Combat formulas, damage calculations
│       │   ├── resolvers/        # Modifier aggregation across loadout
│       │   ├── schemas/          # Zod schemas (42 canonical StatKeys)
│       │   ├── parsers/          # Data extraction from workbooks
│       │   ├── ui/               # Inner React app + registries
│       │   │   └── registries/   # Item data: weapons, armor, mods, ammo, etc.
│       │   │       └── staging/  # Pipeline for importing/validating new data
│       │   └── utils/            # Scorers, normalizers, helpers
│       ├── data/
│       │   ├── raw/              # Immutable source files (workbooks)
│       │   ├── extracted/        # Raw extracted JSON (regenerable)
│       │   └── verified/         # Locked verified snapshots (DO NOT modify)
│       ├── scripts/              # Audit, validation, Python extraction tools
│       └── docs/                 # Formula recovery, research notes, sprints
├── apps/
│   ├── overwolf-bridge/          # Overwolf overlay for screenshot capture
│   └── vision-service/           # Node.js OCR processing server
├── docs/                         # Architecture, normalization docs
├── migrations/                   # SQL schema migrations
├── public/assets/                # Static game icons, logos
├── guidelines/                   # AI guidelines
└── index.html                    # Vite entry HTML
```

## Data Flow Architecture

```
UI State (BuildSelection)
    ↓
Normalization Layer (sanitize, validate, canonical IDs)
    ↓
CalculationInput (modifierSources, effects, uptime, assumptions)
    ↓
Engine (formulaApplicator, officialFormula*)
    ↓
CombatOutput (damage, survivability, pvp)
    ↓
Presentation (charts, metrics panels)
```

## Key Architectural Rules

- **Normalization is mandatory**: no direct UI State → Engine path. All data passes through sanitize/normalize checkpoints before calculation.
- **Locked modules are immutable**: data in `data/verified/` (modules M0–M15) must never be modified without explicit approval.
- **Evidence-first data**: no invented/placeholder data in production code. Every registry entry carries confidence metadata.
- **Engine is pure TS**: `src/ohai/src/engine/` has no React dependencies — pure calculation functions only.
- **Registries are the source of truth**: all item data lives in `src/ohai/src/ui/registries/` with a staging pipeline for new imports.

## Known Structural Debt

- `src/app/App.tsx` is a 3,100-line monolith (extraction planned as Phase 2)
- Dual React versions (18 root / 19 ohai) require vite alias hacks
- Legacy duplicate code exists at root level (unused but present)
- No `src/assets` directory (figma resolver may reference missing paths)
