import React, { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { ModalShell, EmptySlate, GenericDetail } from "../ui/Primitives";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Rarity, EquippedItem } from "../../types";
import { VIOLET } from "../../types";
import { deviationRegistry } from "../../../ohai/src/ui/registries/deviationRegistry";
import { buildCdnUrl } from "../../../ohai/src/ui/data/supabaseImageResolver";

// ─────────────────────────────────────────────────────────────
// MODAL — DEVIATION SELECTOR
// ─────────────────────────────────────────────────────────────

const DEV_CATS = ["All", "Combat", "Defensive", "Utility", "Crafting"] as const;

export interface DeviationModalProps {
  onClose: () => void;
  onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}

export function DeviationModal({ onClose, onSelect, items }: DeviationModalProps) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [selected, setSelected] = useState<EquippedItem | null>(null);
  const devs: EquippedItem[] = items && items.length ? items : (deviationRegistry || []).map((d: any) => ({
    id: d.id, name: d.name,
    category: d.deviationRole ? d.deviationRole.charAt(0).toUpperCase() + d.deviationRole.slice(1) : 'Combat',
    rarity: 'Legendary' as Rarity, tier: 0, stars: 0,
    iconUrl: buildCdnUrl('deviations', d.id),
    effectSummary: d.effectSummary,
  }));
  const filtered = devs.filter(d =>
    (cat === "All" || d.category === cat) &&
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ModalShell title="Deviation Selector" accent={VIOLET} icon={<AlertTriangle size={14} />} onClose={onClose} width={800}>
      <div className="flex flex-col" style={{ width: 460, borderRight: `1px solid ${VIOLET}12` }}>
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${VIOLET}08` }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: `${VIOLET}05`, border: `1px solid ${VIOLET}18` }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search deviations..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: VIOLET }} />
          </div>
        </div>
        <div className="flex gap-1 px-3 py-2" style={{ borderBottom: `1px solid ${VIOLET}08` }}>
          {DEV_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wide transition-all"
              style={{
                background: cat === c ? `${VIOLET}14` : `${VIOLET}04`,
                border: `1px solid ${cat === c ? VIOLET + "40" : VIOLET + "10"}`,
                color: cat === c ? VIOLET : "#4c6e80",
              }}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${VIOLET}12 transparent` }}>
          {filtered.length === 0 ? (
            <EmptySlate message="No deviations loaded — wire in your data source" icon={<AlertTriangle size={22} />} />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(d => (
                <button key={d.id} onClick={() => setSelected(d)}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-center"
                  style={{
                    background: selected?.id === d.id ? `${VIOLET}12` : `${VIOLET}03`,
                    border: `1px solid ${selected?.id === d.id ? VIOLET + "45" : VIOLET + "10"}`,
                    borderLeft: `2px solid ${VIOLET}`,
                  }}>
                  {d.iconUrl && (
                    <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                      <ImageWithFallback src={d.iconUrl} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] font-bold"
                      style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                      {d.name}
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color: "#4c6e80" }}>{d.category}</div>
                    {d.effectSummary && <div className="text-[9px] truncate" style={{ color: '#6aa8c0' }}>{d.effectSummary}</div>}
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
          <EmptySlate message="Select a deviation to view its profile" icon={<AlertTriangle size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}
