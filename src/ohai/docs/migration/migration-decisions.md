# Migration Decisions — Stale/Dangerous Pattern Audit

> Every hit from the stale/dangerous pattern scan with keep/rewrite/discard decision.

---

## 1. Remote Wikily URLs in Active Source Code

### 1.1 `src/ui/data/catalog.ts`

| Line | Issue | Decision | Reason |
|------|-------|----------|--------|
| 35-37 | `weaponIconById` stub — comment says "removed" but empty `Record` still declared and referenced at line 121 | **REWRITE** | Dead code; `iconUrl: weaponIconById[weapon.id]` always returns `undefined`. Remove entirely. |
| 39-46 | `itemIconById` — 3 food items with hardcoded `wikily.gg` + `r2.wikily.gg` remote URLs | **DISCARD** | Remote URLs violate privacy audit. Replace with local image resolution or remove. |

### 1.2 `src/ui/registries/weaponRegistry.ts`

| Line | Issue | Decision | Reason |
|------|-------|----------|--------|
| 192 | `iconUrl: "https://r2.wikily.gg/.../sg_rm1889_ssr_02.webp"` | **DISCARD** | Remote URL; replace with local image resolution pipeline |
| 212 | `iconUrl: "https://r2.wikily.gg/.../cb_bow_ssr_01.webp"` | **DISCARD** | Remote URL |
| 231 | `iconUrl: "https://r2.wikily.gg/.../smg_p90_ssr_01.webp"` | **DISCARD** | Remote URL |
| 250 | `iconUrl: "https://r2.wikily.gg/.../pt_sw500_sr_02.webp"` | **DISCARD** | Remote URL |

### 1.3 `src/ui/registries/generated/weapons.generated.ts`

| Line | Issue | Decision | Reason |
|------|-------|----------|--------|
| 24 | `iconUrl: "https://r2.wikily.gg/.../ar_aug_ssr_01.webp"` | **REGENERATE** | Generated file; fix generator to not emit remote URLs |
| 44 | `iconUrl: "https://r2.wikily.gg/.../ar_ssr_crossbow_01.webp"` | **REGENERATE** | Generated file |

### 1.4 `src/schemas/externalReferenceSchema.ts`

| Line | Issue | Decision | Reason |
|------|-------|----------|--------|
| 20 | `wikily: "https://wikily.gg/once-human/armor-crafting-materials/"` | **REWRITE** | Schema defines wikily as a source URL base key. Remove wikily key; keep schema structure for other sources. |

### 1.5 `src/parsers/importExternalReferences.ts`

| Line | Issue | Decision | Reason |
|------|-------|----------|--------|
| 50 | `sourceUrlBaseKey: "wikily"` | **REWRITE** | References wikily source. Remove wikily entry. |

---

## 2. `weaponIconById` Legacy Pattern

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/ui/data/catalog.ts:35-37` | Comment says "removed" but `const weaponIconById: Record<string, string> = {}` still declared | **DISCARD** | Dead code. Remove declaration and line 121 reference. |
| `src/ui/data/catalog.ts:121` | `iconUrl: weaponIconById[weapon.id]` — always undefined | **DISCARD** | Dead reference. Replace with proper image resolution. |

---

## 3. `import.meta.env.DEV` in Non-Bundler Context

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/ui/registries/weaponPresentationBridge.ts:37` | `if (import.meta.env.DEV)` | **REWRITE** | Main tsconfig uses CommonJS module; `import.meta.env.DEV` is only valid under Vite/bundler. The `tsconfig.ui.json` (ESNext/Bundler) covers this file, but it creates a dual-config fragility. Replace with a dev-mode flag or remove diagnostic logging. |
| `src/ui/registries/weaponPresentationBridge.ts:66` | `if (import.meta.env.DEV)` | **REWRITE** | Same issue |
| `src/ui/registries/weaponPresentationBridge.ts:86` | `if (import.meta.env.DEV)` | **REWRITE** | Same issue |

---

## 4. Legacy/Duplicate Patterns

