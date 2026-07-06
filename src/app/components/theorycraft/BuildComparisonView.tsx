/**
 * Phase 4B — Build Comparison Delta View
 *
 * Presentational React component that displays a side-by-side comparison
 * between the current build and a saved build, showing metric deltas and
 * slot-by-slot diffs.
 * Receives BuildComparisonViewModel as prop — no engine imports.
 *
 * Validates: Requirements 8.1–8.9, 9.1, 9.2, 9.3, 9.4, 9.5, 13.7
 */

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowDown, Minus, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  BuildComparisonViewModel,
  MetricDelta,
  SlotDiff,
  DeltaDirection,
} from "@/lib/ohmm/theorycraft/types";
import { EmptyState } from "./shared/EmptyState";
import { AnimatedNumber } from "./shared/AnimatedNumber";

/**
 * Maximum expected delta magnitude for scaling purposes.
 * DPS deltas typically range 0–10000; using 5000 as the threshold
 * at which the arrow reaches maximum 2x scale.
 */
const MAX_EXPECTED_DELTA = 5000;

/**
 * Parse a formatted delta string (e.g., "+1,234", "-567", "0") into a numeric value.
 * Strips +/- prefix, commas, and percent signs.
 */
function parseDeltaNumeric(delta: string): number {
  const cleaned = delta.replace(/[+,% ]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Compute the scale factor for a delta arrow based on the delta magnitude.
 * Returns a value in [1.0, 2.0]:
 *   - 0 delta → scale 1.0 (no enlargement)
 *   - MAX_EXPECTED_DELTA or above → scale 2.0 (capped)
 */
function computeArrowScale(delta: string): number {
  const magnitude = parseDeltaNumeric(delta);
  return Math.min(1 + magnitude / MAX_EXPECTED_DELTA, 2);
}

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const DIRECTION_ICON_MAP: Record<MetricDelta["icon"], LucideIcon> = {
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  minus: Minus,
};

// ─── Direction Label ─────────────────────────────────────────────────────────

const DIRECTION_LABEL: Record<DeltaDirection, string> = {
  gain: "gain",
  loss: "loss",
  unchanged: "unchanged",
};

// ─── Metric Delta Row ────────────────────────────────────────────────────────

interface MetricDeltaRowProps {
  metric: MetricDelta;
  prefersReducedMotion: boolean | null;
}

function MetricDeltaRow({ metric, prefersReducedMotion }: MetricDeltaRowProps) {
  const IconComponent = DIRECTION_ICON_MAP[metric.icon] ?? Minus;
  const arrowScale = computeArrowScale(metric.delta);

  const directionStyles: Record<DeltaDirection, string> = {
    gain: "text-emerald-400",
    loss: "text-red-400",
    unchanged: "text-gray-400",
  };

  const iconStyles: Record<DeltaDirection, string> = {
    gain: "text-emerald-400",
    loss: "text-red-400",
    unchanged: "text-gray-500",
  };

  // When reduced motion is preferred or direction is unchanged, use static scale 1
  const shouldAnimate = !prefersReducedMotion && metric.direction !== "unchanged";
  const effectiveScale = shouldAnimate ? arrowScale : 1;

  return (
    <div
      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
      role="row"
      aria-label={`${metric.label}: ${metric.delta} (${DIRECTION_LABEL[metric.direction]})`}
    >
      {/* Metric label */}
      <span className="text-xs font-medium text-gray-300 min-w-0 truncate">
        {metric.label}
      </span>

      {/* Values: current vs saved */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{metric.currentValue}</span>
        <span className="text-[10px] text-gray-600">vs</span>
        <span className="text-xs text-gray-400">{metric.savedValue}</span>
      </div>

      {/* Delta with animated icon + text label */}
      <div className="flex items-center gap-1.5">
        <motion.div
          animate={{ scale: effectiveScale }}
          transition={
            shouldAnimate
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
          className="flex items-center justify-center shrink-0"
        >
          <IconComponent
            size={14}
            className={iconStyles[metric.direction]}
            aria-hidden="true"
          />
        </motion.div>
        <span className={`text-xs font-semibold ${directionStyles[metric.direction]}`}>
          {(() => {
            const numericDelta = parseDeltaNumeric(metric.delta);
            if (numericDelta > 0 && metric.direction !== "unchanged") {
              const prefix = metric.direction === "loss" ? "-" : "+";
              const suffix = metric.delta.includes("%") ? "%" : "";
              return (
                <AnimatedNumber
                  value={numericDelta}
                  decimals={numericDelta >= 10 ? 0 : numericDelta >= 1 ? 1 : 2}
                  prefix={prefix}
                  suffix={suffix}
                  className={`text-xs font-semibold ${directionStyles[metric.direction]}`}
                />
              );
            }
            return metric.delta;
          })()}
        </span>
        <span className="text-[10px] text-gray-500">
          ({DIRECTION_LABEL[metric.direction]})
        </span>
      </div>
    </div>
  );
}

// ─── Slot Diff Row ───────────────────────────────────────────────────────────

interface SlotDiffRowProps {
  diff: SlotDiff;
}

function SlotDiffRow({ diff }: SlotDiffRowProps) {
  const rowClasses = diff.hasChanged
    ? "border-amber-500/20 bg-amber-900/10"
    : "border-white/5 bg-white/[0.02]";

  const changeIndicator = diff.hasChanged
    ? "Changed"
    : "Same";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-1.5 ${rowClasses}`}
      role="row"
      aria-label={`${diff.slot}: ${diff.hasChanged ? "changed" : "unchanged"}`}
    >
      {/* Slot name */}
      <span className="text-[11px] font-medium text-gray-400 capitalize w-16 shrink-0">
        {diff.slot}
      </span>

      {/* Current item (left column) */}
      <span className="text-xs text-gray-200 min-w-0 truncate flex-1 text-left">
        {diff.currentItem}
      </span>

      {/* Changed indicator */}
      <span
        className={`text-[10px] font-medium px-1.5 shrink-0 ${
          diff.hasChanged ? "text-amber-400" : "text-gray-600"
        }`}
        aria-label={changeIndicator}
      >
        {diff.hasChanged ? "≠" : "="}
        <span className="sr-only">{changeIndicator}</span>
      </span>

      {/* Saved item (right column) */}
      <span className="text-xs text-gray-200 min-w-0 truncate flex-1 text-right">
        {diff.savedItem}
      </span>
    </div>
  );
}

// ─── BuildComparisonView ─────────────────────────────────────────────────────

export interface BuildComparisonViewProps {
  viewModel: BuildComparisonViewModel;
}

/**
 * Build Comparison Delta View — displays side-by-side comparison of current vs saved build.
 *
 * - Error state: displays errorMessage when isAvailable is false and errorMessage exists
 * - Empty state: displays emptyStateMessage when isAvailable is false and emptyStateMessage exists
 * - When available: side-by-side layout with build names as column headers
 * - Metric deltas: shows DPS, Expected Damage, TTK deltas with direction arrows + text labels
 * - Slot diffs: lists each slot with current vs saved item, highlights changed slots
 * - Communicates direction via iconography + text (not color alone)
 * - Receives view model as prop — no engine imports
 */
export function BuildComparisonView({ viewModel }: BuildComparisonViewProps) {
  const prefersReducedMotion = useReducedMotion();

  const {
    isAvailable,
    errorMessage,
    emptyStateMessage,
    currentBuildName,
    savedBuildName,
    metricDeltas,
    slotDiffs,
  } = viewModel;

  // ─── Error State ─────────────────────────────────────────────────────────

  if (!isAvailable && errorMessage) {
    return (
      <section
        aria-label="Build Comparison"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale
            size={18}
            className="text-cyan-400/80"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-200">
            Build Comparison
          </h2>
        </div>
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      </section>
    );
  }

  // ─── Empty State ─────────────────────────────────────────────────────────

  if (!isAvailable && emptyStateMessage) {
    return (
      <section
        aria-label="Build Comparison"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale
            size={18}
            className="text-cyan-400/80"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-200">
            Build Comparison
          </h2>
        </div>
        <EmptyState message={emptyStateMessage} icon="scale" />
      </section>
    );
  }

  // ─── Unavailable fallback (neither error nor empty message) ──────────────

  if (!isAvailable) {
    return (
      <section
        aria-label="Build Comparison"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale
            size={18}
            className="text-cyan-400/80"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-200">
            Build Comparison
          </h2>
        </div>
        <EmptyState message="Comparison unavailable." icon="scale" />
      </section>
    );
  }

  // ─── Available State — full comparison ───────────────────────────────────

  return (
    <section
      aria-label="Build Comparison"
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Scale
          size={18}
          className="text-cyan-400/80"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-gray-200">
          Build Comparison
        </h2>
      </div>

      {/* Column Headers — build names */}
      <div className="flex items-center justify-between mb-3 px-3">
        <span className="text-xs font-semibold text-cyan-300 truncate max-w-[45%]">
          {currentBuildName}
        </span>
        <span className="text-[10px] text-gray-600">vs</span>
        <span className="text-xs font-semibold text-purple-300 truncate max-w-[45%]">
          {savedBuildName}
        </span>
      </div>

      {viewModel.netVerdict && (
        <div className="mb-4 rounded border border-purple-500/10 bg-purple-950/20 p-2 text-[11px] text-purple-300/95 leading-normal flex items-start gap-1.5">
          <span className="font-semibold shrink-0 text-purple-400">Net Verdict:</span>
          <span>{viewModel.netVerdict}</span>
        </div>
      )}

      {/* Metric Deltas */}
      {metricDeltas.length > 0 && (
        <div className="space-y-1.5 mb-4" role="table" aria-label="Metric deltas">
          {metricDeltas.map((metric) => (
            <MetricDeltaRow
              key={metric.label}
              metric={metric}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      )}

      {/* Slot-by-Slot Diff */}
      {slotDiffs.length > 0 && (
        <div role="table" aria-label="Slot differences">
          {/* Diff column headers */}
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10px] text-gray-500 w-16 shrink-0">
              Slot
            </span>
            <span className="text-[10px] text-gray-500 flex-1 text-left">
              Current
            </span>
            <span className="text-[10px] text-gray-500 px-1.5 shrink-0">
              Δ
            </span>
            <span className="text-[10px] text-gray-500 flex-1 text-right">
              Saved
            </span>
          </div>
          <div className="space-y-1" role="rowgroup">
            {slotDiffs.map((diff) => (
              <SlotDiffRow key={diff.slot} diff={diff} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default BuildComparisonView;
