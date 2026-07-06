# Implementation Plan: Phase 4B — Theorycraft UX / Decision-Support Layer

## Overview

This plan covers the remaining Stage 2 (Polish) tasks for the theorycraft decision-support layer. Stage 1 (MVP) is fully complete — all core view model logic, orchestrator wiring, presentational components, property tests, integration tests, and visual identity are validated and working.

The remaining work layers animations, micro-interactions, teaching moments, and enhanced UX on top of the validated MVP. All view model derivation is pure TypeScript in `src/lib/ohmm/theorycraft/`. React components in `src/app/components/theorycraft/` are presentational only.

## Tasks

- [ ] 1. Stage 2 — Polish: Animations and motion design
  - [ ] 1.1 Implement animated numeric transitions
    - Add Framer Motion `AnimatedNumber` component for count-up/count-down (200ms ease-out)
    - Apply to all numeric values in Hero Metrics Bar, Stat Weight Calculator, Build Comparison
    - Respect `prefers-reduced-motion`: disable animations when set
    - _Requirements: 1.9, 11.6, 13.1, 13.7_

  - [ ] 1.2 Implement metric change pulse/dim animations
    - Hero Metrics: pulse highlight (scale 1.0→1.02→1.0, 300ms) on improvement
    - Hero Metrics: dim animation (opacity 1.0→0.7→1.0, 300ms) on regression
    - Respect `prefers-reduced-motion`
    - _Requirements: 1.12, 1.13, 13.7_

  - [ ] 1.3 Implement biggest contributor badge
    - Identify metric with largest positive delta on loadout change
    - Display "biggest contributor" badge on that metric card
    - _Requirements: 1.11_

  - [ ] 1.4 Implement panel expand/collapse animation
    - Formula Explainer: smooth 300ms ease-out expand/collapse with Framer Motion
    - Consistent motion across all expandable panels
    - Respect `prefers-reduced-motion`
    - _Requirements: 13.1, 13.7_

  - [ ] 1.5 Implement animated delta arrows for Build Comparison
    - Arrow scaling proportional to delta magnitude (capped at 2x)
    - Respect `prefers-reduced-motion`
    - _Requirements: 9.5, 13.7_

- [ ] 2. Stage 2 — Polish: Set Bonus Tracker enhancements
  - [ ] 2.1 Implement Progress Ring component
    - Circular/segmented arc showing fractional progress toward next threshold
    - Smooth arc transition (300ms ease-out) when progress changes
    - Respect `prefers-reduced-motion`
    - _Requirements: 5.9, 5.11, 13.7_

  - [ ] 2.2 Implement "Worth it?" micro-indicator
    - Show estimated DPS gain of reaching next set threshold
    - Derive from stat weight simulation or direct engine comparison
    - _Requirements: 5.10_

- [ ] 3. Stage 2 — Polish: Stat Weight Calculator enhancements
  - [ ] 3.1 Implement "Best Upgrade" badge and stat source display
    - Crown icon (Lucide) on highest-ranked stat
    - Display item slot/source where stat can be obtained
    - _Requirements: 7.6, 7.7_

  - [ ] 3.2 Implement sparkline trend indicators
    - Track last 5 computations per stat rank
    - Display mini sparkline showing rank shift over session
    - _Requirements: 7.8_

  - [ ] 3.3 Implement "Quick win" callout
    - Identify stat obtainable through lowest-effort upgrade path
    - Label with source metadata (food buff, calibration slot, etc.)
    - _Requirements: 7.9_

- [ ] 4. Stage 2 — Polish: Formula Explainer enhancements
  - [ ] 4.1 Implement smart summary line and contribution bars
    - Summary: identify single largest DPS contributor in plain language
    - Horizontal bars next to each line item scaled relative to largest contributor
    - _Requirements: 3.8, 3.9_

  - [ ] 4.2 Implement "What if removed?" labels
    - Show hypothetical DPS on top 3 contributors if removed
    - _Requirements: 3.10_

  - [ ] 4.3 Implement educational micro-tooltips on group headers
    - Hover tooltips explaining game mechanics (additive vs multiplicative)
    - Dismissible on pointer-out or Escape
    - _Requirements: 3.11_

- [ ] 5. Stage 2 — Polish: Build Comparison enhancements
  - [ ] 5.1 Implement net verdict summary line
    - Combine key metric changes into plain-language sentence
    - e.g., "+12% DPS, -5% survivability — aggressive trade"
    - _Requirements: 9.6_

- [ ] 6. Stage 2 — Polish: Micro-tooltips and teaching moments
  - [ ] 6.1 Implement Hero Metrics micro-tooltips
    - Hover tooltip on each metric card explaining meaning in plain language
    - Dismissible on pointer-out or Escape
    - _Requirements: 1.10_

  - [ ] 6.2 Implement First-Time Hints system
    - Dismissible overlay on each major panel (5 panels)
    - Persist dismissal in localStorage
    - Operable via keyboard (Escape, Enter on dismiss button)
    - Announce content to screen readers
    - _Requirements: 12.1, 12.2, 12.7_

  - [ ] 6.3 Implement contextual "Did you know?" micro-tips
    - Surface relevant tips based on loadout composition
    - Non-intrusive placement within panel tip area
    - Derived exclusively from verified registry mechanics
    - Global "Hide tips" toggle persisted in localStorage
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

- [ ] 7. Final checkpoint — All features validated
  - Ensure all tests pass, build succeeds, typechecks pass. All Stage 1 + Stage 2 features render correctly. Ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between stages
- Stage 1 (MVP) is fully complete — all core logic, components, tests, and visual identity are validated
- The project uses TypeScript throughout — view models are pure TS, components are React + TSX
- Framer Motion ("motion" package) is used for all animations
- All animations must respect `prefers-reduced-motion` media query
- Lucide React provides the icon system

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4", "1.5", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2", "3.3", "4.1", "4.2", "4.3", "5.1", "6.1"] },
    { "id": 2, "tasks": ["6.2", "6.3"] }
  ]
}
```
