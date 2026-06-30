/**
 * Official Once Human formula graph metadata recovered from Neox formula data.
 *
 * This module intentionally preserves raw recovered names separately from OHAI-friendly aliases.
 * Do not collapse these targets into generic damage names — target keys are scoped by formula tree.
 */

export const FORMULA_TREE_NAMES = {
  DAMAGE: "damage_formula",
  CURE: "cure_formula",
  BUILDING_DAMAGE: "building_damage_formula",
  VEHICLE_DAMAGE: "vehicle_damage_formula",
} as const;

export type OfficialFormulaTreeName = typeof FORMULA_TREE_NAMES[keyof typeof FORMULA_TREE_NAMES];

export const FORMULA_TARGETS = {
  FINAL_ATTACK: "final_attack",
  FINAL_TREAT: "final_treat",
  FINAL_DAMAGE: "final_damage",
} as const;

export type OfficialFormulaTargetName = typeof FORMULA_TARGETS[keyof typeof FORMULA_TARGETS];

export interface FormulaTargetBinding {
  treeName: OfficialFormulaTreeName;
  targetName: OfficialFormulaTargetName;
  soulId: number;
  canonicalOhaiKey: "finalDamage" | "finalHealing" | "finalBuildingDamage" | "finalVehicleDamage";
  meaning: string;
  confidence: "high" | "medium" | "low";
  evidence: readonly string[];
}

export const FORMULA_TARGET_BINDINGS: readonly FormulaTargetBinding[] = [
  {
    treeName: FORMULA_TREE_NAMES.DAMAGE,
    targetName: FORMULA_TARGETS.FINAL_ATTACK,
    soulId: 331,
    canonicalOhaiKey: "finalDamage",
    meaning: "Terminal character/combat damage output from damage_formula.",
    confidence: "high",
    evidence: [
      "damage_formula terminal output final_attack",
      "final_attack soul_id 331",
      "formula: max(base_attack * final_attack_additional_rate * final_attack_ignore_dam_rate * final_special_regulate_factor, 0)",
    ],
  },
  {
    treeName: FORMULA_TREE_NAMES.CURE,
    targetName: FORMULA_TARGETS.FINAL_TREAT,
    soulId: 11,
    canonicalOhaiKey: "finalHealing",
    meaning: "Terminal healing/treatment output from cure_formula.",
    confidence: "high",
    evidence: ["cure_formula terminal output final_treat", "final_treat soul_id 11"],
  },
  {
    treeName: FORMULA_TREE_NAMES.BUILDING_DAMAGE,
    targetName: FORMULA_TARGETS.FINAL_DAMAGE,
    soulId: 21,
    canonicalOhaiKey: "finalBuildingDamage",
    meaning: "Terminal player-built structure damage output from building_damage_formula.",
    confidence: "high",
    evidence: ["building_damage_formula terminal output final_damage", "final_damage soul_id 21"],
  },
  {
    treeName: FORMULA_TREE_NAMES.VEHICLE_DAMAGE,
    targetName: FORMULA_TARGETS.FINAL_DAMAGE,
    soulId: 13,
    canonicalOhaiKey: "finalVehicleDamage",
    meaning: "Terminal vehicle damage output from vehicle_damage_formula.",
    confidence: "high",
    evidence: ["vehicle_damage_formula terminal output final_damage", "final_damage soul_id 13"],
  },
] as const;

export function getFormulaTargetBinding(
  treeName: OfficialFormulaTreeName,
  targetName: OfficialFormulaTargetName,
): FormulaTargetBinding | undefined {
  return FORMULA_TARGET_BINDINGS.find((binding) => binding.treeName === treeName && binding.targetName === targetName);
}

export function getPrimaryFormulaTargetBinding(treeName: OfficialFormulaTreeName): FormulaTargetBinding {
  const binding = FORMULA_TARGET_BINDINGS.find((candidate) => candidate.treeName === treeName);
  if (!binding) {
    throw new Error(`No recovered terminal target binding for formula tree: ${treeName}`);
  }
  return binding;
}

/**
 * formula_const enum values. These are preserved even though damage_formula uses a different branch selector.
 */
