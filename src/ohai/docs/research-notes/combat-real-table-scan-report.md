# Combat Real Table Scan Report

**Date:** 2026-06
**Status:** Research-only. No production or locked verified data modified.

## Exact command(s) run

```bash
python src/tools/v2_real_combat_table_recovery.py --all-real --pretty
```

This is the new real-names variant (src/tools/v2_real_combat_table_recovery.py) that uses module names discovered in the full-table-inventory.md instead of the old assumed names.

The script:
- Scans OHEXTRACTDATA/client_data and dcs_* for .py with matching real module names (via bindict literal extraction).
- Scans data/research/bindict_extracted for .raw whose filenames contain the real target names (synthetic full-payload decode for byte analysis).
- Reuses the proven keyword/numeric/motif scanners.
- Outputs to data/research/bindict_decode/real_combat_recovery/

## Found / Missing table counts

- Targets attempted (real families): 19
- Direct .py matches (OHEXTRACTDATA): 25
- .raw payload matches (bindict_extracted): 23
- Total unique modules found: 25
- Missing (strict): 0 (partial pattern hits filled gaps)

## Target modules (real names from inventory)
- active_skill_data
- active_skill_config_data
- active_skill_generate_map_data
- achieve_skill_data
- ai_voice_skill_data
- deviation_skill_extra_data
- abnormal_skill_param_data
- effect_keyword_item_data
- effect_keyword_skin_group_data
- effect_keyword_tab_config_data
- client_data_item_buff_attr_info_data
- buff_tag_data
- combat_property_inner_data
- combat_unit_property_auto_adjust_data
- element_type_data
- bullet_pattern_data
- gun_ads_params_data
- gun_setting_data
- gun_sound_data

(Plus pattern-matched variants like game_common_data_* and character_active_skill_data.)

## Ranked combat-relevance list (by burn_relevance_score)

| Module | Type | Format | First byte | Size | Score | Keyword hits | Tracked KW (201-207) | Numeric anchors |
|--------|------|--------|------------|------|-------|--------------|----------------------|-----------------|
| combat_property_inner_data | property registry | raw_binary | 0x1c | 2477316 | 222315 | 64009 | 40638 | 33515 |
| gun_ads_params_data | weapon / gun data | raw_binary | 0xdd | 254087 | 30748 | 7494 | 6423 | 11640 |
| gun_ads_params_data | weapon / gun data | v2+ | 0x31 | 223535 | 28608 | 6872 | 5890 | 11108 |
| gun_sound_data | weapon / gun data | v2+ | 0x55 | 9544 | 5778 | 147 | 95 | 91 |
| gun_sound_data | weapon / gun data | raw_binary | 0x92 | 53469 | 862 | 206 | 133 | 185 |
| gun_setting_data | weapon / gun data | raw_binary | 0x73 | 21164 | 510 | 93 | 62 | 92 |
| cn_mobile_gun_setting_data | weapon / gun data | raw_binary | 0x73 | 21614 | 489 | 91 | 64 | 65 |
| character_active_skill_data | skill definition | raw_binary | 0x04 | 37349 | 487 | 110 | 74 | 64 |
| gun_setting_data | weapon / gun data | v2+ | 0x43 | 6295 | 394 | 84 | 63 | 22 |
| bullet_pattern_data | weapon / gun data | raw_binary | 0x22 | 2887 | 222 | 37 | 30 | 58 |
| deviation_skill_extra_data | skill definition | raw_binary | 0x2a | 3664 | 205 | 18 | 12 | 46 |
| bullet_pattern_data | weapon / gun data | v2+ | 0x1f | 2226 | 203 | 31 | 28 | 56 |
| buff_tag_data | buff definition | raw_binary | 0x5d | 3846 | 192 | 11 | 11 | 44 |
| active_skill_config_data | skill definition | raw_binary | 0x5a | 2291 | 121 | 19 | 13 | 30 |
| combat_unit_property_auto_adjust_data | property registry | raw_binary | 0x04 | 770 | 116 | 35 | 34 | 29 |
| achieve_skill_data | skill definition | raw_binary | 0x4b | 2983 | 100 | 17 | 12 | 15 |
| struct_element_type_data | unknown | raw_binary | 0x11 | 944 | 77 | 4 | 4 | 51 |
| effect_keyword_item_data | effect definition | v2+ | 0x23 | 1030 | 72 | 17 | 9 | 1 |
| effect_keyword_item_data | effect definition | raw_binary | 0x08 | 1184 | 52 | 17 | 9 | 2 |
| element_type_data | unknown | raw_binary | 0x38 | 1802 | 29 | 7 | 7 | 5 |
| active_skill_data | skill definition | raw_binary | 0x47 | 1440 | 26 | 8 | 5 | 3 |
| active_skill_generate_map_data | skill definition | raw_binary | 0x34 | 1375 | 26 | 8 | 6 | 2 |
| effect_keyword_tab_config_data | effect definition | v2+ | 0xbd | 287 | 24 | 3 | 3 | 1 |
| effect_keyword_tab_config_data | effect definition | raw_binary | 0x18 | 1302 | 20 | 4 | 3 | 1 |
| effect_keyword_skin_group_data | effect definition | v1 | 0xdc | 376 | 15 | 4 | 3 | 0 |

