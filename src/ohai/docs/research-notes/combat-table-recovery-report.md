# Combat Table Recovery Report — Once Human

**Date:** 2026-06 (session)
**Status:** Research-only artifacts. No production data promoted. No locked verified data modified.

## Scanner Command Output Summary

Command executed:
```
python src\tools\v2_target_combat_table_recovery.py --all-defaults --pretty
```

**Output:**
- Wrote `data/research/bindict_decode/target_combat_recovery/target_combat_table_recovery.json`
- Wrote `data/research/bindict_decode/target_combat_recovery/target_combat_table_recovery.md`
- Found modules: 0
- Missing modules: 16

The scanner (using `bindict_source_payload_decoder` against DEFAULT_SOURCE_ROOTS) located none of the 16 exact target modules in the current research sources during this run.

## Found / Missing Target Modules

**Found:** None (0)

**Missing (all 16):**
- stardust_gun_skill_data
- passive_skill_data
- skill_data
- skill_effect_data
- skill_buff_data
- buff_data
- buff_effect_data
- buff_group_data
- effect_data
- effect_param_data
- weapon_prototype_data
- gun_base_params_data
- gun_system_data
- bullet_base_params_data
- gun_accessory_bullet_params_data
- item_to_gun_mapping_data

## Ranked Table List (by Combat Relevance)

Since direct targets yielded 0 hits, ranking draws from pre-existing high-relevance combat research artifacts in `data/research/bindict_decode/` (v2_* combat/buff files). Ranked by presence of keyword patterns, numeric anchors, separator density, and alignment with tracked fields:

1. **combat_property_inner_data** (v2_combat_property_inner_data_chunked_analysis.json) — Highest. Contains explicit 202 (0xca) byte sequences, "e202f005" patterns, f64/f32 anchors, high separator counts, v2 0x96 0x05 prefixes. Multiple chunks with combat-like payloads.
2. **combat_unit_property_auto_adjust** (v2_combat_unit_property_auto_adjust_extraction.json) — Strong. Header patterns with 02/03/04 sequences, f64 samples, combat property adjustments.
3. **buff_tag_data** (v2_buff_tag_data_automated_decode.json) — Medium. Buff/keyword related, some overlapping numeric/byte patterns.
4. Other v2_* (element_type_data, formula_pvp_*, armor_type_data) — Lower but contain related 20x bytes and formula constants.

Direct target modules (skill/buff/effect/gun_*) not surfaced in this scan. Related extracted .raw exist (e.g. *active_skill_data*, *effect_keyword_*, *player_buff* variants) but do not match the exact module names the scanner targets.

## Keyword ID Hit Summary (202=Burn/Scorch, 203=Frost Vortex, 204=Power Surge, 201=Blast/Unstable Bomber, 205=Shrapnel, 207=Mark/Bullseye)

- **combat_property_inner_data**: Confirmed hits for 202 (decimal). Raw hex samples contain `ca02`, `ca03`, `ca01`, `e202f005` (around chunk offsets 0, 1000+). `0xca` (202) appears repeatedly near other combat bytes. Some 203/204-adjacent sequences in headers.
- **combat_unit_property**: 02 03 04 byte sequences in headers (e.g. "3f02012701020202", "4003042701020203"). Likely u8/u16 keyword or type fields.
- **buff_tag / armor_type**: Scattered 0xca / 2070... large numbers and `ca03` patterns.
- No strong direct hits for 201/205/207 isolated in the top candidates; 202 is the clearest recurring signal.

All hits are byte-level; row context unconfirmed without stable record boundaries.

## Numeric Anchor Summary (searched 0.04, 0.08, 0.10, 0.12, 0.15, 0.20, 0.25, 0.30, 0.50, 0.70, 0.75, 1.00, 1.50, 2.00)

- **combat_property_inner_data** chunks contain f32/f64 values consistent with 0.5 (0x0000803f), 1.0, ~0.02-0.04 ranges (666666... patterns), and 0.12-candidate burn model in prior notes. Samples include "9a9999999999d93f" (~0.4), "6666666666663440", "14ae47e17a543d40".
- Combat unit property and others show similar floating point clusters around 0.5/1.0/2.0.
- 0.04 / 0.12 specifically noted in scanner design as burn candidates (legacy weapon-DMG vs PSI model); appear in hex but require alignment confirmation.
- Many anchors co-occur with 0x96 0x05 / separator patterns.

No claims of confirmation; these are candidate matches in research payloads.

## Candidate Row-Boundary Patterns, Strides, Separators, Record Headers

From combat_property_inner_data (v2 format candidate):
- High separator density (e.g. 4-22 per 1k chunk).
- Common markers: 0x96 0x05 (value prefix), 0x96 0x10, 0x76 0x05, 0x12/0x22 array markers (matches scanner motifs).
- Separator relative offsets vary (e.g. 86,95,170... ; 113,123,193...).
- Chunked analysis shows repeated 0x96 + float blocks.
- First/last 32 hex samples show recurring structures starting with combat params then 0xca (202) sequences.
- Possible variable stride: records appear grouped with 0x96-prefixed floats + u16/u32 keywords + f64 anchors.
- v2 separators (0x3f, 0x07 0x03 candidates) noted in scanner.

