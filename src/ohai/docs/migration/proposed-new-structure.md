# Proposed New Structure — Once Human: Combat Haptics

> Clean repo layout for the migrated project.
> Every directory has a reason. No dead weight.

---

## Design Principles

1. **Separation of concerns**: Engine (pure logic) is fully separated from UI (React).
2. **Authority tiers are visible**: `registries/` for curated baseline, `engine/` for decoded/runtime, `presentation/` for OHDB visual layer.
3. **Generated files are isolated**: Everything under `generated/` is produced by scripts, never hand-edited.
4. **Tests live next to what they test**: Smoke tests sit beside their modules, not in a separate tree.
5. **No legacy compatibility layers**: Old bridges and shims are rewritten or dropped.
6. **Presentation never overrides gameplay**: OHDB data lives in `presentation/` and cannot leak into registries or engine.

---

## Proposed Tree

```
once-human-combat-haptics/
│
├── AGENTS.md                          # Operating instructions (migrated + updated)
├── package.json                       # Clean deps + scripts
├── tsconfig.json                      # CommonJS for scripts/tests
├── tsconfig.ui.json                   # ESNext/Bundler for UI
├── vite.config.mjs                    # Vite build config
├── tailwind.config.js                 # Tailwind CSS
├── index.html                         # Vite entry HTML
├── .gitignore                         # Updated for new structure
├── .gitattributes
│
├── src/
│   │
│   ├── engine/                        # Pure combat logic (no React, no DOM)
│   │   ├── formulas/                  # Damage formulas
│   │   │   ├── formulaApplicator.ts   # calculateExpectedDamage (legacy primary)
│   │   │   ├── formulaTypes.ts        # FormulaInput, FormulaResult, DamageModelHypothesis
│   │   │   ├── formulaContext.ts       # buildFormulaInput
│   │   │   ├── formulaExplainer.ts     # formatFormulaExplanation
│   │   │   ├── formulaTemplates.ts     # Template definitions
│   │   │   ├── formulaBridge.ts        # Build → CalculationInput bridge (from ui/)
│   │   │   ├── formulaDamageAdapter.ts # CalculationInput → expected damage
│   │   │   └── index.ts
│   │   │
│   │   ├── official/                  # Official formula graph runtime (partial-graph)
│   │   │   ├── metadata.ts            # Targets, trees, soul IDs
│   │   │   ├── graphRuntime.ts        # FormulaGraphRuntime class
│   │   │   ├── graphRecipes.ts        # Node recipes
│   │   │   ├── functions.ts           # Formula functions
│   │   │   ├── nodes.ts               # Node definitions
│   │   │   ├── leafResolvers.ts       # Leaf value resolvers
│   │   │   ├── defaults.ts            # Default leaf values
│   │   │   ├── statBridge.ts          # StatKey → formula leaf mapping
│   │   │   ├── tagTables.ts           # Tag table lookups
│   │   │   ├── validationHarness.ts   # Official formula validation
│   │   │   └── index.ts
│   │   │
│   │   ├── mechanics/                 # Mechanic behaviors + overrides
│   │   │   ├── mechanicRegistry.ts
│   │   │   ├── overrides.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── modifiers/                 # Modifier aggregation + resolution
│   │   │   ├── modifierAggregation.ts
│   │   │   ├── modifierRegistry.ts
│   │   │   ├── modifierResolver.ts
│   │   │   ├── modifierTypes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── conditional/               # Conditional effects + uptime
│   │   │   ├── conditionalEffectEngine.ts
│   │   │   ├── conditionalEffectTypes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── procs/                     # Proc system
│   │   │   ├── procRegistry.ts
│   │   │   ├── procResolver.ts
│   │   │   ├── procTypes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── observations/              # Observation parsing + normalization
│   │   │   ├── observationNormalizer.ts
│   │   │   ├── observationParser.ts
│   │   │   ├── observationDeduper.ts
│   │   │   ├── observationTypes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── pvp/                       # PvP mitigation
│   │   │   ├── pvpMitigation.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── combat/                    # Combat output computation
│   │   │   ├── combatOutput.ts        # CombatOutput, DamageOutputMetrics, etc.
│   │   │   ├── combatTypes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── validation/                # Test harness + observed cases
│   │   │   ├── formulaTestHarness.ts
│   │   │   ├── formulaTestTypes.ts
│   │   │   ├── formulaObservedCases.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                   # Barrel export for entire engine
│   │
│   ├── registries/                    # Curated baseline registries (Tier 3)
│   │   ├── weaponRegistry.ts          # Weapons (cleaned: no wikily URLs)
│   │   ├── armorRegistry.ts           # Armor + key gear
│   │   ├── modRegistry.ts             # Mods (reconciled with generated)
│   │   ├── ammoRegistry.ts            # Ammo definitions
│   │   ├── ammoCompatibility.ts       # Ammo compatibility resolver
│   │   ├── attachmentRegistry.ts      # Attachments
│   │   ├── armorSetRegistry.ts        # Armor sets (extracted from armorRegistry)
│   │   ├── cradleRegistry.ts          # Cradle perks
│   │   ├── deviationRegistry.ts       # Deviations
│   │   ├── foodBuffRegistry.ts        # Food buffs
│   │   ├── pveTargetRegistry.ts       # PvE targets
│   │   ├── conditionalEffectRegistry.ts
│   │   ├── formulaSupportRegistry.ts
│   │   ├── modSuffixLegality.ts       # Rewritten: cross-ref locked + OHDB
│   │   ├── modSelectionModel.ts       # NEW: Clean core+suffix model
│   │   ├── modSelectionValidation.ts
│   │   ├── registryMeta.ts
│   │   └── generated/                 # Auto-generated from verified JSON
│   │       ├── weapons.generated.ts
│   │       ├── weaponsStats.generated.ts
│   │       ├── armor-sets.generated.ts
│   │       ├── attachments.generated.ts
│   │       ├── deviations.generated.ts
│   │       ├── food-buffs.generated.ts
│   │       ├── key-gear.generated.ts
│   │       ├── mod-cores.generated.ts
│   │       └── mod-suffixes.generated.ts
│   │
│   ├── presentation/                  # OHDB visual layer (Tier 4 — presentation-only)
│   │   ├── ohdb/
│   │   │   ├── ohdbTypes.ts           # OHDB type definitions
│   │   │   ├── weapons.json           # OHDB weapon data
│   │   │   ├── armor.json             # OHDB armor data
│   │   │   ├── attachments.json       # OHDB attachment data
│   │   │   ├── modVariants.json       # OHDB mod variant data
│   │   │   ├── imageResolver.ts       # Unified image resolution pipeline
│   │   │   ├── itemImageOverrides.ts  # Hardcoded local image overrides
│   │   │   ├── weaponEnrichment.ts    # Weapon display enrichment
│   │   │   ├── armorEnrichment.ts     # Armor display enrichment
│   │   │   ├── modEnrichment.ts       # Mod display enrichment
│   │   │   ├── weaponFamilyHelpers.ts
│   │   │   └── validation/
│   │   │       ├── weaponValidation.ts
│   │   │       └── attachmentValidation.ts
│   │   │
│   │   ├── labels/                    # Display label mappings
│   │   │   ├── displayLabels.ts
│   │   │   ├── translationDictionary.ts
│   │   │   ├── translationOverlay.ts
│   │   │   └── englishNameMapper.ts
│   │   │
│   │   └── provenance/               # Confidence + provenance badges
│   │       ├── verificationMetadata.ts
│   │       ├── conflictResolver.ts
│   │       ├── extractionScorecard.ts
│   │       └── sourceWeights.ts
│   │
│   ├── schemas/                       # Zod validation schemas
│   │   ├── buildGoalSchema.ts         # 42 canonical StatKeys
│   │   ├── weaponSchema.ts
│   │   ├── armorSchema.ts
│   │   ├── armorSetSchema.ts
│   │   ├── modCoreEffectSchema.ts
│   │   ├── modSuffixEffectSchema.ts
│   │   ├── modSystemSchema.ts
│   │   ├── modTerminologySchema.ts
│   │   ├── deviationSchema.ts
│   │   ├── foodBuffSchema.ts
│   │   ├── furMaterialSchema.ts
│   │   ├── ingredientSchema.ts
│   │   ├── starTierScalingSchema.ts
│   │   ├── gearScorerSchema.ts
│   │   ├── externalReferenceSchema.ts # Cleaned: no wikily
│   │   ├── statSemantics.ts
│   │   ├── savedBuildSchema.ts        # Rewritten: clean mod model
│   │   └── itemTypes.ts              # Canonical item types
│   │
│   ├── parsers/                       # Data extractors (offline, not bundled)
│   │   ├── extractWeapons.ts
│   │   ├── extractArmor.ts
│   │   ├── extractArmorSets.ts
│   │   ├── extractModCoreEffects.ts
│   │   ├── extractModSuffixEffects.ts
│   │   ├── extractStarTierScaling.ts
│   │   ├── extractFurMaterials.ts
│   │   ├── extractFoodBuffs.ts
│   │   ├── extractDeviations.ts
│   │   ├── extractIngredients.ts
│   │   ├── importExternalReferences.ts # Cleaned: no wikily
│   │   ├── normalizeExternalReferences.ts
│   │   └── officialTableDiscovery.ts
│   │
│   ├── utils/                         # Shared utilities
│   │   ├── statKeyMapper.ts
│   │   ├── verifiedModifierLoader.ts
│   │   ├── buildGoalProfiles.ts
│   │   ├── modTerminology.ts
│   │   ├── armorPatternMatcher.ts
│   │   ├── parseAttachmentEffect.ts
│   │   ├── workbook.ts
│   │   ├── normalizeArmor.ts
│   │   ├── normalizeArmorSet.ts
│   │   ├── normalizeDeviation.ts
│   │   ├── normalizeFoodBuff.ts
│   │   ├── normalizeFurMaterial.ts
│   │   ├── normalizeIngredient.ts
│   │   ├── normalizeModCoreEffect.ts
│   │   ├── normalizeModSuffixEffect.ts
│   │   ├── normalizeStarTierScaling.ts
│   │   ├── normalizeWeapon.ts
│   │   ├── externalReferenceUtils.ts
│   │   ├── externalResearch/
│   │   │   ├── externalFormulaMappings.ts
│   │   │   ├── externalMechanicClassifier.ts
│   │   │   └── externalStatAliasMap.ts
│   │   └── scorer/                    # Gear scorer
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── statParser.ts
│   │       ├── normalizer.ts
│   │       ├── scoringWeights.ts
│   │       ├── scenarioProfiles.ts
│   │       ├── conditionalEvaluator.ts
│   │       ├── synergyGraph.ts
│   │       ├── mechanicAwareScoring.ts
│   │       ├── mechanicStatRelevance.ts
│   │       ├── mechanicScoringExplainer.ts
│   │       ├── explainer.ts
│   │       └── smokeTest.ts
│   │
│   ├── resolvers/                     # Effect resolvers (UI-facing)
│   │   ├── effectTypes.ts
│   │   ├── loadoutEffectResolver.ts
│   │   ├── weaponEffectResolver.ts
│   │   ├── armorSetBonusResolver.ts
│   │   ├── modEffectResolver.ts
│   │   └── cradleEffectResolver.ts
│   │
│   ├── ui/                            # React UI layer
│   │   ├── main.tsx                   # Vite entry
│   │   ├── App.tsx                    # Main app component
│   │   ├── types.ts                   # UI types (rewritten: clean ModSelection)
│   │   ├── styles.css
│   │   ├── tactical-preview.css
│   │   ├── armory-stage.css
│   │   ├── version.ts
│   │   ├── appBrand.ts
│   │   │
│   │   ├── state/                     # Build state management
│   │   │   ├── buildState.ts          # Core build state (extracted from App.tsx)
│   │   │   ├── buildPersistence.ts    # localStorage persistence
│   │   │   ├── buildImportExport.ts   # JSON import/export
│   │   │   ├── buildShare.ts          # Share functionality
│   │   │   └── savedBuildSchema.ts    # Zod schema for saved builds
│   │   │
│   │   ├── catalog/                   # Catalog generation
│   │   │   ├── catalog.ts             # Rewritten: no wikily, no weaponIconById
│   │   │   ├── loadoutOptions.ts      # Loadout option generation
│   │   │   └── recovered/             # Recovered buff data
│   │   │       ├── buffTagPropMap.ts
│   │   │       └── buffLogicTreeBridge.ts
│   │   │
│   │   ├── intelligence/              # Build intelligence
│   │   │   ├── buildIntelligenceSummary.ts
│   │   │   ├── buildComparisonEngine.ts
│   │   │   ├── buildQualityScore.ts
│   │   │   └── recommendationEngine.ts
│   │   │
│   │   ├── simulator/                 # Simulator event system
│   │   │   ├── simulatorEventAdapter.ts
│   │   │   ├── chefRex.ts
│   │   │   └── calculationNotes.ts
│   │   │
│   │   ├── theme/
│   │   │   ├── ohaiTheme.ts
│   │   │   └── ohaiTheme.css
│   │   │
│   │   └── components/                # React components (46 files)
│   │       ├── ItemSelector.tsx
│   │       ├── ItemPickerDrawer.tsx
│   │       ├── ItemCard.tsx
│   │       ├── ItemCardEnhanced.tsx
│   │       ├── ItemIcon.tsx
│   │       ├── ItemDetailDrawer.tsx
│   │       ├── ItemPreview.tsx
│   │       ├── ItemSlot.tsx
│   │       ├── LoadoutPanel.tsx
│   │       ├── BlueprintSelector.tsx
│   │       ├── BlueprintStarsControl.tsx
│   │       ├── TierControl.tsx
│   │       ├── RatingControl.tsx
│   │       ├── CradleGrid.tsx
│   │       ├── BuffPanel.tsx
│   │       ├── ModSuffixWarning.tsx
│   │       ├── ConfidenceBadge.tsx
│   │       ├── CalculationBreakdown.tsx
│   │       ├── CombatOutcomePanel.tsx
│   │       ├── ConditionalEffectPanel.tsx
│   │       ├── AssumptionControlCenter.tsx
│   │       ├── BuildIdentity.tsx
│   │       ├── BuildAnalysisPanel.tsx
│   │       ├── BuildComparisonPanel.tsx
│   │       ├── BuildScorePanel.tsx
│   │       ├── BuildSummaryCard.tsx
│   │       ├── BuildDNA.tsx
│   │       ├── SavedBuildsPanel.tsx
│   │       ├── CombatTimeline.tsx
│   │       ├── CombatTimelineStream.tsx
│   │       ├── DeltaPreview.tsx
│   │       ├── EffectPreview.tsx
│   │       ├── EncounterIntelligencePanel.tsx
│   │       ├── IntelGapPanel.tsx
│   │       ├── NeuralSynergyPanel.tsx
│   │       ├── OHAIIntelligencePanel.tsx
│   │       ├── OHAILogo.tsx
│   │       ├── OHAITacticalPreview.tsx
│   │       ├── ProjectionPanel.tsx
│   │       ├── PvETargetBalancer.tsx
│   │       ├── SimulationReport.tsx
│   │       ├── SynergyHint.tsx
│   │       ├── TacticalBuildDashboard.tsx
│   │       ├── TacticalLoadoutFrame.tsx
│   │       ├── VisualLoadoutBoard.tsx
│   │       └── ArmoryStage.tsx
│   │
│   └── data/                          # Static data files
│       ├── locked/                    # Locked verified JSON (Tier 3)
│       │   ├── weapons.verified.json
│       │   ├── armor.verified.json
│       │   ├── armor-sets.verified.json
│       │   ├── mod-core-effects.verified.json
│       │   ├── mod-suffix-effects.verified.json
│       │   ├── mod-system-registry.verified.json
│       │   ├── mod-terminology-registry.verified.json
│       │   ├── star-tier-scaling.verified.json
│       │   ├── deviations.verified.json
│       │   ├── food-buffs.verified.json
│       │   ├── fur-materials.verified.json
│       │   └── build-goal-profiles.verified.json
│       │
│       ├── official/                  # Decoded/runtime data (Tier 1)
│       │   └── semantic-graph/
│       │       ├── semantic-table-graph.json
│       │       ├── canonical-runtime-promotion-seed.json
│       │       └── semantic-table-graph-report.md
│       │
│       └── builds.json                # Default/example builds
│
├── public/                            # Static assets (served by Vite)
│   └── assets/
│       ├── ohai/
│       │   └── ohai-logo.png
│       └── ohdb_import_corpus_v2/
│           ├── images_cutout_safe/    # Primary image source
│           │   ├── weapons/
│           │   ├── armor/
│           │   ├── attachments/
│           │   └── mods/
│           └── images/                # Fallback original images
│               ├── weapons/
│               ├── armor/
│               ├── attachments/
│               └── mods/
│
├── scripts/                           # Audit + validation scripts
│   ├── audit-privacy.ts               # Privacy audit (updated allowlist)
│   ├── audit-build-data-integrity.ts  # Build data integrity
│   ├── validate-data.ts               # NEW: Data validation
│   ├── validate-images.ts             # NEW: Image validation
│   └── check-stale.ts                 # NEW: Stale pattern detection
│
├── data/                              # Source data (not bundled)
│   ├── raw/
│   │   └── 七日世界.xlsx              # Immutable source workbook
│   ├── extracted/                     # Raw extraction outputs (regenerable)
│   ├── verified/                      # Source of truth for locked/ (symlink or copy)
│   └── research/                      # Research data (not active)
│
├── docs/
│   ├── data-authority.md              # Authority tier model
│   ├── mod-selection-model.md         # Core+suffix mod model
│   ├── image-resolution-policy.md     # Image pipeline policy
│   ├── migration/
│   │   ├── rebuild-inventory.md
│   │   ├── migration-decisions.md
│   │   ├── proposed-new-structure.md  # (this file)
│   │   └── ...
│   ├── validation/
│   │   └── migration-validation-report.md
│   ├── evidence/                      # Formula evidence, combat data
│   └── design/                        # Design docs
│
└── tools/                             # Python reverse-engineering tools (reference)
    └── ...                            # Migrated as reference, not active code
```

