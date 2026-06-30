import { useMemo } from "react";
import {
 AlertTriangle,
 ArrowLeftRight,
 BarChart3,
 Info,
 Shield,
 Swords,
 Zap,
} from "lucide-react";
import type { BuildComparisonResult } from "../buildComparisonEngine";
import type { BuildQualityScores } from "../buildQualityScore";
import type { BuildRecommendation } from "../recommendationEngine";
import { generateRecommendation } from "../recommendationEngine";

interface BuildComparisonPanelProps {
 result: BuildComparisonResult;
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
 return (
  <div style={{
   display: "flex", alignItems: "center", gap: 8,
   fontSize: "0.76rem", color: "#8d95b3",
   letterSpacing: "0.06em", textTransform: "uppercase",
   marginBottom: 8, marginTop: 4,
  }}>
   {icon}
   <span>{label}</span>
  </div>
 );
}

function ScoreBar({ label, a, b }: { label: string; a: number; b: number }) {
 const diff = a - b;
 const icon = diff > 0.5 ? "\u25B2" : diff < -0.5 ? "\u25BC" : "\u25C6";
 const color = diff > 0.5 ? "#2ecc71" : diff < -0.5 ? "#e74c3c" : "#95a5a6";
 return (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
   <span style={{ color: "#aab4cf", flex: 1 }}>{label}</span>
   <span style={{ color: "#8d95b3", fontSize: "0.72rem" }}>{a.toFixed(1)}</span>
   <span style={{ color, fontSize: "0.72rem", width: 16, textAlign: "center" }}>{icon}</span>
   <span style={{ color: "#8d95b3", fontSize: "0.72rem" }}>{b.toFixed(1)}</span>
  </div>
 );
}

function ScoreBadge({ score }: { score: number }) {
 const color = score >= 7 ? "#2ecc71" : score >= 4 ? "#f39c12" : "#e74c3c";
 const label = score >= 7 ? "High" : score >= 4 ? "Med" : "Low";
 return (
  <span style={{
   padding: "1px 8px", borderRadius: 10, fontSize: "0.68rem", fontWeight: 600,
   background: color + "22", color,
   letterSpacing: "0.04em",
  }}>
   {label}
  </span>
 );
}

function SuitabilityBar({ label, score }: { label: string; score: number }) {
 const pct = Math.round((score / 10) * 100);
 const color = score >= 7 ? "#2ecc71" : score >= 4 ? "#f39c12" : "#e74c3c";
 return (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "1px 0", fontSize: "0.76rem" }}>
   <span style={{ color: "#aab4cf", width: 80, flexShrink: 0 }}>{label}</span>
   <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.3s" }} />
   </div>
   <span style={{ color: "#8d95b3", width: 20, textAlign: "right", fontSize: "0.68rem" }}>{score}</span>
  </div>
 );
}

