/**
 * Phase 4B — Set Bonus Tracker
 *
 * Presentational React component that displays armor set membership,
 * active bonus thresholds, and progress toward next unlock.
 * Receives SetBonusTrackerViewModel as prop — no engine imports.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8
 */

import React from "react";
import {
  CheckCircle,
  Circle,
  Eye,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  SetBonusTrackerViewModel,
  SetBonusEntry,
  SetThreshold,
  ConfidenceLevel,
} from "@/lib/ohmm/theorycraft/types";
import { CONFIDENCE_DISPLAY } from "@/lib/ohmm/theorycraft/constants";
import { EmptyState } from "./shared/EmptyState";
import { ProgressRing } from "./shared/ProgressRing";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const CONFIDENCE_ICON_MAP: Record<string, LucideIcon> = {
  "check-circle": CheckCircle,
  eye: Eye,
  "alert-triangle": AlertTriangle,
  "help-circle": HelpCircle,
};

// ─── Confidence Badge ────────────────────────────────────────────────────────

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const display = CONFIDENCE_DISPLAY[confidence];
  const IconComponent = CONFIDENCE_ICON_MAP[display.icon] ?? HelpCircle;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-gray-400"
      aria-label={`Confidence: ${display.label}`}
    >
      <IconComponent size={10} aria-hidden="true" className="shrink-0" />
      {display.label}
    </span>
  );
}

// ─── Threshold Item ──────────────────────────────────────────────────────────

interface ThresholdItemProps {
  threshold: SetThreshold;
}

function ThresholdItem({ threshold }: ThresholdItemProps) {
  const { requiredPieces, bonusText, isActive, confidence } = threshold;

  return (
    <li className="flex items-start gap-2 py-1">
      {isActive ? (
        <CheckCircle
          size={16}
          className="shrink-0 mt-0.5 text-emerald-400"
          aria-hidden="true"
        />
      ) : (
        <Circle
          size={16}
          className="shrink-0 mt-0.5 text-gray-500"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isActive ? "text-emerald-300" : "text-gray-400"
            }`}
          >
            {requiredPieces}-piece
          </span>
          <span
            className={`text-[11px] font-medium ${
              isActive ? "text-emerald-400" : "text-gray-500"
            }`}
            aria-label={isActive ? "Active" : "Inactive"}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
          <ConfidenceBadge confidence={confidence} />
        </div>
        <span className="text-xs text-gray-300 leading-snug">
          {bonusText}
        </span>
      </div>
    </li>
  );
}

// ─── Set Entry Card ──────────────────────────────────────────────────────────

interface SetEntryCardProps {
  entry: SetBonusEntry;
}

function SetEntryCard({ entry }: SetEntryCardProps) {
  const {
    setName,
    equippedCount,
    totalSlots,
    occupiedSlots,
    unoccupiedSlots,
    thresholds,
    nextThreshold,
    piecesNeeded,
  } = entry;

  // Progress toward next threshold: equippedCount / nextThreshold, or 1.0 if maxed
  const ringProgress =
    nextThreshold !== null ? equippedCount / nextThreshold : 1.0;

  // Use nextThreshold as segment count for segmented display (e.g. 4 for 4-piece)
  const ringSegments = nextThreshold ?? undefined;

  return (
    <div
      className="rounded-lg border border-white/5 bg-white/[0.03] p-3"
      role="group"
      aria-label={`${setName}: ${equippedCount} of ${totalSlots} pieces equipped`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ProgressRing
            progress={ringProgress}
            segments={ringSegments}
            size={28}
            strokeWidth={3}
          />
          <ShieldCheck
            size={16}
            className="shrink-0 text-cyan-400/80"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-gray-100">{setName}</h3>
        </div>
        <span className="text-xs font-medium text-gray-400">
          {equippedCount}/{totalSlots}
        </span>
      </div>

      {/* Slots */}
      <div className="mb-2 flex flex-wrap gap-1">
        {occupiedSlots.map((slot) => (
          <span
            key={slot}
            className="rounded bg-cyan-900/30 border border-cyan-700/30 px-1.5 py-0.5 text-[10px] text-cyan-300"
          >
            {slot}
          </span>
        ))}
        {unoccupiedSlots.map((slot) => (
          <span
            key={slot}
            className="rounded bg-gray-800/50 border border-gray-700/30 px-1.5 py-0.5 text-[10px] text-gray-500"
          >
            {slot}
          </span>
        ))}
      </div>

      {/* Thresholds */}
      <ul className="space-y-0.5" aria-label={`${setName} thresholds`}>
        {thresholds.map((threshold) => (
          <ThresholdItem
            key={`${setName}-${threshold.requiredPieces}`}
            threshold={threshold}
          />
        ))}
      </ul>

      {/* Pieces needed for next threshold */}
      {piecesNeeded !== null && piecesNeeded > 0 && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[11px] text-amber-400/80 leading-tight">
            {piecesNeeded} more {piecesNeeded === 1 ? "piece" : "pieces"} needed for next bonus
          </p>
          {entry.worthItEstimate && (
            <span className="shrink-0 rounded bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
              Worth it? {entry.worthItEstimate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SetBonusTracker ─────────────────────────────────────────────────────────

export interface SetBonusTrackerProps {
  viewModel: SetBonusTrackerViewModel;
}

/**
 * Set Bonus Tracker — displays armor set progress and threshold status.
 *
 * - Shows empty state message when no armor is equipped
 * - Groups sets with piece count, occupied/unoccupied slots
 * - Distinguishes active/inactive thresholds via icon + text label (not color alone)
 * - Displays pieces needed for next threshold
 * - Shows confidence badges on each threshold
 * - Receives view model as prop — no engine imports
 */
export function SetBonusTracker({ viewModel }: SetBonusTrackerProps) {
  const { sets, isEmpty, emptyStateMessage } = viewModel;

  if (isEmpty) {
    return (
      <section
        aria-label="Set Bonus Tracker"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck
            size={18}
            className="text-cyan-400/80"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-200">
            Set Bonuses
          </h2>
        </div>
        <EmptyState message={emptyStateMessage} icon="shield" />
      </section>
    );
  }

  return (
    <section
      aria-label="Set Bonus Tracker"
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck
          size={18}
          className="text-cyan-400/80"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-gray-200">Set Bonuses</h2>
      </div>
      <div className="space-y-3">
        {sets.map((entry) => (
          <SetEntryCard key={entry.setName} entry={entry} />
        ))}
      </div>
    </section>
  );
}

export default SetBonusTracker;
