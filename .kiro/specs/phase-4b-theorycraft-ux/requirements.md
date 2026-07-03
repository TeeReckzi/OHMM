# Requirements Document

## Introduction

Phase 4B adds a Theorycrafting UX / Decision-Support Layer to OHMM. The current application can calculate combat results but lacks effective communication of *why* builds produce certain numbers and *what changes would improve them*. This phase introduces five features — Hero Metrics Bar, Formula Explainer, Set Bonus Tracker, Stat Weight Calculator, and Build Comparison Delta View — that transform raw engine output into actionable, trustworthy decision-support for players.

All features are read-only presentation layers over the existing formula engine. No formula engine rewrites or persistence layer replacements are in scope.

Implementation follows a two-stage approach: **Stage 1 (MVP)** delivers all core functionality with safe fallback states and working data pipelines. **Stage 2 (Polish)** layers on animations, micro-interactions, teaching moments, and visual delight — but only after MVP is fully working, tested, and validated.

## Implementation Stages

### Stage 1 — MVP (implement first, must be working/tested/validated before Stage 2)

1. **Hero Metrics Bar** — core display with safe placeholder values ("—"), no animations
2. **Basic Formula Explainer** — only displays data actually available from CombatOutput/CalculationInput, no invented data
3. **Basic Set Bonus Tracker** — shows set progress, active/inactive thresholds
4. **Initial Stat Weight Calculator** — non-mutating perturbation simulation, ranked output
5. **Basic Build Comparison** — compare current vs saved build, show deltas

### Stage 2 — Polish (implement ONLY after MVP is working, tested, and validated)

- Animated transitions (Requirement 1 criteria 9, 12, 13)
- Biggest contributor badge (Requirement 1 criterion 11)
- "What if removed?" labels (Requirement 3 criterion 10)
- Progress rings (Requirement 5 criterion 9)
- Progress ring animations (Requirement 5 criterion 11)
- "Worth it?" micro-indicator (Requirement 5 criterion 10)
- Sparkline trend indicators (Requirement 7 criterion 8)
- Quick win callouts (Requirement 7 criterion 9)
- Best Upgrade badge (Requirement 7 criterion 6)
- Stat source display (Requirement 7 criterion 7)
- Animated delta arrows (Requirement 9 criterion 5)
- First-time hints (Requirement 12 — all criteria)
- Shimmer skeletons (Requirement 11 criterion 8)
- Full motion design language (Requirement 13 criteria 1–7)
- Micro-tooltips (Requirement 1 criterion 10, Requirement 3 criterion 11)
- Contribution bars (Requirement 3 criterion 9)
- Smart summary line (Requirement 3 criterion 8)
- Dark theme glow effects (Requirement 13 criterion 4)
- "Last engine update" timestamp (Requirement 11 criterion 11)
- Net verdict summary line (Requirement 9 criterion 6)
- AI Build Advisor placeholder (Requirement 14 — entire requirement)

### Stage Gate Rule

Stage 2 SHALL NOT begin until all Stage 1 (MVP) acceptance criteria pass validation including: build succeeds, typechecks pass, smoke tests pass, and all MVP features render correctly with empty, partial, and populated data states.

## Glossary