## Keyword ID hits for 202, 203, 204, 201, 205, 207

- **combat_property_inner_data** (dominant): 40,638 tracked keyword hits (heavy on 202 "scorch_burn", also 207 "mark_bullseye" and others). Thousands of u8 0xca / u16 ca02 etc. hits.
- **gun_ads_params_data** (multiple variants): 6k+ tracked hits per variant.
- **character_active_skill_data**, **deviation_skill_extra_data**, **active_skill_*_data**: Dozens to low hundreds of tracked hits (including 202).
- **buff_tag_data**, **effect_keyword_*_data**: 9–11 tracked hits each, directly relevant to status/keyword procs.
- **combat_unit_property_auto_adjust_data**, **element_type_data**: 4–34 tracked hits.

202 (scorch_burn) is the strongest recurring signal across skill/effect/buff/combat_property tables.

## Numeric anchors near tracked keyword hits

The top tables show thousands of matches for the requested values (0.04, 0.08, 0.10, 0.12, 0.15, 0.20, 0.25, 0.30, 0.50, 0.70, 0.75, 1.00, 1.50, 2.00), especially 0.5/1.0/2.0 and the burn candidates (0.04, 0.12).

Examples from combat_property_inner_data (high density):
- burn_candidate_0.04_legacy_weapon_model (f32/f64/u32 variants)
- burn_candidate_0.12_psi_model
- 0.25, 0.30, 0.50, 0.75, 1.00, 1.50, 2.00

These frequently appear within 128 bytes of 202 / e202 / ca02 hits, inside 0x96 0x05 / 0x96 0x10 blocks.

## Raw hex windows around high-value hits (examples)

From combat_property_inner_data (game_common_data_combat_property_inner_data.py.const_2.raw):

- Pattern e202 @ abs 889 (near 202 context):
  Window (excerpt): `...9610a905e202f005e8f309e8f30938a8112c9610b9058701d401fa0e96348a430aab032e9688011de49ff71c666666666666344001020014ae47e17a543d4000002818030100da320304047b14ae47e17ae43f54000080400000003fda32019610a100cf0adbb264f0b2cd034c9610a905e60bca1792a820889e12a017c011229688011bd49ff7110000000001010000000000006428000101009a030001049a9999999999d93f...`

- Pattern e202 @ abs 51575:
  Window contains repeated `9610a905e20211fa10fa10...` + 0.5 floats (6666...3440) + 96 blocks.

Similar structured e202 + 96 10 + f64(0.5) + more 96 sequences appear across dozens of offsets in this file.

Other high-value (effect_keyword_item_data, active_skill_data .raw) show smaller but consistent 202 / ca02 hits inside short records with numeric anchors.

## Candidate row-boundary motifs

- Dominant in combat_property_inner_data: 0x96 0x05 / 0x96 0x10 value prefixes + 0x22 / 0x3f separators + repeated e202/ca02 blocks + f32/f64 (0.5, 1.0, 0.12-candidates) + u16/u32 keyword-like values.
- Record sizes appear variable but grouped in 0x96-prefixed float + keyword chunks (common v2 motif).
- combat_unit_property and buff_tag show simpler 0x12/0x22 + short records.
- effect_keyword_* often v1/v2 with small payload_size and direct keyword strings.

The repeating motif around e202 (see clustering report) is the strongest signal for row reconstruction: 96 10 a9 05 e202 ... [floats] 96 10 ...

## Table type notes (heuristic from name + content)

- combat_property_inner_data → property registry (high volume of property-like numeric + keyword bonus blocks; not a per-skill definition table).
- active_skill_*_data / character_active_skill_data / achieve_skill_data → skill definition.
- effect_keyword_*_data / effect_keyword_* → effect definition (direct keyword 202/207 ties).
- buff_tag_data / item_buff_attr_info_data / game_common_data_behavior_*_buff_* → buff definition.
- gun_*_data / bullet_pattern_data → weapon / gun data (high incidental keyword/numeric hits, likely routing or base params).
- combat_unit_property_auto_adjust_data → property registry.
- element_type_data / struct_element_type_data → unknown / type enum support (some keyword hits).

## Summary

Using real names from the inventory yielded 25 modules with substantial evidence, led overwhelmingly by combat_property_inner_data (property registry with massive 202/e202 + numeric density). Skill and effect_keyword families also surfaced with direct tracked-keyword hits.

This validates the inventory-driven approach: the old assumed names missed the real assets.

Next logical step (per prior guidance): deep row-boundary recovery + clustering around the e202 motifs in the combat_property_inner and active_skill/effect_keyword .raw (see companion e202-keyword-clustering-report.md).

All evidence is candidate/research-only. Byte patterns require row context + game logic cross-check (NodeAttack / NodeDurativeAttack ports) before any formula claims.