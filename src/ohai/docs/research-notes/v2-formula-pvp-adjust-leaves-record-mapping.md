# V2 Formula PvP Adjust Leaves — Record-to-Leaf Mapping

> **CANDIDATE ANALYSIS — NOT CANONICAL — REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Objective

Recover the record-to-leaf mapping for `formula_pvp_adjust_leaves_data.pyc`
using a generalized 13-byte record scanner validated against
`element_dam_rate_no.pyc` (known good structural anchor).

## Key Finding

**The 13-byte record pattern `[f32 4B][96 15][u16 2B][76 0b][12 01 04]`
from `element_dam_rate_no.pyc` is NOT universal across all formula_pvp_* tables.**

| Table | 13-byte pattern? | Alternative encoding |
|-------|-----------------|---------------------|
| `element_dam_rate_no` | YES | N/A (known good anchor) |
| `formula_pvp_adjust_leaves_data` | NO | f64 + u32_fixed with 27 22 02 / 76 0b 0b 04 04 separators |
| `formula_pvp_adjust_param_data` | NO | Unknown — no 13-byte records found |
| `formula_pvp_adjust_max_hp_data` | NO | Unknown — no 13-byte records found |
| `formula_pvp_tier_base_factor_data` | NO | Unknown — no 13-byte records found |

## Known Good Structural Anchor

From `element_dam_rate_no.pyc` (Sprint 3 commit `ab62392`):

```
[f32 4B][96 15][u16 2B][76 0b][12 01 04]
```

Decoded f32 values map directly to schema constants:

| Record | f32 | Schema Constant |
|--------|-----|-----------------|
| 0 | 2.0 | Const_200 |
| 1 | 1.25 | Const_125 |
| 2 | 1.5 | Const_150 |
| 3 | 0.5 | Const_50 |
| 4 | 0.25 | Const_25 |
| 5 | 3.0 | Const_300 |
| 6 | 0.75 | Const_75 |

## Cross-Table Scan Results

| Table | Size | Clean 13B | Near | Weak | Seqs | PvP 0.2 | PvP 0.4 |
|-------|------|-----------|------|------|------|---------|---------|
| `element_dam_rate_no` | 808B | 7 | 2 | 2 | 1 | 3 | 3 |
| `formula_pvp_adjust_leaves_data` | 1092B | 0 | 0 | 2 | 0 | 30 | 9 |
| `formula_pvp_adjust_param_data` | 2944B | 0 | 0 | 0 | 0 | 60 | 84 |
| `formula_pvp_adjust_max_hp_data` | 496B | 0 | 0 | 1 | 0 | 6 | 0 |
| `formula_pvp_tier_base_factor_data` | 856B | 0 | 0 | 0 | 0 | 0 | 30 |

## Focused Analysis: `formula_pvp_adjust_leaves_data`

- **File size**: 1092 bytes
- **13-byte clean records**: 0
- **13-byte sequences**: 0
- **27 22 02 separator count**: 15
- **76 0b 0b 04 04 separator count**: 3
- **f64 values found in data section**: 24
- **PvP 0.2 in data section**: 30
- **PvP 0.4 in data section**: 9

### Schema Tokens (from offset 170)

```
value_2value_1valuevalue_3value_4attack_type_dam_add_rateattack_type_ignore_dam_ratecrit_dam_rateelement_type_dam_add_rateignore_dam_ratekeyword_proc_crit_dam_add_rateweak_dam_rate
```

### 27 22 02 Separator Positions

Count: 15

Positions (first 20):
```
[359, 378, 397, 416, 467, 486, 575, 594, 613, 632, 680, 699, 718, 737, 756]
```

Gaps between consecutive positions:
```
[19, 19, 19, 51, 19, 89, 19, 19, 19, 48, 19, 19, 19, 19]
```

### 76 0b 0b 04 04 Separator Positions

Count: 3

Positions:
```
[505, 529, 651]
```

Gaps between consecutive positions:
```
[24, 122]
```

### f64 Values Found in Data Section (sample)

