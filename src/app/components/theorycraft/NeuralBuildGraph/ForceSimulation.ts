// src/app/components/theorycraft/NeuralBuildGraph/ForceSimulation.ts
// Pure TypeScript wrapper around d3-force-3d simulation with influence-weighted gravity

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force-3d";

import { FORCE_CONFIG, LAYER_Y_POSITIONS } from "@/lib/ohmm/theorycraft/buildGraph.constants";
import type { GraphLayer } from "@/lib/ohmm/theorycraft/buildGraph.types";

// ─── Simulation Node/Edge Interfaces ──────────────────────────────────────────

export interface SimNode extends SimulationNodeDatum {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fx: number | null;
  fy: number | null;
  fz: number | null;
  layer: GraphLayer;
  influenceScore: number;
}

export interface SimEdge extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  weight: number;
  isInterLayer?: boolean;
}

// ─── Custom Center Force ──────────────────────────────────────────────────────

/**
 * Custom force that pulls each node toward the origin (0, 0, 0) with strength
 * proportional to: centerStrength + influenceScore × influenceCenterMultiplier
 *
 * Higher-influence nodes are pulled more strongly to the center of the graph.
 */
function influenceWeightedCenter(
  centerStrength: number,
  influenceCenterMultiplier: number,
) {
  let nodes: SimNode[] = [];

  function force(alpha: number) {
    for (const node of nodes) {
      if (node.fx != null && node.fy != null && node.fz != null) continue; // pinned

      const strength = (centerStrength + node.influenceScore * influenceCenterMultiplier) * alpha;

      if (node.fx == null) node.vx -= node.x * strength;
      if (node.fy == null) node.vy -= node.y * strength;
      if (node.fz == null) node.vz -= node.z * strength;
    }
  }

  force.initialize = (simNodes: SimNode[]) => {
    nodes = simNodes;
  };

  return force;
}

// ─── ForceSimulation Class ────────────────────────────────────────────────────

export class ForceSimulation {
  private simulation: Simulation<SimNode>;
  private nodes: SimNode[];
  private edges: SimEdge[];

  constructor(nodes: SimNode[], edges: SimEdge[]) {
    this.nodes = [...nodes];
    this.edges = [...edges];

    // Create simulation in 3D mode (numDimensions = 3)
    this.simulation = forceSimulation<SimNode>(this.nodes, 3)
      .stop() // Manual ticking — no internal timer
      .alphaMin(FORCE_CONFIG.alphaMin)
      .alphaTarget(FORCE_CONFIG.alphaTarget)
      .velocityDecay(FORCE_CONFIG.velocityDecay);

    // 1. Charge (repulsion between all nodes)
    // Reduced from config (-150) to keep graph compact in camera view
    this.simulation.force(
      "charge",
      forceManyBody<SimNode>().strength(-80) as any,
    );

    // 2. Links (edges attract connected nodes)
    const linkForce = forceLink<SimNode, SimEdge>(this.edges)
      .id((d: SimNode) => d.id)
      .strength((e: SimEdge) => e.weight * FORCE_CONFIG.linkStrengthMultiplier)
      .distance((e: SimEdge) =>
        e.isInterLayer ? FORCE_CONFIG.interLayerLinkDistance : FORCE_CONFIG.intraLayerLinkDistance,
      );
    this.simulation.force("link", linkForce as any);

    // 3. Influence-weighted center gravity (custom force)
    this.simulation.force(
      "center",
      influenceWeightedCenter(
        FORCE_CONFIG.centerStrength,
        FORCE_CONFIG.influenceCenterMultiplier,
      ) as any,
    );

    // 4. Layer separation Y-force: positions nodes at their layer's Y-band
    // Scale by 0.4 to compress vertical spread for camera framing
    const layerYForce = forceY<SimNode>(
      (node: SimNode) => (LAYER_Y_POSITIONS[node.layer] ?? 0) * 0.4,
    ).strength(FORCE_CONFIG.layerSeparationStrength);
    this.simulation.force("layerY", layerYForce as any);
  }

  /**
   * Advance the simulation by `count` ticks (default: FORCE_CONFIG.ticksPerFrame).
   * Returns the current node positions after ticking.
   */
  tick(count?: number): SimNode[] {
    const iterations = count ?? FORCE_CONFIG.ticksPerFrame;
    this.simulation.tick(iterations);
    return this.nodes;
  }

  /**
   * Whether the simulation has settled (alpha < alphaMin).
   */
  isSettled(): boolean {
    return this.simulation.alpha() < FORCE_CONFIG.alphaMin;
  }

  /**
   * Pin a node at fixed coordinates. The node will no longer respond to forces.
   */
  pinNode(nodeId: string, x: number, y: number, z: number): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
      node.fz = z;
    }
  }

  /**
   * Unpin a node, allowing forces to act on it again.
   */
  unpinNode(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
      node.fz = null;
    }
  }

  /**
   * Reheat the simulation (reset alpha to 1) to re-converge after changes.
   */
  reheat(): void {
    this.simulation.alpha(1);
  }

  /**
   * Add a node to the simulation and reinitialize forces.
   */
  addNode(node: SimNode): void {
    this.nodes.push(node);
    this.simulation.nodes(this.nodes);
    this.reheat();
  }

  /**
   * Remove a node (and its connected edges) from the simulation.
   */
  removeNode(nodeId: string): void {
    const idx = this.nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;

    this.nodes.splice(idx, 1);
    // Remove edges referencing the removed node
    this.edges = this.edges.filter((e) => {
      const sourceId = typeof e.source === "string" ? e.source : (e.source as SimNode).id;
      const targetId = typeof e.target === "string" ? e.target : (e.target as SimNode).id;
      return sourceId !== nodeId && targetId !== nodeId;
    });

    this.simulation.nodes(this.nodes);
    // Update link force with filtered edges
    const linkForce = forceLink<SimNode, SimEdge>(this.edges)
      .id((d: SimNode) => d.id)
      .strength((e: SimEdge) => e.weight * FORCE_CONFIG.linkStrengthMultiplier)
      .distance((e: SimEdge) =>
        e.isInterLayer ? FORCE_CONFIG.interLayerLinkDistance : FORCE_CONFIG.intraLayerLinkDistance,
      );
    this.simulation.force("link", linkForce as any);
    this.reheat();
  }

  /**
   * Get a reference to the current nodes array (positions are mutated in-place by d3).
   */
  getNodes(): SimNode[] {
    return this.nodes;
  }

  /**
   * Get the current alpha value.
   */
  getAlpha(): number {
    return this.simulation.alpha();
  }

  /**
   * Stop the simulation and release resources.
   */
  dispose(): void {
    this.simulation.stop();
    this.nodes = [];
    this.edges = [];
  }
}
