import { weaponRegistry } from "./weaponRegistry";
import { ammoRegistry, isAmmoCompatible, getAmmo } from "./ammoRegistry";
import { buildCalculationInputFromSelection } from "../formulaBridge";
import type { BuildSelection } from "../types";

let passCount = 0;
let totalTests = 0;

function check(desc: string, ok: boolean, detail?: string): void {
 totalTests++;
 if (ok) passCount++;
 console.log(` ${ok ? "PASS" : "FAIL"} ${desc}`);
 if (!ok && detail) console.log(`    ${detail}`);
}

function makeBuild(overrides?: Partial<BuildSelection>): BuildSelection {
 const base: BuildSelection = {
  id: "ammo-test",
  label: "Ammo Test",
  role: "attacker",
  weapon: {
   blueprintId: "none",
   stars: 3,
   tier: 4,
   calibration: "test",
   attachments: { optic: "none", muzzle: "none", magazine: "none", tactical: "none", stock: "none", ammo: "none" },
  },
  armor: { head: "none", mask: "none", chest: "none", gloves: "none", pants: "none", boots: "none" },
  mods: { weapon: "none", head: "none", mask: "none", chest: "none", gloves: "none", pants: "none", boots: "none" },
  cradle: { perks: [] },
  deviant: { id: "none", level: 1, activityRating: 1, trait: "" },
  food: {
   food: "none",
   drink: "none",
   chefRex: { enabled: false, skillRating: 1, activityRating: 1, bonusPercent: 0, mode: "manual" },
  },
 };
 if (overrides) return { ...base, ...overrides };
 return base;
}

console.log("\n=== Ammo Validation Smoke Test ===\n");

// 1. Every weapon has ammo compatibility metadata
console.log("--- Every weapon has ammo fields ---");
for (const weapon of weaponRegistry) {
 check(
  `${weapon.id}: allowedAmmoCategories is array`,
  Array.isArray(weapon.allowedAmmoCategories) && weapon.allowedAmmoCategories.length > 0,
 );
 check(
  `${weapon.id}: defaultAmmoCategory is set`,
  typeof weapon.defaultAmmoCategory === "string" && weapon.defaultAmmoCategory.length > 0,
 );
 check(
  `${weapon.id}: defaultAmmoCategory is in allowed list`,
  weapon.allowedAmmoCategories.includes(weapon.defaultAmmoCategory),
 );
}

// 2. Ammo registry entries exist
console.log("\n--- Ammo registry ---");
for (const ammo of ammoRegistry) {
 check(
  `${ammo.id}: has ammoCategory`,
  typeof ammo.ammoCategory === "string" && ammo.ammoCategory.length > 0,
 );
 check(
  `${ammo.id}: has compatibleWeaponFamilies`,
  Array.isArray(ammo.compatibleWeaponFamilies),
 );
}

// 3. Incompatible ammo cannot enter formula input
console.log("\n--- Formula bridge ammo checks ---");

// Shotgun with arrow ammo should emit warning
const shotgunBuild = makeBuild({
 weapon: { ...makeBuild().weapon, blueprintId: "acs12-corrosion", attachments: { ...makeBuild().weapon.attachments, ammo: "arrow" } },
});
const shotgunResult = buildCalculationInputFromSelection(shotgunBuild, "pve");
check(
 "Shotgun with arrow ammo emits warning",
 shotgunResult.formulaWarnings.some((w) => w.includes("not compatible")),
);

// Bow with no ammo (none) should emit warning
const bowBuild = makeBuild({
 weapon: { ...makeBuild().weapon, blueprintId: "compound-bow-burden-of-betrayal", attachments: { ...makeBuild().weapon.attachments, ammo: "none" } },
});
const bowResult = buildCalculationInputFromSelection(bowBuild, "pve");
check(
 "Bow with none ammo emits warning",
 bowResult.formulaWarnings.some((w) => w.includes("not compatible")),
);

// Compatible ammo should not emit warning
const pistolOk = makeBuild({
 weapon: { ...makeBuild().weapon, blueprintId: "r500-memento", attachments: { ...makeBuild().weapon.attachments, ammo: "copper-ammo" } },
});
const pistolOkResult = buildCalculationInputFromSelection(pistolOk, "pve");
check(
 "Pistol with pistol ammo no warning",
 !pistolOkResult.formulaWarnings.some((w) => w.includes("not compatible")),
);

// 4. isAmmoCompatible helper works
console.log("\n--- Compatibility helper ---");
check(
 "copper === copper: compatible",
 isAmmoCompatible("copper", "copper"),
);
check(
 "copper !== steel: incompatible",
 !isAmmoCompatible("copper", "steel"),
);
check(
 "ap !== demolition: incompatible",
 !isAmmoCompatible("ap", "demolition"),
);
check(
 "arrow !== copper: incompatible",
 !isAmmoCompatible("arrow", "copper"),
);
check(
 "none === none: compatible",
 isAmmoCompatible("none", "none"),
);
check(
 "none !== copper: incompatible",
 !isAmmoCompatible("none", "copper"),
);

// Summary
console.log(`\nAmmo Validation Results: ${passCount}/${totalTests} passed`);
if (passCount === totalTests) {
 console.log("All ammo validation checks PASSED.\n");
} else {
 console.log(`WARNING: ${totalTests - passCount} checks FAILED.\n`);
}
