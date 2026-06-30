import React from 'react';
import { OHMMLogo } from './OHMMLogo';

interface OHMMHeaderProps {
 tagline?: string;
}

export function OHMMHeader({ tagline = "Formula-backed loadout analysis with visible data confidence." }: OHMMHeaderProps) {
 return (
  <header className="ohmm-header">
   <div className="ohmm-header-brand">
    <OHMMLogo variant="full" size="md" />
    <div className="ohmm-header-copy">
     <h1>Once Human Meta Metrics</h1>
     <p className="ohmm-tagline">{tagline}</p>
    </div>
   </div>
  </header>
 );
}
