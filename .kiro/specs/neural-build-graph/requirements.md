# Requirements Document

## Introduction

The Neural Network Build Graph is a living, multi-layer force-directed 3D visualization that renders a player's equipment loadout as an organic neural network within the OHMM combat calculator. It transforms the combat pipeline into an explainable six-layer graph — from equipment through stats, keywords, status effects, and combat formulas to final output — with animated energy flow, graph analytics, failure mode analysis, and temporal combat chain playback.

## Glossary

- **Build_Graph_System**: The complete neural network build graph subsystem including view model, analytics, and rendering layers
- **View_Model**: The pure TypeScript derivation layer (`buildGraph.vm.ts`) that transforms theorycraft state into graph structures
- **Graph_Analytics_Engine**: The module computing centrality, clustering, community detection, and connected components
- **Failure_Mode_Engine**: The module computing hypothetical node removal impact without mutating original state
- **Temporal_Chain_Engine**: The module constructing combat execution order frames from CombatOutput timing data
- **Cohesion_Engine**: The module computing the five-component cohesion formula
- **Rendering_Layer**: The React Three Fiber 3D scene and all visual components
- **Fallback_Renderer**: The 2D SVG accessibility fallback for non-WebGL environments
- **Force_Simulation**: The d3-force-3d physics engine positioning nodes in 3D space
- **Heartbeat_Engine**: The combat-synchronized pulse system driving node brightness oscillation
- **GraphNode**: A vertex in the multi-layer graph representing an equipment piece, stat, keyword, status effect, formula group, or output metric
- **GraphEdge**: A directed connection between two nodes representing causality or contribution
- **GraphLayer**: One of six semantic tiers: equipment, stats, keywords, status-effects, combat-formula, final-output
- **EnergyLevel**: A 0.0–1.0 value per node derived from DPS contribution percentage
- **InfluenceScore**: A composite importance metric combining centrality, DPS contribution, dependency count, and synergy weight
- **CohesionScore**: A 0.0–1.0 metric computed as the product of network density, average edge weight, connectivity, node utilization, and critical path efficiency
- **ConfidenceLevel**: Data provenance classification: project_verified, observed, estimated, or placeholder
- **LOD**: Level of Detail — performance scaling strategy based on node count and device capability
- **BuildSelection**: The user's current equipment loadout from the existing OHMM system
- **CalculationInput**: Normalized representation of the build fed into the combat engine
- **CombatOutput**: Computed damage, survivability, and PvP metrics from the engine

## Requirements

### Requirement 1: Multi-Layer Graph Derivation

**User Story:** As a player, I want my equipment loadout transformed into a multi-layer neural network graph, so that I can see how each piece of equipment contributes through the entire combat pipeline.

#### Acceptance Criteria

1. WHEN a BuildSelection, CalculationInput, and CombatOutput are provided, THE View_Model SHALL produce a BuildGraphViewModel containing nodes organized into six semantic layers: equipment, stats, keywords, status-effects, combat-formula, and final-output
2. WHEN extracting equipment layer nodes, THE View_Model SHALL create one GraphNode per occupied slot from the BuildSelection: one weapon node, one node per non-empty armor slot (head, mask, chest, gloves, pants, boots), one node per non-empty mod slot (up to 7 cores and 7 suffixes), one food node, one drink node, one deviant node, and one cradle node — skipping any slot that is empty, null, or undefined
3. WHEN extracting stat layer nodes, THE View_Model SHALL create one GraphNode per unique statKey that appears at least once in CalculationInput.modifierSources with a non-zero value
4. WHEN extracting keyword layer nodes, THE View_Model SHALL create one GraphNode per unique BridgedEffect.category value present in CalculationInput.modeledEffects where the effect has contributesModifiers equal to true
5. WHEN extracting status effect layer nodes, THE View_Model SHALL create one GraphNode per unique status-related statKey (burn, freeze, corrosion, explosion, or other status keywords) that has at least one contributing ModifierSource in CalculationInput.modifierSources and is referenced in CalculationInput.modeledEffects
6. THE View_Model SHALL always produce exactly three combat-formula layer nodes (additive-group, multiplicative-group, base-damage) and exactly three final-output layer nodes (dps, ttk, expected-damage) regardless of input content
7. WHEN the graph is derived, THE View_Model SHALL produce a nodes array where every node.id is unique across all layers
8. WHEN the total number of generated nodes across all layers exceeds 100, THE View_Model SHALL cap the stats and keywords layers by retaining only the nodes with the highest absolute modifier values, limiting total node count to 100

