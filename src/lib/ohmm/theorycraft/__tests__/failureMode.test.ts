/**
 * Property-based tests for Failure Mode engine.
 *
 * Property 16: Failure Mode Non-Mutation
 * Property 17: Failure Mode Cohesion Drop Formula
 * Property 27: Failure Mode Severity Consistency
 *
 * **Validates: Requirements 6.1, 6.3, 6.4**
 */

import * as fc from "fast-check";
import { computeFailureImpact } from "../failureMode";
import { computeGraphAnalytics } from "../graphAnalytics";
import type {
  GraphNode,
  GraphEdge,
  GraphAnalytics,
  GraphLayer,
  EdgeCategory,
  ConfidenceLevel,
} from "../buildGraph.types";
import { LAYER_ORDER } from "../buildGraph.types";

// ─── Constants for Generators ─────────────────────────────────────────────────

const LAYERS: GraphLayer[] = [...LAYER_ORDER];

const CATEGORIES_BY_LAYER: Record<GraphLayer, string[]> = {
  equipment: ["weapon", "armor", "mod-core", "mod-suffix", "food", "deviant", "cradle"],
  stats: ["offensive", "defensive", "utility", "status"],
  keywords: ["elemental", "physical", "psi", "compound"],
  "status-effects": ["offensive", "defensive", "utility", "status"],
  "combat-formula": ["additive-group", "multiplicative-group", "base-damage"],
  "final-output": ["dps", "ttk", "expected-damage"],
};

const EDGE_CATEGORIES: EdgeCategory[] = [
  "damage", "defense", "resource", "cooldown", "status",
  "scaling", "conversion", "trigger", "proc", "conditional",
  "enemy", "environmental", "set-bonus", "stat-stacking",
  "modifier-amplify", "combo-synergy",
];

const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "project_verified", "observed", "estimated", "placeholder",
];

// ─── Arbitrary Generators ─────────────────────────────────────────────────────

/** Build a GraphNode from a layer index and a node index */
function makeNode(index: number, layerIdx: number): GraphNode {
  const layer = LAYERS[layerIdx % LAYERS.length];
  const categories = CATEGORIES_BY_LAYER[layer];
  const category = categories[index % categories.length];
  return {
    id: `node-${index}`,
    label: `Node ${index}`,
    layer,
    category: category as GraphNode["category"],
    isActive: true,
    energyLevel: 0.5,
    influenceScore: 0.5,
    normalizedSize: 0.5,
    metadata: {
      displayName: `Node ${index}`,
      confidence: CONFIDENCE_LEVELS[index % CONFIDENCE_LEVELS.length],
    },
  };
}

/** Generate an array of 2–15 valid GraphNodes with unique IDs */
function arbGraphNodes(): fc.Arbitrary<GraphNode[]> {
  return fc
    .array(fc.integer({ min: 0, max: LAYERS.length - 1 }), { minLength: 2, maxLength: 15 })
    .map((layerIndices) =>
      layerIndices.map((layerIdx, i) => makeNode(i, layerIdx))
    );
}