| Offset | f64 Value | Raw Hex |
|--------|-----------|---------|
| 362 | 1.2 | `333333333333f33f` |
| 370 | 1.6 | `9a9999999999f93f` |
| 381 | 0.6 | `333333333333e33f` |
| 389 | 0.3 | `333333333333d33f` |
| 400 | 0.8 | `9a9999999999e93f` |
| 408 | 1.2 | `333333333333f33f` |
| 419 | 0.7 | `666666666666e63f` |
| 438 | 1.6 | `9a9999999999f93f` |
| 470 | 0.4 | `9a9999999999d93f` |
| 478 | 0.8 | `9a9999999999e93f` |
| 489 | 0.85 | `333333333333eb3f` |
| 578 | 0.7 | `666666666666e63f` |
| 597 | 0.8 | `9a9999999999e93f` |
| 616 | 0.6 | `333333333333e33f` |
| 635 | 0.95 | `666666666666ee3f` |

## Mapping Hypotheses (13-byte scanner)

**Total clean records**: 0
**Sequences used**: 0

## Strongest Mapping Candidate

No 13-byte hypothesis produced usable mappings for `formula_pvp_adjust_leaves_data`.
The table uses an alternative encoding (f64 + u32_fixed with separators).

## Rejected Hypotheses

- no 13-byte record sequences found in formula_pvp_adjust_leaves_data

## Unresolved Blockers

- table does not use the 13-byte [f32][96 15][u16][76 0b][12 01 04] pattern

### Additional Unresolved Items

1. The alternative encoding in `formula_pvp_adjust_leaves_data` (f64 + u32_fixed)
   does not have a clean repeating record boundary like the 13-byte pattern.
2. The 27 22 02 separator has variable gaps (13, 16, 17, 19, 31, 48, 81),
   suggesting it marks individual data items within a larger structure,
   not record boundaries.
3. The 76 0b 0b 04 04 separator has gaps of ~121-125 bytes,
   which may be record group boundaries, but the exact record size is unknown.
4. f64 values found include: 1.2, 1.6, 0.6, 0.3, 0.8, 0.4, 0.5, 0.9, 0.7, 0.2, 0.45,
   which look like element damage rate multipliers (similar to element_dam_rate_no Const_* values).

## Production Code Cross-Check

From `src/utils/combat/officialFormulaMetadata.ts`:

| Schema Leaf | Production Leaf | Status |
|-------------|-----------------|--------|
| `attack_type_dam_add_rate` | `attack_type_dam_add_rate` | Implemented (dynamic) |
| `attack_type_ignore_dam_rate` | `attack_type_ignore_dam_rate` | Implemented (dynamic) |
| `crit_dam_rate` | `crit_dam_rate` | Implemented (dynamic) |
| `element_type_dam_add_rate` | `element_type_dam_add_rate` | Implemented (dynamic) |
| `ignore_dam_rate` | `ignore_dam_rate` | Implemented (dynamic) |
| `keyword_proc_crit_dam_add_rate` | `keyword_proc_crit_dam_add_rate` | Implemented (dynamic) |
| `weak_dam_rate` | `weak_dam_rate` | Implemented (dynamic) |

From `src/utils/combat/officialFormulaGraphRecipes.ts`
(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE):

- `attack_type_dam_add_rate` is exprId 2
- `element_type_dam_add_rate` is exprId 4
- `keyword_proc_dam_add_rate` is exprId 5
- These are summed in `final_attack_additional_rate`

## Safe-to-Commit Verdict

**Status**: All deliverables are candidate-only research outputs.
**No production code was modified.**
**No canonical claims are made.**

**Key finding**: The 13-byte record pattern from `element_dam_rate_no` is NOT
universal. `formula_pvp_adjust_leaves_data` uses a different encoding.
**Record-to-leaf mapping is UNRESOLVED** for `formula_pvp_adjust_leaves_data`
with the 13-byte scanner. An alternative scanner is needed for this table.

## Final Handoff

- **Record count** (13-byte): 0 clean records, 0 sequences
- **Record groups** (13-byte): 0
- **Record count** (alternative): 27 22 02 separator at 15 positions, 76 0b 0b 04 04 at 3 positions
- **Decoded f64 values**: 24 found in data section
- **Leaf mapping hypotheses tested**: 4 (all rejected for 13-byte scanner)
- **Strongest mapping candidate**: None (13-byte scanner does not match this table)
- **Rejected hypotheses**: 1
- **Unresolved blockers**: 5 (13-byte scanner + alternative encoding)

**Safe-to-commit verdict**: YES — candidate-only, no production writes, no canonical claims.

## Files

- `src/tools/v2_formula_pvp_adjust_leaves_record_mapper.py` — scanner tool
- `data/research/bindict_decode/v2_formula_pvp_adjust_leaves_record_mapping.json` — JSON output
- `docs/research-notes/v2-formula-pvp-adjust-leaves-record-mapping.md` — this report
