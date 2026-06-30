import type { CanonicalWeapon } from '../itemTypes';

export interface CalibrationOption {
 id: string;
 name: string;
 family?: string;
 readiness: 'READY' | 'BLOCKED';
 blockedReason?: string;
}

export interface CalibrationResolverResult {
 options: CalibrationOption[];
 selectedWeaponFamily?: string;
 metadataAvailable: boolean;
 warning?: string;
}

export function getCalibrationOptionsForWeapon(
 selectedWeapon: CanonicalWeapon | undefined,
 allCalibrations: any[] = []
): CalibrationResolverResult {
 if (!selectedWeapon) {
  return {
   options: [],
   metadataAvailable: false,
   warning: 'Select a primary weapon first',
  };
 }

 const family = (selectedWeapon.family || '').toLowerCase() || undefined;

 if (!allCalibrations || allCalibrations.length === 0) {
  return {
   options: [],
   selectedWeaponFamily: family,
   metadataAvailable: false,
   warning: 'No calibration metadata registry is available yet.',
  };
 }

 return {
  options: allCalibrations.map((c) => {
   const calFamily = (c.family || '').toLowerCase();
   const compatible = !calFamily || calFamily === family;
   return {
    id: c.id,
    name: c.name,
    family: c.family,
    readiness: compatible ? 'READY' : 'BLOCKED',
    blockedReason: compatible ? undefined : `incompatible with ${family}`,
   };
  }),
  selectedWeaponFamily: family,
  metadataAvailable: true,
 };
}
