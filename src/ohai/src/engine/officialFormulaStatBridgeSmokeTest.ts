/**
 * Smoke test for official formula stat bridge — resolver value injection.
 *
 * Validates:
 *   1. Bridge entries exist for all expected mappings
 *   2. Bridge injection works for attack_type (melee)
 *   3. Bridge injection works for element_type (fire/ice/lightning)
 *   4. Bridge injection works for keyword types with LOW confidence warning
 *   5. Gun type stays 0 with warning (no bridge entries)
 *   6. Missing player stat value leaves leaf at 0 with warning
 *   7. Multiple injected leaves stack additively
 *   8. use_final_dam_add_rate=0 still forces additional rate to 1.00
 *   9. End-to-end: bridge + tag resolver + formula runtime
 */

import {
  getAllBridgeEntries,
  getBridgeEntry,
  resolveBridgeInjections,
  getUnmappedBridgeLeaves,
} from "./officialFormulaStatBridge";
import { resolveDynamicLeaf } from "./officialFormulaLeafResolvers";
import { createRecipeRuntime } from "./officialFormulaGraphRuntime";
import {
  DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE,
  FINAL_ATTACK_ADDITIONAL_RATE_RECIPE,
} from "./officialFormulaGraphRecipes";
import type { StatKey } from "../schemas/buildGoalSchema";

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

