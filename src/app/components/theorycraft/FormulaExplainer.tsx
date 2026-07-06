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

// ─── Group Header with Tooltip ────────────────────────────────────────────────

interface GroupHeaderProps {
  label: string;
  tooltip: string;
}

function GroupHeader({ label, tooltip }: GroupHeaderProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex items-center gap-1.5 mb-1.5 relative">
      <span className="text-[9px] uppercase tracking-wider text-[#4a6a7e]">
        {label}
      </span>
      <button
        type="button"
        className="text-[#4a6a7e] hover:text-[#8ab4c8] focus:text-[#8ab4c8] outline-none cursor-pointer"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setShow(false);
          }
        }}
        aria-label={`About ${label}`}
      >
        <HelpCircle size={10} />
      </button>

      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-1 w-52 p-2 rounded bg-gray-900 border border-white/10 text-[9px] text-gray-300 shadow-xl pointer-events-none normal-case leading-normal">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ─── Line Item Row ───────────────────────────────────────────────────────────

interface LineItemRowProps {
  item: ExplainerLineItem;
  maxContribution: number;
}

function LineItemRow({ item, maxContribution }: LineItemRowProps) {
  const barWidth = maxContribution > 0 ? (item.contributionPercent / maxContribution) * 100 : 0;

  return (
    <div className="flex flex-col gap-1 py-1.5 px-2 rounded text-[11px] relative overflow-hidden mb-0.5" style={{ background: "rgba(0,200,255,0.03)" }}>
      {/* Relative contribution bar */}
      <div
        className="absolute inset-y-0 left-0 bg-cyan-500/5 transition-all duration-300"
        style={{ width: `${barWidth}%` }}
      />
      
      <div className="flex items-center gap-2 relative z-10">
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

      {item.hypotheticalDPSIfRemoved && (
        <div className="text-[9px] text-red-400/90 relative z-10 font-medium text-left">
          If removed: {item.hypotheticalDPSIfRemoved}
        </div>
      )}
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

  const allItems = [...additiveGroup, ...multiplicativeGroup];
  const maxContribution = allItems.reduce((max, item) => Math.max(max, item.contributionPercent), 0);
  
  const maxItem = allItems.reduce((max, item) => (item.contributionPercent > (max?.contributionPercent ?? 0) ? item : max), null as ExplainerLineItem | null);
  const largestContributorText = maxItem && maxItem.contributionPercent > 0
    ? `${maxItem.label} (${maxItem.contributionPercent.toFixed(1)}%)`
    : null;

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
              {/* Largest contributor summary line */}
              {largestContributorText && maxItem && (
                <div className="pt-2 rounded border border-cyan-500/10 bg-cyan-950/20 p-2 text-[11px] text-cyan-300/95 leading-relaxed">
                  <strong>Largest Contributor:</strong> {maxItem.label} is your single largest DPS driver, accounting for <strong>{maxItem.contributionPercent.toFixed(1)}%</strong> of expected damage.
                </div>
              )}

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
                  <GroupHeader
                    label={`Additive Bonuses (${additiveGroup.length})`}
                    tooltip="Additive modifiers sum together first (1 + modA + modB) before multiplying other layers."
                  />
                  <div className="space-y-0.5">
                    {additiveGroup.map((item) => (
                      <LineItemRow key={item.id} item={item} maxContribution={maxContribution} />
                    ))}
                  </div>
                </div>
              )}

              {/* Multiplicative Group */}
              {multiplicativeGroup.length > 0 && (
                <div>
                  <GroupHeader
                    label={`Multiplicative Layers (${multiplicativeGroup.length})`}
                    tooltip="Multiplicative modifiers act as independent multiplier layers (x1.15 × x1.10), magnifying your total output."
                  />
                  <div className="space-y-0.5">
                    {multiplicativeGroup.map((item) => (
                      <LineItemRow key={item.id} item={item} maxContribution={maxContribution} />
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