function BuildScoreCard({ label, scores, recommendation }: { label: string; scores: BuildQualityScores; recommendation: BuildRecommendation }) {
 return (
  <div style={{
   flex: 1, padding: 14, borderRadius: 16,
   border: "1px solid rgba(255,255,255,0.06)",
   background: "rgba(15, 18, 29, 0.5)",
   display: "flex", flexDirection: "column", gap: 10,
   fontSize: "0.8rem",
  }}>
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <strong style={{ color: "#d7def2", fontSize: "0.85rem" }}>{label}</strong>
    <span style={{
     padding: "2px 10px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 600,
     background: scores.summary.overall >= 7 ? "#2ecc7122" : scores.summary.overall >= 4 ? "#f39c1222" : "#e74c3c22",
     color: scores.summary.overall >= 7 ? "#2ecc71" : scores.summary.overall >= 4 ? "#f39c12" : "#e74c3c",
    }}>
     {scores.summary.label}
    </span>
   </div>

   <div style={{ display: "flex", flexDirection: "column" }}>
    <ScoreBadge score={scores.damageConsistency} />
    <span style={{ color: "#aab4cf", fontSize: "0.72rem" }}>DMG Consistency: {scores.damageConsistency.toFixed(1)}</span>
    <span style={{ color: "#aab4cf", fontSize: "0.72rem" }}>Survivability: {scores.survivability.toFixed(1)}</span>
    <span style={{ color: "#aab4cf", fontSize: "0.72rem" }}>Mech Dependency: {scores.mechanicDependency.toFixed(1)}</span>
    <span style={{ color: "#aab4cf", fontSize: "0.72rem" }}>Formula Confidence: {scores.formulaConfidence.toFixed(1)}</span>
    <span style={{ color: "#aab4cf", fontSize: "0.72rem" }}>Uptime Sensitivity: {scores.uptimeSensitivity.toFixed(1)}</span>
    <span style={{ color: "#aab4cf", fontSize: "0.72rem" }}>Execution Difficulty: {scores.executionDifficulty.toFixed(1)}</span>
   </div>

   <div>
    <SectionHeader icon={<Swords size={12} color="#f39c12" />} label="Suitability" />
    <SuitabilityBar label="PvP" score={recommendation.suitability.pvp} />
    <SuitabilityBar label="PvE" score={recommendation.suitability.pve} />
    <SuitabilityBar label="Burst" score={recommendation.suitability.burst} />
    <SuitabilityBar label="Sustain" score={recommendation.suitability.sustain} />
    <SuitabilityBar label="Beginner" score={recommendation.suitability.beginner} />
   </div>

   <div>
    <SectionHeader icon={<Zap size={12} color="#2ecc71" />} label="Playstyle" />
    <div style={{ fontSize: "0.76rem", color: "#aab4cf", lineHeight: 1.4 }}>
     <strong style={{ color: "#d7def2" }}>{recommendation.playstyle.primary}</strong>
     {recommendation.playstyle.secondary && <span> / {recommendation.playstyle.secondary}</span>}
     <div style={{ marginTop: 4, fontSize: "0.72rem" }}>{recommendation.playstyle.description}</div>
     <div style={{ marginTop: 4, color: "#8d95b3" }}>Difficulty: <strong style={{ color: "#d7def2" }}>{recommendation.difficulty}</strong></div>
    </div>
   </div>

   <div>
    <SectionHeader icon={<Info size={12} color="#3498db" />} label="Strengths" />
    {scores.summary.strengths.length > 0 ? (
     <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.72rem", color: "#aab4cf", lineHeight: 1.5 }}>
      {scores.summary.strengths.map((s, i) => <li key={i}>{s}</li>)}
     </ul>
    ) : (
     <span style={{ fontSize: "0.72rem", color: "#8d95b3" }}>No clear strengths identified.</span>
    )}
   </div>

   <div>
    <SectionHeader icon={<AlertTriangle size={12} color="#e74c3c" />} label="Weaknesses" />
    {scores.summary.weaknesses.length > 0 ? (
     <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.72rem", color: "#e8b88a", lineHeight: 1.5 }}>
      {scores.summary.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
     </ul>
    ) : (
     <span style={{ fontSize: "0.72rem", color: "#8d95b3" }}>No major weaknesses identified.</span>
    )}
   </div>

   <div>
    <SectionHeader icon={<BarChart3 size={12} color="#8d95b3" />} label="Confidence" />
    <span style={{
     padding: "1px 8px", borderRadius: 10, fontSize: "0.68rem", fontWeight: 600,
     background: recommendation.confidence.level === "high" ? "#2ecc7122" : recommendation.confidence.level === "medium" ? "#f39c1222" : "#e74c3c22",
     color: recommendation.confidence.level === "high" ? "#2ecc71" : recommendation.confidence.level === "medium" ? "#f39c12" : "#e74c3c",
    }}>
     {recommendation.confidence.level.toUpperCase()}
    </span>
    <div style={{ fontSize: "0.72rem", color: "#8d95b3", marginTop: 4 }}>{recommendation.confidence.reason}</div>
   </div>
  </div>
 );
}

function AssumptionCard({ recommendation }: { recommendation: BuildRecommendation }) {
 if (recommendation.assumptions.length === 0) return null;
 return (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
   <SectionHeader icon={<Info size={14} color="#3498db" />} label="Assumption Recommendations" />
   {recommendation.assumptions.map((a, i) => {
    const borderColor = a.severity === "critical" ? "#e74c3c" : a.severity === "warning" ? "#f39c12" : "#3498db";
    const bgColor = a.severity === "critical" ? "rgba(231,76,60,0.06)" : a.severity === "warning" ? "rgba(243,156,18,0.06)" : "rgba(52,152,219,0.06)";
    return (
     <div key={i} style={{
      padding: "10px 14px", borderRadius: 12,
      border: `1px solid ${borderColor}22`,
      background: bgColor,
     }}>
      <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "#d7def2", marginBottom: 4 }}>
       {a.condition}
      </div>
      <div style={{ fontSize: "0.74rem", color: "#aab4cf", lineHeight: 1.4 }}>{a.advice}</div>
     </div>
    );
   })}
  </div>
 );
}