### 4.1 Legacy Stub

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/App.tsx` | "Legacy stub / entry point placeholder" — not used by Vite | **DISCARD** | Real app is `src/ui/App.tsx`. This file serves no purpose. |

### 4.2 Legacy Mod Map Bridge

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/ui/registries/modSelectionBridge.ts` | `legacyModToModSelection()` uses `(result as any)` casts; `modSelectionToLegacyMod()` maintains backward compat with flat mod map | **REWRITE** | Clean up type safety. In new repo, drop legacy flat map support or isolate it behind a migration function with proper types. |
| `src/ui/types.ts:59-83` | `ModSelection` type has both Core/Suffix keys AND legacy aliases (weapon, head, etc.) with index signature | **REWRITE** | Split into `ModSelections` (clean, new) and a separate `LegacyModMap` type. Migration function handles conversion. |
| `src/ui/savedBuildSchema.ts:36-60` | `modSelectionSchema` has both new Core/Suffix and legacy aliases | **REWRITE** | Keep legacy aliases in parse migration only, not in the active schema. |

### 4.3 Duplicate Image Resolvers

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/ui/registries/itemImageResolver.ts` | Generic item image resolver with 5+ fallback strategies | **REWRITE** | Overlaps with `src/data/external/ohdb/image_resolver.ts`. Consolidate into single pipeline. |
| `src/data/external/ohdb/image_resolver.ts` | OHDB-specific image resolver with `getAllOhdbWeapons()` shim | **REWRITE** | `getAllOhdbWeapons()` is a compatibility shim loading JSON via `require()`. Consolidate with itemImageResolver. |
| `src/data/external/ohdb/weaponImageOverrides.ts` | Weapon-specific image overrides | **REVIEW** | May duplicate `itemImageOverrides.ts`. Check and merge. |

### 4.4 Duplicate Registry Patterns

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/ui/registries/modRegistry.ts` (hand-curated) | 4 hand-curated suffix mods with empty `statModifiers`, all "estimated" confidence | **REWRITE** | These duplicate generated data. The hand-curated entries should be replaced by or reconciled with generated data from `mod-suffix-effects.verified.json`. |
| `src/ui/registries/armorRegistry.ts` (hand-curated) | ~492 lines of hand-curated armor with "estimated" confidence, empty statModifiers | **REWRITE** | Same issue — reconcile with generated data. |

---

## 5. Placeholder/Sample/Demo/Mock Patterns

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/utils/combat/formulaObservedCases.ts` | 25+ cases tagged `["synthetic", "placeholder"]` | **KEEP (labeled)** | These are intentionally labeled as synthetic/placeholder. They serve as validation scaffolding. Must remain labeled. |
| `src/utils/combat/officialFormulaValidationHarness.ts:49` | `"dummy-test placeholder — real game data not yet recovered"` | **KEEP (labeled)** | Labeled placeholder in validation harness. Acceptable. |
| `src/utils/combat/officialFormulaLeafResolvers.ts` | 3 leaves resolve to placeholder 0 with `missingReason` | **KEEP (labeled)** | Known unresolved leaves (species_dam_add_rate, human_dam_add_rate, debuff_type_dam_add_rate). Properly labeled. |
| `src/ui/registries/modSuffixLegality.ts:20-27` | `getModCoreSuffixLegalityReport()` returns empty placeholder report | **REWRITE** | Should either be implemented or removed. Currently misleading. |
| `src/data/external/ohdb/mod_future_types.ts:13` | `flashEffect?: unknown; // placeholder – never invent values` | **KEEP (labeled)** | Properly labeled placeholder type. |
| `src/ui/components/LoadoutPanel.tsx:6` | Comment: "uses a placeholder for the graph area" | **KEEP** | UI placeholder, acceptable. |
| `src/ui/data/catalog.ts:37` | `const weaponIconById: Record<string, string> = {}` — empty but active | **DISCARD** | Not labeled as placeholder; appears functional but always returns undefined. |
| `src/utils/combat/combatOutputSmokeTest.ts:37` | `function mockCalculationInput()` | **KEEP** | Test mock, acceptable in test context. |

---

