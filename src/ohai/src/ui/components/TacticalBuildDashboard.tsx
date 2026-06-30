import { getArmorSelectionId, type BuildSelection, type WeaponBlueprint } from '../types';
import type { CatalogItem } from '../data/catalog';
import { BuildDNA } from './BuildDNA';
import { NeuralSynergyPanel } from './NeuralSynergyPanel';
import { TacticalLoadoutFrame, type TacticalLoadoutNode } from './TacticalLoadoutFrame';
import { VisualLoadoutBoard, type VisualLoadoutPickerTarget } from './VisualLoadoutBoard';

interface TacticalBuildDashboardProps {
 build: BuildSelection;
 weapon: WeaponBlueprint;
 armorOptions: CatalogItem[];
 modOptions: CatalogItem[];
 deviantOptions: CatalogItem[];
 foodOptions: CatalogItem[];
 onBuildChange: (build: BuildSelection) => void;
 openPicker: (picker: VisualLoadoutPickerTarget) => void;
}

const slotLabels: Record<keyof BuildSelection['armor'], string> = {
 head: 'Head',
 mask: 'Mask',
 chest: 'Chest',
 gloves: 'Gloves',
 pants: 'Pants',
 boots: 'Boots'
};

function makeFrameNodes(build: BuildSelection, weapon: WeaponBlueprint): TacticalLoadoutNode[] {
  const armorNodes = (Object.keys(build.armor) as Array<keyof BuildSelection['armor']>).map((slot) => ({
  id: slot,
  label: slotLabels[slot],
  equippedItem: getArmorSelectionId(build.armor[slot]),
  state: slot === 'gloves' && getArmorSelectionId(build.armor[slot]).includes('gilded') ? 'optimized' as const : 'estimated' as const,
  synergyActive: slot === 'gloves' && getArmorSelectionId(build.armor[slot]).includes('gilded'),
  warning: slot === 'chest' ? 'formula check' : undefined
 }));

 return [
  ...armorNodes,
  {
   id: 'weapon',
   label: 'Weapon',
   equippedItem: weapon.name,
   state: 'verified' as const,
   synergyActive: true
  }
 ];
}

function mapDamageProfileToElement(profile: string): 'burn' | 'frost' | 'shock' | 'fortress' | 'weakspot' {
 const normalized = profile.toLowerCase();
 if (normalized.includes('frost')) return 'frost';
 if (normalized.includes('shock')) return 'shock';
 if (normalized.includes('weak')) return 'weakspot';
 if (normalized.includes('fortress') || normalized.includes('kinetic')) return 'fortress';
 return 'burn';
}

export function TacticalBuildDashboard({
 build,
 weapon,
 armorOptions,
 modOptions,
 deviantOptions,
 foodOptions,
 onBuildChange,
 openPicker
}: TacticalBuildDashboardProps) {
 const nodes = makeFrameNodes(build, weapon);

 return (
  <section className="tactical-build-dashboard">
   <div className="tactical-dashboard-left">
    <VisualLoadoutBoard
     build={build}
     weapon={weapon}
     armorOptions={armorOptions}
     modOptions={modOptions}
     deviantOptions={deviantOptions}
     foodOptions={foodOptions}
     onBuildChange={onBuildChange}
     openPicker={openPicker}
    />
   </div>

   <div className="tactical-dashboard-center">
    <TacticalLoadoutFrame
     nodes={nodes}
     activeElement={mapDamageProfileToElement(weapon.damageProfile)}
    />
   </div>

   <div className="tactical-dashboard-right">
    <BuildDNA build={build} weapon={weapon} />
    <NeuralSynergyPanel build={build} weapon={weapon} />
   </div>
  </section>
 );
}
