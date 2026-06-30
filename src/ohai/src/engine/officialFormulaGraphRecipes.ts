import { FORMULA_TARGETS, FORMULA_TREE_NAMES, type OfficialFormulaTreeName, type OfficialFormulaOperator, type OfficialFormulaFunctionName, type FormulaValue } from "./officialFormulaMetadata";

export type OfficialFormulaRecipeStatus = "terminal-only" | "partial" | "complete";

export interface OfficialFormulaTerminalRecipe {
  treeName: OfficialFormulaTreeName;
  targetName: string;
  soulId: number;
  status: OfficialFormulaRecipeStatus;
  expression: string;
  inputNodes: readonly string[];
  operation: "max" | "multiply" | "custom";
  confidence: "high" | "medium" | "low";
  evidence: readonly string[];
  notes: readonly string[];
}

export const DAMAGE_FORMULA_TERMINAL_RECIPE: OfficialFormulaTerminalRecipe = {
  treeName: FORMULA_TREE_NAMES.DAMAGE,
  targetName: FORMULA_TARGETS.FINAL_ATTACK,
  soulId: 331,
  status: "terminal-only",
  expression: "final_attack = max(base_attack * final_attack_additional_rate * final_attack_ignore_dam_rate * final_special_regulate_factor, 0)",
  inputNodes: [
    "base_attack",
    "final_attack_additional_rate",
    "final_attack_ignore_dam_rate",
    "final_special_regulate_factor",
  ],
  operation: "max",
  confidence: "high",
  evidence: [
    "Recovered damage_formula terminal target final_attack",
    "final_attack soul_id 331",
    "Recovered graph expression: max(330, 0)",
    "Node 330 is base_attack * final_attack_additional_rate * final_attack_ignore_dam_rate * final_special_regulate_factor",
  ],
  notes: [
    "This recipe stores the recovered terminal expression only; upstream graph node recipes must be added before replacing flattened expected-damage calculations.",
    "Use getTargetValue('final_attack') for public reads; use soul_id 331 as validation metadata, not as the only lookup path.",
  ],
};

export const OFFICIAL_FORMULA_TERMINAL_RECIPES: readonly OfficialFormulaTerminalRecipe[] = [
  DAMAGE_FORMULA_TERMINAL_RECIPE,
];

export function getOfficialTerminalRecipe(treeName: OfficialFormulaTreeName): OfficialFormulaTerminalRecipe | undefined {
  return OFFICIAL_FORMULA_TERMINAL_RECIPES.find((recipe) => recipe.treeName === treeName);
}

// ─── Executable graph recipe types (Phase 4) ──────────────────────────────────
// Distinct from OfficialFormulaTerminalRecipe (metadata above).
// These drive OfficialFormulaGraphRuntime's flat vals[] executor.

export interface FormulaBinopContent {
  op: OfficialFormulaOperator;
  exprId: number;
}

export interface OfficialFormulaNodeRecipe {
  exprId: number;
  nodeType: "NumberExpr" | "StringExpr" | "NameExpr" | "UnaryopExpr" | "BinopListExpr" | "FunctionExpr";
  value?: number | string;
  soulId?: number;
  childExprId?: number;
  firstExprId?: number;
  negate?: boolean;
  op?: OfficialFormulaOperator;
  contents?: readonly FormulaBinopContent[];
  functionName?: OfficialFormulaFunctionName;
  paramExprIds?: readonly number[];
}

export interface OfficialFormulaLeafSlot {
  leafName: string;
  exprId: number;
  soulId: number;
  defaultValue?: FormulaValue;
  /**
   * True when this leaf requires a dynamic resolver (tag table) for accurate results.
   * The defaultValue is an additive/multiplicative identity fallback only.
   * Leaves with requiresResolver=true are always listed in getUnresolvedLeaves()
   * until an override is provided via setLeafValue().
   */
  requiresResolver?: boolean;
}

export interface OfficialFormulaTargetSlot {
  targetName: string;
  exprId: number;
  soulId: number;
}

