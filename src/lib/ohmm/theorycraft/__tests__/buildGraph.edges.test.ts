/**
 * Property-based tests for Neural Build Graph — Edge Derivation.
 *
 * Property 2: Edge Referential Integrity
 * Property 3: No Self-Referencing Edges
 * Property 4: Edge Weight Bounds
 * Property 6: Directed Flow Integrity
 * Property 18: No Invented Synergies
 * Property 21: Edge Deduplication
 * Property 22: Confidence Propagation
 * Property 24: Metrics Accuracy
 *
 * **Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 9.3, 14.1, 14.2, 15.1–15.7**
 */

import * as fc from "fast-check";
import { deriveBuildGraph } from "../buildGraph.vm";
import { LAYER_ORDER } from "../buildGraph.types";
import type { ConfidenceLevel } from "../buildGraph.types";

// ─── Confidence Hierarchy (mirror of implementation for verification) ─────────

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  project_verified: 3,
  observed: 2,
  estimated: 1,
  placeholder: 0,
};

function expectedMinConfidence(a: ConfidenceLevel, b: ConfidenceLevel): ConfidenceLevel {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

// ─── Generators ───────────────────────────────────────────────────────────────

const STAT_KEYS = [
  "weaponDMG", "critRate", "critDMG", "weakspotDMG", "fireRate",
  "attackPercent", "psiIntensity", "elementalDMG", "statusDMG",
  "meleeDMG", "reloadSpeed", "magazineCapacity",
] as const;

const CONFIDENCE_VALUES = [
  "confirmed", "verified", "observed_in_game_needs_testing",
  "observed", "inferred", "estimated", "placeholder",
] as const;

const ARMOR_SLOTS = ["head", "mask", "chest", "gloves", "pants", "boots"] as const;

/**
 * Generates a valid BuildSelection with a weapon and at least one armor piece equipped.
 * This ensures at least 2 equipment slots → isRenderable = true.
 */
function arbBuildSelection() {
  return fc.record({
    id: fc.constant("test-build"),
    label: fc.constant("Test Build"),
    role: fc.constant("attacker" as const),
    weapon: fc.record({
      blueprintId: fc.constant("test-weapon-001"),
      stars: fc.constant(3 as const),
      tier: fc.constant(3 as const),
      calibration: fc.constant("none"),
      attachments: fc.constant({
        optic: "none",
        muzzle: "none",
        magazine: "none",
        tactical: "none",
        stock: "none",
        ammo: "none",
      }),
    }),
    armor: fc.record({
      head: fc.constantFrom("armor-head-1", "armor-head-2"),
      mask: fc.constantFrom("", "armor-mask-1"),
      chest: fc.constantFrom("armor-chest-1", ""),
      gloves: fc.constantFrom("armor-gloves-1", ""),
      pants: fc.constantFrom("", "armor-pants-1"),
      boots: fc.constantFrom("armor-boots-1", ""),
    }),
    mods: fc.constant({}),
    cradle: fc.constant({ perks: [] }),
    deviant: fc.constant({ id: "", level: 0, activityRating: 0, trait: "" }),
    food: fc.constant({ food: "", drink: "", chefRex: { enabled: false, skillRating: 1 as const, activityRating: 1 as const, bonusPercent: 0, mode: "rating-derived" as const } }),
  });
}

/**
 * Generate modifierSources referencing the weapon sourceType with various stat keys.
 * These create Equipment → Stats edges.
 */
function arbModifierSources() {
  return fc.array(
    fc.record({
      id: fc.constantFrom("weapon-base-001", "weapon-mod-001", "weapon-cal-001"),
      sourceType: fc.constant("weapon" as const),
      sourceLabel: fc.constantFrom("Test Weapon", "Weapon Core Mod"),
      stat: fc.constantFrom(...STAT_KEYS),
      value: fc.double({ min: 0.01, max: 500, noNaN: true }),
      behavior: fc.constantFrom("additive" as const, "multiplicative" as const),
      confidence: fc.constantFrom(...CONFIDENCE_VALUES),
      notes: fc.constant(""),
    }),
    { minLength: 2, maxLength: 8 },
  );
}

/**
 * Generate modeledEffects that link stats to keywords.
 */
function arbModeledEffects() {
  return fc.array(
    fc.record({
      itemId: fc.constant("test-weapon-001"),
      itemName: fc.constant("Test Weapon"),
      category: fc.constantFrom("burn", "freeze", "explosion", "corrosion"),
      formulaSupport: fc.constant({ status: "fully-modeled" as const }),
      contributesModifiers: fc.constant(true),
      modifierCount: fc.integer({ min: 1, max: 5 }),
    }),
    { minLength: 0, maxLength: 3 },
  );
}

/**
 * Generate a minimal CalculationInput with modifierSources and modeledEffects.
 */
function arbCalcInput() {
  return fc.tuple(arbModifierSources(), arbModeledEffects()).map(
    ([modifierSources, modeledEffects]) => ({
      modifierSources,
      aggregationReport: { stats: { stats: {}, breakdown: {}, sourceCount: 0 }, duplicates: [], totalSources: 0, activeSources: 0, suppressedCount: 0 },
      pvpMitigation: { totalReductionPercent: 0, sources: [], pvpMode: false, warnings: [] },
      conditionalEffects: [],
      uptimeProfile: "sustained" as const,
      modeledEffects,
      partiallyModeledEffects: [],
      displayOnlyEffects: [],
      unresolvedEffects: [],
      ignoredEffects: [],
      formulaWarnings: [],
      partialSupportNotes: [],
      availableMechanics: [],
      buildMode: "pve" as const,
      enemyType: "unknown",
      totalItemsConsidered: modifierSources.length,
      totalModifiersExtracted: modifierSources.length,
    }),
  );
}

/**
 * Generate a CombatOutput with non-zero DPS so edge derivation has timing info.
 */
function arbCombatOutput() {
  return fc.double({ min: 100, max: 50000, noNaN: true }).map((dps) => ({
    damageOutput: {
      baseDamage: dps * 0.8,
      expectedDamage: dps * 0.9,
      critMultiplier: 1.3,
      weakspotMultiplier: 1.0,
      totalMultiplier: 1.3,
      DPS: dps,
      tickIntervalSeconds: 0.5,
      ticksPerSecond: 2,
    },
    survivability: {
      damageTakenMultiplier: 1.0,
      effectiveHealthMultiplier: 1.0,
      effectiveHealth: undefined,
      incomingDamageAfterMitigation: undefined,
      shotsToDie: undefined,
      survivabilityGainPercent: 0,
    },
    pvpDuel: { outgoingTTK: undefined, incomingTTK: undefined, duelPressure: "Unknown" as const },
    warnings: [],
    assumptions: [],
    buildMode: "pve" as const,
    incomingDPSProvided: false,
    targetHealthProvided: false,
    officialFormula: {
      status: "metadata-only" as const,
      warnings: [],
      officialDamageAvailable: false,
      officialDamage: undefined,
      unresolvedLeaves: [],
      accuracyNote: "",
    },
  }));
}

/**
 * Combined arbitrary for the full deriveBuildGraph input set.
 * Produces builds that will generate edges (weapon + armor + modifier sources).
 */
function arbBuildGraphInput() {
  return fc.tuple(arbBuildSelection(), arbCalcInput(), arbCombatOutput());
}

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

// ─── Property 2: Edge Referential Integrity ───────────────────────────────────

await runProperty("Property 2: Edge Referential Integrity", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true; // Skip non-renderable

      const nodeIds = new Set(result.nodes.map((n) => n.id));

      for (const edge of result.edges) {
        if (!nodeIds.has(edge.source)) {
          throw new Error(
            `Edge "${edge.id}" has source "${edge.source}" not in node set`,
          );
        }
        if (!nodeIds.has(edge.target)) {
          throw new Error(
            `Edge "${edge.id}" has target "${edge.target}" not in node set`,
          );
        }
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 3: No Self-Referencing Edges ────────────────────────────────────

await runProperty("Property 3: No Self-Referencing Edges", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      for (const edge of result.edges) {
        if (edge.source === edge.target) {
          throw new Error(
            `Edge "${edge.id}" has source === target: "${edge.source}"`,
          );
        }
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 4: Edge Weight Bounds ───────────────────────────────────────────

await runProperty("Property 4: Edge Weight Bounds", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      for (const edge of result.edges) {
        if (edge.weight < 0 || edge.weight > 1.0) {
          throw new Error(
            `Edge "${edge.id}" weight out of bounds: ${edge.weight}`,
          );
        }
      }

      // If there are edges, at least one must have weight === 1.0 (normalized max)
      if (result.edges.length > 0) {
        const maxWeight = Math.max(...result.edges.map((e) => e.weight));
        if (maxWeight !== 1.0) {
          throw new Error(
            `Max edge weight is ${maxWeight}, expected 1.0 (normalization)`,
          );
        }
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 6: Directed Flow Integrity ──────────────────────────────────────

await runProperty("Property 6: Directed Flow Integrity", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      for (const edge of result.edges) {
        const sourceIdx = LAYER_ORDER.indexOf(edge.sourceLayer);
        const targetIdx = LAYER_ORDER.indexOf(edge.targetLayer);

        if (sourceIdx < 0) {
          throw new Error(
            `Edge "${edge.id}" has invalid sourceLayer "${edge.sourceLayer}"`,
          );
        }
        if (targetIdx < 0) {
          throw new Error(
            `Edge "${edge.id}" has invalid targetLayer "${edge.targetLayer}"`,
          );
        }
        if (sourceIdx > targetIdx) {
          throw new Error(
            `Edge "${edge.id}" violates directed flow: sourceLayer "${edge.sourceLayer}" (idx ${sourceIdx}) > targetLayer "${edge.targetLayer}" (idx ${targetIdx})`,
          );
        }
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 18: No Invented Synergies ──────────────────────────────────────

await runProperty("Property 18: No Invented Synergies", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      for (const edge of result.edges) {
        if (typeof edge.relation !== "string") {
          throw new Error(
            `Edge "${edge.id}" has non-string relation: ${typeof edge.relation}`,
          );
        }
        if (edge.relation.trim() === "") {
          throw new Error(
            `Edge "${edge.id}" has empty relation (invented synergy)`,
          );
        }
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 21: Edge Deduplication ──────────────────────────────────────────

await runProperty("Property 21: Edge Deduplication", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      const seen = new Set<string>();
      for (const edge of result.edges) {
        const key = `${edge.source}|${edge.target}|${edge.category}`;
        if (seen.has(key)) {
          throw new Error(
            `Duplicate edge tuple: (source="${edge.source}", target="${edge.target}", category="${edge.category}")`,
          );
        }
        seen.add(key);
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 22: Confidence Propagation ──────────────────────────────────────

await runProperty("Property 22: Confidence Propagation", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      const nodeConfMap = new Map<string, ConfidenceLevel>();
      for (const node of result.nodes) {
        nodeConfMap.set(node.id, node.metadata.confidence);
      }

      for (const edge of result.edges) {
        const sourceConf = nodeConfMap.get(edge.source) ?? "placeholder";
        const targetConf = nodeConfMap.get(edge.target) ?? "placeholder";
        const expected = expectedMinConfidence(sourceConf, targetConf);

        if (edge.confidence !== expected) {
          throw new Error(
            `Edge "${edge.id}" confidence = "${edge.confidence}", expected min("${sourceConf}", "${targetConf}") = "${expected}"`,
          );
        }
      }
    }),
    { numRuns: 150 },
  );
});

// ─── Property 24: Metrics Accuracy ───────────────────────────────────────────

await runProperty("Property 24: Metrics Accuracy", () => {
  fc.assert(
    fc.property(arbBuildGraphInput(), ([buildSelection, calcInput, combatOutput]) => {
      const result = deriveBuildGraph(buildSelection as any, calcInput as any, combatOutput as any);
      if (!result.isRenderable) return true;

      // totalEdges === edges.length
      if (result.metrics.totalEdges !== result.edges.length) {
        throw new Error(
          `metrics.totalEdges (${result.metrics.totalEdges}) !== edges.length (${result.edges.length})`,
        );
      }

      // totalNodeCount === nodes.length
      if (result.metrics.totalNodeCount !== result.nodes.length) {
        throw new Error(
          `metrics.totalNodeCount (${result.metrics.totalNodeCount}) !== nodes.length (${result.nodes.length})`,
        );
      }

      // activeNodeCount === nodes.filter(n => n.isActive).length
      const actualActive = result.nodes.filter((n) => n.isActive).length;
      if (result.metrics.activeNodeCount !== actualActive) {
        throw new Error(
          `metrics.activeNodeCount (${result.metrics.activeNodeCount}) !== actual active (${actualActive})`,
        );
      }

      // interLayerEdgeCount === edges.filter(e => e.isInterLayer).length
      const actualInterLayer = result.edges.filter((e) => e.isInterLayer).length;
      if (result.metrics.interLayerEdgeCount !== actualInterLayer) {
        throw new Error(
          `metrics.interLayerEdgeCount (${result.metrics.interLayerEdgeCount}) !== actual (${actualInterLayer})`,
        );
      }
    }),
    { numRuns: 150 },
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
