// src/lib/ohmm/theorycraft/buildGraph.constants.ts

import type { GraphLayer, EdgeCategory } from "./buildGraph.types";

// ─── Force Simulation ─────────────────────────────────────────────────────────

/** Physics simulation parameters for d3-force-3d */
export const FORCE_CONFIG = {
  /** Repulsion strength between all nodes */
  chargeStrength: -150,
  /** Attraction multiplier (edge.weight × this = link force) */
  linkStrengthMultiplier: 0.8,
  /** Natural link distance (intra-layer) */
  intraLayerLinkDistance: 40,
  /** Natural link distance (inter-layer — longer to separate layers visually) */
  interLayerLinkDistance: 80,
  /** Center gravity — pulls all nodes toward origin */
  centerStrength: 0.05,
  /** Influence-weighted center force multiplier (higher influence → stronger pull to center) */
  influenceCenterMultiplier: 0.15,
  /** Velocity decay per tick */
  velocityDecay: 0.4,
  /** Alpha target for settled state */
  alphaTarget: 0.0,
  /** Alpha min before simulation sleeps */
  alphaMin: 0.001,
  /** Simulation ticks per frame */
  ticksPerFrame: 3,
  /** Layer separation force (pushes nodes to their layer's Y-band) */
  layerSeparationStrength: 0.1,
} as const;

// ─── Layer Positions ──────────────────────────────────────────────────────────

/** Layer Y-positions in 3D space (stacked vertically) */
export const LAYER_Y_POSITIONS: Record<GraphLayer, number> = {
  "equipment": 30,
  "stats": 15,
  "keywords": 0,
  "status-effects": -15,
  "combat-formula": -30,
  "final-output": -45,
};

// ─── Level of Detail ──────────────────────────────────────────────────────────

/** Performance LOD thresholds */
export const LOD_CONFIG = {
  /** Full quality: all features enabled */
  fullQualityMaxNodes: 30,
  /** Reduced quality threshold */
  reducedQualityMaxNodes: 60,
  /** Minimal quality: collapse inner layers */
  minimalQualityMaxNodes: 100,
  /** Max particles per edge at full quality */
  maxParticlesPerEdge: 8,
  /** Reduced mode particles */
  reducedParticlesPerEdge: 3,
  /** Disable particles above this total node count */
  particleDisableThreshold: 60,
  /** Low-perf ticks per frame */
  lowPerfTicksPerFrame: 1,
  /** Collapse inner layers (2-5) into single representative nodes above threshold */
  layerCollapseThreshold: 80,
} as const;

// ─── Energy & Heartbeat ───────────────────────────────────────────────────────

/** Energy & Heartbeat defaults */
export const ENERGY_CONFIG = {
  /** Minimum energy level (ensures nodes are always slightly visible) */
  minEnergy: 0.05,
  /** Maximum energy level */
  maxEnergy: 1.0,
  /** Breathing animation speed (cycles per second) */
  breathingFrequency: 0.3,
  /** Breathing amplitude (how much size oscillates) */
  breathingAmplitude: 0.05,
  /** Pulse decay time (ms) */
  pulseDecayMs: 800,
  /** Default heartbeat frequency (Hz) — overridden by combat tempo */
  defaultHeartbeatHz: 1.2,
  /** Heartbeat intensity range */
  heartbeatMinIntensity: 0.02,
  heartbeatMaxIntensity: 0.15,
} as const;

// ─── Layer Visuals ────────────────────────────────────────────────────────────

/** Node layer visual config */
export const LAYER_VISUAL_CONFIG: Record<GraphLayer, {
  color: string;
  emissiveIntensity: number;
  baseRadius: number;
  label: string;
}> = {
  "equipment":      { color: "#ff6b35", emissiveIntensity: 0.6, baseRadius: 0.8, label: "Equipment" },
  "stats":          { color: "#4ecdc4", emissiveIntensity: 0.5, baseRadius: 0.5, label: "Stats" },
  "keywords":       { color: "#a855f7", emissiveIntensity: 0.5, baseRadius: 0.5, label: "Keywords" },
  "status-effects": { color: "#ef4444", emissiveIntensity: 0.5, baseRadius: 0.55, label: "Status Effects" },
  "combat-formula": { color: "#06b6d4", emissiveIntensity: 0.4, baseRadius: 0.45, label: "Formula" },
  "final-output":   { color: "#fbbf24", emissiveIntensity: 0.7, baseRadius: 0.9, label: "Output" },
};

