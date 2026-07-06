/**
 * Neural Build Graph — Multi-Layer View Model
 *
 * Pure TypeScript derivation: BuildSelection + CalculationInput + CombatOutput → BuildGraphViewModel.
 * No React, no DOM, no side effects. Never throws — returns safe defaults for all invalid inputs.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 13.1, 13.2, 13.6, 13.7, 13.8
 */

import type { BuildSelection } from "@/ohai/src/ui/types";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import type {
  GraphNode,
  GraphEdge,
  BuildGraphViewModel,
  GraphLayer,
  GraphMetrics,
  EnergyState,
  HeartbeatConfig,
  CohesionMetrics,
  GraphAnalytics,
  NodeMetadata,
  EquipmentCategory,
  StatCategory,
  KeywordCategory,
  EdgeCategory,
  ConfidenceLevel,
} from "./buildGraph.types";
import { LAYER_ORDER } from "./buildGraph.types";
import { ENERGY_CONFIG, INFLUENCE_WEIGHTS } from "./buildGraph.constants";
import { computeGraphAnalytics } from "./graphAnalytics";
import { computeCohesion } from "./graphCohesion";
import { buildTemporalChain } from "./temporalChain";
import { generateBuildInsights } from "./buildGraphInsights";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TOTAL_NODES = 100;

/** Status effect keywords to detect status-related stats */
const STATUS_KEYWORDS = [
  "burn",
  "freeze",
  "frost",
  "corrosion",
  "explosion",
  "poison",
  "bleed",
  "status",
] as const;

/** Offensive stat prefixes/patterns */
const OFFENSIVE_STAT_PATTERNS = [
  "weaponDMG",
  "meleeDMG",
  "critRate",
  "critDMG",
  "weakspotDMG",
  "fireRate",
  "attackPercent",
  "humanDamageBonus",
  "enemyTypeDMGBonus",
  "elementalDMG",
  "psiIntensity",
  "superAnomalyStrength",
  "deviationSkillDMG",
  "fastGunnerDMG",
  "bullseyeDMG",
  "keywordSuffixDMG",
];

/** Defensive stat prefixes/patterns */
const DEFENSIVE_STAT_PATTERNS = [
  "dmgReduction",
  "playerDMGReduction",
  "weaponDMGReduction",
  "statusDMGReduction",
  "weakspotDMGReduction",
  "critDMGReduction",
  "deviantDMGReduction",
  "maxHP",
  "hpRecovery",
  "shield",
  "shieldStrength",
  "resistances",
];

