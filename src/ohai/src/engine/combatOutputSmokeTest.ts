/**
 * Combat Output Smoke Test — Phase 2.2
 *
 * Validates combat output computation, survivability metrics,
 * PvP duel context, and comparison deltas.
 */

import { computeCombatOutput, type CombatOutput, type CombatOutputOptions } from "../ui/combatOutput";
import { compareCombatOutputs } from "../ui/combatOutputComparison";
import type { CalculationInput } from "../ui/formulaBridge";
import type { PvPMitigationResult } from "../ui/pvpMitigation";

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

function assertApprox(a: number, b: number, tolerance: number, label: string) {
  if (Math.abs(a - b) <= tolerance) { PASS++; }
  else { FAIL++; console.error(`  FAIL ${label}: expected ~${b}, got ${a}`); }
}

function resultsSummary(kind: string) {
  console.log(`  ${kind} Results: ${PASS}/${PASS + FAIL} passed`);
}

// ── Mock builders ──

function mockCalculationInput(overrides?: Partial<CalculationInput>): CalculationInput {
  const base: CalculationInput = {
    modifierSources: [],
    aggregationReport: {
      stats: { stats: {}, breakdown: {}, sourceCount: 0 },
      duplicates: [],
      totalSources: 0,
      activeSources: 0,
      suppressedCount: 0,
    },
    pvpMitigation: {
      sources: [],
      totalReductionPercent: 0,
      incomingDamageExample: 1000,
      finalDamageTaken: 1000,
      pvpMode: false,
      warnings: [],
    },
    modeledEffects: [],
    partiallyModeledEffects: [],
    displayOnlyEffects: [],
    unresolvedEffects: [],
    ignoredEffects: [],
    formulaWarnings: [],
    partialSupportNotes: [],
    availableMechanics: [],
    conditionalEffects: [],
    uptimeProfile: "realistic" as const,
    buildMode: "pve",
    enemyType: "unknown",
    totalItemsConsidered: 0,
    totalModifiersExtracted: 0,
  };
  return { ...base, ...overrides };
}

function mockPvPMitigation(overrides?: Partial<PvPMitigationResult>, pvpMode?: boolean): PvPMitigationResult {
  return {
    sources: [],
    totalReductionPercent: 0,
    incomingDamageExample: 1000,
    finalDamageTaken: 1000,
    pvpMode: pvpMode ?? false,
    warnings: [],
    ...overrides,
  };
}

function makeOptions(overrides?: Partial<CombatOutputOptions>): CombatOutputOptions {
  return {
    playerHealth: undefined,
    incomingHitDamage: undefined,
    targetHealth: undefined,
    outgoingDPS: undefined,
    incomingDPS: undefined,
    tickIntervalSeconds: undefined,
    ...overrides,
  };
}

// ── Reset ──
PASS = 0;
FAIL = 0;

console.log("\n=== Combat Output Smoke Test ===\n");

// 1. 0 mitigation gives 1.0 damageTakenMultiplier
console.log("--- Zero mitigation ---");
const zeroMit = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 0 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
);
assertEq(zeroMit.survivability.damageTakenMultiplier, 1, "zero-mit: damage taken multiplier = 1.0");
assertEq(zeroMit.survivability.effectiveHealthMultiplier, 1, "zero-mit: EHP multiplier = 1.0");
assertEq(zeroMit.survivability.survivabilityGainPercent, 0, "zero-mit: survivability gain = 0%");

// 2. 20% mitigation gives 0.8 damageTakenMultiplier and 1.25 EHP multiplier
console.log("\n--- 20% mitigation ---");
const twentyMit = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
);
assertEq(twentyMit.survivability.damageTakenMultiplier, 0.8, "20-mit: damage taken multiplier = 0.8");
assertEq(twentyMit.survivability.effectiveHealthMultiplier, 1.25, "20-mit: EHP multiplier = 1.25");
assertEq(twentyMit.survivability.survivabilityGainPercent, 25, "20-mit: survivability gain = 25%");

// 3. 27.6% mitigation gives correct EHP multiplier
console.log("\n--- 27.6% mitigation ---");
const twentySevenMit = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 27.6 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
);
assertEq(twentySevenMit.survivability.damageTakenMultiplier, 0.72, "27.6-mit: damage taken multiplier = 0.72 (rounded)");
assertApprox(twentySevenMit.survivability.effectiveHealthMultiplier, 1.38, 0.01, "27.6-mit: EHP multiplier ~1.38");
assertApprox(twentySevenMit.survivability.survivabilityGainPercent, 38, 1, "27.6-mit: survivability gain ~38%");

// 4. Effective health only computed when health provided
console.log("\n--- Effective health with/without player health ---");
const noHealth = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
);
assert(noHealth.survivability.effectiveHealth === undefined, "no-health: effective health undefined without player health");
assert(noHealth.survivability.shotsToDie === undefined, "no-health: shots to die undefined without player health");

