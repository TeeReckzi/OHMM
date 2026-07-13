# Damage Formula Alignment Audit
## Game Blackboard (BB.*) vs OHMM Engine

This document maps every variable discovered in the game's `damage_formula.pyc`
to its corresponding field in OHMM's engine, identifies gaps, and recommends changes.

---

## Legend
- ✅ = OHMM already models this correctly
- ⚠️ = OHMM models this but with different semantics or naming
- ❌ = OHMM does NOT model this — gap to fill
- 🔄 = OHMM uses a different approach that may need reconciliation

---

## 1. Base Damage Calculation

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `final_attack` | `officialFormulaBridge: base_attack` | ✅ | OHMM computes `baseWpn × (1 + atkPct)` = game's `final_attack` |
| `base_attack` | `FormulaInput.baseWeaponDMG` | ✅ | Raw weapon damage per projectile |
| `attack_additional_rate` | `FormulaInput.attackPercent` | ✅ | ATK% bonus from gear/mods |
| `base_weapon_type` | `OfficialBridgeContext.gunType` | ✅ | Used for tag-resolved leaves |
| `base_weapon_tier` | Not modeled | ❌ | Weapon tier may affect formula path |
| `base_gun_type` | `OfficialBridgeContext.gunType` | ✅ | Same as weapon_type |

## 2. Damage Type Multiplier Buckets

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `attack_type_dam_add_rate` | `officialFormulaLeafResolvers: attack_type_dam_add_rate` | ✅ | Tag-resolved dynamic leaf |
| `element_type_dam_add_rate` | `officialFormulaLeafResolvers: element_type_dam_add_rate` | ✅ | Elemental DMG bonus |
| `species_dam_add_rate` | `officialFormulaBridge: species_dam_add_rate` | ⚠️ | OHMM maps `enemyTypeDMGBonus` → this. Game separates species from prototype |
| `species_field_dam_add_rate` | Not modeled | ❌ | **NEW**: Bonus damage when target is in their "field" (territory effect?) |
| `unit_prototype_dam_add_rate` | Not modeled | ❌ | **NEW**: Damage bonus vs specific unit prototypes (boss IDs) |
| `debuff_type_dam_add_rate` | Not modeled | ❌ | **NEW**: Extra damage when target has specific debuff |
| `keyword_proc_dam_add_rate` | `officialFormulaLeafResolvers: keyword_proc_dam_add_rate` | ✅ | Keyword DMG bonus |
| `gun_type_dam_add_rate` | `officialFormulaLeafResolvers: gun_type_dam_add_rate` | ✅ | Per-gun-type DMG bonus |

## 3. Crit System

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `final_crit_rate` | `FormulaInput.critRate` | ✅ | Final computed crit rate |
| `crit_dam_add_rate` | `FormulaInput.critDMG` | ✅ | Crit damage multiplier |
| `crit_rate_dis_count` | Not modeled | ❌ | **NEW**: "Crit rate discount" — reduces effective crit rate. Appears to be an enemy stat that reduces incoming crit chance |
| `final_is_crit` | `ContextFlag: wasCrit` | ✅ | Whether this hit was a crit |
| `use_crit` | `MechanicBehavior.canCrit` | ✅ | Whether this mechanic can crit |
| `defined_fixed_crit` | Not modeled | ❌ | **NEW**: Some attacks have a fixed crit override (always crit or never crit) |
| `attack_type_crit_rate_add_rate` | Not modeled | ❌ | **NEW**: Crit rate bonus per attack type (melee/ranged/skill) |
| `attack_type_crit_dam_add_rate` | Not modeled | ❌ | **NEW**: Crit DMG bonus per attack type |
| `keyword_proc_crit_rate_add_rate` | `StatType.KeywordCritRatePercent` | ✅ | Keyword-specific crit rate |
| `keyword_proc_crit_dam_add_rate` | `StatType.KeywordCritDamagePercent` | ✅ | Keyword-specific crit DMG |
| `debuff_type_crit_rate_add_rate` | Not modeled | ❌ | **NEW**: Crit rate bonus when target has debuff |
| `debuff_type_crit_dam_add_rate` | Not modeled | ❌ | **NEW**: Crit DMG bonus when target has debuff |
| `species_type_crit_rate_add_rate` | Not modeled | ❌ | **NEW**: Crit rate bonus vs specific species |
| `species_type_crit_dam_add_rate` | Not modeled | ❌ | **NEW**: Crit DMG bonus vs specific species |
| `melee_type_crit_rate_add_rate` | Not modeled | ❌ | **NEW**: Melee-specific crit rate |
| `melee_type_crit_dam_add_rate` | Not modeled | ❌ | **NEW**: Melee-specific crit DMG |
| `tag_melee_crit_rate_add_rate` | Not modeled | ❌ | **NEW**: "Tag melee" crit rate (different from melee_type) |
| `tag_melee_crit_dam_add_rate` | Not modeled | ❌ | **NEW**: "Tag melee" crit DMG |
| `tag_bullet_crit_dam_add_rate` | Not modeled | ❌ | **NEW**: Bullet-tagged crit DMG |
| `bound_crit_dam_rate` | Not modeled | ❌ | **NEW**: Crit damage cap/bound |
| `ignore_crit_rate` | Not modeled | ❌ | **NEW**: Enemy ignores attacker crit rate (reduces it) |
| `ignore_crit_dam_rate` | Not modeled | ❌ | **NEW**: Enemy reduces crit damage taken |
| `highland_crit_dam_rate` | Not modeled | ❌ | **NEW**: Height advantage → bonus crit DMG |
| `lowland_crit_dam_rate` | Not modeled | ❌ | **NEW**: Height disadvantage → reduced crit DMG |

