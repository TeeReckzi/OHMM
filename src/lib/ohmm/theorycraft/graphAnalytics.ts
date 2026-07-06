// src/lib/ohmm/theorycraft/graphAnalytics.ts
// Pure graph analytics engine — no React dependencies.
// All centrality/clustering calculations treat the graph as UNDIRECTED (ignoring edge direction).

import type {
  GraphNode,
  GraphEdge,
  GraphAnalytics,
  NodeCentrality,
  Community,
  ConnectedComponent,
  GraphLayer,
} from "./buildGraph.types";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute full graph analytics for a set of nodes and edges.
 * Treats the graph as UNDIRECTED for all centrality and clustering computations.
 * Network density uses the directed formula: actualEdges / (n × (n - 1)).
 */
export function computeGraphAnalytics(
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphAnalytics {
  const n = nodes.length;

  // Edge case: 0 nodes → empty result
  if (n === 0) {
    return {
      centralities: [],
      communities: [],
      connectedComponents: [],
      networkDensity: 0,
      averageClusteringCoefficient: 0,
      diameter: 0,
      isFullyConnected: true,
    };
  }

  // Edge case: 1 node → all zeros
  if (n === 1) {
    const node = nodes[0];
    return {
      centralities: [
        {
          nodeId: node.id,
          degree: 0,
          betweenness: 0,
          eigenvector: 0,
          clusteringCoefficient: 0,
        },
      ],
      communities: [
        {
          id: "community-0",
          label: `${node.layer} community`,
          members: [node.id],
          dominantLayer: node.layer,
          internalDensity: 0,
        },
      ],
      connectedComponents: [
        {
          id: "component-0",
          members: [node.id],
          isMain: true,
          size: 1,
        },
      ],
      networkDensity: 0,
      averageClusteringCoefficient: 0,
      diameter: 0,
      isFullyConnected: true,
    };
  }

  // Build undirected adjacency structures
  const nodeIds = nodes.map((node) => node.id);
  const nodeIndex = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    nodeIndex.set(nodeIds[i], i);
  }

  // Adjacency list (undirected: both directions)
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
  for (const edge of edges) {
    const si = nodeIndex.get(edge.source);
    const ti = nodeIndex.get(edge.target);
    if (si !== undefined && ti !== undefined && si !== ti) {
      adj[si].add(ti);
      adj[ti].add(si);
    }
  }

  // ─── Degree Centrality ────────────────────────────────────────────────────
  const degreeCentralities = computeDegreeCentrality(adj, n);

  // ─── Betweenness Centrality (Brandes) ─────────────────────────────────────
  const betweennessCentralities = computeBetweennessCentrality(adj, n);

  // ─── Eigenvector Centrality (Power Iteration) ─────────────────────────────
  const eigenvectorCentralities = computeEigenvectorCentrality(adj, n);

  // ─── Clustering Coefficient ───────────────────────────────────────────────
  const clusteringCoefficients = computeClusteringCoefficients(adj, n);

  // ─── Connected Components (BFS undirected) ────────────────────────────────
  const connectedComponents = detectConnectedComponents(adj, n, nodeIds);

  // ─── Community Detection (Louvain) ────────────────────────────────────────
  const communities = detectCommunities(adj, n, nodeIds, nodes, edges, nodeIndex);

  // ─── Network Density (directed formula) ───────────────────────────────────
  const actualEdges = edges.length;
  const networkDensity = n > 1 ? actualEdges / (n * (n - 1)) : 0;

  // ─── Diameter (longest shortest path via BFS) ─────────────────────────────
  const diameter = computeDiameter(adj, n);

  // ─── Assemble centralities ────────────────────────────────────────────────
  const centralities: NodeCentrality[] = nodeIds.map((id, i) => ({
    nodeId: id,
    degree: degreeCentralities[i],
    betweenness: betweennessCentralities[i],
    eigenvector: eigenvectorCentralities[i],
    clusteringCoefficient: clusteringCoefficients[i],
  }));

  // ─── Average Clustering Coefficient ───────────────────────────────────────
  const averageClusteringCoefficient =
    clusteringCoefficients.reduce((sum, c) => sum + c, 0) / n;

  // ─── Is Fully Connected ───────────────────────────────────────────────────
  const isFullyConnected = connectedComponents.length === 1;

  return {
    centralities,
    communities,
    connectedComponents,
    networkDensity,
    averageClusteringCoefficient,
    diameter,
    isFullyConnected,
  };
}

// ─── Degree Centrality ────────────────────────────────────────────────────────

function computeDegreeCentrality(adj: Set<number>[], n: number): number[] {
  const denominator = n - 1;
  return adj.map((neighbors) => neighbors.size / denominator);
}

// ─── Betweenness Centrality (Brandes Algorithm) ───────────────────────────────

