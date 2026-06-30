import { useMemo, useState } from "react";
import { Sliders, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import type {
 UptimeProfileName,
 CombatStateAssumptions,
} from "../../engine/conditionalEffectTypes";
import type { DamageModelHypothesis } from "../../engine/formulaTypes";
import { defaultDamageModelHypothesis } from "../../engine/officialFormulaDefaults";
import {
 getUptimeProfile,
 deriveCustomProfile,
 isCustomProfile,
} from "../../engine/conditionalEffectEngine";

interface AssumptionControlCenterProps {
 uptimeProfile: UptimeProfileName;
 customAssumptions?: Partial<CombatStateAssumptions>;
 onProfileChange: (profile: UptimeProfileName) => void;
 onCustomAssumptionsChange: (assumptions: Partial<CombatStateAssumptions>) => void;
}

const ASSUMPTION_DEFS: {
 key: keyof CombatStateAssumptions;
 label: string;
 min: number;
 max: number;
 step: number;
 unit: string;
 render: (v: number) => string;
}[] = [
 { key: "weakspotAccuracy", label: "Weakspot Accuracy", min: 0, max: 1, step: 0.05, unit: "%", render: (v) => `${Math.round(v * 100)}%` },
 { key: "reloadsPerMinute", label: "Reloads / min", min: 0, max: 30, step: 1, unit: "", render: (v) => `${v}` },
 { key: "weaponSwapsPerMinute", label: "Weapon Swaps / min", min: 0, max: 15, step: 1, unit: "", render: (v) => `${v}` },
 { key: "procsPerMinute", label: "Proc Rate / min", min: 0, max: 60, step: 1, unit: "", render: (v) => `${v}` },
 { key: "elementalTriggersPerSecond", label: "Elemental Triggers / s", min: 0, max: 10, step: 0.5, unit: "", render: (v) => `${v.toFixed(1)}` },
 { key: "fastGunnerUptime", label: "Fast Gunner Uptime", min: 0, max: 1, step: 0.05, unit: "%", render: (v) => `${Math.round(v * 100)}%` },
 { key: "fortressWarfareUptime", label: "Fortress Warfare Uptime", min: 0, max: 1, step: 0.05, unit: "%", render: (v) => `${Math.round(v * 100)}%` },
 { key: "fightDurationSeconds", label: "Fight Duration", min: 5, max: 600, step: 5, unit: "s", render: (v) => `${v}s` },
 { key: "burstWindowSeconds", label: "Burst Window", min: 1, max: 60, step: 1, unit: "s", render: (v) => `${v}s` },
];

const MOVEMENT_OPTIONS: { value: CombatStateAssumptions["targetMovement"]; label: string }[] = [
 { value: "stationary", label: "Stationary" },
 { value: "low", label: "Low" },
 { value: "medium", label: "Medium" },
 { value: "high", label: "High" },
];

const DISTANCE_OPTIONS: { value: CombatStateAssumptions["distance"]; label: string }[] = [
 { value: "melee", label: "Melee" },
 { value: "close", label: "Close" },
 { value: "medium", label: "Medium" },
 { value: "far", label: "Far" },
];

const SAFE_RANGES: Partial<Record<keyof CombatStateAssumptions, { min: number; max: number }>> = {
 weakspotAccuracy: { min: 0, max: 1 },
 reloadsPerMinute: { min: 0, max: 30 },
 weaponSwapsPerMinute: { min: 0, max: 15 },
 procsPerMinute: { min: 0, max: 60 },
 elementalTriggersPerSecond: { min: 0, max: 10 },
 fastGunnerUptime: { min: 0, max: 1 },
 fortressWarfareUptime: { min: 0, max: 1 },
 targetMovement: { min: 0, max: 3 },
 distance: { min: 0, max: 3 },
 fightDurationSeconds: { min: 5, max: 600 },
 burstWindowSeconds: { min: 1, max: 60 },
};

function clampAssumption<T extends keyof CombatStateAssumptions>(
 key: T,
 value: number,
): number {
 const range = SAFE_RANGES[key];
 if (!range) return value;
 return Math.max(range.min, Math.min(range.max, value));
}

export function AssumptionControlCenter({
 uptimeProfile,
 customAssumptions,
 onProfileChange,
 onCustomAssumptionsChange,
}: AssumptionControlCenterProps) {
 const [expanded, setExpanded] = useState(false);
 const isCustom = isCustomProfile(uptimeProfile);

 const baseProfile = useMemo(() => getUptimeProfile(
  isCustom ? "realistic" : uptimeProfile,
 ), [uptimeProfile, isCustom]);

 const currentAssumptions = useMemo(() => {
  if (isCustom && customAssumptions) {
   return deriveCustomProfile("realistic", customAssumptions);
  }
  return baseProfile.combatAssumptions;
 }, [isCustom, customAssumptions, baseProfile]);

 const handleSlider = (key: keyof CombatStateAssumptions, raw: number) => {
  const clamped = clampAssumption(key, raw);
  onCustomAssumptionsChange({ ...customAssumptions, [key]: clamped });
 };

 const handleMovement = (value: CombatStateAssumptions["targetMovement"]) => {
  onCustomAssumptionsChange({ ...customAssumptions, targetMovement: value });
 };

 const handleDistance = (value: CombatStateAssumptions["distance"]) => {
  onCustomAssumptionsChange({ ...customAssumptions, distance: value });
 };

 const numericAssumptions = ASSUMPTION_DEFS;

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
     <p className="eyebrow" style={{ margin: 0, marginBottom: 4 }}>Combat Assumptions</p>
     <strong style={{ fontSize: "0.9rem" }}>Assumption Control Center</strong>
    </div>
    <Sliders size={20} style={{ color: "#8d95b3" }} />
   </div>

   {/* Profile selector */}
   <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {(["conservative", "realistic", "optimized", "perfect", "custom"] as UptimeProfileName[]).map((p) => (
     <button
      key={p}
      onClick={() => {
       onProfileChange(p);
       if (p !== "custom") setExpanded(false);
       if (p === "custom") setExpanded(true);
      }}
      style={{
       fontSize: "0.72rem",
       padding: "4px 12px",
       borderRadius: 999,
       border: `1px solid ${uptimeProfile === p ? "rgba(137,108,255,0.4)" : "rgba(255,255,255,0.08)"}`,
       background: uptimeProfile === p ? "rgba(137,108,255,0.14)" : "rgba(255,255,255,0.03)",
       color: uptimeProfile === p ? "#b9c4ff" : "#8d95b3",
       cursor: "pointer",
       transition: "border-color 140ms, background 140ms",
      }}
     >
      {p === "custom" ? "Custom" : p.charAt(0).toUpperCase() + p.slice(1)}
     </button>
    ))}
   </div>

   {/* Profile description */}
   <div style={{ fontSize: "0.74rem", color: "#8d95b3", fontStyle: "italic", lineHeight: 1.4 }}>
    {baseProfile.description}
    {isCustom && " User-defined overrides active."}
   </div>

   {/* Damage Model picker — always visible */}
   <div style={{
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
   }}>
    <span style={{ fontSize: "0.76rem", color: "#aab4cf", fontWeight: 500 }}>Damage Model Hypothesis</span>
    {([
     {
      mechanic: "frostVortex" as const,
      label: "Frost Vortex",
      options: [
       { value: "frost-vortex-DoT-tick" as DamageModelHypothesis, label: "DoT Tick (Hypothesis A)" },
       { value: "frost-vortex-single-hit" as DamageModelHypothesis, label: "Single Hit (Hypothesis B)" },
      ],
     },
     {
      mechanic: "powerSurge" as const,
      label: "Power Surge",
      options: [
       { value: "power-surge-DoT-tick" as DamageModelHypothesis, label: "DoT Tick (Hypothesis A)" },
       { value: "power-surge-hybrid" as DamageModelHypothesis, label: "Hybrid (Hypothesis C)" },
      ],
     },
     {
      mechanic: "ebrFireRing" as const,
      label: "EBR Fire Ring",
      options: [
       { value: "ebr-fire-ring-provisional" as DamageModelHypothesis, label: "Provisional (No Formula)" },
      ],
     },
    ]).map(({ mechanic, label, options }) => {
     const currentOverride = customAssumptions?.damageModelOverride?.[mechanic];
     const currentValue = currentOverride ?? defaultDamageModelHypothesis(mechanic);
     return (
      <div key={mechanic} style={{ display: "flex", alignItems: "center", gap: 8 }}>
       <span style={{ fontSize: "0.72rem", color: "#8d95b3", minWidth: 90 }}>{label}</span>
       <select
        value={currentValue}
        onChange={(e) => {
         const newValue = e.target.value as DamageModelHypothesis;
         const currentOverrides = customAssumptions?.damageModelOverride ?? {};
         onCustomAssumptionsChange({
          ...customAssumptions,
          damageModelOverride: {
           ...currentOverrides,
           [mechanic]: newValue,
          },
         });
        }}
        style={{
         flex: 1,
         fontSize: "0.7rem",
         padding: "3px 8px",
         borderRadius: 6,
         border: "1px solid rgba(255,255,255,0.1)",
         background: "rgba(15, 18, 29, 0.9)",
         color: "#d7def2",
         cursor: "pointer",
         outline: "none",
        }}
       >
        {options.map((opt) => (
         <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
       </select>
      </div>
     );
    })}
    <div style={{ fontSize: "0.66rem", color: "#6b7394", fontStyle: "italic", marginTop: 2 }}>
     Provisional model selections — in-game confirmation pending for all hypotheses.
    </div>
   </div>

   {/* Custom mode expand/collapse */}
   {isCustom && (
    <button
     onClick={() => setExpanded(!expanded)}
     style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: "0.78rem",
      color: "#8d95b3",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px 0",
     }}
    >
     {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
     {expanded ? "Hide assumption controls" : "Show assumption controls"}
    </button>
   )}

   {/* Custom controls */}
   {isCustom && expanded && (
    <div
     style={{
      padding: 16,
      borderRadius: 14,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
     }}
    >
     {/* Numeric sliders */}
     {numericAssumptions.map((def) => {
      const value = currentAssumptions[def.key] as number;
      return (
       <div key={def.key} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
         <span style={{ color: "#aab4cf" }}>{def.label}</span>
         <span style={{ color: "#d7def2", fontWeight: 500 }}>{def.render(value)}</span>
        </div>
        <input
         type="range"
         min={def.min}
         max={def.max}
         step={def.step}
         value={value}
         onChange={(e) => handleSlider(def.key, parseFloat(e.target.value))}
         style={{
          width: "100%",
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(to right, #8970ff ${(value - def.min) / (def.max - def.min) * 100}%, rgba(255,255,255,0.08) ${(value - def.min) / (def.max - def.min) * 100}%)`,
          WebkitAppearance: "none",
          appearance: "none",
          outline: "none",
         }}
        />
       </div>
      );
     })}

     {/* Target Movement selector */}
     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: "0.74rem", color: "#aab4cf" }}>Target Movement</span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
       {MOVEMENT_OPTIONS.map((opt) => (
        <button
         key={opt.value}
         onClick={() => handleMovement(opt.value)}
         style={{
          fontSize: "0.7rem",
          padding: "3px 10px",
          borderRadius: 999,
          border: `1px solid ${currentAssumptions.targetMovement === opt.value ? "rgba(137,108,255,0.4)" : "rgba(255,255,255,0.08)"}`,
          background: currentAssumptions.targetMovement === opt.value ? "rgba(137,108,255,0.14)" : "rgba(255,255,255,0.03)",
          color: currentAssumptions.targetMovement === opt.value ? "#b9c4ff" : "#8d95b3",
          cursor: "pointer",
         }}
        >
         {opt.label}
        </button>
       ))}
      </div>
     </div>

     {/* Distance selector */}
     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: "0.74rem", color: "#aab4cf" }}>Distance</span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
       {DISTANCE_OPTIONS.map((opt) => (
        <button
         key={opt.value}
         onClick={() => handleDistance(opt.value)}
         style={{
          fontSize: "0.7rem",
          padding: "3px 10px",
          borderRadius: 999,
          border: `1px solid ${currentAssumptions.distance === opt.value ? "rgba(137,108,255,0.4)" : "rgba(255,255,255,0.08)"}`,
          background: currentAssumptions.distance === opt.value ? "rgba(137,108,255,0.14)" : "rgba(255,255,255,0.03)",
          color: currentAssumptions.distance === opt.value ? "#b9c4ff" : "#8d95b3",
          cursor: "pointer",
         }}
        >
         {opt.label}
        </button>
       ))}
      </div>
     </div>

     {/* Custom badge */}
     <div style={{
      fontSize: "0.7rem",
      color: "#f39c12",
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
     }}>
      <AlertTriangle size={11} />
      <span>User assumptions — values are user-controlled, not canonical.</span>
     </div>
    </div>
   )}
  </div>
 );
}
