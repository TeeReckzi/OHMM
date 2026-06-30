/**
 * Smoke test for ammo compatibility resolver
 */

import {
 getWeaponAmmoProfile,
 checkAmmoCompatibility,
 getCompatibleAmmoDefinitions,
 validateWeaponRegistry,
 getAmmoCompatibilityStats,
} from '../registries/ammoCompatibilityResolver';
import { weaponRegistry } from '../registries/weaponRegistry';
import { ammoRegistry } from '../registries/ammoRegistry';

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

console.log('\n=== Ammo Compatibility Resolver Smoke Test ===\n');

// ─── Test 1: Known data quality issues are corrected ─────────────────────────
console.log('Test 1: Known data quality issues are corrected');

{
 const kam = weaponRegistry.find(w => w.id === 'kam');
 if (kam) {
  const profile = getWeaponAmmoProfile(kam);
  assert(
   profile.allowedAmmoCategories.includes('copper'),
   'KAM (base AR) corrected to include copper ammo'
  );
  assert(
   profile.allowedAmmoCategories.includes('steel'),
   'KAM (base AR) corrected to include steel ammo'
  );
  assert(
   profile.defaultAmmoCategory === 'copper',
   'KAM (base AR) default ammo corrected to copper'
  );
  assert(
   profile.dataQualityIssues.length > 0,
   'KAM (base AR) reports data quality issue'
  );
  assert(
   profile.confidence === 'high',
   'KAM correction has high confidence'
  );
 } else {
  console.log(' SKIP KAM not found in registry');
 }
}

{
 const mg4 = weaponRegistry.find(w => w.id === 'mg4-scorched-earth');
 if (mg4) {
  const profile = getWeaponAmmoProfile(mg4);
  assert(
   profile.allowedAmmoCategories.includes('copper'),
   'MG4 - Scorched Earth corrected to include copper ammo'
  );
  assert(
   profile.defaultAmmoCategory === 'copper',
   'MG4 - Scorched Earth default ammo corrected to copper'
  );
  assert(
   profile.dataQualityIssues.length > 0,
   'MG4 - Scorched Earth reports data quality issue'
  );
 } else {
  console.log(' SKIP MG4 - Scorched Earth not found in registry');
 }
}

// ─── Test 2: Melee weapons correctly have no ammo ────────────────────────────
console.log('\nTest 2: Melee weapons correctly have no ammo');

{
 const meleeWeapons = weaponRegistry.filter(w => w.family === 'Melee');
 assert(meleeWeapons.length > 0, `Found ${meleeWeapons.length} melee weapons`);
 
 for (const weapon of meleeWeapons.slice(0, 3)) { // Test first 3
  const profile = getWeaponAmmoProfile(weapon);
  assert(
   profile.allowedAmmoCategories.includes('none'),
   `${weapon.name} (Melee) has "none" ammo category`
  );
  assert(
   profile.dataQualityIssues.length === 0,
   `${weapon.name} (Melee) has no data quality issues`
  );
 }
}

// ─── Test 3: Ammo compatibility checking ─────────────────────────────────────
console.log('\nTest 3: Ammo compatibility checking');

{
 const ar = weaponRegistry.find(w => w.family === 'AR' && !w.id.includes('kam'));
 if (ar) {
  const profile = getWeaponAmmoProfile(ar);
  const copperResult = checkAmmoCompatibility(ar, 'copper');
  assert(
   copperResult.compatible === true,
   `${ar.name} (AR) is compatible with copper ammo`
  );
  assert(
   copperResult.confidence === 'high' || copperResult.confidence === 'medium',
   'Compatibility check has valid confidence'
  );
  
  const arrowResult = checkAmmoCompatibility(ar, 'arrow');
  assert(
   arrowResult.compatible === false,
   `${ar.name} (AR) is NOT compatible with arrow ammo`
  );
 } else {
  console.log(' SKIP No AR found for testing');
 }
}

{
 const bow = weaponRegistry.find(w => w.family === 'Crossbow' || w.family === 'Bow');
 if (bow) {
  const profile = getWeaponAmmoProfile(bow);
  const arrowResult = checkAmmoCompatibility(bow, 'arrow');
  assert(
   arrowResult.compatible === true,
   `${bow.name} (${bow.family}) is compatible with arrow ammo`
  );
 } else {
  console.log(' SKIP No bow/crossbow found for testing');
 }
}

// ─── Test 4: Get compatible ammo definitions ────────────────────────────────
console.log('\nTest 4: Get compatible ammo definitions');

