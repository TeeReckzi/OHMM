import type { ProcSource } from "./procTypes";

const procRegistry = new Map<string, ProcSource>();

export function registerProcSource(proc: ProcSource): void {
  procRegistry.set(proc.procId, proc);
}

export function getInternalRegistry(): ReadonlyMap<string, ProcSource> {
  return procRegistry;
}

registerProcSource({
  procId: "ebr_fire_ring",
  displayName: "EBR Grilled Octopus Fire Ring",
  sourceType: "weapon",
  sourceId: "ebr_grilled_octopus",
  trigger: "Full Burn stacks achieved on target",
  generatedMechanicId: "burn",
  generatedFormulaFamily: "status_tick_damage",
  element: "blaze",
  damageScalingBucket: "status",
  canCrit: false,
  canWeakspot: false,
  confidence: "reported_current_patch_needs_testing",
  needsRetest: true,
  notes:
    "Fire ring is a separate conditional explosion when Burn reaches max stacks on a target. Not a Burn tick \u2014 uses Burn-style formula provisionally until fire ring formula is modeled.",
  source: {
    kind: "in_game_observation",
    label: "EBR Grilled Octopus unique mechanic",
    note: "Separate from Gilded Gloves crit-on-Burn mechanic. Fire ring is an extra damage event, not a crit instance.",
  },
  procKind: "conditionalExplosion",
  scalingSource: "unknown",
});