---

## Key Structural Changes from Old Repo

| Old Location | New Location | Reason |
|-------------|--------------|--------|
| `src/utils/combat/` (62 files, flat) | `src/engine/` (organized subdirs) | Combat engine is the core; deserves clear structure |
| `src/ui/formulaBridge.ts` | `src/engine/formulas/formulaBridge.ts` | Bridge is engine logic, not UI |
| `src/ui/combatOutput.ts` | `src/engine/combat/combatOutput.ts` | Combat output is engine logic |
| `src/ui/pvpMitigation.ts` | `src/engine/pvp/pvpMitigation.ts` | PvP mitigation is engine logic |
| `src/ui/registries/` | `src/registries/` | Registries are shared, not UI-specific |
| `src/data/external/ohdb/` | `src/presentation/ohdb/` | OHDB is presentation-only; naming makes authority clear |
| `src/ui/data/catalog.ts` | `src/ui/catalog/catalog.ts` | Catalog is UI-facing; isolated |
| `src/ui/resolvers/` | `src/resolvers/` | Resolvers are shared between engine and UI |
| `src/schemas/` | `src/schemas/` | Unchanged; schemas are cross-cutting |
| `src/parsers/` | `src/parsers/` | Unchanged; extractors are offline |
| `src/verification/` | `src/presentation/provenance/` | Verification/provenance is presentation-adjacent |
| `data/verified/` | `src/data/locked/` + `data/verified/` | Locked copies in src for bundling; source stays in data/ |
| `src/ui/savedBuildSchema.ts` | `src/ui/state/savedBuildSchema.ts` | Build state management |
| `src/ui/buildPersistenceService.ts` | `src/ui/state/buildPersistence.ts` | Build state management |
| `src/ui/buildImportExportService.ts` | `src/ui/state/buildImportExport.ts` | Build state management |
| `src/utils/` (normalizers, mappers) | `src/utils/` | Unchanged |
| `src/ui/displayLabels.ts` | `src/presentation/labels/displayLabels.ts` | Labels are presentation |
| `src/ui/intelligence/` | `src/ui/intelligence/` | UI-specific intelligence |
| `scripts/` | `scripts/` | Unchanged; add new validation scripts |

