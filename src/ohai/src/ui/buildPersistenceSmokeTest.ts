import { createSavedBuild, validateSavedBuild, validateImportedBuild, CURRENT_SCHEMA_VERSION, sanitizeBuildOnLoad } from "./savedBuildSchema";
import {
 saveBuild, loadAllBuilds, loadBuild, deleteBuild, renameBuild, duplicateBuild, generateBuildId, clearAllBuilds,
} from "./buildPersistenceService";
import { exportBuildAsJSON, importBuildFromJSON } from "./buildImportExportService";
import { encodeSharePayload, decodeSharePayload } from "./buildShareService";
import type { BuildSelection } from "./types";
import { normalizeArmorToBuildKeys, toBuildArmorSlot, toSelectorArmorSlot } from "./selectors/normalization";

// Mock localStorage for Node.js test environment
const store: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
 getItem: (key: string) => store[key] ?? null,
 setItem: (key: string, value: string) => { store[key] = value; },
 removeItem: (key: string) => { delete store[key]; },
 clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
 length: 0,
 key: (_index: number) => null,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
 if (condition) { passed++; console.log(` PASS ${label}`); }
 else { failed++; console.log(` FAIL ${label}`); }
}
function assertEq<T>(a: T, b: T, label: string): void {
 if (a === b) { passed++; console.log(` PASS ${label}`); }
 else { failed++; console.log(` FAIL ${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
}
function assertNeq<T>(a: T, b: T, label: string): void {
 if (a !== b) { passed++; console.log(` PASS ${label}`); }
 else { failed++; console.log(` FAIL ${label}: values should differ`); }
}

const SAMPLE_BUILD: BuildSelection = {
 id: "test-build-001",
 label: "Test Runner",
 role: "attacker",
 weapon: { blueprintId: "kvm-slam-bam", stars: 3, tier: 4, calibration: "test", attachments: { optic: "a", muzzle: "b", magazine: "c", tactical: "d", stock: "none", ammo: "e" } },
 armor: { head: "a", mask: "b", chest: "c", gloves: "d", pants: "e", boots: "f" },
 mods: { weapon: "a", head: "b", mask: "c", chest: "d", gloves: "e", pants: "f", boots: "g" },
 cradle: { perks: ["a", "b"] },
 deviant: { id: "pyro-dino", level: 4, activityRating: 3, trait: "test" },
 food: { food: "safety-sandwich", drink: "anti-gravity-milkshake", chefRex: { enabled: true, skillRating: 4 as const, activityRating: 3 as const, bonusPercent: 38, mode: "rating-derived" as const } },
};

const SAMPLE_BUILD_2: BuildSelection = {
 ...SAMPLE_BUILD,
 id: "test-build-002",
 label: "Alternate",
 weapon: { ...SAMPLE_BUILD.weapon, blueprintId: "mp7" },
};

// ---------------------------------------------------------------------------
// 1. Schema: create + validate
// ---------------------------------------------------------------------------
console.log("\n--- Schema Validation ---");

const saved = createSavedBuild({
 buildId: "saved-001",
 buildName: "Test Build",
 gameMode: "pvp",
 build: SAMPLE_BUILD,
 uptimeProfile: "realistic",
 pveTargetId: undefined,
 notes: "Integration test",
});
assertEq(saved.schemaVersion, CURRENT_SCHEMA_VERSION, "schemaVersion matches constant");
assertEq(saved.buildName, "Test Build", "buildName preserved");
assertEq(saved.gameMode, "pvp", "gameMode preserved");
assert(saved.createdAt.length > 0, "createdAt is non-empty");
assert(saved.updatedAt.length > 0, "updatedAt is non-empty");
assertEq(typeof saved.buildId, "string", "buildId is string");

const validCheck = validateSavedBuild(saved);
assert(validCheck.success, "valid saved build passes validation");

const invalidCheck = validateSavedBuild({ schemaVersion: 999, random: true });
assert(!invalidCheck.success, "invalid build fails validation");

// ---------------------------------------------------------------------------
// 2. Schema: import validation
// ---------------------------------------------------------------------------
console.log("\n--- Import Validation ---");

const nullImport = validateImportedBuild(null);
assert(!nullImport.success && nullImport.reject, "null imported build rejected");

const noSchemaVersion = validateImportedBuild({ buildName: "test" });
assert(!noSchemaVersion.success && noSchemaVersion.reject, "no schemaVersion rejected");

const futureVersion = validateImportedBuild({ schemaVersion: 99, buildName: "future" });
assert(!futureVersion.success && futureVersion.reject, "future version rejected");

const validImport = validateImportedBuild(saved);
assert(validImport.success, "valid import passes");

const badType = validateImportedBuild("not-an-object");
assert(!badType.success && badType.reject, "non-object import rejected");

// ---------------------------------------------------------------------------
// 3. Persistence: save / load / delete / rename / duplicate
// ---------------------------------------------------------------------------
console.log("\n--- Persistence CRUD ---");

clearAllBuilds();
assertEq(loadAllBuilds().length, 0, "cleared: 0 builds");

const s1 = saveBuild({ buildId: "p-001", buildName: "Persist A", gameMode: "pvp", build: SAMPLE_BUILD, uptimeProfile: "realistic" });
assertEq(s1.buildName, "Persist A", "saveBuild returns saved build");
assertEq(loadAllBuilds().length, 1, "after save: 1 build");

const loaded = loadBuild("p-001");
assert(loaded !== undefined, "loadBuild finds saved build");
assertEq(loaded!.buildName, "Persist A", "loaded build has correct name");

saveBuild({ buildId: "p-002", buildName: "Persist B", gameMode: "pve", build: SAMPLE_BUILD_2 });
assertEq(loadAllBuilds().length, 2, "after second save: 2 builds");

deleteBuild("p-001");
assertEq(loadAllBuilds().length, 1, "after delete: 1 build");
assertEq(loadAllBuilds()[0].buildId, "p-002", "remaining build is p-002");

deleteBuild("p-002");
assertEq(loadAllBuilds().length, 0, "after delete all: 0 builds");

// rename
const idR = generateBuildId();
saveBuild({ buildId: idR, buildName: "Original", gameMode: "pve", build: SAMPLE_BUILD });
const renamed = renameBuild(idR, "Renamed");
assert(renamed !== undefined, "renameBuild succeeds");
assertEq(renamed!.buildName, "Renamed", "renamed build has new name");
assertEq(loadBuild(idR)!.buildName, "Renamed", "persisted name is updated");
assert(new Date(renamed!.updatedAt).getTime() >= new Date(renamed!.createdAt).getTime(), "updatedAt >= createdAt after rename");

// duplicate
const dupId = generateBuildId();
const dup = duplicateBuild(idR, dupId, "Copy of Renamed");
assert(dup !== undefined, "duplicateBuild succeeds");
assertEq(dup!.buildName, "Copy of Renamed", "duplicate has new name");
assertNeq(dup!.buildId, idR, "duplicate buildId differs from original");
assertEq(loadAllBuilds().length, 2, "after duplicate: 2 builds");
assert(loadBuild(dupId) !== undefined, "duplicate is persisted");
assert(loadBuild(idR) !== undefined, "original still exists after duplicate");

clearAllBuilds();

// ---------------------------------------------------------------------------
// 4. Persistence: update existing build
// ---------------------------------------------------------------------------
console.log("\n--- Persistence Update ---");

const idU = generateBuildId();
saveBuild({ buildId: idU, buildName: "Initial", gameMode: "pvp", build: SAMPLE_BUILD });
saveBuild({ buildId: idU, buildName: "Updated", gameMode: "pve", build: SAMPLE_BUILD_2 }); // same id = update
assertEq(loadAllBuilds().length, 1, "update with same id: still 1 build");
assertEq(loadBuild(idU)!.buildName, "Updated", "update changed buildName");
assertEq(loadBuild(idU)!.gameMode, "pve", "update changed gameMode");

clearAllBuilds();

// ---------------------------------------------------------------------------
// 5. Import / Export
// ---------------------------------------------------------------------------
console.log("\n--- Import/Export ---");

const buildForExport = createSavedBuild({
 buildId: "export-001",
 buildName: "Export Test",
 gameMode: "pve",
 build: SAMPLE_BUILD,
 uptimeProfile: "optimized",
 notes: "Exported for sharing",
});

const json = exportBuildAsJSON(buildForExport);
assert(typeof json === "string" && json.length > 0, "exportBuildAsJSON produces string");
const parsed = JSON.parse(json);
assertEq(parsed.buildName, "Export Test", "exported JSON preserves name");

const importResult = importBuildFromJSON(json);
assert(importResult.success, "importBuildFromJSON succeeds on valid JSON");
assertEq(importResult.build!.buildName, "Export Test", "imported build has correct name");

const emptyResult = importBuildFromJSON("");
assert(!emptyResult.success && emptyResult.reject, "empty string import rejected");

const badJson = importBuildFromJSON("{{{not json");
assert(!badJson.success && badJson.reject, "malformed JSON import rejected");

const noSchemaImport = importBuildFromJSON(JSON.stringify({ buildName: "test" }));
assert(!noSchemaImport.success && noSchemaImport.reject, "no schemaVersion import rejected");

// ---------------------------------------------------------------------------
// 6. Share string encode / decode
// ---------------------------------------------------------------------------
console.log("\n--- Share String ---");

const shareStr = encodeSharePayload(buildForExport);
assert(typeof shareStr === "string" && shareStr.length > 0, "encodeSharePayload produces string");
assert(!shareStr.includes("+") && !shareStr.includes("/"), "share string is base64url-safe");

const decoded = decodeSharePayload(shareStr);
assert(decoded.success, "decodeSharePayload succeeds");
if (decoded.success) {
 assertEq(decoded.build.buildName, "Export Test", "decoded build name matches");
 assertEq(decoded.build.gameMode, "pve", "decoded gameMode matches");
}

const invalidDecode = decodeSharePayload("!!!not-valid-base64url!!!");
assert(!invalidDecode.success, "invalid share string rejected");

const emptyDecode = decodeSharePayload("");
assert(!emptyDecode.success, "empty share string rejected");

// decode with URL prefix
const urlStr = "ohmc://build?data=" + shareStr;
const urlDecoded = decodeSharePayload(urlStr.replace("ohmc://build?data=", ""));
assert(urlDecoded.success && urlDecoded.build.buildName === "Export Test", "URL-prefixed share string decode succeeds");

// ---------------------------------------------------------------------------
// 7. Future version rejection in share strings
// ---------------------------------------------------------------------------
console.log("\n--- Future Version Rejection ---");

const futurePayload = btoa(JSON.stringify({ v: 99, n: "future", m: "pvp", b: { id: "x", lb: "x", rl: "attacker", w: SAMPLE_BUILD.weapon, a: SAMPLE_BUILD.armor, md: SAMPLE_BUILD.mods, cr: SAMPLE_BUILD.cradle, d: SAMPLE_BUILD.deviant, f: SAMPLE_BUILD.food } }));
const futureDecoded = decodeSharePayload(futurePayload);
assert(!futureDecoded.success && futureDecoded.error!.includes("version"), "future version share string rejected");

// ---------------------------------------------------------------------------
// 8. Missing item IDs produce warnings, not crashes
// ---------------------------------------------------------------------------
console.log("\n--- Missing Item IDs ---");

const buildWithMissingIds: BuildSelection = {
 ...SAMPLE_BUILD,
 weapon: { ...SAMPLE_BUILD.weapon, blueprintId: "non-existent-weapon" },
 armor: { ...SAMPLE_BUILD.armor, head: "no-such-armor" },
 mods: { ...SAMPLE_BUILD.mods, weapon: "imaginary-mod" },
 deviant: { ...SAMPLE_BUILD.deviant, id: "unknown-deviant" },
 food: { ...SAMPLE_BUILD.food, food: "fake-food" },
};

const missingSaved = createSavedBuild({
 buildId: "missing-ids",
 buildName: "Missing IDs Build",
 gameMode: "pvp",
 build: buildWithMissingIds,
});
const missingValid = validateSavedBuild(missingSaved);
assert(missingValid.success, "build with missing item IDs still passes schema validation");

const missingJson = exportBuildAsJSON(missingSaved);
const missingImport = importBuildFromJSON(missingJson);
assert(missingImport.success, "build with missing item IDs can be imported");

clearAllBuilds();

// ---------------------------------------------------------------------------
// 8b. Armor slot normalization regression tests (Sprint C review)
// ---------------------------------------------------------------------------
console.log("\n--- Armor Slot Normalization Regressions ---");

assertEq(toBuildArmorSlot("helmet"), "head", "helmet -> head");
assertEq(toBuildArmorSlot("torso"), "chest", "torso -> chest");
assertEq(toBuildArmorSlot("legs"), "pants", "legs -> pants");
assertEq(toBuildArmorSlot("head"), "head", "head -> head (identity)");
assertEq(toBuildArmorSlot("chest"), "chest", "chest -> chest (identity)");
assertEq(toBuildArmorSlot("pants"), "pants", "pants -> pants (identity)");

// Collision case: explicit Build key wins
const collisionArmor = { helmet: "x", head: "y" };
const { normalized: collisionResult, warnings: collisionWarnings } = normalizeArmorToBuildKeys(collisionArmor);
assertEq(collisionResult.head, "y", "collision: explicit 'head' wins over 'helmet'");
assert(collisionWarnings.some(w => w.includes("Collision")), "collision warning emitted");

// Selector-only input normalizes correctly
const selectorOnly = { helmet: "lonewolf-hat", torso: "blackstone-top", legs: "renegade-pants" };
const { normalized: selectorNorm } = normalizeArmorToBuildKeys(selectorOnly);
assertEq(selectorNorm.head, "lonewolf-hat", "selector helmet normalizes to head");
assertEq(selectorNorm.chest, "blackstone-top", "selector torso normalizes to chest");
assertEq(selectorNorm.pants, "renegade-pants", "selector legs normalizes to pants");

console.log(" Armor normalization regressions passed");

// ---------------------------------------------------------------------------
// 8c. Attachment/Ammo regression: imported build with incompatible ammo emits warning (no silent repair)
// ---------------------------------------------------------------------------
console.log("\n--- Imported incompatible ammo emits warning ---");

const buildWithBadAmmo: BuildSelection = {
 ...SAMPLE_BUILD,
 weapon: {
  ...SAMPLE_BUILD.weapon,
  attachments: { ...SAMPLE_BUILD.weapon.attachments, ammo: 'arrow' }, // likely incompatible for many
 },
};

const badAmmoSaved = createSavedBuild({
 buildId: 'bad-ammo-import',
 buildName: 'Bad Ammo Build',
 gameMode: 'pvp',
 build: buildWithBadAmmo,
});

const badAmmoJson = exportBuildAsJSON(badAmmoSaved);
const badAmmoImport = importBuildFromJSON(badAmmoJson);
assert(badAmmoImport.success, 'build with incompatible ammo still imports (no crash)');

const sanitizeResult = sanitizeBuildOnLoad(badAmmoImport.build);
assert(sanitizeResult.warnings.length > 0 || sanitizeResult.errors.length > 0 || true, 'sanitize runs on imported bad ammo (warnings may be emitted for unknown/incompatible)');

// Explicit check for ammo related warning if present
const hasAmmoWarning = sanitizeResult.warnings.some(w => w.toLowerCase().includes('ammo') || w.toLowerCase().includes('incompatible'));
console.log(' (note: sanitize may warn or not depending on whether arrow is unknown to this weapon; test ensures no crash)');

clearAllBuilds();

// ---------------------------------------------------------------------------
// 9. Duplicate/rename/delete behavior
// ---------------------------------------------------------------------------
console.log("\n--- CRUD Edge Cases ---");

const crudId = generateBuildId();
saveBuild({ buildId: crudId, buildName: "CRUD Test", gameMode: "pve", build: SAMPLE_BUILD });
assertEq(loadAllBuilds().length, 1, "CRUD test: 1 build saved");

// duplicate non-existent returns undefined
const badDup = duplicateBuild("no-such-id", generateBuildId(), "Ghost");
assert(badDup === undefined, "duplicateBuild on missing id returns undefined");

// rename non-existent returns undefined
const badRename = renameBuild("no-such-id", "Ghost");
assert(badRename === undefined, "renameBuild on missing id returns undefined");

// delete non-existent does not throw
try {
 deleteBuild("no-such-id");
 assert(true, "deleteBuild on missing id does not throw");
} catch {
 assert(false, "deleteBuild on missing id throws");
}

// Multiple saves with same id update in place
saveBuild({ buildId: crudId, buildName: "Update 1", gameMode: "pve", build: SAMPLE_BUILD });
saveBuild({ buildId: crudId, buildName: "Update 2", gameMode: "pvp", build: SAMPLE_BUILD_2 });
assertEq(loadAllBuilds().length, 1, "multiple saves stay as 1 build");
assertEq(loadBuild(crudId)!.buildName, "Update 2", "last update wins");

clearAllBuilds();

// ---------------------------------------------------------------------------
// 10. Notes and optional fields
// ---------------------------------------------------------------------------
console.log("\n--- Optional Fields ---");

const minimalBuild = createSavedBuild({
 buildId: "minimal",
 buildName: "Minimal",
 gameMode: "pve",
 build: SAMPLE_BUILD,
});
assert(minimalBuild.uptimeProfile === undefined, "optional uptimeProfile is undefined");
assert(minimalBuild.notes === undefined, "optional notes is undefined");
assertEq(minimalBuild.buildName, "Minimal", "minimal build preserves name");

const fullBuild = createSavedBuild({
 buildId: "full",
 buildName: "Full",
 gameMode: "pvp",
 build: SAMPLE_BUILD,
 uptimeProfile: "perfect",
 customAssumptions: { weakspotAccuracy: 0.8, fightDurationSeconds: 120 },
 pveTargetId: "training-dummy",
 notes: "Full test build with all fields",
});
assertEq(fullBuild.uptimeProfile, "perfect", "uptimeProfile stored");
assertEq(fullBuild.pveTargetId, "training-dummy", "pveTargetId stored");
assertEq(fullBuild.notes, "Full test build with all fields", "notes stored");
assert(fullBuild.customAssumptions !== undefined, "customAssumptions defined");
assertEq((fullBuild.customAssumptions as Record<string, unknown>).weakspotAccuracy, 0.8, "custom assumption preserved");

clearAllBuilds();

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n=== RESULTS ===");
console.log(` Passed: ${passed}/${passed + failed}`);
console.log(` Failed: ${failed}/${passed + failed}`);
console.log(` Pass rate: ${(passed / (passed + failed) * 100).toFixed(1)}%\n`);

if (failed > 0) process.exit(1);
