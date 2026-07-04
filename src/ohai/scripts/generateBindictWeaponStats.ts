/**
 * Generate bindict-decoded weapon stats as a TypeScript registry file.
 *
 * Reads: data/generated/decoded/enriched/weapons-enriched.json
 * Outputs: src/ui/registries/generated/weaponsStats.bindict.generated.ts
 *
 * This produces CanonicalWeapon[] entries with:
 *   - fireRate (RPM from weapon_rpm)
 *   - magazineCapacity (from weapon_magazine_size_affix_value)
 *   - reloadTimeSeconds (from reload timing fields)
 *   - mobility, range, bullet speed (as metadata)
 *
 * These entries are merged into the weapon registry alongside lReDragol
 * and curated entries — binary-decoded values fill gaps where other
 * sources are missing.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const OHAI_ROOT = path.resolve(__dirname, '..');
const ENRICHED_PATH = path.join(OHAI_ROOT, 'data', 'generated', 'decoded', 'enriched', 'weapons-enriched.json');
const OUTPUT_PATH = path.join(OHAI_ROOT, 'src', 'ui', 'registries', 'generated', 'weaponsStats.bindict.generated.ts');

interface EnrichedWeapon {
  equipOriginId: number;
  gunNo: number;
  nameZhCn: string | null;
  icon: string | null;
  quality: number;
  equipType: number;
  equipLevel: number;
  blueprintNo: number;
  suitId: number;
  gunKindName: string | null;
  stats: {
    rpm: number;
    mobility: number;
    rangeValue: number;
    magazineSize: number;
    bulletSpeed: number;
    bulletCost: number;
    shootMode: number;
    burstBulletNum: number;
    burstInterval: number;
    singleInterval: number;
    autoInterval: number;
    reloadLoopTime: number;
    reloadFrontSwing: number;
    reloadBackSwing: number;
    reloadAddBulletTime: number;
    clipReloadMode: number;
    adsTime: number;
    equipTime: number;
    unequipTime: number;
    fireMaxValue: number;
    fireRecoverSpeed: number;
    damageFalloff1: number[] | null;
    damageFalloff2: number[] | null;
    attackLevel: number;
  };
  affixes: {
    rpmAffix: string | null;
    rpmAffixValue: number;
    mobilityAffix: string | null;
    rangeAffix: string | null;
    rangeAffixValue: number;
    magazineAffix: string | null;
    magazineAffixValue: number;
  };
  references: {
    bulletNo: number;
    bulletBaseNo: number;
    gunSkillNo: number;
    costBulletType: number;
    passiveSkillNo: string | number | null;
  };
}

/**
 * Map gun_kind_name (Simplified Chinese) to weapon family for CanonicalWeapon.
 */
function mapGunKindToFamily(gunKind: string | null): string {
  if (!gunKind) return 'unknown';
  const kind = gunKind.replace(/_\$S@TIDS\$_[a-z0-9]+\|\w+$/i, '').trim();
  const map: Record<string, string> = {
    '手枪': 'Pistol',
    '霰弹枪': 'Shotgun',
    '冲锋枪': 'SMG',
    '步枪': 'AR',
    '栓动狙击枪': 'Bolt Sniper',
    '半自动狙击枪': 'Semi Sniper',
    '轻机枪': 'LMG',
    '弩': 'Crossbow',
    '反曲弩': 'Crossbow',
    '复合弩': 'Crossbow',
    '反曲弓': 'Bow',
    '喷火器': 'Flamethrower',
    '火箭筒': 'RPG',
    '榴弹发射器': 'Grenade Launcher',
    '蓝焰喷火器': 'Flamethrower',
    '异常物武器': 'Deviation Weapon',
    '狙击枪': 'Sniper',
  };
  return map[kind] || kind;
}

/**
 * Calculate effective reload time from the binary data fields.
 * The reload is: frontSwing + loopTime + backSwing (for clip reload)
 * or just loopTime (for full-mag reload).
 */
function calcReloadTime(stats: EnrichedWeapon['stats']): number {
  if (stats.clipReloadMode > 0) {
    // Shell-by-shell reload (shotguns, some revolvers)
    // reloadAddBulletTime per shell, plus swing times
    return stats.reloadFrontSwing + stats.reloadAddBulletTime + stats.reloadBackSwing;
  }
  // Full magazine reload
  return stats.reloadLoopTime || (stats.reloadFrontSwing + stats.reloadBackSwing);
}

/**
 * Generate a kebab-case ID from the Chinese name and equip ID.
 * Always includes equip_origin_id to guarantee uniqueness.
 */
function generateId(name: string | null, equipId: number, gunNo: number): string {
  if (!name) return `bindict-${equipId}`;
  // Strip $S@TIDS$ tokens
  const clean = name.replace(/_\$S@TIDS\$_[a-z0-9]+\|\w+$/i, '').trim();
  // Convert to ASCII-friendly kebab-case
  const ascii = clean.replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `bindict-${ascii || 'unknown'}-${gunNo}`;
}

