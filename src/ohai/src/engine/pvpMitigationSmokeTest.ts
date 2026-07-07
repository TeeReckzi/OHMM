/**
 * PvP Mitigation Smoke Test — Phase 2.1
 *
 * Validates PvP mitigation engine behavior:
 * - Safety Sandwich 20% base reduction
 * - Chef Rex adjustment (38% default, 42% max only on manual override)
 * - PvP vs PvE context
 * - playerDMGReduction does not affect outgoing DPS
 * - No silent application of display-only mitigation
 * - Clamping at 100%
 */

import { buildCalculationInputFromSelection } from "../ui/formulaBridge";
import type { BuildSelection } from "../ui/types";

let PASS = 0;
let FAIL = 0;

function assert(condition: boolean, label: string) {
  if (condition) { PASS++; /* console.log(`  PASS ${label}`); */ }
  else { FAIL++; console.error(`  FAIL ${label}`); }
}

function assertEq<T>(a: T, b: T, label: string) {
  if (a === b) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
}

function assertIncludes(arr: string[], substr: string, label: string) {
  const found = arr.some((s) => s.includes(substr));
  if (found) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}: expected array to include "${substr}", got [${arr.join(", ")}]`); }
}

function assertNotIncludes(arr: string[], substr: string, label: string) {
  const found = arr.some((s) => s.includes(substr));
  if (!found) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}: expected array NOT to include "${substr}", got [${arr.join(", ")}]`); }
}

function resultsSummary(kind: string) {
  console.log(`  ${kind} Results: ${PASS}/${PASS + FAIL} passed`);
}

// ── Helper: minimal build with defaults ──

function makeBuild(overrides?: Partial<BuildSelection>): BuildSelection {
  const base: BuildSelection = {
    id: "test-build",
    label: "Test Build",
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
    deviant: { id: "none", trait: "" },
    food: {
      food: "none",
      drink: "none",
      chefRex: { enabled: false, bonusPercent: 0 },
    },
  };
  if (overrides) {
    return { ...base, ...overrides };
  }
  return base;
}

function makeBuildFoodOnly(foodId: string, drinkId: string): Pick<BuildSelection, "food"> {
  return {
    food: {
      food: foodId,
      drink: drinkId,
      chefRex: { enabled: false, bonusPercent: 0 },
    },
  };
}

function makeBuildChefRex(foodId: string, bonusPercent: number): Pick<BuildSelection, "food"> {
  return {
    food: {
      food: foodId,
      drink: "none",
      chefRex: { enabled: true, bonusPercent },
    },
  };
}

// ── Reset counters ──
PASS = 0;
FAIL = 0;

console.log("\n=== PvP Mitigation Smoke Test ===\n");

// 1. Safety Sandwich does nothing in PvE mode
console.log("--- Safety Sandwich in PvE ---");
const pveSandwich = buildCalculationInputFromSelection(
  makeBuild(makeBuildFoodOnly("safety-sandwich", "none")),
  "pve",
);
assertEq(pveSandwich.pvpMitigation.sources.length, 0, "safety-pve: 0 mitigation sources in PvE mode");
assertEq(pveSandwich.pvpMitigation.totalReductionPercent, 0, "safety-pve: 0% total reduction in PvE mode");
assertEq(pveSandwich.pvpMitigation.finalDamageTaken, pveSandwich.pvpMitigation.incomingDamageExample, "safety-pve: final damage equals incoming in PvE mode");

