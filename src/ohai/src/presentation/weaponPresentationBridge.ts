import { enrichWeaponPresentation } from './ohdb/presentation_enrichment';
import { getWeapon } from '../ui/registries/weaponRegistry';
import type { WeaponBlueprint } from '../ui/types';
import { resolveOhdbImage } from './ohdb/image_resolver';
import type { OhdbWeapon } from './ohdb/ohdb_types';
import { getItemImageOverride } from './ohdb/itemImageOverrides';

// Dev mode diagnostic logging disabled for CommonJS compatibility
// Can be re-enabled when migrating to ESM-only build
const isDevMode = (): boolean => false;

/**
 * Presentation-only enrichment.
 * Returns a single normalized browser-safe image path.
 * Priority: hardcoded override → cutout-safe local → original local → remote → placeholder
 */
export function getEnrichedWeaponDisplay(blueprintId: string): {
  displayName: string;
  image: string | null;
  originalBlueprint: WeaponBlueprint | null;
} {
  const reg = getWeapon(blueprintId);
  if (!reg) {
    return { displayName: blueprintId, image: null, originalBlueprint: null };
  }

  const lockedStyle = {
    normalized: {
      id: reg.id,
      nameEnglish: reg.name,
      nameOriginal: reg.originalName ?? null,
      weaponTypeEnglish: reg.category ?? null
    }
  };

  const enriched = enrichWeaponPresentation(lockedStyle);

  // PRIORITY 1: Hardcoded local override (most reliable)
  const override = getItemImageOverride('weapon', reg.id) || getItemImageOverride('weapon', enriched.displayName);
  if (override) {
    if (isDevMode()) {
      console.log('[WeaponImageDiag]', {
        name: reg.name,
        id: reg.id,
        normalizedKey: reg.id.toLowerCase(),
        overrideHit: true,
        finalSrc: override.src,
        fallbackReason: null
      });
    }
    return {
      displayName: enriched.displayName,
      image: override.src,
      originalBlueprint: reg as any
    };
  }

  // PRIORITY 2: Try to resolve using the OHDB image resolver
  const ohdbEntity: Partial<OhdbWeapon> = {
    slug: reg.id,
    family: reg.name,
    variantName: null,
    imageUrl: (enriched as any).remoteUrl || null
  };

  const resolved = resolveOhdbImage(ohdbEntity as OhdbWeapon, 'weapons');

  // If resolver found an image, use it
  if (resolved && (resolved.source === 'local-cutout' || resolved.source === 'local-original' || resolved.source === 'cdn')) {
    if (isDevMode()) {
      console.log('[WeaponImageDiag]', {
        name: reg.name,
        id: reg.id,
        normalizedKey: reg.id.toLowerCase(),
        overrideHit: false,
        finalSrc: resolved.src,
        fallbackReason: null
      });
    }
    return {
      displayName: enriched.displayName,
      image: resolved.src,
      originalBlueprint: reg as any
    };
  }

  // PRIORITY 3: Fallback to enrichment image if resolver didn't find local
  const finalImage = (enriched as any).image || null;

  if (isDevMode()) {
    console.log('[WeaponImageDiag]', {
      name: reg.name,
      id: reg.id,
      normalizedKey: reg.id.toLowerCase(),
      overrideHit: false,
      finalSrc: finalImage,
      fallbackReason: finalImage ? 'remote-or-manifest' : 'no-image-available'
    });
  }

  return {
    displayName: enriched.displayName,
    image: finalImage,
    originalBlueprint: reg as any
  };
}
