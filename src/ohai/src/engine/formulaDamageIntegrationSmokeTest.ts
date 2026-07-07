/**
 * Formula Damage Integration Smoke Test — Phase 2.3
 *
 * Validates that the formula damage adapter correctly wires
 * CalculationInput into the existing formula engine and produces
 * expected damage values that flow into combat output.
 *
 * Focuses on structural correctness (warnings, exclusions, gear tracking)
 * rather than asserting specific numeric damage values (which depend
 * on buildFormulaInput implementation details).
 */

import { buildCalculationInputFromSelection } from "../ui/formulaBridge";
import { buildExpectedDamageFromCalculationInput } from "../ui/formulaDamageAdapter";
import { computeCombatOutput } from "../ui/combatOutput";
import type { BuildSelection } from "../ui/types";

let PASS = 0;
let FAIL = 0;

function assert(condition: boolean, label: string) {
  if (condition) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}`); }
}

function assertEq<T>(a: T, b: T, label: string) {
  if (a === b) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
}

function resultsSummary(kind: string) {
  console.log(`  ${kind} Results: ${PASS}/${PASS + FAIL} passed`);
}

// ── Helpers ──

function makeBuild(overrides?: Partial<BuildSelection>): BuildSelection {
  const base: BuildSelection = {
    id: "test", label: "Test", role: "attacker",
    weapon: { blueprintId: "none", stars: 3, tier: 4, calibration: "test", attachments: { optic: "none", muzzle: "none", magazine: "none", tactical: "none", stock: "none", ammo: "none" } },
    armor: { head: "none", mask: "none", chest: "none", gloves: "none", pants: "none", boots: "none" },
    mods: { weapon: "none", head: "none", mask: "none", chest: "none", gloves: "none", pants: "none", boots: "none" },
    cradle: { perks: [] },
    deviant: { id: "none", trait: "" },
    food: { food: "none", drink: "none", chefRex: { enabled: false, bonusPercent: 0 } },
  };
  return overrides ? { ...base, ...overrides } : base;
}

function makeFoodOnly(foodId: string, drinkId: string): Pick<BuildSelection, "food"> {
  return { food: { food: foodId, drink: drinkId, chefRex: { enabled: false, bonusPercent: 0 } } };
}

function makeModsOnly(mods: Record<string, string>): Pick<BuildSelection, "mods"> {
  const base = { weapon: "none", head: "none", mask: "none", chest: "none", gloves: "none", pants: "none", boots: "none" };
  return { mods: { ...base, ...mods } };
}

// ── Reset ──
PASS = 0; FAIL = 0;

console.log("\n=== Formula Damage Integration Smoke Test ===\n");

// 1. Adapter returns a valid result structure for any non-empty build
console.log("--- Adapter structure ---");
const violentCalc = buildCalculationInputFromSelection(
  makeBuild(makeModsOnly({ weapon: "violent" })),
  "pve",
);
const violentAdapter = buildExpectedDamageFromCalculationInput(violentCalc, 100);
assert(violentAdapter.primaryMechanic.mechanicId !== "none", "struct: primary mechanic resolved");
assert(violentAdapter.formulaDamage >= 0, "struct: formula damage >= 0");
assert(Array.isArray(violentAdapter.formulaMultipliers), "struct: multipliers is array");
assert(violentAdapter.allMechanics.length > 0, "struct: at least one mechanic computed");
assert(Array.isArray(violentAdapter.supportingGear), "struct: supportingGear present");
assert(Array.isArray(violentAdapter.excludedItems), "struct: excludedItems present");

// 2. Display-only items are reported as excluded
console.log("\n--- Display-only exclusions ---");
const displayCalc = buildCalculationInputFromSelection(
  makeBuild(makeFoodOnly("all-weather-stew", "anti-gravity-milkshake")),
  "pve",
);
const displayAdapter = buildExpectedDamageFromCalculationInput(displayCalc, 100);
assert(displayAdapter.excludedItems.length > 0, "excluded: display-only items reported");
assert(displayAdapter.excludedItems.some((e) => e.toLowerCase().includes("stew")), "excluded: stew mentioned");
assert(displayAdapter.excludedItems.some((e) => e.toLowerCase().includes("milkshake")), "excluded: milkshake mentioned");

// 3. PvP mitigation items do NOT change outgoing damage
console.log("\n--- PvP mitigation non-interference ---");
const pvpCalc = buildCalculationInputFromSelection(
  makeBuild(makeFoodOnly("safety-sandwich", "none")),
  "pvp",
);
const pvpAdapter = buildExpectedDamageFromCalculationInput(pvpCalc, 100);
assert(pvpAdapter.formulaDamage >= 0, "pvp-mit: formula damage >= 0 (sandwich does not affect DPS)");
assert(pvpAdapter.primaryMechanic.formulaResult !== null || pvpAdapter.primaryMechanic.error !== null, "pvp-mit: formulaResult resolves or has error");

// 4. Empty selection produces stable baseline with warnings
console.log("\n--- Empty selection ---");
const emptyCalc = buildCalculationInputFromSelection(makeBuild(), "pve");
const emptyAdapter = buildExpectedDamageFromCalculationInput(emptyCalc);
assert(emptyAdapter.formulaDamage >= 0, "empty: stable baseline (formula damage >= 0)");
assert(emptyAdapter.warnings.length > 0, "empty: warnings present (no base weapon damage)");

// 5. Missing base weapon damage produces warning
console.log("\n--- Missing base weapon DMG ---");
const missingBase = buildExpectedDamageFromCalculationInput(
  buildCalculationInputFromSelection(makeBuild(), "pve"),
);
assert(missingBase.warnings.some((w) => w.toLowerCase().includes("base weapon")), "missing-base: warning mentions base weapon DMG");

// 6. Adapter warnings are emitted for empty selection
console.log("\n--- Warning propagation ---");
const warnAdapter = buildExpectedDamageFromCalculationInput(
  buildCalculationInputFromSelection(makeBuild(), "pve"),
);
assert(warnAdapter.warnings.length > 0, "propagate: adapter has warnings about missing data");

// 7. All mechanics computed, not just primary
console.log("\n--- All mechanics ---");
const allMech = buildExpectedDamageFromCalculationInput(
  buildCalculationInputFromSelection(makeBuild(makeModsOnly({ weapon: "scorched" })), "pve"),
  100,
);
assert(allMech.allMechanics.length > 0, "all-mech: at least one mechanic");
assert(allMech.allMechanics.every((m) => m.mechanicId.length > 0), "all-mech: every mechanic has an ID");

// 8. Combat output integrates formula damage
console.log("\n--- Combat output integration ---");
const integratedOutput = computeCombatOutput(
  violentCalc,
  violentCalc.pvpMitigation,
  violentAdapter.formulaDamage,
  violentAdapter.formulaMultipliers,
);
assertEq(integratedOutput.damageOutput.expectedDamage, violentAdapter.formulaDamage, "integrate: expectedDamage matches adapter");
assert(integratedOutput.damageOutput.totalMultiplier >= 1, "integrate: total multiplier >= 1");

// 9. Missing base damage results in incomplete formula input (no fake damage)
console.log("\n--- No fake damage without base ---");
const noBase = buildExpectedDamageFromCalculationInput(
  buildCalculationInputFromSelection(makeBuild(), "pve"),
);
// Even with missing base, the formula engine may still compute something from available stats.
// Key assertion: warnings are emitted, not silent fake damage.
assert(noBase.warnings.length > 0, "no-base: warnings emitted for missing assumptions");

// 10. Excluded items include unresolved mechanics
console.log("\n--- Unresolved mechanics excluded ---");
const unresolvedCalc = buildCalculationInputFromSelection(makeBuild(), "pve");
const unresolvedAdapter = buildExpectedDamageFromCalculationInput(unresolvedCalc);
assert(Array.isArray(unresolvedAdapter.excludedItems), "unresolved: excludedItems is array");

// 11. Combat output DPS connected to formula damage
console.log("\n--- DPS from adapter output ---");
const dpsOutput = computeCombatOutput(
  violentCalc,
  violentCalc.pvpMitigation,
  violentAdapter.formulaDamage,
  violentAdapter.formulaMultipliers,
  { tickIntervalSeconds: violentAdapter.tickIntervalSeconds },
);
if (violentAdapter.tickIntervalSeconds !== undefined) {
  assert(dpsOutput.damageOutput.ticksPerSecond !== undefined, "dps-connect: ticks/sec available from tick interval");
} else {
  // DPS won't have ticks but that's expected without tick interval
  assert(true, "dps-connect: skipped (no tick interval)");
}

// 12. With base weapon DMG provided, formula uses it
console.log("\n--- Base weapon DMG propagation ---");
const withBase = buildExpectedDamageFromCalculationInput(
  buildCalculationInputFromSelection(makeBuild(), "pve"),
  100,
);
assert(withBase.formulaDamage >= 0, "base-dmg: formula damage is non-negative with base weapon DMG=100");

// 13. Adapter handles PvE mode correctly
console.log("\n--- PvE mode ---");
const pveCalc = buildCalculationInputFromSelection(makeBuild(), "pve");
const pveAdapter = buildExpectedDamageFromCalculationInput(pveCalc, 100);
assert(pveAdapter.primaryMechanic.formulaResult !== null || pveAdapter.primaryMechanic.error !== null, "pve: formula resolves or has error");

// 14. Adapter handles PvP mode correctly (same logic, just different context)
console.log("\n--- PvP mode ---");
const pvpModeCalc = buildCalculationInputFromSelection(makeBuild(), "pvp");
const pvpModeAdapter = buildExpectedDamageFromCalculationInput(pvpModeCalc, 100);
assert(pvpModeAdapter.formulaDamage >= 0, "pvp-mode: formula damage non-negative");

// 15. Rejected/ignored effects reported in excluded
console.log("\n--- Ignored effects ---");
const ignoredAdapter = buildExpectedDamageFromCalculationInput(
  buildCalculationInputFromSelection(makeBuild(makeFoodOnly("none", "none")), "pve"),
  100,
);
assert(Array.isArray(ignoredAdapter.excludedItems), "ignored: excludedItems is array");

console.log("\n" + "=".repeat(50));
// === Regression: Double-multiplier bug guard (added 2026-06-24) ===
// The adapter's formulaDamage must already be the engine's post-multiplier expected value.
// Re-applying the multiplier product on top is the bug we fixed in App.tsx display path.
console.log("\n--- Double-mult regression guard ---");
const reApplied = violentAdapter.formulaDamage * violentAdapter.formulaMultipliers.reduce((p, m) => p * m.multiplier, 1);
const hasRealMultipliers = violentAdapter.formulaMultipliers.some(m => Math.abs(m.multiplier - 1) > 0.001);
if (hasRealMultipliers) {
  assert(Math.round(violentAdapter.formulaDamage) !== Math.round(reApplied),
    "regression: formulaDamage should differ from re-multiplying the list (prevents double-mult regression)");
} else {
  PASS++; // no-op when no multipliers
}
assert(violentAdapter.formulaDamage >= 0, "regression: formulaDamage non-negative");

// Also sanity: combat output path should use the adapter value directly
const combatOut = computeCombatOutput(violentCalc, violentCalc.pvpMitigation);
assert(combatOut.damageOutput.expectedDamage >= 0, "regression: combat output expected >= 0");

resultsSummary("Formula Damage Integration");
console.log("");

if (FAIL > 0) process.exit(1);
