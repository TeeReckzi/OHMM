/**
 * Official formula tag-table resolver mappings.
 *
 * These tables recover the tag→suffix mappings used by the Neox formula engine
 * to resolve dynamic attribute names at runtime. Each resolver function in the
 * game code follows the pattern:
 *
 *   attr_name = get_{tag}_attr_name_by_tag(parent_attr_key, tag_value)
 *   => "{parent_attr_key}_{suffix}"
 *
 * Confidence levels:
 *   HIGH:   Direct evidence from extracted game code (formula_const.py, deviation_const.py,
 *           force_attack_utility.py, AffixUtils.py, CompFormulaAdapter.py)
 *   MEDIUM: Strong inference from naming patterns + partial evidence
 *   LOW:    Pattern known but specific suffixes not recovered from extracted data
 */

export interface TagTableEntry {
  tag: string | number;
  suffix: string;
  confidence: "high" | "medium" | "low";
  evidence: readonly string[];
}

export interface TagTable {
  resolverName: string;
  entries: readonly TagTableEntry[];
  confidence: "high" | "medium" | "low";
  evidence: readonly string[];
}

// ─── Attack Type Tag Table ────────────────────────────────────────────────────

export const ATTACK_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_attack_type_attr_name_by_tag",
  confidence: "high",
  evidence: [
    "formula_const.py FormulaAttackType enum: Default=0, Melee=1, Remote=2, Bomb=3, Dot=4, Skill=5, Item=6, Facility=7",
    "force_attack_utility.py:203 confirms attack_type_dam_add_rate_melee",
    "CompFormulaAdapter.py:623-630 attack_type_crit_enable resolution via FormulaAttackType name",
    "CompFormulaAdapter.py:783 base_attr_name = get_attack_type_attr_name_by_tag('attack_type_dam_add_rate')",
  ],
  entries: [
    { tag: 0, suffix: "default", confidence: "high", evidence: ["FormulaAttackType.Default = 0"] },
    { tag: 1, suffix: "melee", confidence: "high", evidence: ["FormulaAttackType.Melee = 1", "force_attack_utility.py:203 attack_type_dam_add_rate_melee"] },
    { tag: 2, suffix: "remote", confidence: "high", evidence: ["FormulaAttackType.Remote = 2"] },
    { tag: 3, suffix: "bomb", confidence: "high", evidence: ["FormulaAttackType.Bomb = 3"] },
    { tag: 4, suffix: "dot", confidence: "high", evidence: ["FormulaAttackType.Dot = 4"] },
    { tag: 5, suffix: "skill", confidence: "high", evidence: ["FormulaAttackType.Skill = 5"] },
    { tag: 6, suffix: "item", confidence: "high", evidence: ["FormulaAttackType.Item = 6"] },
    { tag: 7, suffix: "facility", confidence: "high", evidence: ["FormulaAttackType.Facility = 7", "ATTACK_TYPE_INDEX_ATTR_NAME = 'facility'"] },
  ],
};

// ─── Element Type Tag Table ───────────────────────────────────────────────────

