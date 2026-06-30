# Plan: Preview OHAI App in Figma Make Canvas

## Context
The OHAI app lives at `/workspaces/default/ohai2/` with its own Vite config. The Figma Make preview renders whatever `src/app/App.tsx` exports. Currently App.tsx is an empty shell. The goal is to make the Figma Make canvas show the live OHAI app without running a second dev server or port-conflicting with Figma Make's own Vite instance.

## Approach
Import the OHAI `App` component and its styles directly into the Figma Make `src/app/App.tsx`. Vite resolves imports by following the actual file system, so it can reach `/workspaces/default/ohai2/src/ui/` from outside the Figma Make `src/` directory. No second server, no iframe, no copy-paste.

**Why this works:**
- OHAI UI dependencies at runtime are only `react`, `react-dom`, `lucide-react`, and `zod` — all present in the Figma Make `node_modules`
- OHAI's `"type": "commonjs"` in package.json does not affect Vite's bundler (Vite operates at the ESM level)
- All OHAI relative imports (`./registries/`, `../../data/verified/*.json`, etc.) resolve correctly from their source file locations on disk

---

## Files to Change

### 1. `/workspaces/default/code/vite.config.ts`
Add a resolve alias so imports from `@ohai` map to the OHAI source root, and ensure Vite will process TypeScript files from outside `code/src/`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ohai': path.resolve(__dirname, '../ohai2/src'),
    },
  },
  server: {
    fs: {
      // Allow serving files from the ohai2 sibling directory
      allow: ['..'],
    },
  },
});
```

### 2. `/workspaces/default/code/src/app/App.tsx`
Replace the empty shell with a direct render of the OHAI app:

```tsx
import '../../ohai2/src/ui/theme/ohaiTheme.css';
import '../../ohai2/src/ui/styles.css';
import { App as OHAIApp } from '../../ohai2/src/ui/App';

export default function App() {
  return <OHAIApp />;
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| CSS class conflicts between OHAI's `styles.css` and Figma Make's Tailwind | OHAI's CSS uses highly specific BEM-style class names (`ohmm-*`, `forge-zone`, etc.) — unlikely to collide |
| Vite `fs.allow` needed to serve files outside `code/` | Already handled in the config above |
| `exceljs` imported by OHAI parsers (not UI) | Parser files are only imported by Node scripts, never by the React component tree — no browser bundle impact |
| OHAI exports `App` as a named export, not default | Confirmed — `export { App }` at line 1426. Import as named and re-export as default |

---

## Verification
After implementation, the Figma Make canvas should render the full OHAI Build Forge UI. Confirm:
- Sidebar navigation (Build Forge / Encounter Lab / Simulator) renders
- Weapon selector opens
- PvP/PvE mode toggle works
- No console errors about missing modules
