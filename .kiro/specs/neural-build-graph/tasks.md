# Implementation Plan: Neural Network Build Graph

## Overview

Implement a living, multi-layer force-directed 3D neural network visualization that renders a player's equipment loadout as an organic graph within the OHMM combat calculator. The system transforms the combat pipeline into an explainable six-layer graph with animated energy flow, graph analytics, failure mode analysis, and temporal combat chain playback.

Implementation follows the design's file structure: pure TypeScript view model layer (`buildGraph.vm.ts`) producing graph data consumed by a React Three Fiber 3D scene, with a 2D SVG accessibility fallback.

## Tasks

- [x] 1. Set up type definitions and constants
  - [x] 1.1 Create `src/lib/ohmm/theorycraft/buildGraph.types.ts` with all type definitions
    - Define GraphLayer, LAYER_ORDER, node/edge category types
    - Define GraphNode, GraphEdge, NodeMetadata interfaces
    - Define GraphAnalytics, NodeCentrality, Community, ConnectedComponent interfaces
    - Define CohesionMetrics, EnergyState, HeartbeatConfig interfaces
    - Define TemporalFrame, CombatTemporalChain interfaces
    - Define FailureModeResult, ConfidenceLevel, ConfidenceVisual interfaces
    - Define GraphMetrics and BuildGraphViewModel top-level interfaces
    - Define CONFIDENCE_VISUAL_MAP constant
    - _Requirements: 1.1, 1.7, 2.6, 2.7, 3.1, 4.1, 5.1, 7.1, 9.1_

  - [x] 1.2 Create `src/lib/ohmm/theorycraft/buildGraph.constants.ts` with all configuration constants
    - Define FORCE_CONFIG (physics simulation parameters)
    - Define LAYER_Y_POSITIONS for 3D layout
    - Define LOD_CONFIG (performance thresholds)
    - Define ENERGY_CONFIG (min/max energy, breathing, heartbeat)
    - Define LAYER_VISUAL_CONFIG (colors, emissive, base radius per layer)
    - Define EDGE_VISUAL_CONFIG (all 16 edge category visuals)
    - Define COHESION_THRESHOLDS and INFLUENCE_WEIGHTS
    - _Requirements: 3.1, 5.2, 8.1, 10.4, 11.4, 11.5, 11.6_

