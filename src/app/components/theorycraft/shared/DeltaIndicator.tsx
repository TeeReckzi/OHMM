/**
 * Phase 4B — Shared DeltaIndicator
 *
 * Renders an up/down/unchanged arrow icon with a direction text label
 * and formatted delta value. Matches the styling from BuildComparisonView's
 * MetricDeltaRow.
 *
 * Validates: Requirements 11.3
 */

import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeltaDirection } from "@/lib/ohmm/theorycraft/types";

// ─── Direction Mapping ───────────────────────────────────────────────────────

const DIRECTION_ICON: Record<DeltaDirection, LucideIcon> = {
  gain: ArrowUp,
  loss: ArrowDown,
  unchanged: Minus,
};

const DIRECTION_LABEL: Record<DeltaDirection, string> = {
  gain: "gain",
  loss: "loss",
  unchanged: "unchanged",
};

const DIRECTION_STYLES: Record<DeltaDirection, string> = {
  gain: "text-emerald-400",
  loss: "text-red-400",
  unchanged: "text-gray-400",
};

const ICON_STYLES: Record<DeltaDirection, string> = {
  gain: "text-emerald-400",
  loss: "text-red-400",
  unchanged: "text-gray-500",
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DeltaIndicatorProps {
  direction: DeltaDirection;
  /** Formatted delta string, e.g. "+1,234" or "-567" */
  delta: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * DeltaIndicator — renders direction arrow + text label + delta value.
 *
 * - Uses ArrowUp/ArrowDown/Minus icon based on direction
 * - Text label communicates direction alongside icon (not color alone)
 * - Matches BuildComparisonView MetricDeltaRow styling
 */
export function DeltaIndicator({ direction, delta }: DeltaIndicatorProps) {
  const IconComponent = DIRECTION_ICON[direction];

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${delta} (${DIRECTION_LABEL[direction]})`}
    >
      <IconComponent
        size={14}
        className={`shrink-0 ${ICON_STYLES[direction]}`}
        aria-hidden="true"
      />
      <span className={`text-xs font-semibold ${DIRECTION_STYLES[direction]}`}>
        {delta}
      </span>
      <span className="text-[10px] text-gray-500">
        ({DIRECTION_LABEL[direction]})
      </span>
    </div>
  );
}

export default DeltaIndicator;
