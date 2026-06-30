import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import type { AnyCanonicalItem } from "../itemTypes";
import { ItemCard } from "./ItemCard";

interface ItemSelectorProps {
 items: AnyCanonicalItem[];
 selectedId: string;
 onSelect: (id: string) => void;
 placeholder?: string;
 compact?: boolean;
 showConfidence?: boolean;
 categoryFilter?: string;
}

export function ItemSelector({
 items,
 selectedId,
 onSelect,
 placeholder = "Search items...",
 compact,
 showConfidence,
 categoryFilter,
}: ItemSelectorProps) {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState("");

 const selected = useMemo(
  () => items.find((i) => i.id === selectedId),
  [items, selectedId]
 );

 const filtered = useMemo(() => {
  let result = items;
  if (categoryFilter) {
   result = result.filter((i) => i.category === categoryFilter);
  }
  if (query.trim()) {
   const q = query.toLowerCase();
   result = result.filter(
    (i) =>
     i.name.toLowerCase().includes(q) ||
     i.tags.some((t) => t.includes(q)) ||
     i.effectSummary.toLowerCase().includes(q)
   );
  }
  return result;
 }, [items, query, categoryFilter]);

 if (!open) {
  return (
   <button
    onClick={() => setOpen(true)}
    style={{
     width: "100%",
     textAlign: "left",
     color: "#f3f6ff",
     borderRadius: 18,
     padding: compact ? 10 : 14,
     background: "rgba(255,255,255,0.035)",
     border: "1px solid rgba(255,255,255,0.08)",
     cursor: "pointer",
     display: "flex",
     alignItems: "center",
     gap: 12,
     transition: "border-color 140ms",
    }}
    onMouseEnter={(e) => {
     e.currentTarget.style.borderColor = "rgba(137,108,255,0.34)";
    }}
    onMouseLeave={(e) => {
     e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
    }}
   >
    <div
     style={{
      width: 42,
      height: 42,
      borderRadius: 14,
      background: "rgba(137,108,255,0.12)",
      border: "1px solid rgba(137,108,255,0.22)",
      display: "grid",
      placeItems: "center",
      flex: "none",
      color: "#b9c4ff",
      fontSize: "0.75rem",
      fontWeight: 700,
     }}
    >
     {selected ? selected.name.charAt(0).toUpperCase() : "?"}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
     <strong
      style={{
       overflow: "hidden",
       textOverflow: "ellipsis",
       whiteSpace: "nowrap",
       fontSize: "0.88rem",
      }}
     >
      {selected ? selected.name : placeholder}
     </strong>
     {selected && (
      <span style={{ color: "#9ca7c4", fontSize: "0.76rem" }}>
       {selected.effectSummary}
      </span>
     )}
    </div>
   </button>
  );
 }

 return (
  <div
   style={{
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(1,3,8,0.58)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "flex-end",
   }}
   onClick={() => setOpen(false)}
  >
   <div
    style={{
     width: "min(460px, 100vw)",
     height: "100%",
     background: "rgba(10,13,23,0.96)",
     borderLeft: "1px solid rgba(137,108,255,0.22)",
     padding: 24,
     display: "flex",
     flexDirection: "column",
     gap: 18,
     boxShadow: "-20px 0 80px rgba(0,0,0,0.42)",
    }}
    onClick={(e) => e.stopPropagation()}
   >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
     <h3 style={{ margin: 0, textTransform: "capitalize" }}>
      {categoryFilter ?? "Select Item"}
     </h3>
     <button
      onClick={() => setOpen(false)}
      style={{
       borderRadius: 999,
       border: "1px solid rgba(255,255,255,0.08)",
       background: "rgba(255,255,255,0.04)",
       color: "#dce3f7",
       padding: "9px 12px",
       cursor: "pointer",
      }}
     >
      <X size={16} />
     </button>
    </div>

    <div
     style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderRadius: 16,
      padding: "12px 14px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
     }}
    >
     <Search size={16} style={{ color: "#8d95b3", flex: "none" }} />
     <input
      autoFocus
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      style={{
       width: "100%",
       border: 0,
       outline: 0,
       background: "transparent",
       color: "white",
      }}
     />
    </div>

    <div
     style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflow: "auto",
      paddingRight: 4,
     }}
    >
     {filtered.map((item) => (
      <ItemCard
       key={item.id}
       item={item}
       selected={item.id === selectedId}
       compact={compact}
       onClick={() => {
        onSelect(item.id);
        setOpen(false);
       }}
      />
     ))}
     {filtered.length === 0 && (
      <span style={{ color: "#8d95b3", textAlign: "center", padding: 20 }}>
       No items match your search.
      </span>
     )}
    </div>
   </div>
  </div>
 );
}
