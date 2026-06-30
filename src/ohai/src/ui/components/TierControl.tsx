import type { GearTier } from '../types';

export function TierControl({ value, onChange }: { value: GearTier; onChange: (v: GearTier) => void }) {
 return (
  <div className="tier-control flex gap-1 text-[10px] font-mono bg-slate-900 p-0.5 border border-slate-800/80 rounded-lg max-w-max">
   {([1, 2, 3, 4, 5] as GearTier[]).map((t) => (
    <button key={t} type="button" className={`px-2 py-0.5 rounded-md transition ${value === t ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-500'}`} onClick={() => onChange(t)}>
     {['I', 'II', 'III', 'IV', 'V'][t - 1]}
    </button>
   ))}
  </div>
 );
}