- [x] 2. Implement graph analytics engine
  - [x] 2.1 Create `src/lib/ohmm/theorycraft/graphAnalytics.ts` — core analytics computation
    - Implement `computeGraphAnalytics(nodes, edges)` orchestrator
    - Implement degree centrality: `node_connections / (totalNodes - 1)`
    - Implement betweenness centrality via Brandes BFS algorithm
    - Implement eigenvector centrality via power iteration (max 100 iterations, tolerance 1e-6)
    - Implement clustering coefficient per node
    - Implement connected component detection via BFS (undirected treatment)
    - Implement Louvain community detection algorithm
    - Compute global network density as `actualEdges / (n × (n - 1))`
    - Handle edge cases: 0 nodes returns empty; 1 node returns zeros
    - Non-converging eigenvector returns current approximation normalized to [0, 1]
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 2.2 Write property tests for graph analytics — Properties 11, 12, 13
    - **Property 11: Analytics Centrality Bounds** — all centrality values in [0.0, 1.0], clustering coefficient in [0.0, 1.0], nodes with <2 neighbors get coefficient 0
    - **Property 12: Community Coverage** — union of all community members equals the complete node ID set
    - **Property 13: Connected Component Coverage** — union of all component members equals the complete node ID set
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 3. Implement cohesion engine
  - [x] 3.1 Create `src/lib/ohmm/theorycraft/graphCohesion.ts` — richer cohesion formula
    - Implement `computeCohesion(nodes, edges, analytics)` function
    - Compute five components: networkDensity, averageEdgeWeight, connectivity, nodeUtilization, criticalPathEfficiency
    - Apply product formula with cube-root normalization, clamp to [0.0, 1.0]
    - Classify label based on COHESION_THRESHOLDS
    - Handle degenerate case: <2 active nodes or 0 edges → score 0, "Scattered"
    - Generate insight string referencing lowest-scoring component
    - Implement `computeCriticalPathEfficiency` helper (longest weighted path from equipment to output / theoretical max)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.2 Write property tests for cohesion — Properties 9, 10
    - **Property 9: Cohesion Score Bounds** — score always in [0.0, 1.0]
    - **Property 10: Cohesion Label Consistency** — label matches score per COHESION_THRESHOLDS
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 4. Implement failure mode engine
  - [x] 4.1 Create `src/lib/ohmm/theorycraft/failureMode.ts` — "what if removed?" computation
    - Implement `computeFailureImpact(nodes, edges, analytics, removedNodeId)` function
    - Filter (not mutate) nodes/edges to create reduced graph
    - Recompute analytics and cohesion on reduced graph
    - Compute cohesionDropPercent as `((original - reduced) / original) × 100`
    - Identify disconnected nodes (were in main component, now isolated)
    - Identify severed edges, split communities, new components
    - Assign severity rating based on cohesionDropPercent thresholds
    - Generate impactSummary string with label, drop %, disconnected count, severed count
    - Handle non-existent node: return zeros with "not found" summary, no throw
    - Complete in <10ms for up to 64 nodes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8_

  - [x] 4.2 Write property tests for failure mode — Properties 16, 17, 27
    - **Property 16: Failure Mode Non-Mutation** — original nodes, edges, analytics deeply equal before/after call
    - **Property 17: Failure Mode Cohesion Drop Formula** — cohesionDropPercent matches formula
    - **Property 27: Failure Mode Severity Consistency** — severity matches cohesionDropPercent thresholds
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [x] 5. Implement temporal chain engine
  - [x] 5.1 Create `src/lib/ohmm/theorycraft/temporalChain.ts` — combat chain construction
    - Implement `buildTemporalChain(combatOutput, nodes, edges)` function
    - Return null when DPS is 0/undefined/null or no weapon node exists
    - Construct 3–64 ordered TemporalFrames from combat timing data
    - Ensure strictly increasing timestamps, non-negative integer ms values
    - Ensure every frame.activeNodeId references valid node.id
    - Ensure every non-null frame.activeEdgeId references valid edge.id
    - Compute cycleDuration between 100ms and 30000ms
    - Set isLooping to true for continuous playback
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 5.2 Write property tests for temporal chain — Properties 14, 15
    - **Property 14: Temporal Chain Ordering** — frames strictly increasing by timestamp
    - **Property 15: Temporal Chain Node References** — every activeNodeId references valid node
    - **Validates: Requirements 7.2, 7.3**

