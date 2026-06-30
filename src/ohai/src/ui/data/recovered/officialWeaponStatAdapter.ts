import type { CanonicalWeapon } from "../../itemTypes";
import { OFFICIAL_RUNTIME_CATALOG } from "./officialRuntime.generated";

type OfficialRuntimeRow = Record<string, unknown>;

export interface OfficialWeaponStatGroup {
 matchKey: string;
 matchTokens: readonly string[];
 equipmentCount: number;
 equipOriginIds: readonly number[];
 gunNos: readonly number[];
 blueprintNos: readonly number[];
 modelPaths: readonly string[];
 skinSeqNos: readonly string[];
 attack: RangeSummary | null;
 fireRateRpm: RangeSummary | null;
 autoTimeIntervalSeconds: RangeSummary | null;
 reloadLoopTimeSeconds: RangeSummary | null;
 reloadAddBulletTimeSeconds: RangeSummary | null;
 runtimeBulletSpeed: RangeSummary | null;
 projectileBulletSpeed: RangeSummary | null;
 bulletFlyMaxDistance: RangeSummary | null;
}

export interface RangeSummary {
 min: number;
 max: number;
 values: readonly number[];
}

export interface OfficialWeaponStatMatch {
 status: "matched" | "ambiguous" | "missing";
 weaponId: string;
 weaponName: string;
 matchKey?: string;
 confidence: "high" | "medium" | "none";
 reason: string;
 candidates: readonly string[];
 official?: OfficialWeaponStatGroup;
}

export interface OfficialWeaponStatAuditRow {
 weaponId: string;
 weaponName: string;
 current: {
  damagePerProjectile?: number;
  fireRate?: number;
  reloadTimeSeconds?: number;
  magazineCapacity?: number;
 };
 match: OfficialWeaponStatMatch;
 official?: Pick<
  OfficialWeaponStatGroup,
  | "matchKey"
  | "equipmentCount"
  | "equipOriginIds"
  | "gunNos"
  | "blueprintNos"
  | "attack"
  | "fireRateRpm"
  | "autoTimeIntervalSeconds"
  | "reloadLoopTimeSeconds"
  | "reloadAddBulletTimeSeconds"
  | "runtimeBulletSpeed"
  | "projectileBulletSpeed"
  | "bulletFlyMaxDistance"
 >;
 comparisons: {
  damagePerProjectile: ComparisonResult | null;
  fireRate: ComparisonResult | null;
  reloadTimeSeconds: ComparisonResult | null;
 };
 notes: readonly string[];
}

export interface ComparisonResult {
 current: number;
 officialMin: number;
 officialMax: number;
 deltaFromNearest: number;
 percentDeltaFromNearest: number | null;
 severity: "match" | "info" | "warning";
 note: string;
}

const GENERIC_TOKENS = new Set([
 "anim",
 "animgraph",
 "ar",
 "character",
 "fpp",
 "gim",
 "graph",
 "gun",
 "icon",
 "memory",
 "melee",
 "model",
 "new",
 "normal",
 "n",
 "pro",
 "r",
 "skin",
 "sk",
 "sg",
 "smg",
 "sr",
 "ssr",
 "weapon",
 "wp",
 "01",
 "02",
 "03",
]);

const ALIAS_GROUPS: readonly (readonly string[])[] = [
 ["ak47", "akm", "kam"],
 ["aa12", "acs12"],
 ["deagle", "deserteagle", "de50", "de"],
 ["sw500", "r500", "revolver"],
 ["rm1889", "dbsg", "dbs"],
 ["hk416", "416"],
 ["scar", "socr"],
 ["mp7", "mps7"],
 ["p90", "pdw90"],
 ["vector"],
 ["mp5"],
 ["mg4"],
 ["m82", "aws338", "aws", "338"],
 ["m700", "700"],
 ["m24", "awp"],
 ["crossbow", "compoundbow", "bow"],
 ["dp12"],
 ["m870"],
 ["aug"],
 ["sks"],
 ["mk14", "ebr14", "ebr"],
 ["wa2000"],
 ["tec9"],
];

const ALIAS_TO_CANONICAL = new Map<string, string>(
 ALIAS_GROUPS.flatMap((group) => group.map((token) => [token, group[0]] as const)),
);

