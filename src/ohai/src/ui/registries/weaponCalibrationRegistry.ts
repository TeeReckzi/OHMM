import {
  OFFICIAL_CALIBRATION_CONFIG_BY_KEY,
  OFFICIAL_RUNTIME_CATALOG,
  OFFICIAL_WEAPON_BLUEPRINT_CALIBRATION_BY_ID,
} from "../data/recovered/officialRuntime.generated";

export interface WeaponBlueprintCalibrationRow {
  id: string;
  blueprintNo: number;
  strengthLv: number;
  perkSlotCalibrationMax: number;
  presetAttackRatio: number;
  baseAttrs: readonly { attrId: string; value: number }[];
  fixedSkillCode: string;
  fixedSkillLv: number;
  needFragNum: number;
  needTokenNum: number;
  upgradeCostCoins: number;
  unlockedItems: readonly unknown[];
  unlockedPicPath: string;
  rawKey: string;
  source: string;
}

export interface CalibrationGlobalConfigRow {
  key: string;
  value: unknown;
  source: string;
}

export const weaponBlueprintCalibrationRegistry =
  OFFICIAL_RUNTIME_CATALOG.weaponBlueprintCalibrations as readonly unknown[] as readonly WeaponBlueprintCalibrationRow[];

export const calibrationGlobalConfigRegistry =
  OFFICIAL_RUNTIME_CATALOG.calibrationGlobalConfig as readonly unknown[] as readonly CalibrationGlobalConfigRow[];

const weaponBlueprintCalibrationById = OFFICIAL_WEAPON_BLUEPRINT_CALIBRATION_BY_ID as Map<string, unknown>;
const calibrationConfigByKey = OFFICIAL_CALIBRATION_CONFIG_BY_KEY as Map<string, unknown>;

export function getWeaponBlueprintCalibration(
  blueprintNo: number,
  strengthLv: number
): WeaponBlueprintCalibrationRow | undefined {
  return weaponBlueprintCalibrationById.get(`${blueprintNo}:${strengthLv}`) as WeaponBlueprintCalibrationRow | undefined;
}

export function listWeaponBlueprintCalibrations(blueprintNo: number): WeaponBlueprintCalibrationRow[] {
  return weaponBlueprintCalibrationRegistry.filter((row) => row.blueprintNo === blueprintNo);
}

export function getMaxWeaponCalibrationSlots(blueprintNo: number, strengthLv: number): number | undefined {
  return getWeaponBlueprintCalibration(blueprintNo, strengthLv)?.perkSlotCalibrationMax;
}

export function getCalibrationConfig(key: string): CalibrationGlobalConfigRow | undefined {
  return calibrationConfigByKey.get(key) as CalibrationGlobalConfigRow | undefined;
}

export function getCalibrationConfigValue<T = unknown>(key: string): T | undefined {
  return getCalibrationConfig(key)?.value as T | undefined;
}
