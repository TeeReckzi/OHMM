import type { BuildQualityScores, UptimeSensitivityAnalysis } from "./buildQualityScore";
import type { MechanicDependencySummary } from "./buildComparisonEngine";

export interface BuildRecommendation {
 suitability: SuitabilityScores;
 playstyle: PlaystyleOrientation;
 difficulty: DifficultyTier;
 assumptions: AssumptionRecommendation[];
 warnings: string[];
 confidence: RecommendationConfidence;
}

export interface SuitabilityScores {
 pvp: number;
 pve: number;
 burst: number;
 sustain: number;
 survivabilityFocused: number;
 beginner: number;
 highSkill: number;
}

export interface PlaystyleOrientation {
 primary: OrientationLabel;
 secondary: OrientationLabel | null;
 description: string;
}

export type OrientationLabel =
 | "Burst" | "Sustain" | "Balanced"
 | "PvP Assassin" | "PvE Workhorse" | "Tank"
 | "Hybrid" | "Specialist";

export type DifficultyTier = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface AssumptionRecommendation {
 condition: string;
 advice: string;
 severity: "info" | "warning" | "critical";
}

export interface RecommendationConfidence {
 level: "high" | "medium" | "low";
 reason: string;
}

export function generateRecommendation(
 scores: BuildQualityScores,
 sensitivity: UptimeSensitivityAnalysis,
 mechanicDep: MechanicDependencySummary,
 isPvP: boolean,
): BuildRecommendation {
 const suitability = computeSuitability(scores, mechanicDep, isPvP);
 const playstyle = computePlaystyleOrientation(scores, mechanicDep);
 const difficulty = computeDifficultyTier(scores);
 const assumptions = buildAssumptionRecommendations(scores, sensitivity, mechanicDep);
 const warnings = buildWarnings(scores, mechanicDep, sensitivity);
 const confidence = computeRecommendationConfidence(scores, mechanicDep);

 return { suitability, playstyle, difficulty, assumptions, warnings, confidence };
}

function computeSuitability(
 scores: BuildQualityScores,
 dep: MechanicDependencySummary,
 isPvP: boolean,
): SuitabilityScores {
 const pvp = computePvPScore(scores, dep);
 const pve = computePvEScore(scores, dep);
 const burst = computeBurstScore(scores);
 const sustain = computeSustainScore(scores);
 const survivabilityFocused = computeSurvivabilityScore(scores);
 const beginner = computeBeginnerScore(scores, dep);
 const highSkill = computeHighSkillScore(scores);

 return { pvp, pve, burst, sustain, survivabilityFocused, beginner, highSkill };
}

function computePvPScore(scores: BuildQualityScores, dep: MechanicDependencySummary): number {
 let score = scores.survivability * 0.4 + scores.formulaConfidence * 0.2 + scores.executionDifficulty * 0.2;
 if (dep.pendingCount > 0) score -= dep.pendingCount * 0.5;
 if (scores.uptimeSensitivity < 4) score -= 1;
 return clampSuitability(Math.round(score));
}

function computePvEScore(scores: BuildQualityScores, dep: MechanicDependencySummary): number {
 let score = scores.damageConsistency * 0.3 + scores.formulaConfidence * 0.3 + scores.mechanicDependency * 0.2 + scores.uptimeSensitivity * 0.2;
 if (dep.pendingCount > 0) score -= dep.pendingCount * 0.3;
 return clampSuitability(Math.round(score));
}

function computeBurstScore(scores: BuildQualityScores): number {
 return clampSuitability(Math.round(scores.damageConsistency * 0.3 + (10 - scores.uptimeSensitivity) * 0.4 + (10 - scores.executionDifficulty) * 0.3));
}

function computeSustainScore(scores: BuildQualityScores): number {
 return clampSuitability(Math.round(scores.uptimeSensitivity * 0.4 + scores.survivability * 0.3 + scores.damageConsistency * 0.3));
}

function computeSurvivabilityScore(scores: BuildQualityScores): number {
 return clampSuitability(Math.round(scores.survivability * 0.6 + scores.uptimeSensitivity * 0.2 + scores.executionDifficulty * 0.2));
}

function computeBeginnerScore(scores: BuildQualityScores, dep: MechanicDependencySummary): number {
 let score = scores.executionDifficulty * 0.4 + scores.uptimeSensitivity * 0.3 + scores.formulaConfidence * 0.3;
 if (dep.pendingCount > 0) score -= 2;
 return clampSuitability(Math.round(score));
}

function computeHighSkillScore(scores: BuildQualityScores): number {
 return clampSuitability(Math.round((10 - scores.executionDifficulty) * 0.5 + (10 - scores.uptimeSensitivity) * 0.3 + scores.damageConsistency * 0.2));
}

function clampSuitability(n: number): number {
 return Math.max(0, Math.min(10, n));
}

