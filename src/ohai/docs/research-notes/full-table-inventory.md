# Full Recovered Table Inventory — Once Human Master Calculator

**Generated:** 2026-06
**Purpose:** Catalog of *actually recovered* tables/modules from bindict / client data sources. This is the foundation for targeted combat mechanic recovery (Burn 202, Frost Vortex 203, Power Surge 204, etc.).

**Key Insight (from target combat scanner run):**  
The scanner looked for exact names like `skill_data`, `buff_data`, `effect_data`, `stardust_gun_skill_data` and found **0**.  
The real assets use internal naming such as:
- `active_skill_data`
- `active_skill_config_data`
- `effect_keyword_item_data`
- `player_buff*` / behavior player buff variants
- `game_common_data_*_skill_data`
- `client_data_*_data`

We were hunting for names we *thought* existed. This inventory maps what we actually possess.

**Sources inventoried:**
- `data/research/bindict_extracted/` — 33,556 raw binary payloads (`.raw`)
- `docs/external-research/OHEXTRACTDATA/client_data/` — 283 decompiled Python data modules
- `data/research/bindict_decode/` — 74+ analysis/decoder JSON + MD reports (v1/v2)
- `data/research/bindict_decode/offline_exports/` — 20 decoded `.pyc.json` examples
- `docs/external-research/` — additional research notes + NeoXResearch
- `recovered_mobile_pyc*` — currently empty / not contributing new tables

**Total unique recovered modules (from .raw naming):** ~33,556 (many duplicates across const variants).

---

## Summary Counts

| Category          | Approx. Count (combat-filtered where possible) | Notes |
|-------------------|------------------------------------------------|-------|
| **Skills**        | 100+                                           | active_skill_*, achieve_skill_*, ai_voice_skill_*, deviation_skill_*, behavior_*_skill_* |
| **Buffs**         | 80+                                            | effect_keyword_*, player_buff_*, behavior_*_buff_*, buff_tag_data (analyzed) |
| **Effects**       | 150+                                           | effect_*, halo_effect_*, vehicle_*_effect_*, cradle_tip_effect_* |
| **Combat**        | 200+                                           | combat_property_inner_data (key), combat_unit_property, behavior_*_attack_* |
| **Formula**       | 50+                                            | formula_pvp_* (many decoded), ac_fac_formula_data |
| **Weapons/Guns**  | 300+                                           | gun_*_data (ads, sfx, drag, rotate, etc.), bullet_pattern_data |
| **Armor**         | 30+                                            | armor_type_data, v2_armor_type_data_automated_decode |
| **Items**         | 400+                                           | item_*, accessories_*, ad_store_*, activity_* |
| **Misc / Other**  | Thousands                                      | UI, AI, sound, camera, activity, etc. |

**Combat-relevant filter** (loose keyword match on name): ~15,117 out of 33k .raw files.

---

## Skills Family

### Key Recovered Tables (bindict_extracted .raw)
- `active_skill_data` (and `active_skill_config_data`, `active_skill_generate_map_data`, `active_skill_name_map`)
- `achieve_skill_data`
- `ai_voice_skill_data`
- `deviation_skill_extra_data`, `deviation_skill_pool_name`
- `abnormal_skill_param_data`
- Numerous `behavior_*_skill_*` and `game_common_data_*_skill_data`

**Decompiled sources (OHEXTRACTDATA/client_data):**
- `attack_btn_icon_data.py`
- Various skill-related under game_common / client_data prefixes (exact matches limited in initial scan; more exist under behavior/monster folders).

**Combat relevance:** High. These are the primary containers for skill definitions, including weapon skills, deviation skills, and status-inflicting skills. Likely contain the keyword/proc routing for 202 (Burn), 203 (Frost Vortex), 204 (Power Surge), etc.

**Format:** Binary payload (`.raw`). String counts available after layered decode (v2 format common).

**Analyzed artifacts:**
- `v2_combat_property_inner_data_chunked_analysis.json` (cross-references skill behavior)
- Multiple behavior attack skill .raw files (e.g. behavior_a_*_attack_*)

**Notes:** The plain `skill_data` / `stardust_gun_skill_data` names from the target list do not appear. Use `active_skill_*` and `game_common_data_*_skill_*` families instead.

---

## Buffs Family