- [x] 6. Checkpoint — Ensure all analytics modules pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement core view model — multi-layer graph derivation
  - [x] 7.1 Create `src/lib/ohmm/theorycraft/buildGraph.vm.ts` — main derivation function
    - Implement `deriveBuildGraph(buildSelection, calcInput, combatOutput)` orchestrator
    - Implement `extractMultiLayerNodes` — extract nodes from all 6 layers
    - Equipment layer: one node per occupied slot (weapon, armor, mods, food, deviant, cradle), skip empty/null
    - Stats layer: one node per unique statKey with non-zero value in modifierSources
    - Keywords layer: one node per unique BridgedEffect.category with contributesModifiers === true
    - Status effects layer: one node per status-related statKey with contributors and modeledEffects reference
    - Combat formula layer: exactly 3 fixed nodes (additive-group, multiplicative-group, base-damage)
    - Final output layer: exactly 3 fixed nodes (dps, ttk, expected-damage)
    - Ensure unique node IDs across all layers
    - Cap total nodes to 100 by trimming stats/keywords layers
    - Handle null/undefined/empty inputs: return isRenderable=false, no throw
    - Return isRenderable=false when <2 equipped slots
    - Never mutate input BuildSelection, CalculationInput, or CombatOutput
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 13.1, 13.2, 13.6, 13.7, 13.8_

  - [x] 7.2 Implement inter-layer edge derivation in `buildGraph.vm.ts`
    - Equipment → Stats: one edge per matching origin/statKey pair in modifierSources
    - Stats → Keywords: edges where modeledEffects scaling references the statKey
    - Keywords → Status Effects: edges where keyword triggers status proc
    - Status Effects/Stats → Combat Formula: additive vs multiplicative routing
    - Combat Formula → Final Output: all 3 formula nodes → all 3 output nodes
    - Enforce directed flow: source layer index ≤ target layer index
    - Validate edge.source and edge.target reference valid node IDs
    - No self-referencing edges (source ≠ target)
    - Deduplicate edges by (source, target, category) combination
    - Normalize all edge weights to [0.0, 1.0] with max weight = 1.0
    - Set metrics.strongestSynergy to null when zero edges
    - Skip modifier sources with unmappable origin IDs (no throw)
    - Clamp NaN/Infinity edge weights to 0.0
    - Skip inactive conditional modifiers unless confidence="estimated" and weight=0
    - Every edge.relation must trace to real engine data (no invented synergies)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4_

  - [x] 7.3 Implement energy level and influence scoring in `buildGraph.vm.ts`
    - Energy: `max(0.05, nodeContribution% / maxContribution%)`, clamped [0.05, 1.0]
    - Final output nodes always energyLevel = 1.0
    - Influence: `0.3×eigenvector + 0.35×dpsContrib + 0.2×degree + 0.15×edgeWeightSum` (each normalized to [0,1])
    - Clamp influenceScore to [0.0, 1.0]
    - When DPS=0 or CombatOutput null: uniform energyLevel 0.3, heartbeat disabled
    - Assign confidence per node defaulting to placeholder when no source metadata
    - Edge confidence = min(source.confidence, target.confidence)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.3_

  - [x] 7.4 Implement heartbeat configuration derivation in `buildGraph.vm.ts`
    - Derive baseFrequency from reciprocal of dominant combat cycle period
    - Clamp to [0.1, 5.0] Hz
    - When DPS=0 or no timing metrics: isActive=false, pulseIntensity=0
    - Set pulseIntensity clamped to [0.02, 0.15]
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 7.5 Implement metrics assembly in `buildGraph.vm.ts`
    - Compute layerNodeCounts matching actual node.layer counts
    - Compute totalNodeCount = nodes.length
    - Compute activeNodeCount = count of isActive nodes
    - Compute interLayerEdgeCount = count of isInterLayer edges
    - Compute totalEdges = edges.length
    - Compute isolatedNodeCount = nodes with zero edges
    - Compute strongestSynergy from highest-weight edge description
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 8. Write property tests for view model
  - [x] 8.1 Write property tests for node derivation — Properties 1, 5, 7, 8, 19, 20, 25, 26
    - **Property 1: Node ID Uniqueness** — no two nodes share the same ID across all layers
    - **Property 5: Layer Consistency** — every node.layer is a valid GraphLayer, inter-layer edges have sourceLayer !== targetLayer
    - **Property 7: Energy Level Bounds** — all energyLevel in [0.05, 1.0], output nodes = 1.0
    - **Property 8: Influence Score Bounds** — all influenceScore in [0.0, 1.0]
    - **Property 19: Safe Defaults on Invalid Input** — deriveBuildGraph never throws on any input
    - **Property 20: Minimum Renderability Threshold** — <2 equipped slots → isRenderable=false
    - **Property 25: Non-Mutation Guarantee** — inputs deeply equal before/after
    - **Property 26: Confidence Classification Completeness** — all nodes/edges have valid confidence
    - **Validates: Requirements 1.1, 1.7, 2.6, 3.1, 3.2, 3.4, 9.1, 13.1, 13.2, 13.7**

  - [x] 8.2 Write property tests for edge derivation — Properties 2, 3, 4, 6, 18, 21, 22, 24
    - **Property 2: Edge Referential Integrity** — every source/target matches a node.id
    - **Property 3: No Self-Referencing Edges** — no edge has source === target
    - **Property 4: Edge Weight Bounds** — all weights in [0.0, 1.0], max weight = 1.0
    - **Property 6: Directed Flow Integrity** — sourceLayer index ≤ targetLayer index in LAYER_ORDER
    - **Property 18: No Invented Synergies** — every edge.relation traces to real engine data
    - **Property 21: Edge Deduplication** — no two edges share (source, target, category)
    - **Property 22: Confidence Propagation** — edge confidence = min(source, target) confidence
    - **Property 24: Metrics Accuracy** — all metrics match counted values
    - **Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 9.3, 14.1, 14.2, 15.1–15.7**

  - [x] 8.3 Write property test for heartbeat — Property 23
    - **Property 23: Heartbeat Frequency Bounds** — baseFrequency clamped to [0.1, 5.0] Hz
    - **Validates: Requirement 8.2**

