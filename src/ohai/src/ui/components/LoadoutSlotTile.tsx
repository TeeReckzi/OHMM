import React from 'react';
import type { SelectorItemViewModel } from '../selectors/selectorTypes';
import { ReadinessBadge } from './ReadinessBadge';
import { loadoutLegalityEngine } from '../compatibility/loadoutLegalityEngine';
import type { LoadoutContext } from '../compatibility/types';

interface LoadoutSlotTileProps {
 slotId: string;
 label: string;
 item?: SelectorItemViewModel;
 onClick: () => void;
 context?: any; // LoadoutContext
}

export function LoadoutSlotTile({ slotId, label, item, onClick, context }: LoadoutSlotTileProps) {
 const isEmpty = !item;
 const state = item?.readiness || 'BLOCKED';

 // Check legality if context is provided
 let legalityWarning: string | null = null;
 if (context && item) {
  const result = loadoutLegalityEngine.validateItemForSlot(slotId, item.id, context);
  if (result.status === 'INVALID') {
   legalityWarning = result.issues[0]?.message || 'Invalid selection';
  }
 }

 return (
  <button
   className={`loadout-slot-tile ${state.toLowerCase()} ${isEmpty ? 'empty' : ''}`}
   onClick={onClick}
   type="button"
  >
   <div className="slot-header">
    <span className="slot-label">{label}</span>
    {item?.confidence && <span className="slot-conf">{item.confidence}</span>}
   </div>

   <div className="slot-art-shell">
    {item?.imageUrl ? (
     <img src={item.imageUrl} alt={item.displayName} className="slot-image" />
    ) : (
     <div className="slot-image-fallback">{label.slice(0, 2).toUpperCase()}</div>
    )}
   </div>

   <div className="slot-name">
    {item ? item.displayName : `Select ${label}`}
   </div>

   {item && (
    <div className="slot-badges">
     <ReadinessBadge state={state as any} missingInputs={item.missingInputs} />
     {item.family && <span className="badge family">{item.family}</span>}
     {item.mechanic && <span className="badge mechanic">{item.mechanic}</span>}
    </div>
   )}

   {item?.missingInputs?.length ? (
    <div className="slot-warning">Missing: {item.missingInputs.join(', ')}</div>
   ) : null}

   {item?.blockedReasons?.length ? (
    <div className="slot-blocked">{item.blockedReasons[0]}</div>
   ) : null}

   {legalityWarning && (
    <div className="slot-blocked" style={{ color: '#e74c3c' }}>
     {legalityWarning}
    </div>
   )}
  </button>
 );
}
