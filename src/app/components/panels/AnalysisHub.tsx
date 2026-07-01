import React, { useState } from "react";
import {
  Search, X, Crosshair, Activity, Settings, Star,
  ChevronDown, ChevronUp, Cpu,
  CheckCircle2, RefreshCw, Zap,
  Flame, Bomb, Filter,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { GlassPanel, PanelSection, StatChip, SimReady, TT_STYLE, pct, num, statValue } from "../ui/Primitives";
import { CYAN, VIOLET, ORANGE, GREEN } from "../../types";

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

function buildTelemetryPie(calcInput: any, combatOutput: any): Array<{ name: string; value: number; color: string }> {
  const sources = calcInput?.modifierSources || [];
  const counts: Record<string, number> = {};
  for (const source of sources) {
    const label = source.sourceType || "other";
    counts[label] = (counts[label] || 0) + 1;
  }
  const data = [
    { name: "Weapon", value: counts.weapon || 0, color: CYAN },
    { name: "Mods", value: (counts.mod || 0) + (counts.modSuffix || 0), color: VIOLET },
    { name: "Set", value: counts.setBonus || 0, color: GREEN },
    { name: "Food", value: counts.food || 0, color: ORANGE },
    { name: "Calib", value: counts.calibration || 0, color: "#fb923c" },
  ].filter((entry) => entry.value > 0);

  if (data.length > 0) return data;
  const expected = combatOutput?.damageOutput?.expectedDamage || 0;
  return expected > 0 ? [{ name: "Base", value: Math.round(expected), color: CYAN }] : [];
}

function buildStatusTimeline(calcInput: any): Array<{ t: string; burn: number; frost: number; surge: number }> {
  const burn = statValue(calcInput, "burnDMGBonus") + statValue(calcInput, "statusDMGBonus");
  const frost = statValue(calcInput, "frostVortexDMGBonus");
  const surge = statValue(calcInput, "powerSurgeDMGBonus") + statValue(calcInput, "elementalDMGBonus");
  const hasStatus = burn > 0 || frost > 0 || surge > 0 || (calcInput?.availableMechanics || []).some((m: string) => /burn|frost|surge|status|elemental/i.test(m));

  return Array.from({ length: 12 }, (_, i) => {
    const progress = (i + 1) / 12;
    return {
      t: `${(i * 0.5).toFixed(1)}s`,
      burn: hasStatus ? Math.round((burn || 0.12) * 100 * Math.min(1, progress * 2)) : 0,
      frost: hasStatus ? Math.round((frost || 0) * 100 * Math.sin(progress * Math.PI)) : 0,
      surge: hasStatus ? Math.round((surge || 0) * 100 * Math.min(1, progress * 1.5)) : 0,
    };
  });
}

function buildMitigationRows(calcInput: any, combatOutput: any) {
  const pvp = calcInput?.pvpMitigation;
  const effectiveHealthGain = (combatOutput?.survivability?.survivabilityGainPercent || 0) / 100;
  return [
    { label: "DMG Reduction", value: statValue(calcInput, "dmgReduction"), color: CYAN },
    { label: "Player DMG Red.", value: statValue(calcInput, "playerDMGReduction"), color: VIOLET },
    { label: "Status Resist", value: statValue(calcInput, "statusDMGReduction"), color: ORANGE },
    { label: pvp?.pvpMode ? "PvP Total" : "EHP Gain", value: pvp?.pvpMode ? (pvp.totalReductionPercent || 0) / 100 : effectiveHealthGain, color: GREEN },
  ];
}

// ─────────────────────────────────────────────────────────────
// SUB-PANELS
// ─────────────────────────────────────────────────────────────

function CombatResolver({ offOutput, defOutput, calcInput }: { offOutput: any; defOutput: any; calcInput?: any }) {
  const dps = offOutput?.damageOutput?.DPS || offOutput?.damageOutput?.expectedDamage || 0;
  const defDps = defOutput?.damageOutput?.DPS || defOutput?.damageOutput?.expectedDamage || 0;
  const barData = [{ name: 'DPS', off: Math.round(dps), def: Math.round(defDps) }];
  const expectedDamage = offOutput?.damageOutput?.expectedDamage || 0;
  const targetHealth = 8000;
  const expectedTtk = dps > 0 ? targetHealth / dps : undefined;
  const optimalTtk = dps > 0 ? targetHealth / (dps * 1.2) : undefined;
  const worstTtk = dps > 0 ? targetHealth / (dps * 0.75) : undefined;

  // Surface active armor set bonuses (hooked via loadoutEffectResolver → armorSetBonusResolver)
  const setBonuses = (calcInput?.modeledEffects || []).concat(calcInput?.partiallyModeledEffects || [])
    .filter((e: any) => e && (e.category === 'armor-set-bonus' || e.itemId?.includes('set-')));
  const activeSetNames = Array.from(new Set(setBonuses.map((e: any) => e.itemName || e.itemId))).slice(0, 3);
  return (
    <GlassPanel className="p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <PanelSection label="Combat Resolver" accent={CYAN} />
        <span className="text-[8px] px-1.5 py-0.5 rounded-full"
          style={{ background: offOutput ? "rgba(74,222,128,0.08)" : "rgba(120,120,120,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: offOutput ? GREEN : "#666" }}>
          {offOutput ? 'LIVE' : 'AWAITING DATA'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatChip label="Sustained DPS" value={dps ? Math.round(dps).toLocaleString() : "—"} color={CYAN} />
        <StatChip label="Burst DPS (2s)" value={dps ? Math.round(dps * 1.6).toLocaleString() : "—"} color={VIOLET} />
        <StatChip label="Est. TTK" value={expectedTtk ? `${expectedTtk.toFixed(1)}s` : "—"} color={GREEN} />
      </div>
      <div>
        <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: "#6aa8c0" }}>
          DAMAGE BREAKDOWN — OFF vs DEF
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,200,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: "#90cce0", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#90cce0", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT_STYLE} cursor={{ fill: "rgba(0,200,255,0.04)" }} />
            <Bar dataKey="off" name="Offensive" fill={CYAN} fillOpacity={0.65} radius={[2, 2, 0, 0]} />
            <Bar dataKey="def" name="Defensive" fill={ORANGE} fillOpacity={0.65} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: "#6aa8c0" }}>TTK SCENARIOS</div>
        <div className="flex gap-2">
          {[
            { label: "Optimal", color: GREEN, value: optimalTtk },
            { label: "Expected", color: CYAN, value: expectedTtk },
            { label: "Worst Case", color: ORANGE, value: worstTtk },
          ].map(s => (
            <div key={s.label} className="flex-1">
              <div className="flex justify-between text-[8px] mb-0.5">
                <span style={{ color: "#7ab8cc" }}>{s.label}</span>
                <span style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value ? `${s.value.toFixed(1)}s` : "—"}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: s.value && worstTtk ? `${Math.max(8, Math.min(100, (1 - s.value / worstTtk) * 100))}%` : "0%", background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {expectedDamage > 0 && (
        <div className="text-[8px]" style={{ color: "#7ab8cc" }}>
          Expected hit: <span style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(expectedDamage).toLocaleString()}</span>
        </div>
      )}
      {activeSetNames.length > 0 && (
        <div className="text-[8px] mt-1" style={{ color: "#8bd4a0" }}>
          Set bonuses active: {activeSetNames.join(" • ")}
        </div>
      )}
    </GlassPanel>
  );
}

function StatusEngine({ calcInput }: { calcInput?: any }) {
  const data = buildStatusTimeline(calcInput);
  const burnBonus = statValue(calcInput, "burnDMGBonus") + statValue(calcInput, "statusDMGBonus");
  const frostBonus = statValue(calcInput, "frostVortexDMGBonus");
  const surgeBonus = statValue(calcInput, "powerSurgeDMGBonus") + statValue(calcInput, "elementalDMGBonus");
  const hasStatus = burnBonus > 0 || frostBonus > 0 || surgeBonus > 0;
  return (
    <GlassPanel className="p-3 flex flex-col gap-3" accent={VIOLET}>
      <PanelSection label="Status Engine" accent={VIOLET} />
      <div className="grid grid-cols-3 gap-1.5">
        <StatChip label="Burn/Status" value={hasStatus ? pct(burnBonus) : "—"} color={ORANGE} />
        <StatChip label="Frost" value={frostBonus > 0 ? pct(frostBonus) : "—"} color="#38bdf8" />
        <StatChip label="Surge/Elem." value={surgeBonus > 0 ? pct(surgeBonus) : "—"} color={VIOLET} />
      </div>
      <div>
        <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: "#6aa8c0" }}>
          STATUS INTENSITY OVER COMBAT DURATION
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="se-gBurn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ORANGE} stopOpacity={0.4} />
                <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="se-gFrost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="se-gSurge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={VIOLET} stopOpacity={0.35} />
                <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fill: "#90cce0", fontSize: 8 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "#90cce0", fontSize: 8 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT_STYLE} />
            <Area type="monotone" dataKey="burn" name="Burn" stroke={ORANGE} fill="url(#se-gBurn)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="frost" name="Frost" stroke="#38bdf8" fill="url(#se-gFrost)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="surge" name="Power Surge" stroke={VIOLET} fill="url(#se-gSurge)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!hasStatus && (
        <div className="text-[9px]" style={{ color: "#6aa8c0" }}>
          No structured status modifiers detected in the active loadout.
        </div>
      )}
    </GlassPanel>
  );
}

