import type { PvPMitigationResult } from "./pvpMitigation";
import type { CalculationInput } from "./formulaBridge";
import { buildExpectedDamageFromCalculationInput } from "./formulaDamageAdapter";
import type { OfficialFormulaRuntimeStatus } from "../engine/officialFormulaMetadata";

export type DuelPressure = "You kill faster" | "You die faster" | "Survivability favored" | "Damage favored" | "Unknown";

export interface SurvivabilityMetrics {
  damageTakenMultiplier: number;
  effectiveHealthMultiplier: number;
  effectiveHealth: number | undefined;
  incomingDamageAfterMitigation: number | undefined;
  shotsToDie: number | undefined;
  survivabilityGainPercent: number;
}

export interface DamageOutputMetrics {
  baseDamage: number;
  expectedDamage: number;
  critMultiplier: number;
  weakspotMultiplier: number;
  totalMultiplier: number;
  DPS: number | undefined;
  tickIntervalSeconds: number | undefined;
  ticksPerSecond: number | undefined;
}

export interface PvPDuelContext {
  outgoingTTK: number | undefined;
  incomingTTK: number | undefined;
  duelPressure: DuelPressure;
}

export interface OfficialFormulaDiagnostics {
  /** Execution depth of the official formula for the primary mechanic */
  status: OfficialFormulaRuntimeStatus;
  /** Warnings about official formula limitations or missing data */
  warnings: string[];
  /** Whether official formula damage was computed (terminal-only or better) */
  officialDamageAvailable: boolean;
  /** Official formula damage value, if computed */
  officialDamage?: number;
  /** Leaves that could not be resolved from recovered data */
  unresolvedLeaves: string[];
  /** Accuracy note — never claim official accuracy until status=validated */
  accuracyNote: string;
}

export interface CombatOutput {
  damageOutput: DamageOutputMetrics;
  survivability: SurvivabilityMetrics;
  pvpDuel: PvPDuelContext;
  warnings: string[];
  assumptions: string[];
  buildMode: "pve" | "pvp";
  incomingDPSProvided: boolean;
  targetHealthProvided: boolean;
  /** Official formula diagnostics for the primary mechanic */
  officialFormula: OfficialFormulaDiagnostics;
}

