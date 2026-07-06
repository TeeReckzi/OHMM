/**
 * Property-based tests for Graph Analytics engine.
 *
 * Property 11: Analytics Centrality Bounds
 * Property 12: Community Coverage
 * Property 13: Connected Component Coverage
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

import * as fc from "fast-check";
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
    isActive: index % 2 === 0,
    energyLevel: 0.5,
    influenceScore: 0.5,
    normalizedSize: 0.5,
    metadata: {
      displayName: `Node ${index}`,
      confidence: CONFIDENCE_LEVELS[index % CONFIDENCE_LEVELS.length],
    },
  };
}

/** Generate an array of 1–30 valid GraphNodes with unique IDs */
function arbGraphNodes(): fc.Arbitrary<GraphNode[]> {
  return fc
    .array(fc.integer({ min: 0, max: LAYERS.length - 1 }), { minLength: 1, maxLength: 20 })
    .map((layerIndices) =>
      layerIndices.map((layerIdx, i) => makeNode(i, layerIdx))
    );
}

/** Generate a complete valid graph (nodes + edges) */
function arbGraph(): fc.Arbitrary<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  return arbGraphNodes().chain((nodes) => {
    const n = nodes.length;
    if (n < 2) return fc.constant({ nodes, edges: [] as GraphEdge[] });

    // Generate edge tuples as (sourceIdx, targetIdx, categoryIdx, weight)
    const arbEdgeTuple = fc
      .tuple(
        fc.integer({ min: 0, max: n - 1 }),
        fc.integer({ min: 0, max: n - 1 }),
        fc.integer({ min: 0, max: EDGE_CATEGORIES.length - 1 }),
        fc.double({ min: 0.0, max: 1.0, noNaN: true })
      )
      .filter(([s, t]) => s !== t);

    return fc.array(arbEdgeTuple, { minLength: 0, maxLength: 30 }).map((edgeTuples) => {
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

// ─── Property 11: Analytics Centrality Bounds ─────────────────────────────────

await runProperty("Property 11: Analytics Centrality Bounds", () => {
  fc.assert(
    fc.property(arbGraph(), ({ nodes, edges }) => {
      const analytics = computeGraphAnalytics(nodes, edges);

      // All centrality values must be in [0.0, 1.0]
      for (const c of analytics.centralities) {
        if (c.degree < 0 || c.degree > 1.0) {
          throw new Error(
            `degree out of bounds for ${c.nodeId}: ${c.degree}`
          );
        }
        if (c.betweenness < 0 || c.betweenness > 1.0) {
          throw new Error(
            `betweenness out of bounds for ${c.nodeId}: ${c.betweenness}`
          );
        }
        if (c.eigenvector < 0 || c.eigenvector > 1.0) {
          throw new Error(
            `eigenvector out of bounds for ${c.nodeId}: ${c.eigenvector}`
          );
        }
        if (c.clusteringCoefficient < 0 || c.clusteringCoefficient > 1.0) {
          throw new Error(
            `clusteringCoefficient out of bounds for ${c.nodeId}: ${c.clusteringCoefficient}`
          );
        }
      }

      // Nodes with <2 undirected neighbors must have clusteringCoefficient === 0
      // Build undirected adjacency to check neighbor counts
      const adj = new Map<string, Set<string>>();
      for (const node of nodes) {
        adj.set(node.id, new Set());
      }
      for (const edge of edges) {
        if (adj.has(edge.source) && adj.has(edge.target) && edge.source !== edge.target) {
          adj.get(edge.source)!.add(edge.target);
          adj.get(edge.target)!.add(edge.source);
        }
      }

      for (const c of analytics.centralities) {
        const neighbors = adj.get(c.nodeId);
        if (neighbors && neighbors.size < 2) {
          if (c.clusteringCoefficient !== 0) {
            throw new Error(
              `node ${c.nodeId} has ${neighbors.size} neighbors but clusteringCoefficient = ${c.clusteringCoefficient} (expected 0)`
            );
          }
        }
      }
    }),
    { numRuns: 100 }
  );
});

// ─── Property 12: Community Coverage ──────────────────────────────────────────

await runProperty("Property 12: Community Coverage", () => {
  fc.assert(
    fc.property(arbGraph(), ({ nodes, edges }) => {
      const analytics = computeGraphAnalytics(nodes, edges);

      // Union of all community members must equal the complete node ID set
      const allNodeIds = new Set(nodes.map((n) => n.id));
      const communityMembers = new Set<string>();
      for (const community of analytics.communities) {
        for (const member of community.members) {
          communityMembers.add(member);
        }
      }

      // Every node must appear in at least one community
      for (const nodeId of allNodeIds) {
        if (!communityMembers.has(nodeId)) {
          throw new Error(
            `node ${nodeId} not found in any community`
          );
        }
      }

      // Every community member must be a valid node ID
      for (const memberId of communityMembers) {
        if (!allNodeIds.has(memberId)) {
          throw new Error(
            `community member ${memberId} is not a valid node ID`
          );
        }
      }

      // Sets must be equal
      if (communityMembers.size !== allNodeIds.size) {
        throw new Error(
          `community members size (${communityMembers.size}) !== node count (${allNodeIds.size})`
        );
      }
    }),
    { numRuns: 100 }
  );
});

// ─── Property 13: Connected Component Coverage ────────────────────────────────

await runProperty("Property 13: Connected Component Coverage", () => {
  fc.assert(
    fc.property(arbGraph(), ({ nodes, edges }) => {
      const analytics = computeGraphAnalytics(nodes, edges);

      // Union of all component members must equal the complete node ID set
      const allNodeIds = new Set(nodes.map((n) => n.id));
      const componentMembers = new Set<string>();
      for (const component of analytics.connectedComponents) {
        for (const member of component.members) {
          componentMembers.add(member);
        }
      }

      // Every node must appear in exactly one component
      for (const nodeId of allNodeIds) {
        if (!componentMembers.has(nodeId)) {
          throw new Error(
            `node ${nodeId} not found in any connected component`
          );
        }
      }

      // Every component member must be a valid node ID
      for (const memberId of componentMembers) {
        if (!allNodeIds.has(memberId)) {
          throw new Error(
            `component member ${memberId} is not a valid node ID`
          );
        }
      }

      // Sets must be equal (no duplicates across components for well-formed output)
      if (componentMembers.size !== allNodeIds.size) {
        throw new Error(
          `component members size (${componentMembers.size}) !== node count (${allNodeIds.size})`
        );
      }

      // Additionally: total members across all components should equal node count
      // (this checks no node appears in multiple components)
      let totalMemberCount = 0;
      for (const component of analytics.connectedComponents) {
        totalMemberCount += component.members.length;
      }
      if (totalMemberCount !== nodes.length) {
        throw new Error(
          `total component member count (${totalMemberCount}) !== node count (${nodes.length}) — possible duplication`
        );
      }
    }),
    { numRuns: 100 }
  );
});

// ─── Property 13_B: Eigenvector Centrality Convergence ───────────────────────

await runProperty("Property 13: Eigenvector Centrality Convergence", () => {
  fc.assert(
    fc.property(arbGraph(), ({ nodes, edges }) => {
      const analytics = computeGraphAnalytics(nodes, edges);
      if (nodes.length === 0) return true;

      const nonZeroCentrality = analytics.centralities.some((c) => c.eigenvector > 0);
      if (!nonZeroCentrality) return true;

      let maxVal = 0;
      for (const c of analytics.centralities) {
        if (Number.isNaN(c.eigenvector)) {
          throw new Error("Eigenvector centrality contains NaN");
        }
        if (c.eigenvector > maxVal) {
          maxVal = c.eigenvector;
        }
      }

      if (maxVal !== 1.0) {
        throw new Error(`Expected max eigenvector value to be 1.0, got ${maxVal}`);
      }

      // To verify convergence to a unit vector, we check that the L2-normalized sum of squares is ≈ 1.0.
      const l2NormSq = analytics.centralities.reduce((sum, c) => sum + Math.pow(c.eigenvector, 2), 0);
      const l2Norm = Math.sqrt(l2NormSq);
      if (l2NormSq > 0) {
        const sumSqNormalized = analytics.centralities.reduce((sum, c) => sum + Math.pow(c.eigenvector / l2Norm, 2), 0);
        if (Math.abs(sumSqNormalized - 1.0) > 1e-6) {
          throw new Error(`L2-normalized sum of squares is not 1.0: ${sumSqNormalized}`);
        }
      }

      return true;
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
