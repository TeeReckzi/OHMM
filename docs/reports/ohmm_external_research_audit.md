# OHMM External Research Corpus Audit Report

> Generated: 2026-07-08T15:16:14.356Z
> Source: docs/external-research/OHMM/
> Status: READ-ONLY AUDIT — No project data modified

---

## Executive Summary

This audit scanned the OHMM external research corpus and compared it against the current OHAI project registries. The OHMM corpus contains:

- **0** weapons in weapon_list.json
- **0** mod slots in mods_config.json
- **0** armor slots in all_armor_stats.json
- **0** armor sets in armor_sets.json
- **16** ADR documents (ADR-001 through ADR-016)
- **1** raw.json comprehensive database (2288 lines)

**Key Findings:**
- **2** high-severity conflicts requiring review
- **1** medium-severity conflicts
- **6** keyword capability definitions
- **0** armor set comparisons

**Data Authority:**
- OHMM data is **external/community/screenshot/OCR/proposed** — never decoded-authoritative
- All OHMM data must be tagged with provenance before import
- Conflicts require manual review, not automatic resolution

---

## High-Severity Conflicts

These conflicts involve fundamental gameplay mechanics and require immediate review:

### Universal Bucket Topology — dmg_factor_coefficient_bucket

**OHMM Value:** `DMG Factor and DMG Coefficient are additive in same bucket`

**Project Value:** `not confirmed in project`

**Notes:** ADR-002 claims "113 Test" proved DMG Factor (weapons/mods) and DMG Coefficient (key armor) are additive. Mark as external_model_assumption until project confirms.

**Provenance:** external_model_assumption | external_community_datamine | conflict_review_required

---

### Hit Amplifier Bucket — crit_weakspot_additive

**OHMM Value:** `Crit DMG and Weakspot DMG are additive in Hit Amplifier bucket`

**Project Value:** `separate multiplicative factors`

**Notes:** ADR-002 claims Crit DMG and Weakspot DMG are additive, not separate multiplicative layers. Project currently models them separately. CONFLICT REQUIRES REVIEW.

**Provenance:** external_model_assumption | external_community_datamine | conflict_review_required

---

## Medium-Severity Conflicts

These conflicts involve stat profiles or secondary mechanics:

### Final DMG / Ultimate DMG — ultimate_dmg_translation

**OHMM Value:** `Ultimate DMG is Final DMG translation variant`

**Project Value:** `not modeled`

**Notes:** OHMM treats Ultimate DMG as Final DMG. Keep as review item unless project already confirms.

---

## Keyword Capability Review

Based on ADR-013 and OHMM weapon_list.json:

| Keyword | Can Crit | Can Weakspot | Source | Confidence | Notes |
|---------|----------|--------------|--------|------------|-------|
| Shrapnel | true | true | ADR-013 | external_model_assumption | ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods. |
| Bounce | true | true | ADR-013 | external_model_assumption | ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods. |
| Burn | false | false | ADR-013 | external_model_assumption | ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods. |
| PowerSurge | false | false | ADR-013 | external_model_assumption | ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods. |
| FrostVortex | false | false | ADR-013 | external_model_assumption | ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods. |
| UnstableBomber | false | false | ADR-013 | external_model_assumption | ADR-013 defines bullet-based keywords (Shrapnel, Bounce) as canCrit+canWeakspot. Elemental/status keywords cannot weakspot, can only crit if unlocked by specific gear/mods. |


## Armor Set Comparison

| Set Name | OHMM Pieces | Project Pieces | OHMM Bonuses | Conflicts |
|----------|-------------|----------------|--------------|-----------|


## Damage Formula Claims

### ADR-002: Universal Bucket Topology

**Claim 1:** DMG Factor (weapons/mods) and DMG Coefficient (key armor) are additive in the same bucket.

**Evidence:** "113 Test" mentioned in ADR-002.

**Project Status:** Not confirmed. Project currently models these as separate factors.

**Recommendation:** Mark as external_model_assumption. Requires in-game testing to confirm.

---

**Claim 2:** Crit DMG and Weakspot DMG are additive in "Hit Amplifier" bucket.

**Evidence:** ADR-002 states "Crit DMG and Weakspot DMG are also additive within a single 'Hit Amplifier' bucket — not separate multiplicative layers."

**Project Status:** Project models these as separate multiplicative factors.

**Recommendation:** HIGH PRIORITY CONFLICT. Requires in-game testing. If confirmed, project formula must be updated.

---

**Claim 3:** Ultimate DMG is Final DMG translation variant.

**Evidence:** OHMM raw.json notes.

**Project Status:** Not modeled.

**Recommendation:** Keep as review item.

---

## Safe to Use Now

These OHMM data points are low-risk and can be imported with proper provenance tagging:

1. **Weapon names and IDs** — Basic identification data
2. **Armor set names** — Set identification
3. **Mod descriptions** — Textual effect descriptions (not numerical values)
4. **Keyword capability flags from ADR-013** — Well-documented architectural decision

