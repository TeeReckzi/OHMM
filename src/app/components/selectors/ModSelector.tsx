import React, { useState } from "react";
import { Search, Zap } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ModalShell, EmptySlate, GenericDetail, ModTypeBadge } from "../ui/Primitives";
import type { Rarity, EquippedItem } from "../../types";
import { CYAN, VIOLET } from "../../types";
import { modRegistry } from "../../../ohai/src/ui/registries/modRegistry";
import { verifiedSuffixPoolsByModId } from "../../../ohai/src/ui/registries/verifiedModFamilies";
import { buildCdnUrl } from "../../../ohai/src/ui/data/supabaseImageResolver";

const MOD_CATS = ["All", "Burn", "Power Surge", "Frost", "Bullseye", "Fortress Warfare", "Unstable Bomber", "Fast Gunner", "Bounce", "Shrapnel", "General"] as const;

// The 9 real weapon-mod categories, verified from an in-game screen recording.
const VERIFIED_WEAPON_MOD_CATEGORIES = ["Burn", "Power Surge", "Frost", "Bullseye", "Fortress Warfare", "Unstable Bomber", "Fast Gunner", "Bounce", "Shrapnel"];

export function normalizeModSlot(slot: string | undefined): string {
  if (!slot) return '';
  const s = slot.toLowerCase().replace(/_mod$/, '').replace(/_/g, '');
  const map: Record<string, string> = {
    primary: 'weapon',
    secondary: 'weapon',
    helmet: 'head',
    head: 'head',
    mask: 'mask',
    chest: 'chest',
    top: 'chest',
    gloves: 'gloves',
    pants: 'pants',
    bottoms: 'pants',
    boots: 'boots',
    shoes: 'boots',
    weapon: 'weapon',
  };
  return map[s] || s;
}

// In-game, gear mods aren't sub-categorized into elemental/archetype buckets
// the way weapon mods are (the Mods menu just lists them flat per armor
// slot) — so labeling a gear mod "Bullseye" or "Fast Gunner" off an
// incidental keyword match in its effect text is fabricating a category
// that doesn't exist for that item. Use the slot name instead.
export function gearSlotLabel(modSlot: string | undefined): string {
  const map: Record<string, string> = { head: 'Helmet', chest: 'Top', pants: 'Bottoms', boots: 'Boots', gloves: 'Gloves', mask: 'Mask' };
  return map[normalizeModSlot(modSlot)] || 'Gear';
}

// Mods carrying a verified category tag (see verifiedModFamilies.ts) report it
// directly. Anything else (legacy/suffix mods not yet re-verified) falls back
// to a keyword heuristic mapped onto the same 9 real categories, with
// "General" as a catch-all for gear mods that don't have an elemental theme
// in-game (the real Mods menu doesn't sub-categorize gear mods at all).
export function categorizeMod(m: { name?: string; effectSummary?: string; tags?: string[]; id?: string; slug?: string }): string {
  const verifiedTag = (m.tags || []).find((t) => VERIFIED_WEAPON_MOD_CATEGORIES.includes(t));
  if (verifiedTag) return verifiedTag;
  const text = [m.name, m.effectSummary, ...(m.tags || []), m.id, m.slug].filter(Boolean).join(' ').toLowerCase();
  if (/\bburn\b|blaze|scorch|\bfire\b/.test(text)) return 'Burn';
  if (/frost|\bice\b|cryo|chill|freeze/.test(text)) return 'Frost';
  if (/power[\s-]?surge|\bshock\b|electric|surge|thunder/.test(text)) return 'Power Surge';
  if (/unstable|\bbomb|explosi|\bblast\b|blitz/.test(text)) return 'Unstable Bomber';
  if (/territory|\bshield\b|\bguard\b|defensive|defense|fortress/.test(text)) return 'Fortress Warfare';
  if (/precision|accuracy|weakspot|\bcrit\b|\bmark\b|deadshot/.test(text)) return 'Bullseye';
  if (/quick|rapid|reload|cowboy|gunner/.test(text)) return 'Fast Gunner';
  if (/bounce|ricochet|ejection/.test(text)) return 'Bounce';
  if (/shrapnel|fragment/.test(text)) return 'Shrapnel';
  return 'General';
}

