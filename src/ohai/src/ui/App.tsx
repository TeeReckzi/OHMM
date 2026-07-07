// Legacy redirect - UI logic has been moved to src/app/App.tsx for the new Figma UI design.
// All formulas and components are now populated in the Figma structure.
import { useCallback, useMemo, useState } from 'react';
import { Activity, Info, Layers3, Swords } from 'lucide-react';
import { weaponBlueprints, type CatalogItem } from './data/catalog';
import { weaponRegistry } from './registries/weaponRegistry';
import { keyGearRegistry, armorRegistry } from './registries/armorRegistry';
import { normalizeArmorSlot } from './selectors/normalization';
import { getWeapon as getRegistryWeapon } from './registries/weaponRegistry';
import { BuildIdentityProvider } from './components/BuildIdentity';
import { computeCombatOutput } from './combatOutput';
import { buildCalculationInputFromSelection } from './formulaBridge';
import { buildExpectedDamageFromCalculationInput } from './formulaDamageAdapter';
import type { UptimeProfileName, CombatStateAssumptions } from '../engine/conditionalEffectTypes';
import { SavedBuildsPanel } from './components/SavedBuildsPanel';
import { sanitizeBuildOnLoad } from './savedBuildSchema';
import { OHAI_VERSION } from './version';
import { OHMMHeader } from './components/OHMMHeader';
import { IntelGapPanel } from './components/IntelGapPanel';
import { ItemPickerDrawer } from './components/ItemPickerDrawer';
import { SelectorModal } from './components/SelectorModal';
import { buildWeaponSelectorItems } from './selectors/weaponSelectorBuilder';
import { getArmorSelectionId } from './types';
import type {
 BuildSelection,
 DamageProfile,
 ModSelection,
 ProjectionMetric,
} from './types';
import { applyWeaponSelection } from './loadoutOptions';

import { LoadoutMatrix } from './components/LoadoutMatrix';
import { ScalerEngine } from './components/ScalerEngine';
import { CombatSimulation } from './components/CombatSimulation';

import './tactical-columns.css';

type LegacyModSelectionValue = string | { core?: string; suffix?: string } | undefined;

const normalizeModSelectionRecord = (
 mods: ModSelection | undefined
): Record<string, { core?: string; suffix?: string }> => {
 if (!mods) return {};
 const result: Record<string, { core?: string; suffix?: string }> = {};
 const source = mods as Record<string, LegacyModSelectionValue>;
 // Use explicit legacy slot keys matching the actual runtime shape of attacker.mods
 const legacySlots = ['weapon', 'mask', 'helmet', 'chest', 'gloves', 'pants', 'boots'];

 for (const slot of legacySlots) {
  const val = source[slot];
  if (typeof val === 'string') {
   result[slot] = { core: val };
  } else if (val && typeof val === 'object') {
   result[slot] = { core: val.core, suffix: val.suffix };
  }
 }
 return result;
};

const normalizeArmorSelectionIds = (
 armor: BuildSelection['armor']
): { helmet?: string; mask?: string; gloves?: string; torso?: string; legs?: string; boots?: string } => ({
 helmet: getArmorSelectionId(armor.head),
 mask: getArmorSelectionId(armor.mask),
 torso: getArmorSelectionId(armor.chest),
 gloves: getArmorSelectionId(armor.gloves),
 legs: getArmorSelectionId(armor.pants),
 boots: getArmorSelectionId(armor.boots),
});

const defaultChefBonus = 0;

const defaultAmmoByCategory: Record<string, string> = {
 copper: 'copper-ammo',
 steel: 'steel-ammo',
 ap: 'ap-ammo',
 demolition: 'demolition-ammo',
 arrow: 'arrow',
 none: 'none',
};

