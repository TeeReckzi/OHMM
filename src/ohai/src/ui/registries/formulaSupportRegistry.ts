import type { AnyCanonicalItem, FormulaSupport, FormulaSupportStatus } from "../itemTypes";
import type { DamageModelHypothesis } from "../../engine/formulaTypes";

/**
 * Known modeled keyword/mechanic combinations.
 */
const MODELED_MECHANICS: Record<string, { status: FormulaSupportStatus; modeledStats: string[]; notes: string; modelSelection?: DamageModelHypothesis }> = {
 burn: {
  status: "partially-modeled",
  modeledStats: ["burnDMGBonus", "statusDMGBonus", "elementalDMGBonus"],
  notes: "Burn stack DoT model confirmed for base ticks. Stack count interactions, BBQ Gloves frequency bonus, and burn resistance debuff partially modeled.",
 },
 frostVortex: {
  status: "partially-modeled",
  modeledStats: ["frostDMG", "statusDMGBonus", "elementalDMGBonus"],
  notes: "Frost Vortex DoT tick model (Hypothesis A) wired. Model conflict exists — external research suggests single-hit model (Hypothesis B). In-game testing required to resolve.",
  modelSelection: "frost-vortex-DoT-tick",
 },
 powerSurge: {
  status: "partially-modeled",
  modeledStats: ["powerSurgeDMGBonus", "statusDMGBonus", "elementalDMGBonus"],
  notes: "Power Surge DoT tick model (Hypothesis A) wired. Model conflict exists — external research suggests hybrid model (Hypothesis C: initial hit + DoT + global amp). In-game testing required to resolve.",
  modelSelection: "power-surge-DoT-tick",
 },
 unstableBomber: {
  status: "partially-modeled",
  modeledStats: ["unstableBomberDMGBonus", "statusDMGBonus", "elementalDMGBonus"],
  notes: "Unstable Bomber DoT tick model wired. Proc mechanics and stack behavior need in-game confirmation.",
 },
 physical: {
  status: "fully-modeled",
  modeledStats: ["weaponDMGBonus", "attackPercent", "critRate", "critDMG", "weakspotDMG"],
  notes: "Physical weapon damage formula is fully modeled. Crit, weakspot, vulnerability, and enemy-type multipliers confirmed.",
 },
};

const PENDING_MECHANICS: Record<string, string> = {
 bounce: "Bounce mechanics not yet modeled. Chain-target behavior and damage falloff pending research.",
 shrapnel: "Shrapnel mechanics not yet modeled. Pellet spread and multi-hit behavior pending research.",
 fastGunner: "Fast Gunner fire rate mechanics not yet modeled. Reload speed and attack speed formulas pending.",
 bullseye: "Bullseye / weakspot vuln mechanics not yet modeled. Mark stack behavior and damage sharing pending.",
};

/**
 * Known items with verified formula support metadata.
 */
