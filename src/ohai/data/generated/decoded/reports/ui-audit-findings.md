# UI Audit Findings — OHMM Dev Build

**Date:** 2026-07-04
**Auditor:** Kiro (theorycraft/veteran analysis)
**Build:** localhost:5175 (root Vite dev server)

---

## 1. WEAPON SELECTOR

### Critical Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| W1 | Chinese bindict weapons visible to users | CRITICAL | 176 Chinese-named weapons (沙鹰, 左轮, 短剑, etc.) appear in the selector alongside English weapons. Users should never see both "DE.50 - Jaws" and "沙鹰-大白鲨" as separate selections. |
| W2 | Duplicate entries within bindict weapons | HIGH | Same weapon appears 2-3 times: 沙鹰 ×2, 左轮-猎人500 ×2, M416-秋分 ×3, AA12-焚灭之引 ×2. Each is a different gun_no variant but identical to the user. |
| W3 | Untranslated localization token | HIGH | `#t(武器)M700` displays literally — raw $S@TIDS$ token leaked into UI. |
| W4 | Missing weapon family filters | MEDIUM | No HEAVY, MELEE, or BOW filter buttons. Weapons in those categories only show under ALL. |
| W5 | Melee weapons in ranged DPS selector | LOW | Baseball Bat, Broken Bottle, Camping Knife, etc. are irrelevant for theorycraft builds. Should be in a separate MELEE tab or hidden. |
| W6 | "自定义" (Custom) variants as separate entries | HIGH | Custom rows are calibration/stat-template variants, NOT separate player-facing weapons. Must not appear in selector. Attach as sourceRecords or calibrationTemplateCandidates on the parent weapon. Build a separate calibration registry with: calibrationId, displayName, allowed weapon families, stat modifiers, provenance/source table IDs, confidence. Calibrations must be family-filtered (e.g., Frugal only for Snipers if verified). Preserve RPM/range/magazine/mobility deltas as calibration evidence. Do NOT merge calibration effects into base weapon stats. Do NOT expose raw gun_no variants as selectable weapons. |
| W7 | Bindict weapons not categorized by family | MEDIUM | All Chinese-named entries show under ALL but not under AR/SMG/SHOTGUN/etc. because they have generic family names. |

### Recommended Fix Priority
1. Filter out ALL bindict weapons from the UI selector (both raw Chinese entries AND custom/自定义 variants)
2. Build a calibration registry from 自定义 rows: `calibrationId`, `displayName`, `allowedWeaponFamilies`, `statModifiers`, `provenance`, `confidence`
3. Calibration options filtered by selected weapon family — never show a calibration that doesn't apply to the equipped weapon type
4. Preserve custom row stat deltas (RPM, range, magazine, mobility changes) as evidence for calibration behavior
5. Fix the `#t(武器)` token in the generator script
6. Add a "Show decoded (unverified) data" toggle for power users (optional, low priority)

---

## 2. MOD SELECTOR (Weapon Mod)

### Filters Available
ALL, BURN, POWER SURGE, FROST, BULLSEYE, FORTRESS WARFARE, UNSTABLE BOMBER, FAST GUNNER, BOUNCE, SHRAPNEL, GENERAL

### Issues Found

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| M1 | Suffix descriptions are too vague | MEDIUM | Most suffixes just say "Damage" or "Crit DMG" without specifying the tier values or exact stat lines. The in-game mod shows specific numbers (e.g., "Frost Vortex DMG +6.0%"). |
| M2 | Suffixes labeled wrong keyword family | HIGH | "Violent" is categorized as "Bullseye · suffix" but Violent is a GENERAL suffix (it provides Crit DMG). "Precision" also shows as "Bullseye · suffix" but is GENERAL. |
| M3 | "Deviant Energy" suffix has garbled description | MEDIUM | Shows "(、、、)Damage" — this is broken text from the workbook import. Should say "Elemental/Status DMG" or similar. |
| M4 | No tier/level selection for suffixes | HIGH | No way for users to set their mod suffix tier (1-5). The UI just says "Crit DMG" without showing the actual value at their tier. |
| M5 | No separation between CORE and SUFFIX | MEDIUM | Cores and suffixes are in the same list. In-game, you pick one core + one suffix per slot. The selector should show these as two separate picks. |
| M6 | Missing head/mask/chest/gloves/pants/boots cores | MEDIUM | Head mods (Precise Strike, Deviation Expert, etc.) are listed but the selector title says "Weapon Mod Selector" — the armor slot mods should have separate selectors with slot-appropriate cores. |
| M7 | "Estimated modifiers available — description not verified" text | LOW | Mirror, Wild, Phantasmal, Crescent, Downstar, Resonance suffixes show this warning. Acceptable during dev but should be hidden for user-facing builds. |
| M8 | No "Shiny" toggle for Flash Effect bonus | LOW | No way to indicate a shiny mod which adds the extra keyword stat. |

