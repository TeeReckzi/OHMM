import React, { useMemo } from 'react';
import { Crosshair, Shield, Activity, Zap, AlertCircle } from 'lucide-react';
import type { FormulaInput, FormulaResult } from '../../engine/formulaTypes';

interface PvETargetBalancerProps {
 calcInput: any;
 attackerOutput: any;
 selectedTargetId: string;
 pveRegistry: any[];
}

export function PvETargetBalancer({ calcInput, attackerOutput, selectedTargetId, pveRegistry }: PvETargetBalancerProps) {
 const activeTarget = useMemo(() => {
  return pveRegistry.find(t => t.id === selectedTargetId) || {
   name: "Training Dummy",
   type: "Normal",
   weakspotMultiplier: 1.0,
   vulnerabilities: { physical: 1.0, elemental: 1.0 },
   defenseRating: 0
  };
 }, [selectedTargetId, pveRegistry]);

 const computations = useMemo(() => {
  const rawDamage = attackerOutput.damageOutput.expectedDamage ?? 0;
  const defenseReduction = Math.max(0.1, 1 - (activeTarget.defenseRating / (activeTarget.defenseRating + 1200)));

  const physicalVulnerability = activeTarget.vulnerabilities?.physical ?? 1.0;
  const elementalVulnerability = activeTarget.vulnerabilities?.elemental ?? 1.0;

  const adjustedDamage = rawDamage * defenseReduction * ((physicalVulnerability + elementalVulnerability) / 2);
  const estimatedTTK = adjustedDamage > 0 ? Math.max(0.4, Math.min(15.0, 450000 / (adjustedDamage * 3.5))) : 0;

  return {
   mitigationFactor: ((1 - defenseReduction) * 100).toFixed(1),
   adjustedDamage: Math.round(adjustedDamage),
   estimatedTTK: estimatedTTK.toFixed(1)
  };
 }, [attackerOutput, activeTarget]);

 return (
  <article className="panel pve-balancer-card border border-emerald-500/30 bg-slate-900/90 rounded-3xl p-6 shadow-xl text-slate-200">
   <div className="panel-header flex justify-between items-center mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-widest text-emerald-400">Encounter Threat Analysis</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      <Crosshair className="text-emerald-400" size={20} /> Target Vulnerability Matrix
     </h3>
    </div>
    <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
     {activeTarget.type} Threat
    </span>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
     <span className="text-xs text-slate-400 block mb-1">Target Name</span>
     <strong className="text-base text-emerald-300 font-bold block truncate">{activeTarget.name}</strong>
     <small className="text-[10px] text-slate-500 block mt-1">Active database lookup matching</small>
    </div>

    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
     <span className="text-xs text-slate-400 block mb-1">Mitigated Damage / Shot</span>
     <strong className="text-lg text-slate-100 font-mono font-bold block">
      {computations.adjustedDamage.toLocaleString()}
     </strong>
     <small className="text-[10px] text-amber-400/80 block mt-1">
      -{computations.mitigationFactor}% Base Def reduction applied
     </small>
    </div>

    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
     <span className="text-xs text-slate-400 block mb-1">Projected TTK Window</span>
     <strong className="text-lg text-slate-100 font-mono font-bold block">{computations.estimatedTTK}s</strong>
     <small className="text-[10px] text-slate-500 block mt-1">Based on standardized health thresholds</small>
    </div>
   </div>

   <div className="bg-slate-950/20 rounded-xl p-4 border border-slate-800/60 space-y-3">
    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
     <Activity size={14} className="text-emerald-400" /> Target Profile Modifiers
    </h4>
    <div className="grid grid-cols-2 gap-4 text-xs">
     <div className="flex justify-between border-b border-slate-800/50 pb-1">
      <span className="text-slate-400">Weakspot Multiplier</span>
      <span className="font-mono text-slate-200">{(activeTarget.weakspotMultiplier ?? 1.0).toFixed(2)}x</span>
     </div>
     <div className="flex justify-between border-b border-slate-800/50 pb-1">
      <span className="text-slate-400">Defense Rating</span>
      <span className="font-mono text-slate-200">{activeTarget.defenseRating ?? 0}</span>
     </div>
     <div className="flex justify-between pb-1">
      <span className="text-slate-400">Physical Sensitivity</span>
      <span className="font-mono text-emerald-400">+{((activeTarget.vulnerabilities?.physical ?? 1) * 100 - 100).toFixed(0)}%</span>
     </div>
     <div className="flex justify-between pb-1">
      <span className="text-slate-400">Elemental Sensitivity</span>
      <span className="font-mono text-cyan-400">+{((activeTarget.vulnerabilities?.elemental ?? 1) * 100 - 100).toFixed(0)}%</span>
     </div>
    </div>
   </div>
  </article>
 );
}
