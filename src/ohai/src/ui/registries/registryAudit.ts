import type { AnyCanonicalItem, BaseCanonicalItem, StatModifier } from "../itemTypes";
import { weaponRegistry } from "./weaponRegistry";
import { armorRegistry, keyGearRegistry } from "./armorRegistry";
import { modRegistry } from "./modRegistry";
import { foodBuffRegistry } from "./foodBuffRegistry";
import { deviationRegistry } from "./deviationRegistry";
import { cradleRegistry } from "./cradleRegistry";
import { pveTargetRegistry } from "./pveTargetRegistry";
import { allRegistryMeta } from "./registryMeta";

const PLACEHOLDER_PATTERNS = /\b(?:placeholder|pending|tbd|to\s*be\s*done|not\s*yet|not extracted)\b/i;

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

const VERIFIED_ITEM_PLACEHOLDER_WORDS = ["placeholder", "pending", "tbd", "not yet", "not extracted", "to be done"];

interface AuditResult {
 registryName: string;
 itemCount: number;
 confidenceCounts: Record<string, number>;
 needsReviewCount: number;
 duplicateIds: string[];
 missingRequiredFields: { id: string; missing: string[] }[];
 placeholderTextInVerified: { id: string; field: string; text: string }[];
 unapprovedStatKeys: { id: string; stat: string }[];
 untaggedItems: string[];
}

interface FullAudit {
 meta: typeof allRegistryMeta;
 perRegistry: AuditResult[];
 totalItems: number;
 totalDuplicates: number;
 totalMissingFields: number;
 totalPlaceholderTextInVerified: number;
 totalUnapprovedStats: number;
 totalUntagged: number;
}

function getItemId(item: AnyCanonicalItem): string {
 return item.id;
}

function checkRequiredFields(item: AnyCanonicalItem): string[] {
 const missing: string[] = [];
 for (const field of REQUIRED_FIELDS) {
  if ((item as unknown as Record<string, unknown>)[field] === undefined) {
   missing.push(field);
  }
 }
 return missing;
}

function detectPlaceholderText(text: string): boolean {
 return VERIFIED_ITEM_PLACEHOLDER_WORDS.some((word) => {
  const regex = new RegExp(word.replace(/\s+/, "\\s+"), "i");
  return regex.test(text);
 });
}

function checkVerifiedItem(item: AnyCanonicalItem): { id: string; field: string; text: string }[] {
 const issues: { id: string; field: string; text: string }[] = [];
 if (item.confidence !== "verified") return issues;

 const textFields: [keyof AnyCanonicalItem, string][] = [
  ["effectSummary", item.effectSummary ?? ""],
  ["sourceNotes", item.sourceNotes ?? ""],
 ];
 for (const [field, text] of textFields) {
  if (detectPlaceholderText(text)) {
   issues.push({ id: item.id, field, text });
  }
 }
 return issues;
}

function checkStatKeys(item: AnyCanonicalItem): { id: string; stat: string }[] {
 const issues: { id: string; stat: string }[] = [];
 const mods = (item as unknown as Record<string, unknown>).statModifiers;
 if (!Array.isArray(mods)) return issues;
 for (const mod of mods) {
  const m = mod as StatModifier;
  if (!KNOWN_STAT_KEYS.has(m.stat)) {
   issues.push({ id: item.id, stat: m.stat });
  }
 }
 return issues;
}

function auditRegistry(
 registryName: string,
 items: AnyCanonicalItem[]
): AuditResult {
 const seen = new Map<string, number>();
 const confidenceCounts: Record<string, number> = {};
 const duplicateIds: string[] = [];
 const missingRequiredFields: { id: string; missing: string[] }[] = [];
 const placeholderTextInVerified: { id: string; field: string; text: string }[] = [];
 const unapprovedStatKeys: { id: string; stat: string }[] = [];
 const untaggedItems: string[] = [];

 for (const item of items) {
  const id = getItemId(item);

  const prev = seen.get(id);
  if (prev !== undefined) {
   if (!duplicateIds.includes(id)) duplicateIds.push(id);
  }
  seen.set(id, (prev ?? 0) + 1);

  confidenceCounts[item.confidence] = (confidenceCounts[item.confidence] ?? 0) + 1;

  const missing = checkRequiredFields(item);
  if (missing.length > 0) {
   missingRequiredFields.push({ id, missing });
  }

  const verifiedIssues = checkVerifiedItem(item);
  placeholderTextInVerified.push(...verifiedIssues);

  const statIssues = checkStatKeys(item);
  unapprovedStatKeys.push(...statIssues);

  if (!item.tags || item.tags.length === 0) {
   untaggedItems.push(id);
  }
 }

 return {
  registryName,
  itemCount: items.length,
  confidenceCounts,
  needsReviewCount: items.filter((i) => i.needsReview).length,
  duplicateIds,
  missingRequiredFields,
  placeholderTextInVerified,
  unapprovedStatKeys,
  untaggedItems,
 };
}

