import type { CalculationInput, BridgedEffect } from "./formulaBridge";
import type { FormulaInput, FormulaResult, FormulaMultiplierBreakdown } from "../engine/formulaTypes";
import { buildFormulaInput } from "../engine/formulaContext";
import { calculateExpectedDamage } from "../engine/formulaApplicator";
import { aggregatedStatsToPartialRecord } from "../engine/modifierResolver";
import {
 createRuntimeAttackPayload,
 computeRuntimeFinalMultiplier,
 runtimeKeywordForMechanic,
 type RuntimeAttackPayload,
} from "../engine/runtimeAttackTypes";
import type { OfficialFormulaRuntimeStatus, FormulaValue } from "../engine/officialFormulaMetadata";
import {
 buildOfficialDamageFormulaLeaves,
 createRecipeRuntime,
} from "../engine/officialFormulaGraphRuntime";
import { DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE } from "../engine/officialFormulaGraphRecipes";
import { resolveDynamicLeaf } from "../engine/officialFormulaLeafResolvers";
import { resolveBridgeInjections } from "../engine/officialFormulaStatBridge";

export interface AdapterMechanicResult {
 mechanicId: string;
 formulaFamily: string;
 formulaInput: FormulaInput | null;
 formulaResult: FormulaResult | null;
 error: string | null;
 warnings: string[];
 runtimePayload?: RuntimeAttackPayload;
 /** Official formula leaves mapped for this mechanic */
 officialLeaves?: Record<string, FormulaValue>;
 /** Official leaves that could not be resolved */
 officialUnresolvedLeaves?: string[];
 /** Formula tree this mechanic maps to */
 officialFormulaTree?: "damage_formula";
 /** Terminal output name */
 officialFormulaTarget?: "final_attack";
 /** Execution depth of the official formula runtime for this mechanic */
 officialFormulaStatus?: OfficialFormulaRuntimeStatus;
 /** Damage computed by official graph runtime (terminal-only scope) */
 officialFormulaDamage?: number;
 /** Warnings from official formula execution */
 officialFormulaWarnings?: string[];
}

export interface FormulaDamageAdapterResult {
 primaryMechanic: AdapterMechanicResult;
 allMechanics: AdapterMechanicResult[];
 /**
  * Core damage value from the formula engine (calculateExpectedDamage or official graph fallback).
  * Semantics: in engine result paths, this is typically the "expectedDamage" which has already
  * folded the listed multipliers (baseDamage * product of >1 multipliers).
  * In some fallback paths (officialFormulaDamage), it may be the graph's final_attack terminal
  * before certain post-factors.
  * Consumers in UI (App.tsx) may re-apply multipliers for "effective" display metrics.
  * This is the primary handoff value for Damage/Shot projections.
  * @see buildExpectedDamageFromCalculationInput
  * @see formulaBridge.ts for input construction
  */
 formulaDamage: number;
 /**
  * Breakdown of post-base multipliers modeled by the engine for this mechanic.
  * Each entry: label (e.g. "Crit Modifier"), multiplier (>1.0 factors), source (stat provenance).
  * These are the factors the engine used (or lists) to derive expected from base.
  * NOT "external only" — includes crit/weak, vuln, bonus stats etc that engine applies.
  * UI layer often recomputes product(totalMult) from this list.
  */
 formulaMultipliers: FormulaMultiplierBreakdown[];
 tickIntervalSeconds: number | undefined;
 warnings: string[];
 supportingGear: string[];
 excludedItems: string[];
 /** Runtime combat metadata for the primary mechanic */
 primaryRuntimeMultiplier?: number;
}

const MECHANIC_PRIORITY = [
 "physicalWeapon", "burn", "powerSurge", "frostVortex",
 "unstableBomber", "chargedHybridStatusShot",
];

function extractGearNames(effects: BridgedEffect[]): string[] {
 const names: string[] = [];
 for (const eff of effects) {
  if (eff.contributesModifiers && eff.modifierCount > 0) {
   names.push(eff.itemName);
  }
 }
 return names;
}

