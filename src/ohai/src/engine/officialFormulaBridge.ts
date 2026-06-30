import type { FormulaInput, FormulaResult, FormulaMultiplierBreakdown } from "./formulaTypes";
import { computeExpectedCritMultiplier, computeExpectedWeakspotMultiplier } from "./formulaTypes";
import { FORMULA_TARGETS } from "./officialFormulaMetadata";
import { DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE } from "./officialFormulaGraphRecipes";
import { createRecipeRuntime } from "./officialFormulaGraphRuntime";
import { resolveDynamicLeaf, type DynamicLeafResolverContext } from "./officialFormulaLeafResolvers";
import { resolveBridgeInjections } from "./officialFormulaStatBridge";
import type { StatKey } from "../schemas/buildGoalSchema";

export interface OfficialBridgeContext {
  formulaAttackType?: DynamicLeafResolverContext["formula_attack_type"];
  keywordType?: DynamicLeafResolverContext["keyword_type"];
  elementType?: DynamicLeafResolverContext["element_type"];
  gunType?: DynamicLeafResolverContext["gun_type"];
  speciesType?: DynamicLeafResolverContext["species_type"];
  damageFeatureType?: DynamicLeafResolverContext["damage_feature_type"];
  damageMaterialType?: DynamicLeafResolverContext["damage_material_type"];
  armorType?: DynamicLeafResolverContext["armor_type"];
  attackerAllDebuffState?: DynamicLeafResolverContext["attacker_all_debuff_state"];
  targetAllDebuffState?: DynamicLeafResolverContext["target_all_debuff_state"];
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function snapshotBehavior(input: FormulaInput): FormulaResult["effectiveBehavior"] {
  const eb = input.effectiveBehavior;
  return {
    canCrit: eb.canCrit,
    canWeakspot: eb.canWeakspot,
    critWeakspotBucket: eb.critWeakspotBucket,
    damageScalingBucket: eb.damageScalingBucket,
    scalingStat: eb.scalingStat,
    vulnerabilityType: eb.vulnerabilityType,
    baseFactor: eb.baseFactor,
    appliedOverrides: eb.appliedOverrides
      .filter((ao) => ao.wasApplied)
      .map((ao) => ao.override.overrideId),
  };
}

export function calculateOfficialPhysicalDamage(
  input: FormulaInput,
  playerStats: Partial<Record<StatKey, number>>,
  context?: OfficialBridgeContext,
): FormulaResult | null {
  const eb = input.effectiveBehavior;
  const baseWeaponDMG = input.baseWeaponDMG ?? 0;
  const atkPct = input.attackPercent ?? 0;
  const baseAttack = baseWeaponDMG * (1 + atkPct);

  if (baseAttack <= 0) return null;

  try {
    const rt = createRecipeRuntime(DAMAGE_FORMULA_PARTIAL_GRAPH_V2_RECIPE);

    rt.setLeafValue("base_attack", baseAttack);

    const weaponAddRate = input.weaponDMGBonus ?? 0;
    if (weaponAddRate !== 0) rt.setLeafValue("weapon_attack_add_rate", weaponAddRate);

    const speciesDamAddRate = input.enemyTypeDMGBonus ?? 0;
    if (speciesDamAddRate !== 0) rt.setLeafValue("species_dam_add_rate", speciesDamAddRate);

    const humanDamAddRate = input.humanDamageBonus ?? 0;
    if (humanDamAddRate !== 0) rt.setLeafValue("human_dam_add_rate", humanDamAddRate);

    const resolverContext: DynamicLeafResolverContext = {
      formula_attack_type: context?.formulaAttackType,
      keyword_type: context?.keywordType,
      element_type: context?.elementType,
      gun_type: context?.gunType,
      species_type: context?.speciesType,
      damage_feature_type: context?.damageFeatureType,
      damage_material_type: context?.damageMaterialType,
      armor_type: context?.armorType,
      attacker_all_debuff_state: context?.attackerAllDebuffState,
      target_all_debuff_state: context?.targetAllDebuffState,
    };

    const tagResolvedLeaves = [
      "attack_type_dam_add_rate",
      "gun_type_dam_add_rate",
      "element_type_dam_add_rate",
      "keyword_proc_dam_add_rate",
    ];

    const resolvedAttrNames: Record<string, string> = {};
    for (const leafName of tagResolvedLeaves) {
      const resolution = resolveDynamicLeaf(leafName, resolverContext);
      if (resolution.resolvedAttrName) {
        resolvedAttrNames[leafName] = resolution.resolvedAttrName;
      }
    }

    const bridgeReport = resolveBridgeInjections(resolvedAttrNames, playerStats);
    for (const [leafName, value] of Object.entries(bridgeReport.injections)) {
      if (value !== 0) rt.setLeafValue(leafName, value);
    }

    rt.update();
    const finalAttack = rt.getTargetValue(FORMULA_TARGETS.FINAL_ATTACK);
    const officialBaseDamage = typeof finalAttack === "number" ? finalAttack : 0;

    if (officialBaseDamage <= 0) return null;

    const multipliers: FormulaMultiplierBreakdown[] = [];
    let product = 1.0;

    const addMult = (label: string, mult: number, source: string) => {
      if (mult === 1.0) return;
      multipliers.push({ label, multiplier: round2(mult), source });
      product *= mult;
    };

    addMult("Weapon DMG Bonus", 1 + weaponAddRate,
      `player stat: weaponDMGBonus=${weaponAddRate.toFixed(3)}`);

    const attackTypeVal = bridgeReport.injections["attack_type_dam_add_rate"] ?? 0;
    if (attackTypeVal !== 0) {
      addMult("Attack Type DMG Bonus", 1 + attackTypeVal,
        `resolved attack_type_dam_add_rate=${attackTypeVal.toFixed(3)}`);
    }

    const elementTypeVal = bridgeReport.injections["element_type_dam_add_rate"] ?? 0;
    if (elementTypeVal !== 0) {
      addMult("Elemental DMG Bonus", 1 + elementTypeVal,
        `resolved element_type_dam_add_rate=${elementTypeVal.toFixed(3)}`);
    }

    const keywordVal = bridgeReport.injections["keyword_proc_dam_add_rate"] ?? 0;
    if (keywordVal !== 0) {
      addMult("Keyword/Suffix DMG Bonus", 1 + keywordVal,
        `resolved keyword_proc_dam_add_rate=${keywordVal.toFixed(3)}`);
    }

    addMult("Enemy Type DMG Bonus", 1 + speciesDamAddRate,
      `player stat: enemyTypeDMGBonus=${speciesDamAddRate.toFixed(3)}`);

    if (humanDamAddRate !== 0) {
      addMult("Human Damage Bonus", 1 + humanDamAddRate,
        `player stat: humanDamageBonus=${humanDamAddRate.toFixed(3)}`);
    }

    const combinedMult = computeCombinedCritWeakspotMultiplier(
      input.critRate ?? 0,
      input.critDMG ?? 1.0,
      input.weakspotDMG ?? 0,
      eb.canCrit,
      eb.canWeakspot,
    );
    const critContrib = eb.canCrit ? (input.critRate ?? 0) * ((input.critDMG ?? 1.0) - 1) : 0;
    const wsContrib = eb.canWeakspot ? (input.weakspotDMG ?? 0) : 0;
    addMult("Crit + Weakspot (additive)", combinedMult,
      `canCrit=${eb.canCrit} contribution=${critContrib.toFixed(4)} + canWeakspot=${eb.canWeakspot} contribution=${wsContrib.toFixed(4)}, bucket=${eb.critWeakspotBucket}`);

    addMult("Weapon Vulnerability", 1 + (input.weaponVulnerability ?? 0),
      `behavior.vulnerabilityType=${eb.vulnerabilityType}, weaponVulnerability=${(input.weaponVulnerability ?? 0).toFixed(3)}`);

    const expectedDamage = officialBaseDamage * product;

    const warnings: string[] = [];
    for (const w of bridgeReport.warnings) {
      warnings.push(`[official formula] ${w}`);
    }

    const unresolved = rt.getUnresolvedLeaves();
    if (unresolved.length > 0) {
      warnings.push(
        `Dynamic leaves unresolved (defaulting to 0): ${unresolved.filter((l) => l !== "base_attack").join(", ")}`
      );
    }

    return {
      mechanicId: input.mechanicId,
      formulaFamily: "physical_weapon_damage",
      formulaTemplateId: eb.formulaTemplateId,
      baseDamage: round2(officialBaseDamage),
      expectedDamage: round2(expectedDamage),
      expectedCritMultiplier: round2(combinedMult),
      expectedWeakspotMultiplier: round2(computeExpectedWeakspotMultiplier(input.weakspotDMG ?? 0, eb.canWeakspot)),
      multipliers,
      effectiveBehavior: snapshotBehavior(input),
      warnings,
      explanation: [
        `official graph: final_attack = max(${baseAttack.toFixed(1)} × additional_rate × ignore_dam × special, 0) = ${officialBaseDamage.toFixed(1)}`,
      ],
    };
  } catch {
    return null;
  }
}

function computeCombinedCritWeakspotMultiplier(
  critRate: number,
  critDMG: number,
  weakspotDMG: number,
  canCrit: boolean,
  canWeakspot: boolean,
): number {
  const critContrib = canCrit ? critRate * (critDMG - 1) : 0;
  const wsContrib = canWeakspot ? weakspotDMG : 0;
  return 1 + critContrib + wsContrib;
}
