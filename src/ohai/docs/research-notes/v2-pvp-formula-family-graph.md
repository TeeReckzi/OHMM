# V2 PvP Formula Family Graph — Cross-Table Semantic Anchor Expansion

> **CANDIDATE ANALYSIS — NOT CANONICAL — REQUIRES IN-GAME VALIDATION**

Generated: 2026-06-06

## Objective

Treat `formula_pvp_adjust_leaves_data` as one member of a larger
PvP formula family. Extract f64/u32_fixed values from 7 related
tables, build frequency maps, identify value clusters, marker
patterns, table similarity, and rank tables by schema-sharing
likelihood to identify the strongest next semantic anchor.

## Per-Table Extraction Summary

| Table | File Size | f64 Unique | u32 Unique | Groups | Markers |
|-------|-----------|------------|------------|--------|---------|
| formula_pvp_adjust_leaves_data | 1092 | 12 | 5 | 4 | 8 |
| formula_pvp_adjust_param_data | 2944 | 53 | 6 | 1 | 7 |
| formula_pvp_global_param_data | 528 | 0 | 1 | 1 | 2 |
| formula_pvp_tier_base_factor_data | 856 | 5 | 4 | 1 | 4 |
| formula_pvp_adjust_max_hp_data | 496 | 3 | 3 | 1 | 7 |
| formula_pvp_armor_factor_data | 484 | 1 | 1 | 1 | 0 |
| element_dam_rate_no | 808 | 11 | 9 | 1 | 6 |

## Frequency Maps

**Total f64 values across family**: 85
**Total u32 values across family**: 29

### Top 20 f64 Values by Total Frequency

| f64 Value | Total Count | Tables |
|-----------|-------------|--------|
| 0.007813 | 4 | 4 tables |
| 1.6 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_tier_base_factor_data |
| 0.18 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data |
| 0.4 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data |
| 0.2 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data |
| 0.9 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data |
| 0.1 | 2 | formula_pvp_adjust_param_data, element_dam_rate_no |
| 0.125 | 2 | formula_pvp_adjust_param_data, element_dam_rate_no |
| 2.0 | 2 | formula_pvp_tier_base_factor_data, element_dam_rate_no |
| 0.8 | 1 | formula_pvp_adjust_leaves_data |
| 0.06 | 1 | formula_pvp_adjust_leaves_data |
| 0.26 | 1 | formula_pvp_adjust_leaves_data |
| 0.14 | 1 | formula_pvp_adjust_leaves_data |
| 0.42 | 1 | formula_pvp_adjust_leaves_data |
| 0.02 | 1 | formula_pvp_adjust_leaves_data |
| 0.135 | 1 | formula_pvp_adjust_param_data |
| 8.000001 | 1 | formula_pvp_adjust_param_data |
| 2.7 | 1 | formula_pvp_adjust_param_data |
| 0.342 | 1 | formula_pvp_adjust_param_data |
| -2.1 | 1 | formula_pvp_adjust_param_data |

### Top 20 u32 Values by Total Frequency

| u32_fixed Value | Total Count | Tables |
|------------------|-------------|--------|
| 0.0 | 7 | 7 tables |
| 0.6 | 5 | 5 tables |
| 0.248047 | 4 | 4 tables |
| 0.246094 | 3 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, element_dam_rate_no |
| 0.8 | 3 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_tier_base_factor_data |
| 0.249023 | 2 | formula_pvp_adjust_param_data, element_dam_rate_no |
| 0.25 | 2 | formula_pvp_tier_base_factor_data, element_dam_rate_no |
| 0.244141 | 1 | element_dam_rate_no |
| 0.250977 | 1 | element_dam_rate_no |
| 0.24707 | 1 | element_dam_rate_no |

## Recurring Value Clusters (values in 2+ tables)

**f64 shared clusters**: 9
**u32 shared clusters**: 7

### f64 Clusters

