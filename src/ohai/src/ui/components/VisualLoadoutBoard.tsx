import { Crosshair, Heart, Sparkles } from 'lucide-react';
import { getArmorSelectionId, type BuildSelection, type WeaponBlueprint } from '../types';
import type { CatalogItem } from '../data/catalog';

export type VisualLoadoutPickerTarget =
 | { id: string; label: string; value: string; options: CatalogItem[]; onChange: (value: string) => void }
 | null;

interface VisualLoadoutBoardProps {
 build: BuildSelection;
 weapon: WeaponBlueprint;
 armorOptions: CatalogItem[];
 modOptions: CatalogItem[];
 deviantOptions: CatalogItem[];
 foodOptions: CatalogItem[];
 onBuildChange: (build: BuildSelection) => void;
 openPicker: (picker: VisualLoadoutPickerTarget) => void;
}

const armorSlotLabels: Record<keyof BuildSelection['armor'], string> = {
 head: 'Head',
 mask: 'Mask',
 chest: 'Chest',
 gloves: 'Gloves',
 pants: 'Pants',
 boots: 'Boots'
};

const armorSlotOrder: Array<keyof BuildSelection['armor']> = ['head', 'mask', 'chest', 'gloves', 'pants', 'boots'];

function findOption(options: CatalogItem[], id: string): CatalogItem | undefined {
 return options.find((item) => item.id === id);
}

function LoadoutTile({
 label,
 item,
 className = '',
 onClick
}: {
 label: string;
 item?: CatalogItem;
 className?: string;
 onClick?: () => void;
}) {
 return (
  <button className={`loadout-board-tile ${className}`} type="button" onClick={onClick}>
   <span className="loadout-board-label">{label}</span>
   <span className="loadout-board-art">
    {item?.iconUrl ? <img src={item.iconUrl} alt="" /> : <Sparkles size={24} />}
   </span>
   <strong>{item?.name ?? 'Empty Slot'}</strong>
   {item?.category && <small>{item.category}</small>}
  </button>
 );
}

export function VisualLoadoutBoard({
 build,
 weapon,
 armorOptions,
 deviantOptions,
 foodOptions,
 onBuildChange,
 openPicker
}: VisualLoadoutBoardProps) {
 const selectedDeviant = findOption(deviantOptions, build.deviant.id);
 const selectedFood = findOption(foodOptions, build.food.food);
 const selectedDrink = findOption(foodOptions, build.food.drink);
 const activeMods = Object.values(build.mods).filter((id) => id && id !== 'none').length;
 const activeCradle = build.cradle.perks.length;

 return (
  <article className="panel visual-loadout-board">
   <div className="panel-header">
    <div>
     <p className="eyebrow">OHMM Tactical Rig</p>
     <h3>{weapon.keyword} Build Matrix</h3>
    </div>
    <span className={`profile-pill ${weapon.damageProfile}`}>{weapon.damageProfile}</span>
   </div>

   <div className="loadout-board-shell">
    <button
     className="loadout-board-weapon"
     type="button"
     onClick={() => openPicker(null)}
     aria-label="Current weapon"
    >
     <span>
      <small>Primary Weapon</small>
      <strong>{weapon.name}</strong>
      <em>{build.weapon.stars}★ · Tier {build.weapon.tier}</em>
     </span>
     <span className="loadout-board-weapon-art">
      {weapon.iconUrl ? <img src={weapon.iconUrl} alt="" /> : <Crosshair size={42} />}
     </span>
    </button>

    <div className="loadout-body-grid">
     {armorSlotOrder.map((slot) => {
      const armorId = getArmorSelectionId(build.armor[slot]);
      const item = findOption(armorOptions, armorId);
      return (
       <LoadoutTile
        key={slot}
        label={armorSlotLabels[slot]}
        item={item}
        className={`slot-${slot}`}
        onClick={() => openPicker({
         id: `armor-${slot}`,
         label: armorSlotLabels[slot],
         value: armorId,
         options: armorOptions,
         onChange: (value) => onBuildChange({ ...build, armor: { ...build.armor, [slot]: value } })
        })}
       />
      );
     })}
    </div>

    <div className="loadout-module-strip">
     <LoadoutTile
      label="Deviant"
      item={selectedDeviant}
      className="support-tile"
      onClick={() => openPicker({
       id: 'deviant',
       label: 'Deviant',
       value: build.deviant.id,
       options: deviantOptions,
       onChange: (value) => onBuildChange({ ...build, deviant: { ...build.deviant, id: value } })
      })}
     />
     <LoadoutTile
      label="Food"
      item={selectedFood}
      className="support-tile"
      onClick={() => openPicker({
       id: 'food',
       label: 'Food',
       value: build.food.food,
       options: foodOptions.filter((item) => item.category === 'food'),
       onChange: (value) => onBuildChange({ ...build, food: { ...build.food, food: value } })
      })}
     />
     <LoadoutTile
      label="Drink"
      item={selectedDrink}
      className="support-tile"
      onClick={() => openPicker({
       id: 'drink',
       label: 'Drink',
       value: build.food.drink,
       options: foodOptions.filter((item) => item.category === 'drink'),
       onChange: (value) => onBuildChange({ ...build, food: { ...build.food, drink: value } })
      })}
     />
    </div>

    <div className="loadout-intel-ribbon">
     <span><Sparkles size={14} /> {activeCradle}/8 cradle</span>
     <span><Crosshair size={14} /> {activeMods} active mods</span>
     <span><Heart size={14} /> Chef Rex {build.food.chefRex.enabled ? `${build.food.chefRex.bonusPercent}%` : 'off'}</span>
    </div>
   </div>
  </article>
 );
}
