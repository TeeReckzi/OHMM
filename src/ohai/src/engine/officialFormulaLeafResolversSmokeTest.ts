/**
 * Phase 6 smoke test — dynamic leaf resolver registry.
 */

import {
  resolveDynamicLeaf,
  getDynamicLeafResolver,
  getAllDynamicLeafNames,
  getUnresolvedDynamicLeaves,
} from "./officialFormulaLeafResolvers";

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

console.log("\n=== Phase 6 Dynamic Leaf Resolver Smoke Test ===\n");

// --- All expected resolvers registered ---
console.log("Registry completeness:");
const allNames = getAllDynamicLeafNames();
const EXPECTED = [
  "keyword_proc_dam_add_rate",
  "gun_type_dam_add_rate",
  "element_type_dam_add_rate",
  "attack_type_dam_add_rate",
  "element_type_index_struct_type_dam_rate",
  "element_type_index_armor_type_dam_rate",
  "pvp_adjust_factor",
  "special_regulate_factor",
  "defined_fixed_crit",
  "species_dam_add_rate",
  "human_dam_add_rate",
  "debuff_type_dam_add_rate",
];
for (const name of EXPECTED) {
  assert(allNames.includes(name), `"${name}" registered`);
}

// --- Required context keys ---
console.log("\nRequired context keys:");
assert(
  getDynamicLeafResolver("keyword_proc_dam_add_rate")?.requiredContextKeys.includes("keyword_type") ?? false,
  "keyword_proc_dam_add_rate requires keyword_type"
);
assert(
  getDynamicLeafResolver("attack_type_dam_add_rate")?.requiredContextKeys.includes("formula_attack_type") ?? false,
  "attack_type_dam_add_rate requires formula_attack_type"
);
assert(
  (getDynamicLeafResolver("element_type_index_struct_type_dam_rate")?.requiredContextKeys.length ?? 0) === 2,
  "element_type_index_struct_type_dam_rate requires 2 context keys"
);
assert(
  (getDynamicLeafResolver("pvp_adjust_factor")?.requiredContextKeys.length ?? -1) === 0,
  "pvp_adjust_factor has no required context keys"
);
assert(
  getDynamicLeafResolver("species_dam_add_rate")?.requiredContextKeys.includes("species_type") ?? false,
  "species_dam_add_rate requires species_type"
);
assert(
  getDynamicLeafResolver("debuff_type_dam_add_rate")?.requiredContextKeys.includes("target_all_debuff_state") ?? false,
  "debuff_type_dam_add_rate requires target_all_debuff_state"
);
assert(
  (getDynamicLeafResolver("human_dam_add_rate")?.requiredContextKeys.length ?? -1) === 0,
  "human_dam_add_rate has no required context keys"
);

// --- Missing context returns missingReason ---
console.log("\nMissing context returns missingReason:");
{
  const r = resolveDynamicLeaf("keyword_proc_dam_add_rate", {});
  assert(typeof r.missingReason === "string", "keyword_proc_dam_add_rate missing context -> missingReason set");
  assert(r.confidence === "low", "missing context -> confidence=low");
}
{
  const r = resolveDynamicLeaf("element_type_index_armor_type_dam_rate", { element_type: "fire" });
  assert(typeof r.missingReason === "string", "partial context -> missingReason set");
}
{
  const r = resolveDynamicLeaf("species_dam_add_rate", {});
  assert(typeof r.missingReason === "string", "species_dam_add_rate missing species_type -> missingReason set");
  assert(r.confidence === "low", "missing context species_dam_add_rate -> confidence=low");
  assert(r.value === 0, "species_dam_add_rate missing context -> placeholder value=0");
}
{
  const r = resolveDynamicLeaf("debuff_type_dam_add_rate", {});
  assert(typeof r.missingReason === "string", "debuff_type_dam_add_rate missing target_all_debuff_state -> missingReason set");
  assert(r.confidence === "low", "missing context debuff_type_dam_add_rate -> confidence=low");
  assert(r.value === 0, "debuff_type_dam_add_rate missing context -> placeholder value=0");
}

