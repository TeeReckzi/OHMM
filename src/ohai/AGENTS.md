# AGENTS.md — OHAI (Once Human Master Calculator)

## First-read commands

```bash
npm run typecheck       # Full-tree tsc (CommonJS)
npm run typecheck:ui    # UI-only tsc (ESNext/Bundler)
npm run test:all        # Full smoke test suite (sequential, no test framework)
npm run test:combat     # 15 combat sub-tests
npm run dev             # Vite dev server → http://localhost:5173
npm run setup:xdis      # Patch the Once Human magic into xdis (one-time, see Batch 1 ticket)
```

All scripts run via `tsx` (no compile step). Smoke tests manage their own pass/fail and exit non-zero on failure. No Jest/Vitest.

## MVP push work

The active MVP push is structured as 4 sequential batches documented in [`docs/agentic-tasks/`](./docs/agentic-tasks/README.md). Each ticket is a self-contained work order for one or more `.opencode` subagents. Strict order: **Batch 1 → Batch 2 → Batch 4 in parallel with Batch 3.**

| Batch | Ticket | Opencode command |
|-------|--------|-------------------|
| 1 — Honest MVP shell | [`docs/agentic-tasks/batch-1-mvp-shell.md`](./docs/agentic-tasks/batch-1-mvp-shell.md) | `/ohai-batch-1` |
| 2 — Resolve the 3 expected-FAILs + Phase 3 leaves | [`docs/agentic-tasks/batch-2-resolve-expected-fails.md`](./docs/agentic-tasks/batch-2-resolve-expected-fails.md) | `/ohai-batch-2` |
| 3 — Bindict V2+ ammunition pipeline | [`docs/agentic-tasks/batch-3-bindict-v2-pipeline.md`](./docs/agentic-tasks/batch-3-bindict-v2-pipeline.md) | `/ohai-batch-3` |
| 4 — Release packaging | [`docs/agentic-tasks/batch-4-release-packaging.md`](./docs/agentic-tasks/batch-4-release-packaging.md) | `/ohai-batch-4` |

Do not start Batch N+1 until Batch N's handoff is accepted.
Do not start work that is not in a ticket. The tickets are
the single source of truth.

## Data rules (evidence-first)

- **Source workbook**: `七日世界.xlsx` in `data/raw/` — immutable. Root-level copies are gitignored.
- **Module lifecycle**: `data/extracted/*.raw.json` → owner review → `data/verified/*.verified.json` (locked). Locked modules may be consumed but never modified.
- **Confidence levels**: `A_project_verified`, `B_owner_approved_names_pending_*`, `B_rules_registry_pending_formula_validation`, `B_pending_verification`, `B_pending_row_verification`. Never silently drop confidence metadata.
- **No invented data**: No fake ammo, keywords, elements, weapons, armor, mods, or placeholder mechanics in production code.
- **Source preservation**: Original Chinese values kept in `original` fields; never overwrite.
- **Candidate bindict research** stays under `data/research/` or `docs/research-notes/` — never promoted to production.

## Architecture

Three layers, no backend:
1. **Data pipeline** (`src/parsers/`) — offline extraction via `npm run extract:*`, never bundled
2. **Combat engine** (`src/engine/`) — pure TS, no React. Contains legacy path (`calculateExpectedDamage`) and official formula graph runtime (status: "partial-graph")
3. **UI layer** (`src/ui/`) — React 19 + Vite, entry at `src/ui/main.tsx`. State lives in `App.tsx`

Official formula terminal (recovered, HIGH confidence):
```
final_attack = max(base_attack * final_attack_additional_rate * final_attack_ignore_dam_rate * final_special_regulate_factor, 0)
```

Official formula status is "partial-graph" — legacy `calculateExpectedDamage` is the primary displayed value. Do not rewrite it unless explicitly required.

## Stat keys

42 canonical `StatKey` values defined in `src/schemas/buildGoalSchema.ts`. camelCase. Source data uses spaced English (e.g., "Crit DMG"). Legacy ambiguous keys (`weaponDMG`, `meleeDMG`, etc.) exist for backward compat — prefer disambiguated variants (`weaponDMGBonus`, `weaponDMGFlat`).

## Conventions

- **TypeScript only**: prefer pure functions. Comments only where genuinely helpful.
- **Zod validates** every module boundary — schemas in `src/schemas/`, extraction in `src/parsers/`.
- **OpenCode subagents**: implementer, test-writer, bindict-researcher, reviewer, docs (see `.opencode/agents/`)
- **Phase 3 focus**: implement missing formula leaves `species_dam_add_rate`, `human_dam_add_rate`, `debuff_type_dam_add_rate`
- **Locked modules (0–15)** may be consumed but never modified. Raw extracted data may be regenerated from source.
- **Project-facing output**: English only. Original CN/TW values preserved inside `original` fields.

## Known issues

- 3 expected FAIL cases in `test:combat:validation` (ebr-fire-ring, frost-vortex model conflict, power-surge model conflict) — must remain FAIL until resolved by in-game testing
- `test:registry:audit` and `test:staging:audit` are informational (exit 0), not part of `test:all`

## ⚠️ Active blocker: PvP anchor byte interpretation (Sprint 10, paused)

The byte pattern `0x66666666 / 0x33333333` in `formula_pvp_global_param_data.pyc`
(and 13+ other tables) has **two plausible interpretations**:

1. **u32 fixed-point** (current production): values = 0.4 / 0.2
2. **f64 LE 8-byte aligned** (alternative): values = 0.95 / 0.6 (in this file) or 0.35 / 0.6 (in `wild_abnormal_data.pyc`)

The f64 reading is consistent with 8-byte aligned game-data record structures.
The u32 reading spans the boundary between two adjacent f64 values, which is
unusual. Both readings give "neat" decimals, so neither is intrinsically
suspicious on that basis.

**Impact**: If the f64 interpretation is correct, `officialFormulaPvpGlobals.ts`
has wrong `pvp_star_modifier` (0.4) and `pvp_tier_modifier` (0.2) values, and
8+ sprints of cross-table analysis that used these as Rosetta Stone anchors
are unreliable. The 5 "high-quality" cross-anchor candidates from Sprint 10c
may have high false-positive rates.

**Status**: ⏸️ Paused. No Sprint 10 work committed. Production code unchanged.

**Resolution options** (cheapest first):
1. Re-verify `element_dam_rate_no.pyc` Const_* values under f64 alignment test
2. Re-run cross-anchor scan with f64 anchors (0.95, 0.6) and compare candidate sets
3. Wait for in-game validation

Do **not** wire any Sprint 10 candidate value to UI until this is resolved.
Do **not** re-run any prior sprint that depended on 0.4/0.2 anchors.

See `docs/sprints/sprint-10-cross-anchor-and-foundation-review.md` and the
critical-ambiguity section at the bottom of `docs/research-notes/v2-cross-anchor-scan.md`.

## Git rules

Commit only when asked. Inspect `status`, `diff`, recent `log` first. No force-push.
