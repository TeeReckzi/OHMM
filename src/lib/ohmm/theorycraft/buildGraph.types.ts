// src/lib/ohmm/theorycraft/buildGraph.types.ts

// ─── Layer System ─────────────────────────────────────────────────────────────

export type GraphLayer =
  | "equipment"       // Layer 1: Physical equipment pieces
  | "stats"           // Layer 2: Stat contributions (the 42 StatKeys)
  | "keywords"        // Layer 3: Damage/effect keywords (burn, freeze, etc.)
  | "status-effects"  // Layer 4: Active status procs, DoTs, debuffs
  | "combat-formula"  // Layer 5: Formula groups (additive, multiplicative, base)
  | "final-output";   // Layer 6: Terminal nodes (DPS, TTK, Expected Damage)

export const LAYER_ORDER: GraphLayer[] = [
  "equipment",
  "stats",
  "keywords",
  "status-effects",
  "combat-formula",
  "final-output",
];

// ─── Node Types ───────────────────────────────────────────────────────────────

export type EquipmentCategory =
  | "weapon"
  | "armor"
  | "mod-core"
  | "mod-suffix"
  | "food"
  | "deviant"
  | "cradle";

export type StatCategory = "offensive" | "defensive" | "utility" | "status";

export type KeywordCategory = "elemental" | "physical" | "psi" | "compound";

export type FormulaNodeType = "additive-group" | "multiplicative-group" | "base-damage";

export type OutputNodeType = "dps" | "ttk" | "expected-damage";

export interface GraphNode {
  /** Unique identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Which semantic layer this node belongs to */
  layer: GraphLayer;
  /** Layer-specific category for visual styling */
  category: EquipmentCategory | StatCategory | KeywordCategory | FormulaNodeType | OutputNodeType;
  /** Whether this node is active/equipped (Layer 1) or derived (Layers 2-6) */
  isActive: boolean;
  /** Energy level 0.0–1.0 — drives brightness, pulse amplitude, breathing */
  energyLevel: number;
  /** Influence score (centrality + DPS contribution + dependency + synergy weight) */
  influenceScore: number;
  /** Normalized visual size 0.0–1.0 (driven by influenceScore, not raw magnitude) */
  normalizedSize: number;
  /** Node metadata for tooltips */
  metadata: NodeMetadata;
}

export interface NodeMetadata {
  /** Display name of the item/stat/keyword */
  displayName: string;
  /** Primary value (damage number, stat percentage, etc.) */
  primaryValue?: number;
  /** Formatted primary value for display */
  formattedValue?: string;
  /** Data confidence level */
  confidence: ConfidenceLevel;
  /** DPS contribution percentage (0-100) for this node */
  dpsContribution?: number;
  /** Layer-specific additional data */
  layerData?: Record<string, unknown>;
}

// ─── Edge Types ───────────────────────────────────────────────────────────────

export type EdgeCategory =
  | "damage"         // Direct damage contribution
  | "defense"        // Defensive stat contribution
  | "resource"       // Resource generation/consumption
  | "cooldown"       // Cooldown interaction
  | "status"         // Status effect application/propagation
  | "scaling"        // Multiplicative scaling relationship
  | "conversion"     // Type conversion (e.g., status → explosion)
  | "trigger"        // Trigger condition (e.g., crit triggers effect)
  | "proc"           // Proc chance relationship
  | "conditional"    // Conditional activation
  | "enemy"          // Enemy-dependent interaction
  | "environmental"  // Environmental modifier
  | "set-bonus"      // Armor set bonus activation
  | "stat-stacking"  // Multiple sources stacking same stat
  | "modifier-amplify" // Mod boosting a weapon/armor stat
  | "combo-synergy"; // Status × modifier multiplication

