// src/ui/compatibility/ammoCompatibilityResolver.ts

import type { LegalityResult, LoadoutContext } from './types';
import type { AmmoCategory } from '../itemTypes';
import { getWeapon } from '../registries/weaponRegistry';
import { getAmmo, isAmmoCompatible } from '../registries/ammoRegistry';

const AMMO_CATEGORIES = new Set<AmmoCategory>([
 "copper", "steel", "ap", "demolition", "arrow", "none"
]);

function isAmmoCategory(value: unknown): value is AmmoCategory {
 return typeof value === "string" && AMMO_CATEGORIES.has(value as AmmoCategory);
}

export function validateAmmo(
 ammoId: string,
 context: LoadoutContext
): LegalityResult {
 const weapon = getWeapon(context.primaryWeaponId);
 if (!weapon) {
  return {
   status: "INVALID",
   issues: [{ code: "NO_PRIMARY_WEAPON", message: "Select a primary weapon first", severity: "error" }]
  };
 }

 const rawCategory = getAmmo(ammoId)?.ammoCategory;
 const ammoCat: AmmoCategory | null = isAmmoCategory(rawCategory) ? rawCategory : null;
 const compatible = ammoCat ? isAmmoCompatible(weapon.defaultAmmoCategory, ammoCat) : false;

 if (compatible) {
  return { status: "VALID", issues: [] };
 }

 return {
  status: "INVALID",
  issues: [{
   code: "AMMO_INCOMPATIBLE",
   message: `${ammoId} is not compatible with ${weapon.name}`,
   severity: "error"
  }]
 };
}
