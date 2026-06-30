import type { CatalogItem } from '../ui/data/catalog';
import { buildCdnUrl, getSupabaseImageUrl } from '../ui/data/supabaseImageResolver';

const OHDB_BASE = '/assets/ohdb_import_corpus_v2';

const CATEGORY_FROM_TYPE: Record<string, string> = {
  weapon: 'weapons',
  armor: 'armor',
  mod: 'mods',
  attachment: 'attachments',
  key_gear: 'armor',
};

function guessCategory(type?: string, item?: any): string {
  if (type && CATEGORY_FROM_TYPE[type]) return CATEGORY_FROM_TYPE[type];
  if (item?.category && CATEGORY_FROM_TYPE[item.category]) return CATEGORY_FROM_TYPE[item.category];
  return 'weapons';
}

export function resolveOHDBImagePath(localImagePath?: string): string | undefined {
  if (!localImagePath) return undefined;
  if (localImagePath.startsWith('/assets/')) return localImagePath;
  const cleanPath = localImagePath.replace(/^\/+/, '');
  return `${OHDB_BASE}/${cleanPath}`;
}

export function getItemImage(item: CatalogItem | any, type?: string): string | null {
  if (!item) return null;

  // 1. Explicit image on item
  if (item.image) return item.image;
  if (item.iconUrl) return item.iconUrl;
  if (item.assetPath) return item.assetPath;

  // 2. CDN/Supabase resolution from slug or name
  const category = guessCategory(type, item);
  const slug = item.slug || item.id || item.name?.toLowerCase().replace(/\s+/g, '-');
  if (slug) {
    const supabaseUrl = getSupabaseImageUrl(category, slug);
    if (supabaseUrl) return supabaseUrl;
    return buildCdnUrl(category, slug);
  }

  // 3. OHDB localImagePath (from enrichment)
  if (item.localImagePath) {
    const resolved = resolveOHDBImagePath(item.localImagePath);
    if (resolved) return resolved;
  }

  // 4. Manifest localPath
  const manifestLocalPath = item.manifestLocalPath || item.localPath;
  if (manifestLocalPath) {
    if (manifestLocalPath.startsWith('images/')) {
      const filename = manifestLocalPath.split('/').pop();
      if (filename) return `${OHDB_BASE}/images_cutout_safe/${filename}`;
    }
    const resolved = resolveOHDBImagePath(manifestLocalPath);
    if (resolved) return resolved;
  }

  // 5. Cutout-safe by filename
  const filename = item.filename || item.manifestFilename;
  if (filename) return `${OHDB_BASE}/images_cutout_safe/${filename}`;

  // 6. Cutout-safe by slug
  if (slug) return `${OHDB_BASE}/images_cutout_safe/${slug}.png`;

  // 7. Remote sourceUrl
  if (item.sourceUrl && item.allowRemoteFallback) return item.sourceUrl;

  return null;
}

export function getAssetDebugSummary() {
  // Placeholder for future summary; bridges now log individually
  return {
    weaponsWithLocalImagePath: 0,
    armorWithLocalImagePath: 0,
    modsWithLocalImagePath: 0,
    missingImageData: 0
  };
}

export function logMissingAsset(item: any, type: string) {
  if (typeof window !== 'undefined' && (window as any).__OHDB_DEBUG__ && item) {
    console.warn(`[Asset] Missing image for ${type} "${item.id || item.name}"`, {
      id: item.id,
      name: item.name,
      type
    });
  }
}

export function getItemImageWithWarning(item: CatalogItem | any, type: string): string | null {
  const img = getItemImage(item, type);
  if (!img) {
    logMissingAsset(item, type);
  }
  return img;
}
