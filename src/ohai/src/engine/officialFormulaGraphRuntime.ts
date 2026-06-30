import {
  FORMULA_TARGETS,
  FORMULA_TREE_NAMES,
  getDefaultFormulaLeafValues,
  getFormulaTargetBinding,
  getPrimaryFormulaTargetBinding,
  mapRuntimeAttackTypeToDamageFormulaBranch,
  type OfficialFormulaTargetName,
  type OfficialFormulaTreeName,
  type RuntimeFormulaAttackAlias,
  type OfficialFormulaRuntimeStatus,
  type OfficialFormulaFunctionName,
  type FormulaValue,
} from "./officialFormulaMetadata";
import type { OfficialFormulaExecutableRecipe, OfficialFormulaLeafSlot, OfficialFormulaTargetSlot, OfficialFormulaNodeRecipe } from "./officialFormulaGraphRecipes";
import { callFormulaFunction } from "./officialFormulaFunctions";

export type { FormulaValue };

export interface FormulaValueSlot {
  soulId: number;
  name?: string;
  value: FormulaValue;
}

export interface FormulaGraphRuntimeConfig {
  treeName: OfficialFormulaTreeName;
  /** Optional known value slots from recovered formula graphs. */
  slots?: FormulaValueSlot[];
}

/**
 * Clean-room runtime shell matching FormulaDataPy's core contract:
 * flat vals[] storage, leaf injection, and tree-scoped target lookup.
 *
 * This intentionally does NOT pretend we have every recovered graph edge in TypeScript yet.
 * The goal is to give OHAI the correct official API surface now, then feed recovered
 * node recipes into this runtime as the next iteration.
 */
export class FormulaGraphRuntime {
  readonly treeName: OfficialFormulaTreeName;
  private readonly valuesBySoulId = new Map<number, FormulaValue>();
  private readonly soulIdsByName = new Map<string, number>();
  private readonly leafValues = new Map<string, FormulaValue>();

  constructor(config: FormulaGraphRuntimeConfig) {
    this.treeName = config.treeName;
    for (const slot of config.slots ?? []) {
      this.valuesBySoulId.set(slot.soulId, slot.value);
      if (slot.name) this.soulIdsByName.set(slot.name, slot.soulId);
    }

    const terminal = getPrimaryFormulaTargetBinding(config.treeName);
    this.soulIdsByName.set(terminal.targetName, terminal.soulId);
    if (!this.valuesBySoulId.has(terminal.soulId)) {
      this.valuesBySoulId.set(terminal.soulId, 0);
    }
  }

  setLeafValue(leafName: string, value: FormulaValue): void {
    this.leafValues.set(leafName, value);
    const soulId = this.soulIdsByName.get(leafName);
    if (soulId !== undefined) {
      this.valuesBySoulId.set(soulId, value);
    }
  }

  setLeafValues(values: Readonly<Record<string, FormulaValue>>): void {
    for (const [leafName, value] of Object.entries(values)) {
      this.setLeafValue(leafName, value);
    }
  }

  getLeafValue(leafName: string): FormulaValue | undefined {
    return this.leafValues.get(leafName);
  }

  setValueBySoulId(soulId: number, value: FormulaValue): void {
    this.valuesBySoulId.set(soulId, value);
  }

  getValueBySoulId(soulId: number): FormulaValue {
    return this.valuesBySoulId.get(soulId) ?? 0;
  }

  getTargetValue(targetName: OfficialFormulaTargetName): FormulaValue {
    const binding = getFormulaTargetBinding(this.treeName, targetName);
    if (!binding) {
      throw new Error(`Target "${targetName}" is not recovered for formula tree "${this.treeName}".`);
    }
    return this.getValueBySoulId(binding.soulId);
  }

  getPrimaryTargetValue(): FormulaValue {
    const binding = getPrimaryFormulaTargetBinding(this.treeName);
    return this.getValueBySoulId(binding.soulId);
  }

  /**
   * Placeholder for future full graph recipe execution.
   * This method exists so callers use the recovered graph lifecycle now:
   * inject leaves -> update -> read named target.
   */
  update(): void {
    // Full node-edge execution lands once recovered node recipes are checked in.
  }

  snapshotLeaves(): Record<string, FormulaValue> {
    return Object.fromEntries(this.leafValues.entries());
  }
}

export interface FormulaRuntimeContext {
  formulaAttackType?: RuntimeFormulaAttackAlias;
  attack?: number;
  critRate?: number;
  weakRate?: number;
  isCrit?: boolean;
  isWeak?: boolean;
  randomSeed?: number;
  elementType?: string | number;
  keywordType?: string | number;
  gunType?: string | number;
  damageFeatureType?: string | number;
  damageMaterialType?: string | number;
  pvpAdjustFactor?: number;
  specialRegulateFactor?: number;
  useFinalIgnoreDamageRate?: boolean;
  useFinalDamageAddRate?: boolean;
  [leafName: string]: FormulaValue | undefined;
}

