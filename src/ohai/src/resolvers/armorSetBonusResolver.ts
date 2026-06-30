import type { EffectPipelineItem } from './effectTypes';
import type { BuildSelection } from '../ui/types';
import { keyGearRegistry, armorRegistry } from '../ui/registries/armorRegistry';
import { armorSetMetaMap } from '../ui/registries/generated/armor-sets.generated';
import { effectSummaryToStatModifiers } from '../utils/statKeyMapper';
import { armorSetTierOverrides } from '../ui/registries/armorSetTierOverrides';
import { getConditionalEffect, hasConditionalEffect } from '../ui/registries/conditionalEffectRegistry';
import { evaluateConditionalEffect, defaultUptimeProfileName } from '../engine/conditionalEffectEngine';
import type { UptimeProfileName, CombatStateAssumptions } from '../engine/conditionalEffectTypes';

function getArmorSetPartialEffect(meta: unknown): string {
 return typeof (meta as { partialEffect?: unknown })?.partialEffect === 'string'
  ? (meta as { partialEffect: string }).partialEffect
  : '';
}

/**
 * armorSetBonusResolver
 * - Counts equipped pieces per armorSet (from selected armor ids' .armorSet field).
 * - For each detected set, emits EffectPipelineItem for the known pc thresholds (1pc..6pc) present in partialEffect text.
 * - If the N.pc line contains simple +X% patterns, uses effectSummaryToStatModifiers to produce statModifiers (no invention).
 * - Lines flagged "complex" by the generic regex are first checked against armorSetTierOverrides.ts, which
 *   carries hand-translated/verified statModifiers and (where the mechanic is a proc/stack/duration condition)
 *   a conditionalEffectId scaled by the same estimated-uptime engine used for cradle perks and mods.
 *   Only mechanics with no formula-engine stat hook at all remain statModifiers: [] / blocked.
 * - active = (pieceCount >= requiredPc)
 * - Also produces a "set composition" item for legality (mixed sets warning if >1 primary set + incomplete).
 * - Unresolved/unknown sets produce blocked Intel Gap items.
 */
