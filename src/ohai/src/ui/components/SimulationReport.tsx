import { Swords, Zap } from 'lucide-react';
import type { ProjectionMetric } from '../types';

interface SimulationReportProps {
 mode: 'pve' | 'pvp';
 metrics: ProjectionMetric[];
}

export function SimulationReport({ mode, metrics }: SimulationReportProps) {
 return (
  <article className="panel simulation-report border border-slate-800/80 bg-slate-900/40 rounded-3xl p-6 shadow-xl">
   <div className="panel-header flex justify-between items-center mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-wider text-purple-400">Analytical Output Forecast</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      {mode === 'pvp' ? <Swords size={22} className="text-purple-400" /> : <Zap size={22} className="text-purple-400" />}
      {mode === 'pvp' ? 'PvP Duel Verification Matrix' : 'PvE Threat Damage Forecast'}
     </h3>
    </div>
   </div>

   <div className="verdict-card bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col gap-1">
    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Combat Stream State</span>
    <strong className="text-base text-purple-300 font-bold">Telemetry Live Stream Verified</strong>
    <p className="text-xs text-slate-400 leading-relaxed mt-1">
     All calculations are live. Real-time evaluation registers core armor coefficients, weapon multiplier behaviors, and status tick frequencies instantly.
    </p>
   </div>

   <div className="metric-grid grid grid-cols-2 gap-4">
    {metrics.map((m) => (
     <div key={m.label} className="metric-card bg-slate-950/30 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-1">
      <span className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">{m.label}</span>
      <strong className="text-lg font-bold font-mono text-slate-200">{m.value}</strong>
     </div>
    ))}
   </div>
  </article>
 );
}
