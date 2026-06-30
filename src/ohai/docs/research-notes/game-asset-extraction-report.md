# Game Asset Extraction Report — Phase 1

**Generated:** 2026-06-06
**Agent:** ohai-asset-extractor (Phase 1 — manifest-only inventory)
**Scope:** No binaries copied. No `public/assets/` or `src/ui/assets/` writes. Outputs are JSON/Markdown only.

---

## Executive Summary

Two production-quality decoded asset catalogs exist in this repo:

1. **`data/research/bindict_v2_inventory.json`** — 429 client_data tables, 87 of which have asset-bearing string pools (icon/texture/sprite/path tokens).
2. **`data/research/bindict_extracted/*.const_2.raw`** — 33,556 raw constant-pool dumps from every client_data `.pyc`.

Combined, they expose **2,070 path-like asset strings** (`.png`/`.tga`/`.webp`/`.uasset`) sampled from 87 tables. These are *in-game NPK asset bundle paths*, not URLs. They cannot be served to a browser without NPK extraction tooling — but they ARE perfect inputs for a Tier-2 category-icon fallback system.

The hand-coded `catalog.ts` weapon/food icons (5 total) plus 97 attachment iconUrls in `attachments.generated.ts` remain the only browser-loadable real icons in the project today.

---

## Key Asset-Bearing Tables Found (top 15 by path count)

From `data/research/assets/game-asset-inventory.json`:

| Table | Size | Asset Strings | Sample |
|---|---|---|---|
| `img_common_config_data` | 58 KB | 1505 | weapon-type icons, stat icons, HUD chrome — **the primary item-type icon catalog** |
| `book_collect_model_data` | 94 KB | 1218 | boss/monster portraits (`boss_icon_*.png`) |
| `text_static_config_data` | 648 KB | 7262 | UI prefab paths (`.uiprefab@label_*`) |
| `big_world_collectable_notes_data` | 543 KB | 3298 | collectable notes + map images |
| `attack_btn_icon_data` | 1.8 KB | 33 | HUD weapon action buttons (`icon_memory_<weapon>_right.png`) |
| `item_model_info_data` | 18.7 KB | 38 | model sprite refs (cosmetics, stickers) |
| `gun_setting_data` | 31 KB | 833 | gun settings + UI tab icons |
| `accessories_unlock_tab_data` | 632 B | 11 | inventory tab icons (ammo, source, weapon) |
| `big_map_item_data` | 15 KB | 294 | map marker icons |
| `cradle_override_style_data` | 302 B | 4 | cradle override style icons |
| `deviation_preference_config_data_info` | 972 B | 8 | deviation element type icons (light/music/plants) |
| `equip_craft_tab_data` | 760 B | 13 | craft category tab icons |
| `new_mod_state_rarity_background_data` | (small) | — | mod rarity frame backgrounds |
| `goods_tag_data` | 2 KB | 13 | item tag icons (treasure red bg, etc.) |
| `ui_icon_template_data` | — | — | UI button template states (nml/hov/sel/dis) |

The single most valuable file for Phase 2 is **`img_common_config_data`** — its decoded string pool contains weapon-type-class icons (`icon_gun_shotgun_*.png`, `icon_gun_sniperawp_*.png`, `icon_gun_rifle_*.png`, etc.), HUD stat icons, and rarity backgrounds. This alone enables a meaningful Tier-2 category-icon fallback for every weapon and most armor pieces without any per-item mapping.

---

## Item-to-Asset Candidate Coverage

From `data/research/assets/item-asset-candidates.json` (name-token inferred candidates):

| Category | Registry Count | With Candidates | Coverage % | Notes |
|---|---:|---:|---:|---|
| Weapons | 79 | 61 | **77%** | Strong — matches resolve to weapon-type icons (Shotgun→`icon_gun_shotgun_*`, Sniper→`icon_gun_sniperawp_*`). These are Tier-2 category icons, NOT per-weapon. |
| Armor | 148 | 97 | **66%** | Slot-token matches (`gloves`, `helmet`, etc.). Tier-2 quality. |
| Mod Cores | 99 | 47 | 48% | Token matches on element/effect names. Noisy. |
| Food/Drinks | 84 | 32 | 38% | Most CN food names don't share tokens with internal IDs. |
| Deviations | 72 | 19 | 26% | Mostly CN-named; matches limited to type-tokens. |
| Mod Suffixes | 128 | 0 | 0% | Suffix names too generic to token-match. |

