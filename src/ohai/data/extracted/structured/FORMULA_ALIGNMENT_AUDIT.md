# Damage Formula Alignment Audit
## Game Blackboard (BB.*) vs OHMM Engine

**Last updated:** 2026-07-13
**Evidence sources:**
- `officialAttributes.generated.ts` — recovered attribute definitions with calcType, min, max, parentAttrKey
- `officialFormulaDefaultsSmokeTest.ts` — proven default/identity values
- `officialFormulaGraphRecipes.ts` — recovered formula graph (additive structure proven)
- `damage_formula.pyc` raw string extraction — variable context ordering
- `CompFormulaAdapter.pyc` — getter function names proving call-site existence

---

## Verification Status Legend

- ✅ VERIFIED — Semantics proven from multiple evidence sources. Safe to implement.
- ⚠️ PARTIAL — Variable exists and is partially understood, but behavior needs one more proof point.
- ❌ UNVERIFIED — Name-only. Do NOT use in calculations.
- 🚫 EXCLUDED — Proven to NOT belong in HP damage calculations.

---

## 1. Variables PROVEN to be ADDITIVE inside `final_attack_additional_rate`

The formula graph recipe (HIGH confidence) proves these all sum together:

```
final_attack_additional_rate = 1 + use_final_dam_add_rate × (
    weapon_attack_add_rate        ← FormulaInput.weaponDMGBonus ✅ ALREADY WIRED
  + attack_type_dam_add_rate      ← tag-resolved leaf ✅ ALREADY WIRED
  + gun_type_dam_add_rate         ← tag-resolved leaf ✅ ALREADY WIRED
  + element_type_dam_add_rate     ← tag-resolved leaf ✅ ALREADY WIRED
  + keyword_proc_dam_add_rate     ← tag-resolved leaf ✅ ALREADY WIRED
  + species_dam_add_rate          ← FormulaInput.enemyTypeDMGBonus ✅ ALREADY WIRED
  + human_dam_add_rate            ← FormulaInput.humanDamageBonus ✅ ALREADY WIRED
  + debuff_type_dam_add_rate      ← FormulaInput.debuffTypeDamAddRate ✅ VERIFIED, wire into additive sum
)
```

### debuff_type_dam_add_rate — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Additive bonus when target has specific debuff (scorch/frozen/mark/bleeding/surge/vortex) |
| Identity value | 0 | graph recipe defaultValue |
| Units | Decimal fraction (0.15 = +15% damage) | calcType=0, max=10.0 |
| Position in formula | ADDITIVE inside `final_attack_additional_rate` sum | graph recipe exprId 9 |
| Sub-attributes | `_scorch`, `_frozen`, `_mark`, `_bleeding`, `_surge`, `_vortex` | officialAttributes |
| Direction | Higher = more damage dealt | min=0.0 |
| Clamp | [0.0, 10.0] | officialAttributes |

**Implementation:** Add to the existing `final_attack_additional_rate` additive sum in `officialFormulaBridge.ts`. NOT a separate multiplier bucket.

---

## 2. Variables PROVEN to be ADDITIVE inside `final_attack_additional_rate` (per-target)

### species_field_dam_add_rate — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Bonus damage vs specific enemy species when in their "field" zone |
| Identity value | 0 | additive leaf |
| Units | Decimal fraction | calcType=0, max=3.0 |
| Position in formula | ADDITIVE (inferred from `_dam_add_rate` suffix + same pattern as species_dam) |
| Sub-attributes | `_rosetta`, `_vulcher`, `_alters`, `_ascender`, `_creatures`, `_machina`, `_deviation`, `_master` | officialAttributes |
| Direction | Higher = more damage dealt | min=-0.9 (can also reduce!) |
| Clamp | [-0.9, 3.0] | officialAttributes |

**Implementation:** Add to the `final_attack_additional_rate` additive sum, resolved by target species + zone context.

### unit_prototype_dam_add_rate — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Bonus damage vs specific enemy prototype class |
| Identity value | 0 | additive leaf |
| Units | Decimal fraction | calcType=0, max=10.0 |
| Sub-attributes | `_boss`, `_elite`, `_creeps`, `_leader` | officialAttributes |
| Direction | Higher = more damage dealt | min=-0.9 |
| Clamp | [-0.9, 10.0] | officialAttributes |

