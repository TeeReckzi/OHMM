# OnceHuman-main Archive Audit Report

Source archive: `C:\Users\tyr3x\Downloads\makeoh\.codex\SKILLS\OnceHuman-main.zip`

Extracted location: `C:\Users\tyr3x\Downloads\makeoh\.codex\extracted\OnceHuman-main\OnceHuman-main`

Audit date: 2026-06-28

## Executive Summary

The archive is highly relevant to OHMM. It contains a full Once Human simulator prototype, a mature pure-data damage bucket architecture, typed registries for weapons/mods/armor/keywords, regression tests for damage resolution, datamined JSON sources, an in-game knowledge Bible, and screenshot evidence used for OCR/provenance.

The most valuable find is the archive's damage formula abstraction: it independently matches the requested topology for OHMM, but is more complete than the current first-pass implementation. In particular, it has enum-backed bucket IDs, composable data-only conditions, roll definitions, hit scenario scanning, keyword crit/weakspot handling, target buckets, and telemetry/audit traces.

The second most valuable find is the data corpus: weapon base stats and trigger logic, keyword scaling metadata, armor set/key armor effects, mod effect descriptions, substat rules, screenshots, and custom datamine JSON. Some data is likely stale or partially modeled, but it is excellent seed material for normalization, tests, and provenance.

## Archive Inventory

- Total files: 152
- Total size: about 34.38 MB
- Major file types:
  - TypeScript/React source: 85 files
  - Markdown documentation: 32 files
  - JSON data: 13 files
  - PNG evidence screenshots: 13 files
- Major directories:
  - `simulator/`: TypeScript/React simulator, ECS-style engine, typed registries, tests, ADRs
  - `research/`: in-game knowledge Bible, screenshots, custom datamine JSON

## Highest-Value Assets

### 1. Damage Formula Architecture

Primary files:

- `simulator/docs/designs/damage-formula-engine-abstraction.md`
- `simulator/docs/designs/ADR-002-universal-bucket-topology.md`
- `simulator/docs/designs/ADR-013-keyword-weakspot-logic.md`
- `simulator/src/engine/bucket-registry.ts`
- `simulator/src/engine/resolver.ts`
- `simulator/src/types/resolution.ts`
- `simulator/src/types/enums.ts`

Useful content:

- Confirms the pure-data topology requested for OHMM: buckets, contributors, conditions, and resolver should all be generic data.
- Defines a universal bucket model where separate additive pools become multiplicative factors.
- Separates keyword `Factor` and keyword `Final` buckets by keyword:
  - Burn
  - Frost Vortex
  - Power Surge
  - Shrapnel
  - Unstable Bomber
  - Bounce
- Treats Crit DMG and Weakspot DMG as additive contributors inside one hit amplifier bucket.
- Includes target buckets for Normal, Elite, and Boss/Great Ones.
- Includes AttackPercent and PsiIncrease as first-class buckets.
- Includes `Vulnerability` and `FinalDamage` buckets.
- Encodes contributor applicability through data-only condition trees instead of lambdas.
- Includes roll definitions for crit, weakspot, and keyword crit behavior.
- Includes a resolver that emits audit/trace data suitable for debugging and UI explanation.

Important validation fixture:

- The "113 Test" confirms Factor and Coefficient add in the same bucket:
  - Psi Intensity: 267
  - Intrinsic scaling: 0.50
  - Corrosion weapon Factor: +15%
  - Mayfly Goggles Coefficient: -30%
  - Power Surge factor bucket: `1 + (-15 / 100) = 0.85`
  - Final damage: `267 * 0.50 * 0.85 = 113.475`, observed as 113

Recommended OHMM use:

- Replace or upgrade the current OHMM damage formula engine with the archive's enum-backed bucket/condition model.
- Port `BucketId`, `ConditionType`, `ContextFlag`, `ResolutionContext`, `ContributorDef`, `BucketDef`, and `RollDefinition`.
- Keep the OHMM registry pure-data. Do not port effect lambdas directly from data files.
- Add the "113 Test" and Burn crit trace as regression tests.

### 2. Resolver, Roll, and Telemetry Logic

Primary files:

- `simulator/src/engine/resolver.ts`
- `simulator/src/engine/bucket-registry.ts`
- `simulator/src/engine/audit-log.ts`
- `simulator/src/engine/rng.ts`
- `simulator/src/types/telemetry.ts`

Useful content:

- Generic condition evaluator:
  - Always
  - TraitMatches
  - KeywordMatches
  - ElementMatches
  - TargetTypeMatches
  - KeywordCritUnlocked
  - FlagActive
  - Comparison
  - And / Or / Not
- Bucket resolver:
  - Starts with `baseValue * intrinsicScaling`
  - Sums applicable contributors inside each bucket
  - Applies each bucket as `1 + sum / 100`
  - Multiplies all buckets into final damage