const defaultBuild = (id: string, role: 'attacker' | 'defender', label: string): BuildSelection => {
 const defaultWeapon = getRegistryWeapon(weaponBlueprints[0].id);
 const defaultAmmoId = defaultWeapon
  ? defaultAmmoByCategory[defaultWeapon.defaultAmmoCategory] ?? 'none'
  : 'none';
 return {
  id,
  label,
  role,
  weapon: {
   blueprintId: weaponBlueprints[0].id,
   stars: 3,
   tier: 4,
   calibration: 'Rapid / Precision',
   attachments: {
    optic: 'none',
    muzzle: 'none',
    magazine: 'none',
    tactical: 'none',
    stock: 'none',
    ammo: defaultAmmoId,
   },
  },
  armor: {
   head: 'lonewolf-head',
   mask: 'shelterer-mask',
   chest: 'blackstone-chest',
   gloves: 'gilded-gloves',
   pants: 'renegade-pants',
   boots: 'bastille-boots',
  },
  mods: {
   weapon: 'violent',
   head: 'precision',
   mask: 'status-amplifier',
   chest: 'elemental-overload',
   gloves: 'crit-boost',
   pants: 'violent',
   boots: 'precision',
  },
  // Explicit core + suffix selections (UI source of truth)
  modSelections: {
   weaponCore: 'violent',
   weaponSuffix: undefined,
   headCore: 'precision',
   headSuffix: undefined,
   maskCore: 'status-amplifier',
   maskSuffix: undefined,
   chestCore: 'elemental-overload',
   chestSuffix: undefined,
   glovesCore: 'crit-boost',
   glovesSuffix: undefined,
   pantsCore: 'violent',
   pantsSuffix: undefined,
   bootsCore: 'precision',
   bootsSuffix: undefined,
  },
  cradle: {
   perks: ['tactical-combo', 'status-enhancement', 'light-weapon-mastery'],
  },
  deviant: {
   id: 'pyro-dino',
   trait: 'Damage support trait',
  },
  food: {
   food: 'safety-sandwich',
   drink: 'anti-gravity-milkshake',
   chefRex: {
    enabled: true,
    bonusPercent: defaultChefBonus,
   },
  },
 };
};

type PickerTarget =
 | { id: string; label: string; value: string; options: CatalogItem[]; onChange: (value: string) => void }
 | null;

function getWeapon(build: BuildSelection): any {
 return weaponBlueprints.find((w) => w.id === build.weapon.blueprintId) ?? weaponBlueprints[0];
}

