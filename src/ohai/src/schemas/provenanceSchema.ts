/**
 * Provenance and Evidence Tracking Schema
 * 
 * This schema defines types for tracking the provenance of external research data
 * and evidence findings from external sources like OHMM.
 * 
 * Purpose:
 * - Track where data came from (source)
 * - Track confidence level and review status
 * - Identify conflicts with project data
 * - Prevent blind imports of unverified external data
 * 
 * Usage:
 * - Attach ProvenanceMetadata to any imported external data
 * - Use ExternalEvidence for tracking research findings
 * - Use EvidenceRegistry for curated collections of evidence
 */

import { z } from 'zod';

// ============================================================================
// Provenance Source Types
// ============================================================================

/**
 * Source of external data
 */
export const provenanceSourceSchema = z.enum([
  'ohmm_knowledge_bible',      // OHMM Knowledge Bible (community-tested)
  'ohmm_custom_datamine',      // OHMM custom datamine (weapon_list.json, mods_config.json)
  'ohmm_adr',                  // OHMM Architecture Decision Records
  'ohmm_simulator_code',       // OHMM simulator code references
  'ohmm_screenshot_ocr',       // OHMM screenshot OCR data
  'community_spreadsheet',     // Community spreadsheets (Farmerzez, Mawn, OhDex)
  'official_wiki',             // Once Human Fandom Wiki
  'reddit_community',          // Reddit r/OnceHumanOfficial
  'chinese_gaming_resources',  // TapTap, 17173.com, NGA forums
  'in_game_observation',       // Direct in-game observation
  'in_game_screenshot',        // In-game screenshot
  'in_game_tested',            // Explicit in-game testing
  'gemini_web_search',         // Gemini web-grounded search
  'other_external',            // Other external source
]);

export type ProvenanceSource = z.infer<typeof provenanceSourceSchema>;

// ============================================================================
// Confidence Levels
// ============================================================================

/**
 * Confidence level for external evidence
 */
export const confidenceLevelSchema = z.enum([
  'external_in_game_tested',         // Explicitly tested in-game
  'external_screenshot_ocr',         // From screenshot OCR
  'external_community_datamine',     // Community datamine
  'external_model_assumption',       // Model assumption (ADR)
  'conflict_review_required',        // Conflicts with project, needs review
  'do_not_import_blindly',           // High risk, requires manual review
]);

export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

// ============================================================================
// Review Status
// ============================================================================

/**
 * Review status for external evidence
 */
export const reviewStatusSchema = z.enum([
  'pending_review',              // Not yet reviewed
  'approved',                    // Reviewed and approved
  'rejected',                    // Reviewed and rejected
  'conflict_review_required',    // Conflicts detected, needs manual review
  'awaiting_ingame_test',        // Requires in-game testing
]);

export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

// ============================================================================
// Evidence Type
// ============================================================================

/**
 * Type of evidence
 */
export const evidenceTypeSchema = z.enum([
  'weapon_stat',                 // Weapon stat value
  'weapon_mechanic',             // Weapon mechanic/trigger
  'armor_stat',                  // Armor stat value
  'armor_set_bonus',             // Armor set bonus
  'mod_effect',                  // Mod effect
  'keyword_capability',          // Keyword capability (canCrit, canWeakspot)
  'damage_formula',              // Damage formula topology
  'bucket_topology',             // Bucket topology claim
  'trigger_mechanic',            // Trigger mechanic (cooldown, stack, etc.)
  'stat_profile',                // Stat profile (T5/6-star vs base)
  'other',                       // Other evidence type
]);

export type EvidenceType = z.infer<typeof evidenceTypeSchema>;

// ============================================================================
// Conflict Status
// ============================================================================

/**
 * Conflict status with project data
 */
export const conflictStatusSchema = z.enum([
  'no_conflict',                 // No conflict with project
  'minor_conflict',              // Minor conflict (e.g., different stat profile)
  'major_conflict',              // Major conflict (e.g., different formula)
  'unknown',                     // Conflict status unknown
]);

export type ConflictStatus = z.infer<typeof conflictStatusSchema>;

// ============================================================================
// Provenance Metadata
// ============================================================================

/**
 * Provenance metadata for imported external data
 */
export const provenanceMetadataSchema = z.object({
  source: provenanceSourceSchema,
  sourceFile: z.string().optional(),        // e.g., 'weapon_list.json', 'ADR-002'
  sourceDate: z.string().optional(),        // e.g., '2026-03-01'
  sourceUrl: z.string().optional(),         // URL if applicable
  confidence: confidenceLevelSchema,
  reviewStatus: reviewStatusSchema,
  lastValidated: z.string().optional(),     // Date of last in-game validation
  notes: z.string().optional(),
});

