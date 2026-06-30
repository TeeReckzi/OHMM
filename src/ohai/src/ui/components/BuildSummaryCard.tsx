import { Crosshair } from 'lucide-react';
import type { BuildSelection, WeaponBlueprint, DamageProfile } from '../types';
import { BlueprintStarsControl } from './BlueprintStarsControl';
import { TierControl } from './TierControl';

interface BuildSummaryCardProps {
 build: BuildSelection;
 weapon: WeaponBlueprint;
 onBuildChange: (b: BuildSelection) => void;
 accent: 'attacker' | 'defender';
 compact?: boolean;
}

export function BuildSummaryCard({ build, weapon, onBuildChange, accent, compact = false }: BuildSummaryCardProps) {
 return (
  <article className={`panel build-summary border border-slate-800/80 bg-slate-900/40 rounded-3xl p-6 shadow-xl ${compact ? 'compact' : ''}`}>
   <div className="panel-header flex justify-between items-start mb-4">
    <div>
     <p className="eyebrow text-xs text-slate-500 uppercase tracking-wider">{build.label}</p>
     <h3 className="text-lg font-bold text-slate-100">{weapon.name}</h3>
    </div>
    <span className={`text-[10px] uppercase tracking-wider font-semibold border px-2.5 py-0.5 rounded-full ${weapon.damageProfile === 'burn' || weapon.damageProfile === 'frost' || weapon.damageProfile === 'shock' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
     {weapon.keyword}
    </span>
   </div>

   <div className="weapon-stage flex gap-4 items-center bg-slate-950/30 border border-slate-800/50 p-4 rounded-2xl">
    <div className="w-16 h-16 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center shrink-0">
     <Crosshair size={32} className="text-slate-600" />
    </div>
    <div className="weapon-state flex-1 min-w-0 space-y-2">
     <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">{weapon.family}</span>
     <div className="flex flex-col gap-1.5">
      <BlueprintStarsControl value={build.weapon.stars} max={weapon.maxStars} onChange={(s) => onBuildChange({ ...build, weapon: { ...build.weapon, stars: s } })} />
      <TierControl value={build.weapon.tier} onChange={(t) => onBuildChange({ ...build, weapon: { ...build.weapon, tier: t } })} />
     </div>
    </div>
   </div>
  </article>
 );
}
