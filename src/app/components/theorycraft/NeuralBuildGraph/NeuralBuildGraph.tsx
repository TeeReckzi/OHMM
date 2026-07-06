/**
 * Neural Build Graph — Main Entry Component
 *
 * Detects WebGL 2.0 availability and prefers-reduced-motion at mount,
 * then routes to the 3D GraphScene (lazy-loaded) or the 2D BuildGraphFallback.
 * Handles WebGL context loss gracefully, transitioning to fallback without state loss.
 *
 * Validates: Requirements 10.1, 10.2, 12.1, 12.2, 12.6
 */

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import type { BuildGraphViewModel } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { BuildGraphFallback } from "./BuildGraphFallback";
import { GraphErrorBoundary } from "./GraphErrorBoundary";

// Lazy-load the 3D scene — keeps Three.js/R3F out of the main bundle
const GraphScene = React.lazy(() => import("./GraphScene"));

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NeuralBuildGraphProps {
  viewModel: BuildGraphViewModel;
  showCohesion?: boolean;
  showAnalytics?: boolean;
  enableFailureMode?: boolean;
  enableTemporalPlayback?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detect WebGL 2.0 support by creating a temporary canvas */
function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    return gl !== null;
  } catch {
    return false;
  }
}

/** Detect prefers-reduced-motion media query */
function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NeuralBuildGraph({
  viewModel,
  showCohesion = true,
  showAnalytics = false,
  enableFailureMode = false,
  enableTemporalPlayback = false,
}: NeuralBuildGraphProps): JSX.Element {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglContextLost, setWebglContextLost] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // ─── WebGL Detection ──────────────────────────────────────────────────────

  useEffect(() => {
    setHasWebGL(detectWebGL2());
  }, []);

  // ─── Reduced Motion Detection ─────────────────────────────────────────────

  useEffect(() => {
    setPrefersReducedMotion(getReducedMotion());

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // ─── WebGL Context Loss Handler ───────────────────────────────────────────

  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    setWebglContextLost(true);
  }, []);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Listen for context loss on any canvas within our container
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [handleContextLost, hasWebGL, webglContextLost]);

  // ─── Decision Tree ────────────────────────────────────────────────────────

  // Not renderable — show empty state
  if (!viewModel.isRenderable) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/50 p-8 text-center">
        <p className="text-sm text-neutral-400">
          {viewModel.emptyStateMessage ?? "Equip more items to see the build graph."}
        </p>
      </div>
    );
  }

  // Still detecting capabilities
  if (hasWebGL === null) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/50 p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
      </div>
    );
  }

  // Use 2D fallback when: no WebGL, prefers-reduced-motion, or context was lost
  const shouldUseFallback = !hasWebGL || prefersReducedMotion || webglContextLost;

  if (shouldUseFallback) {
    return (
      <BuildGraphFallback
        viewModel={viewModel}
        showCohesion={showCohesion}
        showAnalytics={showAnalytics}
        enableFailureMode={enableFailureMode}
        reducedMotion={prefersReducedMotion}
      />
    );
  }

  // 3D scene (lazy loaded with Suspense, wrapped in error boundary)
  return (
    <div ref={canvasContainerRef} className="relative w-full h-[380px] rounded-lg border border-neutral-800 bg-[#050508]">
      <GraphErrorBoundary
        fallback={
          <BuildGraphFallback
            viewModel={viewModel}
            showCohesion={showCohesion}
            showAnalytics={showAnalytics}
            enableFailureMode={enableFailureMode}
          />
        }
      >
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                <span className="text-xs text-neutral-500">Loading 3D scene…</span>
              </div>
            </div>
          }
        >
          <GraphScene
            viewModel={viewModel}
            showCohesion={showCohesion}
            showAnalytics={showAnalytics}
            enableFailureMode={enableFailureMode}
            enableTemporalPlayback={enableTemporalPlayback}
          />
        </Suspense>
      </GraphErrorBoundary>
    </div>
  );
}
