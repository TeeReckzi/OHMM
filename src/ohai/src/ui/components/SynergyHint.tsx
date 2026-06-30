import { Info } from "lucide-react";

interface SynergyHintProps {
 mechanic?: string;
 activePerks?: string[];
 activeGear?: string[];
}

export function SynergyHint({ mechanic, activePerks, activeGear }: SynergyHintProps) {
 const hints: string[] = [];

 if (mechanic === "burn") {
  hints.push("Gilded Gloves enables Burn crit");
  hints.push("BBQ Gloves doubles tick frequency");
  if (activePerks?.includes("status-enhancement")) {
   hints.push("Status Enhancement may improve Burn uptime");
  }
 }

 if (mechanic === "frostVortex") {
  hints.push("Frost Whisper Boots may enhance Frost Vortex");
 }

 if (mechanic === "powerSurge") {
  hints.push("Charged mod: +18% Power Surge DMG");
 }

 if (hints.length === 0) {
  return null;
 }

 return (
  <div
   style={{
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(46, 204, 113, 0.08)",
    border: "1px solid rgba(46, 204, 113, 0.18)",
    fontSize: "0.78rem",
    color: "#a8e6cf",
   }}
  >
   <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 2 }}>
    <Info size={14} />
    Synergy Hints
   </div>
   {hints.map((h, i) => (
    <span key={i} style={{ paddingLeft: 20 }}>
     {h}
    </span>
   ))}
  </div>
 );
}
