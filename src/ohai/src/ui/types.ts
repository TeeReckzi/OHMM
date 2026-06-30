export type { CatalogItem } from './data/catalog';

export type GearTier = 1 | 2 | 3 | 4 | 5;
export type BlueprintStars = 1 | 2 | 3 | 4 | 5 | 6;
export type ChefRexSkillRating = 1 | 2 | 3 | 4 | 5;
export type ChefRexActivityRating = 1 | 2 | 3 | 4 | 5;

export type CombatMode = 'pve' | 'pvp';

export type DamageProfile = 'kinetic' | 'burn' | 'frost' | 'shock' | 'unstable-bomber' | 'mixed';

export interface WeaponBlueprint {
 id: string;
 name: string;
 family: string;
 blueprintQuality: 'legendary' | 'epic' | 'rare' | 'common';
 maxStars: BlueprintStars;
 keyword: string;
 damageProfile: DamageProfile;
 iconUrl?: string;
}

export interface AttachmentSelection {
 optic: string;
 muzzle: string;
 magazine: string;
 tactical: string;
 stock: string;
 ammo: string;
}

export interface WeaponSelection {
 blueprintId: string;
 stars: BlueprintStars;
 tier: GearTier;
 calibration: string;
 attachments: AttachmentSelection;
}

export interface ArmorPieceSelection {
 id: string;
 /** Blueprint stars used to craft this armor piece (level of the blueprint) */
 stars?: BlueprintStars;
 /** The tier/quality at which the piece was crafted */
 tier?: GearTier;
}

export interface ArmorSelection {
 head: ArmorPieceSelection | string;
 mask: ArmorPieceSelection | string;
 chest: ArmorPieceSelection | string;
 gloves: ArmorPieceSelection | string;
 pants: ArmorPieceSelection | string;
 boots: ArmorPieceSelection | string;
}

export type ArmorSlot = keyof ArmorSelection;

export function getArmorSelectionId(selection: ArmorPieceSelection | string | undefined): string {
 return typeof selection === 'string' ? selection : selection?.id ?? '';
}

export type LoadoutSlot = 'weapon' | 'head' | 'mask' | 'chest' | 'gloves' | 'pants' | 'boots';

/**
 * A Once Human mod slot has two distinct choices: a core mod and a suffix variant.
 * Legacy slot keys are retained so older saved/default builds still typecheck.
 * New UI should write/read the Core/Suffix keys.
 *
 * The index signature is intentional: saved/default builds may be sparse during
 * migration, and bridge/UI code may index by dynamic slot names.
 */
export type ModSelection = Record<string, string | undefined> & {
 weaponCore?: string;
 weaponSuffix?: string;
 headCore?: string;
 headSuffix?: string;
 maskCore?: string;
 maskSuffix?: string;
 chestCore?: string;
 chestSuffix?: string;
 glovesCore?: string;
 glovesSuffix?: string;
 pantsCore?: string;
 pantsSuffix?: string;
 bootsCore?: string;
 bootsSuffix?: string;

 /** Legacy aliases. Do not use for new UI writes. */
 weapon?: string;
 head?: string;
 mask?: string;
 chest?: string;
 gloves?: string;
 pants?: string;
 boots?: string;
};

/**
 * Explicit core + suffix selection per slot.
 * This is the UI source of truth for mod selection.
 * The legacy flat `mods` map is derived from this at the calculation boundary.
 */
export interface ModSelections {
 weaponCore?: string;
 weaponSuffix?: string;
 headCore?: string;
 headSuffix?: string;
 maskCore?: string;
 maskSuffix?: string;
 chestCore?: string;
 chestSuffix?: string;
 glovesCore?: string;
 glovesSuffix?: string;
 pantsCore?: string;
 pantsSuffix?: string;
 bootsCore?: string;
 bootsSuffix?: string;
}

export interface CradleSelection {
 perks: string[];
}

export interface DeviantSelection {
 id: string;
 level: number;
 activityRating: number;
 trait: string;
}

export interface ChefRexSelection {
 enabled: boolean;
 skillRating: ChefRexSkillRating;
 activityRating: ChefRexActivityRating;
 bonusPercent: number;
 mode: 'rating-derived' | 'manual';
}

export interface FoodBuffSelection {
 food: string;
 drink: string;
 chefRex: ChefRexSelection;
}

export interface BuildSelection {
 id: string;
 label: string;
 role: 'attacker' | 'defender';
 weapon: WeaponSelection;
 armor: ArmorSelection;
 /** Legacy derived map — do not write directly from UI. */
 mods: ModSelection;
 /** Explicit core + suffix selections — UI source of truth (optional during migration). */
 modSelections?: ModSelections;
 cradle: CradleSelection;
 deviant: DeviantSelection;
 food: FoodBuffSelection;
}

export interface EncounterState {
 mode: CombatMode;
 attacker: BuildSelection;
 defender?: BuildSelection;
 targetEnemyType: string;
 simulationEnabled: boolean;
}

export interface ProjectionMetric {
 label: string;
 value: string;
 detail: string;
 status: 'ready' | 'placeholder' | 'blocked';
}
