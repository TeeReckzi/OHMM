import type { StatKey } from "../../schemas/buildGoalSchema";
import type { MechanicScoringOptions, MechanicStatNote } from "./types";
import { resolveMechanicRelevance } from "./mechanicStatRelevance";
import { getMechanicBehavior } from "../../engine/index";

export interface MechanicAwareWeightResult {
  statWeights: Partial<Record<StatKey, number>>;
  statNotes: MechanicStatNote[];
  overrideNotes: string[];
  maskedStats: StatKey[];
  contextNotes: string[];
}

export function applyMechanicMaskToWeights(
  baseStatWeights: Partial<Record<StatKey, number>>,
  mechanicContext: MechanicScoringOptions
): MechanicAwareWeightResult {
  const selectedMechanicIds = mechanicContext.selectedMechanicIds ?? [];
  const equippedGearNames = mechanicContext.equippedGearNames ?? [];
  const includeUncertain = mechanicContext.includeUncertainMetadata ?? false;

  if (selectedMechanicIds.length === 0) {
    return {
      statWeights: { ...baseStatWeights },
      statNotes: [],
      overrideNotes: [],
      maskedStats: [],
      contextNotes: ["No mechanics selected — all stat weights applied"],
    };
  }

  const { relevantStats, statNotes, overrideNotes, unrecognizedIds } = resolveMechanicRelevance(
    selectedMechanicIds,
    equippedGearNames,
    includeUncertain
  );

  const maskedStats: StatKey[] = [];
  const contextNotes: string[] = [];

  const recognizedIds = selectedMechanicIds.filter((id) => !unrecognizedIds.includes(id));
  const relevantMechanicNames = recognizedIds
    .map((id) => {
      const m = getMechanicBehavior(id);
      return m?.displayName ?? id;
    })
    .join(", ");
  if (recognizedIds.length > 0) {
    contextNotes.push(`Active mechanics: ${relevantMechanicNames}`);
  }
  for (const uid of unrecognizedIds) {
    contextNotes.push(`⚠ Unrecognized mechanic ID: "${uid}" — no behavior found, ignored`);
  }

  const weightedStatKeys = Object.keys(baseStatWeights) as StatKey[];

  const filteredWeights: Partial<Record<StatKey, number>> = {};

  for (const statKey of weightedStatKeys) {
    const baseWeight = baseStatWeights[statKey];
    if (!baseWeight || baseWeight === 0) continue;

    if (relevantStats.has(statKey)) {
      filteredWeights[statKey] = baseWeight;
    } else {
      filteredWeights[statKey] = 0;
      maskedStats.push(statKey);
    }
  }

  for (const note of statNotes) {
    if (note.status === "enabled") {
      contextNotes.push(`${note.statKey}: ${note.reason}`);
    } else if (note.status === "suppressed") {
      contextNotes.push(`${note.statKey}: ${note.reason}`);
    } else if (note.status === "uncertain") {
      contextNotes.push(`⚠ ${note.statKey}: ${note.reason}`);
    }
  }

  for (const on of overrideNotes) {
    contextNotes.push(on);
  }

  if (maskedStats.length > 0) {
    contextNotes.push(`Stats zeroed by mechanic context: ${maskedStats.join(", ")}`);
  }

  if (includeUncertain) {
    const anyUncertain = statNotes.some((n) => n.status === "uncertain");
    if (anyUncertain) {
      contextNotes.push("⚠ Some mechanic metadata is marked needsRetest=true. Score contributions should be treated as provisional.");
    }
  }

  return {
    statWeights: filteredWeights,
    statNotes,
    overrideNotes,
    maskedStats,
    contextNotes,
  };
}
