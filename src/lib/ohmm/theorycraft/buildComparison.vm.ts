/**
 * Phase 4B Theorycraft UX — Build Comparison View Model
 *
 * Pure derivation: compares the current BuildSelection + CombatOutput against
 * a saved build. Computes metric deltas and slot-by-slot diffs.
 *
 * Never mutates inputs. Never throws — returns safe defaults on any error.
 * No React or DOM dependencies.
 */

import type { BuildSelection } from "@/ohai/src/ui/types";
import { getArmorSelectionId } from "@/ohai/src/ui/types";
import type { CombatOutput } from "@/ohai/src/ui/combatOutput";
import { computeCombatOutput } from "@/ohai/src/ui/combatOutput";
import { buildCalculationInputFromSelection } from "@/ohai/src/ui/formulaBridge";
import { compareCombatOutputs } from "@/ohai/src/ui/combatOutputComparison";
import { validateSavedBuild, type SavedBuild } from "@/ohai/src/ui/savedBuildSchema";
import type {
  BuildComparisonViewModel,
  MetricDelta,
  SlotDiff,
  DeltaDirection,
} from "./types";
import { ARMOR_SLOTS, EMPTY_STATE_MESSAGES } from "./constants";
import { formatDelta } from "./utils";

// ─── Safe default result ─────────────────────────────────────────────────────

const UNAVAILABLE_RESULT: BuildComparisonViewModel = {
  currentBuildName: "",
  savedBuildName: "",
  metricDeltas: [],
  slotDiffs: [],
  isAvailable: false,
  errorMessage: null,
  emptyStateMessage: EMPTY_STATE_MESSAGES.buildComparison,
};

// ─── Direction helpers ───────────────────────────────────────────────────────

function deltaDirection(value: number): DeltaDirection {
  if (value > 0) return "gain";
  if (value < 0) return "loss";
  return "unchanged";
}

function directionIcon(direction: DeltaDirection): "arrow-up" | "arrow-down" | "minus" {
  switch (direction) {
    case "gain": return "arrow-up";
    case "loss": return "arrow-down";
    case "unchanged": return "minus";
  }
}

// ─── Slot comparison helpers ─────────────────────────────────────────────────

function getWeaponId(build: BuildSelection): string {
  return build.weapon?.blueprintId ?? "";
}

function getModValue(build: BuildSelection, key: string): string {
  // Prefer modSelections (new format), fall back to legacy mods
  const msVal = (build.modSelections as Record<string, string | undefined> | undefined)?.[key];
  if (msVal && msVal !== "none") return msVal;
  const legacyVal = (build.mods as Record<string, string | undefined>)?.[key];
  return legacyVal && legacyVal !== "none" ? legacyVal : "";
}

function getFoodId(build: BuildSelection): string {
  return build.food?.food ?? "";
}

function getDrinkId(build: BuildSelection): string {
  return build.food?.drink ?? "";
}

function getDeviantId(build: BuildSelection): string {
  return build.deviant?.id ?? "";
}

function getCradleKey(build: BuildSelection): string {
  return (build.cradle?.perks ?? []).sort().join(",");
}

function slotItemName(id: string): string {
  return id || "Empty";
}

// ─── Main derivation ─────────────────────────────────────────────────────────

/**
 * Derives a BuildComparisonViewModel from the current build state and an
 * optional saved build. Pure function — never mutates inputs, never throws.
 */
export function deriveBuildComparison(
  currentSelection: BuildSelection,
  currentOutput: CombatOutput,
  savedBuild: SavedBuild | null,
): BuildComparisonViewModel {
  // 1. No saved build → empty state
  if (savedBuild === null || savedBuild === undefined) {
    return {
      ...UNAVAILABLE_RESULT,
      currentBuildName: currentSelection?.label ?? "",
    };
  }

  // 2. Validate saved build against schema
  const validation = validateSavedBuild(savedBuild);
  if (!validation.success) {
    return {
      currentBuildName: currentSelection?.label ?? "",
      savedBuildName: (savedBuild as any)?.buildName ?? "",
      metricDeltas: [],
      slotDiffs: [],
      isAvailable: false,
      errorMessage: `Saved build is incompatible: ${validation.error}`,
      emptyStateMessage: null,
    };
  }

  const validatedSaved = validation.build;

  try {
    // 3. Compute saved build's combat output independently
    const savedCalcInput = buildCalculationInputFromSelection(
      validatedSaved.build,
      validatedSaved.gameMode ?? "pve",
      validatedSaved.pveTargetId,
      (validatedSaved.uptimeProfile as any) ?? undefined,
      (validatedSaved.customAssumptions as any) ?? undefined,
    );
    const savedOutput = computeCombatOutput(savedCalcInput, savedCalcInput.pvpMitigation);

    // 4. Compute metric deltas using existing compareCombatOutputs
    //    NOTE: compareCombatOutputs(before, after) — saved is "before", current is "after"
    const rawDeltas = compareCombatOutputs(savedOutput, currentOutput);

    // 5. Build metric delta view models
    const metricDeltas: MetricDelta[] = buildMetricDeltas(rawDeltas, currentOutput, savedOutput);

    // 6. Walk each loadout slot for slot diffs
    const slotDiffs: SlotDiff[] = buildSlotDiffs(currentSelection, validatedSaved.build);

    return {
      currentBuildName: currentSelection.label ?? "Current Build",
      savedBuildName: validatedSaved.buildName ?? "Saved Build",
      metricDeltas,
      slotDiffs,
      isAvailable: true,
      errorMessage: null,
      emptyStateMessage: null,
    };
  } catch {
    // Never throw — return safe error state
    return {
      currentBuildName: currentSelection?.label ?? "",
      savedBuildName: validatedSaved?.buildName ?? "",
      metricDeltas: [],
      slotDiffs: [],
      isAvailable: false,
      errorMessage: "Failed to compute build comparison — engine error.",
      emptyStateMessage: null,
    };
  }
}

