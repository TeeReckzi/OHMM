# OHMM — Feature Backlog

**Created**: 2026-06-30 (Phase 1 Planning)
**Last Updated**: 2026-06-30

---

## Critical

Features without which OHMM cannot compete with spreadsheets.

---

### F-001: Save & Load Builds (Persistence)

**User Problem**: Users lose all work when closing the browser. No reason to return.

**Difficulty**: Low-Medium
**Dependencies**: Phase 3 (state extraction from App.tsx)
**Phase**: 4A

**Files/Modules Impacted**:
- NEW: `src/app/stores/buildStore.ts` (Zustand store)
- NEW: `src/app/components/panels/SavedBuildsPanel.tsx`
- MODIFY: `src/app/App.tsx` (replace useState with store)

**Testing Requirements**:
- Save a build, refresh page, verify restoration
- Save 20 builds, verify list display
- Delete a saved build, verify removal
- Corrupt localStorage, verify graceful fallback

**Risk Notes**:
- Schema changes in future could break saved data → need version field
- localStorage limit (~5MB) → cap at 20 builds

---

### F-002: Share Build via URL

**User Problem**: Cannot share builds with team/community. No viral loop.

**Difficulty**: Medium
**Dependencies**: F-001 (build state must be serializable)
**Phase**: 4A

**Files/Modules Impacted**:
- NEW: `src/app/utils/buildEncoder.ts` (encode/decode)
- MODIFY: `src/app/components/layout/AppHeader.tsx` (add Share button)
- REFERENCE: `src/ohai/src/ui/buildShareService.ts` (existing encode logic in ohai)

**Testing Requirements**:
- Encode full loadout → decode produces identical state
- URL length < 2048 chars for standard sharing
- Handle malformed URLs gracefully (no crash)
- Share URL works in new browser session

**Risk Notes**:
- If encoding schema changes, old URLs break → version prefix in URL
- Some loadout combinations may exceed URL length → offer fallback (copy JSON)

---

### F-003: Stat Weight Calculator

**User Problem**: "What should I upgrade next?" is unanswerable. Players cannot determine which stat provides the most DPS per point.

**Difficulty**: Medium
**Dependencies**: Phase 3 (clean component to host the UI)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/StatWeightPanel.tsx`
- NEW: `src/lib/ohmm/statWeightCalculator.ts`
- READ: `src/ohai/src/ui/formulaBridge.ts` (recompute with modified inputs)
- READ: `src/ohai/src/ui/combatOutput.ts` (compare DPS outputs)
- READ: `src/ohai/src/schemas/buildGoalSchema.ts` (stat key enumeration)

**Testing Requirements**:
- Increment each stat by fixed delta, verify DPS change is positive or zero
- Stat weights sum is reasonable (no single stat dominates by 100x)
- Empty loadout produces sensible defaults (no NaN/Infinity)
- Compare against manual spreadsheet calculation for 2-3 reference builds

**Risk Notes**:
- Some stats have non-linear scaling (crit rate at 100% has zero marginal value)
- Stat weights depend on current build state → must recalculate on every change
- Performance: 42 stats × full recalculation each → may need throttling

---

### F-004: Formula Explainer in UI

**User Problem**: Users see a DPS number but cannot understand what drives it. Cannot verify correctness. Cannot debug unexpected results.

**Difficulty**: Low (engine already has `formulaExplainer.ts`)
**Dependencies**: Phase 3 (need a panel to display it)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/FormulaExplainerPanel.tsx`
- READ: `src/ohai/src/engine/formulaExplainer.ts` (formatFormulaExplanation)
- READ: `src/ohai/src/ui/formulaDamageAdapter.ts` (FormulaResult output)

**Testing Requirements**:
- Explainer output matches actual DPS calculation
- Burn details display correctly (stacks, tick interval, DPS)
- No NaN/undefined values rendered
- Multiplier chain produces correct final number when multiplied manually

