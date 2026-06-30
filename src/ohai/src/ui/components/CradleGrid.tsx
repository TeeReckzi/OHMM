import { useMemo, useState } from "react";
import type { CanonicalCradlePerk, CradleUnlockGroup } from "../itemTypes";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { getFormulaSupport } from "../registries/formulaSupportRegistry";

const MAX_ACTIVE_PERKS = 8;

interface CradleGridProps {
 perks: CanonicalCradlePerk[];
 activePerks: string[];
 onToggle: (perkId: string) => void;
}

/**
 * Row group definitions with stable order, label, and column arrangement.
 */
interface RowGroupDef {
 rowGroup: string;
 unlockGroup: CradleUnlockGroup;
 label: string;
 columns: number;
}

const ROW_GROUPS: RowGroupDef[] = [
 { rowGroup: "Weapon Class Mastery", unlockGroup: "weapon-mastery", label: "Weapon Class Mastery", columns: 5 },
 { rowGroup: "Offensive Combos", unlockGroup: "offense", label: "Offensive Combos", columns: 6 },
 { rowGroup: "Status & Elemental", unlockGroup: "status-elemental", label: "Status & Elemental", columns: 5 },
 { rowGroup: "Weapon Buffs", unlockGroup: "offense", label: "Weapon Buffs", columns: 4 },
 { rowGroup: "Melee", unlockGroup: "melee", label: "Melee", columns: 2 },
 { rowGroup: "Defense & Support", unlockGroup: "defense-support", label: "Defense & Support", columns: 5 },
 { rowGroup: "Special", unlockGroup: "special", label: "Special", columns: 2 },
];

/** Abbreviate a perk name to 2-3 characters for the node label. */
function abbreviate(name: string): string {
 const words = name.split(/\s+/);
 if (words.length >= 2) {
  return words.map((w) => w[0]).join("").toUpperCase().slice(0, 3);
 }
 return name.slice(0, 2).toUpperCase();
}

/** Map effectType to accent color. */
function effectColor(effectType: string): string {
 switch (effectType) {
  case "conditionalBuff": return "rgba(52, 152, 219, 0.7)";
  case "stackingBuff": return "rgba(155, 89, 182, 0.7)";
  case "proc": return "rgba(231, 76, 60, 0.7)";
  case "trigger": return "rgba(230, 126, 34, 0.7)";
  case "defensive": return "rgba(46, 204, 113, 0.7)";
  case "utility": return "rgba(149, 165, 166, 0.7)";
  case "statBuff": return "rgba(52, 152, 219, 0.7)";
  default: return "rgba(137, 108, 255, 0.5)";
 }
}

