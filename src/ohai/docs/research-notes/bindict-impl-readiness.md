# Bindict / Combat-Runtime Implementation Readiness

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

## Bindict decoder status (validated vs pending)

| Status | Item | Source |
|--------|------|--------|
| **CONFIRMED** | Once Human magic `0x0A0D0DA8` (low 16 bits = 3496). `co_consts[2]` stores the bindict payload. | `src/tools/once_human_dis.py` + `xdis` patch |
| **CONFIRMED** | `client_data` and `patch/pre_patch/lib` use a shared generic loader. | Disassembly of `abnormal_item_data.pyc` and 5 others |
| **CONFIRMED** | v1 record split: `u32 version / u32 flags / u32 string_pool_byte_length / string_pool / u32 next_count / 4-byte metadata / record_payload`. | `src/tools/layered_bindict_inspect.py` (19/390 files) |
| **CONFIRMED** | `0x96 0x05` is a **context-dependent numeric-value prefix** in v1, NOT globally float32. | `src/tools/v1_primitive_decoder.py` |
| **CONFIRMED** | `0x12` files: contiguous `0x96 0x05 <float32 LE>` runs at the start. | `src/tools/v1_subformat_decoder.py` (4 files decoded) |
| **CONFIRMED** | `0x22` files: contiguous `0x96 0x05 <float64 LE>` runs at the start, when plausible. | `src/tools/v1_subformat_decoder.py` (2 CONFIRMED, 1 POSSIBLE) |
| **CONFIRMED** | `0x0b` files exist (1 file: `graphic_param_restart_set_data.pyc`) but use a **different grammar**. | `src/tools/v1_subformat_decoder.py` |
| **CONFIRMED** | TLV (`0x01`) v1 files share a common skeleton (5 files). | `src/tools/v1_tlv_walker.py` |
| **LIKELY** | The generic loader is `bindict.bindict(<payload>)`, not `bindict.data`. | `src/tools/once_human_dis.py` + docs correction below |
| **OUTDATED** | The earlier claim that the loader returns `data = bindict.data` is **wrong**. See docs note below. | Old wording in `BINDICT_ARCHITECTURE_DISCOVERY.md` |
| **PENDING** | TLV `0x01` semantic decoder (current walker only emits candidate interpretations, no field values). | `src/tools/v1_tlv_walker.py` |
| **PENDING** | V2+ formats (versions 0, 2-262 in `client_data`). | `src/tools/layered_bindict_inspect.py` (371 files) |
| **ANOMALY** | `next_count` is NOT the record count. In 5 TLV files, `next_count` does not match the number of `[4B][u32]` pairs (1:1 mismatch in every file). | `src/tools/v1_tlv_walker.py` |

### Doc correction (must propagate)

The architecture doc (`docs/BINDICT_ARCHITECTURE_DISCOVERY.md`)
still contains the older claim:

```text
data = bindict.data
```

But our disassembly corrected that toward:

```text
bindict.bindict(<payload>)
```

**STATUS labels (use these in the doc):**

- **CONFIRMED**: `co_consts[2]` stores payload.
- **CONFIRMED**: shared loader exists.
- **LIKELY**: payload is passed through `bindict.bindict` / a
  custom C bridge (opcodes `0xac` and `0xe2` in the disassembly).
- **OUTDATED**: the simple `bindict.data` interpretation.

Do not let downstream agents copy the old wording.

---

## Combat runtime payload fields (DO NOT IMPLEMENT YET)

Source: `NodeAttack` / `NodeDurativeAttack` / be-hit sync keys /
shoot helper hits (uploaded dumps).

### Damage node fields (CONFIRMED names, NEEDS values)