### Key Recovered Tables
- `effect_keyword_item_data`, `effect_keyword_skin_group_data`, `effect_keyword_tab_config_data`
- `client_data_item_buff_attr_info_data`
- Many `game_common_data_behavior_*_buff_*` and `player_buff_*` (XMLZ, soundeaterqte, debuff variants, sco_* healbuffs)
- `buff_tag_data` (analyzed)

**Decompiled sources:**
- `effect_keyword_*_data.py`
- Various under client_data and game_common for buff attributes and behavior.

**Combat relevance:** Very High. `effect_keyword_*` directly ties to the tracked keyword IDs (202, 203, 204, 205, 207). Buffs are the delivery mechanism for status effects (Burn stacks, Frost Vortex, Power Surge, Shrapnel, Mark/Bullseye).

**Format:** Binary + decoded analysis (`v2_buff_tag_data_automated_decode.json`).

**Existing analysis:**
- `v2_buff_tag_data_automated_decode.json` — 4 KB, explicit `buff_tag_data` table with strings and likely keyword mappings.

**Notes:** `player_buff_data` style names appear in behavior extracts. Search for "buff" + "keyword" or "effect_keyword" for the mechanic definitions.

---

## Effects Family

### Key Recovered Tables
- `cradle_tip_effect_data`
- `effect_keyword_*` (overlaps with buffs)
- `halo_effect_ignore_slot`
- `vehicle_contact_effect_data`, `vehicle_pipe_effect_data`, `vehicle_wheel_effect_data`
- Many `client_data_*_effect_*` and `game_common_data_*_effect_*`

**Decompiled sources:**
- Multiple `*_effect_data.py` and effect keyword configs.

**Combat relevance:** High for status/keyword procs. Effects are the runtime application of buffs/skills (durative attacks, damage over time, keyword triggers).

**Format:** Binary payloads. Some decoded in offline_exports and v* analysis.

**Notes:** Strong overlap with the NodeDurativeAttack / NodeAttack logic in OHEXTRACTDATA (damage_times, damage_gap, element_type, keyword).

---

## Combat Family (Property Registries & Core Mechanics)

### Standout Tables
- **`combat_property_inner_data`** (v2_combat_property_inner_data_chunked_analysis.json)
  - Size: ~2.4 MB (one of the largest combat artifacts)
  - Format: v2 (heavy use of 0x96 separators, f32/f64 blocks)
  - String count: High (from chunk analysis)
  - Combat relevance: **Critical**. Contains repeated `0xca` (202), `e202f005` sequences, floating-point coefficients, and property-like structures (likely Attack/Psi/Crit/Weakspot/Bonus registries rather than per-mechanic definitions).
  - Existing analysis: Chunked with separator offsets, raw hex samples showing combat param blocks + keyword hits.

- `combat_unit_property_auto_adjust_data` (v2_combat_unit_property_auto_adjust_extraction.json)
  - Headers with 02/03/04 sequences (possible type/keyword routing).
  - f64 samples and property adjustments.

**Other combat-related:**
- Many `behavior_*_attack_*` (monster/NPC combat behaviors)
- `auto_gen_data_static_npc_mark_data`
- Various AI combat behavior files

**Notes:** `combat_property_inner_data` is probably the "property registry" the user suspected (Attack, Psi, bonuses for Burn/Status/Element/KeywordProc). Valuable for final_dam_add_rate style multipliers, but not the primary home of "Burn coefficient = 0.12" definitions. Those are more likely in skill/effect/buff families.

---

## Formula Family

### Key Tables (heavily analyzed)
- `formula_pvp_adjust_param_data`, `formula_pvp_global_param_data`
- `formula_pvp_adjust_leaves_data`
- `formula_pvp_armor_factor_data`
- `formula_pvp_adjust_max_hp_data`
- Many `v2_decoded_formula_pvp_*` and `v2_formula_pvp_*_automated_decode.json`

**Sizes:** Some very large (274 KB, 152 KB, 141 KB) — dense coefficient data.

**Combat relevance:** Extremely High for the official formula graph (final_attack, add_rate, ignore_dam_rate, etc.). Directly relevant to `use_final_dam_add_rate`, `keyword_proc_dam_add_rate`, etc.

**Decompiled sources:** Formula logic lives in `dcs_extend/` (CompFormulaAdapter.py and related).

**Existing artifacts:**
- Multiple `v2_formula_pvp_*` JSONs with leaves, ordering, values, schema candidates.
- Strong source of numeric anchors (0.5, 1.0, etc.).

