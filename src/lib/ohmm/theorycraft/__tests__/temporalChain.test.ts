/**
 * Property-based tests for Temporal Combat Chain engine.
 *
 * Property 14: Temporal Chain Ordering — frames strictly increasing by timestamp
 * Property 15: Temporal Chain Node References — every activeNodeId references valid node
 *
 * **Validates: Requirements 7.2, 7.3**
 */

import * as fc from "fast-check";
import { buildTemporalChain } from "../temporalChain";
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

/** Generate a valid GraphNode for a non-weapon slot with a specific index-based ID */
function arbNonWeaponNode(index: number): fc.Arbitrary<GraphNode> {
  // Layers beyond equipment for variety
  const NON_WEAPON_LAYERS: GraphLayer[] = ["stats", "keywords", "status-effects", "combat-formula", "final-output"];

  return fc.record({
    layer: fc.constantFrom(...NON_WEAPON_LAYERS),
    isActive: fc.boolean(),
    energyLevel: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    influenceScore: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    normalizedSize: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
  }).map(({ layer, isActive, energyLevel, influenceScore, normalizedSize }) => {
    const categories = CATEGORIES_BY_LAYER[layer];
    const category = categories[index % categories.length];
    return {
      id: `node-${index}`,
      label: `Node ${index}`,
      layer,
      category: category as GraphNode["category"],
      isActive,
      energyLevel,
      influenceScore,
      normalizedSize,
      metadata: {
        displayName: `Node ${index}`,
        confidence: CONFIDENCE_LEVELS[index % CONFIDENCE_LEVELS.length],
      },
    };
  });
}

/** Generate a weapon node (always layer=equipment, category=weapon) */
function arbWeaponNode(): fc.Arbitrary<GraphNode> {
  return fc.record({
    energyLevel: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    influenceScore: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
    normalizedSize: fc.double({ min: 0.0, max: 1.0, noNaN: true }),
  }).map(({ energyLevel, influenceScore, normalizedSize }) => ({
    id: "weapon-0",
    label: "Weapon",
    layer: "equipment" as GraphLayer,
    category: "weapon" as GraphNode["category"],
    isActive: true,
    energyLevel,
    influenceScore,
    normalizedSize,
    metadata: {
      displayName: "Weapon",
      primaryValue: 1000,
      confidence: "project_verified" as ConfidenceLevel,
    },
  }));
}

/**
 * Generate a valid graph that includes a weapon node + 2–14 additional nodes
 * with edges connecting weapon to downstream nodes (ensuring BFS can reach them).
 */
function arbValidGraph(): fc.Arbitrary<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  return fc.integer({ min: 2, max: 14 }).chain((extraCount) => {
    const nodeArbs: fc.Arbitrary<GraphNode>[] = [];
    for (let i = 0; i < extraCount; i++) {
      nodeArbs.push(arbNonWeaponNode(i + 1));
    }

    return fc.tuple(
      arbWeaponNode(),
      ...(nodeArbs as [fc.Arbitrary<GraphNode>, ...fc.Arbitrary<GraphNode>[]])
    ).chain((nodesTuple) => {
      const nodes = Array.from(nodesTuple) as GraphNode[];
      const nodeCount = nodes.length;

      // Generate edges from weapon to at least some downstream nodes
      // to ensure BFS traversal produces frames
      return arbConnectedEdges(nodes).map((edges) => ({ nodes, edges }));
    });
  });
}

