import type { SelectorItemViewModel, ReadinessState } from './selectorTypes';
import type { CanonicalWeapon } from '../itemTypes';
import { getCanonicalItemKey, normalizeWeaponFamily, normalizeMechanicFamily } from './normalization';
import { getItemReadinessState } from './itemReadiness';

/**
 * Build normalized SelectorItemViewModel list for every weapon source.
 * Every weapon receives a readiness classification.
 * No weapon enters silently without state.
 */
export function buildWeaponSelectorItems(
 allWeaponSources: CanonicalWeapon[],
 context: { primaryWeaponId?: string } = {}
): SelectorItemViewModel[] {
 return allWeaponSources.map((w) => {
  const canonicalKey = getCanonicalItemKey(w);
  const family = normalizeWeaponFamily(w.family || '');
  const mechanic = w.keywordAssociations?.length
   ? normalizeMechanicFamily(w.keywordAssociations[0])
   : undefined;

  const readiness = getItemReadinessState(w, {
   slot: 'primaryWeapon',
   selectedWeaponId: context.primaryWeaponId,
  });

  const state: ReadinessState = readiness.state as ReadinessState;

  return {
   id: w.id,
   displayName: w.name || w.id,
   canonicalKey,
   kind: 'weapon',
   family,
   mechanic,
   imageUrl: w.iconUrl,
   confidence: w.confidence,
   sourceLabel: w.sourceNotes,
   readiness: state,
   missingInputs: readiness.missingInputs,
   blockedReasons: readiness.blockedReasons,
   warnings: readiness.warnings,
  };
 });
}