export function ModModal({ isWeaponMod, onClose, onSelect, items, targetSlot }: {
  isWeaponMod: boolean; onClose: () => void; onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
  targetSlot?: string;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [selected, setSelected] = useState<EquippedItem | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string | null>(null);
  const mods: EquippedItem[] = items && items.length ? items : (modRegistry || [])
    .filter((m: any) => !m.tags?.includes('test-fixture'))
    .map((m: any) => {
      const iconSlug = (m.name || m.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return {
        id: m.id,
        name: m.name,
        category: isWeaponMod
          ? categorizeMod({ name: m.name, effectSummary: m.effectSummary, tags: m.tags, id: m.id, slug: iconSlug })
          : gearSlotLabel(m.modSlot),
        rarity: 'Rare' as Rarity,
        tier: 0,
        stars: 0,
        effectSummary: m.effectSummary,
        statModifiers: m.statModifiers,
        modType: m.modType,
        iconUrl: buildCdnUrl('mods', iconSlug),
        meta: { slot: m.modSlot, type: m.modType, suffixPool: verifiedSuffixPoolsByModId[m.id] },
      };
    });
  let filtered = mods.filter(m =>
    (cat === "All" || m.category === cat) &&
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  if (targetSlot && !isWeaponMod) {
    const normTarget = normalizeModSlot(targetSlot);
    filtered = filtered.filter(m => {
      const mSlot = normalizeModSlot(m.meta?.slot || (m as any).modSlot || m.category);
      return mSlot === normTarget;
    });
  }

  const accent = isWeaponMod ? VIOLET : CYAN;
  const title = isWeaponMod ? "Weapon Mod Selector" : "Armor Mod Selector";

  return (
    <ModalShell title={title} accent={accent} icon={<Zap size={14} />} onClose={onClose} width={800}>
      <div className="flex flex-col" style={{ width: 460, borderRight: `1px solid ${accent}12` }}>
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${accent}08` }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px]"
            style={{ background: `${accent}05`, border: `1px solid ${accent}18` }}>
            <Search size={11} style={{ color: "#4c6e80" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search mods, effects..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "#c0dde8", caretColor: accent }} />
          </div>
        </div>
        {/* Elemental/archetype category tabs only apply to weapon mods — gear
            mods aren't sub-categorized that way in-game (the Mods menu lists
            them flat per armor slot), so these tabs would only ever show
            "All" having results for an armor selector. */}
        {isWeaponMod && (
          <div className="flex flex-wrap gap-1 px-3 py-2"
            style={{ borderBottom: `1px solid ${accent}08` }}>
            {MOD_CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wide transition-all"
                style={{
                  background: cat === c ? `${accent}14` : `${accent}04`,
                  border: `1px solid ${cat === c ? accent + "40" : accent + "10"}`,
                  color: cat === c ? accent : "#4c6e80",
                }}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${accent}12 transparent` }}>
          {filtered.length === 0 ? (
            <EmptySlate message="No mods loaded — wire in your data source" icon={<Zap size={22} />} />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(m => (
                <button key={m.id} onClick={() => { setSelected(m); setSelectedSuffix(null); }}
                  className="text-left p-2 rounded-[3px] transition-all flex gap-2 items-center"
                  style={{
                    background: selected?.id === m.id ? `${accent}12` : `${accent}03`,
                    border: `1px solid ${selected?.id === m.id ? accent + "45" : accent + "10"}`,
                    borderLeft: `2px solid ${accent}`,
                  }}>
                  {m.iconUrl && (
                    <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                      <ImageWithFallback src={m.iconUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-1 mb-0.5">
                      <span className="text-[11px] font-bold truncate"
                        style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                        {m.name}
                      </span>
                      <ModTypeBadge modType={m.modType} />
                    </div>
                    <span className="text-[9px]" style={{ color: "#7ab8cc" }}>{m.category} {m.modType ? `· ${m.modType}` : ''}</span>
                    {m.effectSummary && (
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: '#6aa8c0' }}>
                        {m.effectSummary}
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
        {selected ? (() => {
          const suffixPool: string[] = (selected.meta as any)?.suffixPool || [];
          const needsSuffix = suffixPool.length > 0;
          const finalItem: EquippedItem = needsSuffix && selectedSuffix
            ? { ...selected, name: `${selected.name} (${selectedSuffix})`, id: `${selected.id}::${selectedSuffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }
            : selected;
          return (
            <>
              {needsSuffix && (
                <div className="mb-4">
                  <div className="text-[10px] font-bold tracking-wide mb-2" style={{ color: "#7ab8cc" }}>
                    SUFFIX (rolled affix — pick which one this drop has)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suffixPool.map((s) => (
                      <button key={s} onClick={() => setSelectedSuffix(s)}
                        className="px-2 py-1 rounded-[2px] text-[10px] font-bold tracking-wide transition-all"
                        style={{
                          background: selectedSuffix === s ? `${accent}18` : `${accent}05`,
                          border: `1px solid ${selectedSuffix === s ? accent + "50" : accent + "15"}`,
                          color: selectedSuffix === s ? accent : "#7ab8cc",
                        }}>
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <GenericDetail item={finalItem} accent={accent}
                onEquip={() => { if (needsSuffix && !selectedSuffix) return; onSelect(finalItem); onClose(); }} />
            </>
          );
        })() : (
          <EmptySlate message="Select a mod to view effect details" icon={<Zap size={28} />} />
        )}
      </div>
    </ModalShell>
  );
}
