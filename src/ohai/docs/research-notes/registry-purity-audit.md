# OHAI Registry Purity Audit (Phase 1 Recon)

**Auditor:** ohai-registry-auditor
**Date:** 2026-06-06
**Phase:** 1 of 4 — READ-ONLY. No registry/code/verified-data files changed.

Scope: every item registry under `src/ui/registries/`, cross-referenced against `data/verified/`, `data/raw/external-references/`, `data/extracted/external-references/`, `docs/external-research/OHEXTRACTDATA/`, and `recovered_mobile_pyc_OFF/`.

All outputs live under `data/research/registry-purity/` and this note. Prior version of this doc (handoff prose from earlier in the day) is superseded by the evidence-anchored audit below; the audit JSON files contain the per-entry evidence the previous prose summarized.

## Methodology

1. Enumerated every registry array in `src/ui/registries/` (curated + `generated/*.generated.ts`).
2. Extracted `id`, `name`, `originalName`, `confidence`, `needsReview`, `sourceNotes`, family/slot fields via a line-based parser into scratch files `data/research/registry-purity/_all-extracted.json` and `_weapons-extracted.json`.
3. Cross-referenced weapons against two NA-facing public DB mirrors:
   - `data/raw/external-references/lredragol-weapon_list.json` (oncehumandb.com mirror — 131 entries)
   - `data/extracted/external-references/weaponlist.normalized.json` (wikily.gg mirror — 343 entries)
4. Cross-referenced CN/TW originals against `data/verified/weapons.verified.json`, whose declared `sourceWorkbook` is `七日世界.xlsx` (CN community sheet). The "verified" snapshot is CN-sourced and was not treated as NA proof on its own.
5. Honored the existing `nonCanonicalWeaponNameKeys` skiplist in `src/ui/registries/weaponRegistry.ts:10-40` as prior curator audit evidence and re-checked every skiplisted entry against lReDragol.
6. Classified non-weapon registries primarily by declared `confidence` + `needsReview` — no equivalent NA-facing public DB was located in scope for armor / mods / deviations / food / attachments / key-gear.

## Classification rollup

### Weapons — 132 unique IDs across `weapons.generated.ts` + `weaponsStats.generated.ts`

| Classification | Count |
|---|---:|
| confirmed_na_live | 105 |
| duplicate_synthetic | 24 |
| candidate_needs_review | 3 |

### Non-weapon registries

| Registry | File | Total | confirmed_na_live | name_pending | needs_review |
|---|---|---:|---:|---:|---:|
| armor (curated) | `armorRegistry.ts` | 32 | 0 | 0 | 32 |
| armor sets | `generated/armor-sets.generated.ts` | 22 (record) | 22 | 0 | 0 |
| mods (curated) | `modRegistry.ts` | 9 | 4 | 0 | 5 |
| mod cores | `generated/mod-cores.generated.ts` | 99 | 0 | 0 | 99 |
| mod suffixes | `generated/mod-suffixes.generated.ts` | 29 | 29 | 0 | 0 |
| deviations (curated) | `deviationRegistry.ts` | 6 | 4 | 0 | 2 |
| deviations (generated) | `generated/deviations.generated.ts` | 69 | 0 | 69 | 0 |
| food buffs (curated) | `foodBuffRegistry.ts` | 10 | 4 | 0 | 6 |
| food buffs (generated) | `generated/food-buffs.generated.ts` | 84 | 0 | 84 | 0 |
| cradle perks | `cradleRegistry.ts` | 25 | 25 | 0 | 0 |
| ammo | `ammoRegistry.ts` | 6 | 6 | 0 | 0 |
| attachments | `generated/attachments.generated.ts` | 116 | 0 | 0 | 116 |
| key gear | `generated/key-gear.generated.ts` | 38 | 0 | 0 | 38 |

`name_pending` = `confirmed_na_live_name_pending`: entry is plausibly an NA-live item but its display name was likely auto-translated from CN/TW and should be locked against in-game localization before treating as canonical.

## Dark Snowflake verdict — `confirmed_na_live`

**Verdict: NA-live.** Dark Snowflake is the Tier-1 *rare-blueprint* customization of the SN700 bolt-action sniper rifle. Evidence chain:

- `data/raw/external-references/lredragol-weapon_list.json:5840-5864` — entry `sn700_dark_snowflake`, name "SN700 - Dark Snowflake", type `sniper_rifles`, rarity `rare`, `source_url: https://www.oncehumandb.com/weapons/sn700-dark-snowflake`.
- `data/extracted/external-references/weaponlist.normalized.json:1881-1885` — "SN700 - Dark Snowflake (Tier 1)" mirrored from wikily.gg with icon `icon_source_m700_r.webp`.
- `data/extracted/external-references/weaponlist.txt:444` — same icon and tier listing.
- `src/ui/registries/generated/weaponsStats.generated.ts:2966-2987` — already imported into the registry as `sn700-dark-snowflake` (rare, sniper, SR Ammo, base DPP 878, fire rate 40, mag 5, reload 3.6s).

The Phase-0 brief (`docs/sprints/registry-purity-and-ui.md:30`) speculated Dark Snowflake "likely does not exist in NA live." That speculation is refuted: it is a real NA-Steam Tier-1 SN700 blueprint, just a low-rarity (rare) variant, which is why it doesn't surface in legendary-build content. **No quarantine action needed.**

