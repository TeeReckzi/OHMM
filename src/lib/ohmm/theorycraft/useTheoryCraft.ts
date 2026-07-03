/**
 * Phase 4B Theorycraft UX — React Hook
 *
 * Wraps the pure orchestrator with useMemo for stable reference identity.
 * Lives in the theorycraft module — consumed by TheoryCraftPanel.
 *
 * Validates: Requirements 10.2, 10.4
 */

import { useMemo } from "react";
import type { BuildSelection } from "@/ohai/src/ui/types";
import type { CalculationInput } from "@/ohai/src/ui/formulaBridge";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import type { TheoryCraftState } from "./types";
import { computeTheoryCraftState } from "./orchestrator";

/**
 * React hook that derives the full TheoryCraftState from upstream inputs.
 *
 * Memoized on input references — only recomputes when buildSelection,
 * calcInput, or combatOutput change by reference identity.
 */
export function useTheoryCraft(
  buildSelection: BuildSelection,
  calcInput: CalculationInput,
  combatOutput: CombatOutput,
): TheoryCraftState {
  return useMemo(
    () => computeTheoryCraftState(buildSelection, calcInput, combatOutput),
    [buildSelection, calcInput, combatOutput],
  );
}