// ─── Edge Visuals ─────────────────────────────────────────────────────────────

/** Edge category visual config (all 16 edge types) */
export const EDGE_VISUAL_CONFIG: Record<EdgeCategory, {
  color: string;
  particleColor: string;
  particleSpeed: number;
  dashPattern: [number, number] | null;
}> = {
  "damage":           { color: "#ff6b35", particleColor: "#ffaa80", particleSpeed: 1.2, dashPattern: null },
  "defense":          { color: "#4ecdc4", particleColor: "#7eddd6", particleSpeed: 0.8, dashPattern: null },
  "resource":         { color: "#22c55e", particleColor: "#6ee7a0", particleSpeed: 0.6, dashPattern: [0.1, 0.05] },
  "cooldown":         { color: "#64748b", particleColor: "#94a3b8", particleSpeed: 0.5, dashPattern: [0.08, 0.08] },
  "status":           { color: "#ef4444", particleColor: "#fca5a5", particleSpeed: 1.0, dashPattern: null },
  "scaling":          { color: "#eab308", particleColor: "#fde047", particleSpeed: 1.5, dashPattern: null },
  "conversion":       { color: "#a855f7", particleColor: "#d8b4fe", particleSpeed: 1.3, dashPattern: null },
  "trigger":          { color: "#f97316", particleColor: "#fdba74", particleSpeed: 2.0, dashPattern: null },
  "proc":             { color: "#ec4899", particleColor: "#f9a8d4", particleSpeed: 1.8, dashPattern: [0.12, 0.06] },
  "conditional":      { color: "#8b5cf6", particleColor: "#c4b5fd", particleSpeed: 0.9, dashPattern: [0.15, 0.08] },
  "enemy":            { color: "#dc2626", particleColor: "#fca5a5", particleSpeed: 0.7, dashPattern: [0.1, 0.1] },
  "environmental":    { color: "#059669", particleColor: "#6ee7b7", particleSpeed: 0.6, dashPattern: [0.12, 0.06] },
  "set-bonus":        { color: "#34d399", particleColor: "#6ee7b7", particleSpeed: 0.8, dashPattern: null },
  "stat-stacking":    { color: "#60a5fa", particleColor: "#93c5fd", particleSpeed: 0.9, dashPattern: null },
  "modifier-amplify": { color: "#c084fc", particleColor: "#e9d5ff", particleSpeed: 1.1, dashPattern: [0.1, 0.05] },
  "combo-synergy":    { color: "#fbbf24", particleColor: "#fde68a", particleSpeed: 1.4, dashPattern: [0.15, 0.08] },
};

// ─── Cohesion Thresholds ──────────────────────────────────────────────────────

/**
 * Cohesion score thresholds for label classification.
 * - Scattered: score < 0.15
 * - Loose:     score >= 0.15, < 0.35
 * - Moderate:  score >= 0.35, < 0.55
 * - Tight:     score >= 0.55, < 0.75
 * - Unified:   score >= 0.75
 */
export const COHESION_THRESHOLDS = {
  scattered: 0.15,
  loose: 0.35,
  moderate: 0.55,
  tight: 0.75,
} as const;

// ─── Influence Weights ────────────────────────────────────────────────────────

/**
 * Weights for computing node influence score.
 * InfluenceScore = eigenvector × 0.3 + dpsContribution × 0.35 + degree × 0.2 + edgeWeightSum × 0.15
 */
export const INFLUENCE_WEIGHTS = {
  eigenvector: 0.3,
  dpsContribution: 0.35,
  degree: 0.2,
  edgeWeightSum: 0.15,
} as const;