export function BuildComparisonPanel({ result }: BuildComparisonPanelProps) {
 const recA = useMemo(() => generateRecommendation(
  result.scoring.buildA,
  result.sensitivity.buildA,
  result.mechanicDependency.buildA,
  result.buildA.calcInput.buildMode === "pvp",
 ), [result]);
 const recB = useMemo(() => generateRecommendation(
  result.scoring.buildB,
  result.sensitivity.buildB,
  result.mechanicDependency.buildB,
  result.buildB.calcInput.buildMode === "pvp",
 ), [result]);

 const isPvP = result.buildA.calcInput.buildMode === "pvp";

 return (
  <div style={{
   padding: 20, borderRadius: 26,
   border: "1px solid rgba(255,255,255,0.08)",
   background: "rgba(15, 18, 29, 0.78)",
   backdropFilter: "blur(16px)",
   display: "flex", flexDirection: "column", gap: 16,
  }}>
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
    <div>
     <p className="eyebrow" style={{ margin: 0 }}>Build Comparison</p>
     <strong style={{ fontSize: "0.95rem" }}>Side-by-Side Analysis</strong>
    </div>
    <ArrowLeftRight size={20} style={{ color: "#8d95b3" }} />
   </div>

   {/* Delta Summary Strip */}
   <div style={{
    display: "flex", gap: 12, flexWrap: "wrap",
    padding: "10px 14px", borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    fontSize: "0.78rem",
   }}>
    <span>
     DMG: <strong style={{
      color: result.deltas.damageLabel === "Increased" ? "#2ecc71" : result.deltas.damageLabel === "Decreased" ? "#e74c3c" : "#95a5a6",
     }}>{result.deltas.damageLabel}</strong>
     <span style={{ color: "#8d95b3", marginLeft: 4 }}>({result.deltas.outgoingDamagePct})</span>
    </span>
    <span>
     DPS: <strong style={{
      color: result.deltas.dpsDelta > 0 ? "#2ecc71" : result.deltas.dpsDelta < 0 ? "#e74c3c" : "#95a5a6",
     }}>{result.deltas.dpsDelta > 0 ? "+" : ""}{result.deltas.dpsDelta.toFixed(2)}</strong>
    </span>
    <span>
     Surv: <strong style={{
      color: result.deltas.survivabilityLabel === "Improved" ? "#2ecc71" : result.deltas.survivabilityLabel === "Reduced" ? "#e74c3c" : "#95a5a6",
     }}>{result.deltas.survivabilityLabel}</strong>
    </span>
    {result.deltas.effectiveHPPct !== undefined && (
     <span>
      EHP: <strong style={{
       color: (result.deltas.effectiveHPDelta ?? 0) > 0 ? "#2ecc71" : (result.deltas.effectiveHPDelta ?? 0) < 0 ? "#e74c3c" : "#95a5a6",
      }}>{result.deltas.effectiveHPPct}</strong>
     </span>
    )}
    {isPvP && result.deltas.ttkDelta !== undefined && (
     <span>
      TTK: <strong style={{
       color: result.deltas.ttkDirection === "faster" ? "#2ecc71" : result.deltas.ttkDirection === "slower" ? "#e74c3c" : "#95a5a6",
      }}>{result.deltas.ttkDirection}</strong>
     </span>
    )}
   </div>

   {/* Score Comparison */}
   <div>
    <SectionHeader icon={<BarChart3 size={14} color="#f39c12" />} label="Score Comparison" />
    <div style={{ borderRadius: 12, padding: "6px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
     <ScoreBar label="DMG Consistency" a={result.scoring.buildA.damageConsistency} b={result.scoring.buildB.damageConsistency} />
     <ScoreBar label="Survivability" a={result.scoring.buildA.survivability} b={result.scoring.buildB.survivability} />
     <ScoreBar label="Mech Dependency" a={result.scoring.buildA.mechanicDependency} b={result.scoring.buildB.mechanicDependency} />
     <ScoreBar label="Formula Confidence" a={result.scoring.buildA.formulaConfidence} b={result.scoring.buildB.formulaConfidence} />
     <ScoreBar label="Uptime Sensitivity" a={result.scoring.buildA.uptimeSensitivity} b={result.scoring.buildB.uptimeSensitivity} />
     <ScoreBar label="Execution Difficulty" a={result.scoring.buildA.executionDifficulty} b={result.scoring.buildB.executionDifficulty} />
     <ScoreBar label="Overall" a={result.scoring.buildA.summary.overall} b={result.scoring.buildB.summary.overall} />
    </div>
   </div>

   {/* Side-by-Side Build Cards */}
   <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
    <BuildScoreCard label={result.buildA.label} scores={result.scoring.buildA} recommendation={recA} />
    <BuildScoreCard label={result.buildB.label} scores={result.scoring.buildB} recommendation={recB} />
   </div>

   {/* Recommendation */}
   <div>
    <SectionHeader icon={<Info size={14} color="#3498db" />} label="Recommendation Highlights" />
    <AssumptionCard recommendation={recA} />
    <AssumptionCard recommendation={recB} />
   </div>

   {/* Warnings */}
   {result.warnings.length > 0 && (
    <div style={{
     padding: 12, borderRadius: 14,
     background: "rgba(231, 76, 60, 0.06)",
     border: "1px solid rgba(231, 76, 60, 0.15)",
    }}>
     <SectionHeader icon={<AlertTriangle size={14} color="#e74c3c" />} label="Comparison Warnings" />
     <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {result.warnings.map((w, i) => (
       <span key={i} style={{ fontSize: "0.78rem", color: "#e8b88a", lineHeight: 1.4, padding: "2px 0" }}>
        {w}
       </span>
      ))}
     </div>
    </div>
   )}

   {/* Mechanic Dependency */}
   <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
    <div style={{ flex: 1, padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
     <div style={{ fontSize: "0.72rem", color: "#8d95b3", marginBottom: 6 }}>{result.buildA.label} — Mechanics</div>
     <MechanicSummary dep={result.mechanicDependency.buildA} />
    </div>
    <div style={{ flex: 1, padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
     <div style={{ fontSize: "0.72rem", color: "#8d95b3", marginBottom: 6 }}>{result.buildB.label} — Mechanics</div>
     <MechanicSummary dep={result.mechanicDependency.buildB} />
    </div>
   </div>
  </div>
 );
}

function MechanicSummary({ dep }: { dep: { supportedCount: number; partialCount: number; pendingCount: number; unsupportedCount: number; unresolvedMechanics: string[] } }) {
 return (
  <div style={{ fontSize: "0.72rem", color: "#aab4cf", display: "flex", flexDirection: "column", gap: 2 }}>
   <span>Modeled: {dep.supportedCount} | Partial: {dep.partialCount} | Pending: {dep.pendingCount} | Display-only: {dep.unsupportedCount}</span>
   {dep.unresolvedMechanics.length > 0 && (
    <div style={{ marginTop: 4 }}>
     <span style={{ color: "#e8b88a" }}>Unresolved: {dep.unresolvedMechanics.join(", ")}</span>
    </div>
   )}
  </div>
 );
}
