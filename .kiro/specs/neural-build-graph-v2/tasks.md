# Implementation Plan: Neural Build Graph v2 — Tiered Quality Enhancement

## Overview

This plan implements the Neural Build Graph v2 as three sequential tiers, each building on the previous. The existing code is enhanced — not rewritten. Tier 1 establishes rock-solid physics and interaction, Tier 2 adds cinematic visual intelligence, and Tier 3 enables advanced analytical features. All tasks use TypeScript with React Three Fiber.

## Tasks

- [x] 1. Install dependencies and set up new file scaffolding
  - [x] 1.1 Install new dependencies and create file structure
    - Install `@use-gesture/react` (^10.3) and `@react-three/postprocessing` (^2.16)
    - Create empty files: `useNodeDrag.ts`, `useCinematicCamera.ts` in `src/app/components/theorycraft/NeuralBuildGraph/`
    - Create empty file: `buildGraphInsights.ts` in `src/lib/ohmm/theorycraft/`
    - Export PositionsRef, NodeDragState, CinematicCameraState, ParticleColorSlot, BuildInsight, and BuildInsightsResult interfaces
    - _Requirements: 6.1, 6.2, 19.3, 19.4, 20.1_

- [x] 2. Tier 1: Force Simulation Rewrite (useFrame-based ticking)
  - [x] 2.1 Rewrite useForceGraph to tick inside R3F useFrame
    - Move force simulation tick from external rAF loop into useFrame callback
    - Write positions to mutable PositionsRef (Map<string, {x,y,z}>) — never useState/setState
    - Increment positionsRef.frameId exactly once per frame (monotonically increasing)
    - Ensure positionsRef.current.size === viewModel.nodes.length after first tick
    - Implement settlement detection (alpha < alphaMin 0.001) via isSettledRef mutable ref
    - Call onSettled callback when simulation settles
    - Dispose simulation on unmount or structural fingerprint change
    - Implement NaN/Infinity guard: clamp non-finite coordinates to [-500, 500] bounding box per axis, log console warning
    - Implement fallback: after 3 consecutive reheat attempts producing non-finite positions, switch to deterministic grid layout from layer assignments
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.3, 2.4, 3.1_

  - [x] 2.2 Write property test for force simulation positions (Property 1)
    - **Property 1: Force simulation positions are always finite**
    - For any valid BuildGraphViewModel with isRenderable=true, after any number of simulation ticks, every position must have finite x, y, z values
    - **Validates: Requirements 1.2, 1.7**

  - [x] 2.3 Write property test for position count invariant (Property 2)
    - **Property 2: Position count equals node count**
    - For any valid BuildGraphViewModel, after at least one tick, positionsRef.current.size === vm.nodes.length
    - **Validates: Requirement 1.5**

  - [x] 2.4 Update GraphNode3D to read positions from PositionsRef in useFrame
    - Remove position props/state reading from GraphNode3D
    - Read position from positionsRef.current inside GraphNode3D's own useFrame callback
    - Ensure all hooks (useFrame, useHeartbeatContext, useNodeDrag) are called unconditionally
    - _Requirements: 2.2, 3.2_

- [x] 3. Tier 1: Node Drag Interaction
  - [x] 3.1 Implement useNodeDrag hook
    - Use @use-gesture/react useDrag to handle pointer events on node meshes
    - Compute drag plane perpendicular to camera direction through node's world position on drag start
    - Project pointer movement onto drag plane via raycasting on each pointermove
    - Pin node in ForceSimulation at projected 3D position during drag
    - Disable OrbitControls on drag start, re-enable on drag end
    - Reheat simulation (alpha reset to 1.0) while dragging so connected nodes react
    - Pin node permanently at final drop position on pointerup (no auto-unpin)
    - Handle edge case: if ray-plane intersection fails, retain node at last valid position
    - Distinguish click from drag — click without movement does NOT pin the node
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 3.2_

  - [x] 3.2 Write property test for pinned node stability (Property 3)
    - **Property 3: Pinned nodes maintain exact position**
    - For any node pinned at (x, y, z), position remains exactly (x, y, z) across subsequent ticks until unpinned
    - **Validates: Requirements 5.3, 5.5**

  - [x] 3.3 Integrate useNodeDrag into GraphNode3D
    - Call useNodeDrag unconditionally in GraphNode3D (disabled flag when not applicable)
    - Bind gesture handlers to node mesh
    - Set cursor to 'grabbing' during drag, 'pointer' on hover
    - _Requirements: 5.1, 3.2_