const withHealth = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ playerHealth: 1000 }),
);
assertEq(withHealth.survivability.effectiveHealth, 1250, "with-health: effective health = 1250 at 20% mit with 1000 HP");

// 5. Shots to die only computed when health and incoming hit damage provided
console.log("\n--- Shots to die ---");
const withHit = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ playerHealth: 1000, incomingHitDamage: 200 }),
);
assertEq(withHit.survivability.shotsToDie, 7, "std: 1000 HP / (200 * 0.8 = 160) = 6.25, ceil = 7");
assertEq(withHit.survivability.incomingDamageAfterMitigation, 160, "std: 200 * 0.8 = 160");

// 6. TTK only computed when DPS and target health provided
console.log("\n--- TTK ---");
const noTTK = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ playerHealth: 1000, targetHealth: 5000 }),
);
assert(noTTK.pvpDuel.outgoingTTK === undefined, "ttk: no DPS → no outgoing TTK");

const withTTK = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ outgoingDPS: 500, targetHealth: 5000, incomingDPS: 300, playerHealth: 1000 }),
);
assertEq(withTTK.pvpDuel.outgoingTTK, 10, "ttk: 5000 / 500 = 10s outgoing");
// Incoming TTK = effectiveHealth / incomingDPS = (1000 * 1.25) / 300 = 1250 / 300 = 4.17
assertEq(withTTK.pvpDuel.incomingTTK, 4.17, "ttk: (1000 * 1.25) / 300 = 4.17s incoming");
assertEq(withTTK.pvpDuel.duelPressure, "You die faster", "ttk: you die faster (10s > 4.17s)");

// 7. Comparison deltas are directionally correct
console.log("\n--- Comparison deltas ---");
const beforeBuild = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ outgoingDPS: 500, playerHealth: 1000, incomingHitDamage: 200, targetHealth: 5000 }),
);
const afterBuild = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 30 }),
  150,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ outgoingDPS: 600, playerHealth: 1000, incomingHitDamage: 200, targetHealth: 5000 }),
);
const delta = compareCombatOutputs(beforeBuild, afterBuild);
assert(delta.outgoingDamageDelta > 0, "delta: outgoing damage increased (100→150)");
assert(delta.dpsDelta > 0, "delta: DPS increased (500→600)");
assert(delta.mitigationDirection === "more", "delta: mitigation direction is 'more' (20%→30%)");
assert(delta.survivabilityLabel === "Improved", "delta: survivability improved");
assert(delta.damageLabel === "Increased", "delta: damage increased");

// 8. Missing assumptions produce warnings, not fake values
console.log("\n--- Missing assumptions ---");
const missingAssumptions = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation(),
);
assert(missingAssumptions.assumptions.length > 0, "missing: warnings exist for missing assumptions");
assert(missingAssumptions.survivability.effectiveHealth === undefined, "missing: no fake effective health");
assert(missingAssumptions.survivability.shotsToDie === undefined, "missing: no fake shots to die");
assert(missingAssumptions.pvpDuel.outgoingTTK === undefined, "missing: no fake outgoing TTK");
assert(missingAssumptions.pvpDuel.incomingTTK === undefined, "missing: no fake incoming TTK");

// 9. PvE mode suppresses PvP duel context
console.log("\n--- PvE mode ---");
const pveOut = computeCombatOutput(
  mockCalculationInput({ buildMode: "pve" }),
  mockPvPMitigation({ pvpMode: false }),
  100,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ outgoingDPS: 500, targetHealth: 5000 }),
);
assertEq(pveOut.buildMode, "pve", "pve: buildMode is pve");
assertEq(pveOut.pvpDuel.outgoingTTK, undefined, "pve: no outgoing TTK in PvE mode");
assertEq(pveOut.pvpDuel.incomingTTK, undefined, "pve: no incoming TTK in PvE mode");
assert(!pveOut.assumptions.some((a) => a.includes("TTK")), "pve: no TTK assumptions emitted");

// 10. Damage output metrics are correct
console.log("\n--- Damage output metrics ---");
const dmgOut = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation(),
  150,
  [
    { label: "Base", multiplier: 1, source: "test" },
    { label: "Crit", multiplier: 2, source: "violent-mod" },
    { label: "Status DMG", multiplier: 1.15, source: "status-armor" },
  ],
  makeOptions({ outgoingDPS: 450 }),
);
assertEq(dmgOut.damageOutput.baseDamage, 150, "dmg-out: base damage = 150");
assertEq(dmgOut.damageOutput.critMultiplier, 2, "dmg-out: crit multiplier = 2");
assertApprox(dmgOut.damageOutput.totalMultiplier, 2.3, 0.01, "dmg-out: total multiplier = 1*2*1.15 = 2.3");
assertEq(dmgOut.damageOutput.DPS, 450, "dmg-out: DPS = 450 (from outgoingDPS override)");

