import { enrichArmorPresentation, type EnrichedArmorPresentation } from './ohdb/armor_presentation_enrichment';
import type { CanonicalArmor } from '../ui/itemTypes';
import type { CatalogItem } from '../ui/data/catalog';

export function getEnrichedArmorDisplay(armorId: string): {
  displayName: string;
  image: string | null;
  localImagePath: string | null;
  filename: string | null;
  slug: string | null;
  originalArmor: CanonicalArmor | null;
} {
  // Extend the enrichment type to include localImagePath
  interface ExtendedEnrichedArmorPresentation extends EnrichedArmorPresentation {
    localImagePath?: string | null;
  }
  const lockedStyle = {
    id: armorId,
    name: null,
    originalName: null,
    slot: null
  };

  const enriched = enrichArmorPresentation(lockedStyle);

  const localImagePath = (enriched as any).localImagePath ?? null;
  const filename = (enriched as any).filename ?? null;
  const slug = (enriched as any).slug ?? null;

  if (enriched.image && !localImagePath && typeof window !== 'undefined' && (window as any).__OHDB_DEBUG__) {
    console.warn('[ArmorBridge] OHDB match found but localImagePath missing', {
      id: armorId
    });
  }

  return {
    displayName: enriched.displayName,
    image: enriched.image,
    localImagePath,
    filename,
    slug,
    originalArmor: null
  };
}

/**
 * Presentation-only enrichment for CatalogItem used in armor dropdowns.
 * Returns a new object with enriched label; original item is untouched.
 */
export function enrichCatalogArmorItem(item: CatalogItem): CatalogItem {
  if (!item || item.id === 'empty' || item.id === 'none') return item;

  const enriched = getEnrichedArmorDisplay(item.id);
  const enrichedNameIsUseful = !!enriched.displayName && !enriched.displayName.includes('-');
  if (enriched.displayName === item.name || !enrichedNameIsUseful) return item;

  const result: CatalogItem = {
    ...item,
    name: enriched.displayName
  };

  // Preserve localImagePath without overwriting
  if (enriched.localImagePath) {
    (result as any).localImagePath = enriched.localImagePath;
  }

  return result;
}
