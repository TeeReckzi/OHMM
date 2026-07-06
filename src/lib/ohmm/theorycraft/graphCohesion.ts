// src/lib/ohmm/theorycraft/graphCohesion.ts

import type { GraphNode, GraphEdge, GraphAnalytics, CohesionMetrics, GraphLayer } from "./buildGraph.types";
import { LAYER_ORDER } from "./buildGraph.types";
import { COHESION_THRESHOLDS } from "./buildGraph.constants";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Theoretical maximum path length from equipment to final-output.
 * equipment → stats → keywords → status-effects → combat-formula → final-output = 5 hops × 1.0 weight each.
 */
const THEORETICAL_MAX_PATH = 5.0;

/** Component display names for insight generation */
const COMPONENT_LABELS: Record<string, string> = {
  networkDensity: "network density",
  averageEdgeWeight: "average edge weight",
  connectivity: "connectivity",
  nodeUtilization: "node utilization",
  criticalPathEfficiency: "critical path efficiency",
};

/** Insight suffix suggestions per component */
const COMPONENT_SUGGESTIONS: Record<string, string> = {
  networkDensity: "Connect more equipment to stats.",
  averageEdgeWeight: "Strengthen existing synergies with better gear.",
  connectivity: "Ensure all equipment feeds into the same build path.",
  nodeUtilization: "Equip more items to activate dormant slots.",
  criticalPathEfficiency: "Build a complete pipeline from equipment to final output.",
};

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Computes the richer cohesion metrics for a build graph.
 *
 * Formula: raw = product of 5 components → cube root → clamp [0, 1]
 * Degenerate case: <2 active nodes OR 0 edges → score 0, label "Scattered"
 */
export function computeCohesion(
  nodes: GraphNode[],
  edges: GraphEdge[],
  analytics: GraphAnalytics
): CohesionMetrics {
  const activeNodes = nodes.filter((n) => n.isActive);

  // Degenerate case
  if (activeNodes.length < 2 || edges.length === 0) {
    return {
      score: 0,
      label: "Scattered",
      components: {
        networkDensity: 0,
        averageEdgeWeight: 0,
        connectivity: 0,
        nodeUtilization: 0,
        criticalPathEfficiency: 0,
      },
      insight: "Equip more items to see synergies.",
    };
  }

  // Compute five components
  const networkDensity = computeNetworkDensity(nodes, edges);
  const averageEdgeWeight = computeAverageEdgeWeight(edges);
  const connectivity = computeConnectivity(nodes, analytics);
  const nodeUtilization = computeNodeUtilization(nodes);
  const criticalPathEfficiency = computeCriticalPathEfficiency(nodes, edges);

  const components = {
    networkDensity,
    averageEdgeWeight,
    connectivity,
    nodeUtilization,
    criticalPathEfficiency,
  };

  // Product formula with cube-root normalization, clamped to [0, 1]
  const product =
    networkDensity *
    averageEdgeWeight *
    connectivity *
    nodeUtilization *
    criticalPathEfficiency;

  const score = Math.min(1.0, Math.max(0.0, Math.cbrt(product)));

  // Classify label
  const label = classifyLabel(score);

  // Generate insight
  const insight = generateInsight(label, components);

  return { score, label, components, insight };
}

// ─── Component Computations ───────────────────────────────────────────────────

/**
 * Network density: actual edges / max possible edges.
 * For a directed graph: max = n × (n - 1)
 */
function computeNetworkDensity(nodes: GraphNode[], edges: GraphEdge[]): number {
  const n = nodes.length;
  if (n < 2) return 0;
  const maxEdges = n * (n - 1);
  return Math.min(1.0, edges.length / maxEdges);
}

/**
 * Average edge weight: mean of all edge weights.
 * Each weight is already in [0, 1], so the mean is also in [0, 1].
 */
function computeAverageEdgeWeight(edges: GraphEdge[]): number {
  if (edges.length === 0) return 0;
  const sum = edges.reduce((acc, e) => acc + e.weight, 0);
  return Math.min(1.0, sum / edges.length);
}

/**
 * Connectivity: fraction of active nodes in the main connected component.
 * = (active nodes in main component) / (total active nodes)
 */
function computeConnectivity(nodes: GraphNode[], analytics: GraphAnalytics): number {
  const activeNodes = nodes.filter((n) => n.isActive);
  if (activeNodes.length === 0) return 0;

  const mainComponent = analytics.connectedComponents.find((c) => c.isMain);
  if (!mainComponent) return 0;

  const mainMemberSet = new Set(mainComponent.members);
  const activeInMain = activeNodes.filter((n) => mainMemberSet.has(n.id));

  return activeInMain.length / activeNodes.length;
}

/**
 * Node utilization: active equipment nodes / total equipment nodes.
 */
function computeNodeUtilization(nodes: GraphNode[]): number {
  const equipmentNodes = nodes.filter((n) => n.layer === "equipment");
  if (equipmentNodes.length === 0) return 0;

  const activeEquipment = equipmentNodes.filter((n) => n.isActive);
  return activeEquipment.length / equipmentNodes.length;
}

