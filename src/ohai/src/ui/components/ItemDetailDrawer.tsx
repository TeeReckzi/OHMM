import { useMemo, useState } from "react";
import { Info, Search, Shield, Swords, AlertTriangle, BarChart3, FileText, Tag } from "lucide-react";
import type { AnyCanonicalItem, FormulaSupportStatus } from "../itemTypes";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EffectPreview } from "./EffectPreview";
import { DeltaPreview } from "./DeltaPreview";

interface ItemDetailDrawerProps {
 item: AnyCanonicalItem;
 onClose: () => void;
 /**
  * If true, shows delta preview scaffolding alongside the item details.
  * Pass placeholder values to show the UI shell.
  */
 showDelta?: boolean;
 /**
  * Optional comparison build label for delta previews.
  */
 compareLabel?: string;
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

const FORMULA_BADGES: Record<FormulaSupportStatus, { label: string; color: string; desc: string }> = {
 "fully-modeled": { label: "Fully Modeled", color: "#2ecc71", desc: "All effects are wired into combat formulas." },
 "partially-modeled": { label: "Partially Modeled", color: "#f39c12", desc: "Some effects are modeled, others remain unresolved." },
 "display-only": { label: "Display Only", color: "#e67e22", desc: "This item appears in selectors but is NOT wired into formulas." },
 "unmodeled": { label: "Unmodeled", color: "#95a5a6", desc: "No formula support exists for this item yet." },
};

function keywordLabel(kw: string): string {
 const map: Record<string, string> = {
  burn: "Burn / Blaze",
  frostVortex: "Frost Vortex",
  powerSurge: "Power Surge",
  unstableBomber: "Unstable Bomber",
  bounce: "Bounce",
  shrapnel: "Shrapnel",
  fastGunner: "Fast Gunner",
  bullseye: "Bullseye",
  status: "Status Effects",
  elemental: "Elemental Damage",
  crit: "Critical Strikes",
  weakspot: "Weakspot Hits",
 };
 return map[kw] ?? kw;
}

function pveRelevance(item: AnyCanonicalItem): "high" | "medium" | "low" | "unknown" {
 const tags = item.tags ?? [];
 if (tags.includes("pvp")) return "low";
 if (tags.includes("pve") || tags.includes("offensive") || tags.includes("boss")) return "high";
 if (tags.includes("survival") || tags.includes("crafting")) return "medium";
 return "unknown";
}

function pvpRelevance(item: AnyCanonicalItem): "high" | "medium" | "low" | "unknown" {
 const tags = item.tags ?? [];
 if (tags.includes("pvp")) return "high";
 if (tags.includes("defensive") || tags.includes("mitigation") || tags.includes("resist")) return "high";
 if (tags.includes("pve")) return "low";
 return "unknown";
}

function relevanceColor(r: "high" | "medium" | "low" | "unknown"): string {
 switch (r) {
  case "high": return "#2ecc71";
  case "medium": return "#f39c12";
  case "low": return "#95a5a6";
  case "unknown": return "#8d95b3";
 }
}

function TagBadge({ label, rgb }: { label: string; rgb?: string }) {
 const r = rgb ?? "137, 108, 255";
 return (
  <span
   style={{
    fontSize: "0.72rem",
    padding: "3px 8px",
    borderRadius: 999,
    background: `rgba(${r}, 0.10)`,
    color: `rgba(255,255,255,0.75)`,
    border: `1px solid rgba(${r}, 0.18)`,
   }}
  >
   {label}
  </span>
 );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
 return (
  <div
   style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.78rem",
    color: "#8d95b3",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 10,
   }}
  >
   {icon}
   {label}
  </div>
 );
}

