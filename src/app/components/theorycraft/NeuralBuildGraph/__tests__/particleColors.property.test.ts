/**
 * Property 8: Per-instance particle colors match their edge categories
 *
 * For any set of edges with categories, every particle's color in the
 * Float32Array matches EDGE_VISUAL_CONFIG[category].particleColor within tolerance 0.001.
 *
 * **Validates: Requirements 9.1, 9.3**
 *
 * Uses fast-check for property-based testing, run via `npx tsx`.
 */

import fc from "fast-check";
import * as THREE from "three";
import { buildParticleColors } from "../DirectedParticles";
import { EDGE_VISUAL_CONFIG } from "../../../../../lib/ohmm/theorycraft/buildGraph.constants";
import type { EdgeCategory } from "../../../../../lib/ohmm/theorycraft/buildGraph.types";

// ─── Constants & Arbitraries ──────────────────────────────────────────────────

const VALID_CATEGORIES = Object.keys(EDGE_VISUAL_CONFIG) as EdgeCategory[];

const arbCategory = fc.constantFrom(...VALID_CATEGORIES);

/** Generate a single particle slot */
const arbParticleSlot = fc.record({
  sourceId: fc.string(),
  targetId: fc.string(),
  category: arbCategory,
  speed: fc.double({ min: 0.1, max: 2.0 }),
  offset: fc.double({ min: 0.0, max: 1.0 }),
  scale: fc.double({ min: 0.5, max: 2.0 }),
});

/** Generate a list of particle slots (1-200 particles) */
const arbParticleSlots = fc.array(arbParticleSlot, { minLength: 1, maxLength: 200 });

// ─── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("Property 8: Per-instance particle colors match their edge categories");
console.log("=".repeat(65));

try {
  fc.assert(
    fc.property(arbParticleSlots, (slots) => {
      const colorArray = buildParticleColors(slots);

      // Verify Float32Array size is exactly 3 * slots.length
      if (colorArray.length !== slots.length * 3) {
        throw new Error(`Array length mismatch: expected ${slots.length * 3}, got ${colorArray.length}`);
      }

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const config = EDGE_VISUAL_CONFIG[s.category];
        if (!config) {
          throw new Error(`Missing config for category: ${s.category}`);
        }

        const expectedHex = config.particleColor;
        const expectedColor = new THREE.Color(expectedHex);

        const r = colorArray[i * 3];
        const g = colorArray[i * 3 + 1];
        const b = colorArray[i * 3 + 2];

        // Match within tolerance 0.001
        if (
          Math.abs(r - expectedColor.r) > 0.001 ||
          Math.abs(g - expectedColor.g) > 0.001 ||
          Math.abs(b - expectedColor.b) > 0.001
        ) {
          throw new Error(
            `Color mismatch at index ${i} (category: ${s.category}): ` +
            `expected rgb(${expectedColor.r}, ${expectedColor.g}, ${expectedColor.b}), ` +
            `got rgb(${r}, ${g}, ${b})`
          );
        }
      }
      return true;
    }),
    { numRuns: 200 }
  );
  passed++;
  console.log("  Particle color array validation (200 runs): ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  Particle color array validation (200 runs): ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 500)}`);
}

// ─── Results ──────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(65));
console.log(`Results: ${passed}/1 subcases passed, ${failed} failed`);
console.log(`Total property runs: 200`);

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll property tests passed.");
process.exit(0);
