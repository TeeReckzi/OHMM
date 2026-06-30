import type { EffectPipelineItem, EffectCoverage } from './effectTypes';
import type { BuildSelection } from '../ui/types';
import { resolveWeaponEffects } from './weaponEffectResolver';
import { resolveArmorSetBonuses } from './armorSetBonusResolver';
import { resolveModEffects } from './modEffectResolver';
import { resolveCradleEffects } from './cradleEffectResolver';
import { foodBuffRegistry } from '../ui/registries/foodBuffRegistry';
import { deviationRegistry } from '../ui/registries/deviationRegistry';
import { attachmentRegistry, getAttachment } from '../ui/registries/attachmentRegistry';
import { getFormulaSupport } from '../ui/registries/formulaSupportRegistry';

/**
 * Transitional canonical mod derivation boundary.
 *
 * Prefers the structured `modSelections` (UI source of truth with core/suffix).
 * Falls back to the legacy flat `mods` map.
 *
 * All calculation consumers should go through this instead of directly reading
 * `build.mods` or `build.modSelections`.
 */
export function deriveCanonicalModIds(build: BuildSelection): string[] {
  const selections = build.modSelections;
  if (selections && Object.keys(selections).length > 0) {
    const ids: string[] = [];
    const keys = [
      'weaponCore', 'weaponSuffix',
      'headCore', 'headSuffix',
      'maskCore', 'maskSuffix',
      'chestCore', 'chestSuffix',
      'glovesCore', 'glovesSuffix',
      'pantsCore', 'pantsSuffix',
      'bootsCore', 'bootsSuffix',
    ] as const;

    for (const k of keys) {
      const v = (selections as any)[k];
      if (typeof v === 'string' && v && v !== 'none') {
        ids.push(v);
      }
    }
    if (ids.length > 0) return ids;
  }

  // Fallback to legacy flat map
  return Object.values(build.mods || {})
    .filter((id): id is string => typeof id === 'string' && !!id && id !== 'none');
}

/**
 * loadoutEffectResolver
 * Master aggregator. Replaces scattered per-category processing in formulaBridge.
 * Calls the four specialized resolvers + handles food/deviant/attachment in a unified pass.
 * Output is the single source of truth for:
 *   - modifierSources conversion (only active + has statModifiers)
 *   - conditionalEffects
 *   - the four BridgedEffect lists (modeled / partial / display / unresolved) — now derived from pipeline
 *   - EffectCoverage for UI
 *   - availableMechanics
 *   - per-item active effects for LoadoutPanel
 *
 * Preserves previous behavior for items that had working statModifiers.
 * Everything unknown/unmodeled surfaces with Intel Gap data instead of vanishing.
 */
