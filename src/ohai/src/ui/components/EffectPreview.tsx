interface EffectPreviewProps {
 summary: string;
 compact?: boolean;
}

export function EffectPreview({ summary, compact }: EffectPreviewProps) {
 return (
  <span
   style={{
    color: compact ? "#aab4cf" : "#bfc8e4",
    fontSize: compact ? "0.78rem" : "0.86rem",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: compact ? 1 : 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
   }}
  >
   {summary || "No effect summary available."}
  </span>
 );
}
