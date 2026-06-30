import type { AggregatedStats } from "./modifierTypes";
import type { StatKey } from "../schemas/buildGoalSchema";
import { buildFormulaInput } from "./formulaContext";
import { calculateExpectedDamage } from "./formulaApplicator";
import type { FormulaInput, FormulaResult } from "./formulaTypes";

export function aggregatedStatsToPartialRecord(
  stats: AggregatedStats
): Partial<Record<StatKey, number>> {
  const result: Partial<Record<StatKey, number>> = {};

  for (const [key, value] of Object.entries(stats.stats)) {
    if (value !== undefined && value !== null) {
      (result as Record<string, number>)[key] = value;
    }
  }

  return result;
}

export function resolveDamageForMechanic(
  mechanicId: string,
  aggregated: AggregatedStats,
  equippedGearNames: string[]
): FormulaResult | { error: string } {
  const playerStats = aggregatedStatsToPartialRecord(aggregated);

  const inputResult = buildFormulaInput(mechanicId, playerStats, equippedGearNames);

  if ("error" in inputResult) {
    return inputResult;
  }

  return calculateExpectedDamage(inputResult);
}

export function resolveDamageForObservedCase(
  mechanicId: string,
  aggregated: AggregatedStats,
  equippedGearNames: string[]
): {
  predictedDamage: number;
  formulaResult: FormulaResult;
} | { error: string } {
  const result = resolveDamageForMechanic(
    mechanicId,
    aggregated,
    equippedGearNames
  );

  if ("error" in result) {
    return result;
  }

  return {
    predictedDamage: result.expectedDamage,
    formulaResult: result,
  };
}
