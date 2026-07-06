/**
 * Phase 4B — Hero Metrics Bar
 *
 * Presentational React component that renders a horizontal strip of key combat metrics.
 * Receives HeroMetricsViewModel as prop — no engine imports.
 *
 * Validates: Requirements 1.1, 1.5, 1.6, 1.7, 1.8, 1.11, 2.1, 2.4
 */

import React, { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Zap,
  Crosshair,
  Timer,
  Flame,
  Target,
  Swords,
  Shield,
  Crown,
  CheckCircle,
  Eye,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HeroMetricsViewModel, MetricCardData, ConfidenceLevel } from "@/lib/ohmm/theorycraft/types";
import { CONFIDENCE_DISPLAY, EMPTY_STATE_MESSAGES } from "@/lib/ohmm/theorycraft/constants";
import { EmptyState } from "./shared/EmptyState";
import { AnimatedNumber } from "./shared/AnimatedNumber";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  crosshair: Crosshair,
  timer: Timer,
  flame: Flame,
  target: Target,
  swords: Swords,
  shield: Shield,
};

const CONFIDENCE_ICON_MAP: Record<string, LucideIcon> = {
  "check-circle": CheckCircle,
  eye: Eye,
  "alert-triangle": AlertTriangle,
  "help-circle": HelpCircle,
};

// ─── Per-Metric Confidence Badge (inline provenance for estimated/placeholder) ──

interface MetricConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

function MetricConfidenceBadge({ confidence }: MetricConfidenceBadgeProps) {
  const display = CONFIDENCE_DISPLAY[confidence];
  const IconComponent = CONFIDENCE_ICON_MAP[display.icon] ?? HelpCircle;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full border border-white/5 bg-white/[0.03] px-1 py-0.5 text-[9px] text-gray-400 shrink-0"
      aria-label={`Confidence: ${display.label}`}
    >
      <IconComponent size={9} aria-hidden="true" className="shrink-0" />
      {display.label}
    </span>
  );
}

// ─── Biggest Contributor Badge ───────────────────────────────────────────────

function BiggestContributorBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 shrink-0"
      aria-label="Biggest gain from loadout change"
    >
      <Crown size={9} aria-hidden="true" className="shrink-0" />
      Biggest gain
    </span>
  );
}

// ─── MetricCard Atom ─────────────────────────────────────────────────────────

interface MetricCardProps {
  metric: MetricCardData;
  isBiggestContributor?: boolean;
}

function isMetricImprovement(id: string, oldValue: number, newValue: number): boolean {
  if (id === "ttk") {
    // Outgoing Time to Kill: lower is better
    return newValue < oldValue;
  }
  return newValue > oldValue;
}

function MetricCard({ metric, isBiggestContributor = false }: MetricCardProps) {
  const IconComponent = ICON_MAP[metric.icon] ?? Zap;
  const showProvenance = metric.confidence === "estimated" || metric.confidence === "placeholder";
  const prefersReduced = useReducedMotion();

  const [showTooltip, setShowTooltip] = useState(false);
  const prevValueRef = useRef<number | null>(null);
  const [changeType, setChangeType] = useState<"improvement" | "regression" | null>(null);

  useEffect(() => {
    if (prevValueRef.current !== null && prevValueRef.current !== metric.numericValue) {
      const isImproved = isMetricImprovement(metric.id, prevValueRef.current, metric.numericValue);
      setChangeType(isImproved ? "improvement" : "regression");
    }
    prevValueRef.current = metric.numericValue;
  }, [metric.numericValue, metric.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowTooltip(false);
    }
  };

  const shouldAnimate = !prefersReduced && changeType !== null;
  const animateProps = shouldAnimate
    ? changeType === "improvement"
      ? { scale: [1, 1.02, 1] }
      : { opacity: [1, 0.7, 1] }
    : {};

  return (
    <div
      className="tc-interactive flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 min-w-0 relative"
      role="group"
      aria-label={`${metric.label}: ${metric.value}${isBiggestContributor ? " (biggest gain)" : ""}`}
      tabIndex={0}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onKeyDown={handleKeyDown}
    >
      <IconComponent
        size={18}
        className="shrink-0 text-cyan-400/80"
        aria-hidden="true"
      />
      <motion.div
        key={`${metric.id}-${metric.numericValue}`}
        animate={animateProps}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-w-0 flex flex-col flex-1"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 leading-tight truncate">
            {metric.label}
          </span>
          {isBiggestContributor && <BiggestContributorBadge />}
        </div>
        <div className="flex items-center gap-1.5">
          {metric.value !== "—" && metric.numericValue !== 0 && !isNaN(metric.numericValue) ? (
            <AnimatedNumber
              value={metric.numericValue}
              decimals={metric.numericValue >= 100 ? 0 : metric.numericValue >= 1 ? 1 : 2}
              className="text-base font-semibold text-gray-100 leading-tight truncate tc-glow-value"
            />
          ) : (
            <span className="text-base font-semibold text-gray-100 leading-tight truncate tc-glow-value">
              {metric.value}
            </span>
          )}
          {showProvenance && <MetricConfidenceBadge confidence={metric.confidence} />}
        </div>
      </motion.div>

      {showTooltip && metric.tooltip && (
        <div
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 rounded bg-gray-900 border border-white/10 text-[10px] text-gray-300 shadow-xl pointer-events-none text-center"
          role="tooltip"
        >
          {metric.tooltip}
        </div>
      )}
    </div>
  );
}

