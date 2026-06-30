# Missing Additional-Rate Leaves Classification

**Date:** 2026-05-30 (updated 2026-06-02)
**Agent:** Formula Recovery Agent
**Status:** EVIDENCE-FIRST CLASSIFICATION COMPLETE → Phase 3 implemented (see [Sprint 3 Review](../sprint-reviews/sprint-3-review.md))

---

## 1. Scope

Classify three target leaves for potential integration into `final_attack_additional_rate`:
- `species_dam_add_rate`
- `human_dam_add_rate`
- `debuff_type_dam_add_rate`

**Goal:** Determine whether these leaves belong in the `final_attack_additional_rate` branch, another damage branch, or should remain deferred.

---

## 2. Evidence Read

### Source Files Inspected
1. `docs/external-research/OHEXTRACTDATA/dcs_extend/const/formula_const.py` (lines 70-108)
2. `docs/external-research/OHEXTRACTDATA/dcs_extend/component_server/CompFormulaAdapter.py` (lines 395-445, 700-750, 820-890)
3. `docs/external-research/OHEXTRACTDATA/dcs_extend/const/attr_const.py` (line 82)
4. `src/utils/combat/officialFormulaMetadata.ts` (NEED_ALL_SUB_ATTR_LEAVES, TARGET_DYNAMIC_LEAVES)
5. `src/utils/combat/officialFormulaGraphRecipes.ts` (FINAL_ATTACK_ADDITIONAL_RATE_RECIPE)

### Key Evidence Found

#### species_dam_add_rate
- **Location:** `formula_const.py:75` in `ATTACKER_NEED_ALL_SUB_ATTR_NODE`
- **Location:** `formula_const.py:92` in `TLNRAD_SPECIES_TYPE_PART`
- **Location:** `formula_const.py:100` in `TARGET_LEAF_NODE_RELATED_ATTR_DAMAGE_ATTACKER_PART`
- **Resolver:** `CompFormulaAdapter.py:826` - `get_species_dam_add_rate(cls, holder, formula_obj)`
- **Resolver Logic:**
  ```python
  base_unit_species = _get_target_prop_val('unit_species')
  species_type_name = UNIT_SPECIES_TYPE_INDEX_TYPE_NAME.get(...)
  attr_name = 'species_dam_add_rate' + species_type_name
  return _get_attacker_prop_val(attr_name)
  ```
- **Pattern:** Reads `unit_species` from TARGET, resolves to `species_dam_add_rate_{species_type}`, reads value from ATTACKER
- **Confidence:** HIGH (direct evidence from decompiled code)

#### debuff_type_dam_add_rate
- **Location:** `formula_const.py:75` in `ATTACKER_NEED_ALL_SUB_ATTR_NODE`
- **Location:** `formula_const.py:84` in `TLNRAD_DEBUFF_TYPE_PART`
- **Resolver:** `CompFormulaAdapter.py:615` - `get_debuff_type_dam_add_rate(cls, holder, formula_obj)`
- **Resolver Logic:**
  ```python
  all_debuff_state = target_all_debuff_state
  debuff_tag = ... # from debuff state
  attr_name = get_debuff_attr_name_by_tag('debuff_type_dam_add_rate', debuff_tag)
  return _get_attacker_prop_val(attr_name)
  ```
- **Pattern:** Reads `target_all_debuff_state` from TARGET, resolves via tag table, reads value from ATTACKER
- **Confidence:** HIGH (direct evidence from decompiled code)

#### human_dam_add_rate
- **Location:** NOT FOUND in any recovered formula data
- **Search Results:** "human" only appears in visual/SFX contexts (human_body, human_shield_body)
- **Resolver:** NOT FOUND
- **Pattern:** No evidence this leaf exists in the formula system
- **Confidence:** UNKNOWN (no evidence)

---

## 3. Classification Summary Table

