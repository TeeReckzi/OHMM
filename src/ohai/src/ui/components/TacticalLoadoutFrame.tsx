import React from "react";

export type TacticalNodeState =
 | "verified"
 | "estimated"
 | "experimental"
 | "contested"
 | "optimized";

export interface TacticalLoadoutNode {
 id: string;
 label: string;
 equippedItem?: string;
 state?: TacticalNodeState;
 synergyActive?: boolean;
 warning?: string;
}

export interface TacticalLoadoutFrameProps {
 nodes: TacticalLoadoutNode[];
 activeElement?: "burn" | "frost" | "shock" | "fortress" | "weakspot";
 onSelectNode?: (nodeId: string) => void;
}

const stateGlow: Record<TacticalNodeState, string> = {
 verified: "rgba(99, 255, 180, 0.75)",
 estimated: "rgba(255, 210, 90, 0.75)",
 experimental: "rgba(255, 120, 120, 0.75)",
 contested: "rgba(255, 80, 160, 0.75)",
 optimized: "rgba(120, 180, 255, 0.9)"
};

const elementAccent: Record<NonNullable<TacticalLoadoutFrameProps["activeElement"]>, string> = {
 burn: "linear-gradient(180deg, rgba(255,110,40,0.18), rgba(255,40,40,0.04))",
 frost: "linear-gradient(180deg, rgba(90,180,255,0.18), rgba(120,140,255,0.04))",
 shock: "linear-gradient(180deg, rgba(180,120,255,0.18), rgba(120,100,255,0.04))",
 fortress: "linear-gradient(180deg, rgba(100,200,255,0.18), rgba(80,120,255,0.04))",
 weakspot: "linear-gradient(180deg, rgba(255,220,120,0.18), rgba(255,170,40,0.04))"
};

const nodeLayout: Record<string, React.CSSProperties> = {
 head: { top: "6%", left: "44%" },
 mask: { top: "18%", left: "44%" },
 chest: { top: "34%", left: "44%" },
 gloves: { top: "38%", left: "24%" },
 pants: { top: "56%", left: "44%" },
 boots: { top: "78%", left: "44%" },
 weapon: { top: "44%", left: "72%" }
};

export function TacticalLoadoutFrame({
 nodes,
 activeElement = "burn",
 onSelectNode
}: TacticalLoadoutFrameProps): React.ReactElement {
 return (
  <div
   style={{
    position: "relative",
    width: 420,
    height: 760,
    borderRadius: 32,
    overflow: "hidden",
    background: elementAccent[activeElement],
    border: "1px solid rgba(120,140,255,0.18)",
    boxShadow: "0 0 40px rgba(90,110,255,0.08)",
    backdropFilter: "blur(18px)"
   }}
  >
   <div
    style={{
     position: "absolute",
     inset: 0,
     background:
      "radial-gradient(circle at center, rgba(120,140,255,0.12), transparent 58%)"
    }}
   />

   <svg
    viewBox="0 0 420 760"
    style={{
     position: "absolute",
     inset: 0,
     width: "100%",
     height: "100%",
     opacity: 0.45
    }}
   >
    <path
     d="M210 60 L250 140 L250 300 L310 420 L280 700 L140 700 L110 420 L170 300 L170 140 Z"
     fill="none"
     stroke="rgba(140,160,255,0.25)"
     strokeWidth="2"
    />

    <path
     d="M170 220 L110 340"
     stroke="rgba(140,160,255,0.2)"
     strokeWidth="2"
    />

    <path
     d="M250 220 L310 340"
     stroke="rgba(140,160,255,0.2)"
     strokeWidth="2"
    />
   </svg>

   {nodes.map((node) => {
    const glow = stateGlow[node.state ?? "estimated"];

    return (
     <button
      key={node.id}
      onClick={() => onSelectNode?.(node.id)}
      style={{
       position: "absolute",
       width: 96,
       minHeight: 96,
       borderRadius: 24,
       border: `1px solid ${glow}`,
       background: "rgba(8,10,24,0.88)",
       color: "white",
       padding: 12,
       cursor: "pointer",
       transition: "all 160ms ease",
       boxShadow: node.synergyActive
        ? `0 0 28px ${glow}`
        : `0 0 12px rgba(0,0,0,0.3)`,
       ...nodeLayout[node.id]
      }}
     >
      <div
       style={{
        fontSize: 11,
        opacity: 0.65,
        textTransform: "uppercase",
        letterSpacing: 1.6,
        marginBottom: 6
       }}
      >
       {node.label}
      </div>

      <div
       style={{
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1.25
       }}
      >
       {node.equippedItem ?? "Empty Slot"}
      </div>

      {node.warning ? (
       <div
        style={{
         marginTop: 8,
         fontSize: 10,
         color: "#ffcf66",
         opacity: 0.9
        }}
       >
        {node.warning}
       </div>
      ) : null}
     </button>
    );
   })}
  </div>
 );
}
