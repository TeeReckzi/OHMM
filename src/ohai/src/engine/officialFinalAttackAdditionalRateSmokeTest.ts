/**
 * Smoke test for FINAL_ATTACK_ADDITIONAL_RATE_RECIPE (standalone sub-recipe)
 * and DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE (full recipe with weapon_attack_add_rate).
 *
 * Evidence confidence levels:
 *   HIGH: gate behavior (use_final_dam_add_rate), attack_type/gun_type/element/keyword leaves
 *   MEDIUM: weapon_attack_add_rate (inferred from external formula, not directly recovered)
 *   MEDIUM: additive combination structure (1 + gate × sum)
 *
 * User-specified validation tests:
 *   base_attack = 100, additional_rate = 1 → final_attack = 100
 *   base_attack = 100, additional_rate = 2 → final_attack = 200
 *   base_attack = 100, additional_rate = 3 → final_attack = 300
 */

import { createRecipeRuntime } from "./officialFormulaGraphRuntime";
import {
  FINAL_ATTACK_ADDITIONAL_RATE_RECIPE,
  DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE,
} from "./officialFormulaGraphRecipes";

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

function getRate(rt: ReturnType<typeof createRecipeRuntime>): number {
  const v = rt.getTargetValue("final_attack_additional_rate");
  return typeof v === "number" ? v : -1;
}

function getFinalAttack(rt: ReturnType<typeof createRecipeRuntime>): number {
  const v = rt.getTargetValue("final_attack");
  return typeof v === "number" ? v : -1;
}

console.log("\n=== FINAL_ATTACK_ADDITIONAL_RATE Sub-Recipe Smoke Test ===");
console.log("Confidence: HIGH for gate + 4 dynamic leaves; MEDIUM for weapon_attack_add_rate + sum structure\n");

// ─── PART 1: Standalone sub-recipe ────────────────────────────────────────────
console.log("PART 1: Standalone FINAL_ATTACK_ADDITIONAL_RATE_RECIPE");

// Metadata
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  assert(rt.getStatus() === "sub-recipe", "sub-recipe status = sub-recipe");
  assert(rt.getTerminalName() === "final_attack", "treeName terminal is final_attack (damage_formula tree)");
}

// Default: all zeros → rate = 1
console.log("\n  Default (all add rates = 0):");
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.update();
  assertNear(getRate(rt), 1.0, "all adds=0 → final_attack_additional_rate=1");
}

// weapon_attack_add_rate only
console.log("\n  weapon_attack_add_rate (MEDIUM confidence):");
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);
  rt.update();
  assertNear(getRate(rt), 2.0, "weapon=1.0 → rate=2.0");
}
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 2.0);
  rt.update();
  assertNear(getRate(rt), 3.0, "weapon=2.0 → rate=3.0");
}
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 0.5);
  rt.update();
  assertNear(getRate(rt), 1.5, "weapon=0.5 → rate=1.5");
}

// attack_type_dam_add_rate only (HIGH confidence)
console.log("\n  attack_type_dam_add_rate (HIGH confidence):");
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  rt.update();
  assertNear(getRate(rt), 1.5, "attack_type=0.5 → rate=1.5");
}

// All 5 add rates accumulate additively
console.log("\n  All 5 inputs accumulate additively:");
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate",    0.2);
  rt.setLeafValue("attack_type_dam_add_rate",  0.3);
  rt.setLeafValue("gun_type_dam_add_rate",     0.1);
  rt.setLeafValue("element_type_dam_add_rate", 0.2);
  rt.setLeafValue("keyword_proc_dam_add_rate", 0.2);
  rt.update();
  // sum = 0.2+0.3+0.1+0.2+0.2 = 1.0, rate = 1+1=2
  assertNear(getRate(rt), 2.0, "all 5 adds sum=1.0 → rate=2.0");
}

