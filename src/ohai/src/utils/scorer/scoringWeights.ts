import type { StatKey } from "../../schemas/buildGoalSchema";

// ---------------------------------------------------------------------------
// Intentionally unscored stat keys (formula-internal buckets)
//
// The following StatKey values are consumed by the combat damage formula
// (formulaApplicator.ts) but are NOT gear stats that should be scored:
//
//   weaponVulnerability    — target-side debuff, not a player gear stat
//   statusVulnerability    — target-side debuff, not a player gear stat
//   enemyTypeDMGBonus      — contextual encounter bonus, not on gear
//   keywordSuffixDMGBonus  — aggregated from burnDMG/powerSurgeDMG/etc.,
//                             not a raw gear roll
//
// They have no weight in any profile, no normalizer alias, and no relevance
// mask entry. The scoring loop in scoreGearSet() skips any stat with
// weight === 0 (index.ts ~line 179). This is intentional — these values
// are injected at formula evaluation time from external sources
// (e.g. enemy state, encounter modifiers) or already captured via other
// stat keys (burnDMG → keywordSuffixDMGBonus).
// ---------------------------------------------------------------------------

export interface WeightProfile {
  id: string;
  name: string;
  description: string;
  categoryWeights: {
    damage: number;
    survivability: number;
    consistency: number;
    utility: number;
    mobility: number;
    synergy: number;
  };
  statWeights: Partial<Record<StatKey, number>>;
}

const OFFENSE_BASE: Partial<Record<StatKey, number>> = {
  weaponDMG: 1.0,
  critRate: 0.6,
  critDMG: 0.6,
  fireRate: 0.5,
  reloadSpeed: 0.4
};

const DEFENSE_BASE: Partial<Record<StatKey, number>> = {
  maxHP: 1.0,
  shield: 0.8,
  dmgReduction: 0.8,
  shieldStrength: 0.5,
  hpRecovery: 0.4,
  healingReceived: 0.3
};

const ELEMENTAL_BASE: Partial<Record<StatKey, number>> = {
  elementalDMGBonus: 1.0,
  statusDMGBonus: 0.8,
  psiIntensity: 0.6,
  superAnomalyStrength: 0.5,
  weaponDMGBonus: 0.4
};

