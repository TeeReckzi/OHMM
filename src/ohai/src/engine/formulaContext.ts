import type { StatKey } from "../schemas/buildGoalSchema";
import type { FormulaInput } from "./formulaTypes";
import { applyGearOverridesToMechanic } from "./mechanicRegistry";

const MECHANIC_KEYWORD_KEY: Record<string, StatKey> = {
  burn: "burnDMGBonus",
  frostVortex: "frostVortexDMGBonus",
  powerSurge: "powerSurgeDMGBonus",
  unstableBomber: "unstableBomberDMGBonus",
  shrapnel: "shrapnelDMGBonus",
  bounce: "bounceDMGBonus",
  physicalWeapon: "weaponDMGBonus",
};

function mechanicKeywordSource(mechanicId: string): StatKey | undefined {
  return MECHANIC_KEYWORD_KEY[mechanicId];
}

export function buildFormulaInput(
  mechanicId: string,
  playerStats: Partial<Record<StatKey, number>>,
  equippedGearNames: string[]
): FormulaInput | { error: string } {
  const effective = applyGearOverridesToMechanic(mechanicId, equippedGearNames);
  if (!effective) {
    return { error: `Unknown mechanic: "${mechanicId}" — no behavior found. Check mechanic system parameters.` };
  }

  // Aggregate keyword bonuses into the global tracker bucket explicitly
  const mechanicKeywordKey = mechanicKeywordSource(mechanicId);
  const mechanicBonus = mechanicKeywordKey ? (playerStats[mechanicKeywordKey] ?? 0) : 0;
  const catchAllBonus = playerStats.keywordSuffixDMGBonus ?? 0;
  const combinedKeywordBonus = mechanicBonus + catchAllBonus;

  const result: FormulaInput = {
    mechanicId,
    effectiveBehavior: effective,
    baseWeaponDMG: playerStats.weaponDMGFlat ?? playerStats.weaponDMG,
    attackPercent: playerStats.attackPercent,
    weaponDMGBonus: playerStats.weaponDMGBonus,
    statusDMGBonus: playerStats.statusDMGBonus,
    elementalDMGBonus: playerStats.elementalDMGBonus,
    keywordSuffixDMGBonus: combinedKeywordBonus > 0 ? combinedKeywordBonus : undefined,
    psiIntensity: playerStats.psiIntensity,
    critRate: playerStats.critRate,
    critDMG: playerStats.critDMG,
    weakspotDMG: playerStats.weakspotDMG,
    weaponVulnerability: playerStats.weaponVulnerability,
    statusVulnerability: playerStats.statusVulnerability,
    enemyTypeDMGBonus: playerStats.enemyTypeDMGBonus,
    currentStacks: playerStats.burnCurrentStacks,
    flatBurnBonus: playerStats.flatBurnBonus,
    humanDamageBonus: playerStats.humanDamageBonus,
    dotResistanceReduction: playerStats.dotResistanceReduction,
    burnResistanceDebuffLevel: playerStats.burnResistanceDebuffLevel,
    tickFrequencyMultiplier: playerStats.burnTickFrequencyBonus !== undefined
      ? 1 + playerStats.burnTickFrequencyBonus
      : undefined,
  };

  return result;
}