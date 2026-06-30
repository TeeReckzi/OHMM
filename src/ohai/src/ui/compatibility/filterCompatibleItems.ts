// src/ui/compatibility/filterCompatibleItems.ts

import type { SelectorItemViewModel } from '../selectors/selectorTypes';
import type { LoadoutContext } from './types';
import { loadoutLegalityEngine } from './loadoutLegalityEngine';

export function filterCompatibleItems(
 items: SelectorItemViewModel[],
 slotId: string,
 context?: LoadoutContext
): SelectorItemViewModel[] {
 if (!context) return items;

 return items.filter((item) => {
  const result = loadoutLegalityEngine.validateItemForSlot(slotId, item.id, context);
  return result.status !== 'INVALID';
 });
}