const KNOWN_ITEM_SUPPORT: Record<string, FormulaSupport> = {
 "none": {
  status: "display-only",
  notes: "Empty selection state. No formula impact.",
 },
 "safety-sandwich": {
  status: "partially-modeled",
  notes: "PvP defensive food. playerDMGReduction reduces incoming player damage in PvP contexts. Base: 20% dmg reduction from enemy players / Meta-Humans. Chef Rex food bonus adjusts effectiveness (default 38%, max 42%). Does not affect outgoing DPS. Has no effect in PvE mode.",
  modeledStatCoverage: ["playerDMGReduction"],
  unresolvedMechanics: ["Chef Rex now scales this active food modifier only. BBQ Gloves frequency bonus does not affect PvP mitigation."],
  simulationWarnings: [],
 },
 "gilded-gloves": {
  status: "partially-modeled",
  notes: "Burn crit eligibility and fire ring proc enabled. Gilded Gloves burn crit flag wired in mechanic metadata.",
  modeledStatCoverage: ["burnDMGBonus", "critRate"],
  unresolvedMechanics: ["EBR fire ring base damage multiplier unknown. Assigned to unsupported formula family pending in-game testing."],
  simulationWarnings: ["Burn crit enabled by Gilded Gloves — verify that crit calculations include the correct eligibility flag."],
  modelSelection: "ebr-fire-ring-provisional",
 },
 "bbq-gloves": {
  status: "partially-modeled",
  notes: "Burn tick frequency bonus tracked as statModifier. Not yet wired into burn DoT tick interval formula.",
  modeledStatCoverage: ["burnTickFrequencyBonus"],
  unresolvedMechanics: ["Burn tick frequency formula does not yet consume this modifier. Frequency bonus has no effect on projected DPS."],
  simulationWarnings: ["BBQ Gloves frequency bonus is recognized but not yet applied to burn tick timing."],
 },
 "scorched": {
  status: "partially-modeled",
  notes: "Burn DMG modifier tracked in modifier aggregation engine. Wired into burn damage formula projections.",
  modeledStatCoverage: ["burnDMGBonus"],
 },
 "burn-set-2pc": {
  status: "partially-modeled",
  notes: "Set bonus burn DMG tracked in modifier aggregation engine.",
  modeledStatCoverage: ["burnDMGBonus"],
 },
 "blaze-suffix": {
  status: "partially-modeled",
  notes: "Mod suffix burn DMG tracked in modifier aggregation engine.",
  modeledStatCoverage: ["burnDMGBonus"],
 },
 "charged": {
  status: "partially-modeled",
  notes: "Power Surge DMG modifier tracked. DoT tick formula wired (Hypothesis A). Model conflict exists.",
  modeledStatCoverage: ["powerSurgeDMGBonus", "statusDMGBonus", "elementalDMGBonus"],
  unresolvedMechanics: ["Power Surge model conflict: Hypothesis A (pure DoT) vs Hypothesis C (hybrid). In-game testing required."],
  simulationWarnings: ["Power Surge projection uses DoT model. If hybrid model is correct, projections will undercount initial hit damage."],
 },
 "status-amplifier": {
  status: "partially-modeled",
  notes: "Status DMG modifier tracked in aggregation engine. Wired into status damage formulas.",
  modeledStatCoverage: ["statusDMGBonus"],
 },
 "elemental-overload": {
  status: "partially-modeled",
  notes: "Elemental DMG modifier tracked in aggregation engine. Wired into elemental damage formulas.",
  modeledStatCoverage: ["elementalDMGBonus"],
 },
 "violent": {
  status: "fully-modeled",
  notes: "Crit DMG modifier. Fully wired into all crit-based formula projections.",
  modeledStatCoverage: ["critDMG"],
 },
 "precision": {
  status: "fully-modeled",
  notes: "Weakspot DMG modifier. Fully wired into weakspot formula projections.",
  modeledStatCoverage: ["weakspotDMG"],
 },
 "crit-boost": {
  status: "fully-modeled",
  notes: "Crit Rate modifier. Fully wired into crit probability projections.",
  modeledStatCoverage: ["critRate"],
 },
 "anti-gravity-milkshake": {
  status: "display-only",
  notes: "Mobility/utility consumable. No direct combat damage impact. Formula projection unaffected.",
  simulationWarnings: ["Movement and jump effects are not reflected in DPS or TTK projections."],
 },
 "all-weather-stew": {
  status: "display-only",
  notes: "Temperature resistance food. No direct combat damage impact.",
  simulationWarnings: ["Environmental resistance not reflected in damage projections."],
 },
 "pyro-dino": {
  status: "partially-modeled",
  notes: "Food bonus percent tracked. Chef Rex bonus formula modeled (rating-derived curve). Common bonus 38%, max 42%.",
  modeledStatCoverage: ["foodBonusPercent"],
  unresolvedMechanics: ["Chef Rex only scales active food/drink buff modifier rows. Non-food sources are not affected."],
  simulationWarnings: ["Chef Rex is applied only to selected active food/drink buffs. It does not directly modify weapon damage."],
 },
 "butterfly-emissary": {
  status: "partially-modeled",
  notes: "Deviation skill damage baseFactor=1.2. Wired into deviation skill damage formula.",
  modeledStatCoverage: ["deviationSkillDMG"],
  unresolvedMechanics: ["Deviation skill damage scaling from activity rating and level not yet modeled."],
  simulationWarnings: ["Deviation skill damage uses baseFactor only. Level/rating scaling pending."],
 },
 "zap-cam-lonewolf": {
  status: "partially-modeled",
  notes: "Deviation skill damage baseFactor=8.0. High burst deviation. Wired into deviation skill damage formula. Registry entry is QUARANTINED (needsReview=true, confidence=placeholder) — no verified game-data backing. baseFactor pending in-game validation. Do not promote to verified/canonical production paths.",
  modeledStatCoverage: ["deviationSkillDMG"],
  unresolvedMechanics: ["Deviation skill damage scaling from activity rating and level not yet modeled.", "Quarantined in registry: needsReview=true. No verified game-data backing for zap-cam-lonewolf."],
  simulationWarnings: ["Deviation skill damage uses baseFactor only. Level/rating scaling pending.", "Quarantined deviation: registry entry marked needsReview."],
 },
 "soul-summoner": {
  status: "partially-modeled",
  notes: "Deviation skill damage baseFactor=6.0. Wired into deviation skill damage formula.",
  modeledStatCoverage: ["deviationSkillDMG"],
  unresolvedMechanics: ["Deviation skill damage scaling from activity rating and level not yet modeled."],
  simulationWarnings: ["Deviation skill damage uses baseFactor only. Level/rating scaling pending."],
 },

 // ── Cradle Overrides (Phase 2.4) ────────────────────────────────
 // All cradle overrides are conditional time-limited buffs.
 // Partially-modeled entries map directly stated stat modifiers
 // but do NOT model uptime, stacking, proc triggers, cooldowns,
 // weapon-switch removal, or other temporal conditions.

 "light-weapon-mastery": {
  status: "partially-modeled",
  notes: "Weapon DMG +15% conditional on light weapon class. Uptime not modeled — assumes always active when weapon class matches.",
  modeledStatCoverage: ["weaponDMGBonus"],
  unresolvedMechanics: ["Time-limited conditions not modeled. Assumes full uptime when applicable weapon class equipped."],
  simulationWarnings: ["Light Weapon Mastery bonus shown at full value. Effective uptime depends on weapon class match."],
 },
 "heavy-weapon-mastery": {
  status: "partially-modeled",
  notes: "Weapon DMG +15% conditional on heavy weapon class. Uptime not modeled.",
  modeledStatCoverage: ["weaponDMGBonus"],
  unresolvedMechanics: ["Time-limited conditions not modeled. Assumes full uptime when applicable weapon class equipped."],
  simulationWarnings: ["Heavy Weapon Mastery bonus shown at full value. Effective uptime depends on weapon class match."],
 },
 "precision-weapon-mastery": {
  status: "partially-modeled",
  notes: "Weapon DMG +15% conditional on precision weapon class. Uptime not modeled.",
  modeledStatCoverage: ["weaponDMGBonus"],
  unresolvedMechanics: ["Time-limited conditions not modeled. Assumes full uptime when applicable weapon class equipped."],
  simulationWarnings: ["Precision Weapon Mastery bonus shown at full value. Effective uptime depends on weapon class match."],
 },
 "resilience": {
  status: "display-only",
  notes: "Shield damage reduction vs monsters only. No impact on outgoing DPS or combat formula projections.",
  simulationWarnings: ["Shield resilience is a PvE defensive effect only. Not reflected in damage/KP projections."],
 },
 "rapid-aid": {
  status: "display-only",
  notes: "Healing/medicine utility perk. No impact on outgoing DPS or combat formula projections.",
  simulationWarnings: ["Medicine speed and effect are survival mechanics. Not reflected in combat projections."],
 },
 "tactical-combo": {
  status: "partially-modeled",
  notes: "Weapon DMG +15% for 4s after weapon swap or reload. Assumes constant value, uptime not modeled.",
  modeledStatCoverage: ["weaponDMGBonus"],
  unresolvedMechanics: ["4s buff window not modeled. Activation on reload/swap not tracked."],
  simulationWarnings: ["Tactical Combo shown at full value. Effective damage gain depends on reload/swap frequency."],
 },
 "status-enhancement": {
  status: "partially-modeled",
  notes: "Status DMG +15% for 3s after weakspot hit. Assumes constant value, uptime not modeled.",
  modeledStatCoverage: ["statusDMGBonus"],
  unresolvedMechanics: ["3s buff window not modeled. Conditional on weakspot hit."],
  simulationWarnings: ["Status Enhancement shown at full value. Effective uptime depends on weakspot accuracy."],
 },
 "deviant-energy-defense": {
  status: "partially-modeled",
  notes: "PvP defensive perk. Weapon/Status DMG Reduction +10% while shield active. Shield grant + 30s duration + 30s CD.",
  modeledStatCoverage: ["weaponDMGReduction", "statusDMGReduction"],
  unresolvedMechanics: ["Shield uptime and 30s cooldown not tracked. Damage reduction conditional on shield being active."],
  simulationWarnings: ["Deviant Energy Defense reduction shown at full value. Effective uptime depends on shield uptime."],
 },
 "energy-surge": {
  status: "display-only",
  notes: "Deviant power recovery at night. No impact on outgoing DPS or combat formula projections.",
  simulationWarnings: ["Deviant power recovery is a utility effect. Not reflected in combat projections."],
 },
 "shield-protection": {
  status: "display-only",
  notes: "Deviant DMG Reduction and monster damage conditional on shield > 40% HP. Not in combat formula scope.",
  simulationWarnings: ["Shield conditionals not modeled. PvE monster damage bonus not in formula engine."],
 },
 "deadly-combo": {
  status: "partially-modeled",
  notes: "Bullet effect damage +25% for 4s after Bounce/Shrapnel. Bounce and Shrapnel mechanics are pending.",
  modeledStatCoverage: ["bounceDMGBonus", "shrapnelDMGBonus"],
  unresolvedMechanics: ["4s buff window not modeled. Bounce and Shrapnel mechanics are pending."],
  simulationWarnings: ["Deadly Combo bonus tracked but Bounce/Shrapnel formulas are not yet modeled."],
 },
 "elemental-sense": {
  status: "partially-modeled",
  notes: "Elemental DMG +25% for 4s after dealing Elemental DMG. 'Corresponding' element selection not differentiated.",
  modeledStatCoverage: ["elementalDMGBonus"],
  unresolvedMechanics: ["4s buff window not modeled. Element selection logic not tracked."],
  simulationWarnings: ["Elemental Sense shown at full value. Element alignment logic not modeled."],
 },
 "steady-hand": {
  status: "partially-modeled",
  notes: "Weapon DMG +10% and Weakspot DMG +25% conditional on Fortress Warfare/Fast Gunner buffs. Both mechanics pending.",
  modeledStatCoverage: ["weaponDMGBonus", "weakspotDMG"],
  unresolvedMechanics: ["Conditional on Fortress Warfare and Fast Gunner uptime. Both mechanics are pending."],
  simulationWarnings: ["Steady Hand shown at full value but depends on pending Fortress Warfare/Fast Gunner mechanics."],
 },
 "marked-strike": {
  status: "partially-modeled",
  notes: "Weakspot DMG +20% against Bull's Eye marked targets. Bull's Eye mechanic is pending.",
  modeledStatCoverage: ["weakspotDMG"],
  unresolvedMechanics: ["Conditional on Bull's Eye mark. Bull's Eye mechanic is pending."],
  simulationWarnings: ["Marked Strike shown at full value but depends on pending Bull's Eye mechanic."],
 },
 "robust": {
  status: "display-only",
  notes: "Melee damage stacking perk. Melee damage formula not yet modeled.",
  unresolvedMechanics: ["Melee damage formula not modeled. Light vs heavy strike differentiation not tracked."],
  simulationWarnings: ["Melee damage perks not reflected in current formula projections."],
 },
 "extreme-freezing": {
  status: "partially-modeled",
  notes: "Frost Vortex DMG +2.5% stacking, Slowdown, and Freeze on Frost Elemental DMG. Stacking and CC not modeled.",
  modeledStatCoverage: ["frostVortexDMGBonus"],
  unresolvedMechanics: ["Stacking not modeled. Slowdown/freeze CC not modeled. 1x freeze limit per target not tracked."],
  simulationWarnings: ["Extreme Freezing Frost DMG bonus shown at max stacks. Freeze CC not reflected in projections."],
 },
 "blazing-detonation": {
  status: "partially-modeled",
  notes: "Burn DMG +25% for 10s after re-inflicting Burn. Proc trigger and 3s cooldown not modeled.",
  modeledStatCoverage: ["burnDMGBonus"],
  unresolvedMechanics: ["Re-inflict proc trigger not modeled. 3s cooldown not tracked. Extra Burn DMG instance not modeled."],
  simulationWarnings: ["Blazing Detonation Burn DMG bonus shown. Extra proc damage instance not included."],
 },
 "invincible-strike": {
  status: "partially-modeled",
  notes: "Shrapnel DMG +2.5% and Shrapnel Crit DMG +3.5% stacking after Weakspot. Shrapnel mechanic pending.",
  modeledStatCoverage: ["shrapnelDMGBonus"],
  unresolvedMechanics: ["Stacking not modeled. Shrapnel mechanic is pending. Distance falloff removal at max stacks not tracked."],
  simulationWarnings: ["Invincible Strike shown at max stacks. Shrapnel formula is pending."],
 },
 "bounce-rampage": {
  status: "partially-modeled",
  notes: "Bounce DMG +5% stacking after Bounce trigger. Bounce mechanic pending.",
  modeledStatCoverage: ["bounceDMGBonus"],
  unresolvedMechanics: ["Stacking not modeled. 15s duration not tracked. Bounce mechanic is pending."],
  simulationWarnings: ["Bounce Rampage shown at max stacks. Bounce formula is pending."],
 },
 "explosives-bonus": {
  status: "partially-modeled",
  notes: "Unstable Bomber DMG +5% stacking after Unstable Bomber trigger.",
  modeledStatCoverage: ["unstableBomberDMGBonus"],
  unresolvedMechanics: ["Stacking not modeled. 8s duration not tracked."],
  simulationWarnings: ["Explosives Bonus shown at max stacks. Stack decay not modeled."],
 },
 "heavy-strike": {
  status: "partially-modeled",
  notes: "Weapon DMG +25% for 8s after Fortress Warfare activation. Fortress Warfare mechanic pending.",
  modeledStatCoverage: ["weaponDMGBonus"],
  unresolvedMechanics: ["8s window not modeled. Fortress Warfare mechanic is pending. Weapon-switch removal not tracked."],
  simulationWarnings: ["Heavy Strike shown at full value but depends on pending Fortress Warfare mechanic."],
 },
 "transient-impact": {
  status: "partially-modeled",
  notes: "Power Surge DMG +2.5% stacking after dealing Power Surge DMG.",
  modeledStatCoverage: ["powerSurgeDMGBonus"],
  unresolvedMechanics: ["Stacking not modeled. 6s duration not tracked."],
  simulationWarnings: ["Transient Impact shown at max stacks. Stack decay not modeled."],
 },
 "bounty-hunter": {
  status: "partially-modeled",
  notes: "Attack +2% (first mark) and Weapon DMG +3% (renew mark) stacking. Two buff tracks. Weapon-switch removal.",
  modeledStatCoverage: ["weaponDMGBonus", "attackPercent"],
  unresolvedMechanics: ["Two separate buff tracks not differentiated. Stacking not modeled. Weapon-switch removal not tracked."],
  simulationWarnings: ["Bounty Hunter shown at max stacks for both buff tracks. Effective value depends on mark frequency."],
 },
 "fast-pursuit": {
  status: "partially-modeled",
  notes: "Random effect on Fast Gunner trigger. Attack/Crit Rate/Crit DMG. Random selection not differentiated.",
  modeledStatCoverage: ["attackPercent", "critRate", "critDMG"],
  unresolvedMechanics: ["Random effect selection not modeled. Fast Gunner mechanic is pending. Stacking not modeled. Weapon-switch removal not tracked."],
  simulationWarnings: ["Fast Pursuit shown using average expected value. Actual effect is random per trigger."],
 },
 "brawl-boost": {
  status: "partially-modeled",
  notes: "Damage Reduction +5% stacking after Melee damage. Melee trigger not modeled.",
  modeledStatCoverage: ["playerDMGReduction"],
  unresolvedMechanics: ["Melee trigger not modeled. Stacking not modeled. Movement speed not modeled. Weapon-switch removal not tracked."],
  simulationWarnings: ["Brawl Boost reduction shown at max stacks. Requires melee damage to activate."],
 },

 // ── Patch 2025-08 Items ──────────────────────────────

 "aug-electron-cloud": {
  status: "partially-modeled",
  notes: "Power Surge shock AR. Electron Cloud zone triggered on reload — modeled as conditional proc. Zone damage formula not yet implemented.",
  modeledStatCoverage: ["powerSurgeDMGBonus", "statusDMGBonus", "elementalDMGBonus"],
  unresolvedMechanics: ["Electron Cloud zone damage formula pending in-game testing. Reload-triggered proc rate estimated."],
  simulationWarnings: ["AUG Electron Cloud shown with power surge DoT only. Zone damage is not included in projections."],
 },
 "compound-bow-burden-of-betrayal": {
  status: "partially-modeled",
  notes: "Kinetic bounce/crit crossbow. Bounce DMG +20%, Crit Rate +35%. Meta-specific bonuses (Bounce DMG +50%, Echo multiplier +40%) gated behind Meta target context — not applied to non-Meta targets. Bounce and Echo formulas pending.",
  modeledStatCoverage: ["critRate"],
  unresolvedMechanics: [
   "Bounce mechanic is pending — bounce DMG bonuses not in formula engine.",
   "Echo multiplier vs Metas (+40%) requires formula extension.",
   "Full-charge conditional not modeled. Damage assumes maximum charge state.",
   "Meta-specific bonuses only apply when target is a Meta enemy type.",
  ],
  simulationWarnings: [
   "Compound Bow bounce bonuses and Echo multiplier are tracked but not wired into projections.",
   "Meta-specific bonuses are gated: shown only when PvE target is a Meta-type enemy.",
  ],
 },
 "p90-holographic-resonance": {
  status: "partially-modeled",
  notes: "Shock SMG with power surge. Every 11th hit triggers shock AoE. AoE damage pending formula support.",
  modeledStatCoverage: ["powerSurgeDMGBonus", "statusDMGBonus", "elementalDMGBonus"],
  unresolvedMechanics: ["11-hit AoE proc damage formula pending. AoE radius and falloff not tracked."],
  simulationWarnings: ["P90 AoE burst damage not included in projections. Power Surge DoT shown only."],
 },
 "r500-memento": {
  status: "partially-modeled",
  notes: "Kinetic pistol with Fast Gunner. Weakspot DMG +40% while Fast Gunner active. 45% proc chance (non-weakspot) routed through weakspot uptime assumptions; 100% proc chance on weakspot hits.",
  modeledStatCoverage: ["weakspotDMG", "fastGunnerDMG"],
  unresolvedMechanics: [
   "Fast Gunner fire rate mechanic is pending.",
   "Proc chance: 45% base routed through weakspot uptime assumptions; 100% on weakspot confirmed.",
  ],
  simulationWarnings: [
   "R500 Fast Gunner weakspot DMG bonus shown at assumed uptime. Fast Gunner fire rate formula pending.",
  ],
 },
 "glide-pants": {
  status: "display-only",
  notes: "Glide/movement utility key gear. No direct combat damage impact.",
  simulationWarnings: ["Glide Pants are a movement utility item. Not reflected in damage projections."],
 },
};

