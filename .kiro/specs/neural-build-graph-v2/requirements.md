# Requirements Document

## Introduction

The Neural Build Graph v2 is a tiered quality enhancement to the existing neural network build graph visualization in OHMM. It does NOT rewrite the existing system — it restructures and enhances it across three sequential quality tiers: Foundation (stability, physics, interaction), Visual Intelligence (heartbeat, bloom, camera cinema), and Advanced Analysis (temporal playback, failure mode overlays, confidence propagation, AI insights).

All existing v1 data contracts (node ID uniqueness, edge referential integrity, directed flow, weight normalization [0,1], no self-edges, no invented synergies) remain in force. This document specifies ADDITIONS and ENHANCEMENTS only.

**Priority principle**: Correctness and stability over cinematic polish. A visually broken but stable graph is acceptable during development; a pretty graph with diverging physics or rerender loops is not.

## Glossary

- **Build_Graph_System**: The complete neural network build graph subsystem including view model, analytics, rendering, and all tier enhancements
- **View_Model**: The pure TypeScript derivation layer (`buildGraph.vm.ts`) that transforms theorycraft state into graph structures
- **Force_Simulation**: The d3-force-3d physics engine positioning nodes in 3D space, ticked inside R3F useFrame
- **Rendering_Layer**: The React Three Fiber 3D scene and all visual components
- **Heartbeat_Engine**: The combat-synchronized pulse system driving node brightness oscillation via React context
- **Cinematic_Camera**: The camera controller providing zoom-to-fit, focus-on-node, and auto-orbit behaviors
- **Temporal_Chain_Engine**: The module constructing combat execution order frames from CombatOutput timing data
- **Failure_Mode_Engine**: The module computing hypothetical node removal impact without mutating original state
- **Insight_Engine**: Deprecated name — see Explainability_Engine
- **Explainability_Engine**: The rule-based, deterministic system generating reproducible build advice from graph analytics — purely algorithmic, no LLM, no probabilistic inference
- **Confidence_Propagation**: The layer-by-layer algorithm assigning data provenance levels to nodes and edges
- **LOD_System**: The 4-tier Level of Detail performance scaling system with hysteresis
- **PositionsRef**: A mutable React ref (`Map<string, {x,y,z}>`) shared between simulation and rendering — never React state
- **Fallback_Renderer**: The 2D SVG accessibility fallback for non-WebGL environments or reduced-motion preferences
- **HeartbeatContext**: React context providing per-node brightnessMultipliers and breathingScales to 3D node components
- **GraphNode**: A vertex in the multi-layer graph representing an equipment piece, stat, keyword, status effect, formula group, or output metric
- **GraphEdge**: A directed connection between two nodes representing causality or contribution
- **ConfidenceLevel**: Data provenance classification: project_verified, observed, estimated, or placeholder
- **LOD_Tier**: One of four rendering quality tiers: Full (1–30 nodes), Reduced (31–60), Collapsed (61–100), Static (>100)
- **Combat_Influence**: The analytics-derived importance of a node (centrality, DPS contribution, dependency weight) — a gameplay semantic value
- **Visual_Intensity**: The rendering-layer brightness/size/glow applied to a node — driven by Combat_Influence but decoupled from it
- **Explainability_Engine**: The rule-based system generating deterministic, reproducible build advice from graph analytics — not an LLM, not AI-style, purely algorithmic

## Requirements

---

## Tier 1: Foundation — Stability, Physics, Interaction, Camera

---

### Requirement 1: Force Simulation Convergence and Stability

**User Story:** As a player, I want the physics simulation to always converge to a stable layout without producing broken positions, so that the graph never shows corrupted or exploding nodes.

#### Acceptance Criteria

