import { noiseKeywords, knownSourceUrlBases } from "../schemas/externalReferenceSchema";

export function generateSlug(englishName: string): string | null {
  return englishName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || null;
}

export function isNoiseRow(englishName: string): { isNoise: boolean; reason: string | null } {
  const lowered = englishName.toLowerCase().trim();
  for (const keyword of noiseKeywords) {
    if (lowered.includes(keyword)) {
      return { isNoise: true, reason: `Matches noise keyword: "${keyword}"` };
    }
  }
  return { isNoise: false, reason: null };
}

export function determineSourceLookupStatus(
  sourceSlug: string | null | undefined,
  sourceUrlBase: string | null | undefined
): "url_generated" | "slug_missing" | "base_url_unknown" | "unavailable" {
  if (sourceSlug && sourceUrlBase) return "url_generated";
  if (!sourceSlug && sourceUrlBase) return "slug_missing";
  if (!sourceUrlBase) return "base_url_unknown";
  return "unavailable";
}

export function buildCanonicalSourceUrl(
  sourceUrlBase: string | null,
  sourceSlug: string | null
): string | null {
  if (!sourceUrlBase || !sourceSlug) return null;
  return `${sourceUrlBase.replace(/\/+$/, "")}/${sourceSlug.replace(/^\/+/, "")}`;
}

export function parseWeaponMetadata(metadataDump: string | null): {
  classOrSet: string | null;
  critRate: string | null;
  critDmg: string | null;
  weakspotDmg: string | null;
} {
  const result = { classOrSet: null as string | null, critRate: null as string | null, critDmg: null as string | null, weakspotDmg: null as string | null };
  if (!metadataDump || metadataDump === "No extra stat metadata" || metadataDump === "No extra item metadata") return result;

  const parts = metadataDump.split("|").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx !== -1) {
      const key = part.slice(0, colonIdx).trim();
      const val = part.slice(colonIdx + 1).trim();
      const lowered = key.toLowerCase();
      if (lowered.includes("crit rate")) result.critRate = val;
      else if (lowered.includes("crit dmg") || lowered.includes("crit damage")) result.critDmg = val;
      else if (lowered.includes("weakspot dmg") || lowered.includes("weakspot damage")) result.weakspotDmg = val;
    }
  }

  const subclasses = ["beyonder", "wanderer", "juggernaut", "operator", "huntsman", "stranger", "unknown"];
  for (const part of parts) {
    const lowered = part.toLowerCase();
    for (const sc of subclasses) {
      if (lowered === sc) {
        result.classOrSet = part;
        break;
      }
    }
    if (result.classOrSet) break;
  }

  const firstPipeData = metadataDump.split("|").map((p) => p.trim()).filter(Boolean);
  for (const datum of firstPipeData) {
    if (/^\d/.test(datum) || /^(hp|psi|cold|heat|max|crit|weakspot|dmg|status|elemental|melee|impact|mining|logging|berry|egg|herb|grain|poultry|rabbit|deer|beef|goat|pork|mushroom|feather|gold|roll|jump|movement|sprint|swim|climb|vault|stamina|load|pollution|durability|capture)/i.test(datum)) {
      continue;
    }
    const lowered = datum.toLowerCase();
    for (const sc of subclasses) {
      if (lowered === sc || lowered.startsWith(sc)) {
        result.classOrSet = datum;
        break;
      }
    }
    if (result.classOrSet) break;
  }

  return result;
}

