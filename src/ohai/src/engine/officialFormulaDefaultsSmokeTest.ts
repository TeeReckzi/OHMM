/**
 * Phase 5 smoke test — formula default leaf provider.
 */

import {
  getDefaultFormulaLeafValues,
  applyDefaultFormulaLeaves,
  getMissingDefaultKeys,
} from "./officialFormulaDefaults";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

function assertNear(actual: number, expected: number, label: string, epsilon = 1e-9): void {
  assert(Math.abs(actual - expected) < epsilon,
    `${label} — expected ${expected}, got ${actual}`);
}

console.log("\n=== Phase 5 Formula Default Leaf Provider Smoke Test ===\n");

// --- All defaults present ---
console.log("All defaults present:");
const defaults = getDefaultFormulaLeafValues();

const EXPECTED_DEFAULTS: Record<string, number> = {
  skill_rate:                     1,
  dis_dam_rate:                   1,
  cure_add_rate:                  1,
  use_final_ignore_dam_rate:      1,
  use_final_dam_add_rate:         1,
  pvp_adjust_factor:              1,
  special_regulate_factor:        1,
  attack_type_crit_enable:        1,
  dam_effect_rate:                1,
  crit_random_speed_factor:       0.8,
  anomaly_random_speed_factor:    0.8,
  weak_random_speed_factor:       0.8,
};

for (const [key, expected] of Object.entries(EXPECTED_DEFAULTS)) {
  assertNear(defaults[key] as number, expected, `default ${key} = ${expected}`);
}
assert(Object.keys(defaults).length === 12, "exactly 12 defaults");

// --- Returns a copy, not the original ---
console.log("\nImmutability:");
const d1 = getDefaultFormulaLeafValues();
const d2 = getDefaultFormulaLeafValues();
d1["skill_rate"] = 999;
assertNear(d2["skill_rate"] as number, 1, "getDefaultFormulaLeafValues returns independent copies");
assert(defaults["skill_rate"] === 1, "original defaults unchanged after mutation of returned copy");

// --- Overrides win ---
console.log("\nOverrides win:");
const overridden = applyDefaultFormulaLeaves({ skill_rate: 2.5, base_attack: 100 });
assertNear(overridden["skill_rate"] as number, 2.5, "skill_rate override = 2.5");
assertNear(overridden["base_attack"] as number, 100, "base_attack passthrough = 100");
assertNear(overridden["dis_dam_rate"] as number, 1, "dis_dam_rate filled with default = 1");
assertNear(overridden["crit_random_speed_factor"] as number, 0.8,
  "crit_random_speed_factor filled with default = 0.8");

// --- Missing defaults filled correctly ---
console.log("\nMissing defaults filled:");
const partial = { base_attack: 500, skill_rate: 1 };
const filled = applyDefaultFormulaLeaves(partial);
for (const [key, expected] of Object.entries(EXPECTED_DEFAULTS)) {
  if (!(key in partial)) {
    assertNear(filled[key] as number, expected, `missing ${key} filled as ${expected}`);
  }
}
assert("base_attack" in filled, "non-default key base_attack preserved");
assertNear(filled["base_attack"] as number, 500, "base_attack value preserved");

// --- getMissingDefaultKeys ---
console.log("\ngetMissingDefaultKeys:");
const allPresent = applyDefaultFormulaLeaves({});
assert(getMissingDefaultKeys(allPresent).length === 0,
  "no missing keys after full apply");

const missingTwo = getMissingDefaultKeys({ skill_rate: 1 });
assert(missingTwo.includes("dis_dam_rate"), "dis_dam_rate listed as missing");
assert(missingTwo.includes("crit_random_speed_factor"), "crit_random_speed_factor listed as missing");
assert(!missingTwo.includes("skill_rate"), "skill_rate not listed as missing (it is present)");

// --- Empty input uses all defaults ---
console.log("\nEmpty input:");
const fromEmpty = applyDefaultFormulaLeaves({});
assert(Object.keys(fromEmpty).length === 12, "12 keys from empty input");
assertNear(fromEmpty["dam_effect_rate"] as number, 1, "dam_effect_rate = 1 from empty");

console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Phase 5 smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Phase 5 smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
