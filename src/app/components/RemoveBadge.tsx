import React from "react";
import { X } from "lucide-react";

// Small "x" badge shown on hover over an equipped tile, lets the player clear
// that slot without opening its selector modal. stopPropagation keeps the
// click from also triggering the tile's own onClick (which opens the modal).
export function RemoveBadge({ onRemove }: { onRemove: () => void }) {
  const ORANGE = "#ff6b35";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      title="Remove"
      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ width: 14, height: 14, background: "#1a0a0a", border: "1px solid rgba(255,107,53,0.45)", color: ORANGE, zIndex: 2 }}>
      <X size={8} />
    </button>
  );
}