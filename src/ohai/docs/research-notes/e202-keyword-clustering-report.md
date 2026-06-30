# e202 / ca0x Keyword Clustering Report

**Date:** 2026-06
**Status:** Research-only. Evidence from real recovered .raw payloads (post-inventory names).

**Scope:** Dedicated byte-pattern clustering for:
e202, ca02, ca03, ca01, ca00, cb02, cc02, c902

**Prioritized files** (from real-table scan + full-table-inventory.md):
- game_common_data_combat_property_inner_data.py.const_2.raw (dominant)
- game_common_data_*_active_skill*.raw variants
- client_data_effect_keyword_* .raw + game_common effect_keyword variants
- game_common_data_behavior_player_buff* and buff_sub_tag variants

**Method:** Direct byte search on the .raw payloads (no reliance on old assumed module names). For each hit: absolute offset, 256-byte window (centered), nearby numeric anchors (the 14 requested values), nearby separators/markers (96 05, 96 10, 76 0b, 12, 22, 3f, 07 03), motif signature.

## Summary

- Total clusters captured (capped at ~120 for practicality): 121
- Overwhelming majority from the large combat_property_inner_data .raw (2.4 MB).
- Strong repeating motif: `96 10 a9 05 e202` (or ca02/ca03 variants) followed by f32/f64 blocks (commonly 0.5), more 96-prefixed values, and u16/u32-like fields.
- 202 (e202 / ca02) hits frequently co-locate with 0.5 floats and the v2 markers (96 10, 0x22, 0x3f).
- Layout repeats across hundreds of offsets in the combat_property file, suggesting a regular record or chunk structure.
- Smaller but present hits in active_skill and effect_keyword .raw (lower volume, still useful for cross-check).

This is the highest-signal structured sequence observed so far for the tracked keywords (far stronger than isolated 0xca).

## Detailed Clusters (representative examples)

### From combat_property_inner_data (game_common_data_combat_property_inner_data.py.const_2.raw)

**Cluster 1**
- file: data/research/bindict_extracted/game_common_data_combat_property_inner_data.py.const_2.raw
- table: game_common_data_combat_property_inner_data
- pattern: e202
- abs_offset: 889
- local_chunk_offset: 64
- nearby_floats: [0.5, 0.5]
- nearby_markers: ['96_10', '0x12', '0x22', '0x3f']
- window_hex (first 256 chars): 0000000064280002010086080108040000c64216000000410000003f86080a9610a004f90df90d0f039610a905d406f607f0af0df0af0daf01c31c269610a905e202f005e8f309e8f30938a8112c9610b9058701d401fa0e96348a430aab032e9688011de49ff71c666666666666344001020014ae47e17a543d4000002818030100da320304047b14ae47e17ae43f54000080400000003fda32019610a100cf0adbb264f0b2cd034c9610a905e60bca1792a820889e12a017c011229688011bd49ff7110000000001010000000000006428000101009a030001049a9999999999d93f...
- motif signature: 96 10 a9 05 e202 + f64(0.5) + 96 10 blocks + 0x22/0x3f

**Cluster 2**
- file: ...combat_property_inner_data.py.const_2.raw
- pattern: e202
- abs_offset: 51575
- nearby_floats: [0.5]
- nearby_markers: ['96_10', '0x22', '0x3f']
- window (excerpt): ...9688011de49ff7d90252b81e85eb512040010100f9a067b3ea73274000002810020100d00f0315049a9999999999d93f200000a8410000003fd00f059610a905e20211fa10fa101722069610a904f8198007adcc05adcc05cd0a2f9610b90471b001bd07e22f9c37d7022b9610a1008f1ac0cfad02c0cfad023e9610a905e00127ee09ee091632159610a905f50214ce13ce131b27089610a0042c2c9401209610a9044878e223e223d601259610a905ad05f8039ada079ada078d01b10b1b9610a9058f06478a588a58d201e0011d9610a905fe0216f814f8141d29099610a105bf02ccb81fccb81f3dba07179688011de49ff72f6666666666661440010100...
- motif: repeated e202 inside 96 10 a9 05 ... 96 10 sequences with 0.5 floats.

