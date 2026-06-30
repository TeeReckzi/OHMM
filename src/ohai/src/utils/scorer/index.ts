import type { StatKey } from "../../schemas/buildGoalSchema";
import type {
  GearItemInput, SceneProfile, ScoreBreakdown, ScoreContribution,
  ConditionalContribution, SynergyMatch, ScoreExplanation,
  EvaluatedItemContribution, GearSetEvaluation, MechanicScoringOptions,
  MechanicStatNote, MechanicScoringContext
} from "./types";
import { getScenarioProfile } from "./scenarioProfiles";
import { getWeightProfile, type WeightProfile } from "./scoringWeights";
import { getBuildGoalProfile } from "../buildGoalProfiles";
import { evaluateConditionals, estimateUptimeForKeywords } from "./conditionalEvaluator";
import { detectSynergies, calculateSynergyMultiplier } from "./synergyGraph";
import { buildFullExplanation, buildItemContribution } from "./explainer";
import { normalizeRawStats, normalizeStatKey } from "./normalizer";
import { applyMechanicMaskToWeights } from "./mechanicAwareScoring";

const CATEGORY_KEYS: (keyof ScoreBreakdown)[] = [
  "damage", "survivability", "consistency", "utility", "mobility", "synergy"
];

const DAMAGE_STAT_KEYS: StatKey[] = [
  "weaponDMG", "meleeDMG", "statusDMGBonus", "elementalDMGBonus",
  "burnDMGBonus", "powerSurgeDMGBonus", "frostVortexDMGBonus",
  "bounceDMG", "shrapnelDMG", "fastGunnerDMG", "unstableBomberDMGBonus",
  "bullseyeDMG",
  "critRate", "critDMG", "weakspotDMG", "fireRate",
  "reloadSpeed", "reloadEfficiency", "magazineCapacity",
  "psiIntensity", "superAnomalyStrength",
  "weaponDMGBonus", "meleeDMGBonus", "bounceDMGBonus", "shrapnelDMGBonus",
];

const SURVIVABILITY_STAT_KEYS: StatKey[] = [
  "maxHP", "hpRecovery", "shield", "shieldStrength",
  "dmgReduction", "playerDMGReduction", "statusDMGReduction",
  "weakspotDMGReduction", "critDMGReduction", "healingReceived",
  "resistances"
];

const CONSISTENCY_STAT_KEYS: StatKey[] = [
  "fireRate", "reloadSpeed", "reloadEfficiency", "magazineCapacity",
  "critRate", "movementSpeed", "stamina", "movementSpeedBonus",
  "medicineSpeedBonus",
];

const UTILITY_STAT_KEYS: StatKey[] = [
  "gatheringYield", "miningYield", "loggingYield", "fishingYield",
  "craftingEfficiency", "foodDuration", "deviationSupport",
  "movementSpeed", "stamina", "medicineEffectBonus",
];

const MOBILITY_STAT_KEYS: StatKey[] = [
  "movementSpeed", "stamina"
];

interface ResolvedWeights {
  categoryWeights: { damage: number; survivability: number; consistency: number; utility: number; mobility: number; synergy: number };
  statWeights: Partial<Record<StatKey, number>>;
}

function resolveWeights(scenarioId: string, buildGoalId?: string): ResolvedWeights {
  const scenario = getScenarioProfile(scenarioId);
  const weightProfile = getWeightProfile(`scenario_${scenarioId}`) ?? getWeightProfile("default_offense");
  const goalProfile = buildGoalId ? getBuildGoalProfile(buildGoalId) : undefined;

  const categoryWeights = {
    damage: scenario?.categoryWeights.damage ?? weightProfile?.categoryWeights.damage ?? 0.7,
    survivability: scenario?.categoryWeights.survivability ?? weightProfile?.categoryWeights.survivability ?? 0.4,
    consistency: scenario?.categoryWeights.consistency ?? weightProfile?.categoryWeights.consistency ?? 0.5,
    utility: scenario?.categoryWeights.utility ?? weightProfile?.categoryWeights.utility ?? 0.2,
    mobility: scenario?.categoryWeights.mobility ?? weightProfile?.categoryWeights.mobility ?? 0.3,
    synergy: scenario?.categoryWeights.synergy ?? weightProfile?.categoryWeights.synergy ?? 0.5
  };

  const statWeights: Partial<Record<StatKey, number>> = {};

  if (goalProfile?.scoringWeights) {
    for (const [keyStr, weight] of Object.entries(goalProfile.scoringWeights)) {
      const key = keyStr as StatKey;
      if (typeof weight === "number") {
        statWeights[key] = weight;
      }
    }
  } else if (weightProfile?.statWeights) {
    for (const [key, weight] of Object.entries(weightProfile.statWeights)) {
      const statKey = key as StatKey;
      if (typeof weight === "number") {
        statWeights[statKey] = weight;
      }
    }
  }

  if (scenario?.statWeightOverrides) {
    for (const [key, override] of Object.entries(scenario.statWeightOverrides)) {
      const statKey = key as StatKey;
      if (typeof override === "number") {
        statWeights[statKey] = override;
      }
    }
  }

  if (scenario?.modifiers) {
    for (const mod of scenario.modifiers) {
      if (mod.type === "stat_weight_override" && mod.targetStats && mod.multiplier) {
        for (const targetKey of mod.targetStats) {
          const current = statWeights[targetKey] ?? 0;
          statWeights[targetKey] = current * mod.multiplier;
        }
      }
    }
  }

  return { categoryWeights, statWeights };
}

