# Data Integrity Audit Report

Generated: 2026-07-09T08:01:53.785Z

## Summary

- BLOCKERS: 0
- WARNINGS: 462
- INFO: 182

## Quarantine candidates

- src/ui/registries/modRegistry.ts

## Placeholder / suspicious IDs

- elemental-overload (src/ui/registries/modRegistry.ts) — registry item is estimated and needsReview=true
- status-amplifier (src/ui/registries/modRegistry.ts) — registry item is estimated and needsReview=true
- crit-boost (src/ui/registries/modRegistry.ts) — registry item is estimated and needsReview=true
- elemental-overload (src/ui/registries/modRegistry.ts) — suspicious token is quarantined as test-fixture data: elemental-overload
- status-amplifier (src/ui/registries/modRegistry.ts) — suspicious token is quarantined as test-fixture data: status-amplifier
- crit-boost (src/ui/registries/modRegistry.ts) — suspicious token is quarantined as test-fixture data: crit-boost
- burn-set-2pc (src/ui/registries/modRegistry.ts) — suspicious token is quarantined as test-fixture data: burn-set-2pc
- blaze-suffix (src/ui/registries/modRegistry.ts) — suspicious token is quarantined as test-fixture data: blaze-suffix

## Legacy mod-selection usage / core+suffix contract issues

- [WARN] src/lib/ohmm/convertLoadout.ts :: legacy-mod-selection :: legacy mods.{slot} shape appears outside migration/type definition code
- [WARN] src/ohai/src/ui/App.tsx :: legacy-mod-selection :: legacy mods.{slot} shape appears outside migration/type definition code

## Top issue categories

- 176 × INFO: build-like file lacks explicit validation status label
- 146 × WARN: registry item is observed and needsReview=true
- 116 × WARN: registry item is estimated
- 81 × WARN: registry item is estimated and needsReview=true
- 43 × WARN: sourceNotes contain review marker "estimated"
- 43 × WARN: build-like file lacks explicit validation status label
- 9 × WARN: sourceNotes contain review marker "pending"
- 8 × WARN: registry item is experimental and needsReview=true
- 7 × WARN: sourceNotes contain review marker "placeholder"
- 6 × INFO: slot has core mods and no suffix options; non-weapon suffixes are optional in the post-split model
- 5 × WARN: suspicious token is quarantined as test-fixture data: <value>
- 2 × WARN: legacy mods.{slot} shape appears outside migration/type definition code
- 1 × WARN: sourceNotes contain review marker "manual"
- 1 × WARN: registry item is verified and needsReview=true

## Full issue list

- Omitted in summary mode. Run `npx tsx src/ohai/scripts/audit-build-data-integrity.ts --full-report` for complete details.

## Next actions

- Replace or quarantine BLOCKER records before user testing.
- Convert sample/default builds to explicit validationStatus labels.
- Replace legacy mods.{slot} samples with core/suffix pairs.
- Keep schema-level permissiveness separate from domain-level build validity.