/** Utility stat patterns */
const UTILITY_STAT_PATTERNS = [
  "reloadSpeed",
  "reloadEfficiency",
  "magazineCapacity",
  "movementSpeed",
  "medicineSpeed",
  "medicineEffect",
  "healingReceived",
  "stamina",
  "foodDuration",
  "deviationSupport",
  "gatheringYield",
  "miningYield",
  "loggingYield",
  "fishingYield",
  "craftingEfficiency",
  "foodBonusPercent",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyMetrics(): GraphMetrics {
  const layerNodeCounts = {} as Record<GraphLayer, number>;
  const layerEdgeCounts = {} as Record<GraphLayer, number>;
  for (const layer of LAYER_ORDER) {
    layerNodeCounts[layer] = 0;
    layerEdgeCounts[layer] = 0;
  }

  const emptyCohesion: CohesionMetrics = {
    score: 0,
    label: "Scattered",
    components: {
      networkDensity: 0,
      averageEdgeWeight: 0,
      connectivity: 0,
      nodeUtilization: 0,
      criticalPathEfficiency: 0,
    },
    insight: "No data available.",
  };

  const emptyAnalytics: GraphAnalytics = {
    centralities: [],
    communities: [],
    connectedComponents: [],
    networkDensity: 0,
    averageClusteringCoefficient: 0,
    diameter: 0,
    isFullyConnected: false,
  };

  return {
    cohesion: emptyCohesion,
    analytics: emptyAnalytics,
    totalEdges: 0,
    strongestSynergy: null,
    isolatedNodeCount: 0,
    activeNodeCount: 0,
    totalNodeCount: 0,
    layerNodeCounts,
    layerEdgeCounts,
    interLayerEdgeCount: 0,
  };
}

function createDefaultEnergyState(): EnergyState {
  return {
    baseEnergy: new Map(),
    pulsePhase: 0,
    pulseFrequency: ENERGY_CONFIG.defaultHeartbeatHz,
    pulseIntensity: 0,
  };
}

function createDefaultHeartbeat(): HeartbeatConfig {
  return {
    baseFrequency: 0,
    amplitude: 0,
    decay: 0,
    isActive: false,
  };
}

function createNonRenderableResult(message: string): BuildGraphViewModel {
  return {
    nodes: [],
    edges: [],
    metrics: createEmptyMetrics(),
    energyState: createDefaultEnergyState(),
    heartbeat: createDefaultHeartbeat(),
    temporalChain: null,
    isRenderable: false,
    emptyStateMessage: message,
    visibleLayers: null,
    insights: null,
  };
}

function createDefaultNodeMetadata(displayName: string): NodeMetadata {
  return {
    displayName,
    confidence: "placeholder",
  };
}

function classifyStatCategory(statKey: string): StatCategory {
  // Check status first (subset of offensive but has distinct visual treatment)
  const lowerStat = statKey.toLowerCase();
  for (const kw of STATUS_KEYWORDS) {
    if (lowerStat.includes(kw)) return "status";
  }
  for (const pattern of OFFENSIVE_STAT_PATTERNS) {
    if (statKey.startsWith(pattern) || statKey === pattern) return "offensive";
  }
  for (const pattern of DEFENSIVE_STAT_PATTERNS) {
    if (statKey.startsWith(pattern) || statKey === pattern) return "defensive";
  }
  for (const pattern of UTILITY_STAT_PATTERNS) {
    if (statKey.startsWith(pattern) || statKey === pattern) return "utility";
  }
  // Default to offensive for unknown damage-related stats
  return "offensive";
}

function classifyKeywordCategory(category: string): KeywordCategory {
  const lower = category.toLowerCase();
  if (
    lower.includes("burn") ||
    lower.includes("frost") ||
    lower.includes("shock") ||
    lower.includes("power") ||
    lower.includes("elemental")
  ) {
    return "elemental";
  }
  if (
    lower.includes("kinetic") ||
    lower.includes("shrapnel") ||
    lower.includes("physical") ||
    lower.includes("bounce")
  ) {
    return "physical";
  }
  if (lower.includes("psi") || lower.includes("anomaly") || lower.includes("deviant")) {
    return "psi";
  }
  return "compound";
}

function isStatusRelatedStat(statKey: string): boolean {
  const lower = statKey.toLowerCase();
  for (const kw of STATUS_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

// ─── Node Extraction ──────────────────────────────────────────────────────────

function extractEquipmentNodes(buildSelection: BuildSelection): GraphNode[] {
  const nodes: GraphNode[] = [];

  // Weapon
  if (buildSelection.weapon && buildSelection.weapon.blueprintId) {
    nodes.push({
      id: "eq-weapon-0",
      label: buildSelection.weapon.blueprintId,
      layer: "equipment",
      category: "weapon" as EquipmentCategory,
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata(buildSelection.weapon.blueprintId),
    });
  }

  // Armor slots
  const armorSlots = ["head", "mask", "chest", "gloves", "pants", "boots"] as const;
  if (buildSelection.armor) {
    for (const slot of armorSlots) {
      const piece = buildSelection.armor[slot];
      if (piece != null && piece !== "") {
        const pieceId = typeof piece === "string" ? piece : piece.id;
        if (pieceId && pieceId !== "" && pieceId !== "none") {
          nodes.push({
            id: `eq-armor-${slot}`,
            label: `${slot}: ${pieceId}`,
            layer: "equipment",
            category: "armor" as EquipmentCategory,
            isActive: true,
            energyLevel: ENERGY_CONFIG.minEnergy,
            influenceScore: 0,
            normalizedSize: 0,
            metadata: createDefaultNodeMetadata(`${slot}: ${pieceId}`),
          });
        }
      }
    }
  }

  // Mod cores (from modSelections or legacy mods)
  const modCoreSlots = [
    "weaponCore",
    "headCore",
    "maskCore",
    "chestCore",
    "glovesCore",
    "pantsCore",
    "bootsCore",
  ] as const;
  const modSelections = buildSelection.modSelections ?? buildSelection.mods;
  if (modSelections) {
    let coreIdx = 0;
    for (const slot of modCoreSlots) {
      const modId = (modSelections as Record<string, string | undefined>)[slot];
      if (modId != null && modId !== "" && modId !== "none") {
        nodes.push({
          id: `eq-mod-core-${coreIdx}`,
          label: modId,
          layer: "equipment",
          category: "mod-core" as EquipmentCategory,
          isActive: true,
          energyLevel: ENERGY_CONFIG.minEnergy,
          influenceScore: 0,
          normalizedSize: 0,
          metadata: createDefaultNodeMetadata(modId),
        });
      }
      coreIdx++;
    }
  }

  // Mod suffixes
  const modSuffixSlots = [
    "weaponSuffix",
    "headSuffix",
    "maskSuffix",
    "chestSuffix",
    "glovesSuffix",
    "pantsSuffix",
    "bootsSuffix",
  ] as const;
  if (modSelections) {
    let suffixIdx = 0;
    for (const slot of modSuffixSlots) {
      const modId = (modSelections as Record<string, string | undefined>)[slot];
      if (modId != null && modId !== "" && modId !== "none") {
        nodes.push({
          id: `eq-mod-suffix-${suffixIdx}`,
          label: modId,
          layer: "equipment",
          category: "mod-suffix" as EquipmentCategory,
          isActive: true,
          energyLevel: ENERGY_CONFIG.minEnergy,
          influenceScore: 0,
          normalizedSize: 0,
          metadata: createDefaultNodeMetadata(modId),
        });
      }
      suffixIdx++;
    }
  }

  // Food
  if (buildSelection.food) {
    if (buildSelection.food.food && buildSelection.food.food !== "" && buildSelection.food.food !== "none") {
      nodes.push({
        id: "eq-food-0",
        label: buildSelection.food.food,
        layer: "equipment",
        category: "food" as EquipmentCategory,
        isActive: true,
        energyLevel: ENERGY_CONFIG.minEnergy,
        influenceScore: 0,
        normalizedSize: 0,
        metadata: createDefaultNodeMetadata(buildSelection.food.food),
      });
    }
  }

  // Deviant
  if (buildSelection.deviant && buildSelection.deviant.id && buildSelection.deviant.id !== "" && buildSelection.deviant.id !== "none") {
    nodes.push({
      id: "eq-deviant-0",
      label: buildSelection.deviant.id,
      layer: "equipment",
      category: "deviant" as EquipmentCategory,
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata(buildSelection.deviant.id),
    });
  }

  // Cradle
  if (buildSelection.cradle && buildSelection.cradle.perks && buildSelection.cradle.perks.length > 0) {
    const hasValidPerks = buildSelection.cradle.perks.some(
      (p) => p != null && p !== "" && p !== "none"
    );
    if (hasValidPerks) {
      nodes.push({
        id: "eq-cradle-0",
        label: "Cradle",
        layer: "equipment",
        category: "cradle" as EquipmentCategory,
        isActive: true,
        energyLevel: ENERGY_CONFIG.minEnergy,
        influenceScore: 0,
        normalizedSize: 0,
        metadata: createDefaultNodeMetadata("Cradle"),
      });
    }
  }

  return nodes;
}

function extractStatsNodes(calcInput: CalculationInput): GraphNode[] {
  const nodes: GraphNode[] = [];
  if (!calcInput.modifierSources || calcInput.modifierSources.length === 0) return nodes;

  // Collect unique stats with non-zero aggregate values
  const statMap = new Map<string, { totalValue: number; count: number }>();
  for (const source of calcInput.modifierSources) {
    if (source.value === 0) continue;
    const existing = statMap.get(source.stat);
    if (existing) {
      existing.totalValue += source.value;
      existing.count++;
    } else {
      statMap.set(source.stat, { totalValue: source.value, count: 1 });
    }
  }

  for (const [statKey, info] of statMap) {
    if (info.totalValue === 0) continue;
    const category = classifyStatCategory(statKey);
    nodes.push({
      id: `stat-${statKey}`,
      label: statKey,
      layer: "stats",
      category,
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: {
        displayName: statKey,
        primaryValue: info.totalValue,
        confidence: "placeholder",
      },
    });
  }

  return nodes;
}

function extractKeywordsNodes(calcInput: CalculationInput): GraphNode[] {
  const nodes: GraphNode[] = [];
  if (!calcInput.modeledEffects || calcInput.modeledEffects.length === 0) return nodes;

  const seenCategories = new Set<string>();
  for (const effect of calcInput.modeledEffects) {
    if (!effect.contributesModifiers) continue;
    if (!effect.category || effect.category === "") continue;
    if (seenCategories.has(effect.category)) continue;
    seenCategories.add(effect.category);

    const kwCategory = classifyKeywordCategory(effect.category);
    nodes.push({
      id: `kw-${effect.category}`,
      label: effect.category,
      layer: "keywords",
      category: kwCategory,
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: {
        displayName: effect.category,
        confidence: "placeholder",
      },
    });
  }

  return nodes;
}

function extractStatusEffectsNodes(calcInput: CalculationInput): GraphNode[] {
  const nodes: GraphNode[] = [];
  if (!calcInput.modifierSources || calcInput.modifierSources.length === 0) return nodes;

  // Find status-related stats that have contributors
  const statusStats = new Map<string, number>();
  for (const source of calcInput.modifierSources) {
    if (source.value === 0) continue;
    if (!isStatusRelatedStat(source.stat)) continue;
    const existing = statusStats.get(source.stat);
    statusStats.set(source.stat, (existing ?? 0) + source.value);
  }

  for (const [statKey, totalValue] of statusStats) {
    nodes.push({
      id: `status-${statKey}`,
      label: statKey,
      layer: "status-effects",
      category: "status" as any,
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: {
        displayName: statKey,
        primaryValue: totalValue,
        confidence: "placeholder",
      },
    });
  }

  return nodes;
}

function extractCombatFormulaNodes(): GraphNode[] {
  return [
    {
      id: "formula-additive",
      label: "Additive Group",
      layer: "combat-formula",
      category: "additive-group",
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata("Additive Group"),
    },
    {
      id: "formula-multiplicative",
      label: "Multiplicative Group",
      layer: "combat-formula",
      category: "multiplicative-group",
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata("Multiplicative Group"),
    },
    {
      id: "formula-base-damage",
      label: "Base Damage",
      layer: "combat-formula",
      category: "base-damage",
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata("Base Damage"),
    },
  ];
}

function extractFinalOutputNodes(): GraphNode[] {
  return [
    {
      id: "output-dps",
      label: "DPS",
      layer: "final-output",
      category: "dps",
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata("DPS"),
    },
    {
      id: "output-ttk",
      label: "TTK",
      layer: "final-output",
      category: "ttk",
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata("TTK"),
    },
    {
      id: "output-expected-damage",
      label: "Expected Damage",
      layer: "final-output",
      category: "expected-damage",
      isActive: true,
      energyLevel: ENERGY_CONFIG.minEnergy,
      influenceScore: 0,
      normalizedSize: 0,
      metadata: createDefaultNodeMetadata("Expected Damage"),
    },
  ];
}

/**
 * Extract nodes from all 6 layers. Caps total at MAX_TOTAL_NODES by trimming
 * stats and keywords layers (keeping nodes with highest absolute modifier values).
 */
function extractMultiLayerNodes(
  buildSelection: BuildSelection,
  calcInput: CalculationInput | null | undefined,
  _combatOutput: CombatOutput | null | undefined,
): GraphNode[] {
  // Layer 1: Equipment
  const equipmentNodes = extractEquipmentNodes(buildSelection);

  // Layer 2: Stats
  let statsNodes: GraphNode[] = [];
  if (calcInput) {
    statsNodes = extractStatsNodes(calcInput);
  }

  // Layer 3: Keywords
  let keywordsNodes: GraphNode[] = [];
  if (calcInput) {
    keywordsNodes = extractKeywordsNodes(calcInput);
  }

  // Layer 4: Status Effects
  let statusNodes: GraphNode[] = [];
  if (calcInput) {
    statusNodes = extractStatusEffectsNodes(calcInput);
  }

  // Layer 5: Combat Formula (always 3 fixed)
  const formulaNodes = extractCombatFormulaNodes();

  // Layer 6: Final Output (always 3 fixed)
  const outputNodes = extractFinalOutputNodes();

  // Calculate total before capping
  const fixedNodeCount = equipmentNodes.length + statusNodes.length + formulaNodes.length + outputNodes.length;
  let trimmedStatsNodes = statsNodes;
  let trimmedKeywordsNodes = keywordsNodes;

  const totalBeforeTrim = fixedNodeCount + statsNodes.length + keywordsNodes.length;
  if (totalBeforeTrim > MAX_TOTAL_NODES) {
    // Budget for stats + keywords
    const budget = MAX_TOTAL_NODES - fixedNodeCount;
    // Prioritize stats over keywords (60/40 split)
    const statsBudget = Math.floor(budget * 0.6);
    const keywordsBudget = budget - statsBudget;

    // Sort stats by absolute primary value, keep highest
    trimmedStatsNodes = [...statsNodes]
      .sort((a, b) => Math.abs(b.metadata.primaryValue ?? 0) - Math.abs(a.metadata.primaryValue ?? 0))
      .slice(0, statsBudget);

    // Sort keywords — keep all if fits, otherwise trim
    trimmedKeywordsNodes = keywordsNodes.slice(0, keywordsBudget);
  }

  return [
    ...equipmentNodes,
    ...trimmedStatsNodes,
    ...trimmedKeywordsNodes,
    ...statusNodes,
    ...formulaNodes,
    ...outputNodes,
  ];
}

// ─── Heartbeat Derivation ─────────────────────────────────────────────────────

/**
 * Derive heartbeat configuration from combat output timing metrics.
 * Returns inactive heartbeat when no valid DPS/timing data is available.
 *
 * Validates: Requirements 8.1, 8.2, 8.4
 */
export function deriveHeartbeatConfig(
  combatOutput: CombatOutput | null | undefined,
): HeartbeatConfig {
  // No combat data → inactive heartbeat
  if (combatOutput == null) {
    return { baseFrequency: 0, amplitude: 0, decay: 0, isActive: false };
  }

  const dps = combatOutput.damageOutput?.DPS;

  // DPS is 0, undefined, or NaN → inactive heartbeat
  if (dps == null || dps === 0 || Number.isNaN(dps)) {
    return { baseFrequency: 0, amplitude: 0, decay: 0, isActive: false };
  }

  // Derive dominant combat cycle period (seconds)
  let period: number | undefined;

  // Priority 1: tickIntervalSeconds (time between hits)
  const tickInterval = combatOutput.damageOutput?.tickIntervalSeconds;
  if (tickInterval != null && tickInterval > 0 && Number.isFinite(tickInterval)) {
    period = tickInterval;
  }

  // Priority 2: ticksPerSecond (fire rate equivalent) → period = 1 / ticksPerSecond
  if (period == null) {
    const ticksPerSec = combatOutput.damageOutput?.ticksPerSecond;
    if (ticksPerSec != null && ticksPerSec > 0 && Number.isFinite(ticksPerSec)) {
      period = 1 / ticksPerSec;
    }
  }

  // Priority 3: Use DPS to estimate → period = 1 / DPS (seconds per damage unit, rough estimate)
  if (period == null) {
    if (dps > 0 && Number.isFinite(dps)) {
      period = 1 / dps;
    }
  }

  // Fallback: use default heartbeat frequency
  if (period == null || period <= 0 || !Number.isFinite(period)) {
    return {
      baseFrequency: ENERGY_CONFIG.defaultHeartbeatHz,
      amplitude: ENERGY_CONFIG.heartbeatMinIntensity,
      decay: ENERGY_CONFIG.pulseDecayMs,
      isActive: true,
    };
  }

  // baseFrequency = 1 / period (Hz), clamped to [0.1, 5.0]
  let baseFrequency = 1 / period;
  baseFrequency = Math.max(0.1, Math.min(5.0, baseFrequency));

  // Amplitude based on DPS magnitude (higher DPS → slightly higher amplitude)
  const normalizedDPS = Math.min(1.0, dps / 5000);
  const amplitude = Math.min(
    ENERGY_CONFIG.heartbeatMaxIntensity,
    ENERGY_CONFIG.heartbeatMinIntensity + normalizedDPS * 0.1,
  );

  // pulseIntensity clamped to [heartbeatMinIntensity, heartbeatMaxIntensity]
  // Same as amplitude for simplicity (already clamped by the formula above)

  return {
    baseFrequency,
    amplitude,
    decay: ENERGY_CONFIG.pulseDecayMs,
    isActive: true,
  };
}

// ─── Confidence Hierarchy ─────────────────────────────────────────────────────

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  project_verified: 3,
  observed: 2,
  estimated: 1,
  placeholder: 0,
};

function minConfidence(a: ConfidenceLevel, b: ConfidenceLevel): ConfidenceLevel {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

// ─── Energy Level Computation ─────────────────────────────────────────────────

/**
 * Compute energy levels for all nodes based on their DPS contribution.
 * Mutates node.energyLevel in place.
 *
 * Validates: Requirements 3.1, 3.2, 3.5
 */
export function computeEnergyLevels(
  nodes: GraphNode[],
  combatOutput: CombatOutput | null | undefined,
): void {
  // When DPS is 0/undefined/NaN or combatOutput is null: uniform 0.3
  const dps = combatOutput?.damageOutput?.DPS;
  if (combatOutput == null || dps == null || dps === 0 || Number.isNaN(dps)) {
    for (const node of nodes) {
      node.energyLevel = 0.3;
    }
    return;
  }

  // Compute contribution proxy per node
  const contributions = new Map<string, number>();
  for (const node of nodes) {
    let contribution = 0;

    if (node.metadata.dpsContribution != null && node.metadata.dpsContribution > 0) {
      // Use explicit DPS contribution if available
      contribution = node.metadata.dpsContribution;
    } else if (node.layer === "equipment") {
      // Equipment nodes: proportional to modifier source total value
      contribution = Math.abs(node.metadata.primaryValue ?? 0) || 0.1;
    } else if (node.layer === "stats") {
      // Stats nodes: proportional to their primaryValue
      contribution = Math.abs(node.metadata.primaryValue ?? 0) || 0.1;
    } else if (node.layer === "final-output") {
      // Final output: always 1.0 (override below)
      contribution = 1;
    } else {
      // Other nodes (keywords, status-effects, combat-formula): uniform 0.3
      contribution = 0;
    }

    contributions.set(node.id, contribution);
  }

  // Find max contribution (excluding final-output nodes)
  let maxContribution = 0;
  for (const node of nodes) {
    if (node.layer === "final-output") continue;
    const c = contributions.get(node.id) ?? 0;
    if (c > maxContribution) maxContribution = c;
  }

  // Assign energy levels
  for (const node of nodes) {
    // Final output nodes always get 1.0
    if (node.layer === "final-output") {
      node.energyLevel = ENERGY_CONFIG.maxEnergy;
      continue;
    }

    const c = contributions.get(node.id) ?? 0;

    if (c === 0 || maxContribution === 0) {
      // Nodes with zero contribution or when maxContribution is 0: uniform 0.3
      node.energyLevel = 0.3;
    } else {
      // energyLevel = max(0.05, contribution / maxContribution), clamped [0.05, 1.0]
      const ratio = c / maxContribution;
      node.energyLevel = Math.min(
        ENERGY_CONFIG.maxEnergy,
        Math.max(ENERGY_CONFIG.minEnergy, ratio),
      );
    }
  }
}

// ─── Influence Score Computation ──────────────────────────────────────────────

/**
 * Compute influence scores for all nodes based on graph analytics.
 * Formula: 0.3×eigenvector + 0.35×dpsContrib + 0.2×degree + 0.15×edgeWeightSum
 * Mutates node.influenceScore and node.normalizedSize in place.
 *
 * Validates: Requirements 3.3, 3.4
 */
export function computeInfluenceScores(
  nodes: GraphNode[],
  edges: GraphEdge[],
  analytics: GraphAnalytics,
): void {
  if (nodes.length === 0) return;

  // Build lookup for centrality data by nodeId
  const centralityMap = new Map<string, { eigenvector: number; degree: number }>();
  for (const c of analytics.centralities) {
    centralityMap.set(c.nodeId, { eigenvector: c.eigenvector, degree: c.degree });
  }

  // Compute edge weight sum per node (sum of weights for all edges where node is source or target)
  const edgeWeightSums = new Map<string, number>();
  for (const node of nodes) {
    edgeWeightSums.set(node.id, 0);
  }
  for (const edge of edges) {
    const srcSum = edgeWeightSums.get(edge.source) ?? 0;
    edgeWeightSums.set(edge.source, srcSum + edge.weight);
    const tgtSum = edgeWeightSums.get(edge.target) ?? 0;
    edgeWeightSums.set(edge.target, tgtSum + edge.weight);
  }

  // Compute raw DPS contribution values per node (use metadata.dpsContribution / 100, or energyLevel as proxy)
  const rawDpsContribs = new Map<string, number>();
  for (const node of nodes) {
    if (node.metadata.dpsContribution != null && node.metadata.dpsContribution > 0) {
      rawDpsContribs.set(node.id, node.metadata.dpsContribution / 100);
    } else {
      // Use current energyLevel as proxy
      rawDpsContribs.set(node.id, node.energyLevel);
    }
  }

  // Find max of each component for normalization
  let maxEigenvector = 0;
  let maxDpsContrib = 0;
  let maxDegree = 0;
  let maxEdgeWeightSum = 0;

  for (const node of nodes) {
    const centrality = centralityMap.get(node.id);
    const eigenvector = centrality?.eigenvector ?? 0;
    const degree = centrality?.degree ?? 0;
    const dpsContrib = rawDpsContribs.get(node.id) ?? 0;
    const edgeWeightSum = edgeWeightSums.get(node.id) ?? 0;

    if (eigenvector > maxEigenvector) maxEigenvector = eigenvector;
    if (dpsContrib > maxDpsContrib) maxDpsContrib = dpsContrib;
    if (degree > maxDegree) maxDegree = degree;
    if (edgeWeightSum > maxEdgeWeightSum) maxEdgeWeightSum = edgeWeightSum;
  }

  // Compute influence score for each node
  for (const node of nodes) {
    const centrality = centralityMap.get(node.id);
    const rawEigen = centrality?.eigenvector ?? 0;
    const rawDegree = centrality?.degree ?? 0;
    const rawDps = rawDpsContribs.get(node.id) ?? 0;
    const rawEdgeWeight = edgeWeightSums.get(node.id) ?? 0;

    // Normalize each component to [0, 1]
    const normEigen = maxEigenvector > 0 ? rawEigen / maxEigenvector : 0;
    const normDps = maxDpsContrib > 0 ? rawDps / maxDpsContrib : 0;
    const normDegree = maxDegree > 0 ? rawDegree / maxDegree : 0;
    const normEdgeWeight = maxEdgeWeightSum > 0 ? rawEdgeWeight / maxEdgeWeightSum : 0;

    // Weighted sum
    const influenceScore =
      INFLUENCE_WEIGHTS.eigenvector * normEigen +
      INFLUENCE_WEIGHTS.dpsContribution * normDps +
      INFLUENCE_WEIGHTS.degree * normDegree +
      INFLUENCE_WEIGHTS.edgeWeightSum * normEdgeWeight;

    // Clamp to [0.0, 1.0]
    node.influenceScore = Math.min(1.0, Math.max(0.0, influenceScore));

    // Set normalizedSize based on influenceScore
    node.normalizedSize = node.influenceScore;
  }
}

// ─── Edge Confidence Computation ──────────────────────────────────────────────

/**
 * Set edge.confidence based on min(source.confidence, target.confidence).
 * Uses confidence hierarchy: project_verified > observed > estimated > placeholder.
 * Mutates edge.confidence in place.
 *
 * Validates: Requirements 9.1, 9.3
 */
export function computeEdgeConfidence(
  edges: GraphEdge[],
  nodes: GraphNode[],
): void {
  // Build confidence lookup by node ID
  const nodeConfidenceMap = new Map<string, ConfidenceLevel>();
  for (const node of nodes) {
    nodeConfidenceMap.set(node.id, node.metadata.confidence);
  }

  for (const edge of edges) {
    const sourceConfidence = nodeConfidenceMap.get(edge.source) ?? "placeholder";
    const targetConfidence = nodeConfidenceMap.get(edge.target) ?? "placeholder";
    edge.confidence = minConfidence(sourceConfidence, targetConfidence);
  }
}

// ─── Node Confidence Assignment ───────────────────────────────────────────────

/**
 * Ensure every node has a valid confidence level.
 * Defaults to "placeholder" when no source metadata provides a confidence.
 *
 * Validates: Requirement 9.1
 */
function assignNodeConfidence(nodes: GraphNode[]): void {
  for (const node of nodes) {
    if (!node.metadata.confidence) {
      node.metadata.confidence = "placeholder";
    }
  }
}

// ─── Edge Derivation ──────────────────────────────────────────────────────────

/** Multiplicative stat keys — these route to the multiplicative formula node */
const MULTIPLICATIVE_STATS = new Set([
  "critRate",
  "critDMG",
  "weakspotDMG",
]);

/**
 * Map a ModifierSource to an equipment node ID.
 * Returns null if unmappable (skip per requirement 13.3).
 */
function mapSourceToEquipmentNodeId(
  source: { id: string; sourceType: string; sourceLabel: string },
  nodeIdSet: Set<string>,
): string | null {
  const { id, sourceType, sourceLabel } = source;
  const idLower = id.toLowerCase();
  const labelLower = sourceLabel.toLowerCase();

  // Try by sourceType first (most reliable)
  switch (sourceType) {
    case "weapon":
      if (nodeIdSet.has("eq-weapon-0")) return "eq-weapon-0";
      break;
    case "food":
      if (nodeIdSet.has("eq-food-0")) return "eq-food-0";
      break;
    case "setBonus":
    case "armor": {
      // Try to map armor slot from the source id/label
      const armorSlots = ["head", "mask", "chest", "gloves", "pants", "boots"] as const;
      for (const slot of armorSlots) {
        if (idLower.includes(slot) || labelLower.includes(slot)) {
          const nodeId = `eq-armor-${slot}`;
          if (nodeIdSet.has(nodeId)) return nodeId;
        }
      }
      // Fallback: find any armor node
      for (const slot of armorSlots) {
        const nodeId = `eq-armor-${slot}`;
        if (nodeIdSet.has(nodeId)) return nodeId;
      }
      break;
    }
    case "mod": {
      // Try matching core mods
      for (let i = 0; i < 7; i++) {
        const nodeId = `eq-mod-core-${i}`;
        if (nodeIdSet.has(nodeId)) {
          // Check if the source references this specific mod
          if (idLower.includes(`core-${i}`) || idLower.includes(`-${i}-`)) return nodeId;
        }
      }
      // Fallback: first available mod-core node
      for (let i = 0; i < 7; i++) {
        const nodeId = `eq-mod-core-${i}`;
        if (nodeIdSet.has(nodeId)) return nodeId;
      }
      break;
    }
    case "modSuffix": {
      // Try matching suffix mods
      for (let i = 0; i < 7; i++) {
        const nodeId = `eq-mod-suffix-${i}`;
        if (nodeIdSet.has(nodeId)) {
          if (idLower.includes(`suffix-${i}`) || idLower.includes(`-${i}-`)) return nodeId;
        }
      }
      // Fallback: first available mod-suffix node
      for (let i = 0; i < 7; i++) {
        const nodeId = `eq-mod-suffix-${i}`;
        if (nodeIdSet.has(nodeId)) return nodeId;
      }
      break;
    }
    case "keywordEffect":
    case "temporaryBuff":
      // These may come from weapon keywords or set bonuses — try weapon first
      if (nodeIdSet.has("eq-weapon-0")) return "eq-weapon-0";
      break;
    case "enemyTypeBonus":
      // Usually from food or deviant
      if (nodeIdSet.has("eq-food-0")) return "eq-food-0";
      if (nodeIdSet.has("eq-deviant-0")) return "eq-deviant-0";
      break;
    case "calibration":
    case "gloves":
      // Calibration is on the weapon
      if (nodeIdSet.has("eq-weapon-0")) return "eq-weapon-0";
      break;
  }

  // Heuristic: check id/label for known keywords
  if (idLower.includes("food") || labelLower.includes("food")) {
    if (nodeIdSet.has("eq-food-0")) return "eq-food-0";
  }
  if (idLower.includes("deviant") || idLower.includes("deviation") || labelLower.includes("deviant") || labelLower.includes("deviation")) {
    if (nodeIdSet.has("eq-deviant-0")) return "eq-deviant-0";
  }
  if (idLower.includes("cradle") || labelLower.includes("cradle")) {
    if (nodeIdSet.has("eq-cradle-0")) return "eq-cradle-0";
  }
  if (idLower.includes("weapon") || labelLower.includes("weapon")) {
    if (nodeIdSet.has("eq-weapon-0")) return "eq-weapon-0";
  }

  // Cannot map — skip (requirement 13.3: no throw)
  return null;
}

/**
 * Determine the edge category for an Equipment → Stats edge based on the stat type.
 */
function getEquipmentToStatEdgeCategory(statKey: string): EdgeCategory {
  const cat = classifyStatCategory(statKey);
  switch (cat) {
    case "offensive": return "damage";
    case "defensive": return "defense";
    case "utility": return "resource";
    case "status": return "status";
    default: return "damage";
  }
}

/**
 * Clamp a weight value, handling NaN and Infinity per requirement 13.4.
 */
function clampWeight(w: number): number {
  if (!Number.isFinite(w) || Number.isNaN(w)) return 0.0;
  return Math.max(0.0, w);
}

/**
 * Check if a keyword category is associated with a status effect stat key.
 * Returns the status stat key if found, otherwise null.
 */
function keywordToStatusStatKey(kwCategory: string, statusNodeIds: Set<string>): string | null {
  const lower = kwCategory.toLowerCase();
  for (const kw of STATUS_KEYWORDS) {
    if (lower.includes(kw)) {
      // Look for a matching status node
      for (const statusId of statusNodeIds) {
        const statusStat = statusId.replace("status-", "");
        if (statusStat.toLowerCase().includes(kw)) {
          return statusId;
        }
      }
    }
  }
  return null;
}

interface RawEdge {
  source: string;
  target: string;
  category: EdgeCategory;
  rawWeight: number;
  relation: string;
  description: string;
  sourceLayer: GraphLayer;
  targetLayer: GraphLayer;
  confidence: ConfidenceLevel;
}

/**
 * Compute inter-layer edges from modifier sources, modeled effects, and node topology.
 *
 * Rules enforced:
 * - Directed flow: source layer index ≤ target layer index
 * - No self-referencing edges (source ≠ target)
 * - Deduplication by (source, target, category) — keep highest raw weight
 * - Normalize all edge weights to [0.0, 1.0] with max weight = 1.0
 * - Skip unmappable origins (no throw)
 * - Clamp NaN/Infinity edge weights to 0.0
 * - Skip inactive conditional modifiers unless confidence="estimated" and weight=0
 * - Every edge.relation traces to real engine data
 *
 * Validates: Requirements 2.1–2.11, 13.3, 13.4, 14.1–14.4
 */
export function computeInterLayerEdges(
  nodes: GraphNode[],
  calcInput: CalculationInput | null | undefined,
  _combatOutput: CombatOutput | null | undefined,
): GraphEdge[] {
  if (!calcInput || nodes.length === 0) return [];

  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const nodeLayerMap = new Map(nodes.map((n) => [n.id, n.layer]));
  const statusNodeIds = new Set(
    nodes.filter((n) => n.layer === "status-effects").map((n) => n.id),
  );

  const rawEdges: RawEdge[] = [];

  // ─── 1. Equipment → Stats ──────────────────────────────────────────────────
  if (calcInput.modifierSources) {
    for (const source of calcInput.modifierSources) {
      // Skip zero-value sources
      if (source.value === 0) continue;

      // Skip inactive conditional modifiers unless confidence="estimated" and weight=0
      if (source.conditional && !source.conditional.isActive) {
        // Only include if confidence is estimated-level and we mark weight=0
        if (source.confidence !== "observed_in_game_needs_testing") continue;
      }

      const targetId = `stat-${source.stat}`;
      if (!nodeIdSet.has(targetId)) continue;

      const sourceNodeId = mapSourceToEquipmentNodeId(source, nodeIdSet);
      if (!sourceNodeId) continue; // Unmappable — skip (req 13.3)

      // Ensure no self-reference
      if (sourceNodeId === targetId) continue;

      const category = getEquipmentToStatEdgeCategory(source.stat);
      const rawWeight = clampWeight(Math.abs(source.value));

      rawEdges.push({
        source: sourceNodeId,
        target: targetId,
        category,
        rawWeight,
        relation: `${source.sourceLabel} → ${source.stat}`,
        description: `${source.sourceLabel} contributes ${source.value} to ${source.stat}`,
        sourceLayer: "equipment",
        targetLayer: "stats",
        confidence: mapEngineConfidence(source.confidence),
      });
    }
  }

  // ─── 2. Stats → Keywords ───────────────────────────────────────────────────
  if (calcInput.modeledEffects) {
    for (const effect of calcInput.modeledEffects) {
      if (!effect.contributesModifiers) continue;
      if (!effect.category || effect.category === "") continue;

      const kwNodeId = `kw-${effect.category}`;
      if (!nodeIdSet.has(kwNodeId)) continue;

      // Find stat nodes that relate to this keyword's effect
      // Use modifierSources to find stats contributed by this effect's item
      if (calcInput.modifierSources) {
        for (const source of calcInput.modifierSources) {
          if (source.value === 0) continue;

          // Link stats from the same item to the keyword
          const sourceItemMatch =
            source.id.includes(effect.itemId) ||
            source.sourceLabel.toLowerCase().includes(effect.itemName.toLowerCase());

          if (!sourceItemMatch) continue;

          const statNodeId = `stat-${source.stat}`;
          if (!nodeIdSet.has(statNodeId)) continue;
          if (statNodeId === kwNodeId) continue;

          rawEdges.push({
            source: statNodeId,
            target: kwNodeId,
            category: "scaling",
            rawWeight: 1.0,
            relation: `${source.stat} scales ${effect.category}`,
            description: `${source.stat} scales keyword ${effect.category}`,
            sourceLayer: "stats",
            targetLayer: "keywords",
            confidence: mapEngineConfidence(source.confidence),
          });
        }
      }
    }
  }

  // ─── 3. Keywords → Status Effects ──────────────────────────────────────────
  if (statusNodeIds.size > 0) {
    const kwNodes = nodes.filter((n) => n.layer === "keywords");
    for (const kwNode of kwNodes) {
      const kwCategory = kwNode.label;
      const statusTarget = keywordToStatusStatKey(kwCategory, statusNodeIds);
      if (statusTarget && statusTarget !== kwNode.id) {
        rawEdges.push({
          source: kwNode.id,
          target: statusTarget,
          category: "trigger",
          rawWeight: 1.0,
          relation: `${kwCategory} triggers ${statusTarget.replace("status-", "")}`,
          description: `Keyword ${kwCategory} procs status effect ${statusTarget.replace("status-", "")}`,
          sourceLayer: "keywords",
          targetLayer: "status-effects",
          confidence: "estimated",
        });
      }
    }
  }

  // ─── 4. Stats/Status Effects → Combat Formula ─────────────────────────────
  const statNodes = nodes.filter((n) => n.layer === "stats");
  for (const statNode of statNodes) {
    const statKey = statNode.label;
    const isMultiplicative = MULTIPLICATIVE_STATS.has(statKey);
    const formulaTarget = isMultiplicative ? "formula-multiplicative" : "formula-additive";

    if (!nodeIdSet.has(formulaTarget)) continue;
    if (statNode.id === formulaTarget) continue;

    const rawWeight = clampWeight(
      Math.abs(statNode.metadata.primaryValue ?? 1.0),
    );

    rawEdges.push({
      source: statNode.id,
      target: formulaTarget,
      category: "scaling",
      rawWeight,
      relation: `${statKey} → ${isMultiplicative ? "multiplicative" : "additive"} group`,
      description: `${statKey} feeds into ${isMultiplicative ? "multiplicative" : "additive"} formula`,
      sourceLayer: "stats",
      targetLayer: "combat-formula",
      confidence: statNode.metadata.confidence,
    });
  }

  // Status effects → Combat Formula (additive by default since they are bonus damage)
  const statusEffectNodes = nodes.filter((n) => n.layer === "status-effects");
  for (const seNode of statusEffectNodes) {
    const formulaTarget = "formula-additive";
    if (!nodeIdSet.has(formulaTarget)) continue;
    if (seNode.id === formulaTarget) continue;

    const rawWeight = clampWeight(
      Math.abs(seNode.metadata.primaryValue ?? 1.0),
    );

    rawEdges.push({
      source: seNode.id,
      target: formulaTarget,
      category: "scaling",
      rawWeight,
      relation: `${seNode.label} → additive group`,
      description: `Status effect ${seNode.label} contributes to additive damage`,
      sourceLayer: "status-effects",
      targetLayer: "combat-formula",
      confidence: seNode.metadata.confidence,
    });
  }

  // ─── 5. Combat Formula → Final Output ─────────────────────────────────────
  const formulaNodeIds = ["formula-additive", "formula-multiplicative", "formula-base-damage"];
  const outputNodeIds = ["output-dps", "output-ttk", "output-expected-damage"];
  for (const fId of formulaNodeIds) {
    if (!nodeIdSet.has(fId)) continue;
    for (const oId of outputNodeIds) {
      if (!nodeIdSet.has(oId)) continue;
      if (fId === oId) continue;

      rawEdges.push({
        source: fId,
        target: oId,
        category: "damage",
        rawWeight: 1.0,
        relation: `${fId.replace("formula-", "")} → ${oId.replace("output-", "")}`,
        description: `Formula ${fId.replace("formula-", "")} produces ${oId.replace("output-", "")}`,
        sourceLayer: "combat-formula",
        targetLayer: "final-output",
        confidence: "project_verified",
      });
    }
  }

  // ─── Enforce directed flow and filter invalid edges ────────────────────────
  const validEdges = rawEdges.filter((edge) => {
    // No self-reference
    if (edge.source === edge.target) return false;

    // Both source and target must exist
    if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) return false;

    // Enforce directed flow: source layer index ≤ target layer index
    const sourceIdx = LAYER_ORDER.indexOf(edge.sourceLayer);
    const targetIdx = LAYER_ORDER.indexOf(edge.targetLayer);
    if (sourceIdx < 0 || targetIdx < 0) return false;
    if (sourceIdx > targetIdx) return false;

    return true;
  });

  // ─── Deduplicate by (source, target, category) — keep highest raw weight ──
  const dedupMap = new Map<string, RawEdge>();
  for (const edge of validEdges) {
    const key = `${edge.source}|${edge.target}|${edge.category}`;
    const existing = dedupMap.get(key);
    if (!existing || edge.rawWeight > existing.rawWeight) {
      dedupMap.set(key, edge);
    }
  }

  const dedupedEdges = Array.from(dedupMap.values());

  // ─── Normalize weights to [0.0, 1.0] ──────────────────────────────────────
  let maxRawWeight = 0;
  for (const e of dedupedEdges) {
    const w = clampWeight(e.rawWeight);
    if (w > maxRawWeight) maxRawWeight = w;
  }

  const finalEdges: GraphEdge[] = dedupedEdges.map((raw) => {
    const normalizedWeight =
      maxRawWeight > 0
        ? clampWeight(raw.rawWeight / maxRawWeight)
        : 0.0;

    return {
      id: `edge-${raw.source}-${raw.target}-${raw.category}`,
      source: raw.source,
      target: raw.target,
      category: raw.category,
      isInterLayer: raw.sourceLayer !== raw.targetLayer,
      sourceLayer: raw.sourceLayer,
      targetLayer: raw.targetLayer,
      weight: normalizedWeight,
      directed: true as const,
      relation: raw.relation,
      description: raw.description,
      confidence: raw.confidence,
      combinedValue: raw.rawWeight,
    };
  });

  return finalEdges;
}

/**
 * Map engine confidence strings to the graph's ConfidenceLevel type.
 */
function mapEngineConfidence(engineConf: string): ConfidenceLevel {
  switch (engineConf) {
    case "confirmed":
    case "verified":
      return "project_verified";
    case "observed_in_game_needs_testing":
    case "observed":
      return "observed";
    case "inferred":
    case "estimated":
      return "estimated";
    default:
      return "placeholder";
  }
}

// ─── Metrics Assembly ─────────────────────────────────────────────────────────

/**
 * Assemble comprehensive GraphMetrics from computed nodes, edges, analytics, and cohesion.
 *
 * Computes:
 * - layerNodeCounts: per-layer node count matching actual node.layer values
 * - totalNodeCount: nodes.length
 * - activeNodeCount: count of nodes where isActive === true
 * - interLayerEdgeCount: count of edges where isInterLayer === true
 * - totalEdges: edges.length
 * - isolatedNodeCount: nodes with zero edges (neither source nor target)
 * - strongestSynergy: description of the highest-weight edge, or null if zero edges
 * - layerEdgeCounts: per-layer edge count (count edges by sourceLayer)
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
 */
export function assembleMetrics(
  nodes: GraphNode[],
  edges: GraphEdge[],
  analytics: GraphAnalytics,
  cohesion: CohesionMetrics,
): GraphMetrics {
  // Initialize per-layer counts to zero for all layers
  const layerNodeCounts = {} as Record<GraphLayer, number>;
  const layerEdgeCounts = {} as Record<GraphLayer, number>;
  for (const layer of LAYER_ORDER) {
    layerNodeCounts[layer] = 0;
    layerEdgeCounts[layer] = 0;
  }

  // Req 15.1: layerNodeCounts matches actual node.layer counts
  for (const node of nodes) {
    layerNodeCounts[node.layer]++;
  }

  // Req 15.3: activeNodeCount = count of isActive nodes
  let activeNodeCount = 0;
  for (const node of nodes) {
    if (node.isActive) activeNodeCount++;
  }

  // Req 15.4: interLayerEdgeCount = count of isInterLayer edges
  let interLayerEdgeCount = 0;
  for (const edge of edges) {
    if (edge.isInterLayer) interLayerEdgeCount++;
  }

  // layerEdgeCounts: per-layer edge count by sourceLayer
  for (const edge of edges) {
    layerEdgeCounts[edge.sourceLayer]++;
  }

  // Req 15.6: isolatedNodeCount = nodes with zero edges (not source or target of any edge)
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }
  const isolatedNodeCount = nodes.filter((n) => !connectedNodeIds.has(n.id)).length;

  // Req 15.7: strongestSynergy = highest-weight edge description, or null when zero edges
  let strongestSynergy: string | null = null;
  if (edges.length > 0) {
    let strongestEdge = edges[0];
    for (let i = 1; i < edges.length; i++) {
      if (edges[i].weight > strongestEdge.weight) {
        strongestEdge = edges[i];
      }
    }
    strongestSynergy = strongestEdge.description;
  }

  return {
    cohesion,
    analytics,
    // Req 15.5: totalEdges = edges.length
    totalEdges: edges.length,
    strongestSynergy,
    isolatedNodeCount,
    activeNodeCount,
    // Req 15.2: totalNodeCount = nodes.length
    totalNodeCount: nodes.length,
    layerNodeCounts,
    layerEdgeCounts,
    interLayerEdgeCount,
  };
}

// ─── Main Derivation ──────────────────────────────────────────────────────────

/**
 * Derive a BuildGraphViewModel from theorycraft state.
 * Pure function — never throws, returns safe defaults for invalid inputs.
 * Never mutates the input objects.
 */
export function deriveBuildGraph(
  buildSelection: BuildSelection | null | undefined,
  calcInput: CalculationInput | null | undefined,
  combatOutput: CombatOutput | null | undefined,
): BuildGraphViewModel {
  // Null/undefined buildSelection → not renderable
  if (buildSelection == null) {
    return createNonRenderableResult("No loadout selected");
  }

  // Extract equipment nodes to check renderability
  const equipmentNodes = extractEquipmentNodes(buildSelection);
  if (equipmentNodes.length < 2) {
    return createNonRenderableResult("Equip at least 2 items to generate a build graph.");
  }

  // Extract all nodes
  const nodes = extractMultiLayerNodes(buildSelection, calcInput, combatOutput);

  // Ensure unique IDs (defensive — should already be unique by construction)
  const seenIds = new Set<string>();
  const uniqueNodes: GraphNode[] = [];
  for (const node of nodes) {
    if (!seenIds.has(node.id)) {
      seenIds.add(node.id);
      uniqueNodes.push(node);
    }
  }

  // Assign confidence to all nodes (defaults to "placeholder" when no source metadata)
  assignNodeConfidence(uniqueNodes);

  // Compute inter-layer edges (task 7.2)
  const edges = computeInterLayerEdges(uniqueNodes, calcInput, combatOutput);

  // Compute graph analytics
  const analytics = computeGraphAnalytics(uniqueNodes, edges);

  // Compute energy levels (Requirements 3.1, 3.2, 3.5)
  computeEnergyLevels(uniqueNodes, combatOutput);

  // Compute influence scores (Requirements 3.3, 3.4)
  computeInfluenceScores(uniqueNodes, edges, analytics);

  // Compute edge confidence (Requirements 9.1, 9.3)
  computeEdgeConfidence(edges, uniqueNodes);

  // Compute cohesion metrics
  const cohesion = computeCohesion(uniqueNodes, edges, analytics);

  // Assemble comprehensive metrics (task 7.5)
  const metrics = assembleMetrics(uniqueNodes, edges, analytics, cohesion);

  // Build energy state from computed energy levels
  const energyState = createDefaultEnergyState();
  for (const node of uniqueNodes) {
    energyState.baseEnergy.set(node.id, node.energyLevel);
  }

  // Derive heartbeat from combat output timing
  const heartbeat = deriveHeartbeatConfig(combatOutput);
  energyState.pulseFrequency = heartbeat.baseFrequency;
  energyState.pulseIntensity = heartbeat.isActive ? heartbeat.amplitude : 0;

  return {
    nodes: uniqueNodes,
    edges,
    metrics,
    energyState,
    heartbeat,
    temporalChain: (combatOutput?.damageOutput?.DPS != null &&
      combatOutput.damageOutput.DPS > 0 &&
      uniqueNodes.some((n) => n.layer === "equipment" && n.category === "weapon"))
      ? (() => {
          const chain = buildTemporalChain(combatOutput, uniqueNodes, edges);
          if (chain && chain.frames) {
            const nodeIds = new Set(uniqueNodes.map((n) => n.id));
            for (const frame of chain.frames) {
              if (!nodeIds.has(frame.activeNodeId)) {
                console.warn(
                  `[deriveBuildGraph] Frame references invalid node ID: ${frame.activeNodeId}. Remapping to nearest valid node.`
                );
                let invalidLayer: GraphLayer = "equipment";
                if (frame.activeNodeId.startsWith("eq-")) invalidLayer = "equipment";
                else if (frame.activeNodeId.startsWith("stat-")) invalidLayer = "stats";
                else if (frame.activeNodeId.startsWith("kw-")) invalidLayer = "keywords";
                else if (frame.activeNodeId.startsWith("status-")) invalidLayer = "status-effects";
                else if (frame.activeNodeId.startsWith("formula-")) invalidLayer = "combat-formula";
                else if (frame.activeNodeId.startsWith("output-")) invalidLayer = "final-output";

                const invalidLayerIdx = LAYER_ORDER.indexOf(invalidLayer);
                let bestNode: GraphNode | null = null;
                let minLayerDist = Infinity;

                for (const n of uniqueNodes) {
                  const nLayerIdx = LAYER_ORDER.indexOf(n.layer);
                  const dist = Math.abs(nLayerIdx - invalidLayerIdx);
                  if (dist < minLayerDist) {
                    minLayerDist = dist;
                    bestNode = n;
                  }
                }

                if (bestNode) {
                  frame.activeNodeId = bestNode.id;
                }
              }
            }
          }
          return chain;
        })()
      : null,
    isRenderable: true,
    emptyStateMessage: null,
    visibleLayers: null,
    insights: generateBuildInsights(uniqueNodes, edges, analytics, cohesion.score),
  };
}
