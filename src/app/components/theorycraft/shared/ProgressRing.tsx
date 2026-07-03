/**
 * Phase 4B — Progress Ring Component
 *
 * SVG-based circular/segmented progress indicator showing fractional
 * progress toward the next set bonus threshold.
 *
 * - Smooth arc transition (300ms ease-out) on progress change via Framer Motion
 * - Respects `prefers-reduced-motion` (instant update when set)
 * - Background track (gray) + foreground fill (cyan)
 * - Optional segmented display for multi-piece thresholds
 *
 * Validates: Requirements 5.9, 5.11, 13.7
 */

import React from "react";
import { motion, useReducedMotion } from "motion/react";

export interface ProgressRingProps {
  /** Fractional progress 0.0–1.0 toward next threshold */
  progress: number;
  /** Number of segments for segmented display (e.g., 4 for 4-piece set) */
  segments?: number;
  /** Ring diameter in pixels (default 40) */
  size?: number;
  /** Ring stroke width in pixels (default 4) */
  strokeWidth?: number;
}

/**
 * ProgressRing — circular arc indicator for set bonus progress.
 *
 * When `segments` is provided, renders segmented arcs with small gaps.
 * Otherwise renders a continuous arc fill.
 */
export function ProgressRing({
  progress,
  segments,
  size = 40,
  strokeWidth = 4,
}: ProgressRingProps) {
  const shouldReduceMotion = useReducedMotion();

  // Clamp progress to [0, 1]
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Segmented rendering
  if (segments && segments > 1) {
    return (
      <SegmentedRing
        progress={clampedProgress}
        segments={segments}
        size={size}
        strokeWidth={strokeWidth}
        radius={radius}
        center={center}
        circumference={circumference}
        reduceMotion={!!shouldReduceMotion}
      />
    );
  }

  // Continuous arc rendering
  const dashOffset = circumference * (1 - clampedProgress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-700/50"
      />
      {/* Foreground fill */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="text-cyan-400"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.3, ease: "easeOut" }
        }
        // Rotate -90deg so arc starts from top
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

// ─── Segmented Ring ──────────────────────────────────────────────────────────

interface SegmentedRingProps {
  progress: number;
  segments: number;
  size: number;
  strokeWidth: number;
  radius: number;
  center: number;
  circumference: number;
  reduceMotion: boolean;
}

function SegmentedRing({
  progress,
  segments,
  size,
  strokeWidth,
  radius,
  center,
  circumference,
  reduceMotion,
}: SegmentedRingProps) {
  // Gap between segments in circumference units
  const gapSize = circumference * 0.03; // 3% of circumference per gap
  const totalGaps = gapSize * segments;
  const availableLength = circumference - totalGaps;
  const segmentLength = availableLength / segments;

  // How many full segments are filled based on progress
  const filledSegments = Math.floor(progress * segments);
  // Fractional fill of the next segment
  const fractionalFill = (progress * segments) - filledSegments;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {Array.from({ length: segments }, (_, i) => {
        // Offset for this segment's starting position along the circumference
        const segmentOffset = i * (segmentLength + gapSize);

        // Determine fill for this segment
        let fill: number;
        if (i < filledSegments) {
          fill = 1; // Fully filled
        } else if (i === filledSegments) {
          fill = fractionalFill; // Partially filled
        } else {
          fill = 0; // Empty
        }

        const filledLength = segmentLength * fill;
        const emptyLength = circumference - filledLength;

        return (
          <React.Fragment key={i}>
            {/* Background segment */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-700/50"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-segmentOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
            {/* Filled segment — animate via dashoffset from empty to filled */}
            {fill > 0 && (
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="text-cyan-400"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                initial={{
                  strokeDashoffset: -segmentOffset + segmentLength * (1 - fill),
                }}
                animate={{
                  strokeDashoffset: -segmentOffset + segmentLength * (1 - fill),
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.3, ease: "easeOut" }
                }
                transform={`rotate(-90 ${center} ${center})`}
              />
            )}
          </React.Fragment>
        );
      })}
    </svg>
  );
}

export default ProgressRing;
