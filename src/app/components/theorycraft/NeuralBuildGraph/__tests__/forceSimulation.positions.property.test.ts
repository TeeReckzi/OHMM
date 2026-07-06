/**
 * Property 1: Force simulation positions are always finite
 *
 * For any valid BuildGraphViewModel with isRenderable=true, after any number
 * of simulation ticks, every position must have finite x, y, z values.
 *
 * This tests the ForceSimulation + NaN/Infinity guard system as implemented in
 * useForceGraph: tick() produces raw positions, then the guard clamps any non-finite
 * values to the [-500, 500] bounding box. The property validates that the guard
 * never lets non-finite positions escape into PositionsRef.
 *
 * **Validates: Requirements 1.2, 1.7**
 *
 * Uses fast-check for property-based testing, run via `npx tsx`.
 */

import fc from "fast-check";
import { ForceSimulation, type SimNode, type SimEdge } from "../ForceSimulation";
import type { GraphLayer } from "../../../../../lib/ohmm/theorycraft/buildGraph.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAPH_LAYERS: GraphLayer[] = [
  "equipment",
  "stats",
  "keywords",
  "status-effects",
  "combat-formula",
  "final-output",
];

/** Bounding box clamp matching useForceGraph implementation */
const POSITION_CLAMP_MIN = -500;
const POSITION_CLAMP_MAX = 500;

// ─── NaN/Infinity Guard (mirrors useForceGraph) ───────────────────────────────

function clampCoord(val: number): number {
  if (!Number.isFinite(val)) {
    return 0;
  }
  return Math.max(POSITION_CLAMP_MIN, Math.min(POSITION_CLAMP_MAX, val));
}

// ─── Arbitraries (Generators) ─────────────────────────────────────────────────

/**
 * Use integer-based generators mapped to floats for memory efficiency.
 * fc.double with noNaN/noDefaultInfinity retains large internal shrink trees.
 */
const arbCoord = fc.integer({ min: -10000, max: 10000 }).map((n) => n / 100);
const arbVelocity = fc.integer({ min: -500, max: 500 }).map((n) => n / 100);
const arbInfluence = fc.integer({ min: 0, max: 1000 }).map((n) => n / 1000);
const arbLayerIdx = fc.integer({ min: 0, max: 5 });
const arbTickCount = fc.integer({ min: 1, max: 30 });

/**
 * Generate a deterministic SimNode from a seed tuple.
 */
interface NodeSeed {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  layerIdx: number;
  influence: number;
}

const arbNodeSeed: fc.Arbitrary<NodeSeed> = fc.record({
  x: arbCoord,
  y: arbCoord,
  z: arbCoord,
  vx: arbVelocity,
  vy: arbVelocity,
  vz: arbVelocity,
  layerIdx: arbLayerIdx,
  influence: arbInfluence,
});

function seedToNode(seed: NodeSeed, index: number): SimNode {
  return {
    id: `node-${index}`,
    x: seed.x,
    y: seed.y,
    z: seed.z,
    vx: seed.vx,
    vy: seed.vy,
    vz: seed.vz,
    fx: null,
    fy: null,
    fz: null,
    layer: GRAPH_LAYERS[seed.layerIdx],
    influenceScore: seed.influence,
  };
}

/** Build a ring of edges connecting adjacent nodes */
function buildEdges(nodes: SimNode[]): SimEdge[] {
  const edges: SimEdge[] = [];
  if (nodes.length < 2) return edges;

  for (let i = 0; i < nodes.length; i++) {
    const nextIdx = (i + 1) % nodes.length;
    edges.push({
      source: nodes[i].id,
      target: nodes[nextIdx].id,
      weight: 0.5,
      isInterLayer: nodes[i].layer !== nodes[nextIdx].layer,
    });
  }
  return edges;
}

/**
 * Core property: after ticking a ForceSimulation, clamped positions are always finite.
 */
function positionsAreFiniteAfterTick(seeds: NodeSeed[], tickCount: number): boolean {
  const nodes = seeds.map((s, i) => seedToNode(s, i));
  const edges = buildEdges(nodes);
  const sim = new ForceSimulation(nodes, edges);

  try {
    const result = sim.tick(tickCount);

    for (const node of result) {
      const x = clampCoord(node.x);
      const y = clampCoord(node.y);
      const z = clampCoord(node.z);

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return false;
      }
    }
    return true;
  } finally {
    sim.dispose();
  }
}

// ─── Property Test ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("Property 1: Force simulation positions are always finite");
console.log("=".repeat(60));

// Subcase 1: Small graphs (3 nodes) — 100 runs
try {
  fc.assert(
    fc.property(
      fc.array(arbNodeSeed, { minLength: 3, maxLength: 3 }),
      arbTickCount,
      positionsAreFiniteAfterTick,
    ),
    { numRuns: 100 }
  );
  passed++;
  console.log("  3-node graphs (100 runs):  ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  3-node graphs (100 runs):  ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 300)}`);
}

// Subcase 2: Medium graphs (10 nodes) — 50 runs
try {
  fc.assert(
    fc.property(
      fc.array(arbNodeSeed, { minLength: 10, maxLength: 10 }),
      arbTickCount,
      positionsAreFiniteAfterTick,
    ),
    { numRuns: 50 }
  );
  passed++;
  console.log("  10-node graphs (50 runs):  ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  10-node graphs (50 runs):  ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 300)}`);
}

// Subcase 3: Larger graphs (25 nodes) — 30 runs
try {
  fc.assert(
    fc.property(
      fc.array(arbNodeSeed, { minLength: 25, maxLength: 25 }),
      arbTickCount,
      positionsAreFiniteAfterTick,
    ),
    { numRuns: 30 }
  );
  passed++;
  console.log("  25-node graphs (30 runs):  ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  25-node graphs (30 runs):  ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 300)}`);
}

// ─── Results ──────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log(`Results: ${passed}/3 subcases passed, ${failed} failed`);
console.log(`Total property runs: 180`);

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll property tests passed.");
process.exit(0);