// Gate: use_final_dam_add_rate=0 blocks all adds
console.log("\n  Gate behavior (use_final_dam_add_rate):");
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  rt.setLeafValue("use_final_dam_add_rate", 0);
  rt.update();
  assertNear(getRate(rt), 1.0, "gate=0: all adds blocked → rate=1.0");
}
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);
  rt.setLeafValue("use_final_dam_add_rate", 1);
  rt.update();
  assertNear(getRate(rt), 2.0, "gate=1: weapon=1.0 → rate=2.0");
}
{
  // Partial gate: half application
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);
  rt.setLeafValue("use_final_dam_add_rate", 0.5);
  rt.update();
  // rate = 1 + 0.5 * 1.0 = 1.5
  assertNear(getRate(rt), 1.5, "gate=0.5: partial gate → rate=1.5");
}

// Unresolved leaves
console.log("\n  Unresolved leaves:");
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  const unresolved = rt.getUnresolvedLeaves();
  assert(unresolved.includes("attack_type_dam_add_rate"),  "attack_type_dam_add_rate unresolved (requiresResolver)");
  assert(unresolved.includes("gun_type_dam_add_rate"),     "gun_type_dam_add_rate unresolved (requiresResolver)");
  assert(unresolved.includes("element_type_dam_add_rate"), "element_type_dam_add_rate unresolved (requiresResolver)");
  assert(unresolved.includes("keyword_proc_dam_add_rate"), "keyword_proc_dam_add_rate unresolved (requiresResolver)");
  // weapon_attack_add_rate: NOT requiresResolver (direct), has defaultValue=0 → NOT unresolved
  assert(!unresolved.includes("weapon_attack_add_rate"),   "weapon_attack_add_rate NOT unresolved (direct, defaultValue=0)");
  assert(!unresolved.includes("use_final_dam_add_rate"),   "use_final_dam_add_rate NOT unresolved (static default)");
}
{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("attack_type_dam_add_rate", 0.3);
  assert(!rt.getUnresolvedLeaves().includes("attack_type_dam_add_rate"),
    "attack_type_dam_add_rate resolved after setLeafValue");
}

// ─── PART 2: Full V2 recipe — user-specified validation tests ─────────────────
console.log("\nPART 2: DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE (user-specified tests)");

// User spec: base_attack=100, additional_rate=1 → final_attack=100
console.log("\n  base_attack=100, additional_rate=1 → final_attack=100:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  // all add rates = 0 (defaults), additional_rate = 1
  rt.update();
  assertNear(getFinalAttack(rt), 100, "final_attack=100 when additional_rate=1");
}

// User spec: base_attack=100, additional_rate=2 → final_attack=200
console.log("\n  base_attack=100, additional_rate=2 → final_attack=200:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);  // sum=1 → rate=2
  rt.update();
  assertNear(getFinalAttack(rt), 200, "weapon=1.0 → additional_rate=2.0 → final_attack=200");
}

// User spec: base_attack=100, additional_rate=3 → final_attack=300
console.log("\n  base_attack=100, additional_rate=3 → final_attack=300:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("weapon_attack_add_rate", 2.0);  // sum=2 → rate=3
  rt.update();
  assertNear(getFinalAttack(rt), 300, "weapon=2.0 → additional_rate=3.0 → final_attack=300");
}
{
  // Same result via multiple leaves
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);
  rt.setLeafValue("attack_type_dam_add_rate", 1.0);
  rt.update();
  assertNear(getFinalAttack(rt), 300, "weapon=1+attack_type=1 → sum=2 → rate=3 → final_attack=300");
}

// V2 status
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  assert(rt.getStatus() === "partial-graph", "V2 status = partial-graph");
  assert(rt.getTerminalSoulId() === 331, "V2 terminal soul_id = 331");
}

// Clamp to zero still works
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("weapon_attack_add_rate", -2.0);
  rt.update();
  assertNear(getFinalAttack(rt), 0, "negative sum clamps to 0");
}

// Gate off still works in V2
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("weapon_attack_add_rate", 1.0);
  rt.setLeafValue("use_final_dam_add_rate", 0);
  rt.update();
  assertNear(getFinalAttack(rt), 100, "gate=0 in V2: adds blocked → final_attack=100");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Additional rate smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Additional rate smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
