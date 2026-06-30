import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle, ChevronDown, ChevronRight, Eye, Info, Shield, XCircle } from "lucide-react";
import type { CalculationInput } from "../formulaBridge";
import { extractCalculationNotes, groupNotesBySource, computeSummary } from "../calculationNotes";
import type { NoteCategory, NoteImpact } from "../calculationNotes";

interface CalculationBreakdownProps {
 input: CalculationInput;
}

const STATUS_COLORS: Record<string, string> = {
 "fully-modeled": "#2ecc71",
 "partially-modeled": "#f39c12",
 "display-only": "#95a5a6",
 "unmodeled": "#e67e22",
};

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

function StatusDot({ status }: { status: string }) {
 const c = STATUS_COLORS[status] ?? "#8d95b3";
 return <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }} title={status} />;
}

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
 return (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.76rem", color: "#8d95b3", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, marginTop: 4 }}>
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

function EffectRow({ name, status, modifierCount, statusLabel }: { name: string; status: string; modifierCount: number; statusLabel: string }) {
 return (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.82rem", gap: 8 }}>
   <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
    <StatusDot status={status} />
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#d7def2" }}>{name}</span>
   </div>
   <span style={{ fontSize: "0.72rem", flexShrink: 0, color: STATUS_COLORS[status] ?? "#8d95b3", fontWeight: 500 }}>
    {statusLabel}
    {modifierCount > 0 && ` (${modifierCount} mods)`}
   </span>
  </div>
 );
}

export function CalculationBreakdown({ input }: CalculationBreakdownProps) {
 const [notesExpanded, setNotesExpanded] = useState(false);

 const summaryStats = useMemo(() => {
  return {
   fullyModeled: input.modeledEffects.length,
   partiallyModeled: input.partiallyModeledEffects.length,
   displayOnly: input.displayOnlyEffects.length,
   unresolved: input.unresolvedEffects.length,
   totalWarnings: input.formulaWarnings.length,
   totalModifiers: input.totalModifiersExtracted,
   totalItems: input.totalItemsConsidered,
  };
 }, [input]);

 const notes = useMemo(() => extractCalculationNotes(input), [input]);
 const groups = useMemo(() => groupNotesBySource(notes), [notes]);
 const summary = useMemo(() => computeSummary(notes), [notes]);

 return (
  <div style={{ padding: 20, borderRadius: 26, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15, 18, 29, 0.78)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", gap: 12 }}>
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
    <div>
     <p className="eyebrow" style={{ margin: 0 }}>Formula Bridge</p>
     <strong style={{ fontSize: "0.95rem" }}>Calculation Breakdown</strong>
    </div>
    <BarChart3 size={20} style={{ color: "#8d95b3" }} />
   </div>

   {/* Summary row */}
   <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.78rem" }}>
    <span>Items: <strong>{summaryStats.totalItems}</strong></span>
    <span>Modifiers: <strong>{summaryStats.totalModifiers}</strong></span>
    <span>Modeled: <strong style={{ color: "#2ecc71" }}>{summaryStats.fullyModeled}</strong></span>
    <span>Partial: <strong style={{ color: "#f39c12" }}>{summaryStats.partiallyModeled}</strong></span>
    <span>Display: <strong style={{ color: "#95a5a6" }}>{summaryStats.displayOnly}</strong></span>
    <span>Unresolved: <strong style={{ color: "#e67e22" }}>{summaryStats.unresolved}</strong></span>
   </div>

   {/* Section: Modeled (green) */}
   {input.modeledEffects.length > 0 && (
    <div>
     <SectionHeader icon={<CheckCircle size={14} color="#2ecc71" />} label="Included in Calculation" count={input.modeledEffects.length} />
     <div style={{ display: "flex", flexDirection: "column" }}>
      {input.modeledEffects.map((eff) => (
       <EffectRow key={eff.itemId} name={eff.itemName} status="fully-modeled" modifierCount={eff.modifierCount} statusLabel="Included" />
      ))}
     </div>
    </div>
   )}

   {/* Section: Partially Modeled (yellow) */}
   {input.partiallyModeledEffects.length > 0 && (
    <div>
     <SectionHeader icon={<BarChart3 size={14} color="#f39c12" />} label="Partially Modeled" count={input.partiallyModeledEffects.length} />
     <div style={{ display: "flex", flexDirection: "column" }}>
      {input.partiallyModeledEffects.map((eff) => (
       <EffectRow key={eff.itemId} name={eff.itemName} status="partially-modeled" modifierCount={eff.modifierCount} statusLabel={eff.contributesModifiers ? "Partial" : "Display only"} />
      ))}
     </div>
    </div>
   )}

   {/* Section: Display Only (gray) */}
   {input.displayOnlyEffects.length > 0 && (
    <div>
     <SectionHeader icon={<Eye size={14} color="#95a5a6" />} label="Shown but Not Modeled" count={input.displayOnlyEffects.length} />
     <div style={{ display: "flex", flexDirection: "column" }}>
      {input.displayOnlyEffects.map((eff) => (
       <EffectRow key={eff.itemId} name={eff.itemName} status="display-only" modifierCount={0} statusLabel="Display only" />
      ))}
     </div>
    </div>
   )}

   {/* Section: Unresolved (red/orange) */}
   {input.unresolvedEffects.length > 0 && (
    <div>
     <SectionHeader icon={<XCircle size={14} color="#e67e22" />} label="Unresolved Mechanics" count={input.unresolvedEffects.length} />
     <div style={{ display: "flex", flexDirection: "column" }}>
      {input.unresolvedEffects.map((eff) => (
       <EffectRow key={eff.itemId} name={eff.itemName} status="unmodeled" modifierCount={0} statusLabel="No formula support" />
      ))}
     </div>
    </div>
   )}

   {/* PvP Mitigation section */}
   {input.buildMode === "pvp" && input.pvpMitigation.sources.length > 0 && (
    <div>
     <SectionHeader icon={<Shield size={14} color="#3498db" />} label="PvP Mitigation" count={input.pvpMitigation.sources.length} />
     <div style={{ padding: "8px 12px", borderRadius: 12, background: "rgba(52, 152, 219, 0.06)", border: "1px solid rgba(52, 152, 219, 0.15)", fontSize: "0.78rem", display: "flex", flexDirection: "column", gap: 6 }}>
      {input.pvpMitigation.sources.map((s) => (
       <div key={s.sourceItemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#d7def2" }}>{s.sourceName}</span>
        <span style={{ color: "#5dade2", fontWeight: 500, flexShrink: 0 }}>-{s.finalReductionPercent}% incoming</span>
       </div>
      ))}
      <div style={{ marginTop: 4, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
       <span style={{ color: "#aab4cf" }}>Total Reduction</span>
       <span style={{ color: "#2ecc71", fontWeight: 600 }}>-{input.pvpMitigation.totalReductionPercent}%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
       <span style={{ color: "#aab4cf" }}>Incoming Damage Example</span>
       <span style={{ color: "#d7def2" }}>{input.pvpMitigation.incomingDamageExample}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
       <span style={{ color: "#aab4cf" }}>Final Damage Taken</span>
       <span style={{ color: "#e74c3c", fontWeight: 600 }}>{input.pvpMitigation.finalDamageTaken}</span>
      </div>
      {input.pvpMitigation.sources.map((s) => (
       s.chefRexAdjustedReductionPercent !== s.baseReductionPercent && (
        <span key={`adj-${s.sourceItemId}`} style={{ fontSize: "0.72rem", color: "#8d95b3" }}>
         Base: {s.baseReductionPercent}% → Chef Rex adjusted: {s.chefRexAdjustedReductionPercent}%
        </span>
       )
      ))}
     </div>
    </div>
   )}

   {/* PvE mode: show ignored PvP-only mitigation */}
   {input.buildMode === "pve" && input.pvpMitigation.sources.length > 0 && (
    <div style={{ padding: 10, borderRadius: 12, background: "rgba(149, 165, 166, 0.06)", border: "1px solid rgba(149, 165, 166, 0.15)", fontSize: "0.78rem", color: "#95a5a6", display: "flex", alignItems: "flex-start", gap: 8 }}>
     <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
     <span>PvE mode active. {input.pvpMitigation.sources.length} PvP-only mitigation source(s) ignored. Damage projections do not include player damage reduction.</span>
    </div>
   )}

   {/* Available mechanics */}
   {input.availableMechanics.length > 0 && (
    <div>
     <SectionHeader icon={<Info size={14} />} label="Available Mechanics" />
     <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {input.availableMechanics.map((m) => (
       <span key={m} style={{ fontSize: "0.76rem", padding: "3px 8px", borderRadius: 999, background: "rgba(137, 108, 255, 0.10)", color: "#b9c4ff", border: "1px solid rgba(137, 108, 255, 0.2)" }}>{m}</span>
      ))}
     </div>
    </div>
   )}

   {/* PvP mode indicator */}
   {input.buildMode === "pvp" && input.pvpMitigation.sources.length === 0 && (
    <div style={{ marginTop: 4, padding: 10, borderRadius: 12, background: "rgba(52, 152, 219, 0.08)", border: "1px solid rgba(52, 152, 219, 0.18)", fontSize: "0.78rem", color: "#5dade2", display: "flex", alignItems: "flex-start", gap: 8 }}>
     <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
     <span>PvP mode active. No PvP mitigation sources found. Damage projections show raw output only.</span>
    </div>
   )}

   {/* Calculation Notes section (replaces raw Warnings) */}
   {notes.length > 0 && (
    <div>
     {/* Collapsed summary bar */}
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

     {/* Expanded note cards */}
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
  </div>
 );
}