| Value | Table Count | Tables |
|-------|-------------|--------|
| 0.007813 | 4 | element_dam_rate_no, formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data, formula_pvp_adjust_param_data |
| 1.6 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_tier_base_factor_data |
| 0.18 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data |
| 0.4 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data |
| 0.2 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data |
| 0.9 | 2 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data |
| 0.1 | 2 | element_dam_rate_no, formula_pvp_adjust_param_data |
| 0.125 | 2 | element_dam_rate_no, formula_pvp_adjust_param_data |
| 2.0 | 2 | element_dam_rate_no, formula_pvp_tier_base_factor_data |

### u32 Clusters

| Value | Table Count | Tables |
|-------|-------------|--------|
| 0.0 | 7 | element_dam_rate_no, formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data, formula_pvp_adjust_param_data, formula_pvp_armor_factor_data, formula_pvp_global_param_data, formula_pvp_tier_base_factor_data |
| 0.6 | 5 | element_dam_rate_no, formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data, formula_pvp_adjust_param_data, formula_pvp_tier_base_factor_data |
| 0.248047 | 4 | element_dam_rate_no, formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data, formula_pvp_adjust_param_data |
| 0.246094 | 3 | element_dam_rate_no, formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data |
| 0.8 | 3 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_tier_base_factor_data |
| 0.249023 | 2 | element_dam_rate_no, formula_pvp_adjust_param_data |
| 0.25 | 2 | element_dam_rate_no, formula_pvp_tier_base_factor_data |

## Recurring Marker Patterns

| Marker | Table Count | Tables |
|--------|-------------|--------|
| 22 | 6 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_global_param_data, formula_pvp_tier_base_factor_data, formula_pvp_adjust_max_hp_data, element_dam_rate_no |
| 12_00 | 5 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_tier_base_factor_data, formula_pvp_adjust_max_hp_data, element_dam_rate_no |
| 27 | 5 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_tier_base_factor_data, formula_pvp_adjust_max_hp_data, element_dam_rate_no |
| 22_02 | 4 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_global_param_data, formula_pvp_adjust_max_hp_data |
| 76_0b | 4 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_adjust_max_hp_data, element_dam_rate_no |
| 12_02 | 4 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_tier_base_factor_data, formula_pvp_adjust_max_hp_data |
| 27_22_02 | 3 | formula_pvp_adjust_leaves_data, formula_pvp_adjust_param_data, formula_pvp_adjust_max_hp_data |
| 76_0b_0b_04_04 | 1 | formula_pvp_adjust_leaves_data |
| 96_15 | 1 | element_dam_rate_no |
| 12_01_04 | 1 | element_dam_rate_no |

## Table Similarity Matrix (Top 15 Pairs)

| Table A | Table B | f64 Sim | u32 Sim | Marker Sim | Group Sim | Composite |
|---------|---------|---------|---------|------------|-----------|-----------|
| formula_pvp_adjust_leaves_data | formula_pvp_adjust_param_data | 0.048 | 0.833 | 0.875 | 0.000 | 0.483 |
| formula_pvp_adjust_leaves_data | formula_pvp_adjust_max_hp_data | 0.250 | 0.600 | 0.875 | 0.000 | 0.474 |
| formula_pvp_adjust_param_data | formula_pvp_adjust_max_hp_data | 0.018 | 0.500 | 1.000 | 0.000 | 0.406 |
| formula_pvp_global_param_data | formula_pvp_armor_factor_data | 0.000 | 1.000 | 0.000 | 0.000 | 0.300 |
| formula_pvp_adjust_leaves_data | formula_pvp_tier_base_factor_data | 0.062 | 0.500 | 0.500 | 0.000 | 0.294 |
| formula_pvp_adjust_param_data | element_dam_rate_no | 0.049 | 0.500 | 0.444 | 0.000 | 0.276 |
| formula_pvp_adjust_param_data | formula_pvp_tier_base_factor_data | 0.000 | 0.429 | 0.571 | 0.000 | 0.271 |
| formula_pvp_tier_base_factor_data | formula_pvp_adjust_max_hp_data | 0.000 | 0.400 | 0.571 | 0.000 | 0.263 |
| formula_pvp_adjust_max_hp_data | element_dam_rate_no | 0.077 | 0.333 | 0.444 | 0.000 | 0.234 |
| formula_pvp_adjust_leaves_data | element_dam_rate_no | 0.045 | 0.400 | 0.400 | 0.000 | 0.234 |
| formula_pvp_tier_base_factor_data | element_dam_rate_no | 0.067 | 0.300 | 0.429 | 0.000 | 0.217 |
| formula_pvp_global_param_data | formula_pvp_adjust_max_hp_data | 0.000 | 0.333 | 0.286 | 0.000 | 0.171 |
| formula_pvp_global_param_data | formula_pvp_tier_base_factor_data | 0.000 | 0.250 | 0.200 | 0.000 | 0.125 |
| formula_pvp_adjust_leaves_data | formula_pvp_global_param_data | 0.000 | 0.200 | 0.250 | 0.000 | 0.122 |
| formula_pvp_adjust_param_data | formula_pvp_global_param_data | 0.000 | 0.167 | 0.286 | 0.000 | 0.121 |

