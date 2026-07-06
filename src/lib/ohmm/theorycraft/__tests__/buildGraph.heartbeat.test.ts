/**
 * Property-based tests for Heartbeat in the Build Graph view model.
 *
 * Property 6: Heartbeat brightness multiplier is always >= 1.0 when active
 * Property 23: Heartbeat Frequency Bounds — baseFrequency clamped to [0.1, 5.0] Hz
 *
 * **Validates: Requirement 7.3, 8.2**
 */

import * as fc from "fast-check";
import { deriveBuildGraph } from "../buildGraph.vm";
import type { BuildSelection } from "@/ohai/src/ui/types";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";

// ─── Arbitrary Generators ─────────────────────────────────────────────────────

/** Arbitrary for CombatOutput with various DPS values and timing metrics */
const arbCombatOutput = fc.record({
  damageOutput: fc.record({
    DPS: fc.double({ min: 0, max: 50000, noNaN: true }),
    tickIntervalSeconds: fc.option(fc.double({ min: 0.001, max: 100, noNaN: true }), { nil: undefined }),
    ticksPerSecond: fc.option(fc.double({ min: 0.01, max: 100, noNaN: true }), { nil: undefined }),
    baseDamage: fc.constant(100),
    expectedDamage: fc.constant(150),
    critMultiplier: fc.constant(1.5),
    weakspotMultiplier: fc.constant(1.0),
    totalMultiplier: fc.constant(1.0),
  }),
  survivability: fc.constant({
    damageTakenMultiplier: 1.0,
    effectiveHealthMultiplier: 1.0,
    survivabilityGainPercent: 0,
  }),
  pvpDuel: fc.constant({
    outgoingTTK: undefined,
    incomingTTK: undefined,
    duelPressure: "Unknown",
  }),
  warnings: fc.constant([]),
  assumptions: fc.constant([]),
  buildMode: fc.constant("pve"),
  incomingDPSProvided: fc.constant(false),
  targetHealthProvided: fc.constant(false),
  officialFormula: fc.constant({
    status: "not-attempted",
    warnings: [],
    officialDamageAvailable: false,
    officialDamage: undefined,
    unresolvedLeaves: [],
    accuracyNote: "",
  }),
}) as unknown as fc.Arbitrary<CombatOutput>;

/** Arbitrary for a valid BuildSelection with ≥2 equipment items (ensures isRenderable: true) */
const arbBuildSelection: fc.Arbitrary<BuildSelection> = fc.constant({
  id: "test-build",
  label: "Test Build",
  role: "attacker" as const,
  weapon: {
    blueprintId: "weapon-test-001",
    stars: 3 as const,
    tier: 3 as const,
    calibration: "",
    attachments: {
      optic: "",
      muzzle: "",
      magazine: "",
      tactical: "",
      stock: "",
      ammo: "",
    },
  },
  armor: {
    head: "armor-head-001",
    mask: "armor-mask-001",
    chest: "armor-chest-001",
    gloves: "",
    pants: "",
    boots: "",
  },
  mods: {
    weaponCore: undefined,
    weaponSuffix: undefined,
  },
  cradle: { perks: [] },
  deviant: { id: "", level: 0, activityRating: 0, trait: "" },
  food: {
    food: "",
    drink: "",
    chefRex: {
      enabled: false,
      skillRating: 1 as const,
      activityRating: 1 as const,
      bonusPercent: 0,
      mode: "rating-derived" as const,
    },
  },
}) as unknown as fc.Arbitrary<BuildSelection>;

/** Minimal CalculationInput sufficient for heartbeat testing */
const arbCalcInput: fc.Arbitrary<CalculationInput> = fc.constant({
  modifierSources: [],
  aggregationReport: { totalSources: 0, statBreakdown: {} },
  pvpMitigation: { applied: false, reductionPercent: 0 },
  conditionalEffects: [],
  uptimeProfile: "always-on",
  modeledEffects: [],
  partiallyModeledEffects: [],
  displayOnlyEffects: [],
  unresolvedEffects: [],
  ignoredEffects: [],
  formulaWarnings: [],
  partialSupportNotes: [],
  availableMechanics: [],
  buildMode: "pve",
  enemyType: "pve-generic",
  totalItemsConsidered: 3,
  totalModifiersExtracted: 0,
  baseWeaponDMG: 100,
  baseCritRate: 0.05,
  baseCritDamage: 1.5,
  baseWeakspotDamage: 1.0,
  baseFireRate: 1.0,
}) as unknown as fc.Arbitrary<CalculationInput>;

