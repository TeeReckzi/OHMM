/**
 * HeartbeatEngine — R3F-compatible component that drives the heartbeat pulse system.
 *
 * Uses `useHeartbeat` internally to compute per-node brightness multipliers
 * and breathing scales each frame. Exposes the data via React context so that
 * GraphNode3D (and other scene children) can consume it without prop drilling.
 *
 * Usage:
 *   <HeartbeatEngine viewModel={vm}>
 *     <GraphNode3D ... />
 *   </HeartbeatEngine>
 *
 * Or simply import `useHeartbeat` directly in GraphScene and pass data down as props.
 */

import React, { createContext, useContext } from "react";

import type { BuildGraphViewModel } from "@/lib/ohmm/theorycraft/buildGraph.types";
import { useHeartbeat, type UseHeartbeatResult } from "./useHeartbeat";

// ─── Context ──────────────────────────────────────────────────────────────────

const HeartbeatContext = createContext<UseHeartbeatResult>({
  brightnessMultipliers: new Map(),
  breathingScales: new Map(),
  isActive: false,
});

/**
 * Access heartbeat brightness and breathing data from any child component.
 * Must be used within a `<HeartbeatEngine>` provider.
 */
export function useHeartbeatContext(): UseHeartbeatResult {
  return useContext(HeartbeatContext);
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface HeartbeatEngineProps {
  /** The current build graph view model (source of heartbeat config + node data) */
  viewModel: BuildGraphViewModel;
  /** Child components that will consume heartbeat data via context */
  children?: React.ReactNode;
}

/**
 * HeartbeatEngine wraps child components with heartbeat context.
 * Internally runs `useHeartbeat` which drives a requestAnimationFrame loop
 * producing per-node brightness multipliers and breathing scales.
 *
 * Place this inside your R3F `<Canvas>` (or as a wrapper around scene children)
 * so that node rendering components can access live heartbeat data.
 */
export function HeartbeatEngine({ viewModel, children }: HeartbeatEngineProps): JSX.Element {
  const heartbeatResult = useHeartbeat(viewModel);

  return (
    <HeartbeatContext.Provider value={heartbeatResult}>
      {children}
    </HeartbeatContext.Provider>
  );
}

export default HeartbeatEngine;
