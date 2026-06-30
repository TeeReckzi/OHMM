import type { StatKey } from "../../schemas/buildGoalSchema";
import type { MechanicScoringOptions, MechanicStatNote } from "./types";
import {
  applyGearOverridesToMechanic,
  getMechanicBehavior,
} from "../../engine/index";
import type { EffectiveMechanicBehavior } from "../../engine/types";

const ELEMENT_MAP: Record<string, StatKey[]> = {
  blaze: ["burnDMGBonus"],
  frost: ["frostVortexDMGBonus"],
  shock: ["powerSurgeDMGBonus"],
  blast: ["unstableBomberDMGBonus"],
};

const MECHANIC_KEYWORD_MAP: Record<string, StatKey[]> = {
  burn: ["burnDMGBonus"],
  frostVortex: ["frostVortexDMGBonus"],
  powerSurge: ["powerSurgeDMGBonus"],
  unstableBomber: ["unstableBomberDMGBonus"],
};

export interface RelevanceResult {
  effectiveBehaviors: EffectiveMechanicBehavior[];
  relevantStats: Set<StatKey>;
  statNotes: MechanicStatNote[];
  overrideNotes: string[];
  unrecognizedIds: string[];
}

function buildRelevance(
  effectiveBehaviors: EffectiveMechanicBehavior[],
  includeUncertain: boolean
): { relevantStats: Set<StatKey>; statNotes: MechanicStatNote[]; overrideNotes: string[] } {
  const relevant = new Set<StatKey>();
  const notes: MechanicStatNote[] = [];
  const overrideNotes: string[] = [];

  for (const eb of effectiveBehaviors) {
    const mid = eb.mechanicId;

    if (eb.damageScalingBucket === "status") {
      relevant.add("statusDMGBonus");
      notes.push({ statKey: "statusDMGBonus", status: "enabled", reason: `${mid} damageScalingBucket=status` });
    }
    if (eb.damageScalingBucket === "weapon") {
      relevant.add("weaponDMG");
      notes.push({ statKey: "weaponDMG", status: "enabled", reason: `${mid} damageScalingBucket=weapon` });
    }
    if (eb.damageScalingBucket === "deviation") {
      relevant.add("psiIntensity");
      notes.push({ statKey: "psiIntensity", status: "enabled", reason: `${mid} damageScalingBucket=deviation` });
    }

    if (eb.element && ELEMENT_MAP[eb.element]) {
      for (const ek of ELEMENT_MAP[eb.element]) {
        relevant.add(ek);
        notes.push({ statKey: ek, status: "enabled", reason: `${mid} element=${eb.element}` });
      }
    }

    if (eb.element && (eb.element === "blaze" || eb.element === "frost" || eb.element === "shock" || eb.element === "blast")) {
      relevant.add("elementalDMGBonus");
      notes.push({ statKey: "elementalDMGBonus", status: "enabled", reason: `${mid} has elemental damage type ${eb.element}` });
    }

    if (eb.canCrit) {
      relevant.add("critRate");
      relevant.add("critDMG");
      notes.push({ statKey: "critRate", status: "enabled", reason: `${mid} canCrit=true` });
      notes.push({ statKey: "critDMG", status: "enabled", reason: `${mid} canCrit=true` });
    } else {
      notes.push({ statKey: "critRate", status: "suppressed", reason: `${mid} cannot crit by default` });
      notes.push({ statKey: "critDMG", status: "suppressed", reason: `${mid} cannot crit by default` });
    }

    if (eb.canWeakspot) {
      relevant.add("weakspotDMG");
      relevant.add("bullseyeDMG");
      notes.push({ statKey: "weakspotDMG", status: "enabled", reason: `${mid} canWeakspot=true` });
    } else {
      notes.push({ statKey: "weakspotDMG", status: "suppressed", reason: `${mid} cannot hit weakspot by default` });
      notes.push({ statKey: "bullseyeDMG", status: "suppressed", reason: `${mid} cannot hit weakspot by default` });
    }

    if (eb.vulnerabilityType === "status") {
      relevant.add("statusDMGBonus");
      notes.push({ statKey: "statusDMGBonus", status: "enabled", reason: `${mid} vulnerabilityType=status` });
    }
    if (eb.vulnerabilityType === "weapon") {
      relevant.add("weaponDMG");
      notes.push({ statKey: "weaponDMG", status: "enabled", reason: `${mid} vulnerabilityType=weapon` });
    }

    const ks = MECHANIC_KEYWORD_MAP[mid];
    if (ks) {
      for (const k of ks) {
        relevant.add(k);
        notes.push({ statKey: k, status: "enabled", reason: `Mechanic ${mid} active` });
      }
    }

    if (eb.needsRetest && includeUncertain) {
      notes.push({
        statKey: "critRate",
        status: "uncertain",
        reason: `${mid} metadata marked needsRetest=true; stat relevance provisional`,
      });
    }

    if (eb.appliedOverrides.length > 0) {
      for (const ao of eb.appliedOverrides) {
        if (ao.wasApplied) {
          const gn = ao.override.sourceGearName;
          const oid = ao.override.overrideId;
          overrideNotes.push(`${gn} (${oid}) applied to ${mid}`);
          if (ao.override.enablesCritRollPerTick) {
            overrideNotes.push(`  → ${gn}: enablesCritRollPerTick for ${mid}`);
          }
        }
      }
    }
  }

  return { relevantStats: relevant, statNotes: notes, overrideNotes };
}

export function resolveMechanicRelevance(
  selectedMechanicIds: string[],
  equippedGearNames: string[],
  includeUncertain: boolean
): RelevanceResult {
  const effectiveBehaviors: EffectiveMechanicBehavior[] = [];
  const unrecognizedIds: string[] = [];

  for (const mid of selectedMechanicIds) {
    const base = getMechanicBehavior(mid);
    if (!base) {
      unrecognizedIds.push(mid);
      continue;
    }

    const effective = applyGearOverridesToMechanic(mid, equippedGearNames);
    if (effective) {
      effectiveBehaviors.push(effective);
    }
  }

  const { relevantStats, statNotes, overrideNotes } = buildRelevance(effectiveBehaviors, includeUncertain);

  return { effectiveBehaviors, relevantStats, statNotes, overrideNotes, unrecognizedIds };
}

export function isStatRelevant(statKey: StatKey, relevanceMask: Set<StatKey>): boolean {
  return relevanceMask.has(statKey);
}
