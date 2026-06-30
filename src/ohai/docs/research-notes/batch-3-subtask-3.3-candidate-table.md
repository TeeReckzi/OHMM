# Batch 3 Subtask 3.3 — Consolidated Candidate Table

> **THIS IS A RESEARCH NOTE, NOT A SPEC.**
> Every item below is a **CANDIDATE** for future implementation.
> **DO NOT IMPLEMENT** any of these until the source bindings,
> enum values, and v2+ payloads have been recovered and validated
> against game behavior.
>
> **DO NOT overwrite** any locked raw data modules
> (`data/extracted/`, `data/normalized/`, `data/raw/`,
> `data/normalized/official-tables/`).

---

## Legend

| Column | Meaning |
|--------|---------|
| **Field / Enum ID** | Name used in code or bindict payload |
| **Observed values** | Integer/string/bool values seen in source |
| **Source refs** | File:line(s) where value/name was confirmed |
| **Evidence strength** | A=direct decompilation, B=inferred from usage, C=name only |
| **Candidate label** | Proposed name or routing hint |
| **Confidence** | A_project_verified / B_owner_approved_names_pending_* / C_no_evidence |
| **Blockers** | What must happen before production use |

---

## 1. Combat Runtime Payload Fields

| Field / Enum ID | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `formula_attack_type` | 0..7 (Default, Melee, Remote, Bomb, Dot, Skill, Item, Facility) | formula_const.py:39-49; NodeAttack.py (editor binding) | A | enum → FormulaAttackType | A_project_verified | None; values confirmed from decompiled Python |
| `sub_melee_attack_type` | 0..4 (Any, Combo, Heavy, Dash, Backstab) | formula_const.py:50-57; NodeAttack.py (editor binding) | A | enum → SubMeleeAttackType | A_project_verified | None; values confirmed |
| `damage_feature_type` | -1 (NO_RESET), 0 (NONE), 1 (Cut), 2 (Blunt), 99 (ANY) | formula_const.py:58-65; NodeAttack.py (editor binding) | A | enum → DamageFeatureType | A_project_verified | None; values confirmed |
| `element_type` | 0 (PHYSICS) .. 10 (STUN) | logic_state_const.py:112-125 | A | enum → ElementType | A_project_verified | None; values confirmed |
| `keyword` | int (201..209 for weapon keywords; 101..109 for unit/event IDs) | damage_event_parser.py:36-56 | A | WeaponPlaqueType integer | A_project_verified | Needs routing to keyword effects; `EffectKeywordEvent` values still unknown |
| `keyword_tag` | int (same space as `keyword`) | NodeAttack.py (field exists) | B | Related to keyword selection | B_pending_verification | Semantic difference from `keyword` not confirmed; may be subtype tag |
| `pvp_damage_rate` | number (likely 0..1 or ratio) | bindict-impl-readiness.md (field name only) | C | scalar multiplier | C_no_evidence | Needs sample value from runtime packet or bindict table |
| `structure_attack` | number | bindict-impl-readiness.md (field name only) | C | scalar (structure damage override) | C_no_evidence | Needs sample value |
| `vehicle_attack` | number | bindict-impl-readiness.md (field name only) | C | scalar (vehicle damage override) | C_no_evidence | Needs sample value |
| `use_final_dam_add_rate` | bool | bindict-impl-readiness.md (field name only) | C | switch (enable final_dam_add_rate) | C_no_evidence | Needs sample value |
| `use_final_ignore_dam_rate` | bool | bindict-impl-readiness.md (field name only) | C | switch (enable final_ignore_dam_rate) | C_no_evidence | Needs sample value |
| `extra_toughness_dam_rate` | number | bindict-impl-readiness.md (field name only) | C | scalar (toughness bonus mult) | C_no_evidence | Needs sample value |
| `damage_amount` | number | bindict-impl-readiness.md (field name only) | C | scalar (multi-hit/proc damage) | C_no_evidence | Needs sample value |
| `ignore_field` | bool | bindict-impl-readiness.md (field name only) | C | switch (bypass force-field) | C_no_evidence | Needs sample value |
| `ignore_structure_field` | bool | bindict-impl-readiness.md (field name only) | C | switch (bypass structure shield) | C_no_evidence | Needs sample value |
| `ignore_weak_part_rate` | number | bindict-impl-readiness.md (field name only) | C | scalar (bypass part mult) | C_no_evidence | Needs sample value |
| `jump_word_element_type` | enum (same values as element_type?) | bindict-impl-readiness.md (field name only) | C | UI element display override | C_no_evidence | Needs enum values and relationship to element_type |
| `be_hit_type` | 0 (DEFAULT), 1 (SHARE_DEATH), 2 (DIRECT_DAMAGE), 3 (KILL), 4 (KEYWORD_SIMULATE), 101 (ATTACK_TYPE_IMMUNE) | health_const.py:113-121 | A | enum → BE_HIT_TYPE / EditorDamageBeHitType | A_project_verified | None; values confirmed |
| `direct_damage_ignore_field` | bool | bindict-impl-readiness.md (field name only) | C | switch (direct-dmg field bypass) | C_no_evidence | Needs sample value |
| `damage_cause_type` | 0 (DEFAULT), 1 (PHYSICS_CONTROL), 2 (DEVIATION_COMBAT) | health_const.py:107-112 | A | enum → DAMAGE_CAUSE_TYPE / EditorDamageCauseType | A_project_verified | None; values confirmed |
| `source_behavior` | string (values unknown) | NodeDamage.py (StrType enum=DamageSourceBehavior) | C | string enum → DamageSourceBehavior | C_no_evidence | Need to recover string values from game binary; not found in decompiled Python |
| `invincible_tag` | int (tag ID for invincibility bypass) | bindict-impl-readiness.md (field name only) | C | tag routing | C_no_evidence | Needs sample value and tag enum |
| `damage_select_arg` | int (target selection argument) | bindict-impl-readiness.md (field name only) | C | routing parameter | C_no_evidence | Needs sample value |
| `pre_buff_effect` | object (pre-hit buff payload) | bindict-impl-readiness.md (field name only) | C | buff/proc context | C_no_evidence | Needs sample payload structure |