function computePlaystyleOrientation(
 scores: BuildQualityScores,
 dep: MechanicDependencySummary,
): PlaystyleOrientation {
 const burstLean = scores.damageConsistency * 0.3 + (10 - scores.uptimeSensitivity) * 0.4;
 const sustainLean = scores.uptimeSensitivity * 0.4 + scores.survivability * 0.3;
 const survivabilityLean = scores.survivability * 0.5 + (10 - scores.damageConsistency) * 0.2;
 const pvpLean = survivabilityLean > 5 ? 1 : 0;

 const diff = burstLean - sustainLean;

 if (diff > 2) {
  if (pvpLean > 5) return { primary: "Burst", secondary: "PvP Assassin", description: "High burst damage profile suited for PvP engagements with short kill windows." };
  return { primary: "Burst", secondary: "Balanced", description: "Prioritizes burst damage output over sustain. Effective in short fight windows." };
 }
 if (diff < -2) {
  if (survivabilityLean > 6) return { primary: "Tank", secondary: "Sustain", description: "High survivability with consistent sustain damage. Ideal for prolonged engagements." };
  return { primary: "Sustain", secondary: "Balanced", description: "Consistent damage output maintained over long fights with reliable uptime." };
 }
 if (survivabilityLean > 6) return { primary: "Tank", secondary: "Balanced", description: "Balanced damage profile with strong survivability. Versatile in most situations." };
 return { primary: "Balanced", secondary: null, description: "Well-rounded build with no strong bias toward burst or sustain. Flexible for various scenarios." };
}

function computeDifficultyTier(scores: BuildQualityScores): DifficultyTier {
 const avg = (scores.executionDifficulty + scores.uptimeSensitivity) / 2;
 if (avg >= 8) return "Beginner";
 if (avg >= 5.5) return "Intermediate";
 if (avg >= 3) return "Advanced";
 return "Expert";
}

function buildAssumptionRecommendations(
 scores: BuildQualityScores,
 sensitivity: UptimeSensitivityAnalysis,
 dep: MechanicDependencySummary,
): AssumptionRecommendation[] {
 const recommendations: AssumptionRecommendation[] = [];

 if (sensitivity.dropPercent > 0.5) {
  recommendations.push({
   condition: "Conservative uptime assumptions",
   advice: "This build loses significant value under conservative assumptions — consider optimized or perfect profiles.",
   severity: "warning",
  });
 } else if (sensitivity.dropPercent > 0.3) {
  recommendations.push({
   condition: "Conservative uptime assumptions",
   advice: "This build performs best under optimized weakspot uptime. Value drops moderately under low uptime.",
   severity: "info",
  });
 }

 if (scores.uptimeSensitivity < 4) {
  recommendations.push({
   condition: "Low uptime scenarios",
   advice: "Setup depends heavily on maintaining consistent uptime. Consider builds with less conditional reliance for inconsistent play.",
   severity: "warning",
  });
 }

 if (dep.pendingCount > 2) {
  recommendations.push({
   condition: "Unsupported mechanics",
   advice: "This setup depends heavily on unsupported mechanics — real performance may differ significantly from projections.",
   severity: "critical",
  });
 } else if (dep.pendingCount > 0) {
  recommendations.push({
   condition: "Partially supported mechanics",
   advice: `${dep.pendingCount} mechanic(s) are pending or unresolved. Formula projections are provisional.`,
   severity: "warning",
  });
 }

 if (dep.unresolvedMechanics.length > 0) {
  recommendations.push({
   condition: "Mechanics pending modeling",
   advice: `Unresolved: ${dep.unresolvedMechanics.slice(0, 3).join(", ")}${dep.unresolvedMechanics.length > 3 ? "..." : ""}. These effects are not included in projections.`,
   severity: "warning",
  });
 }

 if (scores.survivability >= 7) {
  recommendations.push({
   condition: "Survivability efficiency",
   advice: "This setup gains survivability efficiently without sacrificing significant offensive potential.",
   severity: "info",
  });
 }

 return recommendations;
}

function buildWarnings(
 scores: BuildQualityScores,
 dep: MechanicDependencySummary,
 sensitivity: UptimeSensitivityAnalysis,
): string[] {
 const warnings: string[] = [];

 if (scores.formulaConfidence < 4) {
  warnings.push("Low formula confidence — many effects in this build lack verified formula support.");
 }

 if (dep.pendingCount > 0) {
  warnings.push(`${dep.pendingCount} mechanic(s) are unresolved or ignored. Projections are conservative estimates.`);
 }

 if (sensitivity.dropPercent > 0.5) {
  warnings.push("Highly sensitivity to uptime profiles — damage drops more than 50% under conservative assumptions.");
 }

 if (dep.unresolvedMechanics.length > 0) {
  warnings.push(`Unresolved mechanics: ${dep.unresolvedMechanics.join(", ")}. These are not factored into damage projections.`);
 }

 return warnings;
}

function computeRecommendationConfidence(
 scores: BuildQualityScores,
 dep: MechanicDependencySummary,
): RecommendationConfidence {
 if (scores.formulaConfidence < 4 || dep.pendingCount > 0) {
  return { level: "low", reason: "Unsupported or pending mechanics reduce projection reliability." };
 }
 if (scores.formulaConfidence < 6 || dep.partialCount > dep.supportedCount) {
  return { level: "medium", reason: "Some effects are partially modeled — projections may shift as formulas are refined." };
 }
 return { level: "high", reason: "Most effects have confirmed formula support. Projections are reliable within model assumptions." };
}
