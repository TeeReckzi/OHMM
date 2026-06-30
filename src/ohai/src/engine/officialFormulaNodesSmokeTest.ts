/**
 * Phase 3 smoke test — formula node evaluators.
 */

import {
  createFormulaEvalState,
  createNumberExpr,
  createStringExpr,
  createNameExpr,
  createUnaryopExpr,
  createBinopListExpr,
  createFunctionExpr,
  toNumber,
} from "./officialFormulaNodes";

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
  const ok = Math.abs(actual - expected) < epsilon;
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

console.log("\n=== Phase 3 Formula Node Evaluator Smoke Test ===\n");

// ─── NumberExpr ───────────────────────────────────────────────────────────────
console.log("NumberExpr:");

{
  const state = createFormulaEvalState(new Array(10).fill(0));
  const node = createNumberExpr(3, 42);
  node.update(state);
  assertNear(toNumber(state.getExprVal(3)), 42, "NumberExpr writes literal to vals[exprId]");
}
{
  const state = createFormulaEvalState([0, 0, 99]);
  const node = createNumberExpr(2);
  node.update(state);
  assertNear(toNumber(state.getExprVal(2)), 99, "NumberExpr no-op when no literal (keeps existing)");
}

// ─── StringExpr ───────────────────────────────────────────────────────────────
console.log("\nStringExpr:");

{
  const state = createFormulaEvalState(new Array(5).fill(0));
  const node = createStringExpr(1, "hello");
  node.update(state);
  assert(state.getExprVal(1) === "hello", "StringExpr writes literal string");
}
{
  const state = createFormulaEvalState([0, "existing"]);
  const node = createStringExpr(1);
  node.update(state);
  assert(state.getExprVal(1) === "existing", "StringExpr no-op without literal");
}

// ─── NameExpr ─────────────────────────────────────────────────────────────────
console.log("\nNameExpr:");

{
  const state = createFormulaEvalState([0, 0, 77]);
  const node = createNameExpr(0, 2);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 77, "NameExpr copies vals[soulId] to vals[exprId]");
}
{
  const state = createFormulaEvalState([55, 0]);
  const node = createNameExpr(1, -1);
  node.update(state);
  assertNear(toNumber(state.getExprVal(1)), 0, "NameExpr soulId <= -1 is no-op");
}
{
  const state = createFormulaEvalState([55, 0]);
  const node = createNameExpr(1, -5);
  node.update(state);
  assertNear(toNumber(state.getExprVal(1)), 0, "NameExpr negative soulId is no-op");
}

// ─── UnaryopExpr ──────────────────────────────────────────────────────────────
console.log("\nUnaryopExpr:");

{
  const state = createFormulaEvalState([0, 5]);
  const node = createUnaryopExpr(0, 1, true);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), -5, "UnaryopExpr negate: -5");
}
{
  const state = createFormulaEvalState([0, 5]);
  const node = createUnaryopExpr(0, 1, false);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 5, "UnaryopExpr identity: 5");
}

// ─── BinopListExpr ────────────────────────────────────────────────────────────
console.log("\nBinopListExpr — basic operations:");

function makeBinopState(first: number, ...rest: number[]): ReturnType<typeof createFormulaEvalState> {
  return createFormulaEvalState([0, first, ...rest]);
}

