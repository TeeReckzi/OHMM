# Phase 3 Bindict/Enum Recovery Progress — 2026-06-02

> **THIS IS A RESEARCH NOTE, NOT A SPEC.**
> Everything below is **CANDIDATE — NOT PRODUCTION**.
> Do NOT promote to production code. Do NOT overwrite locked raw data modules.

---

## What Was Searched

1. **Source files parsed:**
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/const/` — all enum definitions
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/component_server/CompFormulaAdapter.py` — formula resolver functions
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/common/affix/AffixUtils.py` — tag-to-attribute-name mapping functions
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/const/shoot_const.py` — ammo/weapon/bullet enums
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/const/health_const.py` — BE_HIT_TYPE, DAMAGE_CAUSE_TYPE
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/const/logic_state_const.py` — ElementType
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/const/unit_const.py` — UnitSpeciesType, UnitSoulType
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/const/formula_const.py` — FormulaAttackType, DamageFeatureType, SubMeleeAttackType
   - `docs/external-research/OHEXTRACTDATA/dcs_extend/common/damage_event_parser.py` — WeaponPlaqueType (keyword IDs + species IDs)
   - `docs/external-research/OHEXTRACTDATA/client_data/player_person_info_data.py` — binary bindict payload inspected

2. **Existing research read:**
   - `docs/research-notes/bindict-impl-readiness.md` — prior enum recovery queue (17 enums listed)
   - `docs/formula-recovery/additional-rate-missing-leaves.md` — species/debuff formula classification
   - `data/research/bindict_decode/` — TLV walker, subformat decoder, runtime probe reports

3. **Searched for NOT found:**
   - `human_dam_add_rate` — **NOT FOUND** anywhere in decompiled source
   - `EffectKeywordEvent` — referenced in editor docs but enum values not decompiled
   - `DamageSourceBehavior` — referenced in editor docs but enum values not decompiled
   - `AttackBuffTagEnum` / `AttackBuffSubTagEnum` — not found in decompiled Python

---

## CANDIDATE Enum Tables Recovered

### 1. FormulaAttackType (formula_const.py:39-49) — CONFIRMED

| ID  | Name         | Source                        |
|-----|--------------|-------------------------------|
| 0   | Default      | formula_const.py:42           |
| 1   | Melee        | formula_const.py:43           |
| 2   | Remote       | formula_const.py:44           |
| 3   | Bomb         | formula_const.py:45           |
| 4   | Dot          | formula_const.py:46           |
| 5   | Skill        | formula_const.py:47           |
| 6   | Item         | formula_const.py:48           |
| 7   | Facility     | formula_const.py:49           |

**Runtime field:** `formula_attack_type` in attack node payload.
**Editor enum:** `EditorFormulaAttackType` — likely same values (not separately decompiled).
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**

### 2. SubMeleeAttackType (formula_const.py:50-57) — CONFIRMED

| ID  | Name     | Source                        |
|-----|----------|-------------------------------|
| 0   | Any      | formula_const.py:53           |
| 1   | Combo    | formula_const.py:54           |
| 2   | Heavy    | formula_const.py:55           |
| 3   | Dash     | formula_const.py:56           |
| 4   | Backstab | formula_const.py:57           |

**Runtime field:** `sub_melee_attack_type` in attack node (valid when `formula_attack_type == Melee(1)`).
**Editor enum:** `EditorSubMeleeAttackType` — likely same values.
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**

### 3. DamageFeatureType (formula_const.py:58-65) — CONFIRMED

| ID  | Name     | Source                        |
|-----|----------|-------------------------------|
| -1  | NO_RESET | formula_const.py:61           |
| 0   | NONE     | formula_const.py:62           |
| 1   | Cut      | formula_const.py:63           |
| 2   | Blunt    | formula_const.py:64           |
| 99  | ANY      | formula_const.py:65           |

**Runtime field:** `damage_feature_type` in attack node (valid when `formula_attack_type == Melee(1)`).
**Editor enum:** `EditorDamageFeatureType` — likely same values.
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**

