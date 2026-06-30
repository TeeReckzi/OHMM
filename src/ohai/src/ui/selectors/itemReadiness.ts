import type { ReadinessState, SelectorItemViewModel } from './selectorTypes';
import type { CanonicalWeapon, CanonicalArmor, CanonicalMod } from '../itemTypes';

interface ReadinessContext {
 slot: string;
 selectedWeaponId?: string;
 selectedCoreModId?: string;
}

export function getItemReadinessState(
 item: any,
 context: ReadinessContext
): {
 state: ReadinessState;
 missingInputs: string[];
 blockedReasons: string[];
 warnings: string[];
 confidence?: string;
 sourceLabel?: string;
} {
 const missing: string[] = [];
 const blocked: string[] = [];
 const warnings: string[] = [];

 // Weapon readiness
 if (item.family || item.damagePerProjectile != null) {
  if (!item.damagePerProjectile && !item.baseDamage) missing.push('damage');
  if (!item.fireRate) missing.push('fireRate');
  if (!item.family) missing.push('family');

  if (missing.length === 0) {
   return {
    state: 'READY',
    missingInputs: [],
    blockedReasons: [],
    warnings,
    confidence: item.confidence,
    sourceLabel: item.sourceNotes,
   };
  }
  return {
   state: missing.length > 0 ? 'PARTIAL' : 'READY',
   missingInputs: missing,
   blockedReasons: blocked,
   warnings,
   confidence: item.confidence,
  };
 }

 // Armor readiness (including slug-only items when context is armor slot)
 const isArmorContext = ['helmet','mask','gloves','torso','legs','boots'].includes(context.slot);
 if (item.slot || item.armorSet || isArmorContext) {
  if (!item.name && !item.displayName) missing.push('displayName');
  return {
   state: missing.length === 0 ? 'READY' : 'PARTIAL',
   missingInputs: missing,
   blockedReasons: blocked,
   warnings,
   confidence: item.confidence,
  };
 }

 // Mod readiness (core + suffix rule)
 if (item.modType || context.slot.includes('Mod') || context.slot.includes('Suffix')) {
  if (context.slot.includes('Suffix') && !context.selectedCoreModId) {
   blocked.push('suffix requires core mod');
   return {
    state: 'BLOCKED',
    missingInputs: [],
    blockedReasons: blocked,
    warnings,
   };
  }
  if (!item.name) missing.push('mod name');
  const hasSuffix = context.slot.includes('Suffix');
  return {
   state: hasSuffix ? 'READY' : 'PARTIAL',
   missingInputs: missing,
   blockedReasons: blocked,
   warnings: hasSuffix ? [] : ['suffix required for complete mod'],
   confidence: item.confidence,
  };
 }

 // Default fallback
 return {
  state: 'DISPLAY_ONLY',
  missingInputs: ['unknown item type'],
  blockedReasons: blocked,
  warnings,
 };
}
