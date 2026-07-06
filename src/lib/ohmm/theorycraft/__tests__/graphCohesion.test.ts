/**
 * Property-based tests for Graph Cohesion engine.
 *
 * Property 9: Cohesion Score Bounds — score always in [0.0, 1.0]
 * Property 10: Cohesion Label Consistency — label matches score per COHESION_THRESHOLDS
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * Run via: npx tsx src/lib/ohmm/theorycraft/__tests__/graphCohesion.test.ts
 */

import fc from "fast-check";
import { computeCohesion } from "../graphCohesion";
import { computeGraphAnalytics } from "../graphAnalytics";
import { COHESION_THRESHOLDS } from "../buildGraph.constants";
import type { GraphNode, GraphEdge, GraphLayer } from "../buildGraph.types";
import { LAYER_ORDER } from "../buildGraph.types";

// ─── Constants for Generation ─────────────────────────────────────────────────

const VALID_LAYERS: GraphLayer[] = [
  "equipment",
  "stats",
  "keywords",
  "status-effects",
  "combat-formula",
  "final-output",
];

const VALID_CATEGORIES = [
  "weapon", "armor", "mod-core", "mod-suffix", "food", "deviant", "cradle",
  "offensive", "defensive", "utility", "status",
  "elemental", "physical", "psi", "compound",
  "additive-group", "multiplicative-group", "base-damage",
  "dps", "ttk", "expected-damage",
] as const;

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Generate a unique node ID */
const arbNodeId = (index: number) => `node-${index}`;

/** Generate a valid GraphNode */
function arbGraphNode(id: string): fc.Arbitrary<GraphNode> {
  return fc.record({
    id: fc.constant(id),
    label: fc.string({ minLength: 1, maxLength: 15 }),
    layer: fc.constantFrom(...VALID_LAYERS),
    category: fc.constantFrom(...VALID_CATEGORIES) as fc.Arbitrary<GraphNode["category"]>,
    isActive: fc.boolean(),
    energyLevel: fc.double({ min: 0.05, max: 1.0, noNaN: true }),
    influenceScore: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    normalizedSize: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    metadata: fc.record({
      displayName: fc.string({ minLength: 1, maxLength: 15 }),
      primaryValue: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: undefined }),
      formattedValue: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
      confidence: fc.constantFrom("project_verified", "observed", "estimated", "placeholder") as fc.Arbitrary<GraphNode["metadata"]["confidence"]>,
      dpsContribution: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
      layerData: fc.constant(undefined),
    }),
  });
}

/** Generate an array of 0-20 nodes with unique IDs */
const arbNodes: fc.Arbitrary<GraphNode[]> = fc.integer({ min: 0, max: 20 }).chain((count) => {
  if (count === 0) return fc.constant([]);
  const nodeArbs = Array.from({ length: count }, (_, i) => arbGraphNode(arbNodeId(i)));
  return fc.tuple(...(nodeArbs as [fc.Arbitrary<GraphNode>, ...fc.Arbitrary<GraphNode>[]]));
}).map((result) => (Array.isArray(result) ? result : []));

/** Generate edges that reference valid node IDs, with matching layers */
function arbEdgesForNodes(nodes: GraphNode[]): fc.Arbitrary<GraphEdge[]> {
  if (nodes.length < 2) return fc.constant([]);

  const maxEdges = Math.min(40, nodes.length * (nodes.length - 1));
  const edgeCount = fc.integer({ min: 0, max: maxEdges });

  return edgeCount.chain((count) => {
    if (count === 0) return fc.constant([]);

    const edgeArbs: fc.Arbitrary<GraphEdge>[] = [];
    for (let i = 0; i < count; i++) {
      edgeArbs.push(arbSingleEdge(nodes, i));
    }
    return fc.tuple(...(edgeArbs as [fc.Arbitrary<GraphEdge>, ...fc.Arbitrary<GraphEdge>[]])).map(
      (edges) => edges
    );
  });
}

/** Generate a single valid edge referencing nodes in the array */
function arbSingleEdge(nodes: GraphNode[], index: number): fc.Arbitrary<GraphEdge> {
  // Pick two distinct node indices
  return fc.tuple(
    fc.integer({ min: 0, max: nodes.length - 1 }),
    fc.integer({ min: 0, max: nodes.length - 1 }),
    fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    fc.constantFrom(
      "damage", "defense", "resource", "cooldown", "status", "scaling",
      "conversion", "trigger", "proc", "conditional", "enemy", "environmental",
      "set-bonus", "stat-stacking", "modifier-amplify", "combo-synergy"
    ) as fc.Arbitrary<GraphEdge["category"]>,
    fc.string({ minLength: 1, maxLength: 10 }),
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.constantFrom("project_verified", "observed", "estimated", "placeholder") as fc.Arbitrary<GraphEdge["confidence"]>,
    fc.double({ min: 0, max: 100, noNaN: true }),
  ).map(([srcIdx, tgtIdx, weight, category, relation, description, confidence, combinedValue]) => {
    // Ensure source !== target
    let actualTgtIdx = tgtIdx;
    if (srcIdx === actualTgtIdx) {
      actualTgtIdx = (actualTgtIdx + 1) % nodes.length;
    }

    const sourceNode = nodes[srcIdx];
    const targetNode = nodes[actualTgtIdx];
    const sourceLayer = sourceNode.layer;
    const targetLayer = targetNode.layer;
    const isInterLayer = sourceLayer !== targetLayer;

    return {
      id: `edge-${index}`,
      source: sourceNode.id,
      target: targetNode.id,
      category,
      isInterLayer,
      sourceLayer,
      targetLayer,
      weight,
      directed: true as const,
      relation,
      description,
      confidence,
      combinedValue,
    };
  });
}

