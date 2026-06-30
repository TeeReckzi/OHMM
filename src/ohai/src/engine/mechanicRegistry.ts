import type {
  MechanicBehavior,
  GearMechanicOverride,
  MechanicRegistryRecord,
  EffectiveMechanicBehavior,
  AppliedOverrideMetadata,
  MechanicSource,
} from "./types";

const registry = new Map<string, MechanicRegistryRecord>();

function register(mechanic: MechanicBehavior): void {
  registry.set(mechanic.mechanicId, { mechanic, overrides: [] });
}

function addOverride(override: GearMechanicOverride): void {
  const record = registry.get(override.affectedMechanicId);
  if (record) {
    record.overrides.push(override);
  }
}

const GEAR_NAME_ALIASES: Record<string, string> = {
  "Gilded Gauntlets": "Gilded Gloves",
};

function resolveGearName(name: string): string {
  return GEAR_NAME_ALIASES[name] ?? name;
}

function cloneMechanicSource(src: MechanicSource): MechanicSource {
  return { kind: src.kind, label: src.label, version: src.version, note: src.note };
}

function cloneMechanicBehavior(b: MechanicBehavior): MechanicBehavior {
  return {
    ...b,
    source: cloneMechanicSource(b.source),
    notes: b.notes ? String(b.notes) : undefined,
  };
}

function cloneOverride(o: GearMechanicOverride): GearMechanicOverride {
  return {
    ...o,
    source: cloneMechanicSource(o.source),
    notes: o.notes ? String(o.notes) : undefined,
  };
}

register({
  mechanicId: "burn",
  displayName: "Burn",
  damageScalingBucket: "status",
  scalingStat: "statusDMG",
  vulnerabilityType: "status",
  critWeakspotBucket: "none",
  displayBehavior: "damage_over_time",
  element: "blaze",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: false,
  tickIntervalSeconds: 0.5,
  durationSeconds: 6,
  maxStacks: 5,
  baseStacks: 1,
  baseFactor: 1.0,
  damagePerStackFactor: 0.04,
  refreshesDurationOnReapply: true,
  extendsDurationOnReapply: false,
  formulaTemplateId: "burn_stack_dot",
  source: { kind: "reference_pdf", label: "Reviewed combat reference PDF", note: "Baseline Burn mechanic from pre-2026 reference. Updated May 2026 with stack-driven DoT model: damagePerStackFactor=0.04, maxStacks=5, tickInterval=0.5s." },
  confidence: "outdated_reference",
  patchContext: "Pre-2026 — tick/duration/stack values need retest for Version 2.3.8. Updated May 2026 with stack-driven DoT model.",
  needsRetest: true,
  notes: "Burn ticks every 0.5s for 6s. Max 5 stacks. Cannot crit/weakspot by default. Gilded Gloves overrides crit behavior. Stack-driven model: per-tick = weaponDMG × 0.04 × stacks."
});

register({
  mechanicId: "frostVortex",
  displayName: "Frost Vortex",
  damageScalingBucket: "status",
  scalingStat: "statusDMG",
  vulnerabilityType: "status",
  critWeakspotBucket: "none",
  displayBehavior: "damage_over_time",
  element: "frost",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: false,
  durationSeconds: 4,
  maxStacks: 1,
  baseFactor: 1.0,
  source: { kind: "in_game_observation", note: "Frost Vortex duration ~4s observed in gameplay" },
  confidence: "observed_in_game_needs_testing",
  patchContext: "Pre-2026 — needs retest for Version 2.3.8",
  needsRetest: true,
  notes: "Frost Vortex is a stacking DoT. Max concurrent vortexes may be limited. Tick interval unconfirmed."
});

