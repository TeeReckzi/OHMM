# V2 Formula PvP Adjust Leaves — Value Extraction (Values First)

> **CANDIDATE ANALYSIS — NOT CANONICAL — REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Objective

Extract actual numeric values from `formula_pvp_adjust_leaves_data`
using its f64/u32_fixed encoding. No leaf-name forcing — values first,
labels later.

## Excluded Ranges

- `.pyc` header: offsets 0–14
- Schema string pool: offsets 175–354
- Trailer/bytecode region: offsets 820–end

Data section: offsets 355–819 (465 bytes of numeric data)

## Marker Family Analysis

| Marker | Count | Min Gap | Max Gap | Mean Gap | Unique Gaps |
|--------|-------|---------|---------|----------|-------------|
| `27_22_02` | 15 | 19 | 89 | 28.36 | 19, 48, 51, 89 |
| `76_0b_0b_04_04` | 3 | 24 | 122 | 73.0 | 24, 122 |
| `96_15` | 0 | None | None | None | — |
| `76_0b` | 5 | 20 | 124 | 72.5 | 20, 24, 122, 124 |
| `12_01_04` | 0 | None | None | None | — |
| `12_02` | 1 | None | None | None | — |
| `12_00` | 2 | 7 | 7 | 7.0 | 7 |
| `22_02` | 15 | 19 | 89 | 28.36 | 19, 48, 51, 89 |

### Key Marker Positions

**27 22 02** (primary data marker):
Positions: `[359, 378, 397, 416, 467, 486, 575, 594, 613, 632, 680, 699, 718, 737, 756]`

**76 0b 0b 04 04** (section delimiter):
Positions: `[505, 529, 651]`

## Extracted f64 Values

**Total f64 values**: 32

| Offset | Decoded f64 | Confidence | Nearest 27 22 02 | Raw Hex |
|--------|-------------|------------|------------------|---------|
| 362 | 1.2 | MEDIUM | 359 (+3) | `333333333333f33f` |
| 370 | 1.6 | MEDIUM | 378 (-8) | `9a9999999999f93f` |
| 381 | 0.6 | MEDIUM | 378 (+3) | `333333333333e33f` |
| 389 | 0.3 | MEDIUM | 397 (-8) | `333333333333d33f` |
| 400 | 0.8 | MEDIUM | 397 (+3) | `9a9999999999e93f` |
| 408 | 1.2 | MEDIUM | 416 (-8) | `333333333333f33f` |
| 419 | 0.7 | MEDIUM | 416 (+3) | `666666666666e63f` |
| 427 | 0.18 | MEDIUM | 416 (+11) | `0ad7a3703d0ac73f` |
| 438 | 1.6 | MEDIUM | 416 (+22) | `9a9999999999f93f` |
| 459 | 0.46 | MEDIUM | 467 (-8) | `713d0ad7a370dd3f` |
| 470 | 0.4 | MEDIUM | 467 (+3) | `9a9999999999d93f` |
| 478 | 0.8 | MEDIUM | 486 (-8) | `9a9999999999e93f` |
| 489 | 0.85 | MEDIUM | 486 (+3) | `333333333333eb3f` |
| 497 | 0.06 | LOW | 486 (+11) | `b81e85eb51b8ae3f` |
| 578 | 0.7 | MEDIUM | 575 (+3) | `666666666666e63f` |
| 586 | 0.26 | MEDIUM | 594 (-8) | `a4703d0ad7a3d03f` |
| 597 | 0.8 | MEDIUM | 594 (+3) | `9a9999999999e93f` |
| 605 | 0.14 | MEDIUM | 613 (-8) | `ec51b81e85ebc13f` |
| 616 | 0.6 | MEDIUM | 613 (+3) | `333333333333e33f` |
| 624 | 0.42 | MEDIUM | 632 (-8) | `e17a14ae47e1da3f` |
| 635 | 0.95 | MEDIUM | 632 (+3) | `666666666666ee3f` |
| 643 | 0.02 | LOW | 632 (+11) | `7b14ae47e17a943f` |
| 683 | 0.2 | MEDIUM | 680 (+3) | `9a9999999999c93f` |
| 691 | 0.3 | MEDIUM | 699 (-8) | `333333333333d33f` |
| 702 | 0.4 | MEDIUM | 699 (+3) | `9a9999999999d93f` |
| 710 | 0.6 | MEDIUM | 718 (-8) | `333333333333e33f` |
| 721 | 0.8 | MEDIUM | 718 (+3) | `9a9999999999e93f` |
| 729 | 0.06 | LOW | 737 (-8) | `b81e85eb51b8ae3f` |
| 740 | 0.6 | MEDIUM | 737 (+3) | `333333333333e33f` |
| 748 | 0.9 | MEDIUM | 756 (-8) | `cdccccccccccec3f` |
| 759 | 0.3 | MEDIUM | 756 (+3) | `333333333333d33f` |
| 767 | 0.4 | MEDIUM | 756 (+11) | `9a9999999999d93f` |