1. WHILE the Force_Simulation is active (alpha > alphaMin 0.001), THE Force_Simulation SHALL tick inside the R3F useFrame callback and write results to PositionsRef — never to React state via setState
2. WHEN the Force_Simulation ticks, THE Force_Simulation SHALL produce positions where every coordinate (x, y, z) for every node is a finite number (not NaN, not Infinity, not -Infinity)
3. WHEN the Force_Simulation alpha reaches alphaMin (0.001), THE Force_Simulation SHALL stop ticking until a structural change occurs (node added/removed, edge added/removed, user drags a node, or explicit reheat call)
4. WHEN three consecutive reheat attempts produce non-finite position values, THE Force_Simulation SHALL abandon force layout and fall back to a deterministic grid layout computed from layer assignments
5. WHEN the Force_Simulation writes positions to PositionsRef, THE Force_Simulation SHALL ensure positionsRef.current.size equals viewModel.nodes.length after the first tick — one position per node, no missing entries, no orphan entries
6. WHEN the Force_Simulation writes positions to PositionsRef, THE Force_Simulation SHALL increment positionsRef.frameId exactly once per R3F frame — frameId is monotonically increasing
7. IF a node receives a non-finite position value during a tick, THEN THE Force_Simulation SHALL clamp that node's coordinates to the bounding box [-500, 500] on each axis and log a console warning
8. WHEN given identical BuildGraphViewModel input and identical initial seed, THE Force_Simulation SHALL converge to a deterministic layout — same input produces same settled positions (within floating-point tolerance 0.01 per axis) across repeated runs, enabling screenshot regression testing and build comparison

### Requirement 2: No React Rerender During Simulation

**User Story:** As a developer, I want the physics loop to never trigger React rerenders, so that the graph maintains 60fps without GC pressure or reconciliation overhead.

#### Acceptance Criteria

1. WHILE the Force_Simulation is ticking, THE useForceGraph hook SHALL write position data exclusively to a mutable ref (PositionsRef) — never calling useState setters, useReducer dispatch, or any mechanism that triggers React reconciliation
2. WHEN GraphNode3D components read their position, THE GraphNode3D SHALL read from PositionsRef.current inside their own useFrame callback — not from React props or state
3. THE useForceGraph hook SHALL NOT contain any useState call whose setter is invoked during the useFrame callback
4. WHEN the Force_Simulation settles (alpha < alphaMin), THE useForceGraph hook SHALL signal settlement via a mutable ref (isSettledRef.current = true) — not via setState

### Requirement 3: Unconditional Hook Calls

**User Story:** As a developer, I want all React hooks to be called unconditionally at the top of every component, so that we never violate the Rules of Hooks and cause cascading render crashes.

#### Acceptance Criteria

1. THE GraphScene component SHALL call useForceGraph, useCinematicCamera, and all other custom hooks unconditionally — never inside if/else branches, loops, early returns, or after conditional returns
2. THE GraphNode3D component SHALL call useFrame, useHeartbeatContext, and useNodeDrag unconditionally regardless of node state, visibility, or LOD tier
3. IF a hook's behavior should be disabled under certain conditions, THEN THE component SHALL call the hook unconditionally and pass a disabled/inactive flag or use early-return inside the hook's callback — not skip the hook call itself

### Requirement 4: Camera Behavior

**User Story:** As a player, I want the camera to intelligently frame the graph, focus on selected nodes, and gently orbit when idle, so that the visualization feels alive without being distracting.

#### Acceptance Criteria

1. WHEN the Force_Simulation settles (alpha < alphaMin), THE Cinematic_Camera SHALL perform zoom-to-fit: explicitly reset animation progress to 0.0, compute a bounding sphere of all node positions, calculate camera distance with 15% padding using `distance = (radius × 1.15) / sin(fov/2)`, and smoothly lerp camera position over 600ms with ease-out-cubic easing
2. WHEN a user selects a node (click), THE Cinematic_Camera SHALL lerp the camera to frame that node centered in view with 2× node-radius clearance, completing the transition in 400ms
3. WHEN no user interaction (pointerdown, pointermove, wheel) occurs for 10 continuous seconds, THE Cinematic_Camera SHALL enter auto-orbit mode rotating around the graph centroid at 0.05 radians/second, maintaining constant distance from the centroid
4. WHEN the user performs any interaction (pointerdown or wheel event) while auto-orbit is active, THE Cinematic_Camera SHALL immediately cancel auto-orbit, reset idleTime to 0, and return control to OrbitControls
5. WHILE Cinematic_Camera is in zoom-to-fit or focus-on-node mode, THE Cinematic_Camera SHALL interpolate position using spherical linear interpolation (slerp) and advance progress by `delta / (duration / 1000)` per frame, clamping progress to exactly 1.0 when it would exceed — stopping when progress reaches 1.0
6. WHEN computeZoomToFit completes, THE Cinematic_Camera SHALL ensure every node position projects to normalized device coordinates within [-1, 1] on both X and Y axes (all nodes visible in frustum)
7. WHEN the user performs any interaction (pointerdown, pointermove, or wheel event) WHILE a scripted camera animation (zoom-to-fit or focus-on-node) is in progress, THE Cinematic_Camera SHALL immediately cancel the animation at its current interpolated position without snapping to either the start or end — control transfers smoothly to OrbitControls from wherever the camera currently is

