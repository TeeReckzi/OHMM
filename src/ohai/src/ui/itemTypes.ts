import type { CanonicalVerificationMetadata } from "../verification/verificationMetadata";
import type { DamageModelHypothesis } from "../engine/formulaTypes";

export type ConfidenceLevel = "verified" | "observed" | "estimated" | "experimental" | "placeholder";

export type ItemCategory =
 | "weapon" | "armor" | "key_gear" | "mod"
 | "food" | "drink" | "deviation" | "cradle_perk" | "pve_target"
 | "attachment";

export type SourceType = "game" | "screenshot" | "community" | "database" | "manual" | "test" | "unknown";

export type FormulaSupportStatus = "fully-modeled" | "partially-modeled" | "display-only" | "unmodeled";

export interface FormulaSupport {
 status: FormulaSupportStatus;
 notes?: string;
 modeledStatCoverage?: string[];
 unresolvedMechanics?: string[];
 simulationWarnings?: string[];
 modelSelection?: DamageModelHypothesis;
}

export interface SourceMetadata {
 sourceType: SourceType;
 sourceName?: string;
 sourceUrl?: string;
 extractedFrom?: string;
 lastVerified?: string;
 verificationNotes?: string;
}

export interface StatModifier {
 stat: string;
 value: number;
 unit?: "percent" | "flat" | "rating";
 /** Tier values for stars 1-5 (from verified JSON data). Undefined if unknown. */
 tierValues?: number[];
}

export interface BaseCanonicalItem {
 id: string;
 name: string;
 originalName?: string;
 category: ItemCategory;
 subcategory?: string;
 tags: string[];
 keywordAssociations?: string[];
 effectSummary: string;
 statModifiers?: StatModifier[];
 confidence: ConfidenceLevel;
 needsReview: boolean;
 sourceNotes?: string;
 sourceMetadata?: SourceMetadata;
 verification?: CanonicalVerificationMetadata;
 formulaSupport?: FormulaSupport;
 /** URL to the item's icon/image. Absent = no image confirmed yet. */
 iconUrl?: string;
}

export type AmmoCategory = "copper" | "steel" | "ap" | "demolition" | "arrow" | "none";

export interface CanonicalWeapon extends BaseCanonicalItem {
 category: "weapon";
 family: string;
 blueprintQuality: "legendary" | "epic" | "rare" | "common";
 maxStars: 1 | 2 | 3 | 4 | 5 | 6;
 damageProfile: string;
 allowedAmmoCategories: AmmoCategory[];
 defaultAmmoCategory: AmmoCategory;
 disallowedAmmoCategories?: AmmoCategory[];
 /** Per-projectile base damage from game data */
 damagePerProjectile?: number;
 /** Projectiles fired per shot */
 projectilesPerShot?: number;
 /** Fire rate in rounds per minute */
 fireRate?: number;
 /** Base magazine capacity */
 magazineCapacity?: number;
 /** Crit rate as a percent (e.g. 6 = 6%) */
 critRatePercent?: number;
 /** Crit damage as a percent (e.g. 30 = 30%) */
 critDamagePercent?: number;
 /** Weakspot damage as a percent (e.g. 55 = 55%) */
 weakspotDamagePercent?: number;
 /** Reload time in seconds */
 reloadTimeSeconds?: number;
 /** Ammo type string (e.g. "Rifle Ammo", "Arrow") */
 ammoType?: string;
}

export interface CanonicalArmor extends BaseCanonicalItem {
 category: "armor";
 slot: "head" | "mask" | "chest" | "gloves" | "pants" | "boots";
 armorSet?: string;
}

export interface CanonicalKeyGear extends BaseCanonicalItem {
 category: "key_gear";
 slot: "gloves" | "boots" | "mask" | "head" | "chest" | "pants";
 affectedMechanics?: string[];
}

export interface CanonicalMod extends BaseCanonicalItem {
 category: "mod";
 modSlot: "weapon" | "head" | "mask" | "chest" | "gloves" | "pants" | "boots";
 modType: "core" | "suffix";
}

export interface CanonicalFoodBuff extends BaseCanonicalItem {
 category: "food" | "drink";
 buffType?: "offensive" | "defensive" | "utility" | "resist" | "crafting" | "healing";
 durationSeconds?: number;
 ingredients?: string[];
}

export interface CanonicalDeviation extends BaseCanonicalItem {
 category: "deviation";
 deviationRole: "combat" | "support" | "crafting" | "defensive" | "utility" | "collectible";
 activityRating?: number;
}

export type CradleUnlockGroup =
 | "weapon-mastery" | "offense" | "status-elemental"
 | "defense-support" | "melee" | "special";

export type CradleEffectType =
 | "statBuff" | "conditionalBuff" | "stackingBuff"
 | "trigger" | "proc" | "defensive" | "utility";

export interface CanonicalCradlePerk extends BaseCanonicalItem {
 category: "cradle_perk";
 perkType: "weapon" | "survival" | "deviant" | "status" | "combat" | "special";
 maxLevel?: number;
 unlockGroup: CradleUnlockGroup;
 rowGroup: string;
 displayOrder: number;
 weaponClassTags?: string[];
 effectType: CradleEffectType;
 formulaCandidateStats?: string[];
 unresolvedMechanics?: string[];
 sourceFramePath?: string;
 tooltipCropPath?: string;
}

export interface CanonicalPvETarget extends BaseCanonicalItem {
 category: "pve_target";
 targetType: "boss" | "elite" | "trash" | "training_dummy";
 faction?: string;
 recommendedLevel?: number;
}

export type AttachmentSlot = "optic" | "muzzle" | "magazine" | "tactical" | "stock";

export interface CanonicalAttachment extends BaseCanonicalItem {
 category: "attachment";
 attachmentSlot: AttachmentSlot;
 rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
 iconUrl?: string;
}

export type AnyCanonicalItem =
 | CanonicalWeapon | CanonicalArmor | CanonicalKeyGear
 | CanonicalMod | CanonicalFoodBuff | CanonicalDeviation
 | CanonicalCradlePerk | CanonicalPvETarget | CanonicalAttachment;
