import type { EffectPipelineItem } from './effectTypes';
import type { BuildSelection } from '../ui/types';
import { cradleRegistry } from '../ui/registries/cradleRegistry';
import { getConditionalEffect, hasConditionalEffect } from '../ui/registries/conditionalEffectRegistry';
import { evaluateConditionalEffect, defaultUptimeProfileName } from '../engine/conditionalEffectEngine';
import type { UptimeProfileName, CombatStateAssumptions } from '../engine/conditionalEffectTypes';

/**
 * cradleEffectResolver
 * - Reuses conditionalEffectRegistry + evaluateConditionalEffect exactly (keeps current support).
 * - For each selected perk: produces one EffectPipelineItem with:
 *   - statModifiers from cradleRegistry entry (scaled later in bridge or here for display).
 *   - conditionalEffects summary (contributionFactor, uptime, stacks).
 *   - active based on evaluation + selection.
 *   - UI-friendly notes: "active contribution X%, uptime Y%".
 * - Cradle cap validation ( >8 ) emitted as a separate warning effect item (active=false, blocked).
 * - Unresolved cradle perks (no conditional def + no statModifiers) -> Intel Gap.
 */
export function resolveCradleEffects(
  build: BuildSelection,
  uptimeProfile?: UptimeProfileName,
  customAssumptions?: Partial<CombatStateAssumptions>
): EffectPipelineItem[] {
  const results: EffectPipelineItem[] = [];
  const effectiveProfile = uptimeProfile ?? defaultUptimeProfileName();

  const perks = build.cradle?.perks ?? [];
  const cap = 8;
  if (perks.length > cap) {
    results.push({
      sourceId: 'cradle-cap-violation',
      sourceName: 'Cradle Perk Cap',
      sourceType: 'cradle-perk',
      effectType: 'utility',
      mechanicIds: [],
      statModifiers: [],
      confidence: 'blocked',
      active: false,
      blockedReason: `Cradle perk cap exceeded (${perks.length} > ${cap}). Only first ${cap} should apply per game rules.`,
      notes: 'UI + legality must surface this. Registry allows any number but game enforces cap.',
    });
  }

  for (const perkId of perks) {
    const def = cradleRegistry.find((c) => c.id === perkId);
    if (!def) continue;

    const hasCond = hasConditionalEffect(perkId);
    const condDef = getConditionalEffect(perkId);
    const evaluation = hasCond && condDef
      ? evaluateConditionalEffect(condDef, effectiveProfile, effectiveProfile === 'custom' ? customAssumptions : undefined)
      : null;

    const rawMods = (def as any).statModifiers || [];
    const contribution = evaluation ? evaluation.contributionFactor : 1.0;
    const uptime = evaluation ? evaluation.effectiveUptime : 1.0;

    const scaledMods = rawMods.map((sm: any) => ({
      stat: sm.stat as any,
      value: sm.value * contribution,
      unit: sm.unit === 'percent' ? 'percent' : 'flat',
    }));

    const mech = (def as any).keywordAssociations || (def.tags || []).filter((t: string) => /burn|frost|surge|weapon/i.test(t));

    results.push({
      sourceId: perkId,
      sourceName: def.name,
      sourceType: 'cradle-perk',
      effectType: hasCond ? 'conditional' : 'stat-buff',
      mechanicIds: mech,
      statModifiers: scaledMods,
      conditionalEffects: evaluation ? [{
        effectId: perkId,
        contributionFactor: contribution,
        effectiveUptime: uptime,
        status: evaluation.status,
      }] : undefined,
      confidence: (def.confidence as any) ?? 'candidate',
      active: true,
      notes: `Cradle perk. ${def.effectSummary ?? ''} ${evaluation ? `Contribution: ${Math.round(contribution * 100)}% (uptime ${Math.round(uptime * 100)}%, stacks ${evaluation.effectiveStacks}/${evaluation.maxStacks})` : 'Always-active or simple buff.'}`,
      intelLinks: !hasCond ? [{ label: 'Conditional effect registry (add entry if time/stack based)', path: 'src/ui/registries/conditionalEffectRegistry.ts' }] : undefined,
    });

    if (evaluation && evaluation.warnings && evaluation.warnings.length) {
      // surface one note item for UI
      results.push({
        sourceId: `${perkId}-cond-warning`,
        sourceName: `${def.name} (conditional warning)`,
        sourceType: 'cradle-perk',
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
