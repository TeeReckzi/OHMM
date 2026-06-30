# Rebuild Inventory — OnceHumanMasterCalc Migration

> Generated during controlled rebuild migration.
> Every file/folder classified as KEEP (A), REWRITE (B), DISCARD (C), GENERATED (D), REFERENCE ONLY (E), or UNKNOWN/NEEDS REVIEW (F).

---

## 1. Root-Level Files

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `AGENTS.md` | A-KEEP | Migrate | Project operating instructions, data rules, architecture | low | Copy with updates | None | Update project name to "Combat Haptics" |
| `package.json` | B-REWRITE | Migrate with changes | Core deps/scripts valid; name, some script paths need update | low | Rewrite | All scripts | Rename `name` field; clean stale script entries |
| `package-lock.json` | D-GENERATED | Regenerate | `npm install` will regenerate | low | Regenerate | package.json | |
| `tsconfig.json` | A-KEEP | Migrate | Main TS config, CommonJS for scripts/tests | low | Copy | None | |
| `tsconfig.ui.json` | A-KEEP | Migrate | UI-specific TS config, ESNext/Bundler | low | Copy | tsconfig.json | |
| `vite.config.mjs` | A-KEEP | Migrate | Vite build config | low | Copy | None | |
| `tailwind.config.js` | A-KEEP | Migrate | Tailwind CSS config | low | Copy | None | |
| `index.html` | A-KEEP | Migrate | Vite entry HTML | low | Copy | None | |
| `src/App.tsx` | C-DISCARD | Do not migrate | Legacy stub placeholder; real UI is `src/ui/App.tsx` | low | Discard | None | Explicitly says "legacy stub" |
| `README.md` | B-REWRITE | Rewrite | Needs new project identity | low | Rewrite | None | |
| `CHANGELOG.md` | E-REFERENCE | Do not migrate as active | Historical record only | low | Reference | None | |
| `CURRENT_STATE.md` | C-DISCARD | Do not migrate | Stale state tracker | low | Discard | None | |
| `NEXT_TASK.md` | C-DISCARD | Do not migrate | Stale task tracker | low | Discard | None | |
| `PROJECT_RULES.md` | C-DISCARD | Do not migrate | Superseded by AGENTS.md | low | Discard | AGENTS.md | |
| `dev.log` | C-DISCARD | Do not migrate | Dev log, stale | low | Discard | None | |
| `explore_sheets.js` | C-DISCARD | Do not migrate | Old exploration script | low | Discard | None | |
| `oh_calc_scanner.py` | C-DISCARD | Do not migrate | Old Python scanner | low | Discard | None | |
| `oncehumandatatables.xlsx` | C-DISCARD | Do not migrate | Root-level workbook copy, gitignored | medium | Discard | data/raw/ | |
| `七日世界.xlsx` | C-DISCARD | Do not migrate at root | Source workbook belongs in `data/raw/` only | medium | Discard from root | data/raw/ | Keep in data/raw/ if exists |
| `.gitignore` | A-KEEP | Migrate | Git ignore rules | low | Copy + update | None | |
| `.gitattributes` | A-KEEP | Migrate | Git attributes | low | Copy | None | |

---

## 2. `src/` — Source Code

