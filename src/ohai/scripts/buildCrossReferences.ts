/**
 * Cross-Reference Map Builder
 *
 * Links entities across decoded tables to build the relationship graph:
 *   - weapon (equip_origin_id) → gun mechanics (gun_no) → bullet (bullet_no)
 *   - weapon → blueprint (blueprint_no)
 *   - weapon → keyword/skill (gun_skill_no, passive_skill_no)
 *   - mod affix → weapon type → buff
 *   - deviation → combat buff IDs
 *   - item → equip_origin_id (name resolution)
 *
 * Output: src/ohai/data/generated/decoded/enriched/cross-references.json
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

interface WeaponCrossRef {
  equipOriginId: number;
  nameZhCn: string | null;
  gunNo: number;
  blueprintNo: number;
  equipType: number;
  /** Linked entities */
  bulletNo: number;
  bulletBaseNo: number;
  gunSkillNo: number;
  passiveSkillNo: string | number | null;
  costBulletType: number;
  suitId: number;
}

interface ModAffixCrossRef {
  /** From 01077: mod affix system entry */
  affixIds: unknown;
  affixIdsWeight: unknown;
  affixValRange: unknown;
  weaponTypeLst: unknown;
  buffId: number;
  groupId: number;
  seasonState: unknown;
}

interface UnresolvedReference {
  sourceTable: string;
  sourceId: string | number;
  targetField: string;
  targetId: number;
  reason: string;
}

