/**
 * Smoke test for official formula tag-table resolver mappings.
 *
 * Validates:
 *   1. Attack type tag table resolves all FormulaAttackType enum values
 *   2. Element type tag table resolves fire/ice/lightning/physics
 *   3. Keyword type tag table resolves known keywords (LOW confidence)
 *   4. Gun type tag table returns unresolved for all inputs (no data recovered)
 *   5. Branch selector → FormulaAttackType mapping works
 *   6. Case-insensitive tag matching works
 *   7. Unknown tags return missingReason
 */

import {
  ATTACK_TYPE_TAG_TABLE,
  ELEMENT_TYPE_TAG_TABLE,
  KEYWORD_TYPE_TAG_TABLE,
  GUN_TYPE_TAG_TABLE,
  resolveAttackTypeTag,
  resolveElementTypeTag,
  resolveKeywordTypeTag,
  resolveGunTypeTag,
  getDamageFormulaBranchToFormulaAttackType,
  getAllTagTableEntries,
} from "./officialFormulaTagTables";

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

console.log("\n=== Official Formula Tag-Table Resolver Smoke Test ===\n");

// ─── Attack Type Tag Table ────────────────────────────────────────────────────
console.log("Attack type tag table:");

assert(ATTACK_TYPE_TAG_TABLE.confidence === "high", "attack type table confidence = high");
assert(ATTACK_TYPE_TAG_TABLE.entries.length === 8, "attack type table has 8 entries (0-7)");

{
  const r = resolveAttackTypeTag("attack_type_dam_add_rate", 1);
  assert(r.resolved === true, "attack_type=1 (Melee) resolves");
  assert(r.attrName === "attack_type_dam_add_rate_melee", "Melee → attack_type_dam_add_rate_melee");
  assert(r.confidence === "high", "Melee resolution confidence = high");
}
{
  const r = resolveAttackTypeTag("attack_type_dam_add_rate", 2);
  assert(r.resolved === true, "attack_type=2 (Remote) resolves");
  assert(r.attrName === "attack_type_dam_add_rate_remote", "Remote → attack_type_dam_add_rate_remote");
}
{
  const r = resolveAttackTypeTag("attack_type_dam_add_rate", 4);
  assert(r.resolved === true, "attack_type=4 (Dot) resolves");
  assert(r.attrName === "attack_type_dam_add_rate_dot", "Dot → attack_type_dam_add_rate_dot");
}
{
  const r = resolveAttackTypeTag("attack_type_dam_add_rate", 5);
  assert(r.resolved === true, "attack_type=5 (Skill) resolves");
  assert(r.attrName === "attack_type_dam_add_rate_skill", "Skill → attack_type_dam_add_rate_skill");
}
{
  const r = resolveAttackTypeTag("attack_type_dam_add_rate", 7);
  assert(r.resolved === true, "attack_type=7 (Facility) resolves");
  assert(r.attrName === "attack_type_dam_add_rate_facility", "Facility → attack_type_dam_add_rate_facility");
}
{
  const r = resolveAttackTypeTag("attack_type_crit_enable", 1);
  assert(r.resolved === true, "attack_type_crit_enable with Melee resolves");
  assert(r.attrName === "attack_type_crit_enable_melee", "Melee → attack_type_crit_enable_melee");
}
{
  const r = resolveAttackTypeTag("attack_type_dam_add_rate", 99);
  assert(r.resolved === false, "attack_type=99 does not resolve");
  assert(typeof r.missingReason === "string", "unknown attack_type has missingReason");
}

// ─── Element Type Tag Table ───────────────────────────────────────────────────
console.log("\nElement type tag table:");

assert(ELEMENT_TYPE_TAG_TABLE.confidence === "high", "element type table confidence = high");

{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "fire");
  assert(r.resolved === true, "element_type=fire resolves");
  assert(r.attrName === "element_type_dam_add_rate_fire", "fire → element_type_dam_add_rate_fire");
  assert(r.confidence === "high", "fire resolution confidence = high");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "ice");
  assert(r.resolved === true, "element_type=ice resolves");
  assert(r.attrName === "element_type_dam_add_rate_ice", "ice → element_type_dam_add_rate_ice");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "lightning");
  assert(r.resolved === true, "element_type=lightning resolves");
  assert(r.attrName === "element_type_dam_add_rate_lightning", "lightning → element_type_dam_add_rate_lightning");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "physics");
  assert(r.resolved === true, "element_type=physics resolves");
  assert(r.attrName === "element_type_dam_add_rate_physics", "physics → element_type_dam_add_rate_physics");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "blaze");
  assert(r.resolved === true, "element_type=blaze (OHAI alias) resolves");
  assert(r.attrName === "element_type_dam_add_rate_fire", "blaze → element_type_dam_add_rate_fire");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "frost");
  assert(r.resolved === true, "element_type=frost (OHAI alias) resolves");
  assert(r.attrName === "element_type_dam_add_rate_ice", "frost → element_type_dam_add_rate_ice");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "shock");
  assert(r.resolved === true, "element_type=shock (OHAI alias) resolves");
  assert(r.attrName === "element_type_dam_add_rate_lightning", "shock → element_type_dam_add_rate_lightning");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "physical");
  assert(r.resolved === true, "element_type=physical (OHAI alias) resolves");
  assert(r.attrName === "element_type_dam_add_rate_physics", "physical → element_type_dam_add_rate_physics");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "void");
  assert(r.resolved === false, "element_type=void does not resolve");
  assert(typeof r.missingReason === "string", "unknown element_type has missingReason");
}