**Risk Notes**:
- None significant. Engine already produces this data. Pure UI work.
- Long explainer text may need scroll container

---

### F-005: Hero Metrics Dashboard

**User Problem**: Critical numbers (DPS, TTK, Crit Rate) are buried inside collapsible panels. Users must hunt for the most important information.

**Difficulty**: Low
**Dependencies**: Phase 3 (AnalysisHub extraction for clean placement)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/layout/HeroMetrics.tsx`
- MODIFY: Layout in App.tsx or workspace wrapper
- READ: `src/ohai/src/ui/combatOutput.ts` (DamageOutputMetrics, SurvivabilityMetrics)

**Testing Requirements**:
- Numbers match existing CombatResolver panel values exactly
- Updates in real-time when loadout changes
- Handles empty loadout gracefully (shows "—")
- Delta indicators show correct direction (↑/↓)

**Risk Notes**:
- Must not duplicate calculation. Read from same source as AnalysisHub.
- Performance: should not trigger additional re-renders

---

## High

Features that significantly improve the theorycrafting experience.

---

### F-006: Set Bonus Progress Tracker

**User Problem**: Players cannot see which armor sets are partially active or how close they are to the next bonus threshold.

**Difficulty**: Low
**Dependencies**: Phase 3 (LoadoutPanel extraction)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/SetBonusTracker.tsx`
- READ: `src/ohai/src/resolvers/armorSetBonusResolver.ts` (set detection logic)
- READ: `src/ohai/src/ui/registries/generated/armor-sets.generated.ts` (set definitions)

**Testing Requirements**:
- 0/6 pieces → no set shown
- 2/6 Lonewolf → "2pc active, 4pc needs 2 more"
- Correct bonus text displayed per threshold
- Adding/removing armor updates tracker immediately

**Risk Notes**:
- Set detection depends on armor IDs matching set registry entries
- Some armor pieces may not have set association in current data

---

### F-007: Upgrade Priority Queue

**User Problem**: "I have limited resources. Which upgrade gives me the most DPS per cost?"

**Difficulty**: Medium
**Dependencies**: F-003 (Stat Weight Calculator)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/UpgradePriorityPanel.tsx`
- NEW: `src/lib/ohmm/upgradePriorityCalculator.ts`
- READ: Stat weight calculator output
- READ: Star/tier scaling data from registries

**Testing Requirements**:
- Priority order matches manual calculation
- Handles all upgrade paths (stars, tiers, calibration rerolls)
- Empty loadout shows "equip items first"
- No duplicate entries in priority list

**Risk Notes**:
- "Cost" is subjective (blueprint fragments vs calibration stones vs time)
- May need user-configurable cost weights
- Star/tier scaling factors need verification for accuracy

---

### F-008: TTK Simulator with Target Presets

**User Problem**: DPS is abstract. "How fast do I kill an Elite Scorcher?" is actionable.

**Difficulty**: Medium
**Dependencies**: Phase 3
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/TTKSimulatorPanel.tsx`
- READ: `src/ohai/src/ui/registries/pveTargetRegistry.ts` (enemy presets)
- READ: `src/ohai/src/ui/combatOutput.ts` (DPS for division)

**Testing Requirements**:
- TTK = TargetHP / DPS (basic validation)
- Target presets load correctly from registry
- Custom HP input works
- Resistance modifiers reduce effective DPS correctly

**Risk Notes**:
- PvE target data may be incomplete (needs HP values for all enemy types)
- Burst vs sustained DPS affects TTK interpretation
- Status effect ramp-up time not modeled in simple TTK

---

### F-009: Build Diff Viewer

**User Problem**: "I changed my mod and DPS went up 340. Why?" requires manual comparison.