/** Generate edges that ensure connectivity from weapon-0 to other nodes */
function arbConnectedEdges(nodes: GraphNode[]): fc.Arbitrary<GraphEdge[]> {
  const nodeCount = nodes.length;
  if (nodeCount < 2) return fc.constant([]);

  // Always create at least one edge from weapon-0 (index 0) to another node
  // Then generate additional random edges
  return fc.record({
    extraEdgeCount: fc.integer({ min: 0, max: Math.min(20, nodeCount * 2) }),
  }).chain(({ extraEdgeCount }) => {
    // Generate mandatory edges from weapon (index 0) to ensure reachability
    const mandatoryEdgeArbs: fc.Arbitrary<GraphEdge>[] = [];

    // Connect weapon to a subset of other nodes (at least 1)
    const minConnections = Math.min(nodeCount - 1, 2);
    for (let i = 1; i <= minConnections; i++) {
      mandatoryEdgeArbs.push(
        fc.record({
          category: fc.constantFrom(...EDGE_CATEGORIES),
          weight: fc.double({ min: 0.01, max: 1.0, noNaN: true }),
          confidence: fc.constantFrom(...CONFIDENCE_LEVELS),
        }).map(({ category, weight, confidence }) => ({
          id: `edge-0-${i}-${category}`,
          source: nodes[0].id,
          target: nodes[i].id,
          category,
          isInterLayer: true,
          sourceLayer: nodes[0].layer,
          targetLayer: nodes[i].layer,
          weight,
          directed: true as const,
          relation: `relation-0-${i}`,
          description: `Edge from ${nodes[0].id} to ${nodes[i].id}`,
          confidence,
          combinedValue: weight * 100,
        }))
      );
    }

    // Generate additional random edges between any non-self pairs
    const extraEdgeArbs: fc.Arbitrary<GraphEdge>[] = [];
    for (let e = 0; e < extraEdgeCount; e++) {
      extraEdgeArbs.push(
        fc.record({
          sourceIdx: fc.integer({ min: 0, max: nodeCount - 1 }),
          targetIdx: fc.integer({ min: 0, max: nodeCount - 1 }),
          category: fc.constantFrom(...EDGE_CATEGORIES),
          weight: fc.double({ min: 0.01, max: 1.0, noNaN: true }),
          confidence: fc.constantFrom(...CONFIDENCE_LEVELS),
        }).filter(({ sourceIdx, targetIdx }) => sourceIdx !== targetIdx)
          .map(({ sourceIdx, targetIdx, category, weight, confidence }) => ({
            id: `edge-${sourceIdx}-${targetIdx}-${category}-${e}`,
            source: nodes[sourceIdx].id,
            target: nodes[targetIdx].id,
            category,
            isInterLayer: true,
            sourceLayer: nodes[sourceIdx].layer,
            targetLayer: nodes[targetIdx].layer,
            weight,
            directed: true as const,
            relation: `relation-${sourceIdx}-${targetIdx}`,
            description: `Edge from ${nodes[sourceIdx].id} to ${nodes[targetIdx].id}`,
            confidence,
            combinedValue: weight * 100,
          }))
      );
    }

    const allEdgeArbs = [...mandatoryEdgeArbs, ...extraEdgeArbs];
    if (allEdgeArbs.length === 0) return fc.constant([]);

    return fc.tuple(
      ...(allEdgeArbs as [fc.Arbitrary<GraphEdge>, ...fc.Arbitrary<GraphEdge>[]])
    ).map((edgeTuple) => Array.from(edgeTuple));
  });
}

/** Generate a valid combatOutput with positive DPS */
function arbCombatOutput(): fc.Arbitrary<any> {
  return fc.record({
    DPS: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    baseDamagePerHit: fc.oneof(
      fc.constant(undefined),
      fc.double({ min: 1, max: 50000, noNaN: true }),
    ),
    fireRate: fc.oneof(
      fc.constant(undefined),
      fc.double({ min: 0.5, max: 20, noNaN: true }),
    ),
  }).map(({ DPS, baseDamagePerHit, fireRate }) => ({
    damageOutput: {
      DPS,
      ...(baseDamagePerHit !== undefined ? { baseDamagePerHit } : {}),
      ...(fireRate !== undefined ? { fireRate } : {}),
    },
  }));
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

// ─── Property 14: Temporal Chain Ordering ─────────────────────────────────────

await runProperty("Property 14: Temporal Chain Ordering", () => {
  fc.assert(
    fc.property(
      arbValidGraph(),
      arbCombatOutput(),
      ({ nodes, edges }, combatOutput) => {
        const chain = buildTemporalChain(combatOutput, nodes, edges);

        // If chain is null, the property trivially holds (no frames to check)
        if (chain === null) return;

        const { frames } = chain;

        // All timestamps must be non-negative integers
        for (let i = 0; i < frames.length; i++) {
          const ts = frames[i].timestamp;
          if (ts < 0) {
            throw new Error(
              `Frame ${i} has negative timestamp: ${ts}`
            );
          }
          if (!Number.isInteger(ts)) {
            throw new Error(
              `Frame ${i} has non-integer timestamp: ${ts}`
            );
          }
        }

        // Timestamps must be strictly increasing
        for (let i = 0; i < frames.length - 1; i++) {
          if (frames[i].timestamp >= frames[i + 1].timestamp) {
            throw new Error(
              `Timestamps not strictly increasing at index ${i}: ` +
              `frames[${i}].timestamp=${frames[i].timestamp} >= ` +
              `frames[${i + 1}].timestamp=${frames[i + 1].timestamp}`
            );
          }
        }
      }
    ),
    { numRuns: 200 }
  );
});

// ─── Property 15: Temporal Chain Node References ──────────────────────────────

await runProperty("Property 15: Temporal Chain Node References", () => {
  fc.assert(
    fc.property(
      arbValidGraph(),
      arbCombatOutput(),
      ({ nodes, edges }, combatOutput) => {
        const chain = buildTemporalChain(combatOutput, nodes, edges);

        // If chain is null, the property trivially holds
        if (chain === null) return;

        const { frames } = chain;
        const validNodeIds = new Set(nodes.map((n) => n.id));
        const validEdgeIds = new Set(edges.map((e) => e.id));

        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];

          // Every activeNodeId must reference a valid node
          if (!validNodeIds.has(frame.activeNodeId)) {
            throw new Error(
              `Frame ${i} activeNodeId "${frame.activeNodeId}" does not reference a valid node. ` +
              `Valid node IDs: [${[...validNodeIds].join(", ")}]`
            );
          }

          // Every non-null activeEdgeId must reference a valid edge
          if (frame.activeEdgeId !== null && !validEdgeIds.has(frame.activeEdgeId)) {
            throw new Error(
              `Frame ${i} activeEdgeId "${frame.activeEdgeId}" does not reference a valid edge. ` +
              `Valid edge IDs: [${[...validEdgeIds].join(", ")}]`
            );
          }
        }
      }
    ),
    { numRuns: 200 }
  );
});

