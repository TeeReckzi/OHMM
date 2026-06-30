import type { OhdbWeapon } from './ohdb_types';
import { getAllOhdbWeapons, resolveOhdbImage } from './image_resolver';
import type { WeaponsRawData } from '../../schemas/weaponSchema';
import lockedWeaponsRaw from '../../../data/verified/weapons.verified.json';

export interface EnrichedPresentation {
  displayName: string;
  image: string | null;
  rarity: string | null;
  typeLabel: string | null;
  source: 'ohdb' | 'ohai' | 'mixed';
}

const lockedWeapons = (lockedWeaponsRaw as unknown as WeaponsRawData).items;

function findOhdbMatch(lockedId: string): OhdbWeapon | undefined {
  const all = getAllOhdbWeapons();
  return all.find(w => w.slug.toLowerCase() === lockedId.toLowerCase());
}

export function enrichWeaponPresentation(lockedWeapon: any): EnrichedPresentation {
  const id = lockedWeapon.normalized?.id ?? lockedWeapon.id;
  const ohdb = findOhdbMatch(id);

  const displayName =
    ohdb?.name ??
    lockedWeapon.normalized?.nameEnglish ??
    lockedWeapon.normalized?.nameOriginal ??
    id;

  const resolvedImage = ohdb ? resolveOhdbImage(ohdb) : null;
  const image = resolvedImage?.path ?? null;

  const rarity = ohdb?.rarity ?? null;
  const typeLabel = ohdb?.type ?? lockedWeapon.normalized?.weaponTypeEnglish ?? null;

  let source: EnrichedPresentation['source'] = 'ohai';
  if (ohdb && (ohdb.name || image || rarity)) source = 'mixed';
  if (ohdb && !lockedWeapon.normalized?.nameEnglish) source = 'ohdb';

  return {
    displayName,
    image,
    rarity,
    typeLabel,
    source
  };
}

export interface EnrichmentMismatchReport {
  lockedWithoutOhdb: string[];
  ohdbWithoutLocked: string[];
  nameConflicts: string[];
  imageConflicts: string[];
}

export function generateEnrichmentMismatchReport(): EnrichmentMismatchReport {
  const lockedIds = new Set(lockedWeapons.map(w => w.normalized.id.toLowerCase()));
  const ohdb = getAllOhdbWeapons();
  const ohdbSlugs = new Set(ohdb.map(w => w.slug.toLowerCase()));

  const lockedWithout = lockedWeapons
    .filter(w => !ohdbSlugs.has(w.normalized.id.toLowerCase()))
    .map(w => w.normalized.id);

  const ohdbWithout = ohdb
    .filter(w => !lockedIds.has(w.slug.toLowerCase()))
    .map(w => w.slug);

  // Name conflicts: same slug but different display names
  const nameConflicts: string[] = [];
  for (const w of lockedWeapons) {
    const match = ohdb.find(o => o.slug.toLowerCase() === w.normalized.id.toLowerCase());
    if (match && w.normalized.nameEnglish && match.name !== w.normalized.nameEnglish) {
      nameConflicts.push(`${w.normalized.id}: OHAI="${w.normalized.nameEnglish}" vs OHDB="${match.name}"`);
    }
  }

  // Image conflicts: both have images but different paths
  const imageConflicts: string[] = [];
  for (const w of lockedWeapons) {
    const match = ohdb.find(o => o.slug.toLowerCase() === w.normalized.id.toLowerCase());
    if (match) {
      const ohdbImg = resolveOhdbImage(match);
      // Currently no locked image field exists, so skip real conflict detection
      // Placeholder for future when locked weapons carry image paths
    }
  }

  return {
    lockedWithoutOhdb: lockedWithout,
    ohdbWithoutLocked: ohdbWithout,
    nameConflicts,
    imageConflicts
  };
}
