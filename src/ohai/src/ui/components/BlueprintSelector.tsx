import { useEffect } from 'react';
import { Layers3, Crosshair } from 'lucide-react';
import type { BuildSelection } from '../types';
import { weaponBlueprints } from '../data/catalog';
import { getEnrichedWeaponDisplay } from '../../presentation/weaponPresentationBridge';
import { generateEnrichmentMismatchReport } from '../../presentation/ohdb/presentation_enrichment';
import { getItemImageWithWarning } from '../../presentation/itemImageResolver';

interface BlueprintSelectorProps {
 build: BuildSelection;
 onBuildChange: (build: BuildSelection) => void;
 onWeaponChange: (build: BuildSelection, id: string) => BuildSelection;
}

export function BlueprintSelector({ build, onBuildChange, onWeaponChange }: BlueprintSelectorProps) {
 // Dev-only: log enrichment coverage once (runtime guard)
 useEffect(() => {
  if (typeof window !== 'undefined' && (window as any).__OHDB_DEBUG__) {
   const report = generateEnrichmentMismatchReport();
   console.info('[OHDB] Enrichment coverage report', report);
  }
 }, []);

 return (
  <article className="panel blueprint-browser border border-slate-800/80 bg-slate-900/40 rounded-3xl p-6 shadow-xl">
   <div className="panel-header flex items-center justify-between mb-6">
    <div>
     <p className="eyebrow text-xs uppercase tracking-wider text-amber-400">Blueprint Libraries</p>
     <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
      <Layers3 size={20} className="text-amber-400" /> Select Target Armaments
     </h3>
    </div>
   </div>

   <div className="blueprint-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
    {weaponBlueprints.map((weapon) => {
     const isSelected = build.weapon.blueprintId === weapon.id;
     const enriched = getEnrichedWeaponDisplay(weapon.id);
     return (
      <button
       key={weapon.id}
       className={`blueprint-tile p-4 border rounded-2xl flex flex-col items-center text-center transition ${isSelected ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
       onClick={() => onBuildChange(onWeaponChange(build, weapon.id))}
      >
       <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 mb-3 overflow-hidden">
        {(() => {
         const img = enriched.image || getItemImageWithWarning(weapon, 'weapon');
         return img ? (
          <img src={img} alt="" className="w-full h-full object-contain" />
         ) : (
          <Crosshair size={24} className={isSelected ? 'text-amber-400' : 'text-slate-500'} />
         );
        })()}
       </div>
       <strong className="block text-xs font-bold text-slate-200 truncate w-full">{enriched.displayName}</strong>
       <span className="block text-[10px] text-slate-500 uppercase mt-0.5 tracking-wide">{weapon.family}</span>
       <small className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-amber-400/80 mt-2 block tracking-wider uppercase font-semibold">
        {weapon.keyword}
       </small>
      </button>
     );
    })}
   </div>
  </article>
 );
}