function computeBetweennessCentrality(adj: Set<number>[], n: number): number[] {
  const CB = new Float64Array(n); // accumulator

  for (let s = 0; s < n; s++) {
    // BFS from source s
    const stack: number[] = [];
    const pred: number[][] = Array.from({ length: n }, () => []);
    const sigma = new Float64Array(n); // number of shortest paths
    sigma[s] = 1;
    const dist = new Int32Array(n).fill(-1);
    dist[s] = 0;

    const queue: number[] = [s];
    let qHead = 0;

    while (qHead < queue.length) {
      const v = queue[qHead++];
      stack.push(v);
      for (const w of adj[v]) {
        // First visit
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        // Shortest path via v?
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }

    // Back-propagation
    const delta = new Float64Array(n);
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) {
        CB[w] += delta[w];
      }
    }
  }

  // Normalize for undirected graph: divide by (n-1)(n-2)/2
  const normFactor = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;
  const result: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = Math.min(CB[i] / normFactor, 1.0);
  }
  return result;
}

// ─── Eigenvector Centrality (Power Iteration) ─────────────────────────────────

function computeEigenvectorCentrality(adj: Set<number>[], n: number): number[] {
  const MAX_ITERATIONS = 100;
  const TOLERANCE = 1e-6;

  // Initialize with uniform values
  let x = new Float64Array(n).fill(1 / n);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const xNew = new Float64Array(n);

    // Multiply by adjacency matrix
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (const j of adj[i]) {
        sum += x[j];
      }
      xNew[i] = sum;
    }

    // Normalize by max value (L∞ norm)
    let maxVal = 0;
    for (let i = 0; i < n; i++) {
      if (xNew[i] > maxVal) maxVal = xNew[i];
    }

    if (maxVal === 0) {
      // All zeros — graph has no edges from any node, return zeros
      return new Array(n).fill(0);
    }

    for (let i = 0; i < n; i++) {
      xNew[i] /= maxVal;
    }

    // Check convergence
    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff += Math.abs(xNew[i] - x[i]);
    }

    x = xNew;

    if (diff < TOLERANCE) {
      break;
    }
  }

  // Normalize to [0, 1] — find max and divide
  let maxVal = 0;
  for (let i = 0; i < n; i++) {
    if (x[i] > maxVal) maxVal = x[i];
  }

  const result: number[] = new Array(n);
  if (maxVal === 0) {
    result.fill(0);
  } else {
    for (let i = 0; i < n; i++) {
      result[i] = x[i] / maxVal;
    }
  }

  return result;
}

// ─── Clustering Coefficient ───────────────────────────────────────────────────

function computeClusteringCoefficients(adj: Set<number>[], n: number): number[] {
  const result: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const neighbors = Array.from(adj[i]);
    const k = neighbors.length;

    if (k < 2) {
      result[i] = 0;
      continue;
    }

    // Count edges among neighbors
    let edgesAmongNeighbors = 0;
    for (let a = 0; a < k; a++) {
      for (let b = a + 1; b < k; b++) {
        if (adj[neighbors[a]].has(neighbors[b])) {
          edgesAmongNeighbors++;
        }
      }
    }

    // Maximum possible edges among k neighbors = k*(k-1)/2
    const maxPossible = (k * (k - 1)) / 2;
    result[i] = edgesAmongNeighbors / maxPossible;
  }

  return result;
}

// ─── Connected Component Detection (BFS undirected) ───────────────────────────

function detectConnectedComponents(
  adj: Set<number>[],
  n: number,
  nodeIds: string[]
): ConnectedComponent[] {
  const visited = new Uint8Array(n);
  const components: ConnectedComponent[] = [];
  let componentIdx = 0;

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;

    // BFS from node i
    const members: string[] = [];
    const queue: number[] = [i];
    visited[i] = 1;

    let qHead = 0;
    while (qHead < queue.length) {
      const v = queue[qHead++];
      members.push(nodeIds[v]);
      for (const w of adj[v]) {
        if (!visited[w]) {
          visited[w] = 1;
          queue.push(w);
        }
      }
    }

    components.push({
      id: `component-${componentIdx}`,
      members,
      isMain: false, // will be set below
      size: members.length,
    });
    componentIdx++;
  }

  // Mark largest component as isMain
  if (components.length > 0) {
    let maxIdx = 0;
    let maxSize = 0;
    for (let i = 0; i < components.length; i++) {
      if (components[i].size > maxSize) {
        maxSize = components[i].size;
        maxIdx = i;
      }
    }
    components[maxIdx].isMain = true;
  }

  return components;
}

// ─── Louvain Community Detection ──────────────────────────────────────────────