// ─── Keyword Type Tag Table ───────────────────────────────────────────────────
console.log("\nKeyword type tag table:");

assert(KEYWORD_TYPE_TAG_TABLE.confidence === "high", "keyword type table confidence = high (recovered from char_property_data)");

{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "SCORCH");
  assert(r.resolved === true, "keyword_type=SCORCH resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_scorch", "SCORCH → keyword_proc_dam_add_rate_scorch");
  assert(r.confidence === "high", "SCORCH resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "VORTEX");
  assert(r.resolved === true, "keyword_type=VORTEX resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_vortex", "VORTEX → keyword_proc_dam_add_rate_vortex");
  assert(r.confidence === "high", "VORTEX resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "SURGE");
  assert(r.resolved === true, "keyword_type=SURGE resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_surge", "SURGE → keyword_proc_dam_add_rate_surge");
  assert(r.confidence === "high", "SURGE resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "BLAST");
  assert(r.resolved === true, "keyword_type=BLAST resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_blast", "BLAST → keyword_proc_dam_add_rate_blast");
  assert(r.confidence === "high", "BLAST resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "SHRAP");
  assert(r.resolved === true, "keyword_type=SHRAP resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_shrap", "SHRAP → keyword_proc_dam_add_rate_shrap");
  assert(r.confidence === "high", "SHRAP resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "PROJ");
  assert(r.resolved === true, "keyword_type=PROJ resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_proj", "PROJ → keyword_proc_dam_add_rate_proj");
  assert(r.confidence === "high", "PROJ resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "BLEEDING");
  assert(r.resolved === true, "keyword_type=BLEEDING resolves");
  assert(r.attrName === "keyword_proc_dam_add_rate_bleeding", "BLEEDING → keyword_proc_dam_add_rate_bleeding");
  assert(r.confidence === "high", "BLEEDING resolution confidence = high (from game data)");
}
{
  const r = resolveKeywordTypeTag("keyword_proc_dam_add_rate", "UNKNOWN_KEYWORD");
  assert(r.resolved === false, "unknown keyword does not resolve");
  assert(typeof r.missingReason === "string", "unknown keyword has missingReason");
}

// ─── Gun Type Tag Table ───────────────────────────────────────────────────────
console.log("\nGun type tag table:");

assert(GUN_TYPE_TAG_TABLE.confidence === "low", "gun type table confidence = low (not recovered)");
assert(GUN_TYPE_TAG_TABLE.entries.length === 0, "gun type table has 0 entries (no data recovered)");

{
  const r = resolveGunTypeTag("gun_type_dam_add_rate", "rifle");
  assert(r.resolved === false, "gun_type=rifle does not resolve (no data)");
  assert(typeof r.missingReason === "string", "gun_type has missingReason");
}

// ─── Branch Selector Mapping ──────────────────────────────────────────────────
console.log("\nDamage formula branch → FormulaAttackType mapping:");

assert(getDamageFormulaBranchToFormulaAttackType(1) === 1, "branch 1 (Melee) → enum 1 (Melee)");
assert(getDamageFormulaBranchToFormulaAttackType(2) === 4, "branch 2 (Buff) → enum 4 (Dot)");
assert(getDamageFormulaBranchToFormulaAttackType(3) === 5, "branch 3 (Skill) → enum 5 (Skill)");
assert(getDamageFormulaBranchToFormulaAttackType(4) === 6, "branch 4 (Item) → enum 6 (Item)");
assert(getDamageFormulaBranchToFormulaAttackType(8) === 2, "branch 8 (Remote) → enum 2 (Remote)");
assert(getDamageFormulaBranchToFormulaAttackType(99) === undefined, "branch 99 → undefined");

// ─── Case-Insensitive Matching ────────────────────────────────────────────────
console.log("\nCase-insensitive tag matching:");

{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "FIRE");
  assert(r.resolved === true, "FIRE (uppercase) resolves via case-insensitive match");
  assert(r.attrName === "element_type_dam_add_rate_fire", "FIRE → element_type_dam_add_rate_fire");
}
{
  const r = resolveElementTypeTag("element_type_dam_add_rate", "Blaze");
  assert(r.resolved === true, "Blaze (mixed case) resolves via case-insensitive match");
  assert(r.attrName === "element_type_dam_add_rate_fire", "Blaze → element_type_dam_add_rate_fire");
}

// ─── All Entries Enumeration ──────────────────────────────────────────────────
console.log("\nAll tag table entries:");

{
  const all = getAllTagTableEntries();
  assert(all.length > 0, `getAllTagTableEntries returns ${all.length} entries`);
  assert(all.some((e) => e.entry.suffix === "melee"), "includes melee entry");
  assert(all.some((e) => e.entry.suffix === "fire"), "includes fire entry");
  assert(all.some((e) => e.entry.suffix === "scorch"), "includes scorch entry");
  assert(all.some((e) => e.entry.suffix === "combo"), "includes combo entry (melee_type)");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`Tag-table smoke tests: ${passed}/${passed + failed} passed`);
} else {
  console.error(`Tag-table smoke tests: ${passed}/${passed + failed} passed — ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60) + "\n");
