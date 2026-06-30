import React from 'react';
import type { BuildSelection } from '../types';
import { resolveArmorSetBonuses } from '../../resolvers/armorSetBonusResolver';

function defaultBuild(id: string, role: 'attacker' | 'defender', label: string): BuildSelection {
 return {
  id, label, role,
  weapon: { blueprintId: '', stars: 3 as any, tier: 4 as any, calibration: '', attachments: { optic: '', muzzle: '', magazine: '', tactical: '', stock: '', ammo: '' } },
  armor: { head: '', mask: '', chest: '', gloves: '', pants: '', boots: '' },
  mods: {},
  cradle: { perks: [] },
  deviant: { id: '', level: 1, activityRating: 1, trait: '' },
  food: { food: '', drink: '', chefRex: { enabled: false, skillRating: 1 as any, activityRating: 1 as any, bonusPercent: 0, mode: 'rating-derived' as const } },
 };
}

interface ActiveSetEffectsPanelProps {
 armor: BuildSelection['armor'];
}

export function ActiveSetEffectsPanel({ armor }: ActiveSetEffectsPanelProps) {
 const resolverBuild = {
  ...defaultBuild('set-panel-preview', 'attacker', 'Set Panel Preview'),
  armor,
 } as BuildSelection;

 const setEffects = resolveArmorSetBonuses(resolverBuild).filter((effect) => effect.sourceType === 'armor-set-bonus');
 const summaries = setEffects.filter((effect) => effect.sourceId.endsWith('-set-summary'));
 const tiers = setEffects.filter((effect) => !effect.sourceId.endsWith('-set-summary') && effect.effectType === 'set-bonus');

 return (
  <aside className="active-set-panel" aria-label="Active set effects">
   <div className="active-set-header">
    <p className="eyebrow">Active Effects</p>
    <h4>Armor Set Bonuses</h4>
   </div>
   {setEffects.length === 0 ? (
    <p className="active-set-empty">No verified armor set data for currently equipped pieces.</p>
   ) : (
    <div className="active-set-list">
     {summaries.map((summary) => {
      const setName = summary.sourceName.replace(/ \(.*\)$/, '');
      const setTiers = tiers.filter((tier) => tier.sourceName.startsWith(setName));
      return (
       <div className="active-set-row" key={summary.sourceId}>
        <strong>{summary.sourceName}</strong>
        {setTiers.length === 0 ? (
         <span>No tier text available.</span>
        ) : setTiers.map((tier) => (
         <span key={tier.sourceId} className={tier.active ? 'set-tier-active' : 'set-tier-inactive'}>
          {tier.active ? '✓' : '○'} {tier.sourceName.replace(setName, '').trim()}: {tier.notes || tier.blockedReason || 'Effect not verified'}
         </span>
        ))}
       </div>
      );
     })}
    </div>
   )}
  </aside>
 );
}
