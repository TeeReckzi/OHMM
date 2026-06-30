import type { BuildSelection, WeaponBlueprint } from '../types';

export interface SynergyLink {
 id: string;
 from: string;
 to: string;
 label: string;
 strength: 'low' | 'medium' | 'high';
 reason: string;
}

export function deriveSynergyLinks(build: BuildSelection, weapon: WeaponBlueprint): SynergyLink[] {
 const links: SynergyLink[] = [];
 const keyword = `${weapon.keyword} ${weapon.damageProfile}`.toLowerCase();
 const armorValues = Object.values(build.armor).join(' ').toLowerCase();
 const modValues = Object.values(build.mods).join(' ').toLowerCase();
 const cradleValues = build.cradle.perks.join(' ').toLowerCase();

 if (keyword.includes('burn') || keyword.includes('surge') || keyword.includes('shock')) {
  links.push({
   id: 'weapon-status-mods',
   from: 'Weapon',
   to: 'Mods',
   label: 'Status amplifier path',
   strength: modValues.includes('elemental') || modValues.includes('status') ? 'high' : 'medium',
   reason: 'Weapon keyword relies on status or elemental scaling support.'
  });
 }

 if (armorValues.includes('gilded')) {
  links.push({
   id: 'gloves-status',
   from: 'Gloves',
   to: 'Keyword',
   label: 'Key gear unlock path',
   strength: 'high',
   reason: 'Key gear slot appears to enable or alter keyword behavior.'
  });
 }

 if (cradleValues.includes('status') || cradleValues.includes('weapon') || cradleValues.includes('tactical')) {
  links.push({
   id: 'cradle-weapon',
   from: 'Cradle',
   to: 'Weapon',
   label: 'Cradle scaling path',
   strength: 'medium',
   reason: 'Selected cradle perks support weapon or status output.'
  });
 }

 if (build.food.chefRex.enabled) {
  links.push({
   id: 'food-output',
   from: 'Food',
   to: 'Damage Output',
   label: 'Food amplification',
   strength: build.food.chefRex.bonusPercent >= 38 ? 'high' : 'medium',
   reason: `Chef Rex bonus is active at ${build.food.chefRex.bonusPercent}%.`
  });
 }

 return links;
}

export function NeuralSynergyPanel({ build, weapon }: { build: BuildSelection; weapon: WeaponBlueprint }) {
 const links = deriveSynergyLinks(build, weapon);

 return (
  <article className="panel neural-synergy-panel">
   <div className="panel-header">
    <div>
     <p className="eyebrow">Neural Links</p>
     <h3>Why This Build Works</h3>
    </div>
    <span className="soft-status">{links.length} links</span>
   </div>

   <div className="synergy-map">
    {links.length ? links.map((link) => (
     <div key={link.id} className={`synergy-link ${link.strength}`}>
      <div className="synergy-route">
       <span>{link.from}</span>
       <i />
       <span>{link.to}</span>
      </div>
      <strong>{link.label}</strong>
      <small>{link.reason}</small>
     </div>
    )) : (
     <div className="synergy-empty">
      <strong>No major links detected yet.</strong>
      <small>Add key gear, mods, food, or cradle perks to reveal relationship paths.</small>
     </div>
    )}
   </div>
  </article>
 );
}
