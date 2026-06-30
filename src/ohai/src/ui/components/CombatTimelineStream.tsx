import React, { useMemo } from 'react';
import { Activity, Flame, Shield, Crosshair, Sparkles, AlertTriangle, Zap } from 'lucide-react';
import type { FormulaDamageAdapterResult } from '../formulaDamageAdapter';
import type { RuntimeAttackPayload } from '../../engine/runtimeAttackTypes';
import type { BuildSelection } from '../types';

interface TimelineStreamProps {
 build: BuildSelection;
 formulaResult: FormulaDamageAdapterResult | null;
}

export function CombatTimelineStream({ build, formulaResult }: TimelineStreamProps) {
 const activeEvents = useMemo(() => {
  const baseDamage = formulaResult?.formulaDamage ?? 0;
  const primaryMech = formulaResult?.primaryMechanic;
  const runtimePayload = primaryMech?.runtimePayload;
  const keyword = runtimePayload?.keyword ?? 'none';
  const formulaFamily = primaryMech?.formulaFamily ?? 'unknown';
  const hasCrit = baseDamage > 0;
  const hasWarning = (formulaResult?.warnings?.length ?? 0) > 0;

  if (!formulaResult) {
   return [
    {
     time: "—",
     icon: <AlertTriangle size={14} className="text-slate-500" />,
     label: "No Calculation Data",
     detail: "Select gear and configure build to generate combat simulation output.",
     value: "IDLE",
     badgeCss: "bg-slate-800 text-slate-400 border-slate-700"
    }
   ];
  }

  const events = [
   {
    time: "0.00s",
    icon: <Crosshair size={14} className="text-blue-400" />,
    label: "Initiate Attack Sequence",
    detail: `Primary mechanic [${primaryMech?.mechanicId ?? 'unknown'}] via ${formulaFamily} formula family.`,
    value: `Base DMG: ${Math.round(baseDamage).toLocaleString()}`,
    badgeCss: "bg-blue-500/10 text-blue-300 border-blue-500/20"
   },
   {
    time: "0.10s",
    icon: <Sparkles size={14} className="text-purple-400" />,
    label: "Multiplier Breakdown",
    detail: formulaResult.formulaMultipliers
     .map(m => `${m.label}: ${m.multiplier.toFixed(3)}x`)
     .join(' · ') || 'No active multipliers.',
    value: `${(formulaResult.formulaMultipliers.reduce((acc, m) => acc * m.multiplier, 1)).toFixed(3)}x`,
    badgeCss: "bg-purple-500/10 text-purple-300 border-purple-500/20"
   },
   {
    time: "0.20s",
    icon: <Zap size={14} className="text-amber-400" />,
    label: "Runtime Keyword & Element",
    detail: keyword !== 'none'
     ? `Keyword [${keyword}] active. Element type: ${runtimePayload?.elementType ?? 'none'}. Formula tree: ${runtimePayload?.formulaTreeName ?? 'unknown'}.`
     : "No keyword detected. Using baseline formula.",
    value: keyword !== 'none' ? keyword.toUpperCase() : 'BASELINE',
    badgeCss: keyword !== 'none'
     ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
     : "bg-slate-800 text-slate-400 border-slate-700"
   },
   {
    time: "0.30s",
    icon: <Flame size={14} className="text-orange-400" />,
    label: "Damage Rolldown",
    detail: `Runtime multiplier: ${(formulaResult.primaryRuntimeMultiplier ?? 1).toFixed(3)}x. Effective damage: ${Math.round(baseDamage * (formulaResult.primaryRuntimeMultiplier ?? 1)).toLocaleString()}.`,
    value: hasCrit ? `DMG: +${Math.round(baseDamage).toLocaleString()}` : 'PROCESSING',
    badgeCss: "bg-orange-500/10 text-orange-300 border-orange-500/20"
   }
  ];

  if (hasWarning) {
   events.push({
    time: "⚠",
    icon: <AlertTriangle size={14} className="text-red-400" />,
    label: "Calculation Warnings",
    detail: formulaResult.warnings.slice(0, 3).join(' | ') + (formulaResult.warnings.length > 3 ? ` +${formulaResult.warnings.length - 3} more` : ''),
    value: `${formulaResult.warnings.length} WARNINGS`,
    badgeCss: "bg-red-500/10 text-red-300 border-red-500/20"
   });
  }

  return events;
 }, [formulaResult]);

 return (
  <article className="panel timeline-stream-panel border border-slate-800 bg-slate-900/90 rounded-3xl p-6 shadow-xl text-slate-200">
   <div className="panel-header flex justify-between items-center mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-widest text-slate-400">Telemetry Log</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      <Activity className="text-purple-400" size={20} /> Real-Time Simulation Chain
     </h3>
    </div>
   </div>

   <div className="relative border-l border-slate-800/80 ml-3 pl-6 space-y-6">
    {activeEvents.map((ev, index) => (
     <div key={index} className="relative group">
      <div className="absolute -left-[33px] top-1 bg-slate-950 border border-slate-800 p-1.5 rounded-full z-10 transition-colors group-hover:border-purple-500/60">
       {ev.icon}
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 bg-slate-950/30 border border-slate-800/40 hover:border-slate-800 rounded-xl p-4 transition-all">
       <div className="space-y-1">
        <div className="flex items-center gap-2">
         <span className="font-mono text-xs text-purple-400 font-semibold">{ev.time}</span>
         <h4 className="text-sm font-bold text-slate-200">{ev.label}</h4>
        </div>
        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{ev.detail}</p>
       </div>
       <span className={`text-[11px] font-mono border px-2.5 py-1 rounded-md md:self-center font-semibold tracking-wide ${ev.badgeCss}`}>
        {ev.value}
       </span>
      </div>
     </div>
    ))}
   </div>
  </article>
 );
}
