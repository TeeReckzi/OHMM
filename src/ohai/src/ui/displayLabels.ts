export const UI_SYMBOLS = {
 star: "★",
 separator: "•",
 bullet: "•",
} as const;

const KEYWORD_LABELS: Record<string, string> = {
 ar: "Assault Rifle",
 burn: "Burn / Blaze",
 blaze: "Burn / Blaze",
 bounce: "Bounce",
 bullseye: "Bullseye",
 crit: "Critical Hits",
 elemental: "Elemental Damage",
 fastgunner: "Fast Gunner",
 fastGunner: "Fast Gunner",
 frost: "Frost",
 frostvortex: "Frost Vortex",
 frostVortex: "Frost Vortex",
 kinetic: "Kinetic",
 powerSurge: "Power Surge",
 powersurge: "Power Surge",
 shrapnel: "Shrapnel",
 shock: "Shock",
 status: "Status Effects",
 unstableBomber: "Unstable Bomber",
 unstablebomber: "Unstable Bomber",
 weakspot: "Weakspot Hits",
};

const FAMILY_LABELS: Record<string, string> = {
 ar: "Assault Rifle",
 assault_rifl: "Assault Rifle",
 assault_rifle: "Assault Rifle",
 assaultRifle: "Assault Rifle",
 "Assault Rifle": "Assault Rifle",
 bow: "Bow",
 crossbow: "Crossbow",
 Crossbow: "Crossbow",
 lmg: "LMG",
 LMG: "LMG",
 light_machine_gun: "LMG",
 melee: "Melee",
 Melee: "Melee",
 pistol: "Pistol",
 Pistol: "Pistol",
 rifle: "Assault Rifle",
 shotgun: "Shotgun",
 Shotgun: "Shotgun",
 smg: "SMG",
 smgs: "SMG",
 SMG: "SMG",
 sniper: "Sniper Rifle",
 sniper_rifles: "Sniper Rifle",
 "Sniper Rifle": "Sniper Rifle",
 Sniper: "Sniper Rifle",
 sr: "Sniper Rifle",
};

function normalizeKey(value: string): string {
 return value.trim().replace(/[\s-]+/g, "_");
}

function titleCase(value: string): string {
 return value
  .replace(/[_-]+/g, " ")
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function displayKeywordLabel(value: string | undefined): string {
 if (!value) return "General";
 return KEYWORD_LABELS[value] ?? KEYWORD_LABELS[normalizeKey(value)] ?? KEYWORD_LABELS[value.toLowerCase()] ?? titleCase(value);
}

export function displayWeaponFamilyLabel(value: string | undefined): string {
 if (!value) return "—";
 return FAMILY_LABELS[value] ?? FAMILY_LABELS[normalizeKey(value)] ?? FAMILY_LABELS[value.toLowerCase()] ?? titleCase(value);
}

export function displayTagLabel(value: string | undefined): string {
 if (!value) return "—";
 return displayKeywordLabel(value);
}
