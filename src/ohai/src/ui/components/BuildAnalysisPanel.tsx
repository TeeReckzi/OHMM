import { useMemo } from "react";
import { Activity, Shield, Swords, AlertTriangle, Crosshair, Eye, Sparkles } from "lucide-react";
import type { BuildSelection } from "../types";
import { foodBuffRegistry } from "../registries/foodBuffRegistry";
import { deviationRegistry } from "../registries/deviationRegistry";
import { keyGearRegistry } from "../registries/armorRegistry";
import { cradleRegistry } from "../registries/cradleRegistry";
import type { AnyCanonicalItem } from "../itemTypes";

interface BuildAnalysisPanelProps {
 build: BuildSelection;
}

interface AnalysisResult {
 burstPotential: "high" | "medium" | "low" | "unknown";
 sustainPotential: "high" | "medium" | "low" | "unknown";
 pvpLeaning: "high" | "medium" | "low" | "unknown";
 pveLeaning: "high" | "medium" | "low" | "unknown";
 weakspotDependency: "high" | "medium" | "low" | "unknown";
 critDependency: "high" | "medium" | "low" | "unknown";
 elementalReliance: "high" | "medium" | "low" | "unknown";
 survivabilityNotes: string[];
 mobilityAssumptions: string[];
 unresolvedMechanicWarnings: string[];
 cradlePerkNames: string[];
 cradleMechanicMatch: string[];
 cradleUnsupported: string[];
}

function findItem<T extends AnyCanonicalItem>(registry: T[], id: string): T | undefined {
 return registry.find((i) => i.id === id);
}

function analyzeBuild(build: BuildSelection): AnalysisResult {
 const result: AnalysisResult = {
  burstPotential: "unknown",
  sustainPotential: "unknown",
  pvpLeaning: "unknown",
  pveLeaning: "unknown",
  weakspotDependency: "unknown",
  critDependency: "unknown",
  elementalReliance: "unknown",
  survivabilityNotes: [],
  mobilityAssumptions: [],
  unresolvedMechanicWarnings: [],
  cradlePerkNames: [],
  cradleMechanicMatch: [],
  cradleUnsupported: [],
 };

 const foodItem = findItem(foodBuffRegistry, build.food.food);
 const drinkItem = findItem(foodBuffRegistry, build.food.drink);
 const deviantItem = findItem(deviationRegistry, build.deviant.id);
 const keyGearItems = Object.values(build.armor)
  .map((id) => findItem(keyGearRegistry, id))
  .filter(Boolean) as AnyCanonicalItem[];

 const allItems: AnyCanonicalItem[] = [foodItem, drinkItem, deviantItem, ...keyGearItems].filter(Boolean) as AnyCanonicalItem[];

 const kwSet = new Set<string>();
 const tagSet = new Set<string>();
 const formulaWarnings: string[] = [];

 for (const item of allItems) {
  for (const kw of item.keywordAssociations ?? []) kwSet.add(kw);
  for (const tag of item.tags ?? []) tagSet.add(tag);
  if (item.formulaSupport?.unresolvedMechanics) {
   for (const m of item.formulaSupport.unresolvedMechanics) {
    formulaWarnings.push(`${item.name}: ${m}`);
   }
  }
 }

 // Keyword analysis
 if (kwSet.has("burn") || kwSet.has("unstableBomber")) {
  result.burstPotential = "high";
  result.sustainPotential = "medium";
 } else if (kwSet.has("frostVortex") || kwSet.has("powerSurge")) {
  result.burstPotential = "medium";
  result.sustainPotential = "high";
 } else {
  result.burstPotential = "medium";
  result.sustainPotential = "medium";
 }

 // PvP / PvE leaning
 if (tagSet.has("pvp") || tagSet.has("defensive") || tagSet.has("mitigation")) {
  result.pvpLeaning = "high";
  result.pveLeaning = "low";
 } else if (tagSet.has("pve") || tagSet.has("boss")) {
  result.pvpLeaning = "low";
  result.pveLeaning = "high";
 } else {
  result.pvpLeaning = "medium";
  result.pveLeaning = "medium";
 }

 // Dependencies
 if (kwSet.has("bullseye") || tagSet.has("weakspot")) {
  result.weakspotDependency = "high";
 } else {
  result.weakspotDependency = "medium";
 }

 if (tagSet.has("crit")) {
  result.critDependency = "high";
 } else {
  result.critDependency = "medium";
 }

 // Elemental reliance
 if (kwSet.has("burn") || kwSet.has("frostVortex") || kwSet.has("powerSurge") || kwSet.has("elemental")) {
  result.elementalReliance = "high";
 } else {
  result.elementalReliance = "low";
 }

 // Survivability
 if (tagSet.has("defensive") || tagSet.has("shield") || tagSet.has("resist")) {
  result.survivabilityNotes.push("Defensive/survival tags detected.");
 }
 if (tagSet.has("healing")) {
  result.survivabilityNotes.push("Healing/sustain capability present.");
 }
 if (result.survivabilityNotes.length === 0) {
  result.survivabilityNotes.push("No explicit defensive profile. Assumes standard mitigation.");
 }

 // Mobility
 if (tagSet.has("mobility")) {
  result.mobilityAssumptions.push("Mobility enhancements detected (movement speed/jump).");
 } else {
  result.mobilityAssumptions.push("Standard mobility. No movement bonuses modeled.");
 }

 // Unresolved warnings
 result.unresolvedMechanicWarnings = formulaWarnings;

 // ── Cradle Analysis ──
 const cradlePerks = build.cradle.perks
  .map((id) => cradleRegistry.find((p) => p.id === id))
  .filter(Boolean) as AnyCanonicalItem[];
 result.cradlePerkNames = cradlePerks.map((p) => p.name);

 // Match cradle keywordAssociations against build keywords
 for (const perk of cradlePerks) {
  const perkKw = perk.keywordAssociations ?? [];
  const overlap = [...kwSet].filter((kw) => perkKw.includes(kw));
  if (overlap.length > 0) {
   result.cradleMechanicMatch.push(`${perk.name}: matches ${overlap.join(", ")}`);
  }
  // Check for unsupported cradle effects
  if (perk.formulaSupport?.simulationWarnings) {
   for (const w of perk.formulaSupport.simulationWarnings) {
    result.cradleUnsupported.push(`${perk.name}: ${w}`);
   }
  }
 }

 return result;
}

