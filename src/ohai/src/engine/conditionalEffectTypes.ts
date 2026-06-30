import type { DamageModelHypothesis } from "./formulaTypes";

export type UptimeProfileName = "conservative" | "realistic" | "optimized" | "perfect" | "custom";

export interface CombatStateAssumptions {
  weakspotAccuracy: number;
  reloadsPerMinute: number;
  weaponSwapsPerMinute: number;
  procsPerMinute: number;
  elementalTriggersPerSecond: number;
  fastGunnerUptime: number;
  fortressWarfareUptime: number;
  targetMovement: "stationary" | "low" | "medium" | "high";
  distance: "melee" | "close" | "medium" | "far";
  fightDurationSeconds: number;
  burstWindowSeconds: number;
  damageModelOverride?: Partial<Record<"frostVortex" | "powerSurge" | "ebrFireRing", DamageModelHypothesis>>;
}

export interface ConditionalEffectDefinition {
  effectId: string;
  /** Duration of the buff in seconds (0 = duration not applicable) */
  durationSeconds: number;
  /** Cooldown between activations in seconds (0 = no cooldown) */
  cooldownSeconds: number;
  /** Max stacks (1 = non-stacking) */
  maxStacks: number;
  /** How trigger frequency is estimated */
  triggerProfile: {
    type: "reload" | "weapon-swap" | "weakspot" | "proc" | "elemental" | "ability" | "status-tick" | "manual";
    baseFrequencyPerMinute: number;
  };
  /** Weapon swap behavior */
  weaponSwapBehavior: "remove" | "keep" | "decay";
  /** Refresh behavior */
  refreshBehavior: "reset-duration" | "add-stack" | "no-refresh";
  /** Decay behavior on duration expiry */
  decayBehavior: "instant" | "per-stack" | "duration-end" | "no-decay";
  /** Whether effect is supported by the formula engine */
  supported: boolean;
  /** Unresolved mechanics notes */
  unresolvedMechanics: string[];
  /** Optional payload data for proc-type effects (e.g., hit count, multiplier, radius) */
  payload?: {
    hitsRequired?: number;
    atkMultiplier?: number;
    radiusMeters?: number;
  };
}

export interface ConditionalEffectEvaluation {
  effectId: string;
  effectName: string;
  status: ConditionalEffectStatus;
  effectiveUptime: number;
  effectiveStacks: number;
  maxStacks: number;
  contributionFactor: number;
  stackContribution: number;
  uptimeContribution: number;
  warnings: string[];
  explanation: string;
  triggerFrequencyEstimate: number;
}

export type ConditionalEffectStatus =
  | "inactive"
  | "assumed-active"
  | "conditionally-active"
  | "unsupported-condition"
  | "unresolved";

export interface UptimeProfileDefinition {
  name: UptimeProfileName;
  label: string;
  description: string;
  /** How much of the theoretical max uptime we assume */
  uptimeMultiplier: number;
  /** How much of the theoretical max stacks we assume */
  stackMultiplier: number;
  combatAssumptions: CombatStateAssumptions;
}