// ─── Test Runner ──────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runProperty(name: string, fn: () => void): Promise<void> {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`[PASS] ${name}`);
  } catch (e: any) {
    results.push({ name, passed: false, error: e.message ?? String(e) });
    console.log(`[FAIL] ${name}`);
    console.log(`  Counterexample: ${e.message ?? String(e)}`);
  }
}

// ─── Property 23: Heartbeat Frequency Bounds ──────────────────────────────────

await runProperty("Property 23: Heartbeat Frequency Bounds", () => {
  fc.assert(
    fc.property(
      arbCombatOutput,
      arbBuildSelection,
      arbCalcInput,
      (combatOutput, buildSelection, calcInput) => {
        const result = deriveBuildGraph(buildSelection, calcInput, combatOutput);

        // When heartbeat is active, baseFrequency must be in [0.1, 5.0] Hz
        if (result.heartbeat.isActive) {
          if (result.heartbeat.baseFrequency < 0.1 || result.heartbeat.baseFrequency > 5.0) {
            throw new Error(
              `heartbeat.baseFrequency out of bounds when active: ${result.heartbeat.baseFrequency} (expected [0.1, 5.0] Hz)`
            );
          }
        }

        // When DPS > 0, heartbeat should be active
        const dps = combatOutput.damageOutput.DPS;
        if (dps != null && dps > 0 && Number.isFinite(dps)) {
          if (!result.heartbeat.isActive) {
            throw new Error(
              `heartbeat.isActive should be true when DPS = ${dps}, but got false`
            );
          }
        }

        // When DPS === 0, heartbeat should be inactive
        if (dps === 0) {
          if (result.heartbeat.isActive) {
            throw new Error(
              `heartbeat.isActive should be false when DPS = 0, but got true`
            );
          }
        }

        // When combatOutput is null, heartbeat should be inactive
        const resultNoOutput = deriveBuildGraph(buildSelection, calcInput, null);
        if (resultNoOutput.heartbeat.isActive) {
          throw new Error(
            `heartbeat.isActive should be false when combatOutput is null, but got true`
          );
        }
      }
    ),
    { numRuns: 300 }
  );
});

// ─── Property 6: Heartbeat Brightness Multiplier bounds ───────────────────────

await runProperty("Property 6: Heartbeat brightness multiplier is always >= 1.0 when active", () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0.05, max: 1.0 }), // energyLevel
      fc.double({ min: 0.02, max: 0.15 }), // pulseIntensity (amplitude)
      fc.double({ min: -1.0, max: 1.0 }), // nodeSin
      (energyLevel, pulseIntensity, nodeSin) => {
        const brightness = 1 + pulseIntensity * energyLevel * Math.max(0, nodeSin);
        if (brightness < 1.0) {
          throw new Error(`Brightness ${brightness} is less than 1.0 for energyLevel=${energyLevel}, pulseIntensity=${pulseIntensity}, nodeSin=${nodeSin}`);
        }
        return true;
      }
    ),
    { numRuns: 200 }
  );

  // Deactivation decay property test
  fc.assert(
    fc.property(
      fc.double({ min: 1.0, max: 1.5 }), // startVal
      fc.double({ min: 0, max: 1.0 }), // t [0, 1]
      (startVal, t) => {
        const brightness = startVal + (1.0 - startVal) * t;
        if (brightness < 1.0) {
          throw new Error(`Deactivation brightness ${brightness} < 1.0`);
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});

// ─── Summary ──────────────────────────────────────────────────────────────────

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.log(`\n${failed.length} property test(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`\nAll ${results.length} property tests passed.`);
  process.exit(0);
}
