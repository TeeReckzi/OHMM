import { buildCdnUrl } from '../../ui/data/supabaseImageResolver';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main';

export type ItemImageSource =
  | "cdn-override"
  | "local-cutout-override"
  | "local-cutout-manifest"
  | "local-original"
  | "remote"
  | "placeholder";

export type ItemImage = {
  src: string;
  source: ItemImageSource;
  alt?: string;
  matchedKey?: string;
};

export const itemImageOverrides: Record<string, Record<string, string>> = {
  weapon: {
    "acs-12-corrosion": `${CDN_BASE}/weapons/acs12-corrosion.png`,
    "acs12-corrosion": `${CDN_BASE}/weapons/acs12-corrosion.png`,
    "acs-12-pyroclasm-starter": `${CDN_BASE}/weapons/acs12-pyroclasm-starter.png`,
    "acs12-pyroclasm-starter": `${CDN_BASE}/weapons/acs12-pyroclasm-starter.png`,
    "ebr-14-octopus-grilled-rings": `${CDN_BASE}/weapons/ebr-14-octopus-grilled-rings.png`,
    "ebr14-octopus-grilled-rings": `${CDN_BASE}/weapons/ebr-14-octopus-grilled-rings.png`,
    "aws-338-bullseye": `${CDN_BASE}/weapons/aws-338-bullseye.png`,
    "aws338-bullseye": `${CDN_BASE}/weapons/aws-338-bullseye.png`,
    "aws-338-black-panther": `${CDN_BASE}/weapons/aws-338-black-panther.png`,
    "aws338-black-panther": `${CDN_BASE}/weapons/aws-338-black-panther.png`,
  },
  armor: {},
  attachment: {},
  mod: {},
};

export function getItemImageOverride(category: string, key: string): ItemImage | undefined {
  if (!category || !key) return undefined;
  
  const cat = category.toLowerCase().trim();
  const normalizedKey = key.toLowerCase().trim();
  
  const categoryMap = itemImageOverrides[cat];
  if (!categoryMap) return undefined;
  
  // Direct match
  if (categoryMap[normalizedKey]) {
    return {
      src: categoryMap[normalizedKey],
      source: "local-cutout-override",
      matchedKey: normalizedKey,
    };
  }
  
  // Try with/without dashes
  const withoutDashes = normalizedKey.replace(/-/g, '');
  if (categoryMap[withoutDashes]) {
    return {
      src: categoryMap[withoutDashes],
      source: "local-cutout-override",
      matchedKey: withoutDashes,
    };
  }
  
  const withDashes = normalizedKey.replace(/([a-z])(\d)/g, '$1-$2');
  if (categoryMap[withDashes]) {
    return {
      src: categoryMap[withDashes],
      source: "local-cutout-override",
      matchedKey: withDashes,
    };
  }
  
  return undefined;
}
