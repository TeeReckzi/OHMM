// src/lib/ohmm/convertLoadout.ts
// Clean standalone converter. Use this anywhere you need to map the Figma LoadoutMap
// into the legacy BuildSelection expected by the formula engine.

import type { BuildSelection } from '../../ohai/src/ui/types';
import { weaponBlueprints } from '../../ohai/src/ui/data/catalog';

export function loadoutMapToBuildSelection(
  loadout: Record<string, any | null>,
  role: 'attacker' | 'defender'
): BuildSelection {
  const getId = (slot: string) => loadout[slot]?.id || 'none';

  // Slot mapping (Figma UI -> BuildSelection)
  const primary = loadout['primary'] || {};
  const weaponId = getId('primary') !== 'none' ? getId('primary') : weaponBlueprints[0].id;
  const stars = primary.stars ?? 3;
  const tier = primary.tier ?? 4;

  const cradlePerks = Object.keys(loadout)
    .filter((k) => k.startsWith('cradle_'))
    .map((k) => loadout[k]?.id)
    .filter(Boolean) as string[];

  // Helper to carry stars (blueprint level) + tier (crafted quality) for armor pieces
  const getArmorPiece = (loadoutKey: string) => {
    const item = loadout[loadoutKey];
    const id = item?.id || 'none';
    if (!id || id === 'none') return 'none';
    return {
      id,
      stars: (item?.stars ?? 3) as any,
      tier: (item?.tier ?? 4) as any,
    };
  };

  return {
    id: `figma-${role}`,
    label: role === 'attacker' ? 'Offensive' : 'Defensive',
    role,
    weapon: {
      blueprintId: weaponId,
      stars,
      tier,
      calibration: loadout['primary_calibration']?.name || 'Rapid / Precision',
      attachments: {
        optic: getId('att_sight'),
        muzzle: getId('att_muzzle'),
        magazine: getId('att_mag'),
        tactical: getId('att_barrel') || 'none',
        stock: getId('att_stock'),
        ammo: getId('ammo') || 'copper-ammo',
      },
    },
    armor: {
      head: getArmorPiece('helmet'),
      mask: getArmorPiece('mask'),
      chest: getArmorPiece('chest'),
      gloves: getArmorPiece('gloves'),
      pants: getArmorPiece('pants'),
      boots: getArmorPiece('boots'),
    },
    mods: {
      weapon: getId('primary_mod'),
      head: getId('helmet_mod'),
      mask: getId('mask_mod'),
      chest: getId('chest_mod'),
      gloves: getId('gloves_mod'),
      pants: getId('pants_mod'),
      boots: getId('boots_mod'),
    },
    modSelections: {
      weaponCore: getId('primary_mod'),
      weaponSuffix: undefined,
      headCore: getId('helmet_mod'),
      headSuffix: undefined,
      maskCore: getId('mask_mod'),
      maskSuffix: undefined,
      chestCore: getId('chest_mod'),
      chestSuffix: undefined,
      glovesCore: getId('gloves_mod'),
      glovesSuffix: undefined,
      pantsCore: getId('pants_mod'),
      pantsSuffix: undefined,
      bootsCore: getId('boots_mod'),
      bootsSuffix: undefined,
    },
    cradle: { perks: cradlePerks.length ? cradlePerks : [] },
    deviant: {
      id: getId('deviation') || 'pyro-dino',
      level: 4,
      activityRating: 3,
      trait: '',
    },
    food: {
      food: getId('food') || 'safety-sandwich',
      drink: getId('drink') || 'anti-gravity-milkshake',
      chefRex: {
        enabled: true,
        skillRating: 4,
        activityRating: 3,
        bonusPercent: 42,
        mode: 'rating-derived',
      },
    },
  };
}
