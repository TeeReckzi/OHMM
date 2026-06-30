import {
  calibrationGlobalConfigRegistry,
  getCalibrationConfigValue,
  getMaxWeaponCalibrationSlots,
  getWeaponBlueprintCalibration,
  weaponBlueprintCalibrationRegistry,
} from "./weaponCalibrationRegistry";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

assert(
  weaponBlueprintCalibrationRegistry.length === 1075,
  `Expected 1075 weapon blueprint calibration rows, got ${weaponBlueprintCalibrationRegistry.length}`
);

assert(
  calibrationGlobalConfigRegistry.length === 14,
  `Expected 14 calibration global config rows, got ${calibrationGlobalConfigRegistry.length}`
);

const de50Level1 = getWeaponBlueprintCalibration(13111101, 1);
assert(de50Level1, "Expected calibration row for blueprint 13111101 level 1");
assert(de50Level1?.perkSlotCalibrationMax === 2, "Expected blueprint 13111101 level 1 to have 2 calibration slots");
assert(de50Level1?.presetAttackRatio === 1, "Expected blueprint 13111101 level 1 attack ratio to be 1");

const de50Level3Slots = getMaxWeaponCalibrationSlots(13111101, 3);
assert(de50Level3Slots === 4, "Expected blueprint 13111101 level 3 to have 4 calibration slots");

const gunPhases = getCalibrationConfigValue<number[]>("calibration_phase_gun");
assert(Array.isArray(gunPhases), "Expected calibration_phase_gun to be an array");
assert(gunPhases !== undefined && gunPhases.join(",") === "4,7,10", `Unexpected calibration_phase_gun: ${gunPhases?.join(",")}`);

console.log("PASS: weapon calibration recovered registry");
