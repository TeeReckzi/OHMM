import type { CalculationInput } from "./formulaBridge";
import type { CombatOutput } from "./combatOutput";
import type { CombatOutputDelta } from "./combatOutputComparison";
import type { UptimeProfileName } from "../engine/conditionalEffectTypes";
import { computeCombatOutput } from "./combatOutput";
import { compareCombatOutputs } from "./combatOutputComparison";
import { buildCalculationInputFromSelection } from "./formulaBridge";
import type { BuildSelection } from "./types";
import { computeBuildQualityScores } from "./buildQualityScore";
import type { BuildQualityScores, UptimeSensitivityAnalysis } from "./buildQualityScore";

export interface ComparisonBuildData {
 id: string;
 label: string;
 selection: BuildSelection;
 calcInput: CalculationInput;
 output: CombatOutput;
}

export interface BuildComparisonResult {
 buildA: ComparisonBuildData;
 buildB: ComparisonBuildData;
 deltas: CombatOutputDelta;
 scoring: {
  buildA: BuildQualityScores;
  buildB: BuildQualityScores;
 };
 sensitivity: {
  buildA: UptimeSensitivityAnalysis;
  buildB: UptimeSensitivityAnalysis;
 };
 mechanicDependency: {
  buildA: MechanicDependencySummary;
  buildB: MechanicDependencySummary;
 };
 warnings: string[];
}

export interface MechanicDependencySummary {
 totalMechanics: number;
 supportedCount: number;
 partialCount: number;
 pendingCount: number;
 unsupportedCount: number;
 unresolvedMechanics: string[];
 modeledStatKeys: string[];
 displayOnlyStatKeys: string[];
 formulaWarnings: string[];
}

export function buildComparisonData(
 selection: BuildSelection,
 mode: "pve" | "pvp",
 uptimeProfile: UptimeProfileName,
 customAssumptions: Record<string, unknown> | undefined,
 targetId?: string,
): ComparisonBuildData {
 const calcInput = buildCalculationInputFromSelection(
  selection,
  mode,
  targetId,
  uptimeProfile,
  customAssumptions,
 );
 const output = computeCombatOutput(calcInput, calcInput.pvpMitigation);
 return {
  id: selection.id,
  label: selection.label,
  selection,
  calcInput,
  output,
 };
}

export function computeMechanicDependency(input: CalculationInput): MechanicDependencySummary {
 const unresolvedMechanics: string[] = [];
 const modeledStatKeys: string[] = [];
 const displayOnlyStatKeys: string[] = [];
 const formulaWarnings: string[] = [];

 for (const effect of input.modeledEffects) {
  modeledStatKeys.push(...(effect.formulaSupport.modeledStatCoverage ?? []));
 }
 for (const effect of input.partiallyModeledEffects) {
  const coverage = effect.formulaSupport.modeledStatCoverage ?? [];
  modeledStatKeys.push(...coverage);
  if (effect.formulaSupport.unresolvedMechanics?.length) {
   unresolvedMechanics.push(...effect.formulaSupport.unresolvedMechanics);
  }
 }
 for (const effect of input.displayOnlyEffects) {
  displayOnlyStatKeys.push(...(effect.formulaSupport.modeledStatCoverage ?? []));
 }
 for (const effect of input.unresolvedEffects) {
  unresolvedMechanics.push(effect.itemId);
 }

 formulaWarnings.push(...input.formulaWarnings);

 const allEffects = [
  ...input.modeledEffects,
  ...input.partiallyModeledEffects,
  ...input.displayOnlyEffects,
  ...input.unresolvedEffects,
  ...input.ignoredEffects,
 ];

 const supportedCount = input.modeledEffects.length;
 const partialCount = input.partiallyModeledEffects.length;
 const pendingCount = input.unresolvedEffects.length + input.ignoredEffects.length;
 const unsupportedCount = input.displayOnlyEffects.length;

 return {
  totalMechanics: allEffects.length,
  supportedCount,
  partialCount,
  pendingCount,
  unsupportedCount,
  unresolvedMechanics: [...new Set(unresolvedMechanics)],
  modeledStatKeys: [...new Set(modeledStatKeys)],
  displayOnlyStatKeys: [...new Set(displayOnlyStatKeys)],
  formulaWarnings,
 };
}

export function compareBuilds(
 buildA: ComparisonBuildData,
 buildB: ComparisonBuildData,
): BuildComparisonResult {
 const deltas = compareCombatOutputs(buildA.output, buildB.output);
 const scoringA = computeBuildQualityScores(buildA, buildA.calcInput);
 const scoringB = computeBuildQualityScores(buildB, buildB.calcInput);
 const depA = computeMechanicDependency(buildA.calcInput);
 const depB = computeMechanicDependency(buildB.calcInput);

 const warnings: string[] = [];
 if (scoringA.uptimeSensitivity < 4) {
  warnings.push(`${buildA.label} is highly sensitive to uptime assumptions — value drops significantly under conservative profiles.`);
 }
 if (scoringB.uptimeSensitivity < 4) {
  warnings.push(`${buildB.label} is highly sensitive to uptime assumptions — value drops significantly under conservative profiles.`);
 }
 if (depA.pendingCount > 0) {
  warnings.push(`${buildA.label} has ${depA.pendingCount} unresolved or ignored mechanic(s) — real performance may differ.`);
 }
 if (depB.pendingCount > 0) {
  warnings.push(`${buildB.label} has ${depB.pendingCount} unresolved or ignored mechanic(s) — real performance may differ.`);
 }
 if (depA.unsupportedCount > 0) {
  warnings.push(`${buildA.label} has ${depA.unsupportedCount} display-only effect(s) that do not contribute to formulas.`);
 }
 if (depB.unsupportedCount > 0) {
  warnings.push(`${buildB.label} has ${depB.unsupportedCount} display-only effect(s) that do not contribute to formulas.`);
 }

 return {
  buildA,
  buildB,
  deltas,
  scoring: { buildA: scoringA, buildB: scoringB },
  sensitivity: { buildA: analyzeUptimeSensitivity(buildA.selection), buildB: analyzeUptimeSensitivity(buildB.selection) },
  mechanicDependency: { buildA: depA, buildB: depB },
  warnings,
 };
}

export function analyzeUptimeSensitivity(selection: BuildSelection): UptimeSensitivityAnalysis {
 const profiles: UptimeProfileName[] = ["conservative", "realistic", "optimized", "perfect"];
 const results: { profile: UptimeProfileName; expectedDamage: number; dps: number | undefined }[] = [];

 for (const profile of profiles) {
  const input = buildCalculationInputFromSelection(selection, "pve", "training-dummy", profile);
  const output = computeCombatOutput(input, input.pvpMitigation);
  results.push({
   profile,
   expectedDamage: output.damageOutput.expectedDamage,
   dps: output.damageOutput.DPS,
  });
 }

 const conservativeVal = results.find((r) => r.profile === "conservative")?.expectedDamage ?? 0;
 const perfectVal = results.find((r) => r.profile === "perfect")?.expectedDamage ?? 0;
 const drop = conservativeVal > 0 ? ((perfectVal - conservativeVal) / perfectVal) : 0;

 return { profiles: results, dropPercent: drop };
}
