import type { FormulaResult, FormulaMultiplierBreakdown } from "./formulaTypes";

function formatPct(v: number): string {
  return v >= 1.0 ? `${((v - 1) * 100).toFixed(1)}%` : `${(v * 100).toFixed(1)}%`;
}

function formatMult(m: FormulaMultiplierBreakdown): string {
  const label = m.multiplier > 1.0
    ? `× ${m.label}: ${m.multiplier.toFixed(4)}`
    : `× ${m.label}: ${m.multiplier.toFixed(4)} (${formatPct(m.multiplier)})`;
  return `${label}  [${m.source}]`;
}

export function formatFormulaExplanation(result: FormulaResult): string[] {
  const lines: string[] = [];

  const displayName = result.mechanicId;
  lines.push(`--- Formula: ${displayName} (${result.formulaFamily}) ---`);

  if (result.formulaFamily === "unsupported") {
    lines.push("No formula available for this mechanic.");
    for (const w of result.warnings) {
      lines.push(`  ${w}`);
    }
    return lines;
  }

  lines.push(`Base Damage: ${result.baseDamage.toFixed(2)}`);

  for (const m of result.multipliers) {
    lines.push(formatMult(m));
  }

  lines.push(`Crit Multiplier: ${result.expectedCritMultiplier.toFixed(4)}`);
  lines.push(`Weakspot Multiplier: ${result.expectedWeakspotMultiplier.toFixed(4)}`);
  lines.push(`= Expected Damage: ${result.expectedDamage.toFixed(2)}`);

  if (result.burnDetails) {
    const bd = result.burnDetails;
    lines.push(`--- Burn DoT Details ---`);
    lines.push(`  Stacks:                ${bd.stacks} / ${bd.maxStacks}`);
    lines.push(`  Damage per Stack:      ${bd.damagePerStackFactor.toFixed(2)} × weaponDMG = ${bd.basePerStack.toFixed(2)}`);
    lines.push(`  Stack Contribution:    ${bd.stackContribution.toFixed(2)}`);
    lines.push(`  Flat Bonus Applied:    ${bd.flatBonusApplied.toFixed(2)}`);
    lines.push(`  Per-Tick Damage:       ${bd.perTickDamage.toFixed(2)}`);
    lines.push(`  Base Tick Interval:    ${bd.baseTickIntervalSeconds.toFixed(2)}s`);
    lines.push(`  Tick Frequency Mult:   ${bd.tickFrequencyMultiplier.toFixed(2)}x (bonus: +${bd.frequencyBonus.toFixed(2)})`);
    lines.push(`  Effective Tick Int:    ${bd.effectiveTickIntervalSeconds.toFixed(3)}s`);
    lines.push(`  Ticks Per Second:      ${bd.ticksPerSecond.toFixed(2)}`);
    lines.push(`  Damage Per Second:     ${bd.damagePerSecond.toFixed(2)}`);
    if (bd.dotResistanceApplied > 0) {
      lines.push(`  DoT Resistance:        -${(bd.dotResistanceApplied * 100).toFixed(0)}%`);
    }
    if (bd.burnResistanceApplied > 0) {
      lines.push(`  Burn Res Debuff:       -${(bd.burnResistanceApplied * 100).toFixed(0)}% (${(bd.burnResistanceApplied / 0.15).toFixed(0)} levels)`);
    }
  }

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      lines.push(`  ${w}`);
    }
  }

  return lines;
}