**Provenance tags to apply:**
- `external_community_datamine` — For weapon_list.json, mods_config.json
- `external_screenshot_ocr` — For raw.json in-game screenshot data
- `external_model_assumption` — For ADR documents
- `external_in_game_tested` — If any data has explicit in-game test confirmation

---

## Needs Review

These items require manual review before import:

1. **DE.50 Jaws trigger mechanics** — Conflict between OHMM (every 4 shots) and Knowledge Bible (every 3 hits, crit counts as 2)
2. **Unstable Bomber crit capability** — OHMM shows weapon-specific unlock (Jaws), project models as global cannot-crit
3. **Weapon stat profiles** — OHMM may have T5/6-star/full-calibration display stats, project may have raw base values
4. **DMG Factor / DMG Coefficient bucket topology** — ADR-002 claims additive, project models separately
5. **Crit DMG / Weakspot DMG bucket topology** — ADR-002 claims additive, project models separately

---

## Do Not Import Blindly

**NEVER** automatically import:

1. **Numerical stat values** from OHMM without cross-referencing project verified data
2. **Damage formula bucket topology** from ADR documents without in-game testing
3. **Trigger mechanics** (cooldowns, stack limits, trigger counts) without explicit confirmation
4. **Keyword capability overrides** without checking if they're weapon-specific or global rules

**Reason:** OHMM data is external/community-sourced. It may be:
- Outdated (pre-patch)
- Incorrect (OCR errors, misinterpretation)
- Context-specific (specific build, specific gear)
- Contradictory (different sources disagree)

---

## Recommended Import Plan

### Phase 1: Safe Imports (Low Risk)

1. Import weapon names and IDs with `external_community_datamine` provenance
2. Import armor set names with `external_community_datamine` provenance
3. Import mod descriptions (text only) with `external_community_datamine` provenance

### Phase 2: Review Required (Medium Risk)

1. Review DE.50 Jaws trigger mechanics conflict
2. Review Unstable Bomber crit capability (weapon-specific vs global)
3. Reconcile weapon stat profiles (T5/6-star vs raw base)

### Phase 3: Testing Required (High Risk)

1. In-game test DMG Factor / DMG Coefficient bucket topology
2. In-game test Crit DMG / Weakspot DMG bucket topology
3. In-game test keyword capability flags (canCrit, canWeakspot)

---

## Suggested Provenance Model

Add provenance metadata to all imported OHMM data:

```typescript
interface ProvenanceMetadata {
  source: 'external_community_datamine' | 'external_screenshot_ocr' | 'external_model_assumption' | 'external_in_game_tested';
  sourceFile: string; // e.g., 'weapon_list.json', 'ADR-002'
  sourceDate: string; // e.g., '2026-03-01'
  confidence: 'high' | 'medium' | 'low';
  reviewStatus: 'approved' | 'pending_review' | 'conflict_review_required';
  lastValidated?: string; // Date of last in-game validation
  notes?: string;
}
```

---

## Next Steps

1. **Immediate:** Review high-severity conflicts (DE.50 Jaws, Unstable Bomber crit)
2. **Short-term:** In-game test damage formula bucket topology claims
3. **Medium-term:** Reconcile weapon stat profiles
4. **Long-term:** Establish provenance tracking for all external data

---

## Appendix: OHMM Corpus Inventory

### JSON Files

- `weapon_list.json` — 0 weapons with mechanics
- `mods_config.json` — 0 mod slots with effects
- `all_armor_stats.json` — 0 armor slots with star/level progression
- `armor_sets.json` — 0 armor sets with multipliers
- `raw.json` — Comprehensive database (2288 lines) with metadata
- `items_and_sets.json` — Combined items and sets data

### ADR Documents

- ADR-001: Combat Engine Architecture
- ADR-002: Universal Bucket Topology ⚠️ (contains high-severity conflicts)
- ADR-003: Trigger Effect Execution Model
- ADR-004: High-Fidelity Materialization
- ADR-005: Zero-Trust Refinement
- ADR-006: Complex Integration Test and Armor Scaling
- ADR-007: Context-Aware Effect Resolution
- ADR-009: Ergonomic UI and Naming Alignment
- ADR-010: Unified Resolver Preview
- ADR-011: Telemetry First-Class Citizen
- ADR-012: Deep Nested Telemetry
- ADR-013: Keyword Weakspot Logic ⚠️ (defines keyword capabilities)
- ADR-014: Holistic Architectural Audit and ECS Refinement
- ADR-015: Abolish God Objects and Enforce Pure ECS
- ADR-016: Mod Suffixes and HP-Dependent Gradient Scaling

### Other Files

- `build-comparison-stats.md` — Example build stat profiles
- `damage-formula-engine-abstraction.md` — Damage formula design
- Various PNG/JPG images (screenshots, diagrams)

---

**Report generated by:** scripts/audit-ohmm-corpus.ts
**Audit status:** COMPLETE — Read-only, no project data modified
