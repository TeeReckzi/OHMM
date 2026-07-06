/**
 * GraphScene — Neural Build Graph 3D Scene
 *
 * Cinematic R3F scene with:
 * - Force-directed node layout
 * - Curved energy conduit edges
 * - Directional flow particles
 * - Emissive node materials with bloom-ready glow
 * - Dark atmospheric background
 *
 * Default export for React.lazy() compatibility.
 */

import React, { useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { BuildGraphViewModel } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { LOD_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";
import { useForceGraph } from "./useForceGraph";
import { GraphNode3D } from "./GraphNode3D";
import { GraphEdge3D } from "./GraphEdge3D";
import { DirectedParticles } from "./DirectedParticles";
import { useRef, useState } from "react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GraphSceneProps {
  viewModel: BuildGraphViewModel;
  showCohesion?: boolean;
  showAnalytics?: boolean;
  enableFailureMode?: boolean;
  enableTemporalPlayback?: boolean;
}

// ─── Inner Scene ──────────────────────────────────────────────────────────────

function SceneContent({ viewModel }: { viewModel: BuildGraphViewModel }): JSX.Element {
  const { positionsRef, pinNode } = useForceGraph(viewModel);

  // Bridge: read positions from mutable ref into a snapshot for rendering.
  // This useState + useFrame pattern provides the render trigger while keeping
  // the force loop itself free of setState. The re-render is driven by frameId
  // changes, not by the simulation tick itself.
  // Note: renderFrameId value is intentionally unused — setState triggers re-render.
  const [, setRenderFrameId] = useState(0);
  const lastFrameIdRef = useRef(0);

  useFrame(() => {
    const currentFrameId = positionsRef.current.frameId;
    if (currentFrameId !== lastFrameIdRef.current) {
      lastFrameIdRef.current = currentFrameId;
      setRenderFrameId(currentFrameId);
    }
  });

  // Read positions from the mutable ref for this render
  const positions = positionsRef.current.current;

  const nodeCount = viewModel.nodes.length;
  const particleCount = useMemo(() => {
    if (nodeCount > LOD_CONFIG.particleDisableThreshold) return 0;
    if (nodeCount > LOD_CONFIG.fullQualityMaxNodes) return LOD_CONFIG.reducedParticlesPerEdge;
    return LOD_CONFIG.maxParticlesPerEdge;
  }, [nodeCount]);

  const handleDragEnd = useCallback(
    (nodeId: string, x: number, y: number, z: number) => {
      pinNode(nodeId, x, y, z);
    },
    [pinNode],
  );

  return (
    <>
      {/* Lighting: dark ambient + warm key + cool fill */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[20, 30, 15]} intensity={0.3} color="#ffeedd" />
      <pointLight position={[-25, -20, -20]} intensity={0.15} color="#4488ff" decay={2} distance={100} />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        panSpeed={0.4}
        minDistance={10}
        maxDistance={100}
        enablePan
      />

      {/* Edges */}
      {viewModel.edges.map((edge) => {
        const srcPos = positions.get(edge.source);
        const tgtPos = positions.get(edge.target);
        if (!srcPos || !tgtPos) return null;
        return (
          <GraphEdge3D
            key={edge.id}
            edge={edge}
            sourcePos={[srcPos.x, srcPos.y, srcPos.z]}
            targetPos={[tgtPos.x, tgtPos.y, tgtPos.z]}
          />
        );
      })}

      {/* Nodes */}
      {viewModel.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return (
          <GraphNode3D
            key={node.id}
            node={node}
            positionsRef={positionsRef}
            onDragEnd={handleDragEnd}
          />
        );
      })}

      {/* Particles */}
      {particleCount > 0 && (
        <DirectedParticles
          edges={viewModel.edges}
          positions={positions}
          particleCount={particleCount}
        />
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function GraphScene({ viewModel }: GraphSceneProps): JSX.Element {
  return (
    <div style={{ width: "100%", height: 500 }}>
      <Canvas
        camera={{ position: [0, 0, 40], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
        }}
        style={{ width: "100%", height: "100%", background: "#06080c" }}
      >
        <SceneContent viewModel={viewModel} />
      </Canvas>
    </div>
  );
}

export default GraphScene;
