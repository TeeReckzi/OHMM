/**
 * Formula node evaluators for the official Once Human formula engine.
 * Each node reads from and writes back to a flat vals[] array keyed by exprId.
 *
 * Operator rules:
 *   /  — safe division; returns 0.0 on divide-by-zero
 *   comparisons — return 1.0 (true) or 0.0 (false)
 *   || — truthy OR, not JS short-circuit
 *   BinopListExpr — left-to-right running accumulator
 */

import type { OfficialFormulaOperator, OfficialFormulaFunctionName } from "./officialFormulaMetadata";
import { callFormulaFunction } from "./officialFormulaFunctions";
import type { FormulaBinopContent } from "./officialFormulaGraphRecipes";

export type FormulaScalar = number | string | boolean;

export interface FormulaEvalState {
  vals: FormulaScalar[];
  getExprVal(exprId: number): FormulaScalar;
  setVal(exprId: number, value: FormulaScalar): void;
}

export interface FormulaNode {
  exprId: number;
  nodeType: string;
  update(state: FormulaEvalState): void;
}

export function createFormulaEvalState(initialVals: FormulaScalar[] = []): FormulaEvalState {
  const vals: FormulaScalar[] = [...initialVals];
  return {
    vals,
    getExprVal(exprId: number): FormulaScalar {
      return vals[exprId] ?? 0;
    },
    setVal(exprId: number, value: FormulaScalar): void {
      vals[exprId] = value;
    },
  };
}

// ─── NumberExpr ───────────────────────────────────────────────────────────────

export interface NumberExprNode extends FormulaNode {
  nodeType: "NumberExpr";
  literal?: number;
}

export function createNumberExpr(exprId: number, literal?: number): NumberExprNode {
  return {
    exprId,
    nodeType: "NumberExpr",
    literal,
    update(state: FormulaEvalState): void {
      if (literal !== undefined) {
        state.setVal(exprId, literal);
      }
      // else: value already lives in vals[] (leaf-injected)
    },
  };
}

// ─── StringExpr ───────────────────────────────────────────────────────────────

export interface StringExprNode extends FormulaNode {
  nodeType: "StringExpr";
  literal?: string;
}

export function createStringExpr(exprId: number, literal?: string): StringExprNode {
  return {
    exprId,
    nodeType: "StringExpr",
    literal,
    update(state: FormulaEvalState): void {
      if (literal !== undefined) {
        state.setVal(exprId, literal);
      }
    },
  };
}

// ─── NameExpr ─────────────────────────────────────────────────────────────────

export interface NameExprNode extends FormulaNode {
  nodeType: "NameExpr";
  /** Source slot. If <= -1, no-op. */
  soulId: number;
}

export function createNameExpr(exprId: number, soulId: number): NameExprNode {
  return {
    exprId,
    nodeType: "NameExpr",
    soulId,
    update(state: FormulaEvalState): void {
      if (soulId <= -1) return;
      state.setVal(exprId, state.getExprVal(soulId));
    },
  };
}

// ─── UnaryopExpr ─────────────────────────────────────────────────────────────

export interface UnaryopExprNode extends FormulaNode {
  nodeType: "UnaryopExpr";
  childExprId: number;
  negate: boolean;
}

export function createUnaryopExpr(exprId: number, childExprId: number, negate: boolean): UnaryopExprNode {
  return {
    exprId,
    nodeType: "UnaryopExpr",
    childExprId,
    negate,
    update(state: FormulaEvalState): void {
      const childVal = toNumber(state.getExprVal(childExprId));
      state.setVal(exprId, negate ? childVal * -1 : childVal);
    },
  };
}

// ─── BinopListExpr ────────────────────────────────────────────────────────────

export interface BinopListExprNode extends FormulaNode {
  nodeType: "BinopListExpr";
  /** First operand exprId; result accumulates left-to-right */
  firstExprId: number;
  contents: readonly FormulaBinopContent[];
}

export function createBinopListExpr(
  exprId: number,
  firstExprId: number,
  contents: readonly FormulaBinopContent[]
): BinopListExprNode {
  return {
    exprId,
    nodeType: "BinopListExpr",
    firstExprId,
    contents,
    update(state: FormulaEvalState): void {
      let acc = toNumber(state.getExprVal(firstExprId));
      for (const { op, exprId: rExprId } of contents) {
        const rhs = toNumber(state.getExprVal(rExprId));
        acc = applyBinop(acc, op, rhs);
      }
      state.setVal(exprId, acc);
    },
  };
}

// ─── FunctionExpr ─────────────────────────────────────────────────────────────

export interface FunctionExprNode extends FormulaNode {
  nodeType: "FunctionExpr";
  functionName: OfficialFormulaFunctionName;
  paramExprIds: readonly number[];
}

export function createFunctionExpr(
  exprId: number,
  functionName: OfficialFormulaFunctionName,
  paramExprIds: readonly number[]
): FunctionExprNode {
  return {
    exprId,
    nodeType: "FunctionExpr",
    functionName,
    paramExprIds,
    update(state: FormulaEvalState): void {
      const args = paramExprIds.map((pid) => toNumber(state.getExprVal(pid)));
      const result = callFormulaFunction(functionName, args);
      state.setVal(exprId, result);
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toNumber(v: FormulaScalar): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function applyBinop(lhs: number, op: OfficialFormulaOperator, rhs: number): number {
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
  }
}