register({
  mechanicId: "powerSurge",
  displayName: "Power Surge",
  damageScalingBucket: "status",
  scalingStat: "statusDMG",
  vulnerabilityType: "status",
  critWeakspotBucket: "none",
  displayBehavior: "damage_over_time",
  element: "shock",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: false,
  durationSeconds: 6,
  maxStacks: 1,
  baseFactor: 1.0,
  source: { kind: "reference_pdf", label: "Reviewed combat reference PDF", note: "Power Surge baseline from reference" },
  confidence: "outdated_reference",
  patchContext: "Pre-2026 — needs retest for Version 2.3.8",
  needsRetest: true,
  notes: "Power Surge deals Shock Status DMG over time. Default cannot crit/weakspot. Tick interval unconfirmed."
});

register({
  mechanicId: "unstableBomber",
  displayName: "Unstable Bomber",
  damageScalingBucket: "status",
  scalingStat: "statusDMG",
  vulnerabilityType: "status",
  critWeakspotBucket: "none",
  displayBehavior: "direct_hit",
  element: "blast",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: true,
  baseFactor: 1.2,
  source: { kind: "reference_pdf", note: "Unstable Bomber 120% base factor from combat reference" },
  confidence: "outdated_reference",
  patchContext: "Pre-2026 — needs retest for Version 2.3.8",
  needsRetest: true,
  notes: "Unstable Bomber deals Blast Status DMG. 120% base factor. Explosion radius falloff modeled via distanceDecay. Cannot crit/weakspot by default."
});

register({
  mechanicId: "chargedHybridStatusShot",
  displayName: "Charged Hybrid Status Shot",
  damageScalingBucket: "status",
  scalingStat: "statusDMG",
  vulnerabilityType: "status",
  critWeakspotBucket: "additive_when_both_apply",
  displayBehavior: "charged_shot",
  canCrit: true,
  canWeakspot: true,
  distanceDecay: false,
  baseFactor: 1.0,
  formulaTemplateId: "charged_status_damage_current_patch",
  source: { kind: "patch_note", version: "2.3.8", label: "May 2026 balance rework", note: "Hybrid charged weapon effects (Pathfinder, Pyroclasm Starter, Additional Rules) shifted to Status scaling while retaining crit/weakspot" },
  confidence: "reported_current_patch_needs_testing",
  patchContext: "May 2026 / Version 2.3.8 — charged hybrid scaling rework",
  needsRetest: true,
  notes: "Shared mechanic record for charged hybrid effects. Individual weapon effects (Pathfinder, Pyroclasm Starter, Additional Rules) may have additional per-weapon behavior nuances."
});

register({
  mechanicId: "butterflyEmissary",
  displayName: "Butterfly's Emissary",
  damageScalingBucket: "deviation",
  scalingStat: "psiIntensity",
  vulnerabilityType: "none",
  critWeakspotBucket: "none",
  displayBehavior: "deviation_skill",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: false,
  baseFactor: 1.2,
  formulaTemplateId: "deviation_skill_damage_current_patch",
  source: { kind: "deviation", label: "Butterfly's Emissary", version: "2.3.8" },
  confidence: "reported_current_patch_needs_testing",
  patchContext: "May 2026 / Version 2.3.8",
  needsRetest: true,
  notes: "120% × Psi Intensity per hit. Direct deviation damage instance, no tick/DoT."
});

register({
  mechanicId: "zapCamLoneWolf",
  displayName: "ZapCam / Lone Wolf's Whisper",
  damageScalingBucket: "deviation",
  scalingStat: "psiIntensity",
  vulnerabilityType: "none",
  critWeakspotBucket: "none",
  displayBehavior: "deviation_skill",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: false,
  baseFactor: 8.0,
  formulaTemplateId: "deviation_skill_damage_current_patch",
  source: { kind: "deviation", label: "ZapCam / Lone Wolf's Whisper", version: "2.3.8" },
  confidence: "reported_current_patch_needs_testing",
  patchContext: "May 2026 / Version 2.3.8",
  needsRetest: true,
  notes: "800% × Psi Intensity. Single-hit burst deviation skill."
});