## Extracted u32_fixed Values

**Total u32_fixed values**: 102

| Offset | u32 hex | Decoded | Confidence | Nearest 27 22 02 | Raw Hex |
|--------|---------|---------|------------|------------------|---------|
| 17 | `0x00000000` | 0.0 | HIGH | 359 (-342) | `00000000` |
| 18 | `0x00000000` | 0.0 | HIGH | 359 (-341) | `00000000` |
| 19 | `0x00000000` | 0.0 | HIGH | 359 (-340) | `00000000` |
| 20 | `0x00000000` | 0.0 | HIGH | 359 (-339) | `00000000` |
| 21 | `0x00000000` | 0.0 | HIGH | 359 (-338) | `00000000` |
| 22 | `0x00000000` | 0.0 | HIGH | 359 (-337) | `00000000` |
| 23 | `0x00000000` | 0.0 | HIGH | 359 (-336) | `00000000` |
| 24 | `0x00000000` | 0.0 | HIGH | 359 (-335) | `00000000` |
| 25 | `0x00000000` | 0.0 | HIGH | 359 (-334) | `00000000` |
| 30 | `0x00000000` | 0.0 | HIGH | 359 (-329) | `00000000` |
| 31 | `0x00000000` | 0.0 | HIGH | 359 (-328) | `00000000` |
| 32 | `0x00000000` | 0.0 | HIGH | 359 (-327) | `00000000` |
| 33 | `0x00000000` | 0.0 | HIGH | 359 (-326) | `00000000` |
| 61 | `0x00000000` | 0.0 | HIGH | 359 (-298) | `00000000` |
| 62 | `0x00000000` | 0.0 | HIGH | 359 (-297) | `00000000` |
| 63 | `0x00000000` | 0.0 | HIGH | 359 (-296) | `00000000` |
| 64 | `0x00000000` | 0.0 | HIGH | 359 (-295) | `00000000` |
| 65 | `0x00000000` | 0.0 | HIGH | 359 (-294) | `00000000` |
| 66 | `0x00000000` | 0.0 | HIGH | 359 (-293) | `00000000` |
| 67 | `0x00000000` | 0.0 | HIGH | 359 (-292) | `00000000` |
| 68 | `0x00000000` | 0.0 | HIGH | 359 (-291) | `00000000` |
| 69 | `0x00000000` | 0.0 | HIGH | 359 (-290) | `00000000` |
| 70 | `0x00000000` | 0.0 | HIGH | 359 (-289) | `00000000` |
| 71 | `0x00000000` | 0.0 | HIGH | 359 (-288) | `00000000` |
| 72 | `0x00000000` | 0.0 | HIGH | 359 (-287) | `00000000` |
| 73 | `0x00000000` | 0.0 | HIGH | 359 (-286) | `00000000` |
| 74 | `0x00000000` | 0.0 | HIGH | 359 (-285) | `00000000` |
| 75 | `0x00000000` | 0.0 | HIGH | 359 (-284) | `00000000` |
| 76 | `0x00000000` | 0.0 | HIGH | 359 (-283) | `00000000` |
| 88 | `0x00000000` | 0.0 | HIGH | 359 (-271) | `00000000` |
| 89 | `0x00000000` | 0.0 | HIGH | 359 (-270) | `00000000` |
| 90 | `0x00000000` | 0.0 | HIGH | 359 (-269) | `00000000` |
| 91 | `0x00000000` | 0.0 | HIGH | 359 (-268) | `00000000` |
| 92 | `0x00000000` | 0.0 | HIGH | 359 (-267) | `00000000` |
| 109 | `0x00000000` | 0.0 | HIGH | 359 (-250) | `00000000` |
| 120 | `0x00000000` | 0.0 | HIGH | 359 (-239) | `00000000` |
| 121 | `0x00000000` | 0.0 | HIGH | 359 (-238) | `00000000` |
| 122 | `0x00000000` | 0.0 | HIGH | 359 (-237) | `00000000` |
| 123 | `0x00000000` | 0.0 | HIGH | 359 (-236) | `00000000` |
| 362 | `0x33333333` | 0.2 | HIGH | 359 (+3) | `33333333` |
| 363 | `0x33333333` | 0.2 | HIGH | 359 (+4) | `33333333` |
| 364 | `0x33333333` | 0.2 | HIGH | 359 (+5) | `33333333` |
| 371 | `0x99999999` | 0.6 | HIGH | 378 (-7) | `99999999` |
| 372 | `0x99999999` | 0.6 | HIGH | 378 (-6) | `99999999` |
| 381 | `0x33333333` | 0.2 | HIGH | 378 (+3) | `33333333` |
| 382 | `0x33333333` | 0.2 | HIGH | 378 (+4) | `33333333` |
| 383 | `0x33333333` | 0.2 | HIGH | 378 (+5) | `33333333` |
| 389 | `0x33333333` | 0.2 | HIGH | 397 (-8) | `33333333` |
| 390 | `0x33333333` | 0.2 | HIGH | 397 (-7) | `33333333` |
| 391 | `0x33333333` | 0.2 | HIGH | 397 (-6) | `33333333` |
| 401 | `0x99999999` | 0.6 | HIGH | 397 (+4) | `99999999` |
| 402 | `0x99999999` | 0.6 | HIGH | 397 (+5) | `99999999` |
| 408 | `0x33333333` | 0.2 | HIGH | 416 (-8) | `33333333` |
| 409 | `0x33333333` | 0.2 | HIGH | 416 (-7) | `33333333` |
| 410 | `0x33333333` | 0.2 | HIGH | 416 (-6) | `33333333` |
| 419 | `0x66666666` | 0.4 | HIGH | 416 (+3) | `66666666` |
| 420 | `0x66666666` | 0.4 | HIGH | 416 (+4) | `66666666` |
| 421 | `0x66666666` | 0.4 | HIGH | 416 (+5) | `66666666` |
| 439 | `0x99999999` | 0.6 | HIGH | 416 (+23) | `99999999` |
| 440 | `0x99999999` | 0.6 | HIGH | 416 (+24) | `99999999` |
| 454 | `0x3f000000` | 0.246094 | HIGH | 467 (-13) | `0000003f` |
| 471 | `0x99999999` | 0.6 | HIGH | 467 (+4) | `99999999` |
| 472 | `0x99999999` | 0.6 | HIGH | 467 (+5) | `99999999` |
| 479 | `0x99999999` | 0.6 | HIGH | 486 (-7) | `99999999` |
| 480 | `0x99999999` | 0.6 | HIGH | 486 (-6) | `99999999` |
| 489 | `0x33333333` | 0.2 | HIGH | 486 (+3) | `33333333` |
| 490 | `0x33333333` | 0.2 | HIGH | 486 (+4) | `33333333` |
| 491 | `0x33333333` | 0.2 | HIGH | 486 (+5) | `33333333` |
| 521 | `0x3f800000` | 0.248047 | HIGH | 486 (+35) | `0000803f` |
| 525 | `0x00000000` | 0.0 | HIGH | 486 (+39) | `00000000` |
| 578 | `0x66666666` | 0.4 | HIGH | 575 (+3) | `66666666` |
| 579 | `0x66666666` | 0.4 | HIGH | 575 (+4) | `66666666` |
| 580 | `0x66666666` | 0.4 | HIGH | 575 (+5) | `66666666` |
| 598 | `0x99999999` | 0.6 | HIGH | 594 (+4) | `99999999` |
| 599 | `0x99999999` | 0.6 | HIGH | 594 (+5) | `99999999` |
| 616 | `0x33333333` | 0.2 | HIGH | 613 (+3) | `33333333` |
| 617 | `0x33333333` | 0.2 | HIGH | 613 (+4) | `33333333` |
| 618 | `0x33333333` | 0.2 | HIGH | 613 (+5) | `33333333` |
| 635 | `0x66666666` | 0.4 | HIGH | 632 (+3) | `66666666` |
| 636 | `0x66666666` | 0.4 | HIGH | 632 (+4) | `66666666` |
| 637 | `0x66666666` | 0.4 | HIGH | 632 (+5) | `66666666` |
| 684 | `0x99999999` | 0.6 | HIGH | 680 (+4) | `99999999` |
| 685 | `0x99999999` | 0.6 | HIGH | 680 (+5) | `99999999` |
| 691 | `0x33333333` | 0.2 | HIGH | 699 (-8) | `33333333` |
| 692 | `0x33333333` | 0.2 | HIGH | 699 (-7) | `33333333` |
| 693 | `0x33333333` | 0.2 | HIGH | 699 (-6) | `33333333` |
| 703 | `0x99999999` | 0.6 | HIGH | 699 (+4) | `99999999` |
| 704 | `0x99999999` | 0.6 | HIGH | 699 (+5) | `99999999` |
| 710 | `0x33333333` | 0.2 | HIGH | 718 (-8) | `33333333` |
| 711 | `0x33333333` | 0.2 | HIGH | 718 (-7) | `33333333` |
| 712 | `0x33333333` | 0.2 | HIGH | 718 (-6) | `33333333` |
| 722 | `0x99999999` | 0.6 | HIGH | 718 (+4) | `99999999` |
| 723 | `0x99999999` | 0.6 | HIGH | 718 (+5) | `99999999` |
| 740 | `0x33333333` | 0.2 | HIGH | 737 (+3) | `33333333` |
| 741 | `0x33333333` | 0.2 | HIGH | 737 (+4) | `33333333` |
| 742 | `0x33333333` | 0.2 | HIGH | 737 (+5) | `33333333` |
| 748 | `0xcccccccd` | 0.8 | HIGH | 756 (-8) | `cdcccccc` |
| 759 | `0x33333333` | 0.2 | HIGH | 756 (+3) | `33333333` |
| 760 | `0x33333333` | 0.2 | HIGH | 756 (+4) | `33333333` |
| 761 | `0x33333333` | 0.2 | HIGH | 756 (+5) | `33333333` |
| 768 | `0x99999999` | 0.6 | HIGH | 756 (+12) | `99999999` |
| 769 | `0x99999999` | 0.6 | HIGH | 756 (+13) | `99999999` |

