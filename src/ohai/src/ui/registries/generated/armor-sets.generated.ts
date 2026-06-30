import type { CanonicalArmor } from "../../itemTypes";

/**
 * Armor set metadata — 22 sets with owner-approved terminology (A_project_verified).
 * Each set has 4 tier effects. Per-piece slot data is merged from the armor registry.
 *
 * Auto-generated from data/verified/armor-sets.verified.json
 */
export interface ArmorSetMeta {
  name: string;
}

export const armorSetMetaMap: Record<string, ArmorSetMeta> = {
    "Lone Wolf": { name: "Lone Wolf" },
    "Blackstone": { name: "Blackstone" },
    "Blackstone (Heat)": { name: "Blackstone (Heat)" },
    "Blackstone (Cold)": { name: "Blackstone (Cold)" },
    "Bastille": { name: "Bastille" },
    "Renegade": { name: "Renegade" },
    "Stormweaver": { name: "Stormweaver" },
    "Savior": { name: "Savior" },
    "Shelterer": { name: "Shelterer" },
    "Treacherous Tides": { name: "Treacherous Tides" },
    "Gravity Tide": { name: "Gravity Tide" },
    "Dark Resonance": { name: "Dark Resonance" },
    "Agent": { name: "Agent" },
    "Heavy Duty": { name: "Heavy Duty" },
    "Falcon": { name: "Falcon" },
    "Snow Leopard": { name: "Snow Leopard" },
    "Raid": { name: "Raid" },
    "Blast": { name: "Blast" },
    "Scout": { name: "Scout" },
    "Test Subject": { name: "Test Subject" },
    "Rustic": { name: "Rustic" },
    "Rustic (Tundra)": { name: "Rustic (Tundra)" },
};

/**
 * Set names for use in armor piece registry entries.
 */
export const armorSetNames: string[] = [
  "Lone Wolf",
  "Blackstone",
  "Blackstone (Heat)",
  "Blackstone (Cold)",
  "Bastille",
  "Renegade",
  "Stormweaver",
  "Savior",
  "Shelterer",
  "Treacherous Tides",
  "Gravity Tide",
  "Dark Resonance",
  "Agent",
  "Heavy Duty",
  "Falcon",
  "Snow Leopard",
  "Raid",
  "Blast",
  "Scout",
  "Test Subject",
  "Rustic",
  "Rustic (Tundra)",
];
