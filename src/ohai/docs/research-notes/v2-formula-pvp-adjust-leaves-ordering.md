# V2 Formula PvP Adjust Leaves — Value Ordering & Matrix Reconstruction

> **CANDIDATE ANALYSIS — NOT CANONICAL — REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Objective

Reconstruct value ordering and candidate row/column structure for
`formula_pvp_adjust_leaves_data` using the extracted value list from
the previous sprint (commit 65111ae). No new values are extracted;
only the existing 32 f64 and 102 u32_fixed values are reordered and
tested against candidate table shapes.

## Ordered f64 Values by Group

**Total f64 values**: 32

| Group | Offset | f64 Value | Confidence |
|-------|--------|-----------|------------|
| 0 | 362 | 1.2 | MEDIUM |
| 0 | 370 | 1.6 | MEDIUM |
| 0 | 381 | 0.6 | MEDIUM |
| 0 | 389 | 0.3 | MEDIUM |
| 0 | 400 | 0.8 | MEDIUM |
| 0 | 408 | 1.2 | MEDIUM |
| 0 | 419 | 0.7 | MEDIUM |
| 0 | 427 | 0.18 | MEDIUM |
| 0 | 438 | 1.6 | MEDIUM |
| 0 | 459 | 0.46 | MEDIUM |
| 0 | 470 | 0.4 | MEDIUM |
| 0 | 478 | 0.8 | MEDIUM |
| 0 | 489 | 0.85 | MEDIUM |
| 0 | 497 | 0.06 | LOW |
| 2 | 578 | 0.7 | MEDIUM |
| 2 | 586 | 0.26 | MEDIUM |
| 2 | 597 | 0.8 | MEDIUM |
| 2 | 605 | 0.14 | MEDIUM |
| 2 | 616 | 0.6 | MEDIUM |
| 2 | 624 | 0.42 | MEDIUM |
| 2 | 635 | 0.95 | MEDIUM |
| 2 | 643 | 0.02 | LOW |
| 3 | 683 | 0.2 | MEDIUM |
| 3 | 691 | 0.3 | MEDIUM |
| 3 | 702 | 0.4 | MEDIUM |
| 3 | 710 | 0.6 | MEDIUM |
| 3 | 721 | 0.8 | MEDIUM |
| 3 | 729 | 0.06 | LOW |
| 3 | 740 | 0.6 | MEDIUM |
| 3 | 748 | 0.9 | MEDIUM |
| 3 | 759 | 0.3 | MEDIUM |
| 3 | 767 | 0.4 | MEDIUM |

## Group Summary

**Group 0**: 14 f64 values

```
  offset 362: 1.2
  offset 370: 1.6
  offset 381: 0.6
  offset 389: 0.3
  offset 400: 0.8
  offset 408: 1.2
  offset 419: 0.7
  offset 427: 0.18
  offset 438: 1.6
  offset 459: 0.46
  offset 470: 0.4
  offset 478: 0.8
  offset 489: 0.85
  offset 497: 0.06
```

**Group 2**: 8 f64 values

```
  offset 578: 0.7
  offset 586: 0.26
  offset 597: 0.8
  offset 605: 0.14
  offset 616: 0.6
  offset 624: 0.42
  offset 635: 0.95
  offset 643: 0.02
```

**Group 3**: 10 f64 values

```
  offset 683: 0.2
  offset 691: 0.3
  offset 702: 0.4
  offset 710: 0.6
  offset 721: 0.8
  offset 729: 0.06
  offset 740: 0.6
  offset 748: 0.9
  offset 759: 0.3
  offset 767: 0.4
```

## Candidate Shapes Tested

| Shape | Total | Matches Count | Confidence | Reason |
|-------|-------|---------------|------------|--------|
| 4x8 | 32 | True | LOW | shape 4x8 matches count but row count does not align with gr |
| 8x4 | 32 | True | LOW | shape 8x4 matches count but row count does not align with gr |
| 16x2 | 32 | True | LOW | shape 16x2 matches count but row count does not align with g |
| 2x16 | 32 | True | LOW | shape 2x16 matches count but row count does not align with g |
| 7x5 | 35 | False | REJECTED | shape 7x5=35 does not match 32 f64 values |
| 5x7 | 35 | False | REJECTED | shape 5x7=35 does not match 32 f64 values |
| 12x3 | 36 | False | REJECTED | shape 12x3=36 does not match 32 f64 values |
| 15x2 | 30 | False | REJECTED | shape 15x2=30 does not match 32 f64 values |
| 15x3 | 45 | False | REJECTED | shape 15x3=45 does not match 32 f64 values |

## Best Matrices

### Shape 4x8 (LOW)

**Value matrix**:

| Row | Col 0 | Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 |
|-----|---|---|---|---|---|---|---|---|
| 0 | 1.2 | 1.6 | 0.6 | 0.3 | 0.8 | 1.2 | 0.7 | 0.18 |
| 1 | 1.6 | 0.46 | 0.4 | 0.8 | 0.85 | 0.06 | 0.7 | 0.26 |
| 2 | 0.8 | 0.14 | 0.6 | 0.42 | 0.95 | 0.02 | 0.2 | 0.3 |
| 3 | 0.4 | 0.6 | 0.8 | 0.06 | 0.6 | 0.9 | 0.3 | 0.4 |

**Reason**: shape 4x8 matches count but row count does not align with groups [14, 0, 8, 10]

### Shape 8x4 (LOW)

**Value matrix**:

| Row | Col 0 | Col 1 | Col 2 | Col 3 |
|-----|---|---|---|---|
| 0 | 1.2 | 1.6 | 0.6 | 0.3 |
| 1 | 0.8 | 1.2 | 0.7 | 0.18 |
| 2 | 1.6 | 0.46 | 0.4 | 0.8 |
| 3 | 0.85 | 0.06 | 0.7 | 0.26 |
| 4 | 0.8 | 0.14 | 0.6 | 0.42 |
| 5 | 0.95 | 0.02 | 0.2 | 0.3 |
| 6 | 0.4 | 0.6 | 0.8 | 0.06 |
| 7 | 0.6 | 0.9 | 0.3 | 0.4 |

**Reason**: shape 8x4 matches count but row count does not align with groups [14, 0, 8, 10]

### Shape 16x2 (LOW)

**Value matrix**:

| Row | Col 0 | Col 1 |
|-----|---|---|
| 0 | 1.2 | 1.6 |
| 1 | 0.6 | 0.3 |
| 2 | 0.8 | 1.2 |
| 3 | 0.7 | 0.18 |
| 4 | 1.6 | 0.46 |
| 5 | 0.4 | 0.8 |
| 6 | 0.85 | 0.06 |
| 7 | 0.7 | 0.26 |
| 8 | 0.8 | 0.14 |
| 9 | 0.6 | 0.42 |
| 10 | 0.95 | 0.02 |
| 11 | 0.2 | 0.3 |
| 12 | 0.4 | 0.6 |
| 13 | 0.8 | 0.06 |
| 14 | 0.6 | 0.9 |
| 15 | 0.3 | 0.4 |

**Reason**: shape 16x2 matches count but row count does not align with groups [14, 0, 8, 10]

### Shape 2x16 (LOW)

**Value matrix**:

| Row | Col 0 | Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 | Col 9 | Col 10 | Col 11 | Col 12 | Col 13 | Col 14 | Col 15 |
|-----|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1.2 | 1.6 | 0.6 | 0.3 | 0.8 | 1.2 | 0.7 | 0.18 | 1.6 | 0.46 | 0.4 | 0.8 | 0.85 | 0.06 | 0.7 | 0.26 |
| 1 | 0.8 | 0.14 | 0.6 | 0.42 | 0.95 | 0.02 | 0.2 | 0.3 | 0.4 | 0.6 | 0.8 | 0.06 | 0.6 | 0.9 | 0.3 | 0.4 |

**Reason**: shape 2x16 matches count but row count does not align with groups [14, 0, 8, 10]

## Marker Analysis (27 22 02)

**Total markers**: 15

### Per-Record f64 Counts

| Record | Marker Offset | Gap to Next | f64 Count | f64 Values |
|--------|---------------|-------------|-----------|------------|
| 0 | 359 | 19 | 2 | 1.2, 1.6 |
| 1 | 378 | 19 | 2 | 0.6, 0.3 |
| 2 | 397 | 19 | 2 | 0.8, 1.2 |
| 3 | 416 | 51 | 4 | 0.7, 0.18, 1.6, 0.46 |
| 4 | 467 | 19 | 2 | 0.4, 0.8 |
| 5 | 486 | 89 | 2 | 0.85, 0.06 |
| 6 | 575 | 19 | 2 | 0.7, 0.26 |
| 7 | 594 | 19 | 2 | 0.8, 0.14 |
| 8 | 613 | 19 | 2 | 0.6, 0.42 |
| 9 | 632 | 48 | 2 | 0.95, 0.02 |
| 10 | 680 | 19 | 2 | 0.2, 0.3 |
| 11 | 699 | 19 | 2 | 0.4, 0.6 |
| 12 | 718 | 19 | 2 | 0.8, 0.06 |
| 13 | 737 | 19 | 2 | 0.6, 0.9 |
| 14 | 756 | None | 2 | 0.3, 0.4 |

**f64 count stats**: min=2, max=4, mean=2.13

**Gap stats**: min=19, max=89, mean=28.36, unique=[19, 48, 51, 89]

## u32_fixed Analysis

**Total u32_fixed in data section**: 62

**Value distribution**:

| Decoded Value | Count |
|---------------|-------|
| 0.2 | 30 |
| 0.246094 | 1 |
| 0.248047 | 1 |
| 0.4 | 9 |
| 0.6 | 20 |
| 0.8 | 1 |

