/**
 * Property-based tests for buildGraph.vm.ts — Node derivation properties.
 *
 * Property 1: Node ID Uniqueness
 * Property 5: Layer Consistency
 * Property 7: Energy Level Bounds
 * Property 8: Influence Score Bounds
 * Property 19: Safe Defaults on Invalid Input
 * Property 20: Minimum Renderability Threshold
 * Property 25: Non-Mutation Guarantee
 * Property 26: Confidence Classification Completeness
 *
 * **Validates: Requirements 1.1, 1.7, 2.6, 3.1, 3.2, 3.4, 9.1, 13.1, 13.2, 13.7**
 */

import * as fc from "fast-check";
import { deriveBuildGraph } from "../buildGraph.vm";
import { LAYER_ORDER } from "../buildGraph.types";
import type { GraphLayer, ConfidenceLevel } from "../buildGraph.types";

// ─── Valid values ─────────────────────────────────────────────────────────────

const VALID_LAYERS: GraphLayer[] = [...LAYER_ORDER];
const VALID_CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "project_verified",
  "observed",
  "estimated",
  "placeholder",
];

// ─── Arbitrary Generators ─────────────────────────────────────────────────────

const arbArmorSlot = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 3, maxLength: 12 }),
  fc.record({ id: fc.string({ minLength: 3, maxLength: 12 }) }),
);

const arbArmorSelection = fc.record({
  head: arbArmorSlot,
  mask: arbArmorSlot,
  chest: arbArmorSlot,
  gloves: arbArmorSlot,
  pants: arbArmorSlot,
  boots: arbArmorSlot,
});

const arbModSelection = fc.record({
  weaponCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  weaponSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  headCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  headSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  maskCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  maskSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  chestCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  chestSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  glovesCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  glovesSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  pantsCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  pantsSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  bootsCore: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  bootsSuffix: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
});

const STAT_KEYS = [
  "weaponDMGFlat", "critRate", "critDMG", "weakspotDMG", "fireRate",
  "attackPercent", "dmgReduction", "maxHP", "reloadSpeed", "burnDMG",
  "freezeDMG", "statusDMGBonus", "psiIntensity", "movementSpeed",
] as const;

const SOURCE_TYPES = ["weapon", "armor", "mod", "modSuffix", "food", "setBonus"] as const;
const CONFIDENCE_VALUES = ["confirmed", "observed_in_game_needs_testing", "inferred", "reported_current_patch_needs_testing"] as const;

const arbModifierSource = fc.record({
  id: fc.string({ minLength: 3, maxLength: 15 }),
  sourceType: fc.constantFrom(...SOURCE_TYPES),
  sourceLabel: fc.string({ minLength: 3, maxLength: 15 }),
  stat: fc.constantFrom(...STAT_KEYS),
  value: fc.double({ min: -100, max: 500, noNaN: true }),
  behavior: fc.constantFrom("additive", "multiplicative", "override") as fc.Arbitrary<any>,
  confidence: fc.constantFrom(...CONFIDENCE_VALUES),
});

const arbBridgedEffect = fc.record({
  itemId: fc.string({ minLength: 3, maxLength: 12 }),
  itemName: fc.string({ minLength: 3, maxLength: 12 }),
  category: fc.constantFrom("Burn", "Freeze", "Corrosion", "Kinetic", "Psi", "Explosion", ""),
  formulaSupport: fc.record({
    status: fc.constantFrom("full", "partial", "none") as fc.Arbitrary<any>,
  }) as fc.Arbitrary<any>,
  contributesModifiers: fc.boolean(),
  modifierCount: fc.integer({ min: 0, max: 10 }),
});