export interface CombatOutputOptions {
  playerHealth?: number;
  incomingHitDamage?: number;
  targetHealth?: number;
  outgoingDPS?: number;
  incomingDPS?: number;
  tickIntervalSeconds?: number;
  baseWeaponDMG?: number;
  critEnabled?: boolean;
  weakspotEnabled?: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeCombatOutput(
  calculationInput: CalculationInput,
  pvpMitigation: PvPMitigationResult,
  formulaDamage?: number,
  formulaMultipliers?: { label: string; multiplier: number; source: string }[],
  options?: CombatOutputOptions,
): CombatOutput {
  const warnings: string[] = [];
  const assumptions: string[] = [];

  const opts: CombatOutputOptions = options ?? {};

  // Use baseWeaponDMG from CalculationInput if not explicitly provided in options
  const resolvedBaseDMG = opts.baseWeaponDMG ?? calculationInput.baseWeaponDMG;
  const adapterResult = formulaDamage === undefined
    ? buildExpectedDamageFromCalculationInput(
      calculationInput,
      resolvedBaseDMG,
      opts.critEnabled,
      opts.weakspotEnabled,
    )
    : undefined;

  const resolvedFormulaDamage = formulaDamage ?? adapterResult?.formulaDamage ?? 0;
  const resolvedFormulaMultipliers = formulaMultipliers ?? adapterResult?.formulaMultipliers ?? [];
  const resolvedTickInterval = opts.tickIntervalSeconds ?? adapterResult?.tickIntervalSeconds;
  // BOUNDARY NOTE (combatOutput): uses adapter's formulaDamage directly as the engine's expected damage.
  // (The engine already folded the listed multipliers into expectedDamage.)
  // Multipliers are kept only for reporting/breakdown, not re-multiplied into the damage value.

  if (adapterResult) {
    assumptions.push(`Formula adapter selected primary mechanic: ${adapterResult.primaryMechanic.mechanicId}.`);
    for (const warning of adapterResult.warnings) {
      warnings.push(`[Formula Adapter] ${warning}`);
    }
    for (const excluded of adapterResult.excludedItems) {
      warnings.push(`[Formula Adapter] Excluded from damage calculation: ${excluded}.`);
    }
  }

  // ── Damage Output ──

  const baseDamage = resolvedFormulaDamage;
  const expectedDamage = resolvedFormulaDamage;

  let totalMultiplier = 1;
  let critM = 1;
  let weakspotM = 1;
  if (resolvedFormulaMultipliers.length > 0) {
    for (const m of resolvedFormulaMultipliers) {
      totalMultiplier *= m.multiplier;
      if (m.label.toLowerCase().includes("crit")) critM = m.multiplier;
      if (m.label.toLowerCase().includes("weakspot")) weakspotM = m.multiplier;
    }
  }

  const tickInterval = resolvedTickInterval;
  let ticksPerSec: number | undefined;
  let dps: number | undefined;

  if (tickInterval !== undefined && tickInterval > 0) {
    ticksPerSec = round2(1 / tickInterval);
    dps = round2(expectedDamage * ticksPerSec);
  }

  if (opts.outgoingDPS !== undefined) {
    dps = round2(opts.outgoingDPS);
  }

  if (dps === undefined && calculationInput.baseFireRate !== undefined && calculationInput.baseFireRate > 0) {
    const fireRateBonus = calculationInput.aggregationReport.stats.stats.fireRate ?? 0;
    const effectiveFireRate = calculationInput.baseFireRate * (1 + fireRateBonus);
    const shotsPerSecond = effectiveFireRate / 60;
    dps = round2(expectedDamage * shotsPerSecond);
    assumptions.push('DPS estimated from weapon fire rate: ' + round2(effectiveFireRate) + ' RPM.');
  }

  if (dps === undefined) {
    assumptions.push("DPS not computed — no tick interval, fire rate, or outgoing DPS provided. Damage per hit shown only.");
  }

  const damageOutput: DamageOutputMetrics = {
    baseDamage: round2(baseDamage),
    expectedDamage: round2(expectedDamage),
    critMultiplier: round2(critM),
    weakspotMultiplier: round2(weakspotM),
    totalMultiplier: round2(totalMultiplier),
    DPS: dps,
    tickIntervalSeconds: tickInterval !== undefined ? round2(tickInterval) : undefined,
    ticksPerSecond: ticksPerSec,
  };

  // ── Survivability ──

  const totalReductionPct = pvpMitigation.pvpMode ? pvpMitigation.totalReductionPercent : 0;
  const dmgTakenMult = round2(1 - totalReductionPct / 100);
  const ehpMult = totalReductionPct >= 100 ? Infinity : round2(1 / (1 - totalReductionPct / 100));
  const survGainPct = totalReductionPct > 0 ? round2((ehpMult - 1) * 100) : 0;

  let effectiveHealth: number | undefined;
  let incomingAfterMitigation: number | undefined;
  let shotsToDie: number | undefined;

  if (opts.playerHealth !== undefined && opts.playerHealth > 0) {
    effectiveHealth = round2(opts.playerHealth * ehpMult);
    assumptions.push(`Effective health computed using player health: ${opts.playerHealth}.`);
  } else {
    assumptions.push("Effective health not computed — no player health provided. Multipliers shown only.");
  }

  if (opts.incomingHitDamage !== undefined && opts.incomingHitDamage > 0) {
    incomingAfterMitigation = round2(opts.incomingHitDamage * dmgTakenMult);
    assumptions.push(`Incoming damage after mitigation uses example hit: ${opts.incomingHitDamage}.`);

    if (opts.playerHealth !== undefined && opts.playerHealth > 0 && incomingAfterMitigation > 0) {
      shotsToDie = Math.ceil(opts.playerHealth / incomingAfterMitigation);
    }
  } else {
    assumptions.push("Shots to die not computed — no incoming hit damage or player health provided.");
  }

  if (pvpMitigation.pvpMode && pvpMitigation.sources.length === 0) {
    warnings.push("PvP mode active but no mitigation sources found. Damage taken is raw.");
  }

  const survivability: SurvivabilityMetrics = {
    damageTakenMultiplier: dmgTakenMult,
    effectiveHealthMultiplier: ehpMult === Infinity ? Infinity : ehpMult,
    effectiveHealth,
    incomingDamageAfterMitigation: incomingAfterMitigation,
    shotsToDie,
    survivabilityGainPercent: survGainPct,
  };

  // ── PvP Duel Context ──

  let outgoingTTK: number | undefined;
  let incomingTTK: number | undefined;
  let duelPressure: DuelPressure = "Unknown";

  if (pvpMitigation.pvpMode) {
    if (opts.targetHealth !== undefined && dps !== undefined && dps > 0) {
      outgoingTTK = round2(opts.targetHealth / dps);
      assumptions.push(`Outgoing TTK uses target health: ${opts.targetHealth} and DPS: ${dps}.`);
    } else {
      assumptions.push("Outgoing TTK not computed — no target health or DPS provided.");
    }

    if (opts.incomingDPS !== undefined && opts.incomingDPS > 0) {
      const playerEHP = effectiveHealth ?? opts.playerHealth;
      if (playerEHP !== undefined && playerEHP > 0) {
        incomingTTK = round2(playerEHP / opts.incomingDPS);
        assumptions.push(`Incoming TTK uses effective health: ${playerEHP.toFixed(0)}, incoming DPS: ${opts.incomingDPS}.`);
      } else {
        assumptions.push("Incoming TTK not computed — cannot determine effective health or incoming DPS.");
      }
    } else {
      assumptions.push("Incoming TTK not computed — no incoming DPS provided.");
    }

    if (outgoingTTK !== undefined && incomingTTK !== undefined) {
      if (outgoingTTK < incomingTTK) {
        duelPressure = "You kill faster";
      } else if (outgoingTTK > incomingTTK) {
        duelPressure = "You die faster";
      } else {
        duelPressure = "Survivability favored";
      }
    } else if (survivability.effectiveHealthMultiplier > 1 && survivability.effectiveHealthMultiplier < Infinity) {
      duelPressure = "Survivability favored";
    } else if (dps !== undefined && dps > 0) {
      duelPressure = "Damage favored";
    }
  }

  if (duelPressure === "Unknown" && !pvpMitigation.pvpMode) {
    assumptions.push("PvP duel context not relevant — PvE mode active.");
  }

  const pvpDuel: PvPDuelContext = {
    outgoingTTK,
    incomingTTK,
    duelPressure: duelPressure ?? "Unknown",
  };

  // ── General warnings ──

  for (const w of calculationInput.formulaWarnings) {
    warnings.push(w);
  }
  for (const w of pvpMitigation.warnings) {
    if (!warnings.includes(w)) warnings.push(w);
  }

  // ── Official formula diagnostics ──

  const primaryMechanic = adapterResult?.primaryMechanic;
  const officialStatus: OfficialFormulaRuntimeStatus =
    primaryMechanic?.officialFormulaStatus ?? "metadata-only";
  const officialWarnings: string[] = [];

  // Always note that the legacy path is still the primary output
  officialWarnings.push(
    "Legacy expected-damage path is the primary displayed value. Official formula is supplementary until status=validated."
  );

  if (officialStatus === "terminal-only") {
    officialWarnings.push(
      "Official formula is terminal-only: final_attack_additional_rate and final_attack_ignore_dam_rate are not yet connected to the full graph."
    );
  }

  if (officialStatus === "metadata-only") {
    officialWarnings.push(
      "Official formula runtime is metadata-only: no recipe available for this mechanic."
    );
  }

  const unresolvedLeaves = primaryMechanic?.officialUnresolvedLeaves ?? [];
  if (unresolvedLeaves.length > 0) {
    officialWarnings.push(
      `Unresolved official formula leaves: ${unresolvedLeaves.join(", ")}`
    );
  }

  // Surface per-mechanic official formula warnings
  if (primaryMechanic?.officialFormulaWarnings) {
    for (const w of primaryMechanic.officialFormulaWarnings) {
      if (!officialWarnings.includes(w)) officialWarnings.push(w);
    }
  }

  const officialDamage = primaryMechanic?.officialFormulaDamage;
  const officialFormula: OfficialFormulaDiagnostics = {
    status: officialStatus,
    warnings: officialWarnings,
    officialDamageAvailable: officialDamage !== undefined,
    officialDamage,
    unresolvedLeaves,
    accuracyNote:
      officialStatus === "validated"
        ? "Official formula validated against game observations."
        : "Official formula output is NOT validated. Do not use for authoritative damage estimates.",
  };

  return {
    damageOutput,
    survivability,
    pvpDuel,
    warnings,
    assumptions,
    buildMode: calculationInput.buildMode,
    incomingDPSProvided: opts.incomingDPS !== undefined,
    targetHealthProvided: opts.targetHealth !== undefined,
    officialFormula,
  };
}