- **Hero_Metrics_Bar**: A high-visibility horizontal strip near the top of the application that displays key combat metrics at a glance.
- **Formula_Explainer**: An expandable panel that breaks down how a build's damage numbers are derived, showing contributor groups and multiplier chains.
- **Set_Bonus_Tracker**: A panel that displays armor set membership, active bonus thresholds, and progress toward next unlock.
- **Stat_Weight_Calculator**: A simulation tool that ranks stat upgrades by marginal DPS gain using controlled perturbation against the current loadout.
- **Build_Comparison_View**: A read-only panel that shows deltas between the current loadout and a saved build loaded from Phase 4A persistence.
- **CombatOutput**: The engine's computed result object containing DamageOutputMetrics, SurvivabilityMetrics, PvPDuelContext, and diagnostics.
- **CalculationInput**: The normalized representation of a loadout fed into the combat engine after sanitization and modifier resolution.
- **BuildSelection**: The user's current loadout state including weapon, armor pieces, mods, cradle, deviant, and food buff selections.
- **Confidence_Label**: A trust-level tag (project_verified, observed, estimated, placeholder) attached to registry entries indicating data provenance.
- **DPS**: Damage Per Second — the primary throughput metric computed by the engine.
- **TTK**: Time To Kill — derived metric representing seconds to eliminate a target at given health.
- **Perturbation_Simulation**: A controlled technique where a single stat is increased by a fixed delta, the engine re-runs, and the DPS gain is measured.
- **View_Model**: A derived, presentation-ready data structure computed from engine output and loadout state, consumed by UI components.
- **Progressive_Disclosure**: A UX pattern where information is revealed in layers — summary first, detail on demand.
- **Stat_Weight**: The marginal DPS gain per unit increase of a given stat, expressed as a relative ranking.
- **Saved_Build**: A persisted BuildSelection stored in localStorage via the Phase 4A buildPersistenceService (schema v1).
- **Animated_Transition**: A smooth count-up or count-down number interpolation rendered over a 200ms ease-out duration using Framer Motion.
- **Micro_Tooltip**: A hover-triggered inline tooltip providing contextual explanation text for a UI element, dismissible on pointer-out or Escape key.
- **Contribution_Bar**: A horizontal bar indicator scaled proportionally to the largest contributor, representing a line item's share of total output.
- **Progress_Ring**: A circular or segmented arc indicator representing fractional progress toward a threshold.
- **Shimmer_Skeleton**: A placeholder loading state using a subtle animated gradient sweep to indicate pending computation.
- **First_Time_Hint**: A dismissible overlay tooltip shown once per panel on first user encounter, persisted in localStorage to avoid repeat display.
- **Motion_Design_Language**: A consistent set of animation timing curves (ease-out), durations (200ms for numeric transitions, 300ms for panel transitions), and spring configs shared across all Phase 4B components.
- **AI_Build_Advisor**: A future-phase (Phase 11) conversational interface trained on OHMM's verified registry and engine output, providing natural-language build guidance grounded in deterministic data.

## Requirements

### Requirement 1: Hero Metrics Bar — Core Display

**User Story:** As a player, I want to see my build's key combat metrics at a glance near the top of the app, so that I can instantly assess build quality without scrolling.

#### Acceptance Criteria

1. THE Hero_Metrics_Bar SHALL display DPS, expected hit damage, TTK, status damage contribution, and build mode (PvE or PvP) sourced from the current CombatOutput. [MVP]
2. WHEN the current build mode is PvP, THE Hero_Metrics_Bar SHALL additionally display PvP mitigation percentage. [MVP]
3. THE Hero_Metrics_Bar SHALL display a build completeness indicator derived from the ratio of filled loadout slots to total available slots. [MVP]
4. THE Hero_Metrics_Bar SHALL display a confidence indicator derived from the formula confidence score of the current CalculationInput. [MVP]
5. WHEN a loadout change occurs, THE Hero_Metrics_Bar SHALL update all displayed metrics within a single React render cycle using the recomputed CombatOutput. [MVP]
6. WHEN a metric value is unavailable due to incomplete loadout data, THE Hero_Metrics_Bar SHALL display an em-dash character ("—") in place of that metric's value. [MVP]
7. THE Hero_Metrics_Bar SHALL never display NaN, undefined, Infinity, or negative-Infinity as a metric value. [MVP]
8. THE Hero_Metrics_Bar SHALL communicate metric meaning through text labels and icons, not through color alone. [MVP]
9. WHEN a metric value changes, THE Hero_Metrics_Bar SHALL animate the numeric transition from the previous value to the new value using an Animated_Transition (200ms ease-out count-up/count-down interpolation). [POLISH]
10. THE Hero_Metrics_Bar SHALL display a Micro_Tooltip on each metric card explaining the metric's meaning in plain language (e.g., "DPS: Damage dealt per second assuming continuous fire at current uptime"). [POLISH]
11. WHEN a loadout change occurs, THE Hero_Metrics_Bar SHALL identify the metric with the largest positive delta and display a "biggest contributor" badge on that metric card. [POLISH]
12. WHEN a metric value improves compared to the previous computation, THE Hero_Metrics_Bar SHALL apply a subtle pulse highlight animation (scale 1.0→1.02→1.0, 300ms) to that metric card. [POLISH]
13. WHEN a metric value regresses compared to the previous computation, THE Hero_Metrics_Bar SHALL apply a subtle dim animation (opacity 1.0→0.7→1.0, 300ms) to that metric card. [POLISH]

