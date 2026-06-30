import type {
  UptimeProfileName,
  UptimeProfileDefinition,
  CombatStateAssumptions,
  ConditionalEffectDefinition,
  ConditionalEffectEvaluation,
  ConditionalEffectStatus,
} from "./conditionalEffectTypes";

const CLAMP_RANGES: Record<keyof Omit<CombatStateAssumptions, "targetMovement" | "distance" | "damageModelOverride">, { min: number; max: number }> = {
  weakspotAccuracy: { min: 0, max: 1 },
  reloadsPerMinute: { min: 0, max: 30 },
  weaponSwapsPerMinute: { min: 0, max: 15 },
  procsPerMinute: { min: 0, max: 60 },
  elementalTriggersPerSecond: { min: 0, max: 10 },
  fastGunnerUptime: { min: 0, max: 1 },
  fortressWarfareUptime: { min: 0, max: 1 },
  fightDurationSeconds: { min: 5, max: 600 },
  burstWindowSeconds: { min: 1, max: 60 },
};

function clampedOverride<T extends keyof CombatStateAssumptions>(
  key: T,
  value: CombatStateAssumptions[T],
): CombatStateAssumptions[T] {
  if (typeof value === "number") {
    const range = (CLAMP_RANGES as Record<string, { min: number; max: number } | undefined>)[key];
    if (range) {
      return Math.max(range.min, Math.min(range.max, value)) as CombatStateAssumptions[T];
    }
  }
  return value;
}

// ── Custom profile helpers ──

export function deriveCustomProfile(
  baseProfile: UptimeProfileName,
  overrides: Partial<CombatStateAssumptions>,
): CombatStateAssumptions {
  const base = defaultCombatAssumptions(baseProfile);
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = clampedOverride(key as keyof CombatStateAssumptions, value);
    }
  }
  return result;
}

export function isCustomProfile(name: UptimeProfileName): boolean {
  return name === "custom";
}

// ── Default Combat State Assumptions ──

export function defaultCombatAssumptions(profile: UptimeProfileName): CombatStateAssumptions {
  switch (profile) {
    case "conservative":
      return {
        weakspotAccuracy: 0.30,
        reloadsPerMinute: 4,
        weaponSwapsPerMinute: 1,
        procsPerMinute: 3,
        elementalTriggersPerSecond: 0.5,
        fastGunnerUptime: 0.20,
        fortressWarfareUptime: 0.25,
        targetMovement: "high",
        distance: "medium",
        fightDurationSeconds: 120,
        burstWindowSeconds: 5,
      };
    case "realistic":
      return {
        weakspotAccuracy: 0.55,
        reloadsPerMinute: 6,
        weaponSwapsPerMinute: 2,
        procsPerMinute: 6,
        elementalTriggersPerSecond: 1.0,
        fastGunnerUptime: 0.40,
        fortressWarfareUptime: 0.40,
        targetMovement: "medium",
        distance: "medium",
        fightDurationSeconds: 90,
        burstWindowSeconds: 8,
      };
    case "optimized":
      return {
        weakspotAccuracy: 0.80,
        reloadsPerMinute: 10,
        weaponSwapsPerMinute: 4,
        procsPerMinute: 12,
        elementalTriggersPerSecond: 2.0,
        fastGunnerUptime: 0.65,
        fortressWarfareUptime: 0.60,
        targetMovement: "low",
        distance: "close",
        fightDurationSeconds: 60,
        burstWindowSeconds: 12,
      };
    case "perfect":
      return {
        weakspotAccuracy: 1.0,
        reloadsPerMinute: 20,
        weaponSwapsPerMinute: 8,
        procsPerMinute: 30,
        elementalTriggersPerSecond: 5.0,
        fastGunnerUptime: 1.0,
        fortressWarfareUptime: 1.0,
        targetMovement: "stationary",
        distance: "melee",
        fightDurationSeconds: 30,
        burstWindowSeconds: 20,
      };
    default:
      return defaultCombatAssumptions("realistic");
  }
}

