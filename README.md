
  # OHMM (Once Human Master Math / Build Planner)

  **Important:** This project was cleaned up as part of crash + architecture hardening (see LEGACY_TREES.md and docs/). Original Figma: https://www.figma.com/design/Qjk2QLvJuMYSAFoWtf6mvw/OHCombatHaptics--Copy-.

  ## Quick Start & Crash Fixes

  ```bash
npm install
npm run build   # smoke test (recommended before dev)
npm run dev
```

  ## Recent Crash Fixes (Priority Order)
1. **Zod alias removed** from vite.config.ts (was forcing old v3 from inside src/ohai/node_modules while root declares and installs v4.4.3). Primary suspect for dev/runtime crashes.
2. **Legacy root copies + src/imports/ deleted** (components/, engine/, registries/, etc.). See LEGACY_TREES.md.
3. **src/ohai nesting analyzed** (left in place for now - see LEGACY_TREES.md for flattening plan).
4. **manualChunks added** to split the giant bundle (react, recharts, ohai-core, vendor).
5. Confirmed `npm run build` succeeds as smoke test.

## Architecture
See:
- `docs/architecture_flow.dot` (Graphviz)
- `LEGACY_TREES.md`
- `docs/NORMALIZATION_LAYER.md`

Active source of truth: `src/ohai/src/`

Thin shim: `src/app/App.tsx`

## Notes
- Large `ohai-core` chunk remains (most game logic lives under src/ohai/src/).
- Many Figma Make artifacts remain in the tree (titles, etc.).
- Run `npm run build` before `npm run dev` after changes.
  