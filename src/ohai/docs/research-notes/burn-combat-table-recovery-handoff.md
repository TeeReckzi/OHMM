# Burn / Scorch Combat Table Recovery Handoff

Status: active recovery work, research-only. Do not promote any recovered row or coefficient to production until it is validated against source usage or controlled in-game parsing.

## What changed

Added targeted scanner:

```text
src/tools/v2_target_combat_table_recovery.py
```

It is designed to narrow the broad V2 bindict problem down to the tables most likely to contain Burn / Scorch / keyword proc payloads.

## Why this exists

The old Burn model in OHAI used a weapon-DMG stack formula, but repo evidence showed that model came from an outdated/manual placeholder path, not decoded game-file proof. Burn is a status mechanic, and active formula logic has been switched to PSI-scaling while we recover the underlying table evidence.

This tool is the next recovery step. It tries to find the table row evidence that can answer:

```text
Burn/Scorch base payload = Psi Intensity × ?
```

or prove a different coefficient/model.

## Target tables

Default scan targets include:

```text
stardust_gun_skill_data
passive_skill_data
buff_data
buff_effect_data
buff_group_data
effect_data
effect_param_data
skill_data
skill_effect_data
skill_buff_data
weapon_prototype_data
gun_base_params_data
gun_system_data
bullet_base_params_data
gun_accessory_bullet_params_data
item_to_gun_mapping_data
```

The first two are highest priority for weapon keyword/proc skill behavior. Buff/effect tables are included because Burn may be implemented as a status/buff payload rather than as a weapon table row.

## Command

Run from repo root:

```bash
python src/tools/v2_target_combat_table_recovery.py --all-defaults --pretty
```

Optional specific table pass:

```bash
python src/tools/v2_target_combat_table_recovery.py --module stardust_gun_skill_data --module passive_skill_data --pretty
```

## Outputs

```text
data/research/bindict_decode/target_combat_recovery/target_combat_table_recovery.json
data/research/bindict_decode/target_combat_recovery/target_combat_table_recovery.md
```

## What the scanner records

For each target module found in `docs/external-research/OHEXTRACTDATA`, it records:

- decoded bindict format
- string pool count
- Burn/Scorch semantic string hits
- record payload first byte and motif counts
- keyword ID hits, especially `202 = Scorch/Burn`
- numeric anchor hits, especially `0.12` and legacy comparison `0.04`
- raw byte windows around every hit
- a candidate `burn_relevance_score`

## What counts as good evidence

A useful Burn table candidate should show several of these together:

1. Scorch/Burn semantic strings in the decoded string pool.
2. Repeated `202` keyword-id hits at stable row offsets.
3. Repeated numeric anchor hits near the same row structure, especially `0.12` or nearby coefficient values.
4. A record motif shared with other known skill/buff tables.
5. A matching source-code path from `NodeAttack`, `NodeDurativeAttack`, `keyword_proc_*`, or buff/effect logic.

A single `0.12` hit or a single `0xCA` byte is not enough. That would be a coincidence cannon with glitter taped to it.

## Current known supporting source context

Recovered/decompiled runtime nodes confirm that direct and durative damage nodes consume these important fields:

```text
attack_value
damage_times
damage_gap
element_type
formula_attack_type
keyword
keyword_tag
is_keyword_damage
keyword_event_id
source_behavior
use_final_dam_add_rate
use_final_ignore_dam_rate
```

Enum recovery confirms:

```text
FormulaAttackType.Dot = 4
ElementType.FIRE = 1
AttackWeaponType.BUFF = 3
WeaponPlaqueType / keyword id 202 = Scorch/Burn
```

Official formula metadata confirms keyword proc leaves:

```text
keyword_proc_dam_add_rate
keyword_proc_crit_enable
keyword_proc_crit_rate_add_rate
keyword_proc_crit_dam_add_rate
keyword_proc_weak_dam_add_rate
```

That means Burn-specific mods should route through keyword proc/status/element paths once the table row is recovered.

## Follow-up decoder work

After running the scanner:

1. Open the highest `burn_relevance_score` table in the JSON.
2. Compare all raw windows for keyword ID `202`.
3. Check whether those hits occur at consistent offsets from record boundaries.
4. Compare numeric anchors near the same regions.
5. Write a table-specific row-boundary analyzer once a repeated stride/motif is visible.
6. Only then name fields.

## Safe implementation rule

Until the target table row is recovered, active formula code may use owner-verified PSI scaling, but the exact coefficient must stay flagged as needing game-file backfill.
