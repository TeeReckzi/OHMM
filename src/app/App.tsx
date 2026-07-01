import React, { useState, useCallback, useMemo, useEffect } from "react";
// Shared types and constants (extracted Phase 2)
import type { Rarity, Side, ModalKind, EquippedItem, LoadoutMap, ModalState } from "./types";
import { CYAN, VIOLET, ORANGE, GREEN } from "./types";

// Extracted selector modals (Phase 2)
import { WeaponModal } from "./components/selectors/WeaponSelector";
import { ArmorModal, getArmorDisplaySlot } from "./components/selectors/ArmorSelector";
import { ModModal, normalizeModSlot, gearSlotLabel, categorizeMod } from "./components/selectors/ModSelector";

// Extracted modals (Phase 3)
import { SettingsModal } from "./components/modals/SettingsModal";
import { DeviationModal } from "./components/modals/DeviationModal";
import { BuffModal } from "./components/modals/BuffModal";
import { AttachmentModal } from "./components/modals/AttachmentModal";
import { CradleModal } from "./components/modals/CradleModal";
import { CalibrationModal, CALIBRATION_OPTIONS } from "./components/modals/CalibrationModal";

// Extracted panels (Phase 3)
import { LoadoutPanel } from "./components/panels/LoadoutPanel";
import { AnalysisHub } from "./components/panels/AnalysisHub";

// Extracted layout (Phase 3)
import { AppHeader } from "./components/layout/AppHeader";

// Formulas and logic from the core (moved from old structure)
import { buildCalculationInputFromSelection } from "../ohai/src/ui/formulaBridge";
import { buildExpectedDamageFromCalculationInput } from "../ohai/src/ui/formulaDamageAdapter";
import { computeCombatOutput } from "../ohai/src/ui/combatOutput";
import { aggregateModifiers } from "../ohai/src/engine/modifierAggregation";
import { weaponBlueprints } from "../ohai/src/ui/data/catalog";

import { weaponRegistry } from "../ohai/src/ui/registries/weaponRegistry";
import { keyGearRegistry, armorRegistry } from "../ohai/src/ui/registries/armorRegistry";
import { modRegistry } from "../ohai/src/ui/registries/modRegistry";
import { verifiedSuffixPoolsByModId } from "../ohai/src/ui/registries/verifiedModFamilies";
import { deviationRegistry } from "../ohai/src/ui/registries/deviationRegistry";
import { foodBuffRegistry } from "../ohai/src/ui/registries/foodBuffRegistry";
import { attachmentRegistry, getAttachmentsBySlot, getAttachmentsBySlotAndFamily } from "../ohai/src/ui/registries/attachmentRegistry";
import type { AttachmentSlot } from "../ohai/src/ui/itemTypes";
import { cradleRegistry } from "../ohai/src/ui/registries/cradleRegistry";
import { loadoutMapToBuildSelection } from "../lib/ohmm/convertLoadout";

// Image pipelines: Supabase (structured URLs) + GitHub CDN fallback (ohmm-icondb)

import { getItemImage } from "../ohai/src/presentation/itemImageResolver";
import { buildCdnUrl, getSupabaseImageUrl } from "../ohai/src/ui/data/supabaseImageResolver";
import { SUPABASE_URL, ANON_KEY } from "../ohai/src/data/supabaseClient";

const uiAttachmentSlotToDataSlot: Record<string, AttachmentSlot> = {
  att_muzzle: 'muzzle',
  att_sight: 'optic',
  att_barrel: 'tactical',
  att_mag: 'magazine',
  att_stock: 'stock',
};

const EMPTY_DPS = [
  { name: "Base",   off: 0, def: 0 },
  { name: "Crit",   off: 0, def: 0 },
  { name: "Status", off: 0, def: 0 },
  { name: "Mods",   off: 0, def: 0 },
  { name: "Set",    off: 0, def: 0 },
];

const EMPTY_TIMELINE = Array.from({ length: 12 }, (_, i) => ({
  t: `${(i * 0.5).toFixed(1)}s`,
  burn: 0, frost: 0, surge: 0,
}));

