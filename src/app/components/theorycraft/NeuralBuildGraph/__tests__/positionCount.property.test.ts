/**
 * Property 2: Position count equals node count
 *
 * For any valid set of SimNodes, after at least one tick of ForceSimulation,
 * the returned nodes array length equals the input nodes length.
 *
 * **Validates: Requirement 1.5**
 *
 * positionsRef.current.size === vm.nodes.length after first tick —
 * one position per node, no missing entries, no orphan entries.
 */

import * as fc from "fast-check";
import { ForceSimulation } from "../ForceSimulation";
import type { SimNode, SimEdge } from "../ForceSimulation";

// ─── GraphLayer type ──────────────────────────────────────────────────────────

const GRAPH_LAYERS = [
  "equipment",
  "stats",
  "keywords",
  "status-effects",
  "combat-formula",
  "final-output",
] as const;

type GraphLayer = (typeof GRAPH_LAYERS)[number];

// ─── Generators ───────────────────────────────────────────────────────────────

function makeSimNode(id: string, layer: GraphLayer, x: number, y: number, z: number, influence: number): SimNode {
  return {
    id,
    x, y, z,
    vx: 0, vy: 0, vz: 0,
    fx: null, fy: null, fz: null,
    layer,
    influenceScore: influence,
  };
}

/** Arbitrary for a single test case: nodes, edges, and tick count */
const arbTestCase = fc
  .record({
    nodeCount: fc.integer({ min: 1, max: 30 }),
    tickCount: fc.integer({ min: 1, max: 20 }),
    seed: fc.integer({ min: 0, max: 1000000 }),
  })
  .map(({ nodeCount, tickCount, seed }) => {
    // Deterministically generate nodes from seed
    let rng = seed;
    const next = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 0xFFFFFFFF; };

    const nodes: SimNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const layer = GRAPH_LAYERS[Math.floor(next() * GRAPH_LAYERS.length)];
      const x = (next() - 0.5) * 200;
      const y = (next() - 0.5) * 200;
      const z = (next() - 0.5) * 200;
      const influence = next();
      nodes.push(makeSimNode(`node-${i}`, layer, x, y, z, influence));
    }

    // Generate edges connecting valid nodes
    const edgeCount = Math.min(Math.floor(next() * nodeCount * 2), 50);
    const edges: SimEdge[] = [];
    for (let i = 0; i < edgeCount && nodes.length >= 2; i++) {
      const srcIdx = Math.floor(next() * nodes.length);
      let tgtIdx = Math.floor(next() * nodes.length);
      if (tgtIdx === srcIdx) tgtIdx = (tgtIdx + 1) % nodes.length;
      edges.push({
        source: nodes[srcIdx].id,
        target: nodes[tgtIdx].id,
        weight: next() * 0.9 + 0.1, // [0.1, 1.0]
      });
    }

    return { nodes, edges, tickCount };
  });

// ─── Property Test ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

try {
  fc.assert(
    fc.property(arbTestCase, ({ nodes, edges, tickCount }) => {
      const inputLength = nodes.length;
      const sim = new ForceSimulation(nodes, edges);
      try {
        const result = sim.tick(tickCount);

        // Property 2: returned nodes length === input nodes length
        // ForceSimulation must preserve all nodes — no nodes lost or created
        if (result.length !== inputLength) {
          return false;
        }

        return true;
      } finally {
        sim.dispose();
      }
    }),
    { numRuns: 100 }
  );

  passed++;
  console.log(
    `✅ PASSED: Property 2 — Position count equals node count (100 iterations)`
  );
} catch (err) {
  failed++;
  console.error(`❌ FAILED: Property 2 — Position count equals node count`);
  console.error((err as Error).message);
}

// ─── Exit ─────────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
