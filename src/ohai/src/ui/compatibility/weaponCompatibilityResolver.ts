// src/ui/compatibility/weaponCompatibilityResolver.ts

import type { LegalityResult, LoadoutContext } from './types';
import { getWeapon } from '../registries/weaponRegistry';
import { normalizeWeaponFamily } from '../selectors/normalization';

export function validateWeaponForSlot(
 slot: 'primaryWeapon' | 'secondaryWeapon' | 'meleeWeapon',
 weaponId: string,
 context: LoadoutContext
): LegalityResult {
 const weapon = getWeapon(weaponId);
 if (!weapon) {
  return {
   status: "INVALID",
   issues: [{ code: "WEAPON_NOT_FOUND", message: `Weapon not found: ${weaponId}`, severity: "error" }]
  };
 }

 const family = normalizeWeaponFamily(weapon.family || '');

 if (slot === 'meleeWeapon') {
  if (family === 'melee') {
   return { status: "VALID", issues: [] };
  }
  return {
   status: "INVALID",
   issues: [{
    code: "NOT_MELEE_WEAPON",
    message: `${weapon.name} is not a melee weapon`,
    severity: "error"
   }]
  };
 }

 // primaryWeapon or secondaryWeapon
 if (family === 'melee') {
  return {
   status: "INVALID",
   issues: [{
    code: "MELEE_IN_FIREARM_SLOT",
    message: `${weapon.name} is a melee weapon and cannot be used in ${slot}`,
    severity: "error"
   }]
  };
 }

 return { status: "VALID", issues: [] };
}