export interface GraphEdge {
  /** Unique edge ID */
  id: string;
  /** Source node ID (where energy/damage ORIGINATES) */
  source: string;
  /** Target node ID (where energy/damage FLOWS TO) */
  target: string;
  /** Edge classification */
  category: EdgeCategory;
  /** Whether this edge crosses layers (inter-layer) or stays within a layer (intra-layer) */
  isInterLayer: boolean;
  /** Source layer */
  sourceLayer: GraphLayer;
  /** Target layer */
  targetLayer: GraphLayer;
  /** Strength 0.0–1.0 (visual thickness + attraction force) */
  weight: number;
  /** Direction of energy flow (always source → target) */
  directed: true;
  /** The shared stat, keyword, or relationship causing the edge */
  relation: string;
  /** Human-readable description */
  description: string;
  /** Data confidence — drives edge visual style */
  confidence: ConfidenceLevel;
  /** Combined contribution value */
  combinedValue: number;
}

// ─── Graph Analytics ──────────────────────────────────────────────────────────

export interface NodeCentrality {
  nodeId: string;
  /** Degree centrality: connections / (totalNodes - 1) */
  degree: number;
  /** Betweenness centrality: fraction of shortest paths passing through */
  betweenness: number;
  /** Eigenvector centrality: importance based on neighbor importance */
  eigenvector: number;
  /** Clustering coefficient: how tightly connected the neighborhood is */
  clusteringCoefficient: number;
}

export interface Community {
  /** Community identifier */
  id: string;
  /** Human-readable community label (auto-generated from dominant category) */
  label: string;
  /** Node IDs in this community */
  members: string[];
  /** Dominant layer in this community */
  dominantLayer: GraphLayer;
  /** Internal edge density */
  internalDensity: number;
}

export interface ConnectedComponent {
  /** Component identifier */
  id: string;
  /** Node IDs in this component */
  members: string[];
  /** Whether this is the main (largest) component */
  isMain: boolean;
  /** Component size */
  size: number;
}

export interface GraphAnalytics {
  /** Per-node centrality metrics */
  centralities: NodeCentrality[];
  /** Detected communities (Louvain algorithm) */
  communities: Community[];
  /** Connected components */
  connectedComponents: ConnectedComponent[];
  /** Global network density: actualEdges / maxPossibleEdges */
  networkDensity: number;
  /** Average clustering coefficient across all nodes */
  averageClusteringCoefficient: number;
  /** Graph diameter: longest shortest path */
  diameter: number;
  /** Whether the graph is fully connected (single component) */
  isFullyConnected: boolean;
}

// ─── Cohesion (Richer Formula) ────────────────────────────────────────────────

export interface CohesionMetrics {
  /** Overall cohesion score 0.0–1.0 */
  score: number;
  /** Human-readable label */
  label: "Scattered" | "Loose" | "Moderate" | "Tight" | "Unified";
  /** Component breakdown */
  components: {
    networkDensity: number;
    averageEdgeWeight: number;
    connectivity: number;
    nodeUtilization: number;
    criticalPathEfficiency: number;
  };
  /** Insight string for the player */
  insight: string;
}

// ─── Energy & Heartbeat ───────────────────────────────────────────────────────

export interface EnergyState {
  /** Base energy level per node (from DPS contribution) */
  baseEnergy: Map<string, number>;
  /** Current pulse phase (0.0–1.0, cycles with heartbeat) */
  pulsePhase: number;
  /** Pulse frequency in Hz (derived from combat tempo) */
  pulseFrequency: number;
  /** Pulse intensity (0.0–1.0, scaled by current combat activity) */
  pulseIntensity: number;
}

export interface HeartbeatConfig {
  /** Base pulse frequency derived from DPS cycle time */
  baseFrequency: number;
  /** Amplitude of the pulse (how much brightness changes) */
  amplitude: number;
  /** Decay rate (how quickly pulse fades) */
  decay: number;
  /** Whether heartbeat is active */
  isActive: boolean;
}

// ─── Temporal Combat Chain ────────────────────────────────────────────────────

export interface TemporalFrame {
  /** Frame index in the chain */
  index: number;
  /** Timestamp in the combat cycle (ms) */
  timestamp: number;
  /** Active node ID (currently "firing") */
  activeNodeId: string;
  /** Active edge ID (energy flowing along this edge) */
  activeEdgeId: string | null;
  /** Event description */
  event: string;
  /** Damage/value at this frame */
  value?: number;
}

