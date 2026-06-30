import type { StatKey } from "../../schemas/buildGoalSchema";
import type { GearItemInput } from "./types";
import type { SynergyMatch } from "./types";

const KEYWORD_SYNERGY_PAIRS: [string, string][] = [
  ["burn", "blaze"],
  ["power surge", "shock"],
  ["frost vortex", "frost"],
  ["unstable bomber", "blast"],
  ["bounce", "ricochet"],
  ["shrapnel", "fragmentation"],
  ["bullseye", "hunter's mark"],
  ["crit", "weakspot"],
  ["crit", "fast gunner"],
  ["status", "elemental"],
  ["shield", "defense"],
  ["max hp", "shield"],
  ["reload", "fast gunner"],
  ["fire rate", "fast gunner"]
];

const KEYWORD_FAMILIES: Record<string, string[]> = {
  burn: ["burn", "blaze", "fire", "heat", "incendiary"],
  power_surge: ["power surge", "shock", "lightning", "electric", "surge"],
  frost_vortex: ["frost vortex", "frost", "ice", "freeze", "cold"],
  unstable_bomber: ["unstable bomber", "blast", "explosion", "explosive", "bomber"],
  bounce: ["bounce", "ricochet", "rebound", "bouncing"],
  shrapnel: ["shrapnel", "fragmentation", "fragment", "scatter"],
  bullseye: ["bullseye", "hunter's mark", "mark", "precise", "precision"],
  crit: ["crit", "critical", "deadly", "violent"],
  weakspot: ["weakspot", "weak point", "weak spot", "precision"],
  weapon_damage: ["weapon dmg", "weapon damage", "attack", "firepower"],
  status: ["status", "anomaly", "abnormal", "dot", "over time"],
  elemental: ["elemental", "element", "element damage"],
  shield: ["shield", "barrier", "protection"],
  melee: ["melee", "close combat", "brawler", "blade"],
  gathering: ["gathering", "harvest", "collection", "yield"]
};

export function detectSynergies(
  items: GearItemInput[],
  scenarioTags: string[],
  buildGoalId: string
): { synergies: SynergyMatch[]; totalSynergyScore: number } {
  const synergies: SynergyMatch[] = [];

  synergies.push(...detectKeywordSynergies(items));
  synergies.push(...detectArmorSetCohesion(items));
  synergies.push(...detectElementalAlignment(items));
  synergies.push(...detectCritEcosystem(items));
  synergies.push(...detectProcChainCompatibility(items));
  synergies.push(...detectWeaponTypeSynergies(items));
  synergies.push(...detectCalibrationSynergy(items));

  const totalSynergyScore = synergies.reduce((sum, s) => sum + s.score, 0);

  return { synergies, totalSynergyScore };
}

function getItemKeywords(item: GearItemInput): string[] {
  return (item.keywords ?? []).map((k) => k.toLowerCase());
}

function detectKeywordSynergies(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];
  const allKeywords = items.flatMap((item) => getItemKeywords(item));
  const uniqueKeywords = [...new Set(allKeywords)];

  for (const [kw1, kw2] of KEYWORD_SYNERGY_PAIRS) {
    const has1 = uniqueKeywords.some((k) => k.includes(kw1));
    const has2 = uniqueKeywords.some((k) => k.includes(kw2));
    if (has1 && has2) {
      const matchingItems = items.filter(
        (item) =>
          getItemKeywords(item).some((k) => k.includes(kw1)) ||
          getItemKeywords(item).some((k) => k.includes(kw2))
      );
      matches.push({
        type: "keyword_match",
        items: matchingItems.map((i) => i.name),
        description: `Keyword synergy: "${kw1}" + "${kw2}"`,
        score: 5.0,
        details: `Items with "${kw1}" or "${kw2}" keywords gain synergy bonus`
      });
    }
  }

  for (const [, family] of Object.entries(KEYWORD_FAMILIES)) {
    const presentInFamily = family.filter((kw) =>
      uniqueKeywords.some((k) => k.includes(kw))
    );
    if (presentInFamily.length >= 2) {
      const matchingItems = items.filter((item) =>
        getItemKeywords(item).some((k) => family.some((f) => k.includes(f)))
      );
      matches.push({
        type: "keyword_match",
        items: matchingItems.map((i) => i.name),
        description: `Keyword family synergy: ${presentInFamily.slice(0, 3).join(", ")}`,
        score: 3.0 * presentInFamily.length,
        details: `${presentInFamily.length} related keywords reinforce same damage type`
      });
    }
  }

  return matches;
}

function detectArmorSetCohesion(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];
  const armorItems = items.filter((item) => item.sourceType === "armor" && item.armorSet);

  const setGroups: Record<string, GearItemInput[]> = {};
  for (const item of armorItems) {
    const setName = item.armorSet!.toLowerCase();
    if (!setGroups[setName]) setGroups[setName] = [];
    setGroups[setName].push(item);
  }

  for (const [setName, setItems] of Object.entries(setGroups)) {
    if (setItems.length >= 2) {
      const score = Math.min(setItems.length * 3.0, 12.0);
      matches.push({
        type: "armor_set_cohesion",
        items: setItems.map((i) => i.name),
        description: `Armor set cohesion: ${setName} (${setItems.length} pieces)`,
        score,
        details: `${setItems.length}/${setItems.length} pieces from "${setName}" — set bonuses active`
      });
    }
  }

  return matches;
}

