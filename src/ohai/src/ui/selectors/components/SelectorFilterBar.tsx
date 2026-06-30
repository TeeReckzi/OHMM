import React from 'react';

export interface SelectorFilters {
 query: string;
 family: string;
 mechanic: string;
 readiness: string;
 showPartial: boolean;
 showDisplayOnly: boolean;
 showBlocked: boolean;
}

interface SelectorFilterBarProps {
 filters: SelectorFilters;
 onChange: (f: SelectorFilters) => void;
 families: string[];
 mechanics: string[];
}

export function SelectorFilterBar({ filters, onChange, families, mechanics }: SelectorFilterBarProps) {
 const update = (patch: Partial<SelectorFilters>) => {
  onChange({ ...filters, ...patch });
 };

 return (
  <div className="selector-filter-bar">
   <input
    className="filter-search"
    placeholder="Search..."
    value={filters.query}
    onChange={(e) => update({ query: e.target.value })}
   />

   <select value={filters.family} onChange={(e) => update({ family: e.target.value })}>
    <option value="">All Families</option>
    {families.map((f) => (
     <option key={f} value={f}>{f}</option>
    ))}
   </select>

   <select value={filters.mechanic} onChange={(e) => update({ mechanic: e.target.value })}>
    <option value="">All Mechanics</option>
    {mechanics.map((m) => (
     <option key={m} value={m}>{m}</option>
    ))}
   </select>

   <select value={filters.readiness} onChange={(e) => update({ readiness: e.target.value })}>
    <option value="">All Readiness</option>
    <option value="READY">READY</option>
    <option value="PARTIAL">PARTIAL</option>
    <option value="DISPLAY_ONLY">DISPLAY_ONLY</option>
    <option value="BLOCKED">BLOCKED</option>
    <option value="INVALID">INVALID</option>
   </select>

   <label>
    <input
     type="checkbox"
     checked={filters.showPartial}
     onChange={(e) => update({ showPartial: e.target.checked })}
    /> Partial
   </label>

   <button onClick={() => onChange({
    query: '', family: '', mechanic: '', readiness: '',
    showPartial: true, showDisplayOnly: true, showBlocked: true
   })}>
    Clear
   </button>
  </div>
 );
}
