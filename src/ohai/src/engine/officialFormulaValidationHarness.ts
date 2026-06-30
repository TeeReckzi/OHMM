/**
 * Official formula validation harness.
 *
 * Two categories of tests:
 *   synthetic — validate implementation mechanics (can pass now)
 *   real       — validate actual game values (require recovered data, marked pending)
 *
 * Do not mix synthetic and real validation status.
 * Placeholder cases must not claim game accuracy.
 */

import type { OfficialFormulaTreeName } from "./officialFormulaMetadata";
import { createRecipeRuntime } from "./officialFormulaGraphRuntime";
import {
  DAMAGE_FORMULA_TERMINAL_GRAPH_RECIPE,
  DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE,
  DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE,
  FINAL_ATTACK_ADDITIONAL_RATE_RECIPE,
  type OfficialFormulaExecutableRecipe,
} from "./officialFormulaGraphRecipes";

export interface OfficialFormulaValidationCase {
  id: string;
  label: string;
  treeName: OfficialFormulaTreeName;
  targetName: string;
  /** Which recipe scope to run. Defaults to "terminal-only". */
  recipeScope?: "terminal-only" | "partial-graph" | "partial-graph-v2" | "sub-recipe-additional-rate";
  leaves: Record<string, number | string | boolean>;
  expectedTargetValue: number;
  tolerance: number;
  source: "synthetic" | "manual-test" | "dummy-test" | "recovered-example";
  notes: string[];
}

export type ValidationResult =
  | { status: "pass"; case: OfficialFormulaValidationCase; actual: number }
  | { status: "fail"; case: OfficialFormulaValidationCase; actual: number; delta: number }
  | { status: "pending"; case: OfficialFormulaValidationCase; reason: string }
  | { status: "error"; case: OfficialFormulaValidationCase; error: string };

