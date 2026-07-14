/**
 * Official formula stat bridge — maps resolved tag-table attribute names
 * to OHAI FormulaInput stat fields for value injection into the
 * final_attack_additional_rate branch.
 *
 * This module does NOT invent stat values. It only bridges known OHAI player
 * stat fields to the official formula leaf names when the tag-table resolver
 * produces a matching resolved attribute name.
 *
 * Confidence levels are preserved from the tag-table layer. LOW confidence
 * mappings inject values but always emit warnings.
 *
 * Do not add bridge entries without evidence linking the official attribute
 * name to the OHAI stat field.
 */

import type { StatKey } from "../schemas/buildGoalSchema";

export interface OfficialResolvedStatBridgeEntry {
  leafName: string;
  suffix: string;
  statKey: StatKey;
  confidence: "high" | "medium" | "low";
  evidence: readonly string[];
  notes?: string;
}

export interface BridgeInjectionResult {
  leafName: string;
  value: number;
  confidence: "high" | "medium" | "low";
  resolvedAttrName: string;
  statKey: string;
  warnings: string[];
}

export interface BridgeInjectionReport {
  injections: Record<string, number>;
  results: BridgeInjectionResult[];
  warnings: string[];
  unresolvedLeaves: string[];
}

const BRIDGE_ENTRIES: readonly OfficialResolvedStatBridgeEntry[] = [
  // ── attack_type_dam_add_rate ──
  {
    leafName: "attack_type_dam_add_rate",
    suffix: "melee",
    statKey: "meleeDMGBonus",
    confidence: "high",
    evidence: [
      "force_attack_utility.py:203 confirms attack_type_dam_add_rate_melee",
      "FormulaAttackType.Melee = 1 → suffix 'melee'",
      "OHAI meleeDMGBonus is the player stat for melee damage percent bonus",
    ],
  },
  // ── element_type_dam_add_rate ──
  {
    leafName: "element_type_dam_add_rate",
    suffix: "fire",
    statKey: "elementalDMGBonus",
    confidence: "high",
    evidence: [
      "deviation_const.py:186 element_type_dam_add_rate_fire",
      "OHAI elementalDMGBonus is the player stat bucket for elemental damage percent bonus",
    ],
    notes: "Game has per-element attrs; OHAI elementalDMGBonus is a single shared bucket — may overcount if multiple element bonuses exist",
  },
  {
    leafName: "element_type_dam_add_rate",
    suffix: "ice",
    statKey: "elementalDMGBonus",
    confidence: "high",
    evidence: [
      "deviation_const.py:186 element_type_dam_add_rate_ice",
      "OHAI elementalDMGBonus is the player stat bucket for elemental damage percent bonus",
    ],
    notes: "Game has per-element attrs; OHAI elementalDMGBonus is a single shared bucket",
  },
  {
    leafName: "element_type_dam_add_rate",
    suffix: "lightning",
    statKey: "elementalDMGBonus",
    confidence: "high",
    evidence: [
      "deviation_const.py:186 element_type_dam_add_rate_lightning",
      "OHAI elementalDMGBonus is the player stat bucket for elemental damage percent bonus",
    ],
    notes: "Game has per-element attrs; OHAI elementalDMGBonus is a single shared bucket",
  },
  {
    leafName: "element_type_dam_add_rate",
    suffix: "physics",
    statKey: "weaponDMGBonus",
    confidence: "medium",
    evidence: [
      "deviation_const.py:188 element_type_dam_add_rate_physics",
      "OHAI weaponDMGBonus is the closest player stat for physical damage percent bonus",
    ],
    notes: "Physics element may overlap with weapon_attack_add_rate — double-counting risk",
  },
  // ── keyword_proc_dam_add_rate (HIGH confidence — from char_property_data) ──
  {
    leafName: "keyword_proc_dam_add_rate",
    suffix: "scorch",
    statKey: "burnDMGBonus",
    confidence: "high",
    evidence: [
      "char_property_data.pyc: keyword_proc_dam_add_rate_scorch confirmed from bindict extraction",
      "CompFormulaAdapter.py:657-660 keyword_proc_dam_add_rate resolved via get_keyword_attr_name_by_tag",
      "OHAI burnDMGBonus is the player stat for SCORCH keyword damage percent bonus",
    ],
  },
  {
    leafName: "keyword_proc_dam_add_rate",
    suffix: "vortex",
    statKey: "frostVortexDMGBonus",
    confidence: "high",
    evidence: [
      "char_property_data.pyc: keyword_proc_dam_add_rate_vortex confirmed from bindict extraction",
      "CompFormulaAdapter.py:657-660 keyword_proc_dam_add_rate resolved via get_keyword_attr_name_by_tag",
      "OHAI frostVortexDMGBonus is the player stat for VORTEX keyword damage percent bonus",
    ],
  },
  {
    leafName: "keyword_proc_dam_add_rate",
    suffix: "surge",
    statKey: "powerSurgeDMGBonus",
    confidence: "high",
    evidence: [
      "char_property_data.pyc: keyword_proc_dam_add_rate_surge confirmed from bindict extraction",
      "CompFormulaAdapter.py:657-660 keyword_proc_dam_add_rate resolved via get_keyword_attr_name_by_tag",
      "OHAI powerSurgeDMGBonus is the player stat for SURGE keyword damage percent bonus",
    ],
  },
  {
    leafName: "keyword_proc_dam_add_rate",
    suffix: "blast",
    statKey: "unstableBomberDMGBonus",
    confidence: "high",
    evidence: [
      "char_property_data.pyc: keyword_proc_dam_add_rate_blast confirmed from bindict extraction",
      "CompFormulaAdapter.py:657-660 keyword_proc_dam_add_rate resolved via get_keyword_attr_name_by_tag",
      "OHAI unstableBomberDMGBonus is the player stat for BLAST keyword damage percent bonus",
    ],
  },
  {
    leafName: "keyword_proc_dam_add_rate",
    suffix: "shrap",
    statKey: "shrapnelDMGBonus",
    confidence: "high",
    evidence: [
      "char_property_data.pyc: keyword_proc_dam_add_rate_shrap confirmed from bindict extraction",
      "OHAI shrapnelDMGBonus is the player stat for SHRAP keyword damage percent bonus",
    ],
  },
  {
    leafName: "keyword_proc_dam_add_rate",
    suffix: "proj",
    statKey: "bounceDMGBonus",
    confidence: "high",
    evidence: [
      "char_property_data.pyc: keyword_proc_dam_add_rate_proj confirmed from bindict extraction",
      "Corpus mining: BUFF_KEYWORD_PROJ = Bounce keyword",
      "OHAI bounceDMGBonus is the player stat for PROJ keyword damage percent bonus",
    ],
  },
];

