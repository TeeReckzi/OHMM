import type {
  ConditionalEffectDefinition,
  CombatStateAssumptions,
} from "./conditionalEffectTypes";
import {
  evaluateConditionalEffect,
  defaultCombatAssumptions,
  deriveCustomProfile,
  getUptimeProfile,
  isCustomProfile,
} from "./conditionalEffectEngine";

let PASS = 0;
let FAIL = 0;

function assert(condition: boolean, label: string) {
  if (condition) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}`); }
}

function assertClose(a: number, b: number, tol: number, label: string) {
  if (Math.abs(a - b) <= tol) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}: expected ${b} +/- ${tol}, got ${a}`); }
}

console.log("\n=== Assumption Control Center Smoke Test ===\n");

// ── Mock effect definitions ──

const weakspotTriggeredEffect: ConditionalEffectDefinition = {
  effectId: "tactical-combo",
  durationSeconds: 6,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 0 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [],
};

const reloadTriggeredEffect: ConditionalEffectDefinition = {
  effectId: "steady-hand",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 0 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [],
};

const stackingEffect: ConditionalEffectDefinition = {
  effectId: "fast-pursuit",
  durationSeconds: 10,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 0 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [],
};

const unsupportedEffect: ConditionalEffectDefinition = {
  effectId: "bounce-rampage",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 0 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: false,
  unresolvedMechanics: ["Bounce mechanics pending modeling"],
};

// ── Tests ──

console.log("--- deriveCustomProfile ---");

// 1. Custom weakspot accuracy changes weakspot-triggered uptime
const customWeakspot = deriveCustomProfile("realistic", { weakspotAccuracy: 0.90 });
assert(customWeakspot.weakspotAccuracy === 0.90, "custom: weakspotAccuracy overridden to 0.90");
assert(customWeakspot.reloadsPerMinute === 6, "custom: reloadsPerMinute unchanged from realistic");

// 2. High weakspot → higher trigger frequency → higher uptime
const highWs = evaluateConditionalEffect(weakspotTriggeredEffect, "custom", { weakspotAccuracy: 0.90 });
const lowWs = evaluateConditionalEffect(weakspotTriggeredEffect, "custom", { weakspotAccuracy: 0.10 });
assert(highWs.triggerFrequencyEstimate > lowWs.triggerFrequencyEstimate, "custom: high weakspot > low weakspot trigger freq");
assert(highWs.effectiveUptime > lowWs.effectiveUptime, "custom: high weakspot > low weakspot uptime");

// 3. Custom reload frequency changes reload-triggered contribution
const highReload = evaluateConditionalEffect(reloadTriggeredEffect, "custom", { reloadsPerMinute: 15 });
const lowReload = evaluateConditionalEffect(reloadTriggeredEffect, "custom", { reloadsPerMinute: 2 });
assert(highReload.triggerFrequencyEstimate > lowReload.triggerFrequencyEstimate, "custom: high reload > low reload trigger freq");

// 4. Custom weapon swaps trigger swap warnings
const manySwaps = evaluateConditionalEffect(weakspotTriggeredEffect, "custom", { weaponSwapsPerMinute: 10 });
assert(manySwaps.warnings.some((w) => w.toLowerCase().includes("swap")), "custom: swap warning present with many swaps");

// 5. Unsupported mechanics remain excluded even at aggressive custom values
const aggressive = evaluateConditionalEffect(unsupportedEffect, "custom", { weakspotAccuracy: 1.0, procsPerMinute: 60 });
assert(aggressive.status === "unsupported-condition", "custom: unsupported stays unsupported");
assert(aggressive.contributionFactor === 0, "custom: unsupported contribution = 0");

// 6. Custom values clamped to safe ranges
const clampedAir = deriveCustomProfile("realistic", { weakspotAccuracy: 5.0 });
assert(clampedAir.weakspotAccuracy === 1.0, "custom: weakspotAccuracy clamped to 1.0");
const clampedNeg = deriveCustomProfile("realistic", { weakspotAccuracy: -1 });
assert(clampedNeg.weakspotAccuracy === 0, "custom: weakspotAccuracy clamped to 0");
const clampedDuration = deriveCustomProfile("realistic", { fightDurationSeconds: 1000 });
assert(clampedDuration.fightDurationSeconds === 600, "custom: fightDurationSeconds clamped to 600");

console.log("\n--- Profile Derivation ---");