### Requirement 2: Hero Metrics Bar — Presentation and Layout

**User Story:** As a player, I want the metrics bar to be readable and accessible on both desktop and narrow viewport sizes, so that I can use it in overlay and windowed modes.

#### Acceptance Criteria

1. THE Hero_Metrics_Bar SHALL render as a horizontal strip positioned above the main loadout editing area. [MVP]
2. WHEN the viewport width is below 768px, THE Hero_Metrics_Bar SHALL reflow metrics into a two-row grid layout to prevent horizontal overflow. [MVP]
3. THE Hero_Metrics_Bar SHALL be fully operable via keyboard navigation, with each metric cell focusable and announcing its label and value to screen readers. [MVP]
4. THE Hero_Metrics_Bar SHALL be implemented as a presentational React component that receives a View_Model prop and contains no direct engine calls. [MVP]

### Requirement 3: Formula Explainer — Damage Breakdown

**User Story:** As a theorycrafter, I want to see a breakdown of how my build's damage is computed, so that I can identify which gear pieces and mechanics contribute the most.

#### Acceptance Criteria

1. THE Formula_Explainer SHALL display the base weapon damage value used as the foundation of the damage formula. [MVP]
2. THE Formula_Explainer SHALL group multipliers into additive groups and multiplicative groups, showing each group's total contribution. [MVP]
3. THE Formula_Explainer SHALL display individual contributions from calibration bonuses, mod effects, armor set bonuses, active buff effects, and status damage effects as labeled line items within their respective groups. [MVP]
4. WHEN the build mode is PvP, THE Formula_Explainer SHALL include a PvP mitigation section showing the damage reduction applied to outgoing hits. [MVP]
5. THE Formula_Explainer SHALL display target assumptions used in the calculation (target type, health, resistances) with their source labels. [MVP]
6. THE Formula_Explainer SHALL display the confidence provenance of each major data source (project_verified, observed, estimated, or placeholder). [MVP]
7. THE Formula_Explainer SHALL never display mechanics, multipliers, or bonuses that are not present in the CalculationInput or CombatOutput — invented or placeholder explanations are prohibited. [MVP]
8. THE Formula_Explainer SHALL display a smart summary line identifying the single largest DPS contributor in plain language (e.g., "Crit Damage is carrying 43% of your total output"). [POLISH]
9. THE Formula_Explainer SHALL display a Contribution_Bar next to each line item representing that item's percentage share of total damage output, scaled relative to the largest contributor. [POLISH]
10. THE Formula_Explainer SHALL display a "What if removed?" label on each major contributor (top 3 by contribution) showing the hypothetical DPS value if that contributor were absent. [POLISH]
11. THE Formula_Explainer SHALL display inline educational Micro_Tooltips on group headers explaining the game mechanic (e.g., hovering "Additive Group" shows "These bonuses stack by addition before being multiplied together"). [POLISH]

### Requirement 4: Formula Explainer — Progressive Disclosure

**User Story:** As a casual player, I want the formula explanation to start collapsed with a summary, so that I am not overwhelmed by detail unless I ask for it.

#### Acceptance Criteria

1. THE Formula_Explainer SHALL render in a collapsed state by default, showing only a one-line summary with total expected damage and the number of active contributors. [MVP]
2. WHEN the user activates the expand control, THE Formula_Explainer SHALL reveal the full breakdown including all multiplier groups, line items, target assumptions, and provenance labels. [MVP]
3. THE Formula_Explainer expand/collapse control SHALL be operable via mouse click, keyboard Enter, and keyboard Space. [MVP]
4. THE Formula_Explainer SHALL be implemented as a presentational React component that receives a View_Model prop and contains no direct engine calls. [MVP]