// ── Uptime Profile Definitions ──

export function getUptimeProfile(name: UptimeProfileName): UptimeProfileDefinition {
  switch (name) {
    case "conservative":
      return {
        name: "conservative",
        label: "Conservative",
        description: "Low estimates — assumes human error, movement, and imperfect rotations.",
        uptimeMultiplier: 0.35,
        stackMultiplier: 0.20,
        combatAssumptions: defaultCombatAssumptions("conservative"),
      };
    case "realistic":
      return {
        name: "realistic",
        label: "Realistic",
        description: "Moderate estimates for an average skilled player in normal content.",
        uptimeMultiplier: 0.60,
        stackMultiplier: 0.45,
        combatAssumptions: defaultCombatAssumptions("realistic"),
      };
    case "optimized":
      return {
        name: "optimized",
        label: "Optimized",
        description: "High estimates for experienced players with optimized rotations.",
        uptimeMultiplier: 0.85,
        stackMultiplier: 0.75,
        combatAssumptions: defaultCombatAssumptions("optimized"),
      };
    case "perfect":
      return {
        name: "perfect",
        label: "Perfect",
        description: "Theoretical maximum uptime. Only achievable in controlled conditions.",
        uptimeMultiplier: 1.0,
        stackMultiplier: 1.0,
        combatAssumptions: defaultCombatAssumptions("perfect"),
      };
    case "custom":
      return {
        name: "custom",
        label: "Custom",
        description: "User-defined combat assumptions. Controlled via Assumption Control Center.",
        uptimeMultiplier: 1.0,
        stackMultiplier: 1.0,
        combatAssumptions: defaultCombatAssumptions("realistic"),
      };
    default:
      return getUptimeProfile("realistic");
  }
}

// ── Trigger frequency estimate ──

function estimateTriggerFrequency(def: ConditionalEffectDefinition, profile: UptimeProfileDefinition): number {
  const assumptions = profile.combatAssumptions;
  switch (def.triggerProfile.type) {
    case "reload": return assumptions.reloadsPerMinute;
    case "weapon-swap": return assumptions.weaponSwapsPerMinute;
    case "weakspot": return assumptions.weakspotAccuracy * 60; // per minute
    case "proc": return assumptions.procsPerMinute;
    case "elemental": return assumptions.elementalTriggersPerSecond * 60;
    case "ability": return 4; // ~4 ability uses per minute
    case "status-tick": return 10; // ~10 ticks per minute
    case "manual": return def.triggerProfile.baseFrequencyPerMinute;
    default: return 6;
  }
}

// ── Core evaluation ──

