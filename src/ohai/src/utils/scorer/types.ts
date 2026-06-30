import type { StatKey } from "../../schemas/buildGoalSchema";
import type {
  ConditionalTrigger, ScalingType, SynergyType, ScenarioModifier,
  ConditionalEffect, ScoreBreakdown, ScoreContribution,
  ConditionalContribution, SynergyMatch, ScoreExplanation
} from "../../schemas/gearScorerSchema";

export interface GearItemInput {
  id: string;
  sourceType: "weapon" | "armor" | "mod_core" | "mod_suffix" | "calibration" | "food_buff" | "deviation";
  name: string;
  statValues?: Partial<Record<StatKey, number>>;
  keywords?: string[];
  element?: string;
  armorSet?: string;
  weaponType?: string;
  conditionalEffects?: ConditionalEffect[];
  rawStats?: Record<string, number>;
}

export interface StatWeightOverride {
  key: StatKey;
  weight: number;
  reason: string;
}

export interface SceneProfile {
  id: string;
  name: string;
  description: string;
  buildGoalId: string;
  categoryWeights: {
    damage: number;
    survivability: number;
    consistency: number;
    utility: number;
    mobility: number;
    synergy: number;
  };
  statWeightOverrides?: Partial<Record<StatKey, number>>;
  modifiers: ScenarioModifier[];
  tags: string[];
}

export interface EvaluatedItemContribution {
  itemId: string;
  itemName: string;
  itemType: GearItemInput["sourceType"];
  baseScore: number;
  synergyScore: number;
  conditionalScore: number;
  totalScore: number;
  contributions: ScoreContribution[];
}

export interface GearSetEvaluation {
  scenarioId: string;
  scenarioName: string;
  buildGoalId: string;
  breakdown: ScoreBreakdown;
  explanation: ScoreExplanation;
  itemContributions: EvaluatedItemContribution[];
  totalScore: number;
}

export interface MechanicScoringOptions {
  selectedMechanicIds?: string[];
  equippedGearNames?: string[];
  includeUncertainMetadata?: boolean;
}

export interface MechanicStatNote {
  statKey: StatKey;
  status: "enabled" | "suppressed" | "uncertain";
  reason: string;
}

export interface MechanicScoringContext {
  selectedMechanicIds: string[];
  equippedGearNames: string[];
  includeUncertainMetadata: boolean;
  statNotes: MechanicStatNote[];
  overrideNotes: string[];
}

export { StatKey, ScoreBreakdown, ScoreContribution, ConditionalContribution, ConditionalEffect, ConditionalTrigger, ScalingType, SynergyType, SynergyMatch, ScenarioModifier, ScoreExplanation };
