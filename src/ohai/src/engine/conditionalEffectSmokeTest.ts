/**
 * Conditional Effect Engine Smoke Test — Phase 2.5
 *
 * Validates the conditional effect engine evaluates different
 * effect types correctly under various uptime profiles.
 */

import { evaluateConditionalEffect } from "./conditionalEffectEngine";
import type { ConditionalEffectDefinition } from "./conditionalEffectTypes";

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
  console.log(`  Conditional Effect Results: ${PASS}/${PASS + FAIL} passed`);
}

const t = (label: string) => (cond: boolean) => assert(cond, label);

// ── Test Dummy Definitions ──

const timedBuff: ConditionalEffectDefinition = {
  effectId: "test-timed",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [],
};

const stackingBuff: ConditionalEffectDefinition = {
  effectId: "test-stacking",
  durationSeconds: 6,
  cooldownSeconds: 0,
  maxStacks: 10,
  triggerProfile: { type: "status-tick", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [],
};

const cooldownBuff: ConditionalEffectDefinition = {
  effectId: "test-cooldown",
  durationSeconds: 10,
  cooldownSeconds: 3,
  maxStacks: 1,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [],
};

const unsupportedEffect: ConditionalEffectDefinition = {
  effectId: "test-unsupported",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: false,
  unresolvedMechanics: ["Test unresolved mechanic description."],
};

const weaponSwapRemoval: ConditionalEffectDefinition = {
  effectId: "test-swap-remove",
  durationSeconds: 15,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [],
};

const alwaysOnEffect: ConditionalEffectDefinition = {
  effectId: "test-always-on",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 0 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [],
};

PASS = 0; FAIL = 0;
console.log("\n=== Conditional Effect Engine Smoke Test ===\n");

// 1. Timed buff — different profiles produce different uptime
console.log("--- Timed buff uptime scaling ---");
const timedPerfect = evaluateConditionalEffect(timedBuff, "perfect");
const timedOptimized = evaluateConditionalEffect(timedBuff, "optimized");
const timedConservative = evaluateConditionalEffect(timedBuff, "conservative");
assert(timedPerfect.effectiveUptime >= 0.5, "perfect: uptime >= 50%");
assert(timedOptimized.contributionFactor <= timedPerfect.contributionFactor, "optimized: <= perfect");
assert(timedConservative.contributionFactor <= timedOptimized.contributionFactor, "conservative: <= optimized");
assertEq(timedBuff.maxStacks, 1, "timed: non-stacking");

// 2. Stacking buff
console.log("\n--- Stacking buff ---");
const stackPerfect = evaluateConditionalEffect(stackingBuff, "perfect");
const stackRealistic = evaluateConditionalEffect(stackingBuff, "realistic");
assert(stackPerfect.effectiveStacks >= 1, "perfect stacks >= 1");
assert(stackPerfect.maxStacks === 10, "max stacks = 10");
assert(stackPerfect.effectiveStacks <= stackPerfect.maxStacks, "effective <= max");
assert(stackRealistic.effectiveStacks <= stackPerfect.effectiveStacks, "realistic stacks <= perfect stacks");

// 3. Cooldown effect
console.log("\n--- Cooldown effect ---");
const cdEval = evaluateConditionalEffect(cooldownBuff, "realistic");
assert(cdEval.effectiveUptime > 0, "cooldown: uptime > 0");
assert(cdEval.effectiveUptime <= 1, "cooldown: uptime <= 1");
assertEq(cdEval.maxStacks, 1, "cooldown: non-stacking");

// 4. Unsupported effect
console.log("\n--- Unsupported effect ---");
const unsupported = evaluateConditionalEffect(unsupportedEffect, "realistic");
assertEq(unsupported.status, "unsupported-condition", "unsupported: status correct");
assertEq(unsupported.contributionFactor, 0, "unsupported: no contribution");
assert(unsupported.warnings.length > 0, "unsupported: has warnings");

// 5. Conservative vs Optimized differ
console.log("\n--- Profile differentiation ---");
const cons = evaluateConditionalEffect(timedBuff, "conservative");
const opt = evaluateConditionalEffect(timedBuff, "optimized");
// These should differ because conservative uses 0.35 uptimeMultiplier vs 0.85 for optimized
const diff = cons.contributionFactor !== opt.contributionFactor;
assert(diff, "conservative vs optimized produce different contribution factors");

// 6. Always-on effect
console.log("\n--- Always-on effect ---");
const always = evaluateConditionalEffect(alwaysOnEffect, "realistic");
// Manual trigger: contributionFactor = profile.uptimeMultiplier = 0.6
assert(always.contributionFactor > 0, "always-on: contribution > 0");
assert(always.status !== "inactive", "always-on: not inactive");

// 7. Weapon-swap removal warning
console.log("\n--- Weapon-swap warnings ---");
const swapWarn = evaluateConditionalEffect(weaponSwapRemoval, "realistic");
assert(swapWarn.warnings.some((w) => w.toLowerCase().includes("swap")), "swap-remove: warning mentions swap");

// 8. Stack scaling (realistic vs perfect)
console.log("\n--- Stack scaling ---");
const stackCons = evaluateConditionalEffect(stackingBuff, "conservative");
const stackPerf = evaluateConditionalEffect(stackingBuff, "perfect");
assert(stackCons.effectiveStacks <= stackPerf.effectiveStacks, "conservative stacks <= perfect stacks");
assert(stackCons.stackContribution <= stackPerf.stackContribution, "conservative stack contribution <= perfect");

// 9. Contribution factor bounded
console.log("\n--- Contribution bounds ---");
const allProfiles = ["conservative", "realistic", "optimized", "perfect"] as const;
for (const p of allProfiles) {
  const r = evaluateConditionalEffect(timedBuff, p);
  assert(r.contributionFactor >= 0, `${p}: contribution >= 0`);
  assert(r.contributionFactor <= 1, `${p}: contribution <= 1`);
  assert(r.effectiveUptime >= 0, `${p}: effectiveUptime >= 0`);
  assert(r.effectiveUptime <= 1, `${p}: effectiveUptime <= 1`);
}

// 10. Trigger frequency estimate
console.log("\n--- Trigger frequency ---");
const freqEval = evaluateConditionalEffect(timedBuff, "realistic");
assert(freqEval.triggerFrequencyEstimate > 0, "trigger freq > 0");
const freqWeakspot = evaluateConditionalEffect(
  { ...weaponSwapRemoval, effectId: "freq-test" },
  "realistic",
);
assert(freqWeakspot.triggerFrequencyEstimate > 0, "weakspot trigger freq > 0");

// 11. Explanation string present
console.log("\n--- Explanation ---");
const hasExp = evaluateConditionalEffect(timedBuff, "realistic");
assert(hasExp.explanation.length > 0, "explanation present");
assert(hasExp.explanation.includes("%"), "explanation includes uptime percent");

// 12. Multiple unresolved mechanics
console.log("\n--- Multiple unresolved ---");
const multiUnresolved: ConditionalEffectDefinition = {
  ...timedBuff, effectId: "test-multi",
  unresolvedMechanics: ["First issue.", "Second issue.", "Third issue."],
};
const multiEval = evaluateConditionalEffect(multiUnresolved, "realistic");
assertEq(multiEval.warnings.length, 3, "3 unresolved mechanics produce 3 warnings");

console.log("\n" + "=".repeat(50));
resultsSummary("Conditional Effect");
console.log("");

if (FAIL > 0) process.exit(1);
