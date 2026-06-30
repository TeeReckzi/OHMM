import type { BuildSelection } from '../types';
import { modOptions, modSuffixOptions } from '../data/catalog';
import { getValidSuffixesForModCore } from '../registries/modSuffixLegality';

export function logAssetDebugSummary(build: BuildSelection) {
 if (typeof window === 'undefined' || !(window as any).__OHDB_DEBUG__) return;

 console.group('[Asset Debug Summary]');

 // Check weapons
 console.log('Weapons with missing images:', 'See console warnings above');

 // Check armor
 console.log('Armor with missing images:', 'See console warnings above');

 // Check mods
 console.log('Mods with missing images:', 'See console warnings above');

 // Check mod slots with zero options after filtering
 const slots = ['weapon', 'head', 'mask', 'chest', 'gloves', 'pants', 'boots'];
 const zeroOptionSlots: string[] = [];

 for (const slot of slots) {
  const coreKey = `${slot}Core` as keyof typeof build.modSelections;
  const coreValue = build.modSelections?.[coreKey];
  if (coreValue) {
   const validSuffixes = getValidSuffixesForModCore(coreValue);
   const filtered = (modSuffixOptions[slot] ?? []).filter(s => validSuffixes.includes(s.id));
   if (filtered.length === 0) {
    zeroOptionSlots.push(slot);
   }
  }
 }

 if (zeroOptionSlots.length > 0) {
  console.warn('Mod slots with zero options after filtering:', zeroOptionSlots);
 }

 // Check invalid default build ids (legacy mods map)
 const invalidLegacyMods: string[] = [];
 for (const slot of slots) {
  const modId = build.mods?.[slot as keyof typeof build.mods];
  if (modId && modId !== 'none') {
   const coreOptions = modOptions[slot] ?? [];
   const suffixOptions = modSuffixOptions[slot] ?? [];
   const exists = [...coreOptions, ...suffixOptions].some(o => o.id === modId);
   if (!exists) {
    invalidLegacyMods.push(`${slot}:${modId}`);
   }
  }
 }

 if (invalidLegacyMods.length > 0) {
  console.warn('Invalid default build legacy mod ids:', invalidLegacyMods);
 }

 console.groupEnd();
}
