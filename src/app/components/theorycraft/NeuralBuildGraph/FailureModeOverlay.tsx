/**
 * FailureModeOverlay — "What if removed?" failure analysis panel
 *
 * Displays the impact of hypothetically removing a selected node from the
 * build graph. Prevents removal of final-output layer nodes (requirement 6.7).
 * Shows cohesion drop %, disconnected nodes, severed edges, split communities,
 * and severity rating with color-coded badge.
 *
 * Validates: Requirement 6.7
 */

import React, { useMemo, useState, useEffect } from "react";
import type {
  BuildGraphViewModel,
  FailureModeResult,
  GraphNode,
} from "@/lib/ohmm/theorycraft/buildGraph.types";
import { computeFailureImpact } from "@/lib/ohmm/theorycraft/failureMode";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FailureModeOverlayProps {
  viewModel: BuildGraphViewModel;
  selectedNodeId: string | null;
  onDismiss: () => void;
}

// ─── Severity Color Map ───────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<FailureModeResult["severity"], string> = {
  negligible: "bg-green-500/20 text-green-400 border-green-500/40",
  minor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  major: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
};

const SEVERITY_DOT_COLORS: Record<FailureModeResult["severity"], string> = {
  negligible: "bg-green-400",
  minor: "bg-blue-400",
  moderate: "bg-yellow-400",
  major: "bg-orange-400",
  critical: "bg-red-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FailureModeOverlay({
  viewModel,
  selectedNodeId,
  onDismiss,
}: FailureModeOverlayProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in animation trigger
  useEffect(() => {
    if (selectedNodeId) {
      // Small delay to trigger CSS transition
      const timer = setTimeout(() => setIsVisible(true), 16);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [selectedNodeId]);

  // Find the selected node
  const selectedNode: GraphNode | undefined = useMemo(() => {
    if (!selectedNodeId) return undefined;
    return viewModel.nodes.find((n) => n.id === selectedNodeId);
  }, [viewModel.nodes, selectedNodeId]);

  // Check if it's a final-output node (prevent removal analysis)
  const isFinalOutput = selectedNode?.layer === "final-output";

  // Compute failure impact (only if not a final-output node)
  const failureResult: FailureModeResult | null = useMemo(() => {
    if (!selectedNodeId || !selectedNode || isFinalOutput) return null;
    return computeFailureImpact(
      viewModel.nodes,
      viewModel.edges,
      viewModel.metrics.analytics,
      selectedNodeId
    );
  }, [viewModel.nodes, viewModel.edges, viewModel.metrics.analytics, selectedNodeId, selectedNode, isFinalOutput]);

  // Don't render if no node is selected
  if (!selectedNodeId) return null;

  // ─── Final-output node notification ─────────────────────────────────────

  if (isFinalOutput) {
    return (
      <div
        className={`absolute bottom-4 left-4 right-4 z-20 transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                <svg
                  className="h-4 w-4 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-200">
                Output nodes cannot be removed from the graph.
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              aria-label="Dismiss notification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Failure analysis overlay ───────────────────────────────────────────

  if (!failureResult) return null;

  const severityClasses = SEVERITY_COLORS[failureResult.severity];
  const severityDotClass = SEVERITY_DOT_COLORS[failureResult.severity];

  return (
    <div
      className={`absolute bottom-4 left-4 right-4 z-20 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 shadow-xl backdrop-blur-sm">
        {/* Header with severity badge and dismiss */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-neutral-100">
              Failure Analysis: {selectedNode?.label ?? selectedNodeId}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${severityClasses}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${severityDotClass}`} />
              {failureResult.severity}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Dismiss failure analysis overlay"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Cohesion Drop */}
          <div className="rounded-md border border-neutral-800 bg-neutral-800/50 p-2">
            <p className="text-xs text-neutral-500">Cohesion Drop</p>
            <p className="text-lg font-semibold text-neutral-100">
              {failureResult.cohesionDropPercent.toFixed(1)}%
            </p>
          </div>

          {/* Disconnected Nodes */}
          <div className="rounded-md border border-neutral-800 bg-neutral-800/50 p-2">
            <p className="text-xs text-neutral-500">Disconnected Nodes</p>
            <p className="text-lg font-semibold text-neutral-100">
              {failureResult.disconnectedNodes.length}
            </p>
          </div>

          {/* Severed Edges */}
          <div className="rounded-md border border-neutral-800 bg-neutral-800/50 p-2">
            <p className="text-xs text-neutral-500">Severed Edges</p>
            <p className="text-lg font-semibold text-neutral-100">
              {failureResult.severedEdges.length}
            </p>
          </div>

          {/* Split Communities */}
          <div className="rounded-md border border-neutral-800 bg-neutral-800/50 p-2">
            <p className="text-xs text-neutral-500">Split Communities</p>
            <p className="text-lg font-semibold text-neutral-100">
              {failureResult.splitCommunities.length}
            </p>
          </div>
        </div>

        {/* Disconnected Nodes List (if any) */}
        {failureResult.disconnectedNodes.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-neutral-400">
              Disconnected nodes ({failureResult.disconnectedNodes.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {failureResult.disconnectedNodes.slice(0, 8).map((nodeId) => {
                const node = viewModel.nodes.find((n) => n.id === nodeId);
                return (
                  <span
                    key={nodeId}
                    className="inline-block rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
                  >
                    {node?.label ?? nodeId}
                  </span>
                );
              })}
              {failureResult.disconnectedNodes.length > 8 && (
                <span className="inline-block rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
                  +{failureResult.disconnectedNodes.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Impact Summary */}
        <p className="text-xs text-neutral-400">{failureResult.impactSummary}</p>
      </div>
    </div>
  );
}
