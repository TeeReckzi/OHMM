import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { ModalShell, EmptySlate, GenericDetail } from "../ui/Primitives";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Rarity, EquippedItem } from "../../types";
import { CYAN } from "../../types";
import { getAttachmentsBySlot } from "../../../ohai/src/ui/registries/attachmentRegistry";
import { buildCdnUrl } from "../../../ohai/src/ui/data/supabaseImageResolver";

// ─────────────────────────────────────────────────────────────
// MODAL — ATTACHMENT SELECTOR
// ─────────────────────────────────────────────────────────────

export interface AttachmentModalProps {
  slotLabel: string;
  onClose: () => void;
  onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}

export function AttachmentModal({ slotLabel, onClose, onSelect, items }: AttachmentModalProps) {
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
