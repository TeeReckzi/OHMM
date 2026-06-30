import type { UptimeProfileName } from "../engine/conditionalEffectTypes";
import type { CalculationInput } from "./formulaBridge";
import type { ComparisonBuildData } from "./buildComparisonEngine";

export interface UptimeSensitivityProfile {
 profile: UptimeProfileName;
 expectedDamage: number;
 dps: number | undefined;
}

export interface UptimeSensitivityAnalysis {
 profiles: UptimeSensitivityProfile[];
 dropPercent: number;
}

export interface BuildQualityScores {
 damageConsistency: number;
 survivability: number;
 mobilityUtility: number;
 mechanicDependency: number;
 formulaConfidence: number;
 uptimeSensitivity: number;
 executionDifficulty: number;
 summary: {
  overall: number;
  label: string;
  strengths: string[];
  weaknesses: string[];
 };
}

export function computeBuildQualityScores(
 data: ComparisonBuildData,
 input: CalculationInput,
): BuildQualityScores {
 const dps = data.output.damageOutput.DPS ?? 0;
 const ehp = data.output.survivability.effectiveHealth ?? 0;
 const mitigation = data.output.survivability.survivabilityGainPercent;
 const totalEffects = input.totalItemsConsidered || 1;
 const modeledCount = input.modeledEffects.length;
 const partialCount = input.partiallyModeledEffects.length;
 const unresolvedCount = input.unresolvedEffects.length + input.ignoredEffects.length;
 const displayOnlyCount = input.displayOnlyEffects.length;
 const warnings = input.formulaWarnings;

 const isPvP = input.buildMode === "pvp";

 const damageConsistency = computeDamageConsistency(data, input);
 const survivability = computeSurvivabilityScore(ehp, mitigation, isPvP);
 const mobilityUtility = computeMobilityScore(data, input);
 const mechanicDependency = computeMechanicDependencyScore(modeledCount, partialCount, unresolvedCount, displayOnlyCount, totalEffects);
 const formulaConfidence = computeFormulaConfidence(modeledCount, partialCount, displayOnlyCount, unresolvedCount, totalEffects, warnings);
 const uptimeSensitivity = computeUptimeSensitivity(input.conditionalEffects);
 const executionDifficulty = computeExecutionDifficulty(data, input);

 const scores = [
  { name: "Damage Consistency", score: damageConsistency },
  { name: "Survivability", score: survivability },
  { name: "Mobility / Utility", score: mobilityUtility },
  { name: "Mechanic Dependency", score: mechanicDependency },
  { name: "Formula Confidence", score: formulaConfidence },
  { name: "Uptime Sensitivity", score: uptimeSensitivity },
  { name: "Execution Difficulty", score: executionDifficulty },
 ];

 const overall = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length * 10) / 10;

 const strengths: string[] = [];
 const weaknesses: string[] = [];

 if (damageConsistency >= 7) strengths.push("consistent damage across assumptions");
 else if (damageConsistency < 4) weaknesses.push("damage varies significantly with assumptions");

 if (survivability >= 7) strengths.push("strong survivability");
 else if (survivability < 4) weaknesses.push("low survivability");

 if (mechanicDependency >= 7) strengths.push("relies on well-modeled mechanics");
 else if (mechanicDependency < 4) weaknesses.push("depends on unresolved or partially-modeled mechanics");

 if (formulaConfidence >= 7) strengths.push("most effects are formula-supported");
 else if (formulaConfidence < 4) weaknesses.push("many effects lack formula support");

 if (uptimeSensitivity >= 7) strengths.push("performs well even under conservative uptime");
 else if (uptimeSensitivity < 4) weaknesses.push("highly sensitive to uptime assumptions");

 if (executionDifficulty >= 7) strengths.push("beginner-friendly, low execution ceiling");
 else if (executionDifficulty < 4) weaknesses.push("requires high execution skill for full value");

 const label = overall >= 8 ? "Excellent" : overall >= 6 ? "Good" : overall >= 4 ? "Average" : "Poor";

 return {
  damageConsistency,
  survivability,
  mobilityUtility,
  mechanicDependency,
  formulaConfidence,
  uptimeSensitivity,
  executionDifficulty,
  summary: { overall, label, strengths, weaknesses },
 };
}