function categorizeStat(statKey: StatKey): keyof ScoreBreakdown {
  if (DAMAGE_STAT_KEYS.includes(statKey)) return "damage";
  if (SURVIVABILITY_STAT_KEYS.includes(statKey)) return "survivability";
  if (CONSISTENCY_STAT_KEYS.includes(statKey)) return "consistency";
  if (UTILITY_STAT_KEYS.includes(statKey)) return "utility";
  if (MOBILITY_STAT_KEYS.includes(statKey)) return "mobility";
  return "utility";
}

export function scoreGearSet(
  items: GearItemInput[],
  scenarioId: string,
  options?: {
    buildGoalId?: string;
    enableSynergy?: boolean;
    enableConditionals?: boolean;
    mechanicContext?: MechanicScoringOptions;
  }
): GearSetEvaluation {
  const { buildGoalId, enableSynergy = true, enableConditionals = true, mechanicContext } = options ?? {};
  const scenario = getScenarioProfile(scenarioId);
  let { categoryWeights, statWeights } = resolveWeights(scenarioId, buildGoalId);

  let mechanicNotes: string[] = [];

  if (mechanicContext && mechanicContext.selectedMechanicIds && mechanicContext.selectedMechanicIds.length > 0) {
    const maskResult = applyMechanicMaskToWeights(statWeights, mechanicContext);
    statWeights = maskResult.statWeights;
    mechanicNotes = maskResult.contextNotes;
  }

  const scenarioName = scenario?.name ?? scenarioId;

  const allContributions: ScoreContribution[] = [];
  const allConditionalContributions: ConditionalContribution[] = [];
  const itemContributions: EvaluatedItemContribution[] = [];

  const baseCategoryScores: Record<string, number> = {
    damage: 0, survivability: 0, consistency: 0, utility: 0, mobility: 0, synergy: 0
  };

  for (const item of items) {
    const mergedStats = { ...normalizeRawStats(item.rawStats ?? {}), ...(item.statValues ?? {}) };
    const itemContribs: ScoreContribution[] = [];

    if (enableConditionals && item.conditionalEffects && item.conditionalEffects.length > 0) {
      const { contributions, combinedMultiplier } = evaluateConditionals(item.conditionalEffects);
      allConditionalContributions.push(...contributions);

      for (const contrib of contributions) {
        for (const mod of contrib.statModifiers) {
          const existing = mergedStats[mod.statKey] ?? 0;
          mergedStats[mod.statKey] = existing + mod.value;
        }
      }
    }

    if (enableConditionals && item.keywords && item.keywords.length > 0) {
      const autoEffects = estimateUptimeForKeywords(item.keywords);
      if (autoEffects.length > 0) {
        const { contributions } = evaluateConditionals(autoEffects);
        allConditionalContributions.push(...contributions);
      }
    }

    for (const [statKeyStr, value] of Object.entries(mergedStats)) {
      const statKey = statKeyStr as StatKey;
      const weight = statWeights[statKey] ?? 0;
      if (weight === 0 || value === 0) continue;

      const contribution = value * weight;
      const category = categorizeStat(statKey);

      baseCategoryScores[category] = (baseCategoryScores[category] ?? 0) + contribution;

      const contrib = buildItemContribution(
        item.name,
        item.sourceType,
        statKey,
        value,
        weight,
        contribution
      );
      allContributions.push(contrib);
      itemContribs.push(contrib);
    }

    const baseScore = itemContribs.reduce((sum, c) => sum + c.contribution, 0);

    itemContributions.push({
      itemId: item.id,
      itemName: item.name,
      itemType: item.sourceType,
      baseScore,
      synergyScore: 0,
      conditionalScore: 0,
      totalScore: baseScore,
      contributions: itemContribs
    });
  }

  let totalSynergyScore = 0;
  let synergies: SynergyMatch[] = [];

  if (enableSynergy) {
    const result = detectSynergies(items, scenario?.tags ?? [], buildGoalId ?? "");
    synergies = result.synergies;
    totalSynergyScore = result.totalSynergyScore;
  }

  const baseSum = CATEGORY_KEYS.reduce((sum, key) => sum + (baseCategoryScores[key] ?? 0), 0);
  const synergyMultiplier = enableSynergy
    ? calculateSynergyMultiplier(totalSynergyScore, baseSum)
    : 1.0;

  const breakdown: ScoreBreakdown = {
    damage: (baseCategoryScores.damage ?? 0) * synergyMultiplier,
    survivability: (baseCategoryScores.survivability ?? 0) * categoryWeights.survivability / categoryWeights.damage,
    consistency: (baseCategoryScores.consistency ?? 0) * categoryWeights.consistency / categoryWeights.damage,
    utility: (baseCategoryScores.utility ?? 0) * categoryWeights.utility / categoryWeights.damage,
    mobility: (baseCategoryScores.mobility ?? 0) * categoryWeights.mobility / categoryWeights.damage,
    synergy: totalSynergyScore,
    total: 0
  };

  breakdown.total = CATEGORY_KEYS.reduce((sum, key) => sum + (breakdown[key] ?? 0), 0);

  const explanation = buildFullExplanation(
    breakdown,
    allContributions,
    allConditionalContributions,
    synergies,
    scenarioName
  );

  if (mechanicNotes.length > 0) {
    (explanation as Record<string, unknown>).mechanicNotes = mechanicNotes;
  }

  for (const ic of itemContributions) {
    ic.synergyScore = totalSynergyScore * (ic.baseScore / (baseSum || 1));
    ic.totalScore = ic.baseScore + ic.synergyScore;
    ic.conditionalScore = allConditionalContributions.reduce(
      (sum, c) => sum + c.contribution,
      0
    ) * (ic.baseScore / (baseSum || 1));
  }

  return {
    scenarioId,
    scenarioName,
    buildGoalId: buildGoalId ?? "",
    breakdown,
    explanation,
    itemContributions,
    totalScore: breakdown.total
  };
}