### Be-Hit Sync Fields

| Field / Enum ID | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `dis_dam_rate` | number | bindict-impl-readiness.md (field name only) | C | distance damage rate scalar | C_no_evidence | Needs sample value |
| `in_weapon_range` | bool | bindict-impl-readiness.md (field name only) | C | in-range flag | C_no_evidence | Needs sample value |
| `field_damage_percent` | number (0..1 percent) | bindict-impl-readiness.md (field name only) | C | field-dmg % scalar | C_no_evidence | Needs sample value |
| `in_reuse` | bool | bindict-impl-readiness.md (field name only) | C | reused damage state flag | C_no_evidence | Needs sample value |
| `low_attack` | bool | bindict-impl-readiness.md (field name only) | C | low attack flag | C_no_evidence | Needs sample value |
| `is_anomaly` | bool | bindict-impl-readiness.md (field name only) | C | anomaly state flag | C_no_evidence | Needs sample value |
| `consume_field_type` | enum | bindict-impl-readiness.md (field name only) | C | field consumption type enum | C_no_evidence | Needs enum values and sample |

---

## 2. Hit / Result Flags

| Flag | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `weak_attack` | bool | bindict-impl-readiness.md (section: hit flags) | C | weakspot hit flag | C_no_evidence | Needs source confirmation from runtime packet |
| `crit_attack` | bool | bindict-impl-readiness.md (section: hit flags) | C | critical hit flag | C_no_evidence | Needs source confirmation from runtime packet |
| `head_shot` | bool | bindict-impl-readiness.md (section: hit flags) | C | headshot flag | C_no_evidence | Needs source confirmation from runtime packet |
| `back_stab` | bool | bindict-impl-readiness.md (section: hit flags) | C | backstab flag | C_no_evidence | Needs source confirmation from runtime packet |
| `low_attack` | int/bool? | bindict-impl-readiness.md (section: hit flags) | C | low attack flag | C_no_evidence | Needs source confirmation — may overlap with be-hit sync field |
| `is_anomaly` | bool | bindict-impl-readiness.md (section: hit flags) | C | anomaly flag | C_no_evidence | Needs source confirmation |
| `in_weapon_range` | bool | bindict-impl-readiness.md (section: hit flags) | C | in-weapon-range flag | C_no_evidence | Needs source confirmation |
| `in_reuse` | bool | bindict-impl-readiness.md (section: hit flags) | C | damage state reuse flag | C_no_evidence | Needs source confirmation |

