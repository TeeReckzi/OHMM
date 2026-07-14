# Once Human Domain Guardrails for OHMM

This file captures project constraints from the latest domain brief. Use it as a guardrail for data ingestion, registry identity, UI copy, and combat modeling. It is not a complete item database.

## Confidence Rules

- Treat official patch notes, official pages, extracted runtime tables, and controlled in-game capture as the only high-confidence sources for numeric modeling.
- Treat community wiki labels as useful aliases, not canonical proof.
- Preserve source confidence on every imported or modeled row.
- Do not invent drop rates, stat values, proc rules, damage formulas, or hidden compatibility rules.
- Do not collapse aliases unless the source row, runtime key, model path, display token, and weapon family all support the mapping.

## Version Rules

- Tag guide-derived data by era when it predates the 2026 blueprint, calibration, or mod overhauls.
- Old blueprint-fragment guidance is stale for the post-March 25, 2026 blueprint system.
- Old weapon calibration UI/workbench guidance is stale for the post-January 21, 2026 calibration system.
- Patch notes describe intended behavior; live UI/runtime data and controlled hit tests are required before promoting formulas to modeled.

## Canonical Terminology

- Player-facing terms include Meta and Meta-Human.
- Territory is the player base/home space.
- Scenario is the major server/game-mode container.
- RaidZone is a separate mode/scenario ecosystem and must not be treated as equivalent to normal servers.
- Visional Wheel is a temporary ruleset layer that can overlay scenarios.
- Deviations/Deviants can be combat, territory, or crafting related depending on type/source.

## Registry Identity Rules

- Store English official name, Chinese/localized name, internal id, community shorthand, old name, and current UI string as separate fields where available.
- Keep Pistol/Handgun, SMG/Submachine Gun, Heavy Weapon/Heavy Artillery, Bullseye/The Bull's Eye, and Deviant/Deviation as localization/source variants until verified.
- Do not broadly alias platform names into named blueprint rows.
- Basic/RaidZone/custom variants must be disambiguated at id level.
- "Custom" rows are not automatically player-facing weapons. Treat them as calibration/source templates unless verified as selectable live items.

## Weapon Category Rules

Known weapon category names vary by source. Validate against live UI/runtime data before normalizing:

- Handgun / Pistol
- Shotgun
- Assault Rifle
- Sniper Rifle
- Light Machine Gun
- Submachine Gun / SMG
- Crossbow / Bow
- Heavy Artillery / Heavy Weapon
- Melee Weapon

The live player-facing selector should not expose non-canonical source-only rows, custom rows, or RaidZone-only variants unless the mode/scope is explicit.

## Armor And Gear Rules

- Armor has six player-facing slots: Helmet, Mask, Tops/Chest, Bottoms/Pants, Gloves, Shoes/Boots.
- Armor set effects require multiple pieces of the same set.
- Individual armor attributes apply once worn.
- Calibration blueprint behavior after January 21, 2026 must be represented as crafting-time attribute effects, not as the older workbench calibration model unless legacy behavior is explicitly modeled and labeled.

## Combat Modeling Rules

Model each keyword as separate until proven otherwise:

- Burn
- Power Surge
- Frost Vortex
- The Bull's Eye / Marked Target
- Fortress Warfare
- Unstable Bomber
- Fast Gunner
- Bounce
- Shrapnel

Do not assume these share damage type, crit behavior, weakspot behavior, proc cadence, internal cooldown, uptime, stacking bucket, or enemy exception behavior.

Keep these stat/effect families separate unless runtime data or controlled tests prove a merge:

- Weapon DMG
- Status DMG
- Elemental DMG
- Keyword-specific DMG
- Burn DMG
- Power Surge / Shock / Lightning DMG
- Frost Vortex / Frost DMG
- Unstable Bomber / Blast DMG
- Shrapnel DMG
- Bounce DMG
- Crit Rate
- Crit DMG
- Weakspot DMG
- Psi Intensity
- Vulnerability / target damage taken
- Enemy defense, resistance, mitigation, and PvP reductions

## Scenario And Mode Rules

Mode-scoped data must stay scoped:

- Manibus
- Evolution's Call
- Prismverse's Clash
- The Way of Winter
- Endless Dream
- Deviation: Survive, Capture, Preserve
- RaidZone
- Custom Servers
- Eternaland / Non-Shutdown Servers

Do not apply RaidZone-only, Custom Server-only, Visional Wheel-only, or event-only items/rules to normal build modeling unless the UI explicitly supports that scenario context.

## Verification Checklist

Before promoting a mechanic or source row to modeled:

1. Pull current live game data, official runtime tables, or controlled UI capture.
2. Preserve raw ids, display names, aliases, source file names, and confidence.
3. Validate category, rarity, slot, weapon family, compatibility, and mode scope.
4. Validate formula bucket and stacking order with deterministic evidence.
5. Test whether the mechanic can crit and weakspot.
6. Test proc rate, internal cooldown, uptime, target limits, and enemy exceptions.
7. Test PvE, PvP, boss, weakspot, part-hitbox, and immunity edge cases where relevant.
8. Add golden-value tests from recorded in-game hits before marking a formula as game-validated.

## OHMM Implementation Implications

- Empty, placeholder, estimated, or source-only rows should be visible as such, not silently treated as complete.
- UI selectors should prefer exposing fewer verified rows over filling gaps with fallback data.
- Formula explainers and graphs must distinguish Modeled, Estimated, Placeholder, Ignored, and Needs game validation.
- Combat output should never imply game validation for formulas that are only synthetic or structurally wired.
- Alias patches must include before/after evidence and tests proving ambiguity does not increase.
- Registry validation should flag true user-facing data defects separately from cosmetic/image and validator-noise findings.
