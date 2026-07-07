// src/lib/ohmm/convertLoadout.ts
// Maps the Figma LoadoutMap into BuildSelection expected by the formula engine
// and back.

import type { BuildSelection, WeaponSelection } from '../../ohai/src/ui/types';
import { weaponRegistry } from '../../ohai/src/ui/registries/weaponRegistry';
import { armorRegistry, keyGearRegistry } from '../../ohai/src/ui/registries/armorRegistry';
import { ammoRegistry } from '../../ohai/src/ui/registries/ammoRegistry';
import type { EquippedItem } from '../../app/types';

function buildWeaponSelection(
  loadout: Record<string, any | null>,
  mainKey: string,
  calibKey: string,
  prefix: string,
): WeaponSelection | undefined {
  const item = loadout[mainKey];
  if (!item?.id) return undefined;
  return {
    blueprintId: item.id,
    stars: item.stars ?? 3,
    tier: item.tier ?? 4,
    calibration: loadout[calibKey]?.name || 'none',
    attachments: {
      optic: loadout[`${prefix}att_sight`]?.id || 'none',
      muzzle: loadout[`${prefix}att_muzzle`]?.id || 'none',
      magazine: loadout[`${prefix}att_mag`]?.id || 'none',
      tactical: loadout[`${prefix}att_barrel`]?.id || 'none',
      stock: loadout[`${prefix}att_stock`]?.id || 'none',
      ammo: loadout[`${prefix}ammo`]?.id || 'none',
    },
  };
}

export function loadoutMapToBuildSelection(
  loadout: Record<string, any | null>,
  role: 'attacker' | 'defender'
): BuildSelection {
  const getId = (slot: string) => loadout[slot]?.id || 'none';

  const cradlePerks = Object.keys(loadout)
    .filter((k) => k.startsWith('cradle_'))
    .map((k) => loadout[k]?.id)
    .filter(Boolean) as string[];

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
    weapon: buildWeaponSelection(loadout, 'primary', 'primary_calibration', 'att_') ?? {
      blueprintId: 'none', stars: 3, tier: 4, calibration: 'none',
      attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'none' },
    },
    secondaryWeapon: buildWeaponSelection(loadout, 'secondary', 'secondary_calibration', 'sec_att_'),
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
      id: getId('deviation') || 'none',
      trait: '',
    },
    food: {
      food: getId('food') || 'none',
      drink: getId('drink') || 'none',
      chefRex: {
        enabled: false,
        bonusPercent: 0,
      },
    },
  };
}

function findWeaponName(id: string): string {
  if (id === 'none' || !id) return 'No Weapon';
  const w = weaponRegistry.find((x) => x.id === id);
  return w?.name || id;
}

function findArmorName(id: string): string {
  if (id === 'none' || !id) return 'None';
  const a = armorRegistry.find((x) => x.id === id) || keyGearRegistry.find((x) => x.id === id);
  return a?.name || id;
}