function detectElementalAlignment(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];
  const elements = items
    .map((item) => item.element?.toLowerCase())
    .filter(Boolean) as string[];

  if (elements.length === 0) return matches;

  const elementCounts: Record<string, number> = {};
  for (const el of elements) {
    elementCounts[el] = (elementCounts[el] ?? 0) + 1;
  }

  for (const [element, count] of Object.entries(elementCounts)) {
    if (count >= 2) {
      const alignedItems = items.filter(
        (item) => item.element?.toLowerCase() === element
      );
      matches.push({
        type: "elemental_alignment",
        items: alignedItems.map((i) => i.name),
        description: `Elemental alignment: ${element} (${count} items)`,
        score: count * 2.0,
        details: `All ${count} items share ${element} element — damage type consistency bonus`
      });
    }
  }

  return matches;
}

function detectCritEcosystem(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];

  const hasCritRate = items.some(
    (item) => (item.statValues?.critRate ?? 0) > 0
  );
  const hasCritDMG = items.some(
    (item) => (item.statValues?.critDMG ?? 0) > 0
  );
  const hasWeakspot = items.some(
    (item) => (item.statValues?.weakspotDMG ?? 0) > 0
  );

  const critComponents = [hasCritRate, hasCritDMG, hasWeakspot].filter(Boolean).length;

  if (critComponents >= 2) {
    const matchingItems = items.filter(
      (item) =>
        (item.statValues?.critRate ?? 0) > 0 ||
        (item.statValues?.critDMG ?? 0) > 0 ||
        (item.statValues?.weakspotDMG ?? 0) > 0
    );
    matches.push({
      type: "crit_ecosystem",
      items: matchingItems.map((i) => i.name),
      description: `Crit ecosystem: rate=${hasCritRate}, dmg=${hasCritDMG}, weakspot=${hasWeakspot}`,
      score: critComponents * 3.0,
      details: `${critComponents}/3 crit components present — multiplicative damage potential`
    });
  }

  return matches;
}

function detectProcChainCompatibility(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];
  const allKeywords = items.flatMap((item) => getItemKeywords(item));
  const uniqueKeywords = [...new Set(allKeywords)];

  const procFamilies: [string, string[], string[]][] = [
    ["burn -> blast", ["burn", "blaze"], ["blast", "unstable bomber"]],
    ["status -> elemental", ["status", "anomaly"], ["elemental", "element"]],
    ["crit -> weakspot", ["crit", "critical"], ["weakspot", "bullseye"]]
  ];

  for (const [name, familyA, familyB] of procFamilies) {
    const hasA = familyA.some((f) => uniqueKeywords.some((k) => k.includes(f)));
    const hasB = familyB.some((f) => uniqueKeywords.some((k) => k.includes(f)));
    if (hasA && hasB) {
      const matchingItems = items.filter((item) =>
        getItemKeywords(item).some(
          (k) => familyA.some((f) => k.includes(f)) || familyB.some((f) => k.includes(f))
        )
      );
      matches.push({
        type: "proc_chain_compatibility",
        items: matchingItems.map((i) => i.name),
        description: `Proc chain synergy: ${name}`,
        score: 4.0,
        details: `First effect enables or amplifies second effect — multiplicative combo potential`
      });
    }
  }

  return matches;
}

function detectWeaponTypeSynergies(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];
  const weapons = items.filter((item) => item.sourceType === "weapon" && item.weaponType);

  const weaponTypes = weapons.map((w) => w.weaponType!.toLowerCase());
  const uniqueTypes = [...new Set(weaponTypes)];

  const modItems = items.filter((item) => item.sourceType === "mod_core" || item.sourceType === "mod_suffix");

  if (modItems.length > 0 && weapons.length > 0) {
    const modKeywords = modItems.flatMap((item) => getItemKeywords(item));
    const weaponKeywords = weapons.flatMap((item) => getItemKeywords(item));

    const sharedKeywords = modKeywords.filter((mk) =>
      weaponKeywords.some((wk) => wk.includes(mk) || mk.includes(wk))
    );

    if (sharedKeywords.length > 0) {
      matches.push({
        type: "weapon_type_synergy",
        items: [...weapons.map((w) => w.name), ...modItems.map((m) => m.name)],
        description: `Mod-weapon keyword synergy`,
        score: Math.min(sharedKeywords.length * 2.0, 6.0),
        details: `${sharedKeywords.length} shared keyword(s) between weapon and mods`
      });
    }
  }

  if (uniqueTypes.length === 1 && weapons.length > 1) {
    matches.push({
      type: "weapon_type_synergy",
      items: weapons.map((w) => w.name),
      description: `Single weapon type: ${uniqueTypes[0]}`,
      score: 2.0,
      details: `All weapons share "${uniqueTypes[0]}" type — mods and calibration may be reusable`
    });
  }

  return matches;
}

function detectCalibrationSynergy(items: GearItemInput[]): SynergyMatch[] {
  const matches: SynergyMatch[] = [];
  const calibrations = items.filter((item) => item.sourceType === "calibration");

  if (calibrations.length === 0) return matches;

  for (const cal of calibrations) {
    const calKeywords = getItemKeywords(cal);
    const otherItems = items.filter(
      (item) => item.id !== cal.id && item.sourceType !== "calibration"
    );
    const otherKeywords = otherItems.flatMap((item) => getItemKeywords(item));

    const shared = calKeywords.filter((ck) =>
      otherKeywords.some((ok) => ok.includes(ck) || ck.includes(ok))
    );

    if (shared.length > 0) {
      matches.push({
        type: "calibration_synergy",
        items: [cal.name, ...otherItems.map((i) => i.name)],
        description: `Calibration synergy: ${cal.name}`,
        score: shared.length * 2.5,
        details: `Calibration keywords match ${shared.length} item keyword(s) — amplified effect`
      });
    }
  }

  return matches;
}

export function calculateSynergyMultiplier(totalSynergyScore: number, baseScore: number): number {
  if (baseScore <= 0) return 1.0;
  const synergyContribution = totalSynergyScore / 100;
  return 1.0 + synergyContribution;
}
