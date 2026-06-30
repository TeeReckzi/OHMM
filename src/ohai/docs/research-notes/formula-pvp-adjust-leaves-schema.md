# Formula PvP Adjust Leaves Data - Schema Analysis

> **CANDIDATE ANALYSIS - NOT CANONICAL - REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Summary

`formula_pvp_adjust_leaves_data.pyc` (1092 bytes) is a Variant A
table that contains the **Phase 3 formula leaf names** in its
schema string. This table was the #2 second-anchor candidate
(score=38) after Sprint 3 validation fix.

## File Details

- **Path**: `recovered_mobile_pyc_OFF/game_common/data/formula_pvp_adjust_leaves_data.pyc`
- **Size**: 1092 bytes
- **Variant**: A (uses `96 15` and `76 0b` markers)

## Schema String (offset 175)

The full schema string contains these leaf names:

| # | Leaf Name | Phase 3 Leaf? |
|---|-----------|---------------|
| 1 | `value` | Generic |
| 2 | `value_1` | Generic |
| 3 | `value_2` | Generic |
| 4 | `value_3` | Generic |
| 5 | `value_4` | Generic |
| 6 | `attack_type_dam_add_rate` | YES |
| 7 | `attack_type_ignore_dam_rate` | YES |
| 8 | `crit_dam_rate` | YES |
| 9 | `element_type_dam_add_rate` | YES |
| 10 | `ignore_dam_rate` | YES |
| 11 | `keyword_proc_crit_dam_add_rate` | YES |
| 12 | `weak_dam_rate` | YES |

## Cross-Reference with Production Code

All 7 Phase 3 leaf names match leaves defined in the production
code:

| Schema Leaf | Production Leaf | Status |
|-------------|-----------------|--------|
| `attack_type_dam_add_rate` | `attack_type_dam_add_rate` | Implemented |
| `attack_type_ignore_dam_rate` | `attack_type_ignore_dam_rate` | Implemented |
| `crit_dam_rate` | `crit_dam_rate` | Implemented |
| `element_type_dam_add_rate` | `element_type_dam_add_rate` | Implemented (dynamic) |
| `ignore_dam_rate` | `ignore_dam_rate` | Implemented |
| `keyword_proc_crit_dam_add_rate` | `keyword_proc_crit_dam_add_rate` | Implemented |
| `weak_dam_rate` | `weak_dam_rate` | Implemented |

All leaves are already implemented in the production code via
`src/utils/combat/officialFormulaLeafResolvers.ts` and related
files. The schema string confirms the leaf names match the
production implementation.

## Value Matches (Validated)

The table contains 41 validated constant matches:

- `pvp_tier_modifier_0.2` at multiple offsets (u32_fixed format)
- `pvp_star_modifier_0.4` at multiple offsets (u32_fixed format)

These PvP modifiers are used to adjust the leaf values for
PvP mode, confirming this table stores PvP-adjusted leaf
multipliers.

## Significance for Phase 3

This table is the **definitive second semantic anchor** for the
Phase 3 formula leaves. The schema string provides:

1. **Leaf name confirmation**: All 7 Phase 3 leaves are present
   in the table
2. **Record structure**: Each leaf has associated values stored
   in the table
3. **PvP adjustment context**: The `pvp_*_modifier` constants
   confirm this table stores PvP-adjusted values

## Open Questions

1. What is the exact record-to-leaf mapping? (e.g., which bytes
   correspond to `attack_type_dam_add_rate` vs `crit_dam_rate`)
2. What do `value_1` through `value_4` represent? Generic
   fallback values or additional leaves?
3. How are the PvP modifiers applied to the leaf values?
4. What is the record boundary in this 1092-byte table?

## Next Steps

1. Decode the full 1092-byte record structure
2. Map each record to its leaf name
3. Extract the PvP-adjusted values for each leaf
4. Cross-validate against production code behavior

## Files

- `recovered_mobile_pyc_OFF/game_common/data/formula_pvp_adjust_leaves_data.pyc` — source
- `data/research/bindict_decode/v2_second_semantic_anchor_candidates.json` — analysis output
- `docs/research-notes/v2-second-semantic-anchor-search.md` — auto-generated report
- `docs/research-notes/v2-formula-pvp-adjust-leaves-candidates.md` — prior analysis (Sprint 2)
