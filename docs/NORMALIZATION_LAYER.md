# OHMM Normalization Layer (Customs Checkpoint)

## Architecture Rule (Formal)

All data must flow through this pipeline:

```
UI State (BuildSelection + runtime useState)
          ↓
Normalization Layer (sanitizeBuildOnLoad + armor adapters + deriveCanonical*)
          ↓
CalculationInput
          ↓
Engine / Resolvers
          ↓
CombatOutput
          ↓
UI Presentation
```

**Prohibited direct paths:**
- UI State → Engine / Resolvers (without normalization)
- Raw persisted data → CalculationInput

## Why this exists

The mod divergence (`mods` vs `modSelections`) was created by:
- UI writing one shape
- Calculation reading another
- No single checkpoint enforcing consistency

This pattern is dangerous for:
- Share payloads
- Versioned saves
- Future cloud sync
- Test fixtures from old code

## Implemented Checkpoints (Sprint C)

1. **sanitizeBuildOnLoad(raw)** → { build, warnings, errors }
   - Used in: handleLoadBuild, share decode
   - Performs armor normalization, mod canonical, ID sanity, chef consistency

2. **Armor adapters** (in selectors/normalization.ts)
   - `toBuildArmorSlot(input)`
   - `toSelectorArmorSlot(input)`
   - `isBuildArmorSlot(key)`
   - `normalizeArmorToBuildKeys(armor)`

3. **Mod canonical**
   - `deriveCanonicalModIds(build)` in loadoutEffectResolver

4. **Bridge normalization**
   - formulaBridge.ts normalizes armor before calling resolver

## Future

- Centralize more derives (attachments ammo, chefRex bonus)
- Make sanitize always the entry for persistence + share + tests
- Warnings collected here should surface in UI (Intel panels)

This layer is the single place where "weird data from the outside" gets inspected before simulation trusts it.
