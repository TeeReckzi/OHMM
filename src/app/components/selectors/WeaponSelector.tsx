import React, { useState } from "react";
import { Search, Crosshair, Zap } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ModalShell, EmptySlate, StarRating, RarityBadge } from "../ui/Primitives";
import type { Rarity, EquippedItem } from "../../types";
import { R_COLOR, CYAN, WEAPON_CATS, isWeaponItem } from "../../types";
import { weaponRegistry } from "../../../ohai/src/ui/registries/weaponRegistry";

function WeaponDetail({ weapon, onEquip }: { weapon: EquippedItem; onEquip: () => void }) {
  return (
    <div className="flex flex-col gap-3 h-full">
      {weapon.iconUrl && (
        <div className="w-20 h-20 rounded bg-black/30 p-1 border border-white/10 self-start">
          <ImageWithFallback src={weapon.iconUrl} alt={weapon.name} fallbackSrc={null} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}
      <div>
        <h3 className="text-[20px] font-bold leading-none"
          style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
          {weapon.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <RarityBadge rarity={weapon.rarity} />
          <span className="text-[9px]"
            style={{ color: "#7ab8cc", fontFamily: "'JetBrains Mono', monospace" }}>
            CRAFTED TIER {weapon.tier}
          </span>
          <StarRating stars={weapon.stars} />
        </div>
      </div>

      {(weapon.effectSummary || weapon.description) && (
        <div className="p-2 rounded-[3px] text-[11px] leading-snug"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="uppercase tracking-[0.1em] text-[8px] mb-0.5" style={{ color: '#7ab8cc' }}>EFFECTS</div>
          <div style={{ color: '#c0dde8' }}>{weapon.effectSummary || weapon.description}</div>
        </div>
      )}

      {weapon.statModifiers && weapon.statModifiers.length > 0 && (
        <div>
          <div className="uppercase tracking-[0.1em] text-[8px] mb-1" style={{ color: '#7ab8cc' }}>MODIFIERS</div>
          <div className="flex flex-wrap gap-1">
            {weapon.statModifiers.map((mod: any, i: number) => {
              const val = typeof mod.value === 'number' ? (mod.unit === 'percent' ? `${(mod.value * 100).toFixed(0)}%` : mod.value) : mod.value;
              return <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${CYAN}10`, border: `1px solid ${CYAN}25`, color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>{mod.stat}: +{val}</span>;
            })}
          </div>
        </div>
      )}
      {/* Meta grid */}
      {weapon.meta && (
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(weapon.meta).map(([k, v]) => (
            <div key={k} className="p-2 rounded-[3px]"
              style={{ background: `${CYAN}06`, border: `1px solid ${CYAN}14` }}>
              <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: "#7ab8cc" }}>{k}</div>
              <div className="text-[13px] font-bold"
                style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
                {String(v)}
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onEquip}
        className="mt-auto py-2 rounded-[3px] text-[12px] font-bold tracking-[0.15em] transition-all inline-flex items-center justify-center gap-2"
        style={{
          background: "rgba(0,200,255,0.12)",
          border: "1px solid rgba(0,200,255,0.38)",
          color: CYAN, fontFamily: "'Rajdhani', sans-serif",
        }}>
        <Zap size={12} />
        EQUIP WEAPON
      </button>
    </div>
  );
}

export function WeaponModal({ onClose, onSelect, items }: {
  onClose: () => void;
  onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [selected, setSelected] = useState<EquippedItem | null>(null);

  const weapons: EquippedItem[] = items && items.length ? items : (weaponRegistry || []).map((w: any) => ({
    id: w.id,
    name: w.name,
    category: w.family || 'AR',
    rarity: (w.blueprintQuality === 'legendary' ? 'Legendary' : w.blueprintQuality === 'epic' ? 'Epic' : 'Rare') as Rarity,
    tier: 4,
    stars: 3,
  }));
  const filtered = weapons.filter(w =>
    (cat === "All" || w.category === cat) &&
    w.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ModalShell title="Weapon Selector" icon={<Crosshair size={14} />} onClose={onClose}>
      {/* Left */}
      <div className="flex flex-col" style={{ width: 520, borderRight: "1px solid rgba(0,200,255,0.1)" }}>
        {/* Search */}
        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.15)" }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search weapons, family, mechanic..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: CYAN, fontFamily: "'Inter', sans-serif" }} />
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 px-3 py-2"
          style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
          {WEAPON_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider transition-all"
              style={{
                background: cat === c ? "rgba(0,200,255,0.14)" : "rgba(0,200,255,0.04)",
                border: `1px solid ${cat === c ? "rgba(0,200,255,0.4)" : "rgba(0,200,255,0.1)"}`,
                color: cat === c ? CYAN : "#4c6e80",
              }}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Weapon list */}
        <div className="flex-1 overflow-y-auto p-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,200,255,0.12) transparent" }}>
          {filtered.length === 0 ? (
            <EmptySlate message="No weapons loaded — wire in your data source" icon={<Crosshair size={24} />} />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(w => (
                <button key={w.id} onClick={() => setSelected(w)}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-center"
                  style={{
                    background: selected?.id === w.id ? `${R_COLOR[w.rarity]}14` : "rgba(0,200,255,0.03)",
                    border: `1px solid ${selected?.id === w.id ? R_COLOR[w.rarity] + "45" : "rgba(0,200,255,0.1)"}`,
                    borderLeft: `2px solid ${R_COLOR[w.rarity]}`,
                  }}>
                  {w.iconUrl && (
                    <div style={{ width: 28, height: 28, flexShrink: 0 }}>
                      <ImageWithFallback src={w.iconUrl} alt={w.name} fallbackSrc={null} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold truncate"
                        style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                        {w.name}
                      </span>
                      <RarityBadge rarity={w.rarity} />
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating stars={w.stars} />
                      <span className="text-[9px]"
                        style={{ color: "#4c6e80", fontFamily: "'JetBrains Mono', monospace" }}>
                        T{w.tier}
                      </span>
                    </div>
                    {w.effectSummary && (
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: '#6aa8c0' }}>
                        {w.effectSummary}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Right — detail */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4">
        {selected ? (
          <WeaponDetail weapon={selected} onEquip={() => { onSelect(selected); onClose(); }} />
        ) : (
          <EmptySlate message="Select a weapon to view details" icon={<Crosshair size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}

export { isWeaponItem };
