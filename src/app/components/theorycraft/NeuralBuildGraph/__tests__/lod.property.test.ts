/**
 * Property-based tests for LOD Tier Hysteresis.
 *
 * Property 16: LOD tier assignment matches node count with hysteresis
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */

import * as fc from "fast-check";
import { computeTierFromNodeCount, type LODTier } from "../useLOD";

// ─── Test Runner ──────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runProperty(name: string, fn: () => void): Promise<void> {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`[PASS] ${name}`);
  } catch (e: any) {
    results.push({ name, passed: false, error: e.message ?? String(e) });
    console.log(`[FAIL] ${name}`);
    console.log(`  Counterexample: ${e.message ?? String(e)}`);
  }
}

// ─── Property 16: LOD Tier Assignment Hysteresis ─────────────────────────────

await runProperty("Property 16: LOD tier assignment matches node count with hysteresis", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 150 }), // initial node count
      fc.array(fc.integer({ min: 1, max: 150 }), { minLength: 1, maxLength: 50 }), // sequence of node count changes
      (initialCount, countSequence) => {
        // Initial state determination without active current tier (simulates bootstrap)
        let currentTier: LODTier;
        if (initialCount > 100) currentTier = "static";
        else if (initialCount > 60) currentTier = "minimal";
        else if (initialCount > 30) currentTier = "reduced";
        else currentTier = "full";

        // Process sequence of node counts and assert hysteresis rules
        for (const count of countSequence) {
          const nextTier = computeTierFromNodeCount(count, currentTier);

          // Verify hysteresis rules
          if (currentTier === "full") {
            // Cannot upgrade (already at highest quality).
            // Downgrade to reduced requires crossing fullMax + hysteresis (30 + 3 = 33)
            if (count > 33) {
              if (nextTier === "full") {
                throw new Error(`Expected downgrade from full to reduced/minimal/static for nodeCount ${count}, but stayed in full`);
              }
            } else {
              // Should stay in full
              if (nextTier !== "full") {
                throw new Error(`Expected to stay in full for nodeCount ${count} <= 33, but got ${nextTier}`);
              }
            }
          } else if (currentTier === "reduced") {
            // Upgrade to full requires dropping below fullMax - hysteresis (30 - 3 = 27)
            if (count <= 27) {
              if (nextTier !== "full") {
                throw new Error(`Expected upgrade from reduced to full for nodeCount ${count} <= 27, but got ${nextTier}`);
              }
            }
            // Downgrade to minimal requires crossing reducedMax + hysteresis (60 + 3 = 63)
            else if (count > 63) {
              if (nextTier === "reduced" || nextTier === "full") {
                throw new Error(`Expected downgrade from reduced to minimal/static for nodeCount ${count} > 63, but got ${nextTier}`);
              }
            }
            // In hysteresis zone (28 to 30: shouldn't upgrade to full; 61 to 63: shouldn't downgrade to minimal)
            else {
              if (count >= 28 && count <= 30 && nextTier === "full") {
                throw new Error(`Hysteresis violation: upgraded to full at nodeCount ${count} (requires <= 27)`);
              }
              if (count >= 61 && count <= 63 && (nextTier === "minimal" || nextTier === "static")) {
                throw new Error(`Hysteresis violation: downgraded to minimal/static at nodeCount ${count} (requires > 63)`);
              }
            }
          } else if (currentTier === "minimal") {
            // Upgrade to reduced requires dropping below reducedMax - hysteresis (60 - 3 = 57)
            if (count <= 57) {
              if (nextTier === "minimal" || nextTier === "static") {
                throw new Error(`Expected upgrade from minimal to full/reduced for nodeCount ${count} <= 57, but got ${nextTier}`);
              }
            }
            // Downgrade to static requires crossing minimalMax + hysteresis (100 + 3 = 103)
            else if (count > 103) {
              if (nextTier !== "static") {
                throw new Error(`Expected downgrade from minimal to static for nodeCount ${count} > 103, but got ${nextTier}`);
              }
            }
            // Hysteresis zones (58 to 60: shouldn't upgrade; 101 to 103: shouldn't downgrade)
            else {
              if (count >= 58 && count <= 60 && (nextTier === "reduced" || nextTier === "full")) {
                throw new Error(`Hysteresis violation: upgraded to reduced/full at nodeCount ${count} (requires <= 57)`);
              }
              if (count >= 101 && count <= 103 && nextTier === "static") {
                throw new Error(`Hysteresis violation: downgraded to static at nodeCount ${count} (requires > 103)`);
              }
            }
          } else if (currentTier === "static") {
            // Upgrade to minimal requires dropping below minimalMax - hysteresis (100 - 3 = 97)
            if (count <= 97) {
              if (nextTier === "static") {
                throw new Error(`Expected upgrade from static to minimal/reduced/full for nodeCount ${count} <= 97, but got static`);
              }
            } else {
              // Should stay in static
              if (nextTier !== "static") {
                throw new Error(`Hysteresis violation: upgraded from static at nodeCount ${count} > 97, got ${nextTier}`);
              }
            }
          }

          // Advance state
          currentTier = nextTier;
        }

        return true;
      }
    ),
    { numRuns: 200 }
  );
});

// ─── Summary ──────────────────────────────────────────────────────────────────

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.log(`\n${failed.length} property test(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`\nAll ${results.length} property tests passed.`);
  process.exit(0);
}
