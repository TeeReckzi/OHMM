import { Gauge, AlertTriangle } from 'lucide-react';
import type { FormulaMultiplierBreakdown } from '../../engine/formulaTypes';

interface ProjectionPanelProps {
 formulaDamage: number;
 formulaMultipliers: FormulaMultiplierBreakdown[];
 warnings: string[];
 primaryRuntimeMultiplier: number;
 runtimeKeyword: string;
 mechanicId: string;
 metadata?: { formulaFamily?: string; hasError?: boolean; error?: string | null };
}

export function ProjectionPanel({
 formulaDamage,
 formulaMultipliers,
 warnings,
 primaryRuntimeMultiplier,
 runtimeKeyword,
 mechanicId,
 metadata,
}: ProjectionPanelProps) {
 const totalMultiplier = formulaMultipliers.reduce((acc, m) => acc * m.multiplier, 1);
 const effectiveDamage = formulaDamage * totalMultiplier * primaryRuntimeMultiplier;
 const hasData = formulaDamage > 0 || formulaMultipliers.length > 0;

 return (
  <article className="panel projection-panel border border-purple-500/20 bg-purple-500/5 rounded-3xl p-6 shadow-xl">
   <div className="flex justify-between items-center mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-wider text-purple-400">Live Computational Stream</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      Calculated Combat Output
     </h3>
    </div>
    <Gauge size={22} className="text-purple-400" />
   </div>

   <div className="verdict-card bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 mb-4">
    <div className="flex justify-between items-start">
     <div>
      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Formula Damage</span>
      <div className="text-3xl font-bold font-mono text-purple-400 mt-1">
       {formulaDamage.toFixed(1)}
      </div>
     </div>
     <div className="text-right text-[11px] text-slate-400">
      <div>Mechanic: {mechanicId}</div>
      {metadata?.formulaFamily && <div>Formula: {metadata.formulaFamily}</div>}
      <div>Runtime: {primaryRuntimeMultiplier.toFixed(3)}x</div>
      <div>Keyword: {runtimeKeyword}</div>
     </div>
    </div>
    {hasData && (
     <div className="mt-3 pt-3 border-t border-slate-800/50">
      <div className="text-xs text-slate-400">Effective: <span className="text-purple-300 font-mono">{effectiveDamage.toFixed(1)}</span></div>
     </div>
    )}
   </div>

   {formulaMultipliers.length > 0 && (
    <div className="multiplier-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
     {formulaMultipliers.map((m, i) => (
      <div key={i} className="multiplier-card bg-slate-950/40 border border-slate-800 p-3 rounded-xl flex flex-col gap-1">
       <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">{m.label}</span>
       <strong className="text-lg font-bold font-mono text-purple-400">{m.multiplier.toFixed(3)}x</strong>
       <small className="text-[9px] text-slate-500">{m.source}</small>
      </div>
     ))}
    </div>
   )}

   {warnings.length > 0 && (
    <div className="warnings-card bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 mt-3">
     <div className="flex items-center gap-2 mb-2">
      <AlertTriangle size={14} className="text-amber-400" />
      <span className="text-[10px] uppercase text-amber-400 font-bold tracking-wider">Calculation Warnings</span>
     </div>
     <ul className="text-[10px] text-amber-300 space-y-1 list-disc list-inside">
      {warnings.map((w, i) => (
       <li key={i}>{w}</li>
      ))}
     </ul>
    </div>
   )}

   {metadata?.error && (
    <div className="error-card bg-red-950/20 border border-red-500/20 rounded-xl p-3 mt-3">
     <div className="flex items-center gap-2 mb-1">
      <AlertTriangle size={14} className="text-red-400" />
      <span className="text-[10px] uppercase text-red-400 font-bold tracking-wider">Formula Error</span>
     </div>
     <p className="text-[10px] text-red-300">{metadata.error}</p>
    </div>
   )}

   {!hasData && (
    <p className="text-[11px] text-slate-500 italic mt-2">
     Configure gear and run calculation to see projected damage output.
    </p>
   )}
  </article>
 );
}
