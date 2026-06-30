# V2 Second Semantic Anchor Search

> **CANDIDATE ANALYSIS - NOT CANONICAL - REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-05T19:42:34.931314+00:00

## Objective

Search for a second semantic anchor table — a small bindict table whose decoded
values can be validated against existing repo code or decompiled game code.
This complements the first anchor (`formula_pvp_global_param_data`) used for
Variant A separator hypothesis disambiguation.

## Search Parameters

- Data directory: `recovered_mobile_pyc_OFF\game_common\data`
- Source files scanned: 135
- Total .pyc tables: 1644
- Priority keyword tables: 106
- Tables analyzed in depth: 80
- Excluded (first anchor): `formula_pvp_global_param_data`

### Priority Keywords

`pvp`, `damage`, `formula`, `attack`, `armor`, `element`, `keyword`, `buff`, `debuff`, `species`, `weapon`, `tier`, `star`, `rate`, `factor`, `coefficient`, `multiplier`

### Known Constants Searched

- **pvp_star_modifier_0.4**: PvP star modifier = 0.4, raw u32 fixed-point 0x66666666
- **pvp_tier_modifier_0.2**: PvP tier modifier = 0.2, raw u32 fixed-point 0x33333333
- **f32_1.0**: IEEE 754 f32 1.0
- **f32_0.5**: IEEE 754 f32 0.5
- **f32_1.6**: IEEE 754 f32 1.6
- **f32_2.0**: IEEE 754 f32 2.0

## Summary

| Metric | Value |
|--------|-------|
| Candidates with score >= 10 | 31 |
| Candidates with score >= 20 | 19 |
| High confidence | 15 |
| Medium confidence | 15 |
| Low confidence | 37 |
| Top candidate | `element_dam_rate_no` |
| Top candidate score | 39 |

## Scoring Methodology

| Evidence Type | Max Score | Description |
|---------------|-----------|-------------|
| table_name_in_code | +3 | Table name found in repo source files |
| schema_strings | +2 | Printable ASCII runs >= 4 chars in .pyc |
| value_match | +20 | Decoded value matches known repo constant (+5 per unique constant) |
| anchor_match | +10 | PvP-specific constant match (+10 if >=3 hits, +5 if >=1) |
| keyword_bonus | +3 | Table name contains priority keyword (+1 per keyword, max 3) |
| size_bonus | +2 | Small file (<1KB: +2, <5KB: +1) |

## Top Candidates

### 1. `element_dam_rate_no`

