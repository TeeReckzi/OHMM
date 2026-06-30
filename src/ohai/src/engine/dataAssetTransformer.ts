import type { CanonicalWeapon } from "../ui/itemTypes";
import type { NormalizedArmorSet } from "../schemas/armorSetSchema";
import type { StatKey } from "../schemas/buildGoalSchema";
import type { FormulaEffectiveBehaviorSnapshot } from "./formulaTypes";

export interface SanitizedLoadoutSnapshot {
  baseWeaponDMG: number;
  attackPercent: number;
  statsGrid: Partial<Record<StatKey, number>>;
  activeKeywords: string[];
}

const STAT_NAME_TO_KEY: Record<string, StatKey> = {
  "weaponDMG": "weaponDMGFlat",
  "weaponDMGFlat": "weaponDMGFlat",
  "Magazine Capacity": "magazineCapacity",
  "Crit Rate": "critRate",
  "Crit DMG": "critDMG",
  "Weakspot DMG": "weakspotDMG",
  "Fire Rate": "fireRate",
  "Reload Speed": "reloadSpeed",
  "Movement Speed": "movementSpeed",
  "Psi Intensity": "psiIntensity",
  "Status DMG": "statusDMGBonus",
  "Elemental DMG": "elementalDMGBonus",
  "Burn DMG": "burnDMGBonus",
  "Frost Vortex DMG": "frostVortexDMGBonus",
  "Power Surge DMG": "powerSurgeDMGBonus",
};

function extractBaseDamage(weapon: CanonicalWeapon): number {
  const stat = weapon.statModifiers?.find(
    (m) => m.stat === "weaponDMG" || m.stat === "weaponDMGFlat"
  );
  return stat?.value ?? 500;
}

export function transformGeneratedWeapon(
  weapon: CanonicalWeapon,
  stars: number,
  tier: number
): SanitizedLoadoutSnapshot {
  const baseDamage = extractBaseDamage(weapon);
  const baseDamageFlat = baseDamage * (1 + (tier - 1) * 0.25) * (1 + stars * 0.05);

  const critRateStat = weapon.statModifiers?.find((m) => m.stat === "critRate");
  const critDMGStat = weapon.statModifiers?.find((m) => m.stat === "critDMG");
  const weakspotStat = weapon.statModifiers?.find((m) => m.stat === "weakspotDMG");

  const statsGrid: Partial<Record<StatKey, number>> = {
    weaponDMGFlat: baseDamageFlat,
    critRate: critRateStat?.value ?? 0.05,
    critDMG: critDMGStat?.value ?? 0.50,
    weakspotDMG: weakspotStat?.value ?? 0.60,
  };

  return {
    baseWeaponDMG: baseDamageFlat,
    attackPercent: 0,
    statsGrid,
    activeKeywords: weapon.keywordAssociations ?? [],
  };
}

export function compileEquippedGearModifiers(
  armorSlots: Record<string, string>,
  armorSets: NormalizedArmorSet[]
): Partial<Record<StatKey, number>> {
  const consolidatedStats: Partial<Record<StatKey, number>> = {};
  const setCounters: Record<string, number> = {};

  Object.values(armorSlots).forEach((setName) => {
    if (setName && setName !== "none") {
      setCounters[setName] = (setCounters[setName] ?? 0) + 1;
    }
  });

  armorSets.forEach((setBonus) => {
    const key = setBonus.nameEnglish ?? setBonus.nameOriginal ?? "";
    const count = setCounters[key] ?? 0;
    setBonus.effectTiers.forEach((tier) => {
      if (tier.piecesRequired !== null && count >= tier.piecesRequired) {
        tier.parsedStats.forEach((stat) => {
          if (stat.value !== null) {
            const mappedKey = STAT_NAME_TO_KEY[stat.statName];
            if (mappedKey) {
              const percentValue = stat.unit === "%" ? stat.value / 100 : stat.value;
              consolidatedStats[mappedKey] = (consolidatedStats[mappedKey] ?? 0) + percentValue;
            }
          }
        });
      }
    });
  });

  return consolidatedStats;
}
