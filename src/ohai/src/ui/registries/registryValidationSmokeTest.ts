import { weaponRegistry } from "./weaponRegistry";
import { armorRegistry, keyGearRegistry } from "./armorRegistry";
import { modRegistry } from "./modRegistry";
import { foodBuffRegistry } from "./foodBuffRegistry";
import { deviationRegistry } from "./deviationRegistry";
import { cradleRegistry } from "./cradleRegistry";
import { pveTargetRegistry } from "./pveTargetRegistry";
import type {
 AnyCanonicalItem,
 BaseCanonicalItem,
 ConfidenceLevel,
 StatModifier,
} from "../itemTypes";
import { allRegistryMeta } from "./registryMeta";
import { runRegistryAudit } from "./registryAudit";

const PLACEHOLDER_WORDS = /\b(placeholder|pending|tbd|to be done|not yet|not extracted)\b/i;

const REQUIRED_FIELDS: (keyof BaseCanonicalItem)[] = [
 "id", "name", "category", "confidence", "needsReview",
];

const KNOWN_STAT_KEYS = new Set([
 "weaponDMG", "weaponDMGBonus", "weaponDMGFlat", "meleeDMG", "meleeDMGFlat", "meleeDMGBonus",
 "statusDMG", "statusDMGBonus", "elementalDMG", "elementalDMGBonus",
 "burnDMG", "burnDMGBonus", "burnCurrentStacks", "burnTickFrequencyBonus", "flatBurnBonus",
 "humanDamageBonus", "dotResistanceReduction", "burnResistanceDebuffLevel",
 "powerSurgeDMG", "powerSurgeDMGBonus", "frostVortexDMG", "frostVortexDMGBonus",
 "bounceDMG", "bounceDMGBonus", "shrapnelDMG", "shrapnelDMGBonus", "shrapnelCritDMGBonus",
 "fastGunnerDMG", "fastGunnerDMGBonus", "unstableBomberDMG", "unstableBomberDMGBonus", "bullseyeDMG",
 "deviationSkillDMG", "foodBonusPercent",
 "critRate", "critDMG", "weakspotDMG",
 "fireRate", "reloadSpeed", "reloadEfficiency", "magazineCapacity",
 "psiIntensity", "superAnomalyStrength",
 "maxHP", "hpRecovery", "shield", "shieldStrength",
 "dmgReduction", "playerDMGReduction", "weaponDMGReduction",
 "statusDMGReduction",
 "weakspotDMGReduction", "critDMGReduction", "deviantDMGReduction",
 "healingReceived", "movementSpeed", "movementSpeedBonus", "stamina", "resistances",
 "medicineSpeedBonus", "medicineEffectBonus",
 "gatheringYield", "miningYield", "loggingYield", "fishingYield",
 "craftingEfficiency", "foodDuration", "deviationSupport",
 "weaponVulnerability", "statusVulnerability",
 "enemyTypeDMGBonus", "keywordSuffixDMGBonus", "attackPercent",
 "range", "accuracy", "stability", "mobility", "aimSpeed", "hitShakeResistance",
]);

const LOW_CONFIDENCE: ConfidenceLevel[] = ["estimated", "experimental", "placeholder"];

const FORBIDDEN_WEAPON_NAMES = [
 "Space-Time SMG",
 "Memento Mystery",
 "KVM Slam Bam",
 "OIC-8 - Last Carnival",
 "SCAR",
 "SOCR - Sand Dancer",
 "Ultra Force",
 "XM8",
 "Aurora Fort",
 "BAR",
 "RPD",
 "DE.50 - Goshawk",
 "G17 - Cash Only",
 "R500 - Interfade",
 "DBSG - Format",
 "DP12",
 "DBSG - Dual Fury",
 "Dual Fury",
 "DBSG - Old Huntsman",
 "Morgan",
 "Old Huntsman",
 "MPS7 - Chaos Domain",
 "MPS7 - Focus",
 "MPS7 - Urban Ninja",
 "Star Vortex",
 "AWM",
];

