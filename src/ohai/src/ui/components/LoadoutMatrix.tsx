import { useState } from 'react';
import { Shield, Crosshair, Layers3, X } from 'lucide-react';
import { getArmorSelectionId, type BuildSelection, type ModSelections } from '../types';
import { LoadoutSlotTile } from './LoadoutSlotTile';
import { ActiveSetEffectsPanel } from './ActiveSetEffectsPanel';
import { getArmorById } from '../registries/armorRegistry';
import { getWeapon } from '../registries/weaponRegistry';
import { buildWeaponSelectorItems } from '../selectors/weaponSelectorBuilder';
import { weaponRegistry } from '../registries/weaponRegistry';

interface LoadoutMatrixProps {
 build: BuildSelection;
 onBuildChange: (build: BuildSelection) => void;
 onOpenWeaponSelector: () => void;
 onOpenArmorSelector: (slot: string) => void;
}

interface CalibrationDrawerProps {
 slot: string;
 build: BuildSelection;
 onBuildChange: (build: BuildSelection) => void;
 onClose: () => void;
}

const ARMOR_SLOTS = [
 { key: 'helmet', label: 'Helmet', icon: 'H' },
 { key: 'mask', label: 'Mask', icon: 'M' },
 { key: 'chest', label: 'Chest', icon: 'C' },
 { key: 'gloves', label: 'Gloves', icon: 'G' },
 { key: 'pants', label: 'Pants', icon: 'P' },
 { key: 'boots', label: 'Boots', icon: 'B' },
] as const;

