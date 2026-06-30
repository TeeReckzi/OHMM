import type { CatalogItem } from '../data/catalog';

export function ItemPreview({ item }: { item: CatalogItem }) {
 return (
  <span className="item-preview-card pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-950 border border-slate-800/90 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition z-50 transition-all duration-200" role="tooltip">
   <strong className="block text-xs font-bold text-slate-200">{item.name}</strong>
   <small className="block text-[9px] uppercase text-purple-400 tracking-wide mt-0.5">{item.category || 'Build Piece'}</small>
   {item.description && <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed border-t border-slate-900 pt-1.5">{item.description}</p>}
  </span>
 );
}
