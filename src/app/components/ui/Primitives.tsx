import React, { useState } from "react";
import { Star, X, Zap, Cpu, Database } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Rarity, EquippedItem } from "../../types";
import { R_COLOR, CYAN } from "../../types";

// ─────────────────────────────────────────────────────────────
// REUSABLE PRIMITIVES
// ─────────────────────────────────────────────────────────────

export function StarRating({ stars, max = 6, onChange }: { stars: number; max?: number; onChange?: (newStars: number) => void }) {
  return (
    <div className="flex gap-[2px]" title="Blueprint stars (crafting blueprint level)">
      {Array.from({ length: max }, (_, i) => {
        const level = i + 1;
        return (
          <Star 
            key={i} 
            size={7}
            fill={i < stars ? "#fb923c" : "transparent"}
            stroke={i < stars ? "#fb923c" : "#6aa8c0"}
            onClick={onChange ? (e) => { e.stopPropagation(); onChange(level); } : undefined}
            className={onChange ? "cursor-pointer hover:scale-110 transition-transform" : ""}
          />
        );
      })}
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className="text-[8px] font-bold tracking-widest px-1 rounded-[2px]"
      style={{ color: R_COLOR[rarity], border: `1px solid ${R_COLOR[rarity]}35`, background: `${R_COLOR[rarity]}12` }}>
      {rarity.toUpperCase()}
    </span>
  );
}

export function ModTypeBadge({ modType }: { modType?: EquippedItem["modType"] }) {
  const VIOLET = "#7c5cff";
  const label = modType === "suffix" ? "SUFFIX" : modType === "core" ? "CORE" : "MOD";
  return (
    <span
      className="text-[8px] font-bold tracking-widest px-1 rounded-[2px]"
      style={{ color: VIOLET, border: `1px solid ${VIOLET}35`, background: `${VIOLET}12` }}>
      {label}
    </span>
  );
}

export function GlassPanel({ children, className = "", accent = CYAN }: {
  children: React.ReactNode; className?: string; accent?: string;
}) {
  return (
    <div className={`ohmm-glass rounded-[3px] ${className}`} style={{
      border: `1px solid ${accent}20`,
      }}>
      {children}
    </div>
  );
}