// --- Tag table missing returns missingReason (with full context) ---
console.log("\nTag table missing returns missingReason:");
{
  const r = resolveDynamicLeaf("keyword_proc_dam_add_rate", { keyword_type: "SCORCH" });
  assert(typeof r.missingReason === "string", "tag table missing -> missingReason set even with full context");
}
{
  const r = resolveDynamicLeaf("gun_type_dam_add_rate", { gun_type: "rifle" });
  assert(typeof r.missingReason === "string", "gun_type tag table missing -> missingReason");
}
{
  const r = resolveDynamicLeaf("species_dam_add_rate", { species_type: "Machina" });
  assert(typeof r.missingReason === "string", "species_dam_add_rate with species_type still has missingReason (numeric value not sourced)");
  assert(r.confidence === "high", "species_dam_add_rate full context -> confidence=high (tag table recovered)");
  assert(r.value === 0, "species_dam_add_rate with context -> placeholder value=0");
}
{
  const r = resolveDynamicLeaf("debuff_type_dam_add_rate", { target_all_debuff_state: "scorch" });
  assert(typeof r.missingReason === "string", "debuff_type_dam_add_rate with target_all_debuff_state still has missingReason (numeric value not sourced)");
  assert(r.confidence === "high", "debuff_type_dam_add_rate full context -> confidence=high (tag table recovered)");
  assert(r.value === 0, "debuff_type_dam_add_rate with context -> placeholder value=0");
}
{
  const r = resolveDynamicLeaf("human_dam_add_rate", {});
  assert(typeof r.missingReason === "string", "human_dam_add_rate has missingReason (no evidence/tag table)");
  assert(r.confidence === "low", "human_dam_add_rate -> confidence=low");
  assert(r.value === 0, "human_dam_add_rate no tag table -> placeholder value=0");
}

// --- Unknown leaf returns missingReason ---
console.log("\nUnknown leaf:");
{
  const r = resolveDynamicLeaf("totally_unknown_leaf", {});
  assert(typeof r.missingReason === "string", "unknown leaf -> missingReason");
  assert(r.confidence === "low", "unknown leaf -> confidence=low");
}

// --- pvp_adjust_factor has a value but still has missingReason (context-dependent) ---
console.log("\npvp_adjust_factor partial resolution:");
{
  const r = resolveDynamicLeaf("pvp_adjust_factor", {});
  assert(r.value === 1, "pvp_adjust_factor default value = 1");
  assert(typeof r.missingReason === "string", "pvp_adjust_factor has missingReason explaining context-dependency");
}

// --- Direct value override wins ---
console.log("\nDirect value override wins:");
{
  const unresolved = getUnresolvedDynamicLeaves(
    ["keyword_proc_dam_add_rate", "pvp_adjust_factor"],
    {},
    { keyword_proc_dam_add_rate: 1.3 }
  );
  const names = unresolved.map((r) => r.leafName);
  assert(!names.includes("keyword_proc_dam_add_rate"),
    "keyword_proc_dam_add_rate excluded when override provided");
}

// --- getUnresolvedDynamicLeaves lists unresolved clearly ---
console.log("\ngetUnresolvedDynamicLeaves:");
{
  const unresolved = getUnresolvedDynamicLeaves(
    ["attack_type_dam_add_rate", "element_type_dam_add_rate"],
    { formula_attack_type: 3 }
  );
  assert(unresolved.length > 0, "returns unresolved entries");
  for (const r of unresolved) {
    assert(typeof r.missingReason === "string", `${r.leafName} has missingReason`);
  }
}

// --- element_type_index needs both keys ---
console.log("\nelement_type_index two-key resolvers:");
{
  const r1 = resolveDynamicLeaf("element_type_index_struct_type_dam_rate", { element_type: "fire" });
  assert(typeof r1.missingReason === "string", "struct_type resolver: missing damage_material_type -> missingReason");
}
{
  const r2 = resolveDynamicLeaf("element_type_index_armor_type_dam_rate", { armor_type: "light" });
  assert(typeof r2.missingReason === "string", "armor_type resolver: missing element_type -> missingReason");
}

// ─── Phase 3 leaf: species_dam_add_rate ──────────────────────────────────────
console.log("\nPhase 3 leaf: species_dam_add_rate:");
{
  const r = resolveDynamicLeaf("species_dam_add_rate", {});
  assert(r.value === 0, "species_dam_add_rate: absent context -> value=0 (placeholder)");
  assert(typeof r.missingReason === "string", "species_dam_add_rate: absent context -> missingReason explains default");
  assert(r.missingReason!.includes("species_type"), "species_dam_add_rate: missingReason mentions species_type");
  assert(r.confidence === "low", "species_dam_add_rate: absent context -> confidence=low");
}
{
  const r = resolveDynamicLeaf("species_dam_add_rate", { species_type: "Machina" });
  assert(r.value === 0, "species_dam_add_rate: context present -> value=0 (placeholder)");
  assert(typeof r.missingReason === "string", "species_dam_add_rate: context present -> missingReason explains numeric gap");
  assert(r.confidence === "high", "species_dam_add_rate: context present -> confidence=high (tag table recovered)");
}
{
  const r = resolveDynamicLeaf("species_dam_add_rate", { species_dam_add_rate: 0.10 });
  assert(r.value === 0.10, "species_dam_add_rate: direct override 0.10 -> value=0.10");
  assert(typeof r.missingReason === "string", "species_dam_add_rate: direct override -> missingReason notes LOW confidence");
  assert(r.confidence === "low", "species_dam_add_rate: direct override -> confidence=low (numeric value not yet sourced)");
}

