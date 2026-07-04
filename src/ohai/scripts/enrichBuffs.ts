/**
 * Buff/Effect System Extraction Pipeline
 *
 * Extracts and joins buff-related tables to produce:
 *   1. A stat attribute codebook mapping internal codes to stat names
 *   2. A buff definitions table with resolved stat effects
 *   3. A deviation effects table linking deviations → buffs → stat modifiers
 *
 * Source tables:
 *   - 04192 (buff definitions): buff_id → attr_no_list, attr_value_list, name, desc
 *   - 00708 (deviation/effect traits): quality_name, effects, combat_deviation_buffs, equip_buffs
 *   - 04141 (secondary buff table): buff_id → attr_no_list, attr_value_list
 *
 * Output: src/ohai/data/generated/decoded/enriched/buff-system.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createPipelineConfig } from '../src/pipeline/config';
import { generateMeta } from '../src/pipeline/metaGenerator';
import { safeWrite } from '../src/pipeline/safeWriter';

interface LanTranslate {
  lan_translate?: string[];
}

function extractText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.replace(/_\$S@TIDS\$_[a-z0-9]+\|\d+$/i, '').trim();
  if (typeof value === 'object' && 'lan_translate' in (value as Record<string, unknown>)) {
    const lt = (value as LanTranslate).lan_translate;
    if (Array.isArray(lt) && lt.length > 0) {
      return String(lt[0]).replace(/_\$S@TIDS\$_[a-z0-9]+\|\d+$/i, '').trim();
    }
  }
  return null;
}

/** A single attribute modifier (stat code + value) */
interface StatModifier {
  attrCode: string;
  attrName: string;
  value: number;
}

/** A buff definition with resolved stat effects */
interface BuffDefinition {
  buffId: number;
  nameZhCn: string | null;
  descZhCn: string | null;
  iconPath: string | null;
  effectRange: number;
  modifiers: StatModifier[];
}

/** A deviation trait record from table 00708 */
interface DeviationTrait {
  qualityName: string | null;
  effectName: string | null;
  effectDescription: string | null;
  type: number;
  quality: number;
  group: number;
  weight: number;
  buffId: number;
  deviationLib: number;
  effectsRaw: unknown;
  effectsParams: unknown[];
  combatDeviationBuffIds: number[];
  workerDeviationBuffIds: number[];
  equipBuffIds: number[];
  /** Resolved buff effects (from joining to buff definitions table) */
  resolvedCombatBuffs: BuffDefinition[];
  resolvedEquipBuffs: BuffDefinition[];
}

/** The stat attribute codebook */
interface AttrCodeEntry {
  code: string;
  nameZhCn: string;
  category: string;
}