- [x] 4. Tier 1: Cinematic Camera (zoom-to-fit + focus-on-node)
  - [x] 4.1 Implement useCinematicCamera hook with zoom-to-fit
    - Implement computeZoomToFit: bounding sphere of all positions, calculate camera distance with 15% padding using `distance = (radius × 1.15) / sin(fov/2)`
    - Implement smooth lerp of camera position over 600ms with ease-out-cubic easing
    - Reset animation progress to 0.0 before each new zoom-to-fit
    - Use spherical linear interpolation for natural camera arc
    - Set OrbitControls target to centroid after animation
    - Ensure all nodes project to NDC within [-1, 1] after zoom-to-fit
    - Call unconditionally — mode gates behavior inside useFrame
    - _Requirements: 4.1, 4.5, 4.6, 3.1_

  - [x] 4.2 Implement focus-on-node camera transition
    - Lerp camera to frame selected node centered with 2× node-radius clearance
    - Complete transition in 400ms
    - Cancel in-progress animation and start new lerp from current position if new focus target selected
    - Handle user interaction during animation: immediately cancel at current interpolated position, transfer to OrbitControls
    - _Requirements: 4.2, 4.7, 10.3_

  - [x] 4.3 Write property test for zoom-to-fit framing (Property 4)
    - **Property 4: Zoom-to-fit frames all nodes within camera frustum**
    - For any set of 1-100 node positions, after computeZoomToFit, every node projects to NDC within [-1, 1] on both axes
    - **Validates: Requirements 4.1, 4.6**

- [ ] 5. Tier 1: Wire camera and force graph into GraphScene
  - [x] 5.1 Integrate useForceGraph and useCinematicCamera into GraphScene
    - Call useForceGraph and useCinematicCamera unconditionally in SceneContent
    - Wire onSettled callback to trigger zoomToFit
    - Wire node selection to trigger focusOnNode
    - Pass positionsRef to all child components (GraphNode3D, GraphEdge3D, DirectedParticles)
    - Ensure OrbitControls ref is shared between camera hook and drag hooks
    - _Requirements: 3.1, 4.1, 4.2_

  - [x] 5.2 Write property test for graph data contracts (Property 5)
    - **Property 5: Graph data contracts preserved (combined invariants)**
    - For any valid build inputs, deriveBuildGraph produces: unique node IDs, referential integrity, directed flow, weights in [0,1], no self-edges, no input mutation
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7**

- [x] 6. Checkpoint — Tier 1 Foundation complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: drag works, physics run inside useFrame, camera auto-fits on settle, no React re-renders during simulation.

