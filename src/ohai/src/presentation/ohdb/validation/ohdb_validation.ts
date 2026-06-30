import { getAllOhdbWeapons, resolveOhdbImage } from '../image_resolver';
import { getWeaponFamilyMembers } from '../weapon_family_helpers';
import type { WeaponsRawData } from '../../../schemas/weaponSchema';
import * as lockedWeapons from '../../../../data/verified/weapons.verified.json';

export interface ImageValidationReport {
  totalOhdbWeapons: number;
  missingImagePaths: string[];
  duplicateLocalPaths: string[];
}

export function validateOhdbImages(): ImageValidationReport {
  const weapons = getAllOhdbWeapons();
  const seenPaths = new Map<string, string>();
  const missing: string[] = [];
  const duplicates: string[] = [];

  for (const w of weapons) {
    const resolved = resolveOhdbImage(w);
    if (!resolved) {
      missing.push(w.slug);
      continue;
    }

    const path = resolved.path;
    if (seenPaths.has(path)) {
      duplicates.push(`${path} (used by ${seenPaths.get(path)} and ${w.slug})`);
    } else {
      seenPaths.set(path, w.slug);
    }
  }

  return {
    totalOhdbWeapons: weapons.length,
    missingImagePaths: missing,
    duplicateLocalPaths: duplicates
  };
}

export interface FamilyValidationReport {
  unresolvedFamilies: string[];
}

export function validateWeaponFamilies(): FamilyValidationReport {
  const all = getAllOhdbWeapons();
  const families = new Set(all.map(w => w.family));
  const unresolved: string[] = [];

  for (const fam of families) {
    const members = getWeaponFamilyMembers(fam);
    if (members.length === 0) unresolved.push(fam);
  }

  return { unresolvedFamilies: unresolved };
}

export interface RegistryMatchReport {
  ohdbNotMatched: string[];
  ohaLockedMissingEnrichment: string[];
}

export function validateRegistryMatch(): RegistryMatchReport {
  const ohdb = getAllOhdbWeapons();
  const locked = (lockedWeapons as unknown as WeaponsRawData).items;

  const ohdbSlugs = new Set(ohdb.map(w => w.slug.toLowerCase()));
  const lockedIds = new Set(locked.map(i => i.normalized.id.toLowerCase()));

  const notMatched = ohdb.filter(w => !lockedIds.has(w.slug.toLowerCase())).map(w => w.slug);
  const missingEnrichment = locked
    .filter(l => !ohdbSlugs.has(l.normalized.id.toLowerCase()))
    .map(l => l.normalized.id);

  return {
    ohdbNotMatched: notMatched,
    ohaLockedMissingEnrichment: missingEnrichment
  };
}

export interface OhdbDevReport {
  images: ImageValidationReport;
  families: FamilyValidationReport;
  registry: RegistryMatchReport;
  generatedAt: string;
}

export function generateOhdbDevReport(): OhdbDevReport {
  return {
    images: validateOhdbImages(),
    families: validateWeaponFamilies(),
    registry: validateRegistryMatch(),
    generatedAt: new Date().toISOString()
  };
}