{
  // result=0, first=exprId:1(5), + exprId:2(3)
  const state = createFormulaEvalState([0, 5, 3]);
  const node = createBinopListExpr(0, 1, [{ op: "+", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 8, "binop: 5 + 3 = 8");
}
{
  const state = createFormulaEvalState([0, 10, 4]);
  const node = createBinopListExpr(0, 1, [{ op: "-", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 6, "binop: 10 - 4 = 6");
}
{
  const state = createFormulaEvalState([0, 3, 7]);
  const node = createBinopListExpr(0, 1, [{ op: "*", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 21, "binop: 3 * 7 = 21");
}
{
  const state = createFormulaEvalState([0, 15, 3]);
  const node = createBinopListExpr(0, 1, [{ op: "/", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 5, "binop: 15 / 3 = 5");
}
{
  const state = createFormulaEvalState([0, 2, 10]);
  const node = createBinopListExpr(0, 1, [{ op: "**", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1024, "binop: 2 ** 10 = 1024");
}

console.log("\nBinopListExpr — safe division:");
{
  const state = createFormulaEvalState([0, 5, 0]);
  const node = createBinopListExpr(0, 1, [{ op: "/", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 0.0, "5 / 0 = 0.0 (safe division)");
}

console.log("\nBinopListExpr — comparisons as numeric booleans:");
{
  const state = createFormulaEvalState([0, 3, 5]);
  const node = createBinopListExpr(0, 1, [{ op: "<", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "3 < 5 = 1.0");
}
{
  const state = createFormulaEvalState([0, 5, 3]);
  const node = createBinopListExpr(0, 1, [{ op: "<", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 0.0, "5 < 3 = 0.0");
}
{
  const state = createFormulaEvalState([0, 5, 5]);
  const node = createBinopListExpr(0, 1, [{ op: "<=", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "5 <= 5 = 1.0");
}
{
  const state = createFormulaEvalState([0, 7, 3]);
  const node = createBinopListExpr(0, 1, [{ op: ">", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "7 > 3 = 1.0");
}
{
  const state = createFormulaEvalState([0, 3, 7]);
  const node = createBinopListExpr(0, 1, [{ op: ">=", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 0.0, "3 >= 7 = 0.0");
}
{
  const state = createFormulaEvalState([0, 4, 4]);
  const node = createBinopListExpr(0, 1, [{ op: "==", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "4 == 4 = 1.0");
}
{
  const state = createFormulaEvalState([0, 4, 5]);
  const node = createBinopListExpr(0, 1, [{ op: "!=", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "4 != 5 = 1.0");
}

console.log("\nBinopListExpr — || truthy OR:");
{
  const state = createFormulaEvalState([0, 0, 0]);
  const node = createBinopListExpr(0, 1, [{ op: "||", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 0.0, "0 || 0 = 0.0");
}
{
  const state = createFormulaEvalState([0, 1, 0]);
  const node = createBinopListExpr(0, 1, [{ op: "||", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "1 || 0 = 1.0");
}
{
  const state = createFormulaEvalState([0, 0, 5]);
  const node = createBinopListExpr(0, 1, [{ op: "||", exprId: 2 }]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1.0, "0 || 5 = 1.0 (truthy OR, not short-circuit)");
}

console.log("\nBinopListExpr — chained left-to-right:");
{
  // (2 * 3) - 1 = 5
  const state = createFormulaEvalState([0, 2, 3, 1]);
  const node = createBinopListExpr(0, 1, [
    { op: "*", exprId: 2 },
    { op: "-", exprId: 3 },
  ]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 5, "chained: (2 * 3) - 1 = 5");
}
{
  // 10 / 2 / 5 = 1
  const state = createFormulaEvalState([0, 10, 2, 5]);
  const node = createBinopListExpr(0, 1, [
    { op: "/", exprId: 2 },
    { op: "/", exprId: 3 },
  ]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1, "chained: 10 / 2 / 5 = 1");
}

// ─── FunctionExpr ─────────────────────────────────────────────────────────────
console.log("\nFunctionExpr:");

{
  // max(3, 7, 1) = 7
  const state = createFormulaEvalState([0, 3, 7, 1]);
  const node = createFunctionExpr(0, "max", [1, 2, 3]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 7, "FunctionExpr: max(3,7,1) = 7");
}
{
  // min(3, 7, 1) = 1
  const state = createFormulaEvalState([0, 3, 7, 1]);
  const node = createFunctionExpr(0, "min", [1, 2, 3]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 1, "FunctionExpr: min(3,7,1) = 1");
}
{
  // clamp(15, 0, 10) = 10
  const state = createFormulaEvalState([0, 15, 0, 10]);
  const node = createFunctionExpr(0, "clamp", [1, 2, 3]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 10, "FunctionExpr: clamp(15,0,10) = 10");
}
{
  // random(0, 10, 0.7) = 7
  const state = createFormulaEvalState([0, 0, 10, 0.7]);
  const node = createFunctionExpr(0, "random", [1, 2, 3]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 7, "FunctionExpr: random(0,10,0.7) = 7 (injected)");
}
{
  // sqrt(9) = 3
  const state = createFormulaEvalState([0, 9]);
  const node = createFunctionExpr(0, "sqrt", [1]);
  node.update(state);
  assertNear(toNumber(state.getExprVal(0)), 3, "FunctionExpr: sqrt(9) = 3");
}

// ─── toNumber helper ──────────────────────────────────────────────────────────
console.log("\ntoNumber coercion:");
assertNear(toNumber(true), 1, "toNumber(true) = 1");
assertNear(toNumber(false), 0, "toNumber(false) = 0");
assertNear(toNumber("3.14"), 3.14, "toNumber('3.14') = 3.14");
assertNear(toNumber("not_a_number"), 0, "toNumber('not_a_number') = 0");

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Phase 3 smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Phase 3 smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