## PvP Formula Family Graph

**Nodes**: 7
**Edges**: 21
**Connected components**: 1

### Nodes

| Table | File Size | f64 Unique | u32 Unique | Groups | Markers |
|-------|-----------|------------|------------|--------|---------|
| formula_pvp_adjust_leaves_data | 1092 | 12 | 5 | 4 | 8 |
| formula_pvp_adjust_param_data | 2944 | 53 | 6 | 1 | 7 |
| formula_pvp_global_param_data | 528 | 0 | 1 | 1 | 2 |
| formula_pvp_tier_base_factor_data | 856 | 5 | 4 | 1 | 4 |
| formula_pvp_adjust_max_hp_data | 496 | 3 | 3 | 1 | 7 |
| formula_pvp_armor_factor_data | 484 | 1 | 1 | 1 | 0 |
| element_dam_rate_no | 808 | 11 | 9 | 1 | 6 |

### Edges (weight = composite similarity)

| Source | Target | Weight | Shared f64 | Shared u32 | Shared Markers |
|--------|--------|--------|------------|------------|----------------|
| formula_pvp_adjust_leaves_data | formula_pvp_adjust_param_data | 0.483 | 3 | 5 | 7 |
| formula_pvp_adjust_leaves_data | formula_pvp_adjust_max_hp_data | 0.474 | 3 | 3 | 7 |
| formula_pvp_adjust_param_data | formula_pvp_adjust_max_hp_data | 0.406 | 1 | 3 | 7 |
| formula_pvp_global_param_data | formula_pvp_armor_factor_data | 0.300 | 0 | 1 | 0 |
| formula_pvp_adjust_leaves_data | formula_pvp_tier_base_factor_data | 0.294 | 1 | 3 | 4 |
| formula_pvp_adjust_param_data | element_dam_rate_no | 0.276 | 3 | 5 | 4 |
| formula_pvp_adjust_param_data | formula_pvp_tier_base_factor_data | 0.271 | 0 | 3 | 4 |
| formula_pvp_tier_base_factor_data | formula_pvp_adjust_max_hp_data | 0.263 | 0 | 2 | 4 |
| formula_pvp_adjust_max_hp_data | element_dam_rate_no | 0.234 | 1 | 3 | 4 |
| formula_pvp_adjust_leaves_data | element_dam_rate_no | 0.234 | 1 | 4 | 4 |
| formula_pvp_tier_base_factor_data | element_dam_rate_no | 0.217 | 1 | 3 | 3 |
| formula_pvp_global_param_data | formula_pvp_adjust_max_hp_data | 0.171 | 0 | 1 | 2 |
| formula_pvp_global_param_data | formula_pvp_tier_base_factor_data | 0.125 | 0 | 1 | 1 |
| formula_pvp_adjust_leaves_data | formula_pvp_global_param_data | 0.122 | 0 | 1 | 2 |
| formula_pvp_adjust_param_data | formula_pvp_global_param_data | 0.121 | 0 | 1 | 2 |
| formula_pvp_adjust_max_hp_data | formula_pvp_armor_factor_data | 0.100 | 0 | 1 | 0 |
| formula_pvp_tier_base_factor_data | formula_pvp_armor_factor_data | 0.075 | 0 | 1 | 0 |
| formula_pvp_global_param_data | element_dam_rate_no | 0.069 | 0 | 1 | 1 |
| formula_pvp_adjust_leaves_data | formula_pvp_armor_factor_data | 0.060 | 0 | 1 | 0 |
| formula_pvp_adjust_param_data | formula_pvp_armor_factor_data | 0.050 | 0 | 1 | 0 |

