import type { AnyCanonicalItem, FormulaSupportStatus } from "../itemTypes";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EffectPreview } from "./EffectPreview";

interface ItemCardEnhancedProps {
 item: AnyCanonicalItem;
 selected?: boolean;
 onClick?: () => void;
 compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
 weapon: "255, 136, 86",
 armor: "113, 151, 255",
 key_gear: "255, 82, 192",
 mod: "98, 220, 255",
 food: "46, 204, 113",
 drink: "52, 152, 219",
 deviation: "155, 89, 182",
 cradle_perk: "241, 196, 15",
 pve_target: "231, 76, 60",
};

const FORMULA_SUPPORT_BADGES: Record<FormulaSupportStatus, { label: string; color: string }> = {
 "fully-modeled": { label: "F", color: "#2ecc71" },
 "partially-modeled": { label: "P", color: "#f39c12" },
 "display-only": { label: "D", color: "#e67e22" },
 "unmodeled": { label: "U", color: "#95a5a6" },
};

const FORMULA_LABELS: Record<FormulaSupportStatus, string> = {
 "fully-modeled": "Fully modeled in formulas",
 "partially-modeled": "Limited formula coverage",
 "display-only": "Display only — not wired into formulas",
 "unmodeled": "No formula support",
};

export function ItemCardEnhanced({ item, selected, onClick, compact }: ItemCardEnhancedProps) {
 const rgb = CATEGORY_COLORS[item.category] ?? "137, 108, 255";
 const fs = item.formulaSupport;

 return (
  <button
   onClick={onClick}
   style={{
    width: "100%",
    textAlign: "left",
    color: "#f3f6ff",
    borderRadius: 18,
    padding: compact ? 10 : 14,
    background: selected
     ? `rgba(${rgb}, 0.12)`
     : "rgba(255,255,255,0.035)",
    border: `1px solid ${
     selected ? `rgba(${rgb}, 0.38)` : "rgba(255,255,255,0.08)"
    }`,
    cursor: "pointer",
    transition: "border-color 140ms, transform 140ms, background 140ms",
    display: "flex",
    flexDirection: "column",
    gap: 6,
   }}
   onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = `rgba(${rgb}, 0.34)`;
    e.currentTarget.style.background = `rgba(${rgb}, 0.08)`;
    e.currentTarget.style.transform = "translateY(-1px)";
   }}
   onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = selected
     ? `rgba(${rgb}, 0.38)`
     : "rgba(255,255,255,0.08)";
    e.currentTarget.style.background = selected
     ? `rgba(${rgb}, 0.12)`
     : "rgba(255,255,255,0.035)";
    e.currentTarget.style.transform = "none";
   }}
  >
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
    <strong style={{ fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
     {item.name}
    </strong>
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
     {!compact && <ConfidenceBadge level={item.confidence} needsReview={item.needsReview} />}
    </div>
   </div>

   {!compact && (
    <>
     <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {(item.tags ?? []).slice(0, 4).map((tag) => (
       <span
        key={tag}
        style={{
         fontSize: "0.7rem",
         padding: "2px 7px",
         borderRadius: 999,
         background: `rgba(${rgb}, 0.12)`,
         color: `rgba(255,255,255,0.7)`,
         border: `1px solid rgba(${rgb}, 0.18)`,
        }}
       >
        {tag}
       </span>
      ))}
      {item.keywordAssociations?.map((kw) => (
       <span
        key={kw}
        style={{
         fontSize: "0.7rem",
         padding: "2px 7px",
         borderRadius: 999,
         background: "rgba(255, 200, 50, 0.10)",
         color: "#ffd866",
         border: "1px solid rgba(255, 200, 50, 0.25)",
        }}
       >
        {kw}
       </span>
      ))}
     </div>

     <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {fs && (
       <span
        title={FORMULA_LABELS[fs.status]}
        style={{
         fontSize: "0.68rem",
         padding: "1px 6px",
         borderRadius: 4,
         background: `${FORMULA_SUPPORT_BADGES[fs.status].color}18`,
         color: FORMULA_SUPPORT_BADGES[fs.status].color,
         border: `1px solid ${FORMULA_SUPPORT_BADGES[fs.status].color}33`,
         fontWeight: 600,
         letterSpacing: "0.04em",
        }}
       >
        {FORMULA_SUPPORT_BADGES[fs.status].label}
       </span>
      )}
      {item.sourceNotes && (
       <span
        title={item.sourceNotes}
        style={{
         fontSize: "0.68rem",
         color: "#8d95b3",
         overflow: "hidden",
         textOverflow: "ellipsis",
         whiteSpace: "nowrap",
         maxWidth: 180,
        }}
       >
        {item.sourceNotes}
       </span>
      )}
     </div>
    </>
   )}

   <EffectPreview summary={item.effectSummary} compact />

   {!compact && fs?.simulationWarnings && fs.simulationWarnings.length > 0 && (
    <span style={{ fontSize: "0.7rem", color: "#e67e22", marginTop: 2 }}>
     ⚠ {fs.simulationWarnings[0]}
    </span>
   )}
  </button>
 );
}