## 6. Core-Only Mod Selection Risk

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/ui/types.ts:59-83` | `ModSelection` allows all suffix fields to be undefined | **REWRITE** | Must enforce: equipped mod = core + suffix. Separate `IncompleteModSelection` (draft) from `CompletedModSelection` (equipped). |
| `src/ui/registries/modSelectionBridge.ts:56-72` | `getCompletedModForCalculation()` correctly returns undefined for incomplete, but the type system doesn't enforce it | **REWRITE** | Types must enforce completeness at compile time. |
| `src/ui/savedBuildSchema.ts` | All suffix fields default to `"none"` | **REWRITE** | `"none"` is ambiguous — does it mean "no suffix selected" or "General suffix"? Must distinguish. |

---

## 7. "General" Suffix Treatment

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/utils/normalizeModSuffixEffect.ts:8` | `blockType: "general" | "keyword" | "legacy" | "unknown"` | **KEEP** | "general" is correctly modeled as a real suffix type. |
| `src/ui/registries/modSuffixLegality.ts` | Uses OHDB mod variants for legality — General must be in the valid suffix list | **REWRITE** | Ensure General is never treated as "no suffix" or "missing suffix". |

---

## 8. OHDB-Only Selectable Items Risk

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/data/external/ohdb/presentation_enrichment.ts` | OHDB data used for display names and images only | **KEEP (correct)** | Properly separated: OHDB = presentation, locked registries = selection authority. |
| `src/ui/registries/weaponPresentationBridge.ts` | Enriches display but doesn't alter registry selection | **KEEP (correct)** | Presentation-only enrichment. |
| `src/ui/registries/modSuffixLegality.ts` | Uses OHDB mod variants for suffix legality | **REWRITE** | This is the one place where OHDB data influences selection legality. Must be audited: OHDB variant list should be cross-referenced with locked mod suffix registry, not used as sole authority. |

---

## 9. Stale Import / Unused Path Risks

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `scripts/audit-privacy.ts:19-30` | Allowlist includes `catalog.ts`, `weapons.generated.ts`, etc. for external URLs | **REWRITE** | After migration cleanup, these files should no longer need external URL exceptions. Tighten allowlist. |
| `src/ui/registries/assetDebugSummary.ts:39` | "Check invalid default build ids (legacy mods map)" | **REWRITE** | Legacy mods map reference; update for new mod model. |

---

## 10. Fuzzy Variant Image Assignment Risk

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/data/external/ohdb/image_resolver.ts:28-30` | Slug construction uses `family.toLowerCase().replace(/[^a-z0-9]/g, '-')` — could match wrong variant | **REWRITE** | Manifest filename should be primary; slug construction is fallback only. Add explicit "no fuzzy match" guard. |
| `src/ui/registries/itemImageResolver.ts:78-80` | Slug fallback: `item.name?.toLowerCase().replace(/\s+/g, '-')` | **REWRITE** | Same risk. Must not assign wrong variant images. |

---

## 11. PvP Anchor Byte Ambiguity (from AGENTS.md)

| Location | Issue | Decision | Reason |
|----------|-------|----------|--------|
| `src/utils/combat/` (PvP-related files) | `pvp_star_modifier` (0.4) and `pvp_tier_modifier` (0.2) may be wrong if f64 interpretation is correct | **KEEP (unchanged)** | Per AGENTS.md: "Do not wire any Sprint 10 candidate value to UI until this is resolved." Migrate as-is with documentation. |

---

## Summary of Required Actions Before Migration

| Priority | Action | Files Affected |
|----------|--------|----------------|
| HIGH | Strip all wikily URLs from active source | catalog.ts, weaponRegistry.ts, generated/*.ts |
| HIGH | Remove weaponIconById dead code | catalog.ts |
| HIGH | Fix import.meta.env.DEV usage | weaponPresentationBridge.ts |
| HIGH | Consolidate duplicate image resolvers | itemImageResolver.ts + ohdb/image_resolver.ts |
| MEDIUM | Clean up ModSelection types (enforce core+suffix) | types.ts, modSelectionBridge.ts, savedBuildSchema.ts |
| MEDIUM | Reconcile hand-curated vs generated registries | modRegistry.ts, armorRegistry.ts |
| MEDIUM | Fix modSuffixLegality to not rely solely on OHDB | modSuffixLegality.ts |
| MEDIUM | Regenerate generated/ files without wikily URLs | staging/generateBulkData.ts |
| LOW | Discard legacy stub | src/App.tsx |
| LOW | Tighten privacy audit allowlist | audit-privacy.ts |