## 4. Weakspot System

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `final_weak_rate` | `FormulaInput.weakspotDMG` | ⚠️ | OHMM calls this "weakspot damage bonus %", game calls it "weak rate" |
| `final_is_weak` | `ContextFlag: wasWeakspot` | ✅ | Whether hit landed on weakspot |
| `use_weak` | `MechanicBehavior.canWeakspot` | ✅ | Whether this mechanic can weakspot |
| `weak_ignore_dam_rate` | Not modeled | ❌ | **NEW**: Enemy reduces incoming weakspot damage |
| `keyword_proc_weak_dam_add_rate` | Not modeled | ❌ | **NEW**: Keyword-specific weakspot DMG bonus |
| `debuff_type_weak_dam_add_rate` | Not modeled | ❌ | **NEW**: Weakspot bonus when target has debuff |
| `none_weak_ignore_dam_rate` | Not modeled | ❌ | **NEW**: Damage reduction on non-weakspot hits |

## 5. Attack Type Flags

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `attack_is_melee` | `DamageTrait.Melee` | ✅ | |
| `attack_is_normal` | Implicit | ✅ | Default when not skill/item |
| `attack_is_skill` | Not modeled as flag | ⚠️ | Skills vs normal attacks |
| `attack_is_item` | Not modeled | ❌ | Item-sourced damage |
| `attack_is_tag_melee` | Not modeled | ❌ | "Tag melee" — distinct from actual melee |
| `attack_is_sub_melee` | Not modeled | ❌ | Sub-melee type (combo/heavy/dash/backstab) |
| `attack_is_remote` | Implicit | ✅ | Ranged attacks |
| `attack_is_buff` | Not modeled | ❌ | Buff-sourced damage |
| `attack_is_pvp` | `CalculationInput.buildMode === "pvp"` | ✅ | PvP flag |
| `bullet_is_special` | Not modeled | ❌ | Special bullet flag |
| `formula_attack_type` | `OfficialBridgeContext.formulaAttackType` | ✅ | Enum: Melee/Remote/Bomb/Skill/Item/Facility |

## 6. PvP & Special Multipliers

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `pvp_adjust_factor` | `pvpMitigation` system | ⚠️ | OHMM has PvP mitigation as a separate layer. Game applies inline |
| `hurt_deepen_rate` | Not modeled | ❌ | **NEW**: "Hurt deepen" — damage amplification debuff on target |
| `final_species_dam_ignore_rate` | Not modeled | ❌ | **NEW**: Species-specific damage ignore (enemy defense) |
| `attack_ignore_dam_rate` | Not modeled | ❌ | **NEW**: Attacker can ignore some enemy damage reduction |
| `part_dam_ignore_rate` | Not modeled | ❌ | **NEW**: Body-part-specific damage ignore rate |
| `dis_dam_rate` | Not modeled | ❌ | **NEW**: Distance-based damage falloff rate |
| `toughness_dam_rate` | Not modeled | ❌ | **NEW**: Toughness/armor damage factor |
| `attack_lightning_against_shield` | Not modeled | ❌ | **NEW**: Lightning damage bonus vs shields |

