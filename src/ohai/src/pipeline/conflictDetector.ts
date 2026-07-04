import * as fs from 'fs/promises';
import * as path from 'path';
import { PipelineConfig } from './types';

/**
 * Result classification for a single comparison between decoded and verified records.
 */
export type ConflictCategory =
  | 'exact_match'
  | 'partial_match'
  | 'conflict'
  | 'missing_in_decoded'
  | 'missing_in_verified'
  | 'unknown_field';

export interface FieldConflict {
  fieldPath: string;
  verifiedValue: unknown;
  decodedValue: unknown;
}

export interface ComparisonEntry {
  category: ConflictCategory;
  verifiedId: string | null;
  decodedSourceFile: string | null;
  verifiedSourceFile: string;
  matchedFields: string[];
  conflicts: FieldConflict[];
  notes: string[];
}

export interface ConflictReport {
  _meta: {
    generatedAt: string;
    pipelineVersion: string;
    verifiedFilesScanned: number;
    decodedTablesScanned: number;
    totalComparisons: number;
  };
  summary: {
    exact_match: number;
    partial_match: number;
    conflict: number;
    missing_in_decoded: number;
    missing_in_verified: number;
    unknown_field: number;
  };
  comparisons: ComparisonEntry[];
  candidateMatches: CandidateMatch[];
}

export interface CandidateMatch {
  verifiedModule: string;
  verifiedFile: string;
  verifiedRecordCount: number;
  matchedDecodedTables: DecodedTableMatch[];
}

export interface DecodedTableMatch {
  tableName: string;
  sourceFile: string;
  recordCount: number;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  fieldOverlap: FieldOverlapEntry[];
  valueMatches: ValueMatchEntry[];
  nameMatches: NameMatchEntry[];
}

export interface FieldOverlapEntry {
  decodedField: string;
  verifiedEquivalent: string;
  matchType: 'exact_name' | 'known_mapping' | 'structural';
}

export interface ValueMatchEntry {
  verifiedField: string;
  verifiedValue: unknown;
  decodedField: string;
  decodedValue: unknown;
  matchType: 'exact' | 'approximate';
}

export interface NameMatchEntry {
  verifiedName: string;
  decodedName: string;
  decodedField: string;
  similarity: 'exact' | 'contains' | 'partial';
}

/**
 * Known Chinese-to-internal field name mappings discovered from actual decoded data.
 * Maps verified module → { verifiedFieldName → decodedFieldNames[] }
 */
const FIELD_MAPPINGS: Record<string, Record<string, string[]>> = {
  weapons: {
    '暴擊率': ['crit_rate', 'crit_dam_rate'],
    '暴擊傷害': ['crit_dam_rate', 'crit_rate'],
    '弱點傷害': ['weak_dam_rate', 'weak_point_rate'],
    '類型': ['weapon_type', 'equip_type', 'gun_type'],
    '名稱': ['name', 'gun_kind_name', 'prototype_name'],
    '關鍵詞': ['keyword', 'element_type'],
  },
  armor: {
    '名稱': ['name'],
    '部位': ['slot', 'equip_type', 'part_type', 'armor_pos'],
    '類型': ['type', 'armor_type', 'equip_type'],
    '關鍵詞': ['keyword', 'element_type'],
    '關鍵效果': ['effect', 'passive_skill_no'],
  },
  'mod-suffix-effects': {
    'suffixName': ['affix_name', 'name'],
    'effectName': ['effect_name', 'attr_name'],
    'cellText': ['desc', 'affix_desc'],
  },
  'mod-core-effects': {
    'coreEffectName': ['effect_name', 'name', 'core_name'],
    'applicableWeaponType': ['weapon_type_lst', 'gun_type', 'weapon_type'],
  },
  'food-buffs': {
    'nameOriginal': ['name'],
    'effectOriginal': ['effect', 'buff_desc', 'desc'],
    'typeOriginal': ['type', 'food_type', 'category'],
    'ingredientsOriginal': ['ingredients', 'material_list', 'recipe'],
  },
  deviations: {
    'nameOriginal': ['name', 'deviation_name'],
    'abilityOriginal': ['ability', 'skill_desc', 'effect'],
    'deviationTypeOriginal': ['type', 'deviation_type', 'category'],
  },
  'armor-sets': {
    'setNameOriginal': ['name', 'suit_name'],
    'setBonusOriginal': ['bonus', 'set_effect', 'suit_effect'],
  },
};

