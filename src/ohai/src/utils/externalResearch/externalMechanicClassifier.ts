/**
 * External mechanic classifier reference.
 *
 * Source: lReDragol/OnceHuman_Tools (V4.6, Mar 2026)
 * Files: context_module.py, mechanics.py, player.py
 *
 * Classifies mechanics according to the external repo's model.
 * REFERENCE ONLY — does not affect runtime registry or calculations.
 */

export type ExternalMechanicCategory =
  | "persistent_doT"
  | "single_hit_status"
  | "weapon_ability"
  | "conditional_amplifier";

export interface ExternalMechanicEntry {
  mechanicId: string;
  externalName: string;
  category: ExternalMechanicCategory;
  baseStat: string;
  defaultMultiplier: number;
  tickInterval: number | null;
  maxStacks: number;
  supportsCrit: boolean;
  supportsWeakspot: boolean;
  hasDoTTick: boolean;
  isAmplifier: boolean;
  notes: string;
}

/**
 * External repo's mechanic definitions (from PERSISTENT_MANNEQUIN_EFFECT_DEFINITIONS
 * and trigger_ability handlers).
 *
 * These represent how the external calculator models each mechanic,
 * NOT necessarily how the game actually works.
 */
export const EXTERNAL_MECHANIC_CLASSIFICATIONS: ExternalMechanicEntry[] = [
  {
    mechanicId: "burn",
    externalName: "burn",
    category: "persistent_doT",
    baseStat: "psi_intensity",
    defaultMultiplier: 0.4,
    tickInterval: 1.0,
    maxStacks: 16,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: true,
    isAmplifier: false,
    notes: "External: psi_intensity * 0.4 per stack, 1.0s tick. No crit, no weakspot, no frequency mods. Stacks independently expire.",
  },
  {
    mechanicId: "special_burn",
    externalName: "special_burn",
    category: "persistent_doT",
    baseStat: "psi_intensity",
    defaultMultiplier: 0.4,
    tickInterval: 1.0,
    maxStacks: 16,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: true,
    isAmplifier: false,
    notes: "External: Same as burn but separate mechanic ID. May be used by specific weapons/deviations.",
  },
  {
    mechanicId: "powerSurge",
    externalName: "power_surge",
    category: "single_hit_status",
    baseStat: "psi_intensity",
    defaultMultiplier: 0.5,
    tickInterval: null,
    maxStacks: 1,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: true,
    isAmplifier: true,
    notes: "External: psi_intensity * 0.5 initial hit + DoT tick. No crit/weakspot. Amplifier: damage_to_shocked_target_percent global bonus.",
  },
  {
    mechanicId: "frostVortex",
    externalName: "frost_vortex",
    category: "single_hit_status",
    baseStat: "psi_intensity",
    defaultMultiplier: 0.6,
    tickInterval: null,
    maxStacks: 1,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: false,
    isAmplifier: false,
    notes: "External: psi_intensity * 0.6 single hit (NO DoT tick). Applies frostbite stacks via frost_vortex_applies handlers. Enables ice crystal mechanics.",
  },
  {
    mechanicId: "unstableBomber",
    externalName: "unstable_bomber",
    category: "single_hit_status",
    baseStat: "psi_intensity",
    defaultMultiplier: 1.0,
    tickInterval: null,
    maxStacks: 1,
    supportsCrit: true,
    supportsWeakspot: false,
    hasDoTTick: false,
    isAmplifier: false,
    notes: "External: psi_intensity * 1.0 single hit. Supports crit via normal rate or guaranteed_crit stat. Has delay-scaling mechanic. No DoT tick.",
  },
  {
    mechanicId: "frostbite",
    externalName: "frostbite",
    category: "conditional_amplifier",
    baseStat: "frost_vortex",
    defaultMultiplier: 0,
    tickInterval: null,
    maxStacks: 5,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: false,
    isAmplifier: true,
    notes: "External: Frostbite stacks (max 5). Applied by frost_vortex_applies. Enables conditional bonuses rather than dealing direct damage.",
  },
  {
    mechanicId: "theBullsEye",
    externalName: "the_bulls_eye",
    category: "conditional_amplifier",
    baseStat: "none",
    defaultMultiplier: 0,
    tickInterval: null,
    maxStacks: 1,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: false,
    isAmplifier: true,
    notes: "External: Marked target amplifier. Provides marked_target_damage_percent, marked_target_weakspot_damage_percent, marked_target_crit_damage_percent.",
  },
  {
    mechanicId: "fastGunner",
    externalName: "fast_gunner",
    category: "conditional_amplifier",
    baseStat: "none",
    defaultMultiplier: 0,
    tickInterval: null,
    maxStacks: 1,
    supportsCrit: false,
    supportsWeakspot: false,
    hasDoTTick: false,
    isAmplifier: true,
    notes: "External: Conditional weapon damage amplifier for weapon/bounce/shrapnel damage types when fast_gunner status is active.",
  },
];

/**
 * Returns the external classification for a mechanic ID, or undefined if not found.
 */
export function classifyExternally(mechanicId: string): ExternalMechanicEntry | undefined {
  return EXTERNAL_MECHANIC_CLASSIFICATIONS.find(
    (m) => m.mechanicId === mechanicId || m.externalName === mechanicId
  );
}

/**
 * Classifies a mechanic according to the external repo's model.
 * Returns a human-readable description.
 */
export function describeExternalClassification(mechanicId: string): string {
  const entry = classifyExternally(mechanicId);
  if (!entry) {
    return `Mechanic "${mechanicId}" has no external classification.`;
  }
  const parts: string[] = [
    `External model: ${entry.externalName}`,
    `Category: ${entry.category}`,
    `Base: ${entry.baseStat} × ${entry.defaultMultiplier}`,
    `Max stacks: ${entry.maxStacks}`,
  ];
  if (entry.tickInterval !== null) {
    parts.push(`Tick interval: ${entry.tickInterval}s`);
  }
  if (entry.hasDoTTick) {
    parts.push("Has DoT tick");
  } else {
    parts.push("No DoT tick (single hit)");
  }
  parts.push(`Crit: ${entry.supportsCrit ? "yes" : "no"}`);
  parts.push(`Weakspot: ${entry.supportsWeakspot ? "yes" : "no"}`);
  if (entry.isAmplifier) {
    parts.push("Acts as conditional amplifier");
  }
  return parts.join(" | ");
}