### Requirement 2: Inter-Layer Edge Derivation

**User Story:** As a player, I want to see directed connections between nodes showing how damage and modifiers flow through the combat pipeline, so that I can trace exactly which equipment contributes to my final DPS.

#### Acceptance Criteria

1. WHEN computing edges, THE View_Model SHALL create one directed edge from each equipment node to each stat node where at least one ModifierSource in CalculationInput.modifierSources has an origin matching the equipment node's ID and a statKey matching the stat node's ID
2. WHEN computing edges, THE View_Model SHALL create one directed edge from each stat node to each keyword node where CalculationInput.modeledEffects contains a BridgedEffect whose scaling references that statKey
3. WHEN computing edges, THE View_Model SHALL create one directed edge from each keyword node to each status effect node where the keyword triggers the status proc according to CalculationInput.modeledEffects
4. WHEN computing edges, THE View_Model SHALL create directed edges from status effect nodes and stat nodes to combat-formula nodes: nodes contributing additive bonuses connect to additive-group, and nodes contributing multiplicative bonuses connect to multiplicative-group
5. WHEN computing edges, THE View_Model SHALL create directed edges from all three combat-formula nodes (additive-group, multiplicative-group, base-damage) to all three final-output nodes (dps, ttk, expected-damage)
6. FOR ALL inter-layer edges, THE View_Model SHALL ensure the source layer has a lower or equal index in LAYER_ORDER than the target layer — energy flows down the pipeline, never backwards
7. FOR ALL edges in the result, THE View_Model SHALL ensure edge.source and edge.target each reference exactly one valid node.id in the nodes array
8. THE View_Model SHALL produce no edge where edge.source equals edge.target
9. THE View_Model SHALL produce no two edges with the same combination of source, target, and category
10. WHEN edge weights are computed, THE View_Model SHALL normalize all edge weights to [0.0, 1.0] by dividing each raw weight by the maximum raw weight across all edges, with the maximum-weight edge having weight equal to 1.0
11. WHEN the graph contains zero edges after computation, THE View_Model SHALL set metrics.strongestSynergy to null

### Requirement 3: Energy Level and Influence Scoring

**User Story:** As a player, I want nodes that contribute more to my DPS to glow brighter and appear larger, so that I can instantly identify the most impactful parts of my build.

#### Acceptance Criteria

1. WHEN computing energy levels, THE View_Model SHALL assign each node an energyLevel equal to max(0.05, nodeContributionPercentage / maxContributionPercentage) where nodeContributionPercentage is the node's share of total DPS output expressed as a value between 0 and 100, and maxContributionPercentage is the highest such share among all nodes, producing a final value clamped to the range [0.05, 1.0]
2. THE View_Model SHALL assign final-output layer nodes an energyLevel of 1.0, overriding the contribution-based calculation
3. WHEN computing influence scores, THE View_Model SHALL calculate InfluenceScore as (0.3 × normalizedEigenvector) + (0.35 × normalizedDPSContribution) + (0.2 × normalizedDegree) + (0.15 × normalizedEdgeWeightSum), where each component is independently normalized to [0.0, 1.0] by dividing by the maximum value of that component across all nodes before weighting
4. THE View_Model SHALL clamp the influenceScore of every node in the graph to the range [0.0, 1.0]
5. IF DPS is 0 or CombatOutput is null or undefined, THEN THE View_Model SHALL assign all nodes across all six layers a uniform energyLevel of 0.3 and set HeartbeatConfig.isActive to false

### Requirement 4: Graph Analytics Computation

**User Story:** As a theorycrafting player, I want to see advanced graph analytics like centrality and community detection, so that I can understand which nodes are most critical to my build's synergy network.

#### Acceptance Criteria

