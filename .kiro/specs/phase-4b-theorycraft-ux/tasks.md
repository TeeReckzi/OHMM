# Implementation Plan: Phase 4B — Theorycraft UX / Decision-Support Layer

## Overview

This plan implements the theorycraft decision-support layer in two stages: Stage 1 (MVP) delivers all core view model logic, orchestrator wiring, and presentational components with safe fallback states. Stage 2 (Polish) layers animations, micro-interactions, teaching moments, and visual delight on top of the validated MVP.

All view model derivation is pure TypeScript in `src/lib/ohmm/theorycraft/`. React components in `src/app/components/theorycraft/` are presentational only. Vitest + fast-check provide property-based testing for correctness properties defined in the design.

## Tasks

- [x] 1. Set up testing infrastructure and shared types
  - [x] 1.1 Add Vitest and fast-check to root project
    - Install `vitest` and `fast-check` as devDependencies in root `package.json`
    - Create `vitest.config.ts` at project root with TypeScript support and path aliases matching `vite.config.ts`
    - Add `"test": "vitest --run"` script to root `package.json`
    - Verify `npx vitest --run` exits cleanly with 0 tests
    - _Requirements: 10.1, Design Testing Strategy_

  - [x] 1.2 Create theorycraft type definitions and constants
    - Create `src/lib/ohmm/theorycraft/types.ts` with all ViewModel interfaces: `MetricCardData`, `HeroMetricsViewModel`, `ExplainerLineItem`, `FormulaExplainerViewModel`, `SetThreshold`, `SetBonusEntry`, `SetBonusTrackerViewModel`, `StatWeightEntry`, `StatWeightViewModel`, `MetricDelta`, `SlotDiff`, `BuildComparisonViewModel`, `TheoryCraftState`
    - Create `src/lib/ohmm/theorycraft/constants.ts` with `PERTURBATION_DELTAS`, `CONFIDENCE_DISPLAY`, stat category labels, and all slot enumerations
    - Ensure types import `ConfidenceLevel` from existing engine types
    - _Requirements: 10.1, 6.2, 6.7_

  - [x] 1.3 Create shared utility helpers
    - Create `src/lib/ohmm/theorycraft/utils.ts` implementing: `safeFormat`, `isDisplayable`, `clamp`, `hashBuildSelection`, `aggregateConfidence`, `formatDelta`, `computeCompleteness`
    - All functions are pure (no React, no DOM)
    - `isDisplayable` returns false for NaN, Infinity, -Infinity, null, undefined
    - `safeFormat` returns "—" for non-displayable values
    - `computeCompleteness` returns ratio clamped to [0.0, 1.0]
    - _Requirements: 1.6, 1.7, 10.1, 10.3_

  - [x] 1.4 Write property tests for shared utilities
    - **Property 3: Build Completeness Derivation**
    - **Validates: Requirements 1.3**
    - Test that `computeCompleteness` always returns value in [0.0, 1.0] for any `BuildSelection`
    - **Property 15: View Model Safe Defaults** (partial — utilities)
    - **Validates: Requirements 10.3**
    - Test that `safeFormat` never returns strings containing "NaN", "undefined", "Infinity"

- [x] 2. Implement Hero Metrics Bar (MVP)
  - [x] 2.1 Implement `deriveHeroMetrics` view model helper
    - Create `src/lib/ohmm/theorycraft/heroMetrics.vm.ts`
    - Implement algorithm: extract DPS, expected hit, TTK, status DMG contribution, build mode from `CombatOutput`/`CalculationInput`
    - Add PvP mitigation metric when `buildMode === "pvp"`
    - Compute build completeness via `computeCompleteness`
    - Aggregate confidence via `aggregateConfidence`
    - Guard every numeric output: substitute "—" / 0 for non-displayable values
    - Return 5 metrics for PvE, 6 for PvP
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [x] 2.2 Write property tests for Hero Metrics view model
    - **Property 1: Hero Metrics Safe Display**
    - **Validates: Requirements 1.6, 1.7**
    - Verify no MetricCardData.value contains "NaN", "undefined", "Infinity", "-Infinity"
    - **Property 2: Hero Metrics Correct Mapping**
    - **Validates: Requirements 1.1, 1.2**
    - Verify PvE produces 5 metrics, PvP produces 6 metrics

  - [x] 2.3 Implement `HeroMetricsBar` React component
    - Create `src/app/components/theorycraft/HeroMetricsBar.tsx`
    - Receives `HeroMetricsViewModel` as prop — no engine imports
    - Render horizontal strip of `MetricCard` atoms with label, value, icon (Lucide)
    - Display build completeness indicator and confidence badge
    - Display "—" for missing values (from view model)
    - Communicate meaning through text labels + icons, not color alone
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 1.8, 2.1, 2.4_

  - [x] 2.4 Implement responsive layout and accessibility
    - Add responsive breakpoint: viewport < 768px → two-row grid layout
    - Add keyboard navigation: each metric cell focusable via Tab
    - Add `aria-label` on each metric cell announcing label + value for screen readers
    - _Requirements: 2.2, 2.3_

