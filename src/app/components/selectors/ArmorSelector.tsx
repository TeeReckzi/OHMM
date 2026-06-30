import React, { useState } from "react";
import { Search, Shield } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ModalShell, EmptySlate, GenericDetail, RarityBadge } from "../ui/Primitives";
import type { Rarity, EquippedItem } from "../../types";
import { R_COLOR, CYAN } from "../../types";
import { armorRegistry, keyGearRegistry } from "../../../ohai/src/ui/registries/armorRegistry";

const ARMOR_SLOTS_FILTER = ["All", "Helmet", "Mask", "Chest", "Gloves", "Pants", "Boots"] as const;

export function getArmorDisplaySlot(slot: string | undefined): string {
  if (!slot) return '';
  const s = slot.toLowerCase().trim();
  const map: Record<string, string> = {
    head: 'Helmet',
    helmet: 'Helmet',
    mask: 'Mask',
    chest: 'Chest',
    top: 'Chest',
    gloves: 'Gloves',
    pants: 'Pants',
    bottoms: 'Pants',
    legs: 'Pants',
    boots: 'Boots',
    shoes: 'Boots',
  };
  return map[s] || (slot.charAt(0).toUpperCase() + slot.slice(1));
}

export function ArmorModal({ slotLabel, onClose, onSelect, items }: {
  slotLabel: string; onClose: () => void; onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}) {
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<string>(slotLabel || "All");
  const [selected, setSelected] = useState<EquippedItem | null>(null);

  // Use passed items (from getArmorItems with proper category = display slot)
  let armors: EquippedItem[] = items && items.length ? items : [];

  // Fallback with proper slot mapping if no items
  if (armors.length === 0) {
    const source = [
      ...(armorRegistry || []),
      ...(keyGearRegistry || []),
    ];
    armors = source.map((a: any) => {
      const rawSlot = a.slot || '';
      const displaySlot = getArmorDisplaySlot(rawSlot);
      return {
        id: a.id,
        name: a.name,
        category: displaySlot || 'Armor',
        rarity: 'Epic' as Rarity,
        tier: 4,
        stars: 3,
        effectSummary: a.effectSummary,
        meta: { slot: rawSlot },
      };
    });
  }

  const filtered = armors.filter(a => {
    const itemSlot = (a.category && a.category !== 'Armor' && a.category !== 'KeyGear')
      ? a.category
      : (a.meta?.displaySlot || a.meta?.slot || '');
    const itemSlotText = String(itemSlot);
    const matchesSlot = slot === "All" || itemSlotText.toLowerCase() === slot.toLowerCase() || getArmorDisplaySlot(itemSlotText).toLowerCase() === slot.toLowerCase();
    return matchesSlot && a.name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <ModalShell title="Armor Selector" accent={CYAN} icon={<Shield size={14} />} onClose={onClose} width={800}>
      <div className="flex flex-col" style={{ width: 460, borderRight: "1px solid rgba(0,200,255,0.1)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.15)" }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search armor, set name..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: CYAN }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 px-3 py-2"
          style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
          {ARMOR_SLOTS_FILTER.map(s => (
            <button key={s} onClick={() => setSlot(s)}
              className="px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider transition-all"
              style={{
                background: slot === s ? "rgba(0,200,255,0.14)" : "rgba(0,200,255,0.04)",
                border: `1px solid ${slot === s ? "rgba(0,200,255,0.4)" : "rgba(0,200,255,0.1)"}`,
                color: slot === s ? CYAN : "#4c6e80",
              }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,200,255,0.12) transparent" }}>
          {filtered.length === 0 ? (
            <EmptySlate message="No armor loaded — wire in your data source" icon={<Shield size={22} />} />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(a => (
                <button key={a.id} onClick={() => setSelected(a)}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-center"
                  style={{
                    background: selected?.id === a.id ? `${R_COLOR[a.rarity]}14` : "rgba(0,200,255,0.03)",
                    border: `1px solid ${selected?.id === a.id ? R_COLOR[a.rarity] + "45" : "rgba(0,200,255,0.1)"}`,
                    borderLeft: `2px solid ${R_COLOR[a.rarity]}`,
                  }}>
                  {a.iconUrl && (
                    <div style={{ width: 26, height: 26, flexShrink: 0 }}>
                      <ImageWithFallback src={a.iconUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-1">
                      <span className="text-[12px] font-bold truncate"
                        style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                        {a.name}
                      </span>
                      <RarityBadge rarity={a.rarity} />
                    </div>
                    {a.effectSummary && (
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: '#6aa8c0' }}>
                        {a.effectSummary}
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
          <GenericDetail item={selected} accent={CYAN} onEquip={() => { onSelect(selected); onClose(); }} />
        ) : (
          <EmptySlate message="Select armor to view set bonuses & stats" icon={<Shield size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}
