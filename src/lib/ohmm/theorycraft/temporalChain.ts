/**
 * Neural Build Graph — Temporal Combat Chain Construction
 *
 * Pure TypeScript module that constructs a CombatTemporalChain from CombatOutput timing data.
 * The chain represents one full DPS cycle through the graph, starting from the weapon node
 * and tracing through connected edges/nodes layer by layer.
 *
 * Never throws — returns null for invalid/missing data.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

import type { GraphNode, GraphEdge, TemporalFrame, CombatTemporalChain } from "./buildGraph.types";
import { LAYER_ORDER } from "./buildGraph.types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum number of frames in a temporal chain */
const MIN_FRAMES = 3;

/** Maximum number of frames in a temporal chain */
const MAX_FRAMES = 64;

/** Minimum cycle duration in ms */
const MIN_CYCLE_MS = 100;

/** Maximum cycle duration in ms */
const MAX_CYCLE_MS = 30000;

/** Default cycle duration when no timing data available (ms) */
const DEFAULT_CYCLE_MS = 1000;

// ─── Layer event descriptions ─────────────────────────────────────────────────

const LAYER_EVENTS: Record<string, string> = {
  "equipment": "Weapon fires",
  "stats": "Stat contributes",
  "keywords": "Keyword activates",
  "status-effects": "Status procs",
  "combat-formula": "Formula computes",
  "final-output": "Output resolves",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks if a DPS value is valid (positive, finite, non-NaN).
 */
function isValidDPS(dps: unknown): dps is number {
  return typeof dps === "number" && isFinite(dps) && !isNaN(dps) && dps > 0;
}

/**
 * Clamp a value to [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get the layer index from LAYER_ORDER for sorting.
 */
function layerIndex(layer: string): number {
  const idx = LAYER_ORDER.indexOf(layer as any);
  return idx >= 0 ? idx : 999;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Builds a CombatTemporalChain representing one full DPS cycle through the graph.
 *
 * Returns null when:
 * - combatOutput is null/undefined
 * - combatOutput.damageOutput is null/undefined
 * - combatOutput.damageOutput.DPS is 0, undefined, null, or NaN
 * - No node in `nodes` has layer === "equipment" AND category === "weapon"
 *
 * @param combatOutput - CombatOutput from the engine (untyped to avoid circular deps)
 * @param nodes - All graph nodes
 * @param edges - All graph edges
 * @returns CombatTemporalChain or null
 */
export function buildTemporalChain(
  combatOutput: any,
  nodes: GraphNode[],
  edges: GraphEdge[]
): CombatTemporalChain | null {
  // ─── Null checks ──────────────────────────────────────────────────────────
  if (combatOutput == null) return null;
  if (combatOutput.damageOutput == null) return null;

  const dps = combatOutput.damageOutput.DPS;
  if (!isValidDPS(dps)) return null;

  // ─── Weapon node check ────────────────────────────────────────────────────
  const weaponNode = nodes.find(
    (n) => n.layer === "equipment" && n.category === "weapon"
  );
  if (!weaponNode) return null;

  // ─── Compute cycle duration ───────────────────────────────────────────────
  const cycleDuration = computeCycleDuration(combatOutput);

  // ─── Build ordered frames via BFS through layers ──────────────────────────
  const rawFrames = buildFramesBFS(weaponNode, nodes, edges, combatOutput);

  // Clamp frame count to [MIN_FRAMES, MAX_FRAMES]
  const clampedFrames = clampFrameCount(rawFrames, nodes, edges);

  // ─── Assign strictly increasing timestamps ────────────────────────────────
  const frames = assignTimestamps(clampedFrames, cycleDuration, combatOutput);

  return {
    frames,
    cycleDuration,
    isLooping: true,
    sourceDescription: "DPS cycle combat chain",
  };
}

// ─── Cycle Duration Computation ───────────────────────────────────────────────

/**
 * Derives cycle duration from combatOutput timing data.
 * Falls back to 1000ms default, clamped to [100, 30000] ms.
 */
function computeCycleDuration(combatOutput: any): number {
  let duration = DEFAULT_CYCLE_MS;

  const dps = combatOutput?.damageOutput?.DPS;
  const baseDamage = combatOutput?.damageOutput?.baseDamagePerHit
    ?? combatOutput?.damageOutput?.damagePerHit
    ?? combatOutput?.damageOutput?.expectedDamagePerHit;

  // If we have baseDamage and DPS, compute cycle time as damage/DPS * 1000
  if (isValidDPS(dps) && typeof baseDamage === "number" && isFinite(baseDamage) && baseDamage > 0) {
    duration = (baseDamage / dps) * 1000;
  } else if (isValidDPS(dps)) {
    // Fallback: cycle = 1000 / DPS gives seconds per hit → convert to ms
    // But that gives very short cycles for high DPS, so use 1000ms default
    duration = DEFAULT_CYCLE_MS;
  }

  // Use fire rate timing if available
  const fireRate = combatOutput?.damageOutput?.fireRate
    ?? combatOutput?.timingMetrics?.fireRate;
  if (typeof fireRate === "number" && isFinite(fireRate) && fireRate > 0) {
    // fireRate in shots/sec → cycle = 1000 / fireRate ms
    duration = 1000 / fireRate;
  }

  return clamp(Math.round(duration), MIN_CYCLE_MS, MAX_CYCLE_MS);
}

// ─── BFS Frame Construction ───────────────────────────────────────────────────

interface RawFrame {
  nodeId: string;
  edgeId: string | null;
  event: string;
  value?: number;
  layerIdx: number;
}

/**
 * Builds frames by traversing from the weapon node through connected edges/nodes layer by layer.
 * Uses BFS ordering: equipment → stats → keywords → status-effects → combat-formula → final-output.
 */
function buildFramesBFS(
  weaponNode: GraphNode,
  nodes: GraphNode[],
  edges: GraphEdge[],
  combatOutput: any
): RawFrame[] {
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  // Build adjacency: source → [{targetId, edgeId}]
  const adjacency = new Map<string, Array<{ targetId: string; edgeId: string }>>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) {
      adjacency.set(e.source, []);
    }
    adjacency.get(e.source)!.push({ targetId: e.target, edgeId: e.id });
  }

  const frames: RawFrame[] = [];
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; fromEdgeId: string | null }> = [];

  // Start with weapon node
  queue.push({ nodeId: weaponNode.id, fromEdgeId: null });
  visited.add(weaponNode.id);

  while (queue.length > 0) {
    const { nodeId, fromEdgeId } = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const event = LAYER_EVENTS[node.layer] ?? "Node activates";
    const value = node.metadata?.primaryValue;

    frames.push({
      nodeId,
      edgeId: fromEdgeId,
      event,
      value: typeof value === "number" && isFinite(value) ? value : undefined,
      layerIdx: layerIndex(node.layer),
    });

    // Traverse outgoing edges, sorted by target layer index for consistent ordering
    const neighbors = adjacency.get(nodeId) ?? [];
    const sortedNeighbors = [...neighbors].sort((a, b) => {
      const nodeA = nodeMap.get(a.targetId);
      const nodeB = nodeMap.get(b.targetId);
      return layerIndex(nodeA?.layer ?? "") - layerIndex(nodeB?.layer ?? "");
    });

    for (const { targetId, edgeId } of sortedNeighbors) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push({ nodeId: targetId, fromEdgeId: edgeId });
      }
    }
  }

  return frames;
}