### 4. ElementType (logic_state_const.py:112-125) — CONFIRMED

| ID  | Name        | Source                           |
|-----|-------------|----------------------------------|
| 0   | PHYSICS     | logic_state_const.py:115         |
| 1   | FIRE        | logic_state_const.py:116         |
| 2   | ICE         | logic_state_const.py:117         |
| 3   | LIGHTNING   | logic_state_const.py:118         |
| 4   | MACHINE     | logic_state_const.py:119         |
| 5   | CARRIER     | logic_state_const.py:120         |
| 6   | EXPLODE     | logic_state_const.py:121         |
| 7   | PENETRATION | logic_state_const.py:122         |
| 8   | IMPACT      | logic_state_const.py:123         |
| 9   | SUPPRESSION | logic_state_const.py:124         |
| 10  | STUN        | logic_state_const.py:125         |

**Runtime field:** `element_type` in attack node.
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**
**Note:** `suffix_element_name` is used by AffixUtils.get_element_attr_name_by_tag() to build attribute names like `element_type_dam_add_rate_{suffix}`. The actual suffix strings are in `element_type_data` bindict table (NOT yet decoded from binary).

### 5. UnitSpeciesType (unit_const.py:170-181) — CONFIRMED

| ID  | Name      | Source                    |
|-----|-----------|---------------------------|
| 0   | Default   | unit_const.py:173         |
| 1   | Ascender  | unit_const.py:174         |
| 2   | Alters    | unit_const.py:175         |
| 3   | Rosetta   | unit_const.py:176         |
| 4   | Vulcher   | unit_const.py:177         |
| 5   | Creatures | unit_const.py:178         |
| 6   | Machina   | unit_const.py:179         |
| 7   | Master    | unit_const.py:180         |
| 8   | Deviation | unit_const.py:181         |

**Runtime field:** `unit_species` on target entity.
**Formula leaf resolution:** `get_species_dam_add_rate()` reads target `unit_species` → looks up in `UNIT_SPECIES_TYPE_INDEX_TYPE_NAME` dict → builds `species_dam_add_rate_{suffix}` → reads value from attacker.
**Evidence:** Direct Python enum decompilation + resolver in CompFormulaAdapter.py:826-832. **CONFIRMED.**

### 6. UnitSoulType (unit_const.py:3-89) — CONFIRMED

Soul type classification for entities. Key values:
- AVATAR = 'Soul', NPC = 'NPC', UAV = 'UAV', Enemy = 'Enemy', Animal = 'Animal', Monster = 'Monster', Boss = 'Boss', Deviation = 'Deviation' (and ~40 more)

**Groupings for formula:**
- `HUMAN_UNIT_SOUL_TUPLE = (AVATAR, Enemy, AvatarDummy, AvatarEnemy)` — line 90
- `DEVIATION_UNIT_SOUL_TUPLE` — lines 91-92
- Reason: these define which soul types count as "human" for `human_dam_add_rate` equivalent logic

### 7. BE_HIT_TYPE (health_const.py:113-121) — CONFIRMED

| ID  | Name               | Source                   |
|-----|--------------------|--------------------------|
| 0   | DEFAULT            | health_const.py:116      |
| 1   | SHARE_DEATH        | health_const.py:117      |
| 2   | DIRECT_DAMAGE      | health_const.py:118      |
| 3   | KILL               | health_const.py:119      |
| 4   | KEYWORD_SIMULATE   | health_const.py:120      |
| 101 | ATTACK_TYPE_IMMUNE | health_const.py:121      |

**Runtime field:** `be_hit_type` in attack node.
**Editor enum:** `EditorDamageBeHitType` — likely same values.
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**

### 8. DAMAGE_CAUSE_TYPE (health_const.py:107-112) — CONFIRMED

| ID  | Name             | Source                   |
|-----|------------------|--------------------------|
| 0   | DEFAULT          | health_const.py:110      |
| 1   | PHYSICS_CONTROL  | health_const.py:111      |
| 2   | DEVIATION_COMBAT | health_const.py:112      |

