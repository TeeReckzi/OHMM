# OHMM — Component Map

**Created**: 2026-06-30 (Phase 1 Planning)
**Last Updated**: 2026-06-30

Current frontend ownership, component boundaries, and data flow.

---

## 1. App.tsx Responsibilities (Current — 2,060 LOC)

App.tsx currently serves as:

### State Owner
```typescript
offLoadout:     LoadoutMap     // Offensive build selections
defLoadout:     LoadoutMap     // Enemy/defensive build selections
modal:          ModalState     // Which selector modal is open
showSettings:   boolean        // Settings modal visibility
fullArmorList:  any[]          // Supabase armor data cache
fullFoodBuffs:  any[]          // Supabase food buff cache
```

### Calculation Pipeline Orchestrator
```typescript
attackerBuild       = loadoutMapToBuildSelection(offLoadout, 'attacker')
attackerCalcInput   = buildCalculationInputFromSelection(attackerBuild, 'pve')
attackerCalcInput   = applyCalibrationRollToCalculationInput(calcInput, offLoadout)
attackerCombatOutput = computeCombatOutput(attackerCalcInput, pvp)
attackerDamageResult = buildExpectedDamageFromCalculationInput(attackerCalcInput, baseWeaponDMG)
// Same pipeline for defender
```

### Data Fetch Effects
- `useEffect` → Supabase armor table fetch
- `useEffect` → Supabase food_buffs table fetch

### Modal Item Resolvers (inline functions)
```
getWeaponItems()       → EquippedItem[] from weaponRegistry
getArmorItems()        → EquippedItem[] from armorRegistry + fullArmorList
getModItems(isWeapon)  → EquippedItem[] from modRegistry
getDeviationItems()    → EquippedItem[] from deviationRegistry
getBuffItems(isFood)   → EquippedItem[] from fullFoodBuffs/foodBuffRegistry
getAttachmentItems()   → EquippedItem[] from attachmentRegistry
```

### Inline Components (NOT yet extracted)
| Component | LOC | Responsibility |
|-----------|-----|----------------|
| `ResetRow` | 20 | Two-step confirm button for settings |
| `SettingsModal` | 25 | Reset loadout controls |
| `DeviationModal` | 65 | Deviation selector |
| `BuffModal` | 55 | Food/drink buff selector |
| `AttachmentModal` | 65 | Attachment selector |
| `CradleModal` | 60 | Cradle perk selector |
| `CalibrationModal` | 120 | Calibration type + roll input |
| `LoadoutPanel` | 100 | Left/right loadout column |
| `CombatResolver` | 70 | DPS bar chart + TTK scenarios |
| `StatusEngine` | 50 | Status effect timeline chart |
| `CombatTelemetry` | 50 | Pie chart + stat chips |
| `MitigationAnalysis` | 40 | Defense progress bars |
| `SimulationTimeline` | 45 | Placeholder event log |
| `AnalysisHub` | 80 | Module layout + expand/collapse |
| `AppHeader` | 40 | Logo + status + settings button |
| `ModalDispatcher` | 35 | Routes modal.kind to component |

### Utility Functions (inline in App.tsx)
```
hasHanText(value)                          → boolean
isEnglishDisplayText(value)                → boolean
cleanEnglishText(value)                    → string
applyCalibrationRollToCalculationInput()   → CalculationInput (SHOULD BE IN RESOLVER)
buildTelemetryPie()                        → PieChart data
buildStatusTimeline()                      → AreaChart data
buildMitigationRows()                      → Progress bar data
resolveIcon()                              → Icon URL with fallback
formatModNameFromIcon()                    → Display name
```

---

## 2. Extracted Components

### `src/app/components/LoadoutTiles.tsx`
| Export | Purpose |
|--------|---------|
| `EquipmentSlot` | Individual equipment slot button with icon, name, stars, tier, rarity |
| `ModTile` | Small square tile for mod slot |
| `CalibrationTile` | Small square tile for calibration slot |
| `AttachTile` | Small square tile for attachment slot |
| `CradleTile` | Small square tile for cradle perk slot |

### `src/app/components/selectors/WeaponSelector.tsx`
| Export | Purpose |
|--------|---------|
| `WeaponModal` | Full weapon selection modal with search, category filter, detail panel |

### `src/app/components/selectors/ArmorSelector.tsx`
| Export | Purpose |
|--------|---------|
| `ArmorModal` | Full armor selection modal with slot filtering |
| `getArmorDisplaySlot` | Utility: normalize slot labels for display |

### `src/app/components/selectors/ModSelector.tsx`
| Export | Purpose |
|--------|---------|
| `ModModal` | Mod selection modal for weapon and armor mods |
| `normalizeModSlot` | Utility: normalize slot key |
| `gearSlotLabel` | Utility: human-readable slot name |
| `categorizeMod` | Utility: categorize mod by keywords |