/**
 * Filter: only include player-usable weapons (exclude NPC guns, turrets, etc.)
 */
function isPlayerWeapon(w: EnrichedWeapon): boolean {
  // Quality 0 with very high magazine (9999+) = NPC/test weapons
  if (w.stats.magazineSize >= 999 && w.quality === 0) return false;
  // Drone/turret guns
  if (w.nameZhCn && /无人机|炮台|哨戒|boss|僵尸|小怪|罗塞塔|秃鹫战|秃鹫狙/.test(w.nameZhCn)) return false;
  // Must have valid RPM
  if (w.stats.rpm <= 0) return false;
  // Must have a name
  if (!w.nameZhCn) return false;
  return true;
}

async function main(): Promise<void> {
  console.log(`[generate:bindict-weapons] Reading enriched data: ${ENRICHED_PATH}`);
  const raw = await fs.readFile(ENRICHED_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const weapons: EnrichedWeapon[] = data.weapons;

  console.log(`[generate:bindict-weapons] Total enriched weapons: ${weapons.length}`);

  // Deduplicate by gun_no — take the highest quality variant per gun mechanics
  const byGunNo = new Map<number, EnrichedWeapon>();
  for (const w of weapons) {
    const existing = byGunNo.get(w.gunNo);
    if (!existing || w.quality > existing.quality) {
      byGunNo.set(w.gunNo, w);
    }
  }

  console.log(`[generate:bindict-weapons] Unique gun mechanics: ${byGunNo.size}`);

  // Filter to player weapons only
  const playerWeapons = [...byGunNo.values()].filter(isPlayerWeapon);
  console.log(`[generate:bindict-weapons] Player weapons after filter: ${playerWeapons.length}`);

  // Generate TypeScript output
  const lines: string[] = [
    '// Auto-generated from bindict_scan.json decoded weapon data.',
    '// Do not edit directly. Regenerate with: npm run generate:bindict-weapons',
    '// Source: data/generated/decoded/enriched/weapons-enriched.json',
    'import type { CanonicalWeapon } from "../../itemTypes";',
    '',
    'export const bindictWeaponEntries: CanonicalWeapon[] = [',
  ];

  for (const w of playerWeapons) {
    const id = generateId(w.nameZhCn, w.equipOriginId, w.gunNo);
    const family = mapGunKindToFamily(w.gunKindName);
    const reloadTime = calcReloadTime(w.stats);
    const nameClean = (w.nameZhCn || '').replace(/_\$S@TIDS\$_[a-z0-9]+\|\w+$/i, '').trim();

    const quality = w.quality >= 4 ? 'legendary'
      : w.quality >= 3 ? 'epic'
      : w.quality >= 2 ? 'rare'
      : 'common';

    lines.push(`  {`);
    lines.push(`    id: ${JSON.stringify(id)},`);
    lines.push(`    name: ${JSON.stringify(nameClean)},`);
    lines.push(`    originalName: ${JSON.stringify(nameClean)},`);
    lines.push(`    category: "weapon",`);
    lines.push(`    family: ${JSON.stringify(family)},`);
    lines.push(`    blueprintQuality: ${JSON.stringify(quality)},`);
    lines.push(`    maxStars: 6,`);
    lines.push(`    damageProfile: 'kinetic',`);
    lines.push(`    tags: [${JSON.stringify(family.toLowerCase().replace(/\s+/g, '_'))}],`);
    lines.push(`    effectSummary: '',`);
    lines.push(`    confidence: "decoded",`);
    lines.push(`    needsReview: true,`);
    lines.push(`    sourceNotes: 'Decoded from bindict_scan.json. equipOriginId: ${w.equipOriginId}, gunNo: ${w.gunNo}',`);
    lines.push(`    allowedAmmoCategories: ["none"],`);
    lines.push(`    defaultAmmoCategory: 'none',`);
    lines.push(`    fireRate: ${Math.round(w.stats.rpm)},`);
    lines.push(`    magazineCapacity: ${w.stats.magazineSize},`);
    lines.push(`    reloadTimeSeconds: ${Number(reloadTime.toFixed(3))},`);
    lines.push(`  },`);
  }

  lines.push('];');
  lines.push('');

  const output = lines.join('\n');
  await fs.writeFile(OUTPUT_PATH, output, 'utf-8');

  console.log(`[generate:bindict-weapons] Output: ${OUTPUT_PATH}`);
  console.log(`[generate:bindict-weapons] Generated ${playerWeapons.length} weapon entries.`);
  console.log(`[generate:bindict-weapons] Done.`);
}

main().catch((err) => {
  console.error('[generate:bindict-weapons] FATAL:', err.message);
  process.exit(1);
});