**Blockers (all):** Need runtime packet capture or bindict payload decode to confirm boolean field names and which flags are truly booleans vs integer enums.

---

## 3. Hit Counters and Trigger Counters

| Counter | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `damage_amount` | number (cumulative?) | bindict-impl-readiness.md (section: counters) | C | cumulative damage for multi-hit | C_no_evidence | Needs sample — may be same field as attack node damage_amount |
| `nml_attack_cnt` | int | bindict-impl-readiness.md (section: counters) | C | normal attack count | C_no_evidence | Needs sample from runtime packet |
| `crit_attack_cnt` | int | bindict-impl-readiness.md (section: counters) | C | critical attack count | C_no_evidence | Needs sample from runtime packet |
| `weak_attack_cnt` | int | bindict-impl-readiness.md (section: counters) | C | weakspot attack count | C_no_evidence | Needs sample from runtime packet |

**Blockers (all):** No source beyond field name listing. Need runtime packet capture to confirm field names, count semantics (per-hit vs per-combat), and trigger conditions.

---

## 4. Keyword IDs and Keyword Routing

### WeaponPlaqueType (keyword IDs — CONFIRMED)

| ID | Name | Source ref | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| 101 | UNIT_TYPE_HUMAN | damage_event_parser.py:39 | A | Unit type filter (human) | A_project_verified | Needs routing in damage_event_parser |
| 102 | UNIT_TYPE_NONE_HUMAN | damage_event_parser.py:40 | A | Unit type filter (non-human) | A_project_verified | Needs routing |
| 103 | UNIT_PROTOTYPE_MONSTER_LEADER | damage_event_parser.py:41 | A | Prototype filter (monster leader) | A_project_verified | Needs routing |
| 104 | WEAK_ATTACK | damage_event_parser.py:42 | A | Weak attack flag | A_project_verified | Needs routing |
| 105 | NOT_IN_BATTLE | damage_event_parser.py:43 | A | Battle state filter | A_project_verified | Needs routing |
| 106 | FORCE_EXECUTE | damage_event_parser.py:44 | A | Force execution flag | A_project_verified | Needs routing |
| 107 | UNIT_SPECIES_ROSETTA | damage_event_parser.py:45 | A | Species filter (Rosetta) | A_project_verified | Needs routing |
| 108 | UNIT_SPECIES_ALERT | damage_event_parser.py:46 | A | Species filter (Alert) | A_project_verified | Needs routing |
| 109 | UNIT_SPECIES_VULCHER | damage_event_parser.py:47 | A | Species filter (Vulcher) | A_project_verified | Needs routing |
| 201 | BUFF_KEYWORD_BLAST | damage_event_parser.py:48 | A | Keyword: Blast | A_project_verified | Needs routing to keyword effect system |
| 202 | BUFF_KEYWORD_SCORCH | damage_event_parser.py:49 | A | Keyword: Scorch/Burn | A_project_verified | Needs routing |
| 203 | BUFF_KEYWORD_VORTEX | damage_event_parser.py:50 | A | Keyword: Frost Vortex | A_project_verified | Needs routing |
| 204 | BUFF_KEYWORD_SURGE | damage_event_parser.py:51 | A | Keyword: Power Surge | A_project_verified | Needs routing |
| 205 | BUFF_KEYWORD_SHRAP | damage_event_parser.py:52 | A | Keyword: Shrapnel | A_project_verified | Needs routing |
| 206 | BUFF_KEYWORD_PROJ | damage_event_parser.py:53 | A | Keyword: Projectile | A_project_verified | Needs routing |
| 207 | BUFF_KEYWORD_MARK | damage_event_parser.py:54 | A | Keyword: Mark/Bullseye | A_project_verified | Needs routing |
| 208 | BUFF_KEYWORD_QUICK_DRAW | damage_event_parser.py:55 | A | Keyword: Quick Draw | A_project_verified | Needs routing (new: not in original 201-207 table) |
| 209 | BUFF_KEYWORD_ARMED | damage_event_parser.py:56 | A | Keyword: Armed | A_project_verified | Needs routing (new: not in original 201-207 table) |

### EffectKeywordEvent (NOT RECOVERED)

