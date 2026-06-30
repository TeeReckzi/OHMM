import type { AnyCanonicalItem } from "../itemTypes";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EffectPreview } from "./EffectPreview";

interface ItemCardProps {
 item: AnyCanonicalItem;
 selected?: boolean;
 onClick?: () => void;
 compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
 weapon: "255, 136, 86",
 armor: "113, 151, 255",
 key_gear: "255, 82, 192",
 mod: "98, 220, 255",
 food: "46, 204, 113",
 drink: "52, 152, 219",
 deviation: "155, 89, 182",
 cradle_perk: "241, 196, 15",
 pve_target: "231, 76, 60",
};

export function ItemCard({ item, selected, onClick, compact }: ItemCardProps) {
 const rgb = CATEGORY_COLORS[item.category] ?? "137, 108, 255";

 return (
  <button
   onClick={onClick}
   style={{
    width: "100%",
    textAlign: "left",
    color: "#f3f6ff",
    borderRadius: 18,
    padding: compact ? 10 : 14,
    background: selected
     ? `rgba(${rgb}, 0.12)`
     : "rgba(255,255,255,0.035)",
    border: `1px solid ${
     selected ? `rgba(${rgb}, 0.38)` : "rgba(255,255,255,0.08)"
    }`,
    cursor: "pointer",
    transition: "border-color 140ms, transform 140ms, background 140ms",
    display: "flex",
    flexDirection: "column",
    gap: 6,
   }}
   onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = `rgba(${rgb}, 0.34)`;
    e.currentTarget.style.background = `rgba(${rgb}, 0.08)`;
    e.currentTarget.style.transform = "translateY(-1px)";
   }}
   onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = selected
     ? `rgba(${rgb}, 0.38)`
     : "rgba(255,255,255,0.08)";
    e.currentTarget.style.background = selected
     ? `rgba(${rgb}, 0.12)`
     : "rgba(255,255,255,0.035)";
    e.currentTarget.style.transform = "none";
   }}
  >
   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
    <strong style={{ fontSize: "0.92rem", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, lineHeight: 1.25 }}>
     {item.name}
    </strong>
    {!compact && <ConfidenceBadge level={item.confidence} needsReview={item.needsReview} />}
   </div>
   {!compact && (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
     {(item.tags ?? []).slice(0, 3).map((tag) => (
      <span
       key={tag}
       style={{
        fontSize: "0.7rem",
        padding: "2px 7px",
        borderRadius: 999,
        background: `rgba(${rgb}, 0.12)`,
        color: `rgba(255,255,255,0.7)`,
        border: `1px solid rgba(${rgb}, 0.18)`,
       }}
      >
       {tag}
      </span>
     ))}
    </div>
   )}
   <EffectPreview summary={item.effectSummary} compact />
  </button>
 );
}
