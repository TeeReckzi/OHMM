# V2 Separator Hypothesis Confirmation

**Date**: 2026-02-07
**Status**: CONFIRMED - Universal for Variant A
**Confidence**: HIGH (384/384 tables = 100%)

## Hypothesis

**"The separator low byte (byte following 0x3F marker) is part of the prior/following value encoding, not independent separator semantics."**

## Testing Methodology

1. **Initial Discovery**: Tested 5 hypotheses on `formula_pvp_global_param_data` (8 separators)
2. **Disambiguation**: Tested on `formula_pvp_adjust_param_data` (145 separators)
3. **False Negative Investigation**: Analyzed 2 "non-matching" separators
4. **Universal Generalization**: Tested on 384 Variant A tables (5-50,000 bytes)

## Key Findings

### False Negative Resolution

Two separators in `formula_pvp_adjust_param_data` initially appeared to not match:
- Offset 1328: low byte 0x12
- Offset 1550: low byte 0x12

**Root Cause**: The hypothesis test's `find_nearest_fixed_point` method filtered out values with `scaled_value < 0.001`. Both separators had the value `0x0000123f` at their offset (scaled = 0.000001), which was filtered out.

**Verification**: The low byte 0x12 IS present in the value hex `0x0000123f` at the separator offset. Both separators share the pattern `3f 12 00 00` (value ≈ 0), likely sentinel/boundary markers.

**Conclusion**: The hypothesis actually matches **145/145 (100%)**, not 98.6%.

### Universal Generalization

Tested 384 Variant A tables (excluding 3 already analyzed):
- **Pass (≥95% match)**: 384 tables (100%)
- **Fail**: 0 tables (0%)

Top 10 by separator count:
1. `bullet_scatter_data`: 1391/1391 (100%) - 15,484 bytes
2. `bullet_base_params_data`: 1184/1184 (100%) - 42,136 bytes
3. `new_model_effect`: 665/665 (100%) - 39,064 bytes
4. `script_register_open_server_rule_data`: 626/626 (100%) - 28,780 bytes
5. `pseudo_random_data`: 607/607 (100%) - 7,960 bytes
6. `affix_rand_rule_data`: 599/599 (100%) - 11,944 bytes
7. `equip_posture_data`: 573/573 (100%) - 14,476 bytes
8. `season_monster_difficulty_adjustment_data`: 518/518 (100%) - 11,432 bytes
9. `character_hair_color_template_data`: 486/486 (100%) - 11,032 bytes
10. `trans_orig_data`: 437/437 (100%) - 18,728 bytes

## Revised Variant A Grammar

```
variant_a_table := header + main_data_region + separator_region + string_pool + metadata

separator := 0x3F + low_byte
  where:
    - 0x3F is a delimiter marker (constant)
    - low_byte is part of the adjacent value encoding (data, not metadata)

value_with_marker := u32_value
  where the u32 may span across the separator boundary
  and includes the low_byte as part of its encoding
```

## Implications

1. **0x3F is a pure delimiter**: It marks boundaries but carries no semantic information itself
2. **Low byte is value data**: It's part of the packed value encoding, not a field type or boundary kind indicator
3. **Values may span separators**: A u32 value can include bytes before and after the 0x3F marker
4. **No independent separator semantics**: The "separator" is just a marker; the real structure is in the values

## Next Steps

1. Build automated Variant A decoder using this confirmed hypothesis
2. Analyze value encoding patterns to determine exact packed format
3. Validate decoded values against known game parameters
4. Apply to Phase 3 formula leaves

## Files

- Test script: `src/tools/v2_hypothesis_generalization_test.py`
- Results: `data/research/bindict_decode/v2_hypothesis_generalization_test.json`
- Non-match analysis: `src/tools/v2_find_nonmatching_separators.py`, `src/tools/v2_verify_nonmatching.py`

## Warning

**CANDIDATE ANALYSIS - NOT CANONICAL - REQUIRES IN-GAME VALIDATION**

This is a research-only finding. The hypothesis is strongly supported by statistical evidence but has not been validated against actual game behavior or decompiled game code.