| Enum | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `EffectKeywordEvent` | NOT FOUND | NodeKeywordEvent.py (IntType enum ref) | C | Keyword event ID enum | C_no_evidence | Not found in decompiled Python; likely C++ integer enum. May overlap with WeaponPlaqueType (201-209) or be a different namespace. |

---

## 5. Final Damage Formula Switches

| Field / Enum ID | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `use_final_dam_add_rate` | bool | bindict-impl-readiness.md (section: attack payload) | C | Enable final_dam_add_rate term | C_no_evidence | Needs sample from runtime packet |
| `use_final_ignore_dam_rate` | bool | bindict-impl-readiness.md (section: attack payload) | C | Enable final_ignore_dam_rate term | C_no_evidence | Needs sample from runtime packet |

### `final_attack_rate_dic` known keys

| Key | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `rate` | number (likely 1.0 default) | bindict-impl-readiness.md (section: final_attack_rate_dic) | C | scalar multiplier | C_no_evidence | Needs validation from V2+ payload decode |
| `building_rate` | number | bindict-impl-readiness.md (section: final_attack_rate_dic) | C | building damage multiplier | C_no_evidence | Needs validation |
| `formula_type_rate` | number | bindict-impl-readiness.md (section: final_attack_rate_dic) | C | formula-type-specific multiplier | C_no_evidence | Needs validation |

**Blockers (all):** V2+ payload decode needed; dictionary keys confirmed by name only. May have additional keys not yet documented.

---

## 6. Durative / High-Frequency Damage Model

| Field | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `damage_times` | number (count of ticks) | bindict-impl-readiness.md (section: durative) | C | tick count | C_no_evidence | Needs sample from runtime packet or bindict table |
| `damage_gap` | number (seconds between ticks) | bindict-impl-readiness.md (section: durative) | C | tick interval (seconds) | C_no_evidence | Needs sample |
| `is_accumlate_damage` | bool (note: typo "accumlate" in source) | bindict-impl-readiness.md (section: durative) | C | accumulate damage flag | C_no_evidence | Needs sample; preserve source typo |
| `is_resuse_last_damage` | bool (note: typo "resuse" in source) | bindict-impl-readiness.md (section: durative) | C | reuse last damage flag | C_no_evidence | Needs sample; preserve source typo |
| `reuse_last_time` | number (seconds) | bindict-impl-readiness.md (section: durative) | C | reuse window (seconds) | C_no_evidence | Needs sample |

**Blockers (all):** No source beyond field name listing. Need NodeDurativeAttack.py editor doc or runtime packet to confirm.

---

## 7. Ammo / Bullet / Accessory Pipeline

| Field | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `CostBulletType` | 0 (BULLET_BOX), 1 (BULLET_ITEM), 2 (BULLET_ARROW) | shoot_const.py:950-955 | A | enum | A_project_verified | None; values confirmed |
| `BulletBaseType` | 1 (NORMAL), 2 (RINGLIKE), 3 (TRAJECTORY), 4 (TRAJECTORY_SIMULATE), 5 (THROUGH) | shoot_const.py:172-179 | A | enum | A_project_verified | None; values confirmed |
| `use_bullet_no` | int | gun_base_params_data table field; weapon_prototype_data field | B | bullet ID used by weapon | B_pending_verification | Needs decoded payload to confirm field type and valid range |
| `bullet_base_no` | int | weapon_prototype_data field; bullet_base_params_data key | B | base bullet type ID | B_pending_verification | Needs decoded payload |
| `gun_element_affix` | int (element type override?) | dcs_extend component code reference | C | element affix ID | C_no_evidence | Needs sample; relationship to ElementType unclear |
| `gun_element_affix_value` | number | dcs_extend component code reference | C | element affix magnitude | C_no_evidence | Needs sample |
| `ammo_accessory_no` | int | dcs_extend component code reference | C | runtime accessory link | C_no_evidence | Needs decoded payload |
| `origin_bullet_base_no` | int | dcs_extend component code reference | C | original bullet base (before skin override) | C_no_evidence | Needs decoded payload |
| `bullet_skin_replaced_result` | object | dcs_extend component code reference | C | bullet skin override result | C_no_evidence | Needs decoded payload |

### Priority Gun Pipeline Tables (17 tables)