export const ELEMENT_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_element_attr_name_by_tag",
  confidence: "high",
  evidence: [
    "AffixUtils.py:195-197 get_element_attr_name_by_tag reads element_type_data[tag].suffix_element_name",
    "deviation_const.py:186 ELEMENT_DAM_ADD_RATE_ATTRS = ('element_type_dam_add_rate_fire', 'element_type_dam_add_rate_ice', 'element_type_dam_add_rate_lightning')",
    "deviation_const.py:188 DEVIATION_RACE_ATTR_NAMES includes element_type_dam_add_rate_physics, element_type_dam_add_rate_element",
    "mobile element_type_data.pyc: 11 suffix_element_name values confirmed from bindict extraction",
  ],
  entries: [
    { tag: 0, suffix: "physics", confidence: "high", evidence: ["ElementType.PHYSICS = 0", "element_type_data suffix 'physics'"] },
    { tag: 1, suffix: "fire", confidence: "high", evidence: ["ElementType.FIRE = 1", "deviation_const.py:186 element_type_dam_add_rate_fire"] },
    { tag: 2, suffix: "ice", confidence: "high", evidence: ["ElementType.ICE = 2", "deviation_const.py:186 element_type_dam_add_rate_ice"] },
    { tag: 3, suffix: "lightning", confidence: "high", evidence: ["ElementType.LIGHTNING = 3", "deviation_const.py:186 element_type_dam_add_rate_lightning"] },
    { tag: 4, suffix: "machine", confidence: "high", evidence: ["ElementType.MACHINE = 4", "element_type_data suffix 'machine'"] },
    { tag: 5, suffix: "carrier", confidence: "high", evidence: ["ElementType.CARRIER = 5", "element_type_data suffix 'carrier'"] },
    { tag: 6, suffix: "explode", confidence: "high", evidence: ["ElementType.EXPLODE = 6", "element_type_data suffix 'explode'"] },
    { tag: 7, suffix: "penetration", confidence: "high", evidence: ["ElementType.PENETRATION = 7", "element_type_data suffix 'penetration'"] },
    { tag: 8, suffix: "impact", confidence: "high", evidence: ["ElementType.IMPACT = 8", "element_type_data suffix 'impact'"] },
    { tag: 9, suffix: "suppression", confidence: "high", evidence: ["ElementType.SUPPRESSION = 9", "element_type_data suffix 'suppression'"] },
    { tag: 10, suffix: "stun", confidence: "high", evidence: ["ElementType.STUN = 10", "element_type_data suffix 'stun'"] },
    { tag: "fire", suffix: "fire", confidence: "high", evidence: ["String alias for tag 1"] },
    { tag: "ice", suffix: "ice", confidence: "high", evidence: ["String alias for tag 2"] },
    { tag: "lightning", suffix: "lightning", confidence: "high", evidence: ["String alias for tag 3"] },
    { tag: "physics", suffix: "physics", confidence: "high", evidence: ["String alias for tag 0", "deviation_const.py:188"] },
    { tag: "blaze", suffix: "fire", confidence: "high", evidence: ["OHAI Blaze element maps to game fire suffix"] },
    { tag: "frost", suffix: "ice", confidence: "high", evidence: ["OHAI Frost element maps to game ice suffix"] },
    { tag: "shock", suffix: "lightning", confidence: "high", evidence: ["OHAI Shock element maps to game lightning suffix"] },
    { tag: "physical", suffix: "physics", confidence: "high", evidence: ["OHAI physical maps to game physics suffix"] },
  ],
};

// ─── Keyword Type Tag Table ───────────────────────────────────────────────────

