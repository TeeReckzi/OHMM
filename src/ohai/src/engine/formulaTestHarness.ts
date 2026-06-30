import type {
  ObservedDamageCase,
  ValidationResult,
  ValidationThresholds,
} from "./formulaTestTypes";
import {
  computeAverage,
  computeMedian,
  classifyError,
  suggestMissingBucket,
  DEFAULT_THRESHOLDS,
} from "./formulaTestTypes";
import { buildFormulaInput } from "./formulaContext";
import { calculateExpectedDamage } from "./formulaApplicator";
import type { FormulaInput, FormulaResult } from "./formulaTypes";
import type { EffectiveMechanicBehavior } from "./types";
import { listMechanicBehaviors } from "./mechanicRegistry";

const FORMULA_ASSUMPTIONS: string[] = [
  "Elemental DMG and Status DMG are separate multiplicative buckets.",
  "Keyword-specific damage (Burn DMG, Power Surge DMG, etc.) is its own multiplicative bucket.",
  "Attack% and Weapon DMG% are separate multiplicative buckets for physical weapon damage.",
  "Crit DMG and Weakspot DMG are additive inside the same combined-hit bucket when both apply.",
  "Vulnerability/target-side damage taken modifiers are late standalone multipliers.",
  "Gilded Gloves only enables Burn crit eligibility, does not create extra Burn events.",
  "EBR Grilled Octopus fire ring is a separate proc source, not modeled inside Gilded Gloves logic.",
  "[PROVISIONAL] Recent patches standardized many unique weapon talent procs / charging effects from Weapon DMG-style handling into Status DMG-style handling.",
  "[PROVISIONAL] Status-style proc instances use: base × Psi Intensity (or proc baseline) × Elemental DMG × Status DMG × keyword-specific × target/vulnerability × crit/weakspot (if eligible).",
  "[PROVISIONAL] Physical bullets use: weapon base damage × Attack% × Weapon DMG% × additive crit/weakspot × vulnerability/enemy-type.",
  "[PROVISIONAL] EBR Grilled Octopus fire ring should be treated as a Status/Elemental proc, not a normal weapon hit.",
  "[PROVISIONAL] Gilded Gloves / Gilded Gauntlets enable Burn crit eligibility only — no extra Burn events created.",
  "[PROVISIONAL] Burn uses a stack-driven DoT model: per-tick damage = weaponDMG × 0.04 × stacks × multipliers. Frequency can be modified by BBQ Gloves up to +100%. DoT resistance and Burn Resistance debuffs are separate reduction multipliers.",
];

function buildProcFallbackInput(
  caseData: ObservedDamageCase
): FormulaInput | { error: string } {
  const effectiveBehavior: EffectiveMechanicBehavior = {
    mechanicId: caseData.mechanicId,
    displayName: caseData.displayName,
    damageScalingBucket: "unknown",
    scalingStat: "statusDMG",
    vulnerabilityType: "status",
    critWeakspotBucket: "none",
    displayBehavior: "unknown",
    canCrit: false,
    canWeakspot: false,
    distanceDecay: false,
    source: { kind: "unknown" },
    confidence: "unknown",
    needsRetest: true,
    appliedOverrides: [],
  };

  return {
    mechanicId: caseData.mechanicId,
    effectiveBehavior,
    baseWeaponDMG: caseData.playerStats.weaponDMG,
    psiIntensity: caseData.playerStats.psiIntensity,
  };
}

function buildPhysicalWeaponInput(
  caseData: ObservedDamageCase
): FormulaInput | { error: string } {
  const ps = caseData.playerStats;
  const baseWeaponDMG = ps.weaponDMG ?? 100;
  const atkPct = ps.attackPercent ?? 0;
  const weaponDMGBonus = (ps as Record<string, number | undefined>).weaponDMGBonus ?? 0;

  const effectiveBehavior: EffectiveMechanicBehavior = {
    mechanicId: caseData.mechanicId,
    displayName: caseData.displayName,
    damageScalingBucket: "weapon",
    scalingStat: "weaponDMG",
    vulnerabilityType: "weapon",
    critWeakspotBucket: "additive_when_both_apply",
    displayBehavior: "direct_hit",
    element: "physical",
    canCrit: caseData.expectedFlags.crit ?? true,
    canWeakspot: caseData.expectedFlags.weakspot ?? true,
    distanceDecay: false,
    source: { kind: "manual_model" },
    confidence: "inferred",
    needsRetest: true,
    appliedOverrides: [],
  };

  return {
    mechanicId: caseData.mechanicId,
    effectiveBehavior,
    baseWeaponDMG,
    attackPercent: atkPct,
    weaponDMGBonus,
    statusDMGBonus: ps.statusDMGBonus,
    elementalDMGBonus: ps.elementalDMGBonus,
    keywordSuffixDMGBonus: ps.keywordSuffixDMGBonus ?? ps.burnDMGBonus ?? ps.powerSurgeDMGBonus ?? ps.frostVortexDMGBonus ?? ps.unstableBomberDMGBonus,
    psiIntensity: ps.psiIntensity,
    critRate: ps.critRate,
    critDMG: ps.critDMG,
    weakspotDMG: ps.weakspotDMG,
    weaponVulnerability: ps.weaponVulnerability,
    statusVulnerability: ps.statusVulnerability,
    enemyTypeDMGBonus: ps.enemyTypeDMGBonus,
    currentStacks: ps.burnCurrentStacks,
    flatBurnBonus: ps.flatBurnBonus,
    humanDamageBonus: ps.humanDamageBonus,
    dotResistanceReduction: ps.dotResistanceReduction,
    burnResistanceDebuffLevel: ps.burnResistanceDebuffLevel,
    tickFrequencyMultiplier: ps.burnTickFrequencyBonus !== undefined
      ? 1 + ps.burnTickFrequencyBonus
      : undefined,
    stackCount: undefined,
  };
}