### 2.1 `src/utils/combat/` — Combat Engine (62 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `index.ts` | A-KEEP | Migrate | Barrel export for combat engine | low | Copy | All combat modules | |
| `types.ts` | A-KEEP | Migrate | Core combat types | low | Copy | None | |
| `runtimeAttackTypes.ts` | A-KEEP | Migrate | Runtime attack type definitions | low | Copy | None | |
| `formulaTypes.ts` | A-KEEP | Migrate | Formula type definitions (DamageModelHypothesis, etc.) | low | Copy | None | |
| `formulaApplicator.ts` | A-KEEP | Migrate | `calculateExpectedDamage` — primary damage formula | low | Copy | formulaTypes | Legacy path, primary displayed value |
| `formulaContext.ts` | A-KEEP | Migrate | Formula input builder | low | Copy | formulaTypes | |
| `formulaExplainer.ts` | A-KEEP | Migrate | Formula explanation formatter | low | Copy | formulaTypes | |
| `formulaTemplates.ts` | A-KEEP | Migrate | Formula template definitions | low | Copy | formulaTypes | |
| `formulaTestHarness.ts` | A-KEEP | Migrate | Validation test harness | low | Copy | formulaTestTypes | |
| `formulaTestTypes.ts` | A-KEEP | Migrate | Test type definitions | low | Copy | None | |
| `formulaObservedCases.ts` | A-KEEP | Migrate | Observed damage cases (synthetic/placeholder tagged) | medium | Copy with review | formulaTestTypes | Many cases tagged "synthetic"/"placeholder" |
| `mechanicRegistry.ts` | A-KEEP | Migrate | Mechanic behavior registry | low | Copy | types | |
| `modifierAggregation.ts` | A-KEEP | Migrate | Modifier aggregation logic | low | Copy | modifierTypes | |
| `modifierRegistry.ts` | A-KEEP | Migrate | Modifier source registry | low | Copy | modifierTypes | |
| `modifierResolver.ts` | A-KEEP | Migrate | Modifier resolution | low | Copy | modifierTypes | |
| `modifierTypes.ts` | A-KEEP | Migrate | Modifier type definitions | low | Copy | None | |
| `conditionalEffectEngine.ts` | A-KEEP | Migrate | Conditional effect evaluation | low | Copy | conditionalEffectTypes | |
| `conditionalEffectTypes.ts` | A-KEEP | Migrate | Conditional effect types | low | Copy | None | |
| `overrides.ts` | A-KEEP | Migrate | Initial override registration | low | Copy | mechanicRegistry | |
| `officialFormulaMetadata.ts` | A-KEEP | Migrate | Official formula metadata (targets, trees, soul IDs) | low | Copy | None | |
| `officialFormulaGraphRuntime.ts` | A-KEEP | Migrate | Official formula graph runtime (partial-graph status) | medium | Copy | officialFormulaMetadata, officialFormulaGraphRecipes | Status: "partial-graph" |
| `officialFormulaGraphRecipes.ts` | A-KEEP | Migrate | Formula graph node recipes | medium | Copy | officialFormulaMetadata | Some nodes placeholder |
| `officialFormulaFunctions.ts` | A-KEEP | Migrate | Official formula function implementations | low | Copy | officialFormulaMetadata | |
| `officialFormulaNodes.ts` | A-KEEP | Migrate | Formula node definitions | low | Copy | officialFormulaMetadata | |
| `officialFormulaLeafResolvers.ts` | A-KEEP | Migrate | Leaf value resolvers (some placeholder 0) | medium | Copy | officialFormulaMetadata | 3 leaves unresolved (species_dam_add_rate, human_dam_add_rate, debuff_type_dam_add_rate) |
| `officialFormulaDefaults.ts` | A-KEEP | Migrate | Default formula leaf values | low | Copy | officialFormulaMetadata | |
| `officialFormulaStatBridge.ts` | A-KEEP | Migrate | Stat key to formula leaf bridge | low | Copy | officialFormulaMetadata, buildGoalSchema | |
| `officialFormulaTagTables.ts` | A-KEEP | Migrate | Tag table lookups | low | Copy | officialFormulaMetadata | |
| `officialFormulaValidationHarness.ts` | A-KEEP | Migrate | Official formula validation | low | Copy | officialFormulaGraphRuntime | |
| `dataAssetTransformer.ts` | A-KEEP | Migrate | Data asset transformation | low | Copy | None | |
| `observationNormalizer.ts` | A-KEEP | Migrate | Observation normalization | low | Copy | observationTypes | |
| `observationParser.ts` | A-KEEP | Migrate | Observation parsing (OCR, JSON) | low | Copy | observationTypes | |
| `observationDeduper.ts` | A-KEEP | Migrate | Observation deduplication | low | Copy | observationTypes | |
| `observationTypes.ts` | A-KEEP | Migrate | Observation type definitions | low | Copy | None | |
| `procRegistry.ts` | A-KEEP | Migrate | Proc source registration | low | Copy | procTypes | |
| `procResolver.ts` | A-KEEP | Migrate | Proc resolution | low | Copy | procTypes | |
| `procTypes.ts` | A-KEEP | Migrate | Proc type definitions | low | Copy | None | |
| `pvpMitigationSmokeTest.ts` | A-KEEP | Migrate | PvP mitigation smoke test | low | Copy | pvpMitigation (ui) | |
| `*SmokeTest.ts` (all 24 smoke tests) | A-KEEP | Migrate | All combat smoke tests | low | Copy | Respective modules | |
| `runtimeAttackTypes.ts` | A-KEEP | Migrate | Runtime attack type definitions | low | Copy | None | |

### 2.2 `src/utils/` — Utilities (25 entries)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `statKeyMapper.ts` | A-KEEP | Migrate | Stat key mapping (effectSummary parser) | low | Copy | buildGoalSchema | |
| `verifiedModifierLoader.ts` | A-KEEP | Migrate | Loads verified stat modifiers from JSON | low | Copy | data/verified | |
| `buildGoalProfiles.ts` | A-KEEP | Migrate | Build goal profile generation | low | Copy | buildGoalSchema | |
| `englishNameMapper.ts` | A-KEEP | Migrate | Chinese-to-English name mapping | low | Copy | translationDictionary | |
| `translationDictionary.ts` | A-KEEP | Migrate | Translation dictionary | low | Copy | None | |
| `translationOverlay.ts` | A-KEEP | Migrate | Translation overlay | low | Copy | translationDictionary | |
| `modTerminology.ts` | A-KEEP | Migrate | Mod terminology registry generator | low | Copy | modTerminologySchema | |
| `armorPatternMatcher.ts` | A-KEEP | Migrate | Armor pattern matching | low | Copy | None | |
| `externalReferenceUtils.ts` | A-KEEP | Migrate | External reference utilities | low | Copy | externalReferenceSchema | |
| `normalizeArmor.ts` | A-KEEP | Migrate | Armor normalization | low | Copy | armorSchema | |
| `normalizeArmorSet.ts` | A-KEEP | Migrate | Armor set normalization | low | Copy | armorSetSchema | |
| `normalizeDeviation.ts` | A-KEEP | Migrate | Deviation normalization | low | Copy | deviationSchema | |
| `normalizeFoodBuff.ts` | A-KEEP | Migrate | Food buff normalization | low | Copy | foodBuffSchema | |
| `normalizeFurMaterial.ts` | A-KEEP | Migrate | Fur material normalization | low | Copy | furMaterialSchema | |
| `normalizeIngredient.ts` | A-KEEP | Migrate | Ingredient normalization | low | Copy | ingredientSchema | |
| `normalizeModCoreEffect.ts` | A-KEEP | Migrate | Mod core effect normalization | low | Copy | modCoreEffectSchema | |
| `normalizeModSuffixEffect.ts` | A-KEEP | Migrate | Mod suffix effect normalization | low | Copy | modSuffixEffectSchema | |
| `normalizeStarTierScaling.ts` | A-KEEP | Migrate | Star tier scaling normalization | low | Copy | starTierScalingSchema | |
| `normalizeWeapon.ts` | A-KEEP | Migrate | Weapon normalization | low | Copy | weaponSchema | |
| `parseAttachmentEffect.ts` | A-KEEP | Migrate | Attachment effect parser | low | Copy | None | |
| `workbook.ts` | A-KEEP | Migrate | Workbook reader utility | low | Copy | exceljs | |
| `scorer/` (14 files) | A-KEEP | Migrate | Gear scorer subsystem | low | Copy | gearScorerSchema | |
| `externalResearch/` (3 files) | A-KEEP | Migrate | External formula mappings, mechanic classifier | low | Copy | None | |

