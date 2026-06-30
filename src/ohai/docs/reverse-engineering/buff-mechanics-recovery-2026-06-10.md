# Buff Mechanics Recovery — 2026-06-10

**Source extraction root:** `C:\Users\tyr3x\Downloads\oncehuman_script_npk\extracted_script_npk\module_global_scan\priority_buff_decode`
**Status:** Research-only snapshot. Recovered static data has been wired into `src/ui/data/recovered/` for visibility, but is **not yet part of the authoritative damage formula engine**. Treat as "decoded, pending V2+ and in-game validation".

## Scope

This document captures the latest static reverse-engineering pass over the local
MEmu `script.npk` extraction, focused on the **buff / status-effect** data path.
It supersedes the earlier status-effect notes in
`docs/research-notes/burn-combat-table-recovery-handoff.md` only at the **family
and prop-name** level — numeric formulas, exact PSI/scaling values, and per-buff
IDs are still pending.

## Confidence labels used in this report

- **Recovered / high confidence** — exact internal property names or
  family/field names lifted directly from the .pyc/bindict, verified by
  independent clean-exports (`buff_tag_prop_map_clean.csv` and
  `clean_buff_mechanics_summary.txt`).
- **Likely semantic mapping** — internal name mapped to a player-facing
  mechanic name based on context (related `element_anomaly_relation_data`
  values, neighboring `keyword_tag` strings, in-game naming conventions).
  This is a hypothesis, not authoritative.
- **Under investigation** — exact formulas, buff IDs, numeric values, row/node
  schema, and mod resolver. Do not treat as solved.

## 1. `buff_tag_prop_map` — recovered family/prop map

The cleanest recovered artifact in this pass. Source:
`game_common\data\buff_tag_prop_map.py`.

**Status:** Recovered / high confidence for prop names. Likely semantic mapping
for player-facing labels.

8 internal families, 13 unique props:

| Family | Kind | TimeOp | Recovered prop | Likely semantic mapping |
|--------|------|--------|----------------|-------------------------|
| `scorch` | debuff | reduce | `tag_debuff_time_reduce_add_rate_scorch` | Burn / Scorch / fire status family |
| `scorch` | debuff | extend | `tag_debuff_time_extend_add_rate_scorch` | Burn / Scorch / fire status family |
| `surge` | debuff | extend | `tag_debuff_time_extend_add_rate_surge` | Power Surge / electric status family |
| `frozen` | debuff | reduce | `tag_debuff_time_reduce_add_rate_frozen` | Frozen / frost status family |
| `frozen` | debuff | extend | `tag_debuff_time_extend_add_rate_frozen` | Frozen / frost status family |
| `vortex` | debuff | reduce | `tag_debuff_time_reduce_add_rate_vortex` | Frost Vortex |
| `vortex` | debuff | extend | `tag_debuff_time_extend_add_rate_vortex` | Frost Vortex |
| `mark` | debuff | reduce | `tag_debuff_time_reduce_add_rate_mark` | Hunter Mark |
| `mark` | debuff | extend | `tag_debuff_time_extend_add_rate_mark` | Hunter Mark |
| `armed` | buff | extend | `tag_buff_time_extend_add_rate_armed` | Fortress Warfare / Armed / heavy stance buff family |
| `quick_draw` | buff | extend | `tag_buff_time_extend_add_rate_quick_draw` | Fast Gunner / Quick Draw |
| `bleeding` | debuff | reduce | `tag_debuff_time_reduce_add_rate_bleeding` | Bleed |
| `bleeding` | debuff | extend | `tag_debuff_time_extend_add_rate_bleeding` | Bleed |

Notes on the layout:

- `armed` and `quick_draw` are the **only `buff`-kind** families — the rest are
  `debuff`. This is consistent with their semantic labels (player-buffs that
  extend a stance/timer vs. enemy debuffs whose duration can be extended or
  reduced).
- `surge` is the only family with no `reduce` prop. It is `extend`-only. This
  is a meaningful structural signal (no "surge-resist" prop exists in this
  table), but it should not be over-interpreted: it could mean the game simply
  does not currently model surge-duration reduction as a buff/debuff stat.
- `scorch`, `frozen`, `vortex`, `mark`, and `bleeding` all expose both
  `extend` and `reduce` props. This is the standard `tag_*_time_*_add_rate_*`
  template.
- The grouped-row layout in `buff_tag_prop_map_grouped_by_row.csv` shows
  `scorch` is a *co-anchor* on every row — i.e. scorch-resist is always
  present regardless of which other family the row is grouping. This is
  consistent with scorch being a baseline debuff in the debuff-time model.