## f64 Value Distribution (Candidate PvP Meanings)

| Category | Count | Values |
|----------|-------|--------|
| multipliers_around_1 | 11 | 1.2@362, 1.6@370, 0.8@400, 1.2@408, 1.6@438, 0.8@478, 0.85@489, 0.8@597, 0.95@635, 0.8@721, 0.9@748 |
| reduction_factors | 6 | 0.18@427, 0.06@497, 0.14@605, 0.02@643, 0.2@683, 0.06@729 |
| mid_factors | 15 | 0.6@381, 0.3@389, 0.7@419, 0.46@459, 0.4@470, 0.7@578, 0.26@586, 0.6@616, 0.42@624, 0.3@691, 0.4@702, 0.6@710, 0.6@740, 0.3@759, 0.4@767 |
| other | 0 |  |

## Schema Alignment Attempts

| Alignment | Verdict |
|-----------|---------|
| 12_fields_x_something | 32 / 12 = 2.6667 (not integer) |
| 7_leaves_x_something | 32 / 7 = 4.5714 (not integer) |
| 5_generics_x_something | 32 / 5 = 6.4000 (not integer) |

**Possible factorizations of 32**:

- 32 / 8 = 4 (integer)
- 32 / 16 = 2 (integer)

## Ranked Hypothesis Report

### #1: Shape 4x8 (LOW)

- **Matches count**: True
- **Reason**: shape 4x8 matches count but row count does not align with groups [14, 0, 8, 10]

### #2: Shape 8x4 (LOW)

- **Matches count**: True
- **Reason**: shape 8x4 matches count but row count does not align with groups [14, 0, 8, 10]

### #3: Shape 16x2 (LOW)

- **Matches count**: True
- **Reason**: shape 16x2 matches count but row count does not align with groups [14, 0, 8, 10]

### #4: Shape 2x16 (LOW)

- **Matches count**: True
- **Reason**: shape 2x16 matches count but row count does not align with groups [14, 0, 8, 10]

### #5: Shape 15x2 (REJECTED)

- **Matches count**: False
- **Reason**: shape 15x2=30 does not match 32 f64 values

### #6: Shape 7x5 (REJECTED)

- **Matches count**: False
- **Reason**: shape 7x5=35 does not match 32 f64 values

### #7: Shape 5x7 (REJECTED)

- **Matches count**: False
- **Reason**: shape 5x7=35 does not match 32 f64 values

### #8: Shape 12x3 (REJECTED)

- **Matches count**: False
- **Reason**: shape 12x3=36 does not match 32 f64 values

### #9: Shape 15x3 (REJECTED)

- **Matches count**: False
- **Reason**: shape 15x3=45 does not match 32 f64 values

## Rejected Hypotheses

- **Shape 7x5**: shape 7x5=35 does not match 32 f64 values
- **Shape 5x7**: shape 5x7=35 does not match 32 f64 values
- **Shape 12x3**: shape 12x3=36 does not match 32 f64 values
- **Shape 15x2**: shape 15x2=30 does not match 32 f64 values
- **Shape 15x3**: shape 15x3=45 does not match 32 f64 values

## Blockers

1. **No clean row/column alignment with schema**: 32 f64 values do not
   divide evenly by 7 (leaves), 5 (generics), or 12 (total schema fields).
2. **Marker records are variable-length**: Most have 2 f64 values, but
   some have 0 or 1, and gaps are variable (19, 48, 51, 89).
3. **u32_fixed values are sparse**: Only 4 unique clean patterns
   (0.2, 0.4, 0.6, 0.8), and their semantic role is unknown.
4. **No production code reference for row/column layout**:
   The 7 Phase 3 leaf names are present in the schema string, but
   there is no byte-level evidence for which f64 value belongs
   to which leaf or which column.
5. **f64 values are not 8-byte aligned**: They appear at arbitrary
   offsets, making matrix layout uncertain.

## Safe-to-Commit Verdict

**Status**: All deliverables are candidate-only research outputs.
**No production code was modified.**
**No canonical mapping claims are made.**
**No new values were extracted** — only the existing 32 f64 values
from the previous sprint were reordered and tested.

## Final Handoff

- **Ordered f64 values by group**: 32 values across 3 groups
- **Candidate matrices tested**: 9
- **Matrices that match count**: 4
- **Best row/column hypothesis**: Shape 4x8 (LOW)
- **Marker alignment**: 15 markers, variable f64 counts per record
- **u32_fixed relationship**: 62 values, 4 unique patterns
- **Rejected hypotheses**: 5
- **Blockers**: 5

**Safe-to-commit verdict**: YES — candidate-only, no production writes, no canonical claims.

## Files

- `src/tools/v2_reconstruct_formula_pvp_adjust_leaves_order.py` — reconstruction tool
- `data/research/bindict_decode/v2_formula_pvp_adjust_leaves_ordering.json` — JSON output
- `docs/research-notes/v2-formula-pvp-adjust-leaves-ordering.md` — this report