{
 const ar = weaponRegistry.find(w => w.family === 'AR');
 if (ar) {
  const compatibleAmmo = getCompatibleAmmoDefinitions(ar);
  assert(
   compatibleAmmo.length > 0,
   `${ar.name} (AR) has ${compatibleAmmo.length} compatible ammo types`
  );
  assert(
   compatibleAmmo.some(a => a.ammoCategory === 'copper'),
   'Compatible ammo includes copper'
  );
  assert(
   !compatibleAmmo.some(a => a.ammoCategory === 'arrow'),
   'Compatible ammo does NOT include arrow'
  );
 }
}

{
 const melee = weaponRegistry.find(w => w.family === 'Melee');
 if (melee) {
  const compatibleAmmo = getCompatibleAmmoDefinitions(melee);
  assert(
   compatibleAmmo.length === 1,
   `${melee.name} (Melee) has exactly 1 compatible ammo type (none)`
  );
  assert(
   compatibleAmmo[0].ammoCategory === 'none',
   'Melee weapon compatible ammo is "none"'
  );
 }
}

// ─── Test 5: Registry validation ─────────────────────────────────────────────
console.log('\nTest 5: Registry validation');

{
 const validation = validateWeaponRegistry();
 assert(
  validation.totalWeapons > 0,
  `Registry has ${validation.totalWeapons} weapons`
 );
 assert(
  validation.weaponsWithIssues >= 0,
  `${validation.weaponsWithIssues} weapons have known issues`
 );
 
 if (validation.issues.length > 0) {
  console.log(` INFO Known issues:`);
  for (const issue of validation.issues.slice(0, 3)) {
   console.log(`  - ${issue.weaponName}: ${issue.issues.join(', ')}`);
  }
 }
}

// ─── Test 6: Ammo compatibility statistics ───────────────────────────────────
console.log('\nTest 6: Ammo compatibility statistics');

{
 const stats = getAmmoCompatibilityStats();
 assert(
  stats.totalWeapons > 0,
  `Total weapons: ${stats.totalWeapons}`
 );
 assert(
  stats.weaponsWithNoAmmo > 0,
  `Weapons with no ammo: ${stats.weaponsWithNoAmmo}`
 );
 assert(
  stats.weaponsByAmmoType.copper > 0,
  `Weapons using copper ammo: ${stats.weaponsByAmmoType.copper}`
 );
 
 console.log(` INFO Ammo type distribution:`);
 console.log(`  - Copper: ${stats.weaponsByAmmoType.copper}`);
 console.log(`  - Steel: ${stats.weaponsByAmmoType.steel}`);
 console.log(`  - AP: ${stats.weaponsByAmmoType.ap}`);
 console.log(`  - Demolition: ${stats.weaponsByAmmoType.demolition}`);
 console.log(`  - Arrow: ${stats.weaponsByAmmoType.arrow}`);
 console.log(`  - None: ${stats.weaponsByAmmoType.none}`);
}

// ─── Test 7: No "elemental bullets" in registry ──────────────────────────────
console.log('\nTest 7: No placeholder ammo in registry');

{
 const hasElementalBullets = ammoRegistry.some(a => 
  a.name.toLowerCase().includes('elemental') ||
  a.id.toLowerCase().includes('elemental')
 );
 assert(
  !hasElementalBullets,
  'No "elemental bullets" found in ammo registry'
 );
 
 const allAmmoCategories = new Set(ammoRegistry.map(a => a.ammoCategory));
 assert(
  allAmmoCategories.size <= 6,
  `Ammo registry has ${allAmmoCategories.size} categories (expected <= 6)`
 );
}

// ─── Test 8: Confidence and source metadata ──────────────────────────────────
console.log('\nTest 8: Confidence and source metadata');

{
 const ar = weaponRegistry.find(w => w.family === 'AR');
 if (ar) {
  const profile = getWeaponAmmoProfile(ar);
  assert(
   profile.confidence === 'high' || profile.confidence === 'medium' || profile.confidence === 'low',
   `Profile has valid confidence: ${profile.confidence}`
  );
  assert(
   profile.source === 'official' || profile.source === 'community' || profile.source === 'inferred' || profile.source === 'unknown',
   `Profile has valid source: ${profile.source}`
  );
  assert(
   Array.isArray(profile.notes),
   'Profile has notes array'
  );
 }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
if (failed === 0) {
 console.log(`Ammo compatibility smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
 console.error(`Ammo compatibility smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
 process.exit(1);
}
console.log('='.repeat(60) + '\n');
