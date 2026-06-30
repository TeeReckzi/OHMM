# Combat Template Application Report

**Tool:** `src/tools/v2_apply_combat_row_template.py`
**Status:** Research-only. No production or locked verified data modified.

## Command run

```bash
python src/tools/v2_apply_combat_row_template.py --pretty
```

## Files scanned

10 matching raw files from the target families (limited globs for active_skill_data/config, effect_keyword*, player_buff*, buff_sub_tag* etc.):

- client_data_effect_keyword_item_data.py.const_2.raw
- client_data_effect_keyword_skin_group_data.py.const_2.raw
- client_data_effect_keyword_tab_config_data.py.const_2.raw
- game_common_data_active_skill_config_data.py.const_2.raw
- game_common_data_active_skill_data.py.const_2.raw
- game_common_data_behavior_player_buff_XMLZ.py.const_3.raw
- game_common_data_buff_sub_tag_data.py.const_2.raw
- game_common_data_buff_sub_tag_prop_map.py.const_2.raw
- game_common_data_character_active_skill_data.py.const_2.raw
- game_common_data_effect_keyword_skin_data.py.const_2.raw

## Anchor counts by family

- Total candidate windows extracted: 102
- Significant groups (by count in the groups dict):
  - Multiple groups with count 3–6 in active_skill (e201, e202, e203, ca01, ca02, ca03, cb01, cb02, cb03, cc01, cc02, cc03)
  - effect_keyword groups with cb03 etc.
  - player_buff groups with ca04, cb03, cc03
  - buff groups with e201, e202, ca01, cb01, cb02, cc01 etc.

Tracked anchors (e2xx, caxx, cbxx, ccxx) were found across the families, with e201/e202/e203 and ca02/ca03 being prominent in skill and buff-related payloads.

## Top repeated layouts

The groups dict shows repeated motif signatures combining marker patterns (0x12, 0x22, 0x3f, 07_03) with numeric layouts.

Examples of repeated motifs:
- "active_skill|ca03|0x3f:-264|0x3f:-264|0x12:-160|0x22:-80|0x22:-80|": 3
- "active_skill|ca02|0x22:-16|0x12:48|0x12:240|": 3
- "player_buff|cc03|0x22:-296|0x3f:-272|0x3f:-264|0x12:-264|0x12:-264|0.10@-137,0.10@-157,1.00@-267,0.10@-276": 6
- Several "buff|..." and "active_skill|..." with consistent 0x12 / 0x3f / 0x22 clusters around anchors.

Some groups also include numeric anchors in the key (e.g. 0.50@-255, 1.00@-273,0.75@-277), indicating repeated numeric layouts at stable relative offsets.

## Candidate tuple table

(Extracted from `candidate_tuples` in the JSON; using only neutral names. Only groups with repetition (count >= 2 in context) are highlighted.)

From the run, repeated layouts yielded candidate tuples with:
- Family, anchor, motif_signature (marker clusters), numeric_layout
- count (repetition)
- repeated_numerics: list of {"value": X, "rel_offset": Y, "count": Z}
- example_offsets
- confidence ("high"/"medium"/"low" based on repetition)
- sample_row_hex

Highlights from the data (examples of repeated numeric positions near anchors):
- In active_skill and player_buff: repeated 0.50, 1.00, 0.10, 0.75 at offsets like -273, -277, -249, -269 etc.
- Motifs often include 0x3f / 0x12 / 0x22 at multiples of ~8-32 bytes relative to the anchor.
- One example group had 0.10 and 1.00 repeating across 6 windows in player_buff family.

Full candidate_tuples array is in the JSON (neutral candidate_field_00 / candidate_numeric_00 style used in analysis).

## Examples for 202, 203, 204, 201

- 202 (e202 / ca02 / ca03): Present in active_skill (e.g. game_common_data_active_skill_data, character_active_skill_data) and buff_sub_tag files. Windows show the 96-prefixed blocks and repeated 0.5/1.0 numerics at consistent rel offsets (e.g. around -16 to +240 for markers).
- 203 (e203): Seen in active_skill groups with 0x12 clusters.
- 204: Less dominant in these specific limited files but pattern-matched in broader runs.
- 201 (e201): Appears in buff and active_skill groups with similar marker motifs (0x12:-256 etc.).

The windows frequently contain 96 10 / 96 05 near the anchors, and numeric values repeating across multiple rows/windows in the same family.

## Whether active_skill / effect_keyword tables share the combat_property_inner motif

Yes — several groups show the same core marker patterns (0x12, 0x22, 0x3f, 96_xx) and numeric repetition (0.50, 1.00, 0.10 etc.) as observed in the combat_property_inner_data reconstruction.

The 96-prefixed numeric blocks and relative marker spacing are consistent enough to suggest the property-registry motif is being used (or reused) inside the skill and keyword effect definition payloads. This supports the idea that combat_property_inner is the "registry" layer while these tables hold the mechanic-specific (keyword + constant) definitions.

Effect_keyword files had fewer but present hits (e.g. cb03 groups), often with shorter windows.

## Confidence levels

- High: Repetition of marker clusters (0x12/0x22/0x3f) and 0.5/1.0 numeric values at stable relative offsets in active_skill and player_buff families.
- Medium: Direct sharing of the combat_property_inner "96 10 a9 05 <anchor> + numeric block" structural motif.
- Low–Medium: Exact mapping to "mechanic coefficient" until more rows are delineated and cross-checked against game logic (Node*Attack.py etc.).
- All numerics here are labeled as candidate only.

## Recommended next decoder target

1. Take the strongest repeated motifs + numeric layouts from this run (especially those with count >=6 and repeated 0.50/1.00/0.10 at fixed rel offsets) and build a precise row template.
2. Apply the template to the full set of active_skill* and effect_keyword* raws (beyond the limited globs) plus more player_buff variants.
3. Extract full per-row (anchor_keyword, candidate_numeric_00 at rel_offset, candidate_field_XX) tuples.
4. Correlate the extracted constants with the tracked keywords (202=Burn etc.) and the ports in the OHEXTRACTDATA logic trees (attack_value, damage_amount/times/gap, use_final_dam_add_rate, keyword_proc_*, element_type, formula_attack_type).
5. Once a numeric value repeats at the *same* relative offset across 5+ rows with matching layout + keyword context in multiple tables, promote it as a candidate coefficient with high confidence.

JSON artifact: `data/research/bindict_decode/combat_template_application/combat_template_application.json`

All findings are candidate research evidence only. No claims of confirmed coefficients or production schemas. Exact offsets and hex are preserved in the JSON. Evidence first.