export function buildOfficialDamageFormulaLeaves(context: FormulaRuntimeContext): Record<string, FormulaValue> {
  const leaves: Record<string, FormulaValue> = {
    ...getDefaultFormulaLeafValues(),
    formula_attack_type: mapRuntimeAttackTypeToDamageFormulaBranch(context.formulaAttackType ?? "normal"),
    attack: context.attack ?? 0,
    crit_rate: context.critRate ?? 0,
    final_weak_rate: context.weakRate ?? 0,
    is_crit: context.isCrit ? 1 : 0,
    is_weak_direct: context.isWeak ? 1 : 0,
    _RANDOM: context.randomSeed ?? 0,
    element_type: context.elementType ?? "unknown",
    keyword_type: context.keywordType ?? "",
    gun_type: context.gunType ?? "unknown",
    damage_feature_type: context.damageFeatureType ?? 0,
    damage_material_type: context.damageMaterialType ?? "unknown",
    pvp_adjust_factor: context.pvpAdjustFactor ?? 1,
    special_regulate_factor: context.specialRegulateFactor ?? 1,
    use_final_ignore_dam_rate: context.useFinalIgnoreDamageRate === false ? 0 : 1,
    use_final_dam_add_rate: context.useFinalDamageAddRate === false ? 0 : 1,
  };

  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && !(key in leaves)) {
      leaves[key] = value;
    }
  }

  return leaves;
}

export function createOfficialFormulaRuntime(treeName: OfficialFormulaTreeName): FormulaGraphRuntime {
  return new FormulaGraphRuntime({ treeName });
}

export function createOfficialDamageFormulaRuntime(context: FormulaRuntimeContext = {}): FormulaGraphRuntime {
  const runtime = createOfficialFormulaRuntime(FORMULA_TREE_NAMES.DAMAGE);
  runtime.setLeafValues(buildOfficialDamageFormulaLeaves(context));
  runtime.update();
  return runtime;
}

export const OFFICIAL_DAMAGE_OUTPUT_TARGET = FORMULA_TARGETS.FINAL_ATTACK;

// ─── Flat-vals executor (Phase 4) ─────────────────────────────────────────────
// Coexists with FormulaGraphRuntime (Map-based shell above).
// This class uses a flat indexed vals[] array matching FormulaDataPy's update propagation model.

export interface OfficialFormulaRuntimeSnapshot {
  treeName: OfficialFormulaTreeName;
  status: OfficialFormulaRuntimeStatus;
  leaves: Record<string, FormulaValue>;
  unresolvedLeaves: string[];
  targets: Record<string, FormulaValue>;
  warnings: string[];
}

export class OfficialFormulaGraphRuntime {
  readonly treeName: OfficialFormulaTreeName;
  private readonly recipe: OfficialFormulaExecutableRecipe | undefined;
  private vals: FormulaValue[] = [];
  private leafSlots: OfficialFormulaLeafSlot[] = [];
  private targetSlots: OfficialFormulaTargetSlot[] = [];
  private leafOverrides: Map<string, FormulaValue> = new Map();
  private _warnings: string[] = [];

  constructor(treeName: OfficialFormulaTreeName, recipe?: OfficialFormulaExecutableRecipe) {
    this.treeName = treeName;
    this.recipe = recipe;
    if (recipe) this._initFromRecipe(recipe);
  }

  private _initFromRecipe(recipe: OfficialFormulaExecutableRecipe): void {
    const maxId = [
      ...recipe.nodes.map((n) => n.exprId),
      ...recipe.leaves.map((l) => l.exprId),
      ...recipe.targets.map((t) => t.exprId),
    ].reduce((m, v) => Math.max(m, v), 0);

    this.vals = new Array(maxId + 1).fill(0);
    this.leafSlots = [...recipe.leaves];
    this.targetSlots = [...recipe.targets];

    const defaults = getDefaultFormulaLeafValues();
    for (const slot of this.leafSlots) {
      if (slot.defaultValue !== undefined) {
        this.vals[slot.exprId] = slot.defaultValue;
      } else if (typeof defaults[slot.leafName] === "number") {
        this.vals[slot.exprId] = defaults[slot.leafName];
      }
    }
  }

  setLeafValue(leafName: string, value: FormulaValue): void {
    this.leafOverrides.set(leafName, value);
    const slot = this.leafSlots.find((s) => s.leafName === leafName);
    if (slot !== undefined) this.vals[slot.exprId] = value;
  }

  update(): void {
    if (this.recipe) this._executeNodes(this.recipe);
  }

  private _executeNodes(recipe: OfficialFormulaExecutableRecipe): void {
    const vals = this.vals;
    const state = {
      vals,
      getExprVal(id: number): FormulaValue { return vals[id] ?? 0; },
      setVal(id: number, v: FormulaValue): void { vals[id] = v; },
    };
    const nodeMap = new Map<number, OfficialFormulaNodeRecipe>(
      recipe.nodes.map((n) => [n.exprId, n])
    );
    for (const exprId of recipe.updateOrder) {
      const n = nodeMap.get(exprId);
      if (!n) continue;
      executeNode(n, state);
    }
  }