- Scenario scanner:
  - no crit/no weakspot
  - crit
  - weakspot
  - crit plus weakspot
  - expected value weighted by crit and weakspot rates
- Roll registry:
  - regular crit
  - weakspot
  - burn/keyword crit
- Trace output includes base, intrinsic scaling, bucket contributors, multipliers, and final damage.

Recommended OHMM use:

- Use this resolver as the model for explainable formula panels in the UI.
- Add scenario scan output to compare expected DPS vs deterministic hit outcomes.
- Store traces for future "why is my damage this number?" debugging.

### 3. Domain Enums and Typed Stat Vocabulary

Primary files:

- `simulator/src/types/enums.ts`
- `simulator/src/types/resolution.ts`
- `simulator/src/types/trigger-types.ts`
- `simulator/src/types/materialization.ts`

Useful content:

- Keyword enum:
  - Burn
  - FrostVortex
  - PowerSurge
  - Shrapnel
  - FastGunner
  - UnstableBomber
  - BullsEye
  - FortressWarfare
  - Bounce
- Stat enum includes:
  - DamagePerProjectile
  - ProjectilesPerShot
  - FireRate
  - CritRatePercent
  - CritDamagePercent
  - WeakspotDamagePercent
  - WeakspotHitRatePercent
  - AttackPercent
  - PsiIntensity
  - WeaponDamagePercent
  - StatusDamagePercent
  - ElementalDamagePercent
  - VulnerabilityPercent
  - target damage bonuses
  - keyword factor stats
  - keyword final stats
  - keyword crit rate/damage stats
  - burn duration/frequency/stack stats
- Damage trait enum maps damage formulas to resolver buckets.
- Context flags cover special cases such as:
  - CannotDealWeakspotDamage
  - KeywordCanCrit
  - KeywordCanWeakspot
  - InfiniteAmmo

Recommended OHMM use:

- Adopt these enums or map them carefully into OHMM's existing stat names.
- Avoid stringly typed stat IDs in formula resolution.
- Use the enum list as a checklist for missing stats and build modifiers.

### 4. Weapon Registry

Primary file:

- `simulator/src/data/weapons.ts`

Also related:

- `research/data/custom-datamine/weapon_list.json`
- `research/INGAME_KNOWLEDGE_BIBLE.md`
- `research/data/ingame-screenshots/Weapon/*.png`

Useful content:

- Typed weapon definitions with base stats, keywords, intrinsic effects, trigger definitions, and metadata.
- The datamine JSON contains 47 weapons under `weapons`.
- The typed registry is smaller and curated, but richer in mechanics.
- Examples of useful modeled mechanics:
  - DE.50 - Jaws: Unstable Bomber trigger cadence, crit interaction, keyword crit unlocks.
  - ACS12 - Corrosion: Power Surge trigger, keyword crit unlock, keyword crit rate, Power Surge factor scaling.
  - KVD - Boom Boom: Burn trigger, explosion behavior, elemental damage bonus.
  - EBR-14 burn weapon: Burn factor, max burn stack tradeoff, keyword crit interactions.
  - MPS7 - Outer Space: Power Surge behavior and trigger/reload mechanics.

Recommended OHMM use:

- Reconcile the 47-weapon JSON with OHMM's current weapon data.
- Use the typed registry for mechanics and trigger semantics.
- Use the screenshots and Bible as provenance before marking any value as verified.

### 5. Keyword Registry

Primary file:

- `simulator/src/data/keywords.ts`

Useful content:

- Defines base stat and intrinsic scaling by keyword.
- Useful seed values:
  - Burn: Psi Intensity, scaling 0.12, default cannot crit/weakspot
  - Shrapnel: DamagePerProjectile, scaling 0.6, can crit and weakspot
  - Frost Vortex: Psi Intensity, scaling 0.5
  - Power Surge: Psi Intensity, scaling 1.0
  - Unstable Bomber: Psi Intensity, scaling 0.7, can crit
  - Bounce: DamagePerProjectile, scaling 0.6, can crit and weakspot
- Helper logic respects context flags for keyword crit and weakspot unlocks.

Recommended OHMM use:

- Use as a seed registry for `KwIntrinsicScaling` and base stat selection.
- Verify every scaling value against current in-game data before treating it as canonical.
- Port the distinction between elemental keyword scaling from Psi Intensity and non-elemental keyword scaling from Attack/weapon damage.

### 6. Armor, Set, and Key Armor Effects

Primary files:

- `simulator/src/data/armor.ts`
- `research/INGAME_KNOWLEDGE_BIBLE.md`
- `research/data/custom-datamine/all_armor_stats.json`
- `research/data/custom-datamine/armor_sets.json`
- `research/data/custom-datamine/items_and_sets.json`
- `research/data/ingame-screenshots/Armor/*.png`

