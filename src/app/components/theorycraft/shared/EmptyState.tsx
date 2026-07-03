/**
 * Phase 4B — Shared EmptyState
 *
 * Reusable empty/guidance state component. Renders a centered message
 * with optional icon when a panel has no data to display.
 *
 * Validates: Requirements 11.9
 */

import React from "react";
import { Info, Package, Shield, TrendingUp, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  info: Info,
  package: Package,
  shield: Shield,
  "trending-up": TrendingUp,
  scale: Scale,
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Guidance message explaining what the user should do */
  message: string;
  /** Optional Lucide icon name (lowercase-kebab). Defaults to "info" */
  icon?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * EmptyState — centered empty state with icon and guidance text.
 *
 * - Renders a subtle centered layout with optional icon
 * - Provides actionable guidance text (e.g., "Equip a weapon to see DPS metrics")
 * - Reusable across all theorycraft panels
 */
export function EmptyState({ message, icon = "info" }: EmptyStateProps) {
  const IconComponent = ICON_MAP[icon] ?? Info;

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center"
      role="status"
      aria-label={message}
    >
      <IconComponent
        size={24}
        className="text-gray-500/60"
        aria-hidden="true"
      />
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
}

export default EmptyState;