All 17 placeholder JSON files exist at `data/normalized/official-tables/gun-pipeline/`. Each has `moduleStatus: "extracted_not_verified"`, field schemas extracted from `.get()` calls in dcs_extend code, and a single placeholder record with default values. **None contain decoded payload data.**

| Table | Key field | Placeholder file | Evidence | Blocker |
|---|---|---|---|---|
| `gun_base_params_data` | gun_no (runtime alias for weapon_prototype_data record) | gun_base_params_data.json | B | Needs actual payload decode |
| `bullet_base_params_data` | bullet_base_no | bullet_base_params_data.json | B | Needs actual payload decode |
| `bullet_trajectory_data` | bullet_base_no? | bullet_trajectory_data.json | B | Needs actual payload decode |
| `ringlike_bullet_data` | ringlike_bullet_no | ringlike_bullet_data.json | B | Needs actual payload decode |
| `gun_stability_data` | viewkick_no | gun_stability_data.json | B | Needs actual payload decode |
| `bullet_scatter_data` | bullet_scatter_no | bullet_scatter_data.json | B | Needs actual payload decode |
| `gun_system_data` | singleton (no key) | gun_system_data.json | B | Needs actual payload decode |
| `gun_accessory_bullet_params_data` | ammo_accessory_no | gun_accessory_bullet_params_data.json | B | Needs actual payload decode |
| `gun_accessory_bullet_map_data` | gun_no → ammo_accessory_no map | gun_accessory_bullet_map_data.json | B | Needs decoded payload |
| `bullet_recycle_config_data` | bullet_recycle_id | bullet_recycle_config_data.json | B | Needs decoded payload |
| `item_to_gun_mapping_data` | item_id → gun_no | item_to_gun_mapping_data.json | B | Needs decoded payload |
| `weapon_prototype_data` | gun_no (canonical table) | weapon_prototype_data.json | B | Needs decoded payload |
| `weapon_check_data` | prototype_no, blueprint_no | weapon_check_data.json | B | Needs decoded payload |
| `stardust_gun_skill_data` | gun_skill_no | stardust_gun_skill_data.json | B | Needs decoded payload |
| `passive_skill_data` | skill_no | passive_skill_data.json | B | Needs decoded payload |
| `gun_range_formula_template_data` | weapon_range_template_no | gun_range_formula_template_data.json | B | Needs decoded payload |
| `gun_reload_formula_template_data` | reload_loop_template_no | gun_reload_formula_template_data.json | B | Needs decoded payload |

**Blocker for all 17 tables:** The `.pyc` files for these tables do NOT exist in the OHEXTRACTDATA client_data directory extracted so far. They may be in a different client_data path or in the patch directory. Need to locate and decode them.

---

## 8. Range / Reload / Accuracy / Stability Pipeline

| Field | Observed values | Source refs | Evidence | Candidate label | Confidence | Blockers |
|---|---|---|---|---|---|---|
| `weapon_range_template_no` | int | weapon_prototype_data table field | B | range formula template selector | B_pending_verification | Needs decoded payload |
| `gun_range_formula_template_data` | object (range formula params) | gun_range_formula_template_data.json (placeholder) | B | range damage curve config | B_pending_verification | Needs actual data table decode |
| `damage_attenuation_ratio` | number (0..1 falloff ratio) | dcs_extend component code | B | per-bullet range attenuation | B_pending_verification | Needs sample |

---

## 9. Enum Recovery — All 18 Targets

### Fully Recovered (14 of 18)

