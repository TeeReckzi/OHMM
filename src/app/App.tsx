import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Search, X, Crosshair, Activity, Settings, Star,
  ChevronRight, ChevronDown, ChevronUp, Cpu,
  CheckCircle2, RefreshCw, Database, Shield, Zap,
  Flame, Snowflake, Bomb, AlertTriangle, Filter,
} from "lucide-react";
// Icons: using lucide + text fallbacks (react-icons/gi not installed in root; replaced for Figma UI wiring)
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// Shared types and constants (extracted Phase 2)
import type { Rarity, Side, ModalKind, EquippedItem, LoadoutMap, ModalState } from "./types";
import { R_COLOR, CYAN, VIOLET, ORANGE, GREEN, OHMM_NAVBAR_LOGO, isWeaponItem } from "./types";

// Extracted UI primitives (Phase 2)
import { ModalShell, EmptySlate, GenericDetail, StarRating, RarityBadge, ModTypeBadge, GlassPanel, PanelSection, StatChip, SimReady, TT_STYLE, pct, num, statValue } from "./components/ui/Primitives";

// Extracted selector modals (Phase 2)
import { WeaponModal } from "./components/selectors/WeaponSelector";
import { ArmorModal, getArmorDisplaySlot } from "./components/selectors/ArmorSelector";
import { ModModal, normalizeModSlot, gearSlotLabel, categorizeMod } from "./components/selectors/ModSelector";

// Extracted modals (Phase 3)
import { SettingsModal } from "./components/modals/SettingsModal";
import { DeviationModal } from "./components/modals/DeviationModal";
import { BuffModal } from "./components/modals/BuffModal";

// Extracted loadout tiles (Phase 2)
import { EquipmentSlot, ModTile, CalibrationTile, AttachTile, CradleTile } from "./components/LoadoutTiles";

// Formulas and logic from the core (moved from old structure)
import { buildCalculationInputFromSelection } from "../ohai/src/ui/formulaBridge";
import { buildExpectedDamageFromCalculationInput } from "../ohai/src/ui/formulaDamageAdapter";
import { computeCombatOutput } from "../ohai/src/ui/combatOutput";
import { aggregateModifiers } from "../ohai/src/engine/modifierAggregation";
import { weaponBlueprints } from "../ohai/src/ui/data/catalog";
import { getWeapon as getRegistryWeapon } from "../ohai/src/ui/registries/weaponRegistry";
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
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { getItemImage } from "../ohai/src/presentation/itemImageResolver";
import { buildCdnUrl, getSupabaseImageUrl } from "../ohai/src/ui/data/supabaseImageResolver";
import { SUPABASE_URL, ANON_KEY } from "../ohai/src/data/supabaseClient";

const WEAPON_PAIRS = [
  { mainKey: "primary",   modKey: "primary_mod",   label: "Primary Weapon",   icon: <Crosshair size={16} /> },
  { mainKey: "secondary", modKey: "secondary_mod",  label: "Secondary Weapon", icon: <Crosshair size={16} /> },
];

const ARMOR_PAIRS = [
  { mainKey: "helmet", modKey: "helmet_mod", label: "Helmet", icon: <Shield size={15} /> },
  { mainKey: "mask",   modKey: "mask_mod",   label: "Mask",   icon: <Shield size={15} /> },
  { mainKey: "chest",  modKey: "chest_mod",  label: "Chest",  icon: <Shield size={15} /> },
  { mainKey: "gloves", modKey: "gloves_mod", label: "Gloves", icon: <Shield size={15} /> },
  { mainKey: "pants",  modKey: "pants_mod",  label: "Pants",  icon: <Shield size={15} /> },
  { mainKey: "boots",  modKey: "boots_mod",  label: "Boots",  icon: <Shield size={15} /> },
];

const ATTACHMENT_SLOTS = [
  { key: "att_muzzle", label: "Muzzle",    icon: <Filter size={13} /> },
  { key: "att_sight",  label: "Sight",     icon: <Crosshair size={13} /> },
  { key: "att_barrel", label: "Barrel",    icon: <Settings size={13} /> },
  { key: "att_mag",    label: "Mag",       icon: <Database size={13} /> },
  { key: "att_stock",  label: "Stock",     icon: <Shield size={13} /> },
];

const uiAttachmentSlotToDataSlot: Record<string, AttachmentSlot> = {
  att_muzzle: 'muzzle',
  att_sight: 'optic',
  att_barrel: 'tactical',
  att_mag: 'magazine',
  att_stock: 'stock',
};

const BUFF_SLOTS = [
  { key: "food",  label: "Food Buff",  icon: <Flame size={13} />, kind: "buff" as ModalKind },
  { key: "drink", label: "Drink Buff", icon: <Snowflake size={13} />, kind: "buff" as ModalKind },
];

const DEVIATION_SLOT = { key: "deviation", label: "Deviation", icon: <AlertTriangle size={13} /> };

const CALIBRATION_OPTIONS = [
  { id: "assault", name: "Assault", effectSummary: "Weapon calibration type. Add your rolled Weapon DMG % and secondary substat." },
  { id: "rapid", name: "Rapid", effectSummary: "Weapon calibration type. Add your rolled Weapon DMG % and secondary substat." },
  { id: "precision", name: "Precision", effectSummary: "Weapon calibration type. Add your rolled Weapon DMG % and secondary substat." },
  { id: "frugal", name: "Frugal", effectSummary: "Weapon calibration type. Add your rolled Weapon DMG % and secondary substat." },
  { id: "heavy", name: "Heavy", effectSummary: "Weapon calibration type. Add your rolled Weapon DMG % and secondary substat." },
  { id: "violent", name: "Violent", effectSummary: "Weapon calibration type. Add your rolled Weapon DMG % and secondary substat." },
];