- [x] 9. Checkpoint — Ensure view model and all analytics pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement 3D rendering layer — React Three Fiber components
  - [x] 10.1 Create `src/app/components/theorycraft/NeuralBuildGraph/NeuralBuildGraph.tsx` — main entry component
    - Detect WebGL 2.0 availability at mount
    - Detect prefers-reduced-motion media query
    - Route to GraphScene (3D) or BuildGraphFallback (2D SVG)
    - Handle WebGL context loss: transition to 2D fallback without state loss
    - Use React.lazy + Suspense for lazy canvas mount
    - _Requirements: 10.1, 10.2, 12.1, 12.2, 12.6_

  - [x] 10.2 Create `src/app/components/theorycraft/NeuralBuildGraph/ForceSimulation.ts` and `useForceGraph.ts`
    - Wrap d3-force-3d simulation
    - Apply influence-weighted center gravity: centerStrength + influenceScore × influenceCenterMultiplier
    - Apply layer separation force (strength 0.1) positioning nodes to LAYER_Y_POSITIONS
    - Stop ticking when alpha reaches alphaMin (0.001)
    - Support node pinning/unpinning and reheat
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 10.3 Create `src/app/components/theorycraft/NeuralBuildGraph/GraphScene.tsx`, `GraphNode3D.tsx`, `GraphEdge3D.tsx`, `DirectedParticles.tsx`
    - GraphScene: orchestrate layers, nodes, edges, particles within R3F Canvas
    - GraphNode3D: sphere mesh + glow + energy pulse + label (emissive intensity modulated by confidence)
    - GraphEdge3D: directed edge with flow particles + confidence styling (solid/dashed/dotted, opacity)
    - DirectedParticles: instanced particle system for directional flow (1–8 particles per edge based on LOD)
    - Orbit controls: rotate, zoom, pan
    - Node hover tooltips: label, formattedValue, layer, confidence
    - Node dragging: pin at fixed coordinates until unpinned
    - Per-frame budget: 8ms or less
    - _Requirements: 9.2, 9.4, 10.1, 10.6, 10.7_

  - [x] 10.4 Create `src/app/components/theorycraft/NeuralBuildGraph/HeartbeatEngine.tsx` and `useHeartbeat.ts`
    - Derive pulse frequency from CombatOutput timing metrics
    - Apply brightness scaling: `(1 + pulseIntensity × energyLevel)` per pulse cycle
    - Propagate brightness ripple from highest-energy node with 800ms decay
    - Apply continuous breathing animation: sinusoidal at 0.3Hz, 0.05 amplitude × normalizedSize
    - When DPS=0: restore all nodes to base energyLevel within 1000ms
    - Recalculate frequency within 100ms of timing metric changes, interpolate over 500ms
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 10.5 Create `src/app/components/theorycraft/NeuralBuildGraph/TemporalPlayback.tsx`
    - Highlight active node (energyLevel → 1.0) on each frame
    - Animate directed particle burst along activeEdgeId
    - Dim inactive nodes to 30% of base energyLevel
    - Restore all nodes to base energyLevel within 800ms on playback end
    - Support looping (restart from frame 0 after final frame)
    - Advance frames proportional to timestamp gaps at cycleDuration × playbackSpeed
    - _Requirements: 7.5, 7.6, 7.7, 7.8_

  - [x] 10.6 Create `src/app/components/theorycraft/NeuralBuildGraph/FailureModeOverlay.tsx`
    - Prevent removal of final-output layer nodes (display notification)
    - On node selection: invoke computeFailureImpact, display overlay
    - Show cohesion drop %, disconnected nodes, severed edges
    - Animate disconnection (edges fade, clusters drift)
    - _Requirements: 6.7_