// ─── Metric delta construction ───────────────────────────────────────────────

function buildMetricDeltas(
  rawDeltas: ReturnType<typeof compareCombatOutputs>,
  currentOutput: CombatOutput,
  savedOutput: CombatOutput,
): MetricDelta[] {
  const deltas: MetricDelta[] = [];

  // DPS
  const dpsDirection = deltaDirection(rawDeltas.dpsDelta);
  deltas.push({
    label: "DPS",
    currentValue: formatMetricValue(currentOutput.damageOutput.DPS),
    savedValue: formatMetricValue(savedOutput.damageOutput.DPS),
    delta: formatDelta(rawDeltas.dpsDelta),
    direction: dpsDirection,
    icon: directionIcon(dpsDirection),
  });

  // Expected Damage
  const dmgDirection = deltaDirection(rawDeltas.outgoingDamageDelta);
  deltas.push({
    label: "Expected Damage",
    currentValue: formatMetricValue(currentOutput.damageOutput.expectedDamage),
    savedValue: formatMetricValue(savedOutput.damageOutput.expectedDamage),
    delta: formatDelta(rawDeltas.outgoingDamageDelta),
    direction: dmgDirection,
    icon: directionIcon(dmgDirection),
  });

  // TTK (if available)
  if (rawDeltas.ttkDelta !== undefined) {
    // For TTK, lower is better — so we invert the direction
    const ttkRawDirection = deltaDirection(rawDeltas.ttkDelta);
    // A negative TTK delta means you kill faster = gain
    const ttkDirection: DeltaDirection =
      ttkRawDirection === "gain" ? "loss" :
      ttkRawDirection === "loss" ? "gain" :
      "unchanged";
    deltas.push({
      label: "Time to Kill",
      currentValue: formatMetricValue(currentOutput.pvpDuel.outgoingTTK),
      savedValue: formatMetricValue(savedOutput.pvpDuel.outgoingTTK),
      delta: formatDelta(rawDeltas.ttkDelta, 2),
      direction: ttkDirection,
      icon: directionIcon(ttkDirection),
    });
  }

  return deltas;
}

function formatMetricValue(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ─── Slot diff construction ──────────────────────────────────────────────────

function buildSlotDiffs(current: BuildSelection, saved: BuildSelection): SlotDiff[] {
  const diffs: SlotDiff[] = [];

  // Weapon
  const currentWeapon = getWeaponId(current);
  const savedWeapon = getWeaponId(saved);
  diffs.push({
    slot: "weapon",
    currentItem: slotItemName(currentWeapon),
    savedItem: slotItemName(savedWeapon),
    hasChanged: currentWeapon !== savedWeapon,
  });

  // Armor slots (head, mask, chest, gloves, pants, boots)
  for (const slot of ARMOR_SLOTS) {
    const currentId = getArmorSelectionId(current.armor?.[slot]);
    const savedId = getArmorSelectionId(saved.armor?.[slot]);
    diffs.push({
      slot,
      currentItem: slotItemName(currentId),
      savedItem: slotItemName(savedId),
      hasChanged: currentId !== savedId,
    });
  }

  // Mods (compare core + suffix per slot)
  const modSlots = ["weapon", "head", "mask", "chest", "gloves", "pants", "boots"] as const;
  for (const slot of modSlots) {
    const currentCore = getModValue(current, `${slot}Core`);
    const savedCore = getModValue(saved, `${slot}Core`);
    const currentSuffix = getModValue(current, `${slot}Suffix`);
    const savedSuffix = getModValue(saved, `${slot}Suffix`);
    const hasChanged = currentCore !== savedCore || currentSuffix !== savedSuffix;
    const currentLabel = [currentCore, currentSuffix].filter(Boolean).join(" + ") || "Empty";
    const savedLabel = [savedCore, savedSuffix].filter(Boolean).join(" + ") || "Empty";
    diffs.push({
      slot: `${slot}Mod`,
      currentItem: currentLabel,
      savedItem: savedLabel,
      hasChanged,
    });
  }

  // Food
  const currentFood = getFoodId(current);
  const savedFood = getFoodId(saved);
  diffs.push({
    slot: "food",
    currentItem: slotItemName(currentFood),
    savedItem: slotItemName(savedFood),
    hasChanged: currentFood !== savedFood,
  });

  // Drink
  const currentDrink = getDrinkId(current);
  const savedDrink = getDrinkId(saved);
  diffs.push({
    slot: "drink",
    currentItem: slotItemName(currentDrink),
    savedItem: slotItemName(savedDrink),
    hasChanged: currentDrink !== savedDrink,
  });

  // Deviant
  const currentDeviant = getDeviantId(current);
  const savedDeviant = getDeviantId(saved);
  diffs.push({
    slot: "deviant",
    currentItem: slotItemName(currentDeviant),
    savedItem: slotItemName(savedDeviant),
    hasChanged: currentDeviant !== savedDeviant,
  });

  // Cradle
  const currentCradle = getCradleKey(current);
  const savedCradle = getCradleKey(saved);
  diffs.push({
    slot: "cradle",
    currentItem: currentCradle || "Empty",
    savedItem: savedCradle || "Empty",
    hasChanged: currentCradle !== savedCradle,
  });

  return diffs;
}