### Requirement 5: Node Drag Interaction

**User Story:** As a player, I want to drag nodes to rearrange the graph layout, so that I can organize the visualization to highlight relationships I care about.

#### Acceptance Criteria

1. WHEN a user initiates a pointer-down on a node mesh, THE useNodeDrag hook SHALL compute a drag plane perpendicular to the current camera direction passing through the node's world position, disable OrbitControls, and begin tracking pointer movement
2. WHILE a drag is in progress, THE useNodeDrag hook SHALL project pointer movement onto the drag plane via raycasting and update the node's pinned position in the Force_Simulation on every pointermove event — position updates only when the pointer actually moves, not continuously
3. WHEN a drag ends (pointerup after an actual drag gesture with movement), THE useNodeDrag hook SHALL pin the node at its final 3D position, re-enable OrbitControls, and leave the node fixed until explicitly unpinned — a click without drag movement does NOT pin the node
4. IF the ray-plane intersection fails (pointer exits canvas bounds or extreme angle), THEN THE useNodeDrag hook SHALL retain the node at its last valid intersection position without releasing the drag gesture
5. WHILE a node is being dragged, THE Force_Simulation SHALL continue ticking for all other (non-pinned) nodes — dragging one node does not freeze the simulation
6. WHILE a node is being dragged, THE Force_Simulation SHALL reheat (alpha reset to 1.0) so that connected neighbors react to the new position — the graph responds organically to the drag
7. WHEN a drag ends, THE node SHALL remain pinned permanently at its drop position until the user explicitly unpins it (via double-click, context menu, or unpin button) — there is no auto-unpin timeout

### Requirement 6: Preserved Graph Data Contracts

**User Story:** As a developer, I want the v2 enhancements to never violate the existing graph correctness invariants, so that all v1 consumers continue to work.

#### Acceptance Criteria

1. THE View_Model SHALL produce a nodes array where every node.id is unique across all layers (no duplicate IDs)
2. FOR ALL edges in the result, THE View_Model SHALL ensure edge.source and edge.target each reference exactly one valid node.id in the nodes array (referential integrity)
3. FOR ALL inter-layer edges, THE View_Model SHALL ensure the source layer has a lower or equal index in LAYER_ORDER than the target layer (directed flow — energy never flows backwards)
4. THE View_Model SHALL normalize all edge weights to [0.0, 1.0] — no edge weight below 0.0 or above 1.0
5. THE View_Model SHALL produce no edge where edge.source equals edge.target (no self-edges)
6. THE View_Model SHALL never generate an edge representing a synergy not derivable from the provided engine data (no invented synergies — every edge traces to a ModifierSource, BridgedEffect, ConditionalEffectEvaluation, or DamageOutputMetrics field)
7. THE View_Model SHALL never mutate the input BuildSelection, CalculationInput, or CombatOutput objects — all derivation operates on copies or filtered views

### Requirement 18: Performance Acceptance Criteria

**User Story:** As a developer, I want measurable performance targets, so that I can objectively verify the system meets its frame budget across different graph sizes.

#### Acceptance Criteria

