/**
 * Phase 8 smoke test — validation harness.
 * Synthetic cases must pass. Placeholder cases must be "pending", not passing.
 */

import {
  runValidationSuite,
  SYNTHETIC_TERMINAL_CASES,
  SYNTHETIC_PARTIAL_GRAPH_CASES,
  SYNTHETIC_ADDITIONAL_RATE_CASES,
  SYNTHETIC_TAG_RESOLVER_CASES,
  PLACEHOLDER_REAL_CASES,
  ALL_VALIDATION_CASES,
} from "./officialFormulaValidationHarness";

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

console.log("\n=== Phase 8 Validation Harness Smoke Test ===\n");

// --- Synthetic cases must all pass ---
console.log("Synthetic terminal cases:");
const synResults = runValidationSuite(SYNTHETIC_TERMINAL_CASES);
for (const r of synResults) {
  if (r.status === "pass") {
    console.log(`  PASS  [${r.case.id}] ${r.case.label} — actual=${r.actual}`);
    passed++;
  } else if (r.status === "fail") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — actual=${r.actual}, expected=${r.case.expectedTargetValue}, delta=${r.delta}`);
    failed++;
  } else if (r.status === "error") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — ERROR: ${r.error}`);
    failed++;
  } else {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — unexpected pending for synthetic case`);
    failed++;
  }
}

// --- Synthetic partial-graph cases must all pass ---
console.log("\nSynthetic partial-graph cases:");
const pgResults = runValidationSuite(SYNTHETIC_PARTIAL_GRAPH_CASES);
for (const r of pgResults) {
  if (r.status === "pass") {
    console.log(`  PASS  [${r.case.id}] ${r.case.label} — actual=${r.actual}`);
    passed++;
  } else if (r.status === "fail") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — actual=${r.actual}, expected=${r.case.expectedTargetValue}, delta=${r.delta}`);
    failed++;
  } else if (r.status === "error") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — ERROR: ${r.error}`);
    failed++;
  } else {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — unexpected pending for synthetic case`);
    failed++;
  }
}

// --- Synthetic additional-rate (V2 + sub-recipe) cases must all pass ---
console.log("\nSynthetic additional-rate cases (V2 + sub-recipe):");
const arResults = runValidationSuite(SYNTHETIC_ADDITIONAL_RATE_CASES);
for (const r of arResults) {
  if (r.status === "pass") {
    console.log(`  PASS  [${r.case.id}] ${r.case.label} — actual=${r.actual}`);
    passed++;
  } else if (r.status === "fail") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — actual=${r.actual}, expected=${r.case.expectedTargetValue}, delta=${r.delta}`);
    failed++;
  } else if (r.status === "error") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — ERROR: ${r.error}`);
    failed++;
  } else {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — unexpected pending for synthetic case`);
    failed++;
  }
}

// --- Synthetic tag-resolver cases must all pass ---
console.log("\nSynthetic tag-resolver cases:");
const tagResults = runValidationSuite(SYNTHETIC_TAG_RESOLVER_CASES);
for (const r of tagResults) {
  if (r.status === "pass") {
    console.log(`  PASS  [${r.case.id}] ${r.case.label} — actual=${r.actual}`);
    passed++;
  } else if (r.status === "fail") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — actual=${r.actual}, expected=${r.case.expectedTargetValue}, delta=${r.delta}`);
    failed++;
  } else if (r.status === "error") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — ERROR: ${r.error}`);
    failed++;
  } else {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — unexpected pending for synthetic case`);
    failed++;
  }
}

// --- Placeholder cases must all be "pending" ---
console.log("\nPlaceholder real cases (must all be pending — not passing):");
const realResults = runValidationSuite(PLACEHOLDER_REAL_CASES);
for (const r of realResults) {
  if (r.status === "pending") {
    console.log(`  PASS  [${r.case.id}] ${r.case.label} — correctly pending: ${r.reason}`);
    passed++;
  } else if (r.status === "pass") {
    console.error(`  FAIL  [${r.case.id}] ${r.case.label} — dummy-test should not report "pass" (no real data)`);
    failed++;
  } else {
    console.log(`  PASS  [${r.case.id}] ${r.case.label} — non-pass status (${r.status}) is acceptable for placeholder`);
    passed++;
  }
}