- [x] 11. Implement LOD and performance system
  - [x] 11.1 Implement Level of Detail tiers in GraphScene
    - Nodes 1–30: full quality (8 particles/edge, 3 ticks/frame, full glow, heartbeat)
    - Nodes 31–60: reduced (3 particles/edge, 2 ticks/frame, reduced glow)
    - Nodes 61–100: collapse layers 2–5 into summary nodes, 0 particles, 1 tick/frame, no glow/heartbeat
    - Nodes 100+: static mode, pre-computed layout, 2D SVG fallback
    - Apply hysteresis margin of 3 nodes at tier boundaries
    - Auto-drop LOD tier if frame time exceeds 12ms for 10 consecutive frames
    - Restore LOD tier after 30 consecutive frames below 8ms
    - Pause simulation and rendering when not in viewport (IntersectionObserver)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

- [x] 12. Implement accessibility fallback
  - [x] 12.1 Create `src/app/components/theorycraft/NeuralBuildGraph/BuildGraphFallback.tsx` — 2D SVG fallback
    - Render nodes as colored circles with text labels, grouped by layer
    - Render edges as SVG lines with arrowheads, thickness by weight, style by confidence
    - Full keyboard navigation: arrow keys for connected nodes, Tab/Shift+Tab between layers, Enter for details
    - ARIA labels on all nodes (role="img", aria-label with label, layer, energy, confidence)
    - ARIA labels on all edges (aria-label with source, target, category, weight)
    - Display same topology, cohesion score, analytics panel, failure mode as 3D scene
    - Static force-settled layout (no animation when prefers-reduced-motion)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 13. Implement UI panels and indicators
  - [x] 13.1 Create `src/app/components/theorycraft/NeuralBuildGraph/CohesionIndicator.tsx` and `AnalyticsPanel.tsx`
    - CohesionIndicator: badge showing score, label, color-coded
    - AnalyticsPanel: sidebar showing centrality rankings, community memberships, component info
    - Confidence tooltip on hover/select showing human-readable label
    - _Requirements: 5.2, 5.4, 9.5_

  - [x] 13.2 Create `src/app/components/theorycraft/NeuralBuildGraph/LayerRenderer.tsx`
    - Render nodes grouped by semantic layer
    - Support layer visibility toggling
    - _Requirements: 10.4_

- [x] 14. Integrate into TheoryCraftPanel
  - [x] 14.1 Modify `src/app/components/theorycraft/TheoryCraftPanel.tsx` to add NeuralBuildGraph section
    - Import and render NeuralBuildGraph component
    - Derive buildGraph viewModel via useMemo from buildSelection, calcInput, combatOutput
    - Pass feature flags: showCohesion, showAnalytics, enableFailureMode, enableTemporalPlayback
    - _Requirements: 1.1, 10.1_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (27 properties total)
- The project uses custom smoke tests with `tsx` (no Jest/Vitest), so property tests should use `fast-check` with a custom runner
- Three.js, @react-three/fiber, @react-three/drei, and d3-force-3d are new dependencies that need to be installed
- The view model (`buildGraph.vm.ts`) is pure TypeScript with no React dependencies, matching the existing pattern of `heroMetrics.vm.ts`
- Dual React versions (18 root / 19 ohai) — this feature lives in the root project (React 18)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1", "5.2"] },
    { "id": 3, "tasks": ["4.2", "7.1"] },
    { "id": 4, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 5, "tasks": ["7.5", "8.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["10.1", "10.2", "12.1"] },
    { "id": 7, "tasks": ["10.3", "10.4", "10.5", "10.6"] },
    { "id": 8, "tasks": ["11.1", "13.1", "13.2"] },
    { "id": 9, "tasks": ["14.1"] }
  ]
}
```