| Leaf | Classification | Confidence | Rationale |
|------|---------------|------------|-----------|
| `species_dam_add_rate` | `evidence_insufficient_defer` | HIGH (leaf exists) | Target-conditional bonus, not in current additional_rate formula |
| `debuff_type_dam_add_rate` | `evidence_insufficient_defer` | HIGH (leaf exists) | Target-conditional bonus, not in current additional_rate formula |
| `human_dam_add_rate` | `evidence_insufficient_defer` | UNKNOWN | Not found in recovered data |

---

## 4. Leaf-by-Leaf Evidence

### species_dam_add_rate

**Recovered Source Path:**
- `dcs_extend/const/formula_const.py:75` (ATTACKER_NEED_ALL_SUB_ATTR_NODE)
- `dcs_extend/component_server/CompFormulaAdapter.py:826` (resolver function)

**Exact Evidence Snippet:**
```python
# formula_const.py:92
TLNRAD_SPECIES_TYPE_PART = ('species_dam_add_rate', 'species_type_crit_dam_add_rate',
                            'species_type_crit_rate_add_rate', 'species_field_dam_add_rate')

# CompFormulaAdapter.py:826-832
def get_species_dam_add_rate(cls, holder, formula_obj):
    base_unit_species = _get_target_prop_val('unit_species')
    species_type_name = UNIT_SPECIES_TYPE_INDEX_TYPE_NAME.get(...)
    attr_name = 'species_dam_add_rate' + species_type_name
    return _get_attacker_prop_val(attr_name)
```

**Likely Runtime Meaning:**
Damage bonus applied when attacking a target of a specific species (e.g., "species_dam_add_rate_human", "species_dam_add_rate_monster"). The bonus value is stored on the attacker but only applies when the target matches the species.

**Attacker-side or Target-side:**
- **Hybrid:** Value is stored on ATTACKER, but condition is evaluated from TARGET
- **Category:** Target-conditional attacker bonus

**Needs Resolver:**
- YES - needs `unit_species` from target context
- Pattern: `species_dam_add_rate_{species_type_name}`

**OHAI Stat Field:**
- NO corresponding field exists
- Would need: `speciesDMGBonus` or similar (not currently tracked)

**Value Injection Possible:**
- NO - no OHAI stat field to inject from
- Would require: target species tracking + attacker species bonus tracking

**Risks and Ambiguity:**
1. **Branch Placement Unclear:** Listed in `ATTACKER_NEED_ALL_SUB_ATTR_NODE` but NOT in current `final_attack_additional_rate` formula
2. **Conditional Application:** Only applies when target species matches - not a flat bonus
3. **No OHAI Tracking:** No way to know target species or attacker species bonuses in current system
4. **Possible Separate Branch:** May belong to a different damage multiplier branch (e.g., `final_attack_species_rate`)

**Integration Decision:**
**DEFER** - Evidence insufficient to confirm placement in `final_attack_additional_rate`. Leaf exists but:
- No direct evidence it's in the additional_rate sum
- Target-conditional nature differs from current additional_rate leaves (all attacker-side flat bonuses)
- No OHAI infrastructure to support it

---

### debuff_type_dam_add_rate

**Recovered Source Path:**
- `dcs_extend/const/formula_const.py:75` (ATTACKER_NEED_ALL_SUB_ATTR_NODE)
- `dcs_extend/component_server/CompFormulaAdapter.py:615` (resolver function)

**Exact Evidence Snippet:**
```python
# formula_const.py:84
TLNRAD_DEBUFF_TYPE_PART = ('debuff_type_weak_dam_add_rate', 'debuff_type_crit_dam_add_rate',
                           'debuff_type_crit_rate_add_rate', 'debuff_type_dam_add_rate')

# CompFormulaAdapter.py:615-616, 707-714
def get_debuff_type_dam_add_rate(cls, holder, formula_obj):
    return _get_target_debuff_dam_add_rate('debuff_type_dam_add_rate')

def _get_target_debuff_dam_add_rate(cls, formula_obj, parent_attr_key):
    all_debuff_state = target_all_debuff_state
    debuff_tag = ... # from debuff state
    attr_name = get_debuff_attr_name_by_tag(parent_attr_key, debuff_tag)
    return _get_attacker_prop_val(attr_name)
```

