import React, { useState } from "react";
import { Settings, RefreshCw } from "lucide-react";
import { ModalShell } from "../ui/Primitives";
import { CYAN, ORANGE } from "../../types";

// ─────────────────────────────────────────────────────────────
// MODAL — SETTINGS
// ─────────────────────────────────────────────────────────────

// Two-step in-app confirm (click RESET, button flips to CONFIRM?, click again
// to actually run it) instead of window.confirm — native dialogs can't be
// styled to match the app and are awkward to drive via browser automation.
// Stays armed indefinitely until confirmed or the modal is closed/reopened
// (which remounts this component and clears the state naturally).
function ResetRow({ label, desc, onConfirm }: { label: string; desc: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[3px]"
      style={{ background: "rgba(255,107,53,0.04)", border: "1px solid rgba(255,107,53,0.16)" }}>
      <div>
        <div className="text-[11px] font-semibold" style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>{label}</div>
        <div className="text-[9px] mt-0.5" style={{ color: "#5a7a8a" }}>{desc}</div>
      </div>
      <button
        onClick={() => { if (armed) { onConfirm(); setArmed(false); } else { setArmed(true); } }}
        className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-[3px] font-bold flex-shrink-0"
        style={{
          background: armed ? "rgba(255,107,53,0.22)" : "rgba(255,107,53,0.1)",
          border: `1px solid ${armed ? "rgba(255,107,53,0.6)" : "rgba(255,107,53,0.3)"}`,
          color: ORANGE, fontFamily: "'Rajdhani', sans-serif",
        }}>
        <RefreshCw size={10} />
        {armed ? "CONFIRM?" : "RESET"}
      </button>
    </div>
  );
}

export interface SettingsModalProps {
  onClose: () => void;
  onResetOffensive: () => void;
  onResetDefensive: () => void;
}

export function SettingsModal({ onClose, onResetOffensive, onResetDefensive }: SettingsModalProps) {
  return (
    <ModalShell title="Settings" accent={CYAN} icon={<Settings size={14} />} onClose={onClose} width={460} height={320}>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "#4a8aa0" }}>Loadout</div>
        <ResetRow label="Reset Offensive Loadout" desc="Clears every selection in the offensive (Build A) panel." onConfirm={onResetOffensive} />
        <ResetRow label="Reset Enemy Meta Loadout" desc="Clears every selection in the PvP enemy panel." onConfirm={onResetDefensive} />
        <div className="text-[9px] mt-1" style={{ color: "#3a5a6a" }}>
          Tip: hover any equipped tile and click the × badge to remove just that one item without opening this menu.
        </div>
      </div>
    </ModalShell>
  );
}