/** Build selection with ≥2 equipped items (renderable) */
const arbBuildSelectionRenderable = fc.record({
  id: fc.string({ minLength: 1, maxLength: 8 }),
  label: fc.string({ minLength: 1, maxLength: 8 }),
  role: fc.constantFrom("attacker", "defender") as fc.Arbitrary<"attacker" | "defender">,
  weapon: fc.record({
    blueprintId: fc.string({ minLength: 3, maxLength: 12 }),
    stars: fc.integer({ min: 1, max: 5 }) as fc.Arbitrary<any>,
    tier: fc.integer({ min: 1, max: 5 }) as fc.Arbitrary<any>,
    calibration: fc.string({ minLength: 0, maxLength: 6 }),
    attachments: fc.constant({}) as fc.Arbitrary<any>,
  }),
  armor: arbArmorSelection,
  mods: arbModSelection as fc.Arbitrary<any>,
  modSelections: arbModSelection as fc.Arbitrary<any>,
  cradle: fc.record({ perks: fc.array(fc.string({ minLength: 3, maxLength: 8 }), { minLength: 0, maxLength: 3 }) }),
  deviant: fc.record({
    id: fc.string({ minLength: 3, maxLength: 10 }),
    level: fc.integer({ min: 1, max: 60 }),
    activityRating: fc.integer({ min: 0, max: 100 }),
    trait: fc.string({ minLength: 0, maxLength: 8 }),
  }),
  food: fc.record({
    food: fc.string({ minLength: 3, maxLength: 10 }),
    drink: fc.string({ minLength: 0, maxLength: 10 }),
    chefRex: fc.record({
      enabled: fc.boolean(),
      skillRating: fc.constant(0) as fc.Arbitrary<any>,
      activityRating: fc.constant(0) as fc.Arbitrary<any>,
      bonusPercent: fc.double({ min: 0, max: 50, noNaN: true }),
      mode: fc.constant("rating-derived") as fc.Arbitrary<any>,
    }),
  }),
});

/** Build selection with 0-1 equipped items (non-renderable) */
const arbBuildSelectionNonRenderable = fc.oneof(
  // Empty weapon, empty armor
  fc.constant({
    id: "empty",
    label: "empty",
    role: "attacker" as const,
    weapon: { blueprintId: "", stars: 1, tier: 1, calibration: "", attachments: {} },
    armor: { head: null, mask: null, chest: null, gloves: null, pants: null, boots: null },
    mods: {},
    cradle: { perks: [] },
    deviant: { id: "", level: 1, activityRating: 0, trait: "" },
    food: { food: "", drink: "", chefRex: { enabled: false, skillRating: 0, activityRating: 0, bonusPercent: 0, mode: "rating-derived" } },
  }),
  // Only weapon, no armor (1 equipped slot)
  fc.record({
    id: fc.constant("one-weapon"),
    label: fc.constant("one-weapon"),
    role: fc.constant("attacker" as const),
    weapon: fc.record({
      blueprintId: fc.string({ minLength: 3, maxLength: 10 }),
      stars: fc.constant(1) as fc.Arbitrary<any>,
      tier: fc.constant(1) as fc.Arbitrary<any>,
      calibration: fc.constant(""),
      attachments: fc.constant({}) as fc.Arbitrary<any>,
    }),
    armor: fc.constant({ head: null, mask: null, chest: null, gloves: null, pants: null, boots: null }),
    mods: fc.constant({}),
    cradle: fc.constant({ perks: [] }),
    deviant: fc.constant({ id: "", level: 1, activityRating: 0, trait: "" }),
    food: fc.constant({ food: "", drink: "", chefRex: { enabled: false, skillRating: 0, activityRating: 0, bonusPercent: 0, mode: "rating-derived" } }),
  }),
);

