/**
 * AnalyticsPanel — Sidebar showing graph analytics summary
 *
 * Displays collapsible sections for:
 * - Top 5 nodes by eigenvector centrality (ranked list)
 * - Community memberships (which nodes in which community)
 * - Connected components info (count, main component size)
 * - Network density, average clustering coefficient, diameter
 *
 * Includes confidence tooltip on hover/select showing human-readable label.
 *
 * Validates: Requirements 5.4, 9.5
 */

import React, { useState, useMemo } from "react";
import type {
  GraphAnalytics,
  GraphNode,
  ConfidenceLevel,
} from "@/lib/ohmm/theorycraft/buildGraph.types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AnalyticsPanelProps {
  analytics: GraphAnalytics;
  nodes: GraphNode[];
}

// ─── Confidence Labels ────────────────────────────────────────────────────────

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  project_verified: "Verified",
  observed: "Observed",
  estimated: "Estimated",
  placeholder: "Placeholder",
};

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  project_verified: "text-green-400",
  observed: "text-blue-400",
  estimated: "text-yellow-400",
  placeholder: "text-neutral-500",
};

// ─── Collapsible Section ──────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-800 last:border-b-0">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 transition-colors hover:text-neutral-200"
        aria-expanded={isOpen}
      >
        {title}
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ─── Confidence Tooltip ───────────────────────────────────────────────────────

interface ConfidenceTooltipProps {
  confidence: ConfidenceLevel;
}

function ConfidenceBadge({ confidence }: ConfidenceTooltipProps): JSX.Element {
  return (
    <span
      className={`text-[10px] ${CONFIDENCE_COLORS[confidence]}`}
      title={`Data confidence: ${CONFIDENCE_LABELS[confidence]}`}
    >
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsPanel({ analytics, nodes }: AnalyticsPanelProps): JSX.Element {
  // Derive top 5 nodes by eigenvector centrality
  const topCentrality = useMemo(() => {
    return [...analytics.centralities]
      .sort((a, b) => b.eigenvector - a.eigenvector)
      .slice(0, 5)
      .map((c) => {
        const node = nodes.find((n) => n.id === c.nodeId);
        return { ...c, node };
      });
  }, [analytics.centralities, nodes]);

  // Node lookup helper
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  // Main component info
  const mainComponent = analytics.connectedComponents.find((c) => c.isMain);
  const componentCount = analytics.connectedComponents.length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm">
      {/* Panel Header */}
      <div className="border-b border-neutral-800 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
          Graph Analytics
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ─── Centrality Rankings ─────────────────────────────────────── */}
        <Section title="Centrality Rankings" defaultOpen={true}>
          {topCentrality.length === 0 ? (
            <p className="text-xs text-neutral-500">No nodes to rank.</p>
          ) : (
            <ol className="space-y-1.5">
              {topCentrality.map((entry, index) => (
                <li
                  key={entry.nodeId}
                  className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-neutral-800/60"
                >
                  {/* Rank */}
                  <span className="w-4 shrink-0 text-right font-mono text-[10px] text-neutral-600">
                    {index + 1}
                  </span>

                  {/* Node info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs text-neutral-200">
                        {entry.node?.label ?? entry.nodeId}
                      </span>
                      {entry.node && (
                        <ConfidenceBadge confidence={entry.node.metadata.confidence} />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {entry.node?.layer ?? "unknown"}
                    </span>
                  </div>

                  {/* Eigenvector score */}
                  <span className="shrink-0 font-mono text-xs text-neutral-400">
                    {entry.eigenvector.toFixed(3)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* ─── Community Memberships ──────────────────────────────────── */}
        <Section title="Communities" defaultOpen={false}>
          {analytics.communities.length === 0 ? (
            <p className="text-xs text-neutral-500">No communities detected.</p>
          ) : (
            <div className="space-y-2">
              {analytics.communities.map((community) => (
                <div key={community.id} className="rounded border border-neutral-800 p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-200">
                      {community.label}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {community.members.length} nodes
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {community.members.slice(0, 6).map((memberId) => {
                      const node = nodeMap.get(memberId);
                      return (
                        <span
                          key={memberId}
                          className="inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300"
                          title={
                            node
                              ? `${node.label} (${CONFIDENCE_LABELS[node.metadata.confidence]})`
                              : memberId
                          }
                        >
                          {node?.label ?? memberId}
                        </span>
                      );
                    })}
                    {community.members.length > 6 && (
                      <span className="inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
                        +{community.members.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── Connected Components ───────────────────────────────────── */}
        <Section title="Components" defaultOpen={false}>
          <div className="space-y-2">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-neutral-800 bg-neutral-800/40 p-2">
                <p className="text-[10px] text-neutral-500">Components</p>
                <p className="text-sm font-semibold text-neutral-100">{componentCount}</p>
              </div>
              <div className="rounded border border-neutral-800 bg-neutral-800/40 p-2">
                <p className="text-[10px] text-neutral-500">Main Size</p>
                <p className="text-sm font-semibold text-neutral-100">
                  {mainComponent?.size ?? 0}
                </p>
              </div>
            </div>

            {/* Fully connected indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  analytics.isFullyConnected ? "bg-green-400" : "bg-amber-400"
                }`}
              />
              <span className="text-xs text-neutral-300">
                {analytics.isFullyConnected
                  ? "Fully connected"
                  : `${componentCount} separate components`}
              </span>
            </div>
          </div>
        </Section>

        {/* ─── Network Stats ──────────────────────────────────────────── */}
        <Section title="Network Stats" defaultOpen={true}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Density</span>
              <span className="font-mono text-xs text-neutral-200">
                {analytics.networkDensity.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Avg. Clustering</span>
              <span className="font-mono text-xs text-neutral-200">
                {analytics.averageClusteringCoefficient.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Diameter</span>
              <span className="font-mono text-xs text-neutral-200">
                {analytics.diameter === Infinity ? "∞" : analytics.diameter}
              </span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
