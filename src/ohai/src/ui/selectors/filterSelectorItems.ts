import type { SelectorItemViewModel } from './selectorTypes';

export interface WeaponSelectorFilters {
 query?: string;
 family?: string;
 mechanic?: string;
 readiness?: string;
 showPartial?: boolean;
 showDisplayOnly?: boolean;
 showBlocked?: boolean;
}

export function filterSelectorItems(
 items: SelectorItemViewModel[],
 filters: WeaponSelectorFilters = {}
): SelectorItemViewModel[] {
 return items.filter((item) => {
  if (filters.query) {
   const q = filters.query.toLowerCase();
   const match =
    item.displayName.toLowerCase().includes(q) ||
    item.family?.toLowerCase().includes(q) ||
    item.mechanic?.toLowerCase().includes(q);
   if (!match) return false;
  }

  if (filters.family && item.family !== filters.family) return false;
  if (filters.mechanic && item.mechanic !== filters.mechanic) return false;
  if (filters.readiness && item.readiness !== filters.readiness) return false;

  if (item.readiness === 'PARTIAL' && filters.showPartial === false) return false;
  if (item.readiness === 'DISPLAY_ONLY' && filters.showDisplayOnly === false) return false;
  if (item.readiness === 'BLOCKED' && filters.showBlocked === false) return false;

  return true;
 });
}
