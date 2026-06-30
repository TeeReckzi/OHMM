/**
 * Partial-graph damage_formula smoke test.
 *
 * Proves that the final_attack_additional_rate sub-graph actually executes
 * and changes final_attack when dynamic add-rate leaves are provided.
 *
 * Status: partial-graph
 * Connected branches: final_attack_additional_rate (via 4 dynamic leaves)
 * Unconnected branches: final_attack_ignore_dam_rate (leaf, default 1)
 *                       final_special_regulate_factor (leaf, default 1)
 */

import { createRecipeRuntime } from "./officialFormulaGraphRuntime";
import { DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE } from "./officialFormulaGraphRecipes";

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

function getResult(rt: ReturnType<typeof createRecipeRuntime>): number {
  const v = rt.getTargetValue("final_attack");
  return typeof v === "number" ? v : -1;
}

console.log("\n=== Partial-Graph damage_formula Smoke Test ===");
console.log("Connected: final_attack_additional_rate sub-graph");
console.log("Unconnected: final_attack_ignore_dam_rate, final_special_regulate_factor\n");

// ─── Status and metadata ───────────────────────────────────────────────────────
console.log("Runtime metadata:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  assert(rt.getStatus() === "partial-graph", "status = partial-graph");
  assert(rt.getTerminalName() === "final_attack", "terminal = final_attack");
  assert(rt.getTerminalSoulId() === 331, "soul_id = 331");
}

// ─── Default behavior: all add rates = 0 → additional_rate = 1 ───────────────
console.log("\nDefault behavior (all dynamic leaves = 0):");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.update();
  assertNear(getResult(rt), 100, "base_attack=100, all adds=0 → final_attack=100");
}

// ─── attack_type_dam_add_rate changes final_attack ────────────────────────────
console.log("\nattack_type_dam_add_rate branch executes:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  rt.update();
  // final_attack_additional_rate = 1 + 1*(0.5+0+0+0) = 1.5
  // final_attack = 100 * 1.5 * 1 * 1 = 150
  assertNear(getResult(rt), 150, "attack_type_dam_add_rate=0.5 → final_attack=150");
}

// ─── Multiple add rates accumulate ───────────────────────────────────────────
console.log("\nMultiple add rates accumulate additively:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  rt.setLeafValue("gun_type_dam_add_rate", 0.3);
  rt.update();
  // final_attack_additional_rate = 1 + 1*(0.5+0.3+0+0) = 1.8
  // final_attack = 100 * 1.8 = 180
  assertNear(getResult(rt), 180, "attack=0.5 + gun=0.3 → additional_rate=1.8 → final_attack=180");
}
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 0.3);
  rt.setLeafValue("gun_type_dam_add_rate", 0.2);
  rt.setLeafValue("element_type_dam_add_rate", 0.1);
  rt.setLeafValue("keyword_proc_dam_add_rate", 0.4);
  rt.update();
  // sum = 0.3+0.2+0.1+0.4 = 1.0, additional_rate = 2.0, final_attack = 200
  assertNear(getResult(rt), 200, "all 4 adds sum=1.0 → additional_rate=2.0 → final_attack=200");
}

// ─── use_final_dam_add_rate gate ──────────────────────────────────────────────
console.log("\nuse_final_dam_add_rate gate (0 = bypass all adds):");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  rt.setLeafValue("use_final_dam_add_rate", 0);
  rt.update();
  // gated_sum = 0 * 0.5 = 0, additional_rate = 1 + 0 = 1, final_attack = 100
  assertNear(getResult(rt), 100, "gate=0: adds blocked → additional_rate=1 → final_attack=100");
}
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 1.0);
  rt.setLeafValue("use_final_dam_add_rate", 1);
  rt.update();
  // gated_sum = 1*1.0, additional_rate = 2.0, final_attack = 200
  assertNear(getResult(rt), 200, "gate=1: attack_type=1.0 → additional_rate=2.0 → final_attack=200");
}

// ─── final_attack_ignore_dam_rate still a leaf (not yet connected) ────────────
console.log("\nfinal_attack_ignore_dam_rate (leaf, default 1):");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 1.0);
  rt.setLeafValue("final_attack_ignore_dam_rate", 2.0);
  rt.update();
  // additional_rate = 2.0, ignore = 2.0, final_attack = 100 * 2.0 * 2.0 = 400
  assertNear(getResult(rt), 400,
    "attack=1.0 + ignore=2.0 → final_attack=100*2*2=400 (leaf injection works)");
}

// ─── Clamp to zero ────────────────────────────────────────────────────────────
console.log("\nClamp to zero:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", -2.0);
  rt.update();
  // additional_rate = 1 + (-2) = -1, product = 100 * -1 = -100, max(-100,0) = 0
  assertNear(getResult(rt), 0, "negative sum clamps to 0");
}

// ─── Unresolved leaves reported ───────────────────────────────────────────────
console.log("\nUnresolved leaves:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  const unresolved = rt.getUnresolvedLeaves();
  assert(unresolved.includes("base_attack"),
    "base_attack unresolved before set");
  assert(unresolved.includes("attack_type_dam_add_rate"),
    "attack_type_dam_add_rate unresolved (requiresResolver)");
  assert(unresolved.includes("gun_type_dam_add_rate"),
    "gun_type_dam_add_rate unresolved (requiresResolver)");
  assert(unresolved.includes("element_type_dam_add_rate"),
    "element_type_dam_add_rate unresolved (requiresResolver)");
  assert(unresolved.includes("keyword_proc_dam_add_rate"),
    "keyword_proc_dam_add_rate unresolved (requiresResolver)");
  assert(!unresolved.includes("use_final_dam_add_rate"),
    "use_final_dam_add_rate NOT unresolved (has static default 1)");
  assert(!unresolved.includes("final_attack_ignore_dam_rate"),
    "final_attack_ignore_dam_rate NOT unresolved (has static default 1)");
}
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  const unresolvedAfter = rt.getUnresolvedLeaves();
  assert(!unresolvedAfter.includes("base_attack"),
    "base_attack resolved after setLeafValue");
  assert(!unresolvedAfter.includes("attack_type_dam_add_rate"),
    "attack_type_dam_add_rate resolved after setLeafValue");
  assert(unresolvedAfter.includes("gun_type_dam_add_rate"),
    "gun_type_dam_add_rate still unresolved");
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────
console.log("\nSnapshot:");
{
  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("attack_type_dam_add_rate", 0.5);
  rt.update();
  const snap = rt.getSnapshot();
  assert(snap.status === "partial-graph", "snapshot status = partial-graph");
  assertNear(typeof snap.targets["final_attack"] === "number"
    ? snap.targets["final_attack"] : -1, 150, "snapshot target = 150");
  assert(snap.unresolvedLeaves.includes("gun_type_dam_add_rate"),
    "snapshot unresolved includes gun_type_dam_add_rate");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Partial-graph smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Partial-graph smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
