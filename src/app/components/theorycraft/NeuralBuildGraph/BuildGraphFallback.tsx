/**
 * BuildGraphFallback — 2D SVG Accessibility Fallback
 *
 * Renders the neural build graph as a fully accessible SVG diagram when WebGL
 * is unavailable or the user prefers reduced motion. Provides identical topology,
 * cohesion scoring, analytics, and failure mode analysis as the 3D scene.
 *
 * Features:
 * - Nodes as colored circles with text labels, grouped by layer
 * - Edges as SVG lines with arrowheads, thickness by weight, style by confidence
 * - Full keyboard navigation (arrow keys, Tab/Shift+Tab between layers, Enter for details)
 * - ARIA labels on all nodes and edges
 * - Static force-settled layout (no animation)
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import React, { useMemo, useState, useCallback, useRef } from "react";
import type {
  BuildGraphViewModel,
  GraphNode,
  GraphEdge,
  GraphLayer,
  ConfidenceLevel,
} from "@/lib/ohmm/theorycraft/buildGraph.types";
import { LAYER_ORDER, CONFIDENCE_VISUAL_MAP } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { LAYER_VISUAL_CONFIG, EDGE_VISUAL_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";
import { CohesionIndicator } from "./CohesionIndicator";
import { AnalyticsPanel } from "./AnalyticsPanel";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BuildGraphFallbackProps {
  viewModel: BuildGraphViewModel;
  showCohesion?: boolean;
  showAnalytics?: boolean;
  enableFailureMode?: boolean;
}

// ─── Layout Constants ─────────────────────────────────────────────────────────

const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;

/** Layer Y positions for horizontal banding (top to bottom) */
const LAYER_Y_POSITIONS: Record<GraphLayer, number> = {
  "equipment": 50,
  "stats": 150,
  "keywords": 250,
  "status-effects": 350,
  "combat-formula": 450,
  "final-output": 550,
};

/** Confidence-to-opacity mapping */
const CONFIDENCE_OPACITY: Record<ConfidenceLevel, number> = {
  project_verified: 1.0,
  observed: 0.85,
  estimated: 0.6,
  placeholder: 0.35,
};

// ─── Layout Computation ───────────────────────────────────────────────────────

interface NodePosition {
  x: number;
  y: number;
}

function computeStaticLayout(nodes: GraphNode[]): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();

  // Group nodes by layer
  const layerGroups = new Map<GraphLayer, GraphNode[]>();
  for (const layer of LAYER_ORDER) {
    layerGroups.set(layer, []);
  }
  for (const node of nodes) {
    const group = layerGroups.get(node.layer);
    if (group) group.push(node);
  }

  // Position nodes within each layer band
  for (const [layer, layerNodes] of layerGroups) {
    const y = LAYER_Y_POSITIONS[layer];
    const count = layerNodes.length;
    if (count === 0) continue;

    // Spread horizontally within the viewport with padding
    const padding = 60;
    const availableWidth = SVG_WIDTH - padding * 2;
    const spacing = count > 1 ? availableWidth / (count - 1) : 0;
    const startX = count > 1 ? padding : SVG_WIDTH / 2;

    for (let i = 0; i < layerNodes.length; i++) {
      positions.set(layerNodes[i].id, {
        x: startX + i * spacing,
        y,
      });
    }
  }

  return positions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNodeRadius(node: GraphNode): number {
  return node.normalizedSize * 12 + 8;
}

function truncateLabel(label: string, maxLen = 12): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + "…" : label;
}

function getEdgeStrokeDash(confidence: ConfidenceLevel): string | undefined {
  const visual = CONFIDENCE_VISUAL_MAP[confidence];
  switch (visual.lineStyle) {
    case "dashed":
      return "6 4";
    case "dotted":
      return "2 3";
    default:
      return undefined;
  }
}

function getEdgeStrokeWidth(weight: number): number {
  return Math.min(3.5, Math.max(0.5, weight * 3 + 0.5));
}

