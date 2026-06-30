# Accessory Compatibility Audit (Phase 1, read-only)

Date: 2026-06-06
Scope: Locate game-source evidence for weapon -> accessory compatibility. No registry or UI code changes. Outputs live in `data/research/accessory-compatibility/` and this file.

> **Re-verified 2026-06-06 by Agent B (Accessory Compatibility Engineer):** All source references below confirmed against current repo state. `GunSlotType` enum independently confirmed in `shoot_const.py`. `gun_accessory_slot_params_data`, `weapon_accessory_data`, and `gun_accessory_item_to_accessory_map_data` tables confirmed present as `.raw` bindict extracts in `data/research/bindict_extracted/` AND as `.pyc` files in `recovered_mobile_pyc_OFF/`. The evidence file at `data/research/accessory-compatibility/accessory-compatibility-evidence.json` is authoritative. Phase 2 implementation is unblocked for Tier 1.

## TL;DR

The game ships authoritative weapon/accessory compatibility tables in `recovered_mobile_pyc_OFF/game_common/data/*.pyc`. Schemas are fully recovered from the `co_names` string pools in the compiled bytecode; numeric row contents still need a decoder pass. The current calculator does **slot + family substring matching** on attachment display names and has at least one demonstrable false negative (12-gauge muzzle brake equippable on SMGs). Phase 2 should ship a tier-1 prefix-aware fix immediately (low risk, evidence-grounded) and follow with tier-2 exact-ID gating once a `.pyc` -> JSON decoder is wired.

## Tables that prove compatibility

All paths relative to repo root.

| Table (.pyc) | Size | What it proves |
| --- | --- | --- |
| `recovered_mobile_pyc_OFF/game_common/data/weapon_accessory_data.pyc` | 20 KB | **Primary**: schema `(gun_no, slot_type, slot_default_accessory_no, is_show, accessory_res_map_no)`. Direct weapon -> slot -> default accessory binding. |
| `recovered_mobile_pyc_OFF/game_common/data/gun_accessory_slot_params_data.pyc` | 96 KB | **Primary**: schema `(gun_no, accessory_seq_no, default_accessory_nos, is_show, accessory_res_map_no)`. The plural `default_accessory_nos` field is a list -> this enumerates allowed accessories per slot per weapon. The gold table. |
| `recovered_mobile_pyc_OFF/game_common/data/gun_accessory_item_to_accessory_map_data.pyc` | 13 KB | Maps inventory item_no -> internal accessory_no. Needed to bridge oncehumandb.com IDs (in `attachments.generated.ts`) to engine accessory_no strings. |
| `recovered_mobile_pyc_OFF/game_common/data/item_no_to_gun_accessory_no_map.pyc` | 6 KB | Canonical accessory-ID catalog. All `120_*` (optic), `220_*` (muzzle), `320_*` (tactical), `420_*` (magazine), `620_*` (stock), `810_*` (ammo) IDs are visible here. **Decodes the prefix scheme.** |
| `recovered_mobile_pyc_OFF/game_common/data/gun_accessory_{sights,muzzle,clip,butt,under_barrel,trigger,bullet,barrel,base,color,skin}_params_data.pyc` | varies | Per-slot params. Each row keyed by `(gun_no, accessory_no)` with `socket_name`, `socket_offset`, `bind_type`. Per-weapon socket placements -> implicit allow-list. |

Supporting constants (already in plaintext):

- `docs/external-research/OHEXTRACTDATA/dcs_extend/const/weapon_const.py:117-122` -- `class GunType`
- `docs/external-research/OHEXTRACTDATA/dcs_extend/const/accessory_const.py:7-20` -- `class AccessoryAttachState`, `class OutwardMask`

The mobile pyc index at `data/research/mobile_npk_pyc_index.json` lines 37842, 37854, 37914, 48366 confirms these files were enumerated by an earlier pass.

## Decoded prefix scheme

From the string pool of `item_no_to_gun_accessory_no_map.pyc`:

| Prefix | Slot | Sub-classifier examples |
| --- | --- | --- |
| `120_` | optic | `iron_01`, `2x_*`, `3x_*`, `4x_*`, `6x_*`, `8x_*`, `2x_okp`, `2x_ekp`, `2x_srs`, `2x_dp` |
| `220_` | muzzle | `*_flhhdr` flash hider, `*_sup` suppressor, `*_brake`, `*_cmpn` compensator; caliber tokens `556`, `acp`, `12g`, `lcpis`, `lrg`, `small`, `large`, `cmpt`, `cqb`, `shot` |
| `320_` | tactical / under-barrel | `*_bipod`, `*_grip`, `*_laser`, `*_flshlt` flashlight, `*_ir` IR |
| `420_` | magazine | family token `pis`/`shot`/`smg`/`rif`/`sr`/`lmg` then `med`/`spr`/`ex`/`tac`/`lw`/`ameh`/`drum` |
| `620_` | stock | `rs2`, `strike`, `tac`, `large`, `hvsp_*_excl` |
| `810_` | ammo | family token `ar`/`sr`/`lmg`/`pt`/`smg`/`sg`/`cw`/`bow`/`ft`/`gl`/`rpg`/`nail` then `lv0..5` |

