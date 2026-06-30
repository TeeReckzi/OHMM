import type { StatKey } from "../schemas/buildGoalSchema";
import type { Confidence } from "./types";

export type ModifierSourceType =
  | "weapon"
  | "armor"
  | "mod"
  | "modSuffix"
  | "calibration"
  | "food"
  | "setBonus"
  | "keywordEffect"
  | "temporaryBuff"
  | "enemyTypeBonus"
  | "gloves";

export type ModifierBehavior =
  | "additive"
  | "multiplicative"
  | "conditional";

export interface ModifierConditional {
  description: string;
  isActive: boolean;
}

export interface ModifierSource {
  id: string;
  sourceType: ModifierSourceType;
  sourceLabel: string;
  stat: StatKey;
  value: number;
  behavior: ModifierBehavior;
  conditional?: ModifierConditional;
  mechanicId?: string;
  enemyType?: string;
  tags?: string[];
  confidence: Confidence;
  notes?: string;
}

export interface ModifierBreakdownEntry {
  sourceId: string;
  sourceLabel: string;
  sourceType: ModifierSourceType;
  value: number;
  conditional?: ModifierConditional;
  mechanicId?: string;
}

export interface AggregatedStats {
  stats: Partial<Record<StatKey, number>>;
  breakdown: Partial<Record<StatKey, ModifierBreakdownEntry[]>>;
  sourceCount: number;
}

export interface DuplicateReport {
  id: string;
  kept: ModifierSource;
  suppressed: ModifierSource[];
}

export interface AggregationReport {
  stats: AggregatedStats;
  duplicates: DuplicateReport[];
  totalSources: number;
  activeSources: number;
  suppressedCount: number;
}
