import { z } from "zod";
import type { BuildSelection } from "./types";
import { normalizeArmorToBuildKeys } from "./selectors/normalization";
import { deriveCanonicalModIds } from "../resolvers/loadoutEffectResolver";
import { getWeapon } from "./registries/weaponRegistry";
import { getAmmo } from "./registries/ammoRegistry";

export const CURRENT_SCHEMA_VERSION = 1 as const;

const blueprintStarsSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
const gearTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const chefRatingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const attachmentSelectionSchema = z.object({
 optic: z.string(),
 muzzle: z.string(),
 magazine: z.string(),
 tactical: z.string(),
 stock: z.string().default("none"),
 ammo: z.string(),
});

const weaponSelectionSchema = z.object({
 blueprintId: z.string(),
 stars: blueprintStarsSchema,
 tier: gearTierSchema,
 calibration: z.string(),
 attachments: attachmentSelectionSchema,
});

const armorPieceSchema = z.union([
 z.string(),
 z.object({
  id: z.string(),
  stars: blueprintStarsSchema.optional(),
  tier: gearTierSchema.optional(),
 }),
]);

const armorSelectionSchema = z.object({
 head: armorPieceSchema,
 mask: armorPieceSchema,
 chest: armorPieceSchema,
 gloves: armorPieceSchema,
 pants: armorPieceSchema,
 boots: armorPieceSchema,
});

const modSelectionSchema = z.object({
 weaponCore: z.string().default("none"),
 weaponSuffix: z.string().default("none"),
 headCore: z.string().default("none"),
 headSuffix: z.string().default("none"),
 maskCore: z.string().default("none"),
 maskSuffix: z.string().default("none"),
 chestCore: z.string().default("none"),
 chestSuffix: z.string().default("none"),
 glovesCore: z.string().default("none"),
 glovesSuffix: z.string().default("none"),
 pantsCore: z.string().default("none"),
 pantsSuffix: z.string().default("none"),
 bootsCore: z.string().default("none"),
 bootsSuffix: z.string().default("none"),

 // Legacy aliases retained so old saved builds still parse.
 weapon: z.string().optional(),
 head: z.string().optional(),
 mask: z.string().optional(),
 chest: z.string().optional(),
 gloves: z.string().optional(),
 pants: z.string().optional(),
 boots: z.string().optional(),
});

// Explicit core+suffix schema for new builds
const modSelectionsSchema = z.object({
 weaponCore: z.string().optional(),
 weaponSuffix: z.string().optional(),
 headCore: z.string().optional(),
 headSuffix: z.string().optional(),
 maskCore: z.string().optional(),
 maskSuffix: z.string().optional(),
 chestCore: z.string().optional(),
 chestSuffix: z.string().optional(),
 glovesCore: z.string().optional(),
 glovesSuffix: z.string().optional(),
 pantsCore: z.string().optional(),
 pantsSuffix: z.string().optional(),
 bootsCore: z.string().optional(),
 bootsSuffix: z.string().optional(),
}).optional();

const cradleSelectionSchema = z.object({
 perks: z.array(z.string()),
});

const deviantSelectionSchema = z.object({
 id: z.string(),
 level: z.number(),
 activityRating: z.number(),
 trait: z.string(),
});

const chefRexSelectionSchema = z.object({
 enabled: z.boolean(),
 skillRating: chefRatingSchema,
 activityRating: chefRatingSchema,
 bonusPercent: z.number(),
 mode: z.enum(["rating-derived", "manual"]),
});

const foodBuffSelectionSchema = z.object({
 food: z.string(),
 drink: z.string(),
 chefRex: chefRexSelectionSchema,
});

const buildSelectionSchema = z.object({
 id: z.string(),
 label: z.string(),
 role: z.enum(["attacker", "defender"]),
 weapon: weaponSelectionSchema,
 armor: armorSelectionSchema,
 mods: modSelectionSchema,
 modSelections: modSelectionsSchema,
 cradle: cradleSelectionSchema,
 deviant: deviantSelectionSchema,
 food: foodBuffSelectionSchema,
});

