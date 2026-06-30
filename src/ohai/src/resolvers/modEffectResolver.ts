import type { EffectPipelineItem } from './effectTypes';
import { modRegistry, getMod } from '../ui/registries/modRegistry';
import { getFormulaSupport } from '../ui/registries/formulaSupportRegistry';
import { verifiedModConditionalEffectIds } from '../ui/registries/verifiedModFamilies';
import { getConditionalEffect, hasConditionalEffect } from '../ui/registries/conditionalEffectRegistry';
import { evaluateConditionalEffect, defaultUptimeProfileName } from '../engine/conditionalEffectEngine';
import type { UptimeProfileName, CombatStateAssumptions } from '../engine/conditionalEffectTypes';

/**
 * modEffectResolver
 * - Separates core vs suffix (uses modType on CanonicalMod).
 * - Each statModifier on a mod becomes an independent row (supports "substat" requirement).
 * - If a selected mod has modType=core but no statModifiers after merge (generated + parse), emit as unresolved with Intel Gap.
 * - Same for suffix.
 * - Substat rows are those beyond the first, or any with "sub" in tags/effectSummary (future-proof).
 * - Uses existing getFormulaSupport + registry confidence.
 * - Missing values never silently vanish: unresolvedEffects path + blockedReason + intel.
 * - Mods with a registered conditional-effect id (proc/stack/duration mechanics, see
 *   verifiedModFamilies.ts + conditionalEffectRegistry.ts) have their statModifiers scaled
 *   by the conditional engine's estimated contributionFactor (expected uptime × expected
 *   stacks) before being emitted — mirrors exactly how cradleEffectResolver.ts handles
 *   cradle perks. Unconditional flat mods pass through at full verified magnitude.
 */
export function resolveModEffects(
  selectedModIds: string[],
  uptimeProfile?: UptimeProfileName,
  customAssumptions?: Partial<CombatStateAssumptions>,
): EffectPipelineItem[] {
  const results: EffectPipelineItem[] = [];
  const effectiveProfile = uptimeProfile ?? defaultUptimeProfileName();

  for (const modId of selectedModIds) {
    if (!modId || modId === 'none' || modId === '') continue;
    const m = getMod(modId) || modRegistry.find((mm) => mm.id === modId);
    if (!m) continue;

    const fs = getFormulaSupport(m as any);
    const modType = (m as any).modType || (m.tags?.includes('core') ? 'core' : 'suffix');
    const isCore = modType === 'core' || (m as any).modType === 'core';
    const sourceType = isCore ? 'mod-core' : 'mod-suffix';

    const rawMods = (m as any).statModifiers || [];
    const hasExplicit = rawMods.length > 0;

    if (!hasExplicit) {
      // Missing substat / value case — must surface as Intel Gap, not vanish
      results.push({
        sourceId: m.id,
        sourceName: m.name,
        sourceType,
        effectType: isCore ? 'stat-buff' : 'stat-buff',
        mechanicIds: (m as any).keywordAssociations ?? [],
        statModifiers: [],
        confidence: 'blocked',
        active: true,
        blockedReason: 'No structured statModifiers after registry merge (generated + effectSummaryToStatModifiers + verified). This mod contributes only via description or pending V2 data.',
        notes: m.effectSummary || 'Effect text only.',
        intelLinks: [
          { label: 'Mod core/suffix verified source', path: 'data/verified/mod-cores.verified.json' },
          { label: 'Staging / parser for mod effects', path: 'src/parsers/extractModCoreEffects.ts' },
        ],
      });
      continue;
    }

    // Conditional (proc/stack/duration) scaling, mirrors cradleEffectResolver.ts exactly.
    const conditionalId = verifiedModConditionalEffectIds[m.id];
    const hasCond = !!conditionalId && hasConditionalEffect(conditionalId);
    const condDef = hasCond ? getConditionalEffect(conditionalId!) : undefined;
    const evaluation = hasCond && condDef
      ? evaluateConditionalEffect(condDef, effectiveProfile, effectiveProfile === 'custom' ? customAssumptions : undefined)
      : null;
    const contribution = evaluation ? evaluation.contributionFactor : 1.0;

    if (conditionalId && !hasCond) {
      // Declared a conditional id but the registry doesn't have it — surface as a gap rather than silently applying full value.
      results.push({
        sourceId: `${m.id}-cond-gap`,
        sourceName: `${m.name} (conditional effect missing)`,
        sourceType,
        effectType: 'conditional',
        mechanicIds: [],
        statModifiers: [],
        confidence: 'blocked',
        active: false,
        blockedReason: `Mod declares conditionalEffectId "${conditionalId}" but no matching entry exists in conditionalEffectRegistry.ts.`,
        notes: m.effectSummary,
      });
      continue;
    }

    // Each stat row is independent (core + suffix + "substat" rows)
    rawMods.forEach((sm: any, idx: number) => {
      const isSub = idx > 0 || /sub|random|additional|extra/i.test((m as any).effectSummary || '');
      const scaledValue = sm.value * contribution;
      const conditionalSuffix = evaluation
        ? ` [Conditional: ${Math.round(evaluation.contributionFactor * 100)}% scale, ${Math.round(evaluation.effectiveUptime * 100)}% uptime, ${evaluation.effectiveStacks}/${evaluation.maxStacks} stacks. ${evaluation.explanation}]`
        : '';
      results.push({
        sourceId: `${m.id}-${sm.stat}${isSub ? '-sub' : ''}`,
        sourceName: `${m.name}${isSub ? ' (substat)' : ''} — ${sm.stat}`,
        sourceType: isSub ? 'mod-substat' : sourceType,
        effectType: hasCond ? 'conditional' : 'stat-buff',
        mechanicIds: (m as any).keywordAssociations ?? [],
        statModifiers: [{
          stat: sm.stat as any,
          value: scaledValue,
          unit: sm.unit === 'percent' ? 'percent' : 'flat',
        }],
        conditionalEffects: evaluation ? [{
          effectId: conditionalId!,
          contributionFactor: evaluation.contributionFactor,
          effectiveUptime: evaluation.effectiveUptime,
          status: evaluation.status,
        }] : undefined,
        confidence: (m.confidence as any) ?? (fs.status === 'fully-modeled' ? 'verified' : 'candidate'),
        active: true,
        notes: `${isCore ? 'Core' : 'Suffix'} mod. ${m.effectSummary ?? ''} ${isSub ? '(treated as independent substat row per requirement)' : ''}${conditionalSuffix}`,
        intelLinks: fs.status !== 'fully-modeled' ? [{ label: 'Formula support for this mod', path: 'src/ui/registries/formulaSupportRegistry.ts' }] : undefined,
      });
    });

    if (evaluation && evaluation.warnings && evaluation.warnings.length) {
      results.push({
        sourceId: `${m.id}-cond-warning`,
        sourceName: `${m.name} (conditional warning)`,
        sourceType,
        effectType: 'conditional',
        mechanicIds: [],
        statModifiers: [],
        confidence: 'partial',
        active: evaluation.status !== 'unsupported-condition',
        blockedReason: evaluation.status === 'unsupported-condition' ? 'Unsupported condition — modifiers not applied in current engine.' : undefined,
        notes: evaluation.warnings.join(' | '),
      });
    }
  }

  return results;
}