export interface OfficialFormulaExecutableRecipe {
  treeName: OfficialFormulaTreeName;
  /** "terminal-only" | "partial-graph" | etc — matches OfficialFormulaRuntimeStatus */
  scope: string;
  nodes: readonly OfficialFormulaNodeRecipe[];
  leaves: readonly OfficialFormulaLeafSlot[];
  targets: readonly OfficialFormulaTargetSlot[];
  updateOrder: readonly number[];
}

/**
 * Terminal-only executable recipe for damage_formula.
 * Implements: final_attack = max(base_attack * additional_rate * ignore_dam_rate * special_factor, 0)
 *
 * Slot layout:
 *   exprId 1 — leaf: base_attack
 *   exprId 2 — leaf: final_attack_additional_rate  (default 1)
 *   exprId 3 — leaf: final_attack_ignore_dam_rate  (default 1)
 *   exprId 4 — leaf: final_special_regulate_factor (default 1)
 *   exprId 5 — NumberExpr(0) — constant for max() lower bound
 *   exprId 6 — BinopListExpr: product of leaves 1..4
 *   exprId 7 — FunctionExpr("max", [6, 5]) = final_attack  [soul_id 331]
 */
// ─── FINAL_ATTACK_ADDITIONAL_RATE standalone sub-recipe ──────────────────────
/**
 * Standalone executable recipe for the `final_attack_additional_rate` sub-tree.
 *
 * Evidence basis:
 *   HIGH confidence: attack_type, gun_type, element_type, keyword_proc _dam_add_rate
 *     (formula_const evidence in ATTACKER_DYNAMIC_LEAVES, tag-table resolved)
 *   HIGH confidence: use_final_dam_add_rate gate (DEFAULT_FORMULA_LEAVES, default=1)
 *   MEDIUM confidence: weapon_attack_add_rate
 *     (inferred from external_formula context_module.py apply_weapon_and_status_bonus,
 *      NOT directly recovered from official formula graph)
 *
 * Formula (medium confidence for overall structure):
 *   final_attack_additional_rate = 1 + use_final_dam_add_rate × (
 *       weapon_attack_add_rate
 *     + attack_type_dam_add_rate
 *     + gun_type_dam_add_rate
 *     + element_type_dam_add_rate
 *     + keyword_proc_dam_add_rate
 *     + species_dam_add_rate
 *     + human_dam_add_rate
 *     + debuff_type_dam_add_rate
 *   )
 *
 * NOT recovered yet: soul_id for the intermediate node (soulId: 0 = placeholder).
 * species/human/debuff _dam_add_rate leaves are now included in the sum (Phase 3),
 * but all three lack recovered tag tables and stat bridge entries — they default to 0
 * with requiresResolver=true and emit missingReason when queried.
 *
 * Slot layout:
 *   exprId  1 — leaf: weapon_attack_add_rate       (default 0, direct, medium conf)
 *   exprId  2 — leaf: attack_type_dam_add_rate     (default 0, requiresResolver)
 *   exprId  3 — leaf: gun_type_dam_add_rate        (default 0, requiresResolver)
 *   exprId  4 — leaf: element_type_dam_add_rate    (default 0, requiresResolver)
 *   exprId  5 — leaf: keyword_proc_dam_add_rate    (default 0, requiresResolver)
 *   exprId  6 — leaf: use_final_dam_add_rate       (default 1 from static defaults)
 *   exprId  7 — leaf: species_dam_add_rate         (default 0, requiresResolver)
 *   exprId  8 — leaf: human_dam_add_rate           (default 0, requiresResolver)
 *   exprId  9 — leaf: debuff_type_dam_add_rate     (default 0, requiresResolver)
 *   exprId 10 — node: sum = 1+2+3+4+5+7+8+9
 *   exprId 11 — node: gated_sum = 6×10
 *   exprId 12 — node: NumberExpr(1) — constant base
 *   exprId 13 — node: final_attack_additional_rate = 12+11
 */
