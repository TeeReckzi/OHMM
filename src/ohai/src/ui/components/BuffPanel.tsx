import { FlaskConical, Sparkles } from 'lucide-react';
import type { BuildSelection } from '../types';
import { ItemSelector } from './ItemSelector';
import { CradleGrid } from './CradleGrid';
import { foodBuffRegistry } from '../registries/foodBuffRegistry';
import { deviationRegistry } from '../registries/deviationRegistry';
import { cradleRegistry } from '../registries/cradleRegistry';
import type { AnyCanonicalItem } from '../itemTypes';

interface BuffPanelProps {
 build: BuildSelection;
 onBuildChange: (build: BuildSelection) => void;
 openPicker?: (picker: any) => void;
}

export function BuffPanel({ build, onBuildChange }: BuffPanelProps) {
 const chef = build.food.chefRex;

 function updateChefRex(patch: any) {
  onBuildChange({ ...build, food: { ...build.food, chefRex: { ...chef, ...patch } } });
 }

 return (
  <article className="panel buff-panel border border-slate-800/80 bg-slate-900/40 rounded-3xl p-6 shadow-xl">
   <div className="panel-header flex items-center justify-between mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-wider text-cyan-400">Support Buff Overlays</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      <FlaskConical size={22} className="text-cyan-400" /> Cradle, Deviant & Comestibles
     </h3>
    </div>
   </div>

   <div className="support-grid grid grid-cols-1 gap-4 mb-6">
    <div>
     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Active Deviant</span>
     <ItemSelector
      items={deviationRegistry.filter((d: any) => d.deviationRole === "combat") as AnyCanonicalItem[]}
      selectedId={build.deviant.id}
      onSelect={(id) => onBuildChange({ ...build, deviant: { ...build.deviant, id } })}
      placeholder="Select combat deviant..."
      compact
     />
    </div>
    <div>
     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Active Food Buff</span>
     <ItemSelector
      items={(foodBuffRegistry as AnyCanonicalItem[]).filter((f) => f.category === "food")}
      selectedId={build.food.food}
      onSelect={(id) => onBuildChange({ ...build, food: { ...build.food, food: id } })}
      placeholder="Select nourishment buff..."
      compact
     />
    </div>
    <div>
     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Active Tactical Brew</span>
     <ItemSelector
      items={(foodBuffRegistry as AnyCanonicalItem[]).filter((f) => f.category === "drink")}
      selectedId={build.food.drink}
      onSelect={(id) => onBuildChange({ ...build, food: { ...build.food, drink: id } })}
      placeholder="Select drink..."
      compact
     />
    </div>
   </div>

   <div className="chef-tuning-card bg-slate-950/40 border border-slate-800 rounded-2xl p-4 mb-6">
    <div className="flex justify-between items-center mb-4">
     <button
      className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${chef.enabled ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
      onClick={() => updateChefRex({ enabled: !chef.enabled })}
     >
      <Sparkles size={14} /> Chef Rex Optimization
     </button>
     <div className="text-right">
      <span className="text-[10px] uppercase text-slate-500 block font-semibold">Bonus Factor</span>
      <strong className="text-sm font-mono text-slate-200">{chef.enabled ? `${chef.bonusPercent}%` : 'Inactive'}</strong>
     </div>
    </div>

    <div className="space-y-3">
     <label className="flex items-center justify-between text-xs">
      <span className="text-slate-400">Bonus Percent</span>
      <input
       type="number" min="0" max="42" step="0.1"
       className="w-16 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-1 text-center font-mono"
       value={chef.bonusPercent}
       onChange={(e) => updateChefRex({ bonusPercent: Number(e.target.value) })}
      />
     </label>
    </div>
   </div>

   <div>
    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Cradle Perks Selection Matrix</p>
    <CradleGrid perks={cradleRegistry} activePerks={build.cradle.perks} onToggle={(pId) => onBuildChange({ ...build, cradle: { perks: build.cradle.perks.includes(pId) ? build.cradle.perks.filter(id => id !== pId) : [...build.cradle.perks, pId] } })} />
   </div>
  </article>
 );
}