export function buildSelectionToLoadoutMap(
  build: BuildSelection,
): Record<string, EquippedItem | null> {
  const loadout: Record<string, EquippedItem | null> = {};

  const mkItem = (id: string, name: string, category: string, rarity: string = 'Epic', tier = 4, stars = 3): EquippedItem | null => {
    if (!id || id === 'none') return null;
    return { id, name, category, rarity: rarity as any, tier, stars };
  };

  // weapon
  const wp = build.weapon;
  if (wp && wp.blueprintId && wp.blueprintId !== 'none') {
    loadout['primary'] = mkItem(wp.blueprintId, findWeaponName(wp.blueprintId), weaponRegistry.find((x) => x.id === wp.blueprintId)?.family || 'AR', 'Legendary', wp.tier, wp.stars);
    loadout['primary_mod'] = mkItem(build.mods?.weapon || build.modSelections?.weaponCore || '', 'Weapon Mod', 'Mod', 'Rare');
    if (wp.calibration && wp.calibration !== 'none') {
      loadout['primary_calibration'] = { id: wp.calibration, name: wp.calibration.charAt(0).toUpperCase() + wp.calibration.slice(1) + ' Calibration', category: 'Calibration', rarity: 'Rare', tier: 0, stars: 0 };
    }
    const att = wp.attachments;
    if (att) {
      loadout['att_muzzle'] = mkItem(att.muzzle, att.muzzle !== 'none' ? att.muzzle : 'No Muzzle', 'Attachment', 'Uncommon', 3, 1);
      loadout['att_sight'] = mkItem(att.optic, att.optic !== 'none' ? att.optic : 'No Optic', 'Attachment', 'Uncommon', 3, 1);
      loadout['att_barrel'] = mkItem(att.tactical, att.tactical !== 'none' ? att.tactical : 'No Tactical', 'Attachment', 'Uncommon', 3, 1);
      loadout['att_mag'] = mkItem(att.magazine, att.magazine !== 'none' ? att.magazine : 'No Magazine', 'Attachment', 'Uncommon', 3, 1);
      loadout['att_stock'] = mkItem(att.stock, att.stock !== 'none' ? att.stock : 'No Stock', 'Attachment', 'Uncommon', 3, 1);
      if (att.ammo && att.ammo !== 'none') {
        const ammoDef = ammoRegistry.find((a) => a.id === att.ammo);
        loadout['att_ammo'] = mkItem(att.ammo, ammoDef?.name || att.ammo, 'Ammo', 'Common', 0, 0);
      }
    }
  }

  // secondary weapon
  const swp = build.secondaryWeapon;
  if (swp && swp.blueprintId && swp.blueprintId !== 'none') {
    loadout['secondary'] = mkItem(swp.blueprintId, findWeaponName(swp.blueprintId), weaponRegistry.find((x) => x.id === swp.blueprintId)?.family || 'AR', 'Legendary', swp.tier, swp.stars);
    loadout['secondary_mod'] = mkItem(build.mods?.weapon || build.modSelections?.weaponCore || '', 'Weapon Mod', 'Mod', 'Rare');
    if (swp.calibration && swp.calibration !== 'none') {
      loadout['secondary_calibration'] = { id: swp.calibration, name: swp.calibration.charAt(0).toUpperCase() + swp.calibration.slice(1) + ' Calibration', category: 'Calibration', rarity: 'Rare', tier: 0, stars: 0 };
    }
    const satt = swp.attachments;
    if (satt) {
      loadout['sec_att_muzzle'] = mkItem(satt.muzzle, satt.muzzle !== 'none' ? satt.muzzle : 'No Muzzle', 'Attachment', 'Uncommon', 3, 1);
      loadout['sec_att_sight'] = mkItem(satt.optic, satt.optic !== 'none' ? satt.optic : 'No Optic', 'Attachment', 'Uncommon', 3, 1);
      loadout['sec_att_barrel'] = mkItem(satt.tactical, satt.tactical !== 'none' ? satt.tactical : 'No Tactical', 'Attachment', 'Uncommon', 3, 1);
      loadout['sec_att_mag'] = mkItem(satt.magazine, satt.magazine !== 'none' ? satt.magazine : 'No Magazine', 'Attachment', 'Uncommon', 3, 1);
      loadout['sec_att_stock'] = mkItem(satt.stock, satt.stock !== 'none' ? satt.stock : 'No Stock', 'Attachment', 'Uncommon', 3, 1);
      if (satt.ammo && satt.ammo !== 'none') {
        const ammoDef = ammoRegistry.find((a) => a.id === satt.ammo);
        loadout['sec_att_ammo'] = mkItem(satt.ammo, ammoDef?.name || satt.ammo, 'Ammo', 'Common', 0, 0);
      }
    }
  }

  // armor
  const armor = build.armor;
  const armorSlotMap: Record<string, string> = { head: 'helmet', mask: 'mask', chest: 'chest', gloves: 'gloves', pants: 'pants', boots: 'boots' };
  const armorSlotDisplay: Record<string, string> = { head: 'Helmet', mask: 'Mask', chest: 'Chest', gloves: 'Gloves', pants: 'Pants', boots: 'Boots' };
  for (const [slot, loadoutKey] of Object.entries(armorSlotMap)) {
    const piece = armor[slot as keyof typeof armor];
    const id = typeof piece === 'string' ? piece : piece?.id || '';
    loadout[loadoutKey] = mkItem(id, findArmorName(id), armorSlotDisplay[slot], 'Epic', typeof piece === 'object' ? (piece.tier || 4) : 4, typeof piece === 'object' ? (piece.stars || 3) : 3);
    const modId = build.mods?.[slot] || build.modSelections?.[`${slot}Core` as keyof typeof build.modSelections] || '';
    loadout[`${loadoutKey}_mod`] = mkItem(modId, modId || `${armorSlotDisplay[slot]} Mod`, 'Mod', 'Rare');
  }

  // cradle perks
  if (build.cradle?.perks) {
    build.cradle.perks.forEach((perkId, i) => {
      if (i < 8) {
        loadout[`cradle_${i + 1}`] = mkItem(perkId, perkId, 'Cradle Perk', 'Epic');
      }
    });
  }

  // deviant
  if (build.deviant && build.deviant.id && build.deviant.id !== 'none') {
    loadout['deviation'] = mkItem(build.deviant.id, build.deviant.id, 'Deviation', 'Legendary');
  }

  // food
  if (build.food) {
    if (build.food.food && build.food.food !== 'none') {
      loadout['food'] = mkItem(build.food.food, build.food.food, 'Food', 'Rare');
    }
    if (build.food.drink && build.food.drink !== 'none') {
      loadout['drink'] = mkItem(build.food.drink, build.food.drink, 'Drink', 'Rare');
    }
  }

  return loadout;
}
