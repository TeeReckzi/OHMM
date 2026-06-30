import { useMemo, useState } from 'react';
import { CheckCircle2, Info, Search, X } from 'lucide-react';
import type { CatalogItem } from '../data/catalog';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import type { AnyCanonicalItem } from '../itemTypes';

function fuzzyMatch(str: string, query: string): boolean {
 if (!query) return true;
 const s = str.toLowerCase();
 const q = query.toLowerCase();
 let i = 0;
 for (const char of q) {
  i = s.indexOf(char, i);
  if (i === -1) return false;
  i++;
 }
 return true;
}

const RECOVERED_INTEL: Record<string, string[]> = {
 burn: ['Burn / Scorch rows recovered from combat_property reconstruction.', 'Status damage support still needs runtime validation.'],
 frost: ['Frost Vortex candidates recovered from aligned combat property samples.'],
 surge: ['Power Surge candidates recovered from property reconstruction.'],
 general: ['Recovered data exists, but unresolved effects remain intentionally marked as Intel Gaps.'],
};

interface ItemPickerDrawerProps {
 picker: { id: string; label: string; value: string; options: CatalogItem[]; onChange: (v: string) => void };
 onClose: () => void;
}

function normalizeDrawerArmorSlot(value: string): string {
 const key = value.toLowerCase();
 const map: Record<string, string> = { head: 'head', helmet: 'head', chest: 'chest', torso: 'chest', pants: 'pants', legs: 'pants', boots: 'boots', shoes: 'boots', mask: 'mask', gloves: 'gloves' };
 return map[key] ?? key;
}

export function ItemPickerDrawer({ picker, onClose }: ItemPickerDrawerProps) {
 const [query, setQuery] = useState('');
 const [detailItem, setDetailItem] = useState<AnyCanonicalItem | null>(null);

 const slotScopedOptions = useMemo(() => {
  const slot = normalizeDrawerArmorSlot(picker.label);
  const armorSlots = new Set(['head', 'mask', 'gloves', 'chest', 'pants', 'boots']);
  if (!armorSlots.has(slot)) return picker.options;
  return picker.options.filter((item) => item.id === 'empty' || normalizeDrawerArmorSlot(item.slot ?? '') === slot);
 }, [picker.label, picker.options]);

 const filtered = useMemo(() => slotScopedOptions.filter((item) => fuzzyMatch(item.name, query)), [slotScopedOptions, query]);
 const canonicalItems = useMemo(() => {
  const seen = new Set<string>();
  return slotScopedOptions.reduce((acc: AnyCanonicalItem[], item) => {
   if (!seen.has(item.id)) {
    seen.add(item.id);
    acc.push(item as unknown as AnyCanonicalItem);
   }
   return acc;
  }, []);
 }, [slotScopedOptions]);

 if (detailItem) {
  return <ItemDetailDrawer item={detailItem} onClose={() => setDetailItem(null)} showDelta compareLabel="Active Selection" />;
 }

 const intel = query ? RECOVERED_INTEL[query.toLowerCase()] ?? RECOVERED_INTEL.general : null;

 return (
  <div className="armory-picker-backdrop" onMouseDown={onClose}>
   <section className="armory-picker" onMouseDown={(event) => event.stopPropagation()}>
    <header className="armory-picker-header">
     <div>
      <p className="eyebrow">OHMM Armory Browser</p>
      <h2>{picker.label}</h2>
      <span>{filtered.length} / {slotScopedOptions.length} entries</span>
     </div>
     <button className="armory-picker-close" onClick={onClose} type="button" aria-label="Close picker">
      <X size={18} />
     </button>
    </header>

    <label className="armory-picker-search">
     <Search size={18} />
     <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search loadout assets..." autoFocus />
    </label>

    {intel && (
     <aside className="armory-picker-intel">
      <Info size={15} />
      <div>{intel.map((line) => <span key={line}>{line}</span>)}</div>
     </aside>
    )}
    <div className="armory-picker-grid">
     {filtered.map((item) => {
      const isActive = item.id === picker.value;
      const detail = canonicalItems.find((candidate) => candidate.id === item.id) ?? null;
      return (
       <button
        key={item.id}
        className={isActive ? 'armory-card active' : 'armory-card'}
        type="button"
        onClick={() => { picker.onChange(item.id); onClose(); }}
        onContextMenu={(event) => { event.preventDefault(); setDetailItem(detail); }}
       >
        <span className="armory-card-art">
         {item.iconUrl ? <img src={item.iconUrl} alt="" /> : <span>{item.name.slice(0, 2).toUpperCase()}</span>}
        </span>
        <span className="armory-card-body">
         <strong>{item.name}</strong>
         <small>{item.category ?? 'Loadout asset'}</small>
         {item.effects?.length ? <em>{item.effects.length} modeled effect{item.effects.length === 1 ? '' : 's'}</em> : <em>Selector item</em>}
        </span>
        {isActive && <span className="armory-card-active"><CheckCircle2 size={14} /> Active</span>}
       </button>
      );
     })}
    </div>
   </section>
  </div>
 );
}
