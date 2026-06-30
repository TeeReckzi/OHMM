import type { OhdbWeapon } from './ohdb_types';
import { getAllOhdbWeapons } from './image_resolver';

export interface WeaponFamilyGroup {
  family: string;
  members: OhdbWeapon[];
}

export function getWeaponFamilyMembers(family: string): OhdbWeapon[] {
  const all = getAllOhdbWeapons();
  return all.filter(w => w.family === family);
}

export function getWeaponFamilyForWeapon(weaponId: string): WeaponFamilyGroup | null {
  const all = getAllOhdbWeapons();
  const weapon = all.find(w => w.slug === weaponId);
  if (!weapon) return null;

  const members = getWeaponFamilyMembers(weapon.family);
  return {
    family: weapon.family,
    members
  };
}

export function getAllWeaponFamilies(): string[] {
  const all = getAllOhdbWeapons();
  return [...new Set(all.map(w => w.family))];
}
