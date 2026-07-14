# Stat System Gap Report: Game Formula ↔ OHMM Coverage

**Generated:** 2026-07-14  
**Scope:** All damage-formula-relevant game attributes (from `officialAttributes.generated.ts` + `FORMULA_ALIGNMENT_AUDIT.md`) vs OHMM's 42+ canonical StatKeys, STAT_KEY_OVERRIDES bridge, and registry item data.

---

## Summary

| Category | Count |
|----------|-------|
| Game formula variables (damage-relevant) | ~55 unique base attributes (200+ with sub-keys) |
| OHMM canonical StatKeys (buildGoalSchema) | 80+ (42 core + legacy/conditional) |
| Stats fully wired (gear → CalculationInput → FormulaInput) | ~18 |
| Stats with canonical key but no bridge or no items | ~25 |
| Game variables with NO OHMM canonical key | ~30+ |

---

## A) Game Formula Variables with NO Canonical StatKey in OHMM

These are attributes proven to exist in the game's damage formula (from `officialAttributes.generated.ts` and the formula graph) that have **no corresponding entry** in `buildGoalSchema.ts`:

### HIGH PRIORITY (directly in the damage formula)

| Game Variable | Semantics | Formula Position | DPS Impact |
|--------------|-----------|-----------------|------------|
| `dis_dam_rate` | Distance-based damage falloff | Multiplicative (identity=1) | HIGH — snipers lose 20-40% at range |
| `pvp_adjust_factor` | PvP weapon-tier scaling (attacker-side) | Multiplicative (identity=1) | HIGH for PvP mode |
| `hurt_deepen_rate` | Target vulnerability amplification | Multiplicative ×(1+val) | HIGH — up to +100% |
| `ignore_crit_rate` | Target reduces attacker's crit rate | Subtractive from critRate | MEDIUM-HIGH |
| `ignore_crit_dam_rate` | Target reduces crit damage bonus | Multiplicative on crit bonus | MEDIUM-HIGH |
| `non_weak_ignore_dam_rate` | Target reduces non-weakspot damage | Multiplicative on body shots | MEDIUM |
| `unit_prototype_dam_add_rate` | Bonus vs boss/elite/creeps/leader | Additive in additional_rate | MEDIUM-HIGH |
| `species_field_dam_add_rate` | Bonus in species' territory | Additive in additional_rate | MEDIUM |

### MEDIUM PRIORITY (crit/weakspot modifiers)

| Game Variable | Semantics | DPS Impact |
|--------------|-----------|------------|
| `highland_crit_dam_rate` | Height advantage crit DMG bonus | LOW-MEDIUM (context-specific) |
| `lowland_crit_dam_rate` | Low ground crit DMG bonus | LOW-MEDIUM (context-specific) |
| `attack_type_crit_rate_add_rate` | Per-attack-type crit rate bonus | MEDIUM |
| `attack_type_crit_dam_add_rate` | Per-attack-type crit DMG bonus | MEDIUM |
| `debuff_type_crit_rate_add_rate` | Crit rate bonus vs debuffed targets | MEDIUM |
| `debuff_type_crit_dam_add_rate` | Crit DMG bonus vs debuffed targets | MEDIUM |
| `debuff_type_dam_add_rate` | Damage bonus vs debuffed targets | MEDIUM-HIGH |
| `keyword_proc_weak_dam_add_rate` | Keyword-specific weakspot bonus | MEDIUM (Bounce/Shrapnel only) |
| `species_type_crit_rate_add_rate` | Crit rate vs species | LOW-MEDIUM |
| `species_type_crit_dam_add_rate` | Crit DMG vs species | LOW-MEDIUM |

### LOW PRIORITY (rate/mechanical/niche)

| Game Variable | Semantics | DPS Impact |
|--------------|-----------|------------|
| `weapon_rpm_add_rate` | Fire rate additive rate | MEDIUM (but OHMM has `fireRate`) |
| `weapon_reload_speed_add_rate` | Reload speed bonus | LOW (DPS uptime, not per-shot) |
| `weapon_magazine_size` | Magazine capacity (game official attr) | LOW (DPS uptime) |
| `melee_type_dam_add_rate_*` | Per-melee-type bonuses (backstab/combo/dash/heavy) | LOW (melee niche) |
| `melee_type_crit_*` | Per-melee-type crit modifiers | LOW (melee niche) |
| `element_type_highland/lowland_dam_add_rate_*` | Element + height bonuses | LOW (very situational) |
| `dot_dam_frequency_add_rate_*` | DoT tick frequency bonuses | MEDIUM (DoT builds) |
| `dot_dam_base_dam_scorch` | Base scorch DoT damage | MEDIUM (burn builds) |
| `skill_dam_base_dam_*` | Base keyword skill damage values | MEDIUM (per-keyword) |
| `tag_melee_*` | Melee-specific weapon type bonuses | LOW |

