import { Shield, Sparkles, Swords, Zap } from 'lucide-react';

export function ArmoryStage() {
 return (
  <section className="panel armory-stage">
   <div className="panel-header">
    <div>
     <p className="eyebrow">Build Forge</p>
     <h3>Armory Stage</h3>
    </div>

    <span className="armory-threat">Status Hybrid</span>
   </div>

   <div className="armory-stage-shell">
    <div className="armory-weapon-showcase burn-theme">
     <div className="weapon-energy" />

     <div className="weapon-frame">
      <Swords size={34} />
     </div>

     <div className="weapon-meta">
      <strong>Corrosion</strong>
      <small>Burn Matrix • Tier 5</small>
     </div>
    </div>

    <div className="armory-gear-grid">
     <ArmorySlot label="Helmet" value="Mayfly Goggles" />
     <ArmorySlot label="Mask" value="Agent Mask" />
     <ArmorySlot label="Chest" value="Shelterer" />
     <ArmorySlot label="Gloves" value="Gilded Gloves" active />
     <ArmorySlot label="Pants" value="Blackstone" />
     <ArmorySlot label="Boots" value="Old Huntsman" />
    </div>

    <div className="armory-support-strip">
     <SupportNode icon={Sparkles} title="Deviant" value="Pyro Dino" />
     <SupportNode icon={Zap} title="Mods" value="5 Linked" />
     <SupportNode icon={Shield} title="PvP" value="Moderate Risk" />
    </div>
   </div>
  </section>
 );
}

function ArmorySlot({
 label,
 value,
 active
}: {
 label: string;
 value: string;
 active?: boolean;
}) {
 return (
  <button className={`armory-slot ${active ? 'active' : ''}`} type="button">
   <small>{label}</small>
   <strong>{value}</strong>
  </button>
 );
}

function SupportNode({
 icon: Icon,
 title,
 value
}: {
 icon: typeof Sparkles;
 title: string;
 value: string;
}) {
 return (
  <div className="support-node">
   <Icon size={16} />
   <span>
    <small>{title}</small>
    <strong>{value}</strong>
   </span>
  </div>
 );
}
