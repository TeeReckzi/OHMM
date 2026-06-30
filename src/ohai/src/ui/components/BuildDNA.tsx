import type { BuildSelection, WeaponBlueprint } from '../types';

export type BuildDNAClass =
 | 'Burst Aggressor'
 | 'Status Hybrid'
 | 'Sustained Attrition'
 | 'PvP Duelist'
 | 'Weakspot Hunter'
 | 'Elemental Glass Cannon';

export interface BuildDNAProfile {
 primary: BuildDNAClass;
 secondary: BuildDNAClass;
 riskProfile: 'Low' | 'Moderate' | 'High';
 complexity: 'Simple' | 'Advanced' | 'Expert';
 reliability: 'Stable' | 'Conditional' | 'Volatile';
 tags: string[];
}

export function classifyBuildDNA(build: BuildSelection, weapon: WeaponBlueprint): BuildDNAProfile {
 const keyword = `${weapon.keyword} ${weapon.damageProfile}`.toLowerCase();
 const modCount = Object.values(build.mods).filter((id) => id && id !== 'none').length;
 const cradleCount = build.cradle.perks.length;
 const chefEnabled = build.food.chefRex.enabled;

 let primary: BuildDNAClass = 'Sustained Attrition';
 let secondary: BuildDNAClass = 'PvP Duelist';

 const isStatusElemental = weapon.damageProfile === 'burn' || weapon.damageProfile === 'shock' || keyword.includes('surge');
 if (isStatusElemental) {
  primary = 'Status Hybrid';
  secondary = chefEnabled ? 'Elemental Glass Cannon' : 'Sustained Attrition';
 }

 if (keyword.includes('weakspot')) {
  primary = 'Weakspot Hunter';
  secondary = 'Burst Aggressor';
 }

 if (keyword.includes('bomber')) {
  primary = 'Burst Aggressor';
  secondary = 'Elemental Glass Cannon';
 }

 const riskProfile = (primary as BuildDNAClass) === 'Elemental Glass Cannon' || secondary === 'Elemental Glass Cannon'
  ? 'High'
  : modCount >= 5
   ? 'Moderate'
   : 'Low';

 const complexity = cradleCount >= 6 || modCount >= 6
  ? 'Expert'
  : cradleCount >= 3 || modCount >= 4
   ? 'Advanced'
   : 'Simple';

 const reliability = primary === 'Burst Aggressor'
  ? 'Volatile'
  : primary === 'Status Hybrid'
   ? 'Conditional'
   : 'Stable';

 return {
  primary,
  secondary,
  riskProfile,
  complexity,
  reliability,
  tags: [weapon.keyword, `${build.weapon.stars} stars`, `Tier ${build.weapon.tier}`, `${cradleCount}/8 Cradle`]
 };
}

export function BuildDNA({ build, weapon }: { build: BuildSelection; weapon: WeaponBlueprint }) {
 const profile = classifyBuildDNA(build, weapon);

 return (
  <article className="panel build-dna-panel">
   <div className="panel-header">
    <div>
     <p className="eyebrow">Build DNA</p>
     <h3>Combat Identity</h3>
    </div>
    <span className="soft-status">{profile.reliability}</span>
   </div>

   <div className="dna-stack">
    <div className="dna-pattern primary">
     <small>Primary pattern</small>
     <strong>{profile.primary}</strong>
    </div>
    <div className="dna-pattern">
     <small>Secondary pattern</small>
     <strong>{profile.secondary}</strong>
    </div>
   </div>

   <div className="dna-stat-grid">
    <DnaStat label="Risk" value={profile.riskProfile} />
    <DnaStat label="Complexity" value={profile.complexity} />
    <DnaStat label="Reliability" value={profile.reliability} />
   </div>

   <div className="dna-tag-row">
    {profile.tags.map((tag) => <span key={tag}>{tag}</span>)}
   </div>
  </article>
 );
}

function DnaStat({ label, value }: { label: string; value: string }) {
 return (
  <div className="dna-stat">
   <small>{label}</small>
   <strong>{value}</strong>
  </div>
 );
}
