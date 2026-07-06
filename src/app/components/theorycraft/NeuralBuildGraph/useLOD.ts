/**
 * useLOD — Level of Detail management hook for the Neural Build Graph
 *
 * Determines the current LOD tier based on node count with hysteresis,
 * monitors per-frame performance to auto-drop/restore tiers, and pauses
 * simulation when the container is not in viewport via IntersectionObserver.
 *
 * Tier logic:
 *   full    (1–30 nodes):  8 particles/edge, 3 ticks/frame, glow + heartbeat
 *   reduced (31–60 nodes): 3 particles/edge, 2 ticks/frame, reduced glow
 *   minimal (61–100 nodes): 0 particles, 1 tick/frame, no glow/heartbeat
 *   static  (100+ nodes):  2D SVG fallback, no 3D rendering
 *
 * Hysteresis: 3-node margin at tier boundaries to prevent oscillation.
 * Performance: auto-drop after 10 consecutive frames >12ms, restore after 30 <8ms.
 * Viewport: IntersectionObserver pauses simulation when not visible.
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LODTier = "full" | "reduced" | "minimal" | "static";

export interface LODState {
  tier: LODTier;
  particlesPerEdge: number;
  ticksPerFrame: number;
  enableGlow: boolean;
  enableHeartbeat: boolean;
  enableParticles: boolean;
  shouldUseFallback: boolean;
  isInViewport: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Node count boundaries for tier transitions */
const TIER_BOUNDARIES = {
  fullMax: 30,
  reducedMax: 60,
  minimalMax: 100,
} as const;

/** Hysteresis margin applied at tier boundaries */
const HYSTERESIS_MARGIN = 3;

/** Performance monitoring thresholds */
const PERF_DROP_THRESHOLD_MS = 12;
const PERF_DROP_CONSECUTIVE_FRAMES = 10;
const PERF_RESTORE_THRESHOLD_MS = 8;
const PERF_RESTORE_CONSECUTIVE_FRAMES = 30;

/** Tier configuration lookup */
const TIER_CONFIG: Record<LODTier, Omit<LODState, "isInViewport">> = {
  full: {
    tier: "full",
    particlesPerEdge: 8,
    ticksPerFrame: 3,
    enableGlow: true,
    enableHeartbeat: true,
    enableParticles: true,
    shouldUseFallback: false,
  },
  reduced: {
    tier: "reduced",
    particlesPerEdge: 3,
    ticksPerFrame: 2,
    enableGlow: false,
    enableHeartbeat: true,
    enableParticles: true,
    shouldUseFallback: false,
  },
  minimal: {
    tier: "minimal",
    particlesPerEdge: 0,
    ticksPerFrame: 1,
    enableGlow: false,
    enableHeartbeat: false,
    enableParticles: false,
    shouldUseFallback: false,
  },
  static: {
    tier: "static",
    particlesPerEdge: 0,
    ticksPerFrame: 0,
    enableGlow: false,
    enableHeartbeat: false,
    enableParticles: false,
    shouldUseFallback: true,
  },
};

