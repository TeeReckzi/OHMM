/**
 * Ammo Compatibility Resolver
 * 
 * Centralized logic for determining weapon-ammo compatibility with confidence
 * metadata and source tracking. This resolver validates compatibility decisions
 * and provides testable functions for the UI layer.
 * 
 * Evidence sources:
 * - Official game data (lReDragol weapon_list.json)
 * - Community observations (oncehumandb.com)
 * - In-game verification
 */

import type { AmmoCategory } from '../itemTypes';
import type { CanonicalWeapon } from '../itemTypes';
import { weaponRegistry } from './weaponRegistry';
import { ammoRegistry, type AmmoDefinition } from './ammoRegistry';

export type AmmoCompatibilityConfidence = 'high' | 'medium' | 'low';
export type AmmoCompatibilitySource = 'official' | 'community' | 'inferred' | 'unknown';

export interface AmmoCompatibilityResult {
 compatible: boolean;
 confidence: AmmoCompatibilityConfidence;
 source: AmmoCompatibilitySource;
 reason: string;
 warnings: string[];
}

export interface WeaponAmmoProfile {
 weaponId: string;
 weaponName: string;
 weaponFamily: string;
 allowedAmmoCategories: AmmoCategory[];
 defaultAmmoCategory: AmmoCategory;
 confidence: AmmoCompatibilityConfidence;
 source: AmmoCompatibilitySource;
 notes: string[];
 dataQualityIssues: string[];
}

/**
 * Known data quality issues in the weapon registry.
 * These are weapons where the generated data has incorrect ammo categories.
 */
const KNOWN_DATA_QUALITY_ISSUES: Record<string, {
 issue: string;
 correctAmmoCategories: AmmoCategory[];
 correctDefault: AmmoCategory;
 confidence: AmmoCompatibilityConfidence;
 evidence: string;
}> = {
 'kam': {
  issue: 'Base KAM (AR) incorrectly has allowedAmmoCategories: ["none"]',
  correctAmmoCategories: ['copper', 'steel', 'ap', 'demolition'],
  correctDefault: 'copper',
  confidence: 'high',
  evidence: 'Other KAM variants (Abyss Glance, Crank) correctly have rifle ammo. KAM is an assault rifle.',
 },
 'mg4-scorched-earth': {
  issue: 'MG4 - Scorched Earth (LMG) incorrectly has allowedAmmoCategories: ["none"]',
  correctAmmoCategories: ['copper', 'steel', 'ap', 'demolition'],
  correctDefault: 'copper',
  confidence: 'high',
  evidence: 'Other MG4 variants (Wrath Of Hades) correctly have LMG ammo. MG4 is a light machine gun.',
 },
};

/**
 * Get the corrected ammo profile for a weapon, accounting for known data quality issues.
 */
export function getWeaponAmmoProfile(weapon: CanonicalWeapon): WeaponAmmoProfile {
 const knownIssue = KNOWN_DATA_QUALITY_ISSUES[weapon.id];
 const notes: string[] = [];
 const dataQualityIssues: string[] = [];
 
 let allowedAmmoCategories = weapon.allowedAmmoCategories;
 let defaultAmmoCategory = weapon.defaultAmmoCategory;
 let confidence: AmmoCompatibilityConfidence = 'high';
 let source: AmmoCompatibilitySource = 'official';
 
 if (knownIssue) {
  dataQualityIssues.push(knownIssue.issue);
  notes.push(`Data quality issue corrected: ${knownIssue.evidence}`);
  allowedAmmoCategories = knownIssue.correctAmmoCategories;
  defaultAmmoCategory = knownIssue.correctDefault;
  confidence = knownIssue.confidence;
  source = 'community'; // Corrected based on community observation
 } else if (weapon.sourceNotes?.includes('lReDragol')) {
  source = 'community';
  confidence = 'medium';
  notes.push('Source: lReDragol weapon_list.json (community database)');
 } else if (weapon.sourceNotes?.includes('oncehumandb.com')) {
  source = 'community';
  confidence = 'medium';
  notes.push('Source: oncehumandb.com (community database)');
 } else {
  notes.push('Source: Official game data or manual entry');
 }
 
 // Validate that default ammo is in allowed list
 if (!allowedAmmoCategories.includes(defaultAmmoCategory) && allowedAmmoCategories.length > 0) {
  dataQualityIssues.push(`Default ammo category "${defaultAmmoCategory}" not in allowed list`);
  notes.push(`Warning: Default ammo not in allowed list. Using first allowed category.`);
  defaultAmmoCategory = allowedAmmoCategories[0];
 }
 
 return {
  weaponId: weapon.id,
  weaponName: weapon.name,
  weaponFamily: weapon.family,
  allowedAmmoCategories,
  defaultAmmoCategory,
  confidence,
  source,
  notes,
  dataQualityIssues,
 };
}

