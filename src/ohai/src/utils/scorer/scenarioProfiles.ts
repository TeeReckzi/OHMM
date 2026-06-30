import type { SceneProfile } from "./types";

export const SCENARIO_PROFILES: SceneProfile[] = [
  {
    id: "pve_boss",
    name: "PvE Bossing",
    description: "Optimized for boss encounters. Sustained DPS with survivability for long fights and mechanics.",
    buildGoalId: "pve_boss_dps",
    categoryWeights: { damage: 1.0, survivability: 0.7, consistency: 0.9, utility: 0.2, mobility: 0.4, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["weakspotDMG", "critRate", "critDMG"],
        multiplier: 1.2,
        description: "Bosses have large weakspots and longer fight durations favor crit consistency"
      },
      {
        type: "stat_weight_override",
        targetStats: ["reloadSpeed"],
        multiplier: 1.15,
        description: "Reload efficiency critical during boss DPS windows"
      }
    ],
    tags: ["pve", "boss", "endgame", "sustained"]
  },
  {
    id: "pve_mob",
    name: "PvE Mobbing",
    description: "Area clear and multi-target efficiency. Prioritizes AoE, status spread, and fast engagement cycling.",
    buildGoalId: "weapon_dmg_general",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.6, utility: 0.2, mobility: 0.6, synergy: 0.5 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["fireRate", "reloadSpeed", "magazineCapacity"],
        multiplier: 1.15,
        description: "Mobbing rewards fast target switching and sustained fire"
      },
      {
        type: "conditional_multiplier",
        condition: "Keywords include status or splash damage",
        multiplier: 1.1,
        description: "Status effects and AoE highly effective against grouped enemies"
      }
    ],
    tags: ["pve", "mob", "clear", "farming"]
  },
  {
    id: "pvp_prismverse",
    name: "PvP Prismverse",
    description: "Player-versus-player in Prismverse mode. Balances burst damage with player damage reduction and mobility.",
    buildGoalId: "pvp_hybrid",
    categoryWeights: { damage: 0.8, survivability: 0.8, consistency: 0.3, utility: 0.2, mobility: 0.8, synergy: 0.6 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["playerDMGReduction", "movementSpeed", "maxHP", "shield"],
        multiplier: 1.25,
        description: "PvP survivability and mobility are critical in Prismverse engagements"
      },
      {
        type: "stat_weight_override",
        targetStats: ["critRate", "critDMG"],
        multiplier: 1.15,
        description: "Burst crits can decide PvP fights quickly"
      },
      {
        type: "anti_synergy_penalty",
        targetStats: ["gatheringYield", "miningYield", "loggingYield", "fishingYield"],
        description: "Gathering stats provide no PvP value"
      }
    ],
    tags: ["pvp", "prismverse", "competitive"]
  },
  {
    id: "crit_build",
    name: "Crit Build",
    description: "Maximum critical hit investment. Scales damage through crit rate and crit damage multiplication.",
    buildGoalId: "crit_burst",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.4, utility: 0.1, mobility: 0.3, synergy: 0.8 },
    modifiers: [
      {
        type: "conditional_multiplier",
        condition: "Has both critRate and critDMG bonuses",
        multiplier: 1.15,
        description: "Crit ecosystem synergy bonus when both rate and damage are present"
      }
    ],
    tags: ["crit", "burst", "offensive"]
  },
  {
    id: "status_build",
    name: "Status Build",
    description: "Status effect damage specialization. Relies on anomaly intensity and elemental damage for DoT and procs.",
    buildGoalId: "status_dmg_general",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.5, utility: 0.2, mobility: 0.3, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["psiIntensity", "superAnomalyStrength", "statusDMGBonus", "elementalDMGBonus"],
        multiplier: 1.2,
        description: "Status builds heavily depend on anomaly and elemental scaling"
      }
    ],
    tags: ["status", "anomaly", "elemental", "dot"]
  },
  {
    id: "unstable_bomber",
    name: "Unstable Bomber",
    description: "Explosion proc build. Prioritizes blast damage, elemental damage, and anomaly intensity for proc bursts.",
    buildGoalId: "unstable_bomber_dmg",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.4, utility: 0.1, mobility: 0.3, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["unstableBomberDMGBonus", "elementalDMGBonus", "statusDMGBonus"],
        multiplier: 1.2,
        description: "Explosion damage scales with dedicated unstable bomber stats"
      },
      {
        type: "conditional_multiplier",
        condition: "high fire rate weapon",
        multiplier: 1.1,
        description: "Faster fire rate increases proc opportunities"
      }
    ],
    tags: ["unstable bomber", "explosion", "proc", "aoe"]
  },
  {
    id: "weakspot",
    name: "Weakspot Build",
    description: "Precision damage through consistent weakspot hits. Rewards accuracy and weapon stability.",
    buildGoalId: "bullseye_weakspot",
    categoryWeights: { damage: 1.0, survivability: 0.2, consistency: 0.4, utility: 0.1, mobility: 0.3, synergy: 0.6 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["weakspotDMG", "bullseyeDMG"],
        multiplier: 1.3,
        description: "Core weakspot damage stats are primary damage source"
      }
    ],
    tags: ["weakspot", "precision", "marksman"]
  },
  {
    id: "elemental_build",
    name: "Elemental Build",
    description: "Generic elemental damage build. Broad coverage across elemental types and status effects.",
    buildGoalId: "elemental_dmg_general",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.5, utility: 0.2, mobility: 0.3, synergy: 0.6 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["elementalDMGBonus", "statusDMGBonus", "psiIntensity"],
        multiplier: 1.15,
        description: "Elemental damage core stats amplified"
      }
    ],
    tags: ["elemental", "status", "hybrid"]
  },
  {
    id: "defensive_tank",
    name: "Defensive/Tank",
    description: "Maximum damage absorption and survivability. Shield, HP, and damage reduction priorities.",
    buildGoalId: "shield_tank",
    categoryWeights: { damage: 0.2, survivability: 1.0, consistency: 0.6, utility: 0.3, mobility: 0.3, synergy: 0.5 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["shield", "shieldStrength", "maxHP", "dmgReduction"],
        multiplier: 1.2,
        description: "Core tank stats heavily weighted"
      }
    ],
    tags: ["defense", "tank", "shield", "survival"]
  },
  {
    id: "burn_specialist",
    name: "Burn Specialist",
    description: "Burn DoT specialist. Maximum investment in burn damage over time and status scaling.",
    buildGoalId: "burn_dps",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.5, utility: 0.1, mobility: 0.2, synergy: 0.8 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["burnDMGBonus", "statusDMGBonus", "elementalDMGBonus", "psiIntensity"],
        multiplier: 1.25,
        description: "Burn damage heavily dependent on status and elemental scaling"
      },
      {
        type: "conditional_multiplier",
        condition: "enemy_affected_by_burn",
        multiplier: 1.1,
        description: "Burn synergy when target already affected"
      }
    ],
    tags: ["burn", "dot", "status", "fire"]
  },
  {
    id: "power_surge_specialist",
    name: "Power Surge Specialist",
    description: "Power Surge proc build. Elemental shock damage with fire rate scaling for max procs.",
    buildGoalId: "power_surge_dmg",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.5, utility: 0.1, mobility: 0.3, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["powerSurgeDMGBonus", "elementalDMGBonus", "fireRate"],
        multiplier: 1.2,
        description: "Power Surge scales with fire rate for more proc opportunities"
      }
    ],
    tags: ["power surge", "shock", "elemental", "proc"]
  },
  {
    id: "frost_vortex_specialist",
    name: "Frost Vortex Specialist",
    description: "Frost Vortex area control build. Frost damage + crit for burst potential in vortex hits.",
    buildGoalId: "frost_vortex_dps",
    categoryWeights: { damage: 1.0, survivability: 0.4, consistency: 0.5, utility: 0.1, mobility: 0.3, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["frostVortexDMGBonus", "elementalDMGBonus", "critRate", "critDMG"],
        multiplier: 1.15,
        description: "Frost Vortex may benefit from crit on vortex ticks"
      }
    ],
    tags: ["frost", "vortex", "elemental", "crowd control"]
  },
  {
    id: "bounce_specialist",
    name: "Bounce Specialist",
    description: "Ricochet multi-target damage. Maximizes bounce damage and crit for each ricochet hit.",
    buildGoalId: "bounce_dps",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.4, utility: 0.1, mobility: 0.3, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["bounceDMG", "weaponDMG", "critRate"],
        multiplier: 1.2,
        description: "Bounce damage and crit on each ricochet hop"
      }
    ],
    tags: ["bounce", "ricochet", "multi-target"]
  },
  {
    id: "shrapnel_specialist",
    name: "Shrapnel Specialist",
    description: "Shrapnel fragmentation damage. Magazine size and crit for sustained fragment output.",
    buildGoalId: "shrapnel_dps",
    categoryWeights: { damage: 1.0, survivability: 0.3, consistency: 0.5, utility: 0.1, mobility: 0.3, synergy: 0.7 },
    modifiers: [
      {
        type: "stat_weight_override",
        targetStats: ["shrapnelDMG", "weaponDMG", "critRate", "magazineCapacity"],
        multiplier: 1.15,
        description: "Shrapnel benefits from magazine size for sustained fragment generation"
      }
    ],
    tags: ["shrapnel", "fragmentation", "aoe"]
  }
];

export function getScenarioProfile(id: string): SceneProfile | undefined {
  return SCENARIO_PROFILES.find((s) => s.id === id);
}

export function listScenarioProfiles(): SceneProfile[] {
  return [...SCENARIO_PROFILES];
}
