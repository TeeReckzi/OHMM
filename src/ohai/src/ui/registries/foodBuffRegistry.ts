import type { CanonicalFoodBuff } from "../itemTypes";
import { food_buffs as generatedFoodBuffs } from "./generated/food-buffs.generated";
import { effectSummaryToStatModifiers } from "../../utils/statKeyMapper";
import { getVerifiedStatModifiers } from "../../utils/verifiedModifierLoader";

// IDs from curated items that should take priority over generated entries
const curatedFoodIds = new Set<string>(["none", "safety-sandwich", "anti-gravity-milkshake", "all-weather-stew", "burn-dmg-stir-fry", "status-dmg-salad", "elemental-dmg-soup", "crit-dmg-steak", "weakspot-dmg-tea", "fire-rate-coffee"]);

export const foodBuffRegistry: CanonicalFoodBuff[] = [
 ...generatedFoodBuffs.filter((gen) => !curatedFoodIds.has(gen.id)).map((f) => {
  if (f.statModifiers && f.statModifiers.length > 0) return f;
  const verified = getVerifiedStatModifiers("food", f.id);
  if (verified && verified.length > 0) return { ...f, statModifiers: verified };
  const parsed = effectSummaryToStatModifiers(f.effectSummary ?? "");
  if (parsed.length === 0) return f;
  return { ...f, statModifiers: parsed };
 }),
 {
  id: "none",
  name: "No Food Buff",
  category: "food",
  tags: [],
  effectSummary: "No consumable bonus applied.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Empty selection state.",
 },
 {
  id: "safety-sandwich",
  name: "Safety Sandwich",
  category: "food",
  buffType: "defensive",
  tags: ["pvp", "defensive", "dmg-reduction"],
  effectSummary: "PvP defensive food. Reduces damage taken from enemy players.",
  statModifiers: [{ stat: "playerDMGReduction", value: 0.20, unit: "percent" }],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Wiki-confirmed icon and defensive effect. Chef Rex common bonus: 38% food bonus.",
  durationSeconds: 1800,
 },
 {
  id: "anti-gravity-milkshake",
  name: "Anti-Gravity Milkshake",
  category: "food",
  buffType: "utility",
  tags: ["mobility", "utility"],
  effectSummary: "Mobility/utility consumable. Movement and jump enhancement effects.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Wiki-confirmed icon. Exact stat values pending extraction.",
  durationSeconds: 1800,
 },
 {
  id: "all-weather-stew",
  name: "All-Weather Stew",
  category: "food",
  buffType: "resist",
  tags: ["resist", "temperature", "survival"],
  effectSummary: "Temperature resistance food. Reduces environmental temperature effects.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Wiki-confirmed icon. Temperature resistance values pending.",
  durationSeconds: 1800,
 },
 {
  id: "burn-dmg-stir-fry",
  name: "Spicy Stir Fry",
  category: "food",
  buffType: "offensive",
  tags: ["offensive", "burn", "blaze"],
  keywordAssociations: ["burn"],
  effectSummary: "Increases burn/elemental damage for a duration.",
  statModifiers: [],
  confidence: "experimental",
  needsReview: true,
  sourceNotes: "This entry is a display-only placeholder. No stat modifiers are defined yet.",
  durationSeconds: 1800,
 },
 {
  id: "status-dmg-salad",
  name: "Status Salad",
  category: "food",
  buffType: "offensive",
  tags: ["offensive", "status"],
  keywordAssociations: ["status"],
  effectSummary: "Increases status damage for a duration.",
  statModifiers: [],
  confidence: "experimental",
  needsReview: true,
  sourceNotes: "This entry is a display-only placeholder. No stat modifiers are defined yet.",
  durationSeconds: 1800,
 },
 {
  id: "elemental-dmg-soup",
  name: "Elemental Soup",
  category: "food",
  buffType: "offensive",
  tags: ["offensive", "elemental"],
  keywordAssociations: ["elemental"],
  effectSummary: "Increases elemental damage for a duration.",
  statModifiers: [],
  confidence: "experimental",
  needsReview: true,
  sourceNotes: "This entry is a display-only placeholder. No stat modifiers are defined yet.",
  durationSeconds: 1800,
 },
 {
  id: "crit-dmg-steak",
  name: "Crit Steak",
  category: "food",
  buffType: "offensive",
  tags: ["offensive", "crit"],
  keywordAssociations: ["crit"],
  effectSummary: "Increases crit damage for a duration.",
  statModifiers: [],
  confidence: "experimental",
  needsReview: true,
  sourceNotes: "This entry is a display-only placeholder. No stat modifiers are defined yet.",
  durationSeconds: 1800,
 },
 {
  id: "weakspot-dmg-tea",
  name: "Weakspot Tea",
  category: "drink",
  buffType: "offensive",
  tags: ["offensive", "weakspot"],
  keywordAssociations: ["weakspot"],
  effectSummary: "Increases weakspot damage for a duration.",
  statModifiers: [],
  confidence: "experimental",
  needsReview: true,
  sourceNotes: "This entry is a display-only placeholder. No stat modifiers are defined yet.",
  durationSeconds: 1800,
 },
 {
  id: "fire-rate-coffee",
  name: "Fire Rate Coffee",
  category: "drink",
  buffType: "offensive",
  tags: ["offensive", "fire-rate"],
  keywordAssociations: [],
  effectSummary: "Increases fire rate for a duration.",
  statModifiers: [],
  confidence: "experimental",
  needsReview: true,
  sourceNotes: "This entry is a display-only placeholder. No stat modifiers are defined yet.",
  durationSeconds: 1800,
 },
];

export function getFoodBuff(id: string): CanonicalFoodBuff | undefined {
 return foodBuffRegistry.find((f) => f.id === id);
}

export function getFoodBuffById(id: string): CanonicalFoodBuff | undefined {
 return foodBuffRegistry.find((f) => f.id === id);
}

export function listFoodBuffsByType(type: string): CanonicalFoodBuff[] {
 return foodBuffRegistry.filter((f) => f.buffType === type);
}
