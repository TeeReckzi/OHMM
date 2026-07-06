/**
 * Phase 4B — First-Time Hints Component
 *
 * Dismissible overlay banner on major theorycraft panels to introduce new users
 * to their purpose and interface options.
 *
 * - Dismissal persists in localStorage namespace (`ohmm-hint-*`)
 * - Screen-reader accessible: uses appropriate aria roles and labels
 * - Keyboard operable: focusable dismiss button, Esc key support
 */

import React, { useState, useEffect } from "react";
import { X, Info } from "lucide-react";

export interface FirstTimeHintsProps {
  /** Uniquely identifies this hint (e.g., 'hero-metrics', 'set-bonus') */
  hintKey: string;
  /** Title of the educational tip */
  title: string;
  /** Inner content / explanation text */
  description: string;
}

export function FirstTimeHints({ hintKey, title, description }: FirstTimeHintsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(`ohmm-hint-${hintKey}`);
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [hintKey]);

  const handleDismiss = () => {
    localStorage.setItem(`ohmm-hint-${hintKey}`, "dismissed");
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="relative mb-3 flex items-start gap-2.5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3.5 py-2.5 shadow-lg select-none"
      role="status"
      aria-live="polite"
      aria-label={`Tip: ${title}`}
    >
      <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-[11px] font-semibold text-cyan-200 leading-tight mb-0.5">
          {title}
        </h4>
        <p className="text-[10px] text-cyan-300/80 leading-normal">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-cyan-400/60 hover:text-cyan-200 focus:text-cyan-200 outline-none cursor-pointer"
        aria-label={`Dismiss tip: ${title}`}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

export default FirstTimeHints;
