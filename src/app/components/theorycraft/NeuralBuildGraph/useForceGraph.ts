// src/app/components/theorycraft/NeuralBuildGraph/useForceGraph.ts
// React hook wrapping ForceSimulation lifecycle — ticks inside R3F useFrame, writes to mutable ref.
// ZERO React setState during simulation ticking. Positions flow via PositionsRef.

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

import { ForceSimulation, type SimNode, type SimEdge } from "./ForceSimulation";
import { FORCE_CONFIG, LAYER_Y_POSITIONS } from "@/lib/ohmm/theorycraft/buildGraph.constants";
import type { BuildGraphViewModel } from "@/lib/ohmm/theorycraft/buildGraph.types";
import type { GraphLayer } from "@/lib/ohmm/theorycraft/buildGraph.types";
import type { PositionsRef } from "./useNodeDrag";
import { LAYER_ORDER } from "@/lib/ohmm/theorycraft/buildGraph.types";

// ─── Return Type ──────────────────────────────────────────────────────────────

export interface UseForceGraphResult {
  /** Mutable position ref updated every frame — consumers read directly in useFrame */
  positionsRef: React.RefObject<PositionsRef>;
  /** Reference to the underlying ForceSimulation (null before initialization) */
  simulationRef: React.RefObject<ForceSimulation | null>;
  /** Pin a node at fixed coordinates (stops it from being affected by forces) */
  pinNode: (id: string, x: number, y: number, z: number) => void;
  /** Unpin a node so forces affect it again */
  unpinNode: (id: string) => void;
  /** Reheat the simulation to re-converge (e.g., after structural changes or drag) */
  reheat: () => void;
  /** Mutable ref indicating if the simulation has settled (alpha < alphaMin) */
  isSettledRef: React.RefObject<boolean>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Bounding box clamp for non-finite coordinates per axis */
const POSITION_CLAMP_MIN = -500;
const POSITION_CLAMP_MAX = 500;

/** Default ticks per frame (Full LOD tier) */
const TICKS_PER_FRAME = FORCE_CONFIG.ticksPerFrame; // 3

/** Max consecutive reheat attempts producing non-finite positions before grid fallback */
const MAX_REHEAT_FAILURES = 3;

/** Scale factor for layer Y positions — compresses the vertical spread to fit camera */
const LAYER_Y_SCALE = 0.4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a BuildGraphViewModel's nodes into SimNode[] for the force simulation */
function toSimNodes(viewModel: BuildGraphViewModel): SimNode[] {
  return viewModel.nodes.map((node) => ({
    id: node.id,
    x: (Math.random() - 0.5) * 8,
    y: (LAYER_Y_POSITIONS[node.layer] ?? 0) * LAYER_Y_SCALE,
    z: (Math.random() - 0.5) * 4,
    vx: 0,
    vy: 0,
    vz: 0,
    fx: null,
    fy: null,
    fz: null,
    layer: node.layer,
    influenceScore: node.influenceScore,
  }));
}

/** Convert a BuildGraphViewModel's edges into SimEdge[] for the force simulation */
function toSimEdges(viewModel: BuildGraphViewModel): SimEdge[] {
  return viewModel.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    weight: edge.weight,
    isInterLayer: edge.isInterLayer,
  }));
}

/**
 * Checks if a number is finite (not NaN, not Infinity, not -Infinity).
 */
function isFiniteNumber(val: number): boolean {
  return Number.isFinite(val);
}

/**
 * Clamp a value to [-500, 500] bounding box.
 */
function clampCoord(val: number): number {
  if (!isFiniteNumber(val)) {
    return 0; // Default to origin for non-finite
  }
  return Math.max(POSITION_CLAMP_MIN, Math.min(POSITION_CLAMP_MAX, val));
}

/**
 * Compute deterministic grid layout from layer assignments.
 * Used as fallback when force simulation produces persistent non-finite values.
 */
function computeGridLayout(
  viewModel: BuildGraphViewModel,
): Map<string, { x: number; y: number; z: number }> {
  const map = new Map<string, { x: number; y: number; z: number }>();

  // Group nodes by layer
  const layerGroups = new Map<GraphLayer, typeof viewModel.nodes>();
  for (const node of viewModel.nodes) {
    const group = layerGroups.get(node.layer) ?? [];
    group.push(node);
    layerGroups.set(node.layer, group);
  }

  // Layout: each layer gets a Y position, nodes spread along X with spacing
  const spacing = 8;
  for (const layer of LAYER_ORDER) {
    const group = layerGroups.get(layer);
    if (!group || group.length === 0) continue;

    const y = (LAYER_Y_POSITIONS[layer] ?? 0) * LAYER_Y_SCALE;
    const totalWidth = (group.length - 1) * spacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < group.length; i++) {
      map.set(group[i].id, {
        x: startX + i * spacing,
        y,
        z: 0,
      });
    }
  }

  return map;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that manages a ForceSimulation lifecycle:
 * - Creates the simulation when viewModel structure changes (fingerprint)
 * - Ticks inside R3F useFrame callback (no external rAF loop)
 * - Writes positions to mutable PositionsRef — ZERO React setState during ticking
 * - Detects settlement (alpha < alphaMin 0.001) via isSettledRef
 * - Guards against NaN/Infinity with clamping and grid fallback
 * - Disposes simulation on unmount or structural fingerprint change
 *
 * Called UNCONDITIONALLY per Rules of Hooks (Requirement 3.1).
 */