export function resolveArmorSetBonuses(
  build: BuildSelection,
  uptimeProfile?: UptimeProfileName,
  customAssumptions?: Partial<CombatStateAssumptions>,
): EffectPipelineItem[] {
  const effectiveProfile = uptimeProfile ?? defaultUptimeProfileName();
  const results: EffectPipelineItem[] = [];
  const equipped: Array<{ id: string; set: string; slot: string }> = [];

  const getArmorId = (val: any): string => (typeof val === 'string' ? val : val?.id || '');
  for (const [slot, armorVal] of Object.entries(build.armor)) {
    const armorId = getArmorId(armorVal);
    if (!armorId || armorId === 'none') continue;
    // Support both key-gear (special keyword pieces) and regular armor set pieces (Lone Wolf, Shelterer, etc.)
    let piece: (typeof keyGearRegistry)[number] | (typeof armorRegistry)[number] | undefined = keyGearRegistry.find((a) => a.id === armorId);
    if (!piece) piece = armorRegistry.find((a) => a.id === armorId);
    if (piece) {
      const setName = (piece as any).armorSet || (piece as any).set || 'unknown';
      equipped.push({ id: armorId, set: setName, slot });
      // Also emit the individual piece so legacy tests + per-item UI see "armor-piece" entries (even if statModifiers empty -> display/partial)
      const pMods = (piece as any).statModifiers || [];
      // Scale piece contribution by the specific crafted tier + blueprint stars for this armor slot
      const eq = (build.armor as any)[slot];
      const aTier = (typeof eq === 'object' && eq?.tier) || 4;
      const aStars = (typeof eq === 'object' && eq?.stars) || 3;
      const scale = (1 + (aTier - 1) * 0.08) * (1 + aStars * 0.015);
      const scaledMods = pMods.map((sm: any) => ({
        stat: sm.stat as any,
        value: Math.round((sm.value * scale) * 1000) / 1000,
        unit: sm.unit === 'percent' ? 'percent' : 'flat' as const,
      }));
      results.push({
        sourceId: armorId,
        sourceName: (piece as any).name || armorId,
        sourceType: 'armor-piece',
        effectType: 'stat-buff',
        mechanicIds: (piece as any).keywordAssociations || [],
        statModifiers: scaledMods,
        confidence: (piece as any).confidence || 'partial',
        active: true,
        notes: (piece as any).effectSummary || `Piece of ${setName} set. (scaled by T${aTier} ${aStars}★)`,
      });
    }
  }

  if (equipped.length === 0) return results;

  // Count per set (handle variants like "Blackstone (Heat)")
  const counts = new Map<string, number>();
  const setPieces = new Map<string, string[]>();
  for (const e of equipped) {
    const norm = e.set;
    counts.set(norm, (counts.get(norm) || 0) + 1);
    if (!setPieces.has(norm)) setPieces.set(norm, []);
    setPieces.get(norm)!.push(e.slot);
  }

  // Legality / mixed set note item
  const primarySets = Array.from(counts.keys());
  if (primarySets.length > 1) {
    results.push({
      sourceId: 'armor-set-composition',
      sourceName: 'Armor Set Composition',
      sourceType: 'armor-set-bonus',
      effectType: 'utility',
      mechanicIds: [],
      statModifiers: [],
      confidence: 'partial',
      active: true,
      notes: `Mixed sets detected: ${primarySets.join(' + ')}. Most set bonuses require 3-4 pieces of ONE set. Current counts: ${Array.from(counts.entries()).map(([s,c])=>`${s}:${c}`).join(', ')}.`,
      blockedReason: 'Mixed armor sets — bonuses for secondary sets may not reach activation thresholds.',
      intelLinks: [{ label: 'Armor set data', path: 'src/ui/registries/generated/armor-sets.generated.ts' }],
    });
  }

  for (const [setName, count] of counts.entries()) {
    const meta = armorSetMetaMap[setName] || armorSetMetaMap[setName.replace(/\s*\(.*\)$/, '')];
    if (!meta) {
      results.push({
        sourceId: `armor-set-${setName}-unknown`,
        sourceName: `${setName} (unresolved set)`,
        sourceType: 'armor-set-bonus',
        effectType: 'set-bonus',
        mechanicIds: [],
        statModifiers: [],
        confidence: 'blocked',
        active: false,
        blockedReason: `No structured bonus data for set "${setName}". Piece count: ${count}.`,
        notes: 'Armor set name verified from registry but effects not yet modeled in resolver. See partialEffect text in generated data.',
        intelLinks: [{ label: 'Armor sets verified data', path: 'data/verified/armor-sets.verified.json' }],
      });
      continue;
    }

    const effectText = getArmorSetPartialEffect(meta);
    // Split numbered lines e.g. "1.  Foo\n2.  Bar+5%"
    const lines = effectText.split(/\n/).map((l: string) => l.trim()).filter(Boolean);

    for (const line of lines) {
      // crude pc detection: leading "1. ", "2. " etc or "1pc" style
      const pcMatch = line.match(/^(\d)[\.\s]/) || line.match(/(\d)\s*pc/i);
      const requiredPc = pcMatch ? parseInt(pcMatch[1], 10) : 1;
      if (requiredPc < 1 || requiredPc > 6) continue;

      const isActive = count >= requiredPc;

      // Try to extract simple numeric modifiers from this line only (using the util that already handles CN/EN)
      const parsed = effectSummaryToStatModifiers(line);
      const simpleMods = parsed.map((p: any) => ({
        stat: p.stat as any,
        value: p.value,
        unit: (p.unit === 'percent' ? 'percent' : 'flat') as 'flat' | 'percent' | undefined,
      }));

      const isComplex = /stack|on hit|持续|每|上限|条件|温度|when|if |低|高|consume|after/i.test(line) || simpleMods.length === 0;

      const mechHints: string[] = [];
      if (/crit/i.test(line) || /暴击/i.test(line)) mechHints.push('crit');
      if (/元素|elemental|blaze|frost|shock|burn|异常|status/i.test(line)) mechHints.push('elemental');
      if (/burn|灼|blaze/i.test(line)) mechHints.push('burn');
      if (/frost|霜|寒/i.test(line)) mechHints.push('frostVortex');

      // Check for a hand-translated/verified override before falling back to the generic parser.
      // Override keys use `${setName}-${requiredPc}pc` (see armorSetTierOverrides.ts).
      const overrideKey = `${setName}-${requiredPc}pc`;
      const override = armorSetTierOverrides[overrideKey];

      if (override) {
        const hasCond = !!override.conditionalEffectId && hasConditionalEffect(override.conditionalEffectId);
        const condDef = hasCond ? getConditionalEffect(override.conditionalEffectId!) : undefined;
        const evaluation = hasCond && condDef
          ? evaluateConditionalEffect(condDef, effectiveProfile, effectiveProfile === 'custom' ? customAssumptions : undefined)
          : null;
        const contribution = evaluation ? evaluation.contributionFactor : 1.0;
        const scaledMods = override.statModifiers.map((sm) => ({
          stat: sm.stat as any,
          value: sm.value * contribution,
          unit: (sm.unit === 'percent' ? 'percent' : 'flat') as 'flat' | 'percent' | undefined,
        }));
        const conditionalSuffix = evaluation
          ? ` [Conditional: ${Math.round(evaluation.contributionFactor * 100)}% scale, ${Math.round(evaluation.effectiveUptime * 100)}% uptime, ${evaluation.effectiveStacks}/${evaluation.maxStacks} stacks. ${evaluation.explanation}]`
          : '';

        results.push({
          sourceId: `${setName}-set-${requiredPc}pc`,
          sourceName: `${setName} ${requiredPc}pc`,
          sourceType: 'armor-set-bonus',
          effectType: hasCond ? 'conditional' : 'set-bonus',
          mechanicIds: mechHints,
          statModifiers: scaledMods,
          conditionalEffects: evaluation ? [{
            effectId: override.conditionalEffectId!,
            contributionFactor: evaluation.contributionFactor,
            effectiveUptime: evaluation.effectiveUptime,
            status: evaluation.status,
          }] : undefined,
          confidence: scaledMods.length > 0 ? 'candidate' : 'partial',
          active: isActive,
          blockedReason: scaledMods.length === 0 ? 'No formula-engine stat hook exists for this mechanic — see armorSetTierOverrides.ts notes.' : undefined,
          notes: `${override.notes}${conditionalSuffix}`,
          intelLinks: [
            { label: `${setName} set data`, path: 'src/ui/registries/generated/armor-sets.generated.ts' },
            { label: 'Verified tier overrides + translation', path: 'src/ui/registries/armorSetTierOverrides.ts' },
          ],
        });
        continue;
      }

      results.push({
        sourceId: `${setName}-set-${requiredPc}pc`,
        sourceName: `${setName} ${requiredPc}pc`,
        sourceType: 'armor-set-bonus',
        effectType: 'set-bonus',
        mechanicIds: mechHints,
        statModifiers: simpleMods,
        confidence: simpleMods.length > 0 ? 'candidate' : 'partial',
        active: isActive,
        blockedReason: isComplex && simpleMods.length === 0 ? 'Complex conditional / stack / state effect described in partialEffect. Numeric contribution not auto-extracted to avoid invention.' : undefined,
        notes: line.length > 180 ? line.slice(0, 177) + '...' : line,
        intelLinks: [
          { label: `${setName} set data`, path: 'src/ui/registries/generated/armor-sets.generated.ts' },
        ],
      });
    }

    // Always emit a summary item for the set with current count (for UI + coverage)
    results.push({
      sourceId: `${setName}-set-summary`,
      sourceName: `${setName} (${count}pc equipped)`,
      sourceType: 'armor-set-bonus',
      effectType: 'set-bonus',
      mechanicIds: [],
      statModifiers: [],
      confidence: 'partial',
      active: count >= 3, // typical threshold
      notes: `Equipped ${count} piece(s) of ${setName}. ${effectText ? 'See individual pc effects for details.' : 'No pc effects listed.'}`,
    });
  }

  return results;
}
