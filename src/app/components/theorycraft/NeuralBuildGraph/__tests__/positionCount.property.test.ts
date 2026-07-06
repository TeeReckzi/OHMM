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

// ─── GraphLayer type (mirrored to avoid importing from lib layer in test) ─────

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

const arbLayer = fc.constantFrom(...GRAPH_LAYERS);

const arbSimNode = (id: string): fc.Arbitrary<SimNode> =>
  fc.record({
    id: fc.constant(id),
    x: fc.double({ min: -100, max: 100, noNaN: true }),
    y: fc.double({ min: -100, max: 100, noNaN: true }),
    z: fc.double({ min: -100, max: 100, noNaN: true }),
    vx: fc.constant(0),
    vy: fc.constant(0),
    vz: fc.constant(0),
    fx: fc.constant(null),
    fy: fc.constant(null),
    fz: fc.constant(null),
    layer: arbLayer as fc.Arbitrary<GraphLayer>,
    influenceScore: fc.double({ min: 0, max: 1, noNaN: true }),
  }) as fc.Arbitrary<SimNode>;

/** Generate 1-20 unique SimNodes */
const arbSimNodes: fc.Arbitrary<SimNode[]> = fc
  .integer({ min: 1, max: 20 })
  .chain((count) => {
    const nodeArbs = Array.from({ length: count }, (_, i) =>
      arbSimNode(`node-${i}`)
    );
    return fc.tuple(...nodeArbs);
  })
  .map((tuple) => [...tuple]);

/** Generate edges that reference valid node IDs with weights in [0,1] */
const arbSimEdges = (nodes: SimNode[]): fc.Arbitrary<SimEdge[]> => {
  if (nodes.length < 2) return fc.constant([]);

  const edgeCount = fc.integer({ min: 0, max: Math.min(nodes.length * 2, 100) });

  return edgeCount.chain((count) => {
    const edgeArbs = Array.from({ length: count }, () =>
      fc
        .tuple(
          fc.integer({ min: 0, max: nodes.length - 1 }),
          fc.integer({ min: 0, max: nodes.length - 1 }),
          fc.double({ min: 0.01, max: 1.0, noNaN: true })
        )
        .filter(([s, t]) => s !== t)
        .map(([sourceIdx, targetIdx, weight]): SimEdge => ({
          source: nodes[sourceIdx].id,
          target: nodes[targetIdx].id,
          weight,
        }))
    );

    if (edgeArbs.length === 0) return fc.constant([] as SimEdge[]);
    return fc.tuple(...edgeArbs).map((tuple) => [...tuple]);
  });
};

/** Generate tick count between 1 and 20 */
const arbTickCount = fc.integer({ min: 1, max: 20 });

// ─── Property Test ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

try {
  fc.assert(
    fc.property(arbSimNodes, arbTickCount, (nodes, tickCount) => {
      // Generate edges from the generated nodes
      const edges: SimEdge[] = [];
      // Deterministically create a few edges from the nodes for variety
      for (let i = 1; i < nodes.length && edges.length < nodes.length * 2; i++) {
        if (i % 2 === 0) {
          edges.push({
            source: nodes[i - 1].id,
            target: nodes[i].id,
            weight: 0.5,
          });
        }
      }

      const sim = new ForceSimulation(nodes, edges);
      try {
        const result = sim.tick(tickCount);

        // Property 2: returned nodes length === input nodes length
        if (result.length !== nodes.length) {
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
