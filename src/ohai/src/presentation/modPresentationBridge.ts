import type { CatalogItem } from '../ui/data/catalog';
import { enrichModVariantPresentation, getOhdbModVariant } from './ohdb/mod_presentation_enrichment';

/**
 * Presentation-only enrichment for mod CatalogItem.
 * Returns a new object with polished name/suffix label when OHDB data exists.
 * Original item and IDs are never mutated.
 */
export function enrichCatalogModItem(item: CatalogItem): CatalogItem {
  if (!item || item.id === 'none') return item;

  // Try to find an OHDB variant match using core + suffix pattern
  // Current OHAI mod IDs are mostly suffix-only (e.g. "violent").
  // For now we attempt a direct suffix match as a safe starting point.
  const ohdbVariant = getOhdbModVariant('', item.name); // best-effort suffix match

  if (!ohdbVariant) return item;

  const enriched = enrichModVariantPresentation(ohdbVariant);

  const result: CatalogItem = {
    ...item,
    name: enriched.displayName || item.name
  };

  // Preserve localImagePath + filename/slug from OHDB variant
  const localImagePath = (ohdbVariant as any).localImagePath;
  const filename = (ohdbVariant as any).filename;
  const slug = (ohdbVariant as any).slug;

  if (localImagePath) {
    (result as any).localImagePath = localImagePath;
  }
  if (filename) {
    (result as any).filename = filename;
  }
  if (slug) {
    (result as any).slug = slug;
  }

  if (!localImagePath && typeof window !== 'undefined' && (window as any).__OHDB_DEBUG__) {
    console.warn('[ModBridge] OHDB variant match found but localImagePath missing', {
      id: item.id,
      name: item.name
    });
  }

  return result;
}
