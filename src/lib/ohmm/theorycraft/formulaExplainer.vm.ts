/**
 * Phase 4B Theorycraft UX — Formula Explainer View Model
 *
 * Pure TypeScript derivation: CombatOutput + CalculationInput → FormulaExplainerViewModel.
 * No React, no DOM, no side effects. Never throws — returns safe defaults for all invalid inputs.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { ModifierSource } from "@/ohai/src/engine/modifierTypes";
import type {
  FormulaExplainerViewModel,
  ExplainerLineItem,
  TargetAssumption,
  MultiplierGroupType,
  ConfidenceLevel,
} from "./types";
import { safeFormat, isDisplayable } from "./utils";
import { getPvETarget } from "@/ohai/src/ui/registries/pveTargetRegistry";

// ─── Additive stat keys ──────────────────────────────────────────────────────
// Flat bonuses and percentage bonuses that stack additively within their group.
// Multiplicative: anything that acts as a separate multiplier layer (crit, weakspot, etc.)
const MULTIPLICATIVE_STATS = new Set([
  "critRate",
  "critDMG",
  "weakspotDMG",
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

// ─── Classify a modifier source as additive or multiplicative ────────────────
function classifyModifier(source: ModifierSource): MultiplierGroupType {
  // Use the source's own behavior field as a primary signal
  if (source.behavior === "multiplicative") return "multiplicative";
  // Known multiplicative stats override behavior field
  if (MULTIPLICATIVE_STATS.has(source.stat)) return "multiplicative";
  return "additive";
}

// ─── Format a line item value for display ────────────────────────────────────
function formatLineItemValue(value: number, groupType: MultiplierGroupType): string {
  if (!isDisplayable(value)) return "—";
  if (groupType === "multiplicative") {
    // Multiplicative values displayed as multiplier: ×1.125 for 0.125 bonus
    const multiplier = 1 + value;
    return `×${multiplier.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
  }
  // Additive values displayed as percentage: +12.5%
  const percent = value * 100;
  return `+${percent.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

// ─── Derive a human-readable label from modifier source ──────────────────────
function deriveLabel(source: ModifierSource): string {
  // sourceLabel is typically "ItemName (statKey)" — extract just the item name
  const label = source.sourceLabel;
  const parenIdx = label.lastIndexOf(" (");
  if (parenIdx > 0) return label.slice(0, parenIdx);
  return label;
}

// ─── Derive a source description from modifier source type ───────────────────
function deriveSourceDescription(source: ModifierSource): string {
  switch (source.sourceType) {
    case "calibration":
      return "Calibration";
    case "mod":
      return `Mod: ${deriveLabel(source)}`;
    case "modSuffix":
      return `Mod Suffix: ${deriveLabel(source)}`;
    case "setBonus":
      return `Set Bonus: ${deriveLabel(source)}`;
    case "food":
      return `Food: ${deriveLabel(source)}`;
    case "weapon":
      return `Weapon: ${deriveLabel(source)}`;
    case "armor":
      return `Armor: ${deriveLabel(source)}`;
    case "keywordEffect":
      return `Effect: ${deriveLabel(source)}`;
    case "temporaryBuff":
      return `Buff: ${deriveLabel(source)}`;
    case "enemyTypeBonus":
      return `Target Bonus: ${deriveLabel(source)}`;
    case "gloves":
      return deriveLabel(source);
    default:
      return deriveLabel(source);
  }
}

// ─── Compute contribution percent for each item ──────────────────────────────
function computeContributions(items: ExplainerLineItem[]): void {
  const totalAbsValue = items.reduce((sum, item) => sum + Math.abs(item.value), 0);
  if (totalAbsValue <= 0) {
    for (const item of items) {
      item.contributionPercent = 0;
    }
    return;
  }
  for (const item of items) {
    item.contributionPercent = (Math.abs(item.value) / totalAbsValue) * 100;
  }
}

// ─── Build target assumptions from calcInput ─────────────────────────────────
function buildTargetAssumptions(calcInput: CalculationInput): TargetAssumption[] {
  const assumptions: TargetAssumption[] = [];

  const enemyType = calcInput.enemyType;
  if (enemyType && enemyType !== "unknown") {
    const target = getPvETarget(enemyType);
    if (target) {
      assumptions.push({
        label: "Target",
        value: target.name,
        source: `Registry: ${target.name}`,
      });
      assumptions.push({
        label: "Target Type",
        value: target.targetType,
        source: `Registry: ${target.name}`,
      });
      if (target.faction) {
        assumptions.push({
          label: "Faction",
          value: target.faction,
          source: `Registry: ${target.name}`,
        });
      }
      if (target.recommendedLevel !== undefined) {
        assumptions.push({
          label: "Recommended Level",
          value: String(target.recommendedLevel),
          source: `Registry: ${target.name}`,
        });
      }
    } else {
      // Target ID present but not found in registry
      assumptions.push({
        label: "Target",
        value: enemyType,
        source: "User selection",
      });
    }
  }

  // Build mode assumption
  assumptions.push({
    label: "Combat Mode",
    value: calcInput.buildMode === "pvp" ? "PvP" : "PvE",
    source: "Build configuration",
  });

  return assumptions;
}

// ─── Main derivation function ────────────────────────────────────────────────

/**
 * Derive the Formula Explainer view model from engine output.
 *
 * - Classifies modifier sources into additive vs multiplicative groups
 * - Builds line items with label, value, formatted value, confidence, contribution percent
 * - Builds target assumptions from enemyType and registry data
 * - Adds PvP mitigation section when buildMode === "pvp"
 * - Never includes line items not traceable to a real ModifierSource in input
 * - Never throws; always returns a safe, well-typed view model
 */