**Important:** `confidence: inferred_by_name` only. ZERO `direct_mapping` candidates produced this round — those require per-row record decode (not present yet). Every candidate is a token substring match; manual review required before wiring.

Example resolved weapon → candidate path:
- `weapon_ddccf568` (AA12-焚滅之引 / Shotgun) → `icon_gun_shotgun_sel.png` (from `img_common_config_data`)
- `weapon_4044addb` (AKM-怒火攻心 / Rifle) → `icon_mrwish_cbt2_select_rifle.png` (from `img_common_config_data`)
- `weapon_c18ae35f` (M82A1-灰燼 / Sniper Rifle) → `icon_gun_sniperawp_sel.png` (from `img_common_config_data`)

These are category icons, not item portraits. They look correct for Tier 2 fallback.

---

## Biggest Gaps

1. **Mod suffixes — 0% candidate coverage.** Suffix names ("of the Hunter", "of Precision", etc.) have no shared tokens with internal asset IDs. Phase 2 must either (a) crawl oncehumandb.com for mod suffix icons or (b) accept rarity-frame Tier 2 fallback (the new_mod_state_rarity_background_data table provides those).
2. **Deviations — 26%.** CN-named, no internal-ID bridge. oncehumandb.com scrape is the realistic path.
3. **No `direct_mapping` candidates.** Every match is name-inferred. Direct itemId → icon binding requires bindict v2 record decode of `item_model_info_data`, `book_collect_model_data`, `big_world_collectable_notes_data`, and `img_common_config_data`. These tables are flagged "decoded" in the inventory but only their string pool is currently exposed, not the per-row field bindings.
4. **No bridge from OHAI registry IDs to game `item_no` IDs.** OHAI uses community-sheet CN names (e.g. `weapon_ddccf568` ← "AA12-焚滅之引"); the game uses 8-digit numeric item_no. Until a bridge table exists, even fully decoded game tables can't auto-wire to our registries.

---

## Estimated Binary Footprint (If Phase 3 Promotes Subset)

Assuming Phase 3 promotes only Tier-2 category icons + a small set of confirmed per-item icons via external CDN download:

| Set | Estimated Asset Count | Avg Size | Total |
|---|---:|---:|---:|
| Weapon-type category icons | ~12 (rifle, sniper, shotgun, smg, pistol, lmg, bow, melee, etc.) | 4 KB webp | ~48 KB |
| Armor-slot category icons | ~8 (helmet, chest, gloves, boots, mask, belt, +variants) | 4 KB | ~32 KB |
| Mod rarity frames | ~5 (common→legendary) | 6 KB | ~30 KB |
| Stat icons (hp/water/food/san/dmg) | ~10 | 3 KB | ~30 KB |
| Element type icons (fire/cold/shock/blast/burn) | ~8 | 3 KB | ~24 KB |
| Deviation element icons | ~6 | 4 KB | ~24 KB |
| **Tier 2 baseline subtotal** | **~50 files** | — | **~190 KB** |
| External CDN per-item icons (attachments — already linked, no commit) | 97 | — | 0 (CDN) |
| Future per-weapon icons (wikily.gg crawl) | ~79 | 6 KB | ~470 KB if hosted locally |

Phase-3 commit guidance: keep Tier-2 baseline under 200 KB total. Per-item icons should stay CDN-hosted via `iconUrl` until reliability or licensing forces self-hosting.

---

## Proposed Phase 3 Wiring Plan

