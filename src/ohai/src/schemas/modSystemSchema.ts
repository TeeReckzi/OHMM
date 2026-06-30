import { z } from "zod";

const systemVersionSchema = z.enum(["legacy_pre_overhaul", "current_post_overhaul", "hybrid_player_inventory", "unknown"]);
const availabilitySchema = z.enum(["currently_farmable", "legacy_retained_only", "deprecated_unavailable", "event_limited", "unknown"]);
const legacyStatusSchema = z.enum(["not_legacy", "legacy", "mixed", "unknown"]);
const optimizerPoolModeSchema = z.enum(["current_only", "legacy_only", "hybrid_inventory", "unrestricted_debug"]);
const confidenceSchema = z.enum(["A", "B", "C", "D", "unknown"]);

const futureMetadataSchema = z.object({
  systemVersion: z.union([systemVersionSchema, z.literal("unknown")]),
  availability: availabilitySchema,
  legacyStatus: legacyStatusSchema,
  introducedPatch: z.string().nullable(),
  retiredPatch: z.string().nullable(),
  canDropNow: z.boolean(),
  canExistInPlayerInventory: z.boolean(),
  requiresLegacyOwnership: z.boolean(),
  sourceConfidence: confidenceSchema,
  notes: z.array(z.string())
});

export const modSystemRegistrySchema = z.object({
  module: z.literal("mod_system_registry"),
  moduleStatus: z.literal("verified_snapshot_locked"),
  locked: z.literal(true),
  confidence: z.literal("B_project_policy"),
  createdAt: z.string(),
  purpose: z.string(),
  modSystemVersions: z.array(systemVersionSchema),
  availabilityCategories: z.array(availabilitySchema),
  legacyStatuses: z.array(legacyStatusSchema),
  optimizerPoolModes: z.array(optimizerPoolModeSchema),
  defaultOptimizerPoolMode: z.literal("current_only"),
  futureMetadataTemplate: futureMetadataSchema,
  optimizerRules: z.array(z.string()),
  notes: z.array(z.string())
});

export type ModSystemRegistry = z.infer<typeof modSystemRegistrySchema>;

export function formatModSystemError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