export function parseArmorMetadata(metadataDump: string | null): {
  classOrSet: string | null;
  hp: string | null;
  pollutionResist: string | null;
  psiIntensity: string | null;
  durability: string | null;
  captureCapacity: string | null;
  maxLoad: string | null;
  heatResist: string | null;
  coldResist: string | null;
  movementSpeed: string | null;
} {
  const result = {
    classOrSet: null as string | null,
    hp: null as string | null,
    pollutionResist: null as string | null,
    psiIntensity: null as string | null,
    durability: null as string | null,
    captureCapacity: null as string | null,
    maxLoad: null as string | null,
    heatResist: null as string | null,
    coldResist: null as string | null,
    movementSpeed: null as string | null
  };

  if (!metadataDump || metadataDump === "No extra stats metadata" || metadataDump === "No extra item metadata") return result;

  const parts = metadataDump.split("|").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx !== -1) {
      const key = part.slice(0, colonIdx).trim();
      const val = part.slice(colonIdx + 1).trim();
      const lowered = key.toLowerCase();
      if (lowered === "hp") result.hp = val;
      else if (lowered.includes("pollution resist")) result.pollutionResist = val;
      else if (lowered.includes("psi intensity")) result.psiIntensity = val;
      else if (lowered === "durability") result.durability = val;
      else if (lowered.includes("capture capacity")) result.captureCapacity = val;
      else if (lowered.includes("max load")) result.maxLoad = val;
      else if (lowered.includes("heat resist")) result.heatResist = val;
      else if (lowered.includes("cold resist")) result.coldResist = val;
      else if (lowered.includes("movement speed")) result.movementSpeed = val;
    }
  }

  const subclasses = ["beyonder", "wanderer", "juggernaut", "operator", "huntsman", "stranger"];
  for (const part of parts) {
    const lowered = part.toLowerCase();
    for (const sc of subclasses) {
      if (lowered === sc) {
        result.classOrSet = part;
        break;
      }
    }
    if (result.classOrSet) break;
  }

  return result;
}

export function parseMaterialEffectDetails(effectDetails: string): Record<string, string | null> {
  const stats: Record<string, string | null> = {
    dmgReduction: null,
    weaponDmg: null,
    statusDmg: null,
    elementalDmg: null,
    critRate: null,
    critDmg: null,
    weakspotDmg: null,
    weakspotDmgReduction: null,
    nonWeakspotDmgReduction: null,
    maxHp: null,
    maxStamina: null,
    staminaRecoverySpeed: null,
    sprintSpeed: null,
    movementSpeed: null,
    rollSpeed: null,
    jumpHeight: null,
    coldResist: null,
    frostResist: null,
    heatResist: null,
    burnResist: null,
    pollutionResist: null,
    maxLoad: null,
    gearDurability: null,
    yield: null,
    quality: null,
    weight: null,
    stack: null,
    droppedBy: null,
    craftSource: null,
    eternalandTransfer: null,
    astralSandValue: null
  };

  if (!effectDetails) return stats;

  const weightMatch = effectDetails.match(/\|\s*Weight:\s*([\d.]+)/);
  if (weightMatch) stats.weight = weightMatch[1];

  const stackMatch = effectDetails.match(/\|\s*Stack:\s*(\d+)/);
  if (stackMatch) stats.stack = stackMatch[1];

  const droppedByMatch = effectDetails.match(/\|\s*Dropped By:\s*(.+?)(?:\s*\|)/);
  if (droppedByMatch) stats.droppedBy = droppedByMatch[1].trim();

  const eternalandMatch = effectDetails.match(/\|\s*Eternaland[:\s]+(?:Transfer:\s*)?(.+?)(?:\s*\|)/);
  if (eternalandMatch) stats.eternandTransfer = eternalandMatch[1].trim();

  const astralMatch = effectDetails.match(/\|\s*Astral Sand Value:\s*(.+?)(?:\s*\|)/);
  if (astralMatch) stats.astralSandValue = astralMatch[1].trim();

  const qualityMatch = effectDetails.match(/\|\s*Quality:\s*(\d+)/);
  if (qualityMatch) stats.quality = qualityMatch[1];

  const craftMatch = effectDetails.match(/\|\s*Craft (?:on|at)\s+(.+?)(?:\s*\|)/);
  if (craftMatch) stats.craftSource = craftMatch[1].trim();

  const durMatch = effectDetails.match(/Gear Durability\s*([+-]\s*[\d.]+%?)/);
  if (durMatch) stats.gearDurability = durMatch[1].trim();

  const effectPart = effectDetails.split("|")[0] || "";

  const patternMap: Array<{ key: string; regex: RegExp }> = [
    { key: "dmgReduction", regex: /\bDMG Reduction\s*([+-]\s*[\d.]+%?)/i },
    { key: "weaponDmg", regex: /\bWeapon DMG\s*([+-]\s*[\d.]+%?)/i },
    { key: "statusDmg", regex: /\bStatus DMG\s*([+-]\s*[\d.]+%?)/i },
    { key: "elementalDmg", regex: /\bElemental DMG\s*([+-]\s*[\d.]+%?)/i },
    { key: "critRate", regex: /\bCrit Rate\s*([+-]\s*[\d.]+%?)/i },
    { key: "critDmg", regex: /\bCrit DMG\s*([+-]\s*[\d.]+%?)/i },
    { key: "weakspotDmg", regex: /\bWeakspot DMG\s*([+-]\s*[\d.]+%?)/i },
    { key: "weakspotDmgReduction", regex: /\bWeakspot DMG Reduction\s*([+-]\s*[\d.]+%?)/i },
    { key: "nonWeakspotDmgReduction", regex: /\bNon-Weakspot DMG Reduction\s*([+-]\s*[\d.]+%?)/i },
    { key: "maxHp", regex: /\bMax HP\s*([+-]\s*\d+)/i },
    { key: "maxStamina", regex: /\bMax Stamina\s*([+-]\s*\d+)/i },
    { key: "staminaRecoverySpeed", regex: /\bStamina Recovery Speed\s*([+-]\s*[\d.]+%?)/i },
    { key: "sprintSpeed", regex: /\bSprint Speed\s*([+-]\s*[\d.]+%?)/i },
    { key: "movementSpeed", regex: /\bMovement Speed\s*([+-]\s*[\d.]+%?)/i },
    { key: "rollSpeed", regex: /\bRoll Speed\s*([+-]\s*[\d.]+%?)/i },
    { key: "jumpHeight", regex: /\bJump Height\s*([+-]\s*[\d.]+%?)/i },
    { key: "coldResist", regex: /\bCold Resist\s*([+-]\s*\d+)/i },
    { key: "frostResist", regex: /\bFrost Resist\s*([+-]\s*\d+)/i },
    { key: "heatResist", regex: /\bHeat Resist\s*([+-]\s*\d+)/i },
    { key: "burnResist", regex: /\bBurn Resist\s*([+-]\s*\d+)/i },
    { key: "pollutionResist", regex: /\bPollution Resist\s*([+-]\s*\d+)/i },
    { key: "maxLoad", regex: /\bMax Load\s*([+-]\s*\d+)/i },
    { key: "yield", regex: /\byield\s*([+-]\s*[\d.]+%?)/i },
  ];

  for (const { key, regex } of patternMap) {
    const match = effectPart.match(regex);
    if (match) {
      stats[key] = match[1].trim();
    }
  }

  return stats;
}

