import type { CanonicalMod } from "../itemTypes";
import { mod_suffixes as generatedModSuffixes } from "./generated/mod-suffixes.generated";
import { effectSummaryToStatModifiers } from "../../utils/statKeyMapper";
import { getVerifiedStatModifiers } from "../../utils/verifiedModifierLoader";
import { verifiedModFamilies } from "./verifiedModFamilies";

// These 9 entries are synthetic fixtures wired into the formula-engine smoke
// tests (formulaBridgeSmokeTest.ts, modifierSmokeTest.ts, buildComparisonSmokeTest.ts,
// formulaSupportRegistry.ts) — none of their names match real in-game mods
// (cross-checked against verifiedModFamilies.ts). Tagged "test-fixture" so the
// UI can exclude them from the player-facing selector while keeping the ids
// resolvable via getMod()/getModById() for the tests that depend on them.
export const modRegistry: CanonicalMod[] = [
 {
  id: "violent",
  name: "Violent",
  category: "mod",
  modSlot: "weapon",
  modType: "suffix",
  tags: ["suffix", "weapon-dmg", "crit", "test-fixture"],
  keywordAssociations: ["crit"],
  effectSummary: "Weapon damage and crit modifier suffix.",
  statModifiers: [],
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name. See vmf-* entries in verifiedModFamilies.ts for the real Violent suffix data.",
 },
 {
  id: "precision",
  name: "Precision",
  category: "mod",
  modSlot: "weapon",
  modType: "suffix",
  tags: ["suffix", "weakspot", "accuracy", "test-fixture"],
  keywordAssociations: ["weakspot"],
  effectSummary: "Weakspot and accuracy-focused suffix mod.",
  statModifiers: [],
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name.",
 },
 {
  id: "elemental-overload",
  name: "Elemental Overload",
  category: "mod",
  modSlot: "weapon",
  modType: "suffix",
  tags: ["suffix", "elemental", "test-fixture"],
  keywordAssociations: ["elemental"],
  effectSummary: "Elemental damage amplifier suffix mod.",
  statModifiers: [],
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests. The real 'Elemental Overload' is a Gloves core mod, see vmf-gloves-elemental-overload in verifiedModFamilies.ts.",
 },
 {
  id: "status-amplifier",
  name: "Status Amplifier",
  category: "mod",
  modSlot: "weapon",
  modType: "suffix",
  tags: ["suffix", "status", "test-fixture"],
  keywordAssociations: ["status"],
  effectSummary: "Status effect damage amplifier suffix mod.",
  statModifiers: [],
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name.",
 },
 {
  id: "crit-boost",
  name: "Crit Boost",
  category: "mod",
  modSlot: "weapon",
  modType: "suffix",
  tags: ["suffix", "crit", "test-fixture"],
  keywordAssociations: ["crit"],
  effectSummary: "Crit rate and crit damage modifier suffix.",
  statModifiers: [],
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name. The real Gloves core mod is 'Grit Boost', see vmf-gloves-grit-boost.",
 },
 {
  id: "scorched",
  name: "Scorched",
  category: "mod",
  modSlot: "weapon",
  modType: "core",
  tags: ["core", "burn", "blaze", "test-fixture"],
  keywordAssociations: ["burn"],
  effectSummary: "Burn damage modifier core mod. +15% burn DMG.",
  statModifiers: [{ stat: "burnDMGBonus", value: 0.15, unit: "percent" }],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Test-fixture entry used by formulaBridgeSmokeTest.ts/modifierSmokeTest.ts — not a verified in-game mod name. Do not remove without updating those tests.",
 },
 {
  id: "charged",
  name: "Charged",
  category: "mod",
  modSlot: "weapon",
  modType: "core",
  tags: ["core", "power-surge", "shock", "test-fixture"],
  keywordAssociations: ["powerSurge"],
  effectSummary: "Power Surge damage modifier core mod. +18% Power Surge DMG.",
  statModifiers: [{ stat: "powerSurgeDMGBonus", value: 0.18, unit: "percent" }],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name.",
 },
 {
  id: "burn-set-2pc",
  name: "Burn Set 2pc",
  category: "mod",
  modSlot: "weapon",
  modType: "core",
  tags: ["set", "burn", "blaze", "test-fixture"],
  keywordAssociations: ["burn"],
  effectSummary: "Set bonus: +20% burn DMG.",
  statModifiers: [{ stat: "burnDMGBonus", value: 0.20, unit: "percent" }],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name.",
 },
 {
  id: "blaze-suffix",
  name: "Mod Suffix: Blaze",
  category: "mod",
  modSlot: "weapon",
  modType: "suffix",
  tags: ["suffix", "burn", "blaze", "test-fixture"],
  keywordAssociations: ["burn"],
  effectSummary: "Blaze keyword suffix. +8% burn DMG.",
  statModifiers: [{ stat: "burnDMGBonus", value: 0.08, unit: "percent" }],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Test-fixture entry for the formula engine smoke tests, not a verified in-game mod name.",
 },
 // The old generated mod-cores list was raw machine translation of a Chinese
 // data sheet and was mostly wrong; replaced with names verified directly
 // from an in-game screen recording (see verifiedModFamilies.ts).
 ...verifiedModFamilies,
 // The generated suffix list had 3 of its own mistranslations, caught by
 // cross-referencing the same in-game-verified suffix pool names: "Battle"
 // "Survival") were swapped with the wrong English word entirely, and
 // generated suffix names already match the verified pool names and are
 // left untouched.
 ...(() => {
  const SUFFIX_NAME_CORRECTIONS: Record<string, string> = {
   "suffix-battle": "General",
   "suffix-battlefield": "Survival",
   "suffix-talents": "Deviant Energy",
  };
  return generatedModSuffixes.map((m) => {
   let item = SUFFIX_NAME_CORRECTIONS[m.id] ? { ...m, name: SUFFIX_NAME_CORRECTIONS[m.id] } : m;
   if (item.statModifiers && item.statModifiers.length > 0) return item;
   const verified = getVerifiedStatModifiers("mod-suffix", item.id);
   if (verified && verified.length > 0) return { ...item, statModifiers: verified };
   const parsed = effectSummaryToStatModifiers(item.effectSummary ?? "");
   if (parsed.length === 0) return item;
   return { ...item, statModifiers: parsed };
  });
 })(),
];

export function getMod(id: string): CanonicalMod | undefined {
 return modRegistry.find((m) => m.id === id);
}

export function getModById(id: string): CanonicalMod | undefined {
 return modRegistry.find((m) => m.id === id);
}

export function listModSlots(): string[] {
 return [...new Set(modRegistry.map((m) => m.modSlot))];
}

export function getModsBySlot(slot: string): CanonicalMod[] {
 return modRegistry.filter((m) => m.modSlot === slot);
}