const EMPTY_PIE = [
  { name: "Direct",  value: 1, color: CYAN   },
  { name: "Crit",    value: 1, color: VIOLET },
  { name: "Status",  value: 1, color: ORANGE },
  { name: "Mod",     value: 1, color: "#fb923c" },
  { name: "Set",     value: 1, color: GREEN  },
];

const CALIBRATION_STAT_TO_FORMULA_STAT: Record<string, string> = {
  weapon_dmg: "weaponDMGBonus",
  crit_rate: "critRate",
  crit_dmg: "critDMG",
  weakspot_dmg: "weakspotDMG",
  status_dmg: "statusDMGBonus",
  elemental_dmg: "elementalDMGBonus",
  reload_speed: "reloadSpeed",
  magazine_capacity: "magazineCapacity",
  fire_rate: "fireRate",
};

function hasHanText(value: unknown): boolean {
  return typeof value === "string" && /[\u4e00-\u9fff]/.test(value);
}

function isEnglishDisplayText(value: unknown): value is string {
  return typeof value === "string" && /[a-zA-Z]/.test(value) && !hasHanText(value);
}

function cleanEnglishText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u4e00-\u9fff]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function applyCalibrationRollToCalculationInput(calcInput: any, loadout: LoadoutMap): any {
  const calibration = loadout.primary_calibration;
  if (!calcInput || !calibration) return calcInput;

  const rawModifiers = calibration.statModifiers || [];
  if (rawModifiers.length === 0) return calcInput;

  const calibrationSources = rawModifiers
    .map((mod, index) => {
      const stat = CALIBRATION_STAT_TO_FORMULA_STAT[mod.stat] || mod.stat;
      if (!stat || typeof mod.value !== "number") return null;
      return {
        id: `ui-calibration-${calibration.id}-${index}`,
        sourceType: "calibration",
        sourceLabel: `${calibration.name} (${stat})`,
        stat,
        value: mod.value,
        behavior: "additive",
        confidence: "observed_in_game_needs_testing",
        notes: calibration.effectSummary || "Manual weapon calibration roll from UI.",
      };
    })
    .filter(Boolean);

  if (calibrationSources.length === 0) return calcInput;
  const modifierSources = [...(calcInput.modifierSources || []), ...calibrationSources];
  const calibrationEffect = {
    itemId: calibration.id,
    itemName: calibration.name,
    category: "calibration",
    formulaSupport: { status: "fully-modeled", notes: "Manual calibration roll entered in OHMM UI." },
    contributesModifiers: true,
    modifierCount: calibrationSources.length,
  };

  return {
    ...calcInput,
    modifierSources,
    aggregationReport: aggregateModifiers(modifierSources as any),
    modeledEffects: [...(calcInput.modeledEffects || []), calibrationEffect],
    totalItemsConsidered: (calcInput.totalItemsConsidered || 0) + 1,
    totalModifiersExtracted: (calcInput.totalModifiersExtracted || 0) + calibrationSources.length,
  };
}

// REUSABLE PRIMITIVES → extracted to ./components/ui/Primitives.tsx

// EQUIPMENT SLOT + LOADOUT TILES → extracted to ./components/LoadoutTiles.tsx