// ─── Phase 3 leaf: human_dam_add_rate ────────────────────────────────────────
console.log("\nPhase 3 leaf: human_dam_add_rate:");
{
  const r = resolveDynamicLeaf("human_dam_add_rate", {});
  assert(r.value === 0, "human_dam_add_rate: no context -> value=0 (placeholder)");
  assert(typeof r.missingReason === "string", "human_dam_add_rate: no context -> missingReason explains default");
  assert(r.missingReason!.includes("NOT FOUND"), "human_dam_add_rate: missingReason mentions NOT FOUND in game source");
  assert(r.confidence === "low", "human_dam_add_rate: no context -> confidence=low");
}
{
  const r = resolveDynamicLeaf("human_dam_add_rate", { human_dam_add_rate: 0.15 });
  assert(r.value === 0.15, "human_dam_add_rate: direct override 0.15 -> value=0.15");
  assert(typeof r.missingReason === "string", "human_dam_add_rate: direct override -> missingReason notes LOW confidence");
  assert(r.confidence === "low", "human_dam_add_rate: direct override -> confidence=low (no evidence)");
}
{
  const unresolved = getUnresolvedDynamicLeaves(
    ["human_dam_add_rate"],
    {},
    { human_dam_add_rate: 1.20 }
  );
  assert(!unresolved.some((u) => u.leafName === "human_dam_add_rate"),
    "human_dam_add_rate excluded from unresolved when override provided");
}

// ─── Phase 3 leaf: debuff_type_dam_add_rate ──────────────────────────────────
console.log("\nPhase 3 leaf: debuff_type_dam_add_rate:");
{
  const r = resolveDynamicLeaf("debuff_type_dam_add_rate", {});
  assert(r.value === 0, "debuff_type_dam_add_rate: absent context -> value=0 (placeholder)");
  assert(typeof r.missingReason === "string", "debuff_type_dam_add_rate: absent context -> missingReason explains default");
  assert(r.missingReason!.includes("target_all_debuff_state"), "debuff_type_dam_add_rate: missingReason mentions target_all_debuff_state");
  assert(r.confidence === "low", "debuff_type_dam_add_rate: absent context -> confidence=low");
}
{
  const r = resolveDynamicLeaf("debuff_type_dam_add_rate", { target_all_debuff_state: "scorch" });
  assert(r.value === 0, "debuff_type_dam_add_rate: context present -> value=0 (placeholder)");
  assert(typeof r.missingReason === "string", "debuff_type_dam_add_rate: context present -> missingReason explains numeric gap");
  assert(r.confidence === "high", "debuff_type_dam_add_rate: context present -> confidence=high (tag table recovered)");
}
{
  const r = resolveDynamicLeaf("debuff_type_dam_add_rate", { debuff_type_dam_add_rate: 0.25 });
  assert(r.value === 0.25, "debuff_type_dam_add_rate: direct override 0.25 -> value=0.25");
  assert(typeof r.missingReason === "string", "debuff_type_dam_add_rate: direct override -> missingReason notes LOW confidence");
  assert(r.confidence === "low", "debuff_type_dam_add_rate: direct override -> confidence=low (numeric value not yet sourced)");
}

// ─── Phase 3 leaves: confidence metadata preserved ───────────────────────────
console.log("\nPhase 3 leaves: confidence metadata preserved:");
{
  const leaves = ["species_dam_add_rate", "human_dam_add_rate", "debuff_type_dam_add_rate"];
  for (const name of leaves) {
    const r = resolveDynamicLeaf(name, {});
    assert(r.confidence === "low", `${name}: confidence is "low" (no numeric value sourced)`);
    assert(typeof r.missingReason === "string" && r.missingReason.length > 0,
      `${name}: missingReason is non-empty (preserves gap metadata)`);
    assert(r.leafName === name, `${name}: leafName preserved in resolution`);
  }
}
{
  const unresolved = getUnresolvedDynamicLeaves(
    ["species_dam_add_rate", "human_dam_add_rate", "debuff_type_dam_add_rate"],
    {}
  );
  assert(unresolved.length === 3,
    "all 3 Phase 3 leaves appear as unresolved when no override provided (missingReason set)");
}

console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Phase 6 smoke tests: ${passed}/${passed + failed} passed ✓`);
} else {
  console.error(`Phase 6 smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
