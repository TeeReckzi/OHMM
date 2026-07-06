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

import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { BuildGraphViewModel } from "@/lib/ohmm/theorycraft/buildGraph.types";
import type { GraphNode } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { LOD_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";
import { useForceGraph } from "./useForceGraph";
import { useCinematicCamera } from "./useCinematicCamera";
import { GraphNode3D } from "./GraphNode3D";
import { GraphEdge3D } from "./GraphEdge3D";
import { DirectedParticles } from "./DirectedParticles";
import { useLOD, type LODState } from "./useLOD";
import { HeartbeatEngine } from "./HeartbeatEngine";
import { TemporalPlayback, type UseTemporalPlaybackResult } from "./TemporalPlayback";
import { FailureModeOverlay } from "./FailureModeOverlay";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { CohesionIndicator } from "./CohesionIndicator";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GraphSceneProps {
  viewModel: BuildGraphViewModel;
  showCohesion?: boolean;
  showAnalytics?: boolean;
  enableFailureMode?: boolean;
  enableTemporalPlayback?: boolean;
}

// ─── Postprocessing Wrapper (Graceful Degradation) ────────────────────────────

const PostprocessingWrapper = ({ children, enabled }: { children: React.ReactNode; enabled: boolean }) => {
  const [composer, setComposer] = useState<{ EffectComposer: any; Bloom: any } | null>(null);

  useEffect(() => {
    import("@react-three/postprocessing")
      .then((mod) => {
        setComposer({ EffectComposer: mod.EffectComposer, Bloom: mod.Bloom });
      })
      .catch((err) => {
        console.warn("Failed to load @react-three/postprocessing, rendering without bloom", err);
      });
  }, []);

  if (!enabled || !composer) return <>{children}</>;
  const { EffectComposer, Bloom } = composer;
  return (
    <EffectComposer>
      {children}
      <Bloom luminanceThreshold={0.6} intensity={1.2} radius={0.7} />
    </EffectComposer>
  );
};

// ─── Inner Scene ──────────────────────────────────────────────────────────────

function SceneContent({
  viewModel,
  lod,
  energyOverrides,
  activeEdgeId,
  selectedNodeId,
  setSelectedNodeId,
}: {
  viewModel: BuildGraphViewModel;
  lod: LODState;
  energyOverrides: Map<string, number>;
  activeEdgeId: string | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}): JSX.Element {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Enable layer 0 (edges/particles) and layer 1 (blooming nodes) on the camera
  useEffect(() => {
    camera.layers.enable(0);
    camera.layers.enable(1);
  }, [camera]);

  // Stable onSettled callback — triggers zoom-to-fit when simulation settles (Req 4.1)
  const cameraAPIRef = useRef<ReturnType<typeof useCinematicCamera> | null>(null);
  const handleSettled = useCallback(
    (positions: Map<string, { x: number; y: number; z: number }>) => {
      cameraAPIRef.current?.zoomToFit(positions);
    },
    [],
  );

  // Call useForceGraph unconditionally with onSettled callback and LOD ticks (Req 3.1)
  const { positionsRef, simulationRef } = useForceGraph(viewModel, handleSettled, lod.ticksPerFrame);

  // Call useCinematicCamera unconditionally (Req 3.1)
  const cameraAPI = useCinematicCamera(positionsRef, controlsRef);
  // Keep cameraAPIRef in sync so the stable handleSettled can access it
  cameraAPIRef.current = cameraAPI;

  // Node click handler: set selection and trigger focusOnNode (Req 4.2)
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNodeId(node.id);
      cameraAPIRef.current?.focusOnNode(node.id);
    },
    [setSelectedNodeId],
  );

  // Bridge: read positions from mutable ref into a snapshot for rendering.
  // This useState + useFrame pattern provides the render trigger while keeping
  // the force loop itself free of setState. The re-render is driven by frameId
  // changes, not by the simulation tick itself.
  // Note: renderFrameId value is intentionally unused — setState triggers re-render.
  const [, setRenderFrameId] = useState(0);
  const lastFrameIdRef = useRef(0);

  useFrame(() => {
    const currentFrameId = positionsRef.current?.frameId ?? 0;
    if (currentFrameId !== lastFrameIdRef.current) {
      lastFrameIdRef.current = currentFrameId;
      setRenderFrameId(currentFrameId);
    }
  });

  // Read positions from the mutable ref for this render
  const positions = positionsRef.current?.current ?? new Map();

  // Derive particle count based on LOD state
  const particleCount = lod.enableParticles ? lod.particlesPerEdge : 0;

  return (
    <>
      {/* Lighting: dark ambient + warm key + cool fill */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[20, 30, 15]} intensity={0.3} color="#ffeedd" />
      <pointLight position={[-25, -20, -20]} intensity={0.15} color="#4488ff" decay={2} distance={100} />

      {/* Controls — ref shared between cinematic camera hook and drag hooks */}
      <OrbitControls
        ref={controlsRef}
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
        return (
          <GraphEdge3D
            key={edge.id}
            edge={edge}
            positionsRef={positionsRef}
            isActive={activeEdgeId === edge.id}
          />
        );
      })}

      {/* Nodes — positionsRef passed for useFrame position reading, onClick for selection */}
      {viewModel.nodes.map((node) => {
        const energyOverride = energyOverrides.get(node.id);
        return (
          <GraphNode3D
            key={node.id}
            node={node}
            positionsRef={positionsRef}
            simulationRef={simulationRef}
            controlsRef={controlsRef}
            onClick={handleNodeClick}
            isSelected={selectedNodeId === node.id}
            energyOverride={energyOverride}
          />
        );
      })}

      {/* Particles */}
      {particleCount > 0 && (
        <DirectedParticles
          edges={viewModel.edges}
          positionsRef={positionsRef}
          particleCount={particleCount}
          activeEdgeId={activeEdgeId}
        />
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function GraphScene({
  viewModel,
  showCohesion = true,
  showAnalytics = false,
  enableFailureMode = false,
}: GraphSceneProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const lod = useLOD(viewModel.nodes.length, containerRef);

  // Lift selection state up so FailureModeOverlay HTML component can access it
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Sidebar open/collapsed state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Playback overrides state
  const [playbackOverrides, setPlaybackOverrides] = useState<Map<string, number>>(() => new Map());
  const [playbackActiveEdgeId, setPlaybackActiveEdgeId] = useState<string | null>(null);

  const handlePlaybackChange = useCallback((state: UseTemporalPlaybackResult) => {
    setPlaybackOverrides(state.energyOverrides);
    setPlaybackActiveEdgeId(state.activeEdgeId);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: 500,
        position: "relative",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* 3D Viewport container */}
      <div style={{ flex: 1, position: "relative", height: "100%" }}>
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
          <HeartbeatEngine viewModel={viewModel}>
            <PostprocessingWrapper enabled={lod.enableGlow}>
              <SceneContent
                viewModel={viewModel}
                lod={lod}
                energyOverrides={playbackOverrides}
                activeEdgeId={playbackActiveEdgeId}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
              />
            </PostprocessingWrapper>
          </HeartbeatEngine>
        </Canvas>

        {/* Floating Cohesion Badge (Top-Right) */}
        {showCohesion && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
            }}
          >
            <CohesionIndicator cohesion={viewModel.metrics.cohesion} />
          </div>
        )}

        {/* Toggle Sidebar Button (Top-Left) */}
        {showAnalytics && (
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
            }}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
            aria-label="Toggle analytics panel"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Analytics
          </button>
        )}

        {/* Temporal Playback Overlay Controls (Req 7.5, 7.6) */}
        {viewModel.temporalChain && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            <TemporalPlayback
              temporalChain={viewModel.temporalChain}
              nodes={viewModel.nodes}
              onStateChange={handlePlaybackChange}
            />
          </div>
        )}

        {/* Failure Mode Overlay (Req 6.7 / 12.1) */}
        {enableFailureMode && selectedNodeId && (
          <FailureModeOverlay
            viewModel={viewModel}
            selectedNodeId={selectedNodeId}
            onDismiss={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Sidebar Panel container */}
      {showAnalytics && sidebarOpen && (
        <div
          style={{
            width: 320,
            height: "100%",
            flexShrink: 0,
            zIndex: 15,
          }}
        >
          <AnalyticsPanel
            analytics={viewModel.metrics.analytics}
            nodes={viewModel.nodes}
            insights={viewModel.insights ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

export default GraphScene;
