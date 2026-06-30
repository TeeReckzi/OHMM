import type { StatKey } from "../../schemas/buildGoalSchema";
import type {
  ScoreContribution, ConditionalContribution, SynergyMatch,
  ScoreBreakdown, ScoreExplanation
} from "./types";
import { getDisplayName } from "./normalizer";

export function formatSignedValue(value: number): string {
  return value >= 0 ? `+${value.toFixed(1)}` : `${value.toFixed(1)}`;
}

export function buildContributionLine(contribution: ScoreContribution): string {
  const sign = formatSignedValue(contribution.contribution);
  return `${sign} from ${contribution.breakdown}`;
}

export function buildConditionalLine(conditional: ConditionalContribution): string {
  const uptime = (conditional.estimatedUptime * 100).toFixed(0);
  const sign = formatSignedValue(conditional.contribution);
  return `${sign} from conditional: ${conditional.description} (uptime ${uptime}%)`;
}

export function buildSynergyLine(synergy: SynergyMatch): string {
  return `+${synergy.score.toFixed(1)} from synergy: ${synergy.description}`;
}

export function buildFullExplanation(
  breakdown: ScoreBreakdown,
  contributions: ScoreContribution[],
  conditionals: ConditionalContribution[],
  synergies: SynergyMatch[],
  scenarioLabel: string
): ScoreExplanation {
  const categoryScores: Record<string, number> = {
    damage: breakdown.damage,
    survivability: breakdown.survivability,
    consistency: breakdown.consistency,
    utility: breakdown.utility,
    mobility: breakdown.mobility,
    synergy: breakdown.synergy
  };

  return {
    total: breakdown.total,
    categoryScores,
    contributions,
    conditionals,
    synergies,
    scenarioLabel
  };
}

export function formatExplanationText(explanation: ScoreExplanation): string {
  const lines: string[] = [
    `=== Score Breakdown: ${explanation.scenarioLabel} ===`,
    `Total Score: ${explanation.total.toFixed(1)}`,
    "",
    "Category Scores:",
    ...Object.entries(explanation.categoryScores)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, score]) => `  ${cat}: ${formatSignedValue(score)}`),
    ""
  ];

  if (explanation.contributions.length > 0) {
    lines.push("Item Stat Contributions:", ...explanation.contributions.map(buildContributionLine));
    lines.push("");
  }

  if (explanation.conditionals.length > 0) {
    lines.push("Conditional Effects:", ...explanation.conditionals.map(buildConditionalLine));
    lines.push("");
  }

  if (explanation.synergies.length > 0) {
    lines.push("Synergies:", ...explanation.synergies.map(buildSynergyLine));
    lines.push("");
  }

  return lines.join("\n");
}

export function buildItemContribution(
  source: string,
  sourceType: ScoreContribution["sourceType"],
  statKey: StatKey,
  value: number,
  weight: number,
  contribution: number
): ScoreContribution {
  return {
    source,
    sourceType,
    statKey,
    value,
    weight,
    contribution,
    breakdown: `${getDisplayName(statKey)} (${source}): base stat ${formatSignedValue(value)} × weight ${weight.toFixed(2)} = ${formatSignedValue(contribution)}`
  };
}

export function buildSimpleExplanation(
  statKey: StatKey,
  itemName: string,
  value: number,
  weight: number,
  contribution: number
): string {
  const displayName = getDisplayName(statKey);
  return `${formatSignedValue(contribution)} from ${displayName} (${itemName}): ${formatSignedValue(value)} × ${weight.toFixed(2)}`;
}