## Top suspicious entries (besides Dark Snowflake)

1. **`compound-bow-nowhere-to-run`** — `Compound Bow - Nowhere to Run`, original `復合弓-無處可逃`. Not matched in lReDragol or wikily mirrors. Sourced from CN sheet with complex TW-Chinese effect text. Classification: `candidate_needs_review`. Action: verify NA Steam name; may be CN-only or may exist under a different English localization.

2. **`mp7`** and **`m700`** generic Raidzone placeholders in `src/ui/registries/generated/weapons.generated.ts:45-99`. Their `sourceNotes` literally state `"Generic Raidzone weapon. Translation confidence: low"`. Real NA Tier-1 MP7 and SN700 variants already exist in `weaponsStats.generated.ts`. Classification: `candidate_needs_review` because the curator deliberately kept them. Phase-2 action: either delete or relabel as `raidzone-*-base` if they represent a distinct Raidzone pickup variant.

3. **24 skiplisted "non-canonical" weapons** filtered at runtime by `weaponRegistry.ts:10-40`. *Every single one* maps to a real NA-live weapon in lReDragol — SCAR, AWM, BAR, RPD, DP12, DE.50-Goshawk, R500-Interfade, G17-Cash Only, MPS7 (Chaos Domain / Focus / Urban Ninja), OIC-8 Last Carnival, DBSG (Format / Dual Fury / Old Huntsman), SR2000 Die Another Day, Star Vortex, XM8, Aurora Fort, Ultra Force, Memento Mystery, KVM Slam Bam, Space-Time SMG, Morgan, Dual Fury, Old Huntsman. These are real NA weapons whose *generator-produced placeholder rows* were quarantined because they collide with curated rows or lack metadata. Classification: `duplicate_synthetic` (against the generated row). Phase-2 action: pick the canonical row per `id` (curated vs. lReDragol-import vs. generator), emit a migration note, then delete the loser. Do not blanket-delete — saved builds may reference any of these IDs.

4. **`mod-cores.generated.ts` (99 entries)** — none declared `verified` or `observed-final`. Highest-volume pool of unverified mod content in the project. No NA-facing public-DB mirror was located for mod cores within scope.

5. **`attachments.generated.ts` (116 entries)** — same situation. Auto-translated from the CN sheet without independent NA verification.

## Items where evidence is insufficient

- All 32 armor pieces in `armorRegistry.ts` declare `confidence: "estimated", needsReview: true`. The 22 set names in `armor-sets.generated.ts` match NA-known sets (Lone Wolf, Falcon, Renegade, Shelterer, Bastille, Stormweaver, Heavy Duty, Agent, Dark Resonance, Treacherous Tides, Gravity Tide, Blackstone variants, Savior, etc.) so the *set taxonomy* is solid; per-slot effect text is the unverified part.
- Generated mod cores (99) and attachments (116) — no NA-facing public-DB mirror scoped. Recommended Phase-2 sources: oncehumandb.com mod/attachment pages or in-game tooltip captures.
- Deviations: generator (`generated/deviations.generated.ts`, 69 entries) carries CN originals (`originalName`) but auto-translated English names. Classified `confirmed_na_live_name_pending` pending in-game localization lock.
- `recovered_mobile_pyc_OFF/` was not scanned for the Dark Snowflake / candidate-review weapon names because a broad grep timed out (>20s) on that tree; this is a known gap and a Phase-2 to-do. It does NOT affect the Dark Snowflake conclusion (that has independent NA evidence) or the weapon counts.

## Recommended Phase-2 quarantine actions (no action taken in Phase 1)

- **Do NOT quarantine** Dark Snowflake or the other 104 `confirmed_na_live` weapons.
- For the 24 skiplisted weapons in `nonCanonicalWeaponNameKeys`: pick a canonical row per id and emit a migration note before deleting any side. Preserve ID mapping so saved builds don't break.
- For `mp7` / `m700` generic Raidzone stubs: delete or relabel; do not silently leave as `needsReview: true` forever.
- For `compound-bow-nowhere-to-run`: needs human confirmation against an NA live client.
- For non-weapon registries flagged `candidate_needs_review` / `confirmed_na_live_name_pending`: lock English display names against NA in-game localization captures. The audit JSON preserves every CN/TW `originalName` so nothing is lost in translation.

## Files inspected (counts)

- 16 registry source files under `src/ui/registries/` and `src/ui/registries/generated/`.
- 12 verified-data files under `data/verified/`.
- 2 NA-facing public-DB mirrors (`lredragol-weapon_list.json`, `weaponlist.normalized.json`).
- Spot checks in `docs/external-research/OHEXTRACTDATA/client_data/` (texture_map, store_banner_table) and `docs/sprints/registry-purity-and-ui.md`.
- 0 files under `recovered_mobile_pyc_OFF/` (grep timeout; deferred to Phase 2).

## Safe-to-commit verdict

Safe to commit the three audit outputs and this note:
- `data/research/registry-purity/weapon-registry-purity-audit.json`
- `data/research/registry-purity/full-registry-purity-audit.json`
- `docs/research-notes/registry-purity-audit.md` (this file)

Scratch files `_all-extracted.json` and `_weapons-extracted.json` under `data/research/registry-purity/` are intermediate working data and can be committed or `.gitignore`-d at the committer's discretion; they are not deliverables.

No registry, verified-data, or generated source files were modified.
