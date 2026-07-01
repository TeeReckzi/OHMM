import React, { useState } from "react";
import { Search, Cpu } from "lucide-react";
import { ModalShell, EmptySlate, GenericDetail } from "../ui/Primitives";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Rarity, EquippedItem } from "../../types";
import { VIOLET } from "../../types";
import { cradleRegistry } from "../../../ohai/src/ui/registries/cradleRegistry";
import { buildCdnUrl } from "../../../ohai/src/ui/data/supabaseImageResolver";

// ─────────────────────────────────────────────────────────────
// MODAL — CRADLE PERK SELECTOR
// ─────────────────────────────────────────────────────────────

export interface CradleModalProps {
  slotIndex: number;
  onClose: () => void;
  onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}

export function CradleModal({ slotIndex, onClose, onSelect, items }: CradleModalProps) {
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