export const KEYWORD_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_keyword_attr_name_by_tag",
  confidence: "high",
  evidence: [
    "CompFormulaAdapter.py:645-660 keyword_proc_* resolution via get_keyword_attr_name_by_tag(keyword_type)",
    "formula_const.py:80 TLNRAD_KEYWORD_PART lists keyword_proc_* leaf names",
    "mobile char_property_data.pyc: keyword_proc suffixes confirmed from bindict extraction (2623 strings)",
    "Game uses direct keyword names: scorch, surge, vortex, blast, shrap, proj, bleeding, armed, draw, mark",
  ],
  entries: [
    { tag: "SCORCH", suffix: "scorch", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_scorch"] },
    { tag: "VORTEX", suffix: "vortex", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_vortex"] },
    { tag: "SURGE", suffix: "surge", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_surge"] },
    { tag: "BLAST", suffix: "blast", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_blast"] },
    { tag: "SHRAP", suffix: "shrap", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_shrap"] },
    { tag: "PROJ", suffix: "proj", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_proj"] },
    { tag: "BLEEDING", suffix: "bleeding", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_bleeding"] },
    { tag: "ARMED", suffix: "armed", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_armed"] },
    { tag: "DRAW", suffix: "draw", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_draw"] },
    { tag: "MARK", suffix: "mark", confidence: "high", evidence: ["char_property_data: keyword_proc_dam_add_rate_mark"] },
  ],
};

// ─── Gun Type Tag Table ───────────────────────────────────────────────────────

export const GUN_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_gun_type_attr_name_by_tag",
  confidence: "low",
  evidence: [
    "formula_const.py:75 lists element_type_dam_add_rate in ATTACKER_NEED_ALL_SUB_ATTR_NODE but gun_type entries not found",
    "CompFormulaAdapter.py does not contain a get_gun_type_dam_add_rate getter in extracted code",
    "gun_type_data table not recovered from extracted data — no suffixes confirmed",
  ],
  entries: [],
};

// ─── Species Type Tag Table ──────────────────────────────────────────────────

export const SPECIES_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_species_dam_add_rate",
  confidence: "high",
  evidence: [
    "unit_const.py:170-181 UnitSpeciesType enum: Default=0, Ascender=1, Alters=2, Rosetta=3, Vulcher=4, Creatures=5, Machina=6, Master=7, Deviation=8",
    "CompFormulaAdapter.py:826-832 get_species_dam_add_rate reads target unit_species → UNIT_SPECIES_TYPE_INDEX_TYPE_NAME → suffix",
    "mobile combat_prototype_data.pyc: unit_species field confirmed in bindict extraction",
  ],
  entries: [
    { tag: 0, suffix: "default", confidence: "high", evidence: ["UnitSpeciesType.Default = 0"] },
    { tag: 1, suffix: "ascender", confidence: "high", evidence: ["UnitSpeciesType.Ascender = 1"] },
    { tag: 2, suffix: "alters", confidence: "high", evidence: ["UnitSpeciesType.Alters = 2"] },
    { tag: 3, suffix: "rosetta", confidence: "high", evidence: ["UnitSpeciesType.Rosetta = 3"] },
    { tag: 4, suffix: "vulcher", confidence: "high", evidence: ["UnitSpeciesType.Vulcher = 4"] },
    { tag: 5, suffix: "creatures", confidence: "high", evidence: ["UnitSpeciesType.Creatures = 5"] },
    { tag: 6, suffix: "machina", confidence: "high", evidence: ["UnitSpeciesType.Machina = 6"] },
    { tag: 7, suffix: "master", confidence: "high", evidence: ["UnitSpeciesType.Master = 7"] },
    { tag: 8, suffix: "deviation", confidence: "high", evidence: ["UnitSpeciesType.Deviation = 8"] },
    { tag: "default", suffix: "default", confidence: "high", evidence: ["String alias for tag 0"] },
    { tag: "ascender", suffix: "ascender", confidence: "high", evidence: ["String alias for tag 1"] },
    { tag: "alters", suffix: "alters", confidence: "high", evidence: ["String alias for tag 2"] },
    { tag: "rosetta", suffix: "rosetta", confidence: "high", evidence: ["String alias for tag 3"] },
    { tag: "vulcher", suffix: "vulcher", confidence: "high", evidence: ["String alias for tag 4"] },
    { tag: "creatures", suffix: "creatures", confidence: "high", evidence: ["String alias for tag 5"] },
    { tag: "machina", suffix: "machina", confidence: "high", evidence: ["String alias for tag 6"] },
    { tag: "master", suffix: "master", confidence: "high", evidence: ["String alias for tag 7"] },
    { tag: "deviation", suffix: "deviation", confidence: "high", evidence: ["String alias for tag 8"] },
  ],
};

// ─── Debuff Type Tag Table ───────────────────────────────────────────────────

export const DEBUFF_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_debuff_attr_name_by_tag",
  confidence: "high",
  evidence: [
    "AffixUtils.py:190-192 get_debuff_attr_name_by_tag reads buff_tag_data[tag].suffix_debuff_name",
    "mobile buff_tag_data.pyc: 18 suffix_debuff_name values confirmed from bindict extraction",
    "CompFormulaAdapter.py:615-616, 707-714 debuff_type_dam_add_rate resolution via buff tags",
  ],
  entries: [
    { tag: "vortex", suffix: "vortex", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'vortex'"] },
    { tag: "scorch", suffix: "scorch", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'scorch'"] },
    { tag: "surge", suffix: "surge", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'surge'"] },
    { tag: "bleeding", suffix: "bleeding", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'bleeding'"] },
    { tag: "mark", suffix: "mark", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'mark'"] },
    { tag: "proj", suffix: "proj", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'proj'"] },
    { tag: "shrap", suffix: "shrap", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'shrap'"] },
    { tag: "blast", suffix: "blast", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'blast'"] },
    { tag: "armed", suffix: "armed", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'armed'"] },
    { tag: "frozen", suffix: "frozen", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'frozen'"] },
    { tag: "fire", suffix: "fire", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'fire'"] },
    { tag: "electric", suffix: "electric", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'electric'"] },
    { tag: "wet", suffix: "wet", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'wet'"] },
    { tag: "cut", suffix: "cut", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'cut'"] },
    { tag: "blunt", suffix: "blunt", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'blunt'"] },
    { tag: "freeze", suffix: "freeze", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'freeze'"] },
    { tag: "echo", suffix: "echo", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'echo'"] },
    { tag: "quick_draw", suffix: "quick_draw", confidence: "high", evidence: ["buff_tag_data.suffix_debuff_name = 'quick_draw'"] },
  ],
};

// ─── Armor Type Tag Table ────────────────────────────────────────────────────

export const ARMOR_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_armor_type_attr_name_by_tag",
  confidence: "high",
  evidence: [
    "mobile armor_type_data.pyc: 8 suffix_armor_name values confirmed from bindict extraction",
    "AffixUtils.py armor type suffix pattern matches element/debuff tag resolution",
  ],
  entries: [
    { tag: "physics", suffix: "physics", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'physics'"] },
    { tag: "organic", suffix: "organic", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'organic'"] },
    { tag: "infested", suffix: "infested", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'infested'"] },
    { tag: "rosetta", suffix: "rosetta", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'rosetta'"] },
    { tag: "machine", suffix: "machine", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'machine'"] },
    { tag: "carrier", suffix: "carrier", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'carrier'"] },
    { tag: "building", suffix: "building", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'building'"] },
    { tag: "special", suffix: "special", confidence: "high", evidence: ["armor_type_data.suffix_armor_name = 'special'"] },
  ],
};

// ─── Melee Type Tag Table ────────────────────────────────────────────────────

export const MELEE_TYPE_TAG_TABLE: TagTable = {
  resolverName: "get_melee_type_attr_name_by_tag",
  confidence: "high",
  evidence: [
    "mobile char_property_data.pyc: melee_type suffixes confirmed from bindict extraction",
    "Game uses: combo, heavy, dash, backstab for melee attack type bonuses",
  ],
  entries: [
    { tag: "combo", suffix: "combo", confidence: "high", evidence: ["char_property_data: melee_type_dam_add_rate_combo"] },
    { tag: "heavy", suffix: "heavy", confidence: "high", evidence: ["char_property_data: melee_type_dam_add_rate_heavy"] },
    { tag: "dash", suffix: "dash", confidence: "high", evidence: ["char_property_data: melee_type_dam_add_rate_dash"] },
    { tag: "backstab", suffix: "backstab", confidence: "high", evidence: ["char_property_data: melee_type_dam_add_rate_backstab"] },
  ],
};

// ─── Resolver Functions ───────────────────────────────────────────────────────

export interface TagResolutionResult {
  resolved: boolean;
  attrName?: string;
  suffix?: string;
  confidence: "high" | "medium" | "low";
  missingReason?: string;
}

export function resolveTagToAttrName(
  table: TagTable,
  parentAttrKey: string,
  tag: string | number
): TagResolutionResult {
  const entry = table.entries.find((e) => e.tag === tag || String(e.tag).toLowerCase() === String(tag).toLowerCase());
  if (entry) {
    return {
      resolved: true,
      attrName: `${parentAttrKey}_${entry.suffix}`,
      suffix: entry.suffix,
      confidence: entry.confidence,
    };
  }
  return {
    resolved: false,
    confidence: "low",
    missingReason: `tag "${String(tag)}" not found in ${table.resolverName} table (${table.confidence} confidence)`,
  };
}

export function resolveAttackTypeTag(parentAttrKey: string, formulaAttackType: number): TagResolutionResult {
  return resolveTagToAttrName(ATTACK_TYPE_TAG_TABLE, parentAttrKey, formulaAttackType);
}

export function resolveElementTypeTag(parentAttrKey: string, elementType: string | number): TagResolutionResult {
  return resolveTagToAttrName(ELEMENT_TYPE_TAG_TABLE, parentAttrKey, elementType);
}

export function resolveKeywordTypeTag(parentAttrKey: string, keywordType: string | number): TagResolutionResult {
  return resolveTagToAttrName(KEYWORD_TYPE_TAG_TABLE, parentAttrKey, keywordType);
}

export function resolveGunTypeTag(parentAttrKey: string, gunType: string | number): TagResolutionResult {
  return resolveTagToAttrName(GUN_TYPE_TAG_TABLE, parentAttrKey, gunType);
}

export function resolveSpeciesTypeTag(parentAttrKey: string, speciesType: string | number): TagResolutionResult {
  return resolveTagToAttrName(SPECIES_TYPE_TAG_TABLE, parentAttrKey, speciesType);
}

export function resolveDebuffTypeTag(parentAttrKey: string, debuffType: string | number): TagResolutionResult {
  return resolveTagToAttrName(DEBUFF_TYPE_TAG_TABLE, parentAttrKey, debuffType);
}

export function resolveArmorTypeTag(parentAttrKey: string, armorType: string | number): TagResolutionResult {
  return resolveTagToAttrName(ARMOR_TYPE_TAG_TABLE, parentAttrKey, armorType);
}

export function resolveMeleeTypeTag(parentAttrKey: string, meleeType: string | number): TagResolutionResult {
  return resolveTagToAttrName(MELEE_TYPE_TAG_TABLE, parentAttrKey, meleeType);
}

export function getDamageFormulaBranchToFormulaAttackType(branchSelector: number): number | undefined {
  switch (branchSelector) {
    case 1: return 1;
    case 2: return 4;
    case 3: return 5;
    case 4: return 6;
    case 8: return 2;
    default: return undefined;
  }
}

export function getAllTagTableEntries(): readonly { table: TagTable; entry: TagTableEntry }[] {
  const result: { table: TagTable; entry: TagTableEntry }[] = [];
  for (const table of [ATTACK_TYPE_TAG_TABLE, ELEMENT_TYPE_TAG_TABLE, KEYWORD_TYPE_TAG_TABLE, GUN_TYPE_TAG_TABLE, SPECIES_TYPE_TAG_TABLE, DEBUFF_TYPE_TAG_TABLE, ARMOR_TYPE_TAG_TABLE, MELEE_TYPE_TAG_TABLE]) {
    for (const entry of table.entries) {
      result.push({ table, entry });
    }
  }
  return result;
}
