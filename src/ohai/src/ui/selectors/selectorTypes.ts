// Selector domain types for Phase 3 loadout board

export type SelectorSlotId =
 // Weapons
 | 'primaryWeapon' | 'secondaryWeapon' | 'meleeWeapon'
 // Support
 | 'deviation' | 'food' | 'drink' | 'cradlePerks' | 'ammo'
 // Weapon configuration
 | 'calibration' | 'optic' | 'muzzle' | 'magazine' | 'tactical' | 'stock'
 // Armor
 | 'helmet' | 'mask' | 'gloves' | 'torso' | 'legs' | 'boots'
 // Mods (core + suffix pairs)
 | 'weaponCoreMod' | 'weaponSuffix'
 | 'helmetCoreMod' | 'helmetSuffix'
 | 'maskCoreMod' | 'maskSuffix'
 | 'glovesCoreMod' | 'glovesSuffix'
 | 'torsoCoreMod' | 'torsoSuffix'
 | 'legsCoreMod' | 'legsSuffix'
 | 'bootsCoreMod' | 'bootsSuffix';

export type SelectorSlotKind =
 | 'weapon' | 'armor' | 'mod' | 'attachment' | 'ammo' | 'support';

export type SelectorItemKind =
 | 'weapon' | 'armor' | 'modCore' | 'modSuffix' | 'attachment' | 'ammo' | 'deviation' | 'food' | 'drink' | 'cradle';

export type ReadinessState =
 | 'READY'
 | 'PARTIAL'
 | 'DISPLAY_ONLY'
 | 'BLOCKED'
 | 'INVALID';

export interface MissingInputReason {
 field: string;
 reason: string;
}

export interface CompatibilityReason {
 slot: SelectorSlotId;
 reason: string;
}

export interface SelectorItemViewModel {
 id: string;
 displayName: string;
 canonicalKey: string;
 kind: SelectorItemKind;
 family?: string;
 mechanic?: string;
 imageUrl?: string;
 confidence?: string;
 sourceLabel?: string;
 readiness: ReadinessState;
 missingInputs: string[];
 blockedReasons: string[];
 warnings: string[];
}

export interface SlotValidationResult {
 slot: SelectorSlotId;
 valid: boolean;
 item?: SelectorItemViewModel;
 missingInputs: string[];
 blockedReasons: string[];
 warnings: string[];
}

export interface BuildValidationResult {
 overallReady: boolean;
 slots: Record<SelectorSlotId, SlotValidationResult>;
 criticalMissing: string[];
 warnings: string[];
}