| Field                       | Type    | Source        | Readiness       |
|-----------------------------|---------|---------------|-----------------|
| `formula_attack_type`       | enum    | attack node   | needs enum      |
| `sub_melee_attack_type`     | enum?   | attack node   | needs enum      |
| `damage_feature_type`       | enum    | attack node   | needs enum      |
| `element_type`              | enum    | attack node   | needs enum      |
| `keyword`                   | int     | attack node   | needs routing   |
| `keyword_tag`               | int     | attack node   | needs routing   |
| `pvp_damage_rate`           | number  | attack node   | needs sample    |
| `structure_attack`          | number  | attack node   | needs sample    |
| `vehicle_attack`            | number  | attack node   | needs sample    |
| `use_final_dam_add_rate`    | bool    | attack node   | needs sample    |
| `use_final_ignore_dam_rate` | bool    | attack node   | needs sample    |
| `extra_toughness_dam_rate`  | number  | attack node   | needs sample    |
| `damage_amount`             | number  | attack node   | NEEDS VALUE (multi-hit/proc) |
| `ignore_field`              | bool    | attack node   | NEEDS VALUE (bypass force-field) |
| `ignore_structure_field`    | bool    | attack node   | NEEDS VALUE (bypass structure shield) |
| `ignore_weak_part_rate`     | number  | attack node   | NEEDS VALUE (bypass part mult) |
| `jump_word_element_type`    | enum?   | attack node   | NEEDS VALUE (UI element display) |
| `be_hit_type`               | enum    | attack node   | NEEDS ENUM (hit settlement) |
| `direct_damage_ignore_field` | bool    | attack node   | NEEDS VALUE (direct-dmg field bypass) |
| `damage_cause_type`         | enum    | attack node   | NEEDS ENUM (deviation/title triggers) |
| `source_behavior`           | string  | attack node   | NEEDS VALUE (proc provenance) |
| `invincible_tag`            | int?    | attack node   | NEEDS VALUE (tagged-invincible bypass) |
| `damage_select_arg`         | int?    | attack node   | NEEDS RESEARCH (target selection) |
| `pre_buff_effect`           | object? | attack node   | NEEDS RESEARCH (pre-hit buff payload) |
| `dis_dam_rate`              | number  | be-hit sync   | NEEDS VALUE (distance/range dmg) |
| `in_weapon_range`           | bool    | be-hit sync   | NEEDS VALUE (in-range flag) |
| `field_damage_percent`      | number  | be-hit sync   | NEEDS VALUE (field-dmg %) |
| `in_reuse`                  | bool    | be-hit sync   | NEEDS VALUE (reused dmg state) |
| `low_attack`                | bool    | be-hit sync   | NEEDS VALUE (low attack flag) |
| `is_anomaly`                | bool    | hit packet    | NEEDS VALUE (anomaly state) |
| `consume_field_type`        | enum    | hit perf      | NEEDS ENUM (field consumption) |

### Runtime attack payload schema (PROPOSED, do not commit to production)

```ts
{
  attack: number;
  vehicle_attack?: number;
  structure_attack?: number;
  element_type: number;
  formula_attack_type: number;
  sub_melee_attack_type?: number;
  damage_feature_type: number;
  keyword?: number;
  keyword_tag?: number;
  pvp_damage_rate?: number;
  use_final_dam_add_rate: boolean;
  use_final_ignore_dam_rate: boolean;
  ignore_field?: boolean;
  ignore_structure_field?: boolean;
  ignore_weak_part_rate?: number;
  extra_toughness_dam_rate?: number;
  damage_amount?: number;
  damage_cause_type?: number;
  source_behavior?: string;
}
```

### Runtime hit flags schema (PROPOSED)

```ts
{
  weak_attack: boolean;
  crit_attack: boolean;
  head_shot: boolean;
  back_stab: boolean;
  low_attack?: boolean;
  is_anomaly?: boolean;
  in_weapon_range?: boolean;
  in_reuse?: boolean;
}
```

### Hit-event counters schema (PROPOSED)

```ts
{
  damage_amount: number;
  nml_attack_cnt: number;
  crit_attack_cnt: number;
  weak_attack_cnt: number;
}
```

> These count triggers (e.g. "on crit count", "on weakspot count",
> multi-hit effects). Do not implement counters without
> confirming the field name on at least one runtime packet.

---

## Keyword IDs (CONFIRMED values, NEEDS routing)