export const FORMULA_ATTACK_TYPE_ENUM = {
  DEFAULT: 0,
  MELEE: 1,
  REMOTE: 2,
  BOMB: 3,
  DOT: 4,
  SKILL: 5,
  ITEM: 6,
  FACILITY: 7,
} as const;

/**
 * Recovered damage_formula branch selector values from graph comparisons.
 * Important footgun: remote is encoded as 8 in the damage graph branch, not 2.
 */
export const DAMAGE_FORMULA_BRANCH_SELECTOR = {
  MELEE: 1,
  BUFF: 2,
  SKILL: 3,
  ITEM: 4,
  REMOTE: 8,
} as const;

export type RuntimeFormulaAttackAlias =
  | "normal"
  | "melee"
  | "remote"
  | "buff"
  | "bomb"
  | "dot"
  | "skill"
  | "item"
  | "building"
  | "facility"
  | "unknown";

export function mapRuntimeAttackTypeToDamageFormulaBranch(alias: RuntimeFormulaAttackAlias): number {
  switch (alias) {
    case "melee":
      return DAMAGE_FORMULA_BRANCH_SELECTOR.MELEE;
    case "buff":
    case "dot":
      return DAMAGE_FORMULA_BRANCH_SELECTOR.BUFF;
    case "skill":
    case "bomb":
      return DAMAGE_FORMULA_BRANCH_SELECTOR.SKILL;
    case "item":
      return DAMAGE_FORMULA_BRANCH_SELECTOR.ITEM;
    case "normal":
    case "remote":
      return DAMAGE_FORMULA_BRANCH_SELECTOR.REMOTE;
    case "building":
    case "facility":
      return FORMULA_ATTACK_TYPE_ENUM.FACILITY;
    case "unknown":
    default:
      return FORMULA_ATTACK_TYPE_ENUM.DEFAULT;
  }
}

export const FORMULA_DATA_TYPES = {
  ATTACKER: 1,
  TARGET: 2,
  SKILL: 3,
  BUFF: 4,
  EXTRA: 5,
} as const;

export type FormulaLeafCategory =
  | "attacker"
  | "target"
  | "skill"
  | "buff"
  | "extra"
  | "default"
  | "unknown";

export type FormulaLeafMode = "direct" | "dynamic" | "default" | "context-selector";

export interface FormulaLeafBinding {
  leafName: string;
  category: FormulaLeafCategory;
  mode: FormulaLeafMode;
  likelyMeaning: string;
  validValues?: Readonly<Record<string, string | number>>;
  resolvedBy?: string;
  dependsOnLeaves?: readonly string[];
  defaultValue?: number;
  needsAllSubAttr?: boolean;
  confidence: "high" | "medium" | "low";
  evidence: readonly string[];
}