**Runtime field:** `damage_cause_type` in attack node.
**Editor enum:** `EditorDamageCauseType` — likely same values.
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**

### 9. WeaponPlaqueType (damage_event_parser.py:36-56) — CONFIRMED

**Keyword IDs (matches + extends existing 201-207 table):**

| ID  | Name                   | Source                           |
|-----|------------------------|----------------------------------|
| 101 | UNIT_TYPE_HUMAN        | damage_event_parser.py:39        |
| 102 | UNIT_TYPE_NONE_HUMAN   | damage_event_parser.py:40        |
| 103 | UNIT_PROTOTYPE_MONSTER_LEADER | damage_event_parser.py:41 |
| 104 | WEAK_ATTACK            | damage_event_parser.py:42        |
| 105 | NOT_IN_BATTLE          | damage_event_parser.py:43        |
| 106 | FORCE_EXECUTE          | damage_event_parser.py:44        |
| 107 | UNIT_SPECIES_ROSETTA   | damage_event_parser.py:45        |
| 108 | UNIT_SPECIES_ALERT     | damage_event_parser.py:46        |
| 109 | UNIT_SPECIES_VULCHER   | damage_event_parser.py:47        |
| 201 | BUFF_KEYWORD_BLAST     | damage_event_parser.py:48        |
| 202 | BUFF_KEYWORD_SCORCH    | damage_event_parser.py:49        |
| 203 | BUFF_KEYWORD_VORTEX    | damage_event_parser.py:50        |
| 204 | BUFF_KEYWORD_SURGE     | damage_event_parser.py:51        |
| 205 | BUFF_KEYWORD_SHRAP     | damage_event_parser.py:52        |
| 206 | BUFF_KEYWORD_PROJ      | damage_event_parser.py:53        |
| 207 | BUFF_KEYWORD_MARK      | damage_event_parser.py:54        |
| 208 | BUFF_KEYWORD_QUICK_DRAW | damage_event_parser.py:55       |
| 209 | BUFF_KEYWORD_ARMED     | damage_event_parser.py:56        |

**Note:** Adds Quick Draw (208) and Armed (209) beyond the original 201-207 table in bindict-impl-readiness.md.
**Evidence:** Direct Python enum decompilation. **CONFIRMED.**

### 10. AttackDamageType (shoot_const.py:811-819) — CONFIRMED

| ID  | Name   | Source                  |
|-----|--------|-------------------------|
| 0   | NORMAL | shoot_const.py:814      |
| 1   | WEAK   | shoot_const.py:815      |
| 2   | CRIT   | shoot_const.py:816      |
| 3   | SHIELD | shoot_const.py:817      |
| 99  | ALL    | shoot_const.py:818      |
| 100 | NONE   | shoot_const.py:819      |

**Note:** This is a different concept from `damage_feature_type`. It classifies the *result* of a hit (normal/weak/crit/shield), not the *feature* of the attack.

### 11. AttackWeaponType (shoot_const.py:540-545) — CONFIRMED

| ID  | Name   | Source                  |
|-----|--------|-------------------------|
| 1   | BULLET | shoot_const.py:543      |
| 2   | BOMB   | shoot_const.py:544      |
| 3   | BUFF   | shoot_const.py:545      |

**Runtime field:** Used in be-hit routing to classify weapon type of an attack.

### 12. BulletBaseType (shoot_const.py:172-179) — CONFIRMED

| ID  | Name                | Source                  |
|-----|---------------------|-------------------------|
| 1   | NORMAL              | shoot_const.py:175      |
| 2   | RINGLIKE            | shoot_const.py:176      |
| 3   | TRAJECTORY          | shoot_const.py:177      |
| 4   | TRAJECTORY_SIMULATE | shoot_const.py:178      |
| 5   | THROUGH             | shoot_const.py:179      |

### 13. CostBulletType (shoot_const.py:950-955) — CONFIRMED

| ID  | Name         | Source                  |
|-----|--------------|-------------------------|
| 0   | BULLET_BOX   | shoot_const.py:953      |
| 1   | BULLET_ITEM  | shoot_const.py:954      |
| 2   | BULLET_ARROW | shoot_const.py:955      |