/**
 * BOUNDARY HANDOFF (formulaDamageAdapter):
 * 
 * formulaDamage comes from:
 *  primary.formulaResult.expectedDamage (from engine/calculateExpectedDamage via formulaApplicator)
 *   OR fallback primary.officialFormulaDamage (from independent partial-graph run of official formula)
 * 
 * formulaMultipliers come from:
 *  primary.formulaResult.multipliers (list emitted alongside the expectedDamage)
 * 
 * Engine contract (see formulaApplicator.ts + formulaExplainer.ts + officialFormulaBridge.ts):
 *  - baseDamage: pre-multiplier quantity (e.g. weapon * atk%, or psi * factor)
 *  - expectedDamage: baseDamage * product of (multipliers where >1)
 *  - multipliers: the >1 factors broken out (crit expected, weapon/status/elemental bonuses, vuln, enemyType, etc.)
 *   These are factors the *engine models*, not purely "post processing unknown to engine".
 * 
 * The adapter also injects some official graph leaves (weaponDMGBonus etc as add_rate) and then
 * the bridge may re-list some as multipliers and multiply again for the returned expected.
 * 
 * UI consumers:
 *  - App.tsx + panels: use formulaDamage (engine's already-multiplied expectedDamage) for the primary damage number.
 *  - The formulaMultipliers list is provided for breakdown / explanation UIs.
 *  - combatOutput uses it directly.
 *
 * Chef Rex: applied upstream in resolvers.
 *
 * formulaDamage = the engine's post-multiplier expected value.
 */
