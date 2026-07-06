/**
 * Property 4: Zoom-to-fit frames all nodes within camera frustum
 *
 * For any set of 1-100 node positions, after computeZoomToFit, every node
 * projects to NDC within [-1, 1] on both X and Y axes. This validates that
 * the camera is positioned at a sufficient distance and orientation so that
 * all nodes are visible within the camera's view frustum.
 *
 * **Validates: Requirements 4.1, 4.6**
 *
 * Uses fast-check for property-based testing, run via `npx tsx`.
 */

import fc from "fast-check";
import * as THREE from "three";
import { computeZoomToFit } from "../useCinematicCamera";

// ─── Arbitraries (Generators) ─────────────────────────────────────────────────

/** Position coordinate in range [-100, 100] */
const arbCoord = fc.integer({ min: -10000, max: 10000 }).map((n) => n / 100);

/** Aspect ratio between 0.5 and 2.0 */
const arbAspect = fc.integer({ min: 50, max: 200 }).map((n) => n / 100);

/** Node position record */
const arbPosition = fc.record({
  x: arbCoord,
  y: arbCoord,
  z: arbCoord,
});

/** Generate a position map with 1-100 entries */
const arbPositionMap = fc
  .array(arbPosition, { minLength: 1, maxLength: 100 })
  .map((positions) => {
    const map = new Map<string, { x: number; y: number; z: number }>();
    positions.forEach((pos, idx) => {
      map.set(`node-${idx}`, pos);
    });
    return map;
  });

// ─── Property Function ────────────────────────────────────────────────────────

/**
 * Core property: after computeZoomToFit, every node in the position map
 * projects to NDC coordinates within [-1, 1] on both X and Y axes.
 *
 * Steps:
 * 1. Create a PerspectiveCamera with FOV 50 and the given aspect ratio
 * 2. Call computeZoomToFit to get camera position and target
 * 3. Apply the returned position/target to the camera
 * 4. Project every node position through the camera's combined matrix
 * 5. Verify all NDC X and Y values are within [-1, 1]
 */
function zoomToFitFramesAllNodes(
  positions: Map<string, { x: number; y: number; z: number }>,
  aspect: number,
): boolean {
  // Create camera with FOV 50 and given aspect ratio
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 10000);
  camera.position.set(0, 0, 50); // Start position away from origin

  // Compute zoom-to-fit
  const result = computeZoomToFit(positions, camera);

  // Apply the returned camera position and look-at
  camera.position.copy(result.position);
  camera.lookAt(result.target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  // Build the combined projection-view matrix
  const projScreenMatrix = new THREE.Matrix4();
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );

  // Project every node and verify NDC bounds
  for (const pos of positions.values()) {
    const v = new THREE.Vector4(pos.x, pos.y, pos.z, 1);
    v.applyMatrix4(projScreenMatrix);

    // Perspective divide
    const ndcX = v.x / v.w;
    const ndcY = v.y / v.w;

    // All projected nodes must be within [-1, 1] on both axes
    if (ndcX < -1 || ndcX > 1 || ndcY < -1 || ndcY > 1) {
      return false;
    }

    // Node must be in front of the camera (positive w after projection)
    if (v.w <= 0) {
      return false;
    }
  }

  return true;
}

// ─── Property Test ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("Property 4: Zoom-to-fit frames all nodes within camera frustum");
console.log("=".repeat(65));

// Subcase 1: Small position sets (1-10 nodes), various aspect ratios, 100 runs
try {
  fc.assert(
    fc.property(
      fc
        .array(arbPosition, { minLength: 1, maxLength: 10 })
        .map((positions) => {
          const map = new Map<string, { x: number; y: number; z: number }>();
          positions.forEach((pos, idx) => map.set(`node-${idx}`, pos));
          return map;
        }),
      arbAspect,
      (positions, aspect) => {
        return zoomToFitFramesAllNodes(positions, aspect);
      },
    ),
    { numRuns: 100 },
  );
  passed++;
  console.log("  Small sets (1-10 nodes, 100 runs):      ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  Small sets (1-10 nodes, 100 runs):      ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 500)}`);
}

// Subcase 2: Medium position sets (11-50 nodes), various aspect ratios, 100 runs
try {
  fc.assert(
    fc.property(
      fc
        .array(arbPosition, { minLength: 11, maxLength: 50 })
        .map((positions) => {
          const map = new Map<string, { x: number; y: number; z: number }>();
          positions.forEach((pos, idx) => map.set(`node-${idx}`, pos));
          return map;
        }),
      arbAspect,
      (positions, aspect) => {
        return zoomToFitFramesAllNodes(positions, aspect);
      },
    ),
    { numRuns: 100 },
  );
  passed++;
  console.log("  Medium sets (11-50 nodes, 100 runs):    ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  Medium sets (11-50 nodes, 100 runs):    ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 500)}`);
}

// Subcase 3: Large position sets (51-100 nodes), various aspect ratios, 50 runs
try {
  fc.assert(
    fc.property(
      fc
        .array(arbPosition, { minLength: 51, maxLength: 100 })
        .map((positions) => {
          const map = new Map<string, { x: number; y: number; z: number }>();
          positions.forEach((pos, idx) => map.set(`node-${idx}`, pos));
          return map;
        }),
      arbAspect,
      (positions, aspect) => {
        return zoomToFitFramesAllNodes(positions, aspect);
      },
    ),
    { numRuns: 50 },
  );
  passed++;
  console.log("  Large sets (51-100 nodes, 50 runs):     ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  Large sets (51-100 nodes, 50 runs):     ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 500)}`);
}

// Subcase 4: Single node (degenerate case), 50 runs
try {
  fc.assert(
    fc.property(
      arbPosition.map((pos) => {
        const map = new Map<string, { x: number; y: number; z: number }>();
        map.set("node-0", pos);
        return map;
      }),
      arbAspect,
      (positions, aspect) => {
        return zoomToFitFramesAllNodes(positions, aspect);
      },
    ),
    { numRuns: 50 },
  );
  passed++;
  console.log("  Single node (degenerate, 50 runs):      ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  Single node (degenerate, 50 runs):      ❌ FAILED");
  console.error(`  ${(err.message || String(err)).slice(0, 500)}`);
}

// ─── Results ──────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(65));
console.log(`Results: ${passed}/4 subcases passed, ${failed} failed`);
console.log(`Total property runs: 300`);

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll property tests passed.");
process.exit(0);
