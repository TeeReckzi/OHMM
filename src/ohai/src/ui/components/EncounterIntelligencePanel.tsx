export interface EncounterProfile {
 id: string;
 name: string;
 armorProfile: string;
 elementalResistance: string;
 weakspotAccess: string;
 staggerWindow: string;
 threatLevel: 'Low' | 'Moderate' | 'High';
}

export function EncounterIntelligencePanel({
 encounter
}: {
 encounter: EncounterProfile;
}) {
 return (
  <article className="panel encounter-intelligence-panel">
   <div className="panel-header">
    <div>
     <p className="eyebrow">Encounter Intelligence</p>
     <h3>{encounter.name}</h3>
    </div>
    <span className="soft-status">{encounter.threatLevel} threat</span>
   </div>

   <div className="encounter-shell">
    <div className="encounter-avatar">
     <div className="encounter-core" />
    </div>

    <div className="encounter-data-grid">
     <EncounterStat label="Armor Profile" value={encounter.armorProfile} />
     <EncounterStat label="Elemental Resistance" value={encounter.elementalResistance} />
     <EncounterStat label="Weakspot Access" value={encounter.weakspotAccess} />
     <EncounterStat label="Stagger Window" value={encounter.staggerWindow} />
    </div>
   </div>
  </article>
 );
}

function EncounterStat({ label, value }: { label: string; value: string }) {
 return (
  <div className="encounter-stat">
   <small>{label}</small>
   <strong>{value}</strong>
  </div>
 );
}
