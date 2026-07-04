/**
 * Generate mod suffix stat values from decoded binary data.
 *
 * Reads: bindict_scan.json table 04192 (mod affix stat definitions)
 * Outputs:
 *   - src/ui/registries/generated/modSuffixStats.bindict.generated.ts
 *   - data/generated/decoded/reports/mod-suffix-unmapped.json
 *
 * Strict scope: Only emits statModifiers for affix IDs with non-empty
 * attr_no_list AND where ALL attr codes resolve to known StatKeys.
 * Does not infer mechanics. Generates reports for unmapped codes.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createPipelineConfig } from '../src/pipeline/config';
import { resolveAttrToStatKey, getAttrMapping } from '../src/pipeline/attrStatKeyMap';
import { safeWrite } from '../src/pipeline/safeWriter';

const OHAI_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(OHAI_ROOT, 'src', 'ui', 'registries', 'generated', 'modSuffixStats.bindict.generated.ts');

interface AffixTierEntry {
  affixId: number;
  tier: number;
  nameZhCn: string;
  attrNoList: string[];
  attrValueList: number[];
  descZhCn: string;
  iconPath: string;
  effectRange: number;
}

interface ResolvedAffixStat {
  affixId: number;
  nameZhCn: string;
  /** Mapped StatKey (null if unmapped) */
  statKey: string | null;
  /** Attr codes used */
  attrCodes: string[];
  /** Values per tier (tier 1-6) */
  tierValues: number[];
  /** Tiers available */
  maxTier: number;
}

interface UnmappedReport {
  unmappedAttrCodes: Array<{
    attrCode: string;
    nameZhCn: string;
    affixIds: number[];
    reason: string;
  }>;
  emptyAttrAffixes: Array<{
    affixId: number;
    nameZhCn: string;
    reason: string;
  }>;
  summary: {
    totalAffixIds: number;
    withAttrData: number;
    withoutAttrData: number;
    fullyMapped: number;
    partiallyMapped: number;
    unmappedAttrCodes: number;
  };
}

function extractText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.replace(/_\$S@TIDS\$_[a-z0-9]+\|\w+$/i, '').trim();
  if (typeof value === 'object' && 'lan_translate' in (value as Record<string, unknown>)) {
    const lt = (value as { lan_translate?: string[] }).lan_translate;
    if (Array.isArray(lt) && lt.length > 0) {
      return String(lt[0]).replace(/_\$S@TIDS\$_[a-z0-9]+\|\w+$/i, '').trim();
    }
  }
  return '';
}

