import type { BuildSelection } from './types';
import type { CatalogItem } from './data/catalog';
import { attachmentOptions } from './data/catalog';
import { getAmmo } from './registries/ammoRegistry';
import { getWeapon as getRegistryWeapon } from './registries/weaponRegistry';
import { getAttachmentsBySlotAndFamily } from './registries/attachmentRegistry';
import type { AttachmentSlot } from './itemTypes';

const ATTACHMENT_SLOTS: AttachmentSlot[] = ['optic', 'muzzle', 'magazine', 'tactical', 'stock'];

const noAttachmentOptionBySlot: Record<AttachmentSlot, CatalogItem> = {
  optic: {
    id: 'none',
    name: 'No Optic',
    description: 'No optic modifier selected.',
    effects: ['Baseline sight behavior'],
    slot: 'optic',
  },
  muzzle: {
    id: 'none',
    name: 'No Muzzle',
    description: 'No muzzle modifier selected.',
    effects: ['Baseline recoil and spread behavior'],
    slot: 'muzzle',
  },
  magazine: {
    id: 'none',
    name: 'No Magazine',
    description: 'No magazine modifier selected.',
    effects: ['Baseline magazine behavior'],
    slot: 'magazine',
  },
  tactical: {
    id: 'none',
    name: 'No Tactical Attachment',
    description: 'No tactical modifier selected.',
    effects: ['Baseline handling'],
    slot: 'tactical',
  },
  stock: {
    id: 'none',
    name: 'No Stock',
    description: 'No stock modifier selected.',
    effects: ['Baseline stability'],
    slot: 'stock',
  },
};

export const defaultAmmoByCategory: Record<string, string> = {
  copper: 'copper-ammo',
  steel: 'steel-ammo',
  ap: 'ap-ammo',
  demolition: 'demolition-ammo',
  arrow: 'arrow',
  none: 'none',
};

function toAttachmentCatalogItem(slot: AttachmentSlot, attachment: { id: string; name: string; iconUrl?: string; effectSummary?: string }): CatalogItem {
  return {
    id: attachment.id,
    name: attachment.name,
    iconUrl: attachment.iconUrl,
    category: 'attachment',
    slot,
    effects: attachment.effectSummary ? [attachment.effectSummary] : undefined,
  };
}

export function getFilteredAmmoOptions(weaponId: string): CatalogItem[] {
  const regWeapon = getRegistryWeapon(weaponId);
  if (!regWeapon || regWeapon.defaultAmmoCategory === 'none') {
    return [
      attachmentOptions.ammo.find((opt) => opt.id === 'none') ?? {
        id: 'none',
        name: 'No Ammo Required',
        description: 'This weapon does not use ammunition.',
        effects: [],
        slot: 'ammo',
      },
    ];
  }

  const allowed = new Set(regWeapon.allowedAmmoCategories);
  return attachmentOptions.ammo.filter((opt) => {
    if (opt.id === 'none') return false;
    const ammoDef = getAmmo(opt.id);
    return ammoDef ? allowed.has(ammoDef.ammoCategory) : false;
  });
}

export function buildFilteredAttachmentOptions(weaponId: string): Record<string, CatalogItem[]> {
  const regWeapon = getRegistryWeapon(weaponId);
  const base: Record<string, CatalogItem[]> = { ...attachmentOptions };

  if (regWeapon && regWeapon.family !== 'Crossbow') {
    for (const slot of ATTACHMENT_SLOTS) {
      base[slot] = [
        noAttachmentOptionBySlot[slot],
        ...getAttachmentsBySlotAndFamily(slot, regWeapon.family).map((attachment) =>
          toAttachmentCatalogItem(slot, attachment),
        ),
      ];
    }
  }

  base.ammo = getFilteredAmmoOptions(weaponId);
  return base;
}

/**
 * Single authority for weapon selection (Phase 1).
 * Changes the weapon and repairs ammo to a compatible value (or 'none').
 * This is the one place that should handle weapon + ammo mutation for selection actions.
 */
export function applyWeaponSelection(build: BuildSelection, newBlueprintId: string): BuildSelection {
  const newWeapon = getRegistryWeapon(newBlueprintId);
  if (!newWeapon) {
    return { ...build, weapon: { ...build.weapon, blueprintId: newBlueprintId } };
  }

  const compatibleAmmo = getFilteredAmmoOptions(newBlueprintId);
  const currentAmmoCompatible = compatibleAmmo.some((ammo) => ammo.id === build.weapon.attachments.ammo);
  const defaultAmmoId = compatibleAmmo.length > 0 ? compatibleAmmo[0].id : 'none';

  return {
    ...build,
    weapon: {
      ...build.weapon,
      blueprintId: newBlueprintId,
      attachments: {
        ...build.weapon.attachments,
        ammo: currentAmmoCompatible ? build.weapon.attachments.ammo : defaultAmmoId,
      },
    },
  };
}

/**
 * @deprecated Use applyWeaponSelection instead.
 * Kept for backward compat in tests and during migration.
 */
export function repairWeaponAmmoSelection(build: BuildSelection, newBlueprintId: string): BuildSelection {
  return applyWeaponSelection(build, newBlueprintId);
}