register({
  mechanicId: "soulSummoner",
  displayName: "Soul Summoner",
  damageScalingBucket: "deviation",
  scalingStat: "psiIntensity",
  vulnerabilityType: "none",
  critWeakspotBucket: "none",
  displayBehavior: "deviation_skill",
  canCrit: false,
  canWeakspot: false,
  distanceDecay: false,
  baseFactor: 6.0,
  formulaTemplateId: "deviation_skill_damage_current_patch",
  source: { kind: "deviation", label: "Soul Summoner", version: "2.3.8" },
  confidence: "reported_current_patch_needs_testing",
  patchContext: "May 2026 / Version 2.3.8",
  needsRetest: true,
  notes: "600% × Psi Intensity. Single-hit burst deviation skill."
});

export function getMechanicBehavior(mechanicId: string): MechanicBehavior | undefined {
  const record = registry.get(mechanicId);
  if (!record) return undefined;
  return cloneMechanicBehavior(record.mechanic);
}

export function listMechanicBehaviors(): MechanicBehavior[] {
  return Array.from(registry.values()).map((r) => cloneMechanicBehavior(r.mechanic));
}

export function getOverridesForMechanic(mechanicId: string): GearMechanicOverride[] {
  const record = registry.get(mechanicId);
  if (!record) return [];
  return record.overrides.map(cloneOverride);
}

export function getOverridesForGear(sourceGearName: string): GearMechanicOverride[] {
  const canonicalName = resolveGearName(sourceGearName);
  const results: GearMechanicOverride[] = [];
  for (const record of registry.values()) {
    for (const override of record.overrides) {
      if (override.sourceGearName === canonicalName) {
        results.push(cloneOverride(override));
      }
    }
  }
  return results;
}

export function applyGearOverridesToMechanic(
  mechanicId: string,
  equippedGearNames: string[]
): EffectiveMechanicBehavior | undefined {
  const base = registry.get(mechanicId)?.mechanic;
  if (!base) return undefined;

  const effective: MechanicBehavior = cloneMechanicBehavior(base);

  const appliedOverrides: AppliedOverrideMetadata[] = [];

  for (const rawGearName of equippedGearNames) {
    const canonicalName = resolveGearName(rawGearName);
    const matchingOverrides = getOverridesForGear(canonicalName).filter(
      (o) => o.affectedMechanicId === mechanicId
    );

    for (const override of matchingOverrides) {
      if (override.enablesCritRollPerTick !== undefined) {
        effective.canCrit = override.enablesCritRollPerTick;
      }
      if (override.critChanceSource) {
        effective.notes = (effective.notes ?? "") + (effective.notes ? "; " : "") +
          `critChanceSource=${override.critChanceSource}`;
      }
      if (override.critDamageSource) {
        effective.notes = (effective.notes ?? "") + (effective.notes ? "; " : "") +
          `critDamageSource=${override.critDamageSource}`;
      }
      if (override.damageScalingBucketOverride) {
        effective.damageScalingBucket = override.damageScalingBucketOverride;
      }
      if (override.scalingStatOverride) {
        effective.scalingStat = override.scalingStatOverride;
      }
      if (override.vulnerabilityTypeOverride) {
        effective.vulnerabilityType = override.vulnerabilityTypeOverride;
      }
      if (override.critWeakspotBucketOverride) {
        effective.critWeakspotBucket = override.critWeakspotBucketOverride;
      }
      if (override.displayBehaviorOverride) {
        effective.displayBehavior = override.displayBehaviorOverride;
      }

      appliedOverrides.push({
        override: cloneOverride(override),
        wasApplied: true,
      });
    }

    if (matchingOverrides.length === 0) {
      appliedOverrides.push({
        override: {
          overrideId: `no-op-${canonicalName}`,
          sourceGearName: canonicalName,
          affectedMechanicId: mechanicId,
          source: { kind: "unknown" },
          confidence: "unknown",
          needsRetest: false,
        },
        wasApplied: false,
        reason: `No override found for gear "${canonicalName}" on mechanic "${mechanicId}"`,
      });
    }
  }

  return {
    ...effective,
    appliedOverrides,
  };
}

export { register as _testRegister, addOverride as _testAddOverride, cloneMechanicBehavior as _testCloneMechanicBehavior };
