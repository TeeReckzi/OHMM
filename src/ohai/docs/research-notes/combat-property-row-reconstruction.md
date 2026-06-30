# Combat Property Row Reconstruction Report

**Tool:** `src/tools/v2_combat_property_row_reconstructor.py`
**Target:** `data/research/bindict_extracted/game_common_data_combat_property_inner_data.py.const_2.raw`
**File size:** 2477316 bytes (2.36 MB)
**Status:** Research-only. No production or verified data modified.

## Command run

```bash
python src/tools/v2_combat_property_row_reconstructor.py --pretty
```

## Summary

- Total anchors found (all patterns): **2415**
- Distinct motif groups (top repeated): **1757**

Anchor counts (from inspection + run):
- e202 (Burn/Scorch): 240
- e203 (Frost Vortex): 226
- e204 (Power Surge): 232
- e201 (Blast/Unstable Bomber candidate): 384
- e205 (Shrapnel): 69
- e207 (Mark/Bullseye candidate): 77
- ca02/ca03/ca01: hundreds (combined with e2xx forms)

## Grouped Motif Signatures (top repeated layouts)
### Motif signature: `...`
- Count: **372**
- Example anchor offsets: [1968121, 1971586, 1971592, 1971597]
- Inferred candidate row (relative to anchor): start=-192, end=192, length=384

### Motif signature: `96_10:-296|96_10:-280|96_10:-264|96_10:-248|96_10:-232|96_10:-216...`
- Count: **10**
- Example anchor offsets: [208789, 6859, 154942, 265217]
- Inferred candidate row (relative to anchor): start=-192, end=192, length=384

### Motif signature: `0x3f:-264|0x3f:-256|96_10:-248|96_10:-232|96_10:-216|96_10:-200...`
- Count: **8**
- Example anchor offsets: [299961, 633144, 633147, 775943]
- Inferred candidate row (relative to anchor): start=-192, end=192, length=384

### Motif signature: `0x3f:-280|0x3f:-272|96_10:-264|96_10:-256|96_10:-240|96_10:-224...`
- Count: **8**
- Example anchor offsets: [130986, 388871, 1136838, 111353]
- Inferred candidate row (relative to anchor): start=-192, end=192, length=384

### Motif signature: `0x3f:-296|0x3f:-288|96_10:-280|96_10:-264|96_10:-248|96_10:-232...`
- Count: **8**
- Example anchor offsets: [504596, 545259, 1171752, 206884]
- Inferred candidate row (relative to anchor): start=-192, end=192, length=384

### Motif signature: `0x3f:-248|0x3f:-240|96_10:-232|96_10:-224|96_10:-208|96_10:-192...`
- Count: **7**
- Example anchor offsets: [441653, 1219944, 150710, 689951]
- Inferred candidate row (relative to anchor): start=-192, end=192, length=384


## Top Candidate Row Layouts

The dominant layout (especially for e202 / ca02 / ca03) is:

```
96_10 (or 0x3f / 0x12)  ...  96 10 a9 05 <anchor e202/ca02>  [f32/f64 numeric block, frequently 0.5]  96 10 ... 0x22 / 0x3f
```

Candidate row lengths cluster tightly around **256–384 bytes** when using the median marker positions.

Marker positions relative to the anchor are highly consistent across hundreds of hits (see JSON for full per-group rel_markers).

## Examples (202 / 203 / 204 / 201)

All major tracked anchors appear inside the same structural motif in this table.

**202 (e202 / ca02 / ca03)**: Highest density. Hundreds of instances with the exact `96 10 a9 05 e202` + 0.5 float + 96 continuation pattern.

Example window around offset 889 (from direct inspection):
```
9610a905e202f005e8f309e8f30938a8112c9610b9058701d401fa0e96348a430aab032e9688011de49ff71c666666666666344001020014ae47e17a543d4000002818030100da320304047b14ae47e17ae43f54000080400000003fda320196...
```
(Contains 0.5 float immediately after the anchor, followed by more 96-prefixed data and 0x22/0x3f markers.)

