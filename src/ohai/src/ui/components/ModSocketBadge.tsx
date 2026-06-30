import React from 'react';

interface ModSocketBadgeProps {
 type: 'core' | 'suffix';
 value?: string;
 status?: 'complete' | 'missing-suffix' | 'incomplete' | 'illegal';
}

export function ModSocketBadge({ type, value, status = 'incomplete' }: ModSocketBadgeProps) {
 const label = type === 'core' ? 'Core Mod' : 'Suffix';
 const statusText = status === 'complete' ? 'Mod complete'
  : status === 'missing-suffix' ? 'Suffix required'
  : status === 'illegal' ? 'Illegal slot'
  : 'Not selected';

 return (
  <div className={`mod-socket ${type} ${status}`}>
   <span className="socket-label">{label}</span>
   <span className="socket-value">{value || '—'}</span>
   <span className="socket-status">{statusText}</span>
  </div>
 );
}
