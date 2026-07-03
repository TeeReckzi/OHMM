/**
 * Phase 4B Theorycraft UX — Hero Metrics View Model
 *
 * Pure TypeScript derivation: CombatOutput + CalculationInput + BuildSelection → HeroMetricsViewModel.
 * No React, no DOM, no side effects. Never throws — returns safe defaults for all invalid inputs.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.7
 */

import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { BuildSelection } from "@/ohai/src/ui/types";
import type { HeroMetricsViewModel, MetricCardData, ConfidenceLevel } from "./types";
import { safeFormat, isDisplayable, computeCompleteness, aggregateConfidence } from "./utils";

// ─── Status DMG stat keys ────────────────────────────────────────────────────
// These stat keys represent status damage contributions in the modifier sources.
const STATUS_DMG_STATS = new Set([
  "statusDMGBonus",
  "burnDMGBonus",
  "frostVortexDMGBonus",
  "powerSurgeDMGBonus",
  "unstableBomberDMGBonus",
  "shrapnelDMGBonus",
  "bounceDMGBonus",
]);

// ─── Confidence mapping: engine → theorycraft presentation ───────────────────
function mapEngineConfidence(engineLevel: string | undefined): ConfidenceLevel {
  switch (engineLevel) {
    case "verified":
    case "confirmed":
      return "project_verified";
    case "observed":
    case "observed_in_game_needs_testing":
      return "observed";
    case "estimated":
    case "reported_current_patch_needs_testing":
    case "experimental":
    case "inferred":
      return "estimated";
    case "placeholder":
      return "placeholder";
    default:
      return "estimated";
  }
}

// ─── Safe numeric guard ──────────────────────────────────────────────────────
function safeNumeric(value: unknown): number {
  if (!isDisplayable(value)) return 0;
  return value;
}

// ─── Status DMG contribution extraction ──────────────────────────────────────
function extractStatusDmgContribution(calcInput: CalculationInput | null | undefined): number {
  if (!calcInput?.modifierSources) return 0;

  let total = 0;
  for (const source of calcInput.modifierSources) {
    if (STATUS_DMG_STATS.has(source.stat)) {
      const val = source.value;
      if (isDisplayable(val)) {
        total += val;
      }
    }
  }
  return total;
}

// ─── Confidence aggregation from modeled effects ─────────────────────────────
function extractConfidenceLevels(calcInput: CalculationInput | null | undefined): ConfidenceLevel[] {
  if (!calcInput?.modeledEffects) return [];

  const levels: ConfidenceLevel[] = [];
  for (const effect of calcInput.modeledEffects) {
    // Map from formulaSupport status to confidence level
    const support = effect.formulaSupport;
    if (support) {
      const status = typeof support === "object" ? (support as any).status : undefined;
      switch (status) {
        case "fully-modeled":
          levels.push("project_verified");
          break;
        case "partially-modeled":
          levels.push("estimated");
          break;
        case "display-only":
        case "unmodeled":
          levels.push("placeholder");
          break;
        default:
          levels.push("estimated");
      }
    }
  }
  return levels;
}

// ─── TTK derivation ──────────────────────────────────────────────────────────
function deriveTTK(
  combatOutput: CombatOutput | null | undefined,
): { value: number | undefined; source: string } {
  if (!combatOutput) return { value: undefined, source: "unavailable" };

  const buildMode = combatOutput.buildMode;

  // PvP: use outgoingTTK directly from the pvpDuel context
  if (buildMode === "pvp") {
    const ttk = combatOutput.pvpDuel?.outgoingTTK;
    return { value: ttk, source: "pvpDuel" };
  }

  // PvE: outgoingTTK may still be available if target health was provided
  // Otherwise there's no TTK computation for PvE without target health
  const ttk = combatOutput.pvpDuel?.outgoingTTK;
  return { value: ttk, source: "computed" };
}

// ─── Main derivation function ────────────────────────────────────────────────

/**
 * Derive the Hero Metrics view model from engine output.
 *
 * - Returns 5 metric cards for PvE (DPS, Expected Hit, TTK, Status DMG, Build Mode)
 * - Returns 6 metric cards for PvP (adds PvP Mitigation)
 * - Never throws; always returns a safe, well-typed HeroMetricsViewModel
 * - All numeric outputs are guarded: NaN/Infinity/undefined → "—" / 0
 */