1. WHEN analytics are computed, THE Graph_Analytics_Engine SHALL treat the graph as undirected for all centrality and clustering calculations (ignoring edge direction), calculate degree centrality as node_connections divided by (totalNodes - 1), betweenness centrality as the fraction of all-pairs shortest paths passing through the node, and eigenvector centrality via power iteration with a maximum of 100 iterations or convergence tolerance of 1e-6 (whichever is reached first), each normalized to the range [0.0, 1.0]
2. WHEN analytics are computed, THE Graph_Analytics_Engine SHALL calculate a clustering coefficient for every node in the range [0.0, 1.0], defined as the number of edges among the node's undirected neighbors divided by the maximum possible edges among them, with nodes having fewer than 2 neighbors receiving a coefficient of 0
3. WHEN analytics are computed, THE Graph_Analytics_Engine SHALL identify all weakly connected components (treating edges as undirected) such that the union of all component members equals the complete set of node IDs and no two components share a member
4. WHEN community detection runs, THE Graph_Analytics_Engine SHALL assign every node to exactly one community using the Louvain modularity optimization algorithm, such that the union of all community members equals the complete set of node IDs
5. WHEN analytics are computed, THE Graph_Analytics_Engine SHALL calculate global network density as actualEdges divided by (n × (n - 1)), where n is the total node count and the denominator reflects the directed nature of edges
6. WHEN the graph has zero nodes, THE Graph_Analytics_Engine SHALL return an empty analytics result without throwing
7. WHEN the graph has exactly one node, THE Graph_Analytics_Engine SHALL return all centrality values as 0, clustering coefficient as 0, network density as 0, a single connected component containing that node, and a single community containing that node
8. IF eigenvector power iteration does not converge within 100 iterations, THEN THE Graph_Analytics_Engine SHALL return the current approximation normalized to [0.0, 1.0] without throwing

### Requirement 5: Cohesion Score Computation

**User Story:** As a player, I want a single cohesion score that summarizes how well my build synergizes, so that I can quickly evaluate loadout quality.

#### Acceptance Criteria