// ─── Frame Count Clamping ─────────────────────────────────────────────────────

/**
 * Ensures frame count is in [MIN_FRAMES, MAX_FRAMES].
 * If fewer than MIN_FRAMES from BFS, fill with formula/output nodes.
 * If more than MAX_FRAMES, truncate.
 */
function clampFrameCount(
  rawFrames: RawFrame[],
  nodes: GraphNode[],
  edges: GraphEdge[]
): RawFrame[] {
  if (rawFrames.length >= MAX_FRAMES) {
    return rawFrames.slice(0, MAX_FRAMES);
  }

  if (rawFrames.length >= MIN_FRAMES) {
    return rawFrames;
  }

  // If we have fewer than MIN_FRAMES, pad with formula and output nodes
  const existingIds = new Set(rawFrames.map((f) => f.nodeId));
  const padCandidates: RawFrame[] = [];

  // Prefer formula nodes, then output nodes
  const formulaNodes = nodes.filter(
    (n) => n.layer === "combat-formula" && !existingIds.has(n.id)
  );
  const outputNodes = nodes.filter(
    (n) => n.layer === "final-output" && !existingIds.has(n.id)
  );

  for (const node of [...formulaNodes, ...outputNodes]) {
    if (rawFrames.length + padCandidates.length >= MIN_FRAMES) break;

    // Find an edge connecting to this node (from any existing frame node)
    const connectingEdge = edges.find(
      (e) => e.target === node.id && existingIds.has(e.source)
    );

    padCandidates.push({
      nodeId: node.id,
      edgeId: connectingEdge?.id ?? null,
      event: LAYER_EVENTS[node.layer] ?? "Node activates",
      value: node.metadata?.primaryValue,
      layerIdx: layerIndex(node.layer),
    });
    existingIds.add(node.id);
  }

  // If still not enough, pad with any remaining unvisited nodes sorted by layer
  if (rawFrames.length + padCandidates.length < MIN_FRAMES) {
    const remaining = nodes
      .filter((n) => !existingIds.has(n.id))
      .sort((a, b) => layerIndex(a.layer) - layerIndex(b.layer));

    for (const node of remaining) {
      if (rawFrames.length + padCandidates.length >= MIN_FRAMES) break;

      const connectingEdge = edges.find(
        (e) =>
          (e.target === node.id && existingIds.has(e.source)) ||
          (e.source === node.id && existingIds.has(e.target))
      );

      padCandidates.push({
        nodeId: node.id,
        edgeId: connectingEdge?.id ?? null,
        event: LAYER_EVENTS[node.layer] ?? "Node activates",
        value: node.metadata?.primaryValue,
        layerIdx: layerIndex(node.layer),
      });
      existingIds.add(node.id);
    }
  }

  // Sort all frames by layer order for logical progression
  const allFrames = [...rawFrames, ...padCandidates];
  allFrames.sort((a, b) => a.layerIdx - b.layerIdx);

  return allFrames;
}