// 2. Safety Sandwich applies 20% base in PvP mode
console.log("\n--- Safety Sandwich in PvP ---");
const pvpSandwich = buildCalculationInputFromSelection(
  makeBuild(makeBuildFoodOnly("safety-sandwich", "none")),
  "pvp",
);
assertEq(pvpSandwich.pvpMitigation.sources.length, 1, "safety-pvp: 1 mitigation source in PvP mode");
assert(pvpSandwich.pvpMitigation.sources.length > 0 && pvpSandwich.pvpMitigation.sources[0].finalReductionPercent > 0, "safety-pvp: final reduction > 0%");
const baseReduction = pvpSandwich.pvpMitigation.sources.length > 0 ? pvpSandwich.pvpMitigation.sources[0].finalReductionPercent : 0;
assertEq(baseReduction, 20, "safety-pvp: base 20% reduction without Chef Rex");
assertEq(pvpSandwich.pvpMitigation.pvpMode, true, "safety-pvp: pvpMode is true");

// 3. Chef Rex 38% adjusts Safety Sandwich correctly
console.log("\n--- Safety Sandwich + Chef Rex 38% ---");
const chefRex38 = buildCalculationInputFromSelection(
  makeBuild(makeBuildChefRex("safety-sandwich", 38)),
  "pvp",
);
assertEq(chefRex38.pvpMitigation.sources.length, 1, "chef-rex-38: 1 mitigation source");
const adj38 = chefRex38.pvpMitigation.sources.length > 0 ? chefRex38.pvpMitigation.sources[0].finalReductionPercent : 0;
assert(adj38 > 20, "chef-rex-38: reduction > 20% with Chef Rex bonus");
assert(adj38 < 30, "chef-rex-38: reduction < 30% with 38% Chef Rex (expected ~27.6%)");
const expected38 = Math.round(20 * (1 + 38 / 100) * 100) / 100;
assertEq(adj38, expected38, `chef-rex-38: expected ${expected38}%`);

// 4. Chef Rex 42% only when manually set (produces warning)
console.log("\n--- Safety Sandwich + Chef Rex 42% (manual override) ---");
const chefRex42 = buildCalculationInputFromSelection(
  makeBuild(makeBuildChefRex("safety-sandwich", 42)),
  "pvp",
);
const adj42 = chefRex42.pvpMitigation.sources.length > 0 ? chefRex42.pvpMitigation.sources[0].finalReductionPercent : 0;
const expected42 = Math.round(20 * (1 + 42 / 100) * 100) / 100;
assertEq(adj42, expected42, `chef-rex-42: expected ${expected42}%`);
assertNotIncludes(chefRex42.formulaWarnings, "42%", "chef-rex-42: no clamp warning for exactly 42%");

// Chef Rex 43% (above realistic max) should emit warning
console.log("\n--- Safety Sandwich + Chef Rex 43% (above realistic max) ---");
const chefRex43 = buildCalculationInputFromSelection(
  makeBuild(makeBuildChefRex("safety-sandwich", 43)),
  "pvp",
);
assertIncludes(chefRex43.formulaWarnings, "43%", "chef-rex-43: warning emitted for 43% exceeding realistic max 42%");
assertIncludes(chefRex43.formulaWarnings, "Clamping", "chef-rex-43: clamping mentioned in warning");

// 5. playerDMGReduction does not affect outgoing DPS
console.log("\n--- playerDMGReduction excluded from DPS modifiers ---");
const sandwichDPS = buildCalculationInputFromSelection(
  makeBuild(makeBuildFoodOnly("safety-sandwich", "none")),
  "pvp",
);
const hasPlayerDMGInModifiers = sandwichDPS.modifierSources.some((m) => m.stat === "playerDMGReduction");
assert(!hasPlayerDMGInModifiers, "playerDMG-dps: playerDMGReduction not in modifierSources (excluded from DPS)");
const hasPlayerDMGInAggregation = sandwichDPS.aggregationReport.stats.stats.playerDMGReduction !== undefined;
assert(hasPlayerDMGInAggregation, "playerDMG-dps: playerDMGReduction in aggregation report (routed to non-DPS for display)");

// 6. Display-only mitigation does not silently apply
console.log("\n--- Display-only mitigation items ---");
const displayFood = buildCalculationInputFromSelection(
  makeBuild(makeBuildFoodOnly("all-weather-stew", "none")),
  "pvp",
);
assertEq(displayFood.pvpMitigation.sources.length, 0, "display-mit: no mitigation sources from display-only item");
assert(displayFood.formulaWarnings.length > 0, "display-mit: warnings present for display-only item");