// 11. Survivability with 100% mitigation (clamped)
console.log("\n--- 100% mitigation ---");
const hundredMit = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 100 }),
  100,
  undefined,
  makeOptions({ playerHealth: 1000, incomingHitDamage: 200 }),
);
assertEq(hundredMit.survivability.damageTakenMultiplier, 0, "100-mit: damage taken multiplier = 0");
assert(hundredMit.survivability.effectiveHealthMultiplier === Infinity, "100-mit: EHP multiplier = Infinity");
assert(hundredMit.survivability.shotsToDie === undefined, "100-mit: shots to die undefined (incoming after mit = 0)");

// 12. FormulaWarnings propagate to combat output
console.log("\n--- Warning propagation ---");
const warnOut = computeCombatOutput(
  mockCalculationInput({ formulaWarnings: ["[Test] warning one"] }),
  mockPvPMitigation({ warnings: ["[PvP] warning two"] }),
);
assert(warnOut.warnings.some((w) => w.includes("warning one")), "warn: formula warning propagated");
assert(warnOut.warnings.some((w) => w.includes("warning two")), "warn: PvP warning propagated");

// 13. Duel pressure changes based on TTK comparison
console.log("\n--- Duel pressure ---");
const killFaster = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  undefined,
  makeOptions({ outgoingDPS: 1000, targetHealth: 5000, incomingDPS: 200, playerHealth: 1000 }),
);
// outgoing: 5000/1000 = 5s, incoming: (1000*1.25)/200 = 6.25s
assertEq(killFaster.pvpDuel.duelPressure, "You kill faster", "duel: outgoing 5s < incoming 6.25s → you kill faster");

// 14. Delta includes all expected fields
console.log("\n--- Delta field completeness ---");
const fullBefore = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  undefined,
  makeOptions({ outgoingDPS: 500, playerHealth: 1000, incomingHitDamage: 200, targetHealth: 5000 }),
);
const fullAfter = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 30 }),
  150,
  undefined,
  makeOptions({ outgoingDPS: 600, playerHealth: 1000, incomingHitDamage: 200, targetHealth: 5000 }),
);
const fullDelta = compareCombatOutputs(fullBefore, fullAfter);
assert(fullDelta.outgoingDamageDelta !== 0, "full-delta: outgoingDamageDelta present");
assert(fullDelta.dpsDelta !== 0, "full-delta: dpsDelta present");
assert(fullDelta.effectiveHPDelta !== undefined, "full-delta: effectiveHPDelta present");
assert(fullDelta.shotsToDieDelta !== undefined, "full-delta: shotsToDieDelta present");
assert(fullDelta.ttkDelta !== undefined, "full-delta: ttkDelta present");

// 15. Network duel: equal TTK → survivability favored
console.log("\n--- Equal TTK duel ---");
const equalTTK = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  undefined,
  makeOptions({ outgoingDPS: 500, targetHealth: 5000, incomingDPS: 500, playerHealth: 5000 }),
);
// outgoing: 5000/500 = 10s, incoming: (5000*1.25)/500 = 6250/500 = 12.5s
// Actually wait: 5000*1.25 = 6250, 6250/500 = 12.5s
// So outgoing 10s < incoming 12.5s → you kill faster, not equal
// Let me adjust: make them equal
const equalTTK2 = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation({ pvpMode: true, totalReductionPercent: 20 }),
  100,
  undefined,
  makeOptions({ outgoingDPS: 500, targetHealth: 5000, incomingDPS: 625, playerHealth: 5000 }),
);
// outgoing: 5000/500 = 10s, incoming: (5000*1.25)/625 = 6250/625 = 10s
// Since we have mitigation, EHP > HP, so survivability favored
assertEq(equalTTK2.pvpDuel.duelPressure, "Survivability favored", "duel-equal: equal TTK with mitigation → survivability favored");

// 16. DamageOutput.DPS from tickInterval
console.log("\n--- DPS from tick interval ---");
const tickDPS = computeCombatOutput(
  mockCalculationInput(),
  mockPvPMitigation(),
  50,
  [{ label: "Base", multiplier: 1, source: "test" }],
  makeOptions({ tickIntervalSeconds: 0.5 }),
);
assertEq(tickDPS.damageOutput.DPS, 100, "tick-dps: 50 damage / 0.5s = 100 DPS");
assertEq(tickDPS.damageOutput.ticksPerSecond, 2, "tick-dps: 2 ticks/sec");
assertEq(tickDPS.damageOutput.tickIntervalSeconds, 0.5, "tick-dps: tick interval = 0.5s");

console.log("\n" + "=".repeat(50));
resultsSummary("Combat Output");
console.log("");

if (FAIL > 0) process.exit(1);
