/**
 * DirectedParticles — GPU-Instanced Directional Energy Flow
 *
 * Particles travel FROM source TO target along each edge, communicating:
 *   - Direction of influence/damage flow
 *   - Speed proportional to edge category (fast = damage, slow = passive)
 *   - Brightness proportional to edge weight
 *   - Color matches edge category semantic
 *
 * Architecture:
 *   - Single InstancedMesh for ALL particles (one draw call)
 *   - Pre-allocated particle data array (no per-frame allocations)
 *   - Eased motion: particles accelerate from source, decelerate near target
 *   - Staggered offsets per particle for organic stream effect
 *   - Additive blending for glow/bloom interaction
 *
 * Performance: single draw call regardless of particle count.
 * Budget: <0.5ms for 200 particles at 60 FPS.
 *
 * HOOKS SAFETY: useFrame is called unconditionally. Early return is inside the callback.
 */

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GraphEdge } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { EDGE_VISUAL_CONFIG, LOD_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DirectedParticlesProps {
  edges: GraphEdge[];
  positions: Map<string, { x: number; y: number; z: number }>;
  /** Max particles per edge (1–8, driven by LOD) */
  particleCount?: number;
}

// ─── Pre-allocated Structures ─────────────────────────────────────────────────

interface ParticleSlot {
  sx: number; sy: number; sz: number; // source
  tx: number; ty: number; tz: number; // target
  cx: number; cy: number; cz: number; // control point (for curved path)
  speed: number;
  offset: number;
  scale: number; // size variation
}

// ─── Easing ───────────────────────────────────────────────────────────────────

/** Ease-in-out cubic — accelerate from source, decelerate near target */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Control Point for Curved Particle Paths ──────────────────────────────────

function curveControlY(sy: number, ty: number, dist: number): number {
  // Lift the midpoint slightly for arc motion
  return (sy + ty) * 0.5 + Math.min(dist * 0.08, 3);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DirectedParticles({
  edges,
  positions,
  particleCount = LOD_CONFIG.maxParticlesPerEdge,
}: DirectedParticlesProps): JSX.Element | null {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-allocate a reusable Object3D for matrix computation (no per-frame alloc)
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const clampedCount = Math.max(1, Math.min(8, particleCount));

  // Build particle slot data — only recomputes when edges/positions change
  const slots = useMemo((): ParticleSlot[] => {
    const result: ParticleSlot[] = [];

    for (const edge of edges) {
      const src = positions.get(edge.source);
      const tgt = positions.get(edge.target);
      if (!src || !tgt) continue;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dz = tgt.z - src.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Skip very short edges (nodes nearly overlapping)
      if (dist < 0.5) continue;

      const edgeConfig = EDGE_VISUAL_CONFIG[edge.category];
      const speed = edgeConfig.particleSpeed;

      // Control point for curved path
      const cy = curveControlY(src.y, tgt.y, dist);

      for (let i = 0; i < clampedCount; i++) {
        result.push({
          sx: src.x, sy: src.y, sz: src.z,
          tx: tgt.x, ty: tgt.y, tz: tgt.z,
          cx: (src.x + tgt.x) * 0.5,
          cy,
          cz: (src.z + tgt.z) * 0.5,
          speed,
          offset: i / clampedCount,
          // Size variation: leading particles slightly larger
          scale: 0.8 + (1 - i / clampedCount) * 0.4,
        });
      }
    }

    return result;
  }, [edges, positions, clampedCount]);

  // Compute a representative color for the instanced material
  // (InstancedMesh with single material — we use the dominant edge category color)
  const materialColor = useMemo(() => {
    if (edges.length === 0) return new THREE.Color("#ff8844");
    // Use the highest-weight edge's particle color for the material
    let best = edges[0];
    for (let i = 1; i < edges.length; i++) {
      if (edges[i].weight > best.weight) best = edges[i];
    }
    return new THREE.Color(EDGE_VISUAL_CONFIG[best.category].particleColor);
  }, [edges]);

  // ─── Per-frame animation (UNCONDITIONAL — hooks rules) ──────────────────
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || slots.length === 0) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];

      // Raw progress along path [0, 1], repeating
      const rawT = ((time * s.speed * 0.25 + s.offset) % 1.0);

      // Apply easing — accelerate from source, decelerate near target
      const t = easeInOutCubic(rawT);

      // Quadratic bezier interpolation: P = (1-t)²·S + 2(1-t)t·C + t²·T
      const oneMinusT = 1 - t;
      const a = oneMinusT * oneMinusT;
      const b = 2 * oneMinusT * t;
      const c = t * t;

      const x = a * s.sx + b * s.cx + c * s.tx;
      const y = a * s.sy + b * s.cy + c * s.ty;
      const z = a * s.sz + b * s.cz + c * s.tz;

      // Scale: particles shrink near endpoints (fade in/out)
      const edgeFade = Math.sin(rawT * Math.PI); // 0 at start/end, 1 at midpoint
      const finalScale = s.scale * (0.4 + edgeFade * 0.6) * 0.12;

      tempObj.position.set(x, y, z);
      tempObj.scale.setScalar(finalScale);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  // Don't render if no slots (hooks already called above — safe)
  if (slots.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, slots.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial
        color={materialColor}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