### Connected Components

**Component 0**: element_dam_rate_no, formula_pvp_adjust_leaves_data, formula_pvp_adjust_max_hp_data, formula_pvp_adjust_param_data, formula_pvp_armor_factor_data, formula_pvp_global_param_data, formula_pvp_tier_base_factor_data

## Schema Sharing Likelihood Ranking

| Rank | Table | Schema Score | Shared f64 | Shared u32 | Shared Markers | High-comp edges | Max Comp |
|------|-------|--------------|------------|------------|----------------|-----------------|----------|
| 1 | formula_pvp_adjust_leaves_data | 118.983 | 8 | 17 | 24 | 2 | 0.483 |
| 2 | formula_pvp_adjust_param_data | 118.483 | 7 | 18 | 24 | 2 | 0.483 |
| 3 | formula_pvp_adjust_max_hp_data | 106.974 | 5 | 13 | 24 | 2 | 0.474 |
| 4 | element_dam_rate_no | 85.776 | 6 | 17 | 16 | 0 | 0.276 |
| 5 | formula_pvp_tier_base_factor_data | 71.794 | 2 | 13 | 16 | 0 | 0.294 |
| 6 | formula_pvp_global_param_data | 33.300 | 0 | 6 | 8 | 0 | 0.300 |
| 7 | formula_pvp_armor_factor_data | 9.300 | 0 | 6 | 0 | 0 | 0.300 |

## Strongest Next Semantic Anchor

**Rationale**: High schema_likelihood_score / low decoded coverage = best next research target. Tables with the most shared schema but the least extracted evidence offer the highest leverage.

| Rank | Table | Schema Score | f64 Unique | u32 Unique | File Size | Anchor Score |
|------|-------|--------------|------------|------------|-----------|--------------|
| 1 | formula_pvp_global_param_data | 33.300 | 0 | 1 | 528 | 22.200 |
| 2 | formula_pvp_adjust_max_hp_data | 106.974 | 3 | 3 | 496 | 19.450 |
| 3 | formula_pvp_tier_base_factor_data | 71.794 | 5 | 4 | 856 | 8.974 |

## Blockers

1. **No field naming attempted** (per scope). All relationships are
   candidate-only and based on value/marker presence, not byte-level
   structural decoding.
2. **No leaf mapping attempted** (per scope). Cluster co-occurrence
   does not establish which value maps to which leaf.
3. **String region detection is heuristic** (4+ printable chars).
   Some schema strings may span multiple regions or include
   non-ASCII characters not yet handled.
4. **Trailer detection is fixed-size** (last 30 bytes). Tables with
   longer bytecode imports may have false trailer boundaries.
5. **Jaccard similarity treats all values as equally meaningful**.
   Some shared values may be padding (0.0) or coincidental.

## Safe-to-Commit Verdict

**Status**: All deliverables are candidate-only research outputs.
**No production code was modified.**
**No field naming or leaf mapping claims are made.**
Only relationship evidence is reported.

## Files

- `src/tools/v2_pvp_formula_family_extractor.py` — extraction + analysis tool
- `data/research/bindict_decode/pvp_family_extractions.json` — per-table raw extractions
- `data/research/bindict_decode/pvp_value_frequency_maps.json` — frequency maps
- `data/research/bindict_decode/pvp_shared_value_clusters.json` — cluster analysis
- `data/research/bindict_decode/pvp_table_similarity_matrix.json` — pairwise matrix
- `data/research/bindict_decode/pvp_formula_family_graph.json` — family graph
- `data/research/bindict_decode/pvp_table_schema_ranking.json` — ranking
- `docs/research-notes/v2-pvp-formula-family-graph.md` — this report
