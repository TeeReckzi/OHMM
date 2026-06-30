/**
 * Phase 2 smoke test — formula function registry.
 */

import {
  callFormulaFunction,
  getFormulaFunction,
  getAllFormulaFunctionNames,
} from "./officialFormulaFunctions";

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

function assertNear(actual: number, expected: number, label: string, epsilon = 1e-9): void {
  assert(Math.abs(actual - expected) < epsilon, `${label} — expected ${expected}, got ${actual}`);
}

function assertThrows(fn: () => unknown, label: string): void {
  try {
    fn();
    console.error(`  FAIL  ${label} (expected throw, but did not throw)`);
    failed++;
  } catch {
    console.log(`  PASS  ${label} (threw as expected)`);
    passed++;
  }
}

console.log("\n=== Phase 2 Formula Function Registry Smoke Test ===\n");

// --- min/max (variable args) ---
console.log("min/max:");
assertNear(callFormulaFunction("min", [3, 1, 2]), 1, "min(3,1,2) = 1");
assertNear(callFormulaFunction("min", [5]), 5, "min(5) = 5");
assertNear(callFormulaFunction("max", [3, 1, 2]), 3, "max(3,1,2) = 3");
assertNear(callFormulaFunction("max", [0, -5, 2]), 2, "max(0,-5,2) = 2");
assertNear(callFormulaFunction("min", [0, 0]), 0, "min(0,0) = 0");

// --- exp ---
console.log("\nexp:");
assertNear(callFormulaFunction("exp", [0]), 1, "exp(0) = 1");
assertNear(callFormulaFunction("exp", [1]), Math.E, "exp(1) = e");

// --- pow ---
console.log("\npow:");
assertNear(callFormulaFunction("pow", [2, 10]), 1024, "pow(2,10) = 1024");
assertNear(callFormulaFunction("pow", [4, 0.5]), 2, "pow(4,0.5) = 2");

// --- clamp ---
console.log("\nclamp:");
assertNear(callFormulaFunction("clamp", [5, 0, 10]), 5, "clamp(5,0,10) = 5");
assertNear(callFormulaFunction("clamp", [-1, 0, 10]), 0, "clamp(-1,0,10) = 0 (lower bound)");
assertNear(callFormulaFunction("clamp", [15, 0, 10]), 10, "clamp(15,0,10) = 10 (upper bound)");
assertNear(callFormulaFunction("clamp", [0, 0, 0]), 0, "clamp(0,0,0) = 0");

// --- random (injected value, not Math.random) ---
console.log("\nrandom:");
assertNear(callFormulaFunction("random", [0, 10, 0.5]), 5, "random(0,10,0.5) = 5");
assertNear(callFormulaFunction("random", [0, 10, 0]), 0, "random(0,10,0) = 0 (bottom)");
assertNear(callFormulaFunction("random", [0, 10, 1]), 10, "random(0,10,1) = 10 (top)");
assertNear(callFormulaFunction("random", [5, 15, 0.5]), 10, "random(5,15,0.5) = 10");
assertNear(callFormulaFunction("random", [10, 5, 0.5]), 0, "random(top<bottom) returns 0 — negative range guard");

// --- floor ---
console.log("\nfloor:");
assertNear(callFormulaFunction("floor", [2.9]), 2, "floor(2.9) = 2");
assertNear(callFormulaFunction("floor", [-2.1]), -3, "floor(-2.1) = -3");

// --- sqrt ---
console.log("\nsqrt:");
assertNear(callFormulaFunction("sqrt", [4]), 2, "sqrt(4) = 2");
assertNear(callFormulaFunction("sqrt", [0]), 0, "sqrt(0) = 0");

// --- abs ---
console.log("\nabs:");
assertNear(callFormulaFunction("abs", [-5]), 5, "abs(-5) = 5");
assertNear(callFormulaFunction("abs", [3]), 3, "abs(3) = 3");

// --- param count validation ---
console.log("\nParam count validation:");
assertThrows(() => callFormulaFunction("exp", [1, 2]), "exp with 2 args throws");
assertThrows(() => callFormulaFunction("pow", [1]), "pow with 1 arg throws");
assertThrows(() => callFormulaFunction("clamp", [1, 2]), "clamp with 2 args throws");
assertThrows(() => callFormulaFunction("random", [0, 10]), "random with 2 args throws");
assertThrows(() => callFormulaFunction("floor", [1, 2]), "floor with 2 args throws");
assertThrows(() => callFormulaFunction("sqrt", []), "sqrt with 0 args throws");
assertThrows(() => callFormulaFunction("abs", [1, 2]), "abs with 2 args throws");

// --- all names registered ---
console.log("\nRegistry completeness:");
const names = getAllFormulaFunctionNames();
assert(names.includes("min"), "min registered");
assert(names.includes("max"), "max registered");
assert(names.includes("exp"), "exp registered");
assert(names.includes("pow"), "pow registered");
assert(names.includes("clamp"), "clamp registered");
assert(names.includes("random"), "random registered");
assert(names.includes("floor"), "floor registered");
assert(names.includes("sqrt"), "sqrt registered");
assert(names.includes("abs"), "abs registered");
assert(names.length === 9, `9 functions registered — got ${names.length}`);

// --- unknown function throws ---
assertThrows(
  // @ts-expect-error testing unknown name
  () => getFormulaFunction("nonexistent"),
  "unknown function name throws"
);

console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Phase 2 smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Phase 2 smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