const BRIDGE_MAP = new Map<string, OfficialResolvedStatBridgeEntry>(
  BRIDGE_ENTRIES.map((e) => [`${e.leafName}_${e.suffix}`, e])
);

export function getAllBridgeEntries(): readonly OfficialResolvedStatBridgeEntry[] {
  return BRIDGE_ENTRIES;
}

export function getBridgeEntry(resolvedAttrName: string): OfficialResolvedStatBridgeEntry | undefined {
  return BRIDGE_MAP.get(resolvedAttrName);
}

/**
 * Resolve bridge injections for a set of resolved attribute names.
 *
 * For each resolved attr name, looks up the bridge entry and extracts the
 * corresponding value from the player stat record. If no value exists, the leaf
 * stays at 0 with a warning.
 */
export function resolveBridgeInjections(
  resolvedAttrNames: Record<string, string>,
  playerStats: Partial<Record<StatKey, number>> | null,
): BridgeInjectionReport {
  const injections: Record<string, number> = {};
  const results: BridgeInjectionResult[] = [];
  const warnings: string[] = [];
  const unresolvedLeaves: string[] = [];

  for (const [leafName, attrName] of Object.entries(resolvedAttrNames)) {
    const entry = BRIDGE_MAP.get(attrName);
    if (!entry) {
      unresolvedLeaves.push(leafName);
      warnings.push(
        `${leafName}: resolved to "${attrName}" but no bridge mapping exists — leaf stays at 0`
      );
      continue;
    }

    const value = playerStats ? (playerStats[entry.statKey] ?? 0) : 0;
    const entryWarnings: string[] = [];

    if (entry.confidence === "low") {
      entryWarnings.push(
        `${leafName}: bridge confidence is LOW (${entry.statKey} → ${attrName}) — keyword/gun tag data not recovered`
      );
    }

    if (entry.notes) {
      entryWarnings.push(`${leafName}: ${entry.notes}`);
    }

    if (value === 0 && playerStats) {
      entryWarnings.push(
        `${leafName}: ${entry.statKey} is 0 or absent — leaf stays at 0`
      );
    }

    if (!playerStats) {
      entryWarnings.push(`${leafName}: no player stats available — leaf stays at 0`);
    }

    injections[leafName] = value;
    results.push({
      leafName,
      value,
      confidence: entry.confidence,
      resolvedAttrName: attrName,
      statKey: entry.statKey,
      warnings: entryWarnings,
    });
    warnings.push(...entryWarnings);
  }

  return { injections, results, warnings, unresolvedLeaves };
}

/**
 * Check which of the four additional-rate tag-resolved leaves have no
 * bridge mapping for a given set of resolved attr names.
 */
export function getUnmappedBridgeLeaves(
  resolvedAttrNames: Record<string, string>,
): string[] {
  const unmapped: string[] = [];
  for (const [leafName, attrName] of Object.entries(resolvedAttrNames)) {
    if (!BRIDGE_MAP.has(attrName)) {
      unmapped.push(leafName);
    }
  }
  return unmapped;
}
