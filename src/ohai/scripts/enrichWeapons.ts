/**
 * Weapon Enrichment Pipeline
 *
 * Joins three decoded binary tables to produce a complete weapon stats file:
 *   - 03422 (item table): equip_origin_id → name, icon, quality
 *   - 02548 (equip table): equip_origin_id → gun_no, equip_type, blueprint_no, suit_id
 *   - 05509 (gun mechanics): gun_no → weapon_rpm, mobility, range, magazine, reload, bullet data
 *
 * Output: src/ohai/data/generated/decoded/enriched/weapons-enriched.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createPipelineConfig } from '../src/pipeline/config';
import { generateMeta } from '../src/pipeline/metaGenerator';
import { safeWrite } from '../src/pipeline/safeWriter';

interface LanTranslate {
  lan_translate?: string[];
}

interface ItemRecord {
  name?: LanTranslate;
  icon?: string;
  quality?: number;
  type?: number;
  sub_type?: number;
  [key: string]: unknown;
}

interface EquipRecord {
  equip_origin_id?: number;
  gun_no?: number;
  equip_type?: number;
  equip_quality?: number;
  equip_lv?: number;
  blueprint_no?: number;
  suit_id?: number;
  passive_skill_no?: string | number;
  skin_seq_no?: string;
  [key: string]: unknown;
}

interface GunRecord {
  weapon_rpm?: number;
  weapon_mobility?: number;
  weapon_range_value?: number;
  weapon_range_affix?: string;
  weapon_range_affix_value?: number;
  weapon_magazine_size_affix?: string;
  weapon_magazine_size_affix_value?: number;
  weapon_mobility_affix?: string;
  weapon_rpm_affix?: string;
  weapon_rpm_affix_value?: number;
  bullet_speed?: number;
  bullet_cost?: number;
  bullet_no?: number;
  bullet_base_no?: number;
  default_shoot_mode?: number;
  burst_bullet_num?: number;
  burst_bullet_interval?: number;
  burst_time_interval?: number;
  single_time_interval?: number;
  auto_time_interval?: number;
  dis_damage_value1?: number[];
  dis_damage_value2?: number[];
  reload_loop_time?: number;
  reload_front_swing_time?: number;
  reload_back_swing_time?: number;
  reload_add_bullet_time?: number;
  clip_reload_mode?: number;
  fire_max_value?: number;
  fire_recover_speed?: number;
  gun_kind_name?: LanTranslate;
  gun_skill_no?: number;
  cost_bullet_type?: number;
  ads_time?: number;
  equip_gun_time?: number;
  unequip_gun_time?: number;
  attack_level?: number;
  [key: string]: unknown;
}

interface EnrichedWeapon {
  /** The equip_origin_id (primary key from equip table) */
  equipOriginId: number;
  /** Gun mechanics ID linking to 05509 */
  gunNo: number;
  /** Display name (Simplified Chinese from game data) */
  nameZhCn: string | null;
  /** Icon filename */
  icon: string | null;
  /** Quality tier (0-4 typically) */
  quality: number;
  /** Equipment type code */
  equipType: number;
  /** Equipment level */
  equipLevel: number;
  /** Blueprint number */
  blueprintNo: number;
  /** Armor set ID (0 if none) */
  suitId: number;
  /** Gun kind/category name (Simplified Chinese) */
  gunKindName: string | null;
  /** Weapon stats from gun mechanics table */
  stats: {
    rpm: number;
    mobility: number;
    rangeValue: number;
    magazineSize: number;
    bulletSpeed: number;
    bulletCost: number;
    /** Shoot mode: 1=semi, 2=burst, 3=auto, etc. */
    shootMode: number;
    burstBulletNum: number;
    burstInterval: number;
    singleInterval: number;
    autoInterval: number;
    /** Reload timing */
    reloadLoopTime: number;
    reloadFrontSwing: number;
    reloadBackSwing: number;
    reloadAddBulletTime: number;
    clipReloadMode: number;
    /** ADS (aim down sight) time */
    adsTime: number;
    /** Equip/unequip timing */
    equipTime: number;
    unequipTime: number;
    /** Fire heat buildup */
    fireMaxValue: number;
    fireRecoverSpeed: number;
    /** Damage falloff */
    damageFalloff1: number[] | null;
    damageFalloff2: number[] | null;
    /** Attack level multiplier */
    attackLevel: number;
  };
  /** Affix modifiers (weapon-specific stat bonuses) */
  affixes: {
    rpmAffix: string | null;
    rpmAffixValue: number;
    mobilityAffix: string | null;
    rangeAffix: string | null;
    rangeAffixValue: number;
    magazineAffix: string | null;
    magazineAffixValue: number;
  };
  /** Linked entity IDs for cross-referencing */
  references: {
    bulletNo: number;
    bulletBaseNo: number;
    gunSkillNo: number;
    costBulletType: number;
    passiveSkillNo: string | number | null;
  };
}

function extractName(record: ItemRecord | undefined): string | null {
  if (!record?.name?.lan_translate?.[0]) return null;
  return String(record.name.lan_translate[0])
    .replace(/_\$S@TIDS\$_[a-z0-9]+\|\d+$/i, '')
    .trim();
}