const arbCalcInput = fc.record({
  modifierSources: fc.array(arbModifierSource, { minLength: 0, maxLength: 15 }),
  aggregationReport: fc.constant({ stats: {}, breakdown: {}, sourceCount: 0, duplicatesRemoved: [], warnings: [] }) as fc.Arbitrary<any>,
  pvpMitigation: fc.constant({ mitigatedDamage: 0, mitigationPercent: 0 }) as fc.Arbitrary<any>,
  conditionalEffects: fc.constant([]) as fc.Arbitrary<any>,
  uptimeProfile: fc.constant("realistic") as fc.Arbitrary<any>,
  modeledEffects: fc.array(arbBridgedEffect, { minLength: 0, maxLength: 5 }),
  partiallyModeledEffects: fc.constant([]) as fc.Arbitrary<any>,
  displayOnlyEffects: fc.constant([]) as fc.Arbitrary<any>,
  unresolvedEffects: fc.constant([]) as fc.Arbitrary<any>,
  ignoredEffects: fc.constant([]) as fc.Arbitrary<any>,
  formulaWarnings: fc.constant([]) as fc.Arbitrary<any>,
  partialSupportNotes: fc.constant([]) as fc.Arbitrary<any>,
  availableMechanics: fc.constant([]) as fc.Arbitrary<any>,
  buildMode: fc.constant("pve") as fc.Arbitrary<any>,
  enemyType: fc.constant("normal") as fc.Arbitrary<any>,
  totalItemsConsidered: fc.integer({ min: 0, max: 20 }),
  totalModifiersExtracted: fc.integer({ min: 0, max: 50 }),
});

const arbCombatOutput = fc.record({
  damageOutput: fc.record({
    baseDamage: fc.double({ min: 0, max: 5000, noNaN: true }),
    expectedDamage: fc.double({ min: 0, max: 10000, noNaN: true }),
    critMultiplier: fc.double({ min: 1.0, max: 5.0, noNaN: true }),
    weakspotMultiplier: fc.double({ min: 1.0, max: 3.0, noNaN: true }),
    totalMultiplier: fc.double({ min: 1.0, max: 10.0, noNaN: true }),
    DPS: fc.oneof(fc.double({ min: 0, max: 10000, noNaN: true }), fc.constant(undefined as any)),
    tickIntervalSeconds: fc.oneof(fc.double({ min: 0.05, max: 5.0, noNaN: true }), fc.constant(undefined as any)),
    ticksPerSecond: fc.oneof(fc.double({ min: 0.5, max: 20, noNaN: true }), fc.constant(undefined as any)),
  }),
  survivability: fc.constant({ damageTakenMultiplier: 1, effectiveHealthMultiplier: 1, effectiveHealth: undefined, incomingDamageAfterMitigation: undefined, shotsToDie: undefined, survivabilityGainPercent: 0 }) as fc.Arbitrary<any>,
  pvpDuel: fc.constant({ outgoingTTK: undefined, incomingTTK: undefined, duelPressure: "Unknown" }) as fc.Arbitrary<any>,
  warnings: fc.constant([]) as fc.Arbitrary<any>,
  assumptions: fc.constant([]) as fc.Arbitrary<any>,
  buildMode: fc.constant("pve") as fc.Arbitrary<any>,
  incomingDPSProvided: fc.constant(false) as fc.Arbitrary<any>,
  targetHealthProvided: fc.constant(false) as fc.Arbitrary<any>,
  officialFormula: fc.constant({ status: "not_started", warnings: [], officialDamageAvailable: false, unresolvedLeaves: [], accuracyNote: "" }) as fc.Arbitrary<any>,
});

/** Composite generator: renderable build with full inputs */
const arbFullInput = fc.tuple(arbBuildSelectionRenderable, arbCalcInput, arbCombatOutput);

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

// ─── Property 1: Node ID Uniqueness ──────────────────────────────────────────

await runProperty("Property 1: Node ID Uniqueness", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      const ids = result.nodes.map((n) => n.id);
      const uniqueIds = new Set(ids);
      if (uniqueIds.size !== ids.length) {
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        throw new Error(`Duplicate node IDs found: ${dupes.join(", ")}`);
      }
      return true;
    }),
    { numRuns: 200 }
  );
});

// ─── Property 5: Layer Consistency ───────────────────────────────────────────