**Implementation:** Add to the `final_attack_additional_rate` additive sum, resolved by target prototype. Maps to OHMM's existing `EnemyType` (Normal→creeps, Elite→elite, Boss→boss).

---

## 3. Multiplicative Factors (separate from additive sum)

### dis_dam_rate — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Distance-based damage scaling multiplier |
| Identity value | **1** | officialFormulaDefaultsSmokeTest |
| Units | Direct multiplier (0.8 = 80% damage at range) |
| Position in formula | Multiplicative (separate from additive sum) | appears alongside `ignore_dam_rate` in damage_formula context |
| Direction | Lower = less damage at distance |
| Clamp | Implied [0, 1] for falloff; can exceed 1 for close-range bonus |

**Implementation:** Multiply final damage by this value. Default 1 = no change.

### pvp_adjust_factor — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | PvP damage scaling factor (applied per weapon tier) |
| Identity value | **1** | officialFormulaDefaultsSmokeTest |
| Units | Direct multiplier |
| Position in formula | Multiplicative (separate factor) | `get_pvp_adjust_factor_by_weapon_tier` in CompFormulaAdapter |
| Direction | Lower = reduced PvP damage |
| Getter | `CompFormulaAdapter.get_pvp_adjust_factor` | corpus evidence |

**Implementation:** Multiply final damage by this value in PvP mode. Relationship to existing `pvpMitigation`: this is the ATTACKER-side PvP scaling (weapon tier based), while `pvpMitigation` is DEFENDER-side (playerDMGReduction). They are separate systems.

### hurt_deepen_rate — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Target vulnerability amplification (damage taken increase debuff) |
| Identity value | 0 | officialAttributes min=0.0 |
| Units | Additive rate applied as `(1 + hurt_deepen_rate)` multiplier |
| Position in formula | Multiplicative bucket (separate from additive sum) | appears in BB context alongside ignore/bound variables |
| Direction | Higher = target takes more damage | max=1.0 (capped at +100%) |
| Clamp | [0.0, 1.0] | officialAttributes |

**Implementation:** Apply as `× (1 + hurt_deepen_rate)` multiplicative factor. This is a debuff on the TARGET that increases all incoming damage.

---

## 4. Crit System Modifiers

### ignore_crit_rate — ✅ VERIFIED (TARGET attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | TARGET reduces attacker's effective crit rate |
| Identity value | 0 |
| Units | Decimal fraction subtracted from crit rate | calcType=0, max=1.0 |
| Direction | Higher value on TARGET = attacker crits less | min=-1.0 (can boost crit too) |
| Clamp | [-1.0, 1.0] | officialAttributes |
| AttrId | E04 | officialAttributes |

**Implementation:**
```
effectiveCritRate = clamp(baseCritRate - target.ignore_crit_rate, 0, 1)
```
Note: negative values BOOST attacker crit rate (min=-1.0).

### ignore_crit_dam_rate — ✅ VERIFIED (TARGET attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | TARGET reduces incoming crit damage bonus |
| Identity value | 0 |
| Units | Fraction of crit bonus nullified | calcType=0, max=0.9 |
| Direction | Higher on TARGET = less crit damage taken | min=-1.0 |
| Clamp | [-1.0, 0.9] | officialAttributes |
| AttrId | E05 | officialAttributes |

**Implementation:**
```
effectiveCritDMG = baseCritDMG - (baseCritDMG - 1) × target.ignore_crit_dam_rate
// Or equivalently: effectiveCritBonus = critBonus × (1 - ignore_crit_dam_rate)
```
Capped at 0.9 means target can never fully negate crit damage.

### highland_crit_dam_rate — ✅ VERIFIED (ATTACKER attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | ATTACKER bonus crit damage when elevated above target |
| Identity value | 0 |
| Units | Additive to crit damage multiplier | calcType=0 |
| Direction | Higher = more crit damage from height advantage |
| Clamp | [-1.0, 2.0] | officialAttributes |
| AttrId | E174 | officialAttributes |
| Mutual exclusion | Context-determined: only one of highland/lowland applies per hit |