export const savedBuildSchema = z.object({
 schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
 buildId: z.string(),
 buildName: z.string().min(1, "Build name is required").max(120),
 createdAt: z.string().datetime(),
 updatedAt: z.string().datetime(),
 gameMode: z.enum(["pve", "pvp"]),
 uptimeProfile: z.string().optional(),
 customAssumptions: z.record(z.unknown()).optional(),
 pveTargetId: z.string().optional(),
 notes: z.string().max(2000).optional(),
 build: buildSelectionSchema,
});

type ParsedSavedBuild = z.infer<typeof savedBuildSchema>;
export type SavedBuild = Omit<ParsedSavedBuild, "build"> & { build: BuildSelection };

export function validateSavedBuild(data: unknown): { success: true; build: SavedBuild } | { success: false; error: string } {
 const result = savedBuildSchema.safeParse(data);
 if (result.success) {
  return { success: true, build: normalizeSavedBuild(result.data) };
 }
 return { success: false, error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") };
}

export function validateImportedBuild(data: unknown): { success: true; build: SavedBuild; reject: false } | { success: false; error: string; reject: boolean } {
 if (typeof data !== "object" || data === null) {
  return { success: false, error: "Imported data is not an object", reject: true };
 }
 const obj = data as Record<string, unknown>;
 if (obj.schemaVersion === undefined) {
  return { success: false, error: "No schemaVersion field — cannot determine compatibility", reject: true };
 }
 if (typeof obj.schemaVersion !== "number") {
  return { success: false, error: "schemaVersion must be a number", reject: true };
 }
 if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
  return { success: false, error: `Build uses schema v${obj.schemaVersion} but this version only supports up to v${CURRENT_SCHEMA_VERSION}. Please update the application.`, reject: true };
 }
 if (obj.schemaVersion < CURRENT_SCHEMA_VERSION) {
  const migrated = migrateSavedBuild(obj);
  if (!migrated) {
   return { success: false, error: `Build uses unsupported schema v${obj.schemaVersion} and migration is not available`, reject: true };
  }
  const validated = validateSavedBuild(migrated);
  if (validated.success) {
   return { success: true, build: validated.build, reject: false };
  }
  return { success: false, error: validated.error, reject: true };
 }
 const validated = validateSavedBuild(data);
 if (validated.success) {
  return { success: true, build: validated.build, reject: false };
 }
 return { success: false, error: validated.error, reject: true };
}

function migrateSavedBuild(data: Record<string, unknown>): Record<string, unknown> | null {
 if (data.schemaVersion === 1) return data;
 return null;
}

function normalizeSavedBuild(build: ParsedSavedBuild): SavedBuild {
 const mods = build.build.mods;
 const normalizedMods = {
  ...mods,
  weaponCore: mods.weaponCore !== "none" ? mods.weaponCore : mods.weapon ?? "none",
  headCore: mods.headCore !== "none" ? mods.headCore : mods.head ?? "none",
  maskCore: mods.maskCore !== "none" ? mods.maskCore : mods.mask ?? "none",
  chestCore: mods.chestCore !== "none" ? mods.chestCore : mods.chest ?? "none",
  glovesCore: mods.glovesCore !== "none" ? mods.glovesCore : mods.gloves ?? "none",
  pantsCore: mods.pantsCore !== "none" ? mods.pantsCore : mods.pants ?? "none",
  bootsCore: mods.bootsCore !== "none" ? mods.bootsCore : mods.boots ?? "none",
 };

 // Handle modSelections migration
 let modSelections = build.build.modSelections;
 if (!modSelections && mods) {
  // Migrate from legacy mods if no explicit modSelections present
  modSelections = {
   weaponCore: normalizedMods.weaponCore !== "none" ? normalizedMods.weaponCore : undefined,
   weaponSuffix: undefined,
   headCore: normalizedMods.headCore !== "none" ? normalizedMods.headCore : undefined,
   headSuffix: undefined,
   maskCore: normalizedMods.maskCore !== "none" ? normalizedMods.maskCore : undefined,
   maskSuffix: undefined,
   chestCore: normalizedMods.chestCore !== "none" ? normalizedMods.chestCore : undefined,
   chestSuffix: undefined,
   glovesCore: normalizedMods.glovesCore !== "none" ? normalizedMods.glovesCore : undefined,
   glovesSuffix: undefined,
   pantsCore: normalizedMods.pantsCore !== "none" ? normalizedMods.pantsCore : undefined,
   pantsSuffix: undefined,
   bootsCore: normalizedMods.bootsCore !== "none" ? normalizedMods.bootsCore : undefined,
   bootsSuffix: undefined,
  };
 }

 return {
  ...build,
  build: {
   ...build.build,
   mods: normalizedMods,
   modSelections,
  },
 };
}