function normalizedLookupKey(value: string): string {
 return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const forbiddenWeaponLookupKeys = new Set(FORBIDDEN_WEAPON_NAMES.map(normalizedLookupKey));

interface RegistryTestResult {
 registryName: string;
 pass: boolean;
 tests: { desc: string; pass: boolean; detail?: string }[];
}

let passCount = 0;
let totalTests = 0;

function check(desc: string, ok: boolean, detail?: string): void {
 totalTests++;
 if (ok) passCount++;
 console.log(` ${ok ? "PASS" : "FAIL"} ${desc}`);
 if (!ok && detail) console.log(`    ${detail}`);
}

function describe(registryName: string, items: AnyCanonicalItem[]): void {
 console.log(`\n--- ${registryName} ---`);

 const ids = items.map((i) => i.id);

 // 1. No duplicate IDs
 const seen = new Map<string, number>();
 for (const id of ids) {
  seen.set(id, (seen.get(id) ?? 0) + 1);
 }
 const dupes = [...seen.entries()].filter(([, count]) => count > 1);
 check(
  `${registryName}: no duplicate IDs`,
  dupes.length === 0,
  dupes.length > 0 ? `duplicates: ${dupes.map(([id]) => id).join(", ")}` : undefined
 );

 // 2. Required fields present
 for (const item of items) {
  const missing = REQUIRED_FIELDS.filter(
   (f) => (item as unknown as Record<string, unknown>)[f] === undefined
  );
  check(
   `${registryName}: ${item.id} has all required fields`,
   missing.length === 0,
   missing.length > 0 ? `missing: ${missing.join(", ")}` : undefined
  );
 }

 // 3. Low-confidence items must have needsReview=true
 for (const item of items) {
  if (LOW_CONFIDENCE.includes(item.confidence) && !item.needsReview) {
   check(
    `${registryName}: ${item.id} (${item.confidence}) has needsReview`,
    false,
    "low-confidence items must have needsReview=true"
   );
  }
 }
 check(
  `${registryName}: low-confidence needsReview enforced`,
  items.filter((i) => LOW_CONFIDENCE.includes(i.confidence) && !i.needsReview).length === 0
 );

 // 4. Verified items must not contain placeholder language
 for (const item of items) {
  if (item.confidence !== "verified") continue;
  const effectOk = !PLACEHOLDER_WORDS.test(item.effectSummary ?? "");
  const notesOk = !PLACEHOLDER_WORDS.test(item.sourceNotes ?? "");
  if (!effectOk) {
   check(
    `${registryName}: ${item.id} (verified) has placeholder text in effectSummary`,
    false,
    `found: "${item.effectSummary}"`
   );
  }
  if (!notesOk) {
   check(
    `${registryName}: ${item.id} (verified) has placeholder text in sourceNotes`,
    false,
    `found: "${item.sourceNotes}"`
   );
  }
 }
 check(
  `${registryName}: verified items have no placeholder language`,
  items
   .filter((i) => i.confidence === "verified")
   .every(
    (i) =>
     !PLACEHOLDER_WORDS.test(i.effectSummary ?? "") &&
     !PLACEHOLDER_WORDS.test(i.sourceNotes ?? "")
   )
 );

 // 5. Placeholder items are never treated as verified (trivially by type, but check)
 for (const item of items) {
  if (item.confidence === "placeholder" && item.needsReview !== true) {
   check(
    `${registryName}: ${item.id} (placeholder) needsReview must be true`,
    false,
    "placeholder items must have needsReview=true"
   );
  }
 }

 // 6. Stat modifiers must use approved stat keys
 for (const item of items) {
  const mods = (item as unknown as Record<string, unknown>).statModifiers;
  if (!Array.isArray(mods)) continue;
  for (const mod of mods) {
   const sm = mod as StatModifier;
   if (!KNOWN_STAT_KEYS.has(sm.stat)) {
    check(
     `${registryName}: ${item.id} has unapproved stat key "${sm.stat}"`,
     false,
     `must be one of: ${[...KNOWN_STAT_KEYS].join(", ")}`
    );
   }
  }
 }

 // 7. Item tags should be normalized (lowercase, trimmed, no empty)
 for (const item of items) {
  const tags = item.tags ?? [];
  for (const tag of tags) {
   if (tag !== tag.toLowerCase().trim()) {
    check(
     `${registryName}: ${item.id} tag "${tag}" is not normalized`,
     false,
     "tags must be lowercase and trimmed"
    );
   }
  }
  const hasEmpty = tags.some((t) => t === "");
  if (hasEmpty) {
   check(
    `${registryName}: ${item.id} has empty tag`,
    false,
    "tags must not contain empty strings"
   );
  }
 }
}

function runRegistryValidationSmokeTest(): void {
 console.log("\n=== Registry Validation Smoke Test ===\n");

 passCount = 0;
 totalTests = 0;

 // Run per-registry checks
 describe("Weapon Registry", weaponRegistry);
 describe("Armor Registry", armorRegistry);
 describe("Key Gear Registry", keyGearRegistry);
 describe("Mod Registry", modRegistry);
 describe("Food/Buff Registry", foodBuffRegistry);
 describe("Deviation Registry", deviationRegistry);
 describe("Cradle Perk Registry", cradleRegistry);
 describe("PvE Target Registry", pveTargetRegistry);

 // 8. Every registry has metadata entry
 const metaRegistryNames = new Set(allRegistryMeta.map((m) => m.registryName));
 const allNames = [
  "Weapon Registry", "Armor Registry", "Key Gear Registry",
  "Mod Registry", "Food/Buff Registry", "Deviation Registry",
  "Cradle Perk Registry", "PvE Target Registry",
 ];
 for (const name of allNames) {
  check(
   `registryMeta includes ${name}`,
   metaRegistryNames.has(name)
  );
 }

 // Run audit utility
 const audit = runRegistryAudit();
 check(
  "Audit: no duplicate IDs across all registries",
  audit.totalDuplicates === 0,
  audit.totalDuplicates > 0 ? `found ${audit.totalDuplicates}` : undefined
 );
 check(
  "Audit: no missing required fields",
  audit.totalMissingFields === 0,
  audit.totalMissingFields > 0 ? `found ${audit.totalMissingFields}` : undefined
 );
 check(
  "Audit: no placeholder text in verified items",
  audit.totalPlaceholderTextInVerified === 0,
  audit.totalPlaceholderTextInVerified > 0
   ? `found ${audit.totalPlaceholderTextInVerified}: ${JSON.stringify(audit.perRegistry.flatMap((r) => r.placeholderTextInVerified))}`
   : undefined
 );
 check(
  "Audit: no unapproved stat keys",
  audit.totalUnapprovedStats === 0,
  audit.totalUnapprovedStats > 0 ? `found ${audit.totalUnapprovedStats}` : undefined
 );

 const forbiddenWeaponsStillVisible = weaponRegistry.filter((w) =>
  [w.id, w.name, w.originalName]
   .filter((value): value is string => typeof value === "string" && value.length > 0)
   .map(normalizedLookupKey)
   .some((key) => forbiddenWeaponLookupKeys.has(key))
 );
 check(
  "Weapon Registry: known non-game/external weapons are filtered out",
  forbiddenWeaponsStillVisible.length === 0,
  forbiddenWeaponsStillVisible.length > 0
   ? `still visible: ${forbiddenWeaponsStillVisible.map((w) => w.name).join(", ")}`
   : undefined
 );

 // Summary
 console.log(`\nRegistry Validation Results: ${passCount}/${totalTests} passed`);
 if (passCount === totalTests) {
  console.log("All registry validation checks PASSED.\n");
 } else {
  console.log(`WARNING: ${totalTests - passCount} checks FAILED.\n`);
 }
}

runRegistryValidationSmokeTest();