| ID  | Keyword           | Readiness     |
|-----|-------------------|---------------|
| 201 | Blast             | needs routing |
| 202 | Scorch / Burn     | needs routing |
| 203 | Frost Vortex      | needs routing |
| 204 | Power Surge       | needs routing |
| 205 | Shrapnel          | needs routing |
| 206 | Projectile        | needs routing |
| 207 | Mark / Bullseye   | needs routing |

Routing is to be added once `keyword`/`keyword_tag` field semantics
are recovered from the attack node schema.

---

## Runtime hit flags (CONFIRMED names, NEEDS boolean semantics)

| Flag           | Readiness     |
|----------------|---------------|
| `weak_attack`  | needs source  |
| `crit_attack`  | needs source  |
| `head_shot`    | needs source  |
| `back_stab`    | needs source  |

These are packet-level concepts, not post-calculation guesses.

---

## Hit counters (CONFIRMED names, NEEDS semantics)

| Counter             | Readiness     |
|---------------------|---------------|
| `weak_attack_cnt`   | needs source  |
| `crit_attack_cnt`   | needs source  |
| `nml_attack_cnt`    | needs source  |

Needed for "on crit count" / "on weakspot count" / multi-hit
trigger effects.

---

## Durative / high-frequency damage model (CONFIRMED names, NEEDS semantics)

| Field                      | Type     | Readiness     |
|----------------------------|----------|---------------|
| `damage_times`             | number   | needs source  |
| `damage_gap`               | number   | needs source  |
| `is_accumlate_damage`     | bool     | needs source  |
| `is_resuse_last_damage`   | bool     | needs source (note: typo in source) |
| `reuse_last_time`          | number   | needs source  |

Note: `is_resuse_last_damage` has a typo in the source dump
("resuse" not "reuse"). Preserve the typo when copying from the
source.

---

## `final_attack_rate_dic` known keys (PARTIAL)

| Key                | Type    | Readiness         |
|-------------------|---------|-------------------|
| `rate`            | number  | needs validation  |
| `building_rate`   | number  | needs validation  |
| `formula_type_rate` | number  | needs validation  |

Other keys MAY exist. Do not assume these are the only ones
until full dictionaries are recovered from V2+ payloads.

---

## Weapon / ammo / range pipeline (DO NOT IMPLEMENT YET)

### Weapon and ammo fields (CONFIRMED names, NEEDS semantics)

| Field                       | Type    | Readiness     |
|-----------------------------|---------|---------------|
| `CostBulletType`            | enum    | needs enum     |
| `BulletBaseType`            | enum    | needs enum     |
| `use_bullet_no`             | int     | needs source   |
| `bullet_base_no`            | int     | needs source   |
| `gun_element_affix`         | int?    | needs source   |
| `gun_element_affix_value`   | number  | needs source   |
| `ammo_accessory_no`         | int     | NEEDS VALUE (runtime-visible link) |
| `origin_bullet_base_no`     | int     | NEEDS VALUE (skin replacement) |
| `bullet_skin_replaced_result` | object? | NEEDS VALUE (skin alters bullet identity) |

### Range fields (CONFIRMED names, NEEDS semantics)

| Field                              | Type    | Readiness     |
|------------------------------------|---------|---------------|
| `weapon_range_template_no`         | int     | needs source  |
| `gun_range_formula_template_data`  | object  | needs source  |
| `damage_attenuation_ratio`         | number  | needs source  |

### Data tables to add to priority extraction (CONFIRMED need)

The old "later maybe" bucket missed these. They are directly
referenced in shoot utility / combat modules:

```text
gun_base_params_data
bullet_base_params_data
bullet_trajectory_data
ringlike_bullet_data
gun_stability_data
bullet_scatter_data
gun_system_data
gun_accessory_bullet_params_data
gun_accessory_bullet_map_data
bullet_recycle_config_data
item_to_gun_mapping_data
weapon_prototype_data
weapon_check_data
stardust_gun_skill_data
passive_skill_data
gun_range_formula_template_data
gun_reload_formula_template_data
```

**Readiness:** all listed tables need to be located in the
client_data directory, decoded (via the v1/v2+ pipelines), and
the v2+ payload format must be understood before any of these
fields can be sourced.

