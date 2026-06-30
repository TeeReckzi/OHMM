/**
 * Formula function registry for the official Once Human formula engine.
 * paramCount === 0 means variable-argument.
 * random() must not call Math.random() — injected value is third arg.
 */

import type { OfficialFormulaFunctionName } from "./officialFormulaMetadata";

export type { OfficialFormulaFunctionName };

export type FormulaFunction = (...args: number[]) => number;

export interface FormulaFunctionBinding {
  name: OfficialFormulaFunctionName;
  /** 0 = variable args, otherwise exact count required */
  paramCount: number;
  fn: FormulaFunction;
}


const FORMULA_FUNCTION_BINDINGS: readonly FormulaFunctionBinding[] = [
  {
    name: "min",
    paramCount: 0,
    fn: (...args: number[]) => Math.min(...args),
  },
  {
    name: "max",
    paramCount: 0,
    fn: (...args: number[]) => Math.max(...args),
  },
  {
    name: "exp",
    paramCount: 1,
    fn: (x: number) => Math.exp(x),
  },
  {
    name: "pow",
    paramCount: 2,
    fn: (x: number, y: number) => Math.pow(x, y),
  },
  {
    name: "clamp",
    paramCount: 3,
    fn: (v: number, a: number, b: number) => Math.min(Math.max(v, a), b),
  },
  {
    name: "random",
    paramCount: 3,
    fn: (bottom: number, top: number, injectedRandom: number) => {
      const range = top - bottom;
      if (range < 0) return 0;
      return injectedRandom * range + bottom;
    },
  },
  {
    name: "floor",
    paramCount: 1,
    fn: (x: number) => Math.floor(x),
  },
  {
    name: "sqrt",
    paramCount: 1,
    fn: (x: number) => Math.sqrt(x),
  },
  {
    name: "abs",
    paramCount: 1,
    fn: (x: number) => Math.abs(x),
  },
];

// Build lookup map
const FORMULA_FUNCTION_MAP = new Map<OfficialFormulaFunctionName, FormulaFunctionBinding>(
  FORMULA_FUNCTION_BINDINGS.map((b) => [b.name, b])
);

export function getFormulaFunction(
  name: OfficialFormulaFunctionName
): FormulaFunctionBinding {
  const binding = FORMULA_FUNCTION_MAP.get(name);
  if (!binding) throw new Error(`Unknown formula function: "${name}"`);
  return binding;
}

export function callFormulaFunction(
  name: OfficialFormulaFunctionName,
  args: number[]
): number {
  const binding = getFormulaFunction(name);
  if (binding.paramCount !== 0 && args.length !== binding.paramCount) {
    throw new Error(
      `Formula function "${name}" expects ${binding.paramCount} arg(s) but received ${args.length}`
    );
  }
  return binding.fn(...args);
}

export function getAllFormulaFunctionNames(): OfficialFormulaFunctionName[] {
  return FORMULA_FUNCTION_BINDINGS.map((b) => b.name);
}
