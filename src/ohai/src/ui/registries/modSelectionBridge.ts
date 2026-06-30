import type { ModSelection } from '../types';

/**
 * Compatibility bridge between legacy flat mod map and explicit core+suffix ModSelection.
 * This allows gradual migration without breaking existing calculation paths.
 */

export interface LegacyModMap {
 [slot: string]: string | undefined;
}

/**
 * Converts a legacy single modId into the new ModSelection shape.
 * Since legacy only stored one value, we treat it as "core" when possible.
 * Suffix remains undefined until the UI is migrated to separate selections.
 */
export function legacyModToModSelection(legacyMods: LegacyModMap): ModSelection {
 const result: ModSelection = {};

 for (const [slot, modId] of Object.entries(legacyMods)) {
  if (!modId || modId === 'none') continue;

  // Legacy value goes into the core field for now.
  // When the UI supports separate suffix selection, suffix will be populated.
  (result as any)[`${slot}Core`] = modId;
 }

 return result;
}

/**
 * Converts explicit ModSelection back to the legacy flat map for compatibility.
 * Only includes completed (core + suffix) or legacy-style core-only entries.
 */
export function modSelectionToLegacyMod(modSelections: ModSelection): LegacyModMap {
 const result: LegacyModMap = {};

 const slots = ['weapon', 'head', 'mask', 'chest', 'gloves', 'pants', 'boots'];

 for (const slot of slots) {
  const core = (modSelections as any)[`${slot}Core`];
  const suffix = (modSelections as any)[`${slot}Suffix`];

  if (suffix) {
   // When we have both, we can emit the combined value if needed.
   // For now we keep the core ID as the primary (calculation expects core IDs).
   result[slot] = core;
  } else if (core) {
   result[slot] = core;
  }
 }

 return result;
}

/**
 * Extracts the completed equipped mod ID that the calculation layer expects.
 * Returns the core mod ID only when both core and suffix are present.
 * Returns undefined for incomplete selections.
 */
export function getCompletedModForCalculation(
 slot: string,
 modSelections: ModSelection
): string | undefined {
 const core = (modSelections as any)[`${slot}Core`];
 const suffix = (modSelections as any)[`${slot}Suffix`];

 if (core && suffix) {
  return core; // Calculation currently uses the core ID as the equipped mod identifier
 }
 return undefined;
}
