import { BuildGoalProfile, BuildGoalRegistry, StatKey } from "../schemas/buildGoalSchema";
import { buildGoalRegistrySchema } from "../schemas/buildGoalSchema";
import * as fs from "fs";
import * as path from "path";

function s(key: StatKey, reason: string) {
  return { key, reason };
}

export function createBuildGoalProfiles(): BuildGoalProfile[] {
  return [
    {
      id: "burn_dps",
      displayName: "Burn DPS",
      description: "Optimizes for Burn status effect damage over time. Relies on status/elemental damage stacking and anomaly intensity.",
      primaryStats: [
        s("burnDMG", "Core burn tick damage source"),
        s("statusDMG", "Amplifies all status effect damage including burn"),
        s("elementalDMG", "Broad elemental damage multiplier for burn source")
      ],
      secondaryStats: [
        s("psiIntensity", "Anomaly intensity increases burn effectiveness"),
        s("superAnomalyStrength", "Further amplifies anomaly/status potency"),
        s("weaponDMG", "Base weapon damage still contributes to initial hit")
      ],
      defensiveStats: [
        s("maxHP", "Survivability while burn ticks"),
        s("dmgReduction", "General damage reduction"),
        s("statusDMGReduction", "Mirror-match survivability")
      ],
      utilityStats: [],
      relevantKeywords: ["burn", "status effect", "anomaly", "elemental", "over-time"],
      preferredFoodBuffCategories: ["status_dmg", "elemental_dmg", "psi_intensity", "weapon_dmg"],
      preferredModCategories: ["status_anomaly", "elemental", "weapon_damage"],
      preferredDeviationRoles: ["combat", "elemental_support"],
      avoidStats: [
        s("bounceDMG", "No synergy with burn DoT playstyle"),
        s("shrapnelDMG", "No synergy with burn DoT playstyle"),
        s("critRate", "Burn ticks typically do not crit")
      ],
      scoringWeights: {
        burnDMG: 1.0,
        statusDMG: 0.9,
        elementalDMG: 0.8,
        psiIntensity: 0.7,
        superAnomalyStrength: 0.6,
        weaponDMG: 0.4,
        maxHP: 0.2,
        dmgReduction: 0.2,
        statusDMGReduction: 0.1,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5,
        critRate: -0.3
      },
      notes: [
        "Burn DoT tick formula not yet confirmed — verify whether crit applies",
        "Psi intensity scaling coefficient needs in-game testing",
        "Some burn sources may have different damage formulas (weapon vs deviation)",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "power_surge_dmg",
      displayName: "Power Surge DPS",
      description: "Specializes in Power Surge elemental damage proc. Benefits from fast attack speed to trigger procs frequently.",
      primaryStats: [
        s("powerSurgeDMG", "Direct Power Surge proc damage"),
        s("elementalDMG", "Amplifies Power Surge elemental damage"),
        s("statusDMG", "Increases status effect damage component")
      ],
      secondaryStats: [
        s("fireRate", "Faster attacks = more Power Surge trigger chances"),
        s("reloadSpeed", "Reduces downtime between trigger windows"),
        s("weaponDMG", "Base damage for non-proc hits")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("dmgReduction", "Damage mitigation")
      ],
      utilityStats: [],
      relevantKeywords: ["power surge", "elemental proc", "status effect", "anomaly", "rapid fire"],
      preferredFoodBuffCategories: ["elemental_dmg", "status_dmg", "fire_rate", "reload_speed"],
      preferredModCategories: ["status_anomaly", "elemental", "weapon_damage"],
      preferredDeviationRoles: ["combat", "elemental_support"],
      avoidStats: [
        s("bounceDMG", "No synergy with Power Surge"),
        s("shrapnelDMG", "No synergy with Power Surge"),
        s("meleeDMG", "Ranged-focused build")
      ],
      scoringWeights: {
        powerSurgeDMG: 1.0,
        elementalDMG: 0.8,
        statusDMG: 0.7,
        fireRate: 0.7,
        reloadSpeed: 0.5,
        weaponDMG: 0.4,
        maxHP: 0.2,
        dmgReduction: 0.2,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5,
        meleeDMG: -0.3
      },
      notes: [
        "Power Surge proc rate tied to fire rate — verify internal cooldowns",
        "Proc damage formula may include weapon damage base component",
        "Some weapons may have better Power Surge synergy than others",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "frost_vortex_dps",
      displayName: "Frost Vortex DPS",
      description: "Focuses on Frost Vortex area control and damage. Combines elemental damage with critical scaling for burst potential.",
      primaryStats: [
        s("frostVortexDMG", "Core Frost Vortex damage"),
        s("elementalDMG", "Amplifies frost elemental damage"),
        s("statusDMG", "Increases status effect damage")
      ],
      secondaryStats: [
        s("critRate", "Frost Vortex may benefit from crit scaling"),
        s("critDMG", "Critical damage multiplier for frost crits"),
        s("weaponDMG", "Base weapon damage contribution")
      ],
      defensiveStats: [
        s("maxHP", "Survivability in close-mid range"),
        s("dmgReduction", "Damage reduction"),
        s("movementSpeed", "Positioning for vortex placement")
      ],
      utilityStats: [],
      relevantKeywords: ["frost", "vortex", "elemental", "crowd control", "area damage"],
      preferredFoodBuffCategories: ["elemental_dmg", "status_dmg", "crit_rate", "crit_dmg"],
      preferredModCategories: ["status_anomaly", "elemental", "crit"],
      preferredDeviationRoles: ["combat", "elemental_support"],
      avoidStats: [
        s("bounceDMG", "No synergy with frost vortex"),
        s("shrapnelDMG", "No synergy with frost vortex")
      ],
      scoringWeights: {
        frostVortexDMG: 1.0,
        elementalDMG: 0.8,
        statusDMG: 0.7,
        critRate: 0.5,
        critDMG: 0.5,
        weaponDMG: 0.4,
        maxHP: 0.3,
        dmgReduction: 0.2,
        movementSpeed: 0.2,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5
      },
      notes: [
        "Verify whether Frost Vortex can crit or if it uses fixed damage",
        "Crowd control duration may affect vortex uptime",
        "Some frost weapons may have unique vortex modifiers",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "bounce_dps",
      displayName: "Bounce DPS",
      description: "Leverages bullet bounce/ricochet mechanics for multi-target damage. Scales with weapon damage and critical stats.",
      primaryStats: [
        s("bounceDMG", "Core ricochet damage multiplier"),
        s("weaponDMG", "Base damage for each bounce hit"),
        s("critRate", "Each bounce hit can crit independently")
      ],
      secondaryStats: [
        s("critDMG", "Critical damage for bounce crits"),
        s("fireRate", "More bullets = more bounce opportunities"),
        s("reloadSpeed", "Minimize downtime between bounce chains")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("dmgReduction", "Damage mitigation")
      ],
      utilityStats: [],
      relevantKeywords: ["bounce", "ricochet", "multi-target", "crit", "rapid fire"],
      preferredFoodBuffCategories: ["weapon_dmg", "crit_rate", "crit_dmg", "fire_rate", "reload_speed"],
      preferredModCategories: ["weapon_damage", "crit", "ricochet"],
      preferredDeviationRoles: ["combat", "damage_support"],
      avoidStats: [
        s("statusDMG", "Bounce is direct damage, not status-based"),
        s("elementalDMG", "Bounce typically deals physical damage"),
        s("burnDMG", "No synergy")
      ],
      scoringWeights: {
        bounceDMG: 1.0,
        weaponDMG: 0.9,
        critRate: 0.7,
        critDMG: 0.7,
        fireRate: 0.5,
        reloadSpeed: 0.4,
        maxHP: 0.2,
        dmgReduction: 0.2,
        statusDMG: -0.3,
        elementalDMG: -0.3,
        burnDMG: -0.5
      },
      notes: [
        "Bounce count and damage falloff per ricochet needs confirmation",
        "Some weapons may have inherent bounce mechanics independent of mods",
        "Bounce may have range limits per hop",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "shrapnel_dps",
      displayName: "Shrapnel DPS",
      description: "Uses shrapnel fragmentation for explosive area damage. Magazine size and crit scaling are key.",
      primaryStats: [
        s("shrapnelDMG", "Core shrapnel fragment damage"),
        s("weaponDMG", "Base damage for each shrapnel hit"),
        s("critRate", "Shrapnel fragments can crit")
      ],
      secondaryStats: [
        s("critDMG", "Critical multiplier for shrapnel crits"),
        s("magazineCapacity", "Larger mag = more sustained shrapnel uptime"),
        s("fireRate", "Faster fire rate for more shrapnel generation")
      ],
      defensiveStats: [
        s("maxHP", "Survivability at close-mid range"),
        s("dmgReduction", "Damage mitigation")
      ],
      utilityStats: [],
      relevantKeywords: ["shrapnel", "fragmentation", "area damage", "explosive", "crit"],
      preferredFoodBuffCategories: ["weapon_dmg", "crit_rate", "crit_dmg", "magazine_capacity"],
      preferredModCategories: ["weapon_damage", "crit", "shrapnel"],
      preferredDeviationRoles: ["combat", "damage_support"],
      avoidStats: [
        s("statusDMG", "Shrapnel is direct explosive damage"),
        s("elementalDMG", "Physical damage focused")
      ],
      scoringWeights: {
        shrapnelDMG: 1.0,
        weaponDMG: 0.9,
        critRate: 0.7,
        critDMG: 0.7,
        magazineCapacity: 0.5,
        fireRate: 0.4,
        maxHP: 0.2,
        dmgReduction: 0.2,
        statusDMG: -0.3,
        elementalDMG: -0.3
      },
      notes: [
        "Shrapnel count per shot varies by weapon type",
        "Fragment spread pattern affects single-target vs AoE effectiveness",
        "Explosive damage may have separate resistance calculations",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "fast_gunner_dps",
      displayName: "Fast Gunner DPS",
      description: "Rapid-fire weapon build maximizing sustained DPS through fire rate, reload efficiency, and crit consistency.",
      primaryStats: [
        s("weaponDMG", "Core damage per bullet"),
        s("fireRate", "More bullets per second = more DPS"),
        s("reloadSpeed", "Reload efficiency = less downtime")
      ],
      secondaryStats: [
        s("critRate", "Consistent crits from many bullets"),
        s("critDMG", "Crit multiplier for sustained burst"),
        s("magazineCapacity", "Larger mag = longer firing windows")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("movementSpeed", "Kiting while firing")
      ],
      utilityStats: [],
      relevantKeywords: ["rapid fire", "sustained dps", "fire rate", "crit", "reload"],
      preferredFoodBuffCategories: ["weapon_dmg", "fire_rate", "reload_speed", "crit_rate", "crit_dmg"],
      preferredModCategories: ["weapon_damage", "crit", "fire_rate"],
      preferredDeviationRoles: ["combat", "damage_support"],
      avoidStats: [
        s("statusDMG", "Direct damage build"),
        s("elementalDMG", "Physical damage primary"),
        s("bounceDMG", "Not a bounce build"),
        s("shrapnelDMG", "Not a shrapnel build")
      ],
      scoringWeights: {
        weaponDMG: 1.0,
        fireRate: 0.9,
        reloadSpeed: 0.7,
        critRate: 0.5,
        critDMG: 0.5,
        magazineCapacity: 0.4,
        maxHP: 0.2,
        movementSpeed: 0.2,
        statusDMG: -0.3,
        elementalDMG: -0.3,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5
      },
      notes: [
        "Fire rate caps or diminishing returns not yet confirmed",
        "Reload speed vs reload efficiency distinction needs formula verification",
        "Some weapons have unique fire rate modifiers not in standard stats",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "unstable_bomber_dmg",
      displayName: "Unstable Bomber DPS",
      description: "Explosion-based build using Unstable Bomber procs for burst elemental damage. Pairs anomaly intensity with area effect.",
      primaryStats: [
        s("unstableBomberDMG", "Core explosion proc damage"),
        s("elementalDMG", "Amplifies explosion elemental damage"),
        s("statusDMG", "Increases status component of explosion")
      ],
      secondaryStats: [
        s("weaponDMG", "Base damage for initial hit before explosion"),
        s("fireRate", "Faster shots = more proc chances"),
        s("psiIntensity", "Anomaly intensity amplifies explosion")
      ],
      defensiveStats: [
        s("maxHP", "Survivability during close-range explosions"),
        s("dmgReduction", "Self-damage mitigation if applicable")
      ],
      utilityStats: [],
      relevantKeywords: ["unstable bomber", "explosion", "elemental", "anomaly", "aoe"],
      preferredFoodBuffCategories: ["elemental_dmg", "status_dmg", "psi_intensity", "weapon_dmg"],
      preferredModCategories: ["status_anomaly", "elemental", "explosion"],
      preferredDeviationRoles: ["combat", "elemental_support"],
      avoidStats: [
        s("bounceDMG", "Explosion-focused, not ricochet"),
        s("shrapnelDMG", "Separate explosion mechanic"),
        s("critRate", "Explosion procs may not crit")
      ],
      scoringWeights: {
        unstableBomberDMG: 1.0,
        elementalDMG: 0.8,
        statusDMG: 0.7,
        weaponDMG: 0.5,
        fireRate: 0.5,
        psiIntensity: 0.5,
        maxHP: 0.3,
        dmgReduction: 0.2,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5,
        critRate: -0.2
      },
      notes: [
        "Unstable Bomber proc rate and internal cooldown not confirmed",
        "Self-damage from explosions needs verification",
        "Explosion radius may scale with different stats",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "bullseye_weakspot",
      displayName: "Bullseye Weakspot",
      description: "Precision build maximizing weakspot hit damage. Bullseye marker amplifies subsequent weakspot hits.",
      primaryStats: [
        s("bullseyeDMG", "Bullseye-marked target damage bonus"),
        s("weakspotDMG", "Core weakspot hit multiplier"),
        s("weaponDMG", "Base damage per shot")
      ],
      secondaryStats: [
        s("critRate", "Crits on weakspots for multiplicative damage"),
        s("critDMG", "Critical damage on weakspot hits"),
        s("fireRate", "Consistent firing rhythm for bullseye uptime")
      ],
      defensiveStats: [
        s("maxHP", "Survivability while aiming"),
        s("movementSpeed", "Positioning for sightlines")
      ],
      utilityStats: [],
      relevantKeywords: ["bullseye", "weakspot", "precision", "crit", "marksman"],
      preferredFoodBuffCategories: ["weakspot_dmg", "weapon_dmg", "crit_rate", "crit_dmg"],
      preferredModCategories: ["weapon_damage", "crit", "weakspot"],
      preferredDeviationRoles: ["combat", "damage_support"],
      avoidStats: [
        s("statusDMG", "Direct precision damage build"),
        s("elementalDMG", "Physical damage focused"),
        s("bounceDMG", "Precision anti-synergy with random bounces"),
        s("shrapnelDMG", "Precision anti-synergy with spread")
      ],
      scoringWeights: {
        bullseyeDMG: 1.0,
        weakspotDMG: 1.0,
        weaponDMG: 0.8,
        critRate: 0.6,
        critDMG: 0.6,
        fireRate: 0.3,
        maxHP: 0.2,
        movementSpeed: 0.2,
        statusDMG: -0.3,
        elementalDMG: -0.3,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5
      },
      notes: [
        "Bullseye marker duration and stack mechanics need confirmation",
        "Weakspot hitbox sizes vary by enemy type",
        "Weapon accuracy and stability affect weakspot consistency",
        "Bullseye vs regular weakspot damage formula stacking needs testing",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "crit_burst",
      displayName: "Crit Burst",
      description: "High critical chance and damage burst build. Maximizes peak damage windows through crit multiplier stacking.",
      primaryStats: [
        s("critRate", "Critical hit chance — must reach threshold first"),
        s("critDMG", "Critical hit damage multiplier"),
        s("weaponDMG", "Base damage multiplied by crits")
      ],
      secondaryStats: [
        s("fireRate", "More attempts = more crit procs per second"),
        s("reloadSpeed", "Reduce downtime between crit windows"),
        s("weakspotDMG", "Weakspot + crit multiplicative scaling")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("dmgReduction", "Damage mitigation")
      ],
      utilityStats: [],
      relevantKeywords: ["crit", "burst", "critical chance", "critical damage", "high risk"],
      preferredFoodBuffCategories: ["crit_rate", "crit_dmg", "weapon_dmg", "fire_rate"],
      preferredModCategories: ["crit", "weapon_damage", "fire_rate"],
      preferredDeviationRoles: ["combat", "damage_support"],
      avoidStats: [
        s("statusDMG", "Direct damage build"),
        s("elementalDMG", "Physical crit build"),
        s("burnDMG", "DoT anti-synergy with burst")
      ],
      scoringWeights: {
        critRate: 1.0,
        critDMG: 1.0,
        weaponDMG: 0.8,
        fireRate: 0.5,
        reloadSpeed: 0.4,
        weakspotDMG: 0.4,
        maxHP: 0.2,
        dmgReduction: 0.2,
        statusDMG: -0.3,
        elementalDMG: -0.3,
        burnDMG: -0.5
      },
      notes: [
        "Crit rate soft cap or diminishing returns not confirmed",
        "Some weapons have inherent crit rate bonuses not reflected in stats",
        "Crit damage formula (additive vs multiplicative) needs verification",
        "Mod sets may provide crit bonuses that interact differently",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "weapon_dmg_general",
      displayName: "Weapon DMG General",
      description: "Generic weapon damage build for any direct-damage playstyle. Flexible fallback when no specific build is targeted.",
      primaryStats: [
        s("weaponDMG", "Core universal damage stat"),
        s("critRate", "Universal DPS multiplier"),
        s("critDMG", "Critical damage scaling")
      ],
      secondaryStats: [
        s("fireRate", "DPS through attack speed"),
        s("reloadSpeed", "Uptime efficiency"),
        s("magazineCapacity", "Sustained fire duration")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("dmgReduction", "General damage mitigation"),
        s("movementSpeed", "Positioning flexibility")
      ],
      utilityStats: [],
      relevantKeywords: ["generic", "weapon damage", "direct damage", "flexible"],
      preferredFoodBuffCategories: ["weapon_dmg", "crit_rate", "crit_dmg", "fire_rate", "reload_speed"],
      preferredModCategories: ["weapon_damage", "crit", "fire_rate"],
      preferredDeviationRoles: ["combat", "damage_support"],
      avoidStats: [
        s("gatheringYield", "Non-combat stat not relevant"),
        s("miningYield", "Non-combat stat not relevant"),
        s("loggingYield", "Non-combat stat not relevant"),
        s("fishingYield", "Non-combat stat not relevant")
      ],
      scoringWeights: {
        weaponDMG: 1.0,
        critRate: 0.7,
        critDMG: 0.7,
        fireRate: 0.5,
        reloadSpeed: 0.4,
        magazineCapacity: 0.3,
        maxHP: 0.3,
        dmgReduction: 0.2,
        movementSpeed: 0.2,
        gatheringYield: -0.5,
        miningYield: -0.5,
        loggingYield: -0.5,
        fishingYield: -0.5
      },
      notes: [
        "Fallback profile when no specialized build is selected",
        "May underperform compared to specialized profiles",
        "Weights are intentionally conservative to favor specialized builds in optimizer",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "elemental_dmg_general",
      displayName: "Elemental DMG General",
      description: "Generic elemental damage build for any elemental-focused weapon or playstyle. Broad coverage across elemental types.",
      primaryStats: [
        s("elementalDMG", "Core elemental damage multiplier"),
        s("statusDMG", "Amplifies elemental status effects"),
        s("psiIntensity", "Anomaly scaling for elemental sources")
      ],
      secondaryStats: [
        s("weaponDMG", "Base damage component"),
        s("superAnomalyStrength", "Additional anomaly potency"),
        s("fireRate", "Proc frequency for elemental effects")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("dmgReduction", "Damage mitigation"),
        s("statusDMGReduction", "Elemental mirror match defense")
      ],
      utilityStats: [],
      relevantKeywords: ["elemental", "status", "anomaly", "generic elemental"],
      preferredFoodBuffCategories: ["elemental_dmg", "status_dmg", "psi_intensity"],
      preferredModCategories: ["status_anomaly", "elemental"],
      preferredDeviationRoles: ["combat", "elemental_support"],
      avoidStats: [
        s("gatheringYield", "Non-combat stat"),
        s("miningYield", "Non-combat stat"),
        s("critRate", "Elemental builds may not prioritize crit")
      ],
      scoringWeights: {
        elementalDMG: 1.0,
        statusDMG: 0.8,
        psiIntensity: 0.7,
        weaponDMG: 0.5,
        superAnomalyStrength: 0.5,
        fireRate: 0.4,
        maxHP: 0.3,
        dmgReduction: 0.2,
        statusDMGReduction: 0.2,
        gatheringYield: -0.5,
        miningYield: -0.5,
        critRate: -0.2
      },
      notes: [
        "Generic elemental profile — specialized elemental builds (burn, frost) preferred",
        "Elemental damage type interactions not yet fully mapped",
        "Some enemies have elemental resistances that shift priority",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "status_dmg_general",
      displayName: "Status DMG General",
      description: "Generic status effect damage build for anomaly-based weapons and status-proc playstyles.",
      primaryStats: [
        s("statusDMG", "Core status effect damage multiplier"),
        s("elementalDMG", "Most status effects are elemental"),
        s("psiIntensity", "Anomaly intensity for status potency")
      ],
      secondaryStats: [
        s("superAnomalyStrength", "Additional anomaly damage scaling"),
        s("weaponDMG", "Base damage for status-applying hits"),
        s("fireRate", "Status application frequency")
      ],
      defensiveStats: [
        s("maxHP", "General survivability"),
        s("statusDMGReduction", "Defense against enemy status effects")
      ],
      utilityStats: [],
      relevantKeywords: ["status", "anomaly", "proc", "elemental", "general status"],
      preferredFoodBuffCategories: ["status_dmg", "elemental_dmg", "psi_intensity"],
      preferredModCategories: ["status_anomaly", "elemental"],
      preferredDeviationRoles: ["combat", "elemental_support"],
      avoidStats: [
        s("gatheringYield", "Non-combat stat"),
        s("miningYield", "Non-combat stat"),
        s("critRate", "Status ticks typically do not crit")
      ],
      scoringWeights: {
        statusDMG: 1.0,
        elementalDMG: 0.8,
        psiIntensity: 0.7,
        superAnomalyStrength: 0.6,
        weaponDMG: 0.4,
        fireRate: 0.4,
        maxHP: 0.3,
        statusDMGReduction: 0.2,
        gatheringYield: -0.5,
        miningYield: -0.5,
        critRate: -0.2
      },
      notes: [
        "Generic status profile — specialized status builds (burn, frost) preferred",
        "Status effect durations and tick rates need formula confirmation",
        "Some status effects may stack while others refresh duration",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "pve_boss_dps",
      displayName: "PvE Boss DPS",
      description: "Optimized for boss encounters. Balances sustained DPS with survivability for long fights.",
      primaryStats: [
        s("weaponDMG", "Consistent base damage output"),
        s("critRate", "Reliable crit rate for sustained boss fights"),
        s("critDMG", "Crit multiplier for burst phases")
      ],
      secondaryStats: [
        s("weakspotDMG", "Boss weakspot damage windows"),
        s("reloadSpeed", "Minimize downtime during DPS phases"),
        s("fireRate", "Sustained damage throughput"),
        s("elementalDMG", "If boss has elemental weakness")
      ],
      defensiveStats: [
        s("maxHP", "Survive boss mechanics"),
        s("dmgReduction", "Mitigate heavy boss hits"),
        s("hpRecovery", "Sustain between boss attacks"),
        s("shield", "Additional survivability layer")
      ],
      utilityStats: [],
      relevantKeywords: ["boss", "pve", "sustained dps", "endgame", "raid"],
      preferredFoodBuffCategories: ["weapon_dmg", "crit_rate", "crit_dmg", "reload_speed", "max_hp"],
      preferredModCategories: ["weapon_damage", "crit", "boss_slayer"],
      preferredDeviationRoles: ["combat", "damage_support", "territory_buff"],
      avoidStats: [
        s("gatheringYield", "Non-combat stat"),
        s("miningYield", "Non-combat stat"),
        s("fishingYield", "Non-combat stat")
      ],
      scoringWeights: {
        weaponDMG: 1.0,
        critRate: 0.8,
        critDMG: 0.8,
        weakspotDMG: 0.6,
        reloadSpeed: 0.5,
        fireRate: 0.5,
        elementalDMG: 0.4,
        maxHP: 0.5,
        dmgReduction: 0.4,
        hpRecovery: 0.3,
        shield: 0.3,
        gatheringYield: -0.5,
        miningYield: -0.5,
        fishingYield: -0.5
      },
      notes: [
        "Boss-specific mechanics (enrage timers, phases) not modeled here",
        "Optimal build may vary per boss depending on mechanics",
        "Elemental weakness matching could shift weights significantly",
        "Deviation choice may be encounter-specific",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "pvp_survivability",
      displayName: "PvP Survivability",
      description: "Maximum durability in player combat. Focuses on damage reduction, shields, and health sustain.",
      primaryStats: [
        s("playerDMGReduction", "Direct PvP damage mitigation"),
        s("dmgReduction", "General damage reduction"),
        s("shield", "Extra health buffer against burst"),
        s("maxHP", "Maximum health pool")
      ],
      secondaryStats: [
        s("healingReceived", "Sustain during and after fights"),
        s("movementSpeed", "Dodge and reposition"),
        s("statusDMGReduction", "PvP status effect mitigation"),
        s("weakspotDMGReduction", "Reduce precision damage from marksmen"),
        s("critDMGReduction", "Reduce crit burst damage")
      ],
      defensiveStats: [
        s("shieldStrength", "Shield effectiveness"),
        s("hpRecovery", "Passive health regen"),
        s("resistances", "Elemental damage mitigation"),
        s("stamina", "Dodge and sprint capacity")
      ],
      utilityStats: [],
      relevantKeywords: ["pvp", "survivability", "tank", "durable", "battle", "defense"],
      preferredFoodBuffCategories: ["max_hp", "dmg_reduction", "shield", "healing_bonus", "movement_speed"],
      preferredModCategories: ["defense", "shield", "pvp_survival"],
      preferredDeviationRoles: ["combat", "defense_support", "territory_shield"],
      avoidStats: [
        s("gatheringYield", "Non-combat stat"),
        s("miningYield", "Non-combat stat"),
        s("loggingYield", "Non-combat stat"),
        s("fishingYield", "Non-combat stat"),
        s("craftingEfficiency", "Non-combat stat"),
        s("foodDuration", "Non-combat stat")
      ],
      scoringWeights: {
        playerDMGReduction: 1.0,
        dmgReduction: 0.9,
        shield: 0.8,
        maxHP: 0.8,
        healingReceived: 0.6,
        movementSpeed: 0.5,
        statusDMGReduction: 0.5,
        weakspotDMGReduction: 0.5,
        critDMGReduction: 0.5,
        shieldStrength: 0.4,
        hpRecovery: 0.3,
        resistances: 0.3,
        stamina: 0.3,
        gatheringYield: -0.5,
        miningYield: -0.5,
        loggingYield: -0.5,
        fishingYield: -0.5,
        craftingEfficiency: -0.3,
        foodDuration: -0.3
      },
      notes: [
        "PvP damage formula differs from PvE — playerDMGReduction is distinct from dmgReduction",
        "Shield mechanics vs health pool balance needs player testing",
        "Some PvP modes may have stat scaling adjustments",
        "Healing received may be affected by PvP healing reduction modifiers",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "pvp_hybrid",
      displayName: "PvP Hybrid",
      description: "Balanced PvP build trading some survivability for offensive capability. For players who want both kill power and staying power.",
      primaryStats: [
        s("playerDMGReduction", "Essential PvP damage mitigation"),
        s("weaponDMG", "Offensive capability"),
        s("maxHP", "Survivability foundation")
      ],
      secondaryStats: [
        s("shield", "Extra burst protection"),
        s("critRate", "Offensive crit potential"),
        s("critDMG", "Crit burst damage"),
        s("dmgReduction", "General damage mitigation"),
        s("movementSpeed", "Combat mobility")
      ],
      defensiveStats: [
        s("healingReceived", "Combat sustain"),
        s("statusDMGReduction", "Status defense"),
        s("hpRecovery", "Passive recovery"),
        s("stamina", "Sprint and dodge")
      ],
      utilityStats: [],
      relevantKeywords: ["pvp", "hybrid", "balanced", "offense", "defense"],
      preferredFoodBuffCategories: ["weapon_dmg", "max_hp", "crit_rate", "crit_dmg", "dmg_reduction", "movement_speed"],
      preferredModCategories: ["weapon_damage", "crit", "defense", "pvp_survival"],
      preferredDeviationRoles: ["combat", "damage_support", "defense_support"],
      avoidStats: [
        s("gatheringYield", "Non-PvP stat"),
        s("miningYield", "Non-PvP stat"),
        s("loggingYield", "Non-PvP stat"),
        s("fishingYield", "Non-PvP stat"),
        s("craftingEfficiency", "Non-PvP stat")
      ],
      scoringWeights: {
        playerDMGReduction: 0.9,
        weaponDMG: 0.8,
        maxHP: 0.7,
        shield: 0.5,
        critRate: 0.5,
        critDMG: 0.5,
        dmgReduction: 0.5,
        movementSpeed: 0.5,
        healingReceived: 0.4,
        statusDMGReduction: 0.3,
        hpRecovery: 0.2,
        stamina: 0.2,
        gatheringYield: -0.5,
        miningYield: -0.5,
        loggingYield: -0.5,
        fishingYield: -0.5,
        craftingEfficiency: -0.3
      },
      notes: [
        "Hybrid builds may underperform specialized builds in their respective areas",
        "Adjustable weights — trading offense for defense is playstyle-dependent",
        "PvP mode rules may affect optimal balance (domination vs deathmatch)",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "shield_tank",
      displayName: "Shield Tank",
      description: "Maximum shield-focused tank build. Relies on shield capacity and strength to absorb damage before health is touched.",
      primaryStats: [
        s("shield", "Primary damage absorption pool"),
        s("shieldStrength", "Shield damage mitigation effectiveness"),
        s("maxHP", "Health buffer behind shield")
      ],
      secondaryStats: [
        s("dmgReduction", "Damage reduction before shield calculation"),
        s("hpRecovery", "Health recovery while shield is active"),
        s("healingReceived", "Sustain throughput")
      ],
      defensiveStats: [
        s("playerDMGReduction", "PvP-specific shield defense"),
        s("statusDMGReduction", "Status effect mitigation"),
        s("resistances", "Elemental damage reduction")
      ],
      utilityStats: [],
      relevantKeywords: ["shield", "tank", "absorb", "defense", "protection"],
      preferredFoodBuffCategories: ["shield", "max_hp", "dmg_reduction", "healing_bonus"],
      preferredModCategories: ["defense", "shield", "tank"],
      preferredDeviationRoles: ["combat", "defense_support", "territory_shield"],
      avoidStats: [
        s("weaponDMG", "Tank build does not prioritize offense"),
        s("critRate", "Non-offensive role"),
        s("critDMG", "Non-offensive role"),
        s("fireRate", "Non-offensive role"),
        s("gatheringYield", "Non-combat stat"),
        s("fishingYield", "Non-combat stat"),
        s("craftingEfficiency", "Non-combat stat")
      ],
      scoringWeights: {
        shield: 1.0,
        shieldStrength: 0.9,
        maxHP: 0.8,
        dmgReduction: 0.6,
        hpRecovery: 0.5,
        healingReceived: 0.5,
        playerDMGReduction: 0.4,
        statusDMGReduction: 0.3,
        resistances: 0.3,
        weaponDMG: -0.5,
        critRate: -0.5,
        critDMG: -0.5,
        fireRate: -0.3,
        gatheringYield: -0.5,
        fishingYield: -0.5,
        craftingEfficiency: -0.3
      },
      notes: [
        "Shield recharge rate and delay not yet modeled",
        "Shield strength damage formula vs health damage formula may differ",
        "Some effects may bypass shields entirely",
        "Shield synergy with specific armor sets needs evaluation",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "melee_dps",
      displayName: "Melee DPS",
      description: "Close-quarters melee combat build. Prioritizes melee damage, critical stats, and mobility for positioning.",
      primaryStats: [
        s("meleeDMG", "Core melee weapon damage"),
        s("weaponDMG", "Base weapon damage affecting melee"),
        s("critRate", "Melee crit chance")
      ],
      secondaryStats: [
        s("critDMG", "Melee crit damage multiplier"),
        s("movementSpeed", "Closing distance and dodging"),
        s("stamina", "Sprint and melee attack stamina management")
      ],
      defensiveStats: [
        s("maxHP", "Close range requires more survivability"),
        s("dmgReduction", "Damage mitigation at close range"),
        s("hpRecovery", "Sustain between engagements")
      ],
      utilityStats: [],
      relevantKeywords: ["melee", "close range", "crit", "mobility", "brawler"],
      preferredFoodBuffCategories: ["melee_dmg", "weapon_dmg", "crit_rate", "crit_dmg", "movement_speed", "stamina"],
      preferredModCategories: ["weapon_damage", "crit", "melee"],
      preferredDeviationRoles: ["combat", "damage_support", "defense_support"],
      avoidStats: [
        s("statusDMG", "Melee is direct damage focused"),
        s("elementalDMG", "Physical melee primary"),
        s("bounceDMG", "No synergy with melee"),
        s("shrapnelDMG", "No synergy with melee"),
        s("reloadSpeed", "Melee weapons typically do not reload"),
        s("magazineCapacity", "Melee weapons typically have no magazine")
      ],
      scoringWeights: {
        meleeDMG: 1.0,
        weaponDMG: 0.8,
        critRate: 0.7,
        critDMG: 0.7,
        movementSpeed: 0.6,
        stamina: 0.5,
        maxHP: 0.5,
        dmgReduction: 0.4,
        hpRecovery: 0.3,
        statusDMG: -0.3,
        elementalDMG: -0.3,
        bounceDMG: -0.5,
        shrapnelDMG: -0.5,
        reloadSpeed: -0.3,
        magazineCapacity: -0.3
      },
      notes: [
        "Melee weapon types may have unique movesets not reflected in stats",
        "Stamina cost per melee attack varies by weapon type",
        "Some melee attacks may count as abilities vs basic attacks",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "farming_gathering",
      displayName: "Farming & Gathering",
      description: "Resource gathering build optimized for yield efficiency across all gathering types. Non-combat focused.",
      primaryStats: [
        s("gatheringYield", "Universal gathering yield increase"),
        s("miningYield", "Mining resource efficiency"),
        s("loggingYield", "Logging resource efficiency"),
        s("fishingYield", "Fishing resource efficiency")
      ],
      secondaryStats: [
        s("movementSpeed", "Travel efficiency between nodes"),
        s("stamina", "Sustained gathering runs"),
        s("deviationSupport", "Gathering deviation support effectiveness")
      ],
      defensiveStats: [],
      utilityStats: [
        s("craftingEfficiency", "Processing gathered materials")
      ],
      relevantKeywords: ["farming", "gathering", "mining", "logging", "fishing", "resource", "utility"],
      preferredFoodBuffCategories: ["gathering_yield", "movement_speed", "stamina", "crafting_efficiency"],
      preferredModCategories: ["gathering", "utility"],
      preferredDeviationRoles: ["gathering", "crafting", "territory_buff"],
      avoidStats: [
        s("weaponDMG", "Non-combat build"),
        s("critRate", "Non-combat build"),
        s("critDMG", "Non-combat build"),
        s("burnDMG", "Non-combat build"),
        s("meleeDMG", "Non-combat build"),
        s("playerDMGReduction", "Non-combat build")
      ],
      scoringWeights: {
        gatheringYield: 1.0,
        miningYield: 0.9,
        loggingYield: 0.9,
        fishingYield: 0.9,
        movementSpeed: 0.6,
        stamina: 0.5,
        deviationSupport: 0.4,
        craftingEfficiency: 0.3,
        weaponDMG: -0.5,
        critRate: -0.5,
        critDMG: -0.5,
        burnDMG: -0.5,
        meleeDMG: -0.5,
        playerDMGReduction: -0.3
      },
      notes: [
        "Gathering yield formulas (additive vs multiplicative) not confirmed",
        "Some zones may have gathering caps not affected by yield stats",
        "Deviation gathering bonuses may stack multiplicatively with gear stats",
        "Fishing may have separate mechanics not fully mapped",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "food_buff_general",
      displayName: "Food Buff General",
      description: "Support-focused build for maximizing food buff uptime and crafting efficiency. Useful for characters who rely heavily on consumables.",
      primaryStats: [
        s("foodDuration", "Extended food and drink buff uptime"),
        s("craftingEfficiency", "Resource-efficient consumable crafting"),
        s("deviationSupport", "Deviation contribution while cooking/crafting")
      ],
      secondaryStats: [
        s("maxHP", "Survivability while cooking"),
        s("hpRecovery", "Passive sustain"),
        s("stamina", "General utility")
      ],
      defensiveStats: [
        s("dmgReduction", "General protection")
      ],
      utilityStats: [
        s("gatheringYield", "Ingredient gathering bonus"),
        s("fishingYield", "Alternative ingredient source")
      ],
      relevantKeywords: ["food", "cooking", "consumable", "buff", "support", "crafting"],
      preferredFoodBuffCategories: ["food_duration", "crafting_efficiency", "max_hp", "stamina"],
      preferredModCategories: ["utility", "support"],
      preferredDeviationRoles: ["crafting", "territory_buff"],
      avoidStats: [
        s("critRate", "Non-combat support build"),
        s("critDMG", "Non-combat support build"),
        s("burnDMG", "Non-combat support build"),
        s("shrapnelDMG", "Non-combat support build"),
        s("bounceDMG", "Non-combat support build")
      ],
      scoringWeights: {
        foodDuration: 1.0,
        craftingEfficiency: 0.8,
        deviationSupport: 0.6,
        maxHP: 0.4,
        hpRecovery: 0.3,
        stamina: 0.3,
        dmgReduction: 0.2,
        gatheringYield: 0.3,
        fishingYield: 0.2,
        critRate: -0.5,
        critDMG: -0.5,
        burnDMG: -0.5,
        shrapnelDMG: -0.5,
        bounceDMG: -0.5
      },
      notes: [
        "Food duration stat behavior and stacking rules not confirmed",
        "Crafting efficiency may or may not affect cooking specifically",
        "Deviation support for cooking deviations (e.g., Chefosaurus) needs mapping",
        "Creative Cooking ignored for V1"
      ]
    },
    {
      id: "balanced_general",
      displayName: "Balanced General",
      description: "General-purpose all-rounder build with moderate offense and defense. Safe default for new or undecided players.",
      primaryStats: [
        s("weaponDMG", "Universal damage output"),
        s("maxHP", "Universal survivability"),
        s("dmgReduction", "General damage mitigation")
      ],
      secondaryStats: [
        s("critRate", "Moderate offense scaling"),
        s("critDMG", "Crit multiplier"),
        s("movementSpeed", "General mobility"),
        s("reloadSpeed", "General combat quality of life")
      ],
      defensiveStats: [
        s("hpRecovery", "Passive sustain"),
        s("shield", "Extra safety buffer"),
        s("statusDMGReduction", "General status protection")
      ],
      utilityStats: [
        s("stamina", "General utility"),
        s("craftingEfficiency", "General quality of life")
      ],
      relevantKeywords: ["general", "balanced", "all-rounder", "default", "beginner"],
      preferredFoodBuffCategories: ["weapon_dmg", "max_hp", "dmg_reduction", "crit_rate", "movement_speed"],
      preferredModCategories: ["weapon_damage", "crit", "defense"],
      preferredDeviationRoles: ["combat", "damage_support", "defense_support"],
      avoidStats: [
        s("gatheringYield", "Non-combat stat with low general value"),
        s("miningYield", "Non-combat stat"),
        s("loggingYield", "Non-combat stat"),
        s("fishingYield", "Non-combat stat")
      ],
      scoringWeights: {
        weaponDMG: 0.8,
        maxHP: 0.7,
        dmgReduction: 0.6,
        critRate: 0.5,
        critDMG: 0.5,
        movementSpeed: 0.4,
        reloadSpeed: 0.4,
        hpRecovery: 0.3,
        shield: 0.3,
        statusDMGReduction: 0.2,
        stamina: 0.2,
        craftingEfficiency: 0.2,
        gatheringYield: -0.3,
        miningYield: -0.3,
        loggingYield: -0.3,
        fishingYield: -0.3
      },
      notes: [
        "Fallback profile — specialized profiles will outperform in their areas",
        "Intended for players unfamiliar with build optimization",
        "Weights are conservative; meant as safe starting point",
        "Creative Cooking ignored for V1"
      ]
    }
  ];
}

export const STAT_KEYS: StatKey[] = [
  "weaponDMG", "meleeDMG", "statusDMG", "elementalDMG",
  "burnDMG", "powerSurgeDMG", "frostVortexDMG", "bounceDMG",
  "shrapnelDMG", "fastGunnerDMG", "unstableBomberDMG", "bullseyeDMG",
  "critRate", "critDMG", "weakspotDMG", "fireRate",
  "reloadSpeed", "reloadEfficiency", "magazineCapacity",
  "psiIntensity", "superAnomalyStrength",
  "maxHP", "hpRecovery", "shield", "shieldStrength",
  "dmgReduction", "playerDMGReduction", "statusDMGReduction",
  "weakspotDMGReduction", "critDMGReduction",
  "healingReceived", "movementSpeed", "stamina", "resistances",
  "gatheringYield", "miningYield", "loggingYield", "fishingYield",
  "craftingEfficiency", "foodDuration", "deviationSupport"
];

const profilesCache = createBuildGoalProfiles();

export function getBuildGoalProfile(goalId: string): BuildGoalProfile | undefined {
  return profilesCache.find((p) => p.id === goalId);
}

export function listBuildGoalProfiles(): BuildGoalProfile[] {
  return [...profilesCache];
}

export function scoreStatForGoal(goalId: string, statKey: string): number {
  const profile = getBuildGoalProfile(goalId);
  if (!profile) return 0;
  return profile.scoringWeights[statKey] ?? 0;
}

export function getPreferredFoodCategories(goalId: string): string[] {
  const profile = getBuildGoalProfile(goalId);
  return profile?.preferredFoodBuffCategories ?? [];
}

export function getPreferredDeviationRoles(goalId: string): string[] {
  const profile = getBuildGoalProfile(goalId);
  return profile?.preferredDeviationRoles ?? [];
}

export function explainGoalPriorities(goalId: string): string {
  const profile = getBuildGoalProfile(goalId);
  if (!profile) return `No profile found for "${goalId}"`;
  const lines: string[] = [
    `${profile.displayName}: ${profile.description}`,
    "",
    "Primary Stats:",
    ...profile.primaryStats.map((s) => `  ${s.key} — ${s.reason}`),
    "",
    "Secondary Stats:",
    ...profile.secondaryStats.map((s) => `  ${s.key} — ${s.reason}`),
    "",
    "Avoid Stats:",
    ...profile.avoidStats.map((s) => `  ${s.key} — ${s.reason}`)
  ];
  return lines.join("\n");
}

export function createBuildGoalRegistry(): BuildGoalRegistry {
  return {
    module: "build_goal_profiles",
    moduleStatus: "verified_snapshot_locked",
    locked: true,
    confidence: "B_rules_registry_pending_formula_validation",
    createdAt: new Date().toISOString(),
    purpose: "Define build goal profiles with scoring weights for the optimizer to recommend gear, mods, food buffs, and deviations based on player-selected playstyle goals.",
    statKeys: STAT_KEYS,
    scoringWeightScale: {
      "1.0": "Core stat — essential for the build to function",
      "0.9": "Near-core — very high priority",
      "0.8": "Strong priority",
      "0.7": "Important supporting stat",
      "0.6": "Valuable supporting stat",
      "0.5": "Useful supporting stat",
      "0.4": "Moderate supporting stat",
      "0.3": "Situational or minor utility",
      "0.2": "Low impact or luxury",
      "0.1": "Marginal benefit",
      "-0.2": "Minor anti-synergy",
      "-0.3": "Moderate anti-synergy",
      "-0.5": "Strong anti-synergy — actively detrimental to build"
    },
    profiles: profilesCache
  };
}

const VERIFIED_OUTPUT_PATH = path.resolve(__dirname, "../../data/verified/build-goal-profiles.verified.json");

if (require.main === module) {
  const registry = createBuildGoalRegistry();
  const result = buildGoalRegistrySchema.safeParse(registry);
  if (!result.success) {
    console.error("Schema validation FAILED:");
    for (const err of result.error.issues) {
      console.error(`  ${err.path.join(".")}: ${err.message}`);
    }
    process.exit(1);
  }
  fs.writeFileSync(VERIFIED_OUTPUT_PATH, JSON.stringify(result.data, null, 2) + "\n", "utf-8");
  console.log(`Schema validation: pass`);
  console.log(`Profiles: ${result.data.profiles.length}`);
  console.log(`Output written: ${VERIFIED_OUTPUT_PATH}`);
}