function buildFormulaInputFromCase(
  caseData: ObservedDamageCase
): FormulaInput | { error: string } {
  const mechanicExists = listMechanicBehaviors().some(
    (m) => m.mechanicId === caseData.mechanicId
  );

  if (mechanicExists) {
    const result = buildFormulaInput(
      caseData.mechanicId,
      caseData.playerStats,
      caseData.activeGear
    );
    return result;
  }

  // Proc sources (e.g. EBR fire ring) are not mechanics — route to fallback
  if (caseData.expectedFlags.procSource) {
    return buildProcFallbackInput(caseData);
  }

  if (
    caseData.formulaFamily === "physical_weapon_damage" ||
    caseData.formulaFamily === "unsupported"
  ) {
    return buildPhysicalWeaponInput(caseData);
  }

  return {
    error: `Mechanic "${caseData.mechanicId}" not found in registry and no fallback available.`,
  };
}

function analyzeMissingBucket(
  predicted: number,
  observedAvg: number,
  caseData: ObservedDamageCase,
  result: FormulaResult
): string | undefined {
  if (predicted <= 0 || observedAvg <= 0) return undefined;
  const ratio = observedAvg / predicted;

  if (ratio >= 0.95 && ratio <= 1.05) return undefined;

  const base = suggestMissingBucket(predicted, observedAvg);
  if (base) return base;

  if (ratio < 0.95) {
    return "Predicted exceeds observed — possible bucket overlap overcount or formula overestimates base damage.";
  }

  return undefined;
}

