import { Crosshair, Flame, Shield, Sparkles, Zap } from 'lucide-react';

const tacticalNodes = [
 { label: 'Weapon', value: 'Burn Matrix', icon: Flame, tone: 'hot' },
 { label: 'Key Gear', value: 'Gloves Link', icon: Sparkles, tone: 'active' },
 { label: 'Mods', value: 'Status Amp', icon: Zap, tone: 'active' },
 { label: 'Cradle', value: '3/8 Online', icon: Crosshair, tone: 'warn' },
 { label: 'Defense', value: 'PvP Check', icon: Shield, tone: 'cool' },
];

export function OHAITacticalPreview() {
 return (
  <aside className="ohai-tactical-preview" aria-label="OHAI tactical systems preview">
   <div className="ohai-preview-header">
    <div>
     <p>OHAI Tactical Layer</p>
     <strong>Build Intelligence Online</strong>
    </div>
    <span>Preview</span>
   </div>

   <div className="ohai-preview-core">
    <div className="ohai-preview-silhouette">
     <i className="node head" />
     <i className="node chest" />
     <i className="node gloves" />
     <i className="node boots" />
     <span className="scan-line" />
    </div>

    <div className="ohai-preview-links">
     {tacticalNodes.map(({ label, value, icon: Icon, tone }) => (
      <div key={label} className={`ohai-preview-link ${tone}`}>
       <Icon size={15} />
       <span>
        <small>{label}</small>
        <strong>{value}</strong>
       </span>
      </div>
     ))}
    </div>
   </div>

   <div className="ohai-preview-dna">
    <span>Status Hybrid</span>
    <span>Conditional</span>
    <span>High Synergy</span>
   </div>
  </aside>
 );
}