function App() {
 const [mode, setMode] = useState<'pve' | 'pvp'>('pvp');
 const [attacker, setAttacker] = useState<BuildSelection>(() => defaultBuild('attacker-build', 'attacker', 'Your Build'));
 const [activeTab, setActiveTab] = useState<'forge' | 'encounter' | 'simulator'>('forge');
 const [picker, setPicker] = useState<PickerTarget>(null);
 const [pveTargetId, setPveTargetId] = useState<string>('training-dummy');
 const [uptimeProfile, setUptimeProfile] = useState<UptimeProfileName>('realistic');

 const [customCombatAssumptions, setCustomCombatAssumptions] = useState<Partial<CombatStateAssumptions>>({});
 const [showBuildsPanel, setShowBuildsPanel] = useState(false);
 const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
 const [buildName, setBuildName] = useState('Your Build');
 const [showIntelDrawer, setShowIntelDrawer] = useState(false);
 const [intelTopic] = useState<'ttk' | 'simulator' | 'encounter' | null>(null);

 // Phase 3 selector modal state (primary weapon only for this batch)
 const [showWeaponSelector, setShowWeaponSelector] = useState(false);

 // Armor selector state (incremental addition)
 const [armorSelector, setArmorSelector] = useState<{
  open: boolean;
  slot: string;
  title: string;
 }>({ open: false, slot: '', title: '' });

 const handleLoadBuild = useCallback((saved: import('./savedBuildSchema').SavedBuild) => {
  // Sprint C-A: Run through sanitization checkpoint first
  const { build: sanitizedBuild, warnings, errors } = sanitizeBuildOnLoad(saved);

  if (errors.length > 0) {
   console.error('[sanitizeBuildOnLoad] Errors:', errors);
   // Still attempt to load what we can, but surface issues
  }
  if (warnings.length > 0) {
   console.warn('[sanitizeBuildOnLoad] Warnings for loaded build:', warnings);
   // In real UI these could go to an IntelGap style panel
  }

  const finalBuild = sanitizedBuild || saved.build;

  setAttacker({ ...finalBuild, role: 'attacker' });
  setMode(saved.gameMode);
  setBuildName(saved.buildName);
  setCurrentBuildId(saved.buildId);
  if (saved.uptimeProfile) {
   setUptimeProfile(saved.uptimeProfile as UptimeProfileName);
  }
  if (saved.customAssumptions && Object.keys(saved.customAssumptions).length > 0) {
   setCustomCombatAssumptions(saved.customAssumptions as Partial<CombatStateAssumptions>);
  }
  if (saved.pveTargetId) {
   setPveTargetId(saved.pveTargetId);
  }
  if (saved.gameMode === 'pve' && saved.pveTargetId) {
   setPveTargetId(saved.pveTargetId);
  }
 }, []);

 const handleBuildIdAssigned = useCallback((id: string, name: string) => {
  setCurrentBuildId(id);
  setBuildName(name);
 }, []);

 const attackerWeapon = (getRegistryWeapon(attacker.weapon.blueprintId) || getWeapon(attacker)) as { damageProfile: DamageProfile };

 const attackerCalcInput = useMemo(
  () => buildCalculationInputFromSelection(attacker, mode, mode === 'pve' ? pveTargetId : undefined, uptimeProfile, customCombatAssumptions),
  [attacker, mode, pveTargetId, uptimeProfile, customCombatAssumptions],
 );

 const attackerCombatOutput = useMemo(
  () => computeCombatOutput(attackerCalcInput, attackerCalcInput.pvpMitigation),
  [attackerCalcInput],
 );

 const formulaResult = useMemo(() => {
  if (!attackerCalcInput) return undefined;
  try {
   return buildExpectedDamageFromCalculationInput(attackerCalcInput, attackerCalcInput.baseWeaponDMG);
  } catch {
   return undefined;
  }
 }, [attackerCalcInput]);

 const formulaDamage = formulaResult?.formulaDamage;
 const rawMultipliers = formulaResult?.formulaMultipliers ?? [];
 const formulaMultipliers = rawMultipliers.map(m => ({ name: m.label, multiplier: m.multiplier, category: m.source }));

 // === CORRECTED BOUNDARY (double-mult bug fixed) ===
 // formulaDamage coming from the adapter is ALREADY the engine's expectedDamage
 // (baseDamage * product of the multipliers listed in formulaMultipliers).
 // See: engine/formulaApplicator.ts (apply* functions do the product + expectedDamage),
 //   formulaDamageAdapter.ts (extracts expectedDamage + multipliers).
 //
 // Previously the App was doing formulaDamage * totalMult again (M² inflation).
 // CombatOutput correctly used the adapter value directly.
 //
 // For display metrics we now trust the engine value.
 // The formulaMultipliers list is kept for breakdown/explanation UIs.
 const totalMult = formulaMultipliers.reduce((a, m) => a * m.multiplier, 1);
 const effectiveDmg = formulaDamage && formulaDamage > 0 ? Math.round(formulaDamage) : undefined;
 const dps = effectiveDmg ? Math.round(effectiveDmg * 2.35) : undefined;

 const metrics = useMemo<ProjectionMetric[]>(() => [
  {
   label: 'Damage / Shot',
   value: effectiveDmg ? effectiveDmg.toLocaleString() : '�',
   detail: effectiveDmg ? `Engine expected (post-multipliers): ${Math.round(formulaDamage!).toLocaleString()} (${formulaMultipliers.length} factors)` : 'Select a weapon with damage data',
   status: effectiveDmg ? 'ready' : 'blocked',
  },
  {
   label: 'Sustained DPS',
   value: dps ? dps.toLocaleString() : '�',
   detail: dps ? `Scaled from formula adapter damage @ 2.35 RPS (base fire rate)` : 'Requires weapon with base damage & fire rate',
   status: dps ? 'ready' : 'blocked',
  },
  {
   label: mode === 'pvp' ? 'PvP TTK Window' : 'PvE TTK Window',
   value: '�',
   detail: 'CLASSIFIED � partial recovery (see simulator / encounter for Request Intel)',
   status: 'blocked',
  },
  {
   label: 'Chef Rex Bonus',
   value: attacker.food.chefRex.enabled ? `${attacker.food.chefRex.bonusPercent}%` : 'Off',
   detail: 'Rating-derived curve; manual override supported',
   status: 'ready',
  },
 ], [formulaResult, formulaDamage, formulaMultipliers, mode, attacker.food.chefRex]);

 return (
  <BuildIdentityProvider profile={attackerWeapon.damageProfile}>
   <div className={`tactical-app-shell theme-${attackerWeapon.damageProfile}`}>
    <OHMMHeader />

    {/* Compact nav bar */}
    <div style={{
     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
     padding: '8px 20px', gap: 12,
     borderBottom: '1px solid rgba(118, 174, 255, 0.12)',
     background: 'rgba(2, 6, 16, 0.86)',
    }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
       onClick={() => setActiveTab('forge')}
       style={{
        padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
        background: activeTab === 'forge' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
        color: activeTab === 'forge' ? '#9ff7ff' : '#d9def1',
        fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
       }}
      >
       <Layers3 size={14} /> Forge
      </button>
      <button
       onClick={() => setActiveTab('encounter')}
       style={{
        padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
        background: activeTab === 'encounter' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
        color: activeTab === 'encounter' ? '#9ff7ff' : '#d9def1',
        fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
       }}
      >
       <Swords size={14} /> Encounter
      </button>
      <button
       onClick={() => setActiveTab('simulator')}
       style={{
        padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
        background: activeTab === 'simulator' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
        color: activeTab === 'simulator' ? '#9ff7ff' : '#d9def1',
        fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
       }}
      >
       <Activity size={14} /> Sim
      </button>
     </div>

     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
       onClick={() => setShowBuildsPanel(true)}
       style={{
        padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent', color: '#d9def1', fontSize: '0.78rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
       }}
      >
       <Info size={14} /> Builds
       {!currentBuildId && <span style={{ fontSize: '0.62rem', color: '#ffb84d', border: '1px solid rgba(255, 184, 77, 0.25)', background: 'rgba(255, 184, 77, 0.1)', borderRadius: 999, padding: '1px 6px' }}>Unsaved</span>}
      </button>
      <div className="mode-switch" role="group" aria-label="Encounter mode" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
       <button className={mode === 'pve' ? 'active' : ''} onClick={() => setMode('pve')} style={{ padding: '5px 12px', borderRadius: 999, border: 0, background: mode === 'pve' ? 'linear-gradient(135deg, rgb(var(--theme-rgb, 0, 240, 255)), #4d89ff)' : 'transparent', color: mode === 'pve' ? 'white' : '#d4daef', fontSize: '0.72rem', cursor: 'pointer' }}>PvE</button>
       <button className={mode === 'pvp' ? 'active' : ''} onClick={() => setMode('pvp')} style={{ padding: '5px 12px', borderRadius: 999, border: 0, background: mode === 'pvp' ? 'linear-gradient(135deg, rgb(var(--theme-rgb, 0, 240, 255)), #4d89ff)' : 'transparent', color: mode === 'pvp' ? 'white' : '#d4daef', fontSize: '0.72rem', cursor: 'pointer' }}>PvP</button>
      </div>
     </div>
    </div>

    {/* Three-column main layout */}
    <div className="tactical-main">
     <LoadoutMatrix
      build={attacker}
      onBuildChange={setAttacker}
      onOpenWeaponSelector={() => setShowWeaponSelector(true)}
      onOpenArmorSelector={(slot) => setArmorSelector({ open: true, slot, title: `Select ${slot}` })}
     />

     <ScalerEngine
      calcInput={attackerCalcInput}
      combatOutput={attackerCombatOutput}
      formulaDamage={formulaDamage}
      formulaMultipliers={formulaMultipliers}
      totalMult={totalMult}
      effectiveDmg={effectiveDmg}
      dps={dps}
     />

     <CombatSimulation
      combatOutput={attackerCombatOutput}
      calcInput={attackerCalcInput}
      metrics={metrics}
      effectiveDmg={effectiveDmg}
      dps={dps}
      mode={mode}
     />
    </div>

    {picker && <ItemPickerDrawer picker={picker} onClose={() => setPicker(null)} />}
    {showBuildsPanel && (
     <SavedBuildsPanel
      currentBuild={attacker}
      currentBuildName={buildName}
      currentMode={mode}
      currentUptimeProfile={uptimeProfile}
      currentCustomAssumptions={customCombatAssumptions}
      currentPveTargetId={pveTargetId}
      currentBuildId={currentBuildId}
      onLoadBuild={handleLoadBuild}
      onBuildIdAssigned={handleBuildIdAssigned}
      onUnsavedChanged={() => setCurrentBuildId(null)}
      onClose={() => setShowBuildsPanel(false)}
     />
    )}

    <footer style={{ textAlign: 'center', padding: '8px', fontSize: '0.75rem', color: '#6b7496' }}>
     OHMM v{OHAI_VERSION}
    </footer>

    {showIntelDrawer && intelTopic && (
     <IntelGapPanel topic={intelTopic} onClose={() => setShowIntelDrawer(false)} />
    )}

    <SelectorModal
     open={showWeaponSelector}
     slotId="primaryWeapon"
     title="Select Primary Weapon"
     description="Resolver-backed weapon selector."
     items={buildWeaponSelectorItems(weaponRegistry)}
     selectedId={attacker.weapon.blueprintId}
     onSelect={(id) => {
      setAttacker(applyWeaponSelection(attacker, id));
      setShowWeaponSelector(false);
     }}
     onClose={() => setShowWeaponSelector(false)}
     context={{
      primaryWeaponId: attacker.weapon.blueprintId,
      armor: normalizeArmorSelectionIds(attacker.armor),
      mods: normalizeModSelectionRecord(attacker.mods),
      attachments: attacker.weapon.attachments || {},
      ammo: attacker.weapon.attachments?.ammo,
      calibration: attacker.weapon.calibration,
     }}
    />

    <SelectorModal
     open={armorSelector.open}
     slotId={armorSelector.slot}
     title={armorSelector.title}
     items={
      [...armorRegistry, ...keyGearRegistry]
       .filter(a => normalizeArmorSlot((a as any).slot || (a as any).category || '') === armorSelector.slot)
       .map(a => ({
        id: a.id,
        displayName: a.name,
        canonicalKey: a.id,
        kind: 'armor' as const,
        family: (a as any).setName || (a as any).category,
        mechanic: (a as any).keywordAssociations?.[0],
        imageUrl: (a as any).iconUrl,
        confidence: (a as any).confidence,
        sourceLabel: (a as any).sourceNotes,
        readiness: 'READY' as const,
        missingInputs: [],
        blockedReasons: [],
        warnings: [],
       }))
     }
     selectedId={getArmorSelectionId(attacker.armor[armorSelector.slot as keyof typeof attacker.armor])}
     onSelect={(id) => {
      setAttacker({
       ...attacker,
       armor: { ...attacker.armor, [armorSelector.slot]: id }
      });
      setArmorSelector({ ...armorSelector, open: false });
     }}
     onClose={() => setArmorSelector({ ...armorSelector, open: false })}
     context={{
      primaryWeaponId: attacker.weapon.blueprintId,
      armor: normalizeArmorSelectionIds(attacker.armor),
      mods: normalizeModSelectionRecord(attacker.mods),
      attachments: attacker.weapon.attachments || {},
      ammo: attacker.weapon.attachments?.ammo,
      calibration: attacker.weapon.calibration,
     }}
    />
   </div>
  </BuildIdentityProvider>
 );
}

export { App };