**Implementation:**
```
if (heightAdvantage === "highland") effectiveCritDMG += highland_crit_dam_rate
```

### lowland_crit_dam_rate — ✅ VERIFIED (ATTACKER attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | ATTACKER bonus crit damage when below target (height disadvantage) |
| Identity value | 0 |
| Units | Additive to crit damage multiplier | calcType=0 |
| Direction | Positive = bonus from low ground (!) — not a penalty |
| Clamp | [-1.0, 2.0] | officialAttributes |
| AttrId | E181 | officialAttributes |
| Mutual exclusion | Context-determined: only one of highland/lowland applies per hit |

**Implementation:**
```
if (heightAdvantage === "lowland") effectiveCritDMG += lowland_crit_dam_rate
```
NOTE: Both highland AND lowland are BONUSES (additive to crit DMG). The game may have different gear that boosts one or the other. They're not penalty/bonus — they're just contextual bonuses.

### attack_type_crit_rate_add_rate — ✅ VERIFIED (ATTACKER attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Bonus crit rate for specific attack type |
| Identity value | 0 |
| Units | Additive to crit rate | calcType=0, max=10.0 |
| Sub-attributes | `_melee`, `_remote`, `_dot`, `_item`, `_skill` | officialAttributes |
| Direction | Higher = more crit chance for that attack type |
| Clamp | [-1.0, 10.0] | officialAttributes |

**Implementation:**
```
effectiveCritRate += attack_type_crit_rate_add_rate[attackType]
```

### attack_type_crit_dam_add_rate — ✅ VERIFIED (ATTACKER attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Bonus crit damage for specific attack type |
| Identity value | 0 |
| Units | Additive to crit damage | calcType=0, max=10.0 |
| Sub-attributes | `_melee`, `_remote`, `_dot`, `_item`, `_skill` | officialAttributes |
| Direction | Higher = more crit damage for that attack type |
| Clamp | [-1.0, 10.0] | officialAttributes |

**Implementation:**
```
effectiveCritDMG += attack_type_crit_dam_add_rate[attackType]
```

### crit_rate_dis_count — ⚠️ PARTIAL

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Appears in formula context between `part_dam_add_rate` and `crit_rate` |
| Identity value | Unknown — not in defaults file |
| AttrId | Found in attr_const as `crit_rate_dis_count` and `crit_rate_dis_count_client` |
| Suspicion | Likely a counter/version tracker for crit rate recalculation, NOT a damage modifier |

**Status:** Do NOT implement until call-site usage is proven. The name "dis_count" might be "discount" OR "dispatch count" OR "disconnect count."

---

## 5. Weakspot Modifiers

### keyword_proc_weak_dam_add_rate — ✅ VERIFIED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Keyword-specific bonus to weakspot damage |
| Identity value | 0 |
| Units | Additive to weakspot damage multiplier | calcType=0, max=10.0 |
| Sub-attributes | `_proj` (Bounce), `_shrap` (Shrapnel) | officialAttributes |
| Direction | Higher = more weakspot damage for that keyword |
| Clamp | [-1.0, 10.0] | officialAttributes |

**Implementation:**
```
effectiveWeakspotDMG += keyword_proc_weak_dam_add_rate[keyword]
```
Only applies to keywords that canWeakspot (Bounce, Shrapnel per existing metadata).

### non_weak_ignore_dam_rate — ✅ VERIFIED (TARGET attribute)

| Property | Value | Source |
|----------|-------|--------|
| Semantics | TARGET reduces damage taken on NON-weakspot hits |
| Identity value | 0 |
| Units | Fraction of damage negated on body shots | calcType=0, max=1.0 |
| Direction | Higher on TARGET = less damage from body shots |
| Clamp | [-1.0, 1.0] | officialAttributes |
| AttrId | G14 | officialAttributes |

**Implementation:**
```
if (!wasWeakspot) damage *= (1 - non_weak_ignore_dam_rate)
```
Note: This variable was previously labeled `weak_ignore_dam_rate` in our mining — the ACTUAL name is `non_weak_ignore_dam_rate` (reduces non-weakspot damage, not weakspot damage).

---

## 6. EXCLUDED from HP Damage Formula

### toughness_dam_rate — 🚫 EXCLUDED

