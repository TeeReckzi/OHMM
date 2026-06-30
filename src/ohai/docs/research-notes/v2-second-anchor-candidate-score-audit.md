# V2 Second Anchor Candidate Score Audit (Sprint 3)

> **CANDIDATE ANALYSIS - NOT CANONICAL - REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Audit Motivation

The Sprint 2 search (`v2_second_semantic_anchor_search.py`) claimed
`formula_pvp_tier_base_factor_data` as the top second-anchor candidate
(score=40). On manual inspection of the output JSON, the scoring
appeared inflated by false-positive constant matches:

1. **Format mismatch**: `f32_0.5` (u32_fixed hex `00000000`) was being
   counted as a match when the data contained `00000000` bytes — but
   decoding `00000000` as u32_fixed gives 0.0, not 0.5.
2. **Value mismatch**: `f32_1.0` (u32_fixed hex `00000001`) was being
   counted as a match — but `00000001` / 2^32 ≈ 2.3e-10, not 1.0.
3. **Cross-format counting**: Constants were being tested in both
   `f32` and `u32_fixed` formats regardless of whether the format
   was semantically valid for that constant.

## Fix Applied

Modified `scan_for_known_values` in
`src/tools/v2_second_semantic_anchor_search.py`:

### Before
```python
for const_name, const_info in KNOWN_CONSTANTS.items():
    for fmt_label, hex_key in [("u32_fixed", "u32_fixed_hex"), ("f32", "f32_hex")]:
        # match on hex bytes, decode, append regardless of value match
```

### After
```python
for const_name, const_info in KNOWN_CONSTANTS.items():
    # Only check formats valid for this constant
    if const_name.startswith("f32_"):
        formats_to_check = [("f32", "f32_hex")]
    elif const_name.startswith("pvp_"):
        formats_to_check = [("u32_fixed", "u32_fixed_hex")]
    else:
        formats_to_check = [("u32_fixed", "u32_fixed_hex"), ("f32", "f32_hex")]

    for fmt_label, hex_key in formats_to_check:
        # match on hex bytes, decode, validate decoded value matches expected
        if abs(decoded - expected_value) < 0.001:
            matches.append(...)
```

Key changes:
- `f32_*` constants only match via `f32_hex` (IEEE 754 representation)
- `pvp_*` constants only match via `u32_fixed_hex` (mobile native fixed-point)
- Each match requires decoded value to be within 0.001 of expected value
- Invalid matches (format mismatch, value mismatch) are excluded

## Impact on Rankings

### Score Comparison (Before → After Fix)

| Table | Old Score | New Score | Delta | Notes |
|-------|-----------|-----------|-------|-------|
| `formula_pvp_tier_base_factor_data` | 40 | 30 | -10 | Was #1, now #14 |
| `element_dam_rate_no` | (not top) | 39 | new | New #1 |
| `formula_pvp_adjust_leaves_data` | (not measured) | 38 | - | Now #2 |
| `formula_pvp_adjust_param_data` | (not measured) | 38 | - | Now #3 |
| `player_fall_damage` | (not measured) | 38 | - | Now #4 |
| `abnormal_capture_rate_data` | (not measured) | 38 | - | Now #5 |

### Top Candidate Changed

The top candidate shifted from `formula_pvp_tier_base_factor_data`
(score 40, inflated) to `element_dam_rate_no` (score 39, validated).

## New Top Candidate: `element_dam_rate_no`

### Evidence Summary (Validated)

- **File size**: 808 bytes (small, +2 size bonus)
- **Schema strings**: 10 printable ASCII runs including:
  - `lv_hp_rateslv_field_ratesConst_10Const_100Const_125Const_150Const_200Const_25Const_300Const_50Const_75Ele_Eff_StdEle_Ineff_Std`
  - `"333333` and `"ffffff` (raw hex fragments visible as text)
- **Validated value matches**: 9 hits across 5 distinct constants:
  - `f32_0.5` (decoded 0.5 via f32 format)
  - `f32_1.0` (decoded 1.0 via f32 format)
  - `f32_2.0` (decoded 2.0 via f32 format)
  - `pvp_star_modifier_0.4` (decoded 0.4 via u32_fixed format)
  - `pvp_tier_modifier_0.2` (decoded 0.2 via u32_fixed format)
- **Table name in code**: 1 reference found in repo source

### Why This Is Interesting

1. **Element damage rate data** is directly relevant to the Phase 3
   formula leaf `element_dam_add_rate` (one of the three missing
   leaves per AGENTS.md).
2. Schema strings reveal field names: `Const_10`, `Const_25`,
   `Const_50`, etc. — these look like level/rate thresholds.
3. `Ele_Eff_Std` / `Ele_Ineff_Std` suggest element effectiveness
   standard values — directly maps to element damage multipliers.
4. The presence of BOTH f32 constants (0.5, 1.0, 2.0) AND PvP
   fixed-point constants (0.4, 0.2) in a single table suggests
   this is a hybrid table or contains multiple record types.

### Open Questions

1. Is `element_dam_rate_no` a valid second semantic anchor, or
   just a table with many coincidental constant matches?
2. How do the `Const_*` field names map to the record structure?
3. Is the presence of PvP constants (0.4, 0.2) in an element
   damage table expected, or a sign of cross-contamination?
4. What is the exact record boundary? The schema strings suggest
   fixed-field records, but byte-level analysis is needed.

## Remaining Concern: Overlapping Matches

The current scoring still counts overlapping matches. For example,
`pvp_star_modifier_0.4` (u32_fixed hex `66666666`) matches at offsets
344, 345, 346 in `formula_pvp_tier_base_factor_data` because the
4-byte window slides by 1 byte and still finds `66666666` as a
substring of a longer run of `66` bytes.

This is a separate issue from the format/value validation fix.
Future work should deduplicate adjacent matches (within 4 bytes)
to get a more accurate match count.

## Verification Commands

```bash
# Regenerate candidates with fixed validation
python src/tools/v2_second_semantic_anchor_search.py

# Run smoke test to confirm no production files were modified
python src/tools/v2_decoder_harness_smoke_test.py

# Run full test suite
npm run test:all
```

## Files Modified

- `src/tools/v2_second_semantic_anchor_search.py` — `scan_for_known_values`
  function: format restriction + value validation
- `data/research/bindict_decode/v2_second_semantic_anchor_candidates.json` —
  regenerated with corrected scoring
- `docs/research-notes/v2-second-semantic-anchor-search.md` —
  auto-regenerated report

## Files NOT Modified

- `data/extracted/*.raw.json` — locked, untouched
- `data/normalized/*.normalized.json` — locked, untouched
- `data/raw/` — immutable source, untouched
- `src/utils/combat/officialFormulaPvpGlobals.ts` — production code,
  untouched

## Next Steps

1. Investigate `element_dam_rate_no` structure: extract record
   boundaries, field offsets, and validate schema string positions
   against decoded values.
2. Re-run `formula_pvp_adjust_leaves_data` analysis with focus on
   leaf-to-field mapping (still blocked by no leaf names in string
   pool).
3. Deduplicate overlapping matches in scoring (future sprint).
4. Cross-validate `element_dam_rate_no` constants against any
   element damage code in the repo.