export function deriveHeroMetrics(
  combatOutput: CombatOutput | null | undefined,
  calcInput: CalculationInput | null | undefined,
  buildSelection: BuildSelection | null | undefined,
): HeroMetricsViewModel {
  // Safe build mode extraction
  const buildMode: "pve" | "pvp" = combatOutput?.buildMode ?? calcInput?.buildMode ?? "pve";

  // ── Metric 1: DPS ──
  const rawDPS = combatOutput?.damageOutput?.DPS;
  const dpsMetric: MetricCardData = {
    id: "dps",
    label: "DPS",
    value: safeFormat(rawDPS, 0),
    numericValue: safeNumeric(rawDPS),
    icon: "zap",
    tooltip: "Damage dealt per second assuming continuous fire at current uptime",
    confidence: "project_verified",
  };

  // ── Metric 2: Expected Hit ──
  const rawExpectedHit = combatOutput?.damageOutput?.expectedDamage;
  const expectedHitMetric: MetricCardData = {
    id: "expected-hit",
    label: "Expected Hit",
    value: safeFormat(rawExpectedHit, 0),
    numericValue: safeNumeric(rawExpectedHit),
    icon: "crosshair",
    tooltip: "Average damage per shot/tick including all active multipliers",
    confidence: "project_verified",
  };

  // ── Metric 3: TTK ──
  const { value: rawTTK } = deriveTTK(combatOutput);
  const ttkMetric: MetricCardData = {
    id: "ttk",
    label: "TTK",
    value: isDisplayable(rawTTK) ? `${safeFormat(rawTTK, 1)}s` : "—",
    numericValue: safeNumeric(rawTTK),
    icon: "timer",
    tooltip: "Time to kill — seconds to eliminate the target at current DPS",
    confidence: "estimated",
  };

  // ── Metric 4: Status DMG Contribution ──
  const rawStatusDmg = extractStatusDmgContribution(calcInput);
  const statusDmgMetric: MetricCardData = {
    id: "status-dmg",
    label: "Status DMG",
    value: isDisplayable(rawStatusDmg) && rawStatusDmg > 0
      ? `+${safeFormat(rawStatusDmg * 100, 1)}%`
      : "—",
    numericValue: safeNumeric(rawStatusDmg),
    icon: "flame",
    tooltip: "Total status damage bonus contribution from all equipped sources",
    confidence: "observed",
  };

  // ── Metric 5: Build Mode ──
  const buildModeMetric: MetricCardData = {
    id: "build-mode",
    label: "Mode",
    value: buildMode === "pvp" ? "PvP" : "PvE",
    numericValue: buildMode === "pvp" ? 1 : 0,
    icon: buildMode === "pvp" ? "swords" : "target",
    tooltip: buildMode === "pvp"
      ? "PvP mode — damage includes player vs player mitigation adjustments"
      : "PvE mode — damage against NPC/enemy targets",
    confidence: "project_verified",
  };

  // ── Build the metrics array ──
  const metrics: MetricCardData[] = [
    dpsMetric,
    expectedHitMetric,
    ttkMetric,
    statusDmgMetric,
    buildModeMetric,
  ];

  // ── Metric 6 (PvP only): PvP Mitigation % ──
  if (buildMode === "pvp") {
    const rawMitigation = combatOutput?.survivability?.damageTakenMultiplier;
    // damageTakenMultiplier is the multiplier applied to incoming damage (e.g. 0.8 = 20% reduction)
    // Convert to mitigation percentage: (1 - multiplier) * 100
    const mitigationPercent = isDisplayable(rawMitigation)
      ? (1 - rawMitigation) * 100
      : undefined;

    const pvpMitigationMetric: MetricCardData = {
      id: "pvp-mitigation",
      label: "PvP Mitigation",
      value: isDisplayable(mitigationPercent)
        ? `${safeFormat(mitigationPercent, 1)}%`
        : "—",
      numericValue: safeNumeric(mitigationPercent),
      icon: "shield",
      tooltip: "Percentage of incoming PvP damage mitigated by armor and buffs",
      confidence: "observed",
    };
    metrics.push(pvpMitigationMetric);
  }

  // ── Build Completeness ──
  const buildCompleteness = buildSelection
    ? computeCompleteness(buildSelection)
    : 0;

  // ── Confidence Score ──
  const confidenceLevels = extractConfidenceLevels(calcInput);
  const confidenceScore = aggregateConfidence(confidenceLevels);

  return {
    metrics,
    buildCompleteness,
    confidenceScore,
    buildMode,
  };
}
