import type { StatKey } from "../schemas/buildGoalSchema";

/**
 * Unified Effect Pipeline Item
 * All gear / mod / armor / cradle / weapon / food / attachment / deviation effects
 * are normalized to this shape by the resolvers.
 *
 * Used by loadoutEffectResolver -> formulaBridge (for modifierSources + conditionalEffects
 * + coverage lists) and by UI (LoadoutPanel per-item effects, Projection coverage, warnings).
 *
 * Rules:
 * - Never invent numeric values. Use registry data, parsed via existing utils (effectSummaryToStatModifiers,
 *   verifiedModifierLoader), or explicit observed entries only.
 * - For textual/complex/unknown: statModifiers=[], confidence='candidate'|'partial'|'blocked',
 *   blockedReason or notes describe, intelLinks point to research notes / generated sources.
 * - active: true only when piece counts / conditions / selections make the effect apply.
 */
export interface EffectPipelineItem {
  sourceId: string;
  sourceName: string;
  sourceType: 'weapon' | 'weapon-keyword' | 'mod-core' | 'mod-suffix' | 'mod-substat' | 'armor-piece' | 'armor-set-bonus' | 'cradle-perk' | 'food' | 'drink' | 'deviation' | 'attachment' | 'ammo' | 'target';
  effectType: 'stat-buff' | 'proc' | 'set-bonus' | 'conditional' | 'base-stat' | 'mitigation' | 'utility';
  mechanicIds: string[];           // e.g. ['burn', 'frostVortex']
  statModifiers: Array<{
    stat: StatKey;
    value: number;
    unit?: 'flat' | 'percent';
  }>;
  conditionalEffects?: Array<{
    effectId: string;
    contributionFactor: number;
    effectiveUptime: number;
    status: string;
  }>;
  confidence: 'verified' | 'candidate' | 'partial' | 'blocked';
  active: boolean;
  blockedReason?: string;
  intelLinks?: Array<{ label: string; path: string }>;
  notes?: string;
}

export type EffectCoverage = {
  fullyModeled: number;
  partiallyModeled: number;
  displayOnly: number;
  unresolved: number;
  totalConsidered: number;
  // For UI summary badge
  summary: string;
};
