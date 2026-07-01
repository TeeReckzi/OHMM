import React, { useState } from "react";
import { Settings, Zap } from "lucide-react";
import { ModalShell, EmptySlate } from "../ui/Primitives";
import type { Rarity, EquippedItem } from "../../types";
import { CYAN } from "../../types";

// ─────────────────────────────────────────────────────────────
// MODAL — WEAPON CALIBRATION SELECTOR
// ─────────────────────────────────────────────────────────────

export const CALIBRATION_OPTIONS = [
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

export interface CalibrationModalProps {
  onClose: () => void;
  onSelect: (item: EquippedItem) => void;
  items?: EquippedItem[];
}

export function CalibrationModal({ onClose, onSelect, items }: CalibrationModalProps) {
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
