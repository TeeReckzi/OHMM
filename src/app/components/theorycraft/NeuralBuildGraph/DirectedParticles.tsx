import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GraphEdge, EdgeCategory } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { EDGE_VISUAL_CONFIG, LOD_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DirectedParticlesProps {
  edges: GraphEdge[];
  positionsRef: React.RefObject<any>; // type PositionsRef
  /** Max particles per edge (1–8, driven by LOD) */
  particleCount?: number;
  activeEdgeId?: string | null;
}

// ─── Pre-allocated Structures ─────────────────────────────────────────────────

interface ParticleSlot {
  edgeId: string;
  sourceId: string;
  targetId: string;
  category: EdgeCategory;
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

// ─── Color Helper (exported for property testing) ─────────────────────────────

/**
 * Builds the Float32Array containing per-instance particle colors.
 * Rebuilt only when edges/LOD configuration changes.
 */
export function buildParticleColors(slots: ParticleSlot[]): Float32Array {
  const array = new Float32Array(slots.length * 3);
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const colorHex = EDGE_VISUAL_CONFIG[s.category]?.particleColor ?? "#ffffff";
    const color = new THREE.Color(colorHex);
    array[i * 3] = color.r;
    array[i * 3 + 1] = color.g;
    array[i * 3 + 2] = color.b;
  }
  return array;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DirectedParticles({
  edges,
  positionsRef,
  particleCount = LOD_CONFIG.maxParticlesPerEdge,
  activeEdgeId = null,
}: DirectedParticlesProps): JSX.Element | null {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-allocate a reusable Object3D for matrix computation (no per-frame alloc)
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const clampedCount = Math.max(1, Math.min(8, particleCount));

  // Build particle slot data — only recomputes when edges change
  const slots = useMemo((): ParticleSlot[] => {
    const result: ParticleSlot[] = [];

    for (const edge of edges) {
      const edgeConfig = EDGE_VISUAL_CONFIG[edge.category];
      const speed = edgeConfig.particleSpeed;

      for (let i = 0; i < clampedCount; i++) {
        result.push({
          edgeId: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
          category: edge.category,
          speed,
          offset: i / clampedCount,
          // Size variation: leading particles slightly larger
          scale: 0.8 + (1 - i / clampedCount) * 0.4,
        });
      }
    }

    return result;
  }, [edges, clampedCount]);

  // Compute per-instance colors (Req 9.1, 9.2)
  const colorArray = useMemo(() => buildParticleColors(slots), [slots]);

  // ─── Per-frame animation (UNCONDITIONAL — hooks rules) ──────────────────
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || slots.length === 0 || !positionsRef.current) return;

    const time = clock.getElapsedTime();
    const positions = positionsRef.current.current;

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const src = positions.get(s.sourceId);
      const tgt = positions.get(s.targetId);

      if (!src || !tgt) {
        tempObj.scale.setScalar(0);
        tempObj.updateMatrix();
        mesh.setMatrixAt(i, tempObj.matrix);
        continue;
      }

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dz = tgt.z - src.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 0.5) {
        tempObj.scale.setScalar(0);
        tempObj.updateMatrix();
        mesh.setMatrixAt(i, tempObj.matrix);
        continue;
      }

      const cy = curveControlY(src.y, tgt.y, dist);

      // Detect active edge for playback particle burst (Req 7.8)
      const isEdgeActive = activeEdgeId != null && s.edgeId === activeEdgeId;
      const speedMultiplier = isEdgeActive ? 2.5 : 1.0;
      const sizeMultiplier = isEdgeActive ? 2.0 : 1.0;

      // Raw progress along path [0, 1], repeating — active edge runs faster
      const rawT = ((time * s.speed * 0.25 * speedMultiplier + s.offset) % 1.0);

      // Apply easing — accelerate from source, decelerate near target
      const t = easeInOutCubic(rawT);

      // Quadratic bezier interpolation: P = (1-t)²·S + 2(1-t)t·C + t²·T
      const oneMinusT = 1 - t;
      const a = oneMinusT * oneMinusT;
      const b = 2 * oneMinusT * t;
      const c = t * t;

      const cx = (src.x + tgt.x) * 0.5;
      const cz = (src.z + tgt.z) * 0.5;

      const x = a * src.x + b * cx + c * tgt.x;
      const y = a * src.y + b * cy + c * tgt.y;
      const z = a * src.z + b * cz + c * tgt.z;

      // Scale: particles shrink near endpoints (fade in/out) — active edge has larger burst size
      const edgeFade = Math.sin(rawT * Math.PI); // 0 at start/end, 1 at midpoint
      const finalScale = s.scale * (0.4 + edgeFade * 0.6) * 0.12 * sizeMultiplier;

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
      <sphereGeometry args={[1, 6, 4]}>
        <instancedBufferAttribute
          attach="attributes-aColor"
          args={[colorArray, 3]}
        />
      </sphereGeometry>
      <meshBasicMaterial
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        onBeforeCompile={(shader) => {
          shader.vertexShader = `
            attribute vec3 aColor;
            varying vec3 vColor;
            ${shader.vertexShader}
          `.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            vColor = aColor;
            `
          );

          shader.fragmentShader = `
            varying vec3 vColor;
            ${shader.fragmentShader}
          `.replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `vec4 diffuseColor = vec4( vColor, opacity );`
          );
        }}
      />
    </instancedMesh>
  );
}