- [x] 7. Tier 2: HeartbeatEngine wiring and bloom pipeline
  - [x] 7.1 Wire HeartbeatEngine as context provider in GraphScene
    - Mount HeartbeatEngine wrapping SceneContent children inside Canvas
    - GraphNode3D calls useHeartbeatContext() unconditionally in its useFrame
    - Apply brightnessMultiplier to emissiveIntensity: `baseEmissive * brightnessMultiplier`
    - Apply breathingScale to group scale: `hoverScale * breathingScale`
    - When heartbeat isActive=false, multiplier=1.0, scale=1.0 (no visual change)
    - Implement frequency derivation: baseFrequency = reciprocal of dominant combat cycle, clamped [0.1, 5.0] Hz
    - Implement smooth frequency transition: linear interpolation over 500ms
    - Implement breathing: sinusoidal at 0.3 Hz, 0.05 amplitude — runs always regardless of heartbeat state
    - Implement deactivation decay: brightnessMultipliers fade to 1.0 over 800ms (pulseDecayMs)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 3.2_

  - [x] 7.2 Write property test for heartbeat brightness (Property 6)
    - **Property 6: Heartbeat brightness multiplier is always >= 1.0 when active**
    - For any viewModel with DPS > 0, after any heartbeat ticks, all brightnessMultipliers >= 1.0
    - **Validates: Requirement 7.3**

  - [x] 7.3 Write property test for heartbeat frequency clamping (Property 7)
    - **Property 7: Heartbeat frequency always clamped to [0.1, 5.0] Hz**
    - For any CombatOutput timing metrics (including degenerate values), derived baseFrequency is within [0.1, 5.0]
    - **Validates: Requirements 7.1, 7.2**

  - [x] 7.4 Add bloom post-processing to GraphScene
    - Add EffectComposer with selective Bloom: luminanceThreshold=0.6, intensity=1.2, radius=0.7
    - Assign node meshes to Three.js render layer 1 (bloom layer)
    - Keep edge meshes on layer 0 only — edges never bloom
    - Conditional import: if @react-three/postprocessing fails to import, render without bloom (graceful degradation)
    - Disable bloom when LOD tier is Collapsed or Static (remove EffectComposer from tree)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8. Tier 2: Per-instance particle colors
  - [x] 8.1 Implement per-instance color attribute in DirectedParticles
    - Build Float32Array color attribute: 3 floats per instance (r, g, b) from EDGE_VISUAL_CONFIG[category].particleColor
    - Attach as InstancedBufferAttribute on sphereGeometry: `attach="attributes-aColor" args={[colorArray, 3]}`
    - Use ShaderMaterial or onBeforeCompile to inject `attribute vec3 aColor` → `vColor` for fragment
    - Maintain single InstancedMesh draw call — per-instance color adds zero draw calls
    - Rebuild color array only when edge array changes (not per-frame)
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.2 Write property test for particle color correctness (Property 8)
    - **Property 8: Per-instance particle colors match their edge categories**
    - For any set of edges with categories, every particle's color in the Float32Array matches EDGE_VISUAL_CONFIG[category].particleColor within tolerance 0.001
    - **Validates: Requirements 9.1, 9.3**

- [x] 9. Tier 2: Auto-orbit and selection visuals
  - [x] 9.1 Implement auto-orbit in useCinematicCamera
    - After 10s of no interaction (pointerdown, pointermove, wheel), enter auto-orbit mode
    - Rotate around graph centroid at 0.05 radians/second, maintaining constant distance
    - On any user interaction: immediately cancel auto-orbit, reset idleTime to 0, return to OrbitControls
    - On wheel event during auto-orbit: exit auto-orbit and transfer full control
    - _Requirements: 4.3, 4.4, 10.1, 10.2_

  - [x] 9.2 Write property test for auto-orbit distance invariant (Property 9)
    - **Property 9: Auto-orbit maintains constant distance from target**
    - For any camera state in auto-orbit, distance between camera.position and controls.target remains constant (±0.001) across orbit frames
    - **Validates: Requirement 10.1**

  - [x] 9.3 Add selection ring and hover highlight to GraphNode3D and GraphEdge3D
    - On node selection (click): render a selection ring (torus or outline)
    - On node hover: increase emissive intensity slightly for hover feedback
    - On edge hover: highlight edge geometry
    - _Requirements: 4.2 (selection triggers focus)_

- [x] 10. Checkpoint — Tier 2 Visual Intelligence complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: heartbeat pulses nodes, bloom glows on high-emissive nodes, particles are multi-colored, camera lerps to focus and auto-orbits.

- [x] 11. Tier 3: Temporal Playback activation
  - [x] 11.1 Wire buildTemporalChain into deriveBuildGraph
    - In buildGraph.vm.ts, replace `temporalChain: null` with call to `buildTemporalChain(combatOutput, nodes, edges)`
    - Only call when DPS > 0 AND graph has at least one equipment-layer node with category "weapon"
    - Set temporalChain to null otherwise (buildTemporalChain not called)
    - Ensure frames are ordered by strictly increasing timestamp
    - Ensure every frame.activeNodeId references a valid node.id; remap invalid references to nearest valid node by layer proximity with console warning
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 11.2 Write property test for temporal chain presence (Property 10)
    - **Property 10: Temporal chain presence matches DPS and weapon conditions**
    - If DPS > 0 AND graph has weapon node → temporalChain non-null. Otherwise → null.
    - **Validates: Requirements 11.1, 11.2**

  - [x] 11.3 Write property test for temporal frame integrity (Property 11)
    - **Property 11: Temporal frame ordering and referential integrity**
    - All frames have strictly increasing timestamps, valid activeNodeId, valid activeEdgeId (if non-null)
    - **Validates: Requirements 11.3, 11.4**

  - [x] 11.4 Mount TemporalPlayback as Html overlay in GraphScene
    - Mount TemporalPlayback in absolute-positioned overlay when viewModel.temporalChain is non-null
    - During playback: active node brightness = 1.0, all others = 30% of base energyLevel
    - On playback stop: restore all nodes to base energyLevel within 800ms (pulseDecayMs)
    - Position controls at bottom-center of canvas overlay
    - _Requirements: 11.6, 11.7_