function scoreColor(val: "high" | "medium" | "low" | "unknown"): string {
 switch (val) {
  case "high": return "#2ecc71";
  case "medium": return "#f39c12";
  case "low": return "#95a5a6";
  case "unknown": return "#8d95b3";
 }
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
 return (
  <div
   style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: "0.82rem",
   }}
  >
   <span style={{ color: "#aab4cf" }}>{label}</span>
   <span style={{ color: scoreColor(value as any), fontWeight: 600 }}>{value}</span>
  </div>
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
    marginTop: 8,
   }}
  >
   {icon}
   {label}
  </div>
 );
}

export function BuildAnalysisPanel({ build }: BuildAnalysisPanelProps) {
 const analysis = useMemo(() => analyzeBuild(build), [build]);

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
    gap: 6,
   }}
  >
   <div
    style={{
     display: "flex",
     justifyContent: "space-between",
     alignItems: "flex-start",
     marginBottom: 8,
    }}
   >
    <div>
     <p className="eyebrow" style={{ margin: 0 }}>Build Analysis</p>
     <strong style={{ fontSize: "0.95rem" }}>Profile Overview</strong>
    </div>
    <Activity size={20} style={{ color: "#8d95b3" }} />
   </div>

   <SectionHeader icon={<Swords size={14} />} label="Combat Profile" />
   <AnalysisRow label="Burst Potential" value={analysis.burstPotential} />
   <AnalysisRow label="Sustain Potential" value={analysis.sustainPotential} />
   <AnalysisRow label="PvP Leaning" value={analysis.pvpLeaning} />
   <AnalysisRow label="PvE Leaning" value={analysis.pveLeaning} />

   <SectionHeader icon={<Crosshair size={14} />} label="Dependencies" />
   <AnalysisRow label="Weakspot Dependency" value={analysis.weakspotDependency} />
   <AnalysisRow label="Crit Dependency" value={analysis.critDependency} />
   <AnalysisRow label="Elemental Reliance" value={analysis.elementalReliance} />

   <SectionHeader icon={<Shield size={14} />} label="Defense & Mobility" />
   {analysis.survivabilityNotes.map((note, i) => (
    <span key={i} style={{ fontSize: "0.8rem", color: "#bfc8e4", lineHeight: 1.4 }}>
     • {note}
    </span>
   ))}
   {analysis.mobilityAssumptions.map((note, i) => (
    <span key={`mob-${i}`} style={{ fontSize: "0.8rem", color: "#bfc8e4", lineHeight: 1.4 }}>
     • {note}
    </span>
   ))}

   {analysis.unresolvedMechanicWarnings.length > 0 && (
    <>
     <SectionHeader icon={<AlertTriangle size={14} />} label="Unresolved Mechanics" />
     {analysis.unresolvedMechanicWarnings.map((w, i) => (
      <span
       key={i}
       style={{
        fontSize: "0.8rem",
        padding: "6px 10px",
        borderRadius: 10,
        background: "rgba(231, 76, 60, 0.08)",
        border: "1px solid rgba(231, 76, 60, 0.18)",
        color: "#e67e44",
        lineHeight: 1.4,
       }}
      >
       ⚠ {w}
      </span>
     ))}
    </>
   )}

   {analysis.cradlePerkNames.length > 0 && (
    <>
     <SectionHeader icon={<Sparkles size={14} />} label="Cradle Overrides" />
     <div style={{ fontSize: "0.8rem", color: "#bfc8e4", lineHeight: 1.4, marginBottom: 4 }}>
      Active: {analysis.cradlePerkNames.join(", ")}
     </div>
     {analysis.cradleMechanicMatch.length > 0 && (
      <div style={{ fontSize: "0.76rem", color: "#2ecc71", marginBottom: 4 }}>
       {analysis.cradleMechanicMatch.map((m, i) => (
        <div key={i}>✓ {m}</div>
       ))}
      </div>
     )}
     {analysis.cradleUnsupported.length > 0 && (
      <div style={{ fontSize: "0.74rem", color: "#e67e44", marginTop: 4 }}>
       {analysis.cradleUnsupported.map((w, i) => (
        <div key={i}>⚠ {w}</div>
       ))}
      </div>
     )}
    </>
   )}

   {(analysis.pvpLeaning === "high" || analysis.pveLeaning === "high") && (
    <div
     style={{
      marginTop: 8,
      padding: 10,
      borderRadius: 12,
      background: "rgba(46, 204, 113, 0.08)",
      border: "1px solid rgba(46, 204, 113, 0.18)",
      fontSize: "0.78rem",
      color: "#2ecc71",
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
     }}
    >
     <Eye size={14} style={{ flexShrink: 0, marginTop: 1 }} />
     <span>
      {analysis.pvpLeaning === "high"
       ? "This build appears PvP-oriented. TTK projections depend on enemy mitigation profiles."
       : "This build appears PvE-oriented. Effectiveness varies by enemy type and resistances."}
     </span>
    </div>
   )}
  </div>
 );
}
