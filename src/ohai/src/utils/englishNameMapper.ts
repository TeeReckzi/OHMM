import * as fs from "node:fs";
import * as path from "node:path";

export interface EnglishReferenceEntry {
  id_index: number;
  english_name: string;
  tier_classification?: string;
  metadata_dump?: string;
  source_slug?: string;
  total_variants?: number;
  gear_slot_variants?: Array<{
    target_gear_piece: string;
    buff_classification: string;
    effect_details: string;
  }>;
}

export interface EnglishReferenceIndex {
  byName: Map<string, EnglishReferenceEntry>;
  byNormalizedName: Map<string, EnglishReferenceEntry>;
  byBaseName: Map<string, EnglishReferenceEntry[]>;
  all: EnglishReferenceEntry[];
}

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const EXTERNAL_REFS_DIR = path.join(ROOT_DIR, "data", "raw", "external-references");

const REFERENCE_FILES: Record<string, string> = {
  weapons: "once_human_weapons_reference.json",
  armor: "once_human_english_reference.json",
  materials: "once_human_materials_reference.json",
};

function normalizeForLookup(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\u4e00-\u9fff]+/g, "")
    .trim();
}

function extractBaseName(name: string): string {
  const cleaned = name.replace(/[\u4e00-\u9fff]+/g, "").trim();
  const parts = cleaned.split(/[-–—\s]+/).filter(Boolean);
  for (const part of parts) {
    if (/[a-zA-Z0-9]/.test(part) && part.length >= 2) {
      return part.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
  }
  return cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function loadReferenceFile(filename: string): EnglishReferenceEntry[] {
  const filePath = path.join(EXTERNAL_REFS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`English reference file not found: ${filePath}`);
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content) as EnglishReferenceEntry[];
    return data.filter((entry) => entry.english_name && entry.english_name.trim().length > 0);
  } catch (error) {
    console.warn(`Failed to load English reference file ${filename}:`, error);
    return [];
  }
}

function buildIndex(entries: EnglishReferenceEntry[]): EnglishReferenceIndex {
  const byName = new Map<string, EnglishReferenceEntry>();
  const byNormalizedName = new Map<string, EnglishReferenceEntry>();
  const byBaseName = new Map<string, EnglishReferenceEntry[]>();

  for (const entry of entries) {
    if (!entry.english_name) continue;
    byName.set(entry.english_name, entry);
    const normalized = normalizeForLookup(entry.english_name);
    if (normalized) {
      byNormalizedName.set(normalized, entry);
    }
    const baseName = extractBaseName(entry.english_name);
    if (baseName) {
      if (!byBaseName.has(baseName)) {
        byBaseName.set(baseName, []);
      }
      byBaseName.get(baseName)!.push(entry);
    }
  }

  return { byName, byNormalizedName, byBaseName, all: entries };
}

const cache: Record<string, EnglishReferenceIndex> = {};

export function getWeaponsReference(): EnglishReferenceIndex {
  if (!cache.weapons) {
    cache.weapons = buildIndex(loadReferenceFile(REFERENCE_FILES.weapons));
  }
  return cache.weapons;
}

export function getArmorReference(): EnglishReferenceIndex {
  if (!cache.armor) {
    cache.armor = buildIndex(loadReferenceFile(REFERENCE_FILES.armor));
  }
  return cache.armor;
}

export function getMaterialsReference(): EnglishReferenceIndex {
  if (!cache.materials) {
    cache.materials = buildIndex(loadReferenceFile(REFERENCE_FILES.materials));
  }
  return cache.materials;
}

export function lookupEnglishName(
  chineseName: string | null | undefined,
  index: EnglishReferenceIndex
): string | null {
  if (!chineseName) return null;

  const normalized = normalizeForLookup(chineseName);
  if (!normalized) return null;

  const exactMatch = index.byNormalizedName.get(normalized);
  if (exactMatch) return exactMatch.english_name;

  const baseName = extractBaseName(chineseName);
  if (baseName) {
    const baseMatches = index.byBaseName.get(baseName);
    if (baseMatches && baseMatches.length > 0) {
      return baseMatches[0].english_name;
    }
  }

  for (const entry of index.all) {
    if (!entry.english_name) continue;
    const entryNormalized = normalizeForLookup(entry.english_name);
    if (entryNormalized && entryNormalized.includes(normalized)) {
      return entry.english_name;
    }
  }

  for (const entry of index.all) {
    if (!entry.english_name) continue;
    const entryNormalized = normalizeForLookup(entry.english_name);
    if (entryNormalized && normalized.includes(entryNormalized)) {
      return entry.english_name;
    }
  }

  return null;
}

export function matchWeaponToEnglish(chineseName: string | null | undefined): string | null {
  return lookupEnglishName(chineseName, getWeaponsReference());
}

export function matchArmorToEnglish(chineseName: string | null | undefined): string | null {
  return lookupEnglishName(chineseName, getArmorReference());
}

export function matchMaterialToEnglish(chineseName: string | null | undefined): string | null {
  return lookupEnglishName(chineseName, getMaterialsReference());
}

export function getReferenceStats(): Record<string, number> {
  return {
    weapons: getWeaponsReference().all.length,
    armor: getArmorReference().all.length,
    materials: getMaterialsReference().all.length,
  };
}
