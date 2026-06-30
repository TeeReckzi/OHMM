import React from 'react';

interface SelectorCardProps {
 id: string;
 name: string;
 imageUrl?: string;
 family?: string;
 mechanic?: string;
 readiness: string;
 confidence?: string;
 missingInputs?: string[];
 blockedReason?: string;
 onSelect: (id: string) => void;
 selected?: boolean;
}

export function SelectorCard({
 id, name, imageUrl, family, mechanic, readiness, confidence,
 missingInputs, blockedReason, onSelect, selected,
}: SelectorCardProps) {
 return (
  <button
   className={`selector-card ${selected ? 'selected' : ''} ${readiness.toLowerCase()}`}
   onClick={() => onSelect(id)}
  >
   {imageUrl ? <img src={imageUrl} alt={name} /> : <div className="no-image">No image</div>}
   <div className="card-body">
    <strong>{name}</strong>
    {family && <span className="meta">{family}</span>}
    {mechanic && <span className="meta">{mechanic}</span>}
    <div className="badges">
     {confidence && <span className="conf">{confidence}</span>}
     <span className={`readiness ${readiness.toLowerCase()}`}>{readiness}</span>
    </div>
    {missingInputs && missingInputs.length > 0 && (
     <div className="missing">Missing: {missingInputs.join(', ')}</div>
    )}
    {blockedReason && <div className="blocked">{blockedReason}</div>}
   </div>
  </button>
 );
}
