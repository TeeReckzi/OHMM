import React from "react";
import { Settings, CheckCircle2, Database, Save } from "lucide-react";
import { CYAN, ORANGE, GREEN, OHMM_NAVBAR_LOGO } from "../../types";

// ─────────────────────────────────────────────────────────────
// APP HEADER
// ─────────────────────────────────────────────────────────────

export interface AppHeaderProps {
  onOpenSettings: () => void;
  onOpenSaveLoad: () => void;
}

export function AppHeader({ onOpenSettings, onOpenSaveLoad }: AppHeaderProps) {
  return (
    <div className="ohmm-app-header">
      {/* Left status row */}
      <div className="flex items-center gap-4">
        {[
          { label: "BUILD A", color: CYAN },
          { label: "ENEMY META", color: ORANGE },
          { label: "SIM READY", color: GREEN },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="ohmm-live-dot"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <span className="text-[9px] font-bold tracking-widest"
              style={{ color: s.color, fontFamily: "'Rajdhani', sans-serif" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Center logo */}
      <div className="flex items-center justify-center select-none" style={{ minWidth: 260 }}>
        <img className="ohmm-navbar-mark" src={OHMM_NAVBAR_LOGO} alt="OHMM Once Human Meta Metrics" />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <div className="ohmm-status-chip"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.16)", color: GREEN }}>
          <CheckCircle2 size={9} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>META DB LIVE</span>
        </div>
        {/* SIMULATION ENGINE badge relocated here next to META DB LIVE */}
        <div className="flex items-center text-[8px] px-1.5 py-0.5 rounded-[3px]"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)", color: GREEN }}>
          SIMULATION ENGINE v2.4
        </div>
        <div className="ohmm-status-chip">
          <Database size={9} style={{ color: CYAN }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>v2.4.1</span>
        </div>
        <button onClick={onOpenSaveLoad} className="ohmm-icon-btn" title="Save / Load Builds">
          <Save size={12} style={{ color: "#7ab8cc" }} />
        </button>
        <button onClick={onOpenSettings} className="ohmm-icon-btn" title="Settings">
          <Settings size={12} style={{ color: "#7ab8cc" }} />
        </button>
      </div>
    </div>
  );
}