### 14. HitMaterialWeaponType (shoot_const.py:850-857) — CONFIRMED

| Value   | Name  | Source                  |
|---------|-------|-------------------------|
| 'gun'   | GUN   | shoot_const.py:853      |
| 'metal' | METAL | shoot_const.py:854      |
| 'punch' | PUNCH | shoot_const.py:855      |
| 'EMPTY' | EMPTY | shoot_const.py:856      |
| ''      | OTHER | shoot_const.py:857      |

### 15. EliteLevelEnumType (unit_const.py:119-130) — CONFIRMED

| ID | Name            | Source                |
|----|-----------------|-----------------------|
| 0  | Player          | unit_const.py:122     |
| 1  | Normal          | unit_const.py:123     |
| 2  | Elite           | unit_const.py:124     |
| 3  | Boss            | unit_const.py:125     |
| 4  | Destructible    | unit_const.py:126     |
| 5  | Leader          | unit_const.py:127     |
| 6  | Stronghold_unit | unit_const.py:128     |
| 9  | LogicObj        | unit_const.py:129     |
| 98 | VEHICLE         | unit_const.py:130     |

---

## Tag-to-Attribute-Name Mapping Functions

These functions in AffixUtils.py convert sub-type tags into full attribute name strings. All confirmed from source.

### get_debuff_attr_name_by_tag(parent_attr_key, tag) — CONFIRMED
```
sub_type = buff_tag_data[tag]['suffix_debuff_name']
return parent_attr_key + sub_type
```
**Examples:** `debuff_type_dam_add_rate` + `_burn` = `debuff_type_dam_add_rate_burn`
**Data dependency:** `buff_tag_data` bindict table (NOT YET DECODED)

### get_element_attr_name_by_tag(parent_attr_key, tag) — CONFIRMED
```
sub_type = element_type_data[tag]['suffix_element_name']
return parent_attr_key + sub_type
```
**Examples:** `element_type_dam_add_rate` + `_fire` = `element_type_dam_add_rate_fire`
**Data dependency:** `element_type_data` bindict table (NOT YET DECODED)

### get_keyword_attr_name_by_tag — NOT DECOMPILED (likely in C++)
From usage pattern in CompFormulaAdapter.py (lines 647, 651, 655, 659, 742, 747, 752, 758, 763):
```
attr_name = get_keyword_attr_name_by_tag('keyword_proc_dam_add_rate')
# keyword_type is accessed from formula_obj['keyword_type']
```

### get_attack_type_attr_name_by_tag — NOT DECOMPILED (likely in C++)
Referenced in formula_const.py:76 and CompFormulaAdapter.py:783.
Maps `formula_attack_type` value (0-7) to attribute name suffix via `ATTACK_TYPE_INDEX_ATTR_NAME` dict.

### get_melee_type_attr_name_by_tag — NOT DECOMPILED (likely in C++)
Maps `sub_melee_attack_type` value (0-4) to attribute name suffix.

---

## Formula Resolver Logic — Species & Debuff

### species_dam_add_rate (CompFormulaAdapter.py:826-832) — CONFIRMED
```python
base_unit_species = _get_target_prop_val('unit_species')  # e.g., 3
species_type_name = UNIT_SPECIES_TYPE_INDEX_TYPE_NAME.get(base_unit_species)  # e.g., '_rosetta'
attr_name = 'species_dam_add_rate' + species_type_name  # e.g., 'species_dam_add_rate_rosetta'
return _get_attacker_prop_val(attr_name)  # read from attacker's attribute
```

**Key: `UNIT_SPECIES_TYPE_INDEX_TYPE_NAME`** — The decompilation shows a mangled result (`'deviation'` as string literal). This is actually a **dict** that maps UnitSpeciesType values to suffix strings. The fallback/default is 'deviation'. The full dict is NOT yet recovered from the binary (likely inlined in bytecode or in char_property_data bindict).