function normalize(value: string): string {
 return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalToken(token: string): string {
 return ALIAS_TO_CANONICAL.get(token) ?? token;
}

function extractTokens(...values: readonly unknown[]): string[] {
 const tokens = new Set<string>();
 for (const value of values) {
  if (typeof value !== "string") continue;
  const normalizedWhole = normalize(value);
  const canUseWholeValue = !/[\\/]/.test(value) && normalizedWhole.length <= 40;
  if (canUseWholeValue && normalizedWhole.length >= 2 && !GENERIC_TOKENS.has(normalizedWhole)) {
   tokens.add(canonicalToken(normalizedWhole));
  }
  for (const rawToken of value.toLowerCase().split(/[^a-z0-9]+/)) {
   const token = normalize(rawToken);
   if (token.length < 2 || GENERIC_TOKENS.has(token)) continue;
   tokens.add(canonicalToken(token));
  }
 }
 return [...tokens];
}

function asNumber(value: unknown): number | undefined {
 return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function uniqueNumbers(values: Iterable<number | undefined>): number[] {
 return [...new Set([...values].filter((value): value is number => value !== undefined))].sort((a, b) => a - b);
}

function uniqueStrings(values: Iterable<unknown>): string[] {
 return [...new Set([...values].filter((value): value is string => typeof value === "string" && value.length > 0))].sort();
}

function summarize(values: Iterable<number | undefined>): RangeSummary | null {
 const unique = uniqueNumbers(values);
 if (unique.length === 0) return null;
 return {
  min: unique[0],
  max: unique[unique.length - 1],
  values: unique,
 };
}

function nearestDelta(current: number, range: RangeSummary): number {
 if (current < range.min) return current - range.min;
 if (current > range.max) return current - range.max;
 return 0;
}

function compareRange(
 current: number | undefined,
 official: RangeSummary | null,
 note: string,
 severityWhenDifferent: "info" | "warning",
): ComparisonResult | null {
 if (current === undefined || !official) return null;
 const delta = nearestDelta(current, official);
 const nearest = delta === 0 ? current : current - delta;
 const percentDelta = nearest === 0 ? null : delta / nearest;
 const withinTolerance = Math.abs(delta) < 0.0001 || (percentDelta !== null && Math.abs(percentDelta) <= 0.01);
 const severity = withinTolerance ? "match" : severityWhenDifferent;
 return {
  current,
  officialMin: official.min,
  officialMax: official.max,
  deltaFromNearest: delta,
  percentDeltaFromNearest: percentDelta,
  severity,
  note,
 };
}

function chooseOfficialMatchKey(row: OfficialRuntimeRow, runtime?: OfficialRuntimeRow): string | undefined {
 const tokens = extractTokens(
  row.armModelPath,
  row.animGraph,
  row.skinSeqNo,
 );
 return tokens.find((token) => ALIAS_TO_CANONICAL.has(token)) ?? tokens[0];
}

const gunPresetByEquipId: ReadonlyMap<number, OfficialRuntimeRow> = new Map(
 OFFICIAL_RUNTIME_CATALOG.gunPresetStats.map((row) => [Number(row.equipOriginId), row as OfficialRuntimeRow] as const),
);

const gunRuntimeByGunNo: ReadonlyMap<number, OfficialRuntimeRow> = new Map(
 OFFICIAL_RUNTIME_CATALOG.gunRuntimeStats.map((row) => [Number(row.gunNo), row as OfficialRuntimeRow] as const),
);

const bulletRuntimeByBaseNo: ReadonlyMap<number, OfficialRuntimeRow> = new Map(
 OFFICIAL_RUNTIME_CATALOG.bulletRuntimeStats.map((row) => [Number(row.bulletBaseNo), row as OfficialRuntimeRow] as const),
);

function buildOfficialWeaponStatGroups(): OfficialWeaponStatGroup[] {
 const rowsByKey = new Map<string, OfficialRuntimeRow[]>();

 for (const equipment of OFFICIAL_RUNTIME_CATALOG.weaponEquipments) {
  const gunNo = asNumber(equipment.gunNo);
  const runtime = gunNo === undefined ? undefined : gunRuntimeByGunNo.get(gunNo);
  const key = chooseOfficialMatchKey(equipment, runtime);
  if (!key) continue;
  const rows = rowsByKey.get(key) ?? [];
  rows.push(equipment);
  rowsByKey.set(key, rows);
 }

 return [...rowsByKey.entries()]
  .map(([matchKey, equipmentRows]) => {
   const presetRows = equipmentRows.map((row) => {
    const equipOriginId = asNumber(row.equipOriginId);
    return equipOriginId === undefined ? undefined : gunPresetByEquipId.get(equipOriginId);
   });
   const runtimeRows = equipmentRows.map((row) => {
    const gunNo = asNumber(row.gunNo);
    return gunNo === undefined ? undefined : gunRuntimeByGunNo.get(gunNo);
   });
   const bulletRows = runtimeRows.map((row) => {
    const bulletBaseNo = asNumber(row?.bulletBaseNo);
    return bulletBaseNo === undefined ? undefined : bulletRuntimeByBaseNo.get(bulletBaseNo);
   });
   const allTokens = new Set<string>();
   for (const row of equipmentRows) {
    extractTokens(row.armModelPath, row.animGraph, row.skinSeqNo).forEach((token) =>
     allTokens.add(token),
    );
   }
   const intervals = runtimeRows.map((row) => asNumber(row?.autoTimeInterval));
   return {
    matchKey,
    matchTokens: [...allTokens].sort(),
    equipmentCount: equipmentRows.length,
    equipOriginIds: uniqueNumbers(equipmentRows.map((row) => asNumber(row.equipOriginId))).slice(0, 20),
    gunNos: uniqueNumbers(equipmentRows.map((row) => asNumber(row.gunNo))),
    blueprintNos: uniqueNumbers(equipmentRows.map((row) => asNumber(row.blueprintNo))),
    modelPaths: uniqueStrings(equipmentRows.map((row) => row.armModelPath)).slice(0, 12),
    skinSeqNos: uniqueStrings(equipmentRows.map((row) => row.skinSeqNo)).slice(0, 12),
    attack: summarize(presetRows.map((row) => asNumber(row?.gunPresetAttack))),
    autoTimeIntervalSeconds: summarize(intervals),
    fireRateRpm: summarize(intervals.map((interval) => (interval && interval > 0 ? 60 / interval : undefined))),
    reloadLoopTimeSeconds: summarize(runtimeRows.map((row) => asNumber(row?.reloadLoopTime))),
    reloadAddBulletTimeSeconds: summarize(runtimeRows.map((row) => asNumber(row?.reloadAddBulletTime))),
    runtimeBulletSpeed: summarize(runtimeRows.map((row) => asNumber(row?.bulletSpeed))),
    projectileBulletSpeed: summarize(bulletRows.map((row) => asNumber(row?.bulletSpeed))),
    bulletFlyMaxDistance: summarize([
     ...runtimeRows.map((row) => asNumber(row?.bulletFlyMaxDistance)),
     ...bulletRows.map((row) => asNumber(row?.bulletFlyMaxDistance)),
    ]),
   };
  })
  .sort((a, b) => a.matchKey.localeCompare(b.matchKey));
}

export const OFFICIAL_WEAPON_STAT_GROUPS = buildOfficialWeaponStatGroups();

const officialGroupByKey = new Map(OFFICIAL_WEAPON_STAT_GROUPS.map((group) => [group.matchKey, group]));

function weaponMatchKeys(weapon: CanonicalWeapon): string[] {
 const tokens = new Set(
  extractTokens(
   weapon.id,
   weapon.name,
   weapon.originalName,
   weapon.family,
   ...(weapon.tags ?? []),
   ...(weapon.keywordAssociations ?? []),
  ),
 );
 return [...tokens].filter((token) => officialGroupByKey.has(token)).sort();
}

export function matchOfficialWeaponStatGroup(weapon: CanonicalWeapon): OfficialWeaponStatMatch {
 const candidates = weaponMatchKeys(weapon);
 if (candidates.length === 1) {
  const official = officialGroupByKey.get(candidates[0]);
  return {
   status: "matched",
   weaponId: weapon.id,
   weaponName: weapon.name,
   matchKey: candidates[0],
   confidence: "high",
   reason: `Single official runtime platform match by normalized token '${candidates[0]}'.`,
   candidates,
   official,
  };
 }
 if (candidates.length > 1) {
  return {
   status: "ambiguous",
   weaponId: weapon.id,
   weaponName: weapon.name,
   confidence: "medium",
   reason: "Multiple official runtime platform tokens matched; no automatic enrichment applied.",
   candidates,
  };
 }
 return {
  status: "missing",
  weaponId: weapon.id,
  weaponName: weapon.name,
  confidence: "none",
  reason: "No stable official runtime platform token matched this OHMM weapon.",
  candidates,
 };
}

export function buildOfficialWeaponStatAudit(weapons: readonly CanonicalWeapon[]): OfficialWeaponStatAuditRow[] {
 return weapons.map((weapon) => {
  const match = matchOfficialWeaponStatGroup(weapon);
  const official = match.official;
  const notes: string[] = [];
  if (official?.attack) {
   notes.push("Official attack is level/art-tiered; treat damage comparison as reference, not an automatic replacement.");
  }
  if (official?.fireRateRpm) {
   notes.push("Official fire rate is converted from autoTimeInterval seconds per shot to rounds per minute.");
  }
  if (!official) {
   notes.push(match.reason);
  }
  return {
   weaponId: weapon.id,
   weaponName: weapon.name,
   current: {
    damagePerProjectile: weapon.damagePerProjectile,
    fireRate: weapon.fireRate,
    reloadTimeSeconds: weapon.reloadTimeSeconds,
    magazineCapacity: weapon.magazineCapacity,
   },
   match,
   official,
   comparisons: {
    damagePerProjectile: compareRange(
     weapon.damagePerProjectile,
     official?.attack ?? null,
     "Official attack is tiered by recovered equip origin/art level.",
     "info",
    ),
    fireRate: compareRange(
     weapon.fireRate,
     official?.fireRateRpm ?? null,
     "Official fire rate is derived from autoTimeInterval.",
     "warning",
    ),
    reloadTimeSeconds: compareRange(
     weapon.reloadTimeSeconds,
     official?.reloadLoopTimeSeconds ?? null,
     "Compared against recovered reloadLoopTime.",
     "warning",
    ),
   },
   notes,
  };
 });
}

export function getOfficialWeaponStatMatch(weapon: CanonicalWeapon): OfficialWeaponStatMatch {
 return matchOfficialWeaponStatGroup(weapon);
}