### Requirement 5: Set Bonus Tracker — Set Progress Display

**User Story:** As a player, I want to see which armor set pieces I have equipped and how close I am to the next set bonus threshold, so that I can make informed gearing decisions.

#### Acceptance Criteria

1. THE Set_Bonus_Tracker SHALL display all armor sets for which the player has at least one equipped piece, grouped by set name. [MVP]
2. FOR EACH displayed armor set, THE Set_Bonus_Tracker SHALL show the current equipped piece count, the list of occupied slot names, and the list of unoccupied slot names. [MVP]
3. FOR EACH displayed armor set, THE Set_Bonus_Tracker SHALL show all bonus thresholds (2-piece, 4-piece, 6-piece) with their bonus text. [MVP]
4. FOR EACH displayed armor set, THE Set_Bonus_Tracker SHALL visually distinguish active bonus thresholds from inactive bonus thresholds using both a distinct icon and a text label. [MVP]
5. FOR EACH displayed armor set where the next threshold is reachable, THE Set_Bonus_Tracker SHALL display the number of additional pieces required to reach the next bonus threshold. [MVP]
6. WHEN the player equips or removes an armor piece, THE Set_Bonus_Tracker SHALL update within a single React render cycle. [MVP]
7. WHEN no armor pieces are equipped, THE Set_Bonus_Tracker SHALL display an empty-state message indicating that no set progress exists. [MVP]
8. THE Set_Bonus_Tracker SHALL be implemented as a presentational React component that receives a View_Model prop derived from the current BuildSelection and registry data. [MVP]
9. FOR EACH displayed armor set, THE Set_Bonus_Tracker SHALL display a Progress_Ring showing visual fractional progress toward the next bonus threshold (e.g., 3/4 segments filled for 3 of 4 pieces equipped). [POLISH]
10. FOR EACH displayed armor set where the next threshold is reachable, THE Set_Bonus_Tracker SHALL display a "Worth it?" micro-indicator showing the estimated DPS gain of reaching the next set threshold, derived from stat weight simulation or direct engine comparison. [POLISH]
11. WHEN the player equips an armor piece that advances set progress, THE Set_Bonus_Tracker SHALL animate the Progress_Ring fill with a smooth arc transition (300ms ease-out). [POLISH]

### Requirement 6: Stat Weight Calculator — Perturbation Engine

**User Story:** As a theorycrafter, I want to know which stat upgrade provides the highest marginal DPS gain, so that I can prioritize upgrades efficiently.

#### Acceptance Criteria

1. THE Stat_Weight_Calculator SHALL compute stat weights by applying a fixed perturbation delta (+1 unit or +1 percentage point, depending on stat type) to each candidate stat independently, re-running the damage formula, and measuring the DPS delta from the baseline. [MVP]
2. THE Stat_Weight_Calculator SHALL cover the following stat categories: Weapon DMG%, Status DMG%, Elemental DMG%, Crit Rate, Crit Damage, Weakspot Damage, and Psi Intensity. [MVP]
3. THE Stat_Weight_Calculator SHALL rank results in descending order of marginal DPS gain. [MVP]
4. THE Stat_Weight_Calculator SHALL not mutate the current BuildSelection or CalculationInput during simulation — all perturbation runs operate on cloned copies. [MVP]
5. THE Stat_Weight_Calculator SHALL label its output with "Estimate — based on simulation" to communicate that results are derived from controlled perturbation rather than confirmed game mechanics. [MVP]
6. IF the current loadout produces a baseline DPS of zero or undefined, THEN THE Stat_Weight_Calculator SHALL display a message indicating that stat weights cannot be computed without a valid baseline. [MVP]
7. THE Stat_Weight_Calculator perturbation logic SHALL be implemented as a pure TypeScript helper module with no React or DOM dependencies. [MVP]

### Requirement 7: Stat Weight Calculator — Presentation

**User Story:** As a player, I want to see stat weight results in a clear ranked format, so that I can quickly identify the best stat to upgrade.