| # | Enum | Values | Source | Evidence | Confidence | Blockers |
|---|---|---|---|---|---|---|
| 1 | `EditorFormulaAttackType` | 0..7 (Default..Facility) | formula_const.py:39-49 | A (same as FormulaAttackType) | A_project_verified | None (assumed identical to FormulaAttackType) |
| 2 | `FormulaAttackType` | 0..7 (Default..Facility) | formula_const.py:39-49 | A | A_project_verified | None |
| 3 | `EditorDamageFeatureType` | -1,0,1,2,99 (NO_RESET..ANY) | formula_const.py:58-65 | A (same as DamageFeatureType) | A_project_verified | None (assumed identical) |
| 4 | `DamageFeatureType` | -1,0,1,2,99 (NO_RESET..ANY) | formula_const.py:58-65 | A | A_project_verified | None |
| 5 | `EditorSubMeleeAttackType` | 0..4 (Any..Backstab) | formula_const.py:50-57 | A (same as SubMeleeAttackType) | A_project_verified | None (assumed identical) |
| 6 | `SubMeleeAttackType` | 0..4 (Any..Backstab) | formula_const.py:50-57 | A | A_project_verified | None |
| 7 | `EditorDamageBeHitType` | 0..4,101 (DEFAULT..ATTACK_TYPE_IMMUNE) | health_const.py:113-121 | A (same as BE_HIT_TYPE) | A_project_verified | None (assumed identical) |
| 8 | `EditorDamageCauseType` | 0..2 (DEFAULT..DEVIATION_COMBAT) | health_const.py:107-112 | A (same as DAMAGE_CAUSE_TYPE) | A_project_verified | None (assumed identical) |
| 9 | `ElementType` | 0..10 (PHYSICS..STUN) | logic_state_const.py:112-125 | A | A_project_verified | None |
| 10 | `AttackDamageType` | 0,1,2,3,99,100 (NORMAL..NONE) | shoot_const.py:811-819 | A | A_project_verified | None |
| 11 | `AttackWeaponType` | 1,2,3 (BULLET,BOMB,BUFF) | shoot_const.py:540-545 | A | A_project_verified | None (note: 1-based, not 0-based) |
| 12 | `CostBulletType` | 0,1,2 (BULLET_BOX..BULLET_ARROW) | shoot_const.py:950-955 | A | A_project_verified | None |
| 13 | `BulletBaseType` | 1..5 (NORMAL..THROUGH) | shoot_const.py:172-179 | A | A_project_verified | None |
| 14 | `HitMaterialWeaponType` | string-valued (gun, metal, punch, EMPTY, '') | shoot_const.py:850-857 | A | A_project_verified | None (note: string-valued, not integer) |

### Not Recovered (4 of 18)

| # | Enum | Status | Source refs | Evidence | Confidence | Blockers |
|---|---|---|---|---|---|---|
| 15 | `AttackBuffTagEnum` | NOT FOUND | NodeAttack.py, NodeDurativeAttack.py (editor ref only) | C | C_no_evidence | Class not in decompiled Python; likely C++. Related: `BuffTagType` in buff_const.py:99-109 (NONE=0, BURNING=1, FROST=2, RADIATION=3, MACHINE=4, CARRIER=5, EXPLODE=6, TACTICS_PROPS=7) — NOT confirmed to be same enum |
| 16 | `AttackBuffSubTagEnum` | NOT FOUND | NodeAttack.py, NodeDurativeAttack.py (editor ref only) | C | C_no_evidence | Same as AttackBuffTagEnum; likely C++ |
| 17 | `EffectKeywordEvent` | NOT FOUND | NodeKeywordEvent.py (IntType enum ref) | C | C_no_evidence | Likely C++ enum for keyword event IDs. May map to WeaponPlaqueType (201-209) or different namespace |
| 18 | `DamageSourceBehavior` | NOT FOUND | NodeDamage.py (StrType enum ref) | C | C_no_evidence | String-valued enum for `source_behavior` field. Values may be recoverable from game binary strings or editor Marshal data |

### Additional Recovered Enums (beyond original 18)

These were recovered as part of the Phase 3 research but were not in the original `bindict-impl-readiness.md` enum queue:

| Enum | Values | Source | Evidence | Confidence | Blockers |
|---|---|---|---|---|---|
| `UnitSpeciesType` | 0..8 (Default, Ascender, Alters, Rosetta, Vulcher, Creatures, Machina, Master, Deviation) | unit_const.py:170-181 | A | A_project_verified | None |
| `UnitSoulType` | string-valued (AVATAR='Soul', NPC='NPC', UAV='UAV', Enemy='Enemy', Animal='Animal', Monster='Monster', Boss='Boss', Deviation='Deviation', ~40 more) | unit_const.py:3-89 | A | A_project_verified | None (used for HUMAN_UNIT_SOUL_TUPLE grouping) |
| `EliteLevelEnumType` | 0..6,9,98 (Player, Normal, Elite, Boss, Destructible, Leader, Stronghold_unit, LogicObj, VEHICLE) | unit_const.py:119-130 | A | A_project_verified | None |
| `WeaponPlaqueType` | 101..109, 201..209 (unit filters + keyword IDs) | damage_event_parser.py:36-56 | A | A_project_verified | None (extends original 201-207 table) |

