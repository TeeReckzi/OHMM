import type { CanonicalDeviation } from "../itemTypes";
import { deviations as generatedDeviations } from "./generated/deviations.generated";
import { effectSummaryToStatModifiers } from "../../utils/statKeyMapper";
import { getVerifiedStatModifiers } from "../../utils/verifiedModifierLoader";

// IDs from curated items that should take priority over generated entries.
// Note: real canonical "Butterfly's Emissary" and "Lonewolf's Whisper"
// come from the generated file (originalName matches verified data:
const curatedDeviationIds = new Set<string>(["none", "polar-jelly", "pyro-dino", "festering-gel", "zap-cam-lonewolf", "soul-summoner"]);

export const deviationRegistry: CanonicalDeviation[] = [
 ...generatedDeviations.filter((gen) => !curatedDeviationIds.has(gen.id)).map((d) => {
  if (d.statModifiers && d.statModifiers.length > 0) return d;
  const verified = getVerifiedStatModifiers("deviation", d.id);
  if (verified && verified.length > 0) return { ...d, statModifiers: verified };
  const parsed = effectSummaryToStatModifiers(d.effectSummary ?? "");
  if (parsed.length === 0) return d;
  return { ...d, statModifiers: parsed };
 }),
 {
  id: "none",
  name: "No Deviant",
  category: "deviation",
  deviationRole: "utility",
  tags: [],
  effectSummary: "No deviant selected.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Empty selection state.",
 },
 {
  id: "polar-jelly",
  name: "Polar Jelly",
  category: "deviation",
  deviationRole: "combat",
  tags: ["combat", "frost", "elemental"],
  keywordAssociations: ["frostVortex"],
  effectSummary: "Frost-oriented combat deviant. Applies frost status effects.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Verified deviation from catalog. Frost mechanic interaction pending.",
 },
 {
  id: "pyro-dino",
  name: "Chefosaurus / Chef Rex",
  category: "deviation",
  deviationRole: "crafting",
  tags: ["crafting", "food", "support", "chef-rex"],
  effectSummary: "Food-support deviant. Boosts cooked food output stats. Common bonus: 38%, max observed: 42%.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Verified deviation. Bonus calculation: baseline 20% + skill contribution + activity contribution. Common modeled bonus 38%.",
 },
 {
  id: "festering-gel",
  name: "Festering Gel",
  category: "deviation",
  deviationRole: "defensive",
  tags: ["defensive", "shield", "sustain"],
  effectSummary: "Defensive deviant. Provides shielding and sustain effects.",
  statModifiers: [],
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Name from catalog. Exact defensive values pending.",
 },
 {
  id: "zap-cam-lonewolf",
  name: "Zap Cam Lonewolf",
  category: "deviation",
  deviationRole: "combat",
  tags: ["combat", "shock", "elemental", "deviation-skill"],
  keywordAssociations: ["powerSurge"],
  effectSummary: "Shock combat deviation. Deals shock-element skill damage with high base multiplier.",
  statModifiers: [],
  confidence: "placeholder",
  needsReview: true,
  sourceNotes: "SUSPICIOUS/SYNTHETIC: no verified game-data backing. Quarantined to needsReview. baseFactor=8.0 still wired into deviation skill damage formula, pending in-game validation. Do not promote to verified/canonical production paths.",
  activityRating: 0,
 },
 {
  id: "soul-summoner",
  name: "Soul Summoner",
  category: "deviation",
  deviationRole: "combat",
  tags: ["combat", "deviation-skill"],
  keywordAssociations: [],
  effectSummary: "Combat deviation. Deals deviation skill damage with baseFactor=6.0.",
  statModifiers: [],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Verified. baseFactor=6.0 in deviation skill damage formula. Registered in combat mechanic registry.",
  activityRating: 0,
 },
];

export function getDeviation(id: string): CanonicalDeviation | undefined {
 return deviationRegistry.find((d) => d.id === id);
}

export function getDeviationById(id: string): CanonicalDeviation | undefined {
 return deviationRegistry.find((d) => d.id === id);
}

export function listDeviationsByRole(role: string): CanonicalDeviation[] {
 return deviationRegistry.filter((d) => d.deviationRole === role);
}
