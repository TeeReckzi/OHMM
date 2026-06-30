import type { CanonicalPvETarget } from "../itemTypes";

/**
 * PvE Target Registry
 *
 * Only real Once Human targets are listed. Training dummy is included as a
 * verified test target. Bosses represent major world bosses and dungeon
 * encounters. Elite/trash are representative of common enemy types.
 *
 * Future: expand with per-zone enemy lists, recommended levels, resistances,
 * and vulnerability data.
 */
export const pveTargetRegistry: CanonicalPvETarget[] = [
 {
  id: "training-dummy",
  name: "Training Dummy",
  category: "pve_target",
  targetType: "training_dummy",
  tags: ["target-practice", "testing", "zero-resistance"],
  effectSummary: "Standard training target. No armor or damage resistance. Used for formula testing and DPS measurement.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Standard training dummy present in all major settlements. Verified zero-resistance testing target.",
 },
 {
  id: "giant-bear",
  name: "Giant Bear",
  originalName: "巨熊",
  category: "pve_target",
  targetType: "elite",
  faction: "Wildlife",
  tags: ["wildlife", "elite", "open-world"],
  effectSummary: "Large wildlife elite enemy. Found in open-world areas.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified open-world elite enemy.",
  recommendedLevel: 15,
 },
 {
  id: "shadow-hound",
  name: "Shadow Hound",
  category: "pve_target",
  targetType: "trash",
  faction: "Vultures",
  tags: ["vultures", "trash", "pack"],
  effectSummary: "Common Vultures faction enemy. Found in packs across many zones.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified common Vultures trash mob.",
  recommendedLevel: 10,
 },
 {
  id: "vulture-scavenger",
  name: "Vulture Scavenger",
  category: "pve_target",
  targetType: "trash",
  faction: "Vultures",
  tags: ["vultures", "trash", "ranged"],
  effectSummary: "Ranged Vultures faction enemy. Common humanoid trash mob.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified common Vultures ranged trash mob.",
  recommendedLevel: 10,
 },
 {
  id: "vulture-berserker",
  name: "Vulture Berserker",
  category: "pve_target",
  targetType: "elite",
  faction: "Vultures",
  tags: ["vultures", "elite", "melee"],
  effectSummary: "Elite Vultures melee enemy. Higher HP and damage than trash variants.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified Vultures elite enemy.",
  recommendedLevel: 20,
 },
 {
  id: "rosetta-soldier",
  name: "Rosetta Soldier",
  category: "pve_target",
  targetType: "trash",
  faction: "Rosetta",
  tags: ["rosetta", "trash", "humanoid"],
  effectSummary: "Common Rosetta faction soldier. Found in Rosetta-controlled zones.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified Rosetta trash mob.",
  recommendedLevel: 25,
 },
 {
  id: "rosetta-heavy",
  name: "Rosetta Heavy",
  category: "pve_target",
  targetType: "elite",
  faction: "Rosetta",
  tags: ["rosetta", "elite", "armored"],
  effectSummary: "Heavy Rosetta elite. Higher armor and damage resistance.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified Rosetta elite enemy.",
  recommendedLevel: 35,
 },
 {
  id: "forsaken-giant",
  name: "Forsaken Giant",
  category: "pve_target",
  targetType: "boss",
  faction: "Rosetta",
  tags: ["rosetta", "boss", "world-boss"],
  effectSummary: "World boss encounter. Rosetta faction boss with multiple phases.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified world boss. Encountered in Rosetta end-game zones.",
  recommendedLevel: 50,
 },
 {
  id: "treant",
  name: "Treant",
  category: "pve_target",
  targetType: "boss",
  faction: "Wildlife",
  tags: ["wildlife", "boss", "world-boss", "elemental"],
  effectSummary: "Elemental world boss. Large treant enemy found in overgrown zones.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified open-world boss encounter.",
  recommendedLevel: 40,
 },
 {
  id: "monolith-guardian",
  name: "Monolith Guardian",
  category: "pve_target",
  targetType: "boss",
  faction: "Rosetta",
  tags: ["rosetta", "boss", "dungeon", "monolith"],
  effectSummary: "Monolith dungeon boss. Encountered in Rosetta monolith instances.",
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Verified dungeon/instance boss.",
  recommendedLevel: 50,
 },
 {
  id: "lava-walker",
  name: "Lava Walker",
  category: "pve_target",
  targetType: "boss",
  faction: "Wildlife",
  tags: ["wildlife", "boss", "fire", "elemental", "unverified"],
  effectSummary: "Fire-elemental boss found in volcanic zones.",
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Name from external reference. Boss mechanics pending confirmation.",
  recommendedLevel: 45,
 },
 {
  id: "frost-titan",
  name: "Frost Titan",
  category: "pve_target",
  targetType: "boss",
  faction: "Wildlife",
  tags: ["wildlife", "boss", "frost", "elemental", "unverified"],
  effectSummary: "Frost-elemental boss found in arctic zones.",
  confidence: "estimated",
  needsReview: true,
  sourceNotes: "Name from external reference. Boss mechanics pending confirmation.",
  recommendedLevel: 45,
 },
];

export function getPvETarget(id: string): CanonicalPvETarget | undefined {
 return pveTargetRegistry.find((t) => t.id === id);
}

export function listPvETargetTypes(): string[] {
 return [...new Set(pveTargetRegistry.map((t) => t.targetType))];
}

export function listPvEFactions(): string[] {
 return [...new Set(pveTargetRegistry.map((t) => t.faction).filter(Boolean) as string[])];
}