#### Acceptance Criteria

1. THE Stat_Weight_Calculator display component SHALL present stat weights as a ranked list showing stat name, absolute DPS gain, and relative gain percentage. [MVP]
2. THE Stat_Weight_Calculator display component SHALL include a visual bar indicator representing each stat's relative contribution, scaled to the highest-ranked stat. [MVP]
3. THE Stat_Weight_Calculator display component SHALL communicate rankings through position, labels, and bar length — not through color alone. [MVP]
4. THE Stat_Weight_Calculator display component SHALL be implemented as a presentational React component that receives a View_Model prop and contains no direct engine calls. [MVP]
5. WHEN a stat perturbation yields zero DPS gain, THE Stat_Weight_Calculator display component SHALL display that stat with a "0" gain value and rank it below all positive-gain stats. [MVP]
6. THE Stat_Weight_Calculator display component SHALL highlight the highest-ranked stat with a "Best Upgrade" badge (crown icon from Lucide) visually distinguishable from other ranks. [POLISH]
7. THE Stat_Weight_Calculator display component SHALL display, for the highest-ranked stat, the item slot or source where that stat can be obtained (e.g., "Found on: Calibration rolls, Mod suffixes"). [POLISH]
8. WHEN the user has changed loadouts multiple times within a session, THE Stat_Weight_Calculator display component SHALL display a mini sparkline trend indicator showing how each stat's rank has shifted across the last 5 computations. [POLISH]
9. THE Stat_Weight_Calculator display component SHALL identify and label a "Quick win" callout for the stat that is obtainable through the lowest-effort upgrade path (e.g., food buff, existing calibration slot) based on available source metadata. [POLISH]

### Requirement 8: Build Comparison Delta View — Core Comparison

**User Story:** As a player, I want to compare my current build against a previously saved build, so that I can evaluate whether my changes are improvements.

#### Acceptance Criteria

1. THE Build_Comparison_View SHALL load the comparison target from the Phase 4A persistence layer using the buildPersistenceService API. [MVP]
2. THE Build_Comparison_View SHALL display DPS delta, expected damage delta, and TTK delta between the current build and the comparison target. [MVP]
3. THE Build_Comparison_View SHALL display a list of changed loadout slots (weapon, armor pieces, mods, food, deviant, cradle) identifying which items differ between builds. [MVP]
4. THE Build_Comparison_View SHALL operate in read-only mode — activating a comparison does not modify the current loadout or the saved build. [MVP]
5. IF the saved build fails schema validation during load, THEN THE Build_Comparison_View SHALL display an error message indicating the saved build is incompatible and cannot be compared. [MVP]
6. IF no saved builds exist in persistence, THEN THE Build_Comparison_View SHALL display an empty-state message indicating that builds must be saved before comparison is available. [MVP]
7. THE Build_Comparison_View SHALL sanitize the comparison target by validating it against the savedBuildSchema before computing deltas. [MVP]
8. THE Build_Comparison_View SHALL render in a side-by-side layout with the current build displayed on the left and the comparison target displayed on the right. [MVP]
9. THE Build_Comparison_View SHALL display a slot-by-slot diff view listing each loadout slot with item name and icon (where available) for both builds, highlighting slots that differ. [MVP]

### Requirement 9: Build Comparison Delta View — Presentation

**User Story:** As a player, I want comparison deltas to clearly indicate improvement or regression, so that I can make informed decisions.

#### Acceptance Criteria

1. THE Build_Comparison_View SHALL display positive deltas with an upward arrow icon and a "gain" text label, and negative deltas with a downward arrow icon and a "loss" text label. [MVP]
2. THE Build_Comparison_View SHALL communicate delta direction through both iconography and text labels — not through color alone. [MVP]
3. THE Build_Comparison_View SHALL display the build names (current label and saved build name) as column headers for orientation. [MVP]
4. THE Build_Comparison_View SHALL be implemented as a presentational React component that receives a View_Model prop and contains no direct engine calls. [MVP]
5. THE Build_Comparison_View SHALL render delta arrows with animated scaling proportional to the magnitude of change (larger deltas produce visually larger arrow icons, capped at 2x scale). [POLISH]
6. THE Build_Comparison_View SHALL display a net verdict summary line combining key metric changes into a plain-language sentence (e.g., "+12% DPS, -5% survivability — aggressive trade"). [POLISH]

