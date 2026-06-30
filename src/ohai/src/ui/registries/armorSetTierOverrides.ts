import type { StatModifier } from "../itemTypes";

/**
 * Armor set tier overrides (added 2026-06-27).
 *
 * armorSetBonusResolver.ts uses a coarse regex (`isComplex`) to decide whether
 * a tier line from armor-sets.generated.ts (translated Chinese tooltip text)
 * can be auto-parsed into a flat statModifier. That heuristic over-flags many
 * lines that are either (a) genuinely simple flat %s the regex mis-detects as
 * "complex" because they happen to contain a word like "when"/" ", or
 * (b) genuine proc/stack/conditional mechanics that deserve the same
 * estimated-uptime treatment as cradle perks and weapon/gear mods (see
 * conditionalEffectRegistry.ts).
 *
 * Each entry below is keyed by `${setName}-${tier}pc` (matching the sourceId
 * format armorSetBonusResolver.ts already emits) and provides either:
 *  - `statModifiers` only: a flat, unconditional, verified value (translated
 *   directly from the original Chinese text, double-checked against the
 *   EN paraphrase already in armor-sets.generated.ts).
 *  - `statModifiers` + `conditionalEffectId`: a proc/stack/duration/condition
 *   mechanic. The base value in statModifiers is the verified per-trigger
 *   or peak magnitude; conditionalEffectRegistry.ts's matching entry scales
 *   it by an ESTIMATED contribution factor (not measured) — see that
 *   registry for the explicit assumption behind each one.
 *  - Neither: genuinely unsupported (no formula-engine stat hook exists for
 *   the mechanic, e.g. armor-stack-to-shield conversion, airborne movement
 *   tracking, sanity-based HP caps) — stays blocked/display-only on purpose.
 *
 * Many tier lines are pure survivability/utility (DMG Reduction, HP, Stamina,
 * Gather Speed, Jump Height, etc.) and are correctly left without DPS
 * statModifiers regardless of how "complex" the regex thinks they are — those
 * are intentionally omitted from this file entirely so the generic resolver's
 * existing simple-%-extraction or blocked-with-notes path keeps handling them.
 */
export interface ArmorSetTierOverride {
 statModifiers: StatModifier[];
 conditionalEffectId?: string;
 /** Overrides the auto-generated notes text with a clearer translation/explanation. */
 notes: string;
}

