/**
 * Phase 4B — ShimmerSkeleton Loading State
 *
 * A shimmer skeleton placeholder showing an animated gradient sweep.
 * Used as placeholder content while a Phase 4B panel is computing or
 * loading data — replaces blank space and static spinners.
 *
 * Respects prefers-reduced-motion: disables animation when set,
 * falling back to a static gray block (handled via CSS in theorycraft-tokens.css).
 *
 * Validates: Requirements 11.8
 */

import React from "react";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ShimmerSkeletonProps {
  /** Width of the skeleton (CSS value, e.g. "100%", "200px") */
  width?: string;
  /** Height of the skeleton (CSS value, e.g. "1rem", "40px") */
  height?: string;
  /** Additional CSS classes to merge */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ShimmerSkeleton — animated gradient sweep placeholder.
 *
 * - Renders a div with the `.tc-shimmer` class (left-to-right sweep animation)
 * - Accepts `width` and `height` as inline style overrides
 * - Matches rounded-lg border-radius of other theorycraft cards
 * - Respects `prefers-reduced-motion` via CSS media query (static gray fallback)
 * - Purely presentational — no data fetching or state management
 */
export function ShimmerSkeleton({
  width = "100%",
  height = "1rem",
  className = "",
}: ShimmerSkeletonProps) {
  return (
    <div
      className={`tc-shimmer ${className}`.trim()}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    />
  );
}

export default ShimmerSkeleton;