- [x] 3. Implement Formula Explainer (MVP)
  - [x] 3.1 Implement `deriveFormulaExplainer` view model helper
    - Create `src/lib/ohmm/theorycraft/formulaExplainer.vm.ts`
    - Extract base weapon damage from `calcInput.baseWeaponDMG`
    - Classify modifier sources into additive vs multiplicative groups
    - Build line items with label, value, formatted value, confidence, contribution percent
    - Build target assumptions from `calcInput.enemyType` and registry data
    - Add PvP mitigation section when `buildMode === "pvp"`
    - Never include line items not traceable to real `ModifierSource` in input
    - Count active contributors (value > 0)
    - Build summary line: "N active contributors → X expected damage"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.2 Write property tests for Formula Explainer view model
    - **Property 4: Formula Explainer Grouping Integrity**
    - **Validates: Requirements 3.2, 3.3**
    - Verify line items partition into exactly two groups, total count equals non-zero modifier sources
    - **Property 5: No Invented Data Invariant**
    - **Validates: Requirements 3.7, 11.1**
    - Verify every ExplainerLineItem.source maps to an existing entry in calcInput.modifierSources
    - **Property 6: Confidence Label Propagation**
    - **Validates: Requirements 3.6, 11.2, 11.3**
    - Verify "estimated"/"placeholder" confidence levels propagate to derived items

  - [x] 3.3 Implement `FormulaExplainer` React component
    - Create `src/app/components/theorycraft/FormulaExplainer.tsx`
    - Receives `FormulaExplainerViewModel` as prop — no engine imports
    - Default to collapsed state showing summary line (total damage + contributor count)
    - On expand: show full breakdown with multiplier groups, line items, target assumptions, provenance labels
    - Expand/collapse operable via click, Enter, and Space
    - Display confidence badges on each line item using `ConfidenceBadge` shared component
    - _Requirements: 3.1–3.7, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Implement Set Bonus Tracker (MVP)
  - [x] 4.1 Implement `deriveSetBonusTracker` view model helper
    - Create `src/lib/ohmm/theorycraft/setBonusTracker.vm.ts`
    - Iterate `BuildSelection.armor` slots, resolve piece IDs against registries
    - Group by armor set, count pieces, track occupied/unoccupied slots
    - Look up thresholds from `armorSetTierOverrides`, mark active/inactive
    - Compute `piecesNeeded` for next reachable threshold
    - Return empty state with guidance message when no armor equipped
    - Sort sets by equipped count descending
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 4.2 Write property tests for Set Bonus Tracker view model
    - **Property 7: Set Bonus Tracker Derivation**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**
    - Verify: only sets with ≥1 piece appear, equippedCount is correct, threshold isActive iff equippedCount >= required, piecesNeeded computed correctly

  - [x] 4.3 Implement `SetBonusTracker` React component
    - Create `src/app/components/theorycraft/SetBonusTracker.tsx`
    - Receives `SetBonusTrackerViewModel` as prop — no engine imports
    - Display grouped sets with piece count, occupied/unoccupied slots
    - Show thresholds with active/inactive distinguished by icon + text label (not color alone)
    - Display pieces needed for next threshold
    - Display empty state message when `isEmpty` is true
    - _Requirements: 5.1–5.8_

