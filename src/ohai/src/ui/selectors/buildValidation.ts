import type { BuildValidationResult, SelectorSlotId } from './selectorTypes';
import { validateSlotSelection } from './slotValidation';
import { getCalibrationOptionsForWeapon } from './calibrationResolver';

interface BuildLike {
 weapon: { blueprintId: string };
 armor: Record<string, string | { id: string; stars?: number; tier?: number }>;
 mods?: Record<string, { core?: string; suffix?: string }>;
 calibration?: string;
 attachments?: Record<string, string>;
}

export function validateBuildSelections(build: BuildLike): BuildValidationResult {
 const slots: Record<string, any> = {};
 const critical: string[] = [];
 const warnings: string[] = [];

 // Primary weapon
 const primaryWeapon = { id: build.weapon.blueprintId };
 const wRes = validateSlotSelection('primaryWeapon', primaryWeapon, { primaryWeaponId: build.weapon.blueprintId });
 slots.primaryWeapon = wRes;
 if (!wRes.valid) critical.push('primaryWeapon');

 // Calibration
 const calRes = validateSlotSelection('calibration', { id: build.calibration }, { primaryWeaponId: build.weapon.blueprintId });
 slots.calibration = calRes;

 // Armor slots
 const getArmorId = (v: any) => (typeof v === 'string' ? v : v?.id || '');
 (['helmet','mask','gloves','torso','legs','boots'] as const).forEach((slot) => {
  const armorId = getArmorId(build.armor[slot]);
  const res = validateSlotSelection(slot, { id: armorId, slot }, {});
  slots[slot] = res;
  if (!res.valid) critical.push(slot);
 });

 // Mod completeness (core + suffix)
 if (build.mods) {
  Object.keys(build.mods).forEach((slot) => {
   const core = build.mods![slot]?.core;
   const suffix = build.mods![slot]?.suffix;
   if (core && !suffix) {
    warnings.push(`${slot} core mod missing suffix`);
   }
  });
 }

 return {
  overallReady: critical.length === 0,
  slots: slots as any,
  criticalMissing: critical,
  warnings,
 };
}