// 7. Custom with missing keys falls back to preset
const partialCustom = deriveCustomProfile("optimized", { weakspotAccuracy: 0.70 });
assert(partialCustom.weakspotAccuracy === 0.70, "partial: weakspotAccuracy overridden");
assert(partialCustom.reloadsPerMinute === 10, "partial: reloads inherited from optimized");
assert(partialCustom.fastGunnerUptime === 0.65, "partial: fastGunner inherited from optimized");

// 8. deriveCustomProfile with empty overrides matches base exactly
const noOverrides = deriveCustomProfile("perfect", {});
const perfect = defaultCombatAssumptions("perfect");
assert(noOverrides.weakspotAccuracy === perfect.weakspotAccuracy, "no-overrides: weakspotAccuracy matches");
assert(noOverrides.reloadsPerMinute === perfect.reloadsPerMinute, "no-overrides: reloadsPerMinute matches");
assert(noOverrides.fightDurationSeconds === perfect.fightDurationSeconds, "no-overrides: fightDuration matches");

// 9. isCustomProfile helper
assert(isCustomProfile("custom") === true, "isCustom: custom returns true");
assert(isCustomProfile("realistic") === false, "isCustom: realistic returns false");
assert(isCustomProfile("conservative") === false, "isCustom: conservative returns false");

console.log("\n--- Fight Duration / Burst Window ---");

// 10. Fight duration affects burst window context (conceptual)
const longFight = defaultCombatAssumptions("conservative");
assert(longFight.fightDurationSeconds === 120, "conservative: fight duration 120s");
assert(longFight.burstWindowSeconds === 5, "conservative: burst window 5s");

const shortFight = defaultCombatAssumptions("perfect");
assert(shortFight.fightDurationSeconds === 30, "perfect: fight duration 30s");
assert(shortFight.burstWindowSeconds === 20, "perfect: burst window 20s");

// 11. Custom fight duration
const customFight = deriveCustomProfile("realistic", { fightDurationSeconds: 45 });
assert(customFight.fightDurationSeconds === 45, "custom: fight duration overridden");

console.log("\n--- Uptime Profile Consistency ---");

// 12. Custom profile description
const customProfile = getUptimeProfile("custom");
assert(customProfile.name === "custom", "profile: custom name");
assert(customProfile.label === "Custom", "profile: custom label");
assert(customProfile.uptimeMultiplier === 1.0, "profile: custom uptimeMultiplier 1.0");

// 13. evaluateConditionalEffect with custom but no customAssumptions falls back
const customNoAssumptions = evaluateConditionalEffect(reloadTriggeredEffect, "custom");
assert(customNoAssumptions.triggerFrequencyEstimate >= 0, "custom-no-assumptions: trigger freq >= 0");

// 14. Custom proc rate affects stacking trigger frequency
const highProc = evaluateConditionalEffect(stackingEffect, "custom", { procsPerMinute: 30 });
const lowProc = evaluateConditionalEffect(stackingEffect, "custom", { procsPerMinute: 2 });
assert(highProc.triggerFrequencyEstimate > lowProc.triggerFrequencyEstimate, "custom: high procs > low procs trigger freq");

// 15. Custom elemental triggers affect elemental-type effects
const eleEffect: ConditionalEffectDefinition = {
  effectId: "elemental-sense",
  durationSeconds: 8,
  cooldownSeconds: 3,
  maxStacks: 1,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 0 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [],
};
const highEle = evaluateConditionalEffect(eleEffect, "custom", { elementalTriggersPerSecond: 5.0 });
const lowEle = evaluateConditionalEffect(eleEffect, "custom", { elementalTriggersPerSecond: 0.5 });
assert(highEle.triggerFrequencyEstimate > lowEle.triggerFrequencyEstimate, "custom: high elemental > low elemental trigger freq");

// 16. All preset profiles have new fields
for (const name of ["conservative", "realistic", "optimized", "perfect"] as const) {
  const p = defaultCombatAssumptions(name);
  assert(p.fightDurationSeconds > 0, `${name}: fightDurationSeconds > 0`);
  assert(p.burstWindowSeconds > 0, `${name}: burstWindowSeconds > 0`);
}

// ── Summary ──
console.log(`\n=== Results ===`);
console.log(`  Passed: ${PASS}/${PASS + FAIL}`);
console.log(`  Failed: ${FAIL}/${PASS + FAIL}`);
const passRate = (PASS + FAIL) > 0 ? ((PASS / (PASS + FAIL)) * 100).toFixed(1) : "0.0";
console.log(`  Pass rate: ${passRate}%`);
console.log();

if (FAIL > 0) process.exit(1);
