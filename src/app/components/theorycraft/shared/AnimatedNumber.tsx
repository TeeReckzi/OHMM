/**
 * Phase 4B — AnimatedNumber
 *
 * Shared component that renders an animated count-up/count-down numeric transition.
 * Uses Framer Motion (motion package) for smooth 200ms ease-out interpolation.
 * Respects `prefers-reduced-motion` — shows value instantly when set.
 *
 * Validates: Requirements 1.9, 11.6, 13.1, 13.7
 */

import React, { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate } from "motion/react";

// ─── Hook: prefers-reduced-motion ─────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

// ─── AnimatedNumber Component ─────────────────────────────────────────────────

export interface AnimatedNumberProps {
  /** The target number to animate to */
  value: number;
  /** Number of decimal places for formatting (default: 0) */
  decimals?: number;
  /** Optional prefix string (e.g., "+", "$") */
  prefix?: string;
  /** Optional suffix string (e.g., "%", " DPS") */
  suffix?: string;
  /** Optional className for the wrapping span */
  className?: string;
}

/**
 * AnimatedNumber — smooth count-up/count-down numeric transitions.
 *
 * - Animates from previous value to new value over 200ms ease-out
 * - Respects `prefers-reduced-motion` media query (shows instantly)
 * - Formats with configurable decimal places, prefix, and suffix
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const prefersReduced = usePrefersReducedMotion();
  const motionValue = useMotionValue(value);
  const displayValue = useTransform(motionValue, (current) => {
    return `${prefix}${current.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;
  });

  const spanRef = useRef<HTMLSpanElement>(null);

  // Animate to new value when it changes
  useEffect(() => {
    if (prefersReduced) {
      // Instantly set value — no animation
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration: 0.2,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [value, prefersReduced, motionValue]);

  // Keep DOM text in sync with motion value
  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      if (spanRef.current) {
        spanRef.current.textContent = latest;
      }
    });
    return unsubscribe;
  }, [displayValue]);

  // Initial formatted value for SSR/first render
  const formattedValue = `${prefix}${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;

  return (
    <span ref={spanRef} className={className}>
      {formattedValue}
    </span>
  );
}

export default AnimatedNumber;