  getTargetValue(targetName: string): FormulaValue | undefined {
    const slot = this.targetSlots.find((s) => s.targetName === targetName);
    return slot !== undefined ? this.vals[slot.exprId] : undefined;
  }

  getTerminalName(): string {
    return getPrimaryFormulaTargetBinding(this.treeName).targetName;
  }

  getTerminalSoulId(): number {
    return getPrimaryFormulaTargetBinding(this.treeName).soulId;
  }

  getStatus(): OfficialFormulaRuntimeStatus {
    if (!this.recipe) return "metadata-only";
    return this.recipe.scope as OfficialFormulaRuntimeStatus;
  }

  getUnresolvedLeaves(): string[] {
    if (!this.recipe) return [];
    const defaults = getDefaultFormulaLeafValues();
    return this.leafSlots
      .filter((s) => {
        if (this.leafOverrides.has(s.leafName)) return false;
        // No default at all — fully unresolved
        if (s.defaultValue === undefined && typeof defaults[s.leafName] !== "number") return true;
        // Has a fallback default but requires dynamic resolver for accurate results
        if (s.requiresResolver) return true;
        return false;
      })
      .map((s) => s.leafName);
  }

  getWarnings(): string[] { return [...this._warnings]; }

  getSnapshot(): OfficialFormulaRuntimeSnapshot {
    const leaves: Record<string, FormulaValue> = {};
    for (const s of this.leafSlots) leaves[s.leafName] = this.vals[s.exprId] ?? 0;
    const targets: Record<string, FormulaValue> = {};
    for (const s of this.targetSlots) targets[s.targetName] = this.vals[s.exprId] ?? 0;
    return {
      treeName: this.treeName,
      status: this.getStatus(),
      leaves,
      unresolvedLeaves: this.getUnresolvedLeaves(),
      targets,
      warnings: this.getWarnings(),
    };
  }
}

export function createRecipeRuntime(recipe: OfficialFormulaExecutableRecipe): OfficialFormulaGraphRuntime {
  return new OfficialFormulaGraphRuntime(recipe.treeName, recipe);
}

export function createMetadataOnlyRuntime(treeName: OfficialFormulaTreeName): OfficialFormulaGraphRuntime {
  return new OfficialFormulaGraphRuntime(treeName);
}

// ─── Node executor (inline, keeps FormulaNodes self-contained) ────────────────

type EvalState = { vals: FormulaValue[]; getExprVal(id: number): FormulaValue; setVal(id: number, v: FormulaValue): void };

function toNum(v: FormulaValue): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = parseFloat(v as string);
  return isNaN(n) ? 0 : n;
}

function applyBinop(lhs: number, op: string, rhs: number): number {
  switch (op) {
    case "+":  return lhs + rhs;
    case "-":  return lhs - rhs;
    case "*":  return lhs * rhs;
    case "/":  return rhs === 0 ? 0.0 : lhs / rhs;
    case "**": return Math.pow(lhs, rhs);
    case "<":  return lhs < rhs  ? 1.0 : 0.0;
    case "<=": return lhs <= rhs ? 1.0 : 0.0;
    case ">":  return lhs > rhs  ? 1.0 : 0.0;
    case ">=": return lhs >= rhs ? 1.0 : 0.0;
    case "==": return lhs === rhs ? 1.0 : 0.0;
    case "!=": return lhs !== rhs ? 1.0 : 0.0;
    case "||": return (lhs !== 0 || rhs !== 0) ? 1.0 : 0.0;
    default:   return lhs;
  }
}

function executeNode(n: OfficialFormulaNodeRecipe, s: EvalState): void {
  switch (n.nodeType) {
    case "NumberExpr":
      if (typeof n.value === "number") s.setVal(n.exprId, n.value);
      break;
    case "StringExpr":
      if (typeof n.value === "string") s.setVal(n.exprId, n.value);
      break;
    case "NameExpr": {
      const src = n.soulId ?? -1;
      if (src >= 0) s.setVal(n.exprId, s.getExprVal(src));
      break;
    }
    case "UnaryopExpr": {
      const child = toNum(s.getExprVal(n.childExprId ?? -1));
      s.setVal(n.exprId, (n.negate ?? false) ? child * -1 : child);
      break;
    }
    case "BinopListExpr": {
      let acc = toNum(s.getExprVal(n.firstExprId ?? 0));
      for (const { op, exprId: rId } of n.contents ?? []) {
        acc = applyBinop(acc, op, toNum(s.getExprVal(rId)));
      }
      s.setVal(n.exprId, acc);
      break;
    }
    case "FunctionExpr": {
      const args = (n.paramExprIds ?? []).map((id) => toNum(s.getExprVal(id)));
      s.setVal(n.exprId, callFormulaFunction(n.functionName as OfficialFormulaFunctionName, args));
      break;
    }
  }
}