export function buildExpectedDamageFromCalculationInput(
 input: CalculationInput,
 baseWeaponDMG?: number,
 critEnabled?: boolean,
 weakspotEnabled?: boolean,
): FormulaDamageAdapterResult {
 const warnings: string[] = [];
 const allResults: AdapterMechanicResult[] = [];
 const excludedItems: string[] = [];

 // Gear names from modeled effects (for mechanic overrides)
 const contributingGear = extractGearNames(input.modeledEffects);
 const partialContributingGear = extractGearNames(input.partiallyModeledEffects);
 const supportingGear = [...contributingGear, ...partialContributingGear];

 // Player stats from aggregation report
 const playerStats = aggregatedStatsToPartialRecord(input.aggregationReport.stats);

 const aggregatedWeaponDmg = playerStats.weaponDMG;

 // Override base weapon DMG if provided
 if (baseWeaponDMG !== undefined && baseWeaponDMG > 0) {
  playerStats.weaponDMG = baseWeaponDMG;
 }

 // Some food/deviation rows use weaponDMG as a percent-style buff. Preserve those as a bonus
 // before weaponDMG is replaced by base attack. Flat oversized values are ignored here.
 if (aggregatedWeaponDmg !== undefined && aggregatedWeaponDmg > 0 && aggregatedWeaponDmg <= 5) {
  playerStats.weaponDMGBonus = (playerStats.weaponDMGBonus ?? 0) + aggregatedWeaponDmg;
 }

 // Inject weapon base crit rate if not overridden by modifiers
 if (input.baseCritRate !== undefined && (playerStats.critRate === undefined || playerStats.critRate === 0)) {
  playerStats.critRate = input.baseCritRate;
 }
 // Inject weapon base crit damage if not overridden
 if (input.baseCritDamage !== undefined && (playerStats.critDMG === undefined || playerStats.critDMG === 0)) {
  playerStats.critDMG = input.baseCritDamage;
 }
 // Inject weapon base weakspot damage if not overridden
 if (input.baseWeakspotDamage !== undefined && (playerStats.weakspotDMG === undefined || playerStats.weakspotDMG === 0)) {
  playerStats.weakspotDMG = input.baseWeakspotDamage;
 }

 // Determine mechanics to compute
 const mechanics = input.availableMechanics.length > 0
  ? sortByPriority(input.availableMechanics)
  : ["physicalWeapon"];

 // Track item exclusion (display-only and unresolved)
 for (const eff of input.displayOnlyEffects) {
  excludedItems.push(`${eff.itemName} (display-only)`);
 }
 for (const eff of input.unresolvedEffects) {
  excludedItems.push(`${eff.itemName} (unresolved mechanics)`);
 }
 for (const eff of input.ignoredEffects) {
  excludedItems.push(`${eff.itemName} (ignored)`);
 }

 // Extract damage model override from custom combat assumptions
 const damageModelOverride = input.customCombatAssumptions?.damageModelOverride;

 for (const mechanicId of mechanics) {
  const gearNames = [...supportingGear];
  const fi = buildFormulaInput(mechanicId, playerStats, gearNames);
  // Pass damage model override through to FormulaInput
  if (!("error" in fi) && damageModelOverride) {
   fi.damageModelOverride = damageModelOverride;
  }
  const runtimePayload = mechanicResultToRuntimePayload(mechanicId, input);

  if ("error" in fi) {
   const officialFields = buildOfficialFormulaFields(mechanicId, null, runtimePayload, baseWeaponDMG, playerStats);
   allResults.push({
    mechanicId,
    formulaFamily: "unsupported",
    formulaInput: null,
    formulaResult: null,
    error: fi.error,
    warnings: [],
    runtimePayload,
    ...officialFields,
   });
   continue;
  }

  // Apply crit/weakspot context
  if (critEnabled !== undefined && fi.effectiveBehavior.canCrit !== critEnabled) {
   warnings.push(`[${mechanicId}] Crit context override applied: canCrit=${critEnabled}. Base behavior: canCrit=${fi.effectiveBehavior.canCrit}.`);
  }
  if (weakspotEnabled !== undefined && fi.effectiveBehavior.canWeakspot !== weakspotEnabled) {
   warnings.push(`[${mechanicId}] Weakspot context override applied: canWeakspot=${weakspotEnabled}. Base behavior: canWeakspot=${fi.effectiveBehavior.canWeakspot}.`);
  }

  const result = calculateExpectedDamage(fi);
  const resultWarnings: string[] = [];
  for (const w of result.warnings) {
   resultWarnings.push(`[${mechanicId}] ${w}`);
  }

  const officialFields = buildOfficialFormulaFields(mechanicId, fi, runtimePayload, baseWeaponDMG, playerStats);
  allResults.push({
   mechanicId,
   formulaFamily: result.formulaFamily,
   formulaInput: fi,
   formulaResult: result,
   error: null,
   warnings: resultWarnings,
   runtimePayload,
   ...officialFields,
  });
 }

 // Primary mechanic = first available, or first in priority
 const primary = allResults[0] ?? {
  mechanicId: "none",
  formulaFamily: "unsupported",
  formulaInput: null,
  formulaResult: null,
  error: "No mechanics available",
  warnings: [],
 };

 // Extract formula damage and multipliers from primary
 let formulaDamage = 0;
 let formulaMultipliers: FormulaMultiplierBreakdown[] = [];
 let tickIntervalSeconds: number | undefined;

 if (primary.formulaResult && !primary.error) {
  formulaDamage = primary.formulaResult.expectedDamage;
  formulaMultipliers = primary.formulaResult.multipliers;

  if (formulaDamage <= 0 && primary.officialFormulaDamage !== undefined && primary.officialFormulaDamage > 0) {
   formulaDamage = primary.officialFormulaDamage;
   warnings.push(
    '[' + primary.mechanicId + '] Legacy mechanic formula returned 0; using recovered official base attack fallback for displayed damage.'
   );
  }

  // Extract tick interval from burn details if available
  if (primary.formulaResult.burnDetails) {
   tickIntervalSeconds = primary.formulaResult.burnDetails.effectiveTickIntervalSeconds;
  } else if (primary.formulaInput && primary.formulaInput.effectiveBehavior.tickIntervalSeconds) {
   tickIntervalSeconds = primary.formulaInput.effectiveBehavior.tickIntervalSeconds;
  }
 }

 if (formulaDamage <= 0 && primary.officialFormulaDamage !== undefined && primary.officialFormulaDamage > 0) {
  formulaDamage = primary.officialFormulaDamage;
  if (!warnings.some((w) => w.includes('official base attack fallback'))) {
   warnings.push(
    '[' + primary.mechanicId + '] Legacy mechanic formula returned 0; using recovered official base attack fallback for displayed damage.'
   );
  }
 }

 // Add all result warnings
 for (const r of allResults) {
  for (const w of r.warnings) {
   if (!warnings.includes(w)) warnings.push(w);
  }
 }

 // Compute runtime final multiplier for primary mechanic
 let primaryRuntimeMultiplier: number | undefined;
 if (primary.runtimePayload) {
  primaryRuntimeMultiplier = computeRuntimeFinalMultiplier(primary.runtimePayload);
 }

 // Missing base weapon DMG warning
 if (baseWeaponDMG === undefined || baseWeaponDMG <= 0) {
  warnings.push("No base weapon damage provided. Expected damage computed from available modifiers only — may be incomplete.");
 }

 return {
  primaryMechanic: primary,
  allMechanics: allResults,
  formulaDamage,
  formulaMultipliers,
  tickIntervalSeconds,
  warnings,
  supportingGear,
  excludedItems,
  primaryRuntimeMultiplier,
 };
}