const CALIBRATION_SUBSTAT_OPTIONS = [
  { id: "none", label: "No Secondary Substat", stat: "" },
  { id: "crit-rate", label: "Crit Rate", stat: "crit_rate" },
  { id: "crit-dmg", label: "Crit DMG", stat: "crit_dmg" },
  { id: "weakspot-dmg", label: "Weakspot DMG", stat: "weakspot_dmg" },
  { id: "elemental-dmg", label: "Elemental DMG", stat: "elemental_dmg" },
];

const CRADLE_SLOTS = Array.from({ length: 8 }, (_, i) => ({
  key: `cradle_${i + 1}`,
  label: `Perk ${i + 1}`,
}));

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
// MODAL — ATTACHMENT SELECTOR
// ─────────────────────────────────────────────────────────────

function AttachmentModal({ slotLabel, onClose, onSelect, items }: {
  slotLabel: string; onClose: () => void; onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EquippedItem | null>(null);

  // Map UI slot labels to actual attachmentSlot values in the data
  const slotMap: Record<string, string> = {
    "Muzzle": "muzzle",
    "Sight": "optic",
    "Barrel": "tactical",
    "Mag": "magazine",
    "Stock": "stock",
  };

  const targetSlot = slotMap[slotLabel] || slotLabel.toLowerCase();

  let attachments: EquippedItem[] = items && items.length ? items : [];

  // Fallback: try to fetch by mapped slot
  if (attachments.length === 0 && getAttachmentsBySlot) {
    try {
      const slotData = getAttachmentsBySlot(targetSlot as any) || getAttachmentsBySlot('muzzle') || [];
      attachments = slotData.map((a: any) => ({
        id: a.id, name: a.name || a.id, category: 'Attachment', 
        rarity: 'Uncommon' as Rarity, tier: 3, stars: 1,
        iconUrl: a.iconUrl || buildCdnUrl('attachments', a.id, a.attachmentSlot),
        effectSummary: a.effectSummary,
        meta: { slot: a.attachmentSlot }
      }));
    } catch {}
  }

  // Filter to the correct slot category using meta or attachmentSlot
  const slotFiltered = attachments.filter(a => {
    const slot = (a as any).meta?.slot || (a as any).attachmentSlot;
    return !targetSlot || slot === targetSlot;
  });

  const filtered = slotFiltered.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ModalShell title={`${slotLabel} Selector`} accent={CYAN} onClose={onClose} width={680} height={500}>
      <div className="flex flex-col" style={{ width: 360, borderRight: "1px solid rgba(0,200,255,0.1)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.15)" }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${slotLabel.toLowerCase()} attachments...`}
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: CYAN }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <EmptySlate message="No attachments loaded — wire in your data source" icon={<Filter size={22} />} />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(a => (
                <button key={a.id} onClick={() => setSelected(a)}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-center"
                  style={{
                    background: selected?.id === a.id ? "rgba(0,200,255,0.1)" : "rgba(0,200,255,0.03)",
                    border: `1px solid ${selected?.id === a.id ? "rgba(0,200,255,0.4)" : "rgba(0,200,255,0.1)"}`,
                  }}>
                  {a.iconUrl && (
                    <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                      <ImageWithFallback src={a.iconUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <span className="text-[12px] font-bold"
                    style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                    {a.name}
                  </span>
                  {a.effectSummary && <div className="text-[9px] truncate" style={{ color: '#6aa8c0' }}>{a.effectSummary}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4">
        {selected ? (
          <GenericDetail item={selected} accent={CYAN} onEquip={() => { onSelect(selected); onClose(); }} />
        ) : (
          <EmptySlate message="Select an attachment to view stats" icon={<Filter size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL — CRADLE PERK SELECTOR
// ─────────────────────────────────────────────────────────────

function CradleModal({ slotIndex, onClose, onSelect, items }: {
  slotIndex: number; onClose: () => void; onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EquippedItem | null>(null);
  const perks: EquippedItem[] = items && items.length ? items : cradleRegistry.map((p: any) => ({
    id: p.id,
    name: p.name,
    category: 'Cradle Perk',
    rarity: 'Epic' as Rarity,
    tier: 0,
    stars: 0,
    iconUrl: buildCdnUrl('cradle', p.id),
    effectSummary: p.effectSummary,
  }));
  const filtered = perks.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ModalShell title={`Cradle Perk Selector — Slot ${slotIndex + 1}`}
      accent={VIOLET} icon={<Cpu size={14} />} onClose={onClose} width={800}>
      <div className="flex flex-col" style={{ width: 460, borderRight: `1px solid ${VIOLET}12` }}>
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${VIOLET}08` }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: `${VIOLET}05`, border: `1px solid ${VIOLET}18` }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search perks, effects, synergies..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: VIOLET }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${VIOLET}12 transparent` }}>
          {filtered.length === 0 ? (
            <EmptySlate message="No cradle perks loaded — wire in your data source" icon={<Cpu size={22} />} />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(p => (
                <button key={p.id} onClick={() => setSelected(p)}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-start w-full overflow-hidden"
                  style={{
                    background: selected?.id === p.id ? `${VIOLET}14` : `${VIOLET}04`,
                    border: `1px solid ${selected?.id === p.id ? VIOLET + "45" : VIOLET + "12"}`,
                    borderLeft: `2px solid ${VIOLET}`,
                  }}>
                  {p.iconUrl && (
                    <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                      <ImageWithFallback src={p.iconUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold truncate"
                      style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                      {p.name}
                    </div>
                    {p.effectSummary && (
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: '#6aa8c0' }}>
                        {p.effectSummary}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {selected ? (
          <GenericDetail item={selected} accent={VIOLET} onEquip={() => { onSelect(selected); onClose(); }} />
        ) : (
          <EmptySlate message="Select a perk to view unlock path & synergies" icon={<Cpu size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL — WEAPON CALIBRATION SELECTOR
// ─────────────────────────────────────────────────────────────

function CalibrationModal({ onClose, onSelect, items }: {
  onClose: () => void; onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}) {
  const options: EquippedItem[] = items && items.length ? items : CALIBRATION_OPTIONS.map(c => ({
    id: c.id, name: c.name, category: 'Calibration', rarity: 'Rare' as Rarity, tier: 0, stars: 0, effectSummary: c.effectSummary,
  }));
  const [selected, setSelected] = useState<EquippedItem | null>(options[0] || null);
  const [weaponDmgPercent, setWeaponDmgPercent] = useState(25);
  const [secondarySubstatId, setSecondarySubstatId] = useState("none");
  const [secondarySubstatPercent, setSecondarySubstatPercent] = useState(0);

  const selectedSubstat = CALIBRATION_SUBSTAT_OPTIONS.find((s) => s.id === secondarySubstatId) || CALIBRATION_SUBSTAT_OPTIONS[0];
  const clampedWeaponDmg = Math.min(50, Math.max(25, Number.isFinite(weaponDmgPercent) ? weaponDmgPercent : 25));
  const clampedSubstat = Math.max(0, Number.isFinite(secondarySubstatPercent) ? secondarySubstatPercent : 0);

  const buildCalibrationItem = (): EquippedItem | null => {
    if (!selected) return null;
    const hasSecondary = selectedSubstat.id !== "none" && clampedSubstat > 0;
    const statModifiers = [
      { stat: "weapon_dmg", value: clampedWeaponDmg / 100, unit: "percent" },
      ...(hasSecondary ? [{ stat: selectedSubstat.stat, value: clampedSubstat / 100, unit: "percent" }] : []),
    ];
    const secondaryText = hasSecondary ? ` Secondary: ${selectedSubstat.label} +${clampedSubstat}%.` : "";
    return {
      ...selected,
      id: `${selected.id}-${clampedWeaponDmg}-${selectedSubstat.id}-${clampedSubstat}`,
      name: `${selected.name} Calibration`,
      effectSummary: `Weapon DMG +${clampedWeaponDmg}%.${secondaryText}`,
      statModifiers,
      meta: {
        calibrationType: selected.name,
        weaponDmgPercent: clampedWeaponDmg,
        secondarySubstat: hasSecondary ? selectedSubstat.label : "None",
        secondaryPercent: hasSecondary ? clampedSubstat : 0,
      },
    };
  };

  const finalItem = buildCalibrationItem();

  return (
    <ModalShell title="Weapon Calibration" accent={CYAN} icon={<Settings size={14} />} onClose={onClose} width={720} height={500}>
      <div className="flex flex-col" style={{ width: 300, borderRight: "1px solid rgba(0,200,255,0.12)" }}>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex flex-col gap-1">
            {options.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className="text-left p-2 rounded-[3px] transition-all"
                style={{
                  background: selected?.id === c.id ? "rgba(0,200,255,0.12)" : "rgba(0,200,255,0.03)",
                  border: `1px solid ${selected?.id === c.id ? "rgba(0,200,255,0.45)" : "rgba(0,200,255,0.1)"}`,
                  borderLeft: "2px solid #00c8ff",
                }}>
                <div className="text-[11px] font-bold" style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                  {c.name}
                </div>
                {c.effectSummary && (
                  <div className="text-[9px] mt-0.5" style={{ color: '#6aa8c0' }}>{c.effectSummary}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-3 h-full">
            <div>
              <h3 className="text-[18px] font-bold" style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                {selected.name} Calibration
              </h3>
              <div className="text-[10px] mt-1" style={{ color: "#6aa8c0" }}>
                Slot 1 is always Weapon DMG %. Add the rolled value from the calibration blueprint.
              </div>
            </div>

            <div className="p-3 rounded-[3px]" style={{ background: "rgba(0,200,255,0.045)", border: "1px solid rgba(0,200,255,0.18)" }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.14em]" style={{ color: "#7ab8cc" }}>Fixed Slot 1</div>
                  <div className="text-[13px] font-bold" style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>Weapon DMG</div>
                </div>
                <div className="text-[18px] font-bold" style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
                  +{clampedWeaponDmg}%
                </div>
              </div>
              <input
                type="range"
                min={25}
                max={50}
                step={0.1}
                value={clampedWeaponDmg}
                onChange={(e) => setWeaponDmgPercent(Number(e.target.value))}
                className="w-full"
                aria-label="Weapon DMG calibration roll"
                title="Weapon DMG calibration roll"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={25}
                  max={50}
                  step={0.1}
                  value={clampedWeaponDmg}
                  onChange={(e) => setWeaponDmgPercent(Number(e.target.value))}
                  className="w-24 px-2 py-1 rounded-[3px] text-[12px] bg-black/30 border outline-none"
                  style={{ borderColor: "rgba(0,200,255,0.24)", color: "#c0dde8", fontFamily: "'JetBrains Mono', monospace" }}
                  aria-label="Weapon DMG calibration roll percent"
                  title="Weapon DMG calibration roll percent"
                />
                <span className="text-[10px]" style={{ color: "#6aa8c0" }}>Allowed roll range: 25% to 50%</span>
              </div>
            </div>

            <div className="p-3 rounded-[3px]" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[9px] uppercase tracking-[0.14em] mb-2" style={{ color: "#7ab8cc" }}>Rolled Secondary Substat</div>
              <select
                value={secondarySubstatId}
                onChange={(e) => setSecondarySubstatId(e.target.value)}
                className="w-full px-2 py-2 rounded-[3px] text-[12px] bg-black/40 border outline-none"
                style={{ borderColor: "rgba(0,200,255,0.18)", color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}
                aria-label="Rolled secondary calibration substat"
                title="Rolled secondary calibration substat"
              >
                {CALIBRATION_SUBSTAT_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  disabled={secondarySubstatId === "none"}
                  value={clampedSubstat}
                  onChange={(e) => setSecondarySubstatPercent(Number(e.target.value))}
                  className="w-24 px-2 py-1 rounded-[3px] text-[12px] bg-black/30 border outline-none disabled:opacity-40"
                  style={{ borderColor: "rgba(0,200,255,0.18)", color: "#c0dde8", fontFamily: "'JetBrains Mono', monospace" }}
                  aria-label="Rolled secondary calibration substat percent"
                  title="Rolled secondary calibration substat percent"
                />
                <span className="text-[10px]" style={{ color: "#6aa8c0" }}>% increase from the rolled calibration substat</span>
              </div>
            </div>

            {finalItem && (
              <div className="p-2 rounded-[3px] text-[11px] leading-snug"
                style={{ background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.14)", color: "#c0dde8" }}>
                {finalItem.effectSummary}
              </div>
            )}

            <button
              onClick={() => { if (finalItem) { onSelect(finalItem); onClose(); } }}
              className="mt-auto py-2 rounded-[3px] text-[12px] font-bold tracking-[0.15em] transition-all inline-flex items-center justify-center gap-2"
              style={{
                background: `${CYAN}12`,
                border: `1px solid ${CYAN}38`,
                color: CYAN,
                fontFamily: "'Rajdhani', sans-serif",
              }}>
              <Zap size={12} />
              EQUIP CALIBRATION
            </button>
          </div>
        ) : (
          <EmptySlate message="Select a calibration trait" icon={<Settings size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADOUT PANEL
// ─────────────────────────────────────────────────────────────

function LoadoutPanel({ side, loadout, onSlotClick, onUpdateItem, onRemoveItem }: {
  side: Side;
  loadout: LoadoutMap;
  onSlotClick: (slot: string, kind: ModalKind, label: string) => void;
  onUpdateItem?: (slot: string, updates: Partial<EquippedItem>) => void;
  onRemoveItem?: (slot: string) => void;
}) {
  const isOff = side === "offensive";
  const accent = isOff ? CYAN : ORANGE;
  const label = isOff ? "OFFENSIVE LOADOUT" : "ENEMY META (PvP) LOADOUT";
  const sublabel = isOff ? "BUILD A" : "PvP ENEMY";

  const click = useCallback((slot: string, kind: ModalKind, lbl: string) => {
    onSlotClick(slot, kind, lbl);
  }, [onSlotClick]);

  const updateItem = useCallback((slot: string, updates: Partial<EquippedItem>) => {
    if (onUpdateItem) onUpdateItem(slot, updates);
  }, [onUpdateItem]);

  const remove = useCallback((slot: string) => {
    if (onRemoveItem) onRemoveItem(slot);
  }, [onRemoveItem]);

  return (
    <div className="flex flex-col h-full" style={{ width: 272 }}>
      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{
          background: `${accent}08`,
          borderBottom: `1px solid ${accent}20`,
        }}>
        <div className="w-[3px] h-5 rounded-full flex-shrink-0"
          style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-[0.18em]"
            style={{ color: accent, fontFamily: "'Rajdhani', sans-serif" }}>
            {label}
          </div>
          <div className="text-[8px] tracking-[0.25em]"
            style={{ color: `${accent}55` }}>
            {sublabel}
          </div>
        </div>
          <Cpu size={11} style={{ color: `${accent}45`, flexShrink: 0 }} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${accent}15 transparent` }}>

        {/* WEAPONS (paired with 1 mod each) */}
        <div>
          <PanelSection label="Weapons" accent={accent} />
          <div className="flex flex-col gap-1.5">
            {WEAPON_PAIRS.map(wp => (
              <div key={wp.mainKey} className="flex gap-1.5 items-stretch">
                <div className="flex-1 min-w-0">
                  <EquipmentSlot label={wp.label} icon={wp.icon}
                    item={loadout[wp.mainKey] || null}
                    onClick={() => click(wp.mainKey, "weapon", wp.label)}
                    onChangeStars={(s) => updateItem(wp.mainKey, { stars: s })}
                    onChangeTier={(t) => updateItem(wp.mainKey, { tier: t })}
                    onRemove={() => remove(wp.mainKey)} />
                </div>
                <ModTile item={loadout[wp.modKey] || null}
                  onClick={() => click(wp.modKey, "weapon_mod", `${wp.label} Mod`)}
                  onRemove={() => remove(wp.modKey)} />
                <CalibrationTile item={loadout[`${wp.mainKey}_calibration`] || null}
                  onClick={() => click(`${wp.mainKey}_calibration`, "calibration", `${wp.label} Calibration`)}
                  onRemove={() => remove(`${wp.mainKey}_calibration`)} />
              </div>
            ))}
          </div>
        </div>

        {/* ATTACHMENTS */}
        <div>
          <PanelSection label="Weapon Attachments" accent={accent} />
          <div className="grid grid-cols-5 gap-1">
            {ATTACHMENT_SLOTS.map(s => (
              <AttachTile key={s.key} label={s.label} icon={s.icon}
                item={loadout[s.key] || null}
                onClick={() => click(s.key, "attachment", s.label)}
                onRemove={() => remove(s.key)} />
            ))}
          </div>
        </div>

        {/* ARMOR (paired with 1 mod each) */}
        <div>
          <PanelSection label="Armor" accent={accent} />
          <div className="flex flex-col gap-1">
            {ARMOR_PAIRS.map(ap => (
              <div key={ap.mainKey} className="flex gap-1.5 items-stretch">
                <div className="flex-1 min-w-0">
                  <EquipmentSlot label={ap.label} icon={ap.icon}
                    compact
                    item={loadout[ap.mainKey] || null}
                    onClick={() => click(ap.mainKey, "armor", ap.label)}
                    onChangeStars={(s) => updateItem(ap.mainKey, { stars: s })}
                    onChangeTier={(t) => updateItem(ap.mainKey, { tier: t })}
                    onRemove={() => remove(ap.mainKey)} />
                </div>
                <ModTile item={loadout[ap.modKey] || null}
                  onClick={() => click(ap.modKey, "armor_mod", `${ap.label} Mod`)}
                  onRemove={() => remove(ap.modKey)} />
              </div>
            ))}
          </div>
        </div>

        {/* BUFFS */}
        <div>
          <PanelSection label="Buffs" accent={accent} />
          <div className="flex flex-col gap-1">
            {BUFF_SLOTS.map(s => (
              <EquipmentSlot key={s.key} label={s.label} icon={s.icon}
                compact item={loadout[s.key] || null}
                onClick={() => click(s.key, s.kind, s.label)}
                onRemove={() => remove(s.key)} />
            ))}
          </div>
        </div>

        {/* DEVIATION */}
        <div>
          <PanelSection label="Deviation" accent={accent} />
          <EquipmentSlot label={DEVIATION_SLOT.label} icon={DEVIATION_SLOT.icon}
            item={loadout[DEVIATION_SLOT.key] || null}
            onClick={() => click(DEVIATION_SLOT.key, "deviation", "Deviation")}
            onRemove={() => remove(DEVIATION_SLOT.key)} />
        </div>

        {/* CRADLE PERKS — 8 slots, 4×2 */}
        <div>
          <PanelSection label="Cradle Perks" accent={accent} />
          <div className="grid grid-cols-4 gap-1">
            {CRADLE_SLOTS.map((s, i) => (
              <CradleTile key={s.key} index={i}
                item={loadout[s.key] || null}
                onClick={() => click(s.key, "cradle", s.label)}
                onRemove={() => remove(s.key)} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function buildTelemetryPie(calcInput: any, combatOutput: any): Array<{ name: string; value: number; color: string }> {
  const sources = calcInput?.modifierSources || [];
  const counts: Record<string, number> = {};
  for (const source of sources) {
    const label = source.sourceType || "other";
    counts[label] = (counts[label] || 0) + 1;
  }
  const data = [
    { name: "Weapon", value: counts.weapon || 0, color: CYAN },
    { name: "Mods", value: (counts.mod || 0) + (counts.modSuffix || 0), color: VIOLET },
    { name: "Set", value: counts.setBonus || 0, color: GREEN },
    { name: "Food", value: counts.food || 0, color: ORANGE },
    { name: "Calib", value: counts.calibration || 0, color: "#fb923c" },
  ].filter((entry) => entry.value > 0);

  if (data.length > 0) return data;
  const expected = combatOutput?.damageOutput?.expectedDamage || 0;
  return expected > 0 ? [{ name: "Base", value: Math.round(expected), color: CYAN }] : [];
}

function buildStatusTimeline(calcInput: any): Array<{ t: string; burn: number; frost: number; surge: number }> {
  const burn = statValue(calcInput, "burnDMGBonus") + statValue(calcInput, "statusDMGBonus");
  const frost = statValue(calcInput, "frostVortexDMGBonus");
  const surge = statValue(calcInput, "powerSurgeDMGBonus") + statValue(calcInput, "elementalDMGBonus");
  const hasStatus = burn > 0 || frost > 0 || surge > 0 || (calcInput?.availableMechanics || []).some((m: string) => /burn|frost|surge|status|elemental/i.test(m));

  return Array.from({ length: 12 }, (_, i) => {
    const progress = (i + 1) / 12;
    return {
      t: `${(i * 0.5).toFixed(1)}s`,
      burn: hasStatus ? Math.round((burn || 0.12) * 100 * Math.min(1, progress * 2)) : 0,
      frost: hasStatus ? Math.round((frost || 0) * 100 * Math.sin(progress * Math.PI)) : 0,
      surge: hasStatus ? Math.round((surge || 0) * 100 * Math.min(1, progress * 1.5)) : 0,
    };
  });
}

function buildMitigationRows(calcInput: any, combatOutput: any) {
  const pvp = calcInput?.pvpMitigation;
  const effectiveHealthGain = (combatOutput?.survivability?.survivabilityGainPercent || 0) / 100;
  return [
    { label: "DMG Reduction", value: statValue(calcInput, "dmgReduction"), color: CYAN },
    { label: "Player DMG Red.", value: statValue(calcInput, "playerDMGReduction"), color: VIOLET },
    { label: "Status Resist", value: statValue(calcInput, "statusDMGReduction"), color: ORANGE },
    { label: pvp?.pvpMode ? "PvP Total" : "EHP Gain", value: pvp?.pvpMode ? (pvp.totalReductionPercent || 0) / 100 : effectiveHealthGain, color: GREEN },
  ];
}

function CombatResolver({ offOutput, defOutput, calcInput }: { offOutput: any; defOutput: any; calcInput?: any }) {
  const dps = offOutput?.damageOutput?.DPS || offOutput?.damageOutput?.expectedDamage || 0;
  const defDps = defOutput?.damageOutput?.DPS || defOutput?.damageOutput?.expectedDamage || 0;
  const barData = [{ name: 'DPS', off: Math.round(dps), def: Math.round(defDps) }];
  const expectedDamage = offOutput?.damageOutput?.expectedDamage || 0;
  const targetHealth = 8000;
  const expectedTtk = dps > 0 ? targetHealth / dps : undefined;
  const optimalTtk = dps > 0 ? targetHealth / (dps * 1.2) : undefined;
  const worstTtk = dps > 0 ? targetHealth / (dps * 0.75) : undefined;

  // Surface active armor set bonuses (hooked via loadoutEffectResolver → armorSetBonusResolver)
  const setBonuses = (calcInput?.modeledEffects || []).concat(calcInput?.partiallyModeledEffects || [])
    .filter((e: any) => e && (e.category === 'armor-set-bonus' || e.itemId?.includes('set-')));
  const activeSetNames = Array.from(new Set(setBonuses.map((e: any) => e.itemName || e.itemId))).slice(0, 3);
  return (
    <GlassPanel className="p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <PanelSection label="Combat Resolver" accent={CYAN} />
        <span className="text-[8px] px-1.5 py-0.5 rounded-full"
          style={{ background: offOutput ? "rgba(74,222,128,0.08)" : "rgba(120,120,120,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: offOutput ? GREEN : "#666" }}>
          {offOutput ? 'LIVE' : 'AWAITING DATA'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatChip label="Sustained DPS" value={dps ? Math.round(dps).toLocaleString() : "—"} color={CYAN} />
        <StatChip label="Burst DPS (2s)" value={dps ? Math.round(dps * 1.6).toLocaleString() : "—"} color={VIOLET} />
        <StatChip label="Est. TTK" value={expectedTtk ? `${expectedTtk.toFixed(1)}s` : "—"} color={GREEN} />
      </div>
      <div>
        <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: "#6aa8c0" }}>
          DAMAGE BREAKDOWN — OFF vs DEF
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,200,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: "#90cce0", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#90cce0", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT_STYLE} cursor={{ fill: "rgba(0,200,255,0.04)" }} />
            <Bar dataKey="off" name="Offensive" fill={CYAN} fillOpacity={0.65} radius={[2, 2, 0, 0]} />
            <Bar dataKey="def" name="Defensive" fill={ORANGE} fillOpacity={0.65} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: "#6aa8c0" }}>TTK SCENARIOS</div>
        <div className="flex gap-2">
          {[
            { label: "Optimal", color: GREEN, value: optimalTtk },
            { label: "Expected", color: CYAN, value: expectedTtk },
            { label: "Worst Case", color: ORANGE, value: worstTtk },
          ].map(s => (
            <div key={s.label} className="flex-1">
              <div className="flex justify-between text-[8px] mb-0.5">
                <span style={{ color: "#7ab8cc" }}>{s.label}</span>
                <span style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value ? `${s.value.toFixed(1)}s` : "—"}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: s.value && worstTtk ? `${Math.max(8, Math.min(100, (1 - s.value / worstTtk) * 100))}%` : "0%", background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {expectedDamage > 0 && (
        <div className="text-[8px]" style={{ color: "#7ab8cc" }}>
          Expected hit: <span style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(expectedDamage).toLocaleString()}</span>
        </div>
      )}
      {activeSetNames.length > 0 && (
        <div className="text-[8px] mt-1" style={{ color: "#8bd4a0" }}>
          Set bonuses active: {activeSetNames.join(" • ")}
        </div>
      )}
    </GlassPanel>
  );
}

function StatusEngine({ calcInput }: { calcInput?: any }) {
  const data = buildStatusTimeline(calcInput);
  const burnBonus = statValue(calcInput, "burnDMGBonus") + statValue(calcInput, "statusDMGBonus");
  const frostBonus = statValue(calcInput, "frostVortexDMGBonus");
  const surgeBonus = statValue(calcInput, "powerSurgeDMGBonus") + statValue(calcInput, "elementalDMGBonus");
  const hasStatus = burnBonus > 0 || frostBonus > 0 || surgeBonus > 0;
  return (
    <GlassPanel className="p-3 flex flex-col gap-3" accent={VIOLET}>
      <PanelSection label="Status Engine" accent={VIOLET} />
      <div className="grid grid-cols-3 gap-1.5">
        <StatChip label="Burn/Status" value={hasStatus ? pct(burnBonus) : "—"} color={ORANGE} />
        <StatChip label="Frost" value={frostBonus > 0 ? pct(frostBonus) : "—"} color="#38bdf8" />
        <StatChip label="Surge/Elem." value={surgeBonus > 0 ? pct(surgeBonus) : "—"} color={VIOLET} />
      </div>
      <div>
        <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: "#6aa8c0" }}>
          STATUS INTENSITY OVER COMBAT DURATION
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="se-gBurn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ORANGE} stopOpacity={0.4} />
                <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="se-gFrost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="se-gSurge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={VIOLET} stopOpacity={0.35} />
                <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fill: "#90cce0", fontSize: 8 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "#90cce0", fontSize: 8 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT_STYLE} />
            <Area type="monotone" dataKey="burn" name="Burn" stroke={ORANGE} fill="url(#se-gBurn)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="frost" name="Frost" stroke="#38bdf8" fill="url(#se-gFrost)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="surge" name="Power Surge" stroke={VIOLET} fill="url(#se-gSurge)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!hasStatus && (
        <div className="text-[9px]" style={{ color: "#6aa8c0" }}>
          No structured status modifiers detected in the active loadout.
        </div>
      )}
    </GlassPanel>
  );
}

