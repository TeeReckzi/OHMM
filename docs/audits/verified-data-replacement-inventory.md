# Verified Data Replacement Inventory

**Generated:** 2026-07-14
**Game Client:** July 9, 2026 build (556 files verified, 0 changes from previous extraction)
**Corpus Status:** Current — no formula/combat data changes in latest patch

---

## Data Source Classification

| Classification | Meaning |
|---------------|---------|
| VERIFIED_EXTRACTED | Directly from game binary, deterministic interpretation |
| VERIFIED_DECODED | From bindict tables in game .pyc, machine-parsed |
| VERIFIED_EXISTING_RUNTIME | Handwritten but validated against in-game observation |
| DERIVED_DETERMINISTIC | Computed from verified sources with provable logic |
| PARTIALLY_RECOVERED | Structural info extracted but semantics incomplete |
| UNRESOLVED | Known to exist but cannot be deterministically interpreted |
| LEGACY_UNVERIFIED | Manually entered, no extraction proof, possibly outdated |

---

## Category: Weapons

| Source File | Records | Confidence | Runtime Consumer | Replacement Status |
|-------------|---------|-----------|------------------|-------------------|
| `registries/generated/weaponsStats.generated.ts` | 128 | VERIFIED_EXISTING_RUNTIME (lReDragol community DB) | weaponRegistry.ts | KEEP — community-verified, covers all playable weapons |
| `registries/generated/weaponsStats.bindict.generated.ts` | 176 | VERIFIED_DECODED | weaponRegistry.ts (stat backfill) | KEEP — authoritative for base numeric stats |
| `data/recovered/officialRuntime.generated.ts` (weaponEquipments) | ~430 | VERIFIED_DECODED | weaponCalibrationRegistry.ts, officialWeaponStatAdapter.ts | KEEP — authoritative game records |
| `data/recovered/officialRuntime.generated.ts` (gunPresetStats) | ~430 | VERIFIED_DECODED | officialWeaponStatAdapter.ts | KEEP — base stat source |
| `data/recovered/officialRuntime.generated.ts` (gunRuntimeStats) | ~430 | VERIFIED_DECODED | officialWeaponStatAdapter.ts | KEEP — runtime stat source |
| `data/recovered/officialRuntime.generated.ts` (bulletRuntimeStats) | ~170 | VERIFIED_DECODED | Not yet consumed at runtime | WIRE — needs connection |
| weaponRegistry.ts (curated entries) | 8 | LEGACY_UNVERIFIED | formulaBridge.ts | REPLACE with decoded data where overlapping |
| weaponRegistry.ts (WEAPON_KEYWORD_OVERLAY) | 10 | VERIFIED_EXISTING_RUNTIME | weaponRegistry.ts (keyword enrichment) | KEEP — no decoded equivalent for keyword logic |

**Action:** The decoded runtime catalog (198K lines) contains authoritative weapon equipment, preset stats, runtime stats, and bullet data. Currently only partially consumed via officialWeaponStatAdapter. The weapon registry should preferentially use bindict-decoded base stats over manually entered values.

---

## Category: Armor & Key Gear

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `armorRegistry.ts` (curated) | 30 | LEGACY_UNVERIFIED (all `needsReview: true`) | REPLACE — all marked estimated |
| `registries/generated/key-gear.generated.ts` | 38 | VERIFIED_DECODED | KEEP — authoritative |
| `data/verified/armor.verified.json` | 148 | VERIFIED_DECODED (B_pending_row_verification) | KEEP as generation source |
| `data/verified/armor-sets.verified.json` | 22 | VERIFIED_EXTRACTED (A_project_verified) | KEEP — locked authoritative |

**Action:** The 30 curated armor entries marked `needsReview` should be replaced by records from `armor.verified.json` → generated pipeline. The armor set definitions are authoritative.

---