export function PanelSection({ label, accent = CYAN }: { label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="w-[3px] h-3 rounded-full flex-shrink-0"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase"
        style={{ color: `${accent}90`, fontFamily: "'Rajdhani', sans-serif" }}>
        {label}
      </span>
      <div className="flex-1 h-[1px]" style={{ background: `${accent}15` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL SHELL (used for all selector types)
// ─────────────────────────────────────────────────────────────

interface ModalShellProps {
  title: string;
  accent?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export function ModalShell({ title, accent = CYAN, icon, onClose, children, width = 860, height = 620 }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,5,12,0.88)", backdropFilter: "blur(10px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col rounded-[4px] overflow-hidden"
        style={{
          width, maxWidth: "96vw", height, maxHeight: "92vh",
          background: "rgba(2,9,18,0.98)",
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 80px ${accent}10, 0 0 160px ${accent}05`,
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{
            background: `${accent}06`,
            borderBottom: `1px solid ${accent}18`,
          }}>
          <div className="flex items-center gap-2">
            {icon && <span style={{ color: accent }}>{icon}</span>}
            <span className="text-[13px] font-bold tracking-[0.18em] uppercase"
              style={{ color: accent, fontFamily: "'Rajdhani', sans-serif" }}>
              {title}
            </span>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-[3px] transition-all hover:bg-white/5"
            aria-label="Close modal"
            title="Close modal">
            <X size={13} style={{ color: "#4c6e80" }} />
          </button>
        </div>
        {/* Body */}
        <div className="flex flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GENERIC DETAIL + EMPTY SLATE
// ─────────────────────────────────────────────────────────────

export function GenericDetail({ item, accent, onEquip }: {
  item: EquippedItem; accent: string; onEquip: () => void;
}) {
  const isMod = item.category?.toLowerCase().includes('mod') || !!item.modType;
  const showTierStars = !isMod && item.tier > 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      {item.iconUrl && (
        <div className="w-16 h-16 rounded bg-black/30 p-1 border border-white/10 self-start">
          <ImageWithFallback src={item.iconUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}
      <div>
        <h3 className="text-[18px] font-bold"
          style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
          {item.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {isMod ? <ModTypeBadge modType={item.modType} /> : <RarityBadge rarity={item.rarity} />}
          {showTierStars && (
            <>
              <span className="text-[9px]"
                style={{ color: "#7ab8cc", fontFamily: "'JetBrains Mono', monospace" }}
                title="Crafted tier of the item">
                T{item.tier}
              </span>
              <StarRating stars={item.stars} />
            </>
          )}
        </div>
      </div>

      {/* Effects / description */}
      {(item.effectSummary || item.description) && (
        <div className="p-2 rounded-[3px] text-[11px] leading-snug"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="uppercase tracking-[0.1em] text-[8px] mb-0.5" style={{ color: '#7ab8cc' }}>EFFECTS</div>
          <div style={{ color: '#c0dde8' }}>
            {item.effectSummary || item.description}
          </div>
        </div>
      )}

      {/* Stat modifiers */}
      {item.statModifiers && item.statModifiers.length > 0 && (
        <div>
          <div className="uppercase tracking-[0.1em] text-[8px] mb-1" style={{ color: '#7ab8cc' }}>MODIFIERS</div>
          <div className="flex flex-wrap gap-1">
            {item.statModifiers.map((mod, i) => {
              const val = typeof mod.value === 'number' ? (mod.unit === 'percent' ? `${(mod.value*100).toFixed(0)}%` : mod.value) : mod.value;
              return (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: `${accent}10`, border: `1px solid ${accent}25`, color: accent, fontFamily: "'JetBrains Mono', monospace" }}>
                  {mod.stat}: +{val}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="text-[9px]" style={{ color: '#6aa8c0' }}>
          {item.tags.slice(0, 6).join(' · ')}
        </div>
      )}

      {item.meta && Object.keys(item.meta).length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(item.meta).map(([k, v]) => (
            <div key={k} className="p-2 rounded-[3px]"
              style={{ background: `${accent}06`, border: `1px solid ${accent}14` }}>
              <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: "#7ab8cc" }}>{k}</div>
              <div className="text-[12px] font-bold"
                style={{ color: accent, fontFamily: "'JetBrains Mono', monospace" }}>
                {String(v)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onEquip}
        className="mt-auto py-2 rounded-[3px] text-[12px] font-bold tracking-[0.15em] transition-all inline-flex items-center justify-center gap-2"
        style={{
          background: `${accent}12`,
          border: `1px solid ${accent}38`,
          color: accent, fontFamily: "'Rajdhani', sans-serif",
        }}>
        <Zap size={12} />
        EQUIP
      </button>
    </div>
  );
}

export function EmptySlate({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
      <div style={{ color: "#4a8aa0", opacity: 0.7 }}>{icon}</div>
      <div className="text-[11px] text-center max-w-[180px] leading-relaxed"
        style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
        {message}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT HELPERS
// ─────────────────────────────────────────────────────────────

export const TT_STYLE = {
  backgroundColor: "rgba(2,9,18,0.96)",
  border: "1px solid rgba(0,200,255,0.2)",
  borderRadius: "3px",
  fontSize: "11px",
  color: "#c0dde8",
};

export function SimReady({ text = "Configure both loadouts to begin simulation" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex flex-col items-center gap-2">
        <Database size={20} style={{ color: "#4a8aa0" }} />
        <div className="text-[10px] text-center" style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
          {text}
        </div>
      </div>
    </div>
  );
}

export function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-[3px]"
      style={{ background: `${color}08`, border: `1px solid ${color}1e` }}>
      <div className="text-[8px] tracking-[0.15em] uppercase mb-0.5" style={{ color: "#7ab8cc" }}>{label}</div>
      <div className="text-[15px] font-bold leading-none"
        style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
    </div>
  );
}

export function pct(value: number | undefined, digits = 0): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function num(value: number | undefined, digits = 0): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function statValue(calcInput: any, key: string): number {
  return calcInput?.aggregationReport?.stats?.stats?.[key] ?? 0;
}
