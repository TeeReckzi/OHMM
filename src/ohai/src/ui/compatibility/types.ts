// src/ui/compatibility/types.ts

export type LegalityStatus = "VALID" | "WARNING" | "INVALID";

export interface LegalityIssue {
 code: string;      // e.g. "ATTACHMENT_INCOMPATIBLE", "MISSING_SUFFIX", "WRONG_ARMOR_SLOT"
 message: string;    // Human-readable explanation
 severity: "error" | "warning";
}

export interface LegalityResult {
 status: LegalityStatus;
 issues: LegalityIssue[];
 /** Optional metadata for UI (e.g. suggested alternatives) */
 meta?: Record<string, any>;
}

export interface LoadoutContext {
 primaryWeaponId: string;
 secondaryWeaponId?: string;
 meleeWeaponId?: string;

 armor: {
  helmet?: string;
  mask?: string;
  gloves?: string;
  torso?: string;
  legs?: string;
  boots?: string;
 };

 mods: Record<string, {
  core?: string;
  suffix?: string;
 }>;

 attachments: {
  optic?: string;
  muzzle?: string;
  magazine?: string;
  tactical?: string;
  stock?: string;
 };

 ammo?: string;
 calibration?: string;
}

// Main engine interface
export interface ILoadoutLegalityEngine {
 /**
  * Validate a single item for a specific slot
  */
 validateItemForSlot(
  slot: string,
  itemId: string,
  context: LoadoutContext
 ): LegalityResult;

 /**
  * Validate an entire build/loadout
  */
 validateLoadout(context: LoadoutContext): Record<string, LegalityResult>;

 /**
  * Check if a mod is complete (core + suffix)
  */
 isModComplete(slot: string, context: LoadoutContext): boolean;

 /**
  * Get suggested valid alternatives for a slot
  */
 getValidAlternatives(slot: string, context: LoadoutContext): string[];
}