await runProperty("Property 5: Layer Consistency", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      // Every node.layer must be a valid GraphLayer
      for (const node of result.nodes) {
        if (!VALID_LAYERS.includes(node.layer)) {
          throw new Error(`Invalid layer "${node.layer}" on node ${node.id}`);
        }
      }

      // Inter-layer edges must have sourceLayer !== targetLayer
      for (const edge of result.edges) {
        if (edge.isInterLayer && edge.sourceLayer === edge.targetLayer) {
          throw new Error(
            `Inter-layer edge ${edge.id} has same sourceLayer and targetLayer: ${edge.sourceLayer}`
          );
        }
      }

      return true;
    }),
    { numRuns: 200 }
  );
});

// ─── Property 7: Energy Level Bounds ─────────────────────────────────────────

await runProperty("Property 7: Energy Level Bounds", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      for (const node of result.nodes) {
        if (node.energyLevel < 0.05 || node.energyLevel > 1.0) {
          throw new Error(
            `Node ${node.id} energyLevel ${node.energyLevel} out of bounds [0.05, 1.0]`
          );
        }

        // Output nodes must have energyLevel = 1.0 when DPS > 0
        if (node.layer === "final-output") {
          const dps = (combatOutput as any).damageOutput?.DPS;
          if (dps != null && dps > 0 && node.energyLevel !== 1.0) {
            throw new Error(
              `Output node ${node.id} has energyLevel ${node.energyLevel} but expected 1.0 (DPS=${dps})`
            );
          }
        }
      }

      return true;
    }),
    { numRuns: 200 }
  );
});

// ─── Property 8: Influence Score Bounds ──────────────────────────────────────

await runProperty("Property 8: Influence Score Bounds", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      for (const node of result.nodes) {
        if (node.influenceScore < 0.0 || node.influenceScore > 1.0) {
          throw new Error(
            `Node ${node.id} influenceScore ${node.influenceScore} out of bounds [0.0, 1.0]`
          );
        }
      }

      return true;
    }),
    { numRuns: 200 }
  );
});

// ─── Property 19: Safe Defaults on Invalid Input ─────────────────────────────

await runProperty("Property 19: Safe Defaults on Invalid Input", () => {
  // Test with null/undefined
  const nullCases: [any, any, any][] = [
    [null, null, null],
    [undefined, undefined, undefined],
    [null, {}, {}],
    [{}, null, null],
    [{ weapon: null, armor: null }, null, null],
    [{ weapon: { blueprintId: "" }, armor: {} }, null, null],
  ];

  for (const [bs, ci, co] of nullCases) {
    try {
      const result = deriveBuildGraph(bs, ci, co);
      if (typeof result !== "object" || result === null) {
        throw new Error(`deriveBuildGraph returned non-object for inputs: ${JSON.stringify([bs, ci, co])}`);
      }
    } catch (e: any) {
      throw new Error(`deriveBuildGraph threw on inputs ${JSON.stringify([bs, ci, co])}: ${e.message}`);
    }
  }

  // Property test with random garbage inputs
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant({}),
        fc.record({
          weapon: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant({})),
          armor: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant({})),
        }),
        arbBuildSelectionRenderable,
      ),
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant({}),
        arbCalcInput,
      ),
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant({}),
        arbCombatOutput,
      ),
      (bs, ci, co) => {
        // Must never throw
        const result = deriveBuildGraph(bs as any, ci as any, co as any);
        if (typeof result !== "object" || result === null) {
          throw new Error("deriveBuildGraph returned non-object");
        }
        // Must return well-typed BuildGraphViewModel
        if (!Array.isArray(result.nodes)) {
          throw new Error("result.nodes is not an array");
        }
        if (!Array.isArray(result.edges)) {
          throw new Error("result.edges is not an array");
        }
        if (typeof result.isRenderable !== "boolean") {
          throw new Error("result.isRenderable is not a boolean");
        }
        return true;
      }
    ),
    { numRuns: 200 }
  );
});

// ─── Property 20: Minimum Renderability Threshold ────────────────────────────

