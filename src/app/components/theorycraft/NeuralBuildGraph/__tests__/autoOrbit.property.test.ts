/**
 * Property 9: Auto-orbit maintains constant distance from target
 *
 * For any camera position and target centroid, rotating the camera around the
 * target using spherical coordinates preserves the distance between the camera
 * position and the target centroid (within 0.001 tolerance).
 *
 * **Validates: Requirement 10.1**
 *
 * Uses fast-check for property-based testing, run via `npx tsx`.
 */

import fc from "fast-check";
import * as THREE from "three";

// ─── Constants & Arbitraries ──────────────────────────────────────────────────

/** Generate a coordinate in range [-1000, 1000] */
const arbCoord = fc.integer({ min: -100000, max: 100000 }).map((n) => n / 100);

/** Generate a 3D vector */
const arbVector = fc.record({
  x: arbCoord,
  y: arbCoord,
  z: arbCoord,
}).map((v) => new THREE.Vector3(v.x, v.y, v.z));

/** Generate rotation step (delta * speed) in radians */
const arbRotationStep = fc.double({ min: -Math.PI, max: Math.PI });

// ─── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("Property 9: Auto-orbit maintains constant distance from target");
console.log("=".repeat(65));

try {
  fc.assert(
    fc.property(arbVector, arbVector, arbRotationStep, (cameraPos, centroid, rotationStep) => {
      // Ensure camera position is not exactly at the centroid (avoid zero distance)
      if (cameraPos.distanceToSquared(centroid) < 0.01) {
        return true;
      }

      const initialDistance = cameraPos.distanceTo(centroid);

      // Perform spherical rotation mapping
      const offset = cameraPos.clone().sub(centroid);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      
      // Update rotation
      spherical.theta += rotationStep;
      spherical.makeSafe();

      // Compute new camera position
      const newCameraPos = new THREE.Vector3()
        .setFromSpherical(spherical)
        .add(centroid);

      const finalDistance = newCameraPos.distanceTo(centroid);

      // Verify distance is preserved within 0.001
      if (Math.abs(finalDistance - initialDistance) > 0.001) {
        throw new Error(
          `Distance mismatch: initial=${initialDistance}, final=${finalDistance}, ` +
          `diff=${Math.abs(finalDistance - initialDistance)}`
        );
      }

      return true;
    }),
    { numRuns: 200 }
  );
  passed++;
  console.log("  Distance invariance validation (200 runs):  ✅ PASSED");
} catch (err: any) {
  failed++;
  console.error("  Distance invariance validation (200 runs):  ❌ FAILED");
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