- [x] 12. Tier 3: Failure Mode Overlay and Confidence Propagation
  - [x] 12.1 Implement failure mode non-mutation guard and overlay mount
    - Ensure computeFailureImpact operates on shallow copies of nodes/edges arrays
    - Original arrays and objects maintain reference identity (===) before and after
    - Throw Error with descriptive message if removedNodeId doesn't exist in graph
    - Complete computation within 10ms for graphs up to 64 nodes
    - Mount FailureModeOverlay in Html overlay layer, triggered on node selection
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 12.2 Write property test for failure mode non-mutation (Property 12)
    - **Property 12: Failure mode analysis never mutates input data**
    - For any graph and target node, running failure analysis leaves original arrays with identical reference identity and deep equality
    - **Validates: Requirements 12.1, 12.2**

  - [x] 12.3 Implement confidence propagation in buildGraph.vm.ts
    - Equipment-layer nodes: confidence = registry item's confidence metadata
    - Non-equipment nodes: confidence = min(confidence of all incoming-edge source nodes) using hierarchy project_verified > observed > estimated > placeholder
    - Nodes with zero incoming edges (non-equipment): assign "placeholder"
    - Edge confidence = min(source.confidence, target.confidence)
    - Propagate layer-by-layer following LAYER_ORDER
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 12.4 Write property test for confidence monotonic decrease (Property 13)
    - **Property 13: Confidence monotonically decreases through pipeline layers**
    - For every edge, target node's confidence index >= source node's confidence index in CONFIDENCE_ORDER
    - **Validates: Requirements 13.2, 13.3**

  - [x] 12.5 Implement confidence visualization in rendering layer
    - Edge styles per confidence: solid/opacity 1.0/glow 0.8 (verified), solid/0.85/glow 0.5 (observed), dashed/0.6/no glow (estimated), dotted/0.35/glow 0.2 (placeholder)
    - Node emissive modulation per confidence: 1.0× (verified), 0.7× (observed), 0.4× desaturated (estimated), 0.2× desaturated (placeholder)
    - Tooltip on hover/select showing human-readable confidence label
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 13. Tier 3: Explainability Engine and Analytics Panel
  - [x] 13.1 Implement generateBuildInsights in buildGraphInsights.ts
    - Generate 0-7 BuildInsight objects sorted by priority descending
    - Bottleneck detection: nodes with betweenness > 0.4
    - Upgrade recommendations: low-energy equipment with high degree centrality
    - Synergy detection: communities with high internal density
    - Warning: isolated nodes or disconnected components
    - Optimization: edge weight imbalance suggesting reallocation
    - All insights reference concrete values (percentages, node counts) — not vague claims
    - Overall rating from cohesion score: optimal (>=0.75), strong (>=0.55), average (>=0.35), weak (otherwise)
    - Never throw — return empty insights with "weak" rating on edge cases (empty nodes, NaN scores)
    - Ensure every relatedNodes entry references a valid node.id
    - Ensure no two insights share the same id
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x] 13.2 Write property test for insight engine integrity (Property 14)
    - **Property 14: Insight engine referential integrity and ordering**
    - All relatedNodes reference valid node IDs, insights sorted by priority descending, no duplicate IDs, function never throws
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.5**

  - [x] 13.3 Write property test for overall rating brackets (Property 15)
    - **Property 15: Overall rating matches cohesion score brackets**
    - For any cohesion score: optimal (>=0.75), strong (>=0.55), average (>=0.35), weak (otherwise)
    - **Validates: Requirement 17.4**

  - [x] 13.4 Mount AnalyticsPanel and CohesionIndicator in GraphScene
    - Mount AnalyticsPanel as collapsible sidebar with toggle button
    - Mount CohesionIndicator as floating badge (top-right of canvas)
    - Wire generateBuildInsights output to AnalyticsPanel content
    - _Requirements: 17.1, 17.6_