/** Generate a complete valid graph (nodes + edges + analytics) with a random removedNodeId */
function arbGraphWithTarget(): fc.Arbitrary<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  analytics: GraphAnalytics;
  removedNodeId: string;
}> {
  return arbGraphNodes().chain((nodes) => {
    const n = nodes.length;

    // Generate edge tuples as (sourceIdx, targetIdx, categoryIdx, weight)
    const arbEdgeTuple = fc
      .tuple(
        fc.integer({ min: 0, max: n - 1 }),
        fc.integer({ min: 0, max: n - 1 }),
        fc.integer({ min: 0, max: EDGE_CATEGORIES.length - 1 }),
        fc.double({ min: 0.01, max: 1.0, noNaN: true })
      )
      .filter(([s, t]) => s !== t);

    // Pick a random node index to remove
    const arbTargetIdx = fc.integer({ min: 0, max: n - 1 });

    return fc
      .tuple(
        fc.array(arbEdgeTuple, { minLength: 1, maxLength: 30 }),
        arbTargetIdx
      )
      .map(([edgeTuples, targetIdx]) => {
        const edges: GraphEdge[] = edgeTuples.map(([sourceIdx, targetIdx, catIdx, weight], i) => ({
          id: `edge-${i}`,
          source: `node-${sourceIdx}`,
          target: `node-${targetIdx}`,
          category: EDGE_CATEGORIES[catIdx],
          isInterLayer: nodes[sourceIdx].layer !== nodes[targetIdx].layer,
          sourceLayer: nodes[sourceIdx].layer,
          targetLayer: nodes[targetIdx].layer,
          weight,
          directed: true as const,
          relation: `relation-${sourceIdx}-${targetIdx}`,
          description: `Edge from node-${sourceIdx} to node-${targetIdx}`,
          confidence: CONFIDENCE_LEVELS[i % CONFIDENCE_LEVELS.length],
          combinedValue: weight * 100,
        }));

        const analytics = computeGraphAnalytics(nodes, edges);
        const removedNodeId = `node-${targetIdx}`;

        return { nodes, edges, analytics, removedNodeId };
      });
  });
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

// ─── Property 16: Failure Mode Non-Mutation ───────────────────────────────────

await runProperty("Property 16: Failure Mode Non-Mutation", () => {
  fc.assert(
    fc.property(arbGraphWithTarget(), ({ nodes, edges, analytics, removedNodeId }) => {
      // Deep clone before the call
      const nodesBefore = JSON.stringify(nodes);
      const edgesBefore = JSON.stringify(edges);
      const analyticsBefore = JSON.stringify(analytics);

      // Call the function
      computeFailureImpact(nodes, edges, analytics, removedNodeId);

      // Verify deep equality after the call
      const nodesAfter = JSON.stringify(nodes);
      const edgesAfter = JSON.stringify(edges);
      const analyticsAfter = JSON.stringify(analytics);

      if (nodesBefore !== nodesAfter) {
        throw new Error(
          `nodes were mutated after computeFailureImpact call for removedNodeId="${removedNodeId}"`
        );
      }
      if (edgesBefore !== edgesAfter) {
        throw new Error(
          `edges were mutated after computeFailureImpact call for removedNodeId="${removedNodeId}"`
        );
      }
      if (analyticsBefore !== analyticsAfter) {
        throw new Error(
          `analytics were mutated after computeFailureImpact call for removedNodeId="${removedNodeId}"`
        );
      }
    }),
    { numRuns: 100 }
  );
});

// ─── Property 17: Failure Mode Cohesion Drop Formula ──────────────────────────

await runProperty("Property 17: Failure Mode Cohesion Drop Formula", () => {
  fc.assert(
    fc.property(arbGraphWithTarget(), ({ nodes, edges, analytics, removedNodeId }) => {
      const result = computeFailureImpact(nodes, edges, analytics, removedNodeId);

      if (result.originalCohesion > 0) {
        // Verify: cohesionDropPercent ≈ ((original - reduced) / original) × 100
        const expected =
          ((result.originalCohesion - result.reducedCohesion) / result.originalCohesion) * 100;
        const diff = Math.abs(result.cohesionDropPercent - expected);

        if (diff > 0.001) {
          throw new Error(
            `cohesionDropPercent mismatch for removedNodeId="${removedNodeId}": ` +
            `got ${result.cohesionDropPercent}, expected ${expected} ` +
            `(originalCohesion=${result.originalCohesion}, reducedCohesion=${result.reducedCohesion})`
          );
        }
      } else {
        // When originalCohesion === 0, cohesionDropPercent must be 0
        if (result.cohesionDropPercent !== 0) {
          throw new Error(
            `cohesionDropPercent should be 0 when originalCohesion is 0, ` +
            `but got ${result.cohesionDropPercent} for removedNodeId="${removedNodeId}"`
          );
        }
      }
    }),
    { numRuns: 100 }
  );
});

// ─── Property 27: Failure Mode Severity Consistency ───────────────────────────

await runProperty("Property 27: Failure Mode Severity Consistency", () => {
  fc.assert(
    fc.property(arbGraphWithTarget(), ({ nodes, edges, analytics, removedNodeId }) => {
      const result = computeFailureImpact(nodes, edges, analytics, removedNodeId);
      const drop = result.cohesionDropPercent;
      const severity = result.severity;

      // Verify severity matches cohesionDropPercent thresholds
      let expectedSeverity: string;
      if (drop < 5) {
        expectedSeverity = "negligible";
      } else if (drop < 15) {
        expectedSeverity = "minor";
      } else if (drop < 30) {
        expectedSeverity = "moderate";
      } else if (drop < 50) {
        expectedSeverity = "major";
      } else {
        expectedSeverity = "critical";
      }

      if (severity !== expectedSeverity) {
        throw new Error(
          `severity mismatch for removedNodeId="${removedNodeId}": ` +
          `cohesionDropPercent=${drop}, got severity="${severity}", ` +
          `expected severity="${expectedSeverity}"`
        );
      }
    }),
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
