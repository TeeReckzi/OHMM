import type { CanonicalWeapon } from "../itemTypes";
import { weapons as generatedWeapons } from "./generated/weapons.generated";
import { lredragolWeaponEntries } from "./generated/weaponsStats.generated";
import { bindictWeaponEntries } from "./generated/weaponsStats.bindict.generated";

/** Normalize a name for fuzzy matching */
function normKey(s: string): string {
 return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normId(s: string): string {
 return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const nonCanonicalWeaponNameKeys = new Set(
 [
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
  "SR2000 - Die Another Day",
 ].map(normKey)
);

function isNonCanonicalWeapon(w: CanonicalWeapon): boolean {
 return [w.id, w.name, w.originalName]
  .filter((value): value is string => typeof value === "string" && value.length > 0)
  .map(normKey)
  .some((key) => nonCanonicalWeaponNameKeys.has(key));
}

const vettedLReDragolWeaponEntries = lredragolWeaponEntries.filter((w) => !isNonCanonicalWeapon(w));
const vettedGeneratedWeapons = generatedWeapons.filter((w) => !isNonCanonicalWeapon(w));
const vettedBindictWeapons = bindictWeaponEntries.filter((w) => !isNonCanonicalWeapon(w));

// Build bindict lookup by normalized name for stat backfilling
const bindictByName = new Map<string, CanonicalWeapon>();
for (const w of vettedBindictWeapons) {
  if (w.originalName) bindictByName.set(normKey(w.originalName), w);
  bindictByName.set(normKey(w.name), w);
}

function findBindictEntry(weapon: CanonicalWeapon): CanonicalWeapon | undefined {
  const byName = bindictByName.get(normKey(weapon.name));
  if (byName) return byName;
  if (weapon.originalName) {
    const byOrig = bindictByName.get(normKey(weapon.originalName));
    if (byOrig) return byOrig;
  }
  return undefined;
}

/** Merge bindict-decoded stats into a weapon entry (lowest priority backfill) */
function mergeBindictStats(weapon: CanonicalWeapon): CanonicalWeapon {
  const bindict = findBindictEntry(weapon);
  if (!bindict) return weapon;
  return {
    ...weapon,
    fireRate: weapon.fireRate ?? bindict.fireRate,
    magazineCapacity: weapon.magazineCapacity ?? bindict.magazineCapacity,
    reloadTimeSeconds: weapon.reloadTimeSeconds ?? bindict.reloadTimeSeconds,
  };
}

// Build ID + name-key lookup for lReDragol entries
const lreById = new Map<string, CanonicalWeapon>();
const lreByName = new Map<string, CanonicalWeapon>();
for (const w of vettedLReDragolWeaponEntries) {
 lreById.set(w.id, w);
 lreByName.set(normKey(w.name), w);
}

function findLReEntry(curated: CanonicalWeapon): CanonicalWeapon | undefined {
 const byId = lreById.get(curated.id);
 if (byId) return byId;
 const byName = lreByName.get(normKey(curated.name));
 if (byName) return byName;
 if (curated.originalName) {
  const byOrig = lreByName.get(normKey(curated.originalName));
  if (byOrig) return byOrig;
 }
 // Try partial match: curated name contains lRe name or vice versa
 const cn = normKey(curated.name);
 for (const [key, w] of lreByName) {
  if (cn.includes(key) || key.includes(cn)) return w;
 }
 // Fallback: try id-based normalized match against lre entries
 const cid = normKey(curated.id);
 for (const [key, w] of lreById) {
  if (normKey(key) === cid) return w;
 }
 return undefined;
}

function mergeLReStats(curated: CanonicalWeapon): CanonicalWeapon {
 const lre = findLReEntry(curated);
 if (!lre) return curated;
 return {
  ...curated,
  damagePerProjectile: curated.damagePerProjectile ?? lre.damagePerProjectile,
  projectilesPerShot: curated.projectilesPerShot ?? lre.projectilesPerShot,
  fireRate: curated.fireRate ?? lre.fireRate,
  magazineCapacity: curated.magazineCapacity ?? lre.magazineCapacity,
  critRatePercent: curated.critRatePercent ?? lre.critRatePercent,
  critDamagePercent: curated.critDamagePercent ?? lre.critDamagePercent,
  weakspotDamagePercent: curated.weakspotDamagePercent ?? lre.weakspotDamagePercent,
  reloadTimeSeconds: curated.reloadTimeSeconds ?? lre.reloadTimeSeconds,
  ammoType: curated.ammoType ?? lre.ammoType,
 };
}

const curatedEntries: CanonicalWeapon[] = [
 {
  id: "acs12-corrosion",
  name: "ACS-12 Corrosion",
  category: "weapon",
  family: "Shotgun",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "shock",
  tags: ["shotgun", "auto", "power-surge", "shock"],
  keywordAssociations: ["powerSurge"],
  effectSummary: "Power Surge proc on hits. Rapid-fire shotgun applying shock status.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Known legendary shotgun. Power Surge keyword verified from reference.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
  iconUrl: "https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main/weapons/acs12-corrosion.png",
 },
 {
  id: "acs12-pyroclasm-starter",
  name: "ACS-12 Pyroclasm Starter",
  category: "weapon",
  family: "Shotgun",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "burn",
  tags: ["shotgun", "auto", "burn", "blaze"],
  keywordAssociations: ["burn"],
  effectSummary: "Burn status on hits. Shotgun with burn stack application.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Burn legendary shotgun verified from reference.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
  iconUrl: "https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main/weapons/acs12-pyroclasm-starter.png",
 },
 {
  id: "ebr-14-octopus-grilled-rings",
  name: "EBR-14 - Octopus! Grilled Rings!",
  category: "weapon",
  family: "Sniper Rifle",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "burn",
  tags: ["sniper", "semi-auto", "burn", "blaze", "fire-ring"],
  keywordAssociations: ["burn"],
  effectSummary: "Burn-focused sniper rifle. Fire ring proc at max burn stacks.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Canonical in-game display name retained. Fire ring mechanic documented in external research.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
  iconUrl: "https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main/weapons/ebr-14-octopus-grilled-rings.png",
 },
 {
  id: "aws338-bingo",
  name: "AWS.338 Bingo",
  category: "weapon",
  family: "Sniper Rifle",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "kinetic",
  tags: ["sniper", "bolt-action", "kinetic", "weakspot"],
  keywordAssociations: ["weakspot"],
  effectSummary: "High-damage kinetic sniper with weakspot burst mechanics.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Kinetic sniper rifle. Weakspot-oriented.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
 },
 {
  id: "dbsg-doombringer",
  name: "DBSG - Doombringer",
  category: "weapon",
  family: "Shotgun",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "kinetic",
  tags: ["shotgun", "kinetic", "crit"],
  keywordAssociations: ["crit"],
  effectSummary: "Crit-oriented kinetic shotgun.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Corrected from old curated Doombringer placeholder. Generated lReDragol source identifies Doombringer as a DBSG shotgun.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
  iconUrl: "https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main/weapons/dbsg-doombringer.png",
 },
 {
  id: "compound-bow-burden-of-betrayal",
  name: "Compound Bow - The Burden of Betrayal",
  category: "weapon",
  family: "Crossbow",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "kinetic",
  tags: ["bow", "crossbow", "kinetic", "bounce", "crit", "meta"],
  keywordAssociations: ["bounce", "crit"],
  effectSummary: "Bounce DMG +20%, Crit Rate +35%. Vs Metas: Bounce DMG +50%, Echo multiplier +40%. Full-charge condition triggers bounce/crit bonuses.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Patch data addition. Meta-specific bounce and crit bonuses documented from verified reference. Echo multiplier vs Metas requires formula extension.",
  allowedAmmoCategories: ["arrow", "copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "arrow",
 },
 {
  id: "pdw90-holographic-resonance",
  name: "PDW90 Holographic Resonance",
  category: "weapon",
  family: "SMG",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "kinetic",
  tags: ["smg", "auto", "kinetic", "mark", "bullseye", "aoe"],
  keywordAssociations: ["bullseye"],
  effectSummary: "Bullseye keyword SMG. Unique proc: every 11th hit triggers an AoE damage instance. AoE damage type and exact formula pending in-game measurement.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Name and keyword confirmed by user (NA live): PDW90 Holographic Resonance, Bullseye/MARK keyword — NOT Power Surge. 11-hit AoE proc threshold confirmed. AoE damage type (kinetic vs elemental) and atkMultiplier/radius require in-game measurement before formula accuracy claim.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
  iconUrl: "https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main/weapons/pdw90-holographic-resonance.png",
 },
 {
  id: "r500-memento",
  name: "R500 Memento",
  category: "weapon",
  family: "Pistol",
  blueprintQuality: "legendary",
  maxStars: 6,
  damageProfile: "kinetic",
  tags: ["pistol", "semi-auto", "kinetic", "fastgunner", "weakspot"],
  keywordAssociations: ["fastGunner", "weakspot"],
  effectSummary: "Fast Gunner fire rate mode. Weakspot DMG +40% while Fast Gunner active. 45% proc chance on non-weakspot hits routed through weakspot uptime assumptions; 100% on weakspot hits.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Patch data addition. Fast Gunner weakspot DMG bonus verified. Proc chance 45%/100% routing through weakspot uptime assumption system.",
  allowedAmmoCategories: ["copper", "steel", "ap", "demolition"],
  defaultAmmoCategory: "copper",
  iconUrl: "https://cdn.jsdelivr.net/gh/TeeReckzi/ohmm-icondb@main/weapons/r500-memento.png",
 },
];

// Collect all curated IDs so we only add lReDragol entries not already present
const curatedIds = new Set(curatedEntries.map((w) => w.id));
const lreAdditions = vettedLReDragolWeaponEntries.filter((w) => !curatedIds.has(w.id));

// Ensure generated entries don't duplicate IDs from curated or lReDragol sources
const lreOrCuratedIds = new Set([...curatedIds, ...lreAdditions.map((w) => w.id)]);
const genAdditions = vettedGeneratedWeapons.filter((w) => !lreOrCuratedIds.has(w.id));

// Bindict entries: only add new weapons not already in curated/lReDragol/generated
const allExistingIds = new Set([...lreOrCuratedIds, ...genAdditions.map((w) => w.id)]);
const bindictAdditions = vettedBindictWeapons.filter((w) => !allExistingIds.has(w.id));

export const weaponRegistry: CanonicalWeapon[] = [
 ...curatedEntries.map(mergeLReStats).map(mergeBindictStats),
 ...lreAdditions.map(mergeBindictStats),
 ...genAdditions.map(mergeBindictStats),
 ...bindictAdditions,
].filter((w) => !isNonCanonicalWeapon(w));

export function getWeapon(id: string): CanonicalWeapon | undefined {
 return weaponRegistry.find((w) => w.id === id);
}

export interface WeaponReadiness {
 calculatorReady: boolean;
 displayOnly: boolean;
 missingInputs: string[];
}

export function getWeaponReadiness(w: CanonicalWeapon | undefined): WeaponReadiness {
 if (!w) return { calculatorReady: false, displayOnly: true, missingInputs: ['weapon not found'] };
 const missing: string[] = [];
 if (w.damagePerProjectile == null && (w as { baseDamage?: number }).baseDamage == null) missing.push('damagePerProjectile');
 if (w.fireRate == null) missing.push('fireRate');
 if (!w.family) missing.push('family');
 const ready = missing.length === 0;
 return { calculatorReady: ready, displayOnly: !ready, missingInputs: missing };
}

export function listWeaponFamilies(): string[] {
 return [...new Set(weaponRegistry.map((w) => w.family))];
}

export function listWeaponDamageProfiles(): string[] {
 return [...new Set(weaponRegistry.map((w) => w.damageProfile))];
}