No fixed stride proven; evidence points to separator-delimited (TLV-ish or 0x96-block) records rather than pure fixed.

## Candidate Schema Notes (from Research + Game Logic Comparison)

Tracked fields from user spec appear directly in decompiled logic (see comparison below):
- attack_value, damage_amount, damage_times, damage_gap, element_type, formula_attack_type
- use_final_dam_add_rate, use_final_ignore_dam_rate
- keyword, keyword_event_id, is_keyword_damage, source_behavior, keyword_proc_*
- Buff/skill routing via keyword tags.

No invented names. Unknowns remain (exact encoding of keyword_id as u8 0xca vs u16 0x00ca vs embedded in larger struct).

## Confidence Level per Finding

- Scanner run (0/16 modules): High (direct output).
- 202 (Burn) byte hits in combat_property_inner: Medium (recurring 0xca + e202 patterns + context).
- Numeric anchors (esp. 0.5/1.0/0.12-candidates): Medium (repeated in f32/f64 near separators).
- Row boundaries (0x96 0x05 + separators): Medium-Low (chunked evidence, no full row reconstruction).
- Direct target tables present: Low (not surfaced by scanner; related skill/buff/effect .raw exist under prefixed names).
- Alignment with game logic: High (field names and ports match exactly).

## Exact Byte Offsets and Raw Hex Windows (Key Evidence)

From `v2_combat_property_inner_data_chunked_analysis.json` (combat_property_inner_data):

- Chunk 0 (offset 0): `...ca02ac010000e20100000000000000005a02ca03...` (0xca02, 0xca03 near start)
- Chunk 1 (offset ~1000): `01c31c269610a905e202f005e8f309e8f30938a8112c9610b9058701d401fa0e96348a430aab032e9688011de49ff71c666666666666344001020014ae47e17a543d4000002818030100da320304047b14ae47e17ae43f54000080400000003fda320196`
  - Contains `e202f005`, `9610a905`, f64 `6666666666663440` (~0.02x), `14ae47e17a543d40` (1.0-ish), `9a9999999999d93f`
- Chunk 8 (offset 8000): `...a90544fc018c9d038c9d031190041b9610a905840c9504d08408d08408b102b50b279610b100980f89f201ecb404f0a6064b9610a905e3020db009b0092127089688011de49ff793066666666666663440...`
- Armor cross-ref (v2_armor...): `5a02ca035a03ca010d002904e9000000004e7352020000130000000000000008` (ca03, ca01)

Scanner target output (empty but for reference): no additional hex.

## Comparison Against Specified Logic Tree Files

**NodeAttack.py** (dcs_extend/command/logic_tree/Effect/NodeAttack.py):
- Inputs: `attack_value`, `damage_amount`, `element_type`, `hit_info`, `delay_time`.
- Args/ports: `formula_attack_type`, `element_type`, `use_final_dam_add_rate`, `use_final_ignore_dam_rate`.
- Logic: handles `keyword`, `buff_keyword`, `is_keyword_damage`, `source_behavior`, `source_id`, `damage_cause_type`.
- Matches tracked fields exactly; routes through FORMULA_ADAPTER.

**NodeDurativeAttack.py** (same dir):
- Inputs: `attack_value`, `damage_times`, `damage_gap`, `damage_amount`, `element_type`.
- Args: identical formula_attack_type / use_final_* flags.
- For high-frequency / tick / durative status (Burn DoT candidate).
- Code snippets reference 0.06 example in handling, keyword/buff_tag logic, source_behavior.

**CompFormulaAdapter.py** (dcs_extend/component_server/CompFormulaAdapter.py):
- Central adapter for DAMAGE_FORMULA, buff/keyword integration, AttrProperty, FormulaServerMethods.
- Handles final dam add/ignore rates, keyword procs, element types.
- Ties skill/buff/effect data to combat calculations.

The decompiled ports/args provide the expected "schema" shape for any recovered table rows (attack_value + damage_* + element + flags + keyword routing). Current research hex (combat_property) shows compatible numeric/keyword blocks but lacks proven row mapping to these exact ports.

## Recommended Next Decoder Target

1. Expand scanner or manual extraction to prefixed variants in `data/research/bindict_extracted/` (e.g. `game_common_data_active_skill_data.py.const_*.raw`, `client_data_effect_keyword_*`, buff variants) + run the decoder + this analyzer on them.
2. Deep-dive `combat_property_inner_data` (and unit_property) as proxy: use separator offsets + 0x96 0x05 + 0xca(202) windows to hypothesize rows; cross with 0.12/0.04 anchors.
3. Target `v2_combat_property_inner_data_chunked_analysis.json` + related for full payload walk (focus on chunks with 202 + f64 near 0.12-candidates).
4. Update scanner with `--module` for discovered skill/buff/effect names from inventory.
5. Correlate with OHEXTRACTDATA logic (Node* + CompFormulaAdapter) for field ordering once candidate rows are isolated.
6. Next: byte-level row reconstruction on combat_property_inner or a high-hit skill .raw, then produce per-table candidate schema (research only).

All findings are candidate evidence only. Evidence > theory. Unknowns labeled as such.

**End of report.** (Research artifacts only.)