### 2.3 `src/schemas/` — Zod Schemas (17 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `buildGoalSchema.ts` | A-KEEP | Migrate | 42 canonical StatKeys | low | Copy | None | Core schema |
| `weaponSchema.ts` | A-KEEP | Migrate | Weapon data schema | low | Copy | None | |
| `armorSchema.ts` | A-KEEP | Migrate | Armor data schema | low | Copy | None | |
| `armorSetSchema.ts` | A-KEEP | Migrate | Armor set schema | low | Copy | None | |
| `modCoreEffectSchema.ts` | A-KEEP | Migrate | Mod core effect schema | low | Copy | None | |
| `modSuffixEffectSchema.ts` | A-KEEP | Migrate | Mod suffix effect schema | low | Copy | None | |
| `modSystemSchema.ts` | A-KEEP | Migrate | Mod system schema | low | Copy | None | |
| `modTerminologySchema.ts` | A-KEEP | Migrate | Mod terminology schema | low | Copy | None | |
| `deviationSchema.ts` | A-KEEP | Migrate | Deviation schema | low | Copy | None | |
| `foodBuffSchema.ts` | A-KEEP | Migrate | Food buff schema | low | Copy | None | |
| `furMaterialSchema.ts` | A-KEEP | Migrate | Fur material schema | low | Copy | None | |
| `ingredientSchema.ts` | A-KEEP | Migrate | Ingredient schema | low | Copy | None | |
| `starTierScalingSchema.ts` | A-KEEP | Migrate | Star tier scaling schema | low | Copy | None | |
| `gearScorerSchema.ts` | A-KEEP | Migrate | Gear scorer schema | low | Copy | None | |
| `externalReferenceSchema.ts` | B-REWRITE | Migrate with cleanup | Contains wikily URL reference | medium | Rewrite | None | Remove wikily URL from schema |
| `statSemantics.ts` | A-KEEP | Migrate | Stat semantic classification | low | Copy | buildGoalSchema | |

### 2.4 `src/parsers/` — Data Extractors (14 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `extractWeapons.ts` | D-GENERATED | Migrate as extractor | Regenerates data/extracted/weapons.raw.json | low | Copy | workbook, weaponSchema | |
| `extractArmor.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, armorSchema | |
| `extractArmorSets.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, armorSetSchema | |
| `extractModCoreEffects.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, modCoreEffectSchema | |
| `extractModSuffixEffects.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, modSuffixEffectSchema | |
| `extractStarTierScaling.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, starTierScalingSchema | |
| `extractFurMaterials.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, furMaterialSchema | |
| `extractFoodBuffs.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, foodBuffSchema | |
| `extractDeviations.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, deviationSchema | |
| `extractIngredients.ts` | D-GENERATED | Migrate as extractor | | low | Copy | workbook, ingredientSchema | |
| `importExternalReferences.ts` | B-REWRITE | Migrate with cleanup | Contains wikily source URL base key | medium | Rewrite | externalReferenceSchema | Remove wikily reference |
| `normalizeExternalReferences.ts` | A-KEEP | Migrate | External reference normalizer | low | Copy | externalReferenceSchema | |
| `officialTableDiscovery.ts` | A-KEEP | Migrate | Official table discovery | low | Copy | None | |

### 2.5 `src/verification/` — Verification (5 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `verificationMetadata.ts` | A-KEEP | Migrate | Canonical verification metadata types | low | Copy | None | |
| `conflictResolver.ts` | A-KEEP | Migrate | Source conflict resolution | low | Copy | verificationMetadata | |
| `extractionScorecard.ts` | A-KEEP | Migrate | Extraction scoring | low | Copy | verificationMetadata | |
| `sourceWeights.ts` | A-KEEP | Migrate | Source weight definitions | low | Copy | None | |
| `verificationSmokeTest.ts` | A-KEEP | Migrate | Verification smoke test | low | Copy | All verification | |