- **Evidence score:** 39
- **Confidence:** high
- **File size:** 808 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (10 strings)
- value_matches: 20 (9 hits, constants: f32_0.5, f32_1.0, f32_2.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (6 PvP hits)
- keyword_bonus: 2 (element, rate)
- size_bonus: 2 (808 bytes)

**Schema strings:**

- offset 179: `lv_hp_rateslv_field_ratesConst_10Const_100Const_125Const_150Const_200Const_25Const_300Const_50Const_75Ele_Eff_StdEle_Ineff_Std`
- offset 472: `"333333`
- offset 483: `"ffffff`
- offset 642: `bindict`
- offset 651: `bindict_build_flag`

**Value matches:**

- pvp_star_modifier_0.4 at offset 484 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 485 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 486 (u32_fixed, decoded=0.4)
- pvp_tier_modifier_0.2 at offset 473 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 474 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 475 (u32_fixed, decoded=0.2)
- f32_1.0 at offset 320 (f32, decoded=1.0)
- f32_0.5 at offset 397 (f32, decoded=0.5)
- f32_2.0 at offset 358 (f32, decoded=2.0)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:350`: ### 8. `element_dam_rate_no`

### 2. `formula_pvp_adjust_leaves_data`

- **Evidence score:** 38
- **Confidence:** high
- **File size:** 1092 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (45 refs)
- schema_strings: 2 (22 strings)
- value_matches: 20 (41 hits, constants: f32_0.5, f32_1.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (39 PvP hits)
- keyword_bonus: 2 (pvp, formula)
- size_bonus: 1 (1092 bytes)

**Schema strings:**

- offset 175: `value_2value_1valuevalue_3value_4attack_type_dam_add_rateattack_type_ignore_dam_ratecrit_dam_rateelement_type_dam_add_rateignore_dam_ratekeyword_proc_crit_dam_add_rateweak_dam_rate`
- offset 362: `333333`
- offset 381: `333333`
- offset 388: `?333333`
- offset 407: `?333333`

**Value matches:**

- pvp_star_modifier_0.4 at offset 419 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 420 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 421 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 578 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 579 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 580 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 635 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 636 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 637 (u32_fixed, decoded=0.4)
- pvp_tier_modifier_0.2 at offset 362 (u32_fixed, decoded=0.2)

**Code references:**

- `docs\research-notes\formula-pvp-adjust-leaves-full-mapping.md:8`: Comprehensive scan of `formula_pvp_adjust_leaves_data.pyc` discovered a **9-byte leaf-index sequence
- `docs\research-notes\formula-pvp-adjust-leaves-full-mapping.md:238`: - Look for references to formula_pvp_adjust_leaves_data
- `docs\research-notes\formula-pvp-adjust-leaves-gap-analysis.md:8`: Analyzed three non-standard gaps between record groups in `formula_pvp_adjust_leaves_data.pyc`. Foun

### 3. `formula_pvp_adjust_param_data`

- **Evidence score:** 38
- **Confidence:** high
- **File size:** 2944 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (14 refs)
- schema_strings: 2 (57 strings)
- value_matches: 20 (171 hits, constants: f32_0.5, f32_1.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (144 PvP hits)
- keyword_bonus: 2 (pvp, formula)
- size_bonus: 1 (2944 bytes)

**Schema strings:**

- offset 147: `value_1value_3value_4valuevalue_2`
- offset 186: `"ffffff`
- offset 262: `"ffffff`
- offset 374: `ffffff`
- offset 385: `ffffff`

**Value matches:**

- pvp_star_modifier_0.4 at offset 187 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 188 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 189 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 263 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 264 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 265 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 374 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 375 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 376 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 385 (u32_fixed, decoded=0.4)

**Code references:**

- `src\utils\combat\officialFormulaMetadata.ts:308`: { leafName: "pvp_adjust_factor", category: "target", mode: "dynamic", resolvedBy: "get_pvp_adjust_fa
- `docs\research-notes\v2-formula-pvp-adjust-param-candidates.md:1`: # V2 formula_pvp_adjust_param_data — Decoded Candidates
- `docs\research-notes\v2-formula-pvp-adjust-param-candidates.md:5`: **Table**: formula_pvp_adjust_param_data.pyc (2944 bytes, Variant A, 145 delimiters)

### 4. `player_fall_damage`

- **Evidence score:** 38
- **Confidence:** high
- **File size:** 872 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (22 strings)
- value_matches: 20 (38 hits, constants: f32_0.5, f32_1.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (36 PvP hits)
- keyword_bonus: 1 (damage)
- size_bonus: 2 (872 bytes)

**Schema strings:**

- offset 131: `damage_rate`
- offset 184: `333333`
- offset 220: `333333`
- offset 230: `ffffff`
- offset 286: `333333`

**Value matches:**

- pvp_star_modifier_0.4 at offset 230 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 231 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 232 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 302 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 303 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 304 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 332 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 333 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 334 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 534 (u32_fixed, decoded=0.4)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:458`: ### 11. `player_fall_damage`

### 5. `abnormal_capture_rate_data`

- **Evidence score:** 38
- **Confidence:** high
- **File size:** 892 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (14 strings)
- value_matches: 20 (18 hits, constants: f32_0.5, f32_1.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (15 PvP hits)
- keyword_bonus: 1 (rate)
- size_bonus: 2 (892 bytes)

**Schema strings:**

- offset 159: `settlement_rate4settlement_rate2settlement_rate3max_capture_numsettlement_rate1must_succeed_numinit_ratespecial_max_capture_numU`
- offset 386: `ffffff`
- offset 483: `c333333`
- offset 511: `?333333`
- offset 541: `*333333`

**Value matches:**

- pvp_star_modifier_0.4 at offset 386 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 387 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 388 (u32_fixed, decoded=0.4)
- pvp_tier_modifier_0.2 at offset 484 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 485 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 486 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 512 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 513 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 514 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 542 (u32_fixed, decoded=0.2)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:494`: ### 12. `abnormal_capture_rate_data`

### 6. `struct_element_type_data`

- **Evidence score:** 37
- **Confidence:** high
- **File size:** 1240 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (3 refs)
- schema_strings: 2 (37 strings)
- value_matches: 20 (67 hits, constants: f32_0.5, f32_1.0, f32_2.0, pvp_star_modifier_0.4)
- anchor_match: 10 (57 PvP hits)
- keyword_bonus: 1 (element)
- size_bonus: 1 (1240 bytes)

**Schema strings:**

- offset 195: `4312chs_namelan_translate`
- offset 244: `_$S@TIDS$_cr9|0`
- offset 265: `_$S@TIDS$_cr9|0`
- offset 286: `_$S@TIDS$_cr9|0`
- offset 307: `_$S@TIDS$_cr9|0`

**Value matches:**

- pvp_star_modifier_0.4 at offset 515 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 516 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 517 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 523 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 524 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 525 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 557 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 558 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 559 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 587 (u32_fixed, decoded=0.4)

**Code references:**

- `docs\research-notes\mobile-bindict-v2-recovery-2026-06-04.md:70`: | `struct_element_type_data` | `game_common/data/` | 944B | 17 | Structure element types (same 11 el
- `docs\research-notes\v2-second-semantic-anchor-search.md:268`: ### 6. `struct_element_type_data`
- `docs\research-notes\v2-second-semantic-anchor-search.md:306`: - `docs\research-notes\mobile-bindict-v2-recovery-2026-06-04.md:70`: | `struct_element_type_data` | 

### 7. `rubbish_tag_generate_data`

- **Evidence score:** 37
- **Confidence:** high
- **File size:** 1324 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (19 strings)
- value_matches: 20 (15 hits, constants: f32_0.5, f32_1.0, f32_2.0, pvp_tier_modifier_0.2)
- anchor_match: 10 (6 PvP hits)
- keyword_bonus: 1 (rate)
- size_bonus: 1 (1324 bytes)

**Schema strings:**

- offset 271: `tag_append_probtag_append_ruletag_compete_rangecommentdepend_tagtag_prioritytag_namehospitalcanteenhospital30023001100114001none1002shore1003hoscanbar2001canteen2002court3003tolietlan_translate`
- offset 476: `_$S@TIDS$_cmr|0`
- offset 497: `_$S@TIDS$_cmr|0`
- offset 518: `_$S@TIDS$_cmr|0`
- offset 545: `_$S@TIDS$_cmr|1`

**Value matches:**

- pvp_tier_modifier_0.2 at offset 836 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 837 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 838 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1017 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1018 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1019 (u32_fixed, decoded=0.2)
- f32_1.0 at offset 758 (f32, decoded=1.0)
- f32_1.0 at offset 784 (f32, decoded=1.0)
- f32_1.0 at offset 810 (f32, decoded=1.0)
- f32_1.0 at offset 867 (f32, decoded=1.0)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:530`: ### 13. `rubbish_tag_generate_data`

### 8. `stardust_skill_sys_param_data`

- **Evidence score:** 34
- **Confidence:** medium
- **File size:** 2952 bytes

**Evidence breakdown:**

- table_name_in_code: 0 (0 refs)
- schema_strings: 2 (24 strings)
- value_matches: 20 (38 hits, constants: f32_0.5, f32_2.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (36 PvP hits)
- keyword_bonus: 1 (star)
- size_bonus: 1 (2952 bytes)

**Schema strings:**

- offset 415: `valpalu_attach_socketabs_detec_angleabs_detec_disabs_dis_mappingabs_fx_starteffect/skill/catch_throw/rubbish_fx_start.pseabs_fx_traileffect/skill/catch_throw/rubbish_fx_trail.pseabs_fx_trail_timeabs_player_socketsocket_abs_rubbishabs_time_mappingcqb_pick_rangedefault_modelcharacter/weapon/grenades/fly_box/fly_box.gimmove_av_constmove_lv_constnml_av_constnml_dis_mappingnml_keyboard1010104nml_lv_constnml_nameeffect/skill/catch_throw/suspen_fx_trail.psesuspen_player_socketnml_name_formatsocket_anomaly_controlnml_scatterSpr12700010nml_time_mappingnml_xhairXhair12700010palu_nml_av_constpalu_nml_lv_construbbish_volume_sizes1_av_consts1_av_const_rbs1_lv_consts1_lv_const_rbs1_up_hights1_up_hight_rbs1_up_times1_up_time_rbs2_av_consts2_av_const_rbs2_fly_times2_fly_time_rbs2_lv_consts2_lv_const_rbs2_up_angles2_up_angle_rbs2_up_times2_up_time_rbsocket_anomaly_control_xsocket_anomaly_control_ysocket_anomaly_control_zsuspen_3dui_offsetsuspen_3dui_socketsocket_3dui_fsuspen_detec_anglesuspen_detec_dissuspen_fly_play_eventPlay_obj_item_fly_by_lpsuspen_fly_stop_eventStop_obj_item_fly_by_lpsuspen_fx_starteffect/skill/catch_throw/suspen_fx_start.psesuspen_fx_traillan_translate`
- offset 1596: `_$S@TIDS$_cqo|0`
- offset 1617: `{0}_$S@TIDS$_cqo|0`
- offset 1730: `333333`
- offset 1775: `?ffffff`

**Value matches:**

- pvp_star_modifier_0.4 at offset 1776 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1777 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1778 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1819 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1820 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1821 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1909 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1910 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1911 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 1958 (u32_fixed, decoded=0.4)

### 9. `gun_reload_formula_template_data`

- **Evidence score:** 33
- **Confidence:** high
- **File size:** 856 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (5 refs)
- schema_strings: 2 (12 strings)
- value_matches: 15 (7 hits, constants: f32_0.5, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (6 PvP hits)
- keyword_bonus: 1 (formula)
- size_bonus: 2 (856 bytes)

**Schema strings:**

- offset 175: `reload_loop_time_creload_loop_time_areload_loop_time_breload_arreload_bowreload_glreload_hgreload_lmgreload_sgreload_sg_pumpreload_smgreload_sr`
- offset 339: `333333`
- offset 477: `@a2U0*`
- offset 527: `@a2U0*`
- offset 547: `ffffff`

**Value matches:**

- pvp_star_modifier_0.4 at offset 547 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 548 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 549 (u32_fixed, decoded=0.4)
- pvp_tier_modifier_0.2 at offset 339 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 340 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 341 (u32_fixed, decoded=0.2)
- f32_0.5 at offset 136 (f32, decoded=0.5)

**Code references:**

- `docs\research-notes\batch-3-subtask-3.3-candidate-table.md:204`: | `gun_reload_formula_template_data` | reload_loop_template_no | gun_reload_formula_template_data.js
- `docs\research-notes\bindict-impl-readiness.md:277`: gun_reload_formula_template_data
- `docs\research-notes\v2-second-semantic-anchor-search.md:227`: ### 5. `gun_reload_formula_template_data`

### 10. `hit_rate_monitor_data`

- **Evidence score:** 32
- **Confidence:** high
- **File size:** 1400 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (10 strings)
- value_matches: 15 (10 hits, constants: f32_1.0, pvp_star_modifier_0.4, pvp_tier_modifier_0.2)
- anchor_match: 10 (6 PvP hits)
- keyword_bonus: 1 (rate)
- size_bonus: 1 (1400 bytes)

**Schema strings:**

- offset 147: `time_interval_limitweak_time_intervalhit_count_limitfar_distance_limitweak_hit_count_limitG`
- offset 631: `ffffff`
- offset 777: `333333`
- offset 1230: `bindict`
- offset 1239: `bindict_build_flag`

**Value matches:**

- pvp_star_modifier_0.4 at offset 631 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 632 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 633 (u32_fixed, decoded=0.4)
- pvp_tier_modifier_0.2 at offset 777 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 778 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 779 (u32_fixed, decoded=0.2)
- f32_1.0 at offset 313 (f32, decoded=1.0)
- f32_1.0 at offset 384 (f32, decoded=1.0)
- f32_1.0 at offset 401 (f32, decoded=1.0)
- f32_1.0 at offset 493 (f32, decoded=1.0)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:566`: ### 14. `hit_rate_monitor_data`

### 11. `melee_skill_rate_index_data`

- **Evidence score:** 32
- **Confidence:** high
- **File size:** 1400 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (10 strings)
- value_matches: 15 (6 hits, constants: f32_1.0, f32_2.0, pvp_tier_modifier_0.2)
- anchor_match: 10 (3 PvP hits)
- keyword_bonus: 1 (rate)
- size_bonus: 1 (1400 bytes)

**Schema strings:**

- offset 175: `skill_ratebase_valatk_01atk_02atk_03atk_datk_g1atk_g2atk_hatk_04atk_laiatk_05`
- offset 311: `333333`
- offset 1226: `bindict`
- offset 1235: `bindict_build_flag`
- offset 1261: `timezone_related`

**Value matches:**

- pvp_tier_modifier_0.2 at offset 311 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 312 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 313 (u32_fixed, decoded=0.2)
- f32_1.0 at offset 276 (f32, decoded=1.0)
- f32_2.0 at offset 160 (f32, decoded=2.0)
- f32_2.0 at offset 400 (f32, decoded=2.0)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:602`: ### 15. `melee_skill_rate_index_data`

### 12. `gun_range_formula_template_data`

- **Evidence score:** 32
- **Confidence:** high
- **File size:** 1612 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (8 refs)
- schema_strings: 2 (15 strings)
- value_matches: 15 (47 hits, constants: f32_0.5, f32_1.0, pvp_tier_modifier_0.2)
- anchor_match: 10 (12 PvP hits)
- keyword_bonus: 1 (formula)
- size_bonus: 1 (1612 bytes)

**Schema strings:**

- offset 227: `valid_range_add_valuedamage_attenuation_ratiogun_base_attenuation_rangegun_base_valid_rangeattenuation_range_add_valuedamage_ratiopvp_arpvp_bowpvp_hgpvp_lmgpvp_m82_ssrpvp_sgpvp_smgpvp_srpvp_sw500_ssrrange_arrange_bowrange_ftrange_hgrange_hg_ai_1range_infrange_lmgrange_sgrange_smgrange_sr`
- offset 558: `333333`
- offset 966: `333333`
- offset 1021: `@333333`
- offset 1186: `333333`

**Value matches:**

- pvp_tier_modifier_0.2 at offset 558 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 559 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 560 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 966 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 967 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 968 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1022 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1023 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1024 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 1186 (u32_fixed, decoded=0.2)

**Code references:**

- `docs\research-notes\batch-3-subtask-3.3-candidate-table.md:203`: | `gun_range_formula_template_data` | weapon_range_template_no | gun_range_formula_template_data.jso
- `docs\research-notes\batch-3-subtask-3.3-candidate-table.md:215`: | `gun_range_formula_template_data` | object (range formula params) | gun_range_formula_template_dat
- `docs\research-notes\bindict-impl-readiness.md:252`: | `gun_range_formula_template_data`  | object  | needs source  |

### 13. `formula_pvp_tier_base_factor_data`

- **Evidence score:** 30
- **Confidence:** high
- **File size:** 856 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (5 refs)
- schema_strings: 2 (17 strings)
- value_matches: 10 (31 hits, constants: f32_2.0, pvp_star_modifier_0.4)
- anchor_match: 10 (30 PvP hits)
- keyword_bonus: 3 (pvp, formula, tier, factor)
- size_bonus: 2 (856 bytes)

**Schema strings:**

- offset 167: `default_skill_powerskill_power_adjustdefault_max_hpmax_hp_adjustbase_max_hpmax_hpattackbase_skill_powerattack_adjustskill_power>`
- offset 343: `Bffffff`
- offset 379: `Bffffff`
- offset 397: `pBffffff`
- offset 434: `Bffffff`

**Value matches:**

- pvp_star_modifier_0.4 at offset 344 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 345 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 346 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 380 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 381 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 382 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 399 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 400 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 401 (u32_fixed, decoded=0.4)
- pvp_star_modifier_0.4 at offset 435 (u32_fixed, decoded=0.4)

**Code references:**

- `docs\research-notes\v2-pvp-extraction-progress.md:122`: - formula_pvp_tier_base_factor_data
- `docs\research-notes\v2-second-semantic-anchor-search.md:45`: | Top candidate | `formula_pvp_tier_base_factor_data` |
- `docs\research-notes\v2-second-semantic-anchor-search.md:61`: ### 1. `formula_pvp_tier_base_factor_data`

### 14. `formula_pvp_adjust_max_hp_data`

- **Evidence score:** 29
- **Confidence:** high
- **File size:** 496 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (25 refs)
- schema_strings: 2 (10 strings)
- value_matches: 10 (7 hits, constants: f32_1.0, pvp_tier_modifier_0.2)
- anchor_match: 10 (6 PvP hits)
- keyword_bonus: 2 (pvp, formula)
- size_bonus: 2 (496 bytes)

**Schema strings:**

- offset 151: `valuevalue_3value_2value_1value_4max_hp_rateg`
- offset 201: `"333333`
- offset 255: `?333333`
- offset 292: `TEEEEEv`
- offset 318: `bindict`

**Value matches:**

- pvp_tier_modifier_0.2 at offset 202 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 203 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 204 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 256 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 257 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 258 (u32_fixed, decoded=0.2)
- f32_1.0 at offset 218 (f32, decoded=1.0)

**Code references:**

- `docs\research-notes\formula-pvp-global-param-v2-decode.md:147`: - `formula_pvp_adjust_max_hp_data.pyc`
- `docs\research-notes\pvp-globals-implementation.md:122`: 2. Investigate `formula_pvp_adjust_max_hp_data` (different variant)
- `docs\research-notes\v2-3f-separator-cross-table-scan.md:17`: | formula_pvp_adjust_max_hp_data | 496 B | 69 B | 0 | ❌ does_not_use_0x3F_separator_convention |

### 15. `stardust_drop_event_data`

- **Evidence score:** 28
- **Confidence:** high
- **File size:** 444 bytes

**Evidence breakdown:**

- table_name_in_code: 3 (1 refs)
- schema_strings: 2 (9 strings)
- value_matches: 10 (4 hits, constants: f32_0.5, pvp_tier_modifier_0.2)
- anchor_match: 10 (3 PvP hits)
- keyword_bonus: 1 (star)
- size_bonus: 2 (444 bytes)

**Schema strings:**

- offset 131: `drop_rate.`
- offset 178: `333333`
- offset 273: `bindict`
- offset 282: `bindict_build_flag`
- offset 308: `timezone_related`

**Value matches:**

- pvp_tier_modifier_0.2 at offset 178 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 179 (u32_fixed, decoded=0.2)
- pvp_tier_modifier_0.2 at offset 180 (u32_fixed, decoded=0.2)
- f32_0.5 at offset 157 (f32, decoded=0.5)

**Code references:**

- `docs\research-notes\v2-second-semantic-anchor-search.md:386`: ### 9. `stardust_drop_event_data`

## Conclusion

The strongest second semantic anchor candidate is **`element_dam_rate_no`** with evidence score 39 (high confidence). It contains 9 value matches against known repo constants and 1 code references.

## Next Steps

1. Validate top candidate values against in-game measurements
2. If validated, use as second anchor for Variant A separator hypothesis cross-check
3. Expand constant library with values from `officialFormulaMetadata.ts` and decompiled game code
4. Re-run search with expanded constants to find additional candidates

---

> CANDIDATE ANALYSIS - NOT CANONICAL - REQUIRES IN-GAME VALIDATION