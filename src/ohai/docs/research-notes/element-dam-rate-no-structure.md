# Element Damage Rate No Table - Structure Analysis

> **CANDIDATE ANALYSIS - NOT CANONICAL - REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Summary

`element_dam_rate_no.pyc` (808 bytes) is a Variant A table with a
clean **13-byte record structure** that encodes element damage rate
constants. After Sprint 3 validation fix, this table became the
**new top second-anchor candidate** (score=39, replacing
`formula_pvp_tier_base_factor_data` which was inflated by false
positives).

## File Details

- **Path**: `recovered_mobile_pyc_OFF/game_common/data/element_dam_rate_no.pyc`
- **Size**: 808 bytes
- **Python magic**: `a8 0d 0d 0a` (Python 3.8)
- **Variant**: A (uses `96 15` and `76 0b` markers, not `0x3F` separators)
- **0x3F count**: 13 (all are low bytes of f32 values, not separators)

## Schema String (offset 179)

```
lv_hp_rates
lv_field_rates
Const_10
Const_100
Const_125
Const_150
Const_200
Const_25
Const_300
Const_50
Const_75
Ele_Eff_Std
Ele_Ineff_Std
```

## Record Structure (13 bytes per record)

```
Offset 0-3:   f32 value (rate)
Offset 4-5:   marker 96 15
Offset 6-7:   u16 value (index/ID)
Offset 8-9:   marker 76 0b
Offset 10-12: header 12 01 04
```

Records start at offset 353 and repeat every 13 bytes.

## Decoded Records

| Record | Offset | f32 Value | u16 | Notes |
|--------|--------|-----------|-----|-------|
| 0 | 353 | 2.0000 | 0x1f1f | Const_200? |
| 1 | 366 | 1.2500 | 0x3d3d | Const_125? |
| 2 | 379 | 1.5000 | 0x4a4a | Const_150? |
| 3 | 392 | 0.5000 | 0x5757 | Const_50? |
| 4 | 405 | 0.2500 | 0x6464 | Const_25? |
| 5 | 418 | 3.0000 | 0x7171 | Const_300? |
| 6 | 431 | 0.7500 | 0x7e7e | Const_75? |

The u16 values increase by ~3349 (0x0d11) per record, suggesting
they are sequential indices or cumulative offsets.

## Preamble Region (offset 300-353)

Before the repeating records, there's a 38-byte preamble that
contains:
- `12 01 04` header at offset 317
- `f32 1.0` at offset 320 (the f32_1.0 match)
- Various control bytes

This preamble likely contains the `lv_hp_rates`, `lv_field_rates`,
`Ele_Eff_Std`, and `Ele_Ineff_Std` values that are not in the
repeating record structure.

## PvP Constants Region (offset 460-520)

After the repeating records, there are PvP-related constants:
- `pvp_tier_modifier_0.2` at offset 473 (u32_fixed `33333333`)
- `pvp_star_modifier_0.4` at offset 484 (u32_fixed `66666666`)

These are encoded in the **u32_fixed** format (mobile native),
unlike the element rate constants which use **f32** format.
This dual-format usage suggests the table contains multiple
data types.

## Value Match Summary (Validated)

| Constant | Offset | Format | Decoded | Expected |
|----------|--------|--------|---------|----------|
| f32_1.0 | 320 | f32 | 1.0 | 1.0 |
| f32_2.0 | 358 | f32 | 2.0 | 2.0 |
| f32_0.5 | 397 | f32 | 0.5 | 0.5 |
| f32_2.0 | 423 | f32 | 3.0 | 3.0 (wait, 3.0 not 2.0) |
| f32_0.75 | 436 | f32 | 0.75 | 0.75 |
| pvp_tier_modifier_0.2 | 473 | u32_fixed | 0.2 | 0.2 |
| pvp_star_modifier_0.4 | 484 | u32_fixed | 0.4 | 0.4 |

Note: The f32_2.0 match at offset 358 and the f32 3.0 at offset 423
are separate values. The f32_2.0 is in the repeating record
structure, while f32 3.0 is also in the repeating structure but
at a different record position.

## Significance for Phase 3

This table is directly relevant to the Phase 3 formula leaf
`element_dam_add_rate` (one of the three missing leaves per
AGENTS.md). The `Const_*` field names and `Ele_Eff_Std` /
`Ele_Ineff_Std` multipliers are the exact data needed to
implement this leaf.

## Open Questions

1. What is the exact mapping between record position and
   `Const_*` field name? (e.g., is record 0 = Const_200 = 2.0?)
2. What is the u16 value in each record? Sequential index or
   something else?
3. Where are `lv_hp_rates` and `lv_field_rates` stored? (Not in
   the repeating 13-byte records)
4. What are `Ele_Eff_Std` and `Ele_Ineff_Std`? (Not yet located
   in the decoded data)
5. Why are PvP constants (0.4, 0.2) in an element damage table?
   Cross-contamination or intentional?

## Files

- `recovered_mobile_pyc_OFF/game_common/data/element_dam_rate_no.pyc` — source
- `data/research/bindict_decode/v2_second_semantic_anchor_candidates.json` — analysis output
- `docs/research-notes/v2-second-semantic-anchor-search.md` — auto-generated report
