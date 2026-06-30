import type { ConditionalEffectDefinition } from "../../engine/conditionalEffectTypes";

/**
 * Conditional Effect Registry
 *
 * Maps cradle override IDs to their conditional effect definitions.
 * Only cradle overrides with time-limited, stacking, or cooldown-based
 * mechanics need entries here. Effects that are always-active (e.g.,
 * weapon mastery damage bonuses) are not conditioned.
 *
 * Unresolved mechanics are documented per effect.
 */

export const conditionalEffectRegistry: Record<string, ConditionalEffectDefinition> = {
 // ── Tactical Combo ──────────────────────────────────
 // Weapon DMG +15% for 4s after weapon swap or reload
 "tactical-combo": {
  effectId: "tactical-combo",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "4s buff window not modeled — uptime estimated from reload frequency.",
   "Does not differentiate weapon-swap vs reload trigger.",
  ],
 },

 // ── Status Enhancement ──────────────────────────────
 // Status DMG +15% for 3s after weakspot hit
 "status-enhancement": {
  effectId: "status-enhancement",
  durationSeconds: 3,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "3s buff window not modeled — uptime estimated from weakspot accuracy assumptions.",
  ],
 },

 // ── Deadly Combo ────────────────────────────────────
 // Bullet effect DMG +25% for 4s after Bounce/Shrapnel trigger
 "deadly-combo": {
  effectId: "deadly-combo",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: false,
  unresolvedMechanics: [
   "Bounce and Shrapnel mechanics are pending — no proc rate available.",
   "4s buff window not modeled.",
  ],
 },

 // ── Elemental Sense ─────────────────────────────────
 // Elemental DMG +25% for 4s after dealing Elemental DMG
 "elemental-sense": {
  effectId: "elemental-sense",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "4s buff window not modeled — uptime estimated from elemental trigger frequency.",
   "'Corresponding element' selection not differentiated.",
  ],
 },

 // ── Heavy Strike ────────────────────────────────────
 // Weapon DMG +25% for 8s after Fortress Warfare activation. Removed on weapon swap.
 "heavy-strike": {
  effectId: "heavy-strike",
  durationSeconds: 8,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Fortress Warfare mechanic is pending — ability cooldown estimated.",
   "Weapon-switch removal not tracked — uptime may be lower with frequent swaps.",
  ],
 },

 // ── Transient Impact ────────────────────────────────
 // Power Surge DMG +2.5% stacking, up to 10 stacks, 6s duration
 "transient-impact": {
  effectId: "transient-impact",
  durationSeconds: 6,
  cooldownSeconds: 0,
  maxStacks: 10,
  triggerProfile: { type: "status-tick", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Stacking decay not modeled — assumes partial stack maintenance.",
   "Power Surge model conflict (DoT vs hybrid) affects trigger frequency estimate.",
  ],
 },

 // ── Bounty Hunter ───────────────────────────────────
 // First mark: Attack +2% (5 stacks). Renew: Weapon DMG +3% (5 stacks). Weapon-switch removal.
 "bounty-hunter": {
  effectId: "bounty-hunter",
  durationSeconds: 15,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Weapon-switch removal not tracked — uptime drops significantly with swaps.",
   "Two separate buff tracks (first mark vs renew) not differentiated.",
   "Stacking assumes one stack per trigger; actual gain rate may vary.",
  ],
 },

 // ── Fast Pursuit ────────────────────────────────────
 // Random effect on Fast Gunner: Atk/Crit Rate/Crit DMG, up to 5 stacks. Weapon-switch removal.
 "fast-pursuit": {
  effectId: "fast-pursuit",
  durationSeconds: 12,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: false,
  unresolvedMechanics: [
   "Random effect selection not modeled — contribution shown is average of three possibilities.",
   "Fast Gunner mechanic is pending — proc rate estimated.",
   "Weapon-switch removal not tracked.",
  ],
 },

 // ── Bounce Rampage ─────────────────────────────────
 // Bounce DMG +5% stacking, up to 5 stacks, 15s duration
 "bounce-rampage": {
  effectId: "bounce-rampage",
  durationSeconds: 15,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: false,
  unresolvedMechanics: [
   "Bounce mechanic is pending — no proc rate available.",
   "Stacking decay not modeled.",
  ],
 },

 // ── Invincible Strike ──────────────────────────────
 // Shrapnel DMG +2.5% + Shrapnel Crit DMG +3.5% stacking, 10 stacks, 6s. Weakspot trigger.
 "invincible-strike": {
  effectId: "invincible-strike",
  durationSeconds: 6,
  cooldownSeconds: 0,
  maxStacks: 10,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: false,
  unresolvedMechanics: [
   "Shrapnel mechanic is pending — Shrapnel DMG/Shrapnel Crit DMG not in formula engine.",
   "Distance falloff removal at max stacks not tracked.",
  ],
 },

 // ── Blazing Detonation ─────────────────────────────
 // Burn DMG +25% for 10s after re-inflicting Burn. 3s cooldown.
 "blazing-detonation": {
  effectId: "blazing-detonation",
  durationSeconds: 10,
  cooldownSeconds: 3,
  maxStacks: 1,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Proc trigger (burn on burning) not modeled — cooldown is 3s.",
   "Extra Burn DMG instance on proc not included in formula projections.",
   "Proc rate estimated; actual rate depends on burn stack application speed.",
  ],
 },

 // ── Extreme Freezing ───────────────────────────────
 // Frost Vortex DMG +2.5% stacking, 10 stacks, 4s duration. Frost Elemental trigger.
 "extreme-freezing": {
  effectId: "extreme-freezing",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 10,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Stacking decay not modeled — short 4s duration makes high stacks unlikely.",
   "Freeze/slowdown CC not modeled.",
   "'Up to 1 time per target' freeze limit not tracked.",
  ],
 },

 // ── Patch 2025-08 Items ──────────────────────────────

 // AUG Electron Cloud: Electron Cloud zone on reload
 "aug-electron-cloud": {
  effectId: "aug-electron-cloud",
  durationSeconds: 6,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "instant",
  supported: false,
  unresolvedMechanics: [
   "Electron Cloud zone damage formula pending.",
   "Zone duration and radius not tracked.",
   "Reload trigger frequency estimated — actual depends on magazine size and fire rate.",
  ],
 },

 // Compound Bow: Full-charge conditional for bounce/crit bonuses
 "compound-bow-full-charge": {
  effectId: "compound-bow-full-charge",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 15 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "instant",
  supported: false,
  unresolvedMechanics: [
   "Full-charge conditional effect is not yet modeled. Projection assumes maximum charge for preview purposes only.",
   "Bounce mechanic pending — bounce bonuses not wired.",
   "Echo multiplier vs Metas (+40%) requires formula extension.",
  ],
 },

 // ══════════════════════════════════════════════════════════════════
 // Verified weapon/gear mod conditional effects (added 2026-06-27)
 //
 // Source values (duration/cooldown/maxStacks/trigger condition) are the
 // VERIFIED in-game tooltip text from verifiedModFamilies.ts. The estimated
 // trigger-frequency mapping (triggerProfile) and the resulting effective
 // uptime/stack contribution are NOT verified — they are this session's
 // conservative, explicitly-reasoned estimate of how often an average
 // player triggers the condition, using the same conservative/realistic/
 // optimized/perfect profile multipliers already defined above. Every
 // entry's unresolvedMechanics documents the specific assumption made.
 // ══════════════════════════════════════════════════════════════════

 // Surge Amplifier (weapon mod): Power Surge DMG +5%/stack, 3s duration, 4 stacks, on Power Surge inflict
 "vmf-surge-amplifier": {
  effectId: "vmf-surge-amplifier",
  durationSeconds: 3,
  cooldownSeconds: 0,
  maxStacks: 4,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Assumes Power Surge (Shock) is inflicted at the same rate as the generic elemental-trigger assumption used for cradle Frost/Shock effects — not independently verified for this specific weapon category.",
   "Short 3s duration vs 4-stack cap means full stacks require near-continuous re-triggering; engine does not assume max stacks, only profile-scaled stacks.",
  ],
 },

 // Cryo Blast (weapon mod): Frost Vortex DMG +4%/stack, 4s duration, 5 stacks, on Frost Vortex trigger
 "vmf-cryo-blast": {
  effectId: "vmf-cryo-blast",
  durationSeconds: 4,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Assumes Frost Vortex triggers at the generic elemental-trigger rate from the combat-assumptions profile (procsPerSecond-style estimate, not measured for this specific weapon category).",
  ],
 },

 // Vulnerability Amplifier (weapon mod): Bull's Eye target Vulnerability +8%, active only while target is marked
 "vmf-vulnerability-amplifier": {
  effectId: "vmf-vulnerability-amplifier",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Assumes the target carries The Bull's Eye mark roughly 50-70% of an engagement when a Bullseye-category weapon is equipped; this is a rough estimate of mark uptime, not a measured rate, scaled down further by the profile's uptimeMultiplier.",
  ],
 },

 // United We Stand (weapon mod): Weapon DMG up to +40% scaling with squad headcount in Fortress Warfare zone
 "vmf-united-we-stand": {
  effectId: "vmf-united-we-stand",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Base statModifier value (40%) is the verified MAX with a full squad in the zone — actual squad size at any moment is unknown and highly group-composition-dependent. Treated as a Fortress-Warfare-uptime-gated ability effect; conservative/realistic profiles further discount for partial squad presence.",
   "True squad headcount input is not modeled; this is a coarse estimate, not a per-player-count formula.",
  ],
 },

 // Final Territory (weapon mod): Weapon DMG +2% for 10s when Fortress Warfare ends
 "vmf-final-territory": {
  effectId: "vmf-final-territory",
  durationSeconds: 10,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Assumes Fortress Warfare ends roughly as often as it's entered (~4 times/min per the ability trigger-frequency baseline) — not independently measured.",
  ],
 },

 // Super Charged (weapon mod): Unstable Bomber DMG +5%/stack, 3s duration, 6 stacks, on Unstable Bomber trigger
 "vmf-super-charged": {
  effectId: "vmf-super-charged",
  durationSeconds: 3,
  cooldownSeconds: 0,
  maxStacks: 6,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Unstable Bomber trigger rate assumed at 12/min (~1 every 5s), a conservative guess for typical explosive-weapon fire cadence — not independently verified.",
  ],
 },

 // Shoot Out (weapon mod): Weapon DMG +1.5%/stack, 10s duration, 20 stacks, on Fast Gunner trigger
 "vmf-shoot-out": {
  effectId: "vmf-shoot-out",
  durationSeconds: 10,
  cooldownSeconds: 0,
  maxStacks: 20,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Fast Gunner activation frequency reused from the cradle fastGunnerUptime assumption rather than independently measured for this mod.",
   "20-stack cap with 10s duration is very achievable during sustained Fast Gunner windows; profile stackMultiplier still discounts for ramp-up time.",
  ],
 },

 // Precision Rush (weapon mod): Weakspot DMG ramps to +45% over 3s while Fast Gunner active
 "vmf-precision-rush": {
  effectId: "vmf-precision-rush",
  durationSeconds: 3,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Base statModifier (45%) is the verified ramp ceiling reached only after holding Fast Gunner active for the full 3s ramp — most real engagements will average well below max, which is why this is conditioned rather than flat.",
   "Uses cradle fastGunnerUptime assumption as a stand-in for this mod's own activation rate (not independently measured).",
  ],
 },

 // Shooting Blitz (weapon mod): Weapon DMG +15% while Fast Gunner active
 "vmf-shooting-blitz": {
  effectId: "vmf-shooting-blitz",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Uptime treated as 'active while Fast Gunner is up' and scaled by the profile's fastGunnerUptime-equivalent assumption (reusing the cradle assumption set) rather than a mod-specific measured value. The +4s duration extension line is folded into this uptime assumption, not separately modeled.",
  ],
 },

 // Shield Breaker (weapon mod): Shrapnel DMG +60% for 1s when hitting a shielded enemy
 "vmf-shield-breaker": {
  effectId: "vmf-shield-breaker",
  durationSeconds: 1,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: false,
  unresolvedMechanics: [
   "Requires a shielded enemy, which is encounter-specific and not present in most PvE content or training-dummy scenarios — assumed inactive by default (supported: false) until per-target shield-presence is modeled. Also gated on shrapnelDMGBonus, which is itself formula-engine 'pending' status.",
  ],
 },

 // Precise Strike (head mod): Weakspot DMG +12%/stack, 3s duration, 3 stacks, on weakspot hit
 "vmf-precise-strike": {
  effectId: "vmf-precise-strike",
  durationSeconds: 3,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Uses the standard weakspot-accuracy combat assumption (per profile) to estimate trigger rate — not measured for this specific mod.",
  ],
 },

 // First-Move Advantage (head mod): Crit Rate +10%, Crit DMG +20% for 2s after reload
 "vmf-first-move-advantage": {
  effectId: "vmf-first-move-advantage",
  durationSeconds: 2,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Reload frequency reused from the standard reloadsPerMinute combat assumption — short 2s window means uptime is inherently low unless reloads are very frequent.",
  ],
 },

 // Work of Proficiency (head mod): Elemental DMG +20% on first shot after empty-mag reload, resets next reload
 "vmf-work-of-proficiency": {
  effectId: "vmf-work-of-proficiency",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Only the single shot right after an empty-magazine reload benefits; treated as a low, reload-frequency-gated average contribution rather than a sustained buff — this is a rough single-shot-per-reload approximation, not a measured DPS share.",
  ],
 },

 // Momentum Up (head mod): Weapon DMG +30% on the back half of the magazine
 "vmf-momentum-up": {
  effectId: "vmf-momentum-up",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Active for exactly the back 50% of every magazine by design — modeled as a flat ~50% uptime baseline, then further scaled by the profile's general uptimeMultiplier to account for reload interruptions and imperfect full-mag dumps. This 50% baseline is a structural assumption from the mod's own text, not a guess, but the profile discount on top of it is an estimate.",
  ],
 },

 // Elemental Havoc (head mod): Elemental DMG +10% base, +10% additional while HP > 90%
 "vmf-elemental-havoc": {
  effectId: "vmf-elemental-havoc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "statModifiers carries only the unconditional +10% floor; the additional +10% while HP>90% is not separately added because staying above 90% HP throughout a fight is playstyle/content-dependent — assuming it by default would overstate damage. Treat the displayed value as a deliberate floor estimate, not the verified ceiling (20%).",
  ],
 },

 // Weapon Symphony (head mod): Weapon DMG +25% peak after weapon swap, decays 5%/s, max 50% decrease
 "vmf-weapon-symphony": {
  effectId: "vmf-weapon-symphony",
  durationSeconds: 5,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "weapon-swap", baseFrequencyPerMinute: 2 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Base statModifier (25%) is the verified PEAK value immediately after a swap; it decays 5%/s afterward, which this engine approximates as a fixed ~5s effective window rather than modeling the exact decay curve — a simplification, not a verified duration.",
   "Weapon-swap frequency reused from the standard weaponSwapsPerMinute combat assumption.",
  ],
 },

 // Reload Rampage (pants mod): Weapon+Weakspot DMG +15% until next reload, after a kill
 "vmf-reload-rampage": {
  effectId: "vmf-reload-rampage",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Requires a kill, then lasts until the next reload — duration is entirely fight-pacing-dependent (kill rate vs reload rate). Assumed at a moderate ~10/min effective trigger rate as a rough average, not measured.",
  ],
 },

 // Three Strikes (pants mod): Weakspot DMG +50% after 3 consecutive weakspot hits post-reload
 "vmf-three-strikes": {
  effectId: "vmf-three-strikes",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires 3 CONSECUTIVE weakspot hits immediately after every reload to refresh, which is a high-accuracy-dependent condition. Modeled as gated by the standard weakspotAccuracy assumption applied three times in a row (a stricter bar than a single weakspot hit), making this a notably conservative estimate by design.",
  ],
 },

 // Bullet Siphon (pants mod): Weapon DMG +5% base, +4% per 5 bullets consumed, capped +20%
 "vmf-bullet-siphon": {
  effectId: "vmf-bullet-siphon",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "statModifiers carries only the unconditional +5% floor; the ramping +4% per 5 bullets (capped +20%) is represented via maxStacks/stackMultiplier rather than assumed at the cap, since average magazine depletion at any instant is roughly half-empty, not empty.",
  ],
 },

 // Deadshot (pants mod): Weapon DMG +4%/stack, 15s duration, 3 stacks, on crit hit
 "vmf-deadshot": {
  effectId: "vmf-deadshot",
  durationSeconds: 15,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Crit-hit trigger rate assumed at 12/min as a conservative generic 'proc' rate — actual rate depends heavily on the build's own Crit Rate, which isn't known at registry-authoring time.",
   "Long 15s duration vs 3-stack cap means high stacks are achievable with even modest crit frequency; not assumed at max by default.",
  ],
 },

 // Abnormal Increase (pants mod): Status DMG +8%/stack, 12s duration, 3 stacks, when magazine empty
 "vmf-abnormal-increase": {
  effectId: "vmf-abnormal-increase",
  durationSeconds: 12,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Triggers specifically when the magazine reaches empty (i.e. right before reload), reusing the reloadsPerMinute assumption as the trigger-frequency proxy.",
  ],
 },

 // Unstoppable (pants mod): Weapon DMG +20% at 15m+, +1%/m further up to +20% additional
 "vmf-unstoppable": {
  effectId: "vmf-unstoppable",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "statModifiers carries only the verified +20% floor at exactly 15m; the additional ramp up to +20% more requires assuming a specific average engagement distance beyond 15m, which is highly weapon-class and playstyle dependent — left out rather than guessed. Profile uptimeMultiplier still discounts the floor value for engagements under 15m.",
  ],
 },

 // Precision Charge (pants mod): Elemental DMG +4% per 10% weakspot-hit-% of last clip, capped +24%, 10s
 "vmf-precision-charge": {
  effectId: "vmf-precision-charge",
  durationSeconds: 10,
  cooldownSeconds: 0,
  maxStacks: 6,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Requires sustained high weakspot-hit percentage across an ENTIRE previous magazine to approach the +24% cap — modeled via the weakspotAccuracy combat assumption rather than assumed at max, since hitting near-100% weakspot accuracy for a whole clip is optimistic for most players.",
  ],
 },

 // Elemental Resonance (pants mod): Elemental DMG +1% per elemental hit from prev mag, capped +24%, 15s
 "vmf-elemental-resonance": {
  effectId: "vmf-elemental-resonance",
  durationSeconds: 15,
  cooldownSeconds: 0,
  maxStacks: 24,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "24 stacks would require 24 separate Elemental DMG instances in a single magazine, which is unrealistic for most magazine sizes — profile stackMultiplier keeps this well below the cap by default rather than assuming it's reached.",
  ],
 },

 // Critical Surge (pants mod): Crit DMG +15%/stack, 8s duration, 3 stacks, when magazine empty
 "vmf-critical-surge": {
  effectId: "vmf-critical-surge",
  durationSeconds: 8,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Triggers on empty magazine, reusing the reloadsPerMinute assumption as the trigger-frequency proxy — not independently measured.",
  ],
 },

 // Covered Advance (boots mod): Melee/Weapon/Status DMG +20% for 30s, after 4s untouched
 "vmf-covered-advance": {
  effectId: "vmf-covered-advance",
  durationSeconds: 30,
  cooldownSeconds: 4,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Requires 4 unbroken seconds without taking damage to activate, which is unreliable in active enemy-dense combat — treated conservatively (low base trigger frequency) since most real fights involve frequent incoming hits, especially at higher difficulty.",
  ],
 },

 // Rush Hour (boots mod): Melee/Weapon/Status DMG +4% per 10% HP lost
 "vmf-rush-hour": {
  effectId: "vmf-rush-hour",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 9,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Scaling depends entirely on how much HP the player has lost at any given moment, which is a playstyle/risk choice, not a fixed combat rate. Modeled with a conservative stack assumption (most players play well above 50% HP for safety) rather than assuming heavy HP loss.",
  ],
 },

 // Ferocious Charge (boots mod): Weapon/Status DMG +20% for 8s, on kill within 10m
 "vmf-ferocious-charge": {
  effectId: "vmf-ferocious-charge",
  durationSeconds: 8,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Kill rate assumed at a moderate ~10/min for typical PvE trash-clear pacing — varies enormously by content type (boss vs horde), not independently measured for this mod.",
  ],
 },

 // Secluded Strike (boots mod): Weapon/Status DMG +15%, while no enemies within 7m
 "vmf-secluded-strike": {
  effectId: "vmf-secluded-strike",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Anti-synergy with melee/close-range builds and crowded fights. Assumes a moderate-uptime mid/long-range solo playstyle; group content or melee-focused builds would see substantially lower real uptime than modeled here.",
  ],
 },

 // Slow and Steady (boots mod): Melee/Weapon/Status DMG +10% base, +10% more while standing still 4s
 "vmf-slow-and-steady": {
  effectId: "vmf-slow-and-steady",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "statModifiers carries the unconditional +10% floor; the standing-still +10% bonus requires a stationary-turret playstyle that doesn't suit every weapon/encounter, so it's gated by the profile's general uptimeMultiplier rather than assumed always-on.",
  ],
 },

 // Against All Odds (boots mod): Weapon/Status DMG +10% base, +5%/stack per 10% max HP consumed, 3 stacks
 "vmf-against-all-odds": {
  effectId: "vmf-against-all-odds",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Stacking on HP consumed is a risk/playstyle choice; profile stackMultiplier keeps this below max stacks by default since most players don't sustain heavy HP loss for extended periods.",
  ],
 },

 // Power of Striving (boots mod): Weapon/Status DMG +10% base, ramping +20% per Stamina consumed
 "vmf-power-of-striving": {
  effectId: "vmf-power-of-striving",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "statModifiers carries only the unconditional +10% floor; the Stamina-consumption ramp to +20% additional depends on sprint/dodge frequency, which is playstyle-specific and not modeled to avoid inventing a Stamina-spend rate.",
  ],
 },

 // Blaze Amplifier (mask mod): +3% Psi Intensity DMG per Burn stack on target
 "vmf-blaze-amplifier": {
  effectId: "vmf-blaze-amplifier",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 10,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Scales with the TARGET's current Burn stack count, not the player's own buff — this engine has no per-target Burn-stack-count input, so a generic max-10-stack assumption (typical Burn cap across most weapons) is used with the standard profile stackMultiplier discount, which is an approximation, not measured.",
   "Mapped to burnDMGBonus as the closest existing stat key since 'Psi Intensity DMG' has no dedicated bonus stat in the formula engine.",
  ],
 },

 // Explosive Barrage (mask mod): Crit Rate +10%, Weapon DMG +10%, while Fast Gunner active
 "vmf-explosive-barrage": {
  effectId: "vmf-explosive-barrage",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Uses the cradle fastGunnerUptime assumption as a stand-in for this mod's own Fast Gunner uptime — not independently measured.",
  ],
 },

 // Pinpoint Strike (mask mod): Unstable Bomber DMG +35%, when bomb hits only one enemy
 "vmf-pinpoint-strike": {
  effectId: "vmf-pinpoint-strike",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires the explosive to hit exactly one enemy — assumed moderately common in single-target/boss-focused PvE, but would be much lower uptime in crowded trash-clear scenarios. A flat single-target-engagement assumption, not measured.",
  ],
 },

 // Targeted Strike (mask mod): Crit Rate +10%, Crit DMG +25%, vs Bull's Eye-marked enemies
 "vmf-targeted-strike": {
  effectId: "vmf-targeted-strike",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires the target to be marked with The Bull's Eye, which itself requires a Bullseye-category weapon mod equipped elsewhere in the build — this engine cannot currently verify that cross-mod dependency, so uptime is treated conservatively (assumes the mark is up roughly half the time when conditions allow, discounted further by the profile multiplier).",
  ],
 },

 // Light Cannon (mask mod): Attack(Weapon DMG) +15%, while in Fortress Warfare state
 "vmf-light-cannon": {
  effectId: "vmf-light-cannon",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Uses the cradle fortressWarfareUptime assumption as a stand-in for this mod's own Fortress Warfare active-state uptime — not independently measured. Also removes Super Armor while active, a defensive trade-off not modeled here.",
  ],
 },

 // Unbreakable (mask mod): Attack(Weapon DMG) +15%, while in Fortress Warfare state
 "vmf-unbreakable": {
  effectId: "vmf-unbreakable",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "ability", baseFrequencyPerMinute: 4 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Uses the cradle fortressWarfareUptime assumption as a stand-in for this mod's own Fortress Warfare active-state uptime — not independently measured. The +30% range line is non-DPS utility and not modeled.",
  ],
 },

 // Retrusion Explosion (mask mod): Crit Rate +8%, Crit DMG +20%, vs Burning enemies
 "vmf-retrusion-explosion": {
  effectId: "vmf-retrusion-explosion",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Active only while the target is Burning, reusing the generic elemental-trigger combat assumption to estimate how much of the fight the target stays Burning — not independently measured for this mod.",
  ],
 },

 // First Electrocution (mask mod): Power Surge final DMG +35%, only on enemies WITHOUT Power Surge status yet
 "vmf-first-electrocution": {
  effectId: "vmf-first-electrocution",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Only applies to the FIRST Power Surge application on a target before the status is already active — heavily front-loaded toward fight openers and frequent target-switching. Modeled with a low effective trigger rate (~10/min) since most sustained DPS time is spent on already-Power-Surged targets, which this mod doesn't boost.",
  ],
 },

 // Frostwave Wither (mask mod): Frost Vortex DMG +30% peak, decays 6%/s
 "vmf-frostwave-wither": {
  effectId: "vmf-frostwave-wither",
  durationSeconds: 5,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Base statModifier (30%) is the verified PEAK immediately on Frost Vortex trigger; the 6%/s decay is approximated as a fixed ~5s effective window rather than modeling the exact decay curve — a simplification, not a verified duration.",
  ],
 },

 // Most Wanted (mask mod): Attack(Weapon DMG) +8%/stack, on enemy marked, 3 stacks
 "vmf-most-wanted": {
  effectId: "vmf-most-wanted",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Marking-rate assumed at a moderate ~12/min for a Bullseye-category build actively applying The Bull's Eye — not independently measured; stacks have no stated duration/decay in the verified text so they're treated as persistent up to 3.",
  ],
 },

 // Delayed Blast (mask mod): Unstable Bomber final DMG +25% per 4 hits taken before bomb explodes
 "vmf-delayed-blast": {
  effectId: "vmf-delayed-blast",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Scales with INCOMING hits taken before the Unstable Bomber detonates, which is encounter/enemy-density dependent, not a fixed player-controlled rate — modeled with a conservative low-to-moderate stack assumption rather than assuming the player is taking heavy fire constantly.",
  ],
 },

 // P90 Holographic Resonance: Shock AoE every 11th hit
 // Known payload: hitsRequired=11, atkMultiplier=8.0, radiusMeters=10
 "p90-holographic-resonance": {
  effectId: "p90-holographic-resonance",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 60 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "instant",
  supported: false,
  payload: {
   hitsRequired: 11,
   atkMultiplier: 8.0,
   radiusMeters: 10,
  },
  unresolvedMechanics: [
   "11-hit threshold AoE damage formula pending.",
   "AoE radius 10m and 800% ATK multiplier known but not wired into formula engine.",
   "AoE target count, falloff, and multi-target assumptions not tracked.",
   "Proc rate estimated from fire rate — actual depends on hit registration.",
  ],
 },

 // ══════════════════════════════════════════════════════════════════
 // Verified armor set 3pc/4pc conditional effects (added 2026-06-27)
 // Source values are translated from verified armor set tier text
 // (see armorSetTierOverrides.ts for the
 // full translation + reasoning per tier). Trigger-frequency / uptime
 // estimates below are this session's conservative, explicitly-reasoned
 // guesses — not measured rates — same caveat as the weapon/gear mod
 // entries above.
 // ══════════════════════════════════════════════════════════════════

 "armorset-lone-wolf-3pc": {
  effectId: "armorset-lone-wolf-3pc",
  durationSeconds: 30,
  cooldownSeconds: 0,
  maxStacks: 8,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Requires landing 2 crit hits to gain a stack; trigger rate assumed at 12/min as a generic crit-pair proc estimate, not measured against any specific build's Crit Rate.",
  ],
 },
 "armorset-lone-wolf-4pc": {
  effectId: "armorset-lone-wolf-4pc",
  durationSeconds: 2,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "reload", baseFrequencyPerMinute: 6 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Reload-frequency reused from the standard combat assumption; short 2s window limits realistic uptime.",
  ],
 },

 "armorset-blackstone-2pc": {
  effectId: "armorset-blackstone-2pc",
  durationSeconds: 2,
  cooldownSeconds: 0,
  maxStacks: 5,
  triggerProfile: { type: "elemental", baseFrequencyPerMinute: 120 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Refreshes every 0.5s while dealing Elemental DMG, so this is treated as a high-frequency proc (120/min) reaching most of its 5-stack cap during sustained elemental output — still discounted by the profile's stackMultiplier since uptime is never literally 100%.",
  ],
 },
 "armorset-blackstone-3pc-mild": {
  effectId: "armorset-blackstone-3pc-mild",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires ambient temperature to sit in the 10-30°C band, which depends on world location/weather and is outside player control in most content — treated as a moderate, not guaranteed, uptime.",
  ],
 },
 "armorset-blackstone-heat-3pc": {
  effectId: "armorset-blackstone-heat-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 16 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires ambient temperature above 30°C specifically — a narrower, less common condition than Blackstone base's 10-30°C band, so trigger frequency is estimated lower.",
  ],
 },
 "armorset-blackstone-cold-3pc": {
  effectId: "armorset-blackstone-cold-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 16 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires ambient temperature below 10°C specifically — a narrower, less common condition, so trigger frequency is estimated lower than the base variant.",
  ],
 },
 "armorset-blackstone-4pc": {
  effectId: "armorset-blackstone-4pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires BOTH 5 Warmth stacks AND the 10-30°C temperature band simultaneously — compounding two conditions, so trigger frequency is estimated lower than either alone.",
  ],
 },
 "armorset-blackstone-heat-4pc": {
  effectId: "armorset-blackstone-heat-4pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires reaching 5 Warmth stacks while already above 30°C — a compounding, less frequent condition. statModifiers value is deliberately conservative (not the full doubled/40%-cap value) for this reason.",
  ],
 },
 "armorset-blackstone-cold-4pc": {
  effectId: "armorset-blackstone-cold-4pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires reaching 5 Warmth stacks while already below 10°C — a compounding, less frequent condition, same conservative treatment as the Heat variant.",
  ],
 },

 "armorset-bastille-1pc": {
  effectId: "armorset-bastille-1pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Active whenever HP is above 70% — typical for careful play, treated with a fairly high but not guaranteed uptime.",
  ],
 },
 "armorset-bastille-3pc": {
  effectId: "armorset-bastille-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "remove",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires a stationary, crouched 'turret' playstyle (0.5s crouch+still to enter, then staying put) — incompatible with mobile combat. Treated with low-to-moderate uptime since it suits only specific defensive builds/weapons.",
  ],
 },

 "armorset-renegade-3pc": {
  effectId: "armorset-renegade-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 10,
  triggerProfile: { type: "weakspot", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires CONSECUTIVE hits on the SAME enemy; switching targets halves current stacks, making sustained max stacks unlikely against groups or fast target-switching playstyles — modeled with the standard weakspot trigger rate but capped well below max via stackMultiplier.",
  ],
 },

 "armorset-savior-2pc": {
  effectId: "armorset-savior-2pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires an active Shield, which depends on the build's own shield-generation sources (this same set's 3pc effect, deviants, other gear) — treated with moderate uptime assuming at least some shield uptime from the kit.",
  ],
 },
 "armorset-savior-3pc": {
  effectId: "armorset-savior-3pc",
  durationSeconds: 12,
  cooldownSeconds: 0.5,
  maxStacks: 4,
  triggerProfile: { type: "proc", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Triggers on landing a hit (0.5s internal cooldown), consuming HP each time — a risk/playstyle choice on how aggressively the player is willing to spend HP for stacks. Modeled conservatively, not assumed at max stacks.",
  ],
 },

 "armorset-shelterer-3pc": {
  effectId: "armorset-shelterer-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 20,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Stacks on every gun hit but halves on every reload, which keeps sustained high stacks unlikely during normal magazine cycling — modeled well below the 20-stack cap.",
  ],
 },
 "armorset-shelterer-4pc": {
  effectId: "armorset-shelterer-4pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 30,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 30 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Same reload-halving caveat as 3pc, with a higher cap (30) and faster gain from weakspot hits (+2/hit) — still modeled conservatively, not assumed near cap.",
  ],
 },

 "armorset-treacherous-tides-2pc": {
  effectId: "armorset-treacherous-tides-2pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 16 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires HP below 70% — a risk/playstyle choice, not guaranteed for cautious players, treated with moderate uptime.",
  ],
 },
 "armorset-treacherous-tides-3pc": {
  effectId: "armorset-treacherous-tides-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "The verified floor (10%) is unconditional once equipped; the additional ramp to +28% requires deliberately lowering Sanity, a specific build choice not assumed by default.",
  ],
 },

 "armorset-gravity-tide-3pc": {
  effectId: "armorset-gravity-tide-3pc",
  durationSeconds: 5,
  cooldownSeconds: 0,
  maxStacks: 12,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "per-stack",
  supported: true,
  unresolvedMechanics: [
   "Requires sustained airborne movement (gliding/jumping 5m increments), which not all weapon playstyles support — treated with low-to-moderate uptime, well below the 12-stack cap by default.",
  ],
 },
 "armorset-gravity-tide-4pc": {
  effectId: "armorset-gravity-tide-4pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires exceeding 8 Momentum stacks (itself gated on sustained airborne movement) — a compounding condition treated with low uptime.",
  ],
 },

 "armorset-dark-resonance-2pc": {
  effectId: "armorset-dark-resonance-2pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Active whenever Anomaly Energy is below max, which is common during active deviant-ability use — treated with moderately high uptime.",
  ],
 },
 "armorset-dark-resonance-3pc": {
  effectId: "armorset-dark-resonance-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "statModifiers value already represents a conservative ~10-point-consumed estimate (well below the 30%-cap / 50-point full-consumption scenario); contributionFactor further discounts for profile-level uncertainty about actual Energy-spend rate.",
  ],
 },

 "armorset-agent-3pc": {
  effectId: "armorset-agent-3pc",
  durationSeconds: 8,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Requires weakspot KILLS specifically (not just weakspot hits or any kill) — a narrower condition than a generic kill-rate assumption, trigger frequency estimated lower accordingly.",
  ],
 },

 "armorset-heavy-duty-3pc": {
  effectId: "armorset-heavy-duty-3pc",
  durationSeconds: 8,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Base statModifier (40%) is the verified PEAK immediately on kill; the bonus decays across the full 8s window rather than holding steady, approximated here as a short kill-triggered window rather than the exact decay curve.",
   "Kill rate assumed at a moderate ~10/min for typical PvE pacing — varies enormously by content type.",
  ],
 },

 "armorset-falcon-3pc": {
  effectId: "armorset-falcon-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 16 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires Stamina above 90%, which drops with sprinting/rolling/dodging — treated with moderate uptime since most players don't sprint-spam constantly, but it's not guaranteed.",
  ],
 },

 "armorset-snow-leopard-2pc": {
  effectId: "armorset-snow-leopard-2pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 12 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires an ally within 10m or standing in friendly territory — a group-play/base-building-specific condition, not available to solo players outside their own territory. Treated with low-to-moderate uptime by default.",
  ],
 },
 "armorset-snow-leopard-3pc": {
  effectId: "armorset-snow-leopard-3pc",
  durationSeconds: 10,
  cooldownSeconds: 0,
  maxStacks: 3,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "add-stack",
  decayBehavior: "duration-end",
  supported: true,
  unresolvedMechanics: [
   "Requires friendly territory presence AND participating in a kill — a compounding, base-building-specific condition, treated with low uptime by default.",
  ],
 },

 "armorset-raid-3pc": {
  effectId: "armorset-raid-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 20 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires carrying more than 80 weight, a specific inventory-loadout choice (heavy gathering/hoarding builds) — treated with moderate uptime assuming the build is intentionally built around this set bonus.",
  ],
 },

 "armorset-blast-3pc": {
  effectId: "armorset-blast-3pc",
  durationSeconds: 5,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 10 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "reset-duration",
  decayBehavior: "instant",
  supported: true,
  unresolvedMechanics: [
   "Requires melee KILLS specifically; trigger rate assumed at a moderate ~10/min for melee-focused PvE pacing — not independently measured.",
  ],
 },

 "armorset-scout-3pc": {
  effectId: "armorset-scout-3pc",
  durationSeconds: 0,
  cooldownSeconds: 0,
  maxStacks: 1,
  triggerProfile: { type: "manual", baseFrequencyPerMinute: 8 },
  weaponSwapBehavior: "keep",
  refreshBehavior: "no-refresh",
  decayBehavior: "no-decay",
  supported: true,
  unresolvedMechanics: [
   "Requires staying undetected by enemies, which most active-combat playstyles break quickly once engaged — treated with low uptime (stealth/ambush playstyles only).",
  ],
 },
};

export function getConditionalEffect(id: string): ConditionalEffectDefinition | undefined {
 return conditionalEffectRegistry[id];
}

export function hasConditionalEffect(id: string): boolean {
 return id in conditionalEffectRegistry;
}