/**
 * Structural fingerprints: field combinations that strongly indicate a specific table type.
 * If a decoded table has ALL fields in a fingerprint set, it's a strong candidate.
 * Higher weight fingerprints (longer arrays) are more specific.
 */
const STRUCTURAL_FINGERPRINTS: Record<string, string[][]> = {
  weapons: [
    ['weapon_rpm', 'weapon_mobility', 'weapon_range_value', 'bullet_speed', 'gun_kind_name'],
    ['weapon_rpm', 'weapon_mobility', 'weapon_range_value'],
    ['equip_origin_id', 'gun_no', 'equip_type', 'blueprint_no'],
    ['equip_origin_id', 'gun_no', 'equip_type'],
    ['prototype_name', 'weapon_type', 'prototype_desc'],
    ['gun_kind_name', 'bullet_speed', 'default_shoot_mode'],
    ['name', 'icon', 'quality', 'type'], // item table (03422) — links names
  ],
  armor: [
    ['equip_origin_id', 'equip_type', 'suit_id', 'equip_quality', 'passive_skill_no'],
    ['equip_origin_id', 'equip_type', 'suit_id'],
    ['name', 'icon', 'quality', 'type'], // item table (03422) — links names
  ],
  'mod-suffix-effects': [
    ['affix_ids', 'affix_ids_weight', 'affix_val_range', 'weapon_type_lst'],
    ['affix_ids', 'affix_ids_weight', 'affix_val_range'],
    ['affix_id1', 'affix_id2', 'affix_rule1', 'affix_rule2'],
    ['affix_id1', 'affix_id2', 'affix_rule1'],
    ['affix_desc_list', 'affix_list', 'affix_list_new'],
    ['affix_desc_list', 'affix_list'],
  ],
  'mod-core-effects': [
    ['weapon_type_lst', 'buff_id', 'affix_ids', 'affix_ids_weight'],
    ['weapon_type_lst', 'buff_id', 'affix_ids'],
    ['mod_type', 'mod_quality'],
    ['ability_type', 'gun_type', 'buff_id', 'keyword_buff_id'], // cradle skills table
  ],
  'food-buffs': [
    ['buff_id', 'effect_name', 'effects', 'effects_params', 'effect_str_format'],
    ['buff_id', 'effect_name', 'effects', 'effects_params'],
    ['can_diy_food'],
    ['name', 'icon', 'quality', 'type'], // item table — food items
  ],
  deviations: [
    ['deviation_lib', 'effects', 'combat_deviation_buffs', 'worker_deviation_buffs'],
    ['deviation_lib', 'effects', 'combat_deviation_buffs'],
    ['deviation_no', 'deviation_degree', 'level', 'deviation_unit_dct'],
    ['deviation_no', 'deviation_degree', 'level'],
    ['is_public_deviation', 'gameplay_type'],
  ],
  'armor-sets': [
    ['suit_id', 'equip_type', 'equip_quality'],
    ['suit_id', 'equip_type'],
  ],
};

/**
 * Load all verified data files and return them keyed by module name.
 */
async function loadVerifiedData(
  verifiedDir: string
): Promise<Map<string, { fileName: string; data: Record<string, unknown> }>> {
  const map = new Map<string, { fileName: string; data: Record<string, unknown> }>();

  try {
    const files = await fs.readdir(verifiedDir);
    for (const file of files) {
      if (!file.endsWith('.verified.json')) continue;
      const moduleName = file.replace('.verified.json', '');
      const fullPath = path.join(verifiedDir, file);
      const content = await fs.readFile(fullPath, 'utf-8');
      const data = JSON.parse(content);
      map.set(moduleName, { fileName: file, data });
    }
  } catch {
    // Directory may not exist
  }

  return map;
}

/**
 * Lightweight decoded table metadata — don't load full records for initial scanning.
 */
interface DecodedTableMeta {
  fileName: string;
  tableName: string;
  recordCount: number;
  fieldNames: Set<string>;
}

/**
 * Load decoded table metadata from table-inventory.json (much faster than reading all raw files).
 */
async function loadDecodedTableMetadata(
  decodedDir: string
): Promise<DecodedTableMeta[]> {
  const inventoryPath = path.join(decodedDir, 'table-inventory.json');
  try {
    const content = await fs.readFile(inventoryPath, 'utf-8');
    const inventory = JSON.parse(content);
    const tables: DecodedTableMeta[] = [];

    for (const table of inventory.tables || []) {
      const sourceFile = table.sourceFile || '';
      const baseName = path.basename(sourceFile).replace(/\.[^.]+$/, '');
      const tableName = baseName.replace(/[^a-zA-Z0-9_\-]/g, '_');
      tables.push({
        fileName: `${tableName}.raw.json`,
        tableName,
        recordCount: table.recordCount || 0,
        fieldNames: new Set(table.fieldNames || []),
      });
    }

    return tables;
  } catch {
    return [];
  }
}

/**
 * Load full records from a specific decoded table.
 */
async function loadDecodedRecords(
  decodedRawDir: string,
  fileName: string
): Promise<Record<string, unknown>[]> {
  try {
    const fullPath = path.join(decodedRawDir, fileName);
    const content = await fs.readFile(fullPath, 'utf-8');
    const data = JSON.parse(content);
    return data.records || [];
  } catch {
    return [];
  }
}

/**
 * Extract text values from lan_translate objects (Once Human's localization format).
 */
function extractLanTranslateText(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.lan_translate) && obj.lan_translate.length > 0) {
    const raw = String(obj.lan_translate[0]);
    // Strip the _$S@TIDS$_xxx|N suffix used for translation IDs
    return raw.replace(/_\$S@TIDS\$_[a-z0-9]+\|\d+$/i, '').trim();
  }
  return null;
}

/**
 * Score structural fingerprint matches for a decoded table against a verified module.
 */
function scoreFingerprints(
  fieldNames: Set<string>,
  moduleName: string
): { score: number; matchedFingerprints: string[][] } {
  const fingerprints = STRUCTURAL_FINGERPRINTS[moduleName] || [];
  let score = 0;
  const matchedFingerprints: string[][] = [];

  for (const fp of fingerprints) {
    const allPresent = fp.every(f => fieldNames.has(f));
    if (allPresent) {
      score += fp.length * 3; // Weight by fingerprint length
      matchedFingerprints.push(fp);
    } else {
      // Partial match
      const presentCount = fp.filter(f => fieldNames.has(f)).length;
      if (presentCount >= Math.ceil(fp.length * 0.6)) {
        score += presentCount;
        matchedFingerprints.push(fp.filter(f => fieldNames.has(f)));
      }
    }
  }

  return { score, matchedFingerprints };
}

/**
 * Try to find Chinese name matches between verified items and decoded records.
 * Handles Simplified ↔ Traditional Chinese by using substring containment
 * and searching for common base characters (ASCII portions like "AA12", "RPD", "DP12").
 */
function findNameMatches(
  verifiedItems: Record<string, unknown>[],
  decodedRecords: Record<string, unknown>[],
  maxSamples: number = 50
): NameMatchEntry[] {
  const matches: NameMatchEntry[] = [];
  const seenPairs = new Set<string>();

  // Collect verified names (Chinese original)
  const verifiedNames: string[] = [];
  for (const item of verifiedItems.slice(0, maxSamples)) {
    const original = item.original as Record<string, unknown> | undefined;
    const normalized = item.normalized as Record<string, unknown> | undefined;
    if (original) {
      for (const key of ['名稱', 'nameOriginal', 'suffixName', 'coreEffectName', 'setNameOriginal']) {
        const val = original[key];
        if (typeof val === 'string' && val.length > 0) {
          verifiedNames.push(val);
        }
      }
    }
    if (normalized) {
      const nameOrig = normalized.nameOriginal;
      if (typeof nameOrig === 'string' && nameOrig.length > 0 && !verifiedNames.includes(nameOrig)) {
        verifiedNames.push(nameOrig);
      }
    }
  }

  if (verifiedNames.length === 0) return matches;

  // Extract ASCII prefix from weapon names (e.g., "AA12" from "AA12-焚滅之引")
  const asciiPrefixes: Map<string, string> = new Map();
  for (const name of verifiedNames) {
    const asciiMatch = name.match(/^([A-Za-z0-9]+)/);
    if (asciiMatch && asciiMatch[1].length >= 2) {
      asciiPrefixes.set(asciiMatch[1], name);
    }
  }

  // Search decoded records for these names in lan_translate fields
  for (const record of decodedRecords.slice(0, 500)) {
    for (const [field, value] of Object.entries(record)) {
      const text = extractLanTranslateText(value);
      if (!text || text.length < 2) continue;

      // Exact match
      for (const vName of verifiedNames) {
        const key = `${vName}:${text}:${field}`;
        if (seenPairs.has(key)) continue;

        if (text === vName) {
          seenPairs.add(key);
          matches.push({ verifiedName: vName, decodedName: text, decodedField: field, similarity: 'exact' });
        } else if (text.includes(vName) || vName.includes(text)) {
          seenPairs.add(key);
          matches.push({ verifiedName: vName, decodedName: text, decodedField: field, similarity: 'contains' });
        }
      }

      // ASCII prefix match (handles Simplified↔Traditional for weapon names like "AA12-xxx")
      if (asciiPrefixes.size > 0) {
        const decodedAscii = text.match(/^([A-Za-z0-9]+)/);
        if (decodedAscii && decodedAscii[1].length >= 2) {
          const vName = asciiPrefixes.get(decodedAscii[1]);
          if (vName) {
            const key = `ascii:${vName}:${text}:${field}`;
            if (!seenPairs.has(key)) {
              seenPairs.add(key);
              matches.push({ verifiedName: vName, decodedName: text, decodedField: field, similarity: 'partial' });
            }
          }
        }
      }
    }
  }

  // Deduplicate: keep only one match per verified name (prefer exact > contains > partial)
  const bestByVerified = new Map<string, NameMatchEntry>();
  const priorityOrder = { exact: 0, contains: 1, partial: 2 };
  for (const m of matches) {
    const existing = bestByVerified.get(m.verifiedName);
    if (!existing || priorityOrder[m.similarity] < priorityOrder[existing.similarity]) {
      bestByVerified.set(m.verifiedName, m);
    }
  }

  return Array.from(bestByVerified.values());
}

/**
 * Find numeric value overlaps between verified and decoded data.
 */
function findValueOverlaps(
  verifiedItems: Record<string, unknown>[],
  decodedRecords: Record<string, unknown>[],
  moduleName: string
): ValueMatchEntry[] {
  const matches: ValueMatchEntry[] = [];
  const mappings = FIELD_MAPPINGS[moduleName] || {};

  // Collect verified numeric values with their field names
  const verifiedNumericPairs: Array<{ field: string; value: number }> = [];
  for (const item of verifiedItems.slice(0, 30)) {
    const original = item.original as Record<string, unknown> | undefined;
    if (!original) continue;
    for (const [key, val] of Object.entries(original)) {
      if (typeof val === 'number' && val !== 0) {
        verifiedNumericPairs.push({ field: key, value: val });
      }
    }
  }

  if (verifiedNumericPairs.length === 0) return matches;

  // For each verified numeric value, search decoded records for the same value
  // in fields that are mapped equivalents
  const seenMatches = new Set<string>();
  for (const { field: vField, value: vValue } of verifiedNumericPairs) {
    const targetDecodedFields = mappings[vField] || [];

    for (const record of decodedRecords.slice(0, 500)) {
      for (const dField of targetDecodedFields) {
        const dValue = record[dField];
        if (typeof dValue !== 'number') continue;

        const key = `${vField}:${vValue}:${dField}:${dValue}`;
        if (seenMatches.has(key)) continue;

        if (Math.abs(dValue - vValue) < 0.0001) {
          seenMatches.add(key);
          matches.push({
            verifiedField: vField,
            verifiedValue: vValue,
            decodedField: dField,
            decodedValue: dValue,
            matchType: 'exact',
          });
        } else if (Math.abs(dValue - vValue) / Math.max(Math.abs(vValue), 0.001) < 0.05) {
          seenMatches.add(key);
          matches.push({
            verifiedField: vField,
            verifiedValue: vValue,
            decodedField: dField,
            decodedValue: dValue,
            matchType: 'approximate',
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Run the full conflict detection pipeline.
 */
export async function detectConflicts(config: PipelineConfig): Promise<ConflictReport> {
  const verifiedDir = path.resolve(config.decodedOutputDir, '..', '..', 'verified');
  const decodedRawDir = path.resolve(config.decodedOutputDir, 'raw');

  console.log(`[conflict-detect] Loading verified data from: ${verifiedDir}`);
  const verifiedData = await loadVerifiedData(verifiedDir);
  console.log(`[conflict-detect] Loaded ${verifiedData.size} verified modules`);

  console.log(`[conflict-detect] Loading decoded table metadata...`);
  const decodedTables = await loadDecodedTableMetadata(config.decodedOutputDir);
  console.log(`[conflict-detect] Found ${decodedTables.length} decoded tables`);

  const comparisons: ComparisonEntry[] = [];
  const candidateMatches: CandidateMatch[] = [];
  const summary = {
    exact_match: 0,
    partial_match: 0,
    conflict: 0,
    missing_in_decoded: 0,
    missing_in_verified: 0,
    unknown_field: 0,
  };

  for (const [moduleName, { fileName, data }] of verifiedData) {
    const items: Record<string, unknown>[] =
      (data as { items?: Record<string, unknown>[] }).items || [];

    const hasMappings = !!FIELD_MAPPINGS[moduleName] || !!STRUCTURAL_FINGERPRINTS[moduleName];

    if (!hasMappings) {
      comparisons.push({
        category: 'unknown_field',
        verifiedId: moduleName,
        decodedSourceFile: null,
        verifiedSourceFile: fileName,
        matchedFields: [],
        conflicts: [],
        notes: [`No field mapping patterns or structural fingerprints defined for module "${moduleName}"`],
      });
      summary.unknown_field++;
      candidateMatches.push({
        verifiedModule: moduleName,
        verifiedFile: fileName,
        verifiedRecordCount: items.length,
        matchedDecodedTables: [],
      });
      continue;
    }

    console.log(`[conflict-detect] Analyzing module: ${moduleName} (${items.length} verified records)`);

    // Phase 1: Structural fingerprint matching (fast, no file I/O)
    const candidates: Array<{
      meta: DecodedTableMeta;
      fingerprintScore: number;
      matchedFingerprints: string[][];
    }> = [];

    for (const tableMeta of decodedTables) {
      if (tableMeta.recordCount === 0) continue;

      const { score, matchedFingerprints } = scoreFingerprints(tableMeta.fieldNames, moduleName);
      if (score > 0) {
        candidates.push({ meta: tableMeta, fingerprintScore: score, matchedFingerprints });
      }
    }

    // Sort by fingerprint score, take top candidates for deep analysis
    candidates.sort((a, b) => b.fingerprintScore - a.fingerprintScore);
    const topCandidates = candidates.slice(0, 20);

    console.log(`[conflict-detect]   ${candidates.length} structural candidates, analyzing top ${topCandidates.length}`);

    // Phase 2: Deep analysis on top candidates (loads records from disk)
    const matchedTables: DecodedTableMatch[] = [];

    for (const candidate of topCandidates) {
      const records = await loadDecodedRecords(decodedRawDir, candidate.meta.fileName);

      // Try name matching
      const nameMatches = items.length > 0
        ? findNameMatches(items, records)
        : [];

      // Try value matching
      const valueMatches = findValueOverlaps(items, records, moduleName);

      // Build field overlap entries from fingerprints
      const fieldOverlap: FieldOverlapEntry[] = [];
      for (const fp of candidate.matchedFingerprints) {
        for (const field of fp) {
          // Find the verified equivalent from mappings
          const mappings = FIELD_MAPPINGS[moduleName] || {};
          let verifiedEquiv = field;
          for (const [vField, dFields] of Object.entries(mappings)) {
            if (dFields.includes(field)) {
              verifiedEquiv = vField;
              break;
            }
          }
          fieldOverlap.push({
            decodedField: field,
            verifiedEquivalent: verifiedEquiv,
            matchType: verifiedEquiv !== field ? 'known_mapping' : 'structural',
          });
        }
      }

      // Calculate overall confidence
      let totalScore = candidate.fingerprintScore;
      totalScore += nameMatches.filter(m => m.similarity === 'exact').length * 10;
      totalScore += nameMatches.filter(m => m.similarity === 'contains').length * 5;
      totalScore += nameMatches.filter(m => m.similarity === 'partial').length * 3;
      totalScore += valueMatches.filter(m => m.matchType === 'exact').length * 5;
      totalScore += valueMatches.filter(m => m.matchType === 'approximate').length * 2;

      // Record count correlation bonus
      // If decoded record count is in same order of magnitude as verified, that's a signal
      if (items.length > 0 && candidate.meta.recordCount > 0) {
        const ratio = candidate.meta.recordCount / items.length;
        if (ratio >= 0.5 && ratio <= 10) {
          totalScore += 3; // Plausible record count range
        }
        if (ratio >= 0.8 && ratio <= 5) {
          totalScore += 3; // Very close record count
        }
      }

      const confidence: 'high' | 'medium' | 'low' =
        totalScore >= 15 ? 'high' : totalScore >= 6 ? 'medium' : 'low';

      const matchReasons: string[] = [];
      if (candidate.fingerprintScore > 0) {
        matchReasons.push(`Structural fingerprint score: ${candidate.fingerprintScore}`);
      }
      if (nameMatches.length > 0) {
        const exactNames = nameMatches.filter(m => m.similarity === 'exact').length;
        const partialNames = nameMatches.filter(m => m.similarity === 'partial').length;
        matchReasons.push(`Name matches: ${nameMatches.length} (${exactNames} exact, ${partialNames} partial/ASCII)`);
      }
      if (valueMatches.length > 0) {
        const exactVals = valueMatches.filter(m => m.matchType === 'exact').length;
        matchReasons.push(`Value matches: ${valueMatches.length} (${exactVals} exact)`);
      }
      matchReasons.push(`Record count: ${candidate.meta.recordCount} decoded vs ${items.length} verified`);

      matchedTables.push({
        tableName: candidate.meta.tableName,
        sourceFile: candidate.meta.fileName,
        recordCount: candidate.meta.recordCount,
        confidence,
        matchReasons,
        fieldOverlap,
        valueMatches: valueMatches.slice(0, 20),
        nameMatches: nameMatches.slice(0, 20),
      });

      // Record comparison entries for high-confidence matches
      if (confidence === 'high') {
        const hasConflicts = valueMatches.some(m => m.matchType === 'approximate');
        const category: ConflictCategory = hasConflicts ? 'partial_match' : 'exact_match';

        comparisons.push({
          category,
          verifiedId: moduleName,
          decodedSourceFile: candidate.meta.fileName,
          verifiedSourceFile: fileName,
          matchedFields: matchReasons,
          conflicts: valueMatches
            .filter(m => m.matchType === 'approximate')
            .map(m => ({
              fieldPath: `${m.verifiedField} vs ${m.decodedField}`,
              verifiedValue: m.verifiedValue,
              decodedValue: m.decodedValue,
            })),
          notes: matchReasons,
        });

        if (hasConflicts) {
          summary.partial_match++;
        } else {
          summary.exact_match++;
        }
      }
    }

    // Sort matched tables by confidence
    const confOrder = { high: 0, medium: 1, low: 2 };
    matchedTables.sort((a, b) => confOrder[a.confidence] - confOrder[b.confidence]);

    if (matchedTables.filter(t => t.confidence !== 'low').length === 0) {
      comparisons.push({
        category: 'missing_in_decoded',
        verifiedId: moduleName,
        decodedSourceFile: null,
        verifiedSourceFile: fileName,
        matchedFields: [],
        conflicts: [],
        notes: [`No high/medium confidence decoded table found for module "${moduleName}"`],
      });
      summary.missing_in_decoded++;
    }

    candidateMatches.push({
      verifiedModule: moduleName,
      verifiedFile: fileName,
      verifiedRecordCount: items.length,
      matchedDecodedTables: matchedTables,
    });
  }

  const report: ConflictReport = {
    _meta: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: config.pipelineVersion,
      verifiedFilesScanned: verifiedData.size,
      decodedTablesScanned: decodedTables.length,
      totalComparisons: comparisons.length,
    },
    summary,
    comparisons,
    candidateMatches,
  };

  return report;
}
