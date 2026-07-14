import { SUPABASE_URL, ANON_KEY, CDN_BASE } from "../../data/supabaseClient";

const CATEGORY_PATH: Record<string, string> = {
 weapons: 'weapons',
 armour: 'armour',
 armor: 'armor',
 mods: 'mods',
 attachments: 'attachments',
 // Slot-categorized examples (when you update Supabase app_images.category to these):
 // 'armour-helmet': 'armour',
 // 'attachments-muzzle': 'attachments',
 // 'mods-weapon-core': 'mods',
};

type ImageCache = Record<string, Record<string, string>>;
let imageCache: ImageCache = {};
let cacheReady = false;
let initPromise: Promise<void> | null = null;

const extractSlug = (url: string): string =>
 url.split('/').pop()?.replace(/\.png$/i, '') ?? '';

async function initCache(): Promise<void> {
 // Skip if Supabase app_images table doesn't exist yet
 if (!SUPABASE_URL || !ANON_KEY) return;
 try {
  // Support both old broad categories and new slot-categorized ones (e.g. armour-helmet, attachments-muzzle)
  const res = await fetch(
   `${SUPABASE_URL}/rest/v1/app_images?select=image_url,category,slot`,
   { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
  );
  if (!res.ok) {
   // Silently skip — table likely doesn't exist yet. CDN fallback will handle icons.
   return;
  }
  const rows = await res.json();
  const cache: ImageCache = {};
  for (const row of rows) {
   const slug = extractSlug(row.image_url);
   const baseCat = row.category === 'weapon' ? 'weapons' : row.category;
   // Store under broad category
   if (!cache[baseCat]) cache[baseCat] = {};
   cache[baseCat][slug] = row.image_url;

   // If slot present, also store under "category-slot" for precise lookups
   if (row.slot) {
    const slottedCat = `${baseCat}-${row.slot}`;
    if (!cache[slottedCat]) cache[slottedCat] = {};
    cache[slottedCat][slug] = row.image_url;
   }
  }
  imageCache = cache;
  cacheReady = true;
 } catch {
  // Network error or CORS — silently skip, CDN fallback handles icons
 }
}

initPromise = initCache();

export function buildCdnUrl(category: string, slug: string, slot?: string): string {
 let effectiveCat = category;
 if (slot) {
  effectiveCat = `${category}-${slot}`;
 }
 const path = CATEGORY_PATH[effectiveCat] ?? CATEGORY_PATH[category] ?? effectiveCat;
 return `${CDN_BASE}/${path}/${slug}.png`;
}

export function getSupabaseImageUrl(category: string, slug: string, slot?: string): string | undefined {
 if (slot) {
  const slotted = `${category}-${slot}`;
  if (imageCache[slotted]?.[slug]) return imageCache[slotted][slug];
 }
 return imageCache[category]?.[slug];
}

export function isCacheReady(): boolean {
 return cacheReady;
}

export function getInitPromise(): Promise<void> | null {
 return initPromise;
}