1. **Stage A — Tier 2 category icons (commit, ~190 KB).** Manually extract the ~50 category icons listed above from NPK archives (out-of-band, when game client available) OR redraw simple SVG approximations. Place under `public/assets/ohai/categories/`. Build `src/ui/assets/categoryIconManifest.ts` mapping `(weaponType|armorSlot|element|statType|modRarity) → src/path`.
2. **Stage B — Direct mapping decode.** Run bindict v2 row decoder on `item_model_info_data` + `img_common_config_data`. Emit `data/research/assets/item-asset-direct-map.json` with `item_no → icon_path` rows. Update `item-asset-candidates.json` to upgrade `inferred_by_name` → `direct_mapping` where the registry-bridge exists.
3. **Stage C — Registry bridge.** Build `data/research/assets/registry-to-itemno-map.json` linking OHAI registry IDs (e.g. `weapon_ddccf568`) to game `item_no` via name normalization + CN→EN translation overlay (already partially built in `data/raw/translation-overlays/`).
4. **Stage D — Manifest emission.** Generate `src/ui/assets/itemAssetManifest.ts`: per itemId, return tier1 (direct CDN/local) → tier2 (category) → tier3 (text chip + Sparkles). Hook into `ItemIcon.tsx`/`ItemSlot.tsx`/`VisualLoadoutBoard.tsx`.
5. **Stage E — CDN URL health check + selective scrape.** For categories where Tier 2 is insufficient (deviations, mod suffixes), scrape oncehumandb.com for per-item iconUrls. Extend `attachments.generated.ts` pattern.

---

## Fallback Tier Design (Confirmed)

- **Tier 1 — exact:** `itemAssetManifest[itemId].iconUrl` if present. Sources: CDN URL or local `public/assets/ohai/items/<id>.webp`.
- **Tier 2 — category:** Resolved by item kind. Weapon → `weaponType` icon. Armor → `slot` icon. Mod → rarity frame + element overlay. Food/drink → category icon. Deviation → element icon. Stat → stat icon. All from `categoryIconManifest`.
- **Tier 3 — text chip:** Current behavior — first 2 chars of name on rarity-colored chip + `Sparkles` lucide-react glyph. Keep as final fallback.

---

## Blockers

1. **Bindict per-row decode not done.** The 87 asset-bearing tables expose only constant string pools, not row-level `item_no → icon_path` bindings. Direct mappings require finishing v2 row decode on `item_model_info_data` (18.7 KB), `img_common_config_data` (58 KB), `book_collect_model_data` (94 KB).
2. **No registry-to-game-item-no bridge.** OHAI registries use community-sheet CN names; game uses numeric `item_no`. Without a bridge, decoded mappings can't auto-wire to OHAI registries.
3. **NPK extraction toolchain absent.** `docs/external-research/NeoXResearch-main/unpack_npk.py` exists but NPK files do not — game client access required to convert `ui/texpack/*.png` paths into actual image bytes.
4. **Third-party CDN reliability.** `oncehumandb.com` and `wikily.gg` have no SLA. Production reliance is fragile but acceptable for Phase 2 given the alternative is "no icons."

---

## Safe-to-Commit Verdict

**YES — for research outputs only.**

- `data/research/assets/game-asset-inventory.json` — pure JSON manifest, ~120 KB, no binaries.
- `data/research/assets/item-asset-candidates.json` — pure JSON, ~600 KB, no binaries.
- `docs/research-notes/game-asset-extraction-report.md` — this file.

NO commits in this phase to:
- `public/assets/`
- `src/ui/assets/`
- Any binary files

The 33,556 `*.const_2.raw` files in `data/research/bindict_extracted/` were not modified or moved.

---

## Output Files (Phase 1 Deliverables)

1. `data/research/assets/game-asset-inventory.json` — 87 asset-bearing tables, 2,070 path strings, external CDN catalog, blockers, safe-to-commit verdict.
2. `data/research/assets/item-asset-candidates.json` — per-category candidate maps for weapons (79), armor (148), deviations (72), food (84), mod cores (99), mod suffixes (128). Coverage summary + confidence-tier doc + fallback design.
3. `docs/research-notes/game-asset-extraction-report.md` — this report.
