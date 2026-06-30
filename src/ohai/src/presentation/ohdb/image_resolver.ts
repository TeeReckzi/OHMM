import type { OhdbWeapon } from './ohdb_types';
import { buildCdnUrl, getSupabaseImageUrl } from '../../ui/data/supabaseImageResolver';

const OHDB_BASE = '/assets/ohdb_import_corpus_v2';

// Lazy load to avoid top-level JSON import issues
let _cachedWeapons: OhdbWeapon[] | null = null;

export function getAllOhdbWeapons(): OhdbWeapon[] {
  if (!_cachedWeapons) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require('./weapons.json');
    _cachedWeapons = (raw.default ?? raw) as OhdbWeapon[];
  }
  return _cachedWeapons;
}

interface OhdbImagePaths {
  cutoutSafe?: string;
  local?: string;
  remote?: string;
}

function resolveImagePaths(entity: OhdbWeapon): OhdbImagePaths {
  if ((entity as any).iconUrl) {
    return { cutoutSafe: (entity as any).iconUrl };
  }
  const slug = entity.slug;
  const family = entity.family.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const variant = entity.variantName ? entity.variantName.toLowerCase().replace(/[^a-z0-9]/g, '-') : '';

  const manifestFilename = (entity as any).filename || (entity as any).manifestFilename;
  
  let cutout: string | undefined;
  let local: string | undefined;

  if (manifestFilename) {
    cutout = `${OHDB_BASE}/images_cutout_safe/weapons/${manifestFilename}`;
    local = `${OHDB_BASE}/images/weapons/${manifestFilename}`;
  } else {
    cutout = variant
      ? `${OHDB_BASE}/images_cutout_safe/weapons/${family}-${variant}.png`
      : `${OHDB_BASE}/images_cutout_safe/weapons/${family}.png`;

    local = variant
      ? `${OHDB_BASE}/images/weapons/${family}-${variant}.png`
      : `${OHDB_BASE}/images/weapons/${family}.png`;
  }

  return {
    cutoutSafe: cutout,
    local,
    remote: entity.imageUrl || undefined
  };
}

export interface ResolvedImage {
  src: string;
  path: string; // compatibility alias
  source: 'local-cutout' | 'local-original' | 'remote' | 'cdn' | 'placeholder';
  alt?: string;
  slug?: string;
}

export function resolveOhdbImage(entity: OhdbWeapon, category: string = 'weapons'): ResolvedImage | null {
  // Priority 1: Explicit iconUrl on entity
  if ((entity as any).iconUrl) {
    return {
      src: (entity as any).iconUrl,
      path: (entity as any).iconUrl,
      source: 'remote',
      slug: entity.slug
    };
  }

  // Priority 2: Supabase cache (pre-fetched CDN URLs)
  if (entity.slug) {
    const supabaseUrl = getSupabaseImageUrl(category, entity.slug);
    if (supabaseUrl) {
      return {
        src: supabaseUrl,
        path: supabaseUrl,
        source: 'cdn',
        slug: entity.slug
      };
    }
  }

  // Priority 3: Direct CDN URL construction from slug
  if (entity.slug) {
    const cdnUrl = buildCdnUrl(category, entity.slug);
    return {
      src: cdnUrl,
      path: cdnUrl,
      source: 'cdn',
      slug: entity.slug
    };
  }

  // Priority 4-6: Local file paths (original behavior)
  const paths = resolveImagePaths(entity);

  if (paths.cutoutSafe) {
    return {
      src: paths.cutoutSafe,
      path: paths.cutoutSafe,
      source: 'local-cutout',
      slug: entity.slug
    };
  }

  if (paths.local) {
    return {
      src: paths.local,
      path: paths.local,
      source: 'local-original',
      slug: entity.slug
    };
  }

  if (paths.remote) {
    return {
      src: paths.remote,
      path: paths.remote,
      source: 'remote',
      slug: entity.slug
    };
  }

  return null;
}