- [x] 5. Implement Stat Weight Calculator (MVP)
  - [x] 5.1 Implement `deriveStatWeights` perturbation engine
    - Create `src/lib/ohmm/theorycraft/statWeightCalculator.vm.ts`
    - Implement `perturbAndCompute`: deep clone (`structuredClone`) calcInput, inject perturbation, re-run engine, return DPS
    - Iterate all 7 stat categories with defined perturbation deltas
    - Sort results descending by `absoluteGain`, assign ranks, compute `barWidth` and `relativeGainPercent`
    - Return `isComputable: false` with error message when baseline DPS ≤ 0
    - Label output with "Estimate — based on simulation" disclaimer
    - Pure TypeScript — no React or DOM dependencies
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 5.2 Write property tests for Stat Weight Calculator
    - **Property 8: Perturbation Non-Mutation**
    - **Validates: Requirements 6.4**
    - Deep-compare original CalculationInput before/after — must be identical
    - **Property 9: Perturbation Stat Coverage**
    - **Validates: Requirements 6.2**
    - Verify exactly 7 entries returned for valid inputs with non-zero DPS
    - **Property 10: Perturbation Result Ordering**
    - **Validates: Requirements 6.3, 7.5**
    - Verify entries sorted in non-increasing order of absoluteGain
    - **Property 11: Stat Weight Bar Scaling**
    - **Validates: Requirements 7.2**
    - Verify top entry has barWidth === 1.0, all others in [0.0, 1.0]

  - [x] 5.3 Implement `StatWeightCalculator` React component
    - Create `src/app/components/theorycraft/StatWeightCalculator.tsx`
    - Receives `StatWeightViewModel` as prop — no engine imports
    - Display ranked list: stat name, absolute DPS gain, relative gain %, visual bar indicator
    - Bar length communicates ranking (not color alone)
    - Display "0" gain for zero-delta stats, ranked below positives
    - Display error message when `isComputable` is false
    - Display disclaimer label
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Implement Build Comparison Delta View (MVP)
  - [x] 6.1 Implement `deriveBuildComparison` view model helper
    - Create `src/lib/ohmm/theorycraft/buildComparison.vm.ts`
    - Load saved build via `buildPersistenceService` API
    - Validate against `savedBuildSchema` — return error on failure
    - Return empty state when no saved builds exist
    - Compute comparison output using existing `compareCombatOutputs`
    - Walk each loadout slot: compare weapon, armor pieces, mods, food, deviant, cradle
    - Assign delta direction: gain/loss/unchanged with icons
    - Format deltas with +/- prefix and thousands separator
    - Never mutate current BuildSelection or saved build
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [x] 6.2 Write property tests for Build Comparison view model
    - **Property 12: Build Comparison Delta Correctness**
    - **Validates: Requirements 8.2, 9.1**
    - Verify DPS delta = current - saved, direction assigned correctly
    - **Property 13: Build Comparison Slot Diff**
    - **Validates: Requirements 8.3, 8.9**
    - Verify hasChanged === true iff item IDs differ between builds
    - **Property 14: Build Comparison Non-Mutation**
    - **Validates: Requirements 8.4**
    - Deep-compare both BuildSelection objects before/after — must be identical

  - [x] 6.3 Implement `BuildComparisonView` React component
    - Create `src/app/components/theorycraft/BuildComparisonView.tsx`
    - Receives `BuildComparisonViewModel` as prop — no engine imports
    - Side-by-side layout: current (left) vs saved (right)
    - Display build names as column headers
    - Show DPS delta, expected damage delta, TTK delta with direction arrows + text labels
    - Show slot-by-slot diff with item names, highlight changed slots
    - Communicate direction via iconography + text (not color alone)
    - Display error/empty state messages when applicable
    - _Requirements: 8.1–8.9, 9.1, 9.2, 9.3, 9.4_

- [x] 7. Checkpoint — MVP core logic validated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Orchestrator and wiring
  - [x] 8.1 Implement `TheoryCraftOrchestrator`
    - Create `src/lib/ohmm/theorycraft/orchestrator.ts`
    - Implement `computeTheoryCraftState` that computes CombatOutput once and distributes to all derive* functions
    - Memoize stat weights by hashing BuildSelection — recompute only on change
    - Wrap each derive call with `safeDerive` defensive wrapper
    - Export full `TheoryCraftState` containing all 5 view models + timestamp
    - _Requirements: 10.2, 10.4, 11.4_

  - [x] 8.2 Implement `useTheoryCraft` React hook
    - Create `src/lib/ohmm/theorycraft/useTheoryCraft.ts`
    - Wrap `computeTheoryCraftState` with `useMemo` keyed on input references
    - Lives in theorycraft module — NOT in App.tsx
    - Consumed by `TheoryCraftPanel`
    - _Requirements: 10.2, 10.4_

  - [x] 8.3 Implement `TheoryCraftPanel` layout wrapper and shared components
    - Create `src/app/components/theorycraft/TheoryCraftPanel.tsx` — mounts all 5 feature components, consumes `useTheoryCraft` hook
    - Create `src/app/components/theorycraft/shared/MetricCard.tsx` — reusable metric display atom
    - Create `src/app/components/theorycraft/shared/DeltaIndicator.tsx` — up/down arrow with label
    - Create `src/app/components/theorycraft/shared/ConfidenceBadge.tsx` — provenance pill with icon + text
    - Create `src/app/components/theorycraft/shared/EmptyState.tsx` — reusable guidance state
    - _Requirements: 10.2, 10.4, 11.2, 11.3, 11.9_

  - [x] 8.4 Wire TheoryCraftPanel into app layout
    - Mount `TheoryCraftPanel` in the appropriate location in the app's component tree
    - Ensure orchestration logic stays out of App.tsx — only a single hook or component mount point
    - Pass `BuildSelection`, `CalculationInput`, `CombatOutput` from existing state to `TheoryCraftPanel`
    - _Requirements: 10.4_

  - [x] 8.5 Write integration tests for orchestrator
    - Test memoization: same BuildSelection → same stat weight result (referential equality)
    - Test single computation: verify CombatOutput computed once per loadout change
    - Test safeDerive: verify graceful fallback on view model errors
    - _Requirements: 10.2, 11.4_

