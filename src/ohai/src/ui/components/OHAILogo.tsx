import { useState } from 'react';

interface OHAILogoProps {
 variant?: 'full' | 'mark';
 size?: 'sm' | 'md' | 'lg';
 className?: string;
}

const logoPath = '/assets/ohai/ohai-logo.png';

export function OHAILogo({ variant = 'full', size = 'md', className = '' }: OHAILogoProps) {
 const [imageAvailable, setImageAvailable] = useState(true);

 return (
  <div className={`ohai-logo ohai-logo-${size} ${variant === 'mark' ? 'mark-only' : ''} ${className}`}>
   {imageAvailable ? (
    <img src={logoPath} alt="OHAI" onError={() => setImageAvailable(false)} />
   ) : (
    <span className="ohai-logo-fallback" aria-hidden="true">
     <span className="ohai-fingerprint" />
     <span className="ohai-network-mark">
      <i /><i /><i /><i /><i />
     </span>
    </span>
   )}
   {variant === 'full' && (
    <span className="ohai-logo-copy">
     <strong>OHAI</strong>
     <small>Once Human Adaptive Intelligence</small>
    </span>
   )}
  </div>
 );
}