async function main(): Promise<void> {
  const config = createPipelineConfig();
  const scanPath = process.argv[2] || config.defaultSourceScanPath;

  console.log(`[cross-ref] Reading source: ${scanPath}`);
  const raw = await fs.readFile(scanPath, 'utf-8');
  const scan = JSON.parse(raw);

  const files: Array<{ path?: string; file?: string; parsed?: unknown }> = scan.files || [];

  // Load tables
  const itemEntry = files.find(f => f.path?.includes('03422_75520e24'));
  const equipEntry = files.find(f => f.path?.includes('02548_58575b3c'));
  const gunEntry = files.find(f => f.path?.includes('05509_bc5aafa8'));
  const modAffixEntry = files.find(f => f.path?.includes('01077_24d90907'));
  const bulletEntry = files.find(f => f.path?.includes('02057_475e3761')); // bullet patterns

  const items = itemEntry?.parsed ? extractDict(itemEntry.parsed) : {};
  const equips = equipEntry?.parsed ? extractDict(equipEntry.parsed) : {};
  const guns = gunEntry?.parsed ? extractDict(gunEntry.parsed) : {};
  const modAffixes = modAffixEntry?.parsed ? extractDict(modAffixEntry.parsed) : {};
  const bullets = bulletEntry?.parsed ? extractDict(bulletEntry.parsed) : {};

  console.log(`[cross-ref] Tables loaded:`);
  console.log(`  Items: ${Object.keys(items).length}`);
  console.log(`  Equips: ${Object.keys(equips).length}`);
  console.log(`  Guns: ${Object.keys(guns).length}`);
  console.log(`  Mod affixes: ${Object.keys(modAffixes).length}`);
  console.log(`  Bullets: ${Object.keys(bullets).length}`);

  // Build weapon cross-references
  const weaponRefs: WeaponCrossRef[] = [];
  const unresolvedRefs: UnresolvedReference[] = [];

  const gunNoSet = new Set(Object.keys(guns));
  const bulletNoSet = new Set(Object.keys(bullets));

  for (const [equipId, equip] of Object.entries(equips)) {
    const gunNo = equip.gun_no as number;
    if (!gunNo || gunNo <= 0) continue;

    const item = items[equipId];
    const gun = guns[String(gunNo)];

    const ref: WeaponCrossRef = {
      equipOriginId: Number(equipId),
      nameZhCn: item ? extractText(item.name) : null,
      gunNo,
      blueprintNo: (equip.blueprint_no as number) ?? 0,
      equipType: (equip.equip_type as number) ?? 0,
      bulletNo: gun ? (gun.bullet_no as number) ?? 0 : 0,
      bulletBaseNo: gun ? (gun.bullet_base_no as number) ?? 0 : 0,
      gunSkillNo: gun ? (gun.gun_skill_no as number) ?? 0 : 0,
      passiveSkillNo: equip.passive_skill_no ?? null,
      costBulletType: gun ? (gun.cost_bullet_type as number) ?? 0 : 0,
      suitId: (equip.suit_id as number) ?? 0,
    };

    weaponRefs.push(ref);

    // Track unresolved references
    if (!gunNoSet.has(String(gunNo))) {
      unresolvedRefs.push({
        sourceTable: '02548_equip',
        sourceId: equipId,
        targetField: 'gun_no',
        targetId: gunNo,
        reason: 'gun_no not found in 05509 gun mechanics table',
      });
    }

    if (gun && ref.bulletNo > 0 && !bulletNoSet.has(String(ref.bulletNo))) {
      unresolvedRefs.push({
        sourceTable: '05509_gun',
        sourceId: gunNo,
        targetField: 'bullet_no',
        targetId: ref.bulletNo,
        reason: 'bullet_no not found in 02057 bullet patterns table',
      });
    }
  }

  // Build mod affix cross-references
  const modAffixRefs: ModAffixCrossRef[] = [];
  for (const [_key, affix] of Object.entries(modAffixes)) {
    modAffixRefs.push({
      affixIds: affix.affix_ids ?? null,
      affixIdsWeight: affix.affix_ids_weight ?? null,
      affixValRange: affix.affix_val_range ?? null,
      weaponTypeLst: affix.weapon_type_lst ?? null,
      buffId: (affix.buff_id as number) ?? 0,
      groupId: (affix.group_id as number) ?? 0,
      seasonState: affix.season_state ?? null,
    });
  }

  // Build relationship statistics
  const gunNoToWeapons = new Map<number, number[]>();
  for (const ref of weaponRefs) {
    const arr = gunNoToWeapons.get(ref.gunNo) || [];
    arr.push(ref.equipOriginId);
    gunNoToWeapons.set(ref.gunNo, arr);
  }

  const bulletNoToGuns = new Map<number, number[]>();
  for (const ref of weaponRefs) {
    if (ref.bulletNo > 0) {
      const arr = bulletNoToGuns.get(ref.bulletNo) || [];
      arr.push(ref.gunNo);
      bulletNoToGuns.set(ref.bulletNo, arr);
    }
  }

  const suitsToWeapons = new Map<number, number[]>();
  for (const ref of weaponRefs) {
    if (ref.suitId > 0) {
      const arr = suitsToWeapons.get(ref.suitId) || [];
      arr.push(ref.equipOriginId);
      suitsToWeapons.set(ref.suitId, arr);
    }
  }

  // Build output
  const sourceContent = JSON.stringify({
    equips: Object.keys(equips).length,
    guns: Object.keys(guns).length,
    items: Object.keys(items).length,
  });

  const meta = generateMeta({
    sourceFile: 'bindict_scan.json',
    sourceScannedPath: scanPath,
    extractionMethod: 'bindict',
    recordCount: weaponRefs.length + modAffixRefs.length,
    sourceContent,
    config,
  });

  const output = {
    _meta: meta,
    summary: {
      weaponCrossRefs: weaponRefs.length,
      uniqueGunMechanics: gunNoToWeapons.size,
      uniqueBulletPatterns: bulletNoToGuns.size,
      modAffixEntries: modAffixRefs.length,
      unresolvedReferences: unresolvedRefs.length,
      suitSets: suitsToWeapons.size,
    },
    relationships: {
      /** Map of gun_no → list of equip_origin_ids using that gun mechanics */
      gunNoToWeapons: Object.fromEntries(gunNoToWeapons),
      /** Map of bullet_no → list of gun_nos using that bullet pattern */
      bulletNoToGuns: Object.fromEntries(bulletNoToGuns),
      /** Map of suit_id → list of equip_origin_ids in that set */
      suitIdToWeapons: Object.fromEntries(suitsToWeapons),
    },
    weaponCrossRefs: weaponRefs,
    modAffixCrossRefs: modAffixRefs,
    unresolvedReferences: unresolvedRefs.slice(0, 200), // Cap at 200
  };

  const outputJson = JSON.stringify(output, null, 2);
  await safeWrite('enriched/cross-references.json', outputJson, config);

  console.log(`[cross-ref] Output: ${path.resolve(config.decodedOutputDir, 'enriched/cross-references.json')}`);
  console.log(`[cross-ref] Done.`);
  console.log(`\n[cross-ref] === SUMMARY ===`);
  console.log(`  Weapon cross-refs: ${weaponRefs.length}`);
  console.log(`  Unique gun mechanics: ${gunNoToWeapons.size}`);
  console.log(`  Unique bullet patterns: ${bulletNoToGuns.size}`);
  console.log(`  Suit sets with weapons: ${suitsToWeapons.size}`);
  console.log(`  Mod affix entries: ${modAffixRefs.length}`);
  console.log(`  Unresolved references: ${unresolvedRefs.length}`);

  // Show some interesting relationships
  console.log(`\n  Top gun mechanics (most weapon variants):`);
  const sortedGuns = [...gunNoToWeapons.entries()].sort((a, b) => b[1].length - a[1].length);
  sortedGuns.slice(0, 5).forEach(([gunNo, equipIds]) => {
    const sampleName = items[String(equipIds[0])] ? extractText(items[String(equipIds[0])].name) : '?';
    console.log(`    gun_no ${gunNo}: ${equipIds.length} variants (e.g., ${sampleName})`);
  });

  console.log(`\n  Top shared bullet patterns:`);
  const sortedBullets = [...bulletNoToGuns.entries()].sort((a, b) => b[1].length - a[1].length);
  sortedBullets.slice(0, 5).forEach(([bulletNo, gunNos]) => {
    console.log(`    bullet_no ${bulletNo}: shared by ${gunNos.length} guns`);
  });
}

main().catch((err) => {
  console.error('[cross-ref] FATAL:', err.message);
  process.exit(1);
});