/**
 * Derives the legacy `mods` map from completed `modSelections` only.
 * Incomplete selections produce no entry in the legacy map.
 * This is the single source of truth for the derived compatibility layer.
 */
export function deriveLegacyModsFromSelections(
 modSelections: import('./types').ModSelections | undefined
): import('./types').ModSelection {
 if (!modSelections) return {} as any;

 const result: any = {};
 const slots = ['weapon', 'head', 'mask', 'chest', 'gloves', 'pants', 'boots'] as const;

 for (const slot of slots) {
  const core = (modSelections as any)[`${slot}Core`];
  const suffix = (modSelections as any)[`${slot}Suffix`];
  if (core && suffix) {
   result[slot] = core;
  }
 }
 return result;
}

export function createSavedBuild(params: {
 buildId: string;
 buildName: string;
 gameMode: "pve" | "pvp";
 build: BuildSelection;
 uptimeProfile?: string;
 customAssumptions?: Record<string, unknown>;
 pveTargetId?: string;
 notes?: string;
}): SavedBuild {
 return {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  buildId: params.buildId,
  buildName: params.buildName,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  gameMode: params.gameMode,
  uptimeProfile: params.uptimeProfile,
  customAssumptions: params.customAssumptions,
  pveTargetId: params.pveTargetId,
  notes: params.notes,
  build: params.build,
 };
}

/**
 * sanitizeBuildOnLoad (Sprint C-A)
 *
 * The "customs checkpoint" for any incoming build data:
 * - Share payloads
 * - LocalStorage / persistence loads
 * - Test fixtures / older versions
 * - Future cloud sync
 *
 * Returns structured result with warnings (non-fatal fixes) and errors (fatal).
 * Never throws. Always safe to use.
 *
 * Applies:
 * - Armor slot key normalization (to canonical Build keys)
 * - Mod canonical derivation (prefers modSelections)
 * - Basic unknown ID detection with registry checks (warnings only)
 * - ChefRex bonus consistency check
 * - Delegates to existing normalizeSavedBuild for mod migration
 */