- [x] 9. Cross-cutting MVP features
  - [x] 9.1 Implement confidence and provenance display
    - Ensure all view models propagate confidence levels from registry entries
    - `ConfidenceBadge` renders distinct icon + text for "estimated" and "placeholder" entries
    - Provenance badges appear on all metric surfaces where underlying data has low confidence
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 9.2 Implement empty states and actionable guidance
    - Each component renders guidance text when no data: "Equip a weapon to see DPS metrics", "Save a build first", etc.
    - Empty states use `EmptyState` shared component
    - _Requirements: 11.9_

  - [x] 9.3 Write architectural smoke tests
    - Verify view model files (`*.vm.ts`) don't import from React
    - Verify component files don't import engine modules directly
    - Verify App.tsx has no theorycraft orchestration logic
    - _Requirements: 10.1, 10.4, 2.4, 4.4, 5.8, 7.4, 9.4_

- [x] 10. Checkpoint — Full MVP validated
  - Ensure all tests pass, build succeeds, typechecks pass, and all MVP features render correctly with empty, partial, and populated data states. Ask the user if questions arise.

- [ ] 11. Stage 2 — Polish: Animations and motion design
  - [ ] 11.1 Implement animated numeric transitions
    - Add Framer Motion `AnimatedNumber` component for count-up/count-down (200ms ease-out)
    - Apply to all numeric values in Hero Metrics Bar, Stat Weight Calculator, Build Comparison
    - Respect `prefers-reduced-motion`: disable animations when set
    - _Requirements: 1.9, 11.6, 13.1, 13.7_

  - [ ] 11.2 Implement metric change pulse/dim animations
    - Hero Metrics: pulse highlight (scale 1.0→1.02→1.0, 300ms) on improvement
    - Hero Metrics: dim animation (opacity 1.0→0.7→1.0, 300ms) on regression
    - Respect `prefers-reduced-motion`
    - _Requirements: 1.12, 1.13, 13.7_

  - [ ] 11.3 Implement biggest contributor badge
    - Identify metric with largest positive delta on loadout change
    - Display "biggest contributor" badge on that metric card
    - _Requirements: 1.11_

  - [ ] 11.4 Implement panel expand/collapse animation
    - Formula Explainer: smooth 300ms ease-out expand/collapse with Framer Motion
    - Consistent motion across all expandable panels
    - Respect `prefers-reduced-motion`
    - _Requirements: 13.1, 13.7_

  - [ ] 11.5 Implement animated delta arrows for Build Comparison
    - Arrow scaling proportional to delta magnitude (capped at 2x)
    - Respect `prefers-reduced-motion`
    - _Requirements: 9.5, 13.7_

- [ ] 12. Stage 2 — Polish: Set Bonus Tracker enhancements
  - [ ] 12.1 Implement Progress Ring component
    - Circular/segmented arc showing fractional progress toward next threshold
    - Smooth arc transition (300ms ease-out) when progress changes
    - Respect `prefers-reduced-motion`
    - _Requirements: 5.9, 5.11, 13.7_

  - [ ] 12.2 Implement "Worth it?" micro-indicator
    - Show estimated DPS gain of reaching next set threshold
    - Derive from stat weight simulation or direct engine comparison
    - _Requirements: 5.10_

- [ ] 13. Stage 2 — Polish: Stat Weight Calculator enhancements
  - [ ] 13.1 Implement "Best Upgrade" badge and stat source display
    - Crown icon (Lucide) on highest-ranked stat
    - Display item slot/source where stat can be obtained
    - _Requirements: 7.6, 7.7_

  - [ ] 13.2 Implement sparkline trend indicators
    - Track last 5 computations per stat rank
    - Display mini sparkline showing rank shift over session
    - _Requirements: 7.8_

  - [ ] 13.3 Implement "Quick win" callout
    - Identify stat obtainable through lowest-effort upgrade path
    - Label with source metadata (food buff, calibration slot, etc.)
    - _Requirements: 7.9_