export function evaluateConditionalEffect(
  def: ConditionalEffectDefinition,
  profileName: UptimeProfileName,
  customAssumptions?: Partial<CombatStateAssumptions>,
): ConditionalEffectEvaluation {
  const profile = profileName === "custom" && customAssumptions
    ? {
        ...getUptimeProfile("custom"),
        combatAssumptions: deriveCustomProfile("realistic", customAssumptions),
      }
    : getUptimeProfile(profileName);
  const warnings: string[] = [];

  if (!def.supported) {
    return {
      effectId: def.effectId,
      effectName: def.effectId,
      status: "unsupported-condition",
      effectiveUptime: 0,
      effectiveStacks: 0,
      maxStacks: def.maxStacks,
      contributionFactor: 0,
      stackContribution: 0,
      uptimeContribution: 0,
      warnings: [`Effect "${def.effectId}" is not supported by the formula engine.`],
      explanation: "Unsupported conditional effect — no contribution.",
      triggerFrequencyEstimate: 0,
    };
  }

  // Compute uptime for non-stacking effects
  const triggerFreq = estimateTriggerFrequency(def, profile);
  let rawUptime: number;

  if (def.durationSeconds <= 0 || def.triggerProfile.type === "manual") {
    // Manual/always-on → uptime determined by profile multiplier
    rawUptime = profile.uptimeMultiplier;
  } else if (def.cooldownSeconds > 0) {
    // Cooldown-based: duration / (duration + cooldown) * trigger likelihood
    const idealCycleUptime = def.durationSeconds / (def.durationSeconds + def.cooldownSeconds);
    const triggerAdequacy = Math.min(1, triggerFreq / (60 / (def.durationSeconds + def.cooldownSeconds)));
    rawUptime = idealCycleUptime * triggerAdequacy;
  } else {
    // Duration-based: how often per minute can we trigger?
    const triggersPerDuration = triggerFreq * (def.durationSeconds / 60);
    rawUptime = Math.min(1, triggersPerDuration);
  }

  // Apply profile uptime multiplier
  const effectiveUptime = Math.min(1, rawUptime * profile.uptimeMultiplier);

  // Compute stacks
  let effectiveStacks = 1;
  let stackContribution = 1;

  if (def.maxStacks > 1) {
    if (def.refreshBehavior === "add-stack") {
      // Stacks accumulate over time
      if (def.durationSeconds > 0) {
        const triggersPerDuration = triggerFreq * (def.durationSeconds / 60);
        const theoreticalStacks = Math.min(def.maxStacks, Math.max(1, Math.round(triggersPerDuration)));
        effectiveStacks = Math.max(1, Math.round(theoreticalStacks * profile.stackMultiplier));
      } else {
        effectiveStacks = Math.max(1, Math.round(def.maxStacks * profile.stackMultiplier));
      }
    } else {
      effectiveStacks = Math.max(1, Math.round(def.maxStacks * profile.stackMultiplier));
    }
    stackContribution = effectiveStacks / def.maxStacks;
  }

  const contributionFactor = effectiveUptime * stackContribution;

  // Validate
  if (def.weaponSwapBehavior === "remove") {
    warnings.push(`Removed on weapon swap — effective uptime drops further if swaps are frequent.`);
  }

  if (def.unresolvedMechanics.length > 0) {
    for (const um of def.unresolvedMechanics) {
      warnings.push(`Unresolved: ${um}`);
    }
  }

  const status: ConditionalEffectStatus = effectiveUptime <= 0
    ? "inactive"
    : effectiveUptime < 1
      ? "conditionally-active"
      : "assumed-active";

  const explanation = buildExplanation(def, profileName, effectiveUptime, effectiveStacks, triggerFreq);

  return {
    effectId: def.effectId,
    effectName: def.effectId,
    status,
    effectiveUptime: Math.round(effectiveUptime * 100) / 100,
    effectiveStacks: Math.round(effectiveStacks * 10) / 10,
    maxStacks: def.maxStacks,
    contributionFactor: Math.round(contributionFactor * 100) / 100,
    stackContribution: Math.round(stackContribution * 100) / 100,
    uptimeContribution: Math.round(effectiveUptime * 100) / 100,
    warnings,
    explanation,
    triggerFrequencyEstimate: Math.round(triggerFreq * 10) / 10,
  };
}

function buildExplanation(
  def: ConditionalEffectDefinition,
  profileName: UptimeProfileName,
  uptime: number,
  stacks: number,
  freq: number,
): string {
  const profile = getUptimeProfile(profileName);
  const parts: string[] = [];

  if (def.durationSeconds > 0) {
    parts.push(`${def.durationSeconds}s duration`);
  }
  if (def.cooldownSeconds > 0) {
    parts.push(`${def.cooldownSeconds}s cooldown`);
  }
  if (def.maxStacks > 1) {
    parts.push(`${stacks}/${def.maxStacks} stacks`);
  }
  if (def.triggerProfile.type !== "manual") {
    parts.push(`~${freq}/min triggers (${profileName})`);
  }
  if (def.weaponSwapBehavior === "remove") {
    parts.push("removed on swap");
  }

  return `Uptime: ${Math.round(uptime * 100)}% · ${parts.join(", ")}`;
}

// ── Default profile ──

export function defaultUptimeProfileName(): UptimeProfileName {
  return "realistic";
}