1. THE Rendering_Layer SHALL maintain 60 FPS (16.6ms frame budget) with a graph of 75 nodes and 150 edges on the reference machine (any machine capable of running OHMM's dev server)
2. THE Rendering_Layer SHALL maintain at minimum 30 FPS (33ms frame budget) with a graph of 250 nodes (LOD Collapsed/Static tier)
3. AFTER 5 minutes of idle rendering (no user interaction, settled simulation), THE Rendering_Layer SHALL exhibit zero net heap growth — no memory leak from animation loops, particle buffers, or context updates
4. INSIDE any useFrame callback, THE Rendering_Layer SHALL perform zero heap allocations except during intentional buffer rebuilds (edge/node count changes) — no per-frame `new Object()`, `new Map()`, `new Array()`, or `new THREE.Vector3()` calls; all working objects SHALL be pre-allocated as refs or module-level constants
5. THE Rendering_Layer SHALL compile at most one shader program per unique material type — no per-node or per-edge shader compilation; materials SHALL be shared via instances or pools
6. THE View_Model deriveBuildGraph function SHALL complete execution in less than 15ms for graphs containing up to 64 nodes and up to 256 edges

### Requirement 19: Simulation-Visual Energy Separation

**User Story:** As a developer, I want gameplay-semantic values (analytics, DPS contribution) cleanly separated from rendering-layer intensity (brightness, glow, size), so that future features can modify visual treatment without accidentally coupling to gameplay logic.

#### Acceptance Criteria

1. THE View_Model SHALL compute and expose Combat_Influence per node as a value in [0.0, 1.0] derived from analytics (eigenvector centrality, DPS contribution, degree, edge weight sum) — this is a data-layer concept with no rendering semantics
2. THE Rendering_Layer SHALL derive Visual_Intensity (emissive brightness, mesh scale, glow radius) from Combat_Influence via a configurable mapping function — the mapping is owned by the renderer, not the View_Model
3. THE View_Model SHALL NOT contain any reference to Three.js types, color hex values, material properties, or rendering-specific constants — it produces numbers and strings only
4. THE Rendering_Layer SHALL be replaceable (swap R3F for a different renderer, or the 2D SVG fallback) without modifying any file in `src/lib/ohmm/theorycraft/` — the View_Model layer has zero rendering dependencies

### Requirement 20: Renderer Independence

**User Story:** As a developer, I want the rendering layer fully replaceable without touching graph derivation or analytics, so that future renderer upgrades don't require revalidating the data pipeline.

#### Acceptance Criteria

1. THE graph derivation layer (`src/lib/ohmm/theorycraft/`) SHALL have zero import statements referencing React, Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing, or d3-force-3d
2. THE Rendering_Layer SHALL consume the BuildGraphViewModel interface as its sole data contract with the View_Model — no internal View_Model types or functions are used directly by rendering components except through this interface
3. THE Force_Simulation wrapper (ForceSimulation.ts) SHALL live in the rendering layer (`src/app/components/`) since it is a rendering concern — not in the theorycraft lib

---

## Tier 2: Visual Intelligence — Heartbeat, Bloom, Particles, Camera Cinema

---

### Requirement 7: Heartbeat Frequency and Brightness

**User Story:** As a player, I want the graph to pulse in sync with my combat timing, so that the visualization communicates DPS rhythm intuitively.

#### Acceptance Criteria

1. WHEN CombatOutput contains timing metrics (DPS cycle time, crit intervals, or status tick intervals), THE Heartbeat_Engine SHALL derive baseFrequency as the reciprocal of the dominant combat cycle period, clamped to [0.1, 5.0] Hz
2. WHEN the Heartbeat_Engine transitions from one baseFrequency to another (combat timing changes), THE Heartbeat_Engine SHALL interpolate from the old frequency to the new frequency using linear interpolation over exactly 500ms — no instantaneous jumps
3. WHILE the heartbeat is active (DPS > 0), THE Heartbeat_Engine SHALL produce brightnessMultipliers for each node where the multiplier equals `1 + pulseIntensity × energyLevel`, with pulseIntensity clamped to [0.02, 0.15] — multipliers are always >= 1.0 (heartbeat only adds brightness, never subtracts)
4. WHEN DPS equals 0 or CombatOutput contains no timing metrics, THE Heartbeat_Engine SHALL set isActive to false, set all brightnessMultipliers to 1.0, and complete the fade-out within one pulse cycle (max 1000ms)
5. THE Heartbeat_Engine SHALL apply a continuous breathing animation to all nodes: sinusoidal oscillation at 0.3 Hz frequency with 0.05 amplitude multiplied against normalizedSize — this breathing runs ALWAYS regardless of heartbeat active/inactive state
6. WHEN the heartbeat deactivates (isActive transitions from true to false), THE Heartbeat_Engine SHALL decay brightnessMultipliers smoothly back to 1.0 over 800ms (matching ENERGY_CONFIG.pulseDecayMs) — no hard snap to 1.0

### Requirement 8: Bloom Post-Processing

**User Story:** As a player, I want high-energy nodes to emit a soft glow, so that the most impactful parts of my build stand out visually.

#### Acceptance Criteria

1. WHEN bloom is enabled (LOD tier is Full or Reduced — regardless of previous bloom state), THE Rendering_Layer SHALL apply selective bloom using EffectComposer with luminanceThreshold=0.6, intensity=1.2, radius=0.7 — only objects on layer 1 receive bloom
2. THE Rendering_Layer SHALL assign node meshes to Three.js render layer 1 (bloom layer) and keep edge meshes on layer 0 only — edges never bloom
3. IF @react-three/postprocessing is not installed or fails to import, THEN THE Rendering_Layer SHALL render without EffectComposer (graceful degradation) — no crash, no error boundary trigger
4. WHEN LOD tier is currently Collapsed or Static (regardless of how the tier was reached), THE Rendering_Layer SHALL disable bloom entirely (remove EffectComposer from render tree)

### Requirement 9: Per-Instance Particle Colors

**User Story:** As a player, I want energy particles flowing along edges to match the edge's semantic category color, so that I can visually distinguish damage flow from stat flow from keyword flow.

#### Acceptance Criteria

1. WHEN DirectedParticles renders, THE Rendering_Layer SHALL assign each particle instance a color matching its parent edge's category via EDGE_VISUAL_CONFIG[category].particleColor using an InstancedBufferAttribute of Float32Array (3 floats per instance: r, g, b)
2. THE Rendering_Layer SHALL render all particles in a single InstancedMesh draw call — per-instance color does not add draw calls
3. WHEN an edge's category color is looked up, THE Rendering_Layer SHALL produce a Float32Array entry where each component (r, g, b) matches THREE.Color.set(EDGE_VISUAL_CONFIG[category].particleColor) within tolerance 0.001

### Requirement 10: Cinematic Camera Transitions (Tier 2 Extensions)

**User Story:** As a player, I want camera transitions to feel smooth and cinematic, so that the 3D experience is immersive rather than jarring.

#### Acceptance Criteria

1. WHILE auto-orbit is active, THE Cinematic_Camera SHALL maintain constant distance between camera.position and controls.target (within floating-point tolerance 0.001) — only theta changes, radius stays fixed
2. WHEN auto-orbit is active and the user scrolls (wheel event), THE Cinematic_Camera SHALL immediately exit auto-orbit mode and transfer full control to OrbitControls
3. WHEN focus-on-node animation is in progress and the user initiates a new focus-on-node (different target), THE Cinematic_Camera SHALL cancel the current animation and start a new lerp from the current interpolated position to the new target

---

## Tier 3: Advanced Analysis — Temporal Playback, Failure Mode, Insights, Confidence

---

### Requirement 11: Temporal Playback Activation

**User Story:** As a player, I want to see my combat chain animate through the neural network, so that I can understand the exact order in which my equipment and procs fire.

#### Acceptance Criteria

1. WHEN CombatOutput.damageOutput.DPS is greater than 0 AND the graph contains at least one equipment-layer node with category "weapon", THE View_Model SHALL call buildTemporalChain(combatOutput, nodes, edges) inside deriveBuildGraph and assign the result to viewModel.temporalChain — temporalChain is non-null
2. IF CombatOutput is null, CombatOutput.damageOutput.DPS is undefined, CombatOutput.damageOutput.DPS is 0, or the graph contains no equipment-layer node with category "weapon", THEN THE View_Model SHALL set viewModel.temporalChain to null — buildTemporalChain is NOT called
3. WHEN buildTemporalChain produces a CombatTemporalChain, THE Temporal_Chain_Engine SHALL ensure frames are ordered by strictly increasing timestamp — frames[i].timestamp < frames[i+1].timestamp for all adjacent pairs
4. WHEN buildTemporalChain produces a CombatTemporalChain, THE Temporal_Chain_Engine SHALL ensure every frame.activeNodeId references a valid node.id in the nodes array, and every non-null frame.activeEdgeId references a valid edge.id in the edges array
5. WHEN buildTemporalChain encounters a frame whose activeNodeId does not exist in the current nodes array, THE Temporal_Chain_Engine SHALL log a console warning but retain the frame in the chain with activeNodeId set to the nearest valid node (by layer proximity) — the chain length is preserved, only the invalid reference is remapped
6. WHILE temporal playback is active, THE Rendering_Layer SHALL set the active node's rendered brightness to 1.0 and reduce all other nodes' rendered brightness to 30% of their base energyLevel
7. WHEN temporal playback completes its final frame, THE Rendering_Layer SHALL restore all nodes to their base energyLevel values within 800ms (ENERGY_CONFIG.pulseDecayMs)

### Requirement 12: Failure Mode Non-Mutation

**User Story:** As a theorycrafting player, I want to simulate removing equipment without corrupting the actual graph state, so that analysis is safe and repeatable.

#### Acceptance Criteria

1. WHEN a user selects a node for removal analysis, THE Failure_Mode_Engine SHALL compute the impact without mutating the original nodes array, edges array, or analytics objects — input arrays and objects SHALL maintain reference identity (=== before and after) and deep equality with their state before the call
2. WHEN failure impact is computed, THE Failure_Mode_Engine SHALL operate on a shallow copy of the nodes and edges arrays, removing the target node and all edges referencing it, then recompute cohesion and connected components on the copy
3. IF the removedNodeId does not exist in the graph, THEN THE Failure_Mode_Engine SHALL throw an Error with a descriptive message including the invalid ID — callers are responsible for validating node existence before invoking failure analysis
4. THE Failure_Mode_Engine SHALL complete computation within 10ms for graphs with up to 64 nodes

### Requirement 13: Confidence Propagation from Registry

**User Story:** As a player, I want node confidence to reflect actual data provenance from the registry, so that I can see which parts of my build analysis are based on verified data vs guesses.

#### Acceptance Criteria

1. WHEN propagating confidence, THE View_Model SHALL assign equipment-layer node confidence directly from the registry item's confidence metadata (project_verified, observed, estimated, or placeholder)
2. WHEN propagating confidence layer-by-layer, THE View_Model SHALL assign each non-equipment node's confidence as the minimum (worst-case) of the confidence levels of all nodes connected to it via incoming edges — using hierarchy project_verified > observed > estimated > placeholder
3. FOR ALL edges in the graph, THE View_Model SHALL ensure the target node's confidence index in CONFIDENCE_ORDER is greater than or equal to the source node's confidence index — confidence monotonically decreases (or stays equal) through pipeline layers, never increases
4. WHEN a node has zero incoming edges and is not in the equipment layer, THE View_Model SHALL assign confidence "placeholder" (no provenance source)
5. THE View_Model SHALL assign edge confidence as min(source.confidence, target.confidence) for visual styling purposes

### Requirement 14: Confidence Visualization Rendering

**User Story:** As a player, I want to visually distinguish verified data from estimated or placeholder data, so that I can trust the accuracy of displayed synergies.

#### Acceptance Criteria

1. WHEN rendering edges, THE Rendering_Layer SHALL apply visual styles per confidence: solid line at opacity 1.0 with glow intensity 0.8 for project_verified, solid line at opacity 0.85 with glow intensity 0.5 for observed, dashed line at opacity 0.6 with glow disabled for estimated, dotted line at opacity 0.35 with glow intensity 0.2 for placeholder
2. WHEN rendering nodes, THE Rendering_Layer SHALL modulate emissive intensity per confidence: 1.0× for project_verified, 0.7× for observed, 0.4× with desaturated color for estimated, 0.2× with desaturated color for placeholder
3. WHEN a user hovers over or selects a node or edge, THE Build_Graph_System SHALL display a tooltip including the human-readable confidence label (Verified, Observed, Estimated, or Placeholder)

### Requirement 15: Performance LOD Thresholds

**User Story:** As a player, I want the graph to run smoothly regardless of build complexity, so that frame rate stays consistent on a variety of hardware.

#### Acceptance Criteria

1. WHEN total node count is 1–30, THE LOD_System SHALL render at Full quality: 8 particles per edge, 3 simulation ticks per frame, full bloom, active heartbeat
2. WHEN total node count is 31–60, THE LOD_System SHALL render at Reduced quality: 3 particles per edge, 2 simulation ticks per frame, reduced bloom intensity
3. WHEN total node count is 61–100, THE LOD_System SHALL render at Collapsed quality: collapse inner layers (stats, keywords, status-effects, combat-formula) into summary nodes, disable particles, 1 simulation tick per frame, disable heartbeat
4. WHEN total node count exceeds 100, THE LOD_System SHALL render at Static quality: pre-computed deterministic layout, 2D SVG fallback, no animation
5. WHEN total node count transitions between LOD tier boundaries (30, 60, 100), THE LOD_System SHALL apply a hysteresis margin of 3 nodes before switching tiers — a graph at 31 nodes stays in Full tier until reaching 33; a graph at 60 nodes stays in Reduced tier until reaching 57
6. IF the per-frame render time exceeds 12ms for 10 consecutive frames, THEN THE LOD_System SHALL automatically drop to the next lower LOD tier without user intervention
7. WHEN the LOD_System has auto-dropped a tier, THE LOD_System SHALL auto-promote only when render time has remained below 8ms for at least 30 consecutive frames, including the current frame — the 30th sub-8ms frame triggers promotion, not the 31st
8. WHEN the graph scene is not visible in the viewport (IntersectionObserver reports 0% intersection), THE Rendering_Layer SHALL pause the Force_Simulation and suspend the rendering loop entirely — zero GPU/CPU cost while offscreen
9. THE Rendering_Layer SHALL maintain a per-frame render time of less than 8ms measured as the 95th percentile over any rolling 2-second window

### Requirement 16: Accessibility Fallback

**User Story:** As a player using assistive technology or a device without WebGL, I want an accessible alternative, so that I can still understand my build's synergy network.

#### Acceptance Criteria

1. WHEN WebGL 2.0 is not available at component mount OR a WebGL context loss event fires, THE Build_Graph_System SHALL render the 2D SVG Fallback_Renderer instead of the 3D scene — transition preserves current graph state
2. WHEN the user has prefers-reduced-motion enabled, THE Build_Graph_System SHALL disable all decorative animation (particles, heartbeat pulse, breathing oscillation, camera transitions, auto-orbit) and render a static force-settled layout — however, user-initiated temporal playback SHALL remain available since it is informational, not decorative
3. WHEN the 2D SVG fallback renders, THE Fallback_Renderer SHALL provide full keyboard navigation: arrow keys to traverse between connected nodes, Tab/Shift+Tab to move between layers, Enter to select a node for details
4. WHEN the 2D SVG fallback renders, THE Fallback_Renderer SHALL provide ARIA labels on all nodes (role="img" with aria-label containing node label, layer, energy level, and confidence) and edges (aria-label containing source label, target label, category, and weight)
5. WHEN a WebGL context loss occurs while the 3D scene is active, THE Build_Graph_System SHALL transition to the 2D SVG fallback within one animation frame without losing node positions, selection state, or overlay visibility

### Requirement 17: Rule-Based Explainability Engine

**User Story:** As a player, I want deterministic, reproducible build advice derived from graph analytics, so that I can understand optimization opportunities without being a graph theory expert.

#### Acceptance Criteria

1. WHEN analytics and cohesion data are available, THE Explainability_Engine SHALL generate between 0 and 7 BuildInsight objects sorted by priority descending — each insight is computed from deterministic rules over centrality, cohesion components, edge weights, and node energy, NOT from any language model or probabilistic system
2. FOR ALL insights returned, THE Explainability_Engine SHALL ensure every nodeId in insight.relatedNodes references a valid node.id in the nodes array — no dangling references
3. FOR ALL insights returned, THE Explainability_Engine SHALL ensure no two insights have the same id
4. WHEN cohesion.score >= 0.75, THE Explainability_Engine SHALL set overallRating to "optimal"; WHEN >= 0.55 THE Explainability_Engine SHALL set "strong"; WHEN >= 0.35 THE Explainability_Engine SHALL set "average"; otherwise THE Explainability_Engine SHALL set "weak"
5. THE Explainability_Engine SHALL never throw an exception — on any edge case (empty nodes, empty analytics, NaN scores) the function SHALL return an empty insights array with overallRating "weak" and a summary string indicating insufficient data
6. WHEN generating insights, THE Explainability_Engine SHALL produce statements referencing concrete values (e.g., "Burn contributes 42% of outgoing damage", "Gloves are your largest upgrade opportunity — connected to 7 downstream nodes but contributing only 3% DPS") — not vague qualitative claims