export type ProvenanceMetadata = z.infer<typeof provenanceMetadataSchema>;

// ============================================================================
// External Evidence
// ============================================================================

/**
 * External evidence finding from research
 */
export const externalEvidenceSchema = z.object({
  id: z.string(),                           // Unique identifier
  type: evidenceTypeSchema,
  source: provenanceSourceSchema,
  sourceFile: z.string().optional(),
  sourceLocation: z.string().optional(),    // e.g., 'line 28', 'ADR-002 section 3'
  
  relatedEntityId: z.string().optional(),   // e.g., 'de-50-jaws', 'unstableBomber'
  relatedEntityName: z.string().optional(), // e.g., 'DE.50 - Jaws', 'Unstable Bomber'
  
  claimSummary: z.string(),                 // Summary of the claim/finding
  claimValue: z.any().optional(),           // The actual value claimed
  
  projectValue: z.any().optional(),         // Current project value (if different)
  
  confidence: confidenceLevelSchema,
  conflictStatus: conflictStatusSchema,
  reviewStatus: reviewStatusSchema,
  
  notes: z.string().optional(),
  recommendations: z.string().optional(),
  
  createdAt: z.string(),                    // ISO date
  updatedAt: z.string(),                    // ISO date
});

export type ExternalEvidence = z.infer<typeof externalEvidenceSchema>;

// ============================================================================
// Evidence Registry
// ============================================================================

/**
 * Registry of external evidence findings
 */
export const evidenceRegistrySchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  source: z.string(),
  evidence: z.array(externalEvidenceSchema),
});

export type EvidenceRegistry = z.infer<typeof evidenceRegistrySchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new evidence entry
 */
export function createEvidence(
  id: string,
  type: EvidenceType,
  source: ProvenanceSource,
  claimSummary: string,
  confidence: ConfidenceLevel,
  conflictStatus: ConflictStatus,
  options: {
    sourceFile?: string;
    sourceLocation?: string;
    relatedEntityId?: string;
    relatedEntityName?: string;
    claimValue?: any;
    projectValue?: any;
    reviewStatus?: ReviewStatus;
    notes?: string;
    recommendations?: string;
  } = {}
): ExternalEvidence {
  const now = new Date().toISOString();
  
  return {
    id,
    type,
    source,
    sourceFile: options.sourceFile,
    sourceLocation: options.sourceLocation,
    relatedEntityId: options.relatedEntityId,
    relatedEntityName: options.relatedEntityName,
    claimSummary,
    claimValue: options.claimValue,
    projectValue: options.projectValue,
    confidence,
    conflictStatus,
    reviewStatus: options.reviewStatus || 'pending_review',
    notes: options.notes,
    recommendations: options.recommendations,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate evidence entry
 */
export function validateEvidence(evidence: any): evidence is ExternalEvidence {
  return externalEvidenceSchema.safeParse(evidence).success;
}

/**
 * Validate evidence registry
 */
export function validateEvidenceRegistry(registry: any): registry is EvidenceRegistry {
  return evidenceRegistrySchema.safeParse(registry).success;
}

/**
 * Get evidence by ID from registry
 */
export function getEvidenceById(registry: EvidenceRegistry, id: string): ExternalEvidence | undefined {
  return registry.evidence.find(e => e.id === id);
}

/**
 * Get evidence by related entity
 */
export function getEvidenceByEntity(registry: EvidenceRegistry, entityId: string): ExternalEvidence[] {
  return registry.evidence.filter(e => e.relatedEntityId === entityId);
}

/**
 * Get evidence by type
 */
export function getEvidenceByType(registry: EvidenceRegistry, type: EvidenceType): ExternalEvidence[] {
  return registry.evidence.filter(e => e.type === type);
}

/**
 * Get evidence by conflict status
 */
export function getEvidenceByConflictStatus(
  registry: EvidenceRegistry,
  status: ConflictStatus
): ExternalEvidence[] {
  return registry.evidence.filter(e => e.conflictStatus === status);
}

/**
 * Get high-priority evidence (conflicts or do not import blindly)
 */
export function getHighPriorityEvidence(registry: EvidenceRegistry): ExternalEvidence[] {
  return registry.evidence.filter(e =>
    e.confidence === 'conflict_review_required' ||
    e.confidence === 'do_not_import_blindly' ||
    e.conflictStatus === 'major_conflict'
  );
}