### `src/app/components/ui/Primitives.tsx`
| Export | Purpose |
|--------|---------|
| `ModalShell` | Reusable modal container (backdrop + chrome) |
| `EmptySlate` | "No items" placeholder |
| `GenericDetail` | Right-panel item detail with equip button |
| `StarRating` | Interactive star display |
| `RarityBadge` | Colored rarity label |
| `ModTypeBadge` | Core/Suffix badge |
| `GlassPanel` | Styled glass-effect container |
| `PanelSection` | Section header with accent bar |
| `StatChip` | Stat value display |
| `SimReady` | "Awaiting data" indicator |
| `TT_STYLE` | Tooltip style constant |
| `pct`, `num`, `statValue` | Formatting helpers |

### `src/app/components/RemoveBadge.tsx`
| Export | Purpose |
|--------|---------|
| `RemoveBadge` | Hover-visible × button for removing equipped items |

### `src/app/components/figma/ImageWithFallback.tsx`
| Export | Purpose |
|--------|---------|
| `ImageWithFallback` | Image with error handling + fallback chain |

---

## 3. Unused Component Stubs (candidates for deletion in Phase 2)

All in `src/app/components/ui/`:
```
accordion.tsx       alert-dialog.tsx    alert.tsx           aspect-ratio.tsx
avatar.tsx          badge.tsx           breadcrumb.tsx      button.tsx
calendar.tsx        card.tsx            carousel.tsx        chart.tsx
checkbox.tsx        collapsible.tsx     command.tsx         context-menu.tsx
dialog.tsx          drawer.tsx          dropdown-menu.tsx   form.tsx
hover-card.tsx      input-otp.tsx       input.tsx           label.tsx
menubar.tsx         navigation-menu.tsx pagination.tsx      popover.tsx
progress.tsx        radio-group.tsx     resizable.tsx       scroll-area.tsx
select.tsx          separator.tsx       sheet.tsx           sidebar.tsx
skeleton.tsx        slider.tsx          sonner.tsx          switch.tsx
table.tsx           tabs.tsx            textarea.tsx        toggle-group.tsx
toggle.tsx          tooltip.tsx         use-mobile.ts       utils.ts
```

**Status**: To be verified in Phase 2 (build-test deletion approach per DL-007).

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION                             │
│  Click slot → opens modal → selects item → dispatches handleEquip()     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            STATE LAYER (App.tsx)                          │
│                                                                          │
│  offLoadout: LoadoutMap          defLoadout: LoadoutMap                   │
│  modal: ModalState               showSettings: boolean                   │
│  fullArmorList: any[]            fullFoodBuffs: any[]                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (useMemo triggers)
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRANSLATION LAYER                                │
│                                                                          │
│  loadoutMapToBuildSelection(offLoadout, 'attacker')                      │
│  → BuildSelection { weapon, armor, mods, modSelections, cradle,          │
│                      deviant, food }                                      │
│                                                                          │
│  Location: src/lib/ohmm/convertLoadout.ts                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FORMULA BRIDGE (Resolution Layer)                      │
│                                                                          │
│  buildCalculationInputFromSelection(build, mode)                         │
│   ├── loadoutEffectResolver(build, mode)                                │
│   │    ├── resolveWeaponEffects(weaponId)                               │
│   │    ├── resolveArmorSetBonuses(armor)                                │
│   │    ├── resolveModEffects(modIds)                                    │
│   │    ├── resolveCradleEffects(perks)                                  │
│   │    └── food/deviant/attachment processing                           │
│   ├── effectsToModifierSources(effects)                                 │
│   ├── aggregateModifiers(sources)                                       │
│   └── computePvPMitigation(sources)                                     │
│                                                                          │
│  → CalculationInput { modifierSources, aggregationReport,                │
│                       pvpMitigation, conditionalEffects, ... }            │
│                                                                          │
│  Location: src/ohai/src/ui/formulaBridge.ts                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       FORMULA APPLICATOR (Engine)                         │
│                                                                          │
│  buildExpectedDamageFromCalculationInput(calcInput, baseWeaponDMG)       │
│   ├── detectFormulaFamily(input)                                        │
│   ├── applyPhysicalWeaponDamage(input) / applyBurnStackDot(input) / ... │
│   ├── computeExpectedCritMultiplier(critRate, critDMG)                  │
│   └── computeExpectedWeakspotMultiplier(wsRate, wsDMG)                  │
│                                                                          │
│  → FormulaResult { baseDamage, multipliers[], expectedDamage,            │
│                    burnDetails?, warnings[] }                             │
│                                                                          │
│  Location: src/ohai/src/engine/formulaApplicator.ts                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMBAT OUTPUT (Presentation)                       │
│                                                                          │
│  computeCombatOutput(calcInput, pvpMitigation)                           │
│                                                                          │
│  → CombatOutput { damageOutput: { DPS, expectedDamage, ... },            │
│                   survivability: { effectiveHealth, ... },                │
│                   pvpDuel: { outgoingTTK, duelPressure },                │
│                   officialFormula: { status, warnings, damage } }         │
│                                                                          │
│  Location: src/ohai/src/ui/combatOutput.ts                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI RENDERING                                    │
│                                                                          │
│  AnalysisHub receives combatOutput + calcInput                           │
│   ├── CombatResolver:   DPS bar chart, TTK scenarios                    │
│   ├── StatusEngine:     Burn/Frost/Surge timeline chart                 │
│   ├── CombatTelemetry:  Pie chart, crit/proc stats                     │
│   ├── MitigationAnalysis: Defense progress bars                         │
│   └── SimulationTimeline: (placeholder — not connected)                 │
│                                                                          │
│  LoadoutPanel:  Equipment slots → click dispatches modal                 │
│  AppHeader:     Logo, status, version, settings button                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Registry Layer (Data Sources)

