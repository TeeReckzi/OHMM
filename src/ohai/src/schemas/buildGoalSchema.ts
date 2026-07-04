import { z } from "zod";

export const importConfidenceSchema = z.enum([
  "B_pending_verification",
  "B_rules_registry_pending_formula_validation"
]);

export const statKeySchema = z.enum([
  // ── Flat base damage ──
  "weaponDMGFlat",
  "meleeDMGFlat",

  // ── Percent bonuses ──
  "weaponDMGBonus",
  "statusDMGBonus",
  "elementalDMGBonus",
  "burnDMGBonus",
  "frostVortexDMGBonus",
  "powerSurgeDMGBonus",
  "unstableBomberDMGBonus",
  "shrapnelDMGBonus",
  "shrapnelCritDMGBonus",
  "bounceDMGBonus",
  "meleeDMGBonus",
  "keywordSuffixDMGBonus",
  "enemyTypeDMGBonus",
  "attackPercent",
  "humanDamageBonus",

  // ── Crit / Weakspot ──
  "critRate",
  "critDMG",
  "weakspotDMG",

  // ── Rate / speed ──
  "fireRate",
  "reloadSpeed",
  "reloadEfficiency",
  "magazineCapacity",
  "movementSpeedBonus",
  "medicineSpeedBonus",

  // ── Psi / anomaly ──
  "psiIntensity",
  "superAnomalyStrength",

  // ── Defensive incoming ──
  "maxHP",
  "hpRecovery",
  "shield",
  "shieldStrength",
  "dmgReduction",
  "playerDMGReduction",
  "weaponDMGReduction",
  "statusDMGReduction",
  "weakspotDMGReduction",
  "critDMGReduction",
  "deviantDMGReduction",

  // ── Healing / utility ──
  "healingReceived",
  "medicineEffectBonus",
  "movementSpeed",
  "stamina",
  "resistances",
  "foodDuration",
  "deviationSupport",

  // ── Vulnerabilities (target debuffs) ──
  "weaponVulnerability",
  "statusVulnerability",

  // ── Keyword group bonuses (condition-encoded) ──
  "dotEffectDMGBonus",
  "instantEffectDMGBonus",

  // ── Marked target conditionals (Bullseye/Hunter's Mark) ──
  "markedTargetDMGBonus",
  "markedTargetCritDMGBonus",
  "markedTargetWeakspotDMGBonus",

  // ── Target-keyword conditionals ──
  "damageVsPowerSurgeTargetBonus",

  // ── Zone-gated bonuses ──
  "fortressWarfareZoneDMGBonus",

  // ── DoT mechanics ──
  "burnCurrentStacks",
  "burnTickFrequencyBonus",
  "flatBurnBonus",
  "dotResistanceReduction",
  "burnResistanceDebuffLevel",

  // ── Legacy / pending mechanic keys (display-only, backward compat) ──
  "weaponDMG",
  "meleeDMG",
  "statusDMG",
  "elementalDMG",
  "burnDMG",
  "frostVortexDMG",
  "powerSurgeDMG",
  "unstableBomberDMG",
  "bounceDMG",
  "shrapnelDMG",
  "fastGunnerDMG",
  "fastGunnerDMGBonus",
  "bullseyeDMG",
  "deviationSkillDMG",
  "foodBonusPercent",

  // ── Gathering (utility) ──
  "gatheringYield",
  "miningYield",
  "loggingYield",
  "fishingYield",
  "craftingEfficiency",
]);

export const statPrioritySchema = z.object({
  key: statKeySchema,
  reason: z.string()
});

export const buildGoalProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string(),
  primaryStats: z.array(statPrioritySchema),
  secondaryStats: z.array(statPrioritySchema),
  defensiveStats: z.array(statPrioritySchema),
  utilityStats: z.array(statPrioritySchema),
  relevantKeywords: z.array(z.string()),
  preferredFoodBuffCategories: z.array(z.string()),
  preferredModCategories: z.array(z.string()),
  preferredDeviationRoles: z.array(z.string()),
  avoidStats: z.array(statPrioritySchema),
  scoringWeights: z.record(z.number()),
  notes: z.array(z.string())
});

export const buildGoalRegistrySchema = z.object({
  module: z.literal("build_goal_profiles"),
  moduleStatus: z.literal("verified_snapshot_locked"),
  locked: z.literal(true),
  confidence: z.literal("B_rules_registry_pending_formula_validation"),
  createdAt: z.string(),
  purpose: z.string(),
  statKeys: z.array(statKeySchema),
  scoringWeightScale: z.record(z.string()),
  profiles: z.array(buildGoalProfileSchema)
});

export type StatKey = z.infer<typeof statKeySchema>;
export type StatPriority = z.infer<typeof statPrioritySchema>;
export type BuildGoalProfile = z.infer<typeof buildGoalProfileSchema>;
export type BuildGoalRegistry = z.infer<typeof buildGoalRegistrySchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