## Category: Mods (Core + Suffix)

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `verifiedModFamilies.ts` | ~96 weapon+gear mod families | VERIFIED_EXISTING_RUNTIME (in-game recordings) | KEEP — most authoritative for names/effects |
| `registries/generated/mod-cores.generated.ts` | 99 | PARTIALLY_RECOVERED (machine-translated, superseded) | QUARANTINE — superseded by verifiedModFamilies |
| `registries/generated/mod-suffixes.generated.ts` | 29 | VERIFIED_DECODED | KEEP — authoritative suffixes |
| `registries/generated/modSuffixStats.bindict.generated.ts` | 15 affix entries | VERIFIED_DECODED | KEEP — authoritative suffix stat values |
| `data/verified/mod-core-effects.verified.json` | 99 | PARTIALLY_RECOVERED | QUARANTINE — old machine translation |
| `data/verified/mod-suffix-effects.verified.json` | 128 | VERIFIED_EXTRACTED (A_project_verified) | KEEP — locked |

**Action:** `mod-cores.generated.ts` is explicitly noted as superseded by `verifiedModFamilies.ts` in comments. The old generated file should be quarantined. The suffix stats from bindict are authoritative.

---

## Category: Calibration

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `data/recovered/officialRuntime.generated.ts` (weaponBlueprintCalibrations) | ~1600 | VERIFIED_DECODED | PARTIALLY WIRED — weaponCalibrationRegistry consumes it |
| `data/recovered/officialRuntime.generated.ts` (calibrationGlobalConfig) | ~6 | VERIFIED_DECODED | PARTIALLY WIRED |
| App.tsx `CALIBRATION_OPTIONS` | 2 entries (Assault, Rapid) | LEGACY_UNVERIFIED | REPLACE with decoded calibration types |

**Action:** The App.tsx hardcoded calibration options should reference the decoded catalog which has full calibration blueprint data.

---

## Category: Ammo

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `ammoRegistry.ts` | 6 | VERIFIED_EXISTING_RUNTIME (4 verified, 2 observed) | KEEP — small, manually verified |
| `data/recovered/officialRuntime.generated.ts` (bulletRuntimeStats) | 170 | VERIFIED_DECODED | WIRE — not yet consumed at runtime |

**Action:** Bullet runtime stats have authoritative damage modifiers, projectile speeds, and penetration data that ammoRegistry doesn't cover. Wire the decoded bullet data.

---

## Category: Food & Buffs

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `registries/generated/food-buffs.generated.ts` | 84 | VERIFIED_DECODED | KEEP — generation pipeline from verified source |
| `data/verified/food-buffs.verified.json` | 84 | VERIFIED_DECODED (B_owner_approved) | KEEP — locked source |
| `foodBuffRegistry.ts` curated entries | 10 | LEGACY_UNVERIFIED (placeholder/experimental) | REPLACE where decoded data covers them |

**Action:** Most food data is already from the verified pipeline. The 10 curated entries are mostly synthetic test fixtures that should be removed.

---

## Category: Deviations

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `registries/generated/deviations.generated.ts` | 69 | VERIFIED_DECODED | KEEP — authoritative |
| `data/verified/deviations.verified.json` | 72 | VERIFIED_DECODED (B_owner_approved) | KEEP — locked source |
| `deviationRegistry.ts` curated entries | 6 | LEGACY_UNVERIFIED (placeholder) | REPLACE where decoded covers |

---

## Category: Cradle Perks

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `cradleRegistry.ts` | 25 | VERIFIED_EXISTING_RUNTIME (from in-game footage) | KEEP — no decoded equivalent exists |
| `conditionalEffectRegistry.ts` | ~40 | VERIFIED_EXISTING_RUNTIME (tooltip-based) | KEEP — trigger models are manual estimates |

**Action:** Cradle data has no direct decoded binary equivalent (perks are logic-tree implementations, not data tables). Current handwritten registry is the best source until decompilation succeeds.

---

## Category: Attachments

| Source File | Records | Confidence | Replacement Status |
|-------------|---------|-----------|-------------------|
| `registries/generated/attachments.generated.ts` | 116 | VERIFIED_DECODED | KEEP — authoritative |