function assertNear(actual: number, expected: number, label: string, epsilon = 1e-6): void {
  const ok = Math.abs(actual - expected) < epsilon;
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

console.log("\n=== Official Formula Stat Bridge Smoke Test ===\n");

// ─── Bridge Entry Inventory ───────────────────────────────────────────────────
console.log("Bridge entry inventory:");

{
  const entries = getAllBridgeEntries();
  assert(entries.length === 10, `10 bridge entries total (got ${entries.length})`);
  assert(entries.some((e) => e.suffix === "melee" && e.leafName === "attack_type_dam_add_rate"), "melee attack_type entry exists");
  assert(entries.some((e) => e.suffix === "fire" && e.leafName === "element_type_dam_add_rate"), "fire element entry exists");
  assert(entries.some((e) => e.suffix === "ice" && e.leafName === "element_type_dam_add_rate"), "ice element entry exists");
  assert(entries.some((e) => e.suffix === "lightning" && e.leafName === "element_type_dam_add_rate"), "lightning element entry exists");
  assert(entries.some((e) => e.suffix === "physics" && e.leafName === "element_type_dam_add_rate"), "physics element entry exists");
  assert(entries.some((e) => e.suffix === "scorch" && e.leafName === "keyword_proc_dam_add_rate"), "scorch keyword entry exists");
  assert(entries.some((e) => e.suffix === "vortex" && e.leafName === "keyword_proc_dam_add_rate"), "vortex keyword entry exists");
  assert(entries.some((e) => e.suffix === "surge" && e.leafName === "keyword_proc_dam_add_rate"), "surge keyword entry exists");
  assert(entries.some((e) => e.suffix === "blast" && e.leafName === "keyword_proc_dam_add_rate"), "blast keyword entry exists");
  assert(entries.some((e) => e.suffix === "shrap" && e.leafName === "keyword_proc_dam_add_rate"), "shrap keyword entry exists");
}

// ─── Bridge Entry Lookup ──────────────────────────────────────────────────────
console.log("\nBridge entry lookup:");

{
  const entry = getBridgeEntry("attack_type_dam_add_rate_melee");
  assert(entry !== undefined, "attack_type_dam_add_rate_melee entry found");
  assert(entry?.statKey === "meleeDMGBonus", "melee → meleeDMGBonus");
  assert(entry?.confidence === "high", "melee confidence = high");
}
{
  const entry = getBridgeEntry("element_type_dam_add_rate_fire");
  assert(entry !== undefined, "element_type_dam_add_rate_fire entry found");
  assert(entry?.statKey === "elementalDMGBonus", "fire → elementalDMGBonus");
  assert(entry?.confidence === "high", "fire confidence = high");
}
{
  const entry = getBridgeEntry("keyword_proc_dam_add_rate_scorch");
  assert(entry !== undefined, "keyword_proc_dam_add_rate_scorch entry found");
  assert(entry?.statKey === "burnDMGBonus", "scorch → burnDMGBonus");
  assert(entry?.confidence === "high", "scorch confidence = high (from game data)");
}
{
  const entry = getBridgeEntry("gun_type_dam_add_rate_rifle");
  assert(entry === undefined, "gun_type_dam_add_rate_rifle entry NOT found (no gun type data)");
}
{
  const entry = getBridgeEntry("attack_type_dam_add_rate_remote");
  assert(entry === undefined, "attack_type_dam_add_rate_remote entry NOT found (no OHAI remote stat)");
}

// ─── Attack Type Bridge Injection ─────────────────────────────────────────────
console.log("\nAttack type bridge injection:");

{
  const resolution = resolveDynamicLeaf("attack_type_dam_add_rate", { formula_attack_type: 1 });
  assert(resolution.resolvedAttrName === "attack_type_dam_add_rate_melee", "formula_attack_type=1 → melee attr name");

  const report = resolveBridgeInjections(
    { attack_type_dam_add_rate: resolution.resolvedAttrName! },
    { meleeDMGBonus: 0.20 } as Partial<Record<StatKey, number>>,
  );
  assert(report.injections["attack_type_dam_add_rate"] === 0.20, "meleeDMGBonus=0.20 → attack_type_dam_add_rate=0.20");
  assert(report.results[0].confidence === "high", "melee injection confidence = high");
}

// ─── Element Type Bridge Injection ────────────────────────────────────────────
console.log("\nElement type bridge injection:");

{
  const resolution = resolveDynamicLeaf("element_type_dam_add_rate", { element_type: "blaze" });
  assert(resolution.resolvedAttrName === "element_type_dam_add_rate_fire", "element_type=blaze → fire attr name");

  const report = resolveBridgeInjections(
    { element_type_dam_add_rate: resolution.resolvedAttrName! },
    { elementalDMGBonus: 0.15 } as Partial<Record<StatKey, number>>,
  );
  assert(report.injections["element_type_dam_add_rate"] === 0.15, "elementalDMGBonus=0.15 → element_type_dam_add_rate=0.15");
}
{
  const resolution = resolveDynamicLeaf("element_type_dam_add_rate", { element_type: "frost" });
  assert(resolution.resolvedAttrName === "element_type_dam_add_rate_ice", "element_type=frost → ice attr name");
}
{
  const resolution = resolveDynamicLeaf("element_type_dam_add_rate", { element_type: "shock" });
  assert(resolution.resolvedAttrName === "element_type_dam_add_rate_lightning", "element_type=shock → lightning attr name");
}

// ─── Keyword Bridge Injection (HIGH confidence) ───────────────────────────────
console.log("\nKeyword bridge injection (HIGH confidence):");

{
  const resolution = resolveDynamicLeaf("keyword_proc_dam_add_rate", { keyword_type: "SCORCH" });
  assert(resolution.resolvedAttrName === "keyword_proc_dam_add_rate_scorch", "keyword_type=SCORCH → scorch attr name");

  const report = resolveBridgeInjections(
    { keyword_proc_dam_add_rate: resolution.resolvedAttrName! },
    { burnDMGBonus: 0.30 } as Partial<Record<StatKey, number>>,
  );
  assert(report.injections["keyword_proc_dam_add_rate"] === 0.30, "burnDMGBonus=0.30 → keyword_proc_dam_add_rate=0.30");
  assert(report.results[0].confidence === "high", "scorch injection confidence = high");
}
{
  const resolution = resolveDynamicLeaf("keyword_proc_dam_add_rate", { keyword_type: "VORTEX" });
  const report = resolveBridgeInjections(
    { keyword_proc_dam_add_rate: resolution.resolvedAttrName! },
    { frostVortexDMGBonus: 0.25 } as Partial<Record<StatKey, number>>,
  );
  assert(report.injections["keyword_proc_dam_add_rate"] === 0.25, "frostVortexDMGBonus=0.25 → keyword_proc_dam_add_rate=0.25");
}
{
  const resolution = resolveDynamicLeaf("keyword_proc_dam_add_rate", { keyword_type: "SURGE" });
  const report = resolveBridgeInjections(
    { keyword_proc_dam_add_rate: resolution.resolvedAttrName! },
    { powerSurgeDMGBonus: 0.20 } as Partial<Record<StatKey, number>>,
  );
  assert(report.injections["keyword_proc_dam_add_rate"] === 0.20, "powerSurgeDMGBonus=0.20 → keyword_proc_dam_add_rate=0.20");
}

// ─── Gun Type Stays 0 ─────────────────────────────────────────────────────────
console.log("\nGun type stays 0 with warning:");

{
  const resolution = resolveDynamicLeaf("gun_type_dam_add_rate", { gun_type: "rifle" });
  assert(resolution.resolvedAttrName === undefined, "gun_type=rifle does not resolve to attr name (no tag table entries)");

  const report = resolveBridgeInjections({}, null);
  assert(Object.keys(report.injections).length === 0, "no injections when no resolved attr names");
}
{
  const report = resolveBridgeInjections(
    { gun_type_dam_add_rate: "gun_type_dam_add_rate_rifle" },
    { weaponDMGBonus: 0.50 } as Partial<Record<StatKey, number>>,
  );
  assert(report.unresolvedLeaves.includes("gun_type_dam_add_rate"), "gun_type_dam_add_rate is unresolved (no bridge mapping)");
  assert(report.warnings.some((w) => w.includes("no bridge mapping")), "warning about no bridge mapping for gun type");
}

// ─── Missing Player Stat → 0 with Warning ─────────────────────────────────────
console.log("\nMissing player stat → 0 with warning:");

{
  const report = resolveBridgeInjections(
    { attack_type_dam_add_rate: "attack_type_dam_add_rate_melee" },
    {} as Partial<Record<StatKey, number>>,
  );
  assert(report.injections["attack_type_dam_add_rate"] === 0, "missing meleeDMGBonus → 0");
  assert(report.warnings.some((w) => w.includes("0 or absent")), "warning about missing stat value");
}
{
  const report = resolveBridgeInjections(
    { element_type_dam_add_rate: "element_type_dam_add_rate_fire" },
    null,
  );
  assert(report.injections["element_type_dam_add_rate"] === 0, "null stats → 0");
  assert(report.warnings.some((w) => w.includes("no player stats")), "warning about null stats");
}

// ─── Multiple Leaves Stack Additively ─────────────────────────────────────────
console.log("\nMultiple leaves stack additively:");

{
  const resolvedAttrNames: Record<string, string> = {
    attack_type_dam_add_rate: "attack_type_dam_add_rate_melee",
    element_type_dam_add_rate: "element_type_dam_add_rate_fire",
    keyword_proc_dam_add_rate: "keyword_proc_dam_add_rate_scorch",
  };
  const stats: Partial<Record<StatKey, number>> = {
    meleeDMGBonus: 0.20,
    elementalDMGBonus: 0.15,
    burnDMGBonus: 0.10,
  };
  const report = resolveBridgeInjections(resolvedAttrNames, stats);
  assert(report.injections["attack_type_dam_add_rate"] === 0.20, "attack_type=0.20");
  assert(report.injections["element_type_dam_add_rate"] === 0.15, "element_type=0.15");
  assert(report.injections["keyword_proc_dam_add_rate"] === 0.10, "keyword_proc=0.10");

  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 0.25);
  for (const [leaf, val] of Object.entries(report.injections)) {
    if (val !== 0) rt.setLeafValue(leaf, val);
  }
  rt.update();
  const rate = rt.getTargetValue("final_attack_additional_rate");
  assertNear(
    typeof rate === "number" ? rate : -1,
    1.70,
    "weapon=0.25 + attack=0.20 + element=0.15 + keyword=0.10 → rate=1.70",
  );
}

// ─── Gate Behavior Preserved ──────────────────────────────────────────────────
console.log("\nGate behavior preserved:");

{
  const rt = createRecipeRuntime(FINAL_ATTACK_ADDITIONAL_RATE_RECIPE);
  rt.setLeafValue("weapon_attack_add_rate", 0.25);
  rt.setLeafValue("attack_type_dam_add_rate", 0.20);
  rt.setLeafValue("element_type_dam_add_rate", 0.15);
  rt.setLeafValue("use_final_dam_add_rate", 0);
  rt.update();
  const rate = rt.getTargetValue("final_attack_additional_rate");
  assertNear(
    typeof rate === "number" ? rate : -1,
    1.00,
    "use_final_dam_add_rate=0 → rate=1.00 regardless of injected leaves",
  );
}

// ─── End-to-End: Bridge + Tag Resolver + V2 Recipe ────────────────────────────
console.log("\nEnd-to-end: bridge + tag resolver + V2 recipe:");

{
  const stats: Partial<Record<StatKey, number>> = {
    weaponDMGBonus: 0.25,
    meleeDMGBonus: 0.20,
    elementalDMGBonus: 0.15,
  };

  const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
  rt.setLeafValue("base_attack", 100);
  rt.setLeafValue("weapon_attack_add_rate", stats.weaponDMGBonus ?? 0);

  const attackRes = resolveDynamicLeaf("attack_type_dam_add_rate", { formula_attack_type: 1 });
  const elementRes = resolveDynamicLeaf("element_type_dam_add_rate", { element_type: "blaze" });

  const resolvedAttrNames: Record<string, string> = {};
  if (attackRes.resolvedAttrName) resolvedAttrNames["attack_type_dam_add_rate"] = attackRes.resolvedAttrName;
  if (elementRes.resolvedAttrName) resolvedAttrNames["element_type_dam_add_rate"] = elementRes.resolvedAttrName;

  const report = resolveBridgeInjections(resolvedAttrNames, stats);
  for (const [leaf, val] of Object.entries(report.injections)) {
    if (val !== 0) rt.setLeafValue(leaf, val);
  }

  rt.update();
  const finalAttack = rt.getTargetValue("final_attack");
  // sum = 0.25 + 0.20 + 0.15 = 0.60, rate = 1.60, final = 160
  assertNear(
    typeof finalAttack === "number" ? finalAttack : -1,
    160,
    "base=100, weapon=0.25 + melee=0.20 + element=0.15 → final_attack=160",
  );
}

// ─── Unmapped Leaves ──────────────────────────────────────────────────────────
console.log("\nUnmapped bridge leaves:");

{
  const unmapped = getUnmappedBridgeLeaves({
    attack_type_dam_add_rate: "attack_type_dam_add_rate_melee",
    gun_type_dam_add_rate: "gun_type_dam_add_rate_rifle",
  });
  assert(unmapped.includes("gun_type_dam_add_rate"), "gun_type_dam_add_rate is unmapped");
  assert(!unmapped.includes("attack_type_dam_add_rate"), "attack_type_dam_add_rate_melee IS mapped");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Stat bridge smoke tests: ${passed}/${passed + failed} passed`);
} else {
  console.error(`Stat bridge smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