- [ ] 14. Tier 3: LOD System and Performance
  - [x] 14.1 Implement LOD tier system with hysteresis
    - Full (1–30 nodes): 8 particles/edge, 3 ticks/frame, bloom, heartbeat
    - Reduced (31–60): 3 particles/edge, 2 ticks/frame, reduced bloom
    - Collapsed (61–100): collapse inner layers to summary nodes, disable particles, 1 tick/frame, disable heartbeat
    - Static (>100): pre-computed grid layout, 2D SVG fallback, no animation
    - Hysteresis margin of 3 nodes at boundaries (31→stays Full until 33; 60→stays Reduced until 57)
    - Auto-drop tier if per-frame render time > 12ms for 10 consecutive frames
    - Auto-promote only when render time < 8ms for 30 consecutive frames
    - Pause simulation and suspend rendering when offscreen (IntersectionObserver, 0% intersection)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [x] 14.2 Write property test for LOD tier hysteresis (Property 16)
    - **Property 16: LOD tier assignment matches node count with hysteresis**
    - For any sequence of node count changes, tier follows specified boundaries with 3-node hysteresis margin
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 15. Tier 3: Accessibility Fallback
  - [x] 15.1 Implement 2D SVG Fallback Renderer
    - Render when WebGL 2.0 unavailable or on context loss — preserve graph state
    - Disable decorative animation when prefers-reduced-motion is enabled (particles, heartbeat, breathing, camera transitions, auto-orbit)
    - Allow user-initiated temporal playback in reduced-motion mode (informational, not decorative)
    - Provide keyboard navigation: arrow keys traverse connected nodes, Tab/Shift+Tab move between layers, Enter selects
    - ARIA labels on nodes (role="img", aria-label with label/layer/energy/confidence) and edges (source/target/category/weight)
    - Transition to SVG fallback within one frame on WebGL context loss without losing state
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 16. Tier 3: Simulation-Visual Separation and Renderer Independence
  - [x] 16.1 Enforce architectural separation between View_Model and Rendering_Layer
    - Ensure View_Model exposes Combat_Influence per node as [0.0, 1.0] from analytics
    - Rendering_Layer derives Visual_Intensity from Combat_Influence via configurable mapping function
    - Verify no Three.js types, color hex values, or material properties in `src/lib/ohmm/theorycraft/`
    - Verify no React/Three.js/R3F/postprocessing imports in graph derivation layer
    - Ensure ForceSimulation wrapper lives in rendering layer (`src/app/components/`)
    - Verify Rendering_Layer consumes BuildGraphViewModel as sole data contract
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 20.1, 20.2, 20.3_

- [x] 17. Final Checkpoint — All tiers complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: temporal playback animates through 3D scene, failure/analytics/cohesion overlays visible, system generates build advice, confidence propagates from registry, LOD tiers auto-scale, SVG fallback accessible.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation per tier
- Property tests validate universal correctness properties (fast-check based, using tsx runner — no Jest/Vitest)
- Unit tests validate specific examples and edge cases
- All existing v1 data contracts remain enforced throughout
- Dependencies: `@use-gesture/react` (Tier 1), `@react-three/postprocessing` (Tier 2) — both installed in task 1.1
- Performance budget: 8ms total per frame — positions via mutable ref eliminates re-render overhead

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2"] },
    { "id": 6, "tasks": ["7.1", "8.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "8.2"] },
    { "id": 8, "tasks": ["9.1", "9.3"] },
    { "id": 9, "tasks": ["9.2"] },
    { "id": 10, "tasks": ["11.1", "12.3"] },
    { "id": 11, "tasks": ["11.2", "11.3", "11.4", "12.1", "12.4"] },
    { "id": 12, "tasks": ["12.2", "12.5", "13.1"] },
    { "id": 13, "tasks": ["13.2", "13.3", "13.4", "14.1"] },
    { "id": 14, "tasks": ["14.2", "15.1"] },
    { "id": 15, "tasks": ["16.1"] }
  ]
}
```