**Candidate pattern:** `species_dam_add_rate_{species_type_name}` where species_type_name is a lowercase suffix like `_default`, `_ascender`, `_alters`, `_rosetta`, `_vulcher`, `_creatures`, `_machina`, `_master`, `_deviation`.

### debuff_type_dam_add_rate (CompFormulaAdapter.py:615-616, 707-714) — CONFIRMED
```python
all_debuff_state = target_all_debuff_state  # from target
for debuff_tag in all_debuff_state:
    attr_name = get_debuff_attr_name_by_tag('debuff_type_dam_add_rate', debuff_tag)
    # e.g., 'debuff_type_dam_add_rate_burn'
    val += _get_attacker_prop_val(attr_name)
return val
```

**Key: `buff_tag_data` bindict table** — Maps debuff tags to `suffix_debuff_name` values. The tag values and their suffix names are stored in the `buff_tag_data` bindict table which is NOT YET DECODED.

---

## Bindict Data to Decode (Priority Order)

These bindict data tables are referenced by the formula system but have NOT been decoded:

| Table Name              | Needed For                                      | Location                     |
|-------------------------|-------------------------------------------------|------------------------------|
| `buff_tag_data`         | `suffix_debuff_name` → debuff attribute names   | Normal bindict (.pyc format) |
| `element_type_data`     | `suffix_element_name` → element attribute names | Normal bindict (.pyc format) |
| `char_property_data`    | `extra_info.parent_attr_name_dict` → parent/sub attribute mapping, `attr_index_parent_sub_type` | Normal bindict (.pyc format) |
| `armor_type_data`       | `suffix_armor_name` → armor attribute names     | Normal bindict (.pyc format) |
| `player_person_info_data` | Client-side player info (unknown if formula-relevant) | client_data (binary bindict) |
| `global_params_data`    | Global formula parameters (random_speed_factor)  | Normal bindict (.pyc format) |

---

## What Remains Unknown

### Enums with values not yet recovered:
| Enum                         | Status                         | Blockers                                  |
|------------------------------|--------------------------------|-------------------------------------------|
| `EffectKeywordEvent`         | Referenced, no values found    | Values for keyword event IDs (likely 1..N) |
| `DamageSourceBehavior`       | Referenced, no values found    | String enum values for source_behavior field |
| `AttackBuffTagEnum`          | Not found in Python source     | Likely in C++ or bindict data             |
| `AttackBuffSubTagEnum`       | Not found in Python source     | Likely in C++ or bindict data             |
| `EditorFormulaAttackType`    | Assumed same as FormulaAttackType | CONFIRMED values but Editor variant name not cross-verified |
| `EditorSubMeleeAttackType`   | Assumed same as SubMeleeAttackType | Same as above |
| `EditorDamageFeatureType`    | Assumed same as DamageFeatureType | Same as above |
| `EditorDamageBeHitType`      | Assumed same as BE_HIT_TYPE    | Same as above |
| `EditorDamageCauseType`      | Assumed same as DAMAGE_CAUSE_TYPE | Same as above |
| `UNIT_SPECIES_TYPE_INDEX_TYPE_NAME` dict | Fallback only ('deviation') | Full dict not recovered from binary |
| `ATTACK_TYPE_INDEX_ATTR_NAME` dict      | Fallback only ('facility')    | Full dict not recovered from binary |
| `UNIT_PROTOTYPE_INDEX_TYPE_NAME` dict   | Fallback only ('leader')      | Full dict not recovered from binary |

### The `human_dam_add_rate` leaf:
- **NOT FOUND** in any decompiled formula source code
- No resolver function, no ATTACKER_NEED_ALL_SUB_ATTR_NODE entry
- Hypothesis: This was a community-convention name for what the game implements as `species_dam_add_rate` against `HUMAN_UNIT_SOUL_TUPLE` species
- **Recommendation:** Defer as "no evidence" — do not implement

### Bindict binary payloads:
- `player_person_info_data.py` (`data/research/bindict_decode/offline_exports/`): contains a binary bindict payload (version byte 0x9a). NOT decoded.
- Other client_data files remain in V2+ format (371 of 390 files). The V2+ format decoder is PENDING.