export const armorSetTierOverrides: Record<string, ArmorSetTierOverride> = {
 // ── Lone Wolf ──
 // 3pc: On crit hit twice, gain 1 stack Lone Shadow (+6% Crit DMG), 30s duration, max 8 stacks
 "Lone Wolf-3pc": {
  statModifiers: [{ stat: "critDMG", value: 0.06, unit: "percent" }],
  conditionalEffectId: "armorset-lone-wolf-3pc",
  notes: "On landing 2 crit hits, gain 1 stack of Lone Shadow: Crit DMG +6%, 30s duration, max 8 stacks     Crit DMG+6%  30s  8stack(s)).",
 },
 // 4pc: Lone Shadow cap +10 stacks (now 10 total). On reload complete, Crit Rate +8% for 2s.
 "Lone Wolf-4pc": {
  statModifiers: [{ stat: "critRate", value: 0.08, unit: "percent" }],
  conditionalEffectId: "armorset-lone-wolf-4pc",
  notes: "Lone Shadow max stacks raised to 10. On reload completion, Crit Rate +8% for 2s    Crit Rate +8%  2s). Only the reload-proc Crit Rate line is modeled here; the stack-cap increase amplifies the 3pc effect and isn't separately added to avoid double counting.",
 },

 // ── Blackstone (base, Heat, Cold) ──
 // 2pc shared across all 3 variants: gain 1 stack Warmth (+2% Elemental DMG) on dealing Elemental DMG, 2s duration, ticks every 0.5s, max 5 stacks
 "Blackstone-2pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.02, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-2pc",
  notes: "On dealing Elemental DMG, gain 1 stack of Warmth: Elemental DMG +2%, 2s duration, refreshes every 0.5s, max 5 stacks  (Elemental DMG+2%)  2s 0.5s    5stack(s)).",
 },
 "Blackstone (Heat)-2pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.02, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-2pc",
  notes: "Same Warmth mechanic as base Blackstone 2pc.",
 },
 "Blackstone (Cold)-2pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.02, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-2pc",
  notes: "Same Warmth mechanic as base Blackstone 2pc.",
 },
 // 3pc base: temp 10-30C -> Mild status, Elemental DMG +18%
 "Blackstone-3pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.18, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-3pc-mild",
  notes: "When ambient temperature is 10-30°C, gain Mild status: Elemental DMG +18%. Requires the player to be in a specific temperature band, which depends on world location/weather, not guaranteed.",
 },
 // 3pc Heat: temp>30C -> Passionate, +10% base +0.5%/extra degree, cap 20%
 "Blackstone (Heat)-3pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-heat-3pc",
  notes: "Above 30°C ambient temperature, gain Passionate status: Elemental DMG +10%, plus +0.5% per additional degree above 30°C, capped at +20% total). statModifiers carries the verified floor (10%); the extra per-degree ramp needs an ambient-temperature assumption this engine doesn't have.",
 },
 // 3pc Cold: temp<10C -> Cold-Blooded, +10% base +0.5%/extra degree, cap 20%
 "Blackstone (Cold)-3pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-cold-3pc",
  notes: "Below 10°C ambient temperature, gain Cold-Blooded status: Elemental DMG +10%, plus +0.5% per additional degree below 10°C, capped at +20% total). statModifiers carries the verified floor (10%); the per-degree ramp needs an ambient-temperature assumption this engine doesn't have.",
 },
 // 4pc base: at 5 Warmth stacks, treated as Mild, temp 10-30 -> +7% additional Elemental DMG
 "Blackstone-4pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.07, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-4pc",
  notes: "At 5 Warmth stacks the player is treated as having Mild status; while ambient temperature is 10-30°C, Elemental DMG +7% additional          10-30  Elemental DMG+7%). Stacked on top of the 3pc bonus, gated on both reaching max Warmth stacks AND the temperature band.",
 },
 "Blackstone (Heat)-4pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-heat-4pc",
  notes: "At 5 Warmth stacks, ambient temperature rises 20 points and the Passionate bonus doubles, cap raised to +40%    20         (  )    40%). statModifiers carries a conservative estimate of the doubled floor (10% base doubled to ~10% additional contribution, not the full 40% cap) since the temperature-raise mechanic isn't separately modeled.",
 },
 "Blackstone (Cold)-4pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-blackstone-cold-4pc",
  notes: "At 5 Warmth stacks, ambient temperature drops 20 points and the Cold-Blooded bonus doubles, cap raised to +40%    20         (  )    40%). Same conservative treatment as the Heat variant.",
 },

 // ── Bastille ──
 "Bastille-1pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-bastille-1pc",
  notes: "When HP is above 70%, Gun DMG +10%. Active whenever HP stays above 70%, which is typical for careful play but not guaranteed.",
 },
 "Bastille-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.40, unit: "percent" }],
  conditionalEffectId: "armorset-bastille-3pc",
  notes: "After crouching and staying still for 0.5s, enter Fortress state: Gun DMG +40%. Leaving Fortress state disables sprint for 3s and doubles Stamina cost. Requires a stationary, crouched turret playstyle — heavily playstyle-dependent, modeled conservatively.",
 },
 // 4pc armor-stack-to-shield mechanic has no formula-engine hook (shield is a separate incoming stat, not DPS) — left unmodeled.

 // ── Renegade ──
 "Renegade-2pc": {
  statModifiers: [{ stat: "weakspotDMG", value: 0.10, unit: "percent" }],
  notes: "Weakspot DMG +10%, unconditional.",
 },
 "Renegade-3pc": {
  statModifiers: [{ stat: "weakspotDMG", value: 0.04, unit: "percent" }],
  conditionalEffectId: "armorset-renegade-3pc",
  notes: "Consecutive hits on the same enemy grant 1 stack of Marksman Focus: Weakspot DMG +4%/stack, max 10 stacks. Switching target halves current stacks    Weakspot DMG 4%   10stack(s)  ATK       ). Target-switching halving makes sustained max stacks unlikely against multiple enemies.",
 },
 // 4pc reload-ammo-refill mechanic is an ammo-economy effect, not a damage stat — left unmodeled.

 // ── Stormweaver ──
 "Stormweaver-2pc": {
  statModifiers: [],
  notes: "Magazine Capacity +15% — not a DPS-affecting stat in this engine (magazineCapacity is formula-engine 'unmodeled'); left blocked rather than misapplied.",
 },
 // 3pc/4pc are pure defensive (DMG Reduction stacks, Blast knockback healing) — no DPS stat hook, left unmodeled.

 // ── Savior ──
 "Savior-2pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.10, unit: "percent" }, { stat: "statusDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-savior-2pc",
  notes: "While a Shield is active, Gun/Status DMG +10%. Requires maintaining an active Shield, which depends on the build's shield-generation sources.",
 },
 "Savior-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.05, unit: "percent" }, { stat: "statusDMGBonus", value: 0.05, unit: "percent" }],
  conditionalEffectId: "armorset-savior-3pc",
  notes: "On hit, consuming 8% current HP to generate a temporary shield grants Gun/Status DMG +5% per stack, max 4 stacks, 12s duration  12s). HP-consumption mechanic is a risk/playstyle choice; the shield-generation half of this tier line is non-DPS and not modeled.",
 },
 // 4pc auto-heal-item-use is non-DPS utility, left unmodeled.

 // ── Shelterer ──
 "Shelterer-2pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.08, unit: "percent" }],
  notes: "Elemental (Blaze/Frost/Shock/Blast) DMG +8%, unconditional +8%). The Status DMG Reduction +15% line in tier 1 is defensive and not modeled.",
 },
 "Shelterer-3pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.01, unit: "percent" }],
  conditionalEffectId: "armorset-shelterer-3pc",
  notes: "On gun hit, gain 1 stack of Anomaly Power: Elemental DMG +1%/stack, max 20 stacks, halved on reload  stack(s)Elemental DMG(Blaze  Shock Blast)+1%  20stack(s)     ). Reload halving keeps sustained max stacks unlikely during normal magazine cycling.",
 },
 "Shelterer-4pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.01, unit: "percent" }],
  conditionalEffectId: "armorset-shelterer-4pc",
  notes: "Anomaly Power stack cap +10 (now 30 total); weakspot hits grant +2 stacks instead of 1  on hit   2stack(s)). Modeled as a modest top-up to the 3pc effect rather than separately tracking the new cap.",
 },

 // ── Treacherous Tides ──
 "Treacherous Tides-2pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.12, unit: "percent" }, { stat: "statusDMGBonus", value: 0.12, unit: "percent" }],
  conditionalEffectId: "armorset-treacherous-tides-2pc",
  notes: "When HP is below 70%, Gun/Status DMG +12%. Requires playing at reduced HP, a risk/playstyle choice.",
 },
 "Treacherous Tides-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.10, unit: "percent" }, { stat: "statusDMGBonus", value: 0.10, unit: "percent" }],
  conditionalEffectId: "armorset-treacherous-tides-3pc",
  notes: "Reduces the low-Sanity max-HP-reduction penalty by 40%, and grants Gun/Status DMG +10% with additional bonus scaling as Sanity drops, up to +28% total at 30% max Sanity). statModifiers carries the verified floor (10%); the Sanity-based ramp to +28% needs a specific Sanity-management playstyle assumption this engine doesn't track.",
 },
 // 4pc HP-shield-on-low-HP is defensive, not DPS — left unmodeled.

 // ── Gravity Tide ──
 "Gravity Tide-2pc": {
  statModifiers: [],
  notes: "Magazine Capacity +15% — magazineCapacity is formula-engine 'unmodeled'; left blocked rather than misapplied.",
 },
 "Gravity Tide-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.02, unit: "percent" }, { stat: "statusDMGBonus", value: 0.02, unit: "percent" }],
  conditionalEffectId: "armorset-gravity-tide-3pc",
  notes: "While airborne, gain 1 stack of Momentum per 5m of air movement: Gun/Status DMG +2%/stack, max 12 stacks, decays 1 stack/5s     Status DMG+2%   12stack(s)   5s 1stack(s) ). Requires sustained airborne movement (gliding/jumping), which is a specific playstyle/build choice not all weapons support. The 20% monster-DmgReduction-while-airborne line is incoming-mitigation and not modeled.",
 },
 "Gravity Tide-4pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.15, unit: "percent" }, { stat: "statusDMGBonus", value: 0.15, unit: "percent" }],
  conditionalEffectId: "armorset-gravity-tide-4pc",
  notes: "Once Momentum exceeds 8 stacks, Gun/Status DMG +15% (replacing the per-stack scaling); after 30m of total airborne movement, Momentum stops decaying for 30s   Status DMG+15%   30  30s    ). Same airborne-movement playstyle dependency as 3pc.",
 },

 // ── Dark Resonance ──
 "Dark Resonance-2pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.12, unit: "percent" }, { stat: "statusDMGBonus", value: 0.12, unit: "percent" }],
  conditionalEffectId: "armorset-dark-resonance-2pc",
  notes: "While Anomaly Energy is not full, Gun/Status DMG +12%. Active whenever the player's Anomaly Energy resource is below max, which is common during active deviant-ability use.",
 },
 "Dark Resonance-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.06, unit: "percent" }, { stat: "statusDMGBonus", value: 0.06, unit: "percent" }],
  conditionalEffectId: "armorset-dark-resonance-3pc",
  notes: "Each point of Anomaly Energy consumed grants Gun/Status DMG +0.6%, up to +30% total. statModifiers carries roughly a 10-point-consumed estimate (0.6% × 10), well below the 30% cap, since sustaining near-zero Energy throughout a fight is an aggressive playstyle choice, not guaranteed.",
 },
 // 4pc is a cooldown-reduction utility line on skill use — no DPS stat, left unmodeled.

 // ── Agent ──
 "Agent-2pc": {
  statModifiers: [{ stat: "weakspotDMG", value: 0.10, unit: "percent" }],
  notes: "Weakspot DMG +10%, unconditional. The Head DMG Reduction +10% line in tier 1 is defensive and not modeled.",
 },
 "Agent-3pc": {
  statModifiers: [{ stat: "weakspotDMG", value: 0.15, unit: "percent" }],
  conditionalEffectId: "armorset-agent-3pc",
  notes: "Precision kills (weakspot kills) grant Unerring: Weakspot DMG +15%, 8s duration, max 3 stacks). Requires landing weakspot kills specifically, not just any kill.",
 },
 // 4pc reload-efficiency/fire-rate-on-kill line is non-DPS utility (reloadEfficiency unmodeled, fireRate has no DPS hook) — left unmodeled.

 // ── Heavy Duty ──
 "Heavy Duty-2pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.08, unit: "percent" }],
  notes: "Elemental (Blaze/Frost/Shock/Blast) DMG +8%, unconditional +8%). The HP+10% line in tier 1 is survivability and not modeled.",
 },
 "Heavy Duty-3pc": {
  statModifiers: [{ stat: "elementalDMGBonus", value: 0.40, unit: "percent" }],
  conditionalEffectId: "armorset-heavy-duty-3pc",
  notes: "On kill, gain 2s Move Speed +20% and an 8s decaying Elemental DMG bonus starting at +40%  ). statModifiers carries the verified peak (40%) immediately on kill; it decays across the 8s window, so the conditional engine treats this as a short kill-triggered buff rather than a sustained one.",
 },
 // 4pc (DMG Reduction per nearby enemy) is purely defensive — left unmodeled.

 // ── Falcon ──
 "Falcon-2pc": {
  statModifiers: [{ stat: "critDMG", value: 0.12, unit: "percent" }],
  notes: "Crit DMG +12%, unconditional. The Roll Stamina cost -20% line in tier 1 is non-DPS utility and not modeled.",
 },
 "Falcon-3pc": {
  statModifiers: [{ stat: "critRate", value: 0.05, unit: "percent" }, { stat: "critDMG", value: 0.20, unit: "percent" }],
  conditionalEffectId: "armorset-falcon-3pc",
  notes: "While Stamina is above 90%, Crit Rate +5%, Crit DMG +20%. Requires keeping Stamina nearly full, which drops with sprinting/rolling/dodging — a resource-management-dependent condition.",
 },
 // 4pc (Max Stamina +25, instant Stamina restore on kill) is non-DPS utility — left unmodeled.

 // ── Snow Leopard ──
 "Snow Leopard-2pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.08, unit: "percent" }, { stat: "statusDMGBonus", value: 0.08, unit: "percent" }, { stat: "meleeDMGBonus", value: 0.08, unit: "percent" }],
  conditionalEffectId: "armorset-snow-leopard-2pc",
  notes: "While an ally is within 10m, or while standing in friendly territory, Melee/Status/Gun DMG +8%. Requires group play proximity or claimed territory, not guaranteed in solo content. The Torso DMG Reduction +10% line in tier 1 is defensive and not modeled.",
 },
 "Snow Leopard-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.08, unit: "percent" }, { stat: "statusDMGBonus", value: 0.08, unit: "percent" }, { stat: "meleeDMGBonus", value: 0.08, unit: "percent" }],
  conditionalEffectId: "armorset-snow-leopard-3pc",
  notes: "While in friendly territory, participating in a kill grants Melee/Status/Gun DMG +8%/stack, max 3 stacks, 10s duration  10s). Requires friendly-territory presence, a base-building/social-content-specific condition.",
 },
 // 4pc Auto-Turret damage boost is a non-player-character damage source, not the player's own DPS — left unmodeled.

 // ── Raid ──
 "Raid-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.20, unit: "percent" }],
  conditionalEffectId: "armorset-raid-3pc",
  notes: "While current carry weight exceeds 80, Incoming DMG -10%, Gun/Tactical-item DMG +20%. Requires heavy inventory loadout, a build/playstyle choice; the Incoming DMG -10% line is defensive and not modeled.",
 },
 // 1pc/2pc/4pc are Gather Speed / Weight Limit / Stamina cost utility — no DPS stat, left unmodeled.

 // ── Blast ──
 "Blast-1pc": {
  statModifiers: [{ stat: "meleeDMGBonus", value: 0.20, unit: "percent" }],
  notes: "Melee heavy-attack DMG +20%, unconditional. Modeled against the general meleeDMGBonus stat since this engine has no separate heavy-attack-specific key.",
 },
 "Blast-3pc": {
  statModifiers: [{ stat: "meleeDMGBonus", value: 0.25, unit: "percent" }],
  conditionalEffectId: "armorset-blast-3pc",
  notes: "After a melee kill, the next melee attack within 5s deals +25% DMG and swing speed +15%. Requires melee kills specifically; swing speed is non-DPS and not modeled.",
 },
 // 4pc (Stamina/Move Speed restore on melee kill) is non-DPS utility — left unmodeled.

 // ── Scout ──
 "Scout-2pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.08, unit: "percent" }],
  notes: "Gun DMG +8%, unconditional. The HP+10% line in tier 1 is survivability and not modeled.",
 },
 "Scout-3pc": {
  statModifiers: [{ stat: "weaponDMGBonus", value: 0.20, unit: "percent" }],
  conditionalEffectId: "armorset-scout-3pc",
  notes: "While undetected by enemies, Gun/Tactical-item DMG +20%. Requires maintaining stealth, which most active-combat playstyles break quickly once engaged.",
 },
 // 4pc (Move Speed/Stamina regen at low HP) is non-DPS utility — left unmodeled.

 // ── Test Subject / Rustic / Rustic (Tundra) ──
 "Test Subject-3pc": {
  statModifiers: [{ stat: "meleeDMGBonus", value: 0.10, unit: "percent" }],
  notes: "Melee DMG +10%, unconditional. Tiers 1-2 (Pollution Resistance, HP) are survivability and not modeled.",
 },
 "Rustic-2pc": {
  statModifiers: [{ stat: "meleeDMGBonus", value: 0.15, unit: "percent" }],
  notes: "Melee DMG +15%, unconditional. Tier 1 (Move Speed) and tiers 3-4 (HP, Gather Speed) are non-DPS and not modeled.",
 },
 "Rustic (Tundra)-2pc": {
  statModifiers: [],
  notes: "Cold Resistance +5 — defensive resistance stat, not a DPS modifier; left unmodeled. (This variant swaps Rustic's Melee DMG+15% line for Cold Resistance.)",
 },
};