// ─── Null-return cases ────────────────────────────────────────────────────────

await runProperty("Null-return cases verified", () => {
  // Case 1: DPS is 0
  const weaponNode: GraphNode = {
    id: "weapon-0",
    label: "Weapon",
    layer: "equipment",
    category: "weapon",
    isActive: true,
    energyLevel: 1.0,
    influenceScore: 1.0,
    normalizedSize: 1.0,
    metadata: { displayName: "Weapon", confidence: "project_verified" },
  };

  const statNode: GraphNode = {
    id: "stat-1",
    label: "Crit Rate",
    layer: "stats",
    category: "offensive",
    isActive: true,
    energyLevel: 0.5,
    influenceScore: 0.5,
    normalizedSize: 0.5,
    metadata: { displayName: "Crit Rate", confidence: "observed" },
  };

  const edge: GraphEdge = {
    id: "edge-0-1",
    source: "weapon-0",
    target: "stat-1",
    category: "damage",
    isInterLayer: true,
    sourceLayer: "equipment",
    targetLayer: "stats",
    weight: 0.8,
    directed: true,
    relation: "crit-contribution",
    description: "Weapon → Crit Rate",
    confidence: "observed",
    combinedValue: 80,
  };

  const nodes = [weaponNode, statNode];
  const edges = [edge];

  // DPS = 0 → null
  const result1 = buildTemporalChain({ damageOutput: { DPS: 0 } }, nodes, edges);
  if (result1 !== null) {
    throw new Error("Expected null when DPS is 0, got non-null");
  }

  // DPS = undefined → null
  const result2 = buildTemporalChain({ damageOutput: { DPS: undefined } }, nodes, edges);
  if (result2 !== null) {
    throw new Error("Expected null when DPS is undefined, got non-null");
  }

  // DPS = NaN → null
  const result3 = buildTemporalChain({ damageOutput: { DPS: NaN } }, nodes, edges);
  if (result3 !== null) {
    throw new Error("Expected null when DPS is NaN, got non-null");
  }

  // combatOutput null → null
  const result4 = buildTemporalChain(null, nodes, edges);
  if (result4 !== null) {
    throw new Error("Expected null when combatOutput is null, got non-null");
  }

  // No weapon node → null
  const noWeaponNodes: GraphNode[] = [statNode];
  const result5 = buildTemporalChain({ damageOutput: { DPS: 100 } }, noWeaponNodes, []);
  if (result5 !== null) {
    throw new Error("Expected null when no weapon node exists, got non-null");
  }

  // Negative DPS → null
  const result6 = buildTemporalChain({ damageOutput: { DPS: -50 } }, nodes, edges);
  if (result6 !== null) {
    throw new Error("Expected null when DPS is negative, got non-null");
  }
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