### 2.6 `src/ui/` — UI Layer (36 entries + subdirs)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `App.tsx` (1363 lines) | A-KEEP | Migrate | Main application component | low | Copy | All UI deps | Core UI |
| `main.tsx` | A-KEEP | Migrate | Vite entry point | low | Copy | App.tsx | |
| `types.ts` | A-KEEP | Migrate | Core UI types (ModSelection, BuildSelection, etc.) | low | Copy | None | |
| `itemTypes.ts` | A-KEEP | Migrate | Canonical item types | low | Copy | verificationMetadata, formulaTypes | |
| `combatOutput.ts` | A-KEEP | Migrate | Combat output computation | low | Copy | formulaBridge, pvpMitigation | |
| `formulaBridge.ts` (648 lines) | A-KEEP | Migrate | Build-to-formula bridge | low | Copy | All registries, combat engine | |
| `formulaDamageAdapter.ts` | A-KEEP | Migrate | Formula damage adapter | low | Copy | formulaBridge, combat engine | |
| `pvpMitigation.ts` | A-KEEP | Migrate | PvP mitigation logic | low | Copy | itemTypes | |
| `savedBuildSchema.ts` | A-KEEP | Migrate | Zod schema for saved builds | low | Copy | types | |
| `buildImportExportService.ts` | A-KEEP | Migrate | Build import/export | low | Copy | savedBuildSchema | |
| `buildPersistenceService.ts` | A-KEEP | Migrate | Build persistence (localStorage) | low | Copy | savedBuildSchema | |
| `buildComparisonEngine.ts` | A-KEEP | Migrate | Build comparison logic | low | Copy | types | |
| `buildQualityScore.ts` | A-KEEP | Migrate | Build quality scoring | low | Copy | types | |
| `buildShareService.ts` | A-KEEP | Migrate | Build sharing | low | Copy | buildImportExportService | |
| `recommendationEngine.ts` | A-KEEP | Migrate | Build recommendations | low | Copy | registries | |
| `chefRex.ts` | A-KEEP | Migrate | Chef Rex calculation | low | Copy | types | |
| `loadoutOptions.ts` | A-KEEP | Migrate | Loadout option generation | low | Copy | registries | |
| `displayLabels.ts` | A-KEEP | Migrate | Display label mappings | low | Copy | None | |
| `calculationNotes.ts` | A-KEEP | Migrate | Calculation note generation | low | Copy | formulaBridge | |
| `simulatorEventAdapter.ts` | A-KEEP | Migrate | Simulator event adapter | low | Copy | combat engine | |
| `version.ts` | A-KEEP | Migrate | Version constant | low | Copy | None | |
| `appBrand.ts` | A-KEEP | Migrate | App branding | low | Copy | None | |
| `styles.css` | A-KEEP | Migrate | Global styles | low | Copy | None | |
| `tactical-preview.css` | A-KEEP | Migrate | Tactical preview styles | low | Copy | None | |
| `armory-stage.css` | A-KEEP | Migrate | Armory stage styles | low | Copy | None | |
| `data/catalog.ts` | B-REWRITE | Migrate with cleanup | Has wikily URLs, weaponIconById stub, itemIconById with remote URLs | high | Rewrite | registries | Remove wikily URLs, weaponIconById, fix itemIconById |
| `data/recovered/` | A-KEEP | Migrate | Recovered buff data (buffTagPropMap, buffLogicTreeBridge) | low | Copy | None | |
| `intelligence/buildIntelligenceSummary.ts` | A-KEEP | Migrate | Build intelligence summary | low | Copy | registries | |
| `theme/` (2 files) | A-KEEP | Migrate | Theme CSS and TS | low | Copy | None | |

