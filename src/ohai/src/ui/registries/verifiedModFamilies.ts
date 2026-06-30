import type { CanonicalMod, StatModifier } from "../itemTypes";

// Verified directly from in-game screen recordings and the user-provided
// "ModEffects+AvailSuffix" reference sheet (2026-06-25/26). The old generated
// mod-cores entries were raw machine translations of a Chinese data sheet
// and were mostly wrong (both names and, by extension, untrustworthy effect
// text) — this file replaces them with ground-truth names, effect text, and
// suffix pools for every weapon and gear mod family in the game.
//
// statModifiers / conditionalEffectId added 2026-06-27 to give these mods real
// numeric DPS contribution instead of pure cosmetic/blocked rows. Two paths:
// 1. `statModifiers` populated directly = the value IS the verified in-game
//   tooltip number, unconditional (no trigger/duration/stack gating), wired
//   straight into the formula engine at full value.
// 2. `conditionalEffectId` set = the mod is a proc/stack/duration mechanic.
//   The base stat magnitude in `statModifiers` is still the verified tooltip
//   number, but modEffectResolver scales it by the conditional engine's
//   estimated contributionFactor (expected uptime × expected stacks) before
//   it reaches the formula engine — exactly like cradle perks. See
//   conditionalEffectRegistry.ts for the per-mod estimation assumptions and
//   their explicit "this is a guess, not a verified rate" notes.
// Mods with neither are non-damage utility/cosmetic/unsupported-mechanic
// effects (HP recovery, magazine refills, Shrapnel/Bounce/Fortress Warfare
// mechanics not yet in the formula engine, etc.) and stay blocked/display-only
// on purpose — adding a fake number there would be worse than leaving it blank.

interface VerifiedModSpec {
 id: string;
 name: string;
 modSlot: CanonicalMod["modSlot"];
 weaponCategory?: string;
 effectSummary: string;
 /** Which suffix-mod pools can roll alongside this core mod, per the reference sheet. */
 suffixPool: string[];
 /** Set when the captured tooltip text is known to be cut off / incomplete. */
 incomplete?: boolean;
 /** Direct, unconditional stat contribution — only set when the effect has no trigger/duration/stack gating. */
 statModifiers?: StatModifier[];
 /** Key into conditionalEffectRegistry when this mod's contribution requires uptime/stack estimation. */
 conditionalEffectId?: string;
}

