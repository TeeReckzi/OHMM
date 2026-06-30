import { useMemo } from "react";
import { Activity, AlertTriangle, Clock, Layers, Zap, HelpCircle } from "lucide-react";
import type { ConditionalEffectEvaluation, UptimeProfileName } from "../../engine/conditionalEffectTypes";
import { getUptimeProfile } from "../../engine/conditionalEffectEngine";

interface ConditionalEffectPanelProps {
 effects: ConditionalEffectEvaluation[];
 uptimeProfile: UptimeProfileName;
 onProfileChange?: (profile: UptimeProfileName) => void;
}

function statusColor(status: string): string {
 switch (status) {
  case "assumed-active": return "#2ecc71";
  case "conditionally-active": return "#f39c12";
  case "unsupported-condition": return "#e74c3c";
  case "inactive": return "#95a5a6";
  case "unresolved": return "#8d95b3";
  default: return "#8d95b3";
 }
}

function statusLabel(status: string): string {
 switch (status) {
  case "assumed-active": return "Always Active";
  case "conditionally-active": return "Conditional";
  case "unsupported-condition": return "Not Supported";
  case "inactive": return "Inactive";
  case "unresolved": return "Unresolved";
  default: return "Unknown";
 }
}

export function ConditionalEffectPanel({ effects, uptimeProfile, onProfileChange }: ConditionalEffectPanelProps) {
 const profile = useMemo(() => getUptimeProfile(uptimeProfile), [uptimeProfile]);
 const hasAny = effects.length > 0;

 return (
  <div
   style={{
    padding: 20,
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15, 18, 29, 0.78)",
    backdropFilter: "blur(16px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
   }}
  >
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <div>
     <p className="eyebrow" style={{ margin: 0, marginBottom: 4 }}>Conditional Effects</p>
     <strong style={{ fontSize: "0.9rem" }}>Uptime Assessment</strong>
    </div>
    <Activity size={20} style={{ color: "#8d95b3" }} />
   </div>

   {!hasAny && (
    <div style={{ fontSize: "0.8rem", color: "#8d95b3", padding: "8px 0" }}>
     No conditional cradle overrides selected. Add timed/buff-type cradle perks to see uptime estimates.
    </div>
   )}

   {/* Profile selector */}
   <div
    style={{
     display: "flex",
     gap: 6,
     flexWrap: "wrap",
    }}
   >
    {(["conservative", "realistic", "optimized", "perfect", "custom"] as UptimeProfileName[]).map((p) => (
     <button
      key={p}
      onClick={() => onProfileChange?.(p)}
      style={{
       fontSize: "0.72rem",
       padding: "4px 12px",
       borderRadius: 999,
       border: `1px solid ${uptimeProfile === p ? "rgba(137,108,255,0.4)" : "rgba(255,255,255,0.08)"}`,
       background: uptimeProfile === p ? "rgba(137,108,255,0.14)" : "rgba(255,255,255,0.03)",
       color: uptimeProfile === p ? "#b9c4ff" : "#8d95b3",
       cursor: onProfileChange ? "pointer" : "default",
       transition: "border-color 140ms, background 140ms",
      }}
     >
      {p === "custom" ? "Custom" : p.charAt(0).toUpperCase() + p.slice(1)}
     </button>
    ))}
   </div>

   {/* Profile description */}
   <div style={{ fontSize: "0.74rem", color: "#8d95b3", fontStyle: "italic", lineHeight: 1.4 }}>
    {profile.description}
    {uptimeProfile === "custom" && (
     <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: 4, background: "rgba(243, 156, 18, 0.12)", color: "#f39c12", fontWeight: 500 }}>
      User assumptions
     </span>
    )}
   </div>

   {/* Effect list */}
   <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {effects.map((eff) => {
     const color = statusColor(eff.status);
     const label = statusLabel(eff.status);

     return (
      <div
       key={eff.effectId}
       style={{
        padding: 12,
        borderRadius: 14,
        border: `1px solid rgba(255,255,255,0.06)`,
        background: "rgba(255,255,255,0.02)",
       }}
      >
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
         <span
          style={{
           width: 8,
           height: 8,
           borderRadius: "50%",
           background: color,
           flexShrink: 0,
          }}
         />
         <strong style={{ fontSize: "0.82rem" }}>{eff.effectName}</strong>
        </div>
        <span
         style={{
          fontSize: "0.68rem",
          padding: "2px 8px",
          borderRadius: 999,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          color,
         }}
        >
         {label}
        </span>
       </div>

       {/* Metrics row */}
       <div style={{ display: "flex", gap: 12, fontSize: "0.74rem", color: "#aab4cf", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
         <Clock size={12} /> {Math.round(eff.effectiveUptime * 100)}% uptime
        </span>
        {eff.maxStacks > 1 && (
         <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Layers size={12} /> {eff.effectiveStacks}/{eff.maxStacks} stacks
         </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
         <Zap size={12} /> {Math.round(eff.contributionFactor * 100)}% contribution
        </span>
       </div>

       {/* Explanation */}
       <div style={{ fontSize: "0.72rem", color: "#8d95b3", marginTop: 4, lineHeight: 1.4 }}>
        {eff.explanation}
       </div>

       {/* Warnings */}
       {eff.warnings.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
         {eff.warnings.map((w, i) => (
          <div
           key={i}
           style={{
            fontSize: "0.7rem",
            color: "#e67e44",
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
           }}
          >
           <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
           <span>{w}</span>
          </div>
         ))}
        </div>
       )}

       {/* Trigger frequency */}
       <div style={{ fontSize: "0.68rem", color: "#5a6380", marginTop: 4 }}>
        ~{eff.triggerFrequencyEstimate}/min triggers · Profile: {uptimeProfile}
       </div>
      </div>
     );
    })}
   </div>

   {/* Legend */}
   <div
    style={{
     display: "flex",
     gap: 12,
     flexWrap: "wrap",
     fontSize: "0.7rem",
     color: "#5a6380",
     marginTop: 4,
    }}
   >
    <span>● Always Active</span>
    <span>● Conditional</span>
    <span>● Not Supported</span>
    <span>● Inactive</span>
   </div>
  </div>
 );
}

export function profileToAssumptionsText(profile: UptimeProfileName): string {
 const p = getUptimeProfile(profile);
 const a = p.combatAssumptions;
 return [
  `Weakspot: ${Math.round(a.weakspotAccuracy * 100)}%`,
  `Reloads: ${a.reloadsPerMinute}/min`,
  `Swaps: ${a.weaponSwapsPerMinute}/min`,
  `Procs: ${a.procsPerMinute}/min`,
  `Fast Gunner: ${Math.round(a.fastGunnerUptime * 100)}%`,
  `Fortress Warfare: ${Math.round(a.fortressWarfareUptime * 100)}%`,
  `Movement: ${a.targetMovement}`,
  `Distance: ${a.distance}`,
 ].join(" · ");
}