// ─────────────────────────────────────────────────────────────
// MODAL — ARMOR SELECTOR
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// APP HEADER
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [offLoadout, setOffLoadout] = useState<LoadoutMap>(() => ({}));
  const [defLoadout, setDefLoadout] = useState<LoadoutMap>(() => ({}));
  const [modal, setModal] = useState<ModalState>({
    open: false, kind: null, slot: "", side: "offensive", label: "",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [fullArmorList, setFullArmorList] = useState<any[]>([]);
  const [fullFoodBuffs, setFullFoodBuffs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Try common table names for full armor list in Supabase as source of truth
        let combined: any[] = [];
        for (const table of ['armor', 'armors', 'key_gear', 'gear', 'items']) {
          try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } });
            if (res.ok) {
              const d = await res.json();
              if (d && d.length) {
                combined = [...combined, ...d];
                if (import.meta.env.DEV) console.log(`[Supabase] Fetched ${d.length} from ${table}`);
              }
            }
          } catch {}
        }
        if (combined.length === 0) {
          // fallback to verified if no Supabase armor table
          try {
            const v = (await import('../ohai/data/verified/armor.verified.json')).default || [];
            combined = v.items || v || [];
          } catch {}
        }
        setFullArmorList(combined);
        if (import.meta.env.DEV) console.log('[Supabase] Loaded', combined.length, 'armor pieces (using Supabase as source of truth for full list + spellings)');
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Supabase armor fetch failed, using local registry', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/food_buffs?select=*`, {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFullFoodBuffs(data);
          if (import.meta.env.DEV) console.log('[Supabase] Loaded', data.length, 'food buffs from DB');
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Supabase food_buffs fetch failed, using local registry', e);
      }
    })();
  }, []);

  // Wire formulas properly: LoadoutMap -> BuildSelection -> CalculationInput -> CombatOutput + DamageResult
  const attackerBuild = useMemo(() => {
    try { return loadoutMapToBuildSelection(offLoadout, 'attacker'); } catch { return null; }
  }, [offLoadout]);

  const defenderBuild = useMemo(() => {
    try { return loadoutMapToBuildSelection(defLoadout, 'defender'); } catch { return null; }
  }, [defLoadout]);

  const attackerCalcInput = useMemo(() => {
    if (!attackerBuild) return null;
    try {
      return applyCalibrationRollToCalculationInput(buildCalculationInputFromSelection(attackerBuild, 'pve'), offLoadout);
    } catch { return null; }
  }, [attackerBuild, offLoadout]);

  const attackerCombatOutput = useMemo(() => {
    if (!attackerCalcInput) return null;
    try {
      const pvp = attackerCalcInput.pvpMitigation || { totalReductionPercent: 0, sources: [], warnings: [] };
      return computeCombatOutput(attackerCalcInput, pvp);
    } catch { return null; }
  }, [attackerCalcInput]);

  const attackerDamageResult = useMemo(() => {
    if (!attackerCalcInput) return null;
    try {
      return buildExpectedDamageFromCalculationInput(attackerCalcInput, attackerCalcInput.baseWeaponDMG);
    } catch { return null; }
  }, [attackerCalcInput]);

  const defenderCalcInput = useMemo(() => {
    if (!defenderBuild) return null;
    try { return applyCalibrationRollToCalculationInput(buildCalculationInputFromSelection(defenderBuild, 'pve'), defLoadout); } catch { return null; }
  }, [defenderBuild, defLoadout]);

  const defenderCombatOutput = useMemo(() => {
    if (!defenderCalcInput) return null;
    try {
      const pvp = defenderCalcInput.pvpMitigation || { totalReductionPercent: 0, sources: [], warnings: [] };
      return computeCombatOutput(defenderCalcInput, pvp);
    } catch { return null; }
  }, [defenderCalcInput]);

  // Handlers for LoadoutPanel -> modals, and modal -> loadout update
  const openSlot = useCallback((slot: string, kind: ModalKind, label: string, side: Side = 'offensive') => {
    setModal({ open: true, kind, slot, side, label });
  }, []);

  const closeModal = useCallback(() => {
    setModal(m => ({ ...m, open: false }));
  }, []);

  const handleEquip = useCallback((item: EquippedItem) => {
    const { slot, side } = modal;
    if (!slot) return;
    const updater = side === 'offensive' ? setOffLoadout : setDefLoadout;
    updater(prev => {
      const existing = prev[slot];
      // When swapping piece, preserve the previously chosen crafted tier + blueprint stars if not provided by the choice
      const merged = {
        ...item,
        stars: (item.stars ?? existing?.stars ?? 3),
        tier: (item.tier ?? existing?.tier ?? 4),
      };
      return { ...prev, [slot]: merged };
    });
    // Note: repair/selection helpers (applyWeaponSelection etc) can be called here for ammo/mod logic
    // For now we let converter + registry handle on next calc cycle
    closeModal();
  }, [modal, closeModal]);

  const handleRemove = useCallback((slot: string, side: Side) => {
    const updater = side === 'offensive' ? setOffLoadout : setDefLoadout;
    updater(prev => { const n = { ...prev }; delete n[slot]; return n; });
  }, []);

  // Real data pipeline for modals: Supabase app_images (preferred structured URLs) + GitHub ohmm-icondb CDN fallback
  // Supports slot-categorized entries e.g. 'armour-helmet', 'attachments-muzzle', 'mods-weapon-core'
  // Call with category='armour', slot='helmet'  (or category='armour-helmet' if you set that in DB)
  function resolveIcon(item: any, category: string, fallbackSlug?: string, slot?: string): string | undefined {
    if (!item) return undefined;
    if (item.iconUrl) return item.iconUrl;
    if (item.image) return item.image;

    let slug = fallbackSlug || item.id || item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    if (category === 'mods' && slug) {
      // Mod icons/names source of truth often uses clean short slug (strip core-/suffix- prefixes)
      slug = slug.replace(/^(core-|suffix-)/i, '');
    }
    if (!slug) return undefined;

    // 1. Supabase (if cache populated) - try slotted first, then broad
    const fromSupabase = getSupabaseImageUrl(category, slug, slot);
    if (fromSupabase) return fromSupabase;

    // 2. GitHub-backed CDN (jsdelivr on TeeReckzi/ohmm-icondb)
    return buildCdnUrl(category, slug, slot);
  }

  // Format mod icon/name slugs into presentable UI names.
  // Uses the mod icon/names (the key/slug used for the icon) as source of truth,
  // then formats for nice UI display (title case, remove internal prefixes).
  function formatModNameFromIcon(raw: string | undefined): string {
    if (!raw) return 'Mod';
    let name = raw;

    // Strip common internal prefixes (from registry ids or icon keys)
    name = name.replace(/^(core-|suffix-|mod-|mod_|Mod Suffix: |Mod Core: )/i, '');
    name = name.replace(/[-_]/g, ' ').trim();

    // Title case words for UI presentability
    name = name
      .split(/\s+/)
      .map((word) => {
        if (!word) return '';
        // Keep known acronyms
        if (word.toLowerCase() === 'de') return 'DE';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    return name || 'Mod';
  }

  // Removed: MOD_CORPUS_SLUGS / MOD_CORPUS_MAP used to supplement and override
  // mod names/icons from a partial (40-entry) sample of icon filenames. That
  // overrode correct verified names with mismatched icon-filename fragments
  // (e.g. "Battle" suffix -> "Against All Odds Battle") and only covered 5 of
  // 96 core mod families. Mod names now come directly from modRegistry, which
  // is sourced from verifiedModFamilies.ts (ground-truthed from in-game data).

  const getWeaponItems = (): EquippedItem[] => {
    // Use the full formula-ready weaponRegistry (curated + generated + lre stats merged)
    const source = weaponRegistry && weaponRegistry.length ? weaponRegistry : (weaponBlueprints || []);
    return source.map((w: any) => {
      const familySlot = (w.family || '').toLowerCase().replace(/\s+/g, '-');
      const iconUrl = resolveIcon(w, 'weapons', undefined, familySlot) || getItemImage(w, 'weapon') || undefined;
      return {
        id: w.id,
        name: w.name || w.id,
        category: w.family || 'AR',
        rarity: (w.blueprintQuality === 'legendary' ? 'Legendary' : w.blueprintQuality === 'epic' ? 'Epic' : 'Rare') as Rarity,
        tier: w.tier || 4,
        stars: w.maxStars || 3,
        meta: {
          family: w.family,
          damageProfile: w.damageProfile,
          fireRate: w.fireRate,
          damagePerProjectile: w.damagePerProjectile,
          critRate: w.critRatePercent,
        },
        iconUrl,
        effectSummary: w.effectSummary,
        statModifiers: w.statModifiers,
        tags: w.tags,
      };
    });
  };

  const getArmorItems = (): EquippedItem[] => {
    // Use Supabase DB (via fullArmorList) as source of truth for complete list + correct English spellings (nameEnglish)
    // Falls back to local registry if Supabase fetch didn't populate yet or failed.
    const registrySource = [
      ...(armorRegistry || []),
      ...(keyGearRegistry || []),
    ];

    // Build lookup by originalName (and id) from registries for enrichment
    const regByOrig = new Map<string, any>();
    const regById = new Map<string, any>();
    for (const r of registrySource) {
      if (r.originalName) regByOrig.set(r.originalName.toLowerCase(), r);
      if (r.id) regById.set(r.id, r);
    }

    // Prefer registry items first (they have good English names, correct slots, usable ids for calcs)
    const items: any[] = [...registrySource];
    const seen = new Set<string>();
    for (const r of registrySource) {
      const rid = r.id;
      if (rid) seen.add(rid);
      if (r.originalName) seen.add('orig:' + r.originalName.toLowerCase());
    }

    if (fullArmorList.length > 0) {
      // Supplement with verified/Supabase items that don't match known registry entries
      // Only include extras that have at least some English name/effect data (to avoid flooding with untranslated Chinese-only entries)
      for (const v of fullArmorList) {
        const norm = v.normalized || v;
        const vid = norm.id || v.id;
        const vorig = (norm.nameOriginal || v.nameOriginal || (v.original && v.original['\u540d\u7a31']) || '').toLowerCase();
        const already = (vid && seen.has(vid)) || (vorig && seen.has('orig:' + vorig));
        const hasEnglishName = isEnglishDisplayText(norm.nameEnglish) || isEnglishDisplayText(v.name);
        const hasEnglishEffect = isEnglishDisplayText(norm.specialEffectEnglish) || isEnglishDisplayText(norm.specialEffectEnglishPartial);
        if (!already && (hasEnglishName || hasEnglishEffect)) {
          items.push(v);
          if (vid) seen.add(vid);
          if (vorig) seen.add('orig:' + vorig);
        }
      }
    }

    return items.map((a: any) => {
      const norm = a.normalized || a;
      let id = norm.id || a.id;
      // Prefer explicit English. Never fall back to original/source-language labels in UI.
      let name = isEnglishDisplayText(norm.nameEnglish)
        ? norm.nameEnglish
        : isEnglishDisplayText(norm.name)
          ? norm.name
          : isEnglishDisplayText(a.name)
            ? a.name
            : '';

      const orig = (norm.nameOriginal || a.nameOriginal || (a.original && a.original['\u540d\u7a31']) || '').toLowerCase();
      const regHit = (orig && regByOrig.get(orig)) || regById.get(id) || regById.get(norm.id);
      if (regHit) {
        if (regHit.id) id = regHit.id;
        // Only use registry name if source (DB/verified) gave us no usable name at all
        const hasNameFromSource = isEnglishDisplayText(norm.nameEnglish) || isEnglishDisplayText(norm.name) || isEnglishDisplayText(a.name);
        if (!hasNameFromSource && regHit.name) {
          name = regHit.name;
        }
      }

      const rawSlot = norm.slotEnglish || norm.slot || a.slot || (regHit && regHit.slot) || '';
      const displaySlot = getArmorDisplaySlot(rawSlot);

      // Only apply English-ified fallback for cases where we still have no real name from DB (e.g. pure hash)
      const hasUsableName = isEnglishDisplayText(name) && name !== id && !/^[a-z0-9_-]+$/.test(name);
      if (!hasUsableName) {
        const kw = cleanEnglishText(norm.keywordEnglish || a.keywordEnglish || '');
        const fallback = kw ? `${displaySlot || 'Armor'} (${kw})` : (displaySlot || 'Armor') + ' Piece';
        name = fallback;
      }
      const iconUrl = resolveIcon(a, 'armour', undefined, rawSlot) || getItemImage(a, 'armor') || undefined;

      const rawEffect = norm.specialEffectEnglish || norm.specialEffectEnglishPartial || norm.effectSummary || a.effectSummary || (regHit && regHit.effectSummary) || '';
      const effectSummary = cleanEnglishText(rawEffect);

      return {
        id,
        name: cleanEnglishText(name) || `${displaySlot || 'Armor'} Piece`,
        category: displaySlot || 'Armor',
        rarity: 'Epic' as Rarity,
        tier: 4,
        stars: 3,
        iconUrl,
        effectSummary,
        statModifiers: a.statModifiers || norm.statModifiers || (regHit && regHit.statModifiers),
        tags: a.tags || norm.tags || (regHit && regHit.tags) || [],
        meta: { slot: rawSlot, displaySlot, set: norm.setEnglish || norm.armorSet || a.armorSet || (regHit && regHit.armorSet) },
      };
    });
  };

  const getModItems = (isWeapon: boolean, targetSlot?: string): EquippedItem[] => {
    const normalizedTarget = targetSlot ? normalizeModSlot(targetSlot) : null;

    // Use the full enriched modRegistry (merges verified core families + suffixes),
    // excluding the synthetic "test-fixture" entries kept only for the formula-engine
    // smoke tests (see modRegistry.ts) — those aren't real in-game mod names.
    let registryFiltered = (modRegistry || []).filter((m: any) =>
      !m.tags?.includes('test-fixture') && (isWeapon ? m.modSlot === 'weapon' : m.modSlot !== 'weapon')
    );

    if (normalizedTarget && !isWeapon) {
      registryFiltered = registryFiltered.filter((m: any) => normalizeModSlot(m.modSlot) === normalizedTarget);
    }

    // Build UI items directly from registry names — these are now verified
    // in-game names (see verifiedModFamilies.ts), so no corpus/name-override
    // lookup is needed (that lookup used to clobber correct names with
    // mismatched icon-filename fragments).
    const registryItems = registryFiltered.map((m: any) => {
      const iconSlug = (m.name || m.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const iconUrl = resolveIcon(m, 'mods', iconSlug) || buildCdnUrl('mods', iconSlug) || undefined;
      const suffixPool = verifiedSuffixPoolsByModId[m.id];

      return {
        id: m.id,
        name: m.name,
        // Weapon mods get their real elemental/archetype category; gear mods
        // aren't categorized that way in-game, so label them by slot instead
        // of running them through the weapon-mod keyword heuristic (which
        // was producing spurious matches like "Mag Expansion" -> "Fast Gunner"
        // just because its text contains "reloading").
        category: isWeapon
          ? categorizeMod({ name: m.name, effectSummary: m.effectSummary, tags: m.tags, id: m.id, slug: iconSlug })
          : gearSlotLabel(m.modSlot),
        rarity: 'Rare' as Rarity,
        tier: 0,
        stars: 0,
        iconUrl,
        effectSummary: m.effectSummary,
        statModifiers: m.statModifiers,
        tags: m.tags,
        modType: m.modType,
        meta: { slot: m.modSlot, type: m.modType, suffixPool },
      };
    });

    return registryItems;
  };

  const getDeviationItems = (): EquippedItem[] =>
    (deviationRegistry || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      category: d.deviationRole ? d.deviationRole.charAt(0).toUpperCase() + d.deviationRole.slice(1) : 'Combat',
      rarity: 'Legendary' as Rarity,
      tier: 0,
      stars: 0,
      iconUrl: resolveIcon(d, 'deviations') || buildCdnUrl('deviations', d.id) || undefined,
      effectSummary: d.effectSummary,
      tags: d.tags,
    }));

  const getBuffItems = (isFood: boolean): EquippedItem[] => {
    const source = fullFoodBuffs.length > 0 ? fullFoodBuffs : (foodBuffRegistry || []);

    let filtered = source;
    if (fullFoodBuffs.length > 0) {
      filtered = source.filter((b: any) => (isFood ? b.Type === 'FOOD' : b.Type === 'DRINK'));
    } // for registry fallback, use all (it has mixed)

    const items: EquippedItem[] = [];
    for (const b of filtered as any[]) {
      // Parse "15% (20.7%)" into base and max ChefRex (Supabase style)
      const buffCol = b['Buff%_(IfMaxChefRex)'] || b.buff || '';
      const match = buffCol.match(/([\d.]+)%\s*\(([\d.]+)%\)/);
      const baseBuff = match ? `${match[1]}%` : '';
      const maxChefBuff = match ? `${match[2]}%` : '';

      const rawName = b.Name || b.name || '';
      const displayName = cleanEnglishText(rawName);
      if (!displayName || hasHanText(displayName) || !/[a-zA-Z]/.test(displayName)) continue;

      const effectSummary = cleanEnglishText(b.Effect || b.effectSummary || '');
      const iconCategory = isFood ? 'food' : 'drinks';
      const iconUrl = resolveIcon({ id: (b.id || displayName)?.toString(), name: displayName }, iconCategory) || buildCdnUrl('food-buffs', displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || undefined;

      items.push({
        id: displayName.toLowerCase().replace(/\s+/g, '-') || `buff-${b.id}`,
        name: displayName,
        category: 'Buff',
        rarity: 'Rare' as Rarity,
        tier: 0,
        stars: 0,
        iconUrl,
        effectSummary,
        meta: {
          type: b.Type,
          baseBuff,
          maxChefRexBuff: maxChefBuff,
          duration: '', // durations seem to be in Effect text
        },
      });
    }
    return items;
  };

  const getAttachmentItems = (uiSlotKey?: string, weaponFamily?: string): EquippedItem[] => {
    let list: any[] = [];

    const dataSlot = uiSlotKey ? uiAttachmentSlotToDataSlot[uiSlotKey] : undefined;

    if (dataSlot && weaponFamily) {
      list = getAttachmentsBySlotAndFamily(dataSlot, weaponFamily) || [];
    } else if (dataSlot) {
      list = getAttachmentsBySlot(dataSlot) || [];
    } else {
      list = attachmentRegistry || [];
    }

    // dedupe
    const seen = new Set<string>();
    const unique = list.filter((a: any) => {
      if (!a?.id || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    return unique.map((a: any) => ({
      id: a.id,
      name: a.name || a.id,
      category: 'Attachment',
      rarity: (a.rarity || 'uncommon').charAt(0).toUpperCase() + (a.rarity || 'uncommon').slice(1) as any,
      tier: 3,
      stars: 1,
      iconUrl: a.iconUrl || resolveIcon(a, 'attachments', undefined, a.attachmentSlot) || buildCdnUrl('attachments', a.id, a.attachmentSlot) || undefined,
      effectSummary: a.effectSummary,
      statModifiers: a.statModifiers,
      tags: a.tags,
      meta: { slot: a.attachmentSlot },
    }));
  };

  // Modal items getters for dispatcher
  const getCurrentWeaponFamily = (side: Side): string => {
    const loadout = side === 'offensive' ? offLoadout : defLoadout;
    const primary = loadout['primary'] || loadout.primary;
    const secondary = loadout['secondary'] || loadout.secondary;
    const weapon = primary || secondary;
    if (weapon?.category) return weapon.category;
    const weaponId = weapon?.id;
    if (weaponId) {
      const w = (weaponRegistry as any[]).find((ww: any) => ww.id === weaponId);
      if (w?.family) return w.family;
    }
    return 'AR'; // safe default
  };

  const modalItems = {
    weapon: getWeaponItems,
    armor: getArmorItems,
    weapon_mod: () => getModItems(true),
    armor_mod: (targetSlot?: string) => getModItems(false, targetSlot),
    attachment: getAttachmentItems,  // pass (uiSlotKey, weaponFamily) to get slot+weapon filtered + correct icon category
    buff: (isFood: boolean) => getBuffItems(isFood),
    deviation: getDeviationItems,
    cradle: () => cradleRegistry.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: 'Cradle Perk',
      rarity: 'Epic' as Rarity,
      tier: 0,
      stars: 0,
      iconUrl: resolveIcon(p, 'cradle') || buildCdnUrl('cradle', p.id) || undefined,
      effectSummary: p.effectSummary,
      meta: { description: p.effectSummary },
    })),
    calibration: () => CALIBRATION_OPTIONS.map(c => ({
      id: c.id, name: c.name, category: 'Calibration', rarity: 'Rare' as Rarity, tier: 0, stars: 0, effectSummary: c.effectSummary,
    })),
  };

  // ─────────────────────────────────────────────────────────────
  // MODAL DISPATCHER — keeps main App clean
  // ─────────────────────────────────────────────────────────────
  function ModalDispatcher({ modal, onClose, onSelect }: {
    modal: ModalState;
    onClose: () => void;
    onSelect: (item: EquippedItem) => void;
  }) {
    if (!modal.open || !modal.kind) return null;

    const commonProps = { onClose, onSelect };

    switch (modal.kind) {
      case 'weapon':
        return <WeaponModal {...commonProps} items={modalItems.weapon()} />;
      case 'armor':
        return <ArmorModal {...commonProps} slotLabel={modal.label} items={modalItems.armor()} />;
      case 'weapon_mod':
        return <ModModal {...commonProps} isWeaponMod={true} targetSlot={modal.slot} items={modalItems.weapon_mod()} />;
      case 'armor_mod':
        return <ModModal {...commonProps} isWeaponMod={false} targetSlot={modal.slot} items={modalItems.armor_mod(modal.slot)} />;
      case 'attachment':
        const attFamily = getCurrentWeaponFamily(modal.side);
        return <AttachmentModal {...commonProps} slotLabel={modal.label} items={modalItems.attachment(modal.slot, attFamily)} />;
      case 'buff':
        return <BuffModal {...commonProps} isFood={modal.slot === 'food'} items={modalItems.buff(modal.slot === 'food')} />;
      case 'deviation':
        return <DeviationModal {...commonProps} items={modalItems.deviation()} />;
      case 'cradle':
        return <CradleModal {...commonProps} slotIndex={parseInt(modal.slot.split('_')[1] || '0')} items={modalItems.cradle()} />;
      case 'calibration':
        return <CalibrationModal {...commonProps} items={modalItems.calibration()} />;
      default:
        return null;
    }
  }

  // The main Figma layout render — 3-column: 272px loadouts flanking Analysis Hub
  return (
    <div className="ohmm-app-shell ohmm-grid-bg">
      <AppHeader onOpenSettings={() => setShowSettings(true)} />

      <div className="ohmm-workspace">
        {/* OFFENSIVE LOADOUT — 272px */}
        <div className="ohmm-side-column ohmm-glass">
          <LoadoutPanel
            side="offensive"
            loadout={offLoadout}
            onSlotClick={(slot, kind, label) => openSlot(slot, kind, label, 'offensive')}
            onUpdateItem={(slot, updates) => setOffLoadout(prev => ({
              ...prev,
              [slot]: prev[slot] ? { ...(prev[slot] as EquippedItem), ...updates } : null
            }))}
            onRemoveItem={(slot) => handleRemove(slot, 'offensive')}
          />
        </div>

        {/* ANALYSIS HUB (center) — receives real formula outputs */}
        <div className="ohmm-analysis-frame ohmm-glass">
          <AnalysisHub
            combatOutput={attackerCombatOutput}
            damageResult={attackerDamageResult}
            calcInput={attackerCalcInput}
            offCombatOutput={attackerCombatOutput}
            defCombatOutput={defenderCombatOutput}
          />
        </div>

        {/* ENEMY META (PvP) LOADOUT — 272px */}
        <div className="ohmm-side-column ohmm-glass">
          <LoadoutPanel
            side="defensive"
            loadout={defLoadout}
            onSlotClick={(slot, kind, label) => openSlot(slot, kind, label, 'defensive')}
            onUpdateItem={(slot, updates) => setDefLoadout(prev => ({
              ...prev,
              [slot]: prev[slot] ? { ...(prev[slot] as EquippedItem), ...updates } : null
            }))}
            onRemoveItem={(slot) => handleRemove(slot, 'defensive')}
          />
        </div>
      </div>

      {/* Clean modal routing via dispatcher */}
      <ModalDispatcher modal={modal} onClose={closeModal} onSelect={handleEquip} />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onResetOffensive={() => setOffLoadout({})}
          onResetDefensive={() => setDefLoadout({})}
        />
      )}
    </div>
  );
}