## Group Segmentation

**Total groups**: 4

Boundaries determined by `76 0b 0b 04 04` section delimiters.

| Group | Start | End | Length | f64 Count | u32 Count | 27 22 02 Count |
|-------|-------|-----|--------|-----------|-----------|----------------|
| 0 | 0 | 505 | 505 | 14 | 68 | 6 |
| 1 | 505 | 529 | 24 | 0 | 2 | 0 |
| 2 | 529 | 651 | 122 | 8 | 11 | 4 |
| 3 | 651 | 1092 | 441 | 10 | 21 | 5 |

### Group Details

#### Group 0 (offset 0–505)

- **Length**: 505 bytes
- **f64 values**: 14
- **u32_fixed values**: 68
- **27 22 02 markers**: 6
  - f64: 1.2@362, 1.6@370, 0.6@381, 0.3@389, 0.8@400, 1.2@408, 0.7@419, 0.18@427, 1.6@438, 0.46@459, 0.4@470, 0.8@478, 0.85@489, 0.06@497
  - u32_fixed: 0.0@17, 0.0@18, 0.0@19, 0.0@20, 0.0@21, 0.0@22, 0.0@23, 0.0@24, 0.0@25, 0.0@30, 0.0@31, 0.0@32, 0.0@33, 0.0@61, 0.0@62, 0.0@63, 0.0@64, 0.0@65, 0.0@66, 0.0@67, 0.0@68, 0.0@69, 0.0@70, 0.0@71, 0.0@72, 0.0@73, 0.0@74, 0.0@75, 0.0@76, 0.0@88, 0.0@89, 0.0@90, 0.0@91, 0.0@92, 0.0@109, 0.0@120, 0.0@121, 0.0@122, 0.0@123, 0.2@362, 0.2@363, 0.2@364, 0.6@371, 0.6@372, 0.2@381, 0.2@382, 0.2@383, 0.2@389, 0.2@390, 0.2@391, 0.6@401, 0.6@402, 0.2@408, 0.2@409, 0.2@410, 0.4@419, 0.4@420, 0.4@421, 0.6@439, 0.6@440, 0.246094@454, 0.6@471, 0.6@472, 0.6@479, 0.6@480, 0.2@489, 0.2@490, 0.2@491
  - 27 22 02 markers at: [359, 378, 397, 416, 467, 486]