function detectCommunities(
  adj: Set<number>[],
  n: number,
  nodeIds: string[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  nodeIndex: Map<string, number>
): Community[] {
  // Build weighted adjacency for modularity computation
  // Each undirected edge contributes weight 1 (unweighted Louvain)
  // m = total edge weight (number of undirected edges)
  let m = 0;
  for (let i = 0; i < n; i++) {
    m += adj[i].size;
  }
  m /= 2; // each undirected edge counted twice

  if (m === 0) {
    // No edges: each node is its own community
    return nodes.map((node, i) => ({
      id: `community-${i}`,
      label: `${node.layer} community`,
      members: [node.id],
      dominantLayer: node.layer,
      internalDensity: 0,
    }));
  }

  // Initialize: each node in its own community
  const communityOf = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    communityOf[i] = i;
  }

  // Degree of each node (in undirected sense)
  const degree = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    degree[i] = adj[i].size;
  }

  // Phase 1: Local modularity optimization (iterative moves)
  let improved = true;
  let iterations = 0;
  const MAX_LOUVAIN_ITERATIONS = 50;

  while (improved && iterations < MAX_LOUVAIN_ITERATIONS) {
    improved = false;
    iterations++;

    for (let i = 0; i < n; i++) {
      const currentComm = communityOf[i];

      // Compute weights to neighboring communities
      const neighborCommWeights = new Map<number, number>();
      for (const j of adj[i]) {
        const jComm = communityOf[j];
        neighborCommWeights.set(jComm, (neighborCommWeights.get(jComm) || 0) + 1);
      }

      // Compute sum of degrees in current community (excluding i)
      let sigmaTotCurrent = 0;
      for (let k = 0; k < n; k++) {
        if (k !== i && communityOf[k] === currentComm) {
          sigmaTotCurrent += degree[k];
        }
      }

      // Weight of edges from i to its current community
      const kiIn = neighborCommWeights.get(currentComm) || 0;
      const ki = degree[i];

      // Try moving to each neighboring community
      let bestComm = currentComm;
      let bestDeltaQ = 0;

      for (const [targetComm, kiTarget] of neighborCommWeights) {
        if (targetComm === currentComm) continue;

        // Sum of degrees in target community
        let sigmaTotTarget = 0;
        for (let k = 0; k < n; k++) {
          if (communityOf[k] === targetComm) {
            sigmaTotTarget += degree[k];
          }
        }

        // Delta Q for moving node i from currentComm to targetComm
        const deltaQ =
          (kiTarget - kiIn) / m -
          (ki * (sigmaTotTarget - sigmaTotCurrent)) / (2 * m * m);

        if (deltaQ > bestDeltaQ) {
          bestDeltaQ = deltaQ;
          bestComm = targetComm;
        }
      }

      if (bestComm !== currentComm) {
        communityOf[i] = bestComm;
        improved = true;
      }
    }
  }

  // Collect communities
  const commMembers = new Map<number, string[]>();
  for (let i = 0; i < n; i++) {
    const comm = communityOf[i];
    if (!commMembers.has(comm)) {
      commMembers.set(comm, []);
    }
    commMembers.get(comm)!.push(nodeIds[i]);
  }

  // Build Community objects
  const communities: Community[] = [];
  let commIdx = 0;
  for (const [, members] of commMembers) {
    // Determine dominant layer
    const layerCounts = new Map<GraphLayer, number>();
    for (const memberId of members) {
      const idx = nodeIndex.get(memberId);
      if (idx !== undefined) {
        const layer = nodes[idx].layer;
        layerCounts.set(layer, (layerCounts.get(layer) || 0) + 1);
      }
    }

    let dominantLayer: GraphLayer = "equipment";
    let maxCount = 0;
    for (const [layer, count] of layerCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantLayer = layer;
      }
    }

    // Compute internal density
    const memberSet = new Set(members);
    let internalEdges = 0;
    for (const edge of edges) {
      if (memberSet.has(edge.source) && memberSet.has(edge.target)) {
        internalEdges++;
      }
    }
    const memberCount = members.length;
    const maxPossibleEdges = memberCount * (memberCount - 1); // directed formula
    const internalDensity = maxPossibleEdges > 0 ? internalEdges / maxPossibleEdges : 0;

    communities.push({
      id: `community-${commIdx}`,
      label: `${dominantLayer} community`,
      members,
      dominantLayer,
      internalDensity,
    });
    commIdx++;
  }

  return communities;
}

// ─── Graph Diameter (BFS-based) ───────────────────────────────────────────────

function computeDiameter(adj: Set<number>[], n: number): number {
  let diameter = 0;

  for (let s = 0; s < n; s++) {
    // BFS from s
    const dist = new Int32Array(n).fill(-1);
    dist[s] = 0;
    const queue: number[] = [s];
    let qHead = 0;

    while (qHead < queue.length) {
      const v = queue[qHead++];
      for (const w of adj[v]) {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
      }
    }

    // Find max distance from s (only to reachable nodes)
    for (let i = 0; i < n; i++) {
      if (dist[i] > diameter) {
        diameter = dist[i];
      }
    }
  }

  return diameter;
}
