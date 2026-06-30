import type { AmmoCategory, SourceMetadata } from "../itemTypes";

export type AmmoConfidence = "verified" | "observed" | "estimated" | "experimental";

export interface AmmoDefinition {
 id: string;
 name: string;
 ammoCategory: AmmoCategory;
 compatibleWeaponFamilies: string[];
 compatibleWeaponIds?: string[];
 incompatibleWeaponIds?: string[];
 damageModifier?: number;
 confidence: AmmoConfidence;
 needsReview: boolean;
 sourceNotes?: string;
 sourceMetadata?: SourceMetadata;
}

export const ammoRegistry: AmmoDefinition[] = [
 {
  id: "copper-ammo",
  name: "Copper Ammo",
  ammoCategory: "copper",
  compatibleWeaponFamilies: ["Pistol", "SMG", "Submachine Gun", "Assault Rifle", "Rifle", "LMG", "Light Machine Gun", "Shotgun", "Sniper Rifle"],
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Basic ammo type. Available for all firearm weapon families.",
 },
 {
  id: "steel-ammo",
  name: "Steel Ammo",
  ammoCategory: "steel",
  compatibleWeaponFamilies: ["Pistol", "SMG", "Submachine Gun", "Assault Rifle", "Rifle", "LMG", "Light Machine Gun", "Shotgun", "Sniper Rifle"],
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Upgraded ammo type. Available for all firearm weapon families.",
 },
 {
  id: "ap-ammo",
  name: "AP Ammo",
  ammoCategory: "ap",
  compatibleWeaponFamilies: ["Pistol", "SMG", "Submachine Gun", "Assault Rifle", "Rifle", "LMG", "Light Machine Gun", "Shotgun", "Sniper Rifle"],
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Armor-piercing ammo. Available for all firearm weapon families.",
 },
 {
  id: "demolition-ammo",
  name: "Demolition Ammo",
  ammoCategory: "demolition",
  compatibleWeaponFamilies: ["Pistol", "SMG", "Submachine Gun", "Assault Rifle", "Rifle", "LMG", "Light Machine Gun", "Shotgun", "Sniper Rifle"],
  confidence: "observed",
  needsReview: false,
  sourceNotes: "Explosive ammo. Available for all firearm weapon families.",
 },
 {
  id: "arrow",
  name: "Arrow / Bolt",
  ammoCategory: "arrow",
  compatibleWeaponFamilies: ["Crossbow", "Bow"],
  confidence: "verified",
  needsReview: false,
  sourceNotes: "Wooden baseline arrow. Bows and crossbows can also use copper/steel/AP/demolition arrows.",
 },
 {
  id: "none",
  name: "No Ammo Required",
  ammoCategory: "none",
  compatibleWeaponFamilies: [],
  compatibleWeaponIds: [],
  confidence: "verified",
  needsReview: false,
  sourceNotes: "This category is used for weapons and abilities that do not require ammunition (melee weapons, certain deviation skills). No ammo selection is possible.",
 },
];

export function getAmmo(id: string): AmmoDefinition | undefined {
 return ammoRegistry.find((a) => a.id === id);
}

export function getAmmoByCategory(category: AmmoCategory): AmmoDefinition[] {
 return ammoRegistry.filter((a) => a.ammoCategory === category);
}

export function isAmmoCompatible(weaponAmmoCategory: AmmoCategory, ammoCategory: AmmoCategory): boolean {
 if (weaponAmmoCategory === "none") return ammoCategory === "none";
 return weaponAmmoCategory === ammoCategory;
}
