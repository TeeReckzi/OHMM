import React from 'react';
import { LoadoutSlotCard } from './LoadoutSlotCard';
import { ModSocketBadge } from './ModSocketBadge';

interface ArmorSlotCardProps {
 slot: string;
 armor?: any;
 coreMod?: string;
 suffixMod?: string;
 onSelect?: () => void;
}

export function ArmorSlotCard({ slot, armor, coreMod, suffixMod, onSelect }: ArmorSlotCardProps) {
 const modStatus = coreMod && suffixMod ? 'complete'
  : coreMod ? 'missing-suffix'
  : 'incomplete';

 return (
  <div className="armor-slot-card">
   <LoadoutSlotCard
    slot={slot}
    label={slot}
    value={armor?.id}
    displayName={armor?.name}
    imageUrl={armor?.iconUrl}
    confidence={armor?.confidence}
    missing={!armor}
    onClick={onSelect}
   />
   <div className="mod-sockets">
    <ModSocketBadge type="core" value={coreMod} status={modStatus as any} />
    <ModSocketBadge type="suffix" value={suffixMod} status={modStatus as any} />
   </div>
  </div>
 );
}