/**
 * Derives formula support for any canonical item.
 * Falls back to keyword/tag-based heuristics when no explicit record exists.
 */
export function getFormulaSupport(item: AnyCanonicalItem): FormulaSupport {
 const explicit = KNOWN_ITEM_SUPPORT[item.id];
 if (explicit) return explicit;

 const kw = item.keywordAssociations ?? [];
 const tags = item.tags ?? [];

 if (item.confidence === "placeholder") {
  return {
   status: "unmodeled",
   notes: "This item has no structured registry entry. It contributes no modifiers or formula inputs and is excluded from damage projections.",
   simulationWarnings: ["This item has no formula support and does not affect damage output."],
  };
 }

 // Check keyword-based mechanics
 for (const keyword of kw) {
  const modeled = MODELED_MECHANICS[keyword];
  if (modeled) {
   const warnings: string[] = [];
   if (modeled.status !== "fully-modeled") {
    warnings.push(`Formula support for "${keyword}" is ${modeled.status.replace("-", " ")}. Some effects may not appear in projections.`);
   }
   return {
    status: modeled.status,
    notes: modeled.notes,
    modeledStatCoverage: modeled.modeledStats,
    unresolvedMechanics: PENDING_MECHANICS[keyword] ? [PENDING_MECHANICS[keyword]] : undefined,
    simulationWarnings: warnings.length > 0 ? warnings : undefined,
    modelSelection: modeled.modelSelection,
   };
  }
  const pending = PENDING_MECHANICS[keyword];
  if (pending) {
   return {
    status: "unmodeled",
    notes: `"${keyword}" mechanic not yet modeled.`,
    unresolvedMechanics: [pending],
    simulationWarnings: [`"${keyword}" keyword has no formula support. Projections will not include its effects.`],
   };
  }
 }

 // Fallback: tag-based heuristic
 if (tags.includes("pvp") || tags.includes("defensive") || tags.includes("survival") || tags.includes("crafting") || tags.includes("utility") || tags.includes("mobility")) {
  return {
   status: "display-only",
   notes: "Non-combat or utility-tagged item. No direct influence on damage formulas.",
   simulationWarnings: ["Utility/defensive items are display-only and not included in DPS projections."],
  };
 }

 if (tags.includes("food") || tags.includes("drink")) {
  return {
   status: "display-only",
   notes: "Generic food/drink item without modeled stat effects. Formula support requires explicit statModifiers and keyword associations.",
   simulationWarnings: ["This consumable is display-only. Its effects are not reflected in projections."],
  };
 }

 // No match
 return {
  status: "unmodeled",
  notes: "No keyword associations or modeled mechanics detected. Formula support status unknown.",
  simulationWarnings: ["This item has no formula support metadata. Projections will not include its effects."],
 };
}