export function runRegistryAudit(): FullAudit {
 const results: AuditResult[] = [
  auditRegistry("Weapon Registry", weaponRegistry),
  auditRegistry("Armor Registry", armorRegistry),
  auditRegistry("Key Gear Registry", keyGearRegistry),
  auditRegistry("Mod Registry", modRegistry),
  auditRegistry("Food/Buff Registry", foodBuffRegistry),
  auditRegistry("Deviation Registry", deviationRegistry),
  auditRegistry("Cradle Perk Registry", cradleRegistry),
  auditRegistry("PvE Target Registry", pveTargetRegistry),
 ];

 return {
  meta: allRegistryMeta,
  perRegistry: results,
  totalItems: results.reduce((s, r) => s + r.itemCount, 0),
  totalDuplicates: results.reduce((s, r) => s + r.duplicateIds.length, 0),
  totalMissingFields: results.reduce((s, r) => s + r.missingRequiredFields.length, 0),
  totalPlaceholderTextInVerified: results.reduce((s, r) => s + r.placeholderTextInVerified.length, 0),
  totalUnapprovedStats: results.reduce((s, r) => s + r.unapprovedStatKeys.length, 0),
  totalUntagged: results.reduce((s, r) => s + r.untaggedItems.length, 0),
 };
}

export function printAuditReport(audit: FullAudit): void {
 console.log("\n=== Registry Audit Report ===\n");
 for (const reg of audit.perRegistry) {
  console.log(`[${reg.registryName}]`);
  console.log(` Items: ${reg.itemCount}`);
  console.log(` Confidence: ${JSON.stringify(reg.confidenceCounts)}`);
  console.log(` Needs Review: ${reg.needsReviewCount}`);
  if (reg.duplicateIds.length > 0) {
   console.log(` DUPLICATE IDs: ${reg.duplicateIds.join(", ")}`);
  }
  if (reg.missingRequiredFields.length > 0) {
   console.log(` MISSING FIELDS: ${reg.missingRequiredFields.length} items`);
   for (const mf of reg.missingRequiredFields) {
    console.log(`  - ${mf.id}: missing ${mf.missing.join(", ")}`);
   }
  }
  if (reg.placeholderTextInVerified.length > 0) {
   console.log(` PLACEHOLDER TEXT IN VERIFIED ITEMS:`);
   for (const pv of reg.placeholderTextInVerified) {
    console.log(`  - ${pv.id}: "${pv.text}" in ${pv.field}`);
   }
  }
  if (reg.unapprovedStatKeys.length > 0) {
   console.log(` UNAPPROVED STAT KEYS:`);
   for (const sk of reg.unapprovedStatKeys) {
    console.log(`  - ${sk.id}: stat="${sk.stat}"`);
   }
  }
  if (reg.untaggedItems.length > 0) {
   console.log(` UNTAGGED: ${reg.untaggedItems.length} items`);
  }
  console.log();
 }
 console.log("=== Summary ===");
 console.log(`Total items: ${audit.totalItems}`);
 console.log(`Duplicate IDs: ${audit.totalDuplicates}`);
 console.log(`Missing required fields: ${audit.totalMissingFields}`);
 console.log(`Placeholder text in verified items: ${audit.totalPlaceholderTextInVerified}`);
 console.log(`Unapproved stat keys: ${audit.totalUnapprovedStats}`);
 console.log(`Untagged items: ${audit.totalUntagged}`);
 console.log();
}

// Self-execute when run directly
const audit = runRegistryAudit();
printAuditReport(audit);