**Difficulty**: Low-Medium
**Dependencies**: F-001 (state snapshots for before/after)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/BuildDiffPanel.tsx`
- NEW: `src/lib/ohmm/buildDiff.ts`
- READ: Build store (previous vs current state)

**Testing Requirements**:
- Swapping one item shows exactly what changed
- DPS delta matches actual difference
- Modifier-level diff shows which stats moved
- "No changes" state handled gracefully

**Risk Notes**:
- Need to snapshot state before each change (memory consideration)
- Deep object comparison for LoadoutMap can be expensive

---

### F-010: Build Comparison Mode

**User Problem**: "Is Build A or Build B better for this scenario?" requires two browser tabs.

**Difficulty**: Medium
**Dependencies**: F-001 (multiple build states), Phase 3
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/BuildComparisonPanel.tsx`
- MODIFY: Build store (support 2+ independent calculation pipelines)
- READ: Full calculation pipeline (must run independently for each build)

**Testing Requirements**:
- Two builds compute independently (no shared state pollution)
- Comparison shows correct deltas for all metrics
- Switching builds doesn't lose either state
- Performance acceptable with 2× calculation overhead

**Risk Notes**:
- Doubles memory usage for calculation state
- May need lazy evaluation (compute build B only when comparison active)

---

## Medium

Features that improve depth and education.

---

### F-011: Keyword Synergy Matrix

**User Problem**: Once Human's keyword system (Burn, Frost, Surge, Shrapnel, etc.) is complex. Players don't know what unlocks keyword crit or which items synergize.

**Difficulty**: Low
**Dependencies**: None (data exists in registries)
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/KeywordMatrix.tsx`
- READ: Weapon registry (keyword associations)
- READ: Armor registry (keyword unlock items like Gilded Gloves)
- READ: Engine conditional effects (keyword crit/weakspot flags)

**Testing Requirements**:
- All 6+ keywords displayed with correct crit/weakspot flags
- Scaling stat correct per keyword (PSI vs DMG/Proj)
- Unlock items correctly associated
- Active keywords highlighted based on equipped items

**Risk Notes**:
- Keyword data may be incomplete for newer content
- Must not invent mechanics — only display verified data

---

### F-012: Calibration Roll Analyzer

**User Problem**: "Is my 37.2% Weapon DMG calibration good?" No reference point exists in the app.

**Difficulty**: Low
**Dependencies**: None
**Phase**: 4B

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/CalibrationAnalyzer.tsx`
- READ: Calibration modal data (roll range 25%-50%)
- READ: Stat weight calculator (DPS impact of roll)

**Testing Requirements**:
- Percentile calculation correct (linear distribution assumed)
- DPS difference between current roll and perfect roll shown
- DPS difference between current roll and average roll shown
- Handles edge cases (min roll 25%, max roll 50%)

**Risk Notes**:
- Roll distribution may not be linear (could be weighted). Mark as "assumed uniform" until verified.
- Secondary substat ranges need verification

---

### F-013: Meta Build Library (Presets)

**User Problem**: New players don't know where to start. No curated starting points.

