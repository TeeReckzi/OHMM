import type { OhdbArmor } from './ohdb_types';
import { loadOhdbArmor } from './ohdb_adapters';
import { resolveOhdbImage } from './image_resolver';

export interface EnrichedArmorPresentation {
  displayName: string;
  image: string | null;
  rarity: string | null;
  armorType: string | null;
  source: 'ohdb' | 'ohai' | 'mixed';
}

function findOhdbArmorMatch(lockedId: string): OhdbArmor | undefined {
  const result = loadOhdbArmor();
  return result.data.find(a => a.slug.toLowerCase() === lockedId.toLowerCase());
}

export function enrichArmorPresentation(lockedArmor: any): EnrichedArmorPresentation {
  const id = lockedArmor.id ?? lockedArmor.normalized?.id;
  const ohdb = findOhdbArmorMatch(id);

  const displayName =
    ohdb?.name ??
    lockedArmor.name ??
    lockedArmor.originalName ??
    id;

  const resolved = ohdb ? resolveOhdbImage({ ...ohdb, family: '', variantName: null } as any, 'armor') : null;
  const image = resolved?.src ?? resolved?.path ?? null;

  const rarity = ohdb?.rarity ?? null;
  const armorType = ohdb?.armorType ?? lockedArmor.slot ?? null;

  let source: EnrichedArmorPresentation['source'] = 'ohai';
  if (ohdb && (ohdb.name || image || rarity)) source = 'mixed';
  if (ohdb && !lockedArmor.name) source = 'ohdb';

  return {
    displayName,
    image,
    rarity,
    armorType,
    source
  };
}
