import { BarChart3 } from "lucide-react";

interface DeltaPreviewProps {
 currentValue?: number;
 newValue?: number;
 label?: string;
}

export function DeltaPreview({ currentValue, newValue, label }: DeltaPreviewProps) {
 if (currentValue === undefined || newValue === undefined) {
  return (
   <div
    style={{
     padding: "12px 14px",
     borderRadius: 14,
     background: "rgba(255,255,255,0.03)",
     border: "1px dashed rgba(255,255,255,0.12)",
     display: "flex",
     alignItems: "center",
     gap: 8,
     fontSize: "0.82rem",
     color: "#8d95b3",
    }}
   >
    <BarChart3 size={16} />
    Delta comparison will appear here when formula inputs change
   </div>
  );
 }

 const diff = newValue - currentValue;
 const pctChange = currentValue !== 0 ? ((diff / currentValue) * 100).toFixed(1) : "N/A";
 const isPositive = diff > 0;

 return (
  <div
   style={{
    padding: "10px 14px",
    borderRadius: 14,
    background: isPositive
     ? "rgba(46, 204, 113, 0.08)"
     : diff < 0
     ? "rgba(231, 76, 60, 0.08)"
     : "rgba(255,255,255,0.03)",
    border: `1px solid ${
     isPositive
      ? "rgba(46, 204, 113, 0.25)"
      : diff < 0
      ? "rgba(231, 76, 60, 0.25)"
      : "rgba(255,255,255,0.08)"
    }`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
   }}
  >
   <span style={{ color: "#aab4cf", fontSize: "0.82rem" }}>{label ?? "Delta"}</span>
   <span
    style={{
     fontWeight: 700,
     color: isPositive ? "#2ecc71" : diff < 0 ? "#e74c3c" : "#95a5a6",
    }}
   >
    {diff > 0 ? "+" : ""}{diff.toFixed(1)} ({pctChange}%)
   </span>
  </div>
 );
}
