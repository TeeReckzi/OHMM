import type { EffectPipelineItem } from './effectTypes';
import type { CanonicalWeapon } from '../ui/itemTypes';
import { weaponRegistry } from '../ui/registries/weaponRegistry';
import { getFormulaSupport } from '../ui/registries/formulaSupportRegistry';
import { MECHANIC_KEYWORDS } from '../ui/formulaBridge'; // reuse mapping if stable; fallback local

const LOCAL_MECHANIC_MAP: Record<string, string> = {
  burn: 'burn',
  blaze: 'burn',
  frost: 'frostVortex',
  frostVortex: 'frostVortex',
  powerSurge: 'powerSurge',
  surge: 'powerSurge',
  unstableBomber: 'unstableBomber',
  bomber: 'unstableBomber',
  shrapnel: 'shrapnel',
  bounce: 'bounce',
};

function mapKeywordToMechanic(kw: string | undefined): string | undefined {
  if (!kw) return undefined;
  const lower = kw.toLowerCase();
  for (const [k, m] of Object.entries(LOCAL_MECHANIC_MAP)) {
    if (lower.includes(k)) return m;
  }
  return undefined;
}

/**
 * weaponEffectResolver
 * Exposes the selected weapon blueprint + its keyword/proc as first-class effects.
 * - Base weapon stats (damagePerProjectile etc) are handled as base in bridge (not here as "modifier").
 * - Keyword proc: produces a 'weapon-keyword' item. If formulaSupport marks the mechanic modeled/partial,
 *   may carry statModifiers from registry if present. Otherwise Intel Gap style (statModifiers empty,
 *   notes + intel link to recon reports).
 * - No invention: only what the weapon entry + formulaSupport + keywordAssociations provide.
 */
export function resolveWeaponEffects(weaponBlueprintId: string): EffectPipelineItem[] {
  const results: EffectPipelineItem[] = [];
  const w = weaponRegistry.find((ww) => ww.id === weaponBlueprintId) as CanonicalWeapon | undefined;
  if (!w) return results;

  const fs = getFormulaSupport(w as any);
  const mechanics: string[] = [];
  for (const kw of w.keywordAssociations ?? []) {
    const m = mapKeywordToMechanic(kw);
    if (m) mechanics.push(m);
  }
  for (const tag of w.tags ?? []) {
    const m = mapKeywordToMechanic(tag);
    if (m) mechanics.push(m);
  }
  const uniqueMechs = Array.from(new Set(mechanics));

  // Base weapon entry (usually display or partial via its own stats if any)
  const baseStatMods = (w as any).statModifiers ?? [];
  results.push({
    sourceId: w.id,
    sourceName: w.name,
    sourceType: 'weapon',
    effectType: 'base-stat',
    mechanicIds: uniqueMechs,
    statModifiers: baseStatMods.map((sm: any) => ({
      stat: sm.stat as any,
      value: sm.value,
      unit: sm.unit === 'percent' ? 'percent' : 'flat',
    })),
    confidence: (w.confidence as any) ?? 'candidate',
    active: true,
    notes: `Weapon blueprint. Base stats (DPS, crit, fire rate) extracted separately in bridge. Keyword: ${(w as any).keyword ?? 'none'}.`,
    intelLinks: fs.status === 'unmodeled' || fs.status === 'partially-modeled'
      ? [{ label: 'Formula support / keyword research', path: 'docs/research-notes/combat-real-table-scan-report.md' }]
      : undefined,
  });

  // Keyword / proc effect (the main "weapon effects" requirement)
  const runtimeW: any = w;
  const weaponKw = runtimeW.keyword || (runtimeW.keywordAssociations && runtimeW.keywordAssociations[0]);
  if (weaponKw || uniqueMechs.length > 0) {
    const kw = weaponKw || uniqueMechs[0];
    const mech = uniqueMechs[0] || mapKeywordToMechanic(weaponKw);
    const supportStatus = fs.status;
    const isModeled = supportStatus === 'fully-modeled' || supportStatus === 'partially-modeled';
    // Only carry explicit statModifiers from the weapon entry itself (rare; most weapon DMG is base).
    // Proc/keyword specific (e.g. burn tick amps) come via mod/cradle/set that target the mechanic.
    const keywordMods = ((w as any).statModifiers ?? []).filter((sm: any) =>
      (sm.stat || '').toLowerCase().includes('bonus') || (sm.stat || '').toLowerCase().includes(String(kw || '').toLowerCase())
    );

    const item: EffectPipelineItem = {
      sourceId: `${w.id}-keyword-${kw || 'proc'}`,
      sourceName: `${w.name} (${kw || 'proc'})`,
      sourceType: 'weapon-keyword',
      effectType: 'proc',
      mechanicIds: uniqueMechs.length ? uniqueMechs : (mech ? [mech] : []),
      statModifiers: keywordMods.map((sm: any) => ({ stat: sm.stat as any, value: sm.value, unit: sm.unit === 'percent' ? 'percent' : 'flat' })),
      confidence: isModeled ? 'candidate' : 'blocked',
      active: true,
      blockedReason: !isModeled && mech ? 'Keyword proc details (tick rate, stack scaling, interaction with recon 0.5 blocks) are candidate from combat_property_inner_data. Full bindict V2+ pending.' : undefined,
      notes: `Weapon keyword effect. ${w.effectSummary ?? ''} Support: ${supportStatus}. See recon for e202/96_10 candidates.`,
      intelLinks: [
        { label: 'e202 / Burn Clustering', path: 'docs/research-notes/e202-keyword-clustering-report.md' },
        { label: 'combat_property row reconstruction (0.5 blocks, 2415 anchors)', path: 'docs/research-notes/combat-property-row-reconstruction.md' },
      ],
    };
    results.push(item);
  }

  return results;
}