export const FINAL_ATTACK_ADDITIONAL_RATE_RECIPE: OfficialFormulaExecutableRecipe = {
  treeName: FORMULA_TREE_NAMES.DAMAGE,
  scope: "sub-recipe",
  leaves: [
    { leafName: "weapon_attack_add_rate",    exprId: 1, soulId: 0, defaultValue: 0 },
    { leafName: "attack_type_dam_add_rate",  exprId: 2, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "gun_type_dam_add_rate",     exprId: 3, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "element_type_dam_add_rate", exprId: 4, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "keyword_proc_dam_add_rate", exprId: 5, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "use_final_dam_add_rate",    exprId: 6, soulId: 0 },  // default 1 from metadata defaults
    { leafName: "species_dam_add_rate",      exprId: 7, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "human_dam_add_rate",        exprId: 8, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "debuff_type_dam_add_rate",  exprId: 9, soulId: 0, defaultValue: 0, requiresResolver: true },
  ],
  nodes: [
    // sum = weapon + attack_type + gun_type + element + keyword + species + human + debuff
    { exprId: 10,  nodeType: "BinopListExpr", firstExprId: 1,
      contents: [
        { op: "+", exprId: 2 },
        { op: "+", exprId: 3 },
        { op: "+", exprId: 4 },
        { op: "+", exprId: 5 },
        { op: "+", exprId: 7 },
        { op: "+", exprId: 8 },
        { op: "+", exprId: 9 },
      ] },
    // gated_sum = use_final_dam_add_rate × sum
    { exprId: 11, nodeType: "BinopListExpr", firstExprId: 6,
      contents: [{ op: "*", exprId: 10 }] },
    // constant 1 — base before bonuses
    { exprId: 12, nodeType: "NumberExpr", value: 1 },
    // final_attack_additional_rate = 1 + gated_sum
    { exprId: 13, nodeType: "BinopListExpr", firstExprId: 12,
      contents: [{ op: "+", exprId: 11 }] },
  ],
  targets: [
    // soulId 0 = intermediate node, soul_id not yet recovered
    { targetName: "final_attack_additional_rate", exprId: 13, soulId: 0 },
  ],
  updateOrder: [10, 11, 12, 13],
};

// ─── V2 full partial-graph recipe incorporating FINAL_ATTACK_ADDITIONAL_RATE ──
/**
 * Partial-graph executable recipe for damage_formula (v2).
 *
 * Incorporates the full FINAL_ATTACK_ADDITIONAL_RATE_RECIPE sub-tree (exprIds 1-10),
 * then connects it to base_attack and the terminal expression.
 *
 * Same confidence levels as FINAL_ATTACK_ADDITIONAL_RATE_RECIPE for the
 * additional_rate sub-tree. Terminal expression is HIGH confidence.
 *
 * Additional leaves beyond the sub-recipe:
 *   exprId 11 — leaf: base_attack                   (no default — required)
 *   exprId 12 — leaf: final_attack_ignore_dam_rate   (default 1 — leaf, not yet sub-graph)
 *   exprId 13 — leaf: final_special_regulate_factor  (default 1 — leaf, not yet sub-graph)
 *   exprId 14 — node: NumberExpr(0) — lower bound for max()
 *   exprId 15 — node: product = base_attack × additional_rate × ignore × special
 *   exprId 16 — node: FunctionExpr("max", [15, 14]) = final_attack
 */