### Requirement 10: Cross-Cutting — View Model Architecture

**User Story:** As a developer, I want theorycraft derivation logic separated from UI components, so that features can share derived data and components remain testable in isolation.

#### Acceptance Criteria

1. THE application SHALL compute all theorycraft View_Models in pure TypeScript helper modules located outside of React component files. [MVP]
2. THE application SHALL share a single CombatOutput computation per loadout change across the Hero_Metrics_Bar, Formula_Explainer, and Stat_Weight_Calculator rather than recomputing independently in each component. [MVP]
3. WHEN a View_Model helper module receives invalid or incomplete input, THE helper module SHALL return a safe default View_Model with placeholder values ("—" for strings, 0 for numbers, empty arrays for collections) rather than throwing exceptions. [MVP]
4. THE application SHALL not add theorycraft UI orchestration logic directly to App.tsx — all feature coordination SHALL reside in dedicated feature modules or a shared theorycraft orchestration module. [MVP]

### Requirement 11: Cross-Cutting — Data Integrity and Performance

**User Story:** As a player, I want metrics and explanations to reflect only verified game mechanics, so that I can trust the calculator's output.

#### Acceptance Criteria

1. THE application SHALL never display invented mechanics, fabricated multipliers, or placeholder bonus text in any Phase 4B feature component. [MVP]
2. THE application SHALL propagate Confidence_Labels from registry entries through to any UI surface that displays data derived from those entries. [MVP]
3. WHEN a registry entry carries a confidence level of "estimated" or "placeholder", THE application SHALL visually annotate the derived metric with a provenance indicator distinguishable by both icon and text. [MVP]
4. THE Stat_Weight_Calculator SHALL memoize perturbation results and recompute only when the underlying BuildSelection changes. [MVP]
5. THE Set_Bonus_Tracker view model computation SHALL execute in under 5ms for loadouts with up to 6 equipped armor pieces. [MVP]
6. THE application SHALL animate all numeric value transitions using a consistent Animated_Transition (200ms ease-out interpolation) across all Phase 4B components. [POLISH]
7. THE application SHALL render focus rings and hover states on all interactive Phase 4B elements with a consistent visual treatment (2px ring, 150ms transition). [POLISH]
8. WHEN a Phase 4B component is computing or loading data, THE application SHALL display a Shimmer_Skeleton placeholder rather than blank space or a static spinner. [POLISH]
9. WHEN a Phase 4B component has no data to display (empty state), THE application SHALL render actionable guidance text explaining what the user should do to populate the panel (e.g., "Equip a weapon to see DPS metrics"). [MVP]
10. THE application SHALL render Confidence_Label provenance badges as visually distinct pill elements that expand on hover to show full source details. [POLISH]
11. THE application SHALL display a "Last engine update" timestamp badge in the theorycraft panel header showing when the formula engine last recomputed results. [POLISH]

### Requirement 12: Delight and Teaching Moments

**User Story:** As a player new to theorycrafting, I want the tool to teach me game mechanics in context while I use it, so that I learn to make better build decisions over time.

#### Acceptance Criteria

1. THE application SHALL display a dismissible First_Time_Hint overlay on each major Phase 4B panel (Hero_Metrics_Bar, Formula_Explainer, Set_Bonus_Tracker, Stat_Weight_Calculator, Build_Comparison_View) explaining what the panel does and how to read it. [POLISH]
2. THE application SHALL persist First_Time_Hint dismissal state in localStorage so that dismissed hints do not reappear on subsequent visits. [POLISH]
3. THE application SHALL surface contextual "Did you know?" micro-tips relevant to the current loadout composition (e.g., WHEN the loadout contains status-focused gear, THE application SHALL display a tip explaining "Status damage scales with Status DMG% and Psi Intensity"). [POLISH]
4. THE application SHALL display contextual micro-tips non-intrusively in a designated tip area within the relevant panel, not as modal dialogs or blocking overlays. [POLISH]
5. THE application SHALL derive micro-tip content exclusively from verified game mechanics present in the registry — invented or speculative tips are prohibited. [POLISH]
6. THE application SHALL allow the user to dismiss all micro-tips globally via a single "Hide tips" toggle persisted in localStorage. [POLISH]
7. THE First_Time_Hint overlays SHALL be operable via keyboard (dismissible with Escape key or Enter on the dismiss button) and announce their content to screen readers. [POLISH]