#### 2.6.1 `src/ui/components/` — React Components (46 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `ItemSelector.tsx` | A-KEEP | Migrate | Core item selector | low | Copy | types | |
| `CradleGrid.tsx` | A-KEEP | Migrate | Cradle perk grid | low | Copy | cradleRegistry | |
| `DeltaPreview.tsx` | A-KEEP | Migrate | Delta preview | low | Copy | types | |
| `SynergyHint.tsx` | A-KEEP | Migrate | Synergy hints | low | Copy | registries | |
| `ModSuffixWarning.tsx` | A-KEEP | Migrate | Mod suffix warning | low | Copy | modSuffixLegality | |
| `BuildIdentity.tsx` | A-KEEP | Migrate | Build identity provider | low | Copy | types | |
| `BuildAnalysisPanel.tsx` | A-KEEP | Migrate | Build analysis | low | Copy | registries | |
| `ItemDetailDrawer.tsx` | A-KEEP | Migrate | Item detail drawer | low | Copy | itemTypes | |
| `CalculationBreakdown.tsx` | A-KEEP | Migrate | Calculation breakdown | low | Copy | formulaBridge | |
| `CombatOutcomePanel.tsx` | A-KEEP | Migrate | Combat outcome display | low | Copy | combatOutput | |
| `ConditionalEffectPanel.tsx` | A-KEEP | Migrate | Conditional effect display | low | Copy | conditionalEffectEngine | |
| `AssumptionControlCenter.tsx` | A-KEEP | Migrate | Assumption control | low | Copy | conditionalEffectTypes | |
| `BuildComparisonPanel.tsx` | A-KEEP | Migrate | Build comparison UI | low | Copy | buildComparisonEngine | |
| `BuildScorePanel.tsx` | A-KEEP | Migrate | Build score display | low | Copy | buildQualityScore | |
| `SavedBuildsPanel.tsx` | A-KEEP | Migrate | Saved builds UI | low | Copy | buildPersistenceService | |
| `OHAILogo.tsx` | A-KEEP | Migrate | Logo component | low | Copy | None | |
| `OHAIIntelligencePanel.tsx` | A-KEEP | Migrate | Intelligence panel | low | Copy | buildIntelligenceSummary | |
| `IntelGapPanel.tsx` | A-KEEP | Migrate | Intel gap overlay | low | Copy | registries | |
| `ItemPickerDrawer.tsx` | A-KEEP | Migrate | Item picker drawer | low | Copy | registries | |
| `ConfidenceBadge.tsx` | A-KEEP | Migrate | Confidence badge | low | Copy | itemTypes | |
| `ItemCard.tsx` | A-KEEP | Migrate | Item card | low | Copy | itemTypes | |
| `ItemCardEnhanced.tsx` | A-KEEP | Migrate | Enhanced item card | low | Copy | itemTypes | |
| `ItemIcon.tsx` | A-KEEP | Migrate | Item icon | low | Copy | imageResolver | |
| `ItemPreview.tsx` | A-KEEP | Migrate | Item preview | low | Copy | itemTypes | |
| `ItemSlot.tsx` | A-KEEP | Migrate | Item slot | low | Copy | itemTypes | |
| `LoadoutPanel.tsx` | A-KEEP | Migrate | Loadout panel | low | Copy | registries | |
| `BuffPanel.tsx` | A-KEEP | Migrate | Buff panel | low | Copy | foodBuffRegistry, deviationRegistry | |
| `BlueprintSelector.tsx` | A-KEEP | Migrate | Blueprint selector | low | Copy | weaponRegistry | |
| `BlueprintStarsControl.tsx` | A-KEEP | Migrate | Stars control | low | Copy | types | |
| `RatingControl.tsx` | A-KEEP | Migrate | Rating control | low | Copy | types | |
| `TierControl.tsx` | A-KEEP | Migrate | Tier control | low | Copy | types | |
| `BuildDNA.tsx` | A-KEEP | Migrate | Build DNA display | low | Copy | types | |
| `BuildSummaryCard.tsx` | A-KEEP | Migrate | Build summary | low | Copy | types | |
| `CombatTimeline.tsx` | A-KEEP | Migrate | Combat timeline | low | Copy | simulatorEventAdapter | |
| `CombatTimelineStream.tsx` | A-KEEP | Migrate | Combat timeline stream | low | Copy | simulatorEventAdapter | |
| `EffectPreview.tsx` | A-KEEP | Migrate | Effect preview | low | Copy | resolvers | |
| `EncounterIntelligencePanel.tsx` | A-KEEP | Migrate | Encounter intelligence | low | Copy | combatOutput | |
| `NeuralSynergyPanel.tsx` | A-KEEP | Migrate | Neural synergy | low | Copy | registries | |
| `ProjectionPanel.tsx` | A-KEEP | Migrate | Projection panel | low | Copy | combatOutput | |
| `PvETargetBalancer.tsx` | A-KEEP | Migrate | PvE target balancer | low | Copy | pveTargetRegistry | |
| `SimulationReport.tsx` | A-KEEP | Migrate | Simulation report | low | Copy | combatOutput | |
| `TacticalBuildDashboard.tsx` | A-KEEP | Migrate | Tactical dashboard | low | Copy | types | |
| `TacticalLoadoutFrame.tsx` | A-KEEP | Migrate | Tactical loadout frame | low | Copy | types | |
| `VisualLoadoutBoard.tsx` | A-KEEP | Migrate | Visual loadout board | low | Copy | types | |
| `ArmoryStage.tsx` | A-KEEP | Migrate | Armory stage | low | Copy | types | |
| `OHAITacticalPreview.tsx` | A-KEEP | Migrate | Tactical preview | low | Copy | types | |

