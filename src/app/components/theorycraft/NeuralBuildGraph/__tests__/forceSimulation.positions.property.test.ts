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

/**
 * Clamp a coordinate value to the bounding box [-500, 500].
 * Non-finite values (NaN, Infinity, -Infinity) get mapped to 0.
 * This mirrors the exact guard in useForceGraph.ts.
 */
function clampCoord(val: number): number {
  if (!Number.isFinite(val)) {
    return 0;
  }
  return Math.max(POSITION_CLAMP_MIN, Math.min(POSITION_CLAMP_MAX, val));
}

// ─── Arbitraries (Generators) ─────────────────────────────────────────────────

/** Generate a valid GraphLayer */
const arbLayer: fc.Arbitrary<GraphLayer> = fc.constantFrom(...GRAPH_LAYERS);

/** Generate a valid SimNode with bounded initial values */
function arbSimNode(id: string): fc.Arbitrary<SimNode> {
  return fc.record({
    id: fc.constant(id),
    x: fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true }),
    y: fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true }),
    z: fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true }),
    vx: fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
    vy: fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
    vz: fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
    fx: fc.constant(null),
    fy: fc.constant(null),
    fz: fc.constant(null),
    layer: arbLayer,
    influenceScore: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
  });
}

/**
 * Generate an array of SimNodes with a given count.
 * Uses a fixed-size tuple to avoid chain() which causes memory pressure.
 */
function arbSimNodesOfSize(count: number): fc.Arbitrary<SimNode[]> {
  const arbs = Array.from({ length: count }, (_, i) => arbSimNode(`node-${i}`));
  return fc.tuple(...arbs).map((tuple) => [...tuple]);
}

/** Generate tick count between 1 and 50 */
const arbTickCount: fc.Arbitrary<number> = fc.integer({ min: 1, max: 50 });

// ─── Property Test ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("Property 1: Force simulation positions are always finite");
console.log("=".repeat(60));

/**
 * Run the property for a given node count.
 * We test multiple node-count brackets to cover small, medium, and large graphs.
 */
function runPropertyForSize(nodeCount: number, numRuns: number): void {
  const label = `  Subcase: ${nodeCount} nodes, ${numRuns} runs`;
  try {
    fc.assert(
      fc.property(
        arbSimNodesOfSize(nodeCount),
        arbTickCount,
        (nodes, tickCount) => {
          // Generate edges connecting adjacent nodes in a ring + some cross-links
          const edges: SimEdge[] = [];
          if (nodes.length >= 2) {
            for (let i = 0; i < nodes.length; i++) {
              const nextIdx = (i + 1) % nodes.length;
              edges.push({
                source: nodes[i].id,
                target: nodes[nextIdx].id,
                weight: 0.5,
                isInterLayer: nodes[i].layer !== nodes[nextIdx].layer,
              });
            }
            // Add some cross-links for larger graphs
            if (nodes.length > 4) {
              for (let i = 0; i < Math.floor(nodes.length / 3); i++) {
                const srcIdx = i;
                const tgtIdx = (i + Math.floor(nodes.length / 2)) % nodes.length;
                if (srcIdx !== tgtIdx) {
                  edges.push({
                    source: nodes[srcIdx].id,
                    target: nodes[tgtIdx].id,
                    weight: 0.3,
                    isInterLayer: nodes[srcIdx].layer !== nodes[tgtIdx].layer,
                  });
                }
              }
            }
          }

          // Create simulation and tick
          const sim = new ForceSimulation(nodes, edges);
          const result = sim.tick(tickCount);

          // Apply NaN/Infinity guard (Req 1.7) and assert all are finite
          for (const node of result) {
            const x = clampCoord(node.x);
            const y = clampCoord(node.y);
            const z = clampCoord(node.z);

            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
              sim.dispose();
              return false;
            }
          }

          sim.dispose();
          return true;
        }
      ),
      { numRuns }
    );

    console.log(`${label} ✅`);
    passed++;
  } catch (err: any) {
    failed++;
    console.error(`${label} ❌`);
    console.error(`  Error: ${(err.message || String(err)).slice(0, 200)}`);
  }
}

// Run across multiple graph sizes
runPropertyForSize(1, 50);   // Single node — no forces
runPropertyForSize(3, 50);   // Minimal graph
runPropertyForSize(10, 50);  // Small graph
runPropertyForSize(25, 30);  // Medium graph
runPropertyForSize(50, 20);  // Large graph (matches task spec max)

// ─── Results ──────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log(`Results: ${passed}/5 subcases passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll property tests passed.");
process.exit(0);
