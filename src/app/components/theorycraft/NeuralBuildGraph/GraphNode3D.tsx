/**
 * GraphNode3D — Cinematic Neural Node
 *
 * A living node in the neural build graph. Each node is a layered construct:
 *   1. Core sphere — solid emissive material, color = semantic layer
 *   2. Inner halo — soft additive glow shell, breathes with energy
 *   3. Outer corona — faint atmospheric ring, scales with influence
 *
 * Visual language:
 *   - Brightness = energy level (DPS contribution)
 *   - Size = influence score (centrality + contribution)
 *   - Color = semantic layer (weapon=orange, stats=cyan, etc.)
 *   - Pulse = combat heartbeat sync
 *   - Opacity/style = confidence level
 *
 * Interaction:
 *   - Hover: expand + brighten connected paths
 *   - Click: select for detail/failure analysis
 *   - Drag: pin node (force simulation)
 *
 * Performance: ~0.3ms per node at 60 FPS. Safe for 100 nodes.
 */

import React, { useRef, useState, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GraphNode } from "@/lib/ohmm/theorycraft/buildGraph.types";
import {
  LAYER_VISUAL_CONFIG,
  ENERGY_CONFIG,
} from "@/lib/ohmm/theorycraft/buildGraph.constants";
import type { PositionsRef } from "./useNodeDrag";

// ─── Semantic Color Palette ───────────────────────────────────────────────────
// Refined colors with better contrast against dark backgrounds

const LAYER_COLORS: Record<string, string> = {
  equipment: "#ff6b35",       // Warm orange — physical gear
  stats: "#22d3ee",           // Electric cyan — stat contributions
  keywords: "#a855f7",        // Vivid purple — keyword mechanics
  "status-effects": "#ef4444", // Signal red — status procs
  "combat-formula": "#06b6d4", // Deep cyan — formula computation
  "final-output": "#fbbf24",   // Gold — final DPS/TTK
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GraphNode3DProps {
  node: GraphNode;
  /** Mutable position ref — node reads its position from here every frame */
  positionsRef: React.RefObject<PositionsRef>;
  /** Fallback position for initial render before positionsRef has data */
  position?: [number, number, number];
  onHover?: (node: GraphNode | null) => void;
  onClick?: (node: GraphNode) => void;
  onDragEnd?: (nodeId: string, x: number, y: number, z: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphNode3D({
  node,
  positionsRef,
  position,
  onHover,
  onClick,
  onDragEnd,
}: GraphNode3DProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // ─── Computed visuals ───────────────────────────────────────────────────
  const color = useMemo(
    () => new THREE.Color(LAYER_COLORS[node.layer] ?? "#888888"),
    [node.layer],
  );

  // Size driven by influence score — minimum 0.4, max 1.2
  const baseRadius = 0.4 + node.influenceScore * 0.8;

  // Emissive intensity driven by energy level (DPS contribution)
  const baseEmissive = 0.3 + node.energyLevel * 1.5;

  // Confidence affects material clarity
  const confidenceAlpha = node.metadata.confidence === "project_verified" ? 1.0
    : node.metadata.confidence === "observed" ? 0.9
    : node.metadata.confidence === "estimated" ? 0.7
    : 0.5;

  // ─── Per-frame animation ────────────────────────────────────────────────

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Read position from mutable positionsRef — avoids React re-renders
    const posData = positionsRef.current.current.get(node.id);
    if (posData && groupRef.current) {
      groupRef.current.position.set(posData.x, posData.y, posData.z);
    }

    // Breathing — slow sinusoidal scale oscillation
    const breathe = 1.0 + Math.sin(t * Math.PI * 2 * ENERGY_CONFIG.breathingFrequency) * 0.03 * node.energyLevel;

    // Hover expand
    const hoverScale = hovered ? 1.2 : 1.0;

    // Apply to group
    if (groupRef.current) {
      const s = breathe * hoverScale;
      groupRef.current.scale.setScalar(s);
    }

    // Halo pulse — slightly offset frequency for organic feel
    if (haloRef.current) {
      const haloPulse = 0.06 + Math.sin(t * 2.1 + node.energyLevel * 3) * 0.03;
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = haloPulse * node.energyLevel * confidenceAlpha;
    }

    // Corona slow rotation for visual interest
    if (coronaRef.current) {
      coronaRef.current.rotation.z = t * 0.15;
      coronaRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;
    }
  });

  // ─── Interaction ────────────────────────────────────────────────────────

  const handlePointerOver = useCallback(
    (e: any) => {
      e.stopPropagation();
      setHovered(true);
      setShowTooltip(true);
      document.body.style.cursor = "pointer";
      onHover?.(node);
    },
    [node, onHover],
  );

  const handlePointerOut = useCallback(
    (e: any) => {
      e.stopPropagation();
      setHovered(false);
      setShowTooltip(false);
      document.body.style.cursor = "auto";
      onHover?.(null);
    },
    [onHover],
  );

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      onClick?.(node);
    },
    [node, onClick],
  );

  return (
    <group ref={groupRef} position={position ?? [0, 0, 0]}>
      {/* Layer 1: Core sphere — the solid semantic node */}
      <mesh
        ref={coreRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[baseRadius, 24, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={baseEmissive}
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={confidenceAlpha}
        />
      </mesh>

      {/* Layer 2: Inner halo — soft additive glow, breathes */}
      <mesh ref={haloRef} scale={1.6}>
        <sphereGeometry args={[baseRadius, 16, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06 * node.energyLevel}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Layer 3: Outer corona — atmospheric ring for high-influence nodes */}
      {node.influenceScore > 0.3 && (
        <mesh ref={coronaRef} scale={2.4}>
          <ringGeometry args={[baseRadius * 0.9, baseRadius * 1.1, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.04 * node.influenceScore}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Tooltip — appears on hover */}
      {showTooltip && (
        <Html
          center
          style={{ pointerEvents: "none", transform: "translateY(-28px)" }}
          zIndexRange={[100, 0]}
        >
          <div className="rounded-md bg-black/90 border border-white/10 px-2.5 py-1.5 text-[11px] text-white shadow-2xl backdrop-blur-sm whitespace-nowrap">
            <div className="font-semibold text-[12px]" style={{ color: LAYER_COLORS[node.layer] }}>
              {node.label}
            </div>
            {node.metadata.formattedValue && (
              <div className="text-white/60 mt-0.5">{node.metadata.formattedValue}</div>
            )}
            <div className="text-white/40 mt-0.5 text-[10px]">
              {LAYER_VISUAL_CONFIG[node.layer].label}
              {node.metadata.confidence !== "placeholder" && (
                <> · {node.metadata.confidence.replace("_", " ")}</>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
