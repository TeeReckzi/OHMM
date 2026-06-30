import React from "react";
import { ChevronRight, Cpu, Settings } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating, RarityBadge, ModTypeBadge } from "./ui/Primitives";
import { RemoveBadge } from "./RemoveBadge";
import type { EquippedItem } from "../types";
import { R_COLOR, CYAN, VIOLET, isWeaponItem } from "../types";

export function EquipmentSlot({
  label, icon, item, onClick, compact = false,
  onChangeStars, onChangeTier, onRemove,
}: {
  label: string; icon: React.ReactNode; item: EquippedItem | null;
  onClick: () => void; compact?: boolean;
  onChangeStars?: (stars: number) => void;
  onChangeTier?: (tier: number) => void;
  onRemove?: () => void;
}) {
  const rc = item ? R_COLOR[item.rarity] : CYAN;
  return (
    <button onClick={onClick}
      className="ohmm-slot-button relative w-full text-left transition-all duration-150 rounded-[3px] group"
      style={{
        background: item ? `${rc}08` : "rgba(0,200,255,0.025)",
        border: `1px solid ${item ? rc + "30" : "rgba(0,200,255,0.1)"}`,
        borderLeft: `2px solid ${item ? rc : "rgba(0,200,255,0.25)"}`,
      }}>
      {item && onRemove && <RemoveBadge onRemove={onRemove} />}
      <div className={`flex items-center gap-2 px-2 ${compact ? "py-[5px]" : "py-[7px]"}`}>
        <div className="flex items-center justify-center rounded-[2px] flex-shrink-0 overflow-hidden"
          style={{
            width: compact ? 26 : 30, height: compact ? 26 : 30,
            background: item ? `${rc}12` : "rgba(0,200,255,0.05)",
            border: `1px solid ${item ? rc + "25" : "rgba(0,200,255,0.08)"}`,
          }}>
          {item?.iconUrl ? (
            <ImageWithFallback
              src={item.iconUrl}
              alt={item.name}
              fallbackSrc={isWeaponItem(item) ? null : undefined}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span className="flex items-center justify-center" style={{ fontSize: compact ? 13 : 15, color: item ? rc : "var(--text-muted)" }}>{icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {item ? (
            <>
              <div className="text-[11px] font-semibold truncate leading-tight"
                style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                {item.name}
              </div>
              <div className="flex items-center gap-1 mt-[2px] min-w-0 max-w-full overflow-hidden">
                {item.tier > 0 && (
                  <span 
                    className="text-[8px] cursor-pointer hover:text-white flex-shrink-0" 
                    style={{ color: "#7ab8cc", fontFamily: "'JetBrains Mono', monospace" }}
                    onClick={(e) => { e.stopPropagation(); if (onChangeTier) onChangeTier((item.tier % 5) + 1); }}
                    title="Click to cycle crafted tier (the quality tier the item was crafted at)"
                  >
                    T{item.tier}
                  </span>
                )}
                {item.stars > 0 && (
                  <div className="flex-shrink-0" style={{ maxWidth: 52, overflow: "visible" }}>
                    <StarRating stars={item.stars} onChange={onChangeStars} />
                  </div>
                )}
                {!compact && <RarityBadge rarity={item.rarity} />}
                {compact && (
                  <span
                    className="flex-shrink-0 rounded-full"
                    title={item.rarity}
                    style={{ width: 5, height: 5, background: R_COLOR[item.rarity], boxShadow: `0 0 6px ${R_COLOR[item.rarity]}70` }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="text-[10px]" style={{ color: "#1e3a50", fontFamily: "'Rajdhani', sans-serif" }}>
              {label}
            </div>
          )}
        </div>
        <ChevronRight size={9}
          style={{ color: item ? rc + "50" : "#122030", flexShrink: 0 }}
          className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

export function ModTile({ item, onClick, onRemove }: { item: EquippedItem | null; onClick: () => void; onRemove?: () => void }) {
  const rc = item ? VIOLET : "rgba(0,200,255,0.15)";
  return (
    <button onClick={onClick}
      className="ohmm-tile-button relative flex flex-col items-center justify-center gap-[3px] transition-all duration-150 rounded-[3px] group flex-shrink-0"
      style={{
        width: 46, minHeight: 46,
        background: item ? `${rc}08` : "rgba(0,200,255,0.025)",
        border: `1px solid ${item ? rc + "35" : "rgba(0,200,255,0.1)"}`,
        borderTop: `2px solid ${item ? rc : "rgba(0,200,255,0.2)"}`,
      }}>
      {item && onRemove && <RemoveBadge onRemove={onRemove} />}
      {item?.iconUrl ? (
        <ImageWithFallback src={item.iconUrl} alt={item.name} style={{ width: 22, height: 22, objectFit: 'contain' }} />
      ) : (
        <Cpu size={13} style={{ color: item ? rc : "var(--text-faint)" }} />
      )}
      <div className="text-[7px] text-center leading-tight px-[3px] max-w-full overflow-hidden"
        style={{ color: item ? "#c0dde8" : "#1e3a50", fontFamily: "'Rajdhani', sans-serif" }}>
        {item ? item.name.split(" ")[0] : "MOD"}
      </div>
    </button>
  );
}

export function CalibrationTile({ item, onClick, onRemove }: { item: EquippedItem | null; onClick: () => void; onRemove?: () => void }) {
  const rc = item ? CYAN : "rgba(0,200,255,0.15)";
  const weaponDmg = item?.meta?.weaponDmgPercent;
  return (
    <button onClick={onClick} title="Weapon Calibration"
      className="ohmm-tile-button relative flex flex-col items-center justify-center gap-[3px] transition-all duration-150 rounded-[3px] group flex-shrink-0"
      style={{
        width: 46, minHeight: 46,
        background: item ? `${rc}10` : "rgba(0,200,255,0.025)",
        border: `1px solid ${item ? rc + "35" : "rgba(0,200,255,0.1)"}`,
        borderTop: `2px solid ${item ? rc : "rgba(0,200,255,0.2)"}`,
      }}>
      {item && onRemove && <RemoveBadge onRemove={onRemove} />}
      <Settings size={14} style={{ color: item ? CYAN : "#1e3a50" }} />
      <div className="text-[7px] text-center leading-tight px-[3px] max-w-full overflow-hidden"
        style={{ color: item ? "#c0dde8" : "#1e3a50", fontFamily: "'Rajdhani', sans-serif" }}>
        {item ? item.name.split(" / ")[0].split(" ")[0] : "CALIB"}
      </div>
      {item && typeof weaponDmg === "number" && (
        <div className="text-[7px] leading-none" style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
          {weaponDmg}%
        </div>
      )}
    </button>
  );
}

export function AttachTile({ label, icon, item, onClick, onRemove }: {
  label: string; icon: React.ReactNode; item: EquippedItem | null; onClick: () => void; onRemove?: () => void;
}) {
  const rc = item ? R_COLOR[item.rarity] : "rgba(0,200,255,0.15)";
  return (
    <button onClick={onClick}
      className="ohmm-tile-button relative flex flex-col items-center justify-center gap-[3px] py-2 transition-all rounded-[3px] group"
      style={{
        background: item ? `${rc}08` : "rgba(0,200,255,0.025)",
        border: `1px solid ${item ? rc + "30" : "rgba(0,200,255,0.08)"}`,
        borderTop: `2px solid ${item ? rc : "rgba(0,200,255,0.18)"}`,
      }}>
      {item && onRemove && <RemoveBadge onRemove={onRemove} />}
      {item?.iconUrl ? (
        <ImageWithFallback src={item.iconUrl} alt={item.name || label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
      ) : (
        <span className="flex items-center justify-center" style={{ color: item ? rc : "var(--text-faint)" }}>{icon}</span>
      )}
      <div className="text-[7px]" style={{ color: item ? "#c0dde8" : "#1e3a50" }}>{label}</div>
    </button>
  );
}

export function CradleTile({ index, item, onClick, onRemove }: {
  index: number; item: EquippedItem | null; onClick: () => void; onRemove?: () => void;
}) {
  const rc = item ? R_COLOR[item.rarity] : VIOLET;
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-[3px] py-2 transition-all rounded-[3px] group"
      style={{
        background: item ? `${rc}10` : "rgba(124,92,255,0.04)",
        border: `1px solid ${item ? rc + "35" : "rgba(124,92,255,0.12)"}`,
        borderTop: `2px solid ${item ? rc : "rgba(124,92,255,0.22)"}`,
      }}>
      {item && onRemove && <RemoveBadge onRemove={onRemove} />}
      {item?.iconUrl ? (
        <ImageWithFallback src={item.iconUrl} alt={item.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
      ) : (
        <Cpu size={12} style={{ color: item ? rc : VIOLET }} />
      )}
      <div className="text-[7px] text-center leading-tight px-1 max-w-full overflow-hidden"
        style={{ color: item ? "#c0dde8" : "#2a1a50", fontFamily: "'Rajdhani', sans-serif" }}>
        {item ? item.name.split(" ")[0] : `P${index + 1}`}
      </div>
    </button>
  );
}
