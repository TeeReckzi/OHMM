/**
 * Property-based tests for Build Insights engine.
 *
 * Property 14: Insight engine referential integrity and ordering
 * Property 15: Overall rating matches cohesion score brackets
 *
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

import * as fc from "fast-check";
import { generateBuildInsights } from "../buildGraphInsights";
import { computeGraphAnalytics } from "../graphAnalytics";
import type {
  GraphNode,
  GraphEdge,
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

function makeNode(index: number, layerIdx: number): GraphNode {
  const layer = LAYERS[layerIdx % LAYERS.length];
  const categories = CATEGORIES_BY_LAYER[layer];
  const category = categories[index % categories.length];
  return {
    id: `node-${index}`,
    label: `Node ${index}`,
    layer,
    category: category as GraphNode["category"],
    isActive: index % 2 === 0,
    energyLevel: (index % 10) / 10, // ranges 0.0 to 0.9 to trigger some low-energy conditions
    influenceScore: 0.5,
    normalizedSize: 0.5,
    metadata: {
      displayName: `Node ${index}`,
      confidence: CONFIDENCE_LEVELS[index % CONFIDENCE_LEVELS.length],
    },
  };
}

function arbGraphNodes(): fc.Arbitrary<GraphNode[]> {
  return fc
    .array(fc.integer({ min: 0, max: LAYERS.length - 1 }), { minLength: 1, maxLength: 30 })
    .map((layerIndices) =>
      layerIndices.map((layerIdx, i) => makeNode(i, layerIdx))
    );
}

function arbGraph(): fc.Arbitrary<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  return arbGraphNodes().chain((nodes) => {
    const n = nodes.length;
    if (n < 2) return fc.constant({ nodes, edges: [] as GraphEdge[] });

    const arbEdgeTuple = fc
      .tuple(
        fc.integer({ min: 0, max: n - 1 }),
        fc.integer({ min: 0, max: n - 1 }),
        fc.integer({ min: 0, max: EDGE_CATEGORIES.length - 1 }),
        fc.double({ min: 0.0, max: 1.0, noNaN: true })
      )
      .filter(([s, t]) => s !== t);

    return fc.array(arbEdgeTuple, { minLength: 0, maxLength: 40 }).map((edgeTuples) => {
      const edges: GraphEdge[] = edgeTuples.map(([sourceIdx, targetIdx, catIdx, weight], i) => ({
        id: `edge-${i}`,
        source: `node-${sourceIdx}`,
        target: `node-${targetIdx}`,
        category: EDGE_CATEGORIES[catIdx],
        isInterLayer: true,
        sourceLayer: nodes[sourceIdx].layer,
        targetLayer: nodes[targetIdx].layer,
        weight,
        directed: true as const,
        relation: `relation-${sourceIdx}-${targetIdx}`,
        description: `Edge from node-${sourceIdx} to node-${targetIdx}`,
        confidence: CONFIDENCE_LEVELS[i % CONFIDENCE_LEVELS.length],
        combinedValue: weight * 100,
      }));
      return { nodes, edges };
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

// ─── Property 14: Insight Engine Integrity ───────────────────────────────────

await runProperty("Property 14: Insight engine referential integrity and ordering", () => {
  fc.assert(
    fc.property(
      arbGraph(),
      fc.double({ min: 0.0, max: 1.0, noNaN: true }),
      ({ nodes, edges }, cohesionScore) => {
        const analytics = computeGraphAnalytics(nodes, edges);
        const result = generateBuildInsights(nodes, edges, analytics, cohesionScore);

        // 1. Never throw, always return a valid result shape
        if (!result || !Array.isArray(result.insights)) {
          throw new Error("Result is missing insights array.");
        }
        if (typeof result.overallRating !== "string" || typeof result.summary !== "string") {
          throw new Error("Result is missing overallRating or summary.");
        }

        // Limit maximum size to 7
        if (result.insights.length > 7) {
          throw new Error(`Returned too many insights: ${result.insights.length}`);
        }

        // 2. Referential integrity: relatedNodes must reference valid node IDs in nodes
        const nodeIds = new Set(nodes.map((n) => n.id));
        for (const insight of result.insights) {
          for (const nodeId of insight.relatedNodes) {
            if (!nodeIds.has(nodeId)) {
              throw new Error(`Insight relatedNode references missing node ID: ${nodeId}`);
            }
          }
        }

        // 3. Priorities must be strictly sorted descending
        for (let i = 0; i < result.insights.length - 1; i++) {
          if (result.insights[i].priority < result.insights[i + 1].priority) {
            throw new Error(
              `Insights not sorted descending. Index ${i} priority: ${result.insights[i].priority}, Index ${i + 1} priority: ${result.insights[i + 1].priority}`
            );
          }
        }

        // 4. IDs must be unique
        const insightIds = new Set<string>();
        for (const insight of result.insights) {
          if (insightIds.has(insight.id)) {
            throw new Error(`Duplicate insight ID detected: ${insight.id}`);
          }
          insightIds.add(insight.id);
        }

        // 5. Test degenerate/empty inputs do not throw
        const degenerateResult = generateBuildInsights([], [], analytics, NaN);
        if (degenerateResult.insights.length !== 0 || degenerateResult.overallRating !== "weak") {
          throw new Error("Expected degenerate/empty inputs to return empty insights and 'weak' rating.");
        }

        return true;
      }
    ),
    { numRuns: 100 }
  );
});

// ─── Property 15: Rating Brackets ────────────────────────────────────────────

await runProperty("Property 15: Overall rating matches cohesion score brackets", () => {
  fc.assert(
    fc.property(
      arbGraph(),
      fc.double({ noNaN: true }), // any double, including out of range
      ({ nodes, edges }, cohesionScore) => {
        const analytics = computeGraphAnalytics(nodes, edges);
        const result = generateBuildInsights(nodes, edges, analytics, cohesionScore);

        let expectedRating: "weak" | "average" | "strong" | "optimal" = "weak";
        if (cohesionScore >= 0.75) expectedRating = "optimal";
        else if (cohesionScore >= 0.55) expectedRating = "strong";
        else if (cohesionScore >= 0.35) expectedRating = "average";

        if (result.overallRating !== expectedRating) {
          throw new Error(
            `Cohesion score: ${cohesionScore}, expected rating: ${expectedRating}, got: ${result.overallRating}`
          );
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
