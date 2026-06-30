import React from 'react';

export type Readiness = 'READY' | 'PARTIAL' | 'DISPLAY_ONLY' | 'BLOCKED' | 'INVALID';

interface ReadinessBadgeProps {
 state: Readiness;
 missingInputs?: string[];
}

export function ReadinessBadge({ state, missingInputs }: ReadinessBadgeProps) {
 const label = state === 'READY' ? 'Ready'
  : state === 'PARTIAL' ? 'Partial'
  : state === 'DISPLAY_ONLY' ? 'Display Only'
  : state === 'BLOCKED' ? 'Blocked'
  : 'Invalid';

 return (
  <span className={`readiness-badge ${state.toLowerCase()}`}>
   {label}
   {missingInputs && missingInputs.length > 0 && (
    <span className="missing-hint"> ({missingInputs.join(', ')})</span>
   )}
  </span>
 );
}