---

## Directory Purpose Summary

| Directory | Purpose | Bundled? |
|-----------|---------|----------|
| `src/engine/` | Pure combat logic — formulas, mechanics, modifiers, observations | Yes |
| `src/registries/` | Curated item registries — weapons, armor, mods, ammo, etc. | Yes |
| `src/presentation/` | OHDB visual layer — images, labels, enrichment | Yes |
| `src/schemas/` | Zod validation schemas | Yes |
| `src/parsers/` | Offline data extractors | No |
| `src/utils/` | Shared utilities (normalizers, mappers, scorer) | Yes |
| `src/resolvers/` | Effect resolvers (loadout, weapon, armor, mod, cradle) | Yes |
| `src/ui/` | React components, state, catalog, theme | Yes |
| `src/data/` | Static data files (locked JSON, official data) | Yes |
| `public/` | Static assets (images, logo) | Yes (served) |
| `scripts/` | Audit and validation scripts | No |
| `data/` | Source data (workbook, extracted, verified) | No |
| `docs/` | Documentation | No |
| `tools/` | Python reverse-engineering tools (reference) | No |

---

## Migration Order

1. **Foundation**: `package.json`, `tsconfig.json`, `vite.config.mjs`, `tailwind.config.js`, `index.html`
2. **Types + Schemas**: `src/schemas/`, `src/ui/types.ts`, `src/ui/itemTypes.ts`
3. **Locked Data**: `src/data/locked/` (13 verified JSON files)
4. **Engine**: `src/engine/` (combat logic, formulas, mechanics)
5. **Registries**: `src/registries/` (cleaned, no wikily)
6. **Presentation**: `src/presentation/` (OHDB layer)
7. **Resolvers**: `src/resolvers/`
8. **UI State**: `src/ui/state/`
9. **UI Catalog**: `src/ui/catalog/`
10. **UI Components**: `src/ui/components/`
11. **UI App**: `src/ui/App.tsx`, `src/ui/main.tsx`
12. **Scripts**: `scripts/` (updated)
13. **Public Assets**: `public/`
14. **Docs**: `docs/`

---

## Not Migrating (Explicit Exclusions)

| Item | Reason |
|------|--------|
| `src/App.tsx` (legacy stub) | Unused; real app is `src/ui/App.tsx` |
| `src/tools/` (50 Python files) | Reference only; not runtime code |
| `tools/` (7 Python files) | Reference only |
| `data/extracted/` | Regenerable from source |
| `data/audit/` | Historical |
| `data/sample-builds/` | Historical |
| `data/dumped_pyc/` | Empty |
| `.claude/` | Old project config |
| `.local_phase_backup/` | Backup |
| `dist-ui/` | Build output |
| Root-level `七日世界.xlsx` | Belongs in `data/raw/` |
| Root-level `oncehumandatables.xlsx` | Gitignored copy |
| 20+ module QA reports | Historical |
| Sprint reviews | Historical |
| Session analysis docs | Historical |
| `CURRENT_STATE.md`, `NEXT_TASK.md`, `PROJECT_RULES.md` | Stale/superseded |
