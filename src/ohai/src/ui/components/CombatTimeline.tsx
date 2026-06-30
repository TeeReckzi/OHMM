import { Crosshair, Flame, Shield, Activity } from 'lucide-react';

export function CombatTimeline() {
 const traces = [
  { icon: <Crosshair size={14} className="text-blue-400" />, title: 'Attack Sequence Initialized', desc: 'Primary rate parameters and hit patterns mapped.' },
  { icon: <Flame size={14} className="text-orange-400" />, title: 'Keyword Application Verification', desc: 'Status proc logic and elemental buckets matched.' },
  { icon: <Shield size={14} className="text-amber-400" />, title: 'Mitigation Matrix Evaluation Pass', desc: 'Armor values, scaling coefficients, and reduction checked.' },
  { icon: <Activity size={14} className="text-purple-400" />, title: 'Damage Summary Output Final', desc: 'DPS evaluation rollups and confidence calculations complete.' },
 ];

 return (
  <article className="panel timeline-panel border border-slate-800/80 bg-slate-900/40 rounded-3xl p-6 shadow-xl">
   <div className="panel-header flex items-center justify-between mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-wider text-purple-400">Simulation Chronology</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      <Activity size={20} className="text-purple-400" /> Real-Time Telemetry Chain
     </h3>
    </div>
   </div>

   <div className="timeline-list relative border-l border-slate-800/80 ml-3 pl-6 space-y-4">
    {traces.map((t, idx) => (
     <div key={idx} className="relative flex flex-col bg-slate-950/40 border border-slate-800/40 p-3 rounded-xl hover:border-slate-800 transition">
      <div className="absolute -left-[31px] top-3 bg-slate-950 border border-slate-800 p-1 rounded-full">
       {t.icon}
      </div>
      <strong className="text-xs font-bold text-slate-200">{t.title}</strong>
      <span className="text-[11px] text-slate-400 mt-0.5">{t.desc}</span>
     </div>
    ))}
   </div>
  </article>
 );
}