#### Group 1 (offset 505–529)

- **Length**: 24 bytes
- **f64 values**: 0
- **u32_fixed values**: 2
- **27 22 02 markers**: 0
  - u32_fixed: 0.248047@521, 0.0@525

#### Group 2 (offset 529–651)

- **Length**: 122 bytes
- **f64 values**: 8
- **u32_fixed values**: 11
- **27 22 02 markers**: 4
  - f64: 0.7@578, 0.26@586, 0.8@597, 0.14@605, 0.6@616, 0.42@624, 0.95@635, 0.02@643
  - u32_fixed: 0.4@578, 0.4@579, 0.4@580, 0.6@598, 0.6@599, 0.2@616, 0.2@617, 0.2@618, 0.4@635, 0.4@636, 0.4@637
  - 27 22 02 markers at: [575, 594, 613, 632]

#### Group 3 (offset 651–1092)

- **Length**: 441 bytes
- **f64 values**: 10
- **u32_fixed values**: 21
- **27 22 02 markers**: 5
  - f64: 0.2@683, 0.3@691, 0.4@702, 0.6@710, 0.8@721, 0.06@729, 0.6@740, 0.9@748, 0.3@759, 0.4@767
  - u32_fixed: 0.6@684, 0.6@685, 0.2@691, 0.2@692, 0.2@693, 0.6@703, 0.6@704, 0.2@710, 0.2@711, 0.2@712, 0.6@722, 0.6@723, 0.2@740, 0.2@741, 0.2@742, 0.8@748, 0.2@759, 0.2@760, 0.2@761, 0.6@768, 0.6@769
  - 27 22 02 markers at: [680, 699, 718, 737, 756]