---

## Enum recovery queue (HIGH PRIORITY, blocking)

Shoot / combat utilities import these enums directly:

| Enum                              | Used in                       |
|-----------------------------------|-------------------------------|
| `EditorFormulaAttackType`         | damage node                   |
| `FormulaAttackType`               | damage node (runtime)         |
| `EditorDamageFeatureType`         | damage node                   |
| `DamageFeatureType`               | damage node (runtime)         |
| `EditorSubMeleeAttackType`        | damage node                   |
| `SubMeleeAttackType`              | damage node (runtime)         |
| `EditorDamageBeHitType`           | be-hit settlement             |
| `EditorDamageCauseType`           | damage cause routing          |
| `ElementType`                     | damage element                |
| `AttackBuffTagEnum`               | buff tagging                  |
| `AttackBuffSubTagEnum`            | buff sub-tagging              |
| `EffectKeywordEvent`              | keyword routing (201-207)     |
| `DamageSourceBehavior`            | source_behavior field         |
| `AttackDamageType`                | damage type                   |
| `AttackWeaponType`                | weapon classification         |
| `CostBulletType`                  | ammo pipeline                 |
| `BulletBaseType`                  | bullet pipeline               |
| `HitMaterialWeaponType`           | hit-material routing          |

**Readiness:** each enum must be located in the binary, recovered
to a name->value map, and validated against at least one
field-using packet before being treated as production logic.

---

## Final tracker structure (use this order)

1. **Combat runtime payload fields** (the 27 fields above)
2. **Hit / result flags** (the 8 boolean flags above)
3. **Hit counters and trigger counters** (`damage_amount`,
   `nml_attack_cnt`, `crit_attack_cnt`, `weak_attack_cnt`)
4. **Keyword IDs and keyword routing** (201-207)
5. **Final damage formula switches** (`final_attack_rate_dic`
   keys, `use_final_dam_add_rate`, `use_final_ignore_dam_rate`)
6. **Durative / high-frequency damage model** (`damage_times`,
   `damage_gap`, `is_accumlate_damage`, `is_resuse_last_damage`,
   `reuse_last_time`)
7. **Ammo / bullet / accessory pipeline** (weapon/ammo fields +
   new priority extraction list)
8. **Range / reload / accuracy / stability pipeline** (range
   fields + the rest of the new priority list)
9. **Enum recovery queue** (the 17 enums above)
10. **Bindict decoder status** (V1 split solid, 0x12/0x22 numeric
    decoded, TLV walked only, 0x96 0x05 context-dependent,
    `next_count` is not `record_count`, V2+ pending)
11. **Do-not-implement-yet research notes** (this file)

---

## What is NOT ready

- **Any production logic** that consumes the field names in this
  file. They are research candidates, not committed schema.
- **The `bindict.data` loader interpretation.** OUTDATED. Use
  `bindict.bindict(<payload>)` or the custom C bridge.
- **V2+ payloads.** 371 of 390 `client_data` files are still raw.
  Their format is not the v1 split.
- **TLV semantic decoding.** The walker emits candidates; no
  field values are extracted.
- **Cross-file enum value recovery.** The 17 enums are
  *names*; the integer values must still be extracted from the
  binary, ideally from a rodata/constant table or a typed
  registry.
- **The bullet/range/ammo pipeline.** The fields are named, but
  the corresponding client_data tables are not yet decoded.

---

## Guardrails (do not violate)

1. **No overwriting** of `data/extracted/`, `data/normalized/`,
   `data/raw/`, or `data/normalized/official-tables/` until a
   write is reviewed and the source is committed to git.
2. **No treating incomplete research as production logic.**
   Every field name in this file is a **CANDIDATE** until a
   full source binding exists.
3. **No guessing enum values.** Each value must be recovered
   from the binary (or from an authoritative source dump) before
   being used.
4. **No skipping the bindict bindict vs data correction.** Old
   documents that say `data = bindict.data` are outdated; new
   documents must say `bindict.bindict(<payload>)`.
5. **No building combat-runtime tables** from the schemas in
   this file. They are PROPOSED, not committed.