const WEAPON_MODS: VerifiedModSpec[] = [
 // ── Burn ──
 { id: "vmf-weapon-flame-resonance", name: "Flame Resonance", modSlot: "weapon", weaponCategory: "Burn", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Burn"], effectSummary: "Max Burn stack +2, Burn duration -20.0%.", statModifiers: [] /* stack-count/duration mechanic, not a direct dmg%; no formula-engine hook for max-stack-count yet */ },
 { id: "vmf-weapon-embers", name: "Embers", modSlot: "weapon", weaponCategory: "Burn", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Burn"], effectSummary: "When Burn is removed, stacks only -50.0%.", statModifiers: [] /* DoT-tail retention mechanic, no stat hook */ },
 { id: "vmf-weapon-blaze-blessing", name: "Blaze Blessing", modSlot: "weapon", weaponCategory: "Burn", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Burn"], effectSummary: "When defeating an enemy affected by Burn, gain +15.0% HP and +15.0% Status Resistance...", incomplete: true /* survivability, not DPS */ },
 { id: "vmf-weapon-burning-wrath", name: "Burning Wrath", modSlot: "weapon", weaponCategory: "Burn", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Burn"], effectSummary: "Triggering Burn has a 25.0% chance to grant +1.0 Burn stack(s).", statModifiers: [] /* grants extra DoT stacks, no direct %DMG stat to scale — needs burn-stack-count formula hook, not present */ },

 // ── Power Surge ──
 { id: "vmf-weapon-shock-rampage", name: "Shock Rampage", modSlot: "weapon", weaponCategory: "Power Surge", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Power Surge"], effectSummary: "Inflicting Power Surge grants +5.0% Power Surge Trigger Chance (based on weapon's Trigger Chance) for 5.0s, up to 4.0 stack(s).", statModifiers: [] /* trigger-chance buff, not a damage stat */ },
 { id: "vmf-weapon-shock-diffusion", name: "Shock Diffusion", modSlot: "weapon", weaponCategory: "Power Surge", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Power Surge"], effectSummary: "When triggering Power Surge, apply the Power Surge status to 1.0 enemy(s) within 10.0m of the target (prioritizes enemies not already affected by Power Surge).", statModifiers: [] /* multi-target spread, no single-target DPS stat */ },
 { id: "vmf-weapon-static-shock", name: "Static Shock", modSlot: "weapon", weaponCategory: "Power Surge", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Power Surge"], effectSummary: "Power Surge status duration +50.0%, Power Surge DMG +20.0%.", statModifiers: [{ stat: "powerSurgeDMGBonus", value: 0.20, unit: "percent" }] /* unconditional flat +20% Power Surge DMG; duration is non-DPS and not modeled */ },
 { id: "vmf-weapon-surge-amplifier", name: "Surge Amplifier", modSlot: "weapon", weaponCategory: "Power Surge", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Power Surge"], effectSummary: "Inflicting Power Surge grants Power Surge DMG +5.0% for 3.0s, up to 4.0 stack(s).", statModifiers: [{ stat: "powerSurgeDMGBonus", value: 0.05, unit: "percent" }], conditionalEffectId: "vmf-surge-amplifier" /* base value is per-stack tooltip number (5%); conditional engine scales by est. uptime+stacks */ },

 // ── Frost ──
 { id: "vmf-weapon-shattering-ice", name: "Shattering Ice", modSlot: "weapon", weaponCategory: "Frost", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Frost Vortex"], effectSummary: "When an enemy at the center of the Frost Vortex is defeated, deal 50.0% Psi Intensity Ice DMG to enemies within 1.0m once." /* on-kill AoE burst, no recurring DPS stat to populate without inventing a per-second rate */ },
 { id: "vmf-weapon-cryo-blast", name: "Cryo Blast", modSlot: "weapon", weaponCategory: "Frost", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Frost Vortex"], effectSummary: "After triggering Frost Vortex, increases Frost Vortex DMG by +4.0%, up to 5.0 stacks, lasting 4s.", statModifiers: [{ stat: "frostVortexDMGBonus", value: 0.04, unit: "percent" }], conditionalEffectId: "vmf-cryo-blast" },
 { id: "vmf-weapon-cryo-catalyst", name: "Cryo Catalyst", modSlot: "weapon", weaponCategory: "Frost", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Frost Vortex"], effectSummary: "Frost Vortex DMG +10.0%. After triggering a Frost construct (Ice Spikes, Ice Missiles, Ice Crystals), Frost Vortex DMG +5.0% for 4.0s.", statModifiers: [{ stat: "frostVortexDMGBonus", value: 0.10, unit: "percent" }] /* the unconditional +10% base line is wired directly; the +5%/4s construct-proc line is left unmodeled (separate trigger source, would need its own conditional def and double counting risk) */ },
 { id: "vmf-weapon-frosty-blessing", name: "Frosty Blessing", modSlot: "weapon", weaponCategory: "Frost", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Frost Vortex"], effectSummary: "When Frost Vortex disappears, restore 10.0% HP." /* survivability, not DPS */ },

 // ── Bullseye ──
 { id: "vmf-weapon-recover-mark", name: "Recover Mark", modSlot: "weapon", weaponCategory: "Bullseye", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "The Bull's Eye"], effectSummary: "When defeating marked enemies, recover 15.0% HP and 25.0% Stamina." /* survivability, not DPS */ },
 { id: "vmf-weapon-hunters-perk", name: "Hunter's Perk", modSlot: "weapon", weaponCategory: "Bullseye", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "The Bull's Eye"], effectSummary: "Marked enemies deal DMG -20.0% vs. Metas." /* incoming-DMG reduction from a specific enemy type, not an outgoing DPS stat */ },
 { id: "vmf-weapon-spreading-marks", name: "Spreading Marks", modSlot: "weapon", weaponCategory: "Bullseye", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "The Bull's Eye"], effectSummary: "When a marked enemy is defeated, The Bull's Eye mark spreads to 1.0 enemy(s) within 15.0m." /* multi-target utility, no single-target DPS stat */ },
 { id: "vmf-weapon-vulnerability-amplifier", name: "Vulnerability Amplifier", modSlot: "weapon", weaponCategory: "Bullseye", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "The Bull's Eye"], effectSummary: "The Bull's Eye adds Vulnerability +8.0%.", statModifiers: [{ stat: "weaponVulnerability", value: 0.08, unit: "percent" }], conditionalEffectId: "vmf-vulnerability-amplifier" /* only active while target carries the Bull's Eye mark */ },

 // ── Fortress Warfare ──
 { id: "vmf-weapon-united-we-stand", name: "United We Stand", modSlot: "weapon", weaponCategory: "Fortress Warfare", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Fortress Warfare"], effectSummary: "The more players inside the Fortress Warfare area, the greater the Weapon DMG bonus, up to 40%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.40, unit: "percent" }], conditionalEffectId: "vmf-united-we-stand" /* scales with squad headcount in the zone — base value is the verified max (40%); engine treats it as a Fortress-Warfare-uptime-gated effect and additionally discounts for squad-size uncertainty, documented in the registry entry */ },
 { id: "vmf-weapon-durable-territory", name: "Durable Territory", modSlot: "weapon", weaponCategory: "Fortress Warfare", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Fortress Warfare"], effectSummary: "Every hit landed while in Fortress Warfare state extends the Fortress Warfare effect by 1.0s, up to 5.0s." /* duration-extension utility, not a damage stat itself */ },
 { id: "vmf-weapon-portable-territory", name: "Portable Territory", modSlot: "weapon", weaponCategory: "Fortress Warfare", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Fortress Warfare"], effectSummary: "After leaving Fortress Warfare, the status is retained for 2.0s." /* duration utility, not a damage stat */ },
 { id: "vmf-weapon-final-territory", name: "Final Territory", modSlot: "weapon", weaponCategory: "Fortress Warfare", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Fortress Warfare"], effectSummary: "When Fortress Warfare ends, Weapon DMG +2.0%, Movement Speed +10.0% for 10.0s.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.02, unit: "percent" }], conditionalEffectId: "vmf-final-territory" },

 // ── Unstable Bomber ──
 { id: "vmf-weapon-super-charged", name: "Super Charged", modSlot: "weapon", weaponCategory: "Unstable Bomber", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Unstable Bomber"], effectSummary: "Triggering Unstable Bomber grants Unstable Bomber DMG +5.0% for 3.0s. Stacks up to 6.0 time(s).", statModifiers: [{ stat: "unstableBomberDMGBonus", value: 0.05, unit: "percent" }], conditionalEffectId: "vmf-super-charged" },
 { id: "vmf-weapon-reckless-bomber", name: "Reckless Bomber", modSlot: "weapon", weaponCategory: "Unstable Bomber", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Unstable Bomber"], effectSummary: "For every 1.0% Crit Rate, Unstable Bomber DMG +0.5%." /* scales off the build's own Crit Rate total, which is not known at mod-registry-authoring time — would require a build-aware formula hook this engine doesn't have; left unmodeled rather than guessing a Crit Rate assumption */ },
 { id: "vmf-weapon-bombardier-souvenir", name: "Bombardier Souvenir", modSlot: "weapon", weaponCategory: "Unstable Bomber", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Unstable Bomber"], effectSummary: "When triggering Unstable Bomber, automatically refill 10.0% of your magazine." /* ammo-economy utility, not a damage stat */ },
 { id: "vmf-weapon-heavy-explosives", name: "Heavy Explosives", modSlot: "weapon", weaponCategory: "Unstable Bomber", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Unstable Bomber"], effectSummary: "Unstable Bomber inflicts stagger on enemies and deals 40.0% less damage to you." /* defensive trade-off, not outgoing DPS */ },

 // ── Fast Gunner ──
 { id: "vmf-weapon-shoot-out", name: "Shoot Out", modSlot: "weapon", weaponCategory: "Fast Gunner", suffixPool: ["General", "Precision", "Violent", "Deviant Energy", "Survival", "Fast Gunner"], effectSummary: "When triggering Fast Gunner, Weapon DMG +1.5% for 10.0s, up to 20.0 stack(s).", statModifiers: [{ stat: "weaponDMGBonus", value: 0.015, unit: "percent" }], conditionalEffectId: "vmf-shoot-out" },
 { id: "vmf-weapon-precision-rush", name: "Precision Rush", modSlot: "weapon", weaponCategory: "Fast Gunner", suffixPool: ["General", "Precision", "Violent", "Deviant Energy", "Survival", "Fast Gunner"], effectSummary: "When Fast Gunner is active, Weakspot DMG increases over 3s, up to +45.0%.", statModifiers: [{ stat: "weakspotDMG", value: 0.45, unit: "percent" }], conditionalEffectId: "vmf-precision-rush" /* base value is the verified ramp ceiling (45%); engine discounts because the ramp rarely sits at max for the full Fast Gunner window */ },
 { id: "vmf-weapon-shooting-blitz", name: "Shooting Blitz", modSlot: "weapon", weaponCategory: "Fast Gunner", suffixPool: ["General", "Precision", "Violent", "Deviant Energy", "Survival", "Fast Gunner"], effectSummary: "Fast Gunner duration +4s. When Fast Gunner is active, Weapon DMG +15%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }], conditionalEffectId: "vmf-shooting-blitz" /* the +4s duration line itself isn't separately modeled (it feeds the uptime assumption, not a stat) */ },
 { id: "vmf-weapon-cowboy", name: "Cowboy", modSlot: "weapon", weaponCategory: "Fast Gunner", suffixPool: ["General", "Precision", "Violent", "Deviant Energy", "Survival", "Fast Gunner"], effectSummary: "After reloading an empty magazine, Fast Gunner Trigger Chance +100.0% (based on weapon's Trigger Chance) for 5.0s. When Fast Gunner reaches max stacks, the effect extends to 5.0s." /* trigger-chance buff, not a damage stat */ },

 // ── Bounce ──
 { id: "vmf-weapon-super-bullet", name: "Super Bullet", modSlot: "weapon", weaponCategory: "Bounce", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Bounce"], effectSummary: "Bounce Crit Rate +10.0%, Bounce Crit DMG +25.0%." /* Bounce-specific crit stats — formula engine has no bounceCritRate/bounceCritDMG stat keys (bounceDMGBonus is "pending"); left unmodeled to avoid inventing a mapping */ },
 { id: "vmf-weapon-multi-bounce", name: "Multi-Bounce", modSlot: "weapon", weaponCategory: "Bounce", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Bounce"], effectSummary: "The more Bounces, the higher the damage, up to +45.0% (-15.0% per Bounce)." /* bounceDMGBonus is formula-engine "pending" status — see Phase notes */ },
 { id: "vmf-weapon-boomerang-bullet", name: "Boomerang Bullet", modSlot: "weapon", weaponCategory: "Bounce", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Bounce"], effectSummary: "Each time Bounce is triggered, its trigger chance increases +100.0% (based on weapon's Trigger Chance) for 5.0s, stacking up to 10.0 time(s)." /* trigger-chance buff, not a damage stat */ },
 { id: "vmf-weapon-bounce-rampage", name: "Bounce Rampage", modSlot: "weapon", weaponCategory: "Bounce", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Bounce"], effectSummary: "The more selectable targets Bounce has, the higher the Bounce DMG, up to +45.0% (-15.0% per target)." /* bounceDMGBonus pending in formula engine */ },

 // ── Shrapnel ──
 { id: "vmf-weapon-shatter-them-all", name: "Shatter Them All", modSlot: "weapon", weaponCategory: "Shrapnel", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Shrapnel"], effectSummary: "The more parts Shrapnel hits, the higher the Shrapnel DMG. Each part +15%, up to 45%." /* shrapnelDMGBonus is formula-engine "pending" status */ },
 { id: "vmf-weapon-shrapnel-souvenir", name: "Shrapnel Souvenir", modSlot: "weapon", weaponCategory: "Shrapnel", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Shrapnel"], effectSummary: "When Shrapnel hits a Weakspot, automatically refills 1.0 bullet(s) from inventory." /* ammo-economy utility */ },
 { id: "vmf-weapon-shrapnel-smash", name: "Shrapnel Smash", modSlot: "weapon", weaponCategory: "Shrapnel", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Shrapnel"], effectSummary: "Triggering Shrapnel grants Shrapnel Crit Rate +2.0% for 2.0s. Stacks up to 15.0 time(s)." /* shrapnelCritDMGBonus exists but no shrapnelCritRate stat key in schema; left unmodeled */ },
 { id: "vmf-weapon-shield-breaker", name: "Shield Breaker", modSlot: "weapon", weaponCategory: "Shrapnel", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Shrapnel"], effectSummary: "When hitting a shielded enemy, Shrapnel DMG +60.0% for 1s.", statModifiers: [{ stat: "shrapnelDMGBonus", value: 0.60, unit: "percent" }], conditionalEffectId: "vmf-shield-breaker" /* statModifiers populated for future-proofing once shrapnelDMGBonus moves off "pending"; conditional engine still scales it down since it's gated on shielded targets, which are not present in every fight */ },
];

const HELMET_SUFFIX_POOL = ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Lunar Deviant Energy", "Crescent"];
const TOP_SUFFIX_POOL = ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Wild Deviant Energy", "Phantasmal Deviant Energy", "Battle", "Lunar Deviant Energy", "Mirror"];
const BOTTOMS_SUFFIX_POOL = ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Downstar", "Resonance Deviant Energy", "Resonance"];
const SHOES_SUFFIX_POOL = ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Wild Deviant Energy", "Downstar Deviant Energy", "Mirror", "Mirror Deviant Energy", "Battle", "Wild"];
const GLOVES_SUFFIX_POOL = ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Resonance", "Resonance Deviant Energy"];
const maskPool = (family: string) => ["General", "Violent", "Precision", "Deviant Energy", "Survival", family];

const GEAR_MODS: VerifiedModSpec[] = [
 // Helmet
 { id: "vmf-head-precise-strike", name: "Precise Strike", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "Hitting a weakspot grants Weakspot DMG +12.0% for 3.0s. Stacks 3.0 times.", statModifiers: [{ stat: "weakspotDMG", value: 0.12, unit: "percent" }], conditionalEffectId: "vmf-precise-strike" },
 { id: "vmf-head-deviation-expert", name: "Deviation Expert", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "Deviation Power Recovery Rate +10.0%, Status DMG +20.0%.", statModifiers: [{ stat: "statusDMGBonus", value: 0.20, unit: "percent" }] /* unconditional; recovery rate is non-DPS utility and not modeled */ },
 { id: "vmf-head-first-move-advantage", name: "First-Move Advantage", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "After reloading, Crit Rate +10.0%, Crit DMG +20.0% for 2.0s.", statModifiers: [{ stat: "critRate", value: 0.10, unit: "percent" }, { stat: "critDMG", value: 0.20, unit: "percent" }], conditionalEffectId: "vmf-first-move-advantage" },
 { id: "vmf-head-mag-expansion", name: "Mag Expansion", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "When reloading an empty magazine, Magazine Capacity +30.0%." /* magazineCapacity is formula-engine "unmodeled" (no DPS hook); left blocked */ },
 { id: "vmf-head-work-of-proficiency", name: "Work of Proficiency", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "When reloading with an empty magazine, Reload Efficiency +5.0%, Elemental DMG +20.0%. Resets with the next reload.", statModifiers: [{ stat: "elementalDMGBonus", value: 0.20, unit: "percent" }], conditionalEffectId: "vmf-work-of-proficiency" /* reload efficiency is non-DPS and not modeled */ },
 { id: "vmf-head-fateful-strike", name: "Fateful Strike", modSlot: "head", suffixPool: ["General", "Violent", "Deviant Energy (x2)", "Survival", "Lunar Deviant Energy", "Crescent"], effectSummary: "Cannot deal Weakspot DMG; Crit Rate +10.0% and Crit DMG +30.0%.", statModifiers: [{ stat: "critRate", value: 0.10, unit: "percent" }, { stat: "critDMG", value: 0.30, unit: "percent" }] /* unconditional always-active trade-off (loses weakspot dmg entirely, which the formula engine does not currently zero out automatically — see sourceNotes) */ },
 { id: "vmf-head-momentum-up", name: "Momentum Up", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "Fire Rate +10.0% for the first 50% of the magazine, Weapon DMG +30.0% for the next 50% of the magazine.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.30, unit: "percent" }], conditionalEffectId: "vmf-momentum-up" /* only the back half of the mag gets the +30% DMG line; fire-rate line on the front half is a separate non-damage stat and not modeled */ },
 { id: "vmf-head-elemental-havoc", name: "Elemental Havoc", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "Elemental DMG +10.0%. When HP is above 90%, an additional +10.0%.", statModifiers: [{ stat: "elementalDMGBonus", value: 0.10, unit: "percent" }], conditionalEffectId: "vmf-elemental-havoc" /* the unconditional +10% base is folded into the conditional entry's floor so the registry only needs one row; see notes for the HP>90% assumption */ },
 { id: "vmf-head-weapon-symphony", name: "Weapon Symphony", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "After switching weapons, Fire Rate +10.0%, Weapon DMG +25.0%. Decreases by 5.0% per second, up to a maximum decrease of 50.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.25, unit: "percent" }], conditionalEffectId: "vmf-weapon-symphony" /* base value is the verified peak (25%) immediately after a weapon swap; it decays over the following several seconds */ },
 { id: "vmf-head-quick-toss", name: "Quick Toss", modSlot: "head", suffixPool: HELMET_SUFFIX_POOL, effectSummary: "After using a throwable, Fire Rate +15.0% for 8.0s; reload 50.0% of the previously equipped weapon's magazine (triggers every 12.0s)." /* fire rate is non-DPS-stat in this engine's sense (no fireRate→DPS hook beyond display); left unmodeled */ },

 // Top -> chest (all defensive/survivability — none affect outgoing DPS; intentionally left without statModifiers)
 { id: "vmf-chest-head-on-conflict", name: "Head-on Conflict", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "Having enemies within 7m around you grants 10% DMG Reduction. Taking melee DMG from enemies grants an extra 10% DMG Reduction for 5s." },
 { id: "vmf-chest-head-guard", name: "Head Guard", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "Weakspot DMG taken -15.0%. An additional -15.0% when HP is above 60.0%." },
 { id: "vmf-chest-resist-advantage", name: "Resist Advantage", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "When out of combat, gain 1 stack of 10.0% DMG Reduction every 5.0s, up to 5.0 stacks. 1 stack is removed when hit." },
 { id: "vmf-chest-enduring-shield", name: "Enduring Shield", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "When out of combat, gain 1 stack of Safe Haven every 5.0s, up to 5.0 stacks. For every 5 damage received, remove 1 stack of Safe Haven to gain 8.0% Shield for 5.0s." },
 { id: "vmf-chest-status-immune", name: "Status Immune", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "When HP drops below 60%, purges all Deviated States (Burn, Frost Vortex, Bull's Eye, Power Surge)." },
 { id: "vmf-chest-ardent-shield", name: "Ardent Shield", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "While the shield is active, gain 15.0% DMG Reduction. When shield exceeds 1,000, single instances of DMG will not penetrate the shield." },
 { id: "vmf-chest-rejuvenating", name: "Rejuvenating", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "When Shield is above 30% of Max HP, defeating an enemy recovers 20% of Max HP. Excess recovery converts into Shield lasting 20s (Cooldown: 10s)." },
 { id: "vmf-chest-critical-rescue", name: "Critical Rescue", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "DMG Reduction +20% and Healing Received +20% when HP is below 30%." },
 { id: "vmf-chest-healing-fortification", name: "Healing Fortification", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "When using a healing shot, DMG Reduction +40% for 2s." },
 { id: "vmf-chest-quick-comeback", name: "Quick Comeback", modSlot: "chest", suffixPool: TOP_SUFFIX_POOL, effectSummary: "When using a healing shot, Movement Speed +20% for 2s and refills the magazine from inventory to 100%." },

 // Bottoms -> pants
 { id: "vmf-pants-reload-rampage", name: "Reload Rampage", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "After killing an enemy, refill 2 bullets from reserves (not exceeding 50% of magazine capacity). Weapon DMG and Weakspot DMG +15.0% until next reload.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }, { stat: "weakspotDMG", value: 0.15, unit: "percent" }], conditionalEffectId: "vmf-reload-rampage" },
 { id: "vmf-pants-three-strikes", name: "Three Strikes", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "Hitting 3 weakspots in a row after reloading (not exceeding 50% of magazine capacity) grants Weakspot DMG +50.0%.", statModifiers: [{ stat: "weakspotDMG", value: 0.50, unit: "percent" }], conditionalEffectId: "vmf-three-strikes" /* requires 3 consecutive weakspot hits after every reload to refresh — significantly gated, see notes */ },
 { id: "vmf-pants-bullet-siphon", name: "Bullet Siphon", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "Weapon DMG +5.0%. Every 5 bullets consumed in the magazine grants +4.0% Weapon DMG, capped at +20.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.05, unit: "percent" }], conditionalEffectId: "vmf-bullet-siphon" /* the unconditional +5% floor is folded into the conditional entry alongside the ramping +20% cap so only one registry row is needed */ },
 { id: "vmf-pants-deadshot", name: "Deadshot", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "Each Crit hit grants Weapon DMG +4.0% for 15.0s. Stacks up to 3.0 time(s). Removed upon the next reload.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.04, unit: "percent" }], conditionalEffectId: "vmf-deadshot" },
 { id: "vmf-pants-abnormal-increase", name: "Abnormal Increase", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "When the magazine is empty, Status DMG +8% for 12s. Stacks 3 times.", statModifiers: [{ stat: "statusDMGBonus", value: 0.08, unit: "percent" }], conditionalEffectId: "vmf-abnormal-increase" },
 { id: "vmf-pants-melee-momentum", name: "Melee Momentum", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "Melee DMG +20%. Defeating an enemy with a Melee attack restores 30% of Max Stamina.", statModifiers: [{ stat: "meleeDMGBonus", value: 0.20, unit: "percent" }] /* unconditional melee dmg line; stamina restore is non-DPS utility */ },
 { id: "vmf-pants-unstoppable", name: "Unstoppable", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "Weapon DMG +20.0% when a bullet hits an enemy from 15.0m away. For every additional 1.0m beyond that, Weapon DMG +1.0%, up to +20.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.20, unit: "percent" }], conditionalEffectId: "vmf-unstoppable" /* base value is the verified floor (20% at 15m); the ramp to +20% additional needs a player-distance assumption, not just on/off, see notes */ },
 { id: "vmf-pants-precision-charge", name: "Precision Charge", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "For every 10% of Weakspot hit percentage from the last clip, Elemental DMG +4%, up to a maximum of 24%, lasting 10s. Resets upon reload.", statModifiers: [{ stat: "elementalDMGBonus", value: 0.24, unit: "percent" }], conditionalEffectId: "vmf-precision-charge" /* base value is the verified cap (24%); conditional engine discounts because it requires consistently high weakspot accuracy across the whole previous magazine */ },
 { id: "vmf-pants-elemental-resonance", name: "Elemental Resonance", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "For each instance of Elemental DMG dealt from the previous magazine, the next magazine gains Elemental DMG +1.0% for 15.0s upon reloading, up to +24.0%.", statModifiers: [{ stat: "elementalDMGBonus", value: 0.24, unit: "percent" }], conditionalEffectId: "vmf-elemental-resonance" },
 { id: "vmf-pants-critical-surge", name: "Critical Surge", modSlot: "pants", suffixPool: BOTTOMS_SUFFIX_POOL, effectSummary: "When the magazine is empty, Crit DMG +15.0% for 8.0s. Stacks independently, up to 3.0 stack(s).", statModifiers: [{ stat: "critDMG", value: 0.15, unit: "percent" }], conditionalEffectId: "vmf-critical-surge" },

 // Shoes -> boots
 { id: "vmf-boots-covered-advance", name: "Covered Advance", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Taking no DMG within 4.0s grants +20.0% Melee, Weapon, and Status DMG for 30s. Resets when the duration ends.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.20, unit: "percent" }, { stat: "statusDMGBonus", value: 0.20, unit: "percent" }, { stat: "meleeDMGBonus", value: 0.20, unit: "percent" }], conditionalEffectId: "vmf-covered-advance" /* requires staying unhit for 4s, which is unreliable in active combat — see conservative uptime note */ },
 { id: "vmf-boots-ruthless-reaper", name: "Ruthless Reaper", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "After killing 2.0 enemies, reload 100.0% of the magazine from reserves." /* ammo-economy utility, not a damage stat */ },
 { id: "vmf-boots-rush-hour", name: "Rush Hour", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Every 10% HP loss grants +4.0% Melee, Weapon, and Status DMG.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.04, unit: "percent" }, { stat: "statusDMGBonus", value: 0.04, unit: "percent" }, { stat: "meleeDMGBonus", value: 0.04, unit: "percent" }], conditionalEffectId: "vmf-rush-hour" /* per-10%-HP-lost stack; scaling depends entirely on how low the player's HP runs, which is a playstyle choice, not a fixed rate — see notes */ },
 { id: "vmf-boots-ferocious-charge", name: "Ferocious Charge", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Killing enemies within 10m grants Weapon and Status DMG +20.0% for 8s.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.20, unit: "percent" }, { stat: "statusDMGBonus", value: 0.20, unit: "percent" }], conditionalEffectId: "vmf-ferocious-charge" },
 { id: "vmf-boots-secluded-strike", name: "Secluded Strike", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Having no enemies within 7m grants +15.0% Weapon and Status DMG.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }, { stat: "statusDMGBonus", value: 0.15, unit: "percent" }], conditionalEffectId: "vmf-secluded-strike" /* anti-synergy with melee/close-range play; assumes mid/long-range solo PvE engagement, see notes */ },
 { id: "vmf-boots-slow-and-steady", name: "Slow and Steady", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Melee, Weapon, Status DMG +10.0%. Staying still for 4.0s grants +10.0% additional DMG.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.10, unit: "percent" }, { stat: "statusDMGBonus", value: 0.10, unit: "percent" }, { stat: "meleeDMGBonus", value: 0.10, unit: "percent" }], conditionalEffectId: "vmf-slow-and-steady" /* the unconditional +10% floor is folded in alongside the standing-still +10% bonus so only one registry row is needed */ },
 { id: "vmf-boots-against-all-odds", name: "Against All Odds", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Weapon and Status DMG +10.0%. For every 10% max HP consumed, an additional +5.0%, stacking up to 3.0 time(s).", statModifiers: [{ stat: "weaponDMGBonus", value: 0.10, unit: "percent" }, { stat: "statusDMGBonus", value: 0.10, unit: "percent" }], conditionalEffectId: "vmf-against-all-odds" /* base unconditional +10% folded in; the HP-consumption stacks need an assumption about how low HP is allowed to run, see notes */ },
 { id: "vmf-boots-power-of-striving", name: "Power of Striving", modSlot: "boots", suffixPool: SHOES_SUFFIX_POOL, effectSummary: "Weapon and Status DMG +10.0%. Every 20 Stamina consumed grants an additional DMG boost, up to +20.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.10, unit: "percent" }, { stat: "statusDMGBonus", value: 0.10, unit: "percent" }], conditionalEffectId: "vmf-power-of-striving" /* base unconditional +10% folded in; stamina-consumption ramp needs an assumption about sprint/dodge frequency, see notes */ },

 // Gloves — all unconditional, always-active stat lines
 { id: "vmf-gloves-grit-boost", name: "Grit Boost", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Weapon DMG -10.0%, Crit DMG +15.0%, Crit Rate +15.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: -0.10, unit: "percent" }, { stat: "critDMG", value: 0.15, unit: "percent" }, { stat: "critRate", value: 0.15, unit: "percent" }] },
 { id: "vmf-gloves-crit-amplifier", name: "Crit Amplifier", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Weapon DMG -10.0%, Crit DMG +30.0%, Crit Rate +10.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: -0.10, unit: "percent" }, { stat: "critDMG", value: 0.30, unit: "percent" }, { stat: "critRate", value: 0.10, unit: "percent" }] },
 { id: "vmf-gloves-weakspot-dmg-boost", name: "Weakspot DMG Boost", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Weakspot DMG +25%.", statModifiers: [{ stat: "weakspotDMG", value: 0.25, unit: "percent" }] },
 { id: "vmf-gloves-lifeforce-boost", name: "Lifeforce Boost", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Max HP +12%." /* survivability, not DPS — left unmodeled on purpose, maxHP is "incoming"-routed in statSemantics anyway */ },
 { id: "vmf-gloves-flame-resonance", name: "Flame Resonance", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Increases the maximum Burn stacks inflicted on enemies by 2, but reduces Burn duration by 20%." /* stack-count/duration mechanic, no %DMG stat hook */ },
 { id: "vmf-gloves-weapon-amplifier", name: "Weapon Amplifier", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Weapon DMG +15%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }] },
 { id: "vmf-gloves-melee-amplifier", name: "Melee Amplifier", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Melee DMG +40.0%, Weapon DMG -20.0%.", statModifiers: [{ stat: "meleeDMGBonus", value: 0.40, unit: "percent" }, { stat: "weaponDMGBonus", value: -0.20, unit: "percent" }] },
 { id: "vmf-gloves-elemental-overload", name: "Elemental Overload", modSlot: "gloves", suffixPool: GLOVES_SUFFIX_POOL, effectSummary: "Elemental DMG (Blaze, Frost, Shock, Blast) +18.0%.", statModifiers: [{ stat: "elementalDMGBonus", value: 0.18, unit: "percent" }] },

 // Mask
 { id: "vmf-mask-blaze-amplifier", name: "Blaze Amplifier", modSlot: "mask", suffixPool: maskPool("Burn"), effectSummary: "Every stack of Burn grants +3% Psi Intensity DMG.", statModifiers: [{ stat: "burnDMGBonus", value: 0.03, unit: "percent" }], conditionalEffectId: "vmf-blaze-amplifier" /* per-stack scaling; conditional engine assumes a moderate average burn-stack count rather than max stacks, see notes */ },
 { id: "vmf-mask-frost-construct", name: "Frost Construct", modSlot: "mask", suffixPool: maskPool("Frost Vortex"), effectSummary: "Frost Constructs (Ice Spikes, Ice Missiles, Ice Crystals) deal +10% damage; if the target is in Frost Vortex status, damage dealt is +10% additional." /* Frost Construct damage (Ice Spikes/Missiles/Crystals) has no dedicated stat key in the formula engine — left unmodeled rather than misapplying to frostVortexDMGBonus */ },
 { id: "vmf-mask-explosive-shrapnel", name: "Explosive Shrapnel", modSlot: "mask", suffixPool: maskPool("Shrapnel"), effectSummary: "The 20th Shrapnel is explosive and deals +300% DMG as a critical hit." /* one-in-twenty proc on shrapnelDMGBonus, which is itself formula-engine "pending" — left unmodeled */ },
 { id: "vmf-mask-precision-bounce", name: "Precision Bounce", modSlot: "mask", suffixPool: maskPool("Bounce"), effectSummary: "After triggering Bounce 8 times, the next bullet's Bounce DMG +120.0%." /* bounceDMGBonus is formula-engine "pending" — left unmodeled */ },
 { id: "vmf-mask-explosive-barrage", name: "Explosive Barrage", modSlot: "mask", suffixPool: maskPool("Fast Gunner"), effectSummary: "When in Fast Gunner state, Crit Rate +10.0% and Weapon DMG +10.0%.", statModifiers: [{ stat: "critRate", value: 0.10, unit: "percent" }, { stat: "weaponDMGBonus", value: 0.10, unit: "percent" }], conditionalEffectId: "vmf-explosive-barrage" },
 { id: "vmf-mask-pinpoint-strike", name: "Pinpoint Strike", modSlot: "mask", suffixPool: maskPool("Unstable Bomber"), effectSummary: "When Unstable Bomber hits only one enemy, Unstable Bomber final DMG +35.0%.", statModifiers: [{ stat: "unstableBomberDMGBonus", value: 0.35, unit: "percent" }], conditionalEffectId: "vmf-pinpoint-strike" /* single-target-only condition; assumes mostly solo-target PvE, see notes */ },
 { id: "vmf-mask-targeted-strike", name: "Targeted Strike", modSlot: "mask", suffixPool: ["General", "Violent", "Precision", "Deviant Energy", "Survival", "Contextual Keyword"], effectSummary: "When attacking enemies inflicted with The Bull's Eye status, Crit Rate +10%, Crit DMG +25%.", statModifiers: [{ stat: "critRate", value: 0.10, unit: "percent" }, { stat: "critDMG", value: 0.25, unit: "percent" }], conditionalEffectId: "vmf-targeted-strike" /* requires the target to be marked with The Bull's Eye, which itself requires a Bullseye-category weapon mod equipped — engine cannot currently verify that cross-mod dependency, so uptime is treated conservatively, see notes */ },
 { id: "vmf-mask-thunderclap", name: "Thunderclap", modSlot: "mask", suffixPool: maskPool("Power Surge"), effectSummary: "After triggering Power Surge 20 times, the next bullet summons Thunder (Shock DMG of 200.0% Psi Intensity)." /* one-in-twenty proc dealing flat psiIntensity-based burst, not a %DMG bonus stat — left unmodeled to avoid inventing a per-second average from a flat burst number */ },
 { id: "vmf-mask-light-cannon", name: "Light Cannon", modSlot: "mask", suffixPool: maskPool("Fortress Warfare"), effectSummary: "Removes Super Armor but increases Attack +15% while in Fortress Warfare state.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }], conditionalEffectId: "vmf-light-cannon" /* "Attack" mapped to weaponDMGBonus per the existing convention used elsewhere in this file (e.g. Light Cannon/Unbreakable/Most Wanted all say "Attack" in the verified text) */ },
 { id: "vmf-mask-unbreakable", name: "Unbreakable", modSlot: "mask", suffixPool: maskPool("Fortress Warfare"), effectSummary: "Fortress Warfare Range +30.0%. While in Fortress Warfare state, Attack +15.0%.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }], conditionalEffectId: "vmf-unbreakable" /* range is non-DPS utility and not modeled */ },
 { id: "vmf-mask-retrusion-explosion", name: "Retrusion Explosion", modSlot: "mask", suffixPool: maskPool("Burn"), effectSummary: "When hitting Burning enemies, Crit Rate +8.0% and Crit DMG +20.0%.", statModifiers: [{ stat: "critRate", value: 0.08, unit: "percent" }, { stat: "critDMG", value: 0.20, unit: "percent" }], conditionalEffectId: "vmf-retrusion-explosion" },
 { id: "vmf-mask-shrapnel-carnage", name: "Shrapnel Carnage", modSlot: "mask", suffixPool: maskPool("Shrapnel"), effectSummary: "Shrapnel Weakspot Hit Weight +100.0%. Shrapnel Multiplier +0.1." /* both lines target Shrapnel-specific mechanics with no formula-engine stat key — left unmodeled */ },
 { id: "vmf-mask-first-electrocution", name: "First Electrocution", modSlot: "mask", suffixPool: maskPool("Power Surge"), effectSummary: "For enemies without Power Surge status, Power Surge's final DMG +35.0%.", statModifiers: [{ stat: "powerSurgeDMGBonus", value: 0.35, unit: "percent" }], conditionalEffectId: "vmf-first-electrocution" /* only applies to the first application before Power Surge is already active on a target — heavily front-loaded, see notes */ },
 { id: "vmf-mask-frostwave-wither", name: "Frostwave Wither", modSlot: "mask", suffixPool: maskPool("Frost Vortex"), effectSummary: "Frost Vortex's final DMG +30.0%, decreasing by 6.0% per second over time.", statModifiers: [{ stat: "frostVortexDMGBonus", value: 0.30, unit: "percent" }], conditionalEffectId: "vmf-frostwave-wither" /* base value is the verified peak (30%) immediately on trigger; it decays 6%/s afterward */ },
 { id: "vmf-mask-most-wanted", name: "Most Wanted", modSlot: "mask", suffixPool: maskPool("The Bull's Eye"), effectSummary: "Every time an enemy is marked, Attack +8.0%. Stacks up to 3.0 times.", statModifiers: [{ stat: "weaponDMGBonus", value: 0.08, unit: "percent" }], conditionalEffectId: "vmf-most-wanted" },
 { id: "vmf-mask-break-bounce", name: "Break Bounce", modSlot: "mask", suffixPool: maskPool("Bounce"), effectSummary: "When a bullet hits an enemy above 50.0% HP, the bullet's final DMG +25.0%." /* applies to bounceDMGBonus-adjacent "bullet final DMG", formula-engine "pending" for Bounce — left unmodeled */ },
 { id: "vmf-mask-blitzkrieg", name: "Blitzkrieg", modSlot: "mask", suffixPool: maskPool("Fast Gunner"), effectSummary: "Fast Gunner's Maximum Stacks +5, and each stack additionally increases Fire Rate by 1%." /* fire rate stacking, no DPS stat hook in this engine */ },
 { id: "vmf-mask-delayed-blast", name: "Delayed Blast", modSlot: "mask", suffixPool: maskPool("Unstable Bomber"), effectSummary: "Before the bomb explodes, for every 4 hits taken, the bomb's final DMG +25.0%.", statModifiers: [{ stat: "unstableBomberDMGBonus", value: 0.25, unit: "percent" }], conditionalEffectId: "vmf-delayed-blast" /* per-4-hits-taken stacking; depends on incoming hits before the bomb detonates, which is target/encounter-dependent, see notes */ },
];

function toCanonicalMod(spec: VerifiedModSpec): CanonicalMod {
 const hasDirectMods = !!spec.statModifiers && spec.statModifiers.length > 0;
 const conditionalNote = spec.conditionalEffectId
  ? ` Contribution scaled by estimated uptime/stacks via conditionalEffectRegistry["${spec.conditionalEffectId}"] (not a flat always-on value — see that registry entry for the explicit estimation assumptions).`
  : hasDirectMods
   ? " Unconditional flat stat line — value applied at full verified magnitude, no uptime estimation needed."
   : "";
 return {
  id: spec.id,
  name: spec.name,
  category: "mod",
  modSlot: spec.modSlot,
  modType: "core",
  tags: spec.weaponCategory ? ["mod", "core", spec.modSlot, spec.weaponCategory.toLowerCase()] : ["mod", "core", spec.modSlot],
  effectSummary: spec.effectSummary,
  statModifiers: spec.statModifiers ?? [],
  confidence: "verified",
  needsReview: !!spec.incomplete,
  sourceNotes: `Name and effect text verified from in-game recording / reference sheet (2026-06-25/26). Replaces a machine-translated entry that was incorrect.${spec.incomplete ? " Tooltip text is cut off in the capture — incomplete." : ""} Suffix pool: ${spec.suffixPool.join(", ")}.${conditionalNote}`,
 };
}

export const verifiedModFamilies: CanonicalMod[] = [...WEAPON_MODS, ...GEAR_MODS].map(toCanonicalMod);

// Lets the UI offer a suffix-pick step after a core mod family is selected,
// without baking suffix data into CanonicalMod's type (which has no field for it).
export const verifiedSuffixPoolsByModId: Record<string, string[]> = Object.fromEntries(
 [...WEAPON_MODS, ...GEAR_MODS].map((spec) => [spec.id, spec.suffixPool])
);

// Maps a verified mod id to its conditional-effect-engine key, when the mod's
// contribution requires uptime/stack estimation rather than being a flat
// always-on value. Consumed by modEffectResolver.ts.
export const verifiedModConditionalEffectIds: Record<string, string> = Object.fromEntries(
 [...WEAPON_MODS, ...GEAR_MODS]
  .filter((spec) => !!spec.conditionalEffectId)
  .map((spec) => [spec.id, spec.conditionalEffectId as string])
);

export const verifiedWeaponModCategories = [
 "Burn",
 "Power Surge",
 "Frost",
 "Bullseye",
 "Fortress Warfare",
 "Unstable Bomber",
 "Fast Gunner",
 "Bounce",
 "Shrapnel",
] as const;