## Alignment Hypotheses (Values Only)

- **Total f64 values**: 32
- **Total u32_fixed values**: 102
- **Total 27 22 02 markers**: 15
- **Total groups**: 4
- **f64 per group**: [14, 0, 8, 10]
- **u32 per group**: [68, 2, 11, 21]

### Hypothesis A: 7 Phase 3 Leaf Names

- Leaf count expected: 7
- f64 values: 32
- 27 22 02 markers: 15
- Verdict: no alignment

### Hypothesis B: 12 Schema Fields (5 Generic + 7 Specific)

- Field count expected: 12
- f64 values: 32
- 27 22 02 markers: 15
- Verdict: no alignment

### Hypothesis C: 5 Generic Value Columns

- Column count expected: 5
- f64 values: 32
- 27 22 02 markers: 15
- Verdict: no alignment

### Hypothesis D: PvP Star/Tier Levels (1–8)

- Level range: 1–8
- f64 values: 32
- 27 22 02 markers: 15
- Verdict: no alignment

## Blockers

1. **Record boundary is not clean**: The 27 22 02 marker has variable gaps
   (19, 51, 89, 48 bytes), suggesting additional control structures
   between markers that are not yet decoded.
2. **u32_fixed values are sparse**: Only 4 unique clean u32_fixed patterns
   found (0.2, 0.4, 0.6, 0.8), all of which are also valid as f64 exponents.
3. **f64 values are NOT 8-byte aligned**: They appear at arbitrary offsets,
   suggesting they are part of a variable-length record structure.
4. **76 0b 0b 04 04 is a section delimiter, not a record boundary**:
   Only 3 occurrences, creating 4 sections, but the 27 22 02 markers
   span across these sections.
5. **No production code reference for record-to-leaf mapping**:
   The 7 Phase 3 leaf names are present in the schema string, but
   there is no byte-level evidence for which f64/u32 values map
   to which leaves.

## Safe-to-Commit Verdict

**Status**: All deliverables are candidate-only research outputs.
**No production code was modified.**
**No canonical mapping claims are made.**
**No leaf-name forcing was applied** — values are extracted
without assuming which f64/u32 value belongs to which leaf.

## Final Handoff

- **Extracted f64 values**: 32 (all with offset, raw hex, decoded value, confidence)
- **Extracted u32_fixed values**: 102 (all with offset, raw hex, decoded value, confidence)
- **Marker families analyzed**: 8
- **Groups segmented**: 4 (by 76 0b 0b 04 04 boundaries)
- **Alignment hypotheses tested**: 4 (7 leaves, 12 fields, 5 columns, star/tier levels)
- **Blockers**: 5

**Safe-to-commit verdict**: YES — candidate-only, no production writes, no canonical claims.

## Files

- `src/tools/v2_extract_formula_pvp_adjust_leaves_values.py` — extractor tool
- `data/research/bindict_decode/v2_formula_pvp_adjust_leaves_values.json` — JSON output
- `docs/research-notes/v2-formula-pvp-adjust-leaves-values.md` — this report