export function validateCase(
  caseData: ObservedDamageCase,
  thresholds: ValidationThresholds = DEFAULT_THRESHOLDS
): ValidationResult {
  const observedAvg = computeAverage(caseData.observedHits);
  const observedMed = computeMedian(caseData.observedHits);

  const inputResult = buildFormulaInputFromCase(caseData);

  if ("error" in inputResult) {
    return {
      caseId: caseData.caseId,
      displayName: caseData.displayName,
      mechanicId: caseData.mechanicId,
      formulaFamily: caseData.formulaFamily,
      predictedDamage: 0,
      observedAverage: observedAvg,
      observedMedian: observedMed,
      hitCount: caseData.observedHits.length,
      absoluteError: observedAvg,
      percentError: observedAvg > 0 ? 100 : 0,
      predictedUnder: false,
      classification: "fail",
      multiplierBreakdown: [],
      formulaAssumptions: FORMULA_ASSUMPTIONS,
      warnings: [inputResult.error],
      needsRetest: true,
      observedHits: caseData.observedHits,
    };
  }

  const formulaResult = calculateExpectedDamage(inputResult);
  const predicted = formulaResult.expectedDamage;
  const absError = Math.abs(predicted - observedAvg);
  const pctError = observedAvg > 0 ? (absError / observedAvg) * 100 : 0;

  // Override classification for unsupported formula families (e.g. proc sources
  // with unknown formula) — always mark as fail with clear explanation
  let classification: import("./formulaTestTypes").ValidationClassification;
  let extraWarnings: string[] = [];

  if (formulaResult.formulaFamily === "unsupported") {
    classification = "fail";
    if (caseData.expectedFlags.procSource === "ebr_fire_ring") {
      extraWarnings = [
        `⚠ PROC FORMULA UNKNOWN: Case "${caseData.caseId}" is a proc source (mechanicId="${caseData.mechanicId}") with no confirmed formula. Scaling source and base multiplier are unknown. In-game testing required before a formula can be assigned. See docs/external-research/ebr-fire-ring-investigation.md.`,
      ];
    } else if (caseData.expectedFlags.procSource === "power_surge") {
      extraWarnings = [
        `⚠ PROC FORMULA UNKNOWN: Case "${caseData.caseId}" (mechanicId="${caseData.mechanicId}") is an unresolved hypothesis with no confirmed formula. Model conflict — external repo classifies Power Surge as hybrid (initial hit + DoT + global amp). In-game testing required. See docs/external-research/power-surge-investigation.md.`,
      ];
    } else if (caseData.expectedFlags.procSource) {
      extraWarnings = [
        `⚠ PROC FORMULA UNKNOWN: Case "${caseData.caseId}" (mechanicId="${caseData.mechanicId}") is an unresolved hypothesis with no confirmed formula. Model conflict exists — external repo disagrees. In-game testing required. See docs/external-research/frost-vortex-investigation.md.`,
      ];
    } else {
      extraWarnings = [
        `⚠ FORMULA UNRESOLVED: Case "${caseData.caseId}" (mechanicId="${caseData.mechanicId}") has no confirmed formula. This may be an unresolved hypothesis or a model conflict. In-game testing required to determine correct formula behavior.`,
      ];
    }
  } else {
    classification = classifyError(pctError, thresholds);
  }

  const missingBucket = analyzeMissingBucket(
    predicted,
    observedAvg,
    caseData,
    formulaResult
  );

  const caseWarnings = caseData.warnings ?? [];

  return {
    caseId: caseData.caseId,
    displayName: caseData.displayName,
    mechanicId: caseData.mechanicId,
    formulaFamily: formulaResult.formulaFamily,
    predictedDamage: predicted,
    observedAverage: observedAvg,
    observedMedian: observedMed,
    hitCount: caseData.observedHits.length,
    absoluteError: absError,
    percentError: Math.round(pctError * 100) / 100,
    predictedUnder: predicted < observedAvg,
    classification,
    likelyMissingBucket: missingBucket,
    multiplierBreakdown: formulaResult.multipliers,
    formulaAssumptions: FORMULA_ASSUMPTIONS,
    warnings: [...formulaResult.warnings, ...extraWarnings, ...caseWarnings],
    needsRetest: true,
    observedHits: caseData.observedHits,
  };
}

export function validateAllCases(
  cases: ObservedDamageCase[],
  thresholds?: ValidationThresholds
): ValidationResult[] {
  return cases.map((c) => validateCase(c, thresholds));
}

export function formatValidationReport(
  results: ValidationResult[]
): string[] {
  const lines: string[] = [];
  lines.push("=".repeat(72));
  lines.push("FORMULA VALIDATION REPORT");
  lines.push("=".repeat(72));
  lines.push("");

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const r of results) {
    lines.push(`--- ${r.caseId}: ${r.displayName} ---`);
    lines.push(`  Mechanic:        ${r.mechanicId}`);
    lines.push(`  Formula Family:  ${r.formulaFamily}`);
    lines.push(`  Predicted:       ${r.predictedDamage.toFixed(2)}`);
    lines.push(`  Observed Avg:    ${r.observedAverage.toFixed(2)}`);
    lines.push(`  Observed Median: ${r.observedMedian.toFixed(2)}`);
    lines.push(`  Hits:            ${r.hitCount}`);
    lines.push(`  Abs Error:       ${r.absoluteError.toFixed(2)}`);
    lines.push(`  % Error:         ${r.percentError.toFixed(2)}%`);
    lines.push(`  Classification:  ${r.classification.toUpperCase()}`);

    if (r.likelyMissingBucket) {
      lines.push(`  Missing Bucket:  ${r.likelyMissingBucket}`);
    }

    if (r.warnings.length > 0) {
      for (const w of r.warnings) {
        lines.push(`  Warning: ${w}`);
      }
    }

    if (r.multiplierBreakdown.length > 0) {
      lines.push("  Multipliers:");
      for (const m of r.multiplierBreakdown) {
        lines.push(`    × ${m.label}: ${m.multiplier.toFixed(4)}  [${m.source}]`);
      }
    }

    lines.push("");

    if (r.classification === "pass") passCount++;
    else if (r.classification === "warn") warnCount++;
    else failCount++;
  }

  lines.push("=".repeat(72));
  lines.push("SUMMARY");
  lines.push("=".repeat(72));
  lines.push(`  Pass: ${passCount}  Warn: ${warnCount}  Fail: ${failCount}`);
  lines.push(`  Total: ${results.length}`);
  lines.push("");

  lines.push("Formula Assumptions:");
  for (const a of FORMULA_ASSUMPTIONS) {
    lines.push(`  - ${a}`);
  }
  lines.push("");

  return lines;
}
