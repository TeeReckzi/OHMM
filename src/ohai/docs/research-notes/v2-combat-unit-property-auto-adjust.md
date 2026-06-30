# V2 Combat Unit Property Auto-Adjust — Deep Extraction

> **CANDIDATE ANALYSIS — NOT CANONICAL — REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Objective

Deep extraction of `combat_unit_property_auto_adjust_data.pyc` (1080 bytes).
This table was identified by the V2 PYC table inventory as a
high-validation-likelihood candidate (anchor hits + semantic schema).

## Schema

Schema string found at offset 143.

Fields (in concatenation order):

- `unit_type`
- `attack`
- `max_hp`
- `team_member_num`

## Structure

Each record has the form:
```
27 01 02 01 01 0X 96 10 1a <f64_1:8B> <f64_2:8B>
^^^^^^^^^^^^^^^  ^   ^   ^  ^
header constant  |   |   length
                 |   marker (96 10)
                 record number (1-255)
```

Total bytes per record: 26

## Extracted Records

| # | Marker Offset | Length Byte | f64 #1 | f64 #2 | f64_1 Raw | f64_2 Raw |
|---|--------------|-------------|--------|--------|-----------|-----------|
| 0 | 211 | 26 | 1.15 | 1.6 | `666666666666f23f` | `9a9999999999f93f` |
| 1 | 238 | 37 | 0.007813 | -0.0 | `0000803f0000803f` | `0101270102010196` |
| 2 | 275 | 42 | 1.15 | 1.6 | `666666666666f23f` | `9a9999999999f93f` |
| 3 | 302 | 42 | 1.2 | 1.8 | `333333333333f33f` | `cdccccccccccfc3f` |
| 4 | 329 | 37 | 2.0 | -0.0 | `0000a03f00000040` | `0104270102010396` |
| 5 | 373 | 21 | 2.0 | -0.0 | `0000a03f00000040` | `0104270102020196` |
| 6 | 409 | 26 | 1.15 | 1.6 | `666666666666f23f` | `9a9999999999f93f` |
| 7 | 435 | 25 | 0.0 | 0.0 | `0000a03f33333333` | `3333034003042701` |
| 8 | 457 | 26 | 1.2 | 1.8 | `333333333333f33f` | `cdccccccccccfc3f` |
| 9 | 483 | 26 | 1.2 | 2.1 | `333333333333f33f` | `cdcccccccccc0040` |
| 10 | 509 | 21 | 2.0 | -0.0 | `0000a03f00000040` | `0204270102030196` |
| 11 | 545 | 26 | 1.15 | 1.7 | `666666666666f23f` | `333333333333fb3f` |
| 12 | 571 | 21 | 0.007813 | -0.0 | `0000803f0000803f` | `0501270102050296` |
| 13 | 615 | 26 | 1.2 | 1.8 | `333333333333f33f` | `cdccccccccccfc3f` |
| 14 | 641 | 21 | 2.0 | -0.0 | `0000a03f00000040` | `0504760b0b1495a9` |

## Attempted Field Attribution (Pairs)

Hypothesis: 2 records = 1 logical row, 4 fields per row.
Field assignment is **candidate-only** and needs in-game validation.

| Row | record# | unit_type | attack | max_hp | team_member_num |
|-----|---------|-----------|--------|--------|-----------------|
| 0 | 0,1 | 1.15 | 1.6 | 0.007813 | -0.0 |
| 1 | 2,3 | 1.15 | 1.6 | 1.2 | 1.8 |
| 2 | 4,5 | 2.0 | -0.0 | 2.0 | -0.0 |
| 3 | 6,7 | 1.15 | 1.6 | 0.0 | 0.0 |
| 4 | 8,9 | 1.2 | 1.8 | 1.2 | 2.1 |
| 5 | 10,11 | 2.0 | -0.0 | 1.15 | 1.7 |
| 6 | 12,13 | 0.007813 | -0.0 | 1.2 | 1.8 |

## Value Classification

- **Total f64 values**: 30
- **Unique values**: 9
- **Range**: [-0.0, 2.1]

### Top Values by Frequency

| Value | Count |
|-------|-------|
| -0.0 | 8 |
| 1.15 | 4 |
| 1.2 | 4 |
| 2.0 | 4 |
| 1.6 | 3 |
| 1.8 | 3 |
| 0.007813 | 2 |
| 2.1 | 1 |
| 1.7 | 1 |

## Blockers

1. **Field-to-value mapping is candidate-only.** The 4 schema
   fields are confirmed by string pool, but which f64 slot maps
   to which field is unknown without in-game testing.
2. **Record count vs. row count is ambiguous.** 18 records could
   be 18 rows of 2 fields, 9 rows of 4 fields, or another layout.
3. **No production code reference for this table.** The 4 field
   names don't directly match anything in the existing
   `officialFormula*` files.
4. **Some values repeat exactly (1.0, 1.6, 1.1, etc.)** which
   suggests they may be tier defaults rather than per-unit values.

## Safe-to-Commit Verdict

**Status**: All deliverables are candidate-only research.
**No production code modified.** No canonical mapping claims.
**No UI wiring attempted** (per agreed safe path).
