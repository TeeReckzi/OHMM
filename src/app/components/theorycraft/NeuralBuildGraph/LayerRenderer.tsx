/**
 * Layer Renderer — Layer Visibility Toggle Bar
 *
 * Displays a compact horizontal row of layer toggle pills above the graph scene.
 * Each pill shows the layer name and node count, color-coded per LAYER_VISUAL_CONFIG.
 * Clicking a pill toggles that layer's visibility (parent manages state).
 *
 * Validates: Requirements 10.4
 */

import React, { useMemo } from "react";
import type { GraphNode, GraphLayer } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { LAYER_ORDER } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { LAYER_VISUAL_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LayerRendererProps {
  nodes: GraphNode[];
  visibleLayers: GraphLayer[] | null; // null = all visible
  onToggleLayer: (layer: GraphLayer) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LayerRenderer({
  nodes,
  visibleLayers,
  onToggleLayer,
}: LayerRendererProps): JSX.Element {
  // Compute node count per layer
  const layerCounts = useMemo(() => {
    const counts: Record<GraphLayer, number> = {
      equipment: 0,
      stats: 0,
      keywords: 0,
      "status-effects": 0,
      "combat-formula": 0,
      "final-output": 0,
    };
    for (const node of nodes) {
      counts[node.layer]++;
    }
    return counts;
  }, [nodes]);

  return (
    <div
      className="flex flex-wrap gap-1.5 px-2 py-1.5"
      role="toolbar"
      aria-label="Layer visibility toggles"
    >
      {LAYER_ORDER.map((layer) => {
        const config = LAYER_VISUAL_CONFIG[layer];
        const count = layerCounts[layer];
        const isActive = visibleLayers === null || visibleLayers.includes(layer);

        return (
          <button
            key={layer}
            type="button"
            onClick={() => onToggleLayer(layer)}
            aria-pressed={isActive}
            aria-label={`${config.label} layer, ${count} nodes, ${isActive ? "visible" : "hidden"}`}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              "transition-all duration-150 select-none",
              "border",
              isActive
                ? "border-current shadow-sm"
                : "border-neutral-700 opacity-40 hover:opacity-60",
            ].join(" ")}
            style={{
              color: isActive ? config.color : undefined,
              backgroundColor: isActive ? `${config.color}15` : undefined,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: config.color }}
              aria-hidden="true"
            />
            <span>{config.label}</span>
            <span
              className={[
                "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
                isActive ? "bg-white/10" : "bg-neutral-800 text-neutral-500",
              ].join(" ")}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