// ─── Timestamp Assignment ─────────────────────────────────────────────────────

/**
 * Assigns strictly increasing non-negative integer timestamps to frames.
 * Distributes timestamps evenly across the cycle duration, optionally using
 * combat timing data for more realistic spacing.
 *
 * Guarantees: all timestamps are non-negative integers, strictly increasing.
 */
function assignTimestamps(
  rawFrames: RawFrame[],
  cycleDuration: number,
  combatOutput: any
): TemporalFrame[] {
  const count = rawFrames.length;
  if (count === 0) return [];

  // Try to extract timing intervals from combatOutput for realistic spacing
  const fireRate = combatOutput?.damageOutput?.fireRate
    ?? combatOutput?.timingMetrics?.fireRate;

  // Compute base timestamps evenly distributed across [0, cycleDuration - 1]
  const baseTimestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    if (count === 1) {
      baseTimestamps.push(0);
    } else {
      // Evenly space from 0 to (cycleDuration - 1)
      baseTimestamps.push(Math.round((i / (count - 1)) * (cycleDuration - 1)));
    }
  }

  // If fire rate available and we have a weapon frame at start, apply realistic spacing
  if (typeof fireRate === "number" && isFinite(fireRate) && fireRate > 0 && count > 1) {
    const fireInterval = Math.round(1000 / fireRate);
    // Only adjust if fire interval fits within duration
    if (fireInterval > 0 && fireInterval < cycleDuration) {
      baseTimestamps[0] = 0;
      // Don't fully override — just ensure first frame starts at 0
    }
  }

  // Enforce strictly increasing: if two adjacent timestamps are equal,
  // bump the later one by 1ms
  for (let i = 1; i < baseTimestamps.length; i++) {
    if (baseTimestamps[i] <= baseTimestamps[i - 1]) {
      baseTimestamps[i] = baseTimestamps[i - 1] + 1;
    }
  }

  // Ensure all are non-negative integers
  return rawFrames.map((frame, i): TemporalFrame => ({
    index: i,
    timestamp: Math.max(0, baseTimestamps[i]),
    activeNodeId: frame.nodeId,
    activeEdgeId: frame.edgeId,
    event: frame.event,
    value: frame.value,
  }));
}