/**
 * Check if a specific ammo type is compatible with a weapon.
 */
export function checkAmmoCompatibility(
 weapon: CanonicalWeapon,
 ammoCategory: AmmoCategory
): AmmoCompatibilityResult {
 const profile = getWeaponAmmoProfile(weapon);
 const warnings: string[] = [...profile.dataQualityIssues];
 
 // Special case: "none" ammo category
 if (ammoCategory === 'none') {
  if (profile.allowedAmmoCategories.includes('none') || profile.allowedAmmoCategories.length === 0) {
   return {
    compatible: true,
    confidence: profile.confidence,
    source: profile.source,
    reason: 'Weapon does not require ammunition',
    warnings,
   };
  } else {
   return {
    compatible: false,
    confidence: 'high',
    source: 'official',
    reason: 'Weapon requires ammunition but "none" was selected',
    warnings,
   };
  }
 }
 
 // Check if ammo category is in allowed list
 if (profile.allowedAmmoCategories.includes(ammoCategory)) {
  return {
   compatible: true,
   confidence: profile.confidence,
   source: profile.source,
   reason: `Ammo category "${ammoCategory}" is compatible with ${profile.weaponFamily}`,
   warnings,
  };
 }
 
 return {
  compatible: false,
  confidence: 'high',
  source: 'official',
  reason: `Ammo category "${ammoCategory}" is not compatible with ${profile.weaponFamily}. Allowed: ${profile.allowedAmmoCategories.join(', ')}`,
  warnings,
 };
}

/**
 * Get all compatible ammo definitions for a weapon.
 */
export function getCompatibleAmmoDefinitions(weapon: CanonicalWeapon): AmmoDefinition[] {
 const profile = getWeaponAmmoProfile(weapon);
 
 if (profile.allowedAmmoCategories.includes('none') || profile.allowedAmmoCategories.length === 0) {
  // Weapon doesn't use ammo
  return ammoRegistry.filter(a => a.ammoCategory === 'none');
 }
 
 return ammoRegistry.filter(ammo => 
  profile.allowedAmmoCategories.includes(ammo.ammoCategory)
 );
}

/**
 * Validate all weapons in the registry for ammo compatibility issues.
 */
export function validateWeaponRegistry(): {
 totalWeapons: number;
 weaponsWithIssues: number;
 issues: Array<{
  weaponId: string;
  weaponName: string;
  issues: string[];
 }>;
} {
 const issues: Array<{
  weaponId: string;
  weaponName: string;
  issues: string[];
 }> = [];
 
 for (const weapon of weaponRegistry) {
  const profile = getWeaponAmmoProfile(weapon);
  if (profile.dataQualityIssues.length > 0) {
   issues.push({
    weaponId: weapon.id,
    weaponName: weapon.name,
    issues: profile.dataQualityIssues,
   });
  }
 }
 
 return {
  totalWeapons: weaponRegistry.length,
  weaponsWithIssues: issues.length,
  issues,
 };
}

/**
 * Get summary statistics about ammo compatibility in the registry.
 */
export function getAmmoCompatibilityStats(): {
 totalWeapons: number;
 weaponsByAmmoType: Record<AmmoCategory, number>;
 weaponsWithNoAmmo: number;
 weaponsWithKnownIssues: number;
} {
 const weaponsByAmmoType: Record<AmmoCategory, number> = {
  copper: 0,
  steel: 0,
  ap: 0,
  demolition: 0,
  arrow: 0,
  none: 0,
 };
 
 let weaponsWithNoAmmo = 0;
 let weaponsWithKnownIssues = 0;
 
 for (const weapon of weaponRegistry) {
  const profile = getWeaponAmmoProfile(weapon);
  
  if (profile.dataQualityIssues.length > 0) {
   weaponsWithKnownIssues++;
  }
  
  if (profile.allowedAmmoCategories.includes('none') || profile.allowedAmmoCategories.length === 0) {
   weaponsWithNoAmmo++;
   weaponsByAmmoType.none++;
  } else {
   for (const category of profile.allowedAmmoCategories) {
    weaponsByAmmoType[category]++;
   }
  }
 }
 
 return {
  totalWeapons: weaponRegistry.length,
  weaponsByAmmoType,
  weaponsWithNoAmmo,
  weaponsWithKnownIssues,
 };
}