// 7. Empty mitigation sources return no reduction
console.log("\n--- Empty mitigation ---");
const emptyMitigation = buildCalculationInputFromSelection(
  makeBuild(),
  "pvp",
);
assertEq(emptyMitigation.pvpMitigation.sources.length, 0, "empty-mit: 0 mitigation sources with no items");
assertEq(emptyMitigation.pvpMitigation.totalReductionPercent, 0, "empty-mit: 0% total reduction");
assertEq(emptyMitigation.pvpMitigation.finalDamageTaken, emptyMitigation.pvpMitigation.incomingDamageExample, "empty-mit: final damage equals incoming");

// 8. Total reduction is clamped safely
console.log("\n--- Reduction clamping ---");
// Simulate multiple high-reduction sources via the direct module
import { computePvPMitigation } from "../ui/pvpMitigation";
const clampedResult = computePvPMitigation(
  [
    { value: 0.60, itemId: "test-a", itemName: "Test A", confidence: "estimated" as const },
    { value: 0.50, itemId: "test-b", itemName: "Test B", confidence: "estimated" as const },
  ],
  0,
  "pvp",
  1000,
);
assert(clampedResult.totalReductionPercent <= 100, "clamp: total reduction <= 100%");
assertEq(clampedResult.totalReductionPercent, 100, "clamp: 60% + 50% = 100% (clamped)");
assertEq(clampedResult.finalDamageTaken, 0, "clamp: final damage is 0 at 100% reduction");
assertIncludes(clampedResult.warnings, "100%", "clamp: warning emitted for 100% clamp");

// 9. Bridge emits PvP mode warning when no mitigation sources
console.log("\n--- PvP mode warnings ---");
const noMitPvP = buildCalculationInputFromSelection(
  makeBuild(),
  "pvp",
);
assertIncludes(noMitPvP.formulaWarnings, "No PvP mitigation", "pvp-no-mit: warning about no mitigation sources");

// 10. PvE mode warning about ignored PvP-only items
console.log("\n--- PvE mode ignores PvP-only mitigation ---");
const pveWithSandwich = buildCalculationInputFromSelection(
  makeBuild(makeBuildFoodOnly("safety-sandwich", "none")),
  "pve",
);
assertIncludes(pveWithSandwich.formulaWarnings, "PvP-only mitigation", "pve-ignore: PvP-only warning emitted in PvE mode");

// 11. CalculationInput still reports total items considered via the bridge
console.log("\n--- Bridge returns complete CalculationInput ---");
const fullResult = buildCalculationInputFromSelection(
  makeBuild(makeBuildFoodOnly("safety-sandwich", "none")),
  "pvp",
);
assert(fullResult.totalItemsConsidered >= 0, "bridge-complete: totalItemsConsidered is valid");
assert(fullResult.totalModifiersExtracted >= 0, "bridge-complete: totalModifiersExtracted is valid");

// 12. Only playerDMGReduction modifiers route to mitigation (not dmgReduction)
console.log("\n--- Only playerDMGReduction to mitigation ---");
const aggReport = fullResult.aggregationReport;
// playerDMGReduction should be in aggregation report but NOT in DPS modifierSources
assert(aggReport.stats.stats.playerDMGReduction !== undefined, "route-correct: playerDMGReduction in aggregation (non-DPS display)");
const hasPlayerDMGInMods = fullResult.modifierSources.some((m) => m.stat === "playerDMGReduction");
assert(!hasPlayerDMGInMods, "route-correct: playerDMGReduction excluded from DPS modifierSources");

console.log("\n" + "=".repeat(50));
resultsSummary("PvP Mitigation");
console.log("");

// Exit with failure if any test failed
if (FAIL > 0) {
  process.exit(1);
}