export interface CombatTemporalChain {
  /** Ordered frames representing the combat execution chain */
  frames: TemporalFrame[];
  /** Total cycle duration in ms */
  cycleDuration: number;
  /** Whether the chain loops */
  isLooping: boolean;
  /** Chain source description */
  sourceDescription: string;
}

// ─── Failure Mode Analysis ────────────────────────────────────────────────────

export interface FailureModeResult {
  /** Node that was hypothetically removed */
  removedNodeId: string;
  /** Cohesion score BEFORE removal */
  originalCohesion: number;
  /** Cohesion score AFTER removal */
  reducedCohesion: number;
  /** Percentage cohesion drop */
  cohesionDropPercent: number;
  /** Nodes that became disconnected */
  disconnectedNodes: string[];
  /** Edges that were severed */
  severedEdges: string[];
  /** Communities that were split */
  splitCommunities: string[];
  /** Number of new connected components created */
  newComponentsCreated: number;
  /** Human-readable impact summary */
  impactSummary: string;
  /** Severity: how critical is this node? */
  severity: "negligible" | "minor" | "moderate" | "major" | "critical";
}

// ─── Confidence Visualization ─────────────────────────────────────────────────

export type ConfidenceLevel = "project_verified" | "observed" | "estimated" | "placeholder";

export interface ConfidenceVisual {
  /** Line style */
  lineStyle: "solid" | "dashed" | "dotted";
  /** Opacity multiplier */
  opacity: number;
  /** Whether to show glow */
  glowEnabled: boolean;
  /** Glow intensity */
  glowIntensity: number;
}

export const CONFIDENCE_VISUAL_MAP: Record<ConfidenceLevel, ConfidenceVisual> = {
  project_verified: { lineStyle: "solid", opacity: 1.0, glowEnabled: true, glowIntensity: 0.8 },
  observed:         { lineStyle: "solid", opacity: 0.85, glowEnabled: true, glowIntensity: 0.5 },
  estimated:        { lineStyle: "dashed", opacity: 0.6, glowEnabled: false, glowIntensity: 0 },
  placeholder:      { lineStyle: "dotted", opacity: 0.35, glowEnabled: true, glowIntensity: 0.2 },
};

// ─── Graph Metrics (Expanded) ─────────────────────────────────────────────────

export interface GraphMetrics {
  /** Richer cohesion metrics */
  cohesion: CohesionMetrics;
  /** Full graph analytics */
  analytics: GraphAnalytics;
  /** Total active synergies (edges) */
  totalEdges: number;
  /** Strongest synergy description */
  strongestSynergy: string | null;
  /** Number of isolated nodes (no edges) */
  isolatedNodeCount: number;
  /** Number of active nodes */
  activeNodeCount: number;
  /** Total nodes across all layers */
  totalNodeCount: number;
  /** Per-layer node counts */
  layerNodeCounts: Record<GraphLayer, number>;
  /** Per-layer edge counts */
  layerEdgeCounts: Record<GraphLayer, number>;
  /** Inter-layer edge count */
  interLayerEdgeCount: number;
}

// ─── Top-Level View Model ─────────────────────────────────────────────────────

export interface BuildGraphViewModel {
  /** All nodes across all 6 layers */
  nodes: GraphNode[];
  /** All edges (intra-layer + inter-layer) */
  edges: GraphEdge[];
  /** Expanded graph metrics */
  metrics: GraphMetrics;
  /** Energy state for living animation */
  energyState: EnergyState;
  /** Heartbeat configuration */
  heartbeat: HeartbeatConfig;
  /** Temporal combat chain (for playback) */
  temporalChain: CombatTemporalChain | null;
  /** Whether the graph has enough data to render */
  isRenderable: boolean;
  /** Message when not renderable */
  emptyStateMessage: string | null;
  /** Active layer filter (null = show all) */
  visibleLayers: GraphLayer[] | null;
}