export const DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE: OfficialFormulaExecutableRecipe = {
  treeName: FORMULA_TREE_NAMES.DAMAGE,
  scope: "partial-graph",
  leaves: [
    // ── final_attack_additional_rate sub-tree inputs ──
    { leafName: "weapon_attack_add_rate",    exprId: 1, soulId: 0, defaultValue: 0 },
    { leafName: "attack_type_dam_add_rate",  exprId: 2, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "gun_type_dam_add_rate",     exprId: 3, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "element_type_dam_add_rate", exprId: 4, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "keyword_proc_dam_add_rate", exprId: 5, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "use_final_dam_add_rate",    exprId: 6, soulId: 0 },
    { leafName: "species_dam_add_rate",      exprId: 7, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "human_dam_add_rate",        exprId: 8, soulId: 0, defaultValue: 0, requiresResolver: true },
    { leafName: "debuff_type_dam_add_rate",  exprId: 9, soulId: 0, defaultValue: 0, requiresResolver: true },
    // ── terminal inputs (not yet sub-graph connected) ──
    { leafName: "base_attack",                   exprId: 20, soulId: 1  },
    { leafName: "final_attack_ignore_dam_rate",  exprId: 21, soulId: 3, defaultValue: 1 },
    { leafName: "final_special_regulate_factor", exprId: 22, soulId: 4, defaultValue: 1 },
  ],
  nodes: [
    // ── final_attack_additional_rate sub-graph ──
    { exprId: 10, nodeType: "BinopListExpr", firstExprId: 1,
      contents: [
        { op: "+", exprId: 2 },
        { op: "+", exprId: 3 },
        { op: "+", exprId: 4 },
        { op: "+", exprId: 5 },
        { op: "+", exprId: 7 },
        { op: "+", exprId: 8 },
        { op: "+", exprId: 9 },
      ] },
    { exprId: 11, nodeType: "BinopListExpr", firstExprId: 6,
      contents: [{ op: "*", exprId: 10 }] },
    { exprId: 12, nodeType: "NumberExpr", value: 1 },
    { exprId: 13, nodeType: "BinopListExpr", firstExprId: 12,
      contents: [{ op: "+", exprId: 11 }] },
    // ── terminal expression ──
    { exprId: 17, nodeType: "NumberExpr", value: 0 },
    // product = base_attack × final_attack_additional_rate × ignore × special
    { exprId: 18, nodeType: "BinopListExpr", firstExprId: 20,
      contents: [
        { op: "*", exprId: 13 },
        { op: "*", exprId: 21 },
        { op: "*", exprId: 22 },
      ] },
    { exprId: 19, nodeType: "FunctionExpr", functionName: "max", paramExprIds: [18, 17] },
  ],
  targets: [
    { targetName: FORMULA_TARGETS.FINAL_ATTACK, exprId: 19, soulId: 331 },
  ],
  updateOrder: [10, 11, 12, 13, 17, 18, 19],
};

/**
 * Partial-graph executable recipe for damage_formula.
 *
 * Extends the terminal-only recipe by implementing the
 * final_attack_additional_rate sub-graph:
 *
 *   final_attack_additional_rate = 1 + use_final_dam_add_rate × (
 *       attack_type_dam_add_rate
 *     + gun_type_dam_add_rate
 *     + element_type_dam_add_rate
 *     + keyword_proc_dam_add_rate
 *   )
 *
 * Dynamic leaves (attack/gun/element/keyword _dam_add_rate) default to 0
 * (additive identity) and are flagged requiresResolver=true.
 * They appear in getUnresolvedLeaves() until a tag-table resolver injects them.
 *
 * final_attack_ignore_dam_rate branch NOT yet connected — stays as leaf with default 1.
 *
 * Slot layout:
 *   exprId  1 — leaf: base_attack                  (no default — required)
 *   exprId  2 — node: final_attack_additional_rate  (computed by sub-graph below)
 *   exprId  3 — leaf: final_attack_ignore_dam_rate  (default 1)
 *   exprId  4 — leaf: final_special_regulate_factor (default 1)
 *   exprId  5 — node: NumberExpr(0)                 (lower bound for max)
 *   exprId  6 — node: base_attack × add_rate × ignore × special
 *   exprId  7 — node: FunctionExpr("max", [6, 5])   = final_attack [soul_id 331]
 *   exprId  8 — leaf: attack_type_dam_add_rate      (default 0, requiresResolver)
 *   exprId  9 — leaf: gun_type_dam_add_rate         (default 0, requiresResolver)
 *   exprId 10 — leaf: element_type_dam_add_rate     (default 0, requiresResolver)
 *   exprId 11 — leaf: keyword_proc_dam_add_rate     (default 0, requiresResolver)
 *   exprId 12 — leaf: use_final_dam_add_rate        (default 1 — static gate)
 *   exprId 13 — node: sum_dam_add_rate = 8+9+10+11
 *   exprId 14 — node: gated_sum = 12 × 13
 *   exprId 15 — node: NumberExpr(1)                 (constant base for addition)
 *   exprId  2 — node: final_attack_additional_rate = 15 + 14 = 1 + gated_sum
 */