- [ ] 14. Stage 2 — Polish: Formula Explainer enhancements
  - [ ] 14.1 Implement smart summary line and contribution bars
    - Summary: identify single largest DPS contributor in plain language
    - Horizontal bars next to each line item scaled relative to largest contributor
    - _Requirements: 3.8, 3.9_

  - [ ] 14.2 Implement "What if removed?" labels
    - Show hypothetical DPS on top 3 contributors if removed
    - _Requirements: 3.10_

  - [ ] 14.3 Implement educational micro-tooltips on group headers
    - Hover tooltips explaining game mechanics (additive vs multiplicative)
    - Dismissible on pointer-out or Escape
    - _Requirements: 3.11_

- [ ] 15. Stage 2 — Polish: Build Comparison enhancements
  - [ ] 15.1 Implement net verdict summary line
    - Combine key metric changes into plain-language sentence
    - e.g., "+12% DPS, -5% survivability — aggressive trade"
    - _Requirements: 9.6_

- [ ] 16. Stage 2 — Polish: Micro-tooltips and teaching moments
  - [ ] 16.1 Implement Hero Metrics micro-tooltips
    - Hover tooltip on each metric card explaining meaning in plain language
    - Dismissible on pointer-out or Escape
    - _Requirements: 1.10_

  - [ ] 16.2 Implement First-Time Hints system
    - Dismissible overlay on each major panel (5 panels)
    - Persist dismissal in localStorage
    - Operable via keyboard (Escape, Enter on dismiss button)
    - Announce content to screen readers
    - _Requirements: 12.1, 12.2, 12.7_

  - [ ] 16.3 Implement contextual "Did you know?" micro-tips
    - Surface relevant tips based on loadout composition
    - Non-intrusive placement within panel tip area
    - Derived exclusively from verified registry mechanics
    - Global "Hide tips" toggle persisted in localStorage
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

- [x] 17. Stage 2 — Polish: Visual identity and professional feel
  - [x] 17.1 Implement visual design tokens and card styling
    - Typography hierarchy: semibold 2xl (value), regular sm (label), regular xs (context)
    - Depth treatment: 1px border at 5% opacity, layered box-shadow
    - Consistent border-radius using `radius-lg` from shadcn theme
    - Consistent Lucide icons at 18px in all panel headers
    - _Requirements: 13.2, 13.3, 13.5, 13.6_

  - [x] 17.2 Implement dark theme optimizations
    - High-contrast foreground colors for metric values
    - Subtle glow effect (text-shadow with primary color at 20% opacity) on key numbers
    - _Requirements: 13.4_

  - [x] 17.3 Implement focus rings and hover states
    - Consistent 2px ring, 150ms transition on all interactive Phase 4B elements
    - _Requirements: 11.7_

  - [x] 17.4 Implement shimmer skeleton loading states
    - Animated gradient sweep placeholder while computing/loading
    - Replace blank space and static spinners
    - _Requirements: 11.8_

  - [x] 17.5 Implement "Last engine update" timestamp
    - Badge in theorycraft panel header showing when engine last recomputed
    - _Requirements: 11.11_

  - [x] 17.6 Implement confidence badge hover expansion
    - Provenance pills expand on hover to show full source details
    - _Requirements: 11.10_

- [ ] 18. Final checkpoint — All features validated
  - Ensure all tests pass, build succeeds, typechecks pass. All Stage 1 + Stage 2 features render correctly. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between stages
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- Stage 2 tasks (11–17) MUST NOT begin until Checkpoint 10 passes (Stage Gate Rule)
- The project uses TypeScript throughout — view models are pure TS, components are React + TSX
- Vitest is new to the root project (src/ohai/ has its own custom test runner)
- `fast-check` generators are shared across all property test files via `generators.ts`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1", "3.1", "4.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2", "4.3", "5.2", "5.3", "6.2", "6.3"] },
    { "id": 4, "tasks": ["2.4", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4", "8.5", "9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3"] },
    { "id": 8, "tasks": ["11.1", "11.3", "11.4", "11.5", "12.1", "13.1"] },
    { "id": 9, "tasks": ["11.2", "12.2", "13.2", "13.3", "14.1", "14.2", "14.3", "15.1", "16.1"] },
    { "id": 10, "tasks": ["16.2", "16.3", "17.1", "17.2", "17.3", "17.4", "17.5", "17.6"] }
  ]
}
```