---

## Weapons / Guns / Bullets Family

### Major Groups
- `gun_*_data`: gun_ads_params_data (638 KB — large), gun_sfx_*, gun_drag_*, gun_rotate_speed_data, gun_setting_data, gun_hit_*, gun_pendant_data, gun_sticker_data, gun_exterior_system_data, etc.
- `bullet_pattern_data`
- `gun_acc_strength_data`
- Many `weapon_*` and `item_to_gun_*` variants

**Decompiled:** Dozens of `gun_*_data.py` in client_data.

**Combat relevance:** High for base params, bullet behavior, accessory effects on procs/keywords, weapon prototype data.

**Notes:** Overlaps with `gun_base_params_data`, `bullet_base_params_data`, `gun_accessory_bullet_params_data`, `weapon_prototype_data` from the original target list (naming variants exist).

---

## Armor Family

- `armor_type_data` (analyzed in `v2_armor_type_data_automated_decode.json`)
- Related set bonus and armor property tables in extracted.

**Combat relevance:** Medium-High (mitigation, set effects on keywords/status).

---

## Items / Misc (Combat-adjacent)

- Large numbers of `item_*`, `accessories_*`, `ad_*`, `activity_*`, `ai_*`, camera, sound, UI config.
- `bullet_*` and `projectile` related behavior files.

**Combat relevance:** Selective — filter for those referencing keywords, damage, or status.

---

## Sources & Formats

- **Raw payloads** (`data/research/bindict_extracted/*.raw`): Binary, v1/v2 layered formats. Primary source for table data. Decode via existing bindict tools to get strings + records.
- **Decompiled sources** (`docs/external-research/OHEXTRACTDATA/client_data/*.py`): Python representations of the data tables + logic. Excellent for field names and enums (see NodeAttack.py / NodeDurativeAttack.py / CompFormulaAdapter.py).
- **Analysis artifacts** (`data/research/bindict_decode/v2_*_automated_decode.json` and chunked analyses): Already-decoded or partially reverse-engineered tables with string counts, hex samples, and some structure (e.g. combat_property_inner, buff_tag, element_type, formula_pvp families).
- **Offline exports**: Small set of decoded examples.

**String counts:** Available in most v2 analysis JSONs (e.g. 9+ strings in small tables; hundreds/thousands in large combat/gun tables). Raw .raw require running the decoder.

---

## Recommended Next Actions (aligned with user priorities)

1. **Full table inventory (this doc)** — Done. Use as the canonical catalog going forward.

2. **Enumerate every combat-related table name** — Prioritize these families for the next scanner pass:
   - `active_skill_*`, `achieve_skill_*`, `deviation_skill_*`
   - `effect_keyword_*`
   - `player_buff_*` / behavior player buff variants
   - `combat_property_inner_data` (deeper clustering)
   - All `gun_*`, `bullet_*`, `weapon_prototype*`
   - Existing analyzed v2 combat/formula tables

3. **Decode active_skill / effect_keyword / player_buff families** — Run the layered decoder + target combat scanner (updated with real names) on the highest-relevance .raw files. Extract strings + record payloads.

4. **Cluster all `e202` / `ca02` / `ca03` / `ca01` occurrences** — Especially in `combat_property_inner_data` and related combat .raw. For each hit:
   - Record exact offset
   - 128–256 byte window
   - Neighboring floats (0.04/0.12 candidates)
   - Neighboring separators (0x96 0x05, 0x76 0x0b, etc.)
   - Repeated patterns across chunks

5. **Recover row boundaries** around the clusters above. Look for consistent record size, TLV markers, or 0x96-block structure.

6. **Only after the above**: Chase specific coefficients and map to the NodeAttack / NodeDurativeAttack port structure (`attack_value`, `damage_amount`, `damage_times`, `damage_gap`, `element_type`, `formula_attack_type`, `keyword`, `use_final_*_rate`, etc.).

**Current bottleneck (confirmed):** We do not yet have a reliable mapping from the "mechanic keyword IDs" (202, 203, 204...) to their defining tables. The inventory above + targeted decode of the skill/effect_keyword families + e202 clustering should surface the mechanic definitions.

All artifacts remain research-only. No production data modified.

---

**End of inventory.** Use this as the single source of truth for "what tables we actually have" before the next round of decoding or clustering work.