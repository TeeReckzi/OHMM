import { SUPABASE_URL, ANON_KEY } from "../data/supabaseClient";

export interface SupabaseLeafDefault {
  leaf_name: string;
  default_value: number;
  category: string;
  confidence: string;
}

export interface SupabaseTagTableEntry {
  tag_table_type: string;
  tag_value: string;
  suffix: string;
  value: number | null;
  confidence: string;
}

export interface SupabaseStatBridge {
  leaf_name: string;
  suffix: string;
  stat_key: string;
  tag_table_type: string;
  confidence: string;
}

interface FormulaCache {
  leafDefaults: Map<string, number>;
  tagTableEntries: Map<string, Map<string, SupabaseTagTableEntry>>;
  statBridge: Map<string, SupabaseStatBridge>;
  ready: boolean;
}

const cache: FormulaCache = {
  leafDefaults: new Map(),
  tagTableEntries: new Map(),
  statBridge: new Map(),
  ready: false,
};

let initPromise: Promise<void> | null = null;

async function fetchTable<T>(tableName: string): Promise<T[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=*`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
    );
    if (!res.ok) throw new Error(`Supabase fetch ${tableName} failed: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`Supabase ${tableName} fetch failed, using hardcoded defaults:`, e);
    return [];
  }
}

export async function initFormulaCache(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const [leafDefaults, tagTableEntries, statBridge] = await Promise.all([
      fetchTable<SupabaseLeafDefault>("formula_leaf_defaults"),
      fetchTable<SupabaseTagTableEntry>("formula_tag_table_entries"),
      fetchTable<SupabaseStatBridge>("formula_stat_bridge"),
    ]);

    for (const entry of leafDefaults) {
      cache.leafDefaults.set(entry.leaf_name, entry.default_value);
    }

    for (const entry of tagTableEntries) {
      let typeMap = cache.tagTableEntries.get(entry.tag_table_type);
      if (!typeMap) {
        typeMap = new Map();
        cache.tagTableEntries.set(entry.tag_table_type, typeMap);
      }
      typeMap.set(entry.tag_value, entry);
    }

    for (const entry of statBridge) {
      cache.statBridge.set(`${entry.leaf_name}_${entry.suffix}`, entry);
    }

    cache.ready = true;
  })();

  return initPromise;
}

export function getFormulaLeafDefaultSupabase(leafName: string): number | undefined {
  return cache.leafDefaults.get(leafName);
}

export function getTagTableEntrySupabase(tagTableType: string, tagValue: string): SupabaseTagTableEntry | undefined {
  return cache.tagTableEntries.get(tagTableType)?.get(tagValue);
}

export function getStatBridgeEntrySupabase(leafName: string, suffix: string): SupabaseStatBridge | undefined {
  return cache.statBridge.get(`${leafName}_${suffix}`);
}

export function isFormulaCacheReady(): boolean {
  return cache.ready;
}

export function getFormulaInitPromise(): Promise<void> | null {
  return initPromise;
}

initFormulaCache();