// ─── Critical Path Efficiency ─────────────────────────────────────────────────

/**
 * Computes the longest weighted path from any equipment-layer node to any
 * final-output node using topological ordering (DAG — edges only flow downward).
 *
 * Efficiency = longestPath / THEORETICAL_MAX_PATH (5.0), clamped to [0, 1].
 * If no path exists from equipment to output, returns 0.
 */
export function computeCriticalPathEfficiency(
  nodes: GraphNode[],
  edges: GraphEdge[]
): number {
  const equipmentNodes = nodes.filter((n) => n.layer === "equipment");
  const outputNodes = nodes.filter((n) => n.layer === "final-output");

  if (equipmentNodes.length === 0 || outputNodes.length === 0) return 0;

  // Build adjacency list (only edges that flow downward through layers)
  const adjacency = new Map<string, { target: string; weight: number }[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  const nodeLayerMap = new Map<string, GraphLayer>();
  for (const node of nodes) {
    nodeLayerMap.set(node.id, node.layer);
  }

  for (const edge of edges) {
    const sourceLayerIdx = LAYER_ORDER.indexOf(edge.sourceLayer);
    const targetLayerIdx = LAYER_ORDER.indexOf(edge.targetLayer);
    // Only include edges flowing downward (or within same layer for DAG property)
    if (sourceLayerIdx <= targetLayerIdx) {
      const neighbors = adjacency.get(edge.source);
      if (neighbors) {
        neighbors.push({ target: edge.target, weight: edge.weight });
      }
    }
  }

  // Topological sort via Kahn's algorithm
  const inDegree = new Map<string, number>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }
  for (const edge of edges) {
    const sourceLayerIdx = LAYER_ORDER.indexOf(edge.sourceLayer);
    const targetLayerIdx = LAYER_ORDER.indexOf(edge.targetLayer);
    if (sourceLayerIdx <= targetLayerIdx) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topoOrder.push(current);
    const neighbors = adjacency.get(current) ?? [];
    for (const { target } of neighbors) {
      const newDeg = (inDegree.get(target) ?? 1) - 1;
      inDegree.set(target, newDeg);
      if (newDeg === 0) {
        queue.push(target);
      }
    }
  }

  // Longest path from equipment nodes using dynamic programming
  const dist = new Map<string, number>();
  for (const node of nodes) {
    dist.set(node.id, -Infinity);
  }

  // Initialize equipment nodes with distance 0
  for (const eqNode of equipmentNodes) {
    dist.set(eqNode.id, 0);
  }

  // Relax edges in topological order
  for (const nodeId of topoOrder) {
    const currentDist = dist.get(nodeId)!;
    if (currentDist === -Infinity) continue; // unreachable from equipment

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const { target, weight } of neighbors) {
      const newDist = currentDist + weight;
      if (newDist > (dist.get(target) ?? -Infinity)) {
        dist.set(target, newDist);
      }
    }
  }

  // Find longest path to any output node
  let longestPath = 0;
  const outputNodeIds = new Set(outputNodes.map((n) => n.id));
  for (const nodeId of outputNodeIds) {
    const d = dist.get(nodeId) ?? -Infinity;
    if (d > longestPath) {
      longestPath = d;
    }
  }

  if (longestPath <= 0) return 0;

  return Math.min(1.0, Math.max(0.0, longestPath / THEORETICAL_MAX_PATH));
}

// ─── Label Classification ─────────────────────────────────────────────────────

/**
 * Classifies cohesion score into a human-readable label using COHESION_THRESHOLDS.
 */
function classifyLabel(score: number): CohesionMetrics["label"] {
  if (score < COHESION_THRESHOLDS.scattered) return "Scattered";
  if (score < COHESION_THRESHOLDS.loose) return "Loose";
  if (score < COHESION_THRESHOLDS.moderate) return "Moderate";
  if (score < COHESION_THRESHOLDS.tight) return "Tight";
  return "Unified";
}

// ─── Insight Generation ───────────────────────────────────────────────────────

/**
 * Generates an insight string referencing the lowest-scoring component.
 * Example: "Tight — Limited by network density (0.42). Connect more equipment to stats."
 */
function generateInsight(
  label: CohesionMetrics["label"],
  components: CohesionMetrics["components"]
): string {
  // Find the lowest-scoring component
  let lowestKey = "networkDensity";
  let lowestValue = components.networkDensity;

  for (const [key, value] of Object.entries(components)) {
    if (value < lowestValue) {
      lowestKey = key;
      lowestValue = value;
    }
  }

  const componentName = COMPONENT_LABELS[lowestKey] ?? lowestKey;
  const suggestion = COMPONENT_SUGGESTIONS[lowestKey] ?? "";

  return `${label} — Limited by ${componentName} (${lowestValue.toFixed(2)}). ${suggestion}`;
}
