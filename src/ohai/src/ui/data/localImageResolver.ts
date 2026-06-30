import { armorImageAliases } from './armorImageAliases';
import { buildCdnUrl, getSupabaseImageUrl } from './supabaseImageResolver';

type ManifestCategory = 'weapons' | 'armor' | 'mods' | 'attachments';

const normalize = (value: string): string =>
 value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const folderAliases: Record<string, string> = {
 'weapons:compound-bow-burden-of-betrayal': 'cb-burden-of-betrayal',
 'weapons:aws338-bingo': 'aws-338-bullseye',
};

const slotAliases: Record<string, string> = {
 head: 'helmet',
 chest: 'top',
 boots: 'shoes',
};

function publicImagePath(category: ManifestCategory, slug: string): string {
 return `/assets/ohdb_import_corpus_v2/images_cutout_safe/${category}/${slug}.png`;
}

function candidateSlugs(category: ManifestCategory, id: string, name?: string): string[] {
 const idSlug = normalize(id);
 const nameSlug = name ? normalize(name) : '';
 const alias = category === 'armor'
  ? (armorImageAliases[`${category}:${idSlug}`] ?? folderAliases[`${category}:${idSlug}`])
  : folderAliases[`${category}:${idSlug}`];
 const slugs = [alias, idSlug, nameSlug].filter(Boolean) as string[];

 if (category === 'armor') {
  for (const [from, to] of Object.entries(slotAliases)) {
   if (idSlug.endsWith(`-${from}`)) slugs.push(idSlug.replace(new RegExp(`-${from}$`), `-${to}`));
   if (nameSlug.endsWith(`-${from}`)) slugs.push(nameSlug.replace(new RegExp(`-${from}$`), `-${to}`));
  }
 }

 return Array.from(new Set(slugs));
}

export function resolveLocalImage(category: ManifestCategory, id: string, name?: string): string | undefined {
 if (id === 'none' || id === 'empty') return undefined;
 const slugs = candidateSlugs(category, id, name);

 // Priority 1: Supabase cache (pre-fetched CDN URLs)
 for (const slug of slugs) {
  const supabaseUrl = getSupabaseImageUrl(category, slug);
  if (supabaseUrl) return supabaseUrl;
 }

 // Priority 2: Direct CDN URL construction (fallback if cache not ready)
 const [first] = slugs;
 if (first) return buildCdnUrl(category, first);

 // Priority 3: Local path
 return first ? publicImagePath(category, first) : undefined;
}

export type { ManifestCategory };
