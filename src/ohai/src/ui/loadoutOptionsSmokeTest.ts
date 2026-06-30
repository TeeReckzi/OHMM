import { weaponRegistry } from './registries/weaponRegistry';
import { getAmmo } from './registries/ammoRegistry';
import {
 applyWeaponSelection,
 buildFilteredAttachmentOptions,
 defaultAmmoByCategory,
 getFilteredAmmoOptions,
 repairWeaponAmmoSelection,
} from './loadoutOptions';
import type { BuildSelection } from './types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
 if (condition) {
  console.log(` PASS ${label}`);
  passed++;
 } else {
  console.error(` FAIL ${label}`);
  failed++;
 }
}

console.log('\n=== Loadout Options Smoke Test ===\n');

const weaponWithAmmo = weaponRegistry.find((weapon) => weapon.defaultAmmoCategory !== 'none' && weapon.allowedAmmoCategories.length > 0);
const noAmmoWeapon = weaponRegistry.find((weapon) => weapon.defaultAmmoCategory === 'none');

console.log('Test 1: default ammo mapping is internally valid');
for (const [category, ammoId] of Object.entries(defaultAmmoByCategory)) {
 if (category === 'none') {
  assert(ammoId === 'none', 'none ammo category maps to none');
  continue;
 }

 const ammo = getAmmo(ammoId);
 assert(Boolean(ammo), `${category} default ammo id exists: ${ammoId}`);
 assert(ammo?.ammoCategory === category, `${ammoId} has expected category ${category}`);
}

console.log('\nTest 2: filtered ammo options honor weapon allowed categories');
if (weaponWithAmmo) {
 const ammoOptions = getFilteredAmmoOptions(weaponWithAmmo.id);
 assert(ammoOptions.length > 0, `${weaponWithAmmo.name} has compatible ammo options`);
 assert(ammoOptions.every((option) => option.id !== 'none'), 'firearm ammo options do not include none');
 assert(
  ammoOptions.every((option) => {
   const ammo = getAmmo(option.id);
   return ammo ? weaponWithAmmo.allowedAmmoCategories.includes(ammo.ammoCategory) : false;
  }),
  'all firearm ammo options are allowed by canonical weapon categories',
 );
} else {
 console.log(' SKIP No firearm with ammo categories found');
}

console.log('\nTest 3: no-ammo weapons only expose no-ammo option');
if (noAmmoWeapon) {
 const ammoOptions = getFilteredAmmoOptions(noAmmoWeapon.id);
 assert(ammoOptions.length === 1, `${noAmmoWeapon.name} exposes exactly one ammo option`);
 assert(ammoOptions[0].id === 'none', `${noAmmoWeapon.name} exposes none ammo`);
} else {
 console.log(' SKIP No no-ammo weapon found');
}

console.log('\nTest 4: repairWeaponAmmoSelection replaces incompatible ammo');
if (weaponWithAmmo) {
 const build: BuildSelection = {
  id: 'test-build',
  label: 'Test Build',
  role: 'attacker',
  weapon: {
   blueprintId: weaponWithAmmo.id,
   stars: 1,
   tier: 1,
   calibration: 'Test',
   attachments: {
    optic: 'none',
    muzzle: 'none',
    magazine: 'none',
    tactical: 'none',
    stock: 'none',
    ammo: 'arrow',
   },
  },
  armor: {
   head: 'empty',
   mask: 'empty',
   chest: 'empty',
   gloves: 'empty',
   pants: 'empty',
   boots: 'empty',
  },
  mods: {},
  cradle: { perks: [] },
  deviant: { id: 'none', level: 1, activityRating: 1, trait: '' },
  food: {
   food: 'none',
   drink: 'none',
   chefRex: {
    enabled: false,
    skillRating: 1,
    activityRating: 1,
    bonusPercent: 0,
    mode: 'manual',
   },
  },
 };

 const repaired = repairWeaponAmmoSelection(build, weaponWithAmmo.id);
 const repairedAmmo = getAmmo(repaired.weapon.attachments.ammo);
 assert(repaired.weapon.blueprintId === weaponWithAmmo.id, 'weapon id is preserved during repair');
 assert(Boolean(repairedAmmo), 'repaired ammo id resolves to ammo definition');
 assert(
  repairedAmmo ? weaponWithAmmo.allowedAmmoCategories.includes(repairedAmmo.ammoCategory) : false,
  'repaired ammo category is compatible with selected weapon',
 );
} else {
 console.log(' SKIP No firearm available for repair test');
}