/**
 * Combined arbitrary: generates nodes and matching edges together.
 * Ensures both degenerate (<2 active nodes) and non-degenerate cases are generated.
 */
const arbGraph: fc.Arbitrary<{ nodes: GraphNode[]; edges: GraphEdge[] }> = arbNodes.chain(
  (nodes) => arbEdgesForNodes(nodes).map((edges) => ({ nodes, edges }))
);

// ─── Test Runner ──────────────────────────────────────────────────────────────

interface PropertyResult {
  name: string;
  passed: boolean;
  error?: string;
  counterexample?: string;
}

async function runProperty(
  name: string,
  testFn: () => void
): Promise<PropertyResult> {
  try {
    testFn();
    return { name, passed: true };
  } catch (e: any) {
    const message = e?.message ?? String(e);
    // Extract counterexample from fast-check error
    const counterexampleMatch = message.match(/Counterexample:([^\n]+)/);
    return {
      name,
      passed: false,
      error: message,
      counterexample: counterexampleMatch?.[1]?.trim() ?? message.slice(0, 500),
    };
  }
}

async function main() {
  const results: PropertyResult[] = [];

  // ─── Property 9: Cohesion Score Bounds ────────────────────────────────────
  results.push(
    await runProperty("Property 9: Cohesion Score Bounds", () => {
      fc.assert(
        fc.property(arbGraph, ({ nodes, edges }) => {
          const analytics = computeGraphAnalytics(nodes, edges);
          const cohesion = computeCohesion(nodes, edges, analytics);

          // Score must be in [0.0, 1.0]
          if (typeof cohesion.score !== "number") {
            throw new Error(`Score is not a number: ${cohesion.score}`);
          }
          if (Number.isNaN(cohesion.score)) {
            throw new Error(`Score is NaN`);
          }
          if (cohesion.score < 0.0 || cohesion.score > 1.0) {
            throw new Error(
              `Score ${cohesion.score} is outside [0.0, 1.0]`
            );
          }

          // All 5 component values must each be in [0.0, 1.0]
          const { components } = cohesion;
          const componentEntries = Object.entries(components) as [string, number][];
          for (const [key, value] of componentEntries) {
            if (typeof value !== "number") {
              throw new Error(`Component ${key} is not a number: ${value}`);
            }
            if (Number.isNaN(value)) {
              throw new Error(`Component ${key} is NaN`);
            }
            if (value < 0.0 || value > 1.0) {
              throw new Error(
                `Component ${key} = ${value} is outside [0.0, 1.0]`
              );
            }
          }

          return true;
        }),
        { numRuns: 300 }
      );
    })
  );

  // ─── Property 10: Cohesion Label Consistency ──────────────────────────────
  results.push(
    await runProperty("Property 10: Cohesion Label Consistency", () => {
      fc.assert(
        fc.property(arbGraph, ({ nodes, edges }) => {
          const analytics = computeGraphAnalytics(nodes, edges);
          const cohesion = computeCohesion(nodes, edges, analytics);

          const { score, label } = cohesion;

          // Determine expected label based on score and COHESION_THRESHOLDS
          let expectedLabel: string;
          if (score < COHESION_THRESHOLDS.scattered) {
            expectedLabel = "Scattered";
          } else if (score < COHESION_THRESHOLDS.loose) {
            expectedLabel = "Loose";
          } else if (score < COHESION_THRESHOLDS.moderate) {
            expectedLabel = "Moderate";
          } else if (score < COHESION_THRESHOLDS.tight) {
            expectedLabel = "Tight";
          } else {
            expectedLabel = "Unified";
          }

          if (label !== expectedLabel) {
            throw new Error(
              `Score ${score} should yield label "${expectedLabel}" but got "${label}"`
            );
          }

          // Also verify label is one of the valid labels
          const validLabels = ["Scattered", "Loose", "Moderate", "Tight", "Unified"];
          if (!validLabels.includes(label)) {
            throw new Error(`Label "${label}" is not a valid cohesion label`);
          }

          return true;
        }),
        { numRuns: 300 }
      );
    })
  );

  // ─── Output Results ─────────────────────────────────────────────────────────
  let allPassed = true;
  for (const result of results) {
    if (result.passed) {
      console.log(`[PASS] ${result.name}`);
    } else {
      console.log(`[FAIL] ${result.name}`);
      console.log(`  Counterexample: ${result.counterexample}`);
      if (result.error && result.error !== result.counterexample) {
        console.log(`  Error: ${result.error?.slice(0, 300)}`);
      }
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
}

main();