// --- Suite counts ---
console.log("\nSuite composition:");
assert(SYNTHETIC_TERMINAL_CASES.length >= 5, `at least 5 terminal synthetic cases (got ${SYNTHETIC_TERMINAL_CASES.length})`);
assert(SYNTHETIC_PARTIAL_GRAPH_CASES.length >= 5, `at least 5 partial-graph synthetic cases (got ${SYNTHETIC_PARTIAL_GRAPH_CASES.length})`);
assert(SYNTHETIC_ADDITIONAL_RATE_CASES.length >= 5, `at least 5 additional-rate synthetic cases (got ${SYNTHETIC_ADDITIONAL_RATE_CASES.length})`);
assert(SYNTHETIC_TAG_RESOLVER_CASES.length >= 5, `at least 5 tag-resolver synthetic cases (got ${SYNTHETIC_TAG_RESOLVER_CASES.length})`);
assert(PLACEHOLDER_REAL_CASES.length >= 10, `at least 10 placeholder cases (got ${PLACEHOLDER_REAL_CASES.length})`);
assert(
  ALL_VALIDATION_CASES.length ===
    SYNTHETIC_TERMINAL_CASES.length + SYNTHETIC_PARTIAL_GRAPH_CASES.length +
    SYNTHETIC_ADDITIONAL_RATE_CASES.length + SYNTHETIC_TAG_RESOLVER_CASES.length +
    PLACEHOLDER_REAL_CASES.length,
  "ALL_VALIDATION_CASES = terminal + partial-graph + additional-rate + tag-resolver + placeholder"
);

// --- Synthetic cases are not "dummy-test" ---
console.log("\nSource labeling:");
for (const c of SYNTHETIC_TERMINAL_CASES) {
  assert(c.source === "synthetic", `[${c.id}] source = "synthetic"`);
}
for (const c of SYNTHETIC_PARTIAL_GRAPH_CASES) {
  assert(c.source === "synthetic", `[${c.id}] source = "synthetic"`);
}
for (const c of SYNTHETIC_ADDITIONAL_RATE_CASES) {
  assert(c.source === "synthetic", `[${c.id}] source = "synthetic"`);
}
for (const c of SYNTHETIC_TAG_RESOLVER_CASES) {
  assert(c.source === "synthetic", `[${c.id}] source = "synthetic"`);
}
for (const c of PLACEHOLDER_REAL_CASES) {
  assert(c.source === "dummy-test", `[${c.id}] source = "dummy-test"`);
}

// --- Synthetic results have no "pending" entries ---
console.log("\nSynthetic results are not pending:");
for (const r of [...synResults, ...pgResults, ...arResults, ...tagResults]) {
  assert(r.status !== "pending", `[${r.case.id}] synthetic result is not pending`);
}

// --- Placeholder notes are non-empty ---
console.log("\nPlaceholders have notes:");
for (const c of PLACEHOLDER_REAL_CASES) {
  assert(c.notes.length > 0, `[${c.id}] has notes explaining what is missing`);
}

// --- Validation case shape ---
console.log("\nValidation case shape:");
const allCases = ALL_VALIDATION_CASES;
for (const c of allCases) {
  assert(typeof c.id === "string" && c.id.length > 0, `[${c.id}] id is non-empty string`);
  assert(typeof c.label === "string" && c.label.length > 0, `[${c.id}] label is non-empty string`);
  assert(typeof c.tolerance === "number" && c.tolerance >= 0, `[${c.id}] tolerance >= 0`);
}

// --- Run full suite and summarize ---
console.log("\nFull suite summary:");
const allResults = runValidationSuite(ALL_VALIDATION_CASES);
const countPass = allResults.filter((r) => r.status === "pass").length;
const countFail = allResults.filter((r) => r.status === "fail").length;
const countPending = allResults.filter((r) => r.status === "pending").length;
const countError = allResults.filter((r) => r.status === "error").length;
console.log(`  pass: ${countPass}, fail: ${countFail}, pending: ${countPending}, error: ${countError}`);
assert(countFail === 0, "no validation failures");
assert(countError === 0, "no validation errors");
assert(countPending === PLACEHOLDER_REAL_CASES.length, "all placeholders are pending");

console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Phase 8 smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Phase 8 smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