function extractGunKindName(gun: GunRecord): string | null {
  if (!gun.gun_kind_name?.lan_translate?.[0]) return null;
  return String(gun.gun_kind_name.lan_translate[0])
    .replace(/_\$S@TIDS\$_[a-z0-9]+\|\d+$/i, '')
    .trim();
}

async function main(): Promise<void> {
  const config = createPipelineConfig();
  const scanPath = process.argv[2] || config.defaultSourceScanPath;

  console.log(`[enrich:weapons] Reading source: ${scanPath}`);
  const raw = await fs.readFile(scanPath, 'utf-8');
  const scan = JSON.parse(raw);

  // Find our three tables by filename pattern
  const files: Array<{ path?: string; file?: string; parsed?: unknown }> = scan.files || [];

  const itemEntry = files.find(f => f.path?.includes('03422_75520e24') || f.file?.includes('03422_75520e24'));
  const equipEntry = files.find(f => f.path?.includes('02548_58575b3c') || f.file?.includes('02548_58575b3c'));
  const gunEntry = files.find(f => f.path?.includes('05509_bc5aafa8') || f.file?.includes('05509_bc5aafa8'));

  if (!itemEntry?.parsed || !equipEntry?.parsed || !gunEntry?.parsed) {
    console.error('[enrich:weapons] FATAL: Could not find required tables in bindict_scan');
    console.error('  Item table (03422):', !!itemEntry?.parsed);
    console.error('  Equip table (02548):', !!equipEntry?.parsed);
    console.error('  Gun table (05509):', !!gunEntry?.parsed);
    process.exit(1);
  }

  // Extract dict-keyed tables (they're stored as {data: {id: record, ...}} or {id: record, ...})
  function extractDict(parsed: unknown): Record<string, Record<string, unknown>> {
    if (!parsed || typeof parsed !== 'object') return {};
    const obj = parsed as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as Record<string, Record<string, unknown>>;
    }
    // Already a flat dict
    const result: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        result[k] = v as Record<string, unknown>;
      }
    }
    return result;
  }

  const items = extractDict(itemEntry.parsed) as Record<string, ItemRecord>;
  const equips = extractDict(equipEntry.parsed) as Record<string, EquipRecord>;
  const guns = extractDict(gunEntry.parsed) as Record<string, GunRecord>;

  console.log(`[enrich:weapons] Loaded tables:`);
  console.log(`  Items (03422): ${Object.keys(items).length} entries`);
  console.log(`  Equips (02548): ${Object.keys(equips).length} entries`);
  console.log(`  Guns (05509): ${Object.keys(guns).length} entries`);

  // Filter equip entries that are weapons (have gun_no > 0)
  const weaponEquips = Object.entries(equips)
    .filter(([_, e]) => e.gun_no && e.gun_no > 0)
    .map(([id, e]) => ({ id: Number(id), ...e }));

  console.log(`[enrich:weapons] Weapon equip entries (gun_no > 0): ${weaponEquips.length}`);

  // Build enriched weapons by joining all three tables
  const enrichedWeapons: EnrichedWeapon[] = [];
  let missingGun = 0;
  let missingItem = 0;

  for (const equip of weaponEquips) {
    const gunNo = equip.gun_no!;
    const equipId = equip.id;

    const gun = guns[String(gunNo)] as GunRecord | undefined;
    const item = items[String(equipId)] as ItemRecord | undefined;

    if (!gun) {
      missingGun++;
      continue;
    }

    if (!item) {
      missingItem++;
    }

    const enriched: EnrichedWeapon = {
      equipOriginId: equipId,
      gunNo,
      nameZhCn: extractName(item),
      icon: item?.icon || null,
      quality: item?.quality ?? equip.equip_quality ?? 0,
      equipType: equip.equip_type ?? 0,
      equipLevel: equip.equip_lv ?? 1,
      blueprintNo: equip.blueprint_no ?? 0,
      suitId: equip.suit_id ?? 0,
      gunKindName: extractGunKindName(gun),
      stats: {
        rpm: gun.weapon_rpm ?? 0,
        mobility: gun.weapon_mobility ?? 0,
        rangeValue: gun.weapon_range_value ?? 0,
        magazineSize: gun.weapon_magazine_size_affix_value ?? 0,
        bulletSpeed: gun.bullet_speed ?? 0,
        bulletCost: gun.bullet_cost ?? 1,
        shootMode: gun.default_shoot_mode ?? 0,
        burstBulletNum: gun.burst_bullet_num ?? 0,
        burstInterval: gun.burst_bullet_interval ?? 0,
        singleInterval: gun.single_time_interval ?? 0,
        autoInterval: gun.auto_time_interval ?? 0,
        reloadLoopTime: gun.reload_loop_time ?? 0,
        reloadFrontSwing: gun.reload_front_swing_time ?? 0,
        reloadBackSwing: gun.reload_back_swing_time ?? 0,
        reloadAddBulletTime: gun.reload_add_bullet_time ?? 0,
        clipReloadMode: gun.clip_reload_mode ?? 0,
        adsTime: gun.ads_time ?? 0,
        equipTime: gun.equip_gun_time ?? 0,
        unequipTime: gun.unequip_gun_time ?? 0,
        fireMaxValue: gun.fire_max_value ?? 0,
        fireRecoverSpeed: gun.fire_recover_speed ?? 0,
        damageFalloff1: Array.isArray(gun.dis_damage_value1) ? gun.dis_damage_value1 : null,
        damageFalloff2: Array.isArray(gun.dis_damage_value2) ? gun.dis_damage_value2 : null,
        attackLevel: gun.attack_level ?? 0,
      },
      affixes: {
        rpmAffix: typeof gun.weapon_rpm_affix === 'string' ? gun.weapon_rpm_affix : null,
        rpmAffixValue: gun.weapon_rpm_affix_value ?? 0,
        mobilityAffix: typeof gun.weapon_mobility_affix === 'string' ? gun.weapon_mobility_affix : null,
        rangeAffix: typeof gun.weapon_range_affix === 'string' ? gun.weapon_range_affix : null,
        rangeAffixValue: gun.weapon_range_affix_value ?? 0,
        magazineAffix: typeof gun.weapon_magazine_size_affix === 'string' ? gun.weapon_magazine_size_affix : null,
        magazineAffixValue: gun.weapon_magazine_size_affix_value ?? 0,
      },
      references: {
        bulletNo: gun.bullet_no ?? 0,
        bulletBaseNo: gun.bullet_base_no ?? 0,
        gunSkillNo: gun.gun_skill_no ?? 0,
        costBulletType: gun.cost_bullet_type ?? 0,
        passiveSkillNo: equip.passive_skill_no ?? null,
      },
    };

    enrichedWeapons.push(enriched);
  }

  console.log(`[enrich:weapons] Enriched: ${enrichedWeapons.length} weapons`);
  console.log(`[enrich:weapons] Missing gun mechanics: ${missingGun} (equip entries with no matching gun_no)`);
  console.log(`[enrich:weapons] Missing item name: ${missingItem} (weapons without item table entry)`);

  // Deduplicate by gun_no — group weapon variants under same gun mechanics
  const byGunNo = new Map<number, EnrichedWeapon[]>();
  for (const w of enrichedWeapons) {
    const arr = byGunNo.get(w.gunNo) || [];
    arr.push(w);
    byGunNo.set(w.gunNo, arr);
  }

  console.log(`[enrich:weapons] Unique gun mechanics entries: ${byGunNo.size}`);
  console.log(`[enrich:weapons] Avg variants per gun: ${(enrichedWeapons.length / byGunNo.size).toFixed(1)}`);

  // Build output
  const sourceContent = JSON.stringify({ items: Object.keys(items).length, equips: Object.keys(equips).length, guns: Object.keys(guns).length });
  const meta = generateMeta({
    sourceFile: 'bindict_scan.json',
    sourceScannedPath: scanPath,
    extractionMethod: 'bindict',
    recordCount: enrichedWeapons.length,
    sourceContent,
    config,
  });

  const output = {
    _meta: meta,
    summary: {
      totalWeapons: enrichedWeapons.length,
      uniqueGunMechanics: byGunNo.size,
      missingGunData: missingGun,
      missingItemNames: missingItem,
      equipTypeDistribution: {} as Record<number, number>,
      qualityDistribution: {} as Record<number, number>,
    },
    weapons: enrichedWeapons,
  };

  // Calculate distributions
  for (const w of enrichedWeapons) {
    output.summary.equipTypeDistribution[w.equipType] = (output.summary.equipTypeDistribution[w.equipType] || 0) + 1;
    output.summary.qualityDistribution[w.quality] = (output.summary.qualityDistribution[w.quality] || 0) + 1;
  }

  const outputJson = JSON.stringify(output, null, 2);
  await safeWrite('enriched/weapons-enriched.json', outputJson, config);

  console.log(`[enrich:weapons] Output: ${path.resolve(config.decodedOutputDir, 'enriched/weapons-enriched.json')}`);
  console.log(`[enrich:weapons] Done.`);

  // Print some interesting stats
  console.log(`\n[enrich:weapons] === STATS SNAPSHOT ===`);
  console.log(`  Equip types: ${JSON.stringify(output.summary.equipTypeDistribution)}`);
  console.log(`  Quality tiers: ${JSON.stringify(output.summary.qualityDistribution)}`);

  // Show a few sample weapons
  const samples = enrichedWeapons.filter(w => w.nameZhCn && w.stats.rpm > 0).slice(0, 5);
  console.log(`\n  Sample enriched weapons:`);
  for (const s of samples) {
    console.log(`    ${s.nameZhCn} | RPM: ${s.stats.rpm.toFixed(1)} | Mag: ${s.stats.magazineSize} | Mobility: ${s.stats.mobility} | Range: ${s.stats.rangeValue}`);
  }
}

main().catch((err) => {
  console.error('[enrich:weapons] FATAL:', err.message);
  process.exit(1);
});
