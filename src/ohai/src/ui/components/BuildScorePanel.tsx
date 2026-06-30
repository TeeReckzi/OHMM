import { useMemo } from "react";
import {
 AlertTriangle,
 BarChart3,
 Info,
 Shield,
 Swords,
 Zap,
} from "lucide-react";
import type { CalculationInput } from "../formulaBridge";
import type { CombatOutput } from "../combatOutput";
import type { BuildQualityScores, UptimeSensitivityAnalysis } from "../buildQualityScore";
import type { BuildRecommendation } from "../recommendationEngine";
import { computeBuildQualityScores } from "../buildQualityScore";
import { generateRecommendation } from "../recommendationEngine";

interface BuildScorePanelProps {
 calcInput: CalculationInput;
 output: CombatOutput;
 label?: string;
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

export function BuildScorePanel({ calcInput, output, label }: BuildScorePanelProps) {
 const buildData = useMemo(() => ({
  id: "current",
  label: label ?? "Current Build",
  selection: null as unknown as Parameters<typeof computeBuildQualityScores>[0]["selection"],
  calcInput,
  output,
 }), [calcInput, output, label]);

 const scores = useMemo<BuildQualityScores>(
  () => computeBuildQualityScores(buildData, calcInput),
  [buildData, calcInput],
 );

 const recommendation = useMemo<BuildRecommendation>(
  () => generateRecommendation(scores, { profiles: [], dropPercent: 0 }, { totalMechanics: 0, supportedCount: 0, partialCount: 0, pendingCount: 0, unsupportedCount: 0, unresolvedMechanics: [], modeledStatKeys: [], displayOnlyStatKeys: [], formulaWarnings: [] }, calcInput.buildMode === "pvp"),
  [scores, calcInput.buildMode],
 );

 return (
  <div style={{
   padding: 20, borderRadius: 26,
   border: "1px solid rgba(255,255,255,0.08)",
   background: "rgba(15, 18, 29, 0.78)",
   backdropFilter: "blur(16px)",
   display: "flex", flexDirection: "column", gap: 14,
  }}>
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
    <div>
     <p className="eyebrow" style={{ margin: 0 }}>Build Quality</p>
     <strong style={{ fontSize: "0.95rem" }}>{recommendation.playstyle.primary} · {recommendation.difficulty}</strong>
    </div>
    <BarChart3 size={20} style={{ color: "#8d95b3" }} />
   </div>

   {/* Overall */}
   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{
     width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
     fontSize: "1.1rem", fontWeight: 700,
     background: scores.summary.overall >= 7 ? "#2ecc7122" : scores.summary.overall >= 4 ? "#f39c1222" : "#e74c3c22",
     color: scores.summary.overall >= 7 ? "#2ecc71" : scores.summary.overall >= 4 ? "#f39c12" : "#e74c3c",
     border: scores.summary.overall >= 7 ? "2px solid #2ecc71" : scores.summary.overall >= 4 ? "2px solid #f39c12" : "2px solid #e74c3c",
    }}>
     {scores.summary.overall.toFixed(1)}
    </div>
    <div>
     <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#d7def2" }}>{scores.summary.label}</div>
     <div style={{ fontSize: "0.72rem", color: "#8d95b3" }}>{recommendation.playstyle.description}</div>
    </div>
   </div>

   {/* Scores */}
   <div>
    <SectionHeader icon={<BarChart3 size={14} color="#f39c12" />} label="Category Scores" />
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
     {[
      { label: "Damage Consistency", score: scores.damageConsistency },
      { label: "Survivability", score: scores.survivability },
      { label: "Mechanic Dependency", score: scores.mechanicDependency },
      { label: "Formula Confidence", score: scores.formulaConfidence },
      { label: "Uptime Sensitivity", score: scores.uptimeSensitivity },
      { label: "Execution Difficulty", score: scores.executionDifficulty },
     ].map((s) => (
      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "1px 0", fontSize: "0.76rem" }}>
       <span style={{ color: "#aab4cf", flex: 1 }}>{s.label}</span>
       <SuitabilityBar label="" score={s.score} />
      </div>
     ))}
    </div>
   </div>

   {/* Suitability */}
   <div>
    <SectionHeader icon={<Swords size={14} color="#f39c12" />} label="Suitability" />
    <SuitabilityBar label="PvP" score={recommendation.suitability.pvp} />
    <SuitabilityBar label="PvE" score={recommendation.suitability.pve} />
    <SuitabilityBar label="Burst" score={recommendation.suitability.burst} />
    <SuitabilityBar label="Sustain" score={recommendation.suitability.sustain} />
    <SuitabilityBar label="Beginner" score={recommendation.suitability.beginner} />
   </div>

   {/* Strengths & Weaknesses */}
   <div style={{ display: "flex", gap: 12 }}>
    <div style={{ flex: 1 }}>
     <SectionHeader icon={<Shield size={12} color="#2ecc71" />} label="Strengths" />
     <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.72rem", color: "#aab4cf", lineHeight: 1.5 }}>
      {scores.summary.strengths.length > 0
       ? scores.summary.strengths.map((s, i) => <li key={i}>{s}</li>)
       : <li style={{ color: "#8d95b3" }}>No synergies detected for this loadout.</li>}
     </ul>
    </div>
    <div style={{ flex: 1 }}>
     <SectionHeader icon={<AlertTriangle size={12} color="#e74c3c" />} label="Weaknesses" />
     <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.72rem", color: "#e8b88a", lineHeight: 1.5 }}>
      {scores.summary.weaknesses.length > 0
       ? scores.summary.weaknesses.map((w, i) => <li key={i}>{w}</li>)
       : <li style={{ color: "#8d95b3" }}>No synergies detected for this loadout.</li>}
     </ul>
    </div>
   </div>

   {/* Confidence */}
   <div>
    <SectionHeader icon={<Info size={14} color="#8d95b3" />} label="Recommendation Confidence" />
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