**Likely Runtime Meaning:**
Damage bonus applied when target has a specific debuff type (e.g., "debuff_type_dam_add_rate_burn", "debuff_type_dam_add_rate_freeze"). The bonus value is stored on the attacker but only applies when the target has the matching debuff.

**Attacker-side or Target-side:**
- **Hybrid:** Value is stored on ATTACKER, but condition is evaluated from TARGET
- **Category:** Target-conditional attacker bonus (debuff-conditional)

**Needs Resolver:**
- YES - needs `target_all_debuff_state` from target context
- Pattern: `debuff_type_dam_add_rate_{debuff_tag}` via `get_debuff_attr_name_by_tag`

**OHAI Stat Field:**
- NO corresponding field exists
- Would need: `debuffConditionalDMGBonus` or similar (not currently tracked)

**Value Injection Possible:**
- NO - no OHAI stat field to inject from
- Would require: target debuff tracking + attacker debuff-conditional bonus tracking

**Risks and Ambiguity:**
1. **Branch Placement Unclear:** Listed in `ATTACKER_NEED_ALL_SUB_ATTR_NODE` but NOT in current `final_attack_additional_rate` formula
2. **Conditional Application:** Only applies when target has specific debuff - not a flat bonus
3. **No OHAI Tracking:** No way to know target debuffs or attacker debuff-conditional bonuses
4. **Possible Separate Branch:** May belong to a different damage multiplier branch (e.g., `final_attack_debuff_rate`)
5. **Overlap with Keywords:** Some debuffs may overlap with keyword mechanics (burn, freeze, etc.)

**Integration Decision:**
**DEFER** - Evidence insufficient to confirm placement in `final_attack_additional_rate`. Leaf exists but:
- No direct evidence it's in the additional_rate sum
- Target-conditional nature differs from current additional_rate leaves
- No OHAI infrastructure to support it
- May overlap with existing keyword system

---

### human_dam_add_rate

**Recovered Source Path:**
- NOT FOUND

**Exact Evidence Snippet:**
- No evidence found in any recovered formula data
- Search for "human" only returned visual/SFX contexts (human_body, human_shield_body)
- No resolver function found
- No formula leaf definition found

**Likely Runtime Meaning:**
UNKNOWN - No evidence this leaf exists in the formula system.

**Attacker-side or Target-side:**
UNKNOWN

**Needs Resolver:**
UNKNOWN

**OHAI Stat Field:**
NO - and no evidence one should exist

**Value Injection Possible:**
NO - leaf does not appear to exist

**Risks and Ambiguity:**
1. **No Evidence:** Cannot confirm this leaf exists
2. **Possible Confusion:** May be confused with `species_dam_add_rate_human` (species-specific bonus)
3. **Possible PvP Context:** "human" may refer to player-vs-player damage (but no evidence)

**Integration Decision:**
**DEFER** - No evidence this leaf exists. Do not integrate.

---

## 5. Integration Decisions

### Final Decision: DEFER ALL THREE LEAVES

**Rationale:**

1. **species_dam_add_rate** and **debuff_type_dam_add_rate**:
   - Both exist in the formula system (HIGH confidence)
   - Both are target-conditional attacker bonuses
   - Both are listed in `ATTACKER_NEED_ALL_SUB_ATTR_NODE`
   - **BUT:** No direct evidence they're in the `final_attack_additional_rate` sum
   - **AND:** Current additional_rate formula only includes attacker-side flat bonuses
   - **AND:** No OHAI infrastructure to support target-conditional bonuses
   - **CONCLUSION:** Likely belong to a separate branch or conditional multiplier layer

2. **human_dam_add_rate**:
   - No evidence this leaf exists
   - **CONCLUSION:** Do not integrate

### What Would Be Needed to Integrate