- Row 7 has 8 bytes of payload and 5 distinct props (scorch, bleeding extend,
  bleeding reduce, mark extend, vortex reduce). The internal `head_hex` for
  that row is `96 06 0f 0e 76 01 0b 08`, which is the only multi-byte header
  in the table.

**In-repo data:**
- Typed export: `src/ui/data/recovered/buffTagPropMap.ts`
- Used in UI: `src/ui/components/OHAIIntelligencePanel.tsx` (new
  `Recovered Buff Families` section, marked "Recovered static data, not yet
  wired into the formula engine.")

## 2. `buff_unique_tag` — decoded registry (not mod resolver)

Source: `game_common\data\buff_unique_tag.py`. Decoded as a small
unique-tag/keyword registry. Includes:

- `unique_tag`
- `减速` (slow)
- `饱食度状态` (satiety state)
- `饮水度状态` (hydration state)
- `位移模式` (movement mode)
- `食物-生存类效果` (food — survival effect)
- `食物-行动类效果` (food — action effect)
- `异想` (anomaly)
- `黑水减速周期减理智值` (black-water slow-cycle sanity drain)
- `致命孢子毒` (lethal spore poison)
- `黑水小怪导电buff` (black-water small-enemy conduction buff)
- `同位素` (isotope)
- `持续治疗` (continuous healing)

**Status:** Decoded. **Not the mod/suffix/affix resolver** — this is a
gameplay-level keyword registry used by the buff system, not a UI/resolver
table.

## 3. `new_mod_sort` — mod codes, not names

Source: `new_mod_sort__mod_codes_under_entry.py`. Structurally decoded as
`96 2c <uleb128 group_key> 27 01 <count> <count * u32 mod_code>`, mapping
`group_key -> mod_code[]`.

**This is a mod grouping table. It is not a name/effect resolver.** Do not
attempt to assign English mod names from group keys. The previous artifact
`decoded_string_table/new_mod_sort_probe/new_mod_sort_group_to_mod_codes_clean_provisional.csv`
remains the canonical output for this pass.

**Status:** High-confidence structural decode; semantic resolver still missing.

## 4. `mod_level_lib_data` and `mod_entry_lib_data`

- `mod_level_lib_data.py` — mod enhancement / attribute quality / roll
  probability library. Fields include `level`, `enhance_times`, `weight`, and
  descriptor strings for quality/attribute probability. **Not the mod
  name/effect resolver.**
- `mod_entry_lib_data.py` — only contains `lib_icon`, `weight`, `lib_bg`,
  `apply_range`, `mods_qjqshjc.png`, and `#ffffff`. Crosswalk against
  `new_mod_sort` group keys produced **0 rows**. Treat as visual/category
  metadata, not mod names/effects.

## 5. Useful search terms for future resolver work

The English term "mod/suffix/affix" search was too noisy. Strict exact-term
searches surfaced the following candidates (most likely internal naming, used
as search anchors for the next resolver pass):

- `PanelEquipModsPackV2`
- `equip_mod_ui_exchange_first`
- `equip_mod_ui_exchange_gear`
- `equip_mod_ui_exchange_weapon`
- `equip_mod_v2_ui_gear_all`
- `equip_mod_v2_ui_gear_sort`
- `equip_mod_v2_ui_tab_group`
- `equip_mod_v2_ui_weapon_genre`
- `process_keyword_sfx_item`
- `get_display_keyword_sfx_by_type`
- `keyword_sfx_reddot`
- `suffix_element_name`
- `weapon_accuracy_affix`
- `weapon_accuracy_affix_value`

## 6. Logic-tree bridge candidates

These five `.py` files have been added to a recovered bridge metadata table in
`src/ui/data/recovered/buffLogicTreeBridge.ts`. Each is a
**high-priority candidate** but with **numeric schema still under
investigation**.

### 6.1 `buff_550005981_1.py` — fire/scorch keyword buff logic

**Candidate role:** fire/scorch keyword buff logic candidate
(`socket_buff_fire01` family).

**Important fields:**

- `socket_buff_fire01`
- `is_buff_damage`
- `is_keyword_sfx_use`
- `is_keyword_damage`
- `keyword_tag`
- `keyword_event_id`
- `keyword_sfx_path`
- `element_type`
- `jump_word_element_type`
- `formula_attack_type`
- `use_final_dam_add_rate`
- `use_final_ignore_dam_rate`
- `buff_id`
- `buff_lv`
- `mapping_buff`

**Status:** High-priority decoded logic-tree candidate. Do **not** claim the
exact Burn/fire formula from this file yet. We have field names and row
neighborhoods; numeric/node schema is still being recovered.

### 6.2 `buff_601430131_1.py` — stack-changing buff logic

**Candidate role:** stack-changing buff logic candidate
(`NodeChangeBuffStack` / `buff_stack_checker` family).

**Important fields:**

- `on_buff_stack_change::%source_lv`
- `on_buff_stack_change`
- `buff_id`
- `buff_lv`
- `mapping_buff`
- `buff_stack_checker`
- `NodeChangeBuffStack`

**Status:** Stack-changing buff logic candidate. Numeric schema unresolved.
Open question: how `on_buff_stack_change` resolves numeric stacks per source
level.

### 6.3 `buff_10200015_1.py` — stack-reading buff logic

**Candidate role:** stack-reading buff logic candidate
(`NodeGetBuffStack` family, used with `max_hp` / `NodeHeal`).

**Important fields:**

- `NodeGetBuffStack`
- `buff_stack`

**Status:** Stack-reading buff logic candidate. Numeric schema unresolved.
Open question: how `buff_stack` maps to numeric effect magnitude (e.g. heal
amount).

### 6.4 `buff_60143062_1.py` — conditional buff-cast / mark/keyword logic

**Candidate role:** conditional buff-cast / mark/keyword logic candidate
(`NodeCastBuffToTarget` family).

**Important fields:**

- `mapping_buff`
- `buff_id`
- `buff_lv`
- `element_type`
- `formula_attack_type`
- `keyword_tag`
- `keyword_tag_negate`
- `NodeCastBuffToTarget`

**Status:** General attack/damage node schema reference. Numeric schema
unresolved. Open question: whether `keyword_tag_negate` is a boolean flag or
a numeric threshold.

### 6.5 `behavior_player_melee_tachi_attack_attack02.py` — general attack/damage node schema

**Candidate role:** general attack/damage node schema reference
(**not** a status-effect driver itself — useful as a schema reference for
the attack-side row).

**Important fields:**

- `is_buff_damage`
- `damage_value`
- `element_type`
- `formula_attack_type`
- `is_keyword_damage`
- `is_keyword_sfx_use`
- `jump_word_element_type`
- `keyword_event_id`
- `keyword_sfx_path`
- `keyword_tag`
- `skill_rate`
- `skill_rate_type`
- `use_final_dam_add_rate`
- `use_final_ignore_dam_rate`

**Status:** General attack/damage node schema reference. Numeric schema
unresolved. Open question: which of these fields are node-input vs
node-output pins.

## 7. Tokenized row probe — next technical step

The latest script run tokenized selected logic rows to recover
row/node schema around important fields. The artifacts are:

- `tokenized_logic_rows/tokenized_selected_rows.csv`
- `tokenized_logic_rows/selected_row_summary.csv`
- `tokenized_logic_rows/tokenized_selected_rows_summary.txt`

**Status:** Do **not** treat tokenized byte-neighborhood values as solved
yet. The next technical step is to identify repeated byte patterns around
the same field names across rows and infer row/node field packing from
positional alignment.

## 8. In-repo summary

| Artifact | Path | Status |
|----------|------|--------|
| Recovered buff families (typed) | `src/ui/data/recovered/buffTagPropMap.ts` | high-confidence prop names; likely semantic labels |
| Recovered logic-tree bridge metadata | `src/ui/data/recovered/buffLogicTreeBridge.ts` | high-priority candidates; numeric schema under investigation |
| UI panel section | `src/ui/components/OHAIIntelligencePanel.tsx` (`Recovered Buff Families`) | read-only, marked "not yet wired into formula engine" |
| Smoke tests | `src/ui/data/recovered/__tests__/buffTagPropMap.smokeTest.ts`, `buffLogicTreeBridge.smokeTest.ts` | run via `npx tsx` |

## 9. What this update does NOT do

- Does **not** add a new authoritative damage formula entry.
- Does **not** change any `StatKey` enum in `src/schemas/buildGoalSchema.ts`.
- Does **not** promote the likely semantic labels to verified/authoritative
  status.
- Does **not** modify any of the existing 3 expected-FAIL cases
  (EBR fire ring, Frost Vortex model conflict, Power Surge model conflict).
- Does **not** introduce a mod name/effect resolver — the resolver remains
  the open gap from earlier sprints.