function buildOfficialFormulaFields(
 mechanicId: string,
 formulaInput: FormulaInput | null,
 runtimePayload: RuntimeAttackPayload,
 baseWeaponDMG?: number,
 playerStats?: Partial<Record<string, number>>,
): Pick<AdapterMechanicResult,
 | "officialLeaves"
 | "officialUnresolvedLeaves"
 | "officialFormulaTree"
 | "officialFormulaTarget"
 | "officialFormulaStatus"
 | "officialFormulaDamage"
 | "officialFormulaWarnings"
> {
 const officialFormulaWarnings: string[] = [];

 const isDamageMechanic = !mechanicId.toLowerCase().includes("heal")
  && !mechanicId.toLowerCase().includes("cure");

 if (!isDamageMechanic) {
  return {
   officialFormulaStatus: "metadata-only",
   officialFormulaWarnings: ["Non-damage mechanic: official formula tree not damage_formula"],
  };
 }

 // Use the remote's richer leaf context builder
 const officialLeaves = buildOfficialDamageFormulaLeaves({
  formulaAttackType: runtimePayload.formulaAttackType,
  attack: baseWeaponDMG ?? formulaInput?.baseWeaponDMG ?? 0,
  critRate: formulaInput?.critRate ?? 0,
  weakRate: formulaInput?.weakspotDMG ?? 0,
  randomSeed: 0,
  elementType: runtimePayload.elementType,
  keywordType: runtimePayload.keyword,
  pvpAdjustFactor: runtimePayload.pvpDamageRate,
  useFinalDamageAddRate: runtimePayload.useFinalDamageAddRate,
  useFinalIgnoreDamageRate: runtimePayload.useFinalIgnoreDamageRate,
 }) as Record<string, FormulaValue>;

 const baseAttack = typeof officialLeaves["attack"] === "number"
  ? officialLeaves["attack"]
  : 0;

 // Run partial-graph recipe (final_attack_additional_rate branch connected)
 const unresolvedLeaves: string[] = [];
 let officialFormulaDamage: number | undefined;

 if (baseAttack > 0) {
  try {
   const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);
   rt.setLeafValue("base_attack", baseAttack);
   const weaponAddRate = formulaInput?.weaponDMGBonus ?? 0;
   if (weaponAddRate !== 0) rt.setLeafValue("weapon_attack_add_rate", weaponAddRate);

   const resolverContext = {
    formula_attack_type: typeof officialLeaves["formula_attack_type"] === "number"
     ? officialLeaves["formula_attack_type"] as number
     : undefined,
    element_type: officialLeaves["element_type"] as string | number | undefined,
    keyword_type: officialLeaves["keyword_type"] as string | number | undefined,
    gun_type: officialLeaves["gun_type"] as string | number | undefined,
   };

   const resolvedAttrNames: Record<string, string> = {};
   const tagResolvedLeaves = [
    "attack_type_dam_add_rate",
    "gun_type_dam_add_rate",
    "element_type_dam_add_rate",
    "keyword_proc_dam_add_rate",
   ];
   for (const leafName of tagResolvedLeaves) {
    const resolution = resolveDynamicLeaf(leafName, resolverContext);
    if (resolution.resolvedAttrName) {
     resolvedAttrNames[leafName] = resolution.resolvedAttrName;
    }
   }

   const bridgeReport = resolveBridgeInjections(resolvedAttrNames, playerStats ?? null);
   for (const [leafName, value] of Object.entries(bridgeReport.injections)) {
    if (value !== 0) rt.setLeafValue(leafName, value);
   }
   for (const w of bridgeReport.warnings) {
    officialFormulaWarnings.push(w);
   }

   rt.update();
   const result = rt.getTargetValue("final_attack");
   officialFormulaDamage = typeof result === "number" ? result : undefined;
   unresolvedLeaves.push(...rt.getUnresolvedLeaves());
  } catch (err) {
   officialFormulaWarnings.push(
    `Official formula partial-graph execution failed: ${err instanceof Error ? err.message : String(err)}`
   );
  }
 } else {
  officialFormulaWarnings.push(
   "attack = 0 — official formula damage not computed; provide base weapon DMG"
  );
 }

 if (unresolvedLeaves.length > 0) {
  officialFormulaWarnings.push(
   `Dynamic leaves unresolved (tag tables needed, defaulting to 0): ${unresolvedLeaves.filter((l) => l !== "base_attack").join(", ")}`
  );
 }
 officialFormulaWarnings.push(
  "weapon_attack_add_rate sourced from weaponDMGBonus (medium confidence mapping — not directly recovered)",
  "final_attack_ignore_dam_rate and final_special_regulate_factor are leaves (sub-graph not yet connected)"
 );

 return {
  officialLeaves,
  officialUnresolvedLeaves: unresolvedLeaves,
  officialFormulaTree: "damage_formula",
  officialFormulaTarget: "final_attack",
  officialFormulaStatus: "partial-graph",
  officialFormulaDamage,
  officialFormulaWarnings,
 };
}