---

## Category: Formula Engine

| Source File | Confidence | Replacement Status |
|-------------|-----------|-------------------|
| `officialFormulaGraphRecipes.ts` | PARTIALLY_RECOVERED (high confidence for additional_rate, medium for full graph) | KEEP — best available |
| `officialFormulaTagTables.ts` | VERIFIED_EXTRACTED (direct code evidence) | KEEP — authoritative |
| `officialFormulaStatBridge.ts` | VERIFIED_EXISTING_RUNTIME (evidence-linked) | KEEP — each entry has proof |
| `officialFormulaDefaults.ts` | VERIFIED_DECODED (from defaults test) | KEEP — authoritative |
| `officialAttributes.generated.ts` | VERIFIED_DECODED | KEEP — authoritative attribute definitions |
| `mechanicRegistry.ts` | PARTIALLY_RECOVERED (in-game + reference docs) | KEEP — no decoded replacement possible |
| `formulaObservedCases.ts` | LEGACY_UNVERIFIED (synthetic placeholders) | QUARANTINE — test fixtures, not real observations |
| `formulaApplicator.ts` | DERIVED_DETERMINISTIC (from audit) | KEEP — verified implementation |

---

## Category: PvP

| Source File | Confidence | Replacement Status |
|-------------|-----------|-------------------|
| 13 PvP formula data files (in corpus) | VERIFIED_EXTRACTED | NOT YET CONSUMED — full PvP system unimplemented |
| `pvpMitigation.ts` | VERIFIED_EXISTING_RUNTIME | KEEP — models defender-side reduction |

**Action:** PvP formula data exists in the corpus but has not been decoded into runtime tables. Requires bindict parsing of PvP-specific tables.

---

## Category: Localization

| Source File | Confidence | Replacement Status |
|-------------|-----------|-------------------|
| 37 `client_text_zh` .pyc files | VERIFIED_EXTRACTED | NOT YET CONSUMED — raw string extraction only |
| Registry `originalName` fields | VERIFIED_DECODED | KEEP — Chinese names preserved as provenance |

---

## Summary: Replacement Priorities

### IMMEDIATE (verified replacements available, runtime wiring needed)
1. ❌ `armorRegistry.ts` curated entries → replace with armor.verified.json pipeline
2. ❌ `mod-cores.generated.ts` → quarantine (superseded by verifiedModFamilies)
3. ❌ `formulaObservedCases.ts` → quarantine (synthetic, not real observations)
4. ❌ App.tsx `CALIBRATION_OPTIONS` → reference decoded calibration catalog
5. ❌ `foodBuffRegistry.ts` curated placeholder entries → remove

### WIRE (decoded data exists but not consumed at runtime)
6. ⚠️ `bulletRuntimeStats` → connect to ammo/projectile calculations
7. ⚠️ `officialRuntime.weaponEquipments` → backfill weapon registry variant data
8. ⚠️ PvP formula tables → decode and wire to PvP mode
9. ⚠️ `buffTagPropMap.ts` → wire to keyword/buff resolution

### KEEP (already authoritative)
- All `data/verified/*.json` (locked modules)
- All `registries/generated/*.ts` (from verified pipeline)
- `officialRuntime.generated.ts` (decoded game binary)
- `officialAttributes.generated.ts` (decoded attributes)
- `verifiedModFamilies.ts` (in-game recordings)
- `cradleRegistry.ts` (in-game footage, no binary equivalent)
- `officialFormulaTagTables.ts` (direct code evidence)
- `officialFormulaStatBridge.ts` (evidence-linked)
- `formulaApplicator.ts` (verified implementation)

### CANNOT REPLACE (no deterministic decoded equivalent)
- Mechanic behavior implementations (conditional logic in Python bytecode)
- Cradle perk trigger/uptime models (logic trees, not data tables)
- Proc mechanic implementations (runtime behavior)
- Formula expression ASTs (NeoX custom marshal, cannot parse)
- Keyword SubComp implementations (class logic, not data)