export function deriveFormulaExplainer(
  combatOutput: CombatOutput | null | undefined,
  calcInput: CalculationInput | null | undefined,
): Omit<FormulaExplainerViewModel, "isExpanded"> {
  // Safe defaults for completely missing inputs
  if (!calcInput && !combatOutput) {
    return {
      baseWeaponDamage: "—",
      totalExpectedDamage: "—",
      activeContributorCount: 0,
      additiveGroup: [],
      multiplicativeGroup: [],
      targetAssumptions: [],
      pvpMitigationSection: null,
      summaryLine: "0 active contributors → — expected damage",
    };
  }

  // ── Step 1: Extract base weapon damage ──
  const rawBaseWeaponDMG = calcInput?.baseWeaponDMG;
  const baseWeaponDamage = safeFormat(rawBaseWeaponDMG, 0);

  // ── Step 2: Extract total expected damage ──
  const rawExpectedDamage = combatOutput?.damageOutput?.expectedDamage;
  const totalExpectedDamage = safeFormat(rawExpectedDamage, 0);

  // ── Step 3: Classify modifier sources ──
  const modifierSources = calcInput?.modifierSources ?? [];
  const additiveGroup: ExplainerLineItem[] = [];
  const multiplicativeGroup: ExplainerLineItem[] = [];

  for (let i = 0; i < modifierSources.length; i++) {
    const source = modifierSources[i];

    // Skip zero-value sources (requirement: only non-zero modifier sources produce line items)
    if (!isDisplayable(source.value) || source.value === 0) continue;

    const groupType = classifyModifier(source);
    const confidence = mapEngineConfidence(source.confidence);

    const lineItem: ExplainerLineItem = {
      id: source.id || `line-${i}`,
      label: deriveLabel(source),
      source: deriveSourceDescription(source),
      value: source.value,
      formattedValue: formatLineItemValue(source.value, groupType),
      groupType,
      confidence,
      contributionPercent: 0, // Computed after all items are collected
    };

    if (groupType === "additive") {
      additiveGroup.push(lineItem);
    } else {
      multiplicativeGroup.push(lineItem);
    }
  }

  // ── Step 5: Compute contribution percentages ──
  const allItems = [...additiveGroup, ...multiplicativeGroup];
  computeContributions(allItems);

  // ── Step 6: Build target assumptions ──
  const targetAssumptions = calcInput
    ? buildTargetAssumptions(calcInput)
    : [];

  // ── Step 7: PvP mitigation section ──
  let pvpMitigationSection: FormulaExplainerViewModel["pvpMitigationSection"] = null;
  const buildMode = calcInput?.buildMode ?? combatOutput?.buildMode;
  if (buildMode === "pvp") {
    const damageTakenMult = combatOutput?.survivability?.damageTakenMultiplier;
    const reductionPercent = isDisplayable(damageTakenMult)
      ? (1 - damageTakenMult) * 100
      : 0;
    pvpMitigationSection = {
      applied: isDisplayable(damageTakenMult) && damageTakenMult < 1,
      reductionPercent: isDisplayable(reductionPercent)
        ? `${reductionPercent.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
        : "0%",
    };
  }

  // ── Step 8: Count active contributors ──
  const activeContributorCount = allItems.length;

  // ── Step 9: Build summary line ──
  const summaryLine = `${activeContributorCount} active contributor${activeContributorCount !== 1 ? "s" : ""} → ${totalExpectedDamage} expected damage`;

  return {
    baseWeaponDamage,
    totalExpectedDamage,
    activeContributorCount,
    additiveGroup,
    multiplicativeGroup,
    targetAssumptions,
    pvpMitigationSection,
    summaryLine,
  };
}
