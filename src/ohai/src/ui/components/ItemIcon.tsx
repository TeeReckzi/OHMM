import { Sparkles } from 'lucide-react';
import type { CatalogItem } from '../data/catalog';

export function ItemIcon({ item }: { item: CatalogItem }) {
 return (
  <span className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
   {item.iconUrl ? <img src={item.iconUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : <Sparkles size={14} className="text-slate-600" />}
  </span>
 );
}
