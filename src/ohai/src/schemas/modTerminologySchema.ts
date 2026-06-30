import { z } from "zod";

export const termTypeSchema = z.enum([
  "mod_name",
  "suffix_name",
  "keyword",
  "stat",
  "gear_slot",
  "effect_phrase",
  "rarity",
  "unknown"
]);

export const termStatusSchema = z.enum([
  "approved",
  "candidate",
  "needs_review"
]);

export const confidenceSchema = z.enum([
  "A",
  "B",
  "C",
  "D",
  "unknown"
]);

export const modTerminologyEntrySchema = z.object({
  id: z.string().min(1),
  termType: termTypeSchema,
  sourceOriginalTerms: z.array(z.string()),
  approvedEnglish: z.string().nullable(),
  aliasesEnglish: z.array(z.string()),
  badTranslations: z.array(z.string()),
  category: z.string().nullable(),
  status: termStatusSchema,
  confidence: confidenceSchema,
  sourceReferences: z.array(z.string()),
  notes: z.array(z.string())
});

export const modTerminologyRegistrySchema = z.object({
  module: z.literal("mod_terminology_registry"),
  moduleStatus: z.enum(["verified_snapshot_locked", "candidate_draft"]),
  locked: z.boolean(),
  generatedAt: z.string(),
  entries: z.array(modTerminologyEntrySchema)
});

export type ModTerminologyEntry = z.infer<typeof modTerminologyEntrySchema>;
export type ModTerminologyRegistry = z.infer<typeof modTerminologyRegistrySchema>;

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