function CombatTelemetry({ calcInput, combatOutput }: { calcInput?: any; combatOutput?: any }) {
  const data = buildTelemetryPie(calcInput, combatOutput);
  const critRate = (calcInput?.baseCritRate ?? 0) + statValue(calcInput, "critRate");
  const critDmg = (calcInput?.baseCritDamage ?? 0) + statValue(calcInput, "critDMG");
  const procRate = combatOutput?.damageOutput?.ticksPerSecond;
  const modifierCount = calcInput?.modifierSources?.length || 0;
  return (
    <GlassPanel className="p-3 flex flex-col gap-3" accent={ORANGE}>
      <PanelSection label="Combat Telemetry" accent={ORANGE} />
      <div className="flex gap-3 items-center">
        <div style={{ width: 100, height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={26} outerRadius={44}
                dataKey="value" stroke="none" opacity={0.3}>
                {data.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1">
          {data.map((d: any) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[9px]">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40"
                style={{ background: d.color }} />
              <span style={{ color: "#7ab8cc" }}>{d.name}</span>
              <span className="ml-auto" style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: "Crit Rate", color: VIOLET, value: pct(critRate) },
          { label: "Crit Dmg", color: VIOLET, value: pct(critDmg) },
          { label: "Proc/s", color: ORANGE, value: procRate ? num(procRate, 2) : "—" },
          { label: "Mods", color: GREEN, value: String(modifierCount) },
        ].map(s => (
          <div key={s.label} className="p-1.5 rounded-[3px] text-center"
            style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${s.color}18` }}>
            <div className="text-[8px]" style={{ color: "#6aa8c0" }}>{s.label}</div>
            <div className="text-[11px] font-bold"
              style={{ color: s.color, opacity: s.value === "—" ? 0.45 : 1, fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function MitigationAnalysis({ calcInput, combatOutput }: { calcInput?: any; combatOutput?: any }) {
  const rows = buildMitigationRows(calcInput, combatOutput);
  const hasAny = rows.some((row) => row.value > 0);
  return (
    <GlassPanel className="p-3 flex flex-col gap-3">
      <PanelSection label="Mitigation Analysis" accent={CYAN} />
      <div className="grid grid-cols-2 gap-2">
        {rows.map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-[8px] mb-0.5">
              <span style={{ color: "#7ab8cc" }}>{s.label}</span>
              <span style={{ color: s.color, opacity: s.value > 0 ? 1 : 0.5, fontFamily: "'JetBrains Mono', monospace" }}>{s.value > 0 ? pct(s.value) : "—"}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, s.value * 100))}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
      {!hasAny ? (
        <SimReady text="No mitigation modifiers detected in current loadout" />
      ) : (
        <div className="text-[9px]" style={{ color: "#6aa8c0" }}>
          Effective health multiplier: <span style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
            {combatOutput?.survivability?.effectiveHealthMultiplier ? `${combatOutput.survivability.effectiveHealthMultiplier}x` : "—"}
          </span>
        </div>
      )}
    </GlassPanel>
  );
}

const SIM_EVENT_TYPES: Array<{ t: string; icon: React.ReactNode; label: string; color: string }> = [
  { t: "0.00s", icon: <Zap size={11} />, label: "Shot Fired", color: CYAN },
  { t: "0.08s", icon: <Crosshair size={11} />, label: "Hit Registered", color: "#60a5fa" },
  { t: "0.30s", icon: <Flame size={11} />, label: "Status Applied", color: ORANGE },
  { t: "0.80s", icon: <Activity size={11} />, label: "DoT Tick", color: ORANGE },
  { t: "1.00s", icon: <Star size={11} />, label: "Critical Hit", color: VIOLET },
  { t: "1.50s", icon: <Cpu size={11} />, label: "Mod Proc", color: VIOLET },
  { t: "2.00s", icon: <Bomb size={11} />, label: "Explosion / Detonation", color: "#fb923c" },
  { t: "3.10s", icon: <CheckCircle2 size={11} />, label: "Target Eliminated", color: GREEN },
];

function SimulationTimeline() {
  return (
    <GlassPanel className="p-3" accent={VIOLET}>
      <PanelSection label="Simulation Timeline" accent={VIOLET} />
      <div className="text-[8px] mb-3 px-1"
        style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
        COMBAT EVENT LOG — RUN SIMULATION TO POPULATE
      </div>
      <div className="relative">
        <div className="absolute top-0 bottom-0"
          style={{ left: 46, width: 1, background: "rgba(0,200,255,0.1)" }} />
        <div className="flex flex-col gap-1.5">
          {SIM_EVENT_TYPES.map((ev, i) => (
            <div key={i} className="flex items-center gap-3" style={{ opacity: 0.35 }}>
              <div className="text-right flex-shrink-0"
                style={{ width: 40, color: "#7ab8cc", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
                {ev.t}
              </div>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 z-10"
                style={{ background: ev.color }} />
              <div className="flex items-center gap-2 py-1 px-2 rounded-[2px] flex-1"
                style={{
                  background: `${ev.color}05`,
                  border: `1px solid ${ev.color}12`,
                  borderLeft: `2px solid ${ev.color}35`,
                }}>
                <span className="flex items-center justify-center" style={{ flexShrink: 0, color: ev.color }}>{ev.icon}</span>
                <span className="text-[10px]" style={{ color: "#7ab8cc" }}>{ev.label}</span>
                <span className="ml-auto text-[9px]"
                  style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
                  — DMG
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYSIS HUB (container)
// ─────────────────────────────────────────────────────────────

type ModuleKey = "resolver" | "status" | "telemetry" | "mitigation" | "timeline";

export interface AnalysisHubProps {
  combatOutput?: any;
  damageResult?: any;
  calcInput?: any;
  offCombatOutput?: any;
  defCombatOutput?: any;
}

export function AnalysisHub({
  combatOutput,
  damageResult,
  calcInput,
  offCombatOutput,
  defCombatOutput,
}: AnalysisHubProps) {
  const [expanded, setExpanded] = useState<Record<ModuleKey, boolean>>({
    resolver: true, status: true, telemetry: true, mitigation: true, timeline: true,
  });

  const toggle = (k: ModuleKey) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  function Module({ id, title, children }: { id: ModuleKey; title: string; children: React.ReactNode }) {
    return (
      <div>
        <button onClick={() => toggle(id)}
          className="ohmm-module-toggle w-full flex items-center px-2.5 py-1.5 mb-1.5 rounded-[3px] transition-all">
          {/* Left spacer for centering the title text */}
          <div className="flex-1" />
          {/* Centered panel header text */}
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-center"
            style={{ color: CYAN, fontFamily: "'Rajdhani', sans-serif" }}>
            {title}
          </span>
          {/* Right side: controls pushed to end, title stays centered */}
          <div className="flex-1 flex items-center justify-end gap-1.5">
            <span className="text-[7px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)", color: GREEN }}>
              READY
            </span>
            {expanded[id]
              ? <ChevronUp size={10} style={{ color: "#7ab8cc" }} />
              : <ChevronDown size={10} style={{ color: "#7ab8cc" }} />}
          </div>
        </button>
        {expanded[id] && children}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Hub header */}
      <div className="px-3 py-2 flex items-center flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,200,255,0.12)", background: "rgba(0,200,255,0.03)" }}>
        {/* Left spacer */}
        <div className="flex-1" />
        {/* Centered header text */}
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: CYAN }} />
          <span className="text-[12px] font-bold tracking-[0.15em]"
            style={{ color: CYAN, fontFamily: "'Rajdhani', sans-serif" }}>
            ANALYSIS HUB
          </span>
        </div>
        {/* Right spacer + controls */}
        <div className="flex-1 flex items-center justify-end gap-1.5">
          <button className="flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-[3px] transition-all font-bold"
            style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.28)", color: CYAN,
              fontFamily: "'Rajdhani', sans-serif" }}>
            <RefreshCw size={9} />
            RUN SIM
          </button>
          <button className="text-[9px] px-2 py-1 rounded-[3px] font-bold"
            style={{ background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.2)", color: ORANGE,
              fontFamily: "'Rajdhani', sans-serif" }}>
            RESET
          </button>
        </div>
      </div>

      {/* Module layout */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,200,255,0.12) transparent" }}>
        <div className="grid grid-cols-2 gap-3">
          <Module id="resolver" title="Combat Resolver">
            <CombatResolver offOutput={offCombatOutput || combatOutput} defOutput={defCombatOutput} calcInput={calcInput} />
          </Module>
          <Module id="telemetry" title="Combat Telemetry">
            <CombatTelemetry calcInput={calcInput} combatOutput={combatOutput || offCombatOutput} />
          </Module>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Module id="status" title="Status Engine">
            <StatusEngine calcInput={calcInput} />
          </Module>
          <Module id="mitigation" title="Mitigation Analysis">
            <MitigationAnalysis calcInput={calcInput} combatOutput={combatOutput || offCombatOutput} />
          </Module>
        </div>
        <Module id="timeline" title="Simulation Timeline"><SimulationTimeline /></Module>
      </div>
    </div>
  );
}
