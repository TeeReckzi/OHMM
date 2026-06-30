import type { StatKey } from "../schemas/buildGoalSchema";

export type DamageScalingBucket =
  | "weapon"
  | "status"
  | "deviation"
  | "melee"
  | "unknown";

export type VulnerabilityType =
  | "weapon"
  | "status"
  | "none"
  | "unknown";

export type CritWeakspotBucket =
  | "additive_when_both_apply"
  | "crit_only"
  | "weakspot_only"
  | "none"
  | "unknown";

export type DamageDisplayBehavior =
  | "direct_hit"
  | "damage_over_time"
  | "charged_shot"
  | "deviation_skill"
  | "unknown";

export type ElementType =
  | "blaze"
  | "frost"
  | "shock"
  | "blast"
  | "physical"
  | "none"
  | "unknown";

export type CritChanceSource =
  | "none"
  | "characterCritRate"
  | "fixedChance"
  | "weaponTriggerChance"
  | "unknown";

export type CritDamageSource =
  | "none"
  | "characterCritDMG"
  | "fixedMultiplier"
  | "unknown";

export type WeakspotChanceSource =
  | "none"
  | "characterWeakspotRate"
  | "alwaysOnWeakspot"
  | "unknown";

export type WeakspotDamageSource =
  | "none"
  | "characterWeakspotDMG"
  | "fixedMultiplier"
  | "unknown";

export type Confidence =
  | "confirmed"
  | "observed_in_game_needs_testing"
  | "reported_current_patch_needs_testing"
  | "outdated_reference"
  | "inferred"
  | "unknown";

export type MechanicSourceKind =
  | "reference_pdf"
  | "in_game_observation"
  | "patch_note"
  | "deviation"
  | "manual_model"
  | "unknown";

export interface MechanicSource {
  kind: MechanicSourceKind;
  label?: string;
  version?: string;
  note?: string;
}

export interface MechanicBehavior {
  mechanicId: string;
  displayName: string;
  damageScalingBucket: DamageScalingBucket;
  scalingStat: StatKey;
  vulnerabilityType: VulnerabilityType;
  critWeakspotBucket: CritWeakspotBucket;
  displayBehavior: DamageDisplayBehavior;
  element?: ElementType;
  canCrit: boolean;
  canWeakspot: boolean;
  distanceDecay: boolean;
  tickIntervalSeconds?: number;
  durationSeconds?: number;
  maxStacks?: number;
  baseStacks?: number;
  damagePerStackFactor?: number;
  refreshesDurationOnReapply?: boolean;
  extendsDurationOnReapply?: boolean;
  triggerChance?: number;
  cooldownSeconds?: number;
  baseFactor?: number;
  formulaTemplateId?: string;
  source: MechanicSource;
  confidence: Confidence;
  patchContext?: string;
  needsRetest: boolean;
  notes?: string;
}

export interface GearMechanicOverride {
  overrideId: string;
  sourceGearName: string;
  affectedMechanicId: string;
  damageScalingBucketOverride?: DamageScalingBucket;
  scalingStatOverride?: StatKey;
  vulnerabilityTypeOverride?: VulnerabilityType;
  critWeakspotBucketOverride?: CritWeakspotBucket;
  displayBehaviorOverride?: DamageDisplayBehavior;
  enablesCritRollPerTick?: boolean;
  critChanceSource?: CritChanceSource;
  critDamageSource?: CritDamageSource;
  weakspotChanceSource?: WeakspotChanceSource;
  weakspotDamageSource?: WeakspotDamageSource;
  source: MechanicSource;
  confidence: Confidence;
  needsRetest: boolean;
  notes?: string;
}

export interface FormulaTemplate {
  templateId: string;
  displayName: string;
  formula: string;
  variables: string[];
  appliesToMechanicIds?: string[];
  source: MechanicSource;
  confidence: Confidence;
  patchContext: string;
  needsRetest: boolean;
  notes?: string;
}

export interface AppliedOverrideMetadata {
  override: GearMechanicOverride;
  wasApplied: boolean;
  reason?: string;
}

export interface EffectiveMechanicBehavior extends MechanicBehavior {
  appliedOverrides: AppliedOverrideMetadata[];
}

export interface MechanicRegistryRecord {
  mechanic: MechanicBehavior;
  overrides: GearMechanicOverride[];
}
