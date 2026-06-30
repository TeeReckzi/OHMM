import type { CanonicalWeapon } from '../itemTypes';
import { getCanonicalItemKey, normalizeWeaponFamily, normalizeMechanicFamily } from './normalization';
import { getItemReadinessState } from './itemReadiness';

export interface WeaponAuditRow {
 canonicalKey: string;
 displayName: string;
 source: string;
 weaponFamily: string;
 mechanicFamily?: string;
 readinessState: string;
 missingInputs: string[];
 warnings: string[];
 imagePath?: string;
 imageMissingReason?: string;
 formulaKey?: string;
 evidenceKey?: string;
}

export interface WeaponAuditSummary {
 totalScanned: number;
 readyCount: number;
 partialCount: number;
 displayOnlyCount: number;
 blockedCount: number;
 invalidCount: number;
 missingImageCount: number;
 missingFormulaInputCount: number;
 missingFamilyCount: number;
 missingEvidenceCount: number;
 duplicateCanonicalKeys: string[][];
 replacementCharWeapons: string[];
 rawSlugFallbackWeapons: string[];
 rows: WeaponAuditRow[];
}

export function auditWeaponSelectorReadiness(
 allWeapons: CanonicalWeapon[],
 context: { primaryWeaponId?: string } = {}
): WeaponAuditSummary {
 const rows: WeaponAuditRow[] = [];
 const seenKeys = new Map<string, string[]>();
 const replacementWeapons: string[] = [];
 const slugFallbackWeapons: string[] = [];

 let ready = 0, partial = 0, displayOnly = 0, blocked = 0, invalid = 0;
 let missingImg = 0, missingFormula = 0, missingFam = 0, missingEvidence = 0;

 for (const w of allWeapons) {
  const canonicalKey = getCanonicalItemKey(w);
  const displayName = w.name || w.id;
  const family = normalizeWeaponFamily(w.family || '');
  const mechanic = w.keywordAssociations?.[0] ? normalizeMechanicFamily(w.keywordAssociations[0]) : undefined;

  if (!seenKeys.has(canonicalKey)) seenKeys.set(canonicalKey, []);
  seenKeys.get(canonicalKey)!.push(displayName);

  const readiness = getItemReadinessState(w, { slot: 'primaryWeapon', selectedWeaponId: context.primaryWeaponId });

  const hasReplacement = /�/.test(displayName) || /�/.test(w.originalName || '');
  if (hasReplacement) replacementWeapons.push(canonicalKey);

  const isSlugOnly = !w.name && w.id && w.id.includes('-');
  if (isSlugOnly) slugFallbackWeapons.push(canonicalKey);

  const row: WeaponAuditRow = {
   canonicalKey,
   displayName,
   source: w.sourceNotes || 'unknown',
   weaponFamily: family || 'unknown',
   mechanicFamily: mechanic,
   readinessState: readiness.state,
   missingInputs: readiness.missingInputs,
   warnings: readiness.warnings,
   imagePath: w.iconUrl,
   imageMissingReason: w.iconUrl ? undefined : 'no iconUrl in registry',
   formulaKey: w.id,
   evidenceKey: w.confidence ? w.id : undefined,
  };

  rows.push(row);

  if (readiness.state === 'READY') ready++;
  else if (readiness.state === 'PARTIAL') partial++;
  else if (readiness.state === 'DISPLAY_ONLY') displayOnly++;
  else if (readiness.state === 'BLOCKED') blocked++;
  else invalid++;

  if (!row.imagePath) missingImg++;
  if (readiness.missingInputs.length > 0) missingFormula++;
  if (!family || family === 'unknown') missingFam++;
  if (!w.confidence) missingEvidence++;
 }

 const duplicateGroups = Array.from(seenKeys.values()).filter((arr) => arr.length > 1);

 return {
  totalScanned: rows.length,
  readyCount: ready,
  partialCount: partial,
  displayOnlyCount: displayOnly,
  blockedCount: blocked,
  invalidCount: invalid,
  missingImageCount: missingImg,
  missingFormulaInputCount: missingFormula,
  missingFamilyCount: missingFam,
  missingEvidenceCount: missingEvidence,
  duplicateCanonicalKeys: duplicateGroups,
  replacementCharWeapons: replacementWeapons,
  rawSlugFallbackWeapons: slugFallbackWeapons,
  rows,
 };
}