**Difficulty**: Low-Medium
**Dependencies**: F-001 (persistence), F-002 (share encoding for presets)
**Phase**: 4B (late)

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/BuildLibrary.tsx`
- NEW: `src/app/data/metaBuilds.ts` (curated build definitions)
- READ: Build store (load preset into state)

**Testing Requirements**:
- Each preset loads without errors
- Preset builds produce valid calculation results
- "Load Preset" doesn't lose unsaved current build without warning
- All items referenced in presets exist in registries

**Risk Notes**:
- Presets become stale after game patches
- Need version/season tagging
- Community contribution pipeline not addressed here

---

### F-014: Mod Synergy Recommendations

**User Problem**: 91+ mods with complex interactions. Players don't know which mod combinations are strongest for their build.

**Difficulty**: Medium-High
**Dependencies**: F-003 (stat weights for ranking), Phase 3
**Phase**: 4B (late)

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/ModSynergyPanel.tsx`
- NEW: `src/lib/ohmm/modSynergyScorer.ts`
- READ: Mod registry (all mods with stat modifiers)
- READ: Stat weight calculator (score each mod's impact)

**Testing Requirements**:
- Top-ranked mod actually produces highest DPS gain when equipped
- Recommendations change when weapon/build changes
- Slot filtering correct (weapon mods only for weapon slot)
- No incorrect keyword associations

**Risk Notes**:
- Scoring requires running calculation for each candidate mod (expensive)
- May need caching or progressive computation
- Conditional effects (uptime-dependent mods) complicate ranking

---

## Low

Nice-to-have features that enhance polish.

---

### F-015: Attachment Auto-Suggest

**User Problem**: 5 attachment slots with dozens of options per slot. Decision paralysis.

**Difficulty**: Medium
**Dependencies**: F-003 (stat weights for ranking)
**Phase**: 5 or deferred

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/AttachmentSuggest.tsx`
- READ: Attachment registry, stat weight calculator

**Testing Requirements**:
- Suggestions filtered by weapon compatibility
- Top suggestion actually provides highest DPS gain
- "Auto-equip all" applies correct items to correct slots

**Risk Notes**:
- Attachment compatibility per weapon family needs verification
- Some attachments have conditional effects not modeled

---

### F-016: Cradle Perk Tree Visualization

**User Problem**: 8 flat slots don't convey unlock paths or synergies between perks.

**Difficulty**: Medium
**Dependencies**: Phase 3
**Phase**: 5 or deferred

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/CradleTree.tsx`
- READ: Cradle registry (perk data, synergies)

**Testing Requirements**:
- Tree structure matches in-game cradle layout
- Equipped perks highlighted
- Synergy connections visible

**Risk Notes**:
- Cradle tree structure may change with game updates
- Unlock path data may not be in current registries

---

### F-017: Food/Drink Buff Combinator

**User Problem**: Chef Rex bonus calculation is confusing. Players don't know combined effect.

**Difficulty**: Low
**Dependencies**: None
**Phase**: 5 or deferred

**Files/Modules Impacted**:
- NEW: `src/app/components/panels/BuffCombinator.tsx`
- READ: Food buff registry, Chef Rex scaling logic

**Testing Requirements**:
- Combined buff percentage correct
- Chef Rex scaling matches in-game formula
- Duration display accurate

**Risk Notes**:
- Chef Rex dual-mode issue (ratings vs stored percent) noted in audit

---

## Deferred

Features requiring external dependencies or major architectural decisions.

---

### F-018: Build Import from Game (Screenshot/OCR)

**User Problem**: Manually entering 20+ items is tedious. Import from screenshot.

**Difficulty**: Very High
**Dependencies**: External OCR service, `apps/vision-service` (dormant)
**Phase**: Post-v1.0

**Risk Notes**:
- Requires running a local service or cloud OCR
- Game UI layout changes break recognition
- Error rate may frustrate users more than manual entry

---

### F-019: Community Build Voting & Ranking

**User Problem**: No way to discover what other players are using.

**Difficulty**: High
**Dependencies**: Backend service, user accounts, moderation
**Phase**: Post-v1.0

**Risk Notes**:
- Requires server infrastructure
- Moderation burden
- Spam/abuse potential

---

### F-020: Season Balance History

**User Problem**: "Was my build better last patch?" Historical comparison.

**Difficulty**: High
**Dependencies**: Versioned registry snapshots
**Phase**: Post-v1.0

**Risk Notes**:
- Storage of historical data
- Which version of game data to apply per snapshot

---

### F-021: Real-Time DPS Overlay (Overwolf)

**User Problem**: See theorycrafted DPS alongside actual gameplay.

**Difficulty**: Very High
**Dependencies**: `apps/overwolf-bridge` (dormant), game API access
**Phase**: Post-v1.0

**Risk Notes**:
- Overwolf platform requirements
- Game Terms of Service compliance
- Maintenance burden per game patch

---

*Feature Backlog — OHMM Engineering Council*
