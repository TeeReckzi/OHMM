/**
 * CohesionIndicator — Compact badge displaying the build's cohesion score
 *
 * Renders a color-coded badge showing: score (2 decimal places), label text,
 * color indicator per label (Scattered=red, Loose=orange, Moderate=yellow,
 * Tight=green, Unified=emerald). Shows insight string on hover or when
 * expanded. Displays a mini breakdown of the five cohesion components.
 *
 * Validates: Requirements 5.2, 5.4
 */

import React, { useState } from "react";
import type { CohesionMetrics } from "@/lib/ohmm/theorycraft/buildGraph.types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CohesionIndicatorProps {
  cohesion: CohesionMetrics;
}

// ─── Label Color Map ──────────────────────────────────────────────────────────

const LABEL_COLORS: Record<CohesionMetrics["label"], {
  badge: string;
  dot: string;
  bar: string;
}> = {
  Scattered: {
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    dot: "bg-red-400",
    bar: "bg-red-400",
  },
  Loose: {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    dot: "bg-orange-400",
    bar: "bg-orange-400",
  },
  Moderate: {
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    dot: "bg-yellow-400",
    bar: "bg-yellow-400",
  },
  Tight: {
    badge: "bg-green-500/20 text-green-400 border-green-500/40",
    dot: "bg-green-400",
    bar: "bg-green-400",
  },
  Unified: {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
  },
};

// ─── Component Labels ─────────────────────────────────────────────────────────

const COMPONENT_LABELS: Record<keyof CohesionMetrics["components"], string> = {
  networkDensity: "Density",
  averageEdgeWeight: "Edge Wt",
  connectivity: "Connectivity",
  nodeUtilization: "Utilization",
  criticalPathEfficiency: "Crit Path",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CohesionIndicator({ cohesion }: CohesionIndicatorProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const colors = LABEL_COLORS[cohesion.label];
  const showInsight = isExpanded || isHovered;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Badge */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${colors.badge} hover:brightness-110`}
        aria-label={`Build cohesion: ${cohesion.score.toFixed(2)} — ${cohesion.label}`}
        aria-expanded={isExpanded}
      >
        {/* Color dot */}
        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />

        {/* Score */}
        <span className="font-mono tabular-nums">{cohesion.score.toFixed(2)}</span>

        {/* Label */}
        <span className="text-xs opacity-80">{cohesion.label}</span>

        {/* Expand chevron */}
        <svg
          className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded Detail Panel */}
      {showInsight && (
        <div className="absolute top-full left-0 z-30 mt-1 w-64 rounded-lg border border-neutral-700 bg-neutral-900/95 p-3 shadow-xl backdrop-blur-sm">
          {/* Insight string */}
          <p className="mb-3 text-xs text-neutral-300">{cohesion.insight}</p>

          {/* Component Breakdown — Mini Bars */}
          <div className="space-y-1.5">
            {(Object.keys(COMPONENT_LABELS) as Array<keyof CohesionMetrics["components"]>).map(
              (key) => {
                const value = cohesion.components[key];
                const widthPercent = Math.round(value * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-neutral-500">
                      {COMPONENT_LABELS[key]}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className={`h-full rounded-full transition-all ${colors.bar}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] text-neutral-400">
                      {value.toFixed(2)}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