function CalibrationDrawer({ slot, build, onBuildChange, onClose }: CalibrationDrawerProps) {
 const isWeapon = slot === 'primaryWeapon';
 const modSlot = slot === 'helmet' ? 'head' : slot === 'chest' ? 'chest' : slot === 'pants' ? 'pants' : slot;
 const coreKey = isWeapon ? 'weaponCore' : `${modSlot}Core` as keyof ModSelections;
 const suffixKey = isWeapon ? 'weaponSuffix' : `${modSlot}Suffix` as keyof ModSelections;
 const coreValue = (build.modSelections ?? {} as any)[coreKey] ?? '';
 const suffixValue = (build.modSelections ?? {} as any)[suffixKey] ?? '';

 return (
  <div className="calibration-drawer" onClick={(e) => e.target === e.currentTarget && onClose()}>
   <div className="calibration-drawer-panel">
    <div className="calibration-drawer-header">
     <h3>{isWeapon ? 'Weapon Calibration & Mods' : `${slot} Calibration & Mods`}</h3>
     <button onClick={onClose} className="armory-picker-close" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 10px', color: '#dbe7ff', cursor: 'pointer' }}>
      <X size={18} />
     </button>
    </div>
    <div className="calibration-drawer-body">
     {isWeapon ? (
      <>
       <div className="calibration-field">
        <label>Calibration</label>
        <select
         value={build.weapon.calibration}
         onChange={(e) => onBuildChange({ ...build, weapon: { ...build.weapon, calibration: e.target.value } })}
        >
         <option value="Rapid / Precision">Rapid / Precision</option>
         <option value="Heavy / Impact">Heavy / Impact</option>
         <option value="Balanced">Balanced</option>
        </select>
       </div>
       <div className="calibration-field">
        <label>Stars</label>
        <select
         value={build.weapon.stars}
         onChange={(e) => onBuildChange({ ...build, weapon: { ...build.weapon, stars: Number(e.target.value) as any } })}
        >
         {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}★</option>)}
        </select>
       </div>
       <div className="calibration-field">
        <label>Tier</label>
        <select
         value={build.weapon.tier}
         onChange={(e) => onBuildChange({ ...build, weapon: { ...build.weapon, tier: Number(e.target.value) as any } })}
        >
         {[1,2,3,4,5].map(t => <option key={t} value={t}>Tier {t}</option>)}
        </select>
       </div>
      </>
     ) : (
      <>
       <div className="calibration-field">
        <label>Stars (if applicable)</label>
        <input type="number" min={1} max={6} value={1} disabled />
       </div>
      </>
     )}
     <div className="calibration-field">
      <label>Core Mod</label>
      <select value={coreValue} onChange={(e) => onBuildChange({ ...build, modSelections: { ...build.modSelections, [coreKey]: e.target.value || undefined } })}>
       <option value="">None</option>
       <option value="violent">Violent</option>
       <option value="precision">Precision</option>
       <option value="status-amplifier">Status Amplifier</option>
       <option value="elemental-overload">Elemental Overload</option>
       <option value="crit-boost">Crit Boost</option>
      </select>
     </div>
     {coreValue && (
      <div className="calibration-field">
       <label>Suffix Mod</label>
       <select value={suffixValue} onChange={(e) => onBuildChange({ ...build, modSelections: { ...build.modSelections, [suffixKey]: e.target.value || undefined } })}>
        <option value="">None</option>
        <option value="amplified">Amplified</option>
        <option value="focused">Focused</option>
        <option value="extended">Extended</option>
       </select>
      </div>
     )}
     {isWeapon && (
      <div className="calibration-field">
       <label>Ammo</label>
       <select
        value={build.weapon.attachments.ammo}
        onChange={(e) => onBuildChange({ ...build, weapon: { ...build.weapon, attachments: { ...build.weapon.attachments, ammo: e.target.value } } })}
       >
        <option value="copper-ammo">Copper Ammo</option>
        <option value="steel-ammo">Steel Ammo</option>
        <option value="ap-ammo">AP Ammo</option>
       </select>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}

export function LoadoutMatrix({ build, onBuildChange, onOpenWeaponSelector, onOpenArmorSelector: _onOpenArmorSelector }: LoadoutMatrixProps) {
 const [calibrationSlot, setCalibrationSlot] = useState<string | null>(null);
 const weapon = getWeapon(build.weapon.blueprintId) as any;

 const getSetName = (slot: string): string | null => {
  const val = build.armor[slot as keyof typeof build.armor];
  const id = typeof val === 'string' ? val : (val as any)?.id || '';
  const piece = getArmorById ? getArmorById(id) : undefined;
  return (piece as any)?.setName || null;
 };

 const setCounts: Record<string, number> = {};
 ARMOR_SLOTS.forEach(({ key }) => {
  const setName = getSetName(key);
  if (setName) setCounts[setName] = (setCounts[setName] || 0) + 1;
 });

 const hasSynergy = (slot: string): boolean => {
  const setName = getSetName(slot);
  return setName ? (setCounts[setName] || 0) >= 2 : false;
 };

 return (
  <div className="tactical-column">
   <div className="column-header">
    <Shield size={18} color="var(--theme-text, #9ff7ff)" />
    <div>
     <p>Inputs</p>
     <h3>Loadout Matrix</h3>
    </div>
   </div>

   <div className="loadout-matrix">
    <div className="weapon-master-slot">
     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <Crosshair size={16} color="var(--theme-text, #9ff7ff)" />
      <span className="slot-label" style={{ fontSize: '0.7rem' }}>Primary Weapon</span>
      <span style={{ fontSize: '0.62rem', color: '#6b7496', marginLeft: 'auto' }}>
       {build.weapon.stars}★ T{build.weapon.tier}
      </span>
     </div>
     <LoadoutSlotTile
      slotId="primaryWeapon"
      label={weapon?.name || 'Select Weapon'}
      item={(() => {
       const items = buildWeaponSelectorItems(weaponRegistry);
       return items.find(i => i.id === build.weapon.blueprintId);
      })()}
      onClick={onOpenWeaponSelector}
      context={{}}
     />
     <button
      onClick={() => setCalibrationSlot('primaryWeapon')}
      style={{
       width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10,
       border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
       color: '#9eb2d5', fontSize: '0.72rem', cursor: 'pointer', display: 'flex',
       alignItems: 'center', gap: 6, marginTop: 4
      }}
     >
      <Layers3 size={14} /> Calibration & Mods
      <span style={{ marginLeft: 'auto', color: '#6b7496' }}>{build.weapon.calibration}</span>
     </button>
    </div>

    <div className="weapon-master-slot" style={{ padding: '12px' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Shield size={16} color="var(--theme-text, #9ff7ff)" />
      <span className="slot-label" style={{ fontSize: '0.7rem' }}>Armor Configuration</span>
     </div>

     <div className="armor-hex-grid">
      {ARMOR_SLOTS.map(({ key, label }) => {
       const armorId = getArmorSelectionId(build.armor[key as keyof typeof build.armor]);
       const armorPiece = getArmorById ? getArmorById(armorId) : undefined;
       const itemName = (armorPiece as any)?.name || 'Empty';
       const setName = getSetName(key);
       const synergy = hasSynergy(key);

       return (
        <div
         key={key}
         className="armor-hex-item"
         onClick={() => setCalibrationSlot(key)}
        >
         <div className={key === 'helmet' || key === 'chest' || key === 'pants' ? '' : ''}>
          <span className="slot-label">{label}</span>
         </div>
         <div className="item-name">{itemName}</div>
         {setName && <div className="set-name" style={{ color: synergy ? 'var(--theme-text, #9ff7ff)' : undefined }}>{setName}</div>}
         {!armorPiece && <div style={{ fontSize: '0.68rem', color: '#6b7496', marginTop: 4 }}>Click to select</div>}
         <div className={`synergy-glow ${synergy ? 'active' : ''}`} />
        </div>
       );
      })}
     </div>

     <ActiveSetEffectsPanel armor={build.armor} />
    </div>
   </div>

   {calibrationSlot && (
    <CalibrationDrawer
     slot={calibrationSlot}
     build={build}
     onBuildChange={onBuildChange}
     onClose={() => setCalibrationSlot(null)}
    />
   )}
  </div>
 );
}