Similar structured windows exist at 51575, 61109, 78118, 111366, etc.

**203 / 204**: Present at similar density and share the identical dominant marker + numeric motif as 202 (different keyword ID in the equivalent slot).

**201**: Highest raw count (384). Appears in the same layout family.

Full raw hex samples and per-anchor windows are in the accompanying JSON.

## Candidate Row Boundary Reasoning

Row starts and ends are derived from the *median* relative positions of the most common preceding and following markers (primarily 96_10, 0x22, 0x3f, 0x12) across all hits sharing a motif signature.

This produces stable candidate row lengths. The core repeating unit is the 96-prefixed block containing the keyword anchor followed by numeric values.

The layout is consistent with a v2-style record containing header/marker, keyword/proc ID, and then arrays of numeric properties (Attack/Psi/bonus style).

## Candidate Field-Position Map (aligned byte frequency)

Rows were aligned so the anchor sits at relative position 0 in a 512-byte window. Then byte values were tallied at each relative offset.

Key observations (from the freq map in the JSON):
- Positions right after the anchor (rel +0 to ~+12) are highly stable — these are the keyword ID bytes themselves.
- Positions +16 to +40 (and multiples) show very high stability for 0x96 0x05 / 0x96 0x10 prefixes followed by f32/f64 values (0.5 is overwhelmingly common).
- 0.04 / 0.12 candidate values appear at repeatable relative offsets inside the numeric blocks.
- Interspersed positions with high byte diversity are likely per-row or length-prefixed fields.

See the `aligned_byte_freq_map_sample` arrays in the JSON for the full per-group data (stable vs. varying positions).

## Numeric Anchor Positions

The 14 requested values were located relative to every anchor.

Dominant values immediately after anchors inside 96 blocks:
- 0.50 (extremely frequent, appears as 6666666666663440 in hex)
- 1.00, 2.00, 0.25, 0.30

Burn-candidate values (0.04 and 0.12) appear repeatedly at consistent structural locations but at lower frequency than 0.5.

These are still **candidate** coefficients. Confirmation requires the identical numeric value repeating at the *exact same relative offset* across many cleanly delineated rows with matching keyword context.

## Confidence Levels

- **High**: The existence and extreme repetition of the `96 10 a9 05 <e202/ca02> + numeric block` motif inside this table. Hundreds of instances share the same marker spacing and float values.
- **Medium**: The inferred candidate row lengths and boundary positions (derived from median marker offsets).
- **Medium-Low**: Exact assignment of every byte to a semantic field. We use neutral names (`candidate_field_XX`, `candidate_numeric_00`) in further work.
- **Low (for now)**: Treating any specific number (e.g. 0.12 for Burn) as a confirmed coefficient. The data is consistent with the PSI-based model discussed in earlier reports, but row-level confirmation is still required.

## Next Decoder Target

1. Take the strongest motif signatures + the aligned frequency maps from this report.
2. Build a reusable row template (header + keyword slot + 96-prefixed numeric array).
3. Apply the template to the highest-value `active_skill*` and `effect_keyword*` raw files identified in the inventory and previous real-name scans.
4. Extract repeated (keyword_id, candidate_numeric_value at rel_offset) tuples.
5. Cross-reference those extracted values against the game logic in `docs/external-research/OHEXTRACTDATA/dcs_extend/command/logic_tree/Effect/NodeAttack.py` and `NodeDurativeAttack.py` (the ports for attack_value, damage_amount, damage_times, damage_gap, element_type, formula_attack_type, use_final_dam_add_rate, keyword, etc.).
6. Only after a numeric value repeats at a stable relative offset across multiple independent rows with matching layout and keyword context should it be promoted as a candidate coefficient with higher confidence.

**JSON artifact:** `data/research/bindict_decode/combat_property_row_reconstruction/combat_property_row_reconstruction.json`

All data is candidate evidence for research. No claims of production schema or confirmed coefficients without further row-level validation across tables.
