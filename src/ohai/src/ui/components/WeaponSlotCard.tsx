import React from 'react';
import { LoadoutSlotCard } from './LoadoutSlotCard';

interface WeaponSlotCardProps {
 slot: string;
 weapon?: any;
 onSelect?: () => void;
}

export function WeaponSlotCard({ slot, weapon, onSelect }: WeaponSlotCardProps) {
 return (
  <div className="weapon-slot-card">
   <LoadoutSlotCard
    slot={slot}
    label={slot}
    value={weapon?.id}
    displayName={weapon?.name}
    imageUrl={weapon?.iconUrl}
    confidence={weapon?.confidence}
    missing={!weapon}
    onClick={onSelect}
   />
   {weapon && (
    <div className="weapon-meta">
     <span>{weapon.family}</span>
     {weapon.keywordAssociations?.length > 0 && (
      <span className="keyword">{weapon.keywordAssociations.join(', ')}</span>
     )}
    </div>
   )}
  </div>
 );
}