export function ItemDetailDrawer({ item, onClose, showDelta, compareLabel }: ItemDetailDrawerProps) {
 const [activeTab, setActiveTab] = useState<"details" | "formula" | "source">("details");
 const rgb = CATEGORY_COLORS[item.category] ?? "137, 108, 255";
 const fs = item.formulaSupport;

 const pveRel = useMemo(() => pveRelevance(item), [item]);
 const pvpRel = useMemo(() => pvpRelevance(item), [item]);

 return (
  <div className="drawer-backdrop" onMouseDown={onClose}>
   <aside
    className="item-drawer detail-drawer"
    onMouseDown={(e) => e.stopPropagation()}
   >
    <div className="drawer-header">
     <div>
      <p className="eyebrow" style={{ color: `rgba(${rgb}, 0.8)` }}>{item.category}</p>
      <h3 style={{ fontSize: "1.15rem" }}>{item.name}</h3>
     </div>
     <div style={{ display: "flex", gap: 8 }}>
      <ConfidenceBadge level={item.confidence} needsReview={item.needsReview} />
      <button onClick={onClose}>Close</button>
     </div>
    </div>

    {/* Tabs */}
    <div
     style={{
      display: "flex",
      gap: 4,
      padding: 4,
      borderRadius: 14,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: 12,
     }}
    >
     {(["details", "formula", "source"] as const).map((tab) => (
      <button
       key={tab}
       onClick={() => setActiveTab(tab)}
       style={{
        flex: 1,
        padding: "8px 0",
        borderRadius: 10,
        border: 0,
        background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
        color: activeTab === tab ? "#f3f6ff" : "#8d95b3",
        fontSize: "0.78rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 140ms, color 140ms",
       }}
      >
       {tab === "details" ? "Details" : tab === "formula" ? "Formula" : "Source"}
      </button>
     ))}
    </div>

    {/* ── Details Tab ── */}
    {activeTab === "details" && (
     <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto", flex: 1 }}>
      <div>
       <SectionHeader icon={<FileText size={14} />} label="Effect" />
       <EffectPreview summary={item.effectSummary} />
      </div>

      {item.keywordAssociations && item.keywordAssociations.length > 0 && (
       <div>
        <SectionHeader icon={<Swords size={14} />} label="Keywords" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
         {item.keywordAssociations.map((kw) => (
          <span
           key={kw}
           style={{
            fontSize: "0.8rem",
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(255, 200, 50, 0.10)",
            color: "#ffd866",
            border: "1px solid rgba(255, 200, 50, 0.25)",
           }}
          >
           {keywordLabel(kw)}
          </span>
         ))}
        </div>
       </div>
      )}

      <div>
       <SectionHeader icon={<Tag size={14} />} label="Tags" />
       <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {(item.tags ?? []).map((tag) => (
         <TagBadge key={tag} label={tag} rgb={rgb} />
        ))}
       </div>
      </div>

      <div>
       <SectionHeader icon={<Swords size={14} />} label="Relevance" />
       <div style={{ display: "flex", gap: 14, fontSize: "0.82rem" }}>
        <span>
         PvE:{" "}
         <span style={{ color: relevanceColor(pveRel), fontWeight: 600 }}>{pveRel}</span>
        </span>
        <span>
         PvP:{" "}
         <span style={{ color: relevanceColor(pvpRel), fontWeight: 600 }}>{pvpRel}</span>
        </span>
       </div>
      </div>

      {item.statModifiers && item.statModifiers.length > 0 && (
       <div>
        <SectionHeader icon={<BarChart3 size={14} />} label="Stat Modifiers" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
         {item.statModifiers.map((mod, i) => (
          <span key={i} style={{ fontSize: "0.82rem", color: "#bfc8e4" }}>
           {mod.stat}: {mod.value > 0 ? "+" : ""}{mod.value}{mod.unit === "percent" ? "%" : ""}
          </span>
         ))}
        </div>
       </div>
      )}

      {/* Delta Preview Scaffolding */}
      {showDelta && (
       <div>
        <SectionHeader icon={<BarChart3 size={14} />} label="Delta Preview (scaffold)" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
         <DeltaPreview label="Damage" />
         <DeltaPreview label="Crit Contribution" />
         <DeltaPreview label="Elemental Contribution" />
         <DeltaPreview label="Survivability" />
         <DeltaPreview label="TTK Estimate" />
         {compareLabel && (
          <span style={{ fontSize: "0.72rem", color: "#8d95b3" }}>
           Comparing against: {compareLabel}
          </span>
         )}
        </div>
       </div>
      )}
     </div>
    )}

    {/* ── Formula Tab ── */}
    {activeTab === "formula" && (
     <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto", flex: 1 }}>
      {fs ? (
       <>
        <div
         style={{
          padding: 14,
          borderRadius: 14,
          border: `1px solid ${FORMULA_BADGES[fs.status].color}33`,
          background: `${FORMULA_BADGES[fs.status].color}10`,
         }}
        >
         <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
           style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: FORMULA_BADGES[fs.status].color,
            flexShrink: 0,
           }}
          />
          <strong style={{ color: FORMULA_BADGES[fs.status].color, fontSize: "0.9rem" }}>
           {FORMULA_BADGES[fs.status].label}
          </strong>
         </div>
         <p style={{ margin: 0, fontSize: "0.82rem", color: "#bfc8e4", lineHeight: 1.45 }}>
          {FORMULA_BADGES[fs.status].desc}
         </p>
         {fs.notes && (
          <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "#aab4cf", lineHeight: 1.45 }}>
           {fs.notes}
          </p>
         )}
        </div>

        {fs.modeledStatCoverage && fs.modeledStatCoverage.length > 0 && (
         <div>
          <SectionHeader icon={<BarChart3 size={14} />} label="Modeled Stats" />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
           {fs.modeledStatCoverage.map((s) => (
            <TagBadge key={s} label={s} rgb="46, 204, 113" />
           ))}
          </div>
         </div>
        )}

        {fs.unresolvedMechanics && fs.unresolvedMechanics.length > 0 && (
         <div>
          <SectionHeader icon={<AlertTriangle size={14} />} label="Unresolved Mechanics" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
           {fs.unresolvedMechanics.map((m, i) => (
            <span
             key={i}
             style={{
              fontSize: "0.82rem",
              padding: "6px 10px",
              borderRadius: 10,
              background: "rgba(231, 76, 60, 0.08)",
              border: "1px solid rgba(231, 76, 60, 0.18)",
              color: "#e67e44",
             }}
            >
             ⚠ {m}
            </span>
           ))}
          </div>
         </div>
        )}

        {fs.simulationWarnings && fs.simulationWarnings.length > 0 && (
         <div>
          <SectionHeader icon={<AlertTriangle size={14} />} label="Simulation Warnings" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
           {fs.simulationWarnings.map((w, i) => (
            <span
             key={i}
             style={{
              fontSize: "0.8rem",
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(243, 156, 18, 0.08)",
              border: "1px solid rgba(243, 156, 18, 0.18)",
              color: "#f39c12",
              lineHeight: 1.4,
             }}
            >
             ⚠ {w}
            </span>
           ))}
          </div>
         </div>
        )}
       </>
      ) : (
       <div
        style={{
         padding: 14,
         borderRadius: 14,
         border: "1px dashed rgba(255,255,255,0.12)",
         background: "rgba(255,255,255,0.03)",
         fontSize: "0.82rem",
         color: "#8d95b3",
         textAlign: "center",
        }}
       >
        <BarChart3 size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
        <p style={{ margin: 0, lineHeight: 1.45 }}>
         No formula support metadata assigned to this item yet.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.75rem" }}>
         This item is <strong>display-only</strong> until a formulaSupport record is added.
        </p>
       </div>
      )}

      {fs && (fs.status === "display-only" || fs.status === "unmodeled") && (
       <div
        style={{
         padding: 12,
         borderRadius: 12,
         border: "1px solid rgba(230, 126, 34, 0.25)",
         background: "rgba(230, 126, 34, 0.08)",
         fontSize: "0.82rem",
         color: "#e67e22",
         display: "flex",
         alignItems: "flex-start",
         gap: 8,
        }}
       >
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
         Transparency notice: This item appears in the selector but is not wired into combat formula calculations.
         Any displayed projections will not include its effects.
        </span>
       </div>
      )}
     </div>
    )}

    {/* ── Source Tab ── */}
    {activeTab === "source" && (
     <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto", flex: 1 }}>
      {item.sourceMetadata ? (
       <>
        <div>
         <SectionHeader icon={<Info size={14} />} label="Data Source" />
         <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.82rem", color: "#bfc8e4" }}>
          <span>Type: {item.sourceMetadata.sourceType}</span>
          {item.sourceMetadata.sourceName && <span>Source: {item.sourceMetadata.sourceName}</span>}
          {item.sourceMetadata.extractedFrom && <span>Extracted from: {item.sourceMetadata.extractedFrom}</span>}
          {item.sourceMetadata.lastVerified && <span>Last verified: {item.sourceMetadata.lastVerified}</span>}
         </div>
        </div>
        {item.sourceMetadata.verificationNotes && (
         <p style={{ fontSize: "0.82rem", color: "#aab4cf", lineHeight: 1.45, margin: 0 }}>
          {item.sourceMetadata.verificationNotes}
         </p>
        )}
       </>
      ) : (
       <p style={{ fontSize: "0.82rem", color: "#8d95b3" }}>
        {item.sourceNotes || "No source metadata recorded for this item."}
       </p>
      )}
     </div>
    )}
   </aside>
  </div>
 );
}
