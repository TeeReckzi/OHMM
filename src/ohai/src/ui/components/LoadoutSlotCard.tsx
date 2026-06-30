import React from 'react';

interface LoadoutSlotCardProps {
 slot: string;
 label: string;
 value?: string;
 displayName?: string;
 imageUrl?: string;
 confidence?: string;
 missing?: boolean;
 onClick?: () => void;
 children?: React.ReactNode;
}

export function LoadoutSlotCard({
 slot,
 label,
 value,
 displayName,
 imageUrl,
 confidence,
 missing,
 onClick,
 children,
}: LoadoutSlotCardProps) {
 return (
  <button
   className={`loadout-slot-card ${missing ? 'missing' : ''}`}
   onClick={onClick}
   type="button"
  >
   <div className="slot-header">
    <span className="slot-label">{label}</span>
    {confidence && <span className="slot-confidence">{confidence}</span>}
   </div>

   {imageUrl ? (
    <img src={imageUrl} alt={displayName || label} className="slot-image" />
   ) : (
    <div className="slot-image-fallback">No image</div>
   )}

   <div className="slot-name">{displayName || value || `Select ${label}`}</div>

   {missing && <div className="slot-warning">Slot empty — data incomplete</div>}

   {children}
  </button>
 );
}