#### 2.6.2 `src/ui/registries/` — UI Registries (28 entries + subdirs)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `weaponRegistry.ts` | B-REWRITE | Migrate with cleanup | Has 4 hardcoded wikily iconUrls | high | Rewrite | generated/weapons, generated/weaponsStats | Remove wikily URLs |
| `armorRegistry.ts` | B-REWRITE | Migrate with review | Hand-curated, many "estimated" confidence, empty statModifiers | medium | Migrate with review | generated/key-gear | |
| `modRegistry.ts` | B-REWRITE | Migrate with review | Hand-curated suffix mods with empty statModifiers, "estimated" | medium | Migrate with review | generated/mod-cores, generated/mod-suffixes | |
| `ammoRegistry.ts` | A-KEEP | Migrate | Clean, verified ammo definitions | low | Copy | itemTypes | |
| `ammoCompatibilityResolver.ts` | A-KEEP | Migrate | Ammo compatibility logic | low | Copy | ammoRegistry | |
| `attachmentRegistry.ts` | A-KEEP | Migrate | Attachment registry | low | Copy | generated/attachments | |
| `cradleRegistry.ts` | A-KEEP | Migrate | Cradle perk registry (509 lines, observed confidence) | low | Copy | itemTypes | |
| `deviationRegistry.ts` | A-KEEP | Migrate | Deviation registry | low | Copy | generated/deviations | |
| `foodBuffRegistry.ts` | A-KEEP | Migrate | Food buff registry | low | Copy | generated/food-buffs | |
| `pveTargetRegistry.ts` | A-KEEP | Migrate | PvE target registry | low | Copy | itemTypes | |
| `conditionalEffectRegistry.ts` | A-KEEP | Migrate | Conditional effect registry | low | Copy | conditionalEffectEngine | |
| `formulaSupportRegistry.ts` | A-KEEP | Migrate | Formula support registry | low | Copy | itemTypes | |
| `modSuffixLegality.ts` | B-REWRITE | Migrate with review | Depends on OHDB mod variants; returns empty report | medium | Rewrite | ohdb/mod_presentation_enrichment | Placeholder report |
| `modSelectionBridge.ts` | B-REWRITE | Migrate with cleanup | Legacy bridge with `as any` casts | medium | Rewrite | types | Clean up type safety |
| `modSelectionValidation.ts` | A-KEEP | Migrate | Mod selection validation | low | Copy | types | |
| `modPresentationBridge.ts` | A-KEEP | Migrate | Mod presentation enrichment bridge | low | Copy | ohdb/mod_presentation_enrichment | |
| `weaponPresentationBridge.ts` | B-REWRITE | Migrate with cleanup | Uses `import.meta.env.DEV` (3x) — tsconfig rejects under CommonJS | medium | Rewrite | ohdb/presentation_enrichment, ohdb/image_resolver, ohdb/itemImageOverrides | Fix import.meta.env.DEV |
| `armorPresentationBridge.ts` | A-KEEP | Migrate | Armor presentation bridge | low | Copy | ohdb/armor_presentation_enrichment | |
| `itemImageResolver.ts` | B-REWRITE | Migrate with cleanup | Multiple resolution strategies, some fragile | medium | Rewrite | catalog | Consolidate with ohdb/image_resolver |
| `assetDebugSummary.ts` | A-KEEP | Migrate | Asset debug summary | low | Copy | registries | |
| `registryMeta.ts` | A-KEEP | Migrate | Registry metadata | low | Copy | None | |
| `registryAudit.ts` | A-KEEP | Migrate | Registry audit (informational) | low | Copy | registries | |
| `registryValidationSmokeTest.ts` | A-KEEP | Migrate | Registry validation test | low | Copy | registries | |
| `loadoutSlotFilteringSmokeTest.ts` | A-KEEP | Migrate | Loadout slot filtering test | low | Copy | registries | |
| `ammoValidationSmokeTest.ts` | A-KEEP | Migrate | Ammo validation test | low | Copy | ammoRegistry | |
| `ammoCompatibilitySmokeTest.ts` | A-KEEP | Migrate | Ammo compatibility test | low | Copy | ammoRegistry | |
| `generated/` (9 files) | D-GENERATED | Regenerate | Auto-generated from verified data; contain wikily URLs | high | Regenerate | staging/generateBulkData.ts | Must strip wikily URLs during regeneration |

#### 2.6.3 `src/ui/registries/staging/` — Staging Pipeline (7 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `generateBulkData.ts` | D-GENERATED | Migrate as generator | Generates the `generated/` files | low | Copy | verified JSON | |
| `normalizationHelpers.ts` | A-KEEP | Migrate | Normalization helpers for staging | low | Copy | None | |
| `populateFromVerified.ts` | A-KEEP | Migrate | Populates staging from verified data | low | Copy | verified JSON | |
| `promotionHelper.ts` | A-KEEP | Migrate | Staging-to-verified promotion | low | Copy | stagingTypes | |
| `stagingAudit.ts` | A-KEEP | Migrate | Staging audit (informational) | low | Copy | stagingTypes | |
| `stagingTypes.ts` | A-KEEP | Migrate | Staging type definitions | low | Copy | None | |
| `stagingValidationSmokeTest.ts` | A-KEEP | Migrate | Staging validation test | low | Copy | stagingTypes | |

#### 2.6.4 `src/ui/resolvers/` — Effect Resolvers (6 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `loadoutEffectResolver.ts` | A-KEEP | Migrate | Main loadout effect resolver | low | Copy | All sub-resolvers | |
| `weaponEffectResolver.ts` | A-KEEP | Migrate | Weapon effect resolver | low | Copy | effectTypes | |
| `armorSetBonusResolver.ts` | A-KEEP | Migrate | Armor set bonus resolver | low | Copy | effectTypes | |
| `modEffectResolver.ts` | A-KEEP | Migrate | Mod effect resolver | low | Copy | effectTypes | |
| `cradleEffectResolver.ts` | A-KEEP | Migrate | Cradle effect resolver | low | Copy | effectTypes | |
| `effectTypes.ts` | A-KEEP | Migrate | Effect pipeline types | low | Copy | None | |

