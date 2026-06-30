import type { ObservedDamageCase } from "./formulaTestTypes";

const CASES: ObservedDamageCase[] = [
  // ---------------------------------------------------------------------------
  // 1. Burn — 1 stack (baseline)
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-baseline",
    displayName: "Burn 1 Stack (Baseline)",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 1,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 5,
        normalizedValue: 5.06,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
      {
        rawValue: 5,
        normalizedValue: 5.06,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
      {
        rawValue: 5,
        normalizedValue: 5.06,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Baseline 1-stack Burn. weaponDMG=100, damagePerStackFactor=0.04, stack=1. Per-tick = 4 × 1.15 × 1.10 = 5.06.",
  },

  // ---------------------------------------------------------------------------
  // 2. Burn — 3 stacks
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-3-stacks",
    displayName: "Burn 3 Stacks",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 15,
        normalizedValue: 15.18,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn. Per-tick = 4 × 3 × 1.15 × 1.10 = 15.18.",
  },

  // ---------------------------------------------------------------------------
  // 3. Burn — 5 stacks
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-5-stacks",
    displayName: "Burn 5 Stacks",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 5,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 25,
        normalizedValue: 25.30,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 5-stack Burn. Per-tick = 4 × 5 × 1.15 × 1.10 = 25.30.",
  },

  // ---------------------------------------------------------------------------
  // 4. Burn with Gilded Gloves (crit eligible)
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-gilded-gloves",
    displayName: "Burn 3 Stacks + Gilded Gloves (Crit Eligible)",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      critRate: 0.30,
      critDMG: 2.00,
    },
    activeGear: ["Gilded Gloves"],
    observedHits: [
      {
        rawValue: 20,
        normalizedValue: 19.73,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder", "crit-enabled"],
      },
      {
        rawValue: 20,
        normalizedValue: 19.73,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder", "crit-enabled"],
      },
    ],
    expectedFlags: { status: true, elemental: true, crit: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with Gilded Gloves enabling crit eligibility. Per-tick = 4 × 3 × 1.15 × 1.10 × 1.30 = 19.73.",
  },

  // ---------------------------------------------------------------------------
  // 5. Burn with keywordSuffixDMGBonus
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-keyword-suffix",
    displayName: "Burn 3 Stacks + Keyword Suffix DMG",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      keywordSuffixDMGBonus: 0.20,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 18,
        normalizedValue: 18.22,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with keyword-specific bucket (Burn DMG suffix). Per-tick = 4 × 3 × 1.15 × 1.10 × 1.20 = 18.22.",
  },

  // ---------------------------------------------------------------------------
  // 6. Burn with statusVulnerability
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-status-vulnerability",
    displayName: "Burn 3 Stacks + Status Vulnerability",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      statusVulnerability: 0.25,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 19,
        normalizedValue: 18.97,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with statusVulnerability=0.25. Per-tick = 4 × 3 × 1.15 × 1.10 × 1.25 = 18.97 (JS floating point rounds from 18.975).",
  },

  // ---------------------------------------------------------------------------
  // 7. Burn with enemyTypeDMGBonus
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-enemy-type-bonus",
    displayName: "Burn 3 Stacks + Enemy Type DMG Bonus",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      enemyTypeDMGBonus: 0.15,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 17,
        normalizedValue: 17.46,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with enemyTypeDMGBonus=0.15. Per-tick = 4 × 3 × 1.15 × 1.10 × 1.15 = 17.46.",
  },

  // ---------------------------------------------------------------------------
  // 8. Burn with DoT resistance
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-dot-resistance",
    displayName: "Burn 3 Stacks + DoT Resistance",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      dotResistanceReduction: 0.20,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 12,
        normalizedValue: 12.14,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with dotResistanceReduction=0.20. Per-tick = 4 × 3 × 1.15 × 1.10 × 0.80 = 12.14.",
  },

  // ---------------------------------------------------------------------------
  // 9. Burn with BBQ Gloves frequency increase
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-bbq-frequency",
    displayName: "Burn 3 Stacks + BBQ Gloves Frequency (per-tick same, DPS doubles)",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      burnTickFrequencyBonus: 1.0,
    },
    activeGear: ["BBQ Gloves"],
    observedHits: [
      {
        rawValue: 15,
        normalizedValue: 15.18,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder", "frequency"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with BBQ Gloves (+100% tick frequency). Per-tick damage remains 15.18 (same as 3-stack), but DPS doubles from 30.36 to 60.72 due to 4 ticks/s vs 2 ticks/s.",
  },

  // ---------------------------------------------------------------------------
  // 10. Burn with Burn Resistance debuff level 2
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-resistance-debuff",
    displayName: "Burn 3 Stacks + Burn Resistance Debuff Level 2",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      burnResistanceDebuffLevel: 2,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 11,
        normalizedValue: 10.63,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with Burn Resistance debuff level 2 (30% reduction). Per-tick = 4 × 3 × 1.15 × 1.10 × 0.70 = 10.63.",
  },

  // ---------------------------------------------------------------------------
  // 11. Burn with humanDamageBonus
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-human-damage",
    displayName: "Burn 3 Stacks + Human Damage Bonus",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      humanDamageBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 17,
        normalizedValue: 16.70,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with humanDamageBonus=0.10. Per-tick = 4 × 3 × 1.15 × 1.10 × 1.10 = 16.70.",
  },

  // ---------------------------------------------------------------------------
  // 12. Burn with flatBurnBonus
  // ---------------------------------------------------------------------------
  {
    caseId: "burn-flat-bonus",
    displayName: "Burn 3 Stacks + Flat Burn Bonus",
    mechanicId: "burn",
    formulaFamily: "burn_stack_dot",
    playerStats: {
      weaponDMG: 100,
      psiIntensity: 33.333333333333336,
      burnCurrentStacks: 3,
      flatBurnBonus: 1.0,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 19,
        normalizedValue: 18.98,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — 3-stack Burn with flatBurnBonus=1.0. basePerStack = 4 + 1 = 5, stackContrib = 15. Per-tick = 15 × 1.15 × 1.10 = 18.97 (JS floating point).",
  },

  // ---------------------------------------------------------------------------
  // 13. Power Surge tick (baseline) — unchanged from old model
  // ---------------------------------------------------------------------------
  {
    caseId: "power-surge-baseline",
    displayName: "Power Surge Tick (Baseline) — Hypothesis A: Pure DoT Model",
    mechanicId: "powerSurge",
    formulaFamily: "status_tick_damage",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 126,
        normalizedValue: 126.5,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Power Surge tick (Hypothesis A: pure DoT model). Uses status_tick_damage family, shock element. External repo (lReDragol) classifies Power Surge as hybrid (initial hit + DoT tick + global amplifier). See docs/external-research/power-surge-investigation.md.",
    warnings: [
      "⚠ MODEL CONFLICT: Power Surge currently modeled as pure DoT (Hypothesis A). External repo (lReDragol/OnceHuman_Tools, context_module.py:3529-3547) classifies Power Surge as a hybrid mechanic: initial single hit × 0.5 + shock DoT tick + global damage amplifier vs shocked targets (Hypothesis C). In-game testing required to resolve. See docs/external-research/power-surge-investigation.md.",
    ],
  },

  // ---------------------------------------------------------------------------
  // 14. Frost Vortex tick (baseline) — Hypothesis A: DoT model
  // ---------------------------------------------------------------------------
  {
    caseId: "frost-vortex-baseline",
    displayName: "Frost Vortex Tick (Baseline) — Hypothesis A: DoT Model",
    mechanicId: "frostVortex",
    formulaFamily: "status_tick_damage",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 126,
        normalizedValue: 126.5,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Frost Vortex tick (Hypothesis A: DoT model). Uses status_tick_damage family, frost element. External repo (lReDragol) classifies Frost Vortex as single-hit status with NO DoT tick. See docs/external-research/frost-vortex-investigation.md.",
    warnings: [
      "⚠ MODEL CONFLICT: Frost Vortex currently modeled as DoT (Hypothesis A). External repo (lReDragol/OnceHuman_Tools, context_module.py:3594-3616) classifies Frost Vortex as a single-hit status with NO DoT tick (Hypothesis B). Frostbite stacks may be a separate enabler mechanic. In-game testing required to resolve. See docs/external-research/frost-vortex-investigation.md.",
    ],
  },

  // ---------------------------------------------------------------------------
  // 15. Frost Vortex — Hypothesis B: Single-Hit Status (no DoT tick)
  // ---------------------------------------------------------------------------
  {
    caseId: "frost-vortex-single-hit-hypothesis",
    displayName: "Frost Vortex Single Hit (PROVISIONAL — Hypothesis B: No DoT)",
    mechanicId: "frostVortexSingleHit",
    formulaFamily: "unsupported",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [],
    expectedFlags: {
      procSource: "frost_vortex",
      status: true,
      elemental: true,
      crit: false,
      weakspot: false,
    },
    confidence: "reported_current_patch_needs_testing",
    notes:
      "PROVISIONAL PLACEHOLDER — Frost Vortex single hit (Hypothesis B). External repo classifies as single-hit status with NO DoT tick. psi_intensity * 0.6 base multiplier suggested. Frostbite stacks applied separately via frost_vortex_applies handlers. See docs/external-research/frost-vortex-investigation.md.",
    warnings: [
      "⚠ MODEL CONFLICT: This case tests Hypothesis B (single-hit Frost Vortex with no DoT tick). External repo (lReDragol/OnceHuman_Tools) classifies Frost Vortex as single_hit_status, not damage_over_time. No formula assigned — validation must return unsupported. In-game testing required to determine correct behavior.",
    ],
  },

  // ---------------------------------------------------------------------------
  // 16. Unstable Bomber tick (baseline, has baseFactor=1.2) — unchanged
  // ---------------------------------------------------------------------------
  {
    caseId: "unstable-bomber-baseline",
    displayName: "Unstable Bomber Tick (Baseline)",
    mechanicId: "unstableBomber",
    formulaFamily: "status_tick_damage",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 152,
        normalizedValue: 151.8,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Unstable Bomber tick. baseFactor=1.2 so base damage is 120 (psi * 1.2).",
  },

  // ---------------------------------------------------------------------------
  // 17. Physical weapon hit (no crit, no weakspot) — unchanged
  // ---------------------------------------------------------------------------
  {
    caseId: "physical-weapon-baseline",
    displayName: "Physical Weapon Hit (Baseline)",
    mechanicId: "physicalWeapon",
    formulaFamily: "physical_weapon_damage",
    playerStats: {
      weaponDMG: 100,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 100,
        normalizedValue: 100,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { elemental: false, status: false },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Physical weapon hit with baseWeaponDMG=100, no crit/weakspot.",
  },

  // ---------------------------------------------------------------------------
  // 18. Physical weapon crit + weakspot hit — unchanged
  // ---------------------------------------------------------------------------
  {
    caseId: "physical-weapon-crit-weakspot",
    displayName: "Physical Weapon Crit + Weakspot",
    mechanicId: "physicalWeapon",
    formulaFamily: "physical_weapon_damage",
    playerStats: {
      weaponDMG: 100,
      critRate: 0.50,
      critDMG: 2.50,
      weakspotDMG: 0.80,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 255,
        normalizedValue: 255,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { crit: true, weakspot: true, elemental: false, status: false },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Physical weapon with crit+weakspot. base=100, additive mult = 1 + 0.50*(2.50-1) + 0.80 = 2.55.",
  },

  // ---------------------------------------------------------------------------
  // 19. Charged hybrid status shot — unchanged
  // ---------------------------------------------------------------------------
  {
    caseId: "charged-hybrid-shot",
    displayName: "Charged Hybrid Status Shot",
    mechanicId: "chargedHybridStatusShot",
    formulaFamily: "charged_status_damage",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      critRate: 0.30,
      critDMG: 2.00,
      weakspotDMG: 0.50,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 228,
        normalizedValue: 227.7,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { crit: true, weakspot: true, status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Charged hybrid status shot. Crit+weakspot additive bucket. psiIntensity=100, baseFactor=1.0.",
  },

  // ---------------------------------------------------------------------------
  // 20. Power Surge with keywordSuffixDMGBonus — unchanged
  // ---------------------------------------------------------------------------
  {
    caseId: "power-surge-keyword-suffix",
    displayName: "Power Surge Tick + Keyword Suffix DMG",
    mechanicId: "powerSurge",
    formulaFamily: "status_tick_damage",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
      keywordSuffixDMGBonus: 0.20,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 152,
        normalizedValue: 151.8,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { status: true, elemental: true },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Power Surge tick with keyword-specific damage bucket (e.g. Power Surge DMG suffix).",
  },

  // ---------------------------------------------------------------------------
  // 21. Power Surge — Hypothesis C: Hybrid (initial hit + DoT + global amp)
  // ---------------------------------------------------------------------------
  {
    caseId: "power-surge-hybrid-hypothesis",
    displayName: "Power Surge Hybrid (PROVISIONAL — Hypothesis C: Initial Hit + DoT)",
    mechanicId: "powerSurgeHybrid",
    formulaFamily: "unsupported",
    playerStats: {
      psiIntensity: 100,
      statusDMGBonus: 0.15,
      elementalDMGBonus: 0.10,
    },
    activeGear: [],
    observedHits: [],
    expectedFlags: {
      procSource: "power_surge",
      status: true,
      elemental: true,
      crit: false,
      weakspot: false,
    },
    confidence: "reported_current_patch_needs_testing",
    notes:
      "PROVISIONAL PLACEHOLDER — Power Surge hybrid (Hypothesis C). External repo classifies as initial single hit + DoT tick + global amplifier. psi_intensity × 0.5 base multiplier suggested for initial hit. Separate shock_damage_percent and power_surge_damage_percent stats. Global amplifier: damage_to_shocked_target_percent. See docs/external-research/power-surge-investigation.md.",
    warnings: [
      "⚠ MODEL CONFLICT: This case tests Hypothesis C (hybrid Power Surge with initial hit + DoT tick + global amp). External repo (lReDragol/OnceHuman_Tools) classifies Power Surge as single_hit_status with hasDoTTick: true and isAmplifier: true. No formula assigned — validation must return unsupported. In-game testing required to determine correct behavior. See docs/external-research/power-surge-investigation.md.",
    ],
  },

  // ---------------------------------------------------------------------------
  // 22. EBR-14 Fire Ring (PROVISIONAL — no formula assigned)
  // ---------------------------------------------------------------------------
  {
    caseId: "ebr-fire-ring-provisional",
    displayName: "EBR Grilled Octopus Fire Ring (PROVISIONAL — No Formula)",
    mechanicId: "ebr_fire_ring",
    formulaFamily: "unsupported",
    playerStats: { weaponDMG: 100, psiIntensity: 100 },
    activeGear: [],
    observedHits: [],
    expectedFlags: {
      procSource: "ebr_fire_ring",
      status: true,
      elemental: true,
      crit: false,
      weakspot: false,
    },
    confidence: "reported_current_patch_needs_testing",
    notes:
      "PROVISIONAL PLACEHOLDER — EBR fire ring is a Hybrid Burn-Triggered Proc. Scaling source (psiIntensity vs weaponDMG) and base multiplier are unknown. No formula assigned. Not a Burn DoT tick. Validation must return unsupported with clear warnings. See docs/external-research/ebr-fire-ring-investigation.md.",
  },

  // ---------------------------------------------------------------------------
  // 23. Physical weapon hit with weaponVulnerability — unchanged (keep last)
  // ---------------------------------------------------------------------------
  {
    caseId: "physical-weapon-vulnerability",
    displayName: "Physical Weapon Hit + Weapon Vulnerability",
    mechanicId: "physicalWeapon",
    formulaFamily: "physical_weapon_damage",
    playerStats: {
      weaponDMG: 100,
      weaponVulnerability: 0.30,
    },
    activeGear: [],
    observedHits: [
      {
        rawValue: 130,
        normalizedValue: 130,
        source: "manual",
        confidence: "inferred",
        tags: ["synthetic", "placeholder"],
      },
    ],
    expectedFlags: { elemental: false, status: false },
    confidence: "inferred",
    notes:
      "SYNTHETIC PLACEHOLDER — Physical weapon hit with weaponVulnerability=0.30. base=100, (1+0.30) = 1.30.",
  },
];
export function getObservedDamageCases(): ObservedDamageCase[] {
  return CASES;
}

export function getObservedCase(
  caseId: string
): ObservedDamageCase | undefined {
  return CASES.find((c) => c.caseId === caseId);
}