## 7. Target Properties

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `target_unit_species` | `EnemyType` enum | ⚠️ | OHMM has Normal/Elite/Boss. Game has species: ROSETTA/ALERT/VULCHER |
| `target_unit_prototype` | Not modeled | ❌ | Specific enemy ID for prototype-specific damage |
| `attacker_unit_species` | Not modeled | ❌ | Attacker's species (player vs NPC vs deviation) |
| `attacker_unit_prototype` | Not modeled | ❌ | Attacker's prototype ID |
| `target_has_field` | Not modeled | ❌ | Whether target is in their field/territory |

## 8. Melee-Specific

| Game Variable | OHMM Equivalent | Status | Notes |
|---|---|---|---|
| `base_tag_melee` | Not modeled | ❌ | Whether attack is "tagged" as melee |
| `base_sub_melee_attack_type` | Not modeled | ❌ | Sub-type: Combo/Heavy/Dash/Backstab |
| `melee_relate_use_crit` | Not modeled | ❌ | Whether melee-related can crit |
| `final_melee_type_crit_enable` | Not modeled | ❌ | Melee crit enable flag |
| `final_tag_melee_crit_enable` | Not modeled | ❌ | Tag-melee crit enable flag |

---

## Summary of Gaps

### HIGH PRIORITY (affects DPS accuracy for common builds):
1. **`crit_rate_dis_count`** — Enemy crit resistance. Without this, crit DPS is overestimated vs tough enemies.
2. **`debuff_type_dam_add_rate`** — Bonus damage when target has specific debuffs (e.g. burn, freeze). Many builds stack debuffs.
3. **`species_field_dam_add_rate`** — Bonus in enemy territory zones.
4. **`hurt_deepen_rate`** — Vulnerability/amplification debuff. If mods/deviations apply this, it's a missing multiplier bucket.
5. **`dis_dam_rate`** — Distance falloff. Matters for sniper vs shotgun comparisons.
6. **`keyword_proc_weak_dam_add_rate`** — Keywords can boost weakspot damage. Missing from keyword formula.

### MEDIUM PRIORITY (affects niche builds or accuracy at margins):
7. **`attack_type_crit_rate_add_rate`** / `attack_type_crit_dam_add_rate` — Per-attack-type crit bonuses
8. **`highland_crit_dam_rate`** / `lowland_crit_dam_rate` — Height advantage
9. **`ignore_crit_rate`** / `ignore_crit_dam_rate` — Enemy crit suppression
10. **`toughness_dam_rate`** — Armor/toughness factor
11. **`unit_prototype_dam_add_rate`** — Boss-specific damage bonus

### LOW PRIORITY (rare edge cases or PvP-specific):
12. `defined_fixed_crit` — Hard-coded crit behaviors
13. `attack_lightning_against_shield` — Shield interaction
14. `part_dam_ignore_rate` — Body-part damage
15. `bound_crit_dam_rate` — Crit damage cap
16. Various sub-melee flags

---

## Recommended Implementation Order

### Phase 1: Add missing multiplier buckets to FormulaInput (non-breaking)
Add these optional fields to `FormulaInput`:
```typescript
// Enemy crit resistance (reduces effective crit rate)
critRateDiscount?: number;
// Debuff-conditional damage bonus
debuffTypeDamAddRate?: number;
// Species field bonus
speciesFieldDamAddRate?: number;
// Vulnerability/amplification on target  
hurtDeepenRate?: number;
// Distance falloff (0-1, 1 = no falloff)
distanceDamRate?: number;
// Keyword weakspot damage bonus
keywordProcWeakDamAddRate?: number;
```

### Phase 2: Wire into formulaApplicator multiplier chain
For `applyPhysicalWeaponDamage`:
- Apply `critRateDiscount` before computing crit multiplier
- Add `debuffTypeDamAddRate` as new multiplier bucket
- Add `hurtDeepenRate` as new multiplier bucket
- Apply `distanceDamRate` as final scaling factor

### Phase 3: Add to damageFormulaEngine StatType + Buckets
Add new `StatType` entries and corresponding `BucketDef` entries for the universal resolution system.

### Phase 4: Bridge from CalculationInput
Extend `formulaBridge.ts` to extract these values from gear/mod stat modifiers and pipe them through.