export function sanitizeBuildOnLoad(raw: unknown): {
 build: BuildSelection | null;
 warnings: string[];
 errors: string[];
} {
 const warnings: string[] = [];
 const errors: string[] = [];

 if (!raw || typeof raw !== 'object') {
  errors.push('Input is not an object');
  return { build: null, warnings, errors };
 }

 let candidate: any = raw;

 // If it looks like a SavedBuild envelope, extract the inner build
 if ('build' in candidate && candidate.build && typeof candidate.build === 'object') {
  candidate = candidate.build;
 }

 // Try to get a minimal BuildSelection shape
 const rawBuild: Partial<BuildSelection> = candidate;

 // Updated for modSelections-as-canonical migration:
 // Accept builds that have either legacy mods or new modSelections (or both)
 const hasModData = rawBuild.mods || rawBuild.modSelections;
 if (!rawBuild.weapon || !rawBuild.armor || !hasModData) {
  errors.push('Missing required build sections (weapon/armor + mods or modSelections)');
  return { build: null, warnings, errors };
 }

 // Start with a shallow copy
 let sanitized: any = { ...rawBuild };

 // 1. Armor slot normalization (using new boundary adapters)
 if (sanitized.armor && typeof sanitized.armor === 'object') {
  const { normalized, warnings: armorWarnings } = normalizeArmorToBuildKeys(sanitized.armor);
  sanitized.armor = normalized;
  warnings.push(...armorWarnings);
  if (armorWarnings.length > 0) {
   warnings.push('Armor slots were normalized to canonical BuildSelection keys (head/chest/pants etc.)');
  }
 }

 // 2. Mod canonical (reuse the derive we have for consistency)
 try {
  const canonicalModIds = deriveCanonicalModIds(sanitized as BuildSelection);
  // We don't overwrite here (to keep UI shape), but we can warn if divergence detected
  const legacyModCount = Object.values(sanitized.mods || {}).filter(Boolean).length;
  if (legacyModCount > 0 && canonicalModIds.length === 0) {
   warnings.push('Legacy mods present but no active modSelections derived - possible stale data');
  }
 } catch (e) {
  warnings.push('Failed to derive canonical mods during sanitization');
 }

 // 3. ChefRex bonus consistency
 if (sanitized.food?.chefRex) {
  const cr = sanitized.food.chefRex;
  if (cr.mode === 'rating-derived' && cr.skillRating && cr.activityRating) {
   // We can re-derive to check
   // (import would cycle, so simple heuristic)
   const expected = Math.min(42, Math.round((20 + (cr.skillRating - 1) * 3.5 + (cr.activityRating - 1) * 2) * 10) / 10);
   if (Math.abs((cr.bonusPercent || 0) - expected) > 1) {
    warnings.push(`ChefRex bonusPercent (${cr.bonusPercent}) did not match derived value from ratings (${expected}). May have been manually overridden or from old version.`);
    // Do not auto-fix unless mode allows; just warn
   }
  }
 }

 // 4. Registry-based ID sanity (warnings only, never drop data)
 try {
  if (sanitized.weapon?.blueprintId) {
   const w = getWeapon(sanitized.weapon.blueprintId);
   if (!w) {
    warnings.push(`Unknown weapon blueprintId "${sanitized.weapon.blueprintId}" - will fall back at runtime`);
   }
  }

  const ammoId = sanitized.weapon?.attachments?.ammo;
  if (ammoId && ammoId !== 'none') {
   const a = getAmmo(ammoId);
   if (!a) {
    warnings.push(`Unknown ammo id "${ammoId}" in weapon attachments`);
   }
  }
 } catch (e) {
  // Registries not available in this context (e.g. some tests) - skip with warning
  warnings.push('Registry lookup skipped during sanitization: ' + (e as Error).message);
 }

 // 5. Delegate to existing normalize for mod migration logic
 // Wrap as minimal Saved to reuse normalizeSavedBuild logic
 const wrappedForNormalize = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  buildId: sanitized.id || 'sanitized',
  buildName: sanitized.label || 'Sanitized Build',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  gameMode: 'pvp' as const,
  build: sanitized,
 };

 try {
  const normalized = normalizeSavedBuild(wrappedForNormalize as any);
  sanitized = normalized.build;
  // The existing normalizer may have added warnings implicitly via its logic
 } catch (e) {
  warnings.push('Existing mod normalization step encountered an issue: ' + (e as Error).message);
 }

 // Final shape guarantee
 const finalBuild: BuildSelection = {
  id: sanitized.id || `sanitized-${Date.now()}`,
  label: sanitized.label || 'Imported Build',
  role: (sanitized.role === 'attacker' || sanitized.role === 'defender') ? sanitized.role : 'attacker',
  weapon: sanitized.weapon || { blueprintId: 'none', stars: 3, tier: 4, calibration: '', attachments: { optic: 'none', muzzle: 'none', magazine: 'none', tactical: 'none', stock: 'none', ammo: 'none' } },
  armor: sanitized.armor || { head: '', mask: '', chest: '', gloves: '', pants: '', boots: '' },
  mods: sanitized.mods || {},
  modSelections: sanitized.modSelections,
  cradle: sanitized.cradle || { perks: [] },
  deviant: sanitized.deviant || { id: 'none', level: 1, activityRating: 1, trait: '' },
  food: sanitized.food || { food: 'none', drink: 'none', chefRex: { enabled: false, skillRating: 1, activityRating: 1, bonusPercent: 0, mode: 'manual' } },
 };

 return {
  build: finalBuild,
  warnings,
  errors,
 };
}