export function scoreGearItem(
  item: GearItemInput,
  scenarioId: string,
  options?: {
    buildGoalId?: string;
    enableConditionals?: boolean;
  }
): { score: number; contributions: ScoreContribution[]; breakdown: ScoreBreakdown } {
  const result = scoreGearSet([item], scenarioId, {
    buildGoalId: options?.buildGoalId,
    enableSynergy: false,
    enableConditionals: options?.enableConditionals ?? true
  });

  return {
    score: result.totalScore,
    contributions: result.explanation.contributions,
    breakdown: result.breakdown
  };
}

export function compareScenarios(
  item: GearItemInput,
  scenarioIds: string[],
  options?: { buildGoalId?: string }
): Array<{ scenarioId: string; score: number; breakdown: ScoreBreakdown }> {
  return scenarioIds.map((sid) => {
    const result = scoreGearItem(item, sid, options);
    return { scenarioId: sid, score: result.score, breakdown: result.breakdown };
  });
}

export { getScenarioProfile } from "./scenarioProfiles";
export { getWeightProfile, listWeightProfiles } from "./scoringWeights";
export { normalizeStatKey, normalizeRawStats, getDisplayName } from "./normalizer";
export { evaluateConditionals, estimateUptimeForKeywords } from "./conditionalEvaluator";
export { detectSynergies, calculateSynergyMultiplier } from "./synergyGraph";
export { buildFullExplanation, formatExplanationText } from "./explainer";

export type { GearItemInput, SceneProfile, EvaluatedItemContribution, GearSetEvaluation };
export type { ScoreBreakdown, ScoreContribution, ConditionalContribution, SynergyMatch, ScoreExplanation };
export type { MechanicScoringOptions, MechanicStatNote, MechanicScoringContext };

export { resolveMechanicRelevance, isStatRelevant } from "./mechanicStatRelevance";
export { applyMechanicMaskToWeights } from "./mechanicAwareScoring";
export { augmentExplanationWithMechanicContext } from "./mechanicScoringExplainer";