function computeDamageConsistency(
 data: ComparisonBuildData,
 input: CalculationInput,
): number {
 const baseScore = 5;
 const hasConsistentStats = input.modeledEffects.length > 0 ? 2 : 0;
 const hasUnresolved = input.unresolvedEffects.length > 0 ? -2 : 0;
 const hasDisplayOnly = input.displayOnlyEffects.length > 0 ? -1 : 0;
 return clampScore(baseScore + hasConsistentStats + hasUnresolved + hasDisplayOnly);
}

function computeSurvivabilityScore(
 ehp: number,
 mitigationPercent: number,
 isPvP: boolean,
): number {
 let score = 3;
 if (mitigationPercent > 0) score += Math.min(3, Math.floor(mitigationPercent / 10));
 if (ehp > 10000) score += 2;
 else if (ehp > 5000) score += 1;
 if (isPvP && mitigationPercent >= 20) score += 2;
 return clampScore(score);
}

function computeMobilityScore(
 data: ComparisonBuildData,
 input: CalculationInput,
): number {
 const stats = input.aggregationReport.stats.stats;
 let score = 3;
 if (stats.movementSpeed || stats.movementSpeedBonus) score += 2;
 if (stats.foodDuration) score += 1;
 if (stats.gatheringYield || stats.miningYield) score += 1;
 return clampScore(score);
}

function computeMechanicDependencyScore(
 modeledCount: number,
 partialCount: number,
 unresolvedCount: number,
 displayOnlyCount: number,
 totalEffects: number,
): number {
 if (totalEffects === 0) return 5;
 const modeledRatio = modeledCount / totalEffects;
 const unresolvedRatio = (unresolvedCount + displayOnlyCount) / totalEffects;
 let score = 3;
 score += Math.round(modeledRatio * 5);
 score -= Math.round(unresolvedRatio * 4);
 return clampScore(score);
}

function computeFormulaConfidence(
 modeledCount: number,
 partialCount: number,
 displayOnlyCount: number,
 unresolvedCount: number,
 totalEffects: number,
 warnings: string[],
): number {
 if (totalEffects === 0) return 5;
 const modeledRatio = modeledCount / totalEffects;
 const warningPenalty = Math.min(3, Math.floor(warnings.length / 2));
 let score = 3;
 score += Math.round(modeledRatio * 5);
 score -= warningPenalty;
 if (displayOnlyCount > partialCount) score -= 1;
 return clampScore(score);
}

function computeUptimeSensitivity(conditionalEffects: unknown[]): number {
 if (conditionalEffects.length === 0) return 8;
 const unsupportedCount = (conditionalEffects as { status?: string }[]).filter(
  (e) => e.status === "unsupported-condition" || e.status === "unresolved",
 ).length;
 const supportedCount = conditionalEffects.length - unsupportedCount;
 const ratio = conditionalEffects.length > 0 ? supportedCount / conditionalEffects.length : 1;
 let score = 3 + Math.round(ratio * 5);
 if (unsupportedCount > 0) score -= 2;
 return clampScore(score);
}

function computeExecutionDifficulty(
 data: ComparisonBuildData,
 input: CalculationInput,
): number {
 let score = 6;
 const weakspotEffects = input.conditionalEffects.filter(
  (e) => e.triggerFrequencyEstimate > 10,
 );
 if (weakspotEffects.length > 2) score -= 2;
 if (input.conditionalEffects.some((e) => e.maxStacks > 5)) score -= 1;
 if (input.conditionalEffects.length === 0) score += 1;
 return clampScore(score);
}

function clampScore(n: number): number {
 return Math.max(0, Math.min(10, n));
}
