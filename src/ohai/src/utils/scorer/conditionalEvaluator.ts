import type { StatKey } from "../../schemas/buildGoalSchema";
import type { ConditionalEffect, ConditionalTrigger, ConditionalContribution } from "./types";

const DEFAULT_UPTIME_ESTIMATES: Record<string, number> = {
  after_reload: 0.4,
  while_above_hp_threshold: 0.6,
  while_below_hp_threshold: 0.3,
  on_crit: 0.35,
  on_weakspot_hit: 0.25,
  after_kill: 0.2,
  while_shield_active: 0.5,
  enemy_affected_by_burn: 0.6,
  enemy_affected_by_frost: 0.5,
  enemy_affected_by_shock: 0.55,
  enemy_marked: 0.5,
  during_daytime: 0.5,
  during_nighttime: 0.5,
  while_sprinting: 0.3,
  while_standing_still: 0.4,
  permanent: 1.0,
  unknown: 0.5
};

const TRIGGER_CONFIDENCE_WEIGHTS: Record<string, number> = {
  permanent: 1.0,
  while_above_hp_threshold: 0.7,
  while_below_hp_threshold: 0.5,
  after_reload: 0.6,
  on_crit: 0.5,
  on_weakspot_hit: 0.4,
  after_kill: 0.3,
  while_shield_active: 0.6,
  enemy_affected_by_burn: 0.5,
  enemy_affected_by_frost: 0.5,
  enemy_affected_by_shock: 0.5,
  enemy_marked: 0.5,
  during_daytime: 0.8,
  during_nighttime: 0.8,
  while_sprinting: 0.5,
  while_standing_still: 0.4,
  unknown: 0.3
};

export function getDefaultUptime(trigger: ConditionalTrigger | string): number {
  return DEFAULT_UPTIME_ESTIMATES[trigger] ?? 0.5;
}

export function getConfidenceWeight(trigger: ConditionalTrigger | string): number {
  return TRIGGER_CONFIDENCE_WEIGHTS[trigger] ?? 0.5;
}

export interface ConditionallyAdjustedStat {
  statKey: StatKey;
  baseValue: number;
  effectiveValue: number;
  uptime: number;
  confidence: number;
}

export function evaluateConditional(
  effect: ConditionalEffect
): {
  adjustedStats: ConditionallyAdjustedStat[];
  effectiveMultiplier: number;
} {
  const uptime = effect.estimatedUptime ?? getDefaultUptime(effect.trigger);
  const confidence = effect.confidenceWeight ?? getConfidenceWeight(effect.trigger);
  const effectiveUptime = uptime * confidence;

  const adjustedStats: ConditionallyAdjustedStat[] = [];

  for (const [key, value] of Object.entries(effect.statModifiers)) {
    const statKey = key as StatKey;
    adjustedStats.push({
      statKey,
      baseValue: value,
      effectiveValue: value * effectiveUptime,
      uptime,
      confidence
    });
  }

  const totalEffective = adjustedStats.reduce((sum, s) => sum + Math.abs(s.effectiveValue), 0);
  const totalBase = adjustedStats.reduce((sum, s) => sum + Math.abs(s.baseValue), 0);
  const effectiveMultiplier = totalBase > 0 ? totalEffective / totalBase : 1.0;

  return { adjustedStats, effectiveMultiplier };
}

export function evaluateConditionals(
  effects: ConditionalEffect[]
): {
  allAdjustedStats: ConditionallyAdjustedStat[];
  combinedMultiplier: number;
  contributions: ConditionalContribution[];
} {
  if (!effects || effects.length === 0) {
    return { allAdjustedStats: [], combinedMultiplier: 1.0, contributions: [] };
  }

  const allAdjustedStats: ConditionallyAdjustedStat[] = [];
  const contributions: ConditionalContribution[] = [];

  for (const effect of effects) {
    const { adjustedStats, effectiveMultiplier } = evaluateConditional(effect);

    const effectiveSum = adjustedStats.reduce((sum, s) => sum + (s.effectiveValue ?? 0), 0);

    contributions.push({
      trigger: effect.trigger,
      description: effect.description,
      estimatedUptime: effect.estimatedUptime ?? getDefaultUptime(effect.trigger),
      statModifiers: adjustedStats.map((s) => ({
        statKey: s.statKey,
        value: s.effectiveValue
      })),
      contribution: effectiveSum,
      breakdown: `${effect.description}: uptime=${(effect.estimatedUptime * 100).toFixed(0)}%, confidence=${(effect.confidenceWeight * 100).toFixed(0)}%, effective multiplier=${effectiveMultiplier.toFixed(2)}x`
    });

    allAdjustedStats.push(...adjustedStats);
  }

  const combinedMultiplier = allAdjustedStats.length > 0
    ? 1.0 + (contributions.reduce((sum, c) => sum + c.contribution, 0) / 100)
    : 1.0;

  return { allAdjustedStats, combinedMultiplier, contributions };
}

export function estimateUptimeForKeywords(keywords: string[]): ConditionalEffect[] {
  if (!keywords || keywords.length === 0) return [];

  const effects: ConditionalEffect[] = [];

  const keywordTriggerMap: Record<string, { trigger: ConditionalTrigger; uptime: number }> = {
    burn: { trigger: "enemy_affected_by_burn", uptime: 0.6 },
    "power surge": { trigger: "enemy_affected_by_shock", uptime: 0.55 },
    "frost vortex": { trigger: "enemy_affected_by_frost", uptime: 0.5 },
    bullseye: { trigger: "enemy_marked", uptime: 0.5 }
  };

  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    const mapped = keywordTriggerMap[lower];
    if (mapped) {
      effects.push({
        trigger: mapped.trigger,
        description: `Auto-detected from keyword: ${kw}`,
        estimatedUptime: mapped.uptime,
        scalingType: "percent_additive",
        statModifiers: {},
        confidenceWeight: 0.4
      });
    }
  }

  return effects;
}
