// src/lib/ohmm/theorycraft/failureMode.ts
// "What if removed?" failure mode analysis — pure TypeScript, no React.
// Computes the impact of removing a single node from the build graph.

import type {
  GraphNode,
  GraphEdge,
  GraphAnalytics,
  FailureModeResult,
} from "./buildGraph.types";
import { computeGraphAnalytics } from "./graphAnalytics";
import { computeCohesion } from "./graphCohesion";

// ─── Severity Thresholds ──────────────────────────────────────────────────────

/**
 * Severity classification based on cohesion drop percentage:
 * - negligible: < 5%
 * - minor:      >= 5%, < 15%
 * - moderate:   >= 15%, < 30%
 * - major:      >= 30%, < 50%
 * - critical:   >= 50%
 */
function classifySeverity(
  cohesionDropPercent: number
): FailureModeResult["severity"] {
  if (cohesionDropPercent < 5) return "negligible";
  if (cohesionDropPercent < 15) return "minor";
  if (cohesionDropPercent < 30) return "moderate";
  if (cohesionDropPercent < 50) return "major";
  return "critical";
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Computes the impact of hypothetically removing a node from the graph.
 * NEVER mutates input arrays or objects — uses .filter() to create new arrays.
 *
 * @param nodes - All graph nodes
 * @param edges - All graph edges
 * @param analytics - Pre-computed graph analytics for the original graph
 * @param removedNodeId - ID of the node to hypothetically remove
 * @returns FailureModeResult describing the impact
 */
export function computeFailureImpact(
  nodes: GraphNode[],
  edges: GraphEdge[],
  analytics: GraphAnalytics,
  removedNodeId: string
): FailureModeResult {
  // ─── Step 1: Check if node exists ───────────────────────────────────────
  const removedNode = nodes.find((n) => n.id === removedNodeId);
  if (!removedNode) {
    return {
      removedNodeId,
      originalCohesion: 0,
      reducedCohesion: 0,
      cohesionDropPercent: 0,
      disconnectedNodes: [],
      severedEdges: [],
      splitCommunities: [],
      newComponentsCreated: 0,
      impactSummary: `Node "${removedNodeId}" not found in graph.`,
      severity: "negligible",
    };
  }

  // ─── Step 2: Filter (not mutate) to create reduced graph ────────────────
  const reducedNodes = nodes.filter((n) => n.id !== removedNodeId);
  const reducedEdges = edges.filter(
    (e) => e.source !== removedNodeId && e.target !== removedNodeId
  );

  // ─── Step 3: Compute original cohesion ──────────────────────────────────
  const originalCohesionMetrics = computeCohesion(nodes, edges, analytics);
  const originalCohesion = originalCohesionMetrics.score;

  // ─── Step 4: Compute reduced analytics ──────────────────────────────────
  const reducedAnalytics = computeGraphAnalytics(reducedNodes, reducedEdges);

  // ─── Step 5: Compute reduced cohesion ───────────────────────────────────
  const reducedCohesionMetrics = computeCohesion(
    reducedNodes,
    reducedEdges,
    reducedAnalytics
  );
  const reducedCohesion = reducedCohesionMetrics.score;

  // ─── Step 6: Compute cohesionDropPercent ────────────────────────────────
  const cohesionDropPercent =
    originalCohesion > 0
      ? ((originalCohesion - reducedCohesion) / originalCohesion) * 100
      : 0;

  // ─── Step 7: Identify severed edges ─────────────────────────────────────
  const severedEdges = edges
    .filter((e) => e.source === removedNodeId || e.target === removedNodeId)
    .map((e) => e.id);

  // ─── Step 8: Identify disconnected nodes ────────────────────────────────
  // Nodes that were in the main component before removal but are now either
  // in a non-main component OR isolated (no edges in the reduced graph)
  const originalMainComponent = analytics.connectedComponents.find(
    (c) => c.isMain
  );
  const originalMainMembers = new Set(
    originalMainComponent ? originalMainComponent.members : []
  );

  // Build a set of node IDs that have at least one edge in reduced graph
  const connectedInReduced = new Set<string>();
  for (const edge of reducedEdges) {
    connectedInReduced.add(edge.source);
    connectedInReduced.add(edge.target);
  }

  const reducedMainComponent = reducedAnalytics.connectedComponents.find(
    (c) => c.isMain
  );
  const reducedMainMembers = new Set(
    reducedMainComponent ? reducedMainComponent.members : []
  );

  const disconnectedNodes: string[] = [];
  for (const nodeId of originalMainMembers) {
    if (nodeId === removedNodeId) continue; // skip the removed node itself
    // Isolated: no edges in the reduced graph
    const isIsolated = !connectedInReduced.has(nodeId);
    // In a non-main component in the reduced graph
    const isInNonMain = !reducedMainMembers.has(nodeId);

    if (isIsolated || isInNonMain) {
      disconnectedNodes.push(nodeId);
    }
  }

  // ─── Step 9: Identify split communities ─────────────────────────────────
  // Communities from original that now have members in different communities
  // in the reduced graph.
  const splitCommunities: string[] = [];

  // Build a mapping from nodeId → reduced community ID
  const nodeToReducedCommunity = new Map<string, string>();
  for (const community of reducedAnalytics.communities) {
    for (const memberId of community.members) {
      nodeToReducedCommunity.set(memberId, community.id);
    }
  }

  for (const originalCommunity of analytics.communities) {
    // Get the reduced community IDs for remaining members
    const reducedCommunityIds = new Set<string>();
    for (const memberId of originalCommunity.members) {
      if (memberId === removedNodeId) continue;
      const reducedCommId = nodeToReducedCommunity.get(memberId);
      if (reducedCommId !== undefined) {
        reducedCommunityIds.add(reducedCommId);
      }
    }
    // If members ended up in more than one community, this community was split
    if (reducedCommunityIds.size > 1) {
      splitCommunities.push(originalCommunity.id);
    }
  }

  // ─── Step 10: New components created ────────────────────────────────────
  const originalComponentCount = analytics.connectedComponents.length;
  const reducedComponentCount = reducedAnalytics.connectedComponents.length;
  const newComponentsCreated = Math.max(
    0,
    reducedComponentCount - originalComponentCount
  );

  // ─── Step 11: Assign severity ───────────────────────────────────────────
  const severity = classifySeverity(cohesionDropPercent);

  // ─── Step 12: Generate impact summary ───────────────────────────────────
  const impactSummary = `Removing ${removedNode.label} drops cohesion by ${cohesionDropPercent.toFixed(1)}%, disconnecting ${disconnectedNodes.length} nodes and severing ${severedEdges.length} edges.`;

  return {
    removedNodeId,
    originalCohesion,
    reducedCohesion,
    cohesionDropPercent,
    disconnectedNodes,
    severedEdges,
    splitCommunities,
    newComponentsCreated,
    impactSummary,
    severity,
  };
}
