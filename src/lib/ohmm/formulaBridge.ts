// Barrel re-export. Source of truth formulas remain in src/ohai (copied reference in formulas/).
// App.tsx imports the live ones directly for now to avoid import churn during migration.
export type { BuildSelection } from '../../ohai/src/ui/types';
export { buildCalculationInputFromSelection } from '../../ohai/src/ui/formulaBridge';
export type { BridgedEffect, CalculationInput } from '../../ohai/src/ui/formulaBridge';