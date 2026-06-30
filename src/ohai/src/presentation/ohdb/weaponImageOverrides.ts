/**
 * Hardcoded local image overrides for weapon tiles.
 * 
 * Only includes confident exact matches between locked OHAI weapon identifiers
 * and actual local cutout-safe image filenames.
 * 
 * Source: public/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/
 */

export const weaponImageOverrides: Record<string, string> = {
  // ACS-12 variants
  "acs-12-corrosion": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/acs12-corrosion.png",
  "acs12-corrosion": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/acs12-corrosion.png",
  
  "acs-12-pyroclasm-starter": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/acs12-pyroclasm-starter.png",
  "acs12-pyroclasm-starter": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/acs12-pyroclasm-starter.png",
  
  // EBR-14 variants
  "ebr-14-octopus-grilled-rings": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/ebr-14-octopus-grilled-rings.png",
  "ebr14-octopus-grilled-rings": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/ebr-14-octopus-grilled-rings.png",
  
  // AWS.338 variants (verified exact matches)
  "aws-338-bullseye": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/aws-338-bullseye.png",
  "aws338-bullseye": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/aws-338-bullseye.png",
  
  "aws-338-black-panther": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/aws-338-black-panther.png",
  "aws338-black-panther": "/assets/ohdb_import_corpus_v2/images_cutout_safe/weapons/aws-338-black-panther.png",
} as const;

export function getWeaponImageOverride(key: string): string | undefined {
  if (!key) return undefined;
  
  const normalized = key.toLowerCase().trim();
  
  // Direct match
  if (weaponImageOverrides[normalized]) {
    return weaponImageOverrides[normalized];
  }
  
  // Try with/without dashes
  const withoutDashes = normalized.replace(/-/g, '');
  if (weaponImageOverrides[withoutDashes]) {
    return weaponImageOverrides[withoutDashes];
  }
  
  const withDashes = normalized.replace(/([a-z])(\d)/g, '$1-$2');
  if (weaponImageOverrides[withDashes]) {
    return weaponImageOverrides[withDashes];
  }
  
  return undefined;
}
