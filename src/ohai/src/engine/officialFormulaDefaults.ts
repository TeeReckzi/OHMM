/**
 * Formula default leaf provider.
 * Apply before runtime values; runtime values always win.
 */

import { getDefaultFormulaLeafValues as _getMetadataDefaults } from "./officialFormulaMetadata";
import type { FormulaValue } from "./officialFormulaMetadata";
import type { DamageModelHypothesis } from "./formulaTypes";

export function defaultDamageModelHypothesis(
  mechanic: "frostVortex" | "powerSurge" | "ebrFireRing",
): DamageModelHypothesis {
  switch (mechanic) {
    case "frostVortex": return "frost-vortex-DoT-tick";
    case "powerSurge":  return "power-surge-DoT-tick";
    case "ebrFireRing": return "ebr-fire-ring-provisional";
  }
}

export type FormulaLeafMap = Record<string, FormulaValue>;

export function getDefaultFormulaLeafValues(): FormulaLeafMap {
  return { ..._getMetadataDefaults() };
}

/**
 * Returns a new map with defaults applied first, then inputLeaves on top.
 * Runtime-provided values always override defaults.
 */
export function applyDefaultFormulaLeaves(inputLeaves: FormulaLeafMap): FormulaLeafMap {
  return { ...getDefaultFormulaLeafValues(), ...inputLeaves };
}

/**
 * Returns which default keys are missing from the given map.
 * Useful for surfacing unresolved leaves to the UI.
 */
export function getMissingDefaultKeys(inputLeaves: FormulaLeafMap): string[] {
  const defaults = getDefaultFormulaLeafValues();
  return Object.keys(defaults).filter((k) => !(k in inputLeaves));
}
