import React from 'react';

interface IntelGapPanelProps {
 topic: string;
 onClose: () => void;
 researchLinks?: Array<{ label: string; path: string }>;
 children?: React.ReactNode;
}

export function IntelGapPanel({ topic, onClose, researchLinks, children }: IntelGapPanelProps) {
 const defaultLinks = [
  { label: 'e202 / Burn Clustering Data', path: 'docs/research-notes/e202-keyword-clustering-report.md' },
  { label: 'combat_property_inner_data Row Reconstruction', path: 'docs/research-notes/combat-property-row-reconstruction.md' },
  { label: 'Batch 2 — Resolve Expected Fails (PvP / models)', path: 'docs/agentic-tasks/batch-2-resolve-expected-fails.md' },
  { label: 'Batch 3 — Bindict V2+ (profiles / ammo)', path: 'docs/agentic-tasks/batch-3-bindict-v2-pipeline.md' },
 ];

 const links = researchLinks || defaultLinks;

 return (
  <div className="intel-drawer" onClick={onClose}>
   <div onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
    <h4>INTEL REQUEST — {topic.toUpperCase()}</h4>
    <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 12 }}>
     Deliberate intel gap. Data is PARTIAL RECOVERY pending full V2+ and in-game validation.
    </p>

    {children}

    <div style={{ margin: '12px 0' }}>
     {links.map((l, i) => (
      <a key={i} className="intel-link" href={`https://github.com/TeeReckzi/once-human-master-calculator/blob/main/${l.path}`} target="_blank" rel="noopener">
       {l.label}
      </a>
     ))}
    </div>

    <button onClick={onClose} style={{ width: '100%' }}>Close Intel Drawer</button>
   </div>
  </div>
 );
}
