import { ChevronDown, Sparkles } from 'lucide-react';
import type { CatalogItem } from '../data/catalog';
import { ItemPreview } from './ItemPreview';
import { getItemImageWithWarning } from '../../presentation/itemImageResolver';

export function ItemSlot({ label, value, options, onChange, openPicker }: { label: string; value?: string; options: CatalogItem[]; onChange: (v: string) => void; openPicker?: (p: any) => void }) {
 const resolvedValue = value ?? options[0]?.id ?? 'none';
 const selected = options.find((o) => o.id === resolvedValue) || options[0];
 const img = selected ? getItemImageWithWarning(selected, 'armor') : null;

 return (
  <button className="item-slot relative flex items-center justify-between w-full bg-slate-950/40 border border-slate-800 hover:border-purple-500/40 p-3 rounded-xl transition group text-left" onClick={() => openPicker?.({ id: `${label}-${resolvedValue}`, label, value: resolvedValue, options, onChange })} type="button">
   <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
     {img ? (
      <img src={img} alt="" className="w-full h-full object-cover" />
     ) : (
      <Sparkles size={14} className="text-slate-600" />
     )}
    </div>
    <div>
     <small className="block text-[10px] uppercase text-slate-500 tracking-wider">{label}</small>
     <strong className="block text-xs font-bold text-slate-200 truncate max-w-[120px]">{selected?.name ?? 'Missing selection'}</strong>
    </div>
   </div>
   <ChevronDown size={14} className="text-slate-500 group-hover:text-purple-400 transition" />
   {selected && <ItemPreview item={selected} />}
  </button>
 );
}
