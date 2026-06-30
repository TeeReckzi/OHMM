import React, { useMemo, useState } from 'react';
import type { SelectorItemViewModel } from '../selectors/selectorTypes';
import { SelectorCard } from './SelectorCard';
import { loadoutLegalityEngine } from '../compatibility/loadoutLegalityEngine';
import type { LoadoutContext } from '../compatibility/types';

interface SelectorModalProps {
 open: boolean;
 title: string;
 description?: string;
 items: SelectorItemViewModel[];
 selectedId?: string;
 onSelect: (id: string) => void | Promise<void>;
 onClose: () => void;
 context?: LoadoutContext; // for legality checks
 slotId?: string; // for compatibility filtering
}

export function SelectorModal({
 open,
 title,
 description,
 items,
 selectedId,
 onSelect,
 onClose,
 context,
 slotId,
}: SelectorModalProps) {
 const [query, setQuery] = useState('');
 const [activeFamily, setActiveFamily] = useState('all');
 const [error, setError] = useState<string | null>(null);

 const isWeaponSelector = slotId === 'primaryWeapon' || title.toLowerCase().includes('weapon');
 const categoryTabs = useMemo(() => {
  const families = Array.from(new Set(items.map((item) => item.family).filter(Boolean))) as string[];
  return families.sort((a, b) => a.localeCompare(b));
 }, [items]);

 const filtered = items.filter((it) => {
  const familyMatch = activeFamily === 'all' || it.family === activeFamily;
  const queryMatch =
   it.displayName.toLowerCase().includes(query.toLowerCase()) ||
   it.family?.toLowerCase().includes(query.toLowerCase()) ||
   it.mechanic?.toLowerCase().includes(query.toLowerCase());
  return familyMatch && queryMatch;
 });

 if (!open) return null;

 const handleSelect = (id: string) => {
  setError(null);

  // Legality check before allowing selection
  if (context) {
   const result = loadoutLegalityEngine.validateItemForSlot(title.toLowerCase().includes('weapon') ? 'primaryWeapon' : 'unknown', id, context);
   if (result.status === 'INVALID') {
    setError(result.issues[0]?.message || 'This item is not valid for the current loadout');
    return;
   }
  }

  Promise.resolve(onSelect(id)).catch((e) => {
   setError(e?.message || 'Selection failed');
  });
 };

 return (
  <div className="selector-modal-overlay" onClick={onClose}>
   <div className="selector-modal" onClick={(e) => e.stopPropagation()}>
    <div className="modal-header">
     <h2>{title}</h2>
     {description && <p className="modal-desc">{description}</p>}
     <button className="modal-close" onClick={onClose}>×</button>
    </div>

    <input
     className="modal-search"
     placeholder={isWeaponSelector ? 'Search weapons...' : 'Search slot items...'}
     value={query}
     onChange={(e) => setQuery(e.target.value)}
    />

    {categoryTabs.length > 0 && (
     <div className="selector-family-tabs" role="tablist" aria-label={isWeaponSelector ? 'Weapon type filters' : 'Category filters'}>
      <button type="button" className={activeFamily === 'all' ? 'active' : ''} onClick={() => setActiveFamily('all')}>All</button>
      {categoryTabs.map((family) => (
       <button key={family} type="button" className={activeFamily === family ? 'active' : ''} onClick={() => setActiveFamily(family)}>
        {family.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
       </button>
      ))}
     </div>
    )}

    {error && <div className="modal-error">{error}</div>}

    <div className="modal-grid">
     {filtered.length === 0 && (
      <div className="modal-empty">No matching items</div>
     )}
     {filtered.map((item) => (
      <SelectorCard
       key={item.id}
       id={item.id}
       name={item.displayName}
       imageUrl={item.imageUrl}
       family={item.family}
       mechanic={item.mechanic}
       readiness={item.readiness}
       confidence={item.confidence}
       missingInputs={item.missingInputs}
       blockedReason={item.blockedReasons?.[0]}
       selected={item.id === selectedId}
       onSelect={handleSelect}
      />
     ))}
    </div>
   </div>
  </div>
 );
}