1. WHEN cohesion is computed, THE Cohesion_Engine SHALL calculate the raw score as the product of five components (each individually in [0.0, 1.0]): network density (actual edges / max possible edges), average edge weight (mean of all edge weights), connectivity (fraction of active nodes in the main connected component), node utilization (active equipment nodes / total equipment nodes), and critical path efficiency (longest weighted path from equipment layer to output layer / theoretical maximum), then apply a cube-root normalization to the raw product, and clamp the final score to [0.0, 1.0]
2. WHEN the cohesion score is computed, THE Cohesion_Engine SHALL classify it into one of five labels based on COHESION_THRESHOLDS: Scattered (score < 0.15), Loose (score >= 0.15 and < 0.35), Moderate (score >= 0.35 and < 0.55), Tight (score >= 0.55 and < 0.75), or Unified (score >= 0.75)
3. IF fewer than 2 nodes with isActive === true exist in the graph OR 0 edges exist, THEN THE Cohesion_Engine SHALL return a score of 0.0, label "Scattered", all five components set to 0, and insight "Equip more items to see synergies."
4. WHEN cohesion is computed and the graph contains 2 or more active nodes and at least 1 edge, THE Cohesion_Engine SHALL generate an insight string that contains at minimum: the cohesion label and a reference to the lowest-scoring component among the five (identifying which factor most limits the build's synergy)
5. WHEN cohesion is computed, THE Cohesion_Engine SHALL include in the result the individual values of all five components (networkDensity, averageEdgeWeight, connectivity, nodeUtilization, criticalPathEfficiency), each as a number in [0.0, 1.0]

### Requirement 6: Failure Mode Analysis

**User Story:** As a theorycrafting player, I want to simulate removing any piece of equipment and see its impact on my build's cohesion and connectivity, so that I can identify critical dependencies and optimize my loadout.

#### Acceptance Criteria

1. WHEN a user selects a node for removal analysis, THE Failure_Mode_Engine SHALL compute the impact without mutating the original nodes, edges, or analytics objects — the input arrays and objects SHALL maintain reference identity and deep equality with their state before the call
2. WHEN failure impact is computed, THE Failure_Mode_Engine SHALL remove the target node and all edges where the node appears as source or target, recompute cohesion and connected components on the reduced graph, and report: the cohesion score before and after removal, the percentage drop, the list of nodes that were reachable from the main component before removal but are no longer reachable after removal (disconnected nodes), severed edges, split communities, and new components created
3. WHEN failure impact is computed, THE Failure_Mode_Engine SHALL calculate cohesionDropPercent as ((originalCohesion - reducedCohesion) / originalCohesion) × 100 when originalCohesion is greater than 0, and 0 otherwise
4. WHEN failure impact is computed, THE Failure_Mode_Engine SHALL assign a severity rating based on cohesionDropPercent using exclusive lower bounds: negligible (0% to less than 5%), minor (5% or greater to less than 15%), moderate (15% or greater to less than 30%), major (30% or greater to less than 50%), or critical (50% or greater)
5. WHEN failure impact is computed, THE Failure_Mode_Engine SHALL produce an impactSummary string containing, in order: the removed node's label, the cohesion drop percentage rounded to one decimal place, the disconnected node count, and the severed edge count
6. IF the removedNodeId does not exist in the graph, THEN THE Failure_Mode_Engine SHALL return a FailureModeResult with cohesionDropPercent of 0, empty arrays for disconnectedNodes, severedEdges, and splitCommunities, newComponentsCreated of 0, severity of "negligible", and an impactSummary indicating the node was not found — without throwing an exception
7. IF the user attempts to remove a final-output layer node, THEN THE Rendering_Layer SHALL prevent the removal and display a notification indicating that output nodes cannot be removed, without invoking the Failure_Mode_Engine
8. WHEN failure impact is computed for a graph with up to 64 nodes, THE Failure_Mode_Engine SHALL complete computation within 10ms

### Requirement 7: Temporal Combat Chain Playback

**User Story:** As a player, I want to see an animated playback of my combat execution chain through the neural network, so that I can understand the exact order in which my equipment, keywords, and procs fire during a DPS cycle.

#### Acceptance Criteria

1. WHEN CombatOutput.damageOutput.DPS is greater than 0 and the graph contains at least one equipment-layer node with category "weapon", THE Temporal_Chain_Engine SHALL construct a CombatTemporalChain containing between 3 and 64 ordered TemporalFrames representing one full DPS cycle from weapon fire through formula computation to final output, with a cycleDuration between 100ms and 30000ms
2. THE Temporal_Chain_Engine SHALL ensure frames within a CombatTemporalChain are ordered by strictly increasing timestamp — frames[i].timestamp is less than frames[i+1].timestamp for all adjacent pairs, with each timestamp being a non-negative integer in milliseconds
3. THE Temporal_Chain_Engine SHALL ensure every frame.activeNodeId references a valid node.id present in the BuildGraphViewModel.nodes array, and every non-null frame.activeEdgeId references a valid edge.id present in the BuildGraphViewModel.edges array
4. IF CombatOutput is null, CombatOutput.damageOutput.DPS is undefined, CombatOutput.damageOutput.DPS is 0, or the graph contains no equipment-layer node with category "weapon", THEN THE Temporal_Chain_Engine SHALL return null for the temporalChain field of BuildGraphViewModel
5. WHILE temporal playback is active, WHEN a TemporalFrame becomes current, THE Rendering_Layer SHALL set the active node's energyLevel to 1.0, animate a directed particle burst along the activeEdgeId if non-null, and reduce all other nodes' rendered brightness to 30% of their base energyLevel
6. WHEN temporal playback completes its final frame, THE Rendering_Layer SHALL restore all nodes to their base energyLevel values as computed by the BuildGraphViewModel within 800ms (matching ENERGY_CONFIG.pulseDecayMs)
7. WHEN temporal playback is active and CombatTemporalChain.isLooping is true, THE Rendering_Layer SHALL restart playback from frame index 0 after the final frame completes, continuing until the user stops playback
8. WHILE temporal playback is active, THE Rendering_Layer SHALL advance frames at a rate that completes one full cycle in a duration equal to CombatTemporalChain.cycleDuration multiplied by a playback speed factor of 1.0 (real-time), distributing frame display time proportionally to the timestamp gaps between consecutive frames

### Requirement 8: Heartbeat and Living Energy System

**User Story:** As a player, I want the neural network to pulse and breathe in sync with my combat timing, so that the graph feels alive and organic rather than static.

#### Acceptance Criteria

1. WHEN CombatOutput contains timing metrics (DPS cycle time, crit intervals, or status tick intervals), THE Heartbeat_Engine SHALL derive heartbeat.baseFrequency by computing the reciprocal of the dominant combat cycle period and clamping the result to [0.1, 5.0] Hz
2. IF the derived heartbeat.baseFrequency would fall outside [0.1, 5.0] Hz, THEN THE Heartbeat_Engine SHALL clamp it to the nearest bound (0.1 Hz if below, 5.0 Hz if above) and set heartbeat.isActive to true
3. WHILE the heartbeat is active, THE Rendering_Layer SHALL on each pulse cycle scale node brightness by the formula (1 + pulseIntensity × energyLevel) where pulseIntensity is clamped to [0.02, 0.15], and propagate the brightness ripple outward from the node with the highest energyLevel with a decay duration of 800 ms
4. WHEN DPS equals 0 or CombatOutput contains no timing metrics, THE Heartbeat_Engine SHALL set heartbeat.isActive to false, set pulseIntensity to 0, and restore all node brightness values to their base energyLevel within one pulse cycle (no longer than 1000 ms)
5. THE Rendering_Layer SHALL apply a continuous breathing animation to all nodes with a sinusoidal oscillation at 0.3 Hz frequency and 0.05 amplitude (multiplied against normalizedSize), independent of whether the heartbeat pulse is active or inactive
6. WHEN CombatOutput timing metrics change (new DPS cycle time, crit interval, or status tick interval), THE Heartbeat_Engine SHALL recalculate heartbeat.baseFrequency within 100 ms of receiving the updated CombatOutput and transition to the new frequency using linear interpolation over 500 ms

### Requirement 9: Confidence Visualization

**User Story:** As a player, I want to visually distinguish verified data from estimated or placeholder data in the graph, so that I can trust the accuracy of displayed synergies.

#### Acceptance Criteria

1. THE Build_Graph_System SHALL classify every node and edge with a ConfidenceLevel of project_verified, observed, estimated, or placeholder, defaulting to placeholder when no source metadata is available to derive a level
2. WHEN rendering edges, THE Rendering_Layer SHALL apply visual styles based on confidence: solid line at opacity 1.0 with glow intensity 0.8 for project_verified, solid line at opacity 0.85 with glow intensity 0.5 for observed, dashed line at opacity 0.6 with glow disabled for estimated, and dotted line at opacity 0.35 with glow intensity 0.2 for placeholder
3. WHEN computing edge confidence, THE View_Model SHALL assign the edge's confidence as the minimum (worst-case) of the confidence levels of its source and target node metadata, using the hierarchy project_verified > observed > estimated > placeholder
4. WHEN rendering nodes, THE Rendering_Layer SHALL indicate confidence by modulating emissive intensity: full emissive intensity for project_verified, 0.7x emissive intensity for observed, 0.4x emissive intensity with a desaturated color shift for estimated, and 0.2x emissive intensity with a desaturated color shift for placeholder
5. WHEN the user hovers over or selects a node or edge, THE Build_Graph_System SHALL display a tooltip or detail label that includes the human-readable confidence label (Verified, Observed, Estimated, or Placeholder) alongside the element's primary information

### Requirement 10: 3D Rendering and Force Simulation

**User Story:** As a player, I want the neural network rendered as an interactive 3D force-directed graph, so that I can explore the relationships spatially and intuitively.

#### Acceptance Criteria

1. WHEN the BuildGraphViewModel.isRenderable is true and WebGL 2.0 is detected in the browser, THE Rendering_Layer SHALL render the graph using React Three Fiber within an isolated WebGL canvas with a per-frame budget of 8ms or less
2. IF WebGL is unavailable or the user's system reports prefers-reduced-motion, THEN THE Rendering_Layer SHALL render the BuildGraphFallback 2D SVG network view with equivalent node and edge data
3. WHILE the force simulation is active, THE Force_Simulation SHALL apply influence-weighted center gravity where each node's center pull equals centerStrength (0.05) plus the node's InfluenceScore multiplied by influenceCenterMultiplier (0.15)
4. WHILE the force simulation is active, THE Force_Simulation SHALL apply layer separation force with strength 0.1 to position each node toward its semantic layer's designated Y-band (Equipment: 30, Stats: 15, Keywords: 0, Status Effects: -15, Combat Formula: -30, Final Output: -45)
5. WHEN the force simulation alpha reaches alphaMin (0.001), THE Force_Simulation SHALL stop ticking until a node is added or removed, an edge is added or removed, or the user drags a node or calls reheat
6. WHEN users interact with the 3D scene, THE Rendering_Layer SHALL support orbit controls (rotate, zoom, pan), node hover tooltips displaying the node's label, formattedValue, layer, and confidence level, and node dragging that pins the node at fixed coordinates until explicitly unpinned
7. WHEN rendering directed edges, THE Rendering_Layer SHALL display between 1 and 8 animated particles per edge flowing from source to target node at the edge category's configured particleSpeed, indicating causality direction
8. IF the total node count exceeds 60, THEN THE Rendering_Layer SHALL reduce particles per edge to 3 or fewer and lower simulation ticks to 1 per frame to maintain the 8ms frame budget

### Requirement 11: Performance and Level of Detail

**User Story:** As a player, I want the neural network to run smoothly on a variety of hardware, so that frame rate remains consistent regardless of build complexity.

#### Acceptance Criteria

1. THE View_Model SHALL complete deriveBuildGraph execution in less than 15ms per invocation for graphs containing up to 64 nodes and up to 256 edges
2. THE Graph_Analytics_Engine SHALL complete analytics computation (centrality, clustering, community detection) in less than 8ms per invocation for graphs with up to 64 nodes and up to 256 edges
3. THE Rendering_Layer SHALL maintain a per-frame render time of less than 8ms, measured as the 95th percentile over any rolling 2-second window
4. WHEN total node count is 1–30, THE Rendering_Layer SHALL render at full quality with 8 particles per edge, 3 simulation ticks per frame, full glow, and active heartbeat
5. WHEN total node count is 31–60, THE Rendering_Layer SHALL reduce quality to 3 particles per edge, 2 simulation ticks per frame, and reduced glow
6. WHEN total node count is 61–100, THE Rendering_Layer SHALL collapse layers 2–5 (stats, keywords, status-effects, combat-formula) into summary nodes, disable particles, use 1 simulation tick per frame, and disable heartbeat
7. WHEN total node count exceeds 100, THE Rendering_Layer SHALL switch to static mode with pre-computed layout and render using the 2D SVG fallback
8. WHEN the graph scene is not visible in the viewport, THE Rendering_Layer SHALL pause the force simulation and suspend rendering loop via IntersectionObserver
9. IF the per-frame render time exceeds 12ms for 10 consecutive frames, THEN THE Rendering_Layer SHALL automatically drop to the next lower LOD tier until frame time returns below 8ms for at least 30 consecutive frames
10. WHEN total node count transitions between LOD tier boundaries (30, 60, 100), THE Rendering_Layer SHALL apply a hysteresis margin of 3 nodes before switching tiers, preventing rapid oscillation between quality levels

### Requirement 12: Accessibility and Fallback

**User Story:** As a player using assistive technology or a device without WebGL, I want an accessible alternative to the 3D visualization, so that I can still understand my build's synergy network.

#### Acceptance Criteria

1. WHEN WebGL 2.0 is not available at component mount or a WebGL context loss event fires, THE Build_Graph_System SHALL render the 2D SVG fallback instead of the 3D scene
2. WHEN the user has prefers-reduced-motion enabled, THE Build_Graph_System SHALL disable all animation (particles, heartbeat, breathing, temporal playback) and render a static force-settled layout
3. WHEN the 2D SVG fallback renders, THE Fallback_Renderer SHALL provide full keyboard navigation using arrow keys to traverse between connected nodes, Tab/Shift+Tab to move between layers, and Enter to select a node for details
4. WHEN the 2D SVG fallback renders, THE Fallback_Renderer SHALL provide ARIA labels on all nodes (role="img" with aria-label containing node label, layer, energy level, and confidence) and edges (aria-label containing source label, target label, category, and weight)
5. WHEN the 2D SVG fallback renders, THE Fallback_Renderer SHALL display the same multi-layer topology, cohesion score, analytics panel, and failure mode analysis as the 3D scene, with equivalent information density
6. WHEN a WebGL context loss event occurs while the 3D scene is active, THE Build_Graph_System SHALL automatically transition to the 2D SVG fallback without losing the current graph state

### Requirement 13: Data Integrity and Safe Defaults

**User Story:** As a player, I want the graph to handle incomplete or missing data gracefully, so that the visualization never crashes or displays misleading information.

#### Acceptance Criteria

1. WHEN any combination of null, undefined, or empty values is provided for BuildSelection, CalculationInput, or CombatOutput fields, THE View_Model SHALL return a well-typed BuildGraphViewModel with isRenderable set to false and a non-null emptyStateMessage, without throwing an exception
2. WHEN BuildSelection has fewer than 2 non-null equipped slots across weapon, armor (head, chest, pants, gloves, shoes), mod cores, cradle, deviant, and food, THE View_Model SHALL return isRenderable as false and a non-null emptyStateMessage describing the minimum equipment needed
3. WHEN a modifier source's origin identifier cannot be mapped to a known equipment node ID in the graph, THE View_Model SHALL omit that source from edge generation and continue processing remaining sources without throwing an exception
4. WHEN edge weight computation produces NaN or Infinity, THE View_Model SHALL clamp the value to 0.0 (the minimum valid edge weight)
5. WHEN CombatOutput.damageOutput.DPS is undefined, NaN, or 0, THE View_Model SHALL set all node energyLevel values to the configured minEnergy (0.05) and set heartbeat.isActive to false
6. WHEN the total generated node count across all layers would exceed 100, THE View_Model SHALL collapse inner layers (stats, keywords, status-effects, combat-formula) into representative summary nodes and include a human-readable warning string in the BuildGraphViewModel
7. THE View_Model SHALL never mutate the input BuildSelection, CalculationInput, or CombatOutput objects — all derivation operates on copies or filtered views
8. WHEN CombatOutput is null or undefined while BuildSelection contains 2 or more equipped slots, THE View_Model SHALL return isRenderable as true with all node energyLevel values set to minEnergy (0.05) and heartbeat.isActive set to false

### Requirement 14: No Invented Synergies

**User Story:** As a player, I want every connection in the neural network to trace back to real engine data, so that I can trust the graph represents actual combat relationships rather than guessed ones.

#### Acceptance Criteria

1. FOR ALL edges in the graph result, THE View_Model SHALL ensure every edge's `relation` field matches one of the following provenance sources present in the input CalculationInput or CombatOutput: a StatKey from `aggregationReport.stats.stats`, a `mechanicId` or `sourceType` from a ModifierSource in `modifierSources`, a keyword from `modeledEffects[].category`, a conditional effect ID from `conditionalEffects`, or a set bonus ID from a ModifierSource with `sourceType === "setBonus"`
2. THE View_Model SHALL never generate an edge representing a synergy not derivable from the provided engine data; specifically, if an edge's `source` and `target` node pair cannot be connected through at least one ModifierSource, BridgedEffect, ConditionalEffectEvaluation, or DamageOutputMetrics field present in the current CalculationInput or CombatOutput, that edge SHALL NOT appear in the BuildGraphViewModel output
3. WHEN the View_Model produces a BuildGraphViewModel, THE View_Model SHALL output zero edges whose `relation` value is an empty string, a placeholder token, or a value not found in the union of StatKey identifiers, ModifierSource mechanicIds, EdgeCategory values, and BridgedEffect category strings from the current computation inputs
4. IF a ModifierSource in CalculationInput has `conditional.isActive === false`, THEN THE View_Model SHALL NOT generate an edge for that modifier unless the edge's confidence is set to "estimated" and the edge weight is set to 0

### Requirement 15: Layer Node Count and Metrics Accuracy

**User Story:** As a player reviewing analytics, I want all reported metrics to be mathematically consistent with the underlying graph data, so that displayed numbers are trustworthy.

#### Acceptance Criteria

1. WHEN the BuildGraphViewModel is produced, THE View_Model SHALL ensure metrics.layerNodeCounts[layer] equals the count of nodes where node.layer equals that layer, for each of the six defined GraphLayer values
2. WHEN the BuildGraphViewModel is produced, THE View_Model SHALL ensure metrics.totalNodeCount equals the length of the nodes array
3. WHEN the BuildGraphViewModel is produced, THE View_Model SHALL ensure metrics.activeNodeCount equals the count of nodes where node.isActive is true
4. WHEN the BuildGraphViewModel is produced, THE View_Model SHALL ensure metrics.interLayerEdgeCount equals the count of edges where edge.isInterLayer is true
5. WHEN the BuildGraphViewModel is produced, THE View_Model SHALL ensure metrics.totalEdges equals the length of the edges array
6. WHEN the BuildGraphViewModel is produced, THE View_Model SHALL ensure metrics.isolatedNodeCount equals the count of nodes that have zero edges (neither as source nor target)
7. WHEN the BuildGraphViewModel is produced and at least one edge exists, THE View_Model SHALL ensure metrics.strongestSynergy is a non-empty string describing the highest-weight edge's relation and endpoint labels