function mechanicResultToRuntimePayload(
 mechanicId: string,
 calcInput: CalculationInput,
): RuntimeAttackPayload {
 const keyword = runtimeKeywordForMechanic(mechanicId);
 const isBurnOrSurge = keyword === "SCORCH" || keyword === "SURGE";
 return createRuntimeAttackPayload({
  formulaTreeName: "damage_formula",
  keyword,
  isKeywordDamage: keyword !== "NONE",
  damageFeatureType: isBurnOrSurge ? "durative" : "direct",
  elementType: keyword === "SCORCH" ? "blaze" : keyword === "VORTEX" ? "frost" : keyword === "SURGE" ? "shock" : "physical",
  formulaAttackType: keyword === "SCORCH" ? "dot" : "normal",
  pvpDamageRate: calcInput.buildMode === "pvp" ? 0.6 : 1,
  sourceBehavior: `bridge-${mechanicId}`,
  notes: `Auto-generated from formula bridge for mechanic "${mechanicId}"`,
  critAttack: false,
  weakAttack: false,
 });
}

function mechanicResultToOfficialLeaves(
 runtimePayload: RuntimeAttackPayload,
 formulaInput: FormulaInput | { error: string },
 baseWeaponDMG?: number,
): Record<string, FormulaValue> {
 const isFormulaInput = !("error" in formulaInput);
 return buildOfficialDamageFormulaLeaves({
  formulaAttackType: runtimePayload.formulaAttackType,
  attack: baseWeaponDMG ?? (isFormulaInput ? formulaInput.baseWeaponDMG ?? 0 : 0),
  critRate: isFormulaInput ? formulaInput.critRate ?? 0 : 0,
  weakRate: isFormulaInput ? formulaInput.weakspotDMG ?? 0 : 0,
  randomSeed: 0,
  elementType: runtimePayload.elementType,
  keywordType: runtimePayload.keyword,
  pvpAdjustFactor: runtimePayload.pvpDamageRate,
  useFinalDamageAddRate: runtimePayload.useFinalDamageAddRate,
  useFinalIgnoreDamageRate: runtimePayload.useFinalIgnoreDamageRate,
  damage_feature_type: runtimePayload.damageFeatureType,
  formula_attack_type: runtimePayload.formulaAttackTypeCode,
 });
}

function sortByPriority(mechanics: string[]): string[] {
 return [...mechanics].sort((a, b) => {
  const ia = MECHANIC_PRIORITY.indexOf(a);
  const ib = MECHANIC_PRIORITY.indexOf(b);
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
 });
}
