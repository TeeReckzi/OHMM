import React, { useCallback } from "react";
import { Crosshair, Shield, Settings, Database, Flame, Snowflake, AlertTriangle, Filter, Cpu } from "lucide-react";
import { PanelSection } from "../ui/Primitives";
import { EquipmentSlot, ModTile, CalibrationTile, AttachTile, CradleTile } from "../LoadoutTiles";
import type { Side, ModalKind, EquippedItem, LoadoutMap } from "../../types";
import { CYAN, ORANGE } from "../../types";

// ─────────────────────────────────────────────────────────────
// LOADOUT PANEL
// ─────────────────────────────────────────────────────────────

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

const BUFF_SLOTS = [
  { key: "food",  label: "Food Buff",  icon: <Flame size={13} />, kind: "buff" as ModalKind },
  { key: "drink", label: "Drink Buff", icon: <Snowflake size={13} />, kind: "buff" as ModalKind },
];

const DEVIATION_SLOT = { key: "deviation", label: "Deviation", icon: <AlertTriangle size={13} /> };

const CRADLE_SLOTS = Array.from({ length: 8 }, (_, i) => ({
  key: `cradle_${i + 1}`,
  label: `Perk ${i + 1}`,
}));

export interface LoadoutPanelProps {
  side: Side;
  loadout: LoadoutMap;
  onSlotClick: (slot: string, kind: ModalKind, label: string) => void;
  onUpdateItem?: (slot: string, updates: Partial<EquippedItem>) => void;
  onRemoveItem?: (slot: string) => void;
}

export function LoadoutPanel({ side, loadout, onSlotClick, onUpdateItem, onRemoveItem }: LoadoutPanelProps) {
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
