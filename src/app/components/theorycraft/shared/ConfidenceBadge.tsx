/**
 * Phase 4B — Shared ConfidenceBadge
 *
 * Provenance pill that renders a Lucide icon + text label based on
 * CONFIDENCE_DISPLAY configuration. On hover/focus, expands to show
 * full source detail text when provided.
 *
 * Validates: Requirements 11.2, 11.3, 11.10
 */

import React from "react";
import { CheckCircle, Eye, AlertTriangle, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/ohmm/theorycraft/types";
import { CONFIDENCE_DISPLAY } from "@/lib/ohmm/theorycraft/constants";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const CONFIDENCE_ICON_MAP: Record<string, LucideIcon> = {
  "check-circle": CheckCircle,
  eye: Eye,
  "alert-triangle": AlertTriangle,
  "help-circle": HelpCircle,
};

// ─── Default Detail Text ─────────────────────────────────────────────────────

/**
 * Default source detail text per confidence level, shown on hover expansion.
 */
const DEFAULT_SOURCE_DETAIL: Record<ConfidenceLevel, string> = {
  project_verified: "confirmed via game data extraction",
  observed: "seen in-game, not yet fully confirmed",
  estimated: "derived from community reports",
  placeholder: "temporary value pending verification",
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  /** Optional detail text shown on hover. Falls back to a default per confidence level. */
  sourceDetail?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ConfidenceBadge — provenance pill with icon + text label.
 *
 * - Renders as an inline-flex pill with subtle border
 * - Displays icon matching the confidence level
 * - Displays text label from CONFIDENCE_DISPLAY
 * - On hover/focus, expands to reveal sourceDetail text
 * - Communicates provenance via icon AND text (not color alone)
 * - Respects prefers-reduced-motion for transitions
 */
export function ConfidenceBadge({ confidence, sourceDetail }: ConfidenceBadgeProps) {
  const display = CONFIDENCE_DISPLAY[confidence];
  const IconComponent = CONFIDENCE_ICON_MAP[display.icon] ?? HelpCircle;
  const detail = sourceDetail ?? DEFAULT_SOURCE_DETAIL[confidence];
  const isExpandable = Boolean(detail);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-gray-400${isExpandable ? " tc-badge-expandable" : ""}`}
      aria-label={`Confidence: ${display.label}${detail ? ` — ${detail}` : ""}`}
      tabIndex={isExpandable ? 0 : undefined}
    >
      <IconComponent size={10} aria-hidden="true" className="shrink-0" />
      {display.label}
      {isExpandable && (
        <span className="tc-badge-detail" aria-hidden="true">
          {" — "}
          {detail}
        </span>
      )}
    </span>
  );
}

export default ConfidenceBadge;