export function useForceGraph(
  viewModel: BuildGraphViewModel,
  onSettled?: (positions: Map<string, { x: number; y: number; z: number }>) => void,
): UseForceGraphResult {
  const simulationRef = useRef<ForceSimulation | null>(null);
  const positionsRef = useRef<PositionsRef>({ current: new Map(), frameId: 0 });
  const isSettledRef = useRef<boolean>(false);

  // Track consecutive reheat failures for grid fallback
  const reheatFailureCountRef = useRef<number>(0);
  // Whether we've fallen back to grid layout (stops force ticking permanently)
  const isGridFallbackRef = useRef<boolean>(false);
  // Store onSettled callback in a ref to avoid re-creating effects
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  // Store viewModel in a ref for grid fallback computation
  const viewModelRef = useRef(viewModel);
  viewModelRef.current = viewModel;

  // Stable identity for viewModel node/edge fingerprint
  const fingerprint = useMemo(() => {
    if (!viewModel.isRenderable || viewModel.nodes.length === 0) return "";
    const nodeIds = viewModel.nodes.map((n) => n.id).sort().join(",");
    const edgeIds = viewModel.edges.map((e) => `${e.source}->${e.target}`).sort().join(",");
    return `${nodeIds}|${edgeIds}`;
  }, [viewModel.nodes, viewModel.edges, viewModel.isRenderable]);

  // Initialize / reinitialize simulation when the graph structure changes
  useEffect(() => {
    // Dispose previous simulation
    if (simulationRef.current) {
      simulationRef.current.dispose();
      simulationRef.current = null;
    }

    // Reset state
    isSettledRef.current = false;
    isGridFallbackRef.current = false;
    reheatFailureCountRef.current = 0;

    if (!viewModel.isRenderable || viewModel.nodes.length === 0) {
      positionsRef.current.current.clear();
      positionsRef.current.frameId++;
      isSettledRef.current = true;
      return;
    }

    const simNodes = toSimNodes(viewModel);
    const simEdges = toSimEdges(viewModel);

    const sim = new ForceSimulation(simNodes, simEdges);
    simulationRef.current = sim;

    return () => {
      if (simulationRef.current) {
        simulationRef.current.dispose();
        simulationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  // Tick inside R3F render loop — no external rAF, no double-loop contention
  // Called UNCONDITIONALLY (Rules of Hooks). Early-return gates behavior inside callback.
  useFrame(() => {
    const sim = simulationRef.current;

    // Gate: nothing to tick if no simulation, already settled, or using grid fallback
    if (!sim || isSettledRef.current || isGridFallbackRef.current) return;

    // Tick simulation
    const nodes = sim.tick(TICKS_PER_FRAME);

    // Write positions to mutable ref — ZERO setState
    const map = positionsRef.current.current;
    map.clear();

    let hasNonFinite = false;

    for (const node of nodes) {
      let x = node.x;
      let y = node.y;
      let z = node.z;

      // NaN/Infinity guard: clamp non-finite coordinates
      if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
        hasNonFinite = true;
        console.warn(
          `[useForceGraph] Non-finite position for node "${node.id}": (${x}, ${y}, ${z}). Clamping to bounding box.`,
        );
        x = clampCoord(x);
        y = clampCoord(y);
        z = clampCoord(z);
      }

      map.set(node.id, { x, y, z });
    }

    // Increment frameId exactly once per frame (monotonically increasing)
    positionsRef.current.frameId++;

    // Handle non-finite positions: track consecutive reheat failures
    if (hasNonFinite) {
      reheatFailureCountRef.current++;

      // After 3 consecutive reheat attempts with non-finite, switch to grid layout
      if (reheatFailureCountRef.current >= MAX_REHEAT_FAILURES) {
        console.warn(
          `[useForceGraph] ${MAX_REHEAT_FAILURES} consecutive reheats produced non-finite positions. Switching to deterministic grid layout.`,
        );
        isGridFallbackRef.current = true;
        isSettledRef.current = true;

        // Compute and apply grid layout
        const gridPositions = computeGridLayout(viewModelRef.current);
        map.clear();
        for (const [id, pos] of gridPositions) {
          map.set(id, pos);
        }
        positionsRef.current.frameId++;

        // Notify settled
        onSettledRef.current?.(positionsRef.current.current);

        // Dispose the broken simulation
        sim.dispose();
        simulationRef.current = null;
        return;
      }
    } else {
      // Reset failure count on a clean tick
      reheatFailureCountRef.current = 0;
    }

    // Settlement detection: alpha < alphaMin (0.001)
    if (sim.isSettled()) {
      isSettledRef.current = true;
      onSettledRef.current?.(positionsRef.current.current);
    }
  });

  // ─── Public Actions ───────────────────────────────────────────────────────

  const pinNode = useCallback((id: string, x: number, y: number, z: number) => {
    const sim = simulationRef.current;
    if (!sim) return;
    sim.pinNode(id, x, y, z);
  }, []);

  const unpinNode = useCallback((id: string) => {
    const sim = simulationRef.current;
    if (!sim) return;
    sim.unpinNode(id);
    // Reheat so the unpinned node can find a new equilibrium
    sim.reheat();
    isSettledRef.current = false;
  }, []);

  const reheat = useCallback(() => {
    const sim = simulationRef.current;
    if (!sim || isGridFallbackRef.current) return;
    sim.reheat();
    isSettledRef.current = false;
  }, []);

  return {
    positionsRef: positionsRef as React.RefObject<PositionsRef>,
    simulationRef: simulationRef as React.RefObject<ForceSimulation | null>,
    pinNode,
    unpinNode,
    reheat,
    isSettledRef: isSettledRef as React.RefObject<boolean>,
  };
}