| Property | Value | Source |
|----------|-------|--------|
| Semantics | Stagger/structure damage, NOT HP damage |
| Evidence | calcType=0, min=0.0, max=**9999999.0** | officialAttributes |
| AttrId | O05 (different prefix from damage attrs which use E/F/G) |
| Conclusion | A value capped at 9.9M is clearly NOT a 0-1 mitigation factor. This tracks cumulative toughness/stagger damage dealt to break enemy posture/parts. |

**DO NOT wire into HP damage calculations.**

---

## 7. Debuff-Conditional Crit Modifiers (for future implementation)

### debuff_type_crit_rate_add_rate — ✅ VERIFIED

| Sub-attributes | `_scorch`, `_frozen`, `_mark`, `_bleeding`, `_surge`, `_vortex`, `_all` |
| Clamp | [0.0, 1.0] |
| Semantics | Bonus crit rate when target has specified debuff |

### debuff_type_crit_dam_add_rate — ✅ VERIFIED

| Sub-attributes | `_scorch`, `_frozen`, `_mark`, `_bleeding`, `_surge`, `_vortex`, `_all` |
| Clamp | [0.0, 10.0] |
| Semantics | Bonus crit damage when target has specified debuff |

### species_type_crit_rate_add_rate — ✅ VERIFIED

| Sub-attributes | `_rosetta`, `_vulcher`, `_alters`, `_ascender`, `_creatures`, `_machina`, `_deviation`, `_master` |
| Clamp | [-1.0, 1.0] |
| Semantics | Bonus crit rate vs specific species |

### species_type_crit_dam_add_rate — ✅ VERIFIED

| Sub-attributes | same as above |
| Clamp | [-0.9, 3.0] |
| Semantics | Bonus crit damage vs specific species |

---

## 8. Implementation Plan (Verified Fields Only)

### Phase 2A: Additive bucket additions (officialFormulaBridge.ts)

Wire `debuff_type_dam_add_rate` into the existing `DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE` additive sum. It's already a leaf (exprId 9) — just needs stat bridge resolution.

Wire `species_field_dam_add_rate` and `unit_prototype_dam_add_rate` into the same additive sum (add new leaves to recipe).

### Phase 2B: Multiplicative factors (formulaApplicator.ts fallback path)

Apply `dis_dam_rate` (identity=1), `pvp_adjust_factor` (identity=1), and `hurt_deepen_rate` (as `1 + value`) as separate multiplicative factors AFTER the official graph computation.

### Phase 2C: Crit system modifiers

Apply in this order:
```
effectiveCritRate = baseCritRate
  + attack_type_crit_rate_add_rate[attackType]    // ATTACKER bonus
  + debuff_type_crit_rate_add_rate[debuff]        // ATTACKER bonus vs debuffed
  + species_type_crit_rate_add_rate[species]      // ATTACKER bonus vs species
  - target.ignore_crit_rate                        // TARGET reduction
effectiveCritRate = clamp(effectiveCritRate, 0, 1)

effectiveCritDMG = baseCritDMG
  + attack_type_crit_dam_add_rate[attackType]
  + debuff_type_crit_dam_add_rate[debuff]
  + species_type_crit_dam_add_rate[species]
  + highland_crit_dam_rate (if height=highland)
  + lowland_crit_dam_rate (if height=lowland)
  - (baseCritDMG - 1) × target.ignore_crit_dam_rate  // TARGET reduction
```

### Phase 2D: Weakspot modifiers

```
effectiveWeakspotDMG = baseWeakspotDMG
  + keyword_proc_weak_dam_add_rate[keyword]

if (!wasWeakspot) damage *= (1 - non_weak_ignore_dam_rate)
```

---

## 9. Fields Remaining UNVERIFIED (do not implement)

| Field | Reason |
|-------|--------|
| `crit_rate_dis_count` | Could be "discount" or "dispatch count" — no call-site proof |
| `toughness_dam_rate` | Proven to be stagger/structure damage, NOT HP |
| `attack_lightning_against_shield` | Shield-specific, not general HP formula |
| `bound_crit_dam_rate` | Crit cap — need formula position proof |
| `part_dam_ignore_rate` | Body-part specific — need hitbox system integration |
| Sub-melee flags | Need full melee formula tree |
