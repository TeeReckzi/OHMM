import type { ConfidenceLevel } from "../itemTypes";

const BADGE_COLORS: Record<ConfidenceLevel, string> = {
 verified: "#2ecc71",
 observed: "#3498db",
 estimated: "#f39c12",
 experimental: "#e67e22",
 placeholder: "#95a5a6",
};

const BADGE_LABELS: Record<ConfidenceLevel, string> = {
 verified: "Verified",
 observed: "Observed",
 estimated: "Estimated",
 experimental: "Experimental",
 placeholder: "No confidence data",
};

interface ConfidenceBadgeProps {
 level: ConfidenceLevel;
 needsReview?: boolean;
}

export function ConfidenceBadge({ level, needsReview }: ConfidenceBadgeProps) {
 const color = BADGE_COLORS[level];
 return (
  <span
   style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: "0.72rem",
    fontWeight: 600,
    border: `1px solid ${color}44`,
    background: `${color}18`,
    color,
    letterSpacing: "0.03em",
   }}
   title={needsReview ? "Needs review" : undefined}
  >
   <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
   {BADGE_LABELS[level]}
   {needsReview && " ⚠"}
  </span>
 );
}
