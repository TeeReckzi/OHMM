import React, { useState } from "react";
import { Search, Flame, Snowflake } from "lucide-react";
import { ModalShell, EmptySlate, GenericDetail } from "../ui/Primitives";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Rarity, EquippedItem } from "../../types";
import { foodBuffRegistry } from "../../../ohai/src/ui/registries/foodBuffRegistry";
import { buildCdnUrl } from "../../../ohai/src/ui/data/supabaseImageResolver";

// ─────────────────────────────────────────────────────────────
// MODAL — BUFF SELECTOR
// ─────────────────────────────────────────────────────────────

export interface BuffModalProps {
  isFood: boolean;
  onClose: () => void;
  onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}

export function BuffModal({ isFood, onClose, onSelect, items }: BuffModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EquippedItem | null>(null);
  // Prefer items passed from getBuffItems (which pulls from Supabase food_buffs when available)
  const buffs: EquippedItem[] = items && items.length ? items : (foodBuffRegistry || []).map((b: any) => ({
    id: b.id, name: b.name, category: 'Buff', rarity: 'Rare' as Rarity, tier: 0, stars: 0,
    iconUrl: buildCdnUrl(isFood ? 'food' : 'drinks', b.id || b.name),
    effectSummary: b.effectSummary,
  }));
  const filtered = buffs.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
  const accent = isFood ? "#fb923c" : "#38bdf8";

  return (
    <ModalShell title={isFood ? "Food Buff Selector" : "Drink Buff Selector"}
      accent={accent} onClose={onClose} width={680} height={500}>
      <div className="flex flex-col" style={{ width: 360, borderRight: `1px solid ${accent}12` }}>
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${accent}08` }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: `${accent}05`, border: `1px solid ${accent}18` }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${isFood ? "food" : "drink"} buffs...`}
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: accent }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <EmptySlate message="No buffs loaded — wire in your data source"
              icon={isFood ? <Flame size={22} /> : <Snowflake size={22} />} />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(b => (
                <button key={b.id} onClick={() => setSelected(b)}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-center"
                  style={{
                    background: selected?.id === b.id ? `${accent}12` : `${accent}03`,
                    border: `1px solid ${selected?.id === b.id ? accent + "40" : accent + "10"}`,
                    borderLeft: `2px solid ${accent}`,
                  }}>
                  {b.iconUrl && (
                    <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                      <ImageWithFallback src={b.iconUrl} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <span className="text-[12px] font-bold"
                    style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                    {b.name}
                  </span>
                  {b.effectSummary && <div className="text-[9px] truncate" style={{ color: '#6aa8c0' }}>{b.effectSummary}</div>}
                  {b.meta?.baseBuff && (
                    <div className="text-[8px] mt-0.5" style={{ color: '#4a8aa0' }}>
                      Base: {b.meta.baseBuff} {b.meta.maxChefRexBuff ? `| Max ChefRex: ${b.meta.maxChefRexBuff}` : ''}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4">
        {selected ? (
          <GenericDetail item={selected} accent={accent} onEquip={() => { onSelect(selected); onClose(); }} />
        ) : (
          <EmptySlate message="Select a buff to view duration & effects"
            icon={isFood ? <Flame size={28} /> : <Snowflake size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}
