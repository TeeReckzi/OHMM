import type { ScoreExplanation } from "./types";
import type { MechanicAwareWeightResult } from "./mechanicAwareScoring";

export interface AugmentedExplanation {
  explanation: ScoreExplanation;
  mechanicNotes: string[];
  maskedStats: string[];
  overrideApplied: boolean;
  hasUncertainty: boolean;
}

export function augmentExplanationWithMechanicContext(
  baseExplanation: ScoreExplanation,
  mechanicResult: MechanicAwareWeightResult
): AugmentedExplanation {
  const uncertaintyNotes = mechanicResult.statNotes.filter((n) => n.status === "uncertain");
  const hasUncertainty = uncertaintyNotes.length > 0;
  const hasOverrides = mechanicResult.overrideNotes.length > 0;

  const mechanicNotes: string[] = [...mechanicResult.contextNotes];

  return {
    explanation: {
      ...baseExplanation,
    },
    mechanicNotes,
    maskedStats: mechanicResult.maskedStats.map((s) => String(s)),
    overrideApplied: hasOverrides,
    hasUncertainty,
  };
}
