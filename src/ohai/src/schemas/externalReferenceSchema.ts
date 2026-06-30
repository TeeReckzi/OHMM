import { z } from "zod";

export const referenceTypeSchema = z.enum([
  "game8_mod_reference",
  "external_weapon_reference",
  "external_armor_reference",
  "external_material_reference",
  "unknown_reference"
]);

export const sourceLookupStatusSchema = z.enum([
  "url_generated",
  "slug_missing",
  "base_url_unknown",
  "unavailable",
  "needs_review"
]);

export const knownSourceUrlBases: Record<string, string> = {
  game8: "https://game8.co/games/Once-Human/archives/460076"
};

export const noiseKeywords = [
  "privacy policy", "terms of service", "cookie policy", "legal notice",
  "discord", "twitter", "instagram", "sitemap",
  "palworld", "ark:", "deadlock", "ios", "android",
  "nightingale", "top tft comps", "far far west"
];

export const weaponMetadataStats = z.object({
  classOrSet: z.string().nullable(),
  critRate: z.string().nullable(),
  critDmg: z.string().nullable(),
  weakspotDmg: z.string().nullable()
}).partial();

export const armorMetadataStats = z.object({
  classOrSet: z.string().nullable(),
  hp: z.string().nullable(),
  pollutionResist: z.string().nullable(),
  psiIntensity: z.string().nullable(),
  durability: z.string().nullable(),
  captureCapacity: z.string().nullable(),
  maxLoad: z.string().nullable(),
  heatResist: z.string().nullable(),
  coldResist: z.string().nullable(),
  movementSpeed: z.string().nullable()
}).partial();

export const materialParsedStats = z.object({
  dmgReduction: z.string().nullable(),
  weaponDmg: z.string().nullable(),
  statusDmg: z.string().nullable(),
  elementalDmg: z.string().nullable(),
  critRate: z.string().nullable(),
  critDmg: z.string().nullable(),
  weakspotDmg: z.string().nullable(),
  weakspotDmgReduction: z.string().nullable(),
  nonWeakspotDmgReduction: z.string().nullable(),
  maxHp: z.string().nullable(),
  maxStamina: z.string().nullable(),
  staminaRecoverySpeed: z.string().nullable(),
  sprintSpeed: z.string().nullable(),
  movementSpeed: z.string().nullable(),
  rollSpeed: z.string().nullable(),
  jumpHeight: z.string().nullable(),
  coldResist: z.string().nullable(),
  frostResist: z.string().nullable(),
  heatResist: z.string().nullable(),
  burnResist: z.string().nullable(),
  pollutionResist: z.string().nullable(),
  maxLoad: z.string().nullable(),
  gearDurability: z.string().nullable(),
  yield: z.string().nullable(),
  quality: z.string().nullable(),
  weight: z.string().nullable(),
  stack: z.string().nullable(),
  droppedBy: z.string().nullable(),
  craftSource: z.string().nullable(),
  eternalandTransfer: z.string().nullable(),
  astralSandValue: z.string().nullable()
}).partial();

export const referenceRowSchema = z.object({
  id: z.string(),
  englishName: z.string(),
  referenceType: referenceTypeSchema,
  sourceFilename: z.string(),
  fileId: z.string(),
  sourceSlug: z.string().nullable().default(null),
  generatedSlug: z.string().nullable().default(null),
  sourceLookupStatus: sourceLookupStatusSchema,
  sourceUrlBase: z.string().nullable().default(null),
  canonicalSourceUrl: z.string().nullable().default(null),
  tierClassification: z.string().nullable().default(null),
  metadataDump: z.string().nullable().default(null),
  weaponStats: weaponMetadataStats.nullable().default(null),
  armorStats: armorMetadataStats.nullable().default(null),
  materialStats: materialParsedStats.nullable().default(null),
  gearSlotVariants: z.array(z.record(z.unknown())).nullable().default(null),
  totalVariants: z.number().int().nullable().default(null),
  isNoise: z.boolean().default(false),
  noiseReason: z.string().nullable().default(null),
  confidence: z.enum(["raw_reference_not_verified", "C_outdated_reference"]).default("raw_reference_not_verified")
});

export const referenceFileEntrySchema = z.object({
  sourceFilename: z.string(),
  fileId: z.string(),
  referenceType: referenceTypeSchema,
  detectedRows: z.number().int().nonnegative(),
  noiseRowsFlagged: z.number().int().nonnegative(),
  blankSourceSlugCount: z.number().int().nonnegative(),
  generatedUrlCount: z.number().int().nonnegative(),
  importedAt: z.string()
});

export const externalReferenceIndexSchema = z.object({
  module: z.literal("external_reference_intake"),
  moduleStatus: z.literal("raw_reference_not_verified"),
  locked: z.literal(false),
  verifiedFilesTouched: z.literal(false),
  importedAt: z.string(),
  references: z.array(referenceRowSchema),
  summary: z.object({
    filesDetected: z.number().int().nonnegative(),
    filesImported: z.number().int().nonnegative(),
    weaponReferenceRows: z.number().int().nonnegative(),
    armorReferenceRows: z.number().int().nonnegative(),
    materialReferenceRows: z.number().int().nonnegative(),
    game8ModRows: z.number().int().nonnegative(),
    noiseRowsFlagged: z.number().int().nonnegative(),
    blankSourceSlugCount: z.number().int().nonnegative(),
    generatedUrlCount: z.number().int().nonnegative(),
    missingSourceFiles: z.array(z.string())
  })
});

export type ReferenceRowData = z.infer<typeof referenceRowSchema>;
export type ReferenceFileEntry = z.infer<typeof referenceFileEntrySchema>;
export type ExternalReferenceIndex = z.infer<typeof externalReferenceIndexSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