### Requirement 13: Visual Identity and Professional Feel

**User Story:** As a player, I want the theorycraft interface to feel polished and premium like professional optimizer tools, so that I trust it and enjoy using it.

#### Acceptance Criteria

1. THE application SHALL apply a consistent Motion_Design_Language across all Phase 4B animations: 200ms ease-out for numeric transitions, 300ms ease-out for panel expand/collapse, and a shared spring config (stiffness: 300, damping: 30) for interactive feedback. [POLISH]
2. THE application SHALL render metric cards with a clear typography hierarchy: primary metric value in semibold 2xl, metric label in regular sm, and secondary context in regular xs. [POLISH]
3. THE application SHALL render metric cards with subtle depth treatment (1px border with 5% opacity, layered box-shadow) creating a physical dashboard instrument appearance. [POLISH]
4. THE application SHALL optimize all Phase 4B components for dark theme display: metric values SHALL use high-contrast foreground colors and key numbers SHALL apply a subtle glow effect (text-shadow with primary color at 20% opacity) against dark backgrounds. [POLISH]
5. THE application SHALL use a consistent Lucide icon system across all Phase 4B panel headers, with icons rendered at a uniform 18px size and consistent spacing from header text. [POLISH]
6. THE application SHALL apply the same border-radius token (radius-lg from shadcn theme) to all Phase 4B card and panel container elements for visual cohesion. [POLISH]
7. THE application SHALL ensure all Phase 4B transition animations respect the user's "prefers-reduced-motion" media query by disabling animations when the preference is set. [POLISH]

### Requirement 14: Future Phase — AI Build Advisor (Phase 11 Placeholder)

**User Story:** As a player, I want to ask natural-language questions about my build and receive expert-level Once Human advice, so that I can learn and optimize without leaving the tool.

#### Acceptance Criteria

1. THIS requirement is a roadmap placeholder — it is NOT in scope for Phase 4B implementation. [POLISH]
2. THE AI_Build_Advisor SHALL be implemented in a dedicated future phase (Phase 11) after all structured decision-support surfaces (Phase 4B) are complete and stable. [POLISH]
3. THE AI_Build_Advisor SHALL be trained or RAG-grounded on OHMM's verified registry data, formula engine outputs, game mechanics documentation, and confidence/provenance metadata. [POLISH]
4. THE AI_Build_Advisor SHALL accept natural-language questions about the current loadout (e.g., "Why is my DPS low?", "What should I change for PvP?", "Is this weapon good for status builds?"). [POLISH]
5. THE AI_Build_Advisor SHALL ground all responses in the structured outputs from Phase 4B features (Stat Weights, Formula Explainer, Set Bonus Tracker, Build Comparison) and reference those panels in its answers. [POLISH]
6. THE AI_Build_Advisor SHALL clearly label all responses as "AI-generated" to distinguish them from deterministic engine output. [POLISH]
7. THE AI_Build_Advisor SHALL refuse to answer questions about mechanics not present in the verified registry and respond with "I don't have verified data for that mechanic" rather than hallucinating. [POLISH]
8. THE AI_Build_Advisor architecture decision (client-side inference via WebLLM/ONNX, API-backed with user-provided key, or hybrid) SHALL be determined in the Phase 11 spec based on bundle size, privacy, and latency tradeoffs. [POLISH]
9. THE AI_Build_Advisor SHALL NOT be a prerequisite for any Phase 4B feature — all Phase 4B surfaces must function fully without the AI layer. [POLISH]