await runProperty("Property 20: Minimum Renderability Threshold", () => {
  fc.assert(
    fc.property(arbBuildSelectionNonRenderable, (buildSelection) => {
      const result = deriveBuildGraph(buildSelection as any, null, null);

      if (result.isRenderable) {
        throw new Error(
          `Expected isRenderable=false for build with <2 equipped slots, but got true`
        );
      }
      if (result.emptyStateMessage == null || result.emptyStateMessage === "") {
        throw new Error(
          `Expected non-null emptyStateMessage when isRenderable=false`
        );
      }

      return true;
    }),
    { numRuns: 100 }
  );
});

// ─── Property 25: Non-Mutation Guarantee ─────────────────────────────────────

await runProperty("Property 25: Non-Mutation Guarantee", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      // Deep clone inputs before calling
      const bsBefore = JSON.parse(JSON.stringify(buildSelection));
      const ciBefore = JSON.parse(JSON.stringify(calcInput));
      const coBefore = JSON.parse(JSON.stringify(combatOutput));

      deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);

      // Verify inputs are unchanged
      const bsAfter = JSON.stringify(buildSelection);
      const ciAfter = JSON.stringify(calcInput);
      const coAfter = JSON.stringify(combatOutput);

      if (bsAfter !== JSON.stringify(bsBefore)) {
        throw new Error("BuildSelection was mutated by deriveBuildGraph");
      }
      if (ciAfter !== JSON.stringify(ciBefore)) {
        throw new Error("CalculationInput was mutated by deriveBuildGraph");
      }
      if (coAfter !== JSON.stringify(coBefore)) {
        throw new Error("CombatOutput was mutated by deriveBuildGraph");
      }

      return true;
    }),
    { numRuns: 150 }
  );
});

// ─── Property 26: Confidence Classification Completeness ─────────────────────

await runProperty("Property 26: Confidence Classification Completeness", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      // All nodes must have valid confidence
      for (const node of result.nodes) {
        if (!VALID_CONFIDENCE_LEVELS.includes(node.metadata.confidence)) {
          throw new Error(
            `Node ${node.id} has invalid confidence: "${node.metadata.confidence}"`
          );
        }
      }

      // All edges must have valid confidence
      for (const edge of result.edges) {
        if (!VALID_CONFIDENCE_LEVELS.includes(edge.confidence)) {
          throw new Error(
            `Edge ${edge.id} has invalid confidence: "${edge.confidence}"`
          );
        }
      }

      return true;
    }),
    { numRuns: 200 }
  );
});

// ─── Property 5 (from Tasks): Graph Data Contracts ───────────────────────────

await runProperty("Property 5: Graph data contracts preserved", () => {
  fc.assert(
    fc.property(arbFullInput, ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      const nodeIds = new Set(result.nodes.map(n => n.id));

      for (const edge of result.edges) {
        // Referential integrity
        if (!nodeIds.has(edge.source)) {
          throw new Error(`Edge ${edge.id} references missing source node ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
          throw new Error(`Edge ${edge.id} references missing target node ${edge.target}`);
        }
        
        // No self-edges
        if (edge.source === edge.target) {
          throw new Error(`Edge ${edge.id} is a self-edge`);
        }

        // Weights in [0,1]
        if (edge.weight < 0 || edge.weight > 1) {
          throw new Error(`Edge ${edge.id} has weight ${edge.weight} out of bounds [0, 1]`);
        }
        
        // Directed flow: sourceLayer index <= targetLayer index
        const srcNode = result.nodes.find(n => n.id === edge.source)!;
        const tgtNode = result.nodes.find(n => n.id === edge.target)!;
        const srcIdx = LAYER_ORDER.indexOf(srcNode.layer);
        const tgtIdx = LAYER_ORDER.indexOf(tgtNode.layer);
        
        if (srcIdx > tgtIdx) {
          throw new Error(`Edge ${edge.id} breaks directed flow: ${srcNode.layer} -> ${tgtNode.layer}`);
        }
      }

      return true;
    }),
    { numRuns: 200 }
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