// ─── Build Completeness Indicator ────────────────────────────────────────────

interface BuildCompletenessProps {
  completeness: number;
}

function BuildCompletenessIndicator({ completeness }: BuildCompletenessProps) {
  const percent = Math.round(completeness * 100);

  return (
    <div
      className="tc-interactive flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 min-w-0"
      role="group"
      aria-label={`Build completeness: ${percent}%`}
      tabIndex={0}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[11px] text-gray-400 leading-tight">
          Build
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 w-16 rounded-full bg-gray-700 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-cyan-500/70 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-300">
            {percent}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Confidence Badge ────────────────────────────────────────────────────────

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const display = CONFIDENCE_DISPLAY[confidence];
  const IconComponent = CONFIDENCE_ICON_MAP[display.icon] ?? HelpCircle;

  return (
    <div
      className="tc-interactive flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 min-w-0"
      role="group"
      aria-label={`Data confidence: ${display.label}`}
      tabIndex={0}
    >
      <IconComponent
        size={14}
        className="shrink-0 text-gray-400"
        aria-hidden="true"
      />
      <span className="text-[11px] text-gray-400 leading-tight whitespace-nowrap">
        {display.label}
      </span>
    </div>
  );
}

// ─── useBiggestContributor Hook ──────────────────────────────────────────────

/**
 * Identifies the metric with the largest positive delta compared to
 * the previous render's numeric values. Returns the metric ID or null.
 */
function useBiggestContributor(metrics: MetricCardData[]): string | null {
  const prevValuesRef = useRef<Map<string, number> | null>(null);

  // Compute the biggest contributor by comparing current vs previous
  let biggestId: string | null = null;
  let biggestDelta = 0;

  if (prevValuesRef.current !== null) {
    for (const metric of metrics) {
      const prevValue = prevValuesRef.current.get(metric.id);
      if (prevValue !== undefined) {
        const delta = metric.numericValue - prevValue;
        if (delta > 0 && delta > biggestDelta) {
          biggestDelta = delta;
          biggestId = metric.id;
        }
      }
    }
  }

  // Update ref with current values for next render comparison
  // Use a layout-compatible approach: update after computing the result
  const currentValues = new Map<string, number>();
  for (const metric of metrics) {
    currentValues.set(metric.id, metric.numericValue);
  }
  prevValuesRef.current = currentValues;

  return biggestId;
}

// ─── HeroMetricsBar ──────────────────────────────────────────────────────────

export interface HeroMetricsBarProps {
  viewModel: HeroMetricsViewModel;
}

/**
 * Hero Metrics Bar — renders a horizontal strip of key combat metrics.
 *
 * - Displays MetricCard atoms for each metric in the view model
 * - Shows build completeness as a progress bar
 * - Shows confidence badge with icon + text
 * - Communicates meaning via text labels and icons (not color alone)
 * - Displays "—" for missing values (already handled in the view model)
 * - Shows "biggest contributor" badge on metric with largest positive delta on loadout change
 * - Responsive: wraps to grid on narrow viewports
 */
export function HeroMetricsBar({ viewModel }: HeroMetricsBarProps) {
  const { metrics, buildCompleteness, confidenceScore } = viewModel;

  // Track biggest contributor across loadout changes (Requirement 1.11)
  const biggestContributorId = useBiggestContributor(metrics);

  // Show empty state when all metrics are placeholder values ("—")
  const allEmpty = metrics.every((m) => m.value === "—");

  if (allEmpty) {
    return (
      <section
        aria-label="Hero Metrics Bar"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-2"
      >
        <EmptyState message={EMPTY_STATE_MESSAGES.heroMetrics} icon="trending-up" />
      </section>
    );
  }

  return (
    <section
      aria-label="Hero Metrics Bar"
      className="grid grid-cols-3 gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02] md:flex md:flex-wrap md:items-center md:gap-2"
    >
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          isBiggestContributor={metric.id === biggestContributorId}
        />
      ))}
      <BuildCompletenessIndicator completeness={buildCompleteness} />
      <ConfidenceBadge confidence={confidenceScore} />
    </section>
  );
}

export default HeroMetricsBar;
