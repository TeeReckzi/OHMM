import { z } from "zod";
import { statKeySchema } from "./buildGoalSchema";

export const conditionalTriggerSchema = z.enum([
  "after_reload",
  "while_above_hp_threshold",
  "while_below_hp_threshold",
  "on_crit",
  "on_weakspot_hit",
  "after_kill",
  "while_shield_active",
  "enemy_affected_by_burn",
  "enemy_affected_by_frost",
  "enemy_affected_by_shock",
  "enemy_marked",
  "during_daytime",
  "during_nighttime",
  "while_sprinting",
  "while_standing_still",
  "permanent",
  "unknown"
]);

export const scalingTypeSchema = z.enum([
  "flat_additive",
  "percent_additive",
  "percent_multiplicative",
  "unknown"
]);

export const synergyTypeSchema = z.enum([
  "keyword_match",
  "armor_set_cohesion",
  "elemental_alignment",
  "proc_chain_compatibility",
  "crit_ecosystem",
  "calibration_synergy",
  "weapon_type_synergy",
  "food_buff_synergy",
  "deviation_synergy"
]);

export const scenarioModifierSchema = z.object({
  type: z.enum(["conditional_multiplier", "stat_weight_override", "anti_synergy_penalty"]),
  condition: z.string().optional(),
  multiplier: z.number().optional(),
  targetStats: z.array(statKeySchema).optional(),
  description: z.string()
});

export const conditionalEffectSchema = z.object({
  trigger: conditionalTriggerSchema,
  description: z.string(),
  estimatedUptime: z.number().min(0).max(1),
  scalingType: scalingTypeSchema,
  statModifiers: z.record(statKeySchema, z.number()),
  confidenceWeight: z.number().min(0).max(1)
});

export const sceneProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  buildGoalId: z.string(),
  categoryWeights: z.object({
    damage: z.number(),
    survivability: z.number(),
    consistency: z.number(),
    utility: z.number(),
    mobility: z.number(),
    synergy: z.number()
  }),
  statWeightOverrides: z.record(statKeySchema, z.number()).optional(),
  modifiers: z.array(scenarioModifierSchema),
  tags: z.array(z.string())
});

export const scoreContributionSchema = z.object({
  source: z.string(),
  sourceType: z.enum(["weapon", "armor", "mod_core", "mod_suffix", "calibration", "food_buff", "deviation", "synergy", "conditional"]),
  statKey: statKeySchema,
  value: z.number(),
  weight: z.number(),
  contribution: z.number(),
  breakdown: z.string()
});

export const conditionalContributionSchema = z.object({
  trigger: conditionalTriggerSchema,
  description: z.string(),
  estimatedUptime: z.number(),
  statModifiers: z.array(z.object({ statKey: statKeySchema, value: z.number() })),
  contribution: z.number(),
  breakdown: z.string()
});

export const synergyMatchSchema = z.object({
  type: synergyTypeSchema,
  items: z.array(z.string()),
  description: z.string(),
  score: z.number(),
  details: z.string()
});

export const scoreBreakdownSchema = z.object({
  damage: z.number(),
  survivability: z.number(),
  consistency: z.number(),
  utility: z.number(),
  mobility: z.number(),
  synergy: z.number(),
  total: z.number()
});

export const scoreExplanationSchema = z.object({
  total: z.number(),
  categoryScores: z.record(z.string(), z.number()),
  contributions: z.array(scoreContributionSchema),
  conditionals: z.array(conditionalContributionSchema),
  synergies: z.array(synergyMatchSchema),
  scenarioLabel: z.string()
});

export const evaluateGearSetRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sourceType: z.enum(["weapon", "armor", "mod_core", "mod_suffix", "calibration", "food_buff", "deviation"]),
    name: z.string(),
    statValues: z.record(statKeySchema, z.number()).optional(),
    keywords: z.array(z.string()).optional(),
    element: z.string().optional(),
    armorSet: z.string().optional(),
    weaponType: z.string().optional(),
    conditionalEffects: z.array(conditionalEffectSchema).optional(),
    rawStats: z.record(z.string(), z.number()).optional()
  })),
  scenarioId: z.string(),
  buildGoalId: z.string().optional(),
  enableSynergy: z.boolean().default(true),
  enableConditionals: z.boolean().default(true)
});

export const evaluateGearSetResponseSchema = z.object({
  scenarioId: z.string(),
  scenarioName: z.string(),
  buildGoalId: z.string(),
  breakdown: scoreBreakdownSchema,
  explanation: scoreExplanationSchema,
  totalScore: z.number()
});

export type ConditionalTrigger = z.infer<typeof conditionalTriggerSchema>;
export type ScalingType = z.infer<typeof scalingTypeSchema>;
export type SynergyType = z.infer<typeof synergyTypeSchema>;
export type ScenarioModifier = z.infer<typeof scenarioModifierSchema>;
export type ConditionalEffect = z.infer<typeof conditionalEffectSchema>;
export type SceneProfile = z.infer<typeof sceneProfileSchema>;
export type ScoreContribution = z.infer<typeof scoreContributionSchema>;
export type ConditionalContribution = z.infer<typeof conditionalContributionSchema>;
export type SynergyMatch = z.infer<typeof synergyMatchSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type ScoreExplanation = z.infer<typeof scoreExplanationSchema>;
export type EvaluateGearSetRequest = z.infer<typeof evaluateGearSetRequestSchema>;
export type EvaluateGearSetResponse = z.infer<typeof evaluateGearSetResponseSchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