async function main(): Promise<void> {
  const config = createPipelineConfig();
  const scanPath = process.argv[2] || config.defaultSourceScanPath;

  console.log(`[gen:mod-suffix-stats] Reading: ${scanPath}`);
  const raw = await fs.readFile(scanPath, 'utf-8');
  const scan = JSON.parse(raw);

  // Find table 04192
  const files: Array<{ path?: string; parsed?: unknown }> = scan.files || [];
  const buffDefEntry = files.find(f => f.path?.includes('04192_8e6be72b'));
  if (!buffDefEntry?.parsed) {
    console.error('[gen:mod-suffix-stats] FATAL: Table 04192 not found');
    process.exit(1);
  }

  const buffData = (buffDefEntry.parsed as { data?: Record<string, unknown> }).data
    || buffDefEntry.parsed as Record<string, unknown>;

  // Parse all entries grouped by affix_id
  const affixGroups = new Map<number, AffixTierEntry[]>();

  for (const [key, value] of Object.entries(buffData)) {
    if (!value || typeof value !== 'object') continue;
    const match = key.match(/\[(\d+),\s*(\d+)\]/);
    if (!match) continue;

    const affixId = Number(match[1]);
    const tier = Number(match[2]);
    const record = value as Record<string, unknown>;

    const entry: AffixTierEntry = {
      affixId,
      tier,
      nameZhCn: extractText(record.name),
      attrNoList: Array.isArray(record.attr_no_list) ? record.attr_no_list : [],
      attrValueList: Array.isArray(record.attr_value_list) ? record.attr_value_list : [],
      descZhCn: extractText(record.desc),
      iconPath: (record.icon_path as string) || '',
      effectRange: (record.effect_range as number) ?? 0,
    };

    const group = affixGroups.get(affixId) || [];
    group.push(entry);
    affixGroups.set(affixId, group);
  }

  console.log(`[gen:mod-suffix-stats] Found ${affixGroups.size} unique affix IDs`);

  // Resolve each affix group
  const resolved: ResolvedAffixStat[] = [];
  const unmappedCodes = new Map<string, { nameZhCn: string; affixIds: number[] }>();
  const emptyAttrAffixes: Array<{ affixId: number; nameZhCn: string }> = [];
  let fullyMapped = 0;
  let partiallyMapped = 0;

  for (const [affixId, tiers] of affixGroups) {
    // Sort by tier
    tiers.sort((a, b) => a.tier - b.tier);
    const firstTier = tiers[0];

    // Skip entries with no attr data
    if (firstTier.attrNoList.length === 0) {
      emptyAttrAffixes.push({ affixId, nameZhCn: firstTier.nameZhCn });
      continue;
    }

    // For each attr code in this affix, build tier values
    let allMapped = true;
    for (let attrIdx = 0; attrIdx < firstTier.attrNoList.length; attrIdx++) {
      const attrCode = firstTier.attrNoList[attrIdx];
      const statKey = resolveAttrToStatKey(attrCode);

      if (!statKey) {
        allMapped = false;
        const existing = unmappedCodes.get(attrCode) || { nameZhCn: firstTier.nameZhCn, affixIds: [] };
        existing.affixIds.push(affixId);
        unmappedCodes.set(attrCode, existing);
        continue;
      }

      // Collect tier values for this attr
      const tierValues: number[] = [];
      for (const t of tiers) {
        const val = t.attrValueList[attrIdx];
        tierValues.push(typeof val === 'number' ? val : 0);
      }

      resolved.push({
        affixId,
        nameZhCn: firstTier.nameZhCn,
        statKey,
        attrCodes: [attrCode],
        tierValues,
        maxTier: tiers.length,
      });
    }

    if (allMapped) fullyMapped++;
    else partiallyMapped++;
  }

  console.log(`[gen:mod-suffix-stats] Resolved: ${resolved.length} stat entries`);
  console.log(`[gen:mod-suffix-stats] Fully mapped affixes: ${fullyMapped}`);
  console.log(`[gen:mod-suffix-stats] Partially mapped: ${partiallyMapped}`);
  console.log(`[gen:mod-suffix-stats] Empty attr (proc-based): ${emptyAttrAffixes.length}`);
  console.log(`[gen:mod-suffix-stats] Unmapped attr codes: ${unmappedCodes.size}`);

  // Generate TypeScript output
  const lines: string[] = [
    '// Auto-generated from bindict_scan.json table 04192 (mod affix stat definitions).',
    '// Do not edit directly. Regenerate with: npm run generate:mod-suffix-stats',
    '// Only includes affix entries with fully-resolved attr codes → StatKeys.',
    '',
    'import type { StatModifier } from "../../itemTypes";',
    '',
    '/**',
    ' * Mod suffix stat values keyed by affix ID.',
    ' * Each entry contains the StatKey and tier values (tiers 1-6).',
    ' * Use these to populate statModifiers on mod suffix registry entries.',
    ' */',
    'export interface BindictAffixStat {',
    '  affixId: number;',
    '  nameZhCn: string;',
    '  statKey: string;',
    '  attrCodes: string[];',
    '  tierValues: number[];',
    '  maxTier: number;',
    '}',
    '',
    'export const bindictAffixStats: BindictAffixStat[] = [',
  ];

  for (const r of resolved) {
    lines.push(`  { affixId: ${r.affixId}, nameZhCn: ${JSON.stringify(r.nameZhCn)}, statKey: ${JSON.stringify(r.statKey)}, attrCodes: ${JSON.stringify(r.attrCodes)}, tierValues: ${JSON.stringify(r.tierValues)}, maxTier: ${r.maxTier} },`);
  }

  lines.push('];');
  lines.push('');
  lines.push('/**');
  lines.push(' * Lookup affix stats by affix ID. Returns all stat entries for that affix.');
  lines.push(' * Multiple entries per affix ID means the affix provides multiple stats.');
  lines.push(' */');
  lines.push('export function getAffixStats(affixId: number): BindictAffixStat[] {');
  lines.push('  return bindictAffixStats.filter(s => s.affixId === affixId);');
  lines.push('}');
  lines.push('');
  lines.push('/**');
  lines.push(' * Convert affix stats to StatModifier[] format for registry consumption.');
  lines.push(' */');
  lines.push('export function affixToStatModifiers(affixId: number, tier?: number): StatModifier[] {');
  lines.push('  const stats = getAffixStats(affixId);');
  lines.push('  return stats.map(s => ({');
  lines.push('    stat: s.statKey,');
  lines.push('    value: tier && tier <= s.tierValues.length ? s.tierValues[tier - 1] : s.tierValues[0],');
  lines.push('    unit: "percent" as const,');
  lines.push('    tierValues: s.tierValues,');
  lines.push('  }));');
  lines.push('}');
  lines.push('');

  const output = lines.join('\n');
  await fs.writeFile(OUTPUT_PATH, output, 'utf-8');
  console.log(`[gen:mod-suffix-stats] TypeScript output: ${OUTPUT_PATH}`);

  // Generate unmapped report
  const report: UnmappedReport = {
    unmappedAttrCodes: [...unmappedCodes.entries()].map(([code, { nameZhCn, affixIds }]) => {
      const mapping = getAttrMapping(code);
      return {
        attrCode: code,
        nameZhCn: mapping?.nameZhCn || nameZhCn,
        affixIds,
        reason: mapping ? `Mapped but statKey is null (confidence: ${mapping.confidence})` : 'Not in attrStatKeyMap at all',
      };
    }),
    emptyAttrAffixes: emptyAttrAffixes.map(e => ({
      affixId: e.affixId,
      nameZhCn: e.nameZhCn,
      reason: 'No attr_no_list (proc/trigger-based effect, not a flat stat)',
    })),
    summary: {
      totalAffixIds: affixGroups.size,
      withAttrData: affixGroups.size - emptyAttrAffixes.length,
      withoutAttrData: emptyAttrAffixes.length,
      fullyMapped,
      partiallyMapped,
      unmappedAttrCodes: unmappedCodes.size,
    },
  };

  const reportJson = JSON.stringify(report, null, 2);
  await safeWrite('reports/mod-suffix-unmapped.json', reportJson, config);
  console.log(`[gen:mod-suffix-stats] Report: ${path.resolve(config.decodedOutputDir, 'reports/mod-suffix-unmapped.json')}`);
  console.log(`[gen:mod-suffix-stats] Done.`);
}

main().catch((err) => {
  console.error('[gen:mod-suffix-stats] FATAL:', err.message);
  process.exit(1);
});