### EXCLUDED (proven non-HP-damage)

| Game Variable | Reason |
|--------------|--------|
| `toughness_dam_rate` | Stagger/structure damage (max=9999999), NOT HP |
| `structure_attack` / `structure_attack_rate` | Building/structure damage |
| `vehicle_attack` / `vehicle_dam_ignore_rate` | Vehicle combat system |
| `close_range_toughness_dam_multiplier` | Toughness system |
| `weakness_toughness_dam_multiplier` | Toughness system |

---

## B) Stats with a Canonical Key but NO Bridge Mapping (STAT_KEY_OVERRIDES)

These exist in `buildGoalSchema.ts` but are **NOT** in the `STAT_KEY_OVERRIDES` map (meaning items with these raw stat names won't get bridged):

| StatKey | In Schema | In STAT_KEY_OVERRIDES | Notes |
|---------|-----------|----------------------|-------|
| `dotEffectDMGBonus` | ✅ | ❌ | New conditional key — items use it via generated suffixes |
| `instantEffectDMGBonus` | ✅ | ❌ | New conditional key — items use it via generated suffixes |
| `markedTargetDMGBonus` | ✅ | ❌ | Bullseye/Hunter's Mark conditional |
| `markedTargetCritDMGBonus` | ✅ | ❌ | Bullseye conditional |
| `markedTargetWeakspotDMGBonus` | ✅ | ❌ | Bullseye conditional |
| `damageVsPowerSurgeTargetBonus` | ✅ | ❌ | Target-conditional bonus |
| `fortressWarfareZoneDMGBonus` | ✅ | ❌ | Zone-gated bonus |
| `weaponDMG` (legacy) | ✅ | ✅ (→ weaponDMGFlat) | Correctly aliased |
| `fastGunnerDMGBonus` | ✅ | ❌ | Legacy, but no items provide it directly |

**Impact:** Items from the `modSuffixStats.bindict.generated.ts` file DO use these keys directly in their `statKey` field. The loadout effect resolver pipeline handles them — they bypass STAT_KEY_OVERRIDES because the generated data already uses canonical StatKey names. **This is by design, not a bug.**

---

## C) Stats with Bridge Mapping but NO Items Provide Them

These are mapped in STAT_KEY_OVERRIDES but **no item in any registry** currently provides them:

| StatKey | Mapped From | Items Provide? | Why Missing |
|---------|-------------|---------------|-------------|
| `weaponDMGFlat` | weaponDMG, weaponDMGFlat | ❌ | Flat base damage comes from weapon base stats, not mods |
| `meleeDMGFlat` | meleeDMG, meleeDMGFlat | ❌ | Flat base damage from weapon |
| `attackPercent` | attackPercent | Only from cradle (rng perk) | Very few sources |
| `humanDamageBonus` | humanDamageBonus | ❌ | PvP-specific, not yet in registries |
| `keywordSuffixDMGBonus` | keywordSuffixDMGBonus | ❌ | Generic bucket; items use specific keyword keys |
| `fireRate` | fireRate | Only in suffix stats (generated) | Rate stat from mod suffixes |
| `reloadSpeed` | reloadSpeed | Only in suffix stats (generated) | Rate stat from mod suffixes |
| `reloadEfficiency` | reloadEfficiency | ❌ | Not yet observed on items |
| `magazineCapacity` | magazineCapacity | Only in suffix stats (generated) | Rate stat from mod suffixes |
| `movementSpeedBonus` | movementSpeedBonus | Only in suffix stats (generated) | Utility stat |
| `medicineSpeedBonus` | medicineSpeedBonus | ❌ | Utility stat |
| `superAnomalyStrength` | superAnomalyStrength | ❌ | Not yet observed on items |
| `psiIntensity` | psiIntensity | Only in suffix stats (generated) | Anomaly stat |
| `dmgReduction` | dmgReduction | ❌ | General mitigation |
| `hpRecovery` | hpRecovery | ❌ | Survivability |
| `shield` | shield | ❌ | Survivability |
| `shieldStrength` | shieldStrength | ❌ | Survivability |
| `healingReceived` | healingReceived | Only in suffix stats | Utility |
| `deviationSupport` | deviationSupport | ❌ | Not observable |
| `weaponVulnerability` | weaponVulnerability | Only from cradle (Precision Mastery) | Few sources |
| `statusVulnerability` | statusVulnerability | ❌ | Not yet observed |
| `burnCurrentStacks` | burnCurrentStacks | ❌ | Runtime state, not a gear stat |
| `burnTickFrequencyBonus` | burnTickFrequencyBonus | ❌ | Not yet observed |
| `flatBurnBonus` | flatBurnBonus | ❌ | Not yet observed |
| `dotResistanceReduction` | dotResistanceReduction | ❌ | Not yet observed |
| `burnResistanceDebuffLevel` | burnResistanceDebuffLevel | ❌ | Not yet observed |
| `fastGunnerDMG` | fastGunnerDMG | ❌ | Legacy/pending |
| `bullseyeDMG` | bullseyeDMG | ❌ | Legacy/pending |
| `deviationSkillDMG` | deviationSkillDMG | ❌ | Deviation system |
| `foodBonusPercent` | foodBonusPercent | ❌ | Food system |
| `gatheringYield` | gatheringYield | ❌ | Non-combat |
| `miningYield` | miningYield | ❌ | Non-combat |
| `loggingYield` | loggingYield | ❌ | Non-combat |
| `fishingYield` | fishingYield | ❌ | Non-combat |
| `craftingEfficiency` | craftingEfficiency | ❌ | Non-combat |

---

## D) Fully Wired Stats (Gear → CalculationInput → FormulaInput → DPS Result)

These stats have a complete data flow:

### Tier 1: Direct DPS formula participants

| StatKey | Items Provide | STAT_KEY_OVERRIDES | Bridge Resolution | FormulaInput Field | Used In Calculation |
|---------|-------------|-------------------|-------------------|-------------------|---------------------|
| `weaponDMGBonus` | ✅ Cradle, Suffixes | ✅ weaponDMGBonus | ✅ → weapon_attack_add_rate | ✅ weaponDMGBonus | ✅ officialFormulaBridge additive sum |
| `critRate` | ✅ Cradle, Suffixes | ✅ critRate | ✅ direct | ✅ critRate | ✅ crit multiplier |
| `critDMG` | ✅ Cradle, Suffixes | ✅ critDMG | ✅ direct | ✅ critDMG | ✅ crit multiplier |
| `weakspotDMG` | ✅ Cradle, Suffixes | ✅ weakspotDMG | ✅ direct | ✅ weakspotDMG | ✅ weakspot multiplier |
| `attackPercent` | ✅ Cradle (few) | ✅ attackPercent | ✅ direct | ✅ attackPercent | ✅ base_attack scaling |
| `enemyTypeDMGBonus` | ✅ Suffixes | ✅ enemyTypeDMGBonus | ✅ → species_dam_add_rate | ✅ enemyTypeDMGBonus | ✅ officialFormulaBridge additive sum |
| `humanDamageBonus` | (cradle implicit) | ✅ humanDamageBonus | ✅ → human_dam_add_rate | ✅ humanDamageBonus | ✅ officialFormulaBridge additive sum |
| `weaponVulnerability` | ✅ Cradle | ✅ weaponVulnerability | ✅ direct | ✅ weaponVulnerability | ✅ vulnerability multiplier |

### Tier 2: Keyword DPS bonuses (via tag-table resolution)

| StatKey | Items Provide | Bridge Resolution | Formula Leaf | Status |
|---------|-------------|-------------------|-------------|--------|
| `burnDMGBonus` | ✅ Mods, Cradle | ✅ → keyword_proc_dam_add_rate_scorch | additive sum | ✅ FULLY WIRED |
| `frostVortexDMGBonus` | ✅ Cradle | ✅ → keyword_proc_dam_add_rate_vortex | additive sum | ✅ FULLY WIRED |
| `powerSurgeDMGBonus` | ✅ Mods, Cradle | ✅ → keyword_proc_dam_add_rate_surge | additive sum | ✅ FULLY WIRED |
| `unstableBomberDMGBonus` | ✅ Cradle | ✅ → keyword_proc_dam_add_rate_blast | additive sum | ✅ FULLY WIRED |
| `shrapnelDMGBonus` | ✅ Cradle | ✅ → keyword_proc_dam_add_rate_shrap | additive sum | ✅ FULLY WIRED |
| `elementalDMGBonus` | ✅ Cradle | ✅ → element_type_dam_add_rate_{fire,ice,lightning} | additive sum | ✅ FULLY WIRED |
| `meleeDMGBonus` | ✅ Suffixes | ✅ → attack_type_dam_add_rate_melee | additive sum | ✅ FULLY WIRED |

### Tier 3: Conditional/suffix DPS bonuses (generated data path)

| StatKey | Items Provide | Path | Status |
|---------|-------------|------|--------|
| `bounceDMGBonus` | ✅ Cradle | STAT_KEY_OVERRIDES → ModifierSource → playerStats accumulation | ✅ WIRED (keyword fallback) |
| `shrapnelCritDMGBonus` | ✅ Cradle | STAT_KEY_OVERRIDES → ModifierSource → playerStats accumulation | ⚠️ Accumulated but NOT in FormulaInput |
| `statusDMGBonus` | ✅ Cradle, Suffixes | STAT_KEY_OVERRIDES → FormulaInput.statusDMGBonus | ✅ WIRED (status formula path) |
| `dotEffectDMGBonus` | ✅ Suffixes (generated) | loadoutEffectResolver → ModifierSource | ⚠️ Accumulated but NOT in officialFormulaBridge |
| `markedTargetDMGBonus` | ✅ Suffixes (generated) | loadoutEffectResolver → ModifierSource | ⚠️ Accumulated but NOT in officialFormulaBridge |
| `damageVsPowerSurgeTargetBonus` | ✅ Suffixes (generated) | loadoutEffectResolver → ModifierSource | ⚠️ Accumulated but NOT in officialFormulaBridge |
| `fortressWarfareZoneDMGBonus` | ✅ Suffixes (generated) | loadoutEffectResolver → ModifierSource | ⚠️ Accumulated but NOT in officialFormulaBridge |

### Tier 4: PvP/Defensive (non-DPS)

| StatKey | Items Provide | Flow | Status |
|---------|-------------|------|--------|
| `playerDMGReduction` | ✅ Cradle, Food | → pvpMitigation system | ✅ FULLY WIRED (PvP mode) |
| `weaponDMGReduction` | ✅ Cradle, Suffixes | → semantic routing | ✅ Tracked (non-DPS) |
| `statusDMGReduction` | ✅ Cradle, Suffixes | → semantic routing | ✅ Tracked (non-DPS) |
| `critDMGReduction` | ✅ Suffixes | → semantic routing | ✅ Tracked (non-DPS) |
| `weakspotDMGReduction` | ✅ Suffixes | → semantic routing | ✅ Tracked (non-DPS) |

---

## E) Priority Recommendations for DPS Accuracy

### 🔴 CRITICAL (implement immediately — affects ALL builds)

1. **`dis_dam_rate` (Distance Damage Rate)**
   - Impact: 20-40% DPS error for ranged weapons at distance
   - No StatKey needed — this is a COMBAT CONTEXT parameter (like range selection)
   - Implementation: Add a distance slider/assumption to combat state, multiply result
   - Effort: LOW (single multiplier × final damage)

2. **`hurt_deepen_rate` (Target Vulnerability Debuff)**
   - Impact: Up to +100% damage amplification when target is debuffed
   - Maps to existing `weaponVulnerability`/`statusVulnerability` partially
   - Implementation: Add StatKey + source from debuff state → multiplicative factor
   - Effort: MEDIUM (need debuff tracking + formula multiply)

3. **`unit_prototype_dam_add_rate` (Boss/Elite/Creeps Bonus)**
   - Impact: 10-30% DPS difference in endgame content
   - Currently `enemyTypeDMGBonus` is a single bucket — game has per-prototype attrs
   - Implementation: Split enemyType by prototype OR resolve existing key via target type
   - Effort: MEDIUM (already have target selection + species in formula)

### 🟡 HIGH (implement soon — affects specific builds significantly)

4. **`debuff_type_dam_add_rate` (Damage vs Debuffed Targets)**
   - Impact: 15-25% DPS for status-heavy builds (burn, frost, etc.)
   - Already in FormulaInput as `debuffTypeDamAddRate` but NOT wired from gear
   - Implementation: Add debuff-state assumption + resolve from combat context
   - Effort: MEDIUM (FormulaInput field exists, need source + formula leaf connection)

5. **Crit System Modifiers** (`ignore_crit_rate`, `ignore_crit_dam_rate`, `attack_type_crit_*`)
   - Impact: 5-15% DPS error in PvP, 3-8% in PvE (enemies have crit reduction)
   - FormulaInput fields exist but aren't sourced from anywhere
   - Implementation: Add target attributes + per-attack-type bonuses
   - Effort: MEDIUM-HIGH (need target attribute data + resolver context)

6. **`species_field_dam_add_rate` (Zone-Species Bonus)**
   - Impact: Up to 15% in species-specific zones (Fortress Warfare, etc.)
   - FormulaInput field exists (`speciesFieldDamAddRate`) but not wired
   - Implementation: Add zone context to combat assumptions
   - Effort: LOW (just need the assumption toggle)

### 🟢 MEDIUM (quality-of-life — noticeable accuracy improvement)

7. **`keyword_proc_weak_dam_add_rate` (Keyword Weakspot Bonus)**
   - Impact: 5-10% for Bounce/Shrapnel builds on weakspot hits
   - FormulaInput field exists but no items source it
   - Implementation: Resolve from keyword context + add to weakspot calc
   - Effort: LOW

8. **`non_weak_ignore_dam_rate` (Body Shot Reduction)**
   - Impact: 5-15% when calculating body-shot DPS vs armored targets
   - FormulaInput field exists but not sourced from target data
   - Implementation: Add to target attributes
   - Effort: LOW

9. **`pvp_adjust_factor` (PvP Weapon-Tier Scaling)**
   - Impact: Variable — could be 10-30% in PvP
   - Resolver exists (defaults to 1) but actual per-tier values unknown
   - Implementation: Need weapon-tier → factor lookup table recovery
   - Effort: HIGH (data recovery needed)

### ⚪ LOW (niche/future)

10. Highland/lowland crit bonuses — very context-specific
11. Per-melee-type modifiers — full melee formula tree needed
12. Element × armor type resistance — target data needed
13. DoT frequency modifiers — DoT subsystem refinement

---

## Architectural Observations

### What's Working Well
- The **additive sum structure** (`final_attack_additional_rate`) is correctly recovered and implemented
- The **tag-table resolution system** correctly maps OHMM stat keys → official game attribute names
- The **stat bridge** (`officialFormulaStatBridge.ts`) cleanly separates resolution from injection
- The **dual pipeline** (STAT_KEY_OVERRIDES for manual items + generated statKey for bindict data) covers both paths

### Key Gaps
1. **FormulaInput has fields nobody populates**: `debuffTypeDamAddRate`, `speciesFieldDamAddRate`, `unitPrototypeDamAddRate`, `distanceDamRate`, `hurtDeepenRate`, `targetIgnoreCritRate`, etc. are declared but always undefined
2. **No combat context UI**: The formula supports distance/height/debuff-state but there's no UI to set these assumptions
3. **Target attributes are absent**: The game has per-enemy-type attributes (crit resistance, damage reduction) that OHMM's target registry doesn't model
4. **Conditional suffix stats accumulate but don't reach the official formula**: Keys like `dotEffectDMGBonus`, `markedTargetDMGBonus` are in ModifierSources but `officialFormulaBridge.ts` doesn't read them

### Recommended Architecture Fix
The `officialFormulaBridge.ts` currently reads only a small subset of `playerStats`:
- `weaponDMGBonus`, `enemyTypeDMGBonus`, `humanDamageBonus` (directly)
- Tag-resolved keywords via `resolveBridgeInjections`

It should ALSO read:
- `debuffTypeDamAddRate` from combat state assumptions
- `distanceDamRate` from a distance/engagement assumption
- `hurtDeepenRate` from target debuff state
- Target crit/weakspot reduction from target attributes
- Conditional suffix bonuses from playerStats accumulation (once debuff context is resolved)