Useful content:

- Typed armor effects for:
  - Lonewolf
  - Bastille
  - Savior
  - Treacherous Tides
- Key armor examples:
  - Beret
  - Oasis Mask
  - Gilded Gloves
  - BBQ Gloves
- Bible includes a broader set list:
  - Lonewolf
  - Savior
  - Treacherous Tides
  - Renegade
  - Shelterer
  - Bastille
  - Stormweaver
  - Agent
  - Heavy Duty
  - Falcon
  - Snow Panther
  - Dark Resonance
- `all_armor_stats.json` includes slot, rarity, star/level, HP, and Psi Intensity data.

Recommended OHMM use:

- Cross-check OHMM's set bonus resolver against the typed examples.
- Use `all_armor_stats.json` as a seed for armor stat scaling tables.
- Use the Bible and screenshots to expand set/key armor coverage.
- Do not rely only on `armor_sets.json`; the strict JSON version only contains a small Lonewolf subset.

### 7. Mod Data

Primary files:

- `simulator/src/data/mods.ts`
- `research/data/custom-datamine/mods_config.json`
- `research/INGAME_KNOWLEDGE_BIBLE.md`
- `research/data/ingame-screenshots/Mod/*.png`

Useful content:

- `mods_config.json` includes 91 categorized mods:
  - Helmet: 8
  - Mask: 18
  - Top: 9
  - Gloves: 8
  - Pants: 12
  - Weapon: 36
- Example mods:
  - Fateful Strike
  - Deviation Expert
  - Elemental Havoc
  - Momentum Up
  - Precise Strike
  - Work of Proficiency
  - Mag Expansion
  - First-Move Advantage
  - Burning Wrath
  - Flame Resonance
  - Blaze Blessing
  - Embers
  - Frosty Blessing
  - Vortex Multiplier
  - Shattering Ice
  - Surge Amplifier
  - Static Shock
  - Shock Diffusion
- Typed `mods.ts` contains detailed behavior for a smaller curated subset.

Important caveat:

- `mods.ts` uses classes, conditional effects, and dynamic callbacks. Those semantics are useful, but the implementation should not be copied directly into OHMM's pure-data registry.

Recommended OHMM use:

- Use `mods_config.json` as broad coverage seed data.
- Use `mods.ts` to understand tricky semantics.
- Convert dynamic behavior into declarative conditions, trigger definitions, or rule mutations.
- Use the Bible for bucket classification, especially Factor vs Final.

### 8. In-Game Knowledge Bible

Primary file:

- `research/INGAME_KNOWLEDGE_BIBLE.md`

Useful content:

- Best single human-readable knowledge source in the archive.
- Covers terminology:
  - Attack
  - Psi Intensity
  - Crit Rate
  - Crit DMG
  - Weakspot DMG
  - DMG Factor
  - Final DMG
  - Ultimate DMG translation ambiguity
- Notes that "DMG Coefficient" belongs in the Factor bucket.
- Notes that "Ultimate DMG" likely means Final DMG Bonus.
- Contains weapon feature tables, armor set effects, key armor effects, mod encyclopedia content, suffix rules, and bucket notes.
- Includes suffix logic:
  - Lunar inverse HP scaling
  - Crescent shield-threshold scaling
  - Gold and epic peak values for Crit DMG, Elemental, Weapon, and Status substats

Recommended OHMM use:

- Treat it as the highest-value reference document.
- Use it to annotate registry entries with source notes and confidence levels.
- Use it to build import checklists for weapons, armor, mods, suffixes, and translation aliases.

### 9. Custom Datamine JSON

Primary directory:

- `research/data/custom-datamine/`

Files:

- `weapon_list.json`
- `all_armor_stats.json`
- `mods_config.json`
- `armor_sets.json`
- `items_and_sets.json`
- `raw.json`
- `all-old.json`
- `README.md`

Useful content:

- `weapon_list.json`: 47 weapons with IDs, names, weapon types, rarities, base stats, mechanics, descriptions, and blueprint fragment metadata.
- `mods_config.json`: 91 categorized mods with names, descriptions, and effect text.
- `all_armor_stats.json`: armor stat tables by slot, rarity, stars, levels, plus calibration bonuses.
- `raw.json`: broader data source with metadata, version history, damage formula notes, mod rework notes, and source provenance.

Important caveats:

- `README.md` explicitly warns the data may be inaccurate or outdated.
- `raw.json` is not strict JSON because it contains comments. Ingest it as JSONC/JSON5 or strip comments first.
- `raw.json` metadata says version `1.3.0`, last updated `2026-03-01`.
- Some strict JSON files are narrow subsets; for example, `armor_sets.json` only has a Lonewolf subset.