To properly integrate `species_dam_add_rate` and `debuff_type_dam_add_rate`, we would need:

1. **Direct Evidence:**
   - Decompiled formula graph showing these leaves in the `final_attack_additional_rate` sum
   - OR: Observed damage numbers confirming they're part of additional_rate

2. **OHAI Infrastructure:**
   - Target species tracking (for species_dam_add_rate)
   - Target debuff state tracking (for debuff_type_dam_add_rate)
   - Attacker species-conditional bonus tracking
   - Attacker debuff-conditional bonus tracking

3. **Resolver Implementation:**
   - Tag table for species types (species_type_data)
   - Tag table for debuff types (debuff_tag_data - partially recovered)
   - Resolver functions in officialFormulaLeafResolvers.ts

4. **Bridge Mappings:**
   - Stat bridge entries for species bonuses
   - Stat bridge entries for debuff-conditional bonuses

**Current Status:** None of these requirements are met.

---

## 6. Risks

### Low Risk
1. **Deferred Leaves Stay at 0:**
   - All three leaves remain at default value (0)
   - No impact on current calculations
   - Warnings emitted for unresolved leaves

2. **No Breaking Changes:**
   - No formula logic changes
   - No test changes required
   - Legacy path untouched

### No High Risk Items
- No incorrect integrations
- No fabricated data
- No scope violations

---

## 7. Remaining Unknowns

### species_dam_add_rate
1. **Branch Placement:** Does it belong to `final_attack_additional_rate` or a separate branch?
2. **Species Types:** What are the valid species types? (human, monster, beast, etc.)
3. **Stacking:** How does it stack with other bonuses?
4. **OHAI Tracking:** How should we track species bonuses in the build system?

### debuff_type_dam_add_rate
1. **Branch Placement:** Does it belong to `final_attack_additional_rate` or a separate branch?
2. **Debuff Types:** What are the valid debuff tags? (burn, freeze, shock, etc.)
3. **Overlap with Keywords:** How does this interact with keyword_proc_dam_add_rate?
4. **Stacking:** How does it stack with other bonuses?
5. **OHAI Tracking:** How should we track debuff-conditional bonuses?

### human_dam_add_rate
1. **Existence:** Does this leaf actually exist?
2. **Context:** Is this a PvP-specific leaf? A species-specific leaf? Something else?
3. **Evidence:** Where should we look for evidence?

---

## 8. Recommended Next Task

### Priority 1: final_attack_ignore_dam_rate Recovery
**Rationale:**
- Next logical formula branch to recover
- Completes the damage formula terminal expression
- Builds on Sprint 2 patterns
- No target-conditional complexity

**Estimated Effort:** 2-3 days

### Priority 2: Target Species/Debuff Infrastructure (Future)
**Rationale:**
- Would enable species_dam_add_rate and debuff_type_dam_add_rate integration
- Requires significant OHAI infrastructure work
- Lower priority than completing core formula

**Estimated Effort:** 1-2 weeks

### Priority 3: UI Foundation Sprint (Future)
**Rationale:**
- Begin proper UI component mounting
- Implement build save/load UI
- Add formula breakdown visualization

**Estimated Effort:** 1-2 weeks

**Recommendation:** Proceed with **Priority 1: final_attack_ignore_dam_rate Recovery** as it directly extends Sprint 2 work without requiring new infrastructure.

---

## 9. Conclusion

**All three target leaves are classified as DEFERRED.**

- `species_dam_add_rate`: Exists but evidence insufficient for integration
- `debuff_type_dam_add_rate`: Exists but evidence insufficient for integration
- `human_dam_add_rate`: No evidence of existence

**No code changes required.** All leaves remain at default value (0) with appropriate warnings.

**Safe to merge:** YES - No changes made, only documentation added.

---

**Review Completed:** 2026-05-30
**Reviewer:** Formula Recovery Agent
**Status:** ✅ CLASSIFICATION COMPLETE - ALL LEAVES DEFERRED
