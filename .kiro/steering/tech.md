# Tech Stack & Build System

## Languages

- TypeScript (primary — all application code)
- Python (offline data extraction scripts only — NPK decryption, bindict parsing)

## Root Project (UI wrapper)

- **React 18** + TypeScript
- **Vite 6** (bundler/dev server)
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (no postcss-tailwind needed)
- **shadcn/ui** component library (Radix UI primitives + class-variance-authority + tailwind-merge)
- **MUI 7** (Material UI — used alongside shadcn)
- **Recharts** for charts/visualization
- **React Router 7** for routing
- **react-dnd** for drag-and-drop
- **Framer Motion** ("motion" package) for animations
- **Zod 4** for validation
- **Sonner** for toast notifications
- **react-hook-form** for form handling
- **Lucide React** for icons

## Core Engine Subproject (src/ohai/)

- **React 19** + TypeScript (separate package.json)
- **Vite 8**
- **Zod 3** (different version — aliased in vite.config.ts)
- **tsx** for running scripts and tests
- **ExcelJS** for workbook parsing
- No test framework — custom smoke tests that self-manage pass/fail

## Companion Apps

- **Overwolf Bridge** (`apps/overwolf-bridge/`): native overlay for in-game screenshot capture
- **Vision Service** (`apps/vision-service/`): Node.js HTTP server (port 8080) for OCR processing

## Common Commands

### Development
```bash
npm run dev          # Vite dev server (root project) — http://localhost:5173
```

### Build
```bash
npm run build        # Production build (root project)
```

### Type Checking
```bash
# In src/ohai/:
npm run typecheck       # Full-tree tsc (CommonJS)
npm run typecheck:ui    # UI-only tsc (ESNext/Bundler)
```

### Testing (all in src/ohai/)
```bash
npm run test:all        # Full smoke test suite (sequential)
npm run test:combat     # 15 combat sub-tests
npm run test:scorer     # Gear scorer tests
npm run test:registry:validation   # Registry validation
npm run test:staging:validation    # Staging pipeline validation
npm run test:formula:bridge        # Formula bridge tests
npm run test:pvp:mitigation        # PvP mitigation tests
```

### Data Extraction (in src/ohai/)
```bash
npm run extract:weapons
npm run extract:armor
npm run extract:mod-core
npm run extract:mod-suffixes
npm run extract:armor-sets
npm run extract:food-buffs
npm run extract:deviations
```

### One-time Setup (in src/ohai/)
```bash
npm run setup:xdis   # Patch Once Human magic 3496 into xdis
```

## Important Notes

- No ESLint or linting configured in either project
- Smoke tests use `tsx` directly — no Jest/Vitest
- Tests exit non-zero on failure (no test framework assertions)
- Dual React versions (18 root / 19 ohai) coexist via vite aliases
- Dual Zod versions (v4 root / v3 ohai) coexist via vite aliases
- PostCSS config is intentionally empty (Tailwind v4 handles everything via vite plugin)