export const WEIGHT_PROFILES: WeightProfile[] = [
  {
    id: "default_offense",
    name: "Default Offense",
    description: "Balanced offensive profile used as base for most DPS scenarios.",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.6, utility: 0.1, mobility: 0.3, synergy: 0.5 },
    statWeights: { ...OFFENSE_BASE }
  },
  {
    id: "crit_focused",
    name: "Crit Focused",
    description: "Heavy crit investment. Prioritizes crit rate and crit damage over raw weapon damage.",
    categoryWeights: { damage: 1.0, survivability: 0.2, consistency: 0.3, utility: 0.1, mobility: 0.2, synergy: 0.7 },
    statWeights: {
      ...OFFENSE_BASE,
      critRate: 1.0,
      critDMG: 1.0,
      weaponDMG: 0.7,
      weakspotDMG: 0.5,
      fireRate: 0.4,
      reloadSpeed: 0.3
    }
  },
  {
    id: "status_anomaly",
    name: "Status & Anomaly",
    description: "Status effect and anomaly damage focus. Pairs with elemental builds.",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.4, utility: 0.1, mobility: 0.2, synergy: 0.6 },
    statWeights: {
      ...ELEMENTAL_BASE,
      statusDMGBonus: 1.0,
      elementalDMGBonus: 0.9,
      psiIntensity: 0.7,
      superAnomalyStrength: 0.6,
      weaponDMGBonus: 0.3,
      fireRate: 0.4
    }
  },
  {
    id: "weakspot_precision",
    name: "Weakspot Precision",
    description: "Precision damage through weakspot hits. Rewards accuracy and careful aim.",
    categoryWeights: { damage: 1.0, survivability: 0.2, consistency: 0.3, utility: 0.1, mobility: 0.2, synergy: 0.5 },
    statWeights: {
      weakspotDMG: 1.0,
      bullseyeDMG: 0.9,
      weaponDMG: 0.7,
      critRate: 0.5,
      critDMG: 0.6,
      fireRate: 0.3,
      reloadSpeed: 0.3
    }
  },
  {
    id: "survival_defense",
    name: "Survival & Defense",
    description: "Maximum durability. Shield, HP, and damage reduction priorities.",
    categoryWeights: { damage: 0.2, survivability: 1.0, consistency: 0.5, utility: 0.3, mobility: 0.5, synergy: 0.4 },
    statWeights: {
      ...DEFENSE_BASE,
      playerDMGReduction: 0.9,
      statusDMGReduction: 0.5,
      weakspotDMGReduction: 0.5,
      critDMGReduction: 0.5,
      movementSpeed: 0.4,
      stamina: 0.3,
      weaponDMG: 0.2
    }
  },
  {
    id: "burst_dps",
    name: "Burst DPS",
    description: "High burst damage profile. Values magazine size, crit damage, and fire rate for short kill windows.",
    categoryWeights: { damage: 1.0, survivability: 0.2, consistency: 0.3, utility: 0.1, mobility: 0.3, synergy: 0.5 },
    statWeights: {
      weaponDMG: 1.0,
      critDMG: 0.9,
      critRate: 0.7,
      magazineCapacity: 0.5,
      fireRate: 0.6,
      reloadSpeed: 0.3,
      weakspotDMG: 0.4
    }
  },
  {
    id: "sustained_dps",
    name: "Sustained DPS",
    description: "Long fight optimization. Reload speed, fire rate, and consistency matter most.",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.9, utility: 0.2, mobility: 0.3, synergy: 0.5 },
    statWeights: {
      weaponDMG: 1.0,
      fireRate: 0.8,
      reloadSpeed: 0.7,
      reloadEfficiency: 0.5,
      magazineCapacity: 0.4,
      critRate: 0.5,
      critDMG: 0.5,
      maxHP: 0.3,
      dmgReduction: 0.3
    }
  },
  {
    id: "hybrid_all_rounder",
    name: "Hybrid All-Rounder",
    description: "General purpose profile with moderate offense, defense, and utility balance.",
    categoryWeights: { damage: 0.7, survivability: 0.7, consistency: 0.6, utility: 0.5, mobility: 0.5, synergy: 0.4 },
    statWeights: {
      weaponDMG: 0.7,
      critRate: 0.4,
      critDMG: 0.4,
      maxHP: 0.6,
      dmgReduction: 0.5,
      movementSpeed: 0.4,
      reloadSpeed: 0.3,
      fireRate: 0.3,
      shield: 0.3,
      stamina: 0.3
    }
  },
  {
    id: "pvp_burst",
    name: "PvP Burst",
    description: "Player-versus-player burst optimization. Balances player damage reduction with high burst damage.",
    categoryWeights: { damage: 0.8, survivability: 0.8, consistency: 0.3, utility: 0.2, mobility: 0.7, synergy: 0.6 },
    statWeights: {
      weaponDMG: 0.9,
      playerDMGReduction: 0.9,
      maxHP: 0.7,
      critDMG: 0.7,
      critRate: 0.5,
      movementSpeed: 0.6,
      shield: 0.6,
      dmgReduction: 0.5,
      statusDMGReduction: 0.4,
      critDMGReduction: 0.4,
      weakspotDMGReduction: 0.4,
      healingReceived: 0.4,
      stamina: 0.3
    }
  },
  {
    id: "elemental_burn",
    name: "Elemental: Burn",
    description: "Burn damage-over-time specialization. Status damage, elemental damage, and anomaly intensity.",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.5, utility: 0.1, mobility: 0.2, synergy: 0.7 },
    statWeights: {
      burnDMGBonus: 1.0,
      statusDMGBonus: 0.9,
      elementalDMGBonus: 0.8,
      psiIntensity: 0.7,
      superAnomalyStrength: 0.6,
      weaponDMGBonus: 0.3,
      fireRate: 0.3,
      maxHP: 0.3,
      dmgReduction: 0.2
    }
  },
  {
    id: "gathering_utility",
    name: "Gathering & Utility",
    description: "Non-combat resource gathering profile.",
    categoryWeights: { damage: 0.1, survivability: 0.3, consistency: 0.5, utility: 1.0, mobility: 0.7, synergy: 0.3 },
    statWeights: {
      gatheringYield: 1.0,
      miningYield: 0.9,
      loggingYield: 0.9,
      fishingYield: 0.9,
      movementSpeed: 0.6,
      stamina: 0.5,
      deviationSupport: 0.4,
      craftingEfficiency: 0.3,
      maxHP: 0.3,
      dmgReduction: 0.2
    }
  }
];

export function getWeightProfile(id: string): WeightProfile | undefined {
  return WEIGHT_PROFILES.find((p) => p.id === id);
}

export function listWeightProfiles(): WeightProfile[] {
  return [...WEIGHT_PROFILES];
}
