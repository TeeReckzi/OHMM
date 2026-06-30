import type { CombatOutput } from '../combatOutput';
import type { CalculationInput } from '../formulaBridge';
import { getAmmo, isAmmoCompatible } from '../registries/ammoRegistry';
import { getWeapon } from '../registries/weaponRegistry';
import type { BuildSelection, CombatMode, ProjectionMetric, WeaponBlueprint } from '../types';

export type BuildTrustState = 'verified' | 'candidate' | 'blocked' | 'needs-validation';

export interface BuildIntelligenceSummary {
 trustState: BuildTrustState;
 damagePerShot: string;
 dps: string;
 ttk: string;
 outputBlockedReasons: string[];
 formulaStatus: string;
 unresolvedAssumptions: string[];
 registryConfidence: Array<{ label: string; value: string; state: BuildTrustState }>;
 compatibility: Array<{ label: string; value: string; state: BuildTrustState }>;
 insights: string[];
}

const EXPECTED_FAIL_MECHANICS = [
 'EBR fire ring scaling remains expected-fail until in-game validation.',
 'Frost Vortex model conflict remains expected-fail until resolved.',
 'Power Surge model conflict remains expected-fail until resolved.',
];

export function buildIntelligenceSummary({
 build,
 weapon,
 mode,
 metrics,
 calcInput,
 output,
}: {
 build: BuildSelection;
 weapon: WeaponBlueprint;
 mode: CombatMode;
 metrics: ProjectionMetric[];
 calcInput: CalculationInput;
 output: CombatOutput;
}): BuildIntelligenceSummary {
 const blockedMetrics = metrics.filter((metric) => metric.status === 'blocked');
 const candidateSignals = calcInput.partiallyModeledEffects.length + calcInput.displayOnlyEffects.length;
 const unresolvedSignals = calcInput.unresolvedEffects.length + calcInput.formulaWarnings.length + output.warnings.length;
 const trustState: BuildTrustState = unresolvedSignals > 0
  ? 'blocked'
  : candidateSignals > 0
   ? 'candidate'
   : blockedMetrics.length > 0
    ? 'needs-validation'
    : 'verified';

 const damageMetric = metrics.find((metric) => metric.label === 'Damage / Shot');
 const dpsMetric = metrics.find((metric) => metric.label === 'Sustained DPS');
 const ttkMetric = metrics.find((metric) => metric.label.includes('TTK'));
 const registryWeapon = getWeapon(build.weapon.blueprintId);
 const ammo = getAmmo(build.weapon.attachments.ammo);
 const ammoCompatible = build.weapon.attachments.ammo === 'none'
  || (registryWeapon && ammo ? isAmmoCompatible(registryWeapon.defaultAmmoCategory, ammo.ammoCategory) : false);

 const outputBlockedReasons = [
  ...blockedMetrics.map((metric) => `${metric.label}: ${metric.detail}`),
  ...calcInput.unresolvedEffects.slice(0, 4).map((effect) => `${effect.itemName}: ${effect.formulaSupport.notes ?? 'unresolved formula support'}`),
 ];

 const unresolvedAssumptions = [
  ...calcInput.formulaWarnings,
  ...output.warnings,
  ...EXPECTED_FAIL_MECHANICS,
 ];

 const registryConfidence = [
  { label: 'Weapon source', value: registryWeapon?.confidence ?? 'unknown', state: registryWeapon?.confidence === 'verified' ? 'verified' as const : 'needs-validation' as const },
  { label: 'Modeled effects', value: `${calcInput.modeledEffects.length}/${calcInput.totalItemsConsidered}`, state: calcInput.unresolvedEffects.length ? 'blocked' as const : 'candidate' as const },
  { label: 'Modifiers extracted', value: String(calcInput.totalModifiersExtracted), state: calcInput.totalModifiersExtracted > 0 ? 'verified' as const : 'needs-validation' as const },
  { label: 'Formula notes', value: String(calcInput.partialSupportNotes.length), state: calcInput.partialSupportNotes.length ? 'candidate' as const : 'verified' as const },
 ];

 const compatibility = [
  { label: 'Ammo', value: ammo ? (ammoCompatible ? ammo.name : `${ammo.name} incompatible`) : 'No ammo selected', state: ammoCompatible ? 'verified' as const : 'blocked' as const },
  { label: 'Encounter mode', value: mode.toUpperCase(), state: mode === 'pvp' ? 'needs-validation' as const : 'candidate' as const },
  { label: 'Accessories', value: 'Slot compatibility filtered where registry data exists', state: 'candidate' as const },
 ];

 const insights = [
  `${weapon.name} is currently profiled as ${weapon.keyword}.`,
  damageMetric?.status === 'ready'
   ? `Damage per shot is available: ${damageMetric.value}.`
   : 'Damage output is blocked until weapon/formula inputs resolve.',
  dpsMetric?.status === 'ready'
   ? `Sustained DPS projection available: ${dpsMetric.value}. This value is derived from current cadence assumptions and may change with different fire-rate or reload conditions.`
   : 'Sustained DPS cannot be projected. No cadence (fire rate / reload) data is available for the selected weapon.',
  candidateSignals > 0
   ? `${candidateSignals} effects are partial/display-only and cannot be treated as verified.`
   : 'No partial/display-only effects detected in the current bridge output.',
  ammoCompatible ? 'Current ammo selection passes compatibility checks.' : 'Current ammo selection is incompatible and blocks accuracy.',
 ];

 return {
  trustState,
  damagePerShot: damageMetric?.value ?? '— (missing base damage data)',
  dps: dpsMetric?.value ?? '— (missing cadence data)',
  ttk: ttkMetric?.value ?? '— (missing health or DPS data)',
  outputBlockedReasons,
  formulaStatus: output.officialFormula.status,
  unresolvedAssumptions,
  registryConfidence,
  compatibility,
  insights,
 };
}
