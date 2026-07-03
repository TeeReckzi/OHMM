/**
 * Phase 4B — Formula Explainer (Presentational Component)
 *
 * Displays a collapsible damage breakdown derived from FormulaExplainerViewModel.
 * No engine imports — receives all display data as props.
 *
 * Validates: Requirements 3.1–3.7, 4.1, 4.2, 4.3, 4.4, 13.1, 13.7
 */

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, CheckCircle, Eye, AlertTriangle, HelpCircle } from "lucide-react";
import type {
  FormulaExplainerViewModel,
  ExplainerLineItem,
  TargetAssumption,
  ConfidenceLevel,
} from "@/lib/ohmm/theorycraft/types";
import { EmptyState } from "./shared/EmptyState";

// ─── Confidence Badge (inline shared component) ─────────────────────────────

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string; icon: React.ReactNode }> = {
  project_verified: {
    label: "Verified",
    color: "#2ecc71",
    icon: <CheckCircle size={10} />,
  },
  observed: {
    label: "Observed",
    color: "#3498db",
    icon: <Eye size={10} />,
  },
  estimated: {
    label: "Estimated",
    color: "#f39c12",
    icon: <AlertTriangle size={10} />,
  },
  placeholder: {
    label: "Placeholder",
    color: "#95a5a6",
    icon: <HelpCircle size={10} />,
  },
};

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const config = CONFIDENCE_CONFIG[level];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none whitespace-nowrap"
      style={{
        background: `${config.color}18`,
        border: `1px solid ${config.color}44`,
        color: config.color,
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Line Item Row ───────────────────────────────────────────────────────────

function LineItemRow({ item }: { item: ExplainerLineItem }) {
  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded text-[11px]" style={{ background: "rgba(0,200,255,0.03)" }}>
      <span className="flex-1 min-w-0 truncate text-[#c0dde8]" title={item.source}>
        {item.label}
      </span>
      <span
        className="font-mono text-[10px] flex-shrink-0"
        style={{ color: item.groupType === "multiplicative" ? "#a78bfa" : "#7dd3fc" }}
      >
        {item.formattedValue}
      </span>
      <span className="text-[9px] text-[#6b8a9e] flex-shrink-0 w-10 text-right">
        {item.contributionPercent > 0 ? `${item.contributionPercent.toFixed(1)}%` : "—"}
      </span>
      <ConfidenceBadge level={item.confidence} />
    </div>
  );
}

// ─── Target Assumption Row ───────────────────────────────────────────────────

function TargetAssumptionRow({ assumption }: { assumption: TargetAssumption }) {
  return (
    <div className="flex items-center gap-2 py-0.5 px-2 text-[10px]">
      <span className="text-[#6b8a9e]">{assumption.label}:</span>
      <span className="text-[#c0dde8]">{assumption.value}</span>
      <span className="text-[#4a6a7e] text-[9px] ml-auto">{assumption.source}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export interface FormulaExplainerProps {
  viewModel: Omit<FormulaExplainerViewModel, "isExpanded">;
}

export function FormulaExplainer({ viewModel }: FormulaExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const {
    baseWeaponDamage,
    additiveGroup,
    multiplicativeGroup,
    targetAssumptions,
    pvpMitigationSection,
    summaryLine,
    activeContributorCount,
    totalExpectedDamage,
  } = viewModel;

  // Animation transition: 300ms ease-out, or instant if user prefers reduced motion
  const expandTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeOut" as const };

  // Show empty state when there is no meaningful data to display
  const isEmpty = activeContributorCount === 0 && baseWeaponDamage === "—" && totalExpectedDamage === "—";

  if (isEmpty) {
    return (
      <div
        className="rounded-lg border border-white/5 overflow-hidden"
        style={{ background: "rgba(10,20,30,0.6)" }}
      >
        <EmptyState message="Equip a weapon to see damage breakdown." icon="info" />
      </div>
    );
  }

  const handleToggle = () => setIsExpanded((prev) => !prev);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className="rounded-lg border border-white/5 overflow-hidden"
      style={{ background: "rgba(10,20,30,0.6)" }}
    >
      {/* Collapsed summary / toggle header */}
      <button
        type="button"
        className="tc-interactive w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label="Toggle formula breakdown"
      >
        <span className="flex-1 text-[11px] text-[#8ab4c8] font-medium">
          {summaryLine}
        </span>
        {isExpanded ? (
          <ChevronUp size={14} className="text-[#6b8a9e] flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-[#6b8a9e] flex-shrink-0" />
        )}
      </button>

      {/* Expanded breakdown with smooth animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="formula-explainer-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={expandTransition}
            style={{ overflow: "hidden" }}
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Base Weapon Damage */}
              <div className="pt-1">
                <div className="text-[9px] uppercase tracking-wider text-[#4a6a7e] mb-1">
                  Base Weapon Damage
                </div>
                <div className="text-sm font-semibold text-[#c0dde8] font-mono">
                  {baseWeaponDamage}
                </div>
              </div>

              {/* Additive Group */}
              {additiveGroup.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#4a6a7e] mb-1">
                    Additive Bonuses ({additiveGroup.length})
                  </div>
                  <div className="space-y-0.5">
                    {additiveGroup.map((item) => (
                      <LineItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Multiplicative Group */}
              {multiplicativeGroup.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#4a6a7e] mb-1">
                    Multiplicative Layers ({multiplicativeGroup.length})
                  </div>
                  <div className="space-y-0.5">
                    {multiplicativeGroup.map((item) => (
                      <LineItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Target Assumptions */}
              {targetAssumptions.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#4a6a7e] mb-1">
                    Target Assumptions
                  </div>
                  <div className="space-y-0.5">
                    {targetAssumptions.map((assumption, idx) => (
                      <TargetAssumptionRow key={idx} assumption={assumption} />
                    ))}
                  </div>
                </div>
              )}

              {/* PvP Mitigation Section */}
              {pvpMitigationSection && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#4a6a7e] mb-1">
                    PvP Mitigation
                  </div>
                  <div className="flex items-center gap-2 py-1 px-2 rounded text-[11px]" style={{ background: "rgba(255,100,100,0.05)" }}>
                    <span className="text-[#c0dde8]">
                      Damage Reduction
                    </span>
                    <span className="font-mono text-[10px] text-[#f87171] ml-auto">
                      {pvpMitigationSection.applied
                        ? `-${pvpMitigationSection.reductionPercent}`
                        : "None"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