function CombatTelemetry({ calcInput, combatOutput }: { calcInput?: any; combatOutput?: any }) {
  const data = buildTelemetryPie(calcInput, combatOutput);
  const critRate = (calcInput?.baseCritRate ?? 0) + statValue(calcInput, "critRate");
  const critDmg = (calcInput?.baseCritDamage ?? 0) + statValue(calcInput, "critDMG");
  const procRate = combatOutput?.damageOutput?.ticksPerSecond;
  const modifierCount = calcInput?.modifierSources?.length || 0;
  return (
    <GlassPanel className="p-3 flex flex-col gap-3" accent={ORANGE}>
      <PanelSection label="Combat Telemetry" accent={ORANGE} />
      <div className="flex gap-3 items-center">
        <div style={{ width: 100, height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={26} outerRadius={44}
                dataKey="value" stroke="none" opacity={0.3}>
                {data.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1">
          {data.map((d: any) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[9px]">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40"
                style={{ background: d.color }} />
              <span style={{ color: "#7ab8cc" }}>{d.name}</span>
              <span className="ml-auto" style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: "Crit Rate", color: VIOLET, value: pct(critRate) },
          { label: "Crit Dmg", color: VIOLET, value: pct(critDmg) },
          { label: "Proc/s", color: ORANGE, value: procRate ? num(procRate, 2) : "—" },
          { label: "Mods", color: GREEN, value: String(modifierCount) },
        ].map(s => (
          <div key={s.label} className="p-1.5 rounded-[3px] text-center"
            style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${s.color}18` }}>
            <div className="text-[8px]" style={{ color: "#6aa8c0" }}>{s.label}</div>
            <div className="text-[11px] font-bold"
              style={{ color: s.color, opacity: s.value === "—" ? 0.45 : 1, fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function MitigationAnalysis({ calcInput, combatOutput }: { calcInput?: any; combatOutput?: any }) {
  const rows = buildMitigationRows(calcInput, combatOutput);
  const hasAny = rows.some((row) => row.value > 0);
  return (
    <GlassPanel className="p-3 flex flex-col gap-3">
      <PanelSection label="Mitigation Analysis" accent={CYAN} />
      <div className="grid grid-cols-2 gap-2">
        {rows.map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-[8px] mb-0.5">
              <span style={{ color: "#7ab8cc" }}>{s.label}</span>
              <span style={{ color: s.color, opacity: s.value > 0 ? 1 : 0.5, fontFamily: "'JetBrains Mono', monospace" }}>{s.value > 0 ? pct(s.value) : "—"}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, s.value * 100))}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
      {!hasAny ? (
        <SimReady text="No mitigation modifiers detected in current loadout" />
      ) : (
        <div className="text-[9px]" style={{ color: "#6aa8c0" }}>
          Effective health multiplier: <span style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
            {combatOutput?.survivability?.effectiveHealthMultiplier ? `${combatOutput.survivability.effectiveHealthMultiplier}x` : "—"}
          </span>
        </div>
      )}
    </GlassPanel>
  );
}

const SIM_EVENT_TYPES: Array<{ t: string; icon: React.ReactNode; label: string; color: string }> = [
  { t: "0.00s", icon: <Zap size={11} />, label: "Shot Fired", color: CYAN },
  { t: "0.08s", icon: <Crosshair size={11} />, label: "Hit Registered", color: "#60a5fa" },
  { t: "0.30s", icon: <Flame size={11} />, label: "Status Applied", color: ORANGE },
  { t: "0.80s", icon: <Activity size={11} />, label: "DoT Tick", color: ORANGE },
  { t: "1.00s", icon: <Star size={11} />, label: "Critical Hit", color: VIOLET },
  { t: "1.50s", icon: <Cpu size={11} />, label: "Mod Proc", color: VIOLET },
  { t: "2.00s", icon: <Bomb size={11} />, label: "Explosion / Detonation", color: "#fb923c" },
  { t: "3.10s", icon: <CheckCircle2 size={11} />, label: "Target Eliminated", color: GREEN },
];

function SimulationTimeline() {
  return (
    <GlassPanel className="p-3" accent={VIOLET}>
      <PanelSection label="Simulation Timeline" accent={VIOLET} />
      <div className="text-[8px] mb-3 px-1"
        style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
        COMBAT EVENT LOG — RUN SIMULATION TO POPULATE
      </div>
      <div className="relative">
        <div className="absolute top-0 bottom-0"
          style={{ left: 46, width: 1, background: "rgba(0,200,255,0.1)" }} />
        <div className="flex flex-col gap-1.5">
          {SIM_EVENT_TYPES.map((ev, i) => (
            <div key={i} className="flex items-center gap-3" style={{ opacity: 0.35 }}>
              <div className="text-right flex-shrink-0"
                style={{ width: 40, color: "#7ab8cc", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
                {ev.t}
              </div>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 z-10"
                style={{ background: ev.color }} />
              <div className="flex items-center gap-2 py-1 px-2 rounded-[2px] flex-1"
                style={{
                  background: `${ev.color}05`,
                  border: `1px solid ${ev.color}12`,
                  borderLeft: `2px solid ${ev.color}35`,
                }}>
                <span className="flex items-center justify-center" style={{ flexShrink: 0, color: ev.color }}>{ev.icon}</span>
                <span className="text-[10px]" style={{ color: "#7ab8cc" }}>{ev.label}</span>
                <span className="ml-auto text-[9px]"
                  style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
                  — DMG
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYSIS HUB
// ─────────────────────────────────────────────────────────────

type ModuleKey = "resolver" | "status" | "telemetry" | "mitigation" | "timeline";

function AnalysisHub({ 
  combatOutput, 
  damageResult,
  calcInput,
  offCombatOutput,
  defCombatOutput,
}: { 
  combatOutput?: any; 
  damageResult?: any;
  calcInput?: any;
  offCombatOutput?: any;
  defCombatOutput?: any;
}) {
  const [expanded, setExpanded] = useState<Record<ModuleKey, boolean>>({
    resolver: true, status: true, telemetry: true, mitigation: true, timeline: true,
  });

  const toggle = (k: ModuleKey) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  function Module({ id, title, children }: { id: ModuleKey; title: string; children: React.ReactNode }) {
    return (
      <div>
        <button onClick={() => toggle(id)}
          className="ohmm-module-toggle w-full flex items-center px-2.5 py-1.5 mb-1.5 rounded-[3px] transition-all">
          {/* Left spacer for centering the title text */}
          <div className="flex-1" />
          {/* Centered panel header text */}
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-center"
            style={{ color: CYAN, fontFamily: "'Rajdhani', sans-serif" }}>
            {title}
          </span>
          {/* Right side: controls pushed to end, title stays centered */}
          <div className="flex-1 flex items-center justify-end gap-1.5">
            <span className="text-[7px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)", color: GREEN }}>
              READY
            </span>
            {expanded[id]
              ? <ChevronUp size={10} style={{ color: "#7ab8cc" }} />
              : <ChevronDown size={10} style={{ color: "#7ab8cc" }} />}
          </div>
        </button>
        {expanded[id] && children}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Hub header */}
      <div className="px-3 py-2 flex items-center flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,200,255,0.12)", background: "rgba(0,200,255,0.03)" }}>
        {/* Left spacer */}
        <div className="flex-1" />
        {/* Centered header text */}
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: CYAN }} />
          <span className="text-[12px] font-bold tracking-[0.15em]"
            style={{ color: CYAN, fontFamily: "'Rajdhani', sans-serif" }}>
            ANALYSIS HUB
          </span>
        </div>
        {/* Right spacer + controls */}
        <div className="flex-1 flex items-center justify-end gap-1.5">
          <button className="flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-[3px] transition-all font-bold"
            style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.28)", color: CYAN,
              fontFamily: "'Rajdhani', sans-serif" }}>
            <RefreshCw size={9} />
            RUN SIM
          </button>
          <button className="text-[9px] px-2 py-1 rounded-[3px] font-bold"
            style={{ background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.2)", color: ORANGE,
              fontFamily: "'Rajdhani', sans-serif" }}>
            RESET
          </button>
        </div>
      </div>

      {/* Module layout */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,200,255,0.12) transparent" }}>
        <div className="grid grid-cols-2 gap-3">
          <Module id="resolver" title="Combat Resolver">
            <CombatResolver offOutput={offCombatOutput || combatOutput} defOutput={defCombatOutput} calcInput={calcInput} />
          </Module>
          <Module id="telemetry" title="Combat Telemetry">
            <CombatTelemetry calcInput={calcInput} combatOutput={combatOutput || offCombatOutput} />
          </Module>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Module id="status" title="Status Engine">
            <StatusEngine calcInput={calcInput} />
          </Module>
          <Module id="mitigation" title="Mitigation Analysis">
            <MitigationAnalysis calcInput={calcInput} combatOutput={combatOutput || offCombatOutput} />
          </Module>
        </div>
        <Module id="timeline" title="Simulation Timeline"><SimulationTimeline /></Module>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP HEADER
// ─────────────────────────────────────────────────────────────

function AppHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="ohmm-app-header">
      {/* Left status row */}
      <div className="flex items-center gap-4">
        {[
          { label: "BUILD A", color: CYAN },
          { label: "ENEMY META", color: ORANGE },
          { label: "SIM READY", color: GREEN },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="ohmm-live-dot"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <span className="text-[9px] font-bold tracking-widest"
              style={{ color: s.color, fontFamily: "'Rajdhani', sans-serif" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Center logo */}
      <div className="flex items-center justify-center select-none" style={{ minWidth: 260 }}>
        <img className="ohmm-navbar-mark" src={OHMM_NAVBAR_LOGO} alt="OHMM Once Human Meta Metrics" />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <div className="ohmm-status-chip"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.16)", color: GREEN }}>
          <CheckCircle2 size={9} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>META DB LIVE</span>
        </div>
        {/* SIMULATION ENGINE badge relocated here next to META DB LIVE */}
        <div className="flex items-center text-[8px] px-1.5 py-0.5 rounded-[3px]"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)", color: GREEN }}>
          SIMULATION ENGINE v2.4
        </div>
        <div className="ohmm-status-chip">
          <Database size={9} style={{ color: CYAN }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>v2.4.1</span>
        </div>
        <button onClick={onOpenSettings} className="ohmm-icon-btn" title="Settings">
          <Settings size={12} style={{ color: "#7ab8cc" }} />
        </button>
      </div>
    </div>
  );
}

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
                console.log(`[Supabase] Fetched ${d.length} from ${table}`);
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
        console.log('[Supabase] Loaded', combined.length, 'armor pieces (using Supabase as source of truth for full list + spellings)');
      } catch (e) {
        console.warn('Supabase armor fetch failed, using local registry', e);
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
          console.log('[Supabase] Loaded', data.length, 'food buffs from DB');
        }
      } catch (e) {
        console.warn('Supabase food_buffs fetch failed, using local registry', e);
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

  // Derived chart data from real formula outputs (replaces EMPTY_*)
  const dpsBarData = attackerCombatOutput ? [
    { name: 'Sustained', off: Math.round(attackerCombatOutput.damageOutput.DPS || attackerCombatOutput.damageOutput.expectedDamage || 0), def: Math.round((defenderCombatOutput?.damageOutput.DPS || defenderCombatOutput?.damageOutput.expectedDamage || 0)) }
  ] : [{ name: 'Sustained', off: 0, def: 0 }];

  const timelineData = Array.from({ length: 12 }, (_, i) => {
    const t = (i * 0.5).toFixed(1) + 's';
    const base = attackerCombatOutput ? (attackerCombatOutput.damageOutput.expectedDamage || 1200) : 0;
    return {
      t,
      burn: Math.round(base * (0.15 + Math.sin(i) * 0.05)),
      frost: Math.round(base * (0.08 + Math.cos(i) * 0.04)),
      surge: Math.round(base * 0.05)
    };
  });

  const pieData = (() => {
    const dmg = attackerDamageResult?.formulaDamage || attackerCombatOutput?.damageOutput.expectedDamage || 1000;
    return [
      { name: 'Direct', value: Math.round(dmg * 0.55), color: CYAN },
      { name: 'Crit', value: Math.round(dmg * 0.25), color: VIOLET },
      { name: 'Status', value: Math.round(dmg * 0.12), color: ORANGE },
      { name: 'Mod', value: Math.round(dmg * 0.05), color: '#fb923c' },
      { name: 'Set', value: Math.round(dmg * 0.03), color: GREEN },
    ];
  })();

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