export function runValidationCase(
  vc: OfficialFormulaValidationCase
): ValidationResult {
  if (vc.source === "dummy-test") {
    return {
      status: "pending",
      case: vc,
      reason: "dummy-test placeholder — real game data not yet recovered",
    };
  }

  if (vc.treeName !== "damage_formula") {
    return {
      status: "pending",
      case: vc,
      reason: `tree "${vc.treeName}" not yet executable — terminal recipe not implemented`,
    };
  }

  try {
    const recipe: OfficialFormulaExecutableRecipe =
      vc.recipeScope === "partial-graph"         ? DAMAGE_FORMULA_PARTIAL_GRAPH_RECIPE
      : vc.recipeScope === "partial-graph-v2"    ? DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE
      : vc.recipeScope === "sub-recipe-additional-rate" ? FINAL_ATTACK_ADDITIONAL_RATE_RECIPE
      : DAMAGE_FORMULA_TERMINAL_GRAPH_RECIPE;

    const rt = createRecipeRuntime(recipe);
    for (const [k, v] of Object.entries(vc.leaves)) {
      rt.setLeafValue(k, v as number | string | boolean);
    }
    rt.update();

    const raw = rt.getTargetValue(vc.targetName);
    const actual = typeof raw === "number" ? raw : NaN;

    if (isNaN(actual)) {
      return { status: "error", case: vc, error: `target "${vc.targetName}" not found or non-numeric` };
    }

    const delta = Math.abs(actual - vc.expectedTargetValue);
    if (delta <= vc.tolerance) {
      return { status: "pass", case: vc, actual };
    }
    return { status: "fail", case: vc, actual, delta };
  } catch (err) {
    return {
      status: "error",
      case: vc,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function runValidationSuite(
  cases: OfficialFormulaValidationCase[]
): ValidationResult[] {
  return cases.map(runValidationCase);
}

// ─── Synthetic cases (validate terminal-only implementation) ──────────────────

export const SYNTHETIC_TERMINAL_CASES: OfficialFormulaValidationCase[] = [
  {
    id: "syn-001",
    label: "base_attack passthrough — all rates 1",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {
      base_attack: 100,
      final_attack_additional_rate: 1,
      final_attack_ignore_dam_rate: 1,
      final_special_regulate_factor: 1,
    },
    expectedTargetValue: 100,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["Baseline: no multipliers applied"],
  },
  {
    id: "syn-002",
    label: "spec test: 100 * 2 * 0.5 * 1 = 100",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {
      base_attack: 100,
      final_attack_additional_rate: 2,
      final_attack_ignore_dam_rate: 0.5,
      final_special_regulate_factor: 1,
    },
    expectedTargetValue: 100,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["Spec-provided synthetic test"],
  },
  {
    id: "syn-003",
    label: "clamp to zero — negative product",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {
      base_attack: 100,
      final_attack_additional_rate: -2,
      final_attack_ignore_dam_rate: 1,
      final_special_regulate_factor: 1,
    },
    expectedTargetValue: 0,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["max(negative, 0) = 0"],
  },
  {
    id: "syn-004",
    label: "zero base attack",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {
      base_attack: 0,
      final_attack_additional_rate: 10,
      final_attack_ignore_dam_rate: 5,
      final_special_regulate_factor: 2,
    },
    expectedTargetValue: 0,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["0 * anything = 0"],
  },
  {
    id: "syn-005",
    label: "default rates (1, 1, 1) — base passthrough",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: { base_attack: 250 },
    expectedTargetValue: 250,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["Rates default to 1 from recipe defaults"],
  },
];

// ─── Synthetic partial-graph cases (validate final_attack_additional_rate branch) ─────

export const SYNTHETIC_PARTIAL_GRAPH_CASES: OfficialFormulaValidationCase[] = [
  {
    id: "syn-pg-001",
    label: "partial-graph: all dynamic adds = 0 → passthrough",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph",
    leaves: { base_attack: 100 },
    expectedTargetValue: 100,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["All dynamic add rates default to 0; additional_rate = 1 + 1×0 = 1"],
  },
  {
    id: "syn-pg-002",
    label: "partial-graph: attack_type_dam_add_rate=0.5 → final_attack=150",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph",
    leaves: { base_attack: 100, attack_type_dam_add_rate: 0.5 },
    expectedTargetValue: 150,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["additional_rate = 1 + 1×(0.5) = 1.5; proves branch executes"],
  },
  {
    id: "syn-pg-003",
    label: "partial-graph: all 4 adds sum 1.0 → final_attack=200",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph",
    leaves: {
      base_attack: 100,
      attack_type_dam_add_rate: 0.3,
      gun_type_dam_add_rate: 0.2,
      element_type_dam_add_rate: 0.1,
      keyword_proc_dam_add_rate: 0.4,
    },
    expectedTargetValue: 200,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["sum=1.0 → additional_rate=2.0 → final_attack=200"],
  },
  {
    id: "syn-pg-004",
    label: "partial-graph: use_final_dam_add_rate=0 blocks adds",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph",
    leaves: {
      base_attack: 100,
      attack_type_dam_add_rate: 0.5,
      use_final_dam_add_rate: 0,
    },
    expectedTargetValue: 100,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["Gate=0 → gated_sum=0 → additional_rate=1 → same as no-bonus"],
  },
  {
    id: "syn-pg-005",
    label: "partial-graph: negative add clamps final_attack to 0",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph",
    leaves: { base_attack: 100, attack_type_dam_add_rate: -2.0 },
    expectedTargetValue: 0,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["additional_rate = 1+(-2) = -1; max(-100, 0) = 0"],
  },
];

// ─── Placeholder cases (pending real game data) ───────────────────────────────
// These do NOT claim accuracy. They define the shape for future validation.

export const PLACEHOLDER_REAL_CASES: OfficialFormulaValidationCase[] = [
  {
    id: "real-001",
    label: "plain weapon body hit",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: need observed base_attack and hit register from game"],
  },
  {
    id: "real-002",
    label: "weapon weakspot hit",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: weakspot multiplier not yet in terminal recipe"],
  },
  {
    id: "real-003",
    label: "crit hit",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: crit branches not yet recovered"],
  },
  {
    id: "real-004",
    label: "Burn 1 stack",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: keyword_proc_dam_add_rate tag table not yet recovered"],
  },
  {
    id: "real-005",
    label: "Burn 5 stacks",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: stack accumulation logic not yet in graph"],
  },
  {
    id: "real-006",
    label: "EBR fire ring",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: EBR-specific skill_rate and dam_add_rate not recovered"],
  },
  {
    id: "real-007",
    label: "PvP Safety Sandwich case",
    treeName: "damage_formula",
    targetName: "final_attack",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: pvp_adjust_factor actual PvP value not confirmed from game data"],
  },
  {
    id: "real-008",
    label: "building damage",
    treeName: "building_damage_formula",
    targetName: "final_damage",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: building_damage_formula terminal recipe not yet implemented"],
  },
  {
    id: "real-009",
    label: "vehicle damage",
    treeName: "vehicle_damage_formula",
    targetName: "final_damage",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: vehicle_damage_formula terminal recipe not yet implemented"],
  },
  {
    id: "real-010",
    label: "cure formula",
    treeName: "cure_formula",
    targetName: "final_treat",
    leaves: {},
    expectedTargetValue: 0,
    tolerance: 1,
    source: "dummy-test",
    notes: ["Pending: cure_formula terminal recipe not yet implemented"],
  },
];

// ─── Synthetic sub-recipe + V2 cases (validate weapon_attack_add_rate branch) ─

export const SYNTHETIC_ADDITIONAL_RATE_CASES: OfficialFormulaValidationCase[] = [
  // ── Standalone sub-recipe tests ──
  {
    id: "syn-ar-001",
    label: "sub-recipe: all adds=0 → rate=1",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: {},
    expectedTargetValue: 1.0,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["Default: sum=0, rate = 1+1×0 = 1"],
  },
  {
    id: "syn-ar-002",
    label: "sub-recipe: weapon_attack_add_rate=1.0 → rate=2.0 (MEDIUM confidence)",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { weapon_attack_add_rate: 1.0 },
    expectedTargetValue: 2.0,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["weapon=1 → rate=1+1=2; weapon_attack_add_rate is MEDIUM confidence mapping"],
  },
  {
    id: "syn-ar-003",
    label: "sub-recipe: attack_type=0.5 → rate=1.5 (HIGH confidence)",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { attack_type_dam_add_rate: 0.5 },
    expectedTargetValue: 1.5,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["attack_type leaf is HIGH confidence; tag-table resolver missing, direct injection used"],
  },
  {
    id: "syn-ar-004",
    label: "sub-recipe: gate=0 blocks all adds → rate=1",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { weapon_attack_add_rate: 1.0, use_final_dam_add_rate: 0 },
    expectedTargetValue: 1.0,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["use_final_dam_add_rate gate is HIGH confidence"],
  },
  // ── V2 full recipe user-specified tests ──
  {
    id: "syn-v2-001",
    label: "V2: base_attack=100, additional_rate=1 → final_attack=100",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph-v2",
    leaves: { base_attack: 100 },
    expectedTargetValue: 100,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["All add rates=0 → additional_rate=1 → passthrough"],
  },
  {
    id: "syn-v2-002",
    label: "V2: base_attack=100, weapon=1.0 → additional_rate=2 → final_attack=200",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph-v2",
    leaves: { base_attack: 100, weapon_attack_add_rate: 1.0 },
    expectedTargetValue: 200,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["weapon=1 → additional_rate=2 → final_attack=200 (user-specified test)"],
  },
  {
    id: "syn-v2-003",
    label: "V2: base_attack=100, weapon=2.0 → additional_rate=3 → final_attack=300",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph-v2",
    leaves: { base_attack: 100, weapon_attack_add_rate: 2.0 },
    expectedTargetValue: 300,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["weapon=2 → additional_rate=3 → final_attack=300 (user-specified test)"],
  },
];

// ─── Synthetic tag-table resolver integration cases ───────────────────────────
// These prove that tag-table-resolved leaves inject correctly into the
// final_attack_additional_rate branch when values are provided.

export const SYNTHETIC_TAG_RESOLVER_CASES: OfficialFormulaValidationCase[] = [
  {
    id: "syn-tag-001",
    label: "tag-resolver: gun_type_dam_add_rate=0.15 → rate=1.15",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { gun_type_dam_add_rate: 0.15 },
    expectedTargetValue: 1.15,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["gun_type leaf injects when value provided; tag table resolves attr name but value is caller-supplied"],
  },
  {
    id: "syn-tag-002",
    label: "tag-resolver: element_type_dam_add_rate=0.25 → rate=1.25",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { element_type_dam_add_rate: 0.25 },
    expectedTargetValue: 1.25,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["element_type leaf injects; HIGH confidence tag table (fire/ice/lightning)"],
  },
  {
    id: "syn-tag-003",
    label: "tag-resolver: keyword_proc_dam_add_rate=0.30 → rate=1.30",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { keyword_proc_dam_add_rate: 0.30 },
    expectedTargetValue: 1.30,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["keyword_proc leaf injects; LOW confidence tag table (suffixes inferred)"],
  },
  {
    id: "syn-tag-004",
    label: "tag-resolver: all 4 tag-resolved leaves + weapon stack additively → rate=1.90",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: {
      weapon_attack_add_rate: 0.25,
      attack_type_dam_add_rate: 0.20,
      gun_type_dam_add_rate: 0.15,
      element_type_dam_add_rate: 0.15,
      keyword_proc_dam_add_rate: 0.15,
    },
    expectedTargetValue: 1.90,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["All 5 additive leaves sum=0.90 → rate=1+0.90=1.90; proves additive not multiplicative"],
  },
  {
    id: "syn-tag-005",
    label: "tag-resolver: unresolved leaves default to 0 — only weapon contributes",
    treeName: "damage_formula",
    targetName: "final_attack_additional_rate",
    recipeScope: "sub-recipe-additional-rate",
    leaves: { weapon_attack_add_rate: 0.50 },
    expectedTargetValue: 1.50,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["Only weapon_attack_add_rate injected; 4 tag-resolved leaves stay at default 0"],
  },
  {
    id: "syn-tag-006",
    label: "tag-resolver: V2 full recipe — element=0.15 + weapon=0.25 → final_attack=140",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph-v2",
    leaves: {
      base_attack: 100,
      weapon_attack_add_rate: 0.25,
      element_type_dam_add_rate: 0.15,
    },
    expectedTargetValue: 140,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["V2: sum=0.40 → rate=1.40 → final_attack=140; element tag-resolved leaf injects correctly"],
  },
  {
    id: "syn-tag-007",
    label: "tag-resolver: V2 full recipe — all 5 leaves → final_attack=200",
    treeName: "damage_formula",
    targetName: "final_attack",
    recipeScope: "partial-graph-v2",
    leaves: {
      base_attack: 100,
      weapon_attack_add_rate: 0.25,
      attack_type_dam_add_rate: 0.20,
      gun_type_dam_add_rate: 0.15,
      element_type_dam_add_rate: 0.25,
      keyword_proc_dam_add_rate: 0.15,
    },
    expectedTargetValue: 200,
    tolerance: 0.001,
    source: "synthetic",
    notes: ["V2: sum=1.00 → rate=2.00 → final_attack=200; all leaves stack additively"],
  },
];

export const ALL_VALIDATION_CASES: OfficialFormulaValidationCase[] = [
  ...SYNTHETIC_TERMINAL_CASES,
  ...SYNTHETIC_PARTIAL_GRAPH_CASES,
  ...SYNTHETIC_ADDITIONAL_RATE_CASES,
  ...SYNTHETIC_TAG_RESOLVER_CASES,
  ...PLACEHOLDER_REAL_CASES,
];