export const DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE: OfficialFormulaExecutableRecipe = {
  treeName: FORMULA_TREE_NAMES.DAMAGE,
  scope: "partial-graph",
  leaves: [
    { leafName: "base_attack",                   exprId: 1,  soulId: 1  },
    // exprId 2 is computed — not a leaf in this recipe
    { leafName: "final_attack_ignore_dam_rate",  exprId: 3,  soulId: 3,  defaultValue: 1 },
    { leafName: "final_special_regulate_factor", exprId: 4,  soulId: 4,  defaultValue: 1 },
    { leafName: "attack_type_dam_add_rate",      exprId: 8,  soulId: 8,  defaultValue: 0, requiresResolver: true },
    { leafName: "gun_type_dam_add_rate",         exprId: 9,  soulId: 9,  defaultValue: 0, requiresResolver: true },
    { leafName: "element_type_dam_add_rate",     exprId: 10, soulId: 10, defaultValue: 0, requiresResolver: true },
    { leafName: "keyword_proc_dam_add_rate",     exprId: 11, soulId: 11, defaultValue: 0, requiresResolver: true },
    { leafName: "use_final_dam_add_rate",        exprId: 12, soulId: 12 },  // default 1 from metadata
  ],
  nodes: [
    // Constant lower bound
    { exprId: 5, nodeType: "NumberExpr", value: 0 },
    // sum_dam_add_rate = attack + gun + element + keyword
    { exprId: 13, nodeType: "BinopListExpr", firstExprId: 8,
      contents: [{ op: "+", exprId: 9 }, { op: "+", exprId: 10 }, { op: "+", exprId: 11 }] },
    // gated_sum = use_final_dam_add_rate * sum
    { exprId: 14, nodeType: "BinopListExpr", firstExprId: 12,
      contents: [{ op: "*", exprId: 13 }] },
    // constant 1 — base before bonuses
    { exprId: 15, nodeType: "NumberExpr", value: 1 },
    // final_attack_additional_rate = 1 + gated_sum
    { exprId: 2, nodeType: "BinopListExpr", firstExprId: 15,
      contents: [{ op: "+", exprId: 14 }] },
    // product = base_attack * additional_rate * ignore_dam_rate * special_factor
    { exprId: 6, nodeType: "BinopListExpr", firstExprId: 1,
      contents: [{ op: "*", exprId: 2 }, { op: "*", exprId: 3 }, { op: "*", exprId: 4 }] },
    // final_attack = max(product, 0)
    { exprId: 7, nodeType: "FunctionExpr", functionName: "max", paramExprIds: [6, 5] },
  ],
  targets: [
    { targetName: FORMULA_TARGETS.FINAL_ATTACK, exprId: 7, soulId: 331 },
  ],
  updateOrder: [5, 13, 14, 15, 2, 6, 7],
};

export const DAMAGE_FORMULA_TERMINAL_GRAPH_RECIPE: OfficialFormulaExecutableRecipe = {
  treeName: FORMULA_TREE_NAMES.DAMAGE,
  scope: "terminal-only",
  leaves: [
    { leafName: "base_attack",                   exprId: 1, soulId: 1  },
    { leafName: "final_attack_additional_rate",  exprId: 2, soulId: 2, defaultValue: 1 },
    { leafName: "final_attack_ignore_dam_rate",  exprId: 3, soulId: 3, defaultValue: 1 },
    { leafName: "final_special_regulate_factor", exprId: 4, soulId: 4, defaultValue: 1 },
  ],
  nodes: [
    { exprId: 5, nodeType: "NumberExpr", value: 0 },
    { exprId: 6, nodeType: "BinopListExpr", firstExprId: 1,
      contents: [{ op: "*", exprId: 2 }, { op: "*", exprId: 3 }, { op: "*", exprId: 4 }] },
    { exprId: 7, nodeType: "FunctionExpr", functionName: "max", paramExprIds: [6, 5] },
  ],
  targets: [
    { targetName: FORMULA_TARGETS.FINAL_ATTACK, exprId: 7, soulId: 331 },
  ],
  updateOrder: [5, 6, 7],
};
