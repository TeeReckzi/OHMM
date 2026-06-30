import { useState } from 'react';

interface OHMMLogoProps {
 variant?: 'full' | 'mark' | 'icon';
 size?: 'sm' | 'md' | 'lg';
 className?: string;
}

const logoMap = {
 full: '/assets/ohmm/ohmm-logo.png',
 mark: '/assets/ohmm/ohmm-mark.png',
 icon: '/assets/ohmm/ohmm-icon.png',
};

export function OHMMLogo({ variant = 'full', size = 'md', className = '' }: OHMMLogoProps) {
 const [imageAvailable, setImageAvailable] = useState(true);
 const logoPath = logoMap[variant] || logoMap.full;

 const altText = variant === 'mark' ? 'OHMM mark' : variant === 'icon' ? 'OHMM icon' : 'OHMM logo';

 return (
  <div className={`ohmm-logo ohmm-logo-${size} ${variant !== 'full' ? 'mark-only' : ''} ${className}`}>
   {imageAvailable ? (
    <img src={logoPath} alt={altText} onError={() => setImageAvailable(false)} />
   ) : (
    <span className="ohmm-logo-fallback" aria-hidden="true">
     <span className="ohmm-fingerprint" />
     <span className="ohmm-network-mark">
      <i /><i /><i /><i /><i />
     </span>
    </span>
   )}
   {variant === 'full' && (
    <span className="ohmm-logo-copy">
     <strong>OHMM</strong>
     <small>Once Human Meta Metrics</small>
    </span>
   )}
  </div>
 );
}

// Legacy compatibility wrapper (temporary)
export { OHMMLogo as OHAILogo };