### 2.7 `src/data/external/ohdb/` — OHDB Presentation Layer (16 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `image_resolver.ts` | B-REWRITE | Migrate with cleanup | Core image resolver; uses `require()` for lazy JSON load; has `getAllOhdbWeapons` shim | medium | Rewrite | weapons.json, ohdb_types | Consolidate with registries/itemImageResolver |
| `itemImageOverrides.ts` | A-KEEP | Migrate | Unified image override system (presentation-only) | low | Copy | None | Clean, well-documented |
| `weaponImageOverrides.ts` | B-REWRITE | Review for merge | May duplicate itemImageOverrides | medium | Review | None | Check for duplication with itemImageOverrides |
| `weaponImageOverrides.test.ts` | A-KEEP | Migrate | Test for weapon image overrides | low | Copy | weaponImageOverrides | |
| `presentation_enrichment.ts` | A-KEEP | Migrate | Weapon presentation enrichment | low | Copy | image_resolver, weapons.verified.json | |
| `armor_presentation_enrichment.ts` | A-KEEP | Migrate | Armor presentation enrichment | low | Copy | ohdb data | |
| `mod_presentation_enrichment.ts` | A-KEEP | Migrate | Mod presentation enrichment | low | Copy | mod_variants.json | |
| `weapon_family_helpers.ts` | A-KEEP | Migrate | Weapon family helpers | low | Copy | image_resolver | |
| `ohdb_adapters.ts` | F-UNKNOWN | Review | OHDB adapter layer | medium | Review | ohdb_types | Needs review for necessity |
| `ohdb_types.ts` | A-KEEP | Migrate | OHDB type definitions | low | Copy | None | |
| `mod_future_types.ts` | A-KEEP | Migrate | Future mod types (placeholder fields marked) | low | Copy | None | |
| `mod_variants.json` | A-KEEP | Migrate | Mod variant data | low | Copy | None | |
| `weapons.json` | A-KEEP | Migrate | OHDB weapon data (presentation) | low | Copy | None | Presentation-only |
| `armor.json` | A-KEEP | Migrate | OHDB armor data (presentation) | low | Copy | None | Presentation-only |
| `attachments.json` | A-KEEP | Migrate | OHDB attachment data (presentation) | low | Copy | None | Presentation-only |
| `validation/` (2 files) | A-KEEP | Migrate | OHDB validation scripts | low | Copy | image_resolver | |

### 2.8 `src/tools/` — Python Reverse-Engineering Tools (50 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| All 50 `.py` files | E-REFERENCE | Do not migrate as active code | Reverse-engineering tools, not part of runtime app | low | Reference only | Python, game binaries | Keep in docs/research/ or separate tools repo |

---

## 3. `data/` — Data Directory

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `verified/` (13 JSON files) | A-KEEP | Migrate | Locked curated baseline registries | low | Copy | None | Tier 3 authority; carry provenance |
| `verified/weapons.verified.json` | A-KEEP | Migrate | Locked weapons | low | Copy | None | |
| `verified/armor.verified.json` | A-KEEP | Migrate | Locked armor | low | Copy | None | |
| `verified/armor-sets.verified.json` | A-KEEP | Migrate | Locked armor sets | low | Copy | None | |
| `verified/mod-core-effects.verified.json` | A-KEEP | Migrate | Locked mod cores | low | Copy | None | |
| `verified/mod-suffix-effects.verified.json` | A-KEEP | Migrate | Locked mod suffixes | low | Copy | None | |
| `verified/mod-system-registry.verified.json` | A-KEEP | Migrate | Locked mod system | low | Copy | None | |
| `verified/mod-terminology-registry.verified.json` | A-KEEP | Migrate | Locked mod terminology | low | Copy | None | |
| `verified/star-tier-scaling.verified.json` | A-KEEP | Migrate | Locked star tier scaling | low | Copy | None | |
| `verified/deviations.verified.json` | A-KEEP | Migrate | Locked deviations | low | Copy | None | |
| `verified/food-buffs.verified.json` | A-KEEP | Migrate | Locked food buffs | low | Copy | None | |
| `verified/fur-materials.verified.json` | A-KEEP | Migrate | Locked fur materials | low | Copy | None | |
| `verified/build-goal-profiles.verified.json` | A-KEEP | Migrate | Locked build goal profiles | low | Copy | None | |
| `official/interpreted/semantic-graph/` | A-KEEP | Migrate | Semantic graph data | low | Copy | None | Tier 1 evidence |
| `raw/` | D-GENERATED | Regenerate if needed | Raw source data (七日世界.xlsx) | low | Regenerate | source workbook | |
| `extracted/` (13 raw JSONs) | D-GENERATED | Regenerate | Raw extraction outputs | low | Regenerate | parsers, raw/ | |
| `normalized/official-tables/` | D-GENERATED | Regenerate | Normalized official table data | low | Regenerate | tools/ | |
| `audit/` (4 files) | E-REFERENCE | Do not migrate | Old audit files, historical | low | Reference | None | |
| `research/` (4 subdirs) | E-REFERENCE | Do not migrate as active | Research data, bindict decode, etc. | low | Reference | None | |
| `sample-builds/` (4 files) | E-REFERENCE | Do not migrate | Sample build documentation | low | Reference | None | |
| `dumped_pyc/` | C-DISCARD | Do not migrate | Empty directory | low | Discard | None | |
| `oh_calc_inventory_report.json` | E-REFERENCE | Do not migrate | Old inventory report | low | Reference | None | |

---