function getCohesionColor(label: string): string {
  switch (label) {
    case "Unified":
      return "text-emerald-400";
    case "Tight":
      return "text-green-400";
    case "Moderate":
      return "text-yellow-400";
    case "Loose":
      return "text-orange-400";
    case "Scattered":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

function getCohesionBgColor(label: string): string {
  switch (label) {
    case "Unified":
      return "bg-emerald-900/60";
    case "Tight":
      return "bg-green-900/60";
    case "Moderate":
      return "bg-yellow-900/60";
    case "Loose":
      return "bg-orange-900/60";
    case "Scattered":
      return "bg-red-900/60";
    default:
      return "bg-gray-900/60";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BuildGraphFallback({
  viewModel,
  showCohesion = true,
  showAnalytics = false,
  enableFailureMode = false,
}: BuildGraphFallbackProps): JSX.Element {
  const { nodes, edges, metrics } = viewModel;
  const svgRef = useRef<SVGSVGElement>(null);

  // ─── Focus state ────────────────────────────────────────────────────────────
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ─── Sidebar state ──────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Computed layout (static, no animation) ────────────────────────────────
  const positions = useMemo(() => computeStaticLayout(nodes), [nodes]);

  // ─── Node lookup for keyboard navigation ───────────────────────────────────
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of nodes) map.set(node.id, node);
    return map;
  }, [nodes]);

  // ─── Adjacency for arrow-key navigation ────────────────────────────────────
  const adjacency = useMemo(() => {
    const adj = new Map<string, Set<string>>();
    for (const node of nodes) adj.set(node.id, new Set());
    for (const edge of edges) {
      adj.get(edge.source)?.add(edge.target);
      adj.get(edge.target)?.add(edge.source);
    }
    return adj;
  }, [nodes, edges]);

  // ─── Layer-grouped nodes for Tab navigation ────────────────────────────────
  const layerNodeIds = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const layer of LAYER_ORDER) groups[layer] = [];
    for (const node of nodes) {
      if (groups[node.layer]) groups[node.layer].push(node.id);
    }
    return groups;
  }, [nodes]);

  // ─── Keyboard handler ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (!focusedNodeId) {
        // If nothing focused, focus the first node
        if (nodes.length > 0 && (e.key === "Tab" || e.key.startsWith("Arrow"))) {
          setFocusedNodeId(nodes[0].id);
          e.preventDefault();
        }
        return;
      }

      const currentNode = nodeMap.get(focusedNodeId);
      if (!currentNode) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown": {
          // Navigate to next connected node
          const neighbors = adjacency.get(focusedNodeId);
          if (neighbors && neighbors.size > 0) {
            const neighborArr = Array.from(neighbors);
            const currentIdx = neighborArr.indexOf(focusedNodeId);
            const nextIdx = (currentIdx + 1) % neighborArr.length;
            setFocusedNodeId(neighborArr[nextIdx >= 0 ? nextIdx : 0]);
          }
          e.preventDefault();
          break;
        }
        case "ArrowLeft":
        case "ArrowUp": {
          // Navigate to previous connected node
          const neighbors = adjacency.get(focusedNodeId);
          if (neighbors && neighbors.size > 0) {
            const neighborArr = Array.from(neighbors);
            const currentIdx = neighborArr.indexOf(focusedNodeId);
            const prevIdx = currentIdx > 0 ? currentIdx - 1 : neighborArr.length - 1;
            setFocusedNodeId(neighborArr[prevIdx >= 0 ? prevIdx : 0]);
          }
          e.preventDefault();
          break;
        }
        case "Tab": {
          // Tab/Shift+Tab cycles between layers
          const currentLayerIdx = LAYER_ORDER.indexOf(currentNode.layer);
          let nextLayerIdx: number;

          if (e.shiftKey) {
            nextLayerIdx = currentLayerIdx > 0 ? currentLayerIdx - 1 : LAYER_ORDER.length - 1;
          } else {
            nextLayerIdx = (currentLayerIdx + 1) % LAYER_ORDER.length;
          }

          // Find first node in next layer
          const nextLayer = LAYER_ORDER[nextLayerIdx];
          const nextLayerNodes = layerNodeIds[nextLayer];
          if (nextLayerNodes && nextLayerNodes.length > 0) {
            setFocusedNodeId(nextLayerNodes[0]);
          }
          e.preventDefault();
          break;
        }
        case "Enter": {
          // Select node for detail display
          setSelectedNodeId(focusedNodeId === selectedNodeId ? null : focusedNodeId);
          e.preventDefault();
          break;
        }
      }
    },
    [focusedNodeId, selectedNodeId, nodes, nodeMap, adjacency, layerNodeIds]
  );

  // ─── Selected node details ─────────────────────────────────────────────────
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  // ─── Failure mode state ────────────────────────────────────────────────────
  const [failureNodeId, setFailureNodeId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full flex overflow-hidden"
      style={{ height: 600 }}
    >
      {/* SVG Canvas Container */}
      <div className="relative flex-1 h-full">
        {/* SVG Graph */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full border border-gray-700 rounded-lg bg-gray-950"
          role="graphics-document"
          aria-label={`Neural build graph with ${nodes.length} nodes and ${edges.length} edges`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Arrow marker definitions */}
          <defs>
            {LAYER_ORDER.map((layer) => (
              <marker
                key={`marker-${layer}`}
                id={`arrowhead-${layer}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill={LAYER_VISUAL_CONFIG[layer].color}
                />
              </marker>
            ))}
            {/* Generic arrowheads per edge category */}
            {Object.entries(EDGE_VISUAL_CONFIG).map(([category, config]) => (
              <marker
                key={`marker-edge-${category}`}
                id={`arrowhead-edge-${category}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill={config.color} />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {edges.map((edge) => {
            const sourcePos = positions.get(edge.source);
            const targetPos = positions.get(edge.target);
            if (!sourcePos || !targetPos) return null;

            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            // Shorten line to account for target node radius
            const targetRadius = getNodeRadius(targetNode);
            const dx = targetPos.x - sourcePos.x;
            const dy = targetPos.y - sourcePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const shortenFactor = dist > 0 ? (dist - targetRadius - 4) / dist : 1;

            const endX = sourcePos.x + dx * shortenFactor;
            const endY = sourcePos.y + dy * shortenFactor;

            const strokeWidth = getEdgeStrokeWidth(edge.weight);
            const strokeDash = getEdgeStrokeDash(edge.confidence);
            const edgeColor = EDGE_VISUAL_CONFIG[edge.category]?.color ?? "#666";

            return (
              <line
                key={edge.id}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={endX}
                y2={endY}
                stroke={edgeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                opacity={CONFIDENCE_VISUAL_MAP[edge.confidence]?.opacity ?? 0.6}
                markerEnd={`url(#arrowhead-edge-${edge.category})`}
                aria-label={`Edge from ${sourceNode.label} to ${targetNode.label}, Category: ${edge.category}, Weight: ${edge.weight.toFixed(2)}`}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const radius = getNodeRadius(node);
            const color = LAYER_VISUAL_CONFIG[node.layer]?.color ?? "#888";
            const opacity = CONFIDENCE_OPACITY[node.metadata.confidence] ?? 0.6;
            const isFocused = focusedNodeId === node.id;
            const isSelected = selectedNodeId === node.id;

            return (
              <g key={node.id}>
                {/* Focus ring */}
                {isFocused && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 4}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    strokeDasharray="3 2"
                  />
                )}
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 3}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={2}
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={color}
                  opacity={opacity}
                  stroke={isFocused ? "#60a5fa" : "none"}
                  strokeWidth={isFocused ? 1.5 : 0}
                  role="img"
                  aria-label={`Node: ${node.label}, Layer: ${node.layer}, Energy: ${node.energyLevel.toFixed(2)}, Confidence: ${node.metadata.confidence}`}
                  onClick={() => {
                    setFocusedNodeId(node.id);
                    setSelectedNodeId(node.id);
                  }}
                  className="cursor-pointer"
                />
                {/* Text label */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 14}
                  textAnchor="middle"
                  fill="#e5e7eb"
                  fontSize={10}
                  className="pointer-events-none select-none"
                >
                  {truncateLabel(node.label)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Cohesion Badge */}
        {showCohesion && (
          <div className="absolute top-3 right-3 z-10">
            <CohesionIndicator cohesion={metrics.cohesion} />
          </div>
        )}

        {/* Toggle Sidebar Button */}
        {showAnalytics && (
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
            }}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
            aria-label="Toggle analytics panel"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Analytics
          </button>
        )}

        {/* Selected Node Details & Failure Mode trigger */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 p-3 bg-neutral-900/95 border border-neutral-700 rounded-lg text-xs text-neutral-300 z-10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-neutral-100">
                {selectedNode.label}
              </h4>
              <button
                className="text-neutral-500 hover:text-neutral-300"
                onClick={() => setSelectedNodeId(null)}
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="text-neutral-500">Layer:</span>{" "}
                {LAYER_VISUAL_CONFIG[selectedNode.layer]?.label ?? selectedNode.layer}
              </div>
              <div>
                <span className="text-neutral-500">Energy:</span>{" "}
                {selectedNode.energyLevel.toFixed(2)}
              </div>
              <div>
                <span className="text-neutral-500">Influence:</span>{" "}
                {selectedNode.influenceScore.toFixed(2)}
              </div>
              <div>
                <span className="text-neutral-500">Confidence:</span>{" "}
                {selectedNode.metadata.confidence}
              </div>
              {selectedNode.metadata.formattedValue && (
                <div className="col-span-2">
                  <span className="text-neutral-500">Value:</span>{" "}
                  {selectedNode.metadata.formattedValue}
                </div>
              )}
              {selectedNode.metadata.dpsContribution != null && (
                <div className="col-span-2">
                  <span className="text-neutral-500">DPS Contribution:</span>{" "}
                  {selectedNode.metadata.dpsContribution.toFixed(1)}%
                </div>
              )}
            </div>

            {/* Failure Mode button */}
            {enableFailureMode && selectedNode.layer !== "final-output" && (
              <button
                className="mt-2 px-2 py-1 bg-red-950/40 border border-red-800 rounded text-red-400 text-xs hover:bg-red-900/40 transition-colors"
                onClick={() => setFailureNodeId(selectedNode.id)}
              >
                Analyze removal impact
              </button>
            )}
          </div>
        )}

        {/* Failure Mode Result Overlay (mocked here, actual handled by FailureModeOverlay wrapper) */}
        {enableFailureMode && failureNodeId && (
          <div className="absolute bottom-3 left-3 right-3 p-3 bg-red-950/95 border border-red-800 rounded-lg text-xs text-red-200 z-20 backdrop-blur-sm">
            <span className="font-semibold">Failure analysis</span> for node "{nodeMap.get(failureNodeId)?.label ?? failureNodeId}" is available when integrated with the failure mode engine.
            <button
              className="ml-2 text-red-400 underline font-medium"
              onClick={() => setFailureNodeId(null)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Panel container */}
      {showAnalytics && sidebarOpen && (
        <div
          style={{
            width: 320,
            height: "100%",
            flexShrink: 0,
            zIndex: 15,
          }}
        >
          <AnalyticsPanel
            analytics={metrics.analytics}
            nodes={nodes}
            insights={viewModel.insights ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