export function deriveGearSlotVariantsStats(
  gearSlotVariants: Array<Record<string, unknown>> | null | undefined
): Record<string, string | null> {
  const aggregated: Record<string, string | null> = {};
  if (!gearSlotVariants || gearSlotVariants.length === 0) return aggregated;

  const allStats: Array<Record<string, string | null>> = [];
  for (const variant of gearSlotVariants) {
    const effectDetails = typeof variant.effect_details === "string" ? variant.effect_details : "";
    allStats.push(parseMaterialEffectDetails(effectDetails));
  }

  const keysToCollect = [
    "dmgReduction", "weaponDmg", "statusDmg", "elementalDmg",
    "critRate", "critDmg", "weakspotDmg", "weakspotDmgReduction",
    "nonWeakspotDmgReduction", "maxHp", "maxStamina",
    "staminaRecoverySpeed", "sprintSpeed", "movementSpeed",
    "rollSpeed", "jumpHeight", "coldResist", "frostResist",
    "heatResist", "burnResist", "pollutionResist", "maxLoad",
    "gearDurability", "yield", "quality", "weight", "stack",
    "droppedBy", "craftSource", "eternandTransfer", "astralSandValue"
  ];

  for (const key of keysToCollect) {
    const values = allStats.map((s) => s[key]).filter(Boolean);
    if (values.length > 0) {
      aggregated[key] = [...new Set(values)].join("; ");
    }
  }

  return aggregated;
}