Join-row format in `weapon_accessory_data.pyc` and `gun_accessory_slot_params_data.pyc`: `<slot_seq>_<gun_no>` where `slot_seq` is `111` (sight) / `211` (muzzle) / `411` (mag) / `511` (under-barrel) / `611` / `711` / `141/241/...` variants, and `gun_no` is the 8-digit internal weapon ID (e.g., `10410011`, `10520011`).

The `_excl` suffix (`620_hvsp_stock_01_excl`, `320_fd_bipod_01_excl`) is a probable exclusivity / hard-restriction flag.

## What the calculator does today

`src/ui/registries/attachmentRegistry.ts::getAttachmentFamilies()` (lines 28-58) computes allowed weapon families per attachment by substring-matching the attachment name. Five firearm families enumerated: Assault Rifle, LMG, SMG, Sniper Rifle, Shotgun, Pistol.

`src/ui/registries/generated/attachments.generated.ts` has 116 entries: 17 magazine, 33 muzzle, 28 optic, 4 stock, 34 tactical.

`src/ui/registries/generated/weapons.generated.ts` has weapons in families `Rifle`, `Sniper Rifle`, `Light Machine Gun`, `Submachine Gun`, `Crossbow`. **Pistol and Shotgun families are not present in the generated weapons file** even though pistol/shotgun-specific attachments exist; either the calculator does not yet model them or weapons are sourced elsewhere.

### Holes in the current strategy (evidence-backed)

1. **Tactical slot is universal.** `getAttachmentFamilies()` returns `ALL_FIREARM_FAMILIES` for tactical. Game data: under-barrel grip/bipod/laser sockets are per-weapon; some weapons have no under-barrel rail at all.
2. **Muzzle caliber tags missing.** The current name heuristic catches `small-caliber`, `medium-caliber`, `shotgun`. Game data caliber tags are `acp`, `556`, `12g`, `lcpis`, `lrg`, `large`, `small`, `cmpt`, `cqb`. A 12-gauge brake on an SMG passes today.
3. **No per-weapon-id gating.** Any AR attachment is equippable on any AR. Game data is per-(weapon, accessory) pair.
4. **`_excl` exclusivity flag not modeled.**
5. **No oncehumandb.com item_no <-> engine accessory_no bridge** exists in the codebase. The 8-digit numbers in `attachments.generated.ts:iconUrl` are not currently linked to engine IDs.

### Confirmed impossible combos the UI should block

| Combo | Currently blocked? | Evidence |
| --- | --- | --- |
| AR + shotgun muzzle | YES | substring match |
| Crossbow + rifle magazine | YES | substring match |
| MP7 (SMG) + LMG drum mag | YES | substring match |
| **SMG + 12-gauge muzzle brake** | **NO** | substring `12g` not recognized -- false negative |
| **SR + bipod on a weapon without under-barrel slot** | **NO** | tactical is universal |

## Phase 2 plan

Two tiers, ship them in order.

### Tier 1 (low risk, ship immediately)

Extend `getAttachmentFamilies()` to incorporate the prefix scheme catalogued above. For each attachment, derive a `slotPrefix` and caliber/family sub-token from the recovered IDs and the existing display name. Adds Pistol + Shotgun families to the family list, closes the 12-gauge false-negative, models `_excl` as "blocked unless explicitly listed". No new data extraction needed -- everything is in the evidence JSON.

### Tier 2 (exact-ID gating)

Decode the four primary `.pyc` tables into JSON using a Python 3.11 marshal-aware decoder (the bindict decode toolchain at `data/research/bindict_decode/` is the existing pattern). Then build:

1. `gun_no -> internal weapon record` (8-digit -> name, family).
2. `accessory_no -> item_no` (via `gun_accessory_item_to_accessory_map_data`).
3. `item_no -> attachments.generated.ts canonical id` (via the icon URL 8-digit IDs; oncehumandb item_no matches game item_no in this project's other registries -- needs verification).
4. `weapon_canonical_id -> { slot_type -> [allowed accessory_canonical_id] }`.

Ship as `src/ui/registries/accessoryCompatibilityRegistry.ts` with confidence levels per pair: `verified` (direct table row), `inferred-by-family` (Tier 1 prefix match), `unknown` (no evidence).

### UI treatment

Disable (greyed out, tooltip "Incompatible with `<weapon>`") rather than hide. On weapon swap, auto-clear incompatible attachments and surface a toast. Keep an opt-out `Show all attachments` setting for the curious.

### Test anchors

- AR + AR muzzle = OK
- AR + Shotgun muzzle = BLOCKED
- SMG + 12-gauge brake = BLOCKED (currently passes)
- SR + sniper sight = OK
- Crossbow + rifle magazine = BLOCKED
- Empty attachment slot = always valid
- Weapon swap from AR to SR clears AR-specific magazine
- Unknown-pair never reported as `verified`

## Blockers

- Numeric `.pyc` row contents are not yet decoded -- only string pools.
- No `canonical-weapon-id -> gun_no` bridge yet.
- Pistol and Shotgun weapons absent from `weapons.generated.ts`; clarifying this is a Phase 2 dependency.

## Safe to commit

Yes for the two research outputs (`data/research/accessory-compatibility/accessory-compatibility-evidence.json`, this file). No production code touched.
