import type { SelectorSlotId, ReadinessState, SlotValidationResult } from './selectorTypes';
import { getItemReadinessState } from './itemReadiness';
import { normalizeArmorSlot, normalizeWeaponFamily } from './normalization';

interface BuildContext {
 primaryWeaponId?: string;
 selectedCoreMods?: Record<string, string>;
}

export function validateSlotSelection(
 slotId: SelectorSlotId,
 item: any,
 context: BuildContext = {}
): SlotValidationResult {
 const result: SlotValidationResult = {
  slot: slotId,
  valid: true,
  missingInputs: [],
  blockedReasons: [],
  warnings: [],
 };

 // Weapon slot rules
 if (['primaryWeapon', 'secondaryWeapon'].includes(slotId)) {
  const fam = normalizeWeaponFamily(item?.family || '');
  if (!fam || fam === 'melee') {
   result.blockedReasons.push('not a ranged weapon');
   result.valid = false;
  }
 }
 if (slotId === 'meleeWeapon') {
  const fam = normalizeWeaponFamily(item?.family || '');
  if (fam && fam !== 'melee') {
   result.blockedReasons.push('not a melee weapon');
   result.valid = false;
  }
 }

 // Armor slot rules
 if (['helmet', 'mask', 'gloves', 'torso', 'legs', 'boots'].includes(slotId)) {
  const itemSlot = normalizeArmorSlot(item?.slot || item?.category || '');
  if (itemSlot !== slotId && itemSlot !== normalizeArmorSlot(slotId)) {
   result.blockedReasons.push(`wrong armor slot: ${itemSlot} vs ${slotId}`);
   result.valid = false;
  }
 }

 // Mod rules (core + suffix completeness)
 if (slotId.includes('Suffix')) {
  const coreSlot = slotId.replace('Suffix', 'CoreMod') as SelectorSlotId;
  if (!context.selectedCoreMods?.[coreSlot]) {
   result.blockedReasons.push('suffix requires matching core mod');
   result.valid = false;
  }
 }

 // Ammo / calibration / attachment require primary weapon
 if (['ammo', 'calibration', 'optic', 'muzzle', 'magazine', 'tactical', 'stock'].includes(slotId)) {
  if (!context.primaryWeaponId) {
   result.blockedReasons.push('select a primary weapon first');
   result.valid = false;
  }
 }

 // Readiness from existing resolver
 const readiness = getItemReadinessState(item, { slot: slotId, selectedWeaponId: context.primaryWeaponId });
 result.missingInputs = readiness.missingInputs;
 result.blockedReasons.push(...readiness.blockedReasons);
 if (result.blockedReasons.length > 0) result.valid = false;

 return result;
}
