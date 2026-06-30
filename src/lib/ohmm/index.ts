// Shared OHMM formula + conversion layer for the Figma UI (src/app/App.tsx).
// Core formulas continue to live under src/ohai/src/* (engine, resolvers, registries, ui/formula*).
// This barrel + convertLoadout provides the bridge surface.

export { loadoutMapToBuildSelection } from './convertLoadout';

// Re-export key calc entrypoints (delegating to canonical ohai impl for now)
export type { BuildSelection } from '../../ohai/src/ui/types';
export {
  buildCalculationInputFromSelection,
} from '../../ohai/src/ui/formulaBridge';
export { buildExpectedDamageFromCalculationInput } from '../../ohai/src/ui/formulaDamageAdapter';
export { computeCombatOutput } from '../../ohai/src/ui/combatOutput';

// When migrating more, drop copies of registries, resolvers, engine here and update relative imports.