---

## Confidence Summary

| Enum / Field                         | Confidence | Evidence                                          |
|--------------------------------------|------------|---------------------------------------------------|
| FormulaAttackType (0-7)              | A_HIGH     | Direct Python decompilation                       |
| SubMeleeAttackType (0-4)             | A_HIGH     | Direct Python decompilation                       |
| DamageFeatureType (-1,0,1,2,99)      | A_HIGH     | Direct Python decompilation                       |
| ElementType (0-10)                   | A_HIGH     | Direct Python decompilation                       |
| UnitSpeciesType (0-8)                | A_HIGH     | Direct Python decompilation                       |
| UnitSoulType (string values)         | A_HIGH     | Direct Python decompilation                       |
| BE_HIT_TYPE (0-4, 101)               | A_HIGH     | Direct Python decompilation                       |
| DAMAGE_CAUSE_TYPE (0-2)              | A_HIGH     | Direct Python decompilation                       |
| WeaponPlaqueType (101-109, 201-209)  | A_HIGH     | Direct Python decompilation                       |
| AttackDamageType (0-3,99,100)        | A_HIGH     | Direct Python decompilation                       |
| AttackWeaponType (1-3)               | A_HIGH     | Direct Python decompilation                       |
| BulletBaseType (1-5)                 | A_HIGH     | Direct Python decompilation                       |
| CostBulletType (0-2)                 | A_HIGH     | Direct Python decompilation                       |
| HitMaterialWeaponType (string enum)  | A_HIGH     | Direct Python decompilation                       |
| EliteLevelEnumType (0-6,9,98)        | A_HIGH     | Direct Python decompilation                       |
| get_debuff_attr_name_by_tag logic    | B_OWNER_APPROVED | Decompiled function body in AffixUtils.py  |
| get_element_attr_name_by_tag logic   | B_OWNER_APPROVED | Decompiled function body in AffixUtils.py  |
| species_dam_add_rate resolver logic  | B_OWNER_APPROVED | Decompiled function body in CompFormulaAdapter.py |
| debuff_type_dam_add_rate resolver    | B_OWNER_APPROVED | Decompiled function body in CompFormulaAdapter.py |
| buff_tag_data table contents         | PENDING        | Not decoded from binary bindict                   |
| element_type_data table contents     | PENDING        | Not decoded from binary bindict                   |
| UNIT_SPECIES_TYPE_INDEX_TYPE_NAME    | PENDING        | Full dict values not recovered                    |
| human_dam_add_rate                   | C_NO_EVIDENCE  | NOT FOUND in any decompiled source                |
| EffectKeywordEvent values            | C_NO_EVIDENCE  | Referenced but not decompiled                     |
| DamageSourceBehavior values          | C_NO_EVIDENCE  | Referenced but not decompiled                     |

---

## Blocker Status for Phase 3 Implementation

| Leaf                        | Blocker                                              | Priority |
|-----------------------------|------------------------------------------------------|----------|
| species_dam_add_rate        | Need UNIT_SPECIES_TYPE_INDEX_TYPE_NAME dict values   | HIGH     |
| species_dam_add_rate        | Need buff_tag_data suffix_debuff_name for species?   | LOW (species don't use debuff tags) |
| debuff_type_dam_add_rate    | Need buff_tag_data suffix_debuff_name values         | HIGH     |
| debuff_type_dam_add_rate    | Need debuff tag IDs from target state                | HIGH     |
| human_dam_add_rate          | NOT FOUND — do not implement                         | N/A      |
| debuff_tag_data bindict     | V2+ payload decode needed (or offline export)        | MEDIUM   |
| element_type_data bindict   | V2+ payload decode needed (or offline export)        | MEDIUM   |

---

## Files Created/Updated

- Created: `docs/research-notes/phase3-bindict-enum-progress-2026-06-02.md` (this file)

## Excluded from This Report
- Production code changes
- Calculator logic modifications
- Locked module modifications
- Bindict decoder implementation
