/**
 * Phase 4 smoke test — terminal-only damage_formula recipe execution.
 *
 * Tests final_attack = max(base_attack * additional_rate * ignore_dam_rate * special_factor, 0)
 *
 * IMPORTANT: This is terminal-only. Not the full damage_formula graph.
 */

import { createRecipeRuntime } from "./officialFormulaGraphRuntime";
import { DAMAGE_FORMULA_TERMINAL_GRAPH_RECIPE as DAMAGE_FORMULA_TERMINAL_RECIPE } from "./officialFormulaGraphRecipes";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

function assertNear(actual: number, expected: number, label: string, epsilon = 1e-6): void {
  const ok = Math.abs(actual - expected) < epsilon;
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

console.log("\n=== Phase 4 damage_formula Terminal-Only Smoke Test ===");
console.log("NOTE: terminal-only scope — not full formula graph\n");

// --- Basic execution: all rates = 1 ---
console.log("Synthetic test 1: all rates = 1");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("final_attack_additional_rate", 1);
  rt.setLeafValue("final_attack_ignore_dam_rate", 1);
  rt.setLeafValue("final_special_regulate_factor", 1);
  rt.update();

  const result = rt.getTargetValue("final_attack");
  assertNear(typeof result === "number" ? result : -1, 100,
    "final_attack = max(100 * 1 * 1 * 1, 0) = 100");
}

// --- Specified synthetic test from the spec ---
console.log("\nSpecified synthetic test:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("final_attack_additional_rate", 2);
  rt.setLeafValue("final_attack_ignore_dam_rate", 0.5);
  rt.setLeafValue("final_special_regulate_factor", 1);
  rt.update();

  const result = rt.getTargetValue("final_attack");
  // 100 * 2 * 0.5 * 1 = 100
  assertNear(typeof result === "number" ? result : -1, 100,
    "final_attack = max(100 * 2 * 0.5 * 1, 0) = 100");
}

// --- Scaled up damage ---
console.log("\nScaled damage test:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 500);
  rt.setLeafValue("final_attack_additional_rate", 1.5);
  rt.setLeafValue("final_attack_ignore_dam_rate", 1.2);
  rt.setLeafValue("final_special_regulate_factor", 1);
  rt.update();

  const result = rt.getTargetValue("final_attack");
  // 500 * 1.5 * 1.2 * 1 = 900
  assertNear(typeof result === "number" ? result : -1, 900,
    "final_attack = max(500 * 1.5 * 1.2 * 1, 0) = 900");
}

// --- Clamp to zero behavior ---
console.log("\nClamp-to-zero test:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("final_attack_additional_rate", -2);
  rt.setLeafValue("final_attack_ignore_dam_rate", 1);
  rt.setLeafValue("final_special_regulate_factor", 1);
  rt.update();

  const result = rt.getTargetValue("final_attack");
  // max(100 * -2 * 1 * 1, 0) = max(-200, 0) = 0
  assertNear(typeof result === "number" ? result : -1, 0,
    "final_attack = max(100 * -2 * 1 * 1, 0) = 0 (clamped)");
}

// --- Zero base attack ---
console.log("\nZero base attack:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 0);
  rt.setLeafValue("final_attack_additional_rate", 2);
  rt.setLeafValue("final_attack_ignore_dam_rate", 3);
  rt.setLeafValue("final_special_regulate_factor", 1);
  rt.update();

  const result = rt.getTargetValue("final_attack");
  assertNear(typeof result === "number" ? result : -1, 0,
    "final_attack = max(0 * 2 * 3 * 1, 0) = 0");
}

// --- Default leaves (rates default to 1) ---
console.log("\nDefault leaf values:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 250);
  // do NOT set rates — they should default to 1
  rt.update();

  const result = rt.getTargetValue("final_attack");
  assertNear(typeof result === "number" ? result : -1, 250,
    "final_attack = 250 when rates default to 1");
}

// --- Runtime status ---
console.log("\nRuntime status:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  assert(rt.getStatus() === "terminal-only", "runtime status = terminal-only");
  assert(rt.getTerminalName() === "final_attack", "terminal name = final_attack");
  assert(rt.getTerminalSoulId() === 331, "terminal soul_id = 331");

  const unresolved = rt.getUnresolvedLeaves();
  assert(unresolved.includes("base_attack"), "base_attack listed as unresolved before set");
  rt.setLeafValue("base_attack", 100);
  const unresolvedAfter = rt.getUnresolvedLeaves();
  assert(!unresolvedAfter.includes("base_attack"), "base_attack resolved after setLeafValue");
}

// --- Snapshot ---
console.log("\nSnapshot:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_TERMINAL_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("final_attack_additional_rate", 2);
  rt.setLeafValue("final_attack_ignore_dam_rate", 0.5);
  rt.setLeafValue("final_special_regulate_factor", 1);
  rt.update();

  const snap = rt.getSnapshot();
  assert(snap.status === "terminal-only", "snapshot status = terminal-only");
  assert(snap.treeName === "damage_formula", "snapshot treeName = damage_formula");
  assertNear(typeof snap.targets["final_attack"] === "number" ? snap.targets["final_attack"] : -1,
    100, "snapshot target final_attack = 100");
  assertNear(typeof snap.leaves["base_attack"] === "number" ? snap.leaves["base_attack"] : -1,
    100, "snapshot leaf base_attack = 100");
}

// --- Summary ---
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Phase 4 smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Phase 4 smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