Recommended OHMM use:

- Build a cautious importer that preserves source, confidence, and verification status.
- Prefer append-only staging tables before merging into verified game data.
- Add schema validation so stale or malformed entries do not silently poison core calculations.

### 10. Tests and Validation Fixtures

Primary files:

- `simulator/src/__tests__/damage-pipeline.test.ts`
- `simulator/src/__tests__/burn-build-fidelity.test.ts`
- `simulator/src/__tests__/attack-multiplier.test.ts`
- `simulator/src/__tests__/kvd-boom-boom.test.ts`
- `simulator/src/__tests__/trigger-system.test.ts`
- `simulator/src/__tests__/complex-loadout-integration.test.ts`

Useful test scenarios:

- Momentum Up applies different bonuses based on magazine half.
- Fateful Strike disables weakspot damage.
- AttackPercent scales weapon base damage.
- Gilded Gloves unlock keyword crit for Burn.
- Burn crit trace:
  - base: 100
  - Elemental: +30%
  - Status: +40%
  - Keyword crit damage: +50%
  - expected final: `100 * 1.3 * 1.4 * 1.5 = 273`
- Savior 2pc requires shield state before applying weapon/status bonus.

Recommended OHMM use:

- Port these as direct regression tests around OHMM's formula engine.
- Use them to validate bucket separation and flag handling.
- Add the 113 Test as the first canonical formula fixture.

### 11. Evidence Screenshots

Primary directory:

- `research/data/ingame-screenshots/`

Files include:

- Armor overview screenshots
- Key armor overview screenshots
- Set effects overview
- BBQ Gloves and Gilded Gloves custom build screenshots
- Loadout panel hover details
- Armor mods overview
- Lunar/Crescent substat percent screenshot
- Weapon mods overview
- Weapon overview screenshots
- Full stars/full calibration weapon overview

Recommended OHMM use:

- Use as provenance for high-confidence data entries.
- Keep linked to normalized records where possible.
- Useful for future OCR or manual verification workflow.
- Useful for UI source/evidence panels if OHMM exposes data confidence.

## Recommended Adoption Plan

1. Upgrade OHMM's damage formula engine with the archive's enum-backed bucket and condition model.

2. Add formula regression fixtures:
   - 113 Test
   - Burn crit with Gilded Gloves
   - Fateful Strike no-weakspot behavior
   - AttackPercent scaling
   - Momentum Up magazine-half behavior

3. Normalize keyword metadata:
   - base stat
   - intrinsic scaling
   - default crit/weakspot capability
   - keyword-specific Factor and Final buckets

4. Build a staged data import path for datamine JSON:
   - preserve source file
   - preserve original raw value
   - attach confidence/verification state
   - reject malformed rows with schema errors

5. Convert typed effects into pure data:
   - conditions
   - contributors
   - trigger definitions
   - rule mutations
   - flags

6. Use `INGAME_KNOWLEDGE_BIBLE.md` and screenshots as provenance when resolving conflicts between JSON and typed registries.

7. Add trace output to OHMM UI/dev tooling so formula results can be explained bucket-by-bucket.

## Risks and Caveats

- The archive data may be stale. Some metadata is dated 2026-03-01, and Once Human balance may have changed since then.
- The datamine README explicitly warns that values may be inaccurate or outdated.
- `raw.json` is not strict JSON because it contains comments.
- Some JSON files are narrow subsets despite broad names.
- Some TypeScript data files use executable effect classes and callbacks. These are useful for understanding semantics but conflict with OHMM's desired pure-data registry.
- Bucket names and stat names must be normalized carefully to avoid duplicate concepts under different labels.
- "Ultimate DMG" appears to be a translation ambiguity and should probably map to Final DMG unless verified otherwise.

## Most Useful Files to Revisit First

1. `simulator/docs/designs/ADR-002-universal-bucket-topology.md`
2. `simulator/src/engine/bucket-registry.ts`
3. `simulator/src/engine/resolver.ts`
4. `simulator/src/types/enums.ts`
5. `simulator/src/types/resolution.ts`
6. `research/INGAME_KNOWLEDGE_BIBLE.md`
7. `simulator/src/data/weapons.ts`
8. `simulator/src/data/keywords.ts`
9. `simulator/src/data/armor.ts`
10. `simulator/src/data/mods.ts`
11. `research/data/custom-datamine/mods_config.json`
12. `research/data/custom-datamine/weapon_list.json`
13. `research/data/custom-datamine/all_armor_stats.json`

## Bottom Line

This archive should be treated as a rich prototype plus evidence pack. Its best immediate contribution to OHMM is not raw data import; it is the mature formula topology, typed stat vocabulary, resolver traces, and validation fixtures. The raw game data is still useful, but should enter OHMM through a staged, source-aware, verification-friendly pipeline.
