/**
 * Phase 4B — Shared MetricCard Atom
 *
 * Reusable metric display card used across theorycraft panels.
 * Renders a Lucide icon, label, value, and optional confidence badge.
 * Matches the styling established in HeroMetricsBar.
 *
 * Validates: Requirements 10.2, 11.2
 */

import React from "react";
import {
  Zap,
  Crosshair,
  Timer,
  Flame,
  Target,
  Swords,
  Shield,
  TrendingUp,
  Scale,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/ohmm/theorycraft/types";
import { ConfidenceBadge } from "./ConfidenceBadge";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  crosshair: Crosshair,
  timer: Timer,
  flame: Flame,
  target: Target,
  swords: Swords,
  shield: Shield,
  "trending-up": TrendingUp,
  scale: Scale,
  "shield-check": ShieldCheck,
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MetricCardProps {
  label: string;
  value: string;
  /** Lucide icon name (lowercase-kebab) */
  icon: string;
  /** Plain-language tooltip text */
  tooltip?: string;
  /** Optional confidence level to display as badge */
  confidence?: ConfidenceLevel;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MetricCard — reusable metric display atom.
 *
 * - Icon + label + value in a compact card
 * - Optional confidence badge rendered inline
 * - Matches HeroMetricsBar MetricCard styling
 * - Focusable for keyboard navigation / screen reader access
 */
export function MetricCard({ label, value, icon, tooltip, confidence }: MetricCardProps) {
  const IconComponent = ICON_MAP[icon] ?? Zap;

  return (
    <div
      className="tc-card tc-interactive flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 min-w-0"
      role="group"
      aria-label={`${label}: ${value}`}
      title={tooltip}
      tabIndex={0}
    >
      <IconComponent
        size={18}
        className="shrink-0 text-cyan-400/80"
        aria-hidden="true"
      />
      <div className="min-w-0 flex flex-col">
        <span className="text-[11px] text-gray-400 leading-tight truncate">
          {label}
        </span>
        <span className="text-base font-semibold text-gray-100 leading-tight truncate tc-glow-value">
          {value}
        </span>
      </div>
      {confidence && <ConfidenceBadge confidence={confidence} />}
    </div>
  );
}

export default MetricCard;
