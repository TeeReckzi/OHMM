// src/ui/compatibility/loadoutLegalityEngine.ts

import type {
 ILoadoutLegalityEngine,
 LegalityResult,
 LoadoutContext,
 LegalityStatus
} from './types';

import { validateAttachmentForSlot } from './attachmentCompatibilityResolver';
import { validateAmmo } from './ammoCompatibilityResolver';
import { validateArmorForSlot } from './armorCompatibilityResolver';
import { validateModForSlot, isModComplete as checkModComplete } from './modCompatibilityResolver';
import { validateWeaponForSlot } from './weaponCompatibilityResolver';

export class LoadoutLegalityEngine implements ILoadoutLegalityEngine {

 validateItemForSlot(slot: string, itemId: string, context: LoadoutContext): LegalityResult {
  const lowerSlot = slot.toLowerCase();

  // Weapon slots
  if (['primaryweapon', 'secondaryweapon', 'meleeweapon'].includes(lowerSlot)) {
   const weaponSlot = lowerSlot as 'primaryWeapon' | 'secondaryWeapon' | 'meleeWeapon';
   return validateWeaponForSlot(weaponSlot, itemId, context);
  }

  // Attachment slots
  if (['optic', 'muzzle', 'magazine', 'tactical', 'stock'].includes(lowerSlot)) {
   return validateAttachmentForSlot(lowerSlot, itemId, context);
  }

  // Ammo
  if (lowerSlot === 'ammo') {
   return validateAmmo(itemId, context);
  }

  // Armor slots
  if (['helmet', 'mask', 'gloves', 'torso', 'legs', 'boots'].includes(lowerSlot)) {
   return validateArmorForSlot(lowerSlot, itemId, context);
  }

  // Mod slots (core or suffix)
  if (lowerSlot.includes('coremod') || lowerSlot.includes('suffix')) {
   return validateModForSlot(lowerSlot, itemId, context);
  }

  // Default: allow (future: add more resolvers)
  return { status: "VALID", issues: [] };
 }

 validateLoadout(context: LoadoutContext): Record<string, LegalityResult> {
  const results: Record<string, LegalityResult> = {};

  // Validate armor
  Object.entries(context.armor).forEach(([slot, itemId]) => {
   if (itemId) {
    results[slot] = this.validateItemForSlot(slot, itemId, context);
   }
  });

  // Validate attachments
  Object.entries(context.attachments).forEach(([slot, itemId]) => {
   if (itemId) {
    results[slot] = this.validateItemForSlot(slot, itemId, context);
   }
  });

  // Validate ammo
  if (context.ammo) {
   results['ammo'] = this.validateItemForSlot('ammo', context.ammo, context);
  }

  // Validate mods (core + suffix)
  Object.keys(context.mods || {}).forEach(slot => {
   const mod = context.mods![slot];
   if (mod.core) {
    results[`${slot}Core`] = this.validateItemForSlot(`${slot}CoreMod`, mod.core, context);
   }
   if (mod.suffix) {
    results[`${slot}Suffix`] = this.validateItemForSlot(`${slot}Suffix`, mod.suffix, context);
   }
  });

  return results;
 }

 isModComplete(slot: string, context: LoadoutContext): boolean {
  return checkModComplete(slot, context);
 }

 getValidAlternatives(slot: string, context: LoadoutContext): string[] {
  // Placeholder – can be expanded later with registry queries
  return [];
 }
}

// Convenience singleton
export const loadoutLegalityEngine = new LoadoutLegalityEngine();