### Recommended Fix Priority
1. Fix keyword family categorization (M2) — Violent/Precision are General suffixes, not Bullseye
2. Split core/suffix into two separate selection steps (M5)
3. Add suffix tier selector (M4) — this is already wired in the engine, just needs UI
4. Fix the garbled Deviant Energy description (M3)

---

## 3. ARMOR SELECTOR

### Structure Observed
- 6 slots: Helmet, Mask, Chest, Gloves, Pants, Boots
- Each has a MOD button
- No armor pieces appear to be pre-selected

### Issues (need deeper investigation)
| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| A1 | No visible armor set tracking | LOW | "No armor equipped" message in Theorycraft Panel. Need to open selector to verify armor list. |
| A2 | Key Gear integration unclear | MEDIUM | Key Gear (special named armor pieces like Magnetic Moment Top) may not be accessible through the standard armor selector. |

---

## 4. THEORYCRAFT PANEL

### Hero Metrics Bar Observed
- DPS: 4,166
- Expected Hit: 1,389
- TTK: —
- Status DMG: —
- Mode: PvE
- Build completeness: 91%
- Data confidence: **Placeholder**

### Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| T1 | "Data confidence: Placeholder" | HIGH | The confidence indicator shows "Placeholder" — this should reflect the actual confidence level of the selected items. |
| T2 | "0 active contributors → 1,389 expected damage" | HIGH | Formula breakdown shows 0 active contributors but still reports 1,389 damage. This means the base weapon damage is being used raw without any mod/food/deviation contributions. The DPS is 4,166 from raw weapon stats alone. |
| T3 | Stat Weight "Psi Intensity" shows -4162.870 DPS gain | CRITICAL | Psi Intensity stat weight shows a NEGATIVE value (-4162.870, -99.928%). This is almost certainly a bug — Psi Intensity should never reduce DPS. Likely a formula sign error or a division-by-zero edge case. |
| T4 | TTK and Status DMG both show "—" | LOW | Expected when no target is selected and no status keyword is active. Not a bug, but confusing for users. |
| T5 | Stat weights show 0 gain for Crit Rate, Crit Damage, Weakspot | MEDIUM | These should never be exactly 0 for a weapon with non-zero crit/weakspot values. Suggests the stat weight calculator isn't receiving weapon base stats. |

---

## 5. GENERAL UI/UX

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| G1 | 10 console errors on page load | MEDIUM | Multiple JS errors in the console. May affect functionality. |
| G2 | No visible "save build" or "export" | LOW | Build Comparison panel says "Save a build first to compare" but no save button is visible. |
| G3 | Secondary Weapon slot exists but unclear | LOW | The second weapon slot exists but Once Human is primarily single-weapon focused in combat. The secondary weapon slot should clarify its purpose (weapon swap or dual wield). |

---

## SUMMARY

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Weapon Selector | 1 | 3 | 2 | 1 |
| Mod Selector | 0 | 2 | 4 | 2 |
| Armor | 0 | 0 | 1 | 1 |
| Theorycraft Panel | 1 | 2 | 1 | 1 |
| General | 0 | 0 | 1 | 2 |
| **Total** | **2** | **7** | **9** | **7** |

### Top 5 Priority Fixes
1. **T3** — Psi Intensity negative DPS gain (likely formula bug)
2. **W1** — Chinese bindict weapons visible in selector (filter by confidence)
3. **M2** — Suffix keyword family misclassification (Violent/Precision are General, not Bullseye)
4. **T2/T5** — Formula breakdown showing 0 contributors and 0 stat weight gains
5. **M4** — Add suffix tier selector (engine already supports it)