export function loadoutEffectResolver(
  build: BuildSelection,
  mode: 'pve' | 'pvp' = 'pvp',
  uptimeProfile?: any,
  customAssumptions?: any
): {
  effects: EffectPipelineItem[];
  coverage: EffectCoverage;
  availableMechanics: string[];
} {
  const all: EffectPipelineItem[] = [];

  // 1. Weapon + keyword
  const weaponId = build.weapon?.blueprintId;
  if (weaponId) {
    all.push(...resolveWeaponEffects(weaponId));
  }

  // 2. Armor set bonuses (includes piece counts + composition legality)
  all.push(...resolveArmorSetBonuses(build, uptimeProfile, customAssumptions));

  // 3. Mods (core / suffix / substat rows)
  // Transitional canonical derivation: prefer structured modSelections (UI source of truth),
  // fall back to legacy flat mods. This prevents the previous divergence where UI changes
  // were ignored by the calculation pipeline.
  const modIds = deriveCanonicalModIds(build);
  all.push(...resolveModEffects(modIds, uptimeProfile, customAssumptions));

  // 4. Cradle (with conditional evaluation + cap)
  all.push(...resolveCradleEffects(build, uptimeProfile, customAssumptions));

  // 5. Food / drink / deviation / attachments (lightweight unified pass using existing registry data)
  const chefBonusPercent = build.food?.chefRex?.enabled ? Math.min(42, build.food.chefRex.bonusPercent) : 0;
  const chefBonusMultiplier = build.food?.chefRex?.enabled
    ? 1 + Math.max(0, chefBonusPercent) / 100
    : 1;
  const scaleFoodModifier = (sm: any) => ({
    stat: sm.stat as any,
    value: sm.value * chefBonusMultiplier,
    unit: sm.unit === 'percent' ? 'percent' : 'flat',
  });

  const foodId = build.food?.food;
  if (foodId && foodId !== 'none') {
    const f = foodBuffRegistry.find((x) => x.id === foodId);
    if (f) {
      const mods = (f as any).statModifiers || [];
      const fs = getFormulaSupport(f as any);
      all.push({
        sourceId: foodId,
        sourceName: (f as any).name || foodId,
        sourceType: 'food',
        effectType: 'stat-buff',
        mechanicIds: (f as any).keywordAssociations || [],
        statModifiers: mods.map(scaleFoodModifier),
        confidence: fs.status === 'fully-modeled' ? 'verified' : 'candidate',
        active: true,
        notes: `${(f as any).effectSummary}${chefBonusMultiplier > 1 ? ` Chef Rex scales this active food buff by ${build.food.chefRex.bonusPercent}%.` : ''}`,
      });
    }
  }
  const drinkId = build.food?.drink;
  if (drinkId && drinkId !== 'none' && drinkId !== foodId) {
    const d = foodBuffRegistry.find((x) => x.id === drinkId);
    if (d) {
      const mods = (d as any).statModifiers || [];
      all.push({
        sourceId: drinkId,
        sourceName: (d as any).name || drinkId,
        sourceType: 'drink',
        effectType: 'stat-buff',
        mechanicIds: [],
        statModifiers: mods.map(scaleFoodModifier),
        confidence: 'candidate',
        active: true,
        notes: chefBonusMultiplier > 1 ? `Chef Rex scales this active drink buff by ${build.food.chefRex.bonusPercent}%.` : undefined,
      });
    }
  }

  const devId = build.deviant?.id;
  if (devId && devId !== 'none') {
    const dv = deviationRegistry.find((x) => x.id === devId);
    if (dv) {
      const mods = (dv as any).statModifiers || [];
      all.push({
        sourceId: devId,
        sourceName: (dv as any).name || devId,
        sourceType: 'deviation',
        effectType: 'stat-buff',
        mechanicIds: (dv as any).keywordAssociations || [],
        statModifiers: mods.map((sm: any) => ({ stat: sm.stat as any, value: sm.value, unit: sm.unit === 'percent' ? 'percent' : 'flat' })),
        confidence: 'candidate',
        active: true,
        notes: (dv as any).effectSummary,
      });
    }
  }

  const attachSlots = ['optic', 'muzzle', 'magazine', 'tactical', 'stock'] as const;
  for (const slot of attachSlots) {
    const aid = build.weapon?.attachments?.[slot];
    if (aid && aid !== 'none') {
      const att = getAttachment(aid);
      if (att) {
        const mods = (att as any).statModifiers || [];
        all.push({
          sourceId: `${aid}-${slot}`,
          sourceName: `${(att as any).name || aid} (${slot})`,
          sourceType: 'attachment',
          effectType: 'stat-buff',
          mechanicIds: [],
          statModifiers: mods.map((sm: any) => ({ stat: sm.stat as any, value: sm.value, unit: sm.unit === 'percent' ? 'percent' : 'flat' })),
          confidence: 'candidate',
          active: true,
        });
      }
    }
  }

  // Dedup by sourceId (defensive)
  const seen = new Set<string>();
  const effects = all.filter((e) => {
    if (seen.has(e.sourceId)) return false;
    seen.add(e.sourceId);
    return true;
  });

  // Compute coverage (maps to the BridgedEffect categories the bridge already exposes)
  let fully = 0, partial = 0, display = 0, unresolved = 0;
  for (const e of effects) {
    if (!e.active) { unresolved++; continue; }
    if (e.confidence === 'verified' && e.statModifiers.length > 0) fully++;
    else if ((e.confidence === 'candidate' || e.confidence === 'partial') && e.statModifiers.length > 0) partial++;
    else if (e.statModifiers.length === 0 && !e.blockedReason) display++;
    else unresolved++;
  }
  const total = effects.length;
  const coverage: EffectCoverage = {
    fullyModeled: fully,
    partiallyModeled: partial,
    displayOnly: display,
    unresolved,
    totalConsidered: total,
    summary: `${fully} fully / ${partial} partial / ${display} display / ${unresolved} unresolved`,
  };

  // Collect mechanics from active effects that declare them
  const mechanics = new Set<string>();
  for (const e of effects) {
    if (e.active) for (const m of e.mechanicIds) mechanics.add(m);
  }

  return { effects, coverage, availableMechanics: Array.from(mechanics) };
}

export function effectsToModifierSources(effects: EffectPipelineItem[]): any[] {
  // Helper for bridge: convert active pipeline items with stats into ModifierSource-like rows.
  // (Bridge will still do final id prefixing / confidence mapping / aggregation.)
  return effects
    .filter((e) => e.active && e.statModifiers.length > 0)
    .flatMap((e) =>
      e.statModifiers.map((sm, i) => ({
        id: `pipeline-${e.sourceId}-${sm.stat}-${i}`,
        sourceType: e.sourceType as any,
        sourceLabel: e.sourceName,
        stat: sm.stat,
        value: sm.value,
        behavior: 'additive',
        confidence: e.confidence === 'verified' ? 'confirmed' : e.confidence === 'blocked' ? 'inferred' : 'observed_in_game_needs_testing',
        mechanicId: e.mechanicIds[0],
        notes: e.notes || `From loadoutEffectResolver: ${e.sourceType}`,
      }))
    );
}