export const CONTEXT_SELECTOR_LEAVES: readonly FormulaLeafBinding[] = [
  {
    leafName: "formula_attack_type",
    category: "skill",
    mode: "context-selector",
    likelyMeaning: "Damage formula branch selector. OHAI should map friendly aliases to recovered numeric branch codes before injection.",
    validValues: { melee: 1, buff: 2, skill: 3, item: 4, remote: 8 },
    confidence: "high",
    evidence: ["damage_formula base_attack_type comparisons", "formula_const leaf formula_attack_type"],
  },
  {
    leafName: "sub_melee_attack_type",
    category: "skill",
    mode: "context-selector",
    likelyMeaning: "Melee subtype selector for combo/heavy/dash/backstab attribute resolution.",
    validValues: { Any: 0, Combo: 1, Heavy: 2, Dash: 3, Backstab: 4 },
    confidence: "high",
    evidence: ["SubMeleeAttackType enum", "melee_type_* resolver args"],
  },
  {
    leafName: "keyword_type",
    category: "skill",
    mode: "context-selector",
    likelyMeaning: "Keyword/proc type selector for keyword_proc_* leaves such as Burn, Power Surge, Frost Vortex, or Unstable Bomber.",
    confidence: "high",
    evidence: ["keyword_proc_* leaves resolved by get_keyword_attr_name_by_tag(keyword_type)"],
  },
  {
    leafName: "damage_feature_type",
    category: "skill",
    mode: "context-selector",
    likelyMeaning: "Physical damage feature selector for tag-melee Cut/Blunt style lookups.",
    validValues: { NO_RESET: -1, NONE: 0, Cut: 1, Blunt: 2, ANY: 99 },
    confidence: "high",
    evidence: ["DamageFeatureType enum", "tag_melee_* resolver args"],
  },
  {
    leafName: "element_type",
    category: "skill",
    mode: "context-selector",
    likelyMeaning: "Element selector for element damage, duration damage, skill damage, and structure material rates.",
    confidence: "high",
    evidence: ["element_type_* leaves", "element_type_index_struct_type_dam_rate args"],
  },
  {
    leafName: "gun_type",
    category: "attacker",
    mode: "context-selector",
    likelyMeaning: "Gun/weapon type selector for gun_type_* leaves.",
    confidence: "high",
    evidence: ["gun_type_dam_add_rate resolver", "gun_type_ignore_dam_rate resolver"],
  },
  {
    leafName: "damage_material_type",
    category: "extra",
    mode: "context-selector",
    likelyMeaning: "Structure material selector used by element_type_index_struct_type_dam_rate.",
    confidence: "high",
    evidence: ["element_type_index_struct_type_dam_rate(element_type, damage_material_type)"],
  },
  {
    leafName: "attacker_all_debuff_state",
    category: "attacker",
    mode: "context-selector",
    likelyMeaning: "Debuff-state selector for while_debuff_type_* attacker leaves.",
    confidence: "high",
    evidence: ["while_debuff_type_* leaves resolved by attacker_all_debuff_state"],
  },
];