All located in `src/ohai/src/ui/registries/`:

| Registry | Items | Data Source | Used By |
|----------|:-----:|-------------|---------|
| `weaponRegistry` | 47+ | `generated/weapons.generated.ts` + `weaponsStats.generated.ts` | WeaponModal, formulaBridge |
| `armorRegistry` | ~30 | `armorRegistry.ts` | ArmorModal, formulaBridge |
| `keyGearRegistry` | ~15 | `armorRegistry.ts` | ArmorModal, formulaBridge |
| `modRegistry` | 91+ | `verifiedModFamilies.ts` + `generated/mod-cores.generated.ts` + `generated/mod-suffixes.generated.ts` | ModModal, formulaBridge |
| `attachmentRegistry` | ~40 | `generated/attachments.generated.ts` | AttachmentModal, formulaBridge |
| `foodBuffRegistry` | ~20 | `generated/food-buffs.generated.ts` | BuffModal, formulaBridge |
| `deviationRegistry` | ~12 | `generated/deviations.generated.ts` | DeviationModal, formulaBridge |
| `cradleRegistry` | ~20 | `cradleRegistry.ts` | CradleModal, formulaBridge |
| `ammoRegistry` | ~5 | `ammoRegistry.ts` | formulaBridge |
| `pveTargetRegistry` | ~8 | `pveTargetRegistry.ts` | formulaBridge (target selection) |
| `weaponCalibrationRegistry` | ~6 | `weaponCalibrationRegistry.ts` | CalibrationModal |
| `conditionalEffectRegistry` | varies | `conditionalEffectRegistry.ts` | formulaBridge |
| `formulaSupportRegistry` | varies | `formulaSupportRegistry.ts` | formulaBridge (confidence levels) |

---

## 6. Image Resolution Pipeline

```
resolveIcon(item, category, fallbackSlug, slot)
    │
    ├── item.iconUrl (if already set) → RETURN
    ├── item.image (legacy field) → RETURN
    │
    ├── getSupabaseImageUrl(category, slug, slot)
    │    └── Supabase app_images table query
    │
    └── buildCdnUrl(category, slug, slot)
         └── GitHub CDN: jsdelivr on TeeReckzi/ohmm-icondb
```

---

## 7. Target State After Phase 3

```
src/app/
├── App.tsx                          [<500 LOC — orchestration only]
├── types.ts                         [Shared types]
├── stores/
│   └── buildStore.ts                [Phase 4A — Zustand]
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx            [Logo, status, buttons]
│   │   └── HeroMetrics.tsx          [Phase 4B — DPS/TTK bar]
│   ├── panels/
│   │   ├── LoadoutPanel.tsx         [Side column with slots]
│   │   ├── AnalysisHub.tsx          [Center module container]
│   │   └── analysis/
│   │       ├── CombatResolver.tsx
│   │       ├── StatusEngine.tsx
│   │       ├── CombatTelemetry.tsx
│   │       └── MitigationAnalysis.tsx
│   ├── modals/
│   │   ├── ModalDispatcher.tsx      [Routes modal kind → component]
│   │   ├── SettingsModal.tsx
│   │   ├── DeviationModal.tsx
│   │   ├── BuffModal.tsx
│   │   ├── AttachmentModal.tsx
│   │   ├── CradleModal.tsx
│   │   └── CalibrationModal.tsx
│   ├── selectors/                   [Already extracted]
│   │   ├── WeaponSelector.tsx
│   │   ├── ArmorSelector.tsx
│   │   └── ModSelector.tsx
│   ├── tiles/                       [Already extracted as LoadoutTiles]
│   │   └── LoadoutTiles.tsx
│   ├── ui/
│   │   └── Primitives.tsx           [Reusable UI atoms]
│   └── figma/
│       └── ImageWithFallback.tsx
├── lib/ohmm/
│   ├── convertLoadout.ts            [LoadoutMap → BuildSelection]
│   ├── itemResolvers.ts             [Phase 3.14 — getWeaponItems, etc.]
│   └── index.ts
```

---

*Component Map — OHMM Engineering Council*
