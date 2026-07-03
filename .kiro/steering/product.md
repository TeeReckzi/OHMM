# OHMM — Once Human Meta Metrics

OHMM is a client-side combat calculator and build optimizer for the game "Once Human" (NetEase Games). It runs entirely in the browser with zero backend, telemetry, or network requests.

## What it does

- Lets players select weapons, armor, mods, food buffs, deviations, cradle setups, and ammo
- Calculates expected damage per shot/tick and DPS using reverse-engineered game formulas
- Compares builds under various combat assumptions (PvE targets, uptime profiles, PvP mitigation)
- Tracks data confidence levels so users know which numbers are verified vs estimated

## Key domain concepts

- **BuildSelection**: the user's current loadout (weapon, armor, mods, cradle, deviant, food)
- **CalculationInput**: normalized representation fed into the combat engine
- **CombatOutput**: computed damage, survivability, and PvP metrics
- **Confidence labels**: every registry entry carries a trust level (project_verified, observed, estimated, placeholder)
- **42 canonical StatKeys**: the definitive set of stat identifiers (camelCase, defined in buildGoalSchema.ts)
- **Module lock system**: verified data modules (M0–M15) are immutable; functional modules (M17–M20) are under active development

## Data sources

- Source workbook: `七日世界.xlsx` (Chinese/TW community sheet) — immutable
- Binary game data decoded via custom Python tooling (NPK archives, bindict format)
- In-game observation via OCR pipeline (Overwolf overlay + vision service)
- All project-facing output is English; original Chinese/TW values preserved in `original` fields