## 4. `public/` — Static Assets

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `assets/ohai/` | A-KEEP | Migrate | OHAI logo | low | Copy | None | |
| `assets/ohdb_import_corpus_v2/images_cutout_safe/` | A-KEEP | Migrate | Cutout-safe images (weapons, armor, attachments, mods) | low | Copy | None | Core image corpus |
| `assets/ohdb_import_corpus_v2/images/` | A-KEEP | Migrate | Original images | low | Copy | None | Fallback images |
| `assets/ohdb_import_corpus_v2/images_cutout/` | F-UNKNOWN | Review | May overlap with images_cutout_safe | medium | Review | None | Check for duplication |
| `assets/ohdb_import_corpus_v2/data/` | F-UNKNOWN | Review | OHDB corpus data | medium | Review | None | |
| `assets/ohdb_import_corpus_v2/reports/` | E-REFERENCE | Do not migrate | OHDB import reports | low | Reference | None | |
| `assets/ohdb_import_corpus_v2/scripts/` | E-REFERENCE | Do not migrate | OHDB import scripts | low | Reference | None | |
| `assets/ohdb_import_corpus_v2/README.md` | E-REFERENCE | Do not migrate | OHDB corpus readme | low | Reference | None | |

---

## 5. `scripts/` — Build Scripts

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `audit-privacy.ts` | A-KEEP | Migrate | Privacy audit (no network calls check) | low | Copy | None | Needs allowlist update |
| `audit-build-data-integrity.ts` | A-KEEP | Migrate | Build data integrity audit | low | Copy | None | |
| `patch-xdis-magics.py` | E-REFERENCE | Do not migrate | xdis patching script | low | Reference | None | One-time setup |
| `patch-xdis-magics.test.ts` | E-REFERENCE | Do not migrate | xdis patch test | low | Reference | None | |

---

## 6. `tools/` — Python Tools (7 files)

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| All 7 `.py` files | E-REFERENCE | Do not migrate as active | Official table pipeline, semantic decoder, etc. | low | Reference | Python | Keep in docs/research/ or tools repo |

---

## 7. `docs/` — Documentation

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `mod-core-suffix-relationship-contract.md` | A-KEEP | Migrate | Mod core+suffix contract | low | Copy | None | Critical for mod model |
| `mod-terminology-registry.md` | A-KEEP | Migrate | Mod terminology docs | low | Copy | None | |
| `module-locks.md` | A-KEEP | Migrate | Module lock status | low | Copy | None | |
| `runtime-combat-architecture.md` | A-KEEP | Migrate | Combat architecture docs | low | Copy | None | |
| `source-registry.md` | A-KEEP | Migrate | Source registry docs | low | Copy | None | |
| `testing.md` | A-KEEP | Migrate | Testing docs | low | Copy | None | |
| `project-map.md` | B-REWRITE | Rewrite | Needs update for new structure | low | Rewrite | None | |
| `roadmap.md` | B-REWRITE | Rewrite | Needs update | low | Rewrite | None | |
| `status.md` | C-DISCARD | Do not migrate | Stale status | low | Discard | None | |
| `privacy-audit-fix-report.md` | E-REFERENCE | Do not migrate | Historical report | low | Reference | None | |
| `ohdb-*.md` (7 reports) | E-REFERENCE | Do not migrate | Historical OHDB reports | low | Reference | None | |
| `module-*.md` (20+ QA reports) | E-REFERENCE | Do not migrate | Historical module QA | low | Reference | None | |
| `sprint-*.md` | E-REFERENCE | Do not migrate | Historical sprint reviews | low | Reference | None | |
| `session-analysis-*.md` | E-REFERENCE | Do not migrate | Historical session analysis | low | Reference | None | |
| `agentic-tasks/` | E-REFERENCE | Do not migrate | Old batch task tickets | low | Reference | None | |
| `research-notes/` (26 files) | E-REFERENCE | Do not migrate | Research notes, bindict analysis | low | Reference | None | |
| `formula-recovery/` | E-REFERENCE | Do not migrate | Formula recovery docs | low | Reference | None | |
| `reverse-engineering/` | E-REFERENCE | Do not migrate | Reverse engineering docs | low | Reference | None | |
| `external-reference-intake.md` | E-REFERENCE | Do not migrate | External reference intake | low | Reference | None | |
| `sprint-reviews/` | E-REFERENCE | Do not migrate | Sprint reviews | low | Reference | None | |
| `ui/` | E-REFERENCE | Do not migrate | UI docs | low | Reference | None | |
| Various other .md files | C-DISCARD/E-REFERENCE | Do not migrate | Stale or historical | low | Discard/Reference | None | |

---

## 8. Other Directories

| Path | Category | Decision | Reason | Risk | Action | Dependencies | Notes |
|------|----------|----------|--------|------|--------|--------------|-------|
| `.opencode/` | B-REWRITE | Recreate for new repo | Opencode config, agents, skills | low | Recreate | None | New clean config |
| `.claude/` | C-DISCARD | Do not migrate | Claude config, old project | low | Discard | None | |
| `.github/` | F-UNKNOWN | Review | GitHub config (CI/CD?) | low | Review | None | |
| `.local_phase_backup/` | C-DISCARD | Do not migrate | Local backup | low | Discard | None | |
| `dist-ui/` | C-DISCARD | Do not migrate | Build output | low | Discard | None | |
| `node_modules/` | C-DISCARD | Do not migrate | Dependencies | low | Regenerate | package.json | |

---

## Summary Counts

| Category | Count | Description |
|----------|-------|-------------|
| A-KEEP | ~170 | Clean, verified, migrate as-is |
| B-REWRITE | ~12 | Important but needs cleanup |
| C-DISCARD | ~20 | Stale, obsolete, or dangerous |
| D-GENERATED | ~25 | Can be regenerated |
| E-REFERENCE | ~50+ | Historical/reference only |
| F-UNKNOWN | ~5 | Needs review before decision |