/** Ordered tier list from highest to lowest quality */
const TIER_ORDER: LODTier[] = ["full", "reduced", "minimal", "static"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine the base tier from node count, applying hysteresis
 * based on the current tier to prevent oscillation.
 */
function computeTierFromNodeCount(nodeCount: number, currentTier: LODTier): LODTier {
  // Apply hysteresis: use different thresholds depending on direction
  // Going UP in quality (lower tier → higher tier) requires crossing below (boundary - margin)
  // Going DOWN in quality (higher tier → lower tier) requires crossing above (boundary + margin)

  const currentIndex = TIER_ORDER.indexOf(currentTier);

  // Check if we should be in static tier (>100 nodes)
  if (currentTier === "static") {
    // To leave static, need to drop below minimalMax - margin
    if (nodeCount <= TIER_BOUNDARIES.minimalMax - HYSTERESIS_MARGIN) {
      // Fall through to determine which lower tier
    } else {
      return "static";
    }
  } else if (nodeCount > TIER_BOUNDARIES.minimalMax + HYSTERESIS_MARGIN) {
    return "static";
  } else if (nodeCount > TIER_BOUNDARIES.minimalMax) {
    // In hysteresis zone: stay in current tier if already static, otherwise minimal
    if (currentTier === "static") return "static";
    // else fall through
  }

  // Check minimal tier (61–100 nodes)
  if (currentTier === "minimal") {
    // To upgrade to reduced, need to drop below reducedMax - margin
    if (nodeCount <= TIER_BOUNDARIES.reducedMax - HYSTERESIS_MARGIN) {
      // Fall through to check reduced/full
    } else {
      return "minimal";
    }
  } else if (currentIndex < TIER_ORDER.indexOf("minimal")) {
    // Currently in full or reduced — to downgrade to minimal, need > reducedMax + margin
    if (nodeCount > TIER_BOUNDARIES.reducedMax + HYSTERESIS_MARGIN) {
      return "minimal";
    }
  }

  // Check reduced tier (31–60 nodes)
  if (currentTier === "reduced") {
    // To upgrade to full, need to drop below fullMax - margin (i.e., <=27)
    if (nodeCount <= TIER_BOUNDARIES.fullMax - HYSTERESIS_MARGIN) {
      return "full";
    }
    // To downgrade to minimal, need > reducedMax + margin (already handled above)
    return "reduced";
  } else if (currentTier === "full") {
    // To downgrade to reduced, need > fullMax + margin (i.e., >=33)
    if (nodeCount > TIER_BOUNDARIES.fullMax + HYSTERESIS_MARGIN) {
      // Check if we should skip to minimal
      if (nodeCount > TIER_BOUNDARIES.reducedMax + HYSTERESIS_MARGIN) {
        return "minimal";
      }
      return "reduced";
    }
    return "full";
  }

  // Default determination without hysteresis (for initial state or recovered from static/minimal)
  if (nodeCount > TIER_BOUNDARIES.minimalMax) return "static";
  if (nodeCount > TIER_BOUNDARIES.reducedMax) return "minimal";
  if (nodeCount > TIER_BOUNDARIES.fullMax) return "reduced";
  return "full";
}

/**
 * Get the next lower LOD tier (lower quality).
 * Returns null if already at the lowest tier.
 */
function getNextLowerTier(tier: LODTier): LODTier | null {
  const index = TIER_ORDER.indexOf(tier);
  if (index >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[index + 1];
}

/**
 * Get the next higher LOD tier (higher quality).
 * Returns null if already at the highest tier.
 */
function getNextHigherTier(tier: LODTier): LODTier | null {
  const index = TIER_ORDER.indexOf(tier);
  if (index <= 0) return null;
  return TIER_ORDER[index - 1];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useLOD — manages LOD tier state for the Neural Build Graph.
 *
 * @param nodeCount - Current number of nodes in the graph
 * @param containerRef - Ref to the container element for IntersectionObserver
 * @returns LODState with current tier configuration and viewport visibility
 */
export function useLOD(
  nodeCount: number,
  containerRef: React.RefObject<HTMLElement>,
): LODState {
  // Current LOD tier (may be overridden by performance monitoring)
  const [currentTier, setCurrentTier] = useState<LODTier>(() => {
    if (nodeCount > TIER_BOUNDARIES.minimalMax) return "static";
    if (nodeCount > TIER_BOUNDARIES.reducedMax) return "minimal";
    if (nodeCount > TIER_BOUNDARIES.fullMax) return "reduced";
    return "full";
  });

  // Whether the performance monitor has forced a tier drop
  const [perfOverrideTier, setPerfOverrideTier] = useState<LODTier | null>(null);

  // Viewport visibility
  const [isInViewport, setIsInViewport] = useState(true);

  // Performance monitoring counters (refs to avoid re-renders)
  const slowFrameCount = useRef(0);
  const fastFrameCount = useRef(0);
  const lastFrameTime = useRef(0);
  const rafId = useRef<number | null>(null);

  // Track the "base" tier from node count (before perf override)
  const baseTier = useMemo(
    () => computeTierFromNodeCount(nodeCount, currentTier),
    [nodeCount, currentTier],
  );

  // Update current tier when base tier changes (node count driven)
  useEffect(() => {
    setCurrentTier(baseTier);
    // Reset perf override when node-count-based tier changes
    setPerfOverrideTier(null);
    slowFrameCount.current = 0;
    fastFrameCount.current = 0;
  }, [baseTier]);

  // ─── Performance Monitoring ─────────────────────────────────────────────────

  const measureFrame = useCallback(() => {
    const now = performance.now();

    if (lastFrameTime.current > 0) {
      const frameTime = now - lastFrameTime.current;
      const activeTier = perfOverrideTier ?? currentTier;

      if (frameTime > PERF_DROP_THRESHOLD_MS) {
        slowFrameCount.current++;
        fastFrameCount.current = 0;

        if (slowFrameCount.current >= PERF_DROP_CONSECUTIVE_FRAMES) {
          // Drop to next lower tier
          const nextLower = getNextLowerTier(activeTier);
          if (nextLower) {
            setPerfOverrideTier(nextLower);
            slowFrameCount.current = 0;
          }
        }
      } else if (frameTime < PERF_RESTORE_THRESHOLD_MS) {
        fastFrameCount.current++;
        slowFrameCount.current = 0;

        if (fastFrameCount.current >= PERF_RESTORE_CONSECUTIVE_FRAMES) {
          // Try restoring to higher tier (but not above base tier)
          const activeTierNow = perfOverrideTier ?? currentTier;
          const baseTierIndex = TIER_ORDER.indexOf(currentTier);
          const activeTierIndex = TIER_ORDER.indexOf(activeTierNow);

          if (activeTierIndex > baseTierIndex) {
            const nextHigher = getNextHigherTier(activeTierNow);
            if (nextHigher) {
              setPerfOverrideTier(
                nextHigher === currentTier ? null : nextHigher,
              );
            }
          }
          fastFrameCount.current = 0;
        }
      } else {
        // Frame time between 8ms and 12ms — reset both counters
        slowFrameCount.current = 0;
        fastFrameCount.current = 0;
      }
    }

    lastFrameTime.current = now;

    // Only continue monitoring if in viewport and not in static mode
    if (isInViewport && currentTier !== "static") {
      rafId.current = requestAnimationFrame(measureFrame);
    }
  }, [currentTier, perfOverrideTier, isInViewport]);

  // Start/stop performance monitoring based on viewport visibility
  useEffect(() => {
    if (isInViewport && currentTier !== "static") {
      lastFrameTime.current = 0;
      slowFrameCount.current = 0;
      fastFrameCount.current = 0;
      rafId.current = requestAnimationFrame(measureFrame);
    }

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [isInViewport, currentTier, measureFrame]);

  // ─── IntersectionObserver ───────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  // ─── Compute final state ────────────────────────────────────────────────────

  const effectiveTier = perfOverrideTier ?? currentTier;
  const config = TIER_CONFIG[effectiveTier];

  return useMemo<LODState>(
    () => ({
      ...config,
      isInViewport,
    }),
    [config, isInViewport],
  );
}
