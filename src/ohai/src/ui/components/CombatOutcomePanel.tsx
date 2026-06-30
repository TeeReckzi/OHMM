import { useMemo, useState } from "react";
import {
 AlertTriangle,
 ChevronDown,
 ChevronRight,
 Crosshair,
 Info,
 Shield,
 Swords,
 Zap,
} from "lucide-react";
import type { CombatOutput } from "../combatOutput";
import type { CombatOutputDelta } from "../combatOutputComparison";
import type { CalculationInput } from "../formulaBridge";
import { extractCalculationNotes, groupNotesBySource, computeSummary } from "../calculationNotes";
import type { NoteCategory, NoteImpact } from "../calculationNotes";

import type { UptimeProfileName } from "../../engine/conditionalEffectTypes";
import { getUptimeProfile, isCustomProfile } from "../../engine/conditionalEffectEngine";

interface CombatOutcomePanelProps {
 output: CombatOutput;
 delta?: CombatOutputDelta;
 uptimeProfile?: UptimeProfileName;
 calcInput?: CalculationInput;
}

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
 return (
  <div style={{
   display: "flex", alignItems: "center", gap: 8,
   fontSize: "0.76rem", color: "#8d95b3",
   letterSpacing: "0.06em", textTransform: "uppercase",
   marginBottom: 8, marginTop: 4,
  }}>
   {icon}
   <span>{label}</span>
   {count !== undefined && (
    <span style={{ fontSize: "0.68rem", padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#aab4cf" }}>
     {count}
    </span>
   )}
  </div>
 );
}

function StatRow({ label, value, color, note }: { label: string; value: string; color?: string; note?: string }) {
 return (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: "0.82rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
   <span style={{ color: "#aab4cf" }}>{label}</span>
   <span style={{ color: color ?? "#d7def2", fontWeight: 500 }}>{value}</span>
  </div>
 );
}

function DeltaRow({ label, before, after, improvement }: { label: string; before: string; after: string; improvement: "positive" | "negative" | "neutral" }) {
 const arrow = improvement === "positive" ? "\u2191" : improvement === "negative" ? "\u2193" : "\u2192";
 const color = improvement === "positive" ? "#2ecc71" : improvement === "negative" ? "#e74c3c" : "#95a5a6";
 return (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: "0.82rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
   <span style={{ color: "#aab4cf" }}>{label}</span>
   <span>
    <span style={{ color: "#8d95b3", fontSize: "0.76rem" }}>{before}</span>
    <span style={{ color, margin: "0 6px", fontWeight: 600 }}>{arrow}</span>
    <span style={{ color: "#d7def2", fontWeight: 500 }}>{after}</span>
   </span>
  </div>
 );
}

type DeltaImprovement = "positive" | "negative" | "neutral";

function improvementFrom(damage: string): DeltaImprovement {
 if (damage === "Increased") return "positive";
 if (damage === "Decreased") return "negative";
 return "neutral";
}

function improvementFromSurv(surv: string): DeltaImprovement {
 if (surv === "Improved") return "positive";
 if (surv === "Reduced") return "negative";
 return "neutral";
}

const CATEGORY_LABELS: Record<NoteCategory, string> = {
 criticalWarning: "Critical",
 assumption: "Assumption",
 unsupportedMechanic: "Unsupported",
 infoNotice: "Info",
 successApplied: "Applied",
};

const CATEGORY_COLORS: Record<NoteCategory, string> = {
 criticalWarning: "#e74c3c",
 assumption: "#f39c12",
 unsupportedMechanic: "#e67e22",
 infoNotice: "#3498db",
 successApplied: "#2ecc71",
};

const IMPACT_LABELS: Record<NoteImpact, string> = {
 "affects-dps": "Affects DPS",
 "affects-survivability": "Affects Survivability",
 "display-only": "Display Only",
 ignored: "Ignored",
};

const IMPACT_COLORS: Record<NoteImpact, string> = {
 "affects-dps": "#e67e22",
 "affects-survivability": "#3498db",
 "display-only": "#95a5a6",
 ignored: "#6b7496",
};

const CONFIDENCE_COLORS: Record<string, string> = {
 high: "#2ecc71",
 medium: "#f39c12",
 low: "#e74c3c",
 placeholder: "#95a5a6",
};

export function CombatOutcomePanel({ output, delta, uptimeProfile, calcInput }: CombatOutcomePanelProps) {
 const [notesExpanded, setNotesExpanded] = useState(false);

 const summaryStats = useMemo(() => {
  return {
   expectedDamage: output.damageOutput.expectedDamage.toFixed(2),
   dps: output.damageOutput.DPS !== undefined ? output.damageOutput.DPS.toFixed(2) : "N/A",
   damageTakenMult: output.survivability.damageTakenMultiplier.toFixed(4),
   ehpMult: output.survivability.effectiveHealthMultiplier === Infinity
    ? "\u221E"
    : output.survivability.effectiveHealthMultiplier.toFixed(4),
   effectiveHealth: output.survivability.effectiveHealth !== undefined
    ? output.survivability.effectiveHealth.toFixed(0)
    : "N/A",
   shotsToDie: output.survivability.shotsToDie !== undefined
    ? output.survivability.shotsToDie.toString()
    : "N/A",
   duelPressure: output.pvpDuel.duelPressure,
   mitigation: `${output.survivability.survivabilityGainPercent > 0
    ? output.survivability.survivabilityGainPercent.toFixed(1)
    : "0"}%`,
  };
 }, [output]);

 const inPvP = output.buildMode === "pvp";

 const notes = useMemo(() => {
  if (calcInput) return extractCalculationNotes(calcInput);
  return null;
 }, [calcInput]);

 const groups = useMemo(() => notes ? groupNotesBySource(notes) : [], [notes]);
 const summary = useMemo(() => notes ? computeSummary(notes) : null, [notes]);

 return (
  <div style={{
   padding: 20, borderRadius: 26,
   border: "1px solid rgba(255,255,255,0.08)",
   background: "rgba(15, 18, 29, 0.78)",
   backdropFilter: "blur(16px)",
   display: "flex", flexDirection: "column", gap: 12,
  }}>
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
    <div>
     <p className="eyebrow" style={{ margin: 0 }}>Combat Projections</p>
     <strong style={{ fontSize: "0.95rem" }}>Combat Outcome</strong>
    </div>
    <Swords size={20} style={{ color: "#8d95b3" }} />
   </div>

   {/* Summary Strip */}
   <div style={{
    display: "flex", gap: 12, flexWrap: "wrap",
    padding: "10px 14px", borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    fontSize: "0.78rem",
   }}>
    <span>DMG: <strong style={{ color: "#d7def2" }}>{summaryStats.expectedDamage}</strong></span>
    <span>DPS: <strong style={{ color: "#d7def2" }}>{summaryStats.dps}</strong> <span className="text-[10px] text-ohai-text/50">(provisional)</span></span>
    <span>Mitigation: <strong style={{ color: "#5dade2" }}>{summaryStats.mitigation}</strong></span>
    {inPvP && (
     <span>Duel: <strong style={{
      color: summaryStats.duelPressure === "You kill faster" ? "#2ecc71"
       : summaryStats.duelPressure === "You die faster" ? "#e74c3c"
       : "#f39c12"
     }}>{summaryStats.duelPressure}</strong></span>
    )}
   </div>

   {/* Damage Output Section */}
   <div>
    <SectionHeader icon={<Zap size={14} color="#f39c12" />} label="Damage Output" />
    <div style={{ display: "flex", flexDirection: "column" }}>
     <StatRow label="Base Damage" value={output.damageOutput.baseDamage.toFixed(2)} color="#d7def2" />
     <StatRow label="Expected Damage" value={output.damageOutput.expectedDamage.toFixed(2)} />
     <StatRow label="Crit Multiplier" value={`\u00d7${output.damageOutput.critMultiplier.toFixed(4)}`} />
     <StatRow label="Weakspot Multiplier" value={`\u00d7${output.damageOutput.weakspotMultiplier.toFixed(4)}`} />
     <StatRow label="Total Multiplier" value={`\u00d7${output.damageOutput.totalMultiplier.toFixed(4)}`} color="#2ecc71" />
     <StatRow label="DPS" value={output.damageOutput.DPS !== undefined ? output.damageOutput.DPS.toFixed(2) : "—"} note={output.damageOutput.DPS === undefined ? "No cadence data available" : undefined} />
     {output.damageOutput.ticksPerSecond !== undefined && (
      <StatRow label="Ticks/sec" value={output.damageOutput.ticksPerSecond.toFixed(2)} />
     )}
     {output.damageOutput.tickIntervalSeconds !== undefined && (
      <StatRow label="Tick Interval" value={`${output.damageOutput.tickIntervalSeconds.toFixed(3)}s`} />
     )}
    </div>
   </div>

   {/* Survivability Section */}
   <div>
    <SectionHeader icon={<Shield size={14} color="#3498db" />} label="Survivability" />
    <div style={{ display: "flex", flexDirection: "column" }}>
     <StatRow label="Damage Taken Multiplier" value={`\u00d7${output.survivability.damageTakenMultiplier.toFixed(4)}`} />
     <StatRow label="EHP Multiplier" value={output.survivability.effectiveHealthMultiplier === Infinity ? "\u221E" : `\u00d7${output.survivability.effectiveHealthMultiplier.toFixed(4)}`} />
     <StatRow label="Effective HP" value={output.survivability.effectiveHealth !== undefined ? output.survivability.effectiveHealth.toFixed(0) : "—"} note={output.survivability.effectiveHealth === undefined ? "Missing health data" : undefined} />
     <StatRow label="Incoming After Mitigation" value={output.survivability.incomingDamageAfterMitigation !== undefined ? output.survivability.incomingDamageAfterMitigation.toFixed(2) : "—"} note={output.survivability.incomingDamageAfterMitigation === undefined ? "Missing mitigation data" : undefined} />
     <StatRow label="Shots to Die" value={output.survivability.shotsToDie !== undefined ? output.survivability.shotsToDie.toString() : "—"} note={output.survivability.shotsToDie === undefined ? "Cannot compute without incoming DPS" : undefined} />
     {output.survivability.survivabilityGainPercent > 0 && (
      <StatRow label="Survivability Gain" value={`+${output.survivability.survivabilityGainPercent.toFixed(1)}%`} color="#2ecc71" />
     )}
    </div>
   </div>

   {/* PvP Duel Context */}
   {inPvP && (
    <div>
     <SectionHeader icon={<Crosshair size={14} color="#e74c3c" />} label="PvP Duel Context" />
     <div style={{
      padding: "8px 12px", borderRadius: 12,
      background: "rgba(231, 76, 60, 0.04)",
      border: "1px solid rgba(231, 76, 60, 0.10)",
      display: "flex", flexDirection: "column", gap: 4,
      fontSize: "0.82rem",
     }}>
      <StatRow label="Outgoing TTK" value={output.pvpDuel.outgoingTTK !== undefined ? `${output.pvpDuel.outgoingTTK.toFixed(2)}s` : "—"} note={output.pvpDuel.outgoingTTK === undefined ? "Missing target health or DPS data" : undefined} />
      <StatRow label="Incoming TTK" value={output.pvpDuel.incomingTTK !== undefined ? `${output.pvpDuel.incomingTTK.toFixed(2)}s` : "—"} note={output.pvpDuel.incomingTTK === undefined ? "Missing effective health or incoming DPS data" : undefined} />
      <div style={{ marginTop: 4, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", textAlign: "center", fontWeight: 600, fontSize: "0.85rem", color: output.pvpDuel.duelPressure === "You kill faster" ? "#2ecc71" : output.pvpDuel.duelPressure === "You die faster" ? "#e74c3c" : "#f39c12" }}>
       {output.pvpDuel.duelPressure}
      </div>
     </div>
    </div>
   )}

   {/* Comparison Delta */}
   {delta && (
    <div>
     <SectionHeader icon={<Info size={14} color="#8d95b3" />} label="vs Previous Build" />
     <div style={{
      padding: "8px 12px", borderRadius: 12,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", gap: 2,
      fontSize: "0.82rem",
     }}>
      <DeltaRow
       label="Damage"
       before={delta.outgoingDamagePct}
       after={`${delta.damageLabel}`}
       improvement={improvementFrom(delta.damageLabel)}
      />
      <DeltaRow
       label="DPS"
       before={delta.dpsPct}
       after={`${delta.dpsDelta > 0 ? "+" : ""}${delta.dpsDelta.toFixed(2)}`}
       improvement={delta.dpsDelta > 0 ? "positive" : delta.dpsDelta < 0 ? "negative" : "neutral"}
      />
      <DeltaRow
       label="Mitigation"
       before={delta.mitigationDirection === "more" ? "more" : delta.mitigationDirection === "less" ? "less" : "same"}
       after={`${delta.survivabilityLabel}`}
       improvement={delta.mitigationDirection === "more" ? "positive" : delta.mitigationDirection === "less" ? "negative" : "neutral"}
      />
      {delta.effectiveHPPct !== undefined && (
       <DeltaRow
        label="Effective HP"
        before={delta.effectiveHPPct}
        after={delta.effectiveHPDelta !== undefined && delta.effectiveHPDelta > 0 ? "higher" : delta.effectiveHPDelta !== undefined && delta.effectiveHPDelta < 0 ? "lower" : "same"}
        improvement={delta.effectiveHPDelta !== undefined && delta.effectiveHPDelta > 0 ? "positive" : delta.effectiveHPDelta !== undefined && delta.effectiveHPDelta < 0 ? "negative" : "neutral"}
       />
      )}
      {delta.shotsToDieDelta !== undefined && (
       <DeltaRow
        label="Shots to Die"
        before={`${delta.shotsToDieDirection === "better" ? "more" : delta.shotsToDieDirection === "worse" ? "fewer" : "same"}`}
        after={delta.shotsToDieDelta > 0 ? `${delta.shotsToDieDelta} more` : delta.shotsToDieDelta < 0 ? `${Math.abs(delta.shotsToDieDelta)} fewer` : "same"}
        improvement={delta.shotsToDieDirection === "better" ? "positive" : delta.shotsToDieDirection === "worse" ? "negative" : "neutral"}
       />
      )}
      {delta.ttkDelta !== undefined && (
       <DeltaRow
        label="TTK"
        before={`${delta.ttkDirection === "faster" ? "faster" : delta.ttkDirection === "slower" ? "slower" : "same"}`}
        after={delta.ttkDelta < 0 ? `${Math.abs(delta.ttkDelta).toFixed(2)}s faster` : delta.ttkDelta > 0 ? `${delta.ttkDelta.toFixed(2)}s slower` : "unchanged"}
        improvement={delta.ttkDirection === "faster" ? "positive" : delta.ttkDirection === "slower" ? "negative" : "neutral"}
       />
      )}
     </div>
    </div>
   )}

   {/* Calculation Notes (replaces old Warnings section) */}
   {notes && summary && (
    <div>
     <button
      onClick={() => setNotesExpanded(!notesExpanded)}
      style={{
       width: "100%",
       display: "flex",
       alignItems: "center",
       justifyContent: "space-between",
       padding: "10px 14px",
       borderRadius: 14,
       border: `1px solid ${summary.criticalCount > 0 ? "rgba(231, 76, 60, 0.2)" : "rgba(255,255,255,0.08)"}`,
       background: summary.criticalCount > 0 ? "rgba(231, 76, 60, 0.06)" : "rgba(255,255,255,0.03)",
       color: "#d7def2",
       gap: 8,
       cursor: "pointer",
       fontSize: "0.82rem",
       textAlign: "left",
      }}
     >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
       <AlertTriangle size={16} color={summary.criticalCount > 0 ? "#e74c3c" : "#f39c12"} />
       <strong>Calculation Notes</strong>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.76rem" }}>
       {summary.assumptionCount > 0 && <span style={{ color: "#f39c12" }}>{summary.assumptionCount} assumption(s)</span>}
       {summary.unsupportedCount > 0 && <span style={{ color: "#e67e22" }}>{summary.unsupportedCount} unsupported</span>}
       {summary.successCount > 0 && <span style={{ color: "#2ecc71" }}>{summary.successCount} applied</span>}
       {summary.infoCount > 0 && <span style={{ color: "#3498db" }}>{summary.infoCount} info</span>}
       {summary.criticalCount > 0 && <span style={{ color: "#e74c3c", fontWeight: 600 }}>{summary.criticalCount} critical</span>}
       {notesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>
     </button>

     {notesExpanded && (
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
       {groups.map((group) => (
        <div key={group.source} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
         <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.82rem", fontWeight: 600, color: "#d7def2", background: "rgba(255,255,255,0.03)" }}>
          {group.source}
         </div>
         {group.notes.map((note) => (
          <div key={note.id} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 6 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 999, background: `${CATEGORY_COLORS[note.category]}18`, color: CATEGORY_COLORS[note.category], border: `1px solid ${CATEGORY_COLORS[note.category]}35`, fontWeight: 500 }}>
             {CATEGORY_LABELS[note.category]}
            </span>
            <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 999, background: `${IMPACT_COLORS[note.impact]}18`, color: IMPACT_COLORS[note.impact], border: `1px solid ${IMPACT_COLORS[note.impact]}35` }}>
             {IMPACT_LABELS[note.impact]}
            </span>
            <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 999, background: `${CONFIDENCE_COLORS[note.confidence]}18`, color: CONFIDENCE_COLORS[note.confidence], border: `1px solid ${CONFIDENCE_COLORS[note.confidence]}35` }}>
             {note.confidence}
            </span>
           </div>
           <span style={{ fontSize: "0.8rem", color: "#e0e4f7", lineHeight: 1.45 }}>{note.message}</span>
          </div>
         ))}
        </div>
       ))}
      </div>
     )}
    </div>
   )}

   {/* Fallback legacy warnings when notes not available */}
   {!notes && output.warnings.length > 0 && (
    <div style={{
     padding: 12, borderRadius: 14,
     background: "rgba(231, 76, 60, 0.06)",
     border: "1px solid rgba(231, 76, 60, 0.15)",
    }}>
     <SectionHeader icon={<AlertTriangle size={14} color="#e74c3c" />} label="Warnings" count={output.warnings.length} />
     <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {output.warnings.map((w, i) => (
       <span key={i} style={{ fontSize: "0.78rem", color: "#e8b88a", lineHeight: 1.4, padding: "2px 0" }}>
        {w}
       </span>
      ))}
     </div>
    </div>
   )}

   {/* PvE mode note */}
   {!inPvP && (
    <div style={{
     padding: 10, borderRadius: 12,
     background: "rgba(149, 165, 166, 0.06)",
     border: "1px solid rgba(149, 165, 166, 0.15)",
     fontSize: "0.78rem", color: "#95a5a6",
     display: "flex", alignItems: "flex-start", gap: 8,
    }}>
     <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
     <span>PvE mode active. PvP duel context suppressed.</span>
    </div>
   )}
  </div>
 );
}