export const DEFAULT_FORMULA_LEAVES: readonly FormulaLeafBinding[] = [
  { leafName: "skill_rate", category: "skill", mode: "default", defaultValue: 1, likelyMeaning: "Skill damage rate multiplier.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL"] },
  { leafName: "dis_dam_rate", category: "skill", mode: "default", defaultValue: 1, likelyMeaning: "Distance damage rate / range falloff multiplier.", confidence: "medium", evidence: ["LEAF_NODE_DEFAULT_VAL"] },
  { leafName: "cure_add_rate", category: "skill", mode: "default", defaultValue: 1, likelyMeaning: "Healing/cure add rate.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL"] },
  { leafName: "use_final_ignore_dam_rate", category: "extra", mode: "default", defaultValue: 1, likelyMeaning: "Gate for final ignore-damage layer.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL", "damage_formula final_attack_ignore_dam_rate"] },
  { leafName: "use_final_dam_add_rate", category: "extra", mode: "default", defaultValue: 1, likelyMeaning: "Gate for final damage-add layer.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL", "damage_formula final_attack_additional_rate"] },
  { leafName: "pvp_adjust_factor", category: "extra", mode: "default", defaultValue: 1, likelyMeaning: "PvP weapon-tier vs armor-tier adjustment factor. Default 1 in PvE.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL", "target resolver get_pvp_adjust_factor"] },
  { leafName: "special_regulate_factor", category: "extra", mode: "default", defaultValue: 1, likelyMeaning: "Special regulate factor for PvP and element-vs-special-target cases.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL", "damage_formula final_special_regulate_factor"] },
  { leafName: "attack_type_crit_enable", category: "attacker", mode: "default", defaultValue: 1, likelyMeaning: "Gate controlling whether current attack type can crit.", confidence: "high", evidence: ["LEAF_NODE_DEFAULT_VAL", "ATTACKER_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "dam_effect_rate", category: "extra", mode: "default", defaultValue: 1, likelyMeaning: "Damage effect rate. Exact semantics require more validation.", confidence: "low", evidence: ["LEAF_NODE_DEFAULT_VAL"] },
  { leafName: "crit_random_speed_factor", category: "extra", mode: "default", defaultValue: 0.8, likelyMeaning: "PRD speed factor for critical hits.", confidence: "high", evidence: ["global_params_data fallback 0.8", "crit_random_speed_factor generated key"] },
  { leafName: "anomaly_random_speed_factor", category: "extra", mode: "default", defaultValue: 0.8, likelyMeaning: "PRD speed factor for anomaly/status proc checks.", confidence: "high", evidence: ["global_params_data fallback 0.8", "anomaly_random_speed_factor generated key"] },
  { leafName: "weak_random_speed_factor", category: "extra", mode: "default", defaultValue: 0.8, likelyMeaning: "PRD speed factor for weakspot checks.", confidence: "high", evidence: ["global_params_data fallback 0.8", "weak_random_speed_factor generated key"] },
];

export const ATTACKER_DYNAMIC_LEAVES: readonly FormulaLeafBinding[] = [
  // ── Direct attacker leaves (not tag-table resolved) ──
  {
    leafName: "weapon_attack_add_rate",
    category: "attacker",
    mode: "direct",
    likelyMeaning: "General weapon attack damage add rate. Accumulates weapon-category bonuses (weaponDMGBonus) not covered by gun_type or attack_type branches.",
    defaultValue: 0,
    confidence: "medium",
    evidence: [
      "external_formula context_module.py apply_weapon_and_status_bonus: weapon_damage_percent (additive with status/melee)",
      "EXTERNAL_PHYSICAL_WEAPON_PIPELINE mergeFormula: weapon_damage_percent + status_damage_percent + melee_damage_percent",
      "OHAI weaponDMGBonus stat maps to this leaf (1 + sum pattern)",
      "NOT directly recovered from official formula graph — inferred from external formula + naming convention",
    ],
  },
  // ── Tag-table resolved attacker leaves ──
  { leafName: "keyword_proc_crit_enable", category: "attacker", mode: "dynamic", resolvedBy: "get_keyword_attr_name_by_tag", dependsOnLeaves: ["keyword_type"], likelyMeaning: "Whether this keyword proc can crit.", confidence: "high", evidence: ["formula_const keyword_proc_crit_enable"] },
  { leafName: "keyword_proc_crit_rate_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_keyword_attr_name_by_tag", dependsOnLeaves: ["keyword_type"], likelyMeaning: "Crit rate add rate for current keyword proc.", confidence: "high", evidence: ["formula_const keyword_proc_crit_rate_add_rate"] },
  { leafName: "keyword_proc_crit_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_keyword_attr_name_by_tag", dependsOnLeaves: ["keyword_type"], likelyMeaning: "Crit damage add rate for current keyword proc.", confidence: "high", evidence: ["formula_const keyword_proc_crit_dam_add_rate"] },
  { leafName: "keyword_proc_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_keyword_attr_name_by_tag", dependsOnLeaves: ["keyword_type"], likelyMeaning: "Base damage add rate for current keyword proc.", confidence: "high", evidence: ["formula_const keyword_proc_dam_add_rate"] },
  { leafName: "keyword_proc_weak_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_keyword_attr_name_by_tag", dependsOnLeaves: ["keyword_type"], likelyMeaning: "Weakspot damage add rate for current keyword proc.", confidence: "high", evidence: ["formula_const keyword_proc_weak_dam_add_rate"] },
  { leafName: "attack_type_crit_rate_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_attack_type_attr_name_by_tag", dependsOnLeaves: ["formula_attack_type"], likelyMeaning: "Crit rate add rate for current attack branch.", confidence: "high", evidence: ["formula_const attack_type_crit_rate_add_rate"] },
  { leafName: "attack_type_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_attack_type_attr_name_by_tag", dependsOnLeaves: ["formula_attack_type"], likelyMeaning: "Damage add rate for current attack branch.", confidence: "high", evidence: ["formula_const attack_type_dam_add_rate"] },
  { leafName: "attack_type_crit_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_attack_type_attr_name_by_tag", dependsOnLeaves: ["formula_attack_type"], likelyMeaning: "Crit damage add rate for current attack branch.", confidence: "high", evidence: ["formula_const attack_type_crit_dam_add_rate"] },
  { leafName: "attack_type_ignore_dam_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_attack_type_attr_name_by_tag", dependsOnLeaves: ["formula_attack_type"], likelyMeaning: "Ignore-damage/penetration rate for current attack branch.", confidence: "high", evidence: ["formula_const attack_type_ignore_dam_rate"] },
  { leafName: "gun_type_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_gun_type_attr_name_by_tag", dependsOnLeaves: ["gun_type"], likelyMeaning: "Damage add rate for current gun type.", confidence: "high", evidence: ["formula_const gun_type_dam_add_rate"] },
  { leafName: "element_type_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_element_attr_name_by_tag", dependsOnLeaves: ["element_type"], likelyMeaning: "Elemental damage add rate for current element.", confidence: "high", evidence: ["formula_const element_type_dam_add_rate"] },
  { leafName: "element_type_dur_dam_add_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_element_attr_name_by_tag", dependsOnLeaves: ["element_type"], likelyMeaning: "Elemental duration/DOT damage add rate.", confidence: "high", evidence: ["formula_const element_type_dur_dam_add_rate"] },
  { leafName: "element_type_index_struct_type_dam_rate", category: "attacker", mode: "dynamic", resolvedBy: "get_element_type_index_struct_type_dam_rate", dependsOnLeaves: ["element_type", "damage_material_type"], needsAllSubAttr: true, likelyMeaning: "Element vs structure material damage rate.", confidence: "high", evidence: ["building_damage_formula", "formula_const structure resolver"] },
];

export const TARGET_DYNAMIC_LEAVES: readonly FormulaLeafBinding[] = [
  { leafName: "defined_fixed_crit", category: "target", mode: "dynamic", resolvedBy: "get_defined_fixed_crit", likelyMeaning: "Forced crit override: 0 normal, >0 forced crit, <0 forced non-crit.", confidence: "high", evidence: ["FormulaData.get_final_is_crit", "TARGET_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "pvp_adjust_factor", category: "target", mode: "dynamic", resolvedBy: "get_pvp_adjust_factor", likelyMeaning: "PvP weapon tier vs armor tier adjustment factor.", defaultValue: 1, confidence: "high", evidence: ["formula_pvp_adjust_param_data", "TARGET_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "special_regulate_factor", category: "target", mode: "dynamic", resolvedBy: "get_special_regulate_factor", likelyMeaning: "PvP/ice/lightning special regulate factor.", defaultValue: 1, confidence: "high", evidence: ["formula_global_param_data", "TARGET_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "element_type_index_armor_type_dam_rate", category: "target", mode: "dynamic", resolvedBy: "get_element_type_index_armor_type_dam_rate", dependsOnLeaves: ["element_type", "BB.armor_type"], likelyMeaning: "Element vs armor type level-ranged damage rate.", confidence: "high", evidence: ["damage_formula final_armor_type_dam_rate", "FormulaManagerHelper element armor table"] },
  { leafName: "element_type_ignore_dam_rate", category: "target", mode: "dynamic", resolvedBy: "get_element_type_ignore_dam_rate", dependsOnLeaves: ["element_type"], likelyMeaning: "Target elemental damage ignore/resistance rate.", confidence: "high", evidence: ["TARGET_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "part_dam_ignore_rate", category: "target", mode: "dynamic", resolvedBy: "get_part_dam_ignore_rate", likelyMeaning: "Target hit-part damage ignore rate.", confidence: "high", evidence: ["TARGET_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "species_dam_add_rate", category: "target", mode: "dynamic", resolvedBy: "get_species_dam_add_rate", likelyMeaning: "Damage add rate based on target species.", confidence: "high", evidence: ["TARGET_LEAF_NODE_RELATED_ATTR", "formula_const ATTACKER_NEED_ALL_SUB_ATTR_NODE"] },
  { leafName: "debuff_type_dam_add_rate", category: "target", mode: "dynamic", resolvedBy: "get_debuff_type_dam_add_rate", likelyMeaning: "Damage add rate based on target debuff state.", confidence: "high", evidence: ["TARGET_LEAF_NODE_RELATED_ATTR", "formula_const TLNRAD_DEBUFF_TYPE_PART"] },
  { leafName: "human_dam_add_rate", category: "target", mode: "dynamic", resolvedBy: "get_human_dam_add_rate", likelyMeaning: "Damage add rate for human-type targets.", confidence: "low", evidence: ["No evidence in recovered game data — may be misidentified species_dam_add_rate_human"] },
  { leafName: "species_dam_ignore_rate", category: "target", mode: "dynamic", resolvedBy: "get_species_dam_ignore_rate", likelyMeaning: "Damage ignore rate based on target species.", confidence: "high", evidence: ["TARGET_LEAF_NODE_RELATED_ATTR"] },
  { leafName: "in_driving_state", category: "target", mode: "dynamic", resolvedBy: "get_in_driving_state", likelyMeaning: "Target in vehicle/driving state flag.", confidence: "high", evidence: ["TARGET_LEAF_NODE_RELATED_ATTR"] },
];

export const NEED_ALL_SUB_ATTR_LEAVES = [
  "part_dam_add_rate",
  "species_dam_add_rate",
  "human_dam_add_rate",
  "alters_dam_add_rate",
  "unit_prototype_dam_add_rate",
  "tag_melee_crit_dam_add_rate_noarmor",
  "debuff_type_weak_dam_add_rate",
  "debuff_type_crit_dam_add_rate",
  "debuff_type_crit_rate_add_rate",
  "armor_type_crit_rate_add_rate",
  "debuff_type_dam_add_rate",
  "armor_type_crit_dam_add_rate",
  "element_type_to_armor_type_dam_add_rate",
] as const;

export type OfficialFormulaLeafName =
  | typeof CONTEXT_SELECTOR_LEAVES[number]["leafName"]
  | typeof DEFAULT_FORMULA_LEAVES[number]["leafName"]
  | typeof ATTACKER_DYNAMIC_LEAVES[number]["leafName"]
  | typeof TARGET_DYNAMIC_LEAVES[number]["leafName"]
  | typeof NEED_ALL_SUB_ATTR_LEAVES[number]
  | string;

export const ALL_KNOWN_FORMULA_LEAVES: readonly FormulaLeafBinding[] = [
  ...CONTEXT_SELECTOR_LEAVES,
  ...DEFAULT_FORMULA_LEAVES,
  ...ATTACKER_DYNAMIC_LEAVES,
  ...TARGET_DYNAMIC_LEAVES,
] as const;

export function getDefaultFormulaLeafValues(): Record<string, number> {
  const values: Record<string, number> = {};
  for (const leaf of DEFAULT_FORMULA_LEAVES) {
    if (leaf.defaultValue !== undefined) values[leaf.leafName] = leaf.defaultValue;
  }
  return values;
}

export function isNeedAllSubAttrLeaf(leafName: string): boolean {
  return (NEED_ALL_SUB_ATTR_LEAVES as readonly string[]).includes(leafName);
}

// ─── Shared scalar type (Phase 3/4) ──────────────────────────────────────────

export type FormulaValue = number | string | boolean;

// ─── Node execution types (Phase 3/4) ────────────────────────────────────────

export const OFFICIAL_FORMULA_OPERATORS = [
  "+", "-", "*", "/", "**", "<", "<=", ">", ">=", "==", "!=", "||",
] as const;

export type OfficialFormulaOperator = typeof OFFICIAL_FORMULA_OPERATORS[number];

export const OFFICIAL_FORMULA_FUNCTIONS = [
  "min", "max", "exp", "pow", "clamp", "random", "floor", "sqrt", "abs",
] as const;

export type OfficialFormulaFunctionName = typeof OFFICIAL_FORMULA_FUNCTIONS[number];

/**
 * Runtime execution status for the official formula graph.
 * metadata-only: no recipe loaded; metadata/bindings only
 * terminal-only: only the terminal expression is executed (no full graph)
 * partial-graph: some sub-trees connected but not all
 * full-graph: complete recovered graph executing
 * validated: full-graph output confirmed against game observations
 */
export type OfficialFormulaRuntimeStatus =
  | "metadata-only"
  | "terminal-only"
  | "sub-recipe"
  | "partial-graph"
  | "full-graph"
  | "validated";
