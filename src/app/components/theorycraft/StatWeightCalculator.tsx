/**
 * Phase 4B — Stat Weight Calculator
 *
 * Presentational React component that displays ranked stat weight results.
 * Receives StatWeightViewModel as prop — no engine imports.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import type { StatWeightViewModel, StatWeightEntry } from "@/lib/ohmm/theorycraft/types";
import { CONFIDENCE_DISPLAY } from "@/lib/ohmm/theorycraft/constants";
import { EmptyState } from "./shared/EmptyState";
import { AnimatedNumber } from "./shared/AnimatedNumber";

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function formatAbsoluteGain(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return `+${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
  if (value >= 1) return `+${value.toFixed(1)}`;
  return `+${value.toFixed(3)}`;
}

function formatRelativeGain(value: number): string {
  if (value === 0) return "0%";
  if (value < 0.01) return `+${value.toFixed(4)}%`;
  return `+${value.toFixed(2)}%`;
}

// ─── Stat Weight Entry Row ───────────────────────────────────────────────────

interface StatWeightRowProps {
  entry: StatWeightEntry;
}

function StatWeightRow({ entry }: StatWeightRowProps) {
  const { rank, label, absoluteGain, relativeGainPercent, barWidth } = entry;

  const isZero = absoluteGain === 0;

  return (
    <li
      className="flex items-center gap-3 py-2"
      aria-label={`Rank ${rank}: ${label}, DPS gain ${absoluteGain === 0 ? "0" : formatAbsoluteGain(absoluteGain)}, relative ${formatRelativeGain(relativeGainPercent)}`}
    >
      {/* Rank number */}
      <span
        className={`shrink-0 w-6 text-center text-xs font-bold ${
          isZero ? "text-gray-600" : "text-cyan-400/80"
        }`}
        aria-hidden="true"
      >
        #{rank}
      </span>

      {/* Stat label & values */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span
            className={`text-sm font-medium truncate ${
              isZero ? "text-gray-500" : "text-gray-100"
            }`}
          >
            {label}
          </span>
          <div className="flex items-baseline gap-2 shrink-0">
            <span
              className={`text-sm font-semibold tabular-nums ${
                isZero ? "text-gray-600" : "text-gray-200"
              }`}
            >
              {isZero ? "0" : (
                <AnimatedNumber
                  value={absoluteGain}
                  decimals={absoluteGain >= 1 ? 1 : 3}
                  prefix="+"
                  className={`text-sm font-semibold tabular-nums ${
                    isZero ? "text-gray-600" : "text-gray-200"
                  }`}
                />
              )}
            </span>
            <span
              className={`text-[11px] tabular-nums ${
                isZero ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {formatRelativeGain(relativeGainPercent)}
            </span>
          </div>
        </div>

        {/* Visual bar indicator — bar length communicates ranking */}
        <div
          className="h-1.5 w-full rounded-full bg-gray-700/50 overflow-hidden"
          role="meter"
          aria-label={`${label} relative contribution`}
          aria-valuenow={Math.round(barWidth * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isZero ? "bg-gray-600/30" : "bg-cyan-500/70"
            }`}
            style={{ width: `${Math.max(barWidth * 100, 0)}%` }}
          />
        </div>
      </div>
    </li>
  );
}

// ─── StatWeightCalculator ────────────────────────────────────────────────────

export interface StatWeightCalculatorProps {
  viewModel: StatWeightViewModel;
}

/**
 * Stat Weight Calculator — displays ranked stat weight results.
 *
 * - Shows ranked list: stat name, absolute DPS gain, relative gain %, visual bar
 * - Bar length communicates ranking (not color alone)
 * - Displays "0" gain for zero-delta stats, ranked below positives
 * - Displays error message when isComputable is false
 * - Shows disclaimer label at bottom
 * - Receives view model as prop — no engine imports
 */
export function StatWeightCalculator({ viewModel }: StatWeightCalculatorProps) {
  const { entries, isComputable, errorMessage, disclaimer } = viewModel;

  // Error state: display empty state guidance when isComputable is false
  if (!isComputable) {
    return (
      <section
        aria-label="Stat Weight Calculator"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp
            size={18}
            className="text-cyan-400/80"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-200">
            Stat Weights
          </h2>
        </div>
        <EmptyState
          message={errorMessage ?? "Equip a weapon to compute stat weights."}
          icon="trending-up"
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Stat Weight Calculator"
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp
          size={18}
          className="text-cyan-400/80"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-gray-200">
          Stat Weights
        </h2>
      </div>

      {/* Ranked entry list */}
      <ol className="space-y-0" aria-label="Stat weight rankings">
        {entries.map((entry) => (
          <StatWeightRow key={entry.stat} entry={entry} />
        ))}
      </ol>

      {/* Disclaimer with confidence provenance indicator */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-gray-400"
          aria-label={`Confidence: ${CONFIDENCE_DISPLAY.estimated.label}`}
        >
          <AlertTriangle size={10} aria-hidden="true" className="shrink-0" />
          {CONFIDENCE_DISPLAY.estimated.label}
        </span>
        <p className="text-[11px] text-gray-500 leading-tight">
          {disclaimer}
        </p>
      </div>
    </section>
  );
}

export default StatWeightCalculator;
