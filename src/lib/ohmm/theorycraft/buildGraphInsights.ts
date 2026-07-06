import type { GraphNode, GraphEdge, GraphAnalytics } from "./buildGraph.types";

/**
 * A single actionable insight about the build graph.
 */
export interface BuildInsight {
  /** Unique insight ID */
  id: string;
  /** Insight category */
  category: 'bottleneck' | 'upgrade' | 'synergy' | 'warning' | 'optimization';
  /** Severity/importance (higher = more impactful) */
  priority: number;
  /** One-line summary */
  title: string;
  /** Detailed explanation (1-2 sentences) */
  description: string;
  /** Related node IDs */
  relatedNodes: string[];
  /** Confidence in the insight */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Result of the build insight generation containing ordered insights and overall rating.
 */
export interface BuildInsightsResult {
  /** Ordered insights (highest priority first) */
  insights: BuildInsight[];
  /** Overall build rating */
  overallRating: 'weak' | 'average' | 'strong' | 'optimal';
  /** Generated summary paragraph */
  summary: string;
}

/**
 * Generates natural language insights and overall rating for the build graph based on centrality, density,
 * communities, and cohesion scores.
 *
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */
export function generateBuildInsights(
  nodes: GraphNode[],
  edges: GraphEdge[],
  analytics: GraphAnalytics,
  cohesionScore: number,
): BuildInsightsResult {
  try {
    // Check edge/degenerate cases
    if (!nodes || nodes.length === 0 || !analytics || Number.isNaN(cohesionScore)) {
      return {
        insights: [],
        overallRating: "weak",
        summary: "No build data available to analyze.",
      };
    }

    const insights: BuildInsight[] = [];

    // 1. Bottleneck detection: nodes with betweenness > 0.4
    const bottlenecks = analytics.centralities.filter((c) => c.betweenness > 0.4);
    for (const b of bottlenecks) {
      const node = nodes.find((n) => n.id === b.nodeId);
      if (node) {
        insights.push({
          id: `bottleneck-${node.id}`,
          category: 'bottleneck',
          priority: 80,
          title: `Critical Conduit: ${node.label}`,
          description: `This node has a high betweenness centrality of ${b.betweenness.toFixed(2)}, making it a critical bridge in your build's stat flow. Removing it may severely disrupt synergies.`,
          relatedNodes: [node.id],
          confidence: node.metadata.confidence === 'project_verified' ? 'high' : 'medium',
        });
      }
    }

    // 2. Upgrade recommendations: low-energy equipment with high degree centrality
    const equipmentNodes = nodes.filter((n) => n.layer === 'equipment');
    for (const eq of equipmentNodes) {
      const centrality = analytics.centralities.find((c) => c.nodeId === eq.id);
      if (centrality && centrality.degree > 0.2 && eq.energyLevel < 0.3) {
        insights.push({
          id: `upgrade-${eq.id}`,
          category: 'upgrade',
          priority: 70,
          title: `Optimize ${eq.label} Energy`,
          description: `This equipment node has high connectivity (${(centrality.degree * 100).toFixed(0)}% degree centrality) but contributes low energy (${(eq.energyLevel * 100).toFixed(0)}%). Consider upgrading its calibrations or mod tiers.`,
          relatedNodes: [eq.id],
          confidence: eq.metadata.confidence === 'project_verified' ? 'high' : 'medium',
        });
      }
    }

    // 3. Synergy detection: communities with high internal density
    for (const comm of analytics.communities) {
      if (comm.internalDensity > 0.5 && comm.members.length > 1) {
        // Ensure all member node IDs are valid in the graph
        const validMembers = comm.members.filter((mId) => nodes.some((n) => n.id === mId));
        if (validMembers.length > 1) {
          insights.push({
            id: `synergy-${comm.id}`,
            category: 'synergy',
            priority: 60,
            title: `Tight Synergy: ${comm.label}`,
            description: `The ${comm.label} community exhibits a high internal synergy density of ${(comm.internalDensity * 100).toFixed(0)}% across its ${validMembers.length} nodes.`,
            relatedNodes: validMembers,
            confidence: 'high',
          });
        }
      }
    }

    // 4. Warning: isolated nodes or disconnected components
    const isolated = analytics.centralities.filter((c) => c.degree === 0);
    for (const iso of isolated) {
      const node = nodes.find((n) => n.id === iso.nodeId);
      if (node) {
        insights.push({
          id: `warning-isolated-${node.id}`,
          category: 'warning',
          priority: 90,
          title: `Dead End: ${node.label}`,
          description: `This node is completely isolated with no active synergies. Verify that its requirements or mod triggers are met.`,
          relatedNodes: [node.id],
          confidence: 'high',
        });
      }
    }

    if (!analytics.isFullyConnected && analytics.connectedComponents.length > 1) {
      const nonMainComponents = analytics.connectedComponents.filter((c) => !c.isMain);
      if (nonMainComponents.length > 0) {
        const validRelatedNodes = nonMainComponents
          .flatMap((c) => c.members)
          .filter((mId) => nodes.some((n) => n.id === mId));

        if (validRelatedNodes.length > 0) {
          insights.push({
            id: 'warning-disconnected-components',
            category: 'warning',
            priority: 85,
            title: 'Fragmented Stat Flow',
            description: `Your build graph is split into ${analytics.connectedComponents.length} disconnected components. ${validRelatedNodes.length} nodes are completely severed from the main combat equation.`,
            relatedNodes: validRelatedNodes,
            confidence: 'high',
          });
        }
      }
    }

    // 5. Optimization: edge weight imbalance suggesting reallocation
    for (const eq of equipmentNodes) {
      const nodeEdges = edges.filter((e) => e.source === eq.id || e.target === eq.id);
      if (nodeEdges.length > 1) {
        const avgWeight = nodeEdges.reduce((sum, e) => sum + e.weight, 0) / nodeEdges.length;
        if (avgWeight < 0.3) {
          const relatedNodeIds = [eq.id, ...nodeEdges.map((e) => (e.source === eq.id ? e.target : e.source))]
            .filter((id) => nodes.some((n) => n.id === id));

          insights.push({
            id: `optimization-imbalance-${eq.id}`,
            category: 'optimization',
            priority: 50,
            title: `Imbalanced Synergy on ${eq.label}`,
            description: `Connections to ${eq.label} are weak (average synergy weight of ${avgWeight.toFixed(2)}). Consider reallocating stats or mods to align better with its dominant category.`,
            relatedNodes: relatedNodeIds,
            confidence: 'medium',
          });
        }
      }
    }

    // Sort by priority descending
    insights.sort((a, b) => b.priority - a.priority);

    // Limit to 7 insights max
    const finalInsights = insights.slice(0, 7);

    // Determine overall rating from cohesion score
    let overallRating: 'weak' | 'average' | 'strong' | 'optimal' = 'weak';
    if (cohesionScore >= 0.75) overallRating = 'optimal';
    else if (cohesionScore >= 0.55) overallRating = 'strong';
    else if (cohesionScore >= 0.35) overallRating = 'average';

    // Generate summary paragraph
    let summary = '';
    if (overallRating === 'optimal') {
      summary = `Your build exhibits outstanding cohesion (score: ${cohesionScore.toFixed(2)}). Stats, status effects, and gear categories are perfectly synchronized to maximize damage scaling.`;
    } else if (overallRating === 'strong') {
      summary = `Your build has a strong and cohesive flow (score: ${cohesionScore.toFixed(2)}). Most modifiers and status effects are well aligned, with only minor optimizations remaining.`;
    } else if (overallRating === 'average') {
      summary = `Your build has an average cohesion level (score: ${cohesionScore.toFixed(2)}). Some key synergies are active, but there are multiple disconnected paths or underperforming nodes.`;
    } else {
      summary = `Your build's cohesion is currently weak (score: ${cohesionScore.toFixed(2)}). Multiple stats are fragmented, and key equipment/formula connections are missing or isolated.`;
    }

    return {
      insights: finalInsights,
      overallRating,
      summary,
    };
  } catch {
    // Never throw — return safe defaults on any error
    return {
      insights: [],
      overallRating: "weak",
      summary: "No build data available to analyze.",
    };
  }
}