export function CradleGrid({ perks, activePerks, onToggle }: CradleGridProps) {
 const [tooltipId, setTooltipId] = useState<string | null>(null);

 const perkMap = useMemo(() => {
  const map = new Map<string, CanonicalCradlePerk>();
  for (const p of perks) map.set(p.id, p);
  return map;
 }, [perks]);

 const groupedRows = useMemo(() => {
  return ROW_GROUPS.map((rg) => {
   const items = perks
    .filter((p) => p.rowGroup === rg.rowGroup)
    .sort((a, b) => a.displayOrder - b.displayOrder);
   return { ...rg, items };
  }).filter((rg) => rg.items.length > 0);
 }, [perks]);

 // Build tooltip content for hovered perk
 const tooltipPerk = tooltipId ? perkMap.get(tooltipId) ?? null : null;
 const tooltipSupport = tooltipPerk ? getFormulaSupport(tooltipPerk) : null;

 return (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
   {groupedRows.map((row) => (
    <div key={row.rowGroup}>
     <div
      style={{
       fontSize: "0.72rem",
       color: "#8d95b3",
       letterSpacing: "0.06em",
       textTransform: "uppercase",
       marginBottom: 8,
       fontWeight: 600,
      }}
     >
      {row.label}
     </div>
     <div
      style={{
       display: "flex",
       flexWrap: "wrap",
       gap: 8,
      }}
     >
      {row.items.map((perk) => {
       const isActive = activePerks.includes(perk.id);
       const canActivate = !isActive && activePerks.length < MAX_ACTIVE_PERKS;
       const locked = !isActive && activePerks.length >= MAX_ACTIVE_PERKS;
       const abbr = abbreviate(perk.name);

       const baseSize = 56;
       const borderColor = isActive
        ? effectColor(perk.effectType)
        : "rgba(255,255,255,0.10)";

       return (
        <div
         key={perk.id}
         style={{ position: "relative" }}
         onMouseEnter={() => setTooltipId(perk.id)}
         onMouseLeave={() => setTooltipId(null)}
        >
         <button
          onClick={() => {
           if (!locked) onToggle(perk.id);
          }}
          title={
           locked
            ? `Max ${MAX_ACTIVE_PERKS} active perks`
            : isActive
             ? `Deactivate ${perk.name}`
             : `Activate ${perk.name}`
          }
          style={{
           width: baseSize,
           height: baseSize,
           borderRadius: "50%",
           border: `2px solid ${borderColor}`,
           background: isActive
            ? `radial-gradient(circle, ${effectColor(perk.effectType).replace("0.7", "0.25")}, rgba(15,18,29,0.9))`
            : "rgba(255,255,255,0.03)",
           color: isActive ? "#f3f6ff" : "#5a6380",
           cursor: locked ? "not-allowed" : "pointer",
           opacity: locked ? 0.4 : isActive ? 1 : 0.7,
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           fontSize: "0.72rem",
           fontWeight: 700,
           letterSpacing: "0.02em",
           transition: "border-color 140ms, background 140ms, transform 140ms, opacity 140ms",
           position: "relative",
           outline: "none",
           boxShadow: isActive
            ? `0 0 12px ${effectColor(perk.effectType).replace("0.7", "0.3")}`
            : "none",
          }}
          onMouseEnter={(e) => {
           if (!locked) {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.borderColor = isActive
             ? effectColor(perk.effectType)
             : "rgba(137,108,255,0.4)";
            e.currentTarget.style.background = isActive
             ? `radial-gradient(circle, ${effectColor(perk.effectType).replace("0.7", "0.35")}, rgba(15,18,29,0.85))`
             : "rgba(137,108,255,0.08)";
           }
          }}
          onMouseLeave={(e) => {
           e.currentTarget.style.transform = "none";
           e.currentTarget.style.borderColor = borderColor;
           e.currentTarget.style.background = isActive
            ? `radial-gradient(circle, ${effectColor(perk.effectType).replace("0.7", "0.25")}, rgba(15,18,29,0.9))`
            : "rgba(255,255,255,0.03)";
          }}
         >
          {abbr}
          {isActive && (
           <span
            style={{
             position: "absolute",
             top: -2,
             right: -2,
             width: 10,
             height: 10,
             borderRadius: "50%",
             background: effectColor(perk.effectType),
             border: "2px solid rgba(15,18,29,0.9)",
            }}
           />
          )}
         </button>
        </div>
       );
      })}
     </div>
    </div>
   ))}

   {/* Tooltip */}
   {tooltipPerk && (
    <div
     style={{
      marginTop: 8,
      padding: 14,
      borderRadius: 16,
      background: "rgba(20, 24, 42, 0.95)",
      border: `1px solid ${effectColor(tooltipPerk.effectType)}`,
      fontSize: "0.82rem",
      lineHeight: 1.5,
      color: "#f3f6ff",
     }}
    >
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <div>
       <strong>{tooltipPerk.name}</strong>
       <span style={{ color: "#8d95b3", marginLeft: 8, fontSize: "0.72rem" }}>
        {tooltipPerk.effectType}
       </span>
      </div>
      <ConfidenceBadge level={tooltipPerk.confidence} needsReview={tooltipPerk.needsReview} />
     </div>
     <div style={{ color: "#aab4cf", marginTop: 6, fontSize: "0.8rem" }}>
      {tooltipPerk.effectSummary}
     </div>
     {tooltipSupport && (
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
       <span style={{ fontSize: "0.7rem", color: "#8d95b3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Formula: {tooltipSupport.status.replace("-", " ")}
       </span>
       {tooltipSupport.simulationWarnings && tooltipSupport.simulationWarnings.length > 0 && (
        <span style={{ fontSize: "0.74rem", color: "#e67e44" }}>
         ⚠ {tooltipSupport.simulationWarnings[0]}
        </span>
       )}
       {tooltipSupport.unresolvedMechanics && tooltipSupport.unresolvedMechanics.length > 0 && (
        <span style={{ fontSize: "0.72rem", color: "#8d95b3", fontStyle: "italic" }}>
         {tooltipSupport.unresolvedMechanics[0]}
        </span>
       )}
      </div>
     )}
     {tooltipPerk.sourceMetadata && (
      <div style={{ fontSize: "0.68rem", color: "#5a6380", marginTop: 6 }}>
       {tooltipPerk.sourceMetadata.sourceName}
      </div>
     )}
    </div>
   )}

   {/* Status bar */}
   <div
    style={{
     marginTop: 4,
     fontSize: "0.78rem",
     color: "#8d95b3",
     display: "flex",
     justifyContent: "space-between",
     alignItems: "center",
    }}
   >
    <span>{activePerks.length} / {MAX_ACTIVE_PERKS} active</span>
    <span>Extracted from in-game hover footage</span>
   </div>
  </div>
 );
}
