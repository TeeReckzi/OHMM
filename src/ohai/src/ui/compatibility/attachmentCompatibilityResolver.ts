// src/ui/compatibility/attachmentCompatibilityResolver.ts

import type { LegalityResult, LoadoutContext } from './types';
import { getWeapon } from '../registries/weaponRegistry';
import { getAttachmentsBySlotAndFamily } from '../registries/attachmentRegistry';

export function validateAttachmentForSlot(
 slot: string,
 attachmentId: string,
 context: LoadoutContext
): LegalityResult {
 const weapon = getWeapon(context.primaryWeaponId);
 if (!weapon) {
  return {
   status: "INVALID",
   issues: [{ code: "NO_PRIMARY_WEAPON", message: "Select a primary weapon first", severity: "error" }]
  };
 }

 const family = weapon.family?.toLowerCase();
 const validAttachments = getAttachmentsBySlotAndFamily(slot as any, family);

 const isValid = validAttachments.some(a => a.id === attachmentId);

 if (isValid) {
  return { status: "VALID", issues: [] };
 }

 return {
  status: "INVALID",
  issues: [{
   code: "ATTACHMENT_INCOMPATIBLE",
   message: `${attachmentId} is not compatible with ${family} weapons`,
   severity: "error"
  }]
 };
}