**Cluster 3**
- abs_offset: 61109
- pattern: e202
- nearby_floats: [0.5, 0.5]
- nearby_markers: ['96_10', '0x12', '0x22', '0x3f']
- window starts with a9 01 ... 96 10 a9 05 e202 c5ba06...

Multiple additional clusters (abs 78118, 111366, 127032, 138110, 144405, 160288, 198896, 207910, ...) show the **same core layout**:
- 96 10 a9 05 e202 (or ca02/ca03)
- followed by 1–3 f32/f64 values at 0.5 (and occasionally 0.12/0.04 candidates)
- interspersed 96 10 / 96 05 / 0x22 / 0x3f
- u16/u32 fields and more 96-prefixed blocks

This motif repeats with high regularity inside the combat_property_inner_data payload.

### From effect_keyword and active_skill families (smaller but confirmatory)

- client_data_effect_keyword_item_data.py.const_2.raw and game_common_data_effect_keyword_skin_data.py.const_2.raw: multiple e202 / ca02 hits in smaller records (payload ~1–10 KB). Often near 96 markers and low counts of 0.5/1.0 floats.
- game_common_data_active_skill_data.py.const_2.raw / character_active_skill_data: scattered 202 / e202 hits inside skill payloads. Lower density than combat_property but present with numeric anchors.
- behavior_player_buff variants (e.g. game_common_data_behavior_player_buff_XMLZ.py.const_3.raw): 202-adjacent patterns in buff delivery records.

## Motif Signature & Repetition

**Core repeating signature (combat_property_inner_data dominant):**

```
[96 10 a9 05] e202 [f64/f32 0.5 ...] [96 10 ...] [u16/u32 fields] [more 96 blocks + 0x22/0x3f]
```

- The e202 (or ca02/ca03) appears embedded after a 96 10 prefix, followed by floating-point property values.
- The same 20–40 byte motif (96 10 a9 05 e202 + 0.5 float + 96) recurs across dozens of offsets in the same file (hundreds of total 202-family hits).
- This is consistent with a "keyword + property bonus block" inside a larger v2 record or array-of-structs.

**Evidence strength:** High for the combat_property_inner_data table (volume + repetition + marker co-occurrence). Medium for skill/effect_keyword .raw (fewer hits, smaller files, but same patterns).

## Raw Hex Windows (additional selected examples)

(See the printed clusters above for full 256-byte windows. Key repeated fragment across many clusters:)

`9610a905e202f005e8f309e8f30938a8112c9610b9058701d401fa0e96348a430aab032e9688011de49ff71c6666666666663440...`

`9610a905e20211fa10fa101722069610a904f8198007adcc05...`

`96 10 a9 05 e202` + 0.5 (66 66 66 66 66 66 34 40) + more 96-prefixed data.

These windows also contain nearby 0.04 / 0.12 candidate floats in several cases.

## Recommendations / Next

1. Treat `game_common_data_combat_property_inner_data` (the 2.4 MB raw) as the primary source for property/keyword-bonus structures.
2. Use the repeated e202 + 96 10 motif as the anchor for row boundary recovery (fixed or variable stride around the 96 blocks).
3. Cross-reference the skill definition tables (active_skill_data etc.) and effect_keyword tables for the actual mechanic "definitions" that feed into the property registry.
4. Run the same clustering logic on any newly decoded active_skill / effect_keyword payloads.
5. Map the observed ports (attack_value, damage_*, element_type, keyword, use_final_*) from NodeAttack/NodeDurativeAttack.py onto these structures once rows are isolated.

All findings are raw byte evidence only. Row structure + game logic (OHEXTRACTDATA dcs_extend) + in-game validation required before any coefficient or schema claims.

**End of clustering report.** (Cites exact .raw paths under data/research/bindict_extracted/, absolute offsets, and hex windows as shown.)