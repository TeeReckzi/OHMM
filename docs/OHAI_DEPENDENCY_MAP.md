# OHAI Dependency Map

This map documents the current root project dependencies on the nested `src/ohai` project and the staged consolidation target.

## Root-Facing Dependency Groups

### Combat Engine

Current consumers:

- `src/app/App.tsx`
- `src/lib/ohmm/theorycraft/*`

Current nested sources:

- `src/ohai/src/ui/formulaBridge.ts`
- `src/ohai/src/ui/formulaDamageAdapter.ts`
- `src/ohai/src/ui/combatOutput.ts`
- `src/ohai/src/ui/combatOutputComparison.ts`
- `src/ohai/src/ui/pvpMitigation.ts`
- `src/ohai/src/engine/modifierAggregation.ts`
- `src/ohai/src/engine/modifierTypes.ts`
- `src/ohai/src/engine/types.ts`

Root-facing target:

- `src/engine/combat.ts`
- `src/engine/modifiers.ts`
- `src/engine/types.ts`

### Registries And Source Data

Current consumers:

- `src/app/App.tsx`
- `src/app/components/selectors/*`
- `src/lib/ohmm/convertLoadout.ts`
- `src/lib/ohmm/theorycraft/*`
- selector/data-quality tests

Current nested sources:

- `src/ohai/src/ui/registries/*`
- `src/ohai/src/ui/registries/generated/*`
- `src/ohai/src/ui/loadoutOptions.ts`
- `src/ohai/src/ui/itemTypes.ts`
- `src/ohai/src/ui/types.ts`

Root-facing target:

- `src/data/registries.ts`
- `src/data/generated.ts`
- `src/data/loadoutOptions.ts`
- `src/domain/itemTypes.ts`
- `src/domain/buildTypes.ts`

### Images, Supabase, Persistence

Current consumers:

- `src/app/App.tsx`
- selector components

Current nested sources:

- `src/ohai/src/presentation/itemImageResolver.ts`
- `src/ohai/src/ui/data/supabaseImageResolver.ts`
- `src/ohai/src/data/supabaseClient.ts`
- `src/ohai/src/ui/buildPersistenceService.ts`
- `src/ohai/src/ui/buildImportExportService.ts`
- `src/ohai/src/ui/savedBuildSchema.ts`

Root-facing target:

- `src/data/images.ts`
- `src/data/supabase.ts`
- `src/features/buildPersistence.ts`

## Migration Rule

Root app and `src/lib/ohmm` code should not import from `src/ohai` directly. They should import from root-owned boundaries:

- `@/engine/*`
- `@/data/*`
- `@/domain/*`
- `@/features/*`

The first consolidation stage uses facades at those boundaries. Later stages can physically move the nested implementation files behind those facades without touching app code again.