async function main(): Promise<void> {
  const config = createPipelineConfig();
  const scanPath = process.argv[2] || config.defaultSourceScanPath;

  console.log(`[enrich:buffs] Reading source: ${scanPath}`);
  const raw = await fs.readFile(scanPath, 'utf-8');
  const scan = JSON.parse(raw);

  const files: Array<{ path?: string; file?: string; parsed?: unknown }> = scan.files || [];

  // Find tables
  const buffDefEntry = files.find(f => f.path?.includes('04192_8e6be72b') || f.file?.includes('04192_8e6be72b'));
  const deviationEntry = files.find(f => f.path?.includes('00708_18ba9b47') || f.file?.includes('00708_18ba9b47'));
  const buffSecondary = files.find(f => f.path?.includes('04141_8c5c24da') || f.file?.includes('04141_8c5c24da'));

  if (!buffDefEntry?.parsed || !deviationEntry?.parsed) {
    console.error('[enrich:buffs] FATAL: Could not find required tables');
    console.error('  Buff definitions (04192):', !!buffDefEntry?.parsed);
    console.error('  Deviation traits (00708):', !!deviationEntry?.parsed);
    process.exit(1);
  }

  // Extract dict-keyed tables
  function extractDict(parsed: unknown): Record<string, Record<string, unknown>> {
    if (!parsed || typeof parsed !== 'object') return {};
    const obj = parsed as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as Record<string, Record<string, unknown>>;
    }
    const result: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        result[k] = v as Record<string, unknown>;
      }
    }
    return result;
  }

  function extractArray(parsed: unknown): Record<string, unknown>[] {
    if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === 'object');
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
        return Object.values(obj.data as Record<string, unknown>).filter(
          (item): item is Record<string, unknown> => item !== null && typeof item === 'object'
        );
      }
      return Object.values(obj).filter(
        (item): item is Record<string, unknown> => item !== null && typeof item === 'object'
      );
    }
    return [];
  }

  const buffDefs = extractDict(buffDefEntry.parsed);
  const deviationRecords = extractArray(deviationEntry.parsed);
  const secondaryBuffs = buffSecondary?.parsed ? extractDict(buffSecondary.parsed) : {};

  console.log(`[enrich:buffs] Loaded tables:`);
  console.log(`  Buff definitions (04192): ${Object.keys(buffDefs).length} entries`);
  console.log(`  Deviation traits (00708): ${deviationRecords.length} entries`);
  console.log(`  Secondary buffs (04141): ${Object.keys(secondaryBuffs).length} entries`);

  // Step 1: Build attr code catalog
  const attrCatalog = new Map<string, string>();
  for (const record of Object.values(buffDefs)) {
    const attrList = record.attr_no_list as string[] | undefined;
    const name = extractText(record.name);
    if (attrList && name) {
      for (const attr of attrList) {
        if (!attrCatalog.has(attr)) {
          attrCatalog.set(attr, name);
        }
      }
    }
  }
  // Also scan secondary table
  for (const record of Object.values(secondaryBuffs)) {
    const attrList = record.attr_no_list as string[] | undefined;
    if (attrList) {
      for (const attr of attrList) {
        if (!attrCatalog.has(attr)) attrCatalog.set(attr, 'unknown');
      }
    }
  }

  console.log(`[enrich:buffs] Discovered ${attrCatalog.size} unique attribute codes`);

  // Categorize attr codes by prefix
  function categorizeAttr(code: string): string {
    const prefix = code.charAt(0);
    switch (prefix) {
      case 'A': return 'survival'; // HP, stamina, healing
      case 'D': return 'psychic'; // 超感 (psychic/perception)
      case 'E': return 'damage'; // crit, elemental, damage types
      case 'F': return 'special'; // hunter mark, surge effects
      case 'G': return 'defense'; // elemental defense, body part defense
      case 'J': return 'bullet_effect'; // split/ricochet bullet effects
      case 'L': return 'trigger'; // negative/buff/area triggers
      case 'Q': return 'weapon_handling'; // stability, accuracy, reload, fire rate
      case 'S': return 'mobility'; // move speed, sprint
      default: return 'unknown';
    }
  }

  const attrCodebook: AttrCodeEntry[] = [...attrCatalog.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, name]) => ({
      code,
      nameZhCn: name,
      category: categorizeAttr(code),
    }));

  // Step 2: Build buff definitions lookup
  function resolveBuffId(buffId: number): BuffDefinition | null {
    const record = buffDefs[String(buffId)] || secondaryBuffs[String(buffId)];
    if (!record) return null;

    const attrList = (record.attr_no_list as string[]) || [];
    const valList = (record.attr_value_list as number[]) || [];
    const modifiers: StatModifier[] = [];

    for (let i = 0; i < attrList.length; i++) {
      const code = attrList[i];
      const value = valList[i] ?? 0;
      modifiers.push({
        attrCode: code,
        attrName: attrCatalog.get(code) || 'unknown',
        value,
      });
    }

    return {
      buffId,
      nameZhCn: extractText(record.name),
      descZhCn: extractText(record.desc),
      iconPath: (record.icon_path as string) || null,
      effectRange: (record.effect_range as number) ?? 0,
      modifiers,
    };
  }

  // Step 3: Process deviation traits
  const deviationTraits: DeviationTrait[] = [];

  for (const record of deviationRecords) {
    const combatBuffIds: number[] = Array.isArray(record.combat_deviation_buffs)
      ? record.combat_deviation_buffs.filter((v: unknown) => typeof v === 'number')
      : [];
    const workerBuffIds: number[] = Array.isArray(record.worker_deviation_buffs)
      ? record.worker_deviation_buffs.filter((v: unknown) => typeof v === 'number')
      : [];
    const equipBuffIds: number[] = Array.isArray(record.equip_buffs)
      ? record.equip_buffs.filter((v: unknown) => typeof v === 'number')
      : [];

    const resolvedCombatBuffs = combatBuffIds
      .map(id => resolveBuffId(id))
      .filter((b): b is BuffDefinition => b !== null);
    const resolvedEquipBuffs = equipBuffIds
      .map(id => resolveBuffId(id))
      .filter((b): b is BuffDefinition => b !== null);

    const trait: DeviationTrait = {
      qualityName: extractText(record.quality_name),
      effectName: extractText(record.effect_name),
      effectDescription: extractText(record.effect_str_format),
      type: (record.type as number) ?? 0,
      quality: (record.quality as number) ?? 0,
      group: (record.group as number) ?? 0,
      weight: (record.weight as number) ?? 0,
      buffId: (record.buff_id as number) ?? 0,
      deviationLib: (record.deviation_lib as number) ?? 0,
      effectsRaw: record.effects ?? null,
      effectsParams: Array.isArray(record.effects_params) ? record.effects_params : [],
      combatDeviationBuffIds: combatBuffIds,
      workerDeviationBuffIds: workerBuffIds,
      equipBuffIds,
      resolvedCombatBuffs,
      resolvedEquipBuffs,
    };

    deviationTraits.push(trait);
  }

  // Step 4: Collect all unique buffs referenced
  const allReferencedBuffIds = new Set<number>();
  deviationTraits.forEach(t => {
    t.combatDeviationBuffIds.forEach(id => allReferencedBuffIds.add(id));
    t.equipBuffIds.forEach(id => allReferencedBuffIds.add(id));
    if (t.buffId > 0) allReferencedBuffIds.add(t.buffId);
  });

  const resolvedBuffs: BuffDefinition[] = [];
  let unresolvedCount = 0;
  for (const id of allReferencedBuffIds) {
    const resolved = resolveBuffId(id);
    if (resolved) {
      resolvedBuffs.push(resolved);
    } else {
      unresolvedCount++;
    }
  }

  console.log(`[enrich:buffs] Deviation traits: ${deviationTraits.length}`);
  console.log(`[enrich:buffs] Unique buff IDs referenced: ${allReferencedBuffIds.size}`);
  console.log(`[enrich:buffs] Resolved buffs: ${resolvedBuffs.length}`);
  console.log(`[enrich:buffs] Unresolved buff IDs: ${unresolvedCount}`);

  // Type distribution
  const typeDistribution: Record<number, number> = {};
  deviationTraits.forEach(t => {
    typeDistribution[t.type] = (typeDistribution[t.type] || 0) + 1;
  });

  // Build output
  const sourceContent = JSON.stringify({ buffDefs: Object.keys(buffDefs).length, deviations: deviationRecords.length });
  const meta = generateMeta({
    sourceFile: 'bindict_scan.json',
    sourceScannedPath: scanPath,
    extractionMethod: 'bindict',
    recordCount: deviationTraits.length + resolvedBuffs.length,
    sourceContent,
    config,
  });

  const output = {
    _meta: meta,
    summary: {
      attrCodesDiscovered: attrCodebook.length,
      buffDefinitions: resolvedBuffs.length,
      unresolvedBuffIds: unresolvedCount,
      deviationTraits: deviationTraits.length,
      typeDistribution,
      categorySummary: {} as Record<string, number>,
    },
    attrCodebook,
    buffDefinitions: resolvedBuffs,
    deviationTraits,
  };

  // Category summary
  attrCodebook.forEach(a => {
    output.summary.categorySummary[a.category] = (output.summary.categorySummary[a.category] || 0) + 1;
  });

  const outputJson = JSON.stringify(output, null, 2);
  await safeWrite('enriched/buff-system.json', outputJson, config);

  console.log(`[enrich:buffs] Output: ${path.resolve(config.decodedOutputDir, 'enriched/buff-system.json')}`);
  console.log(`[enrich:buffs] Done.`);

  // Stats
  console.log(`\n[enrich:buffs] === STATS ===`);
  console.log(`  Attr categories: ${JSON.stringify(output.summary.categorySummary)}`);
  console.log(`  Type distribution: ${JSON.stringify(typeDistribution)}`);
  console.log(`  Sample attr codes:`);
  attrCodebook.filter(a => a.category === 'damage').slice(0, 10).forEach(a => {
    console.log(`    ${a.code} → ${a.nameZhCn} (${a.category})`);
  });
  console.log(`  Sample weapon handling codes:`);
  attrCodebook.filter(a => a.category === 'weapon_handling').slice(0, 10).forEach(a => {
    console.log(`    ${a.code} → ${a.nameZhCn} (${a.category})`);
  });
}

main().catch((err) => {
  console.error('[enrich:buffs] FATAL:', err.message);
  process.exit(1);
});
