// src/ui/compatibility/armorCompatibilityResolver.ts

import type { LegalityResult, LoadoutContext } from './types';
import { getArmorById } from '../registries/armorRegistry';
import { normalizeArmorSlot } from '../selectors/normalization';

export function validateArmorForSlot(
 slot: string,
 armorId: string,
 context: LoadoutContext
): LegalityResult {
 const armor = getArmorById(armorId);
 if (!armor) {
  return {
   status: "INVALID",
   issues: [{ code: "ARMOR_NOT_FOUND", message: `Armor not found: ${armorId}`, severity: "error" }]
  };
 }

 const expectedSlot = normalizeArmorSlot(slot);
 const actualSlot = normalizeArmorSlot(armor.slot || armor.category || '');

 if (actualSlot === expectedSlot) {
  return { status: "VALID", issues: [] };
 }

 return {
  status: "INVALID",
  issues: [{
   code: "WRONG_ARMOR_SLOT",
   message: `${armor.name || armorId} belongs in ${actualSlot} slot, not ${slot}`,
   severity: "error"
  }]
 };
}