---

## 10. Additional Bindict Data Tables to Decode (Phase 3 Formula)

These bindict tables are needed for the Phase 3 formula leaves but are NOT yet decoded:

| Table | Needed for | Priority | Blocker |
|---|---|---|---|
| `buff_tag_data` | `suffix_debuff_name` → debuff attribute names (debuff_type_dam_add_rate) | HIGH | V2+ payload decode |
| `element_type_data` | `suffix_element_name` → element attribute names (element_type_dam_add_rate) | HIGH | V2+ payload decode |
| `char_property_data` | `extra_info.parent_attr_name_dict` → parent/sub attribute mapping | MEDIUM | V2+ payload decode |
| `armor_type_data` | `suffix_armor_name` → armor attribute names | MEDIUM | V2+ payload decode |
| `global_params_data` | Global formula parameters | LOW | V2+ payload decode |
| `UNIT_SPECIES_TYPE_INDEX_TYPE_NAME` dict | Full species→suffix mapping (currently only 'deviation' fallback known) | HIGH | Decompile from formula_const.py bytecode or char_property_data |
| `ATTACK_TYPE_INDEX_ATTR_NAME` dict | Full attack type→suffix mapping (currently only 'facility' fallback known) | MEDIUM | Decompile from formula_const.py bytecode |
| `get_keyword_attr_name_by_tag` | Keyword attribute name building | MEDIUM | Not in decompiled Python (likely C++) |

---

## Summary: Production Readiness Gate

| Category | Total items | Ready for production | Blocked | Blocked by |
|---|---|---|---|---|
| Combat payload fields | 27 | 5 (enums only) | 22 | Need runtime packet samples |
| Hit flags | 8 | 0 | 8 | Need runtime confirmation |
| Hit counters | 4 | 0 | 4 | Need runtime confirmation |
| Keyword IDs | 19 (incl WeaponPlaqueType) | 19 | 0 (routing only) | Need routing implementation |
| Damage switches | 5 | 0 | 5 | Need packet or payload decode |
| Durative fields | 5 | 0 | 5 | Need packet or payload decode |
| Ammo pipeline fields | 9 | 2 (enums) | 7 | Need decoded payloads |
| 17 priority tables | 17 placeholder schemas | 0 | 17 | .pyc files not located/decoded |
| Enum recovery (original 18) | 18 | 14 | 4 | 4 enums not found in Python |
| Additional enums | 4 | 4 | 0 | None |
| Formula bindict tables | 6 | 0 | 6 | V2+ payload decode |

**Key takeaway:** The **enum values** portion is 78% complete (14/18 original + 4 additional recovered). Everything else requires either: (a) runtime packet capture, (b) V2+ record payload decode, or (c) location of the `.pyc` files for the 17 priority tables.

---

## Reference: Files Produced Across Batch 3 Subtasks

| Subtask | File | Status |
|---|---|---|
| 3.1 | `src/tools/v2_subformat_decoder.py` | ✅ Complete (decodes V2+ header, string pool; record payload is raw hex) |
| 3.1 | `data/research/bindict_decode/v2_decoder_test_output.json` | ✅ Complete (6 files decoded) |
| 3.2 | `data/normalized/official-tables/enum-recovery/enum-values.json` | ✅ Complete (14/18 enums) |
| 3.2 | `docs/research-notes/batch-3-subtask-3.2-handoff.md` | ✅ Complete |
| 3.3 | `data/normalized/official-tables/gun-pipeline/*.json` (17 files) | ⚠️ Placeholder schemas only (no decoded data) |
| 3.3 | This file: `docs/research-notes/batch-3-subtask-3.3-candidate-table.md` | ✅ Complete (consolidated candidate table) |
| — | `docs/research-notes/phase3-bindict-enum-progress-2026-06-02.md` | ✅ Complete (Phase 3 enum progress) |
| — | `docs/research-notes/batch-3-subtask-3.1-handoff.md` | ✅ Complete (V2+ decoder handoff) |
| — | `docs/research-notes/bindict-impl-readiness.md` | ✅ Complete (master readiness doc; source of truth for research targets) |

---

**End of candidate table.**