console.log('\nTest 5: attachment option builder always includes ammo and base attachment slots');
if (weaponWithAmmo) {
 const options = buildFilteredAttachmentOptions(weaponWithAmmo.id);
 for (const slot of ['optic', 'muzzle', 'magazine', 'tactical', 'stock', 'ammo']) {
  assert(Array.isArray(options[slot]), `${slot} options exist`);
  assert(options[slot].length > 0, `${slot} options are non-empty`);
 }
} else {
 console.log(' SKIP No firearm available for attachment option test');
}

// ---------------------------------------------------------------------------
// Attachment/Ammo regression tests (per ownership audit)
// ---------------------------------------------------------------------------
console.log('\nTest 6: weapon swap keeps valid ammo when compatible');
if (weaponWithAmmo) {
 const validAmmoBuild: BuildSelection = {
  ...{
   id: 'reg-test',
   label: 'Reg Test',
   role: 'attacker' as const,
   weapon: {
    blueprintId: weaponWithAmmo.id,
    stars: 3 as any,
    tier: 4 as any,
    calibration: 'Test',
    attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'copper-ammo' },
   },
   armor: { head: 'none', mask: 'none', chest: 'none', gloves: 'none', pants: 'none', boots: 'none' },
   mods: {},
   modSelections: undefined,
   cradle: { perks: [] },
   deviant: { id: 'none', level: 1, activityRating: 1, trait: '' },
   food: { food: 'none', drink: 'none', chefRex: { enabled: false, skillRating: 1 as any, activityRating: 1 as any, bonusPercent: 0, mode: 'manual' as const } },
  },
 };
 // assume copper-ammo is compatible for many; use same weapon swap to "keep"
 const kept = applyWeaponSelection(validAmmoBuild, weaponWithAmmo.id);
 assert(kept.weapon.attachments.ammo === 'copper-ammo', 'valid ammo is kept on weapon swap to compatible');
} else {
 console.log(' SKIP No suitable weapon for keep-valid test');
}

console.log('\nTest 7: weapon swap repairs invalid ammo');
if (weaponWithAmmo) {
 const invalidAmmoBuild: BuildSelection = {
  id: 'reg-test2',
  label: 'Reg Test2',
  role: 'attacker',
  weapon: {
   blueprintId: weaponWithAmmo.id,
   stars: 3 as any,
   tier: 4 as any,
   calibration: 'Test',
   attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'arrow' },
  },
  armor: { head: 'none', mask: 'none', chest: 'none', gloves: 'none', pants: 'none', boots: 'none' },
  mods: {},
  modSelections: undefined,
  cradle: { perks: [] },
  deviant: { id: 'none', level: 1, activityRating: 1, trait: '' },
  food: { food: 'none', drink: 'none', chefRex: { enabled: false, skillRating: 1 as any, activityRating: 1 as any, bonusPercent: 0, mode: 'manual' as const } },
 };
 const repaired = applyWeaponSelection(invalidAmmoBuild, weaponWithAmmo.id);
 const repairedA = getAmmo(repaired.weapon.attachments.ammo);
 assert(repaired.weapon.attachments.ammo !== 'arrow', 'invalid ammo is replaced');
 assert(repairedA ? weaponWithAmmo.allowedAmmoCategories.includes(repairedA.ammoCategory) : false, 'repaired ammo is compatible');
} else {
 console.log(' SKIP No suitable weapon for repair test');
}

console.log('\nTest 8: weapon swap to no-ammo weapon forces none');
if (noAmmoWeapon && weaponWithAmmo) {
 const firearmBuild: BuildSelection = {
  id: 'reg-test3',
  label: 'Reg Test3',
  role: 'attacker',
  weapon: {
   blueprintId: weaponWithAmmo.id,
   stars: 3 as any,
   tier: 4 as any,
   calibration: 'Test',
   attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'copper-ammo' },
  },
  armor: { head: 'none', mask: 'none', chest: 'none', gloves: 'none', pants: 'none', boots: 'none' },
  mods: {},
  modSelections: undefined,
  cradle: { perks: [] },
  deviant: { id: 'none', level: 1, activityRating: 1, trait: '' },
  food: { food: 'none', drink: 'none', chefRex: { enabled: false, skillRating: 1 as any, activityRating: 1 as any, bonusPercent: 0, mode: 'manual' as const } },
 };
 const toNoAmmo = applyWeaponSelection(firearmBuild, noAmmoWeapon.id);
 assert(toNoAmmo.weapon.attachments.ammo === 'none', 'swap to no-ammo weapon forces ammo=none');
} else {
 console.log(' SKIP No firearm + no-ammo pair for this test');
}

console.log('\n' + '='.repeat(60));
if (failed === 0) {
 console.log(`Loadout options smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
 console.error(`Loadout options smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
 process.exit(1);
}
console.log('='.repeat(60) + '\n');
