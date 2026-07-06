// src/app/components/theorycraft/NeuralBuildGraph/useHeartbeat.ts
// React hook for combat-synced pulsing — drives brightness multipliers and breathing scales

import { useState, useEffect, useRef, useCallback } from "react";

import { ENERGY_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";
import type { BuildGraphViewModel } from "@/lib/ohmm/theorycraft/buildGraph.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseHeartbeatResult {
  /** Current brightness multiplier per node (Map<nodeId, multiplier>) */
  brightnessMultipliers: Map<string, number>;
  /** Current breathing scale per node (Map<nodeId, scale>) */
  breathingScales: Map<string, number>;
  /** Whether the heartbeat is active */
  isActive: boolean;
}

// ─── Internal State ───────────────────────────────────────────────────────────

interface HeartbeatState {
  /** Current phase in radians, advances based on frequency */
  phase: number;
  /** Active frequency (may be interpolating toward target) */
  currentFrequency: number;
  /** Target frequency (what we're interpolating toward) */
  targetFrequency: number;
  /** Timestamp when frequency interpolation started (ms) */
  freqInterpStartTime: number;
  /** Frequency value at interpolation start */
  freqInterpStartValue: number;
  /** Whether we're interpolating frequency */
  isInterpolatingFreq: boolean;
  /** Whether heartbeat was active last frame (for deactivation transition) */
  wasActive: boolean;
  /** Timestamp when deactivation started (for 1000ms fade) */
  deactivationStartTime: number;
  /** Stored multipliers at deactivation start (for smooth fade) */
  deactivationStartMultipliers: Map<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEACTIVATION_DURATION_MS = ENERGY_CONFIG.pulseDecayMs;
const TWO_PI = Math.PI * 2;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that drives the heartbeat (combat-synced pulsing) system.
 *
 * - When heartbeat is active: pulses brightness based on frequency and energy levels,
 *   propagates a brightness ripple from the highest-energy node with 800ms decay.
 * - Breathing: sinusoidal at 0.3Hz, 0.05 amplitude × normalizedSize (always active).
 * - When heartbeat transitions active→inactive: interpolates brightness back to 1.0 over 1000ms.
 * - When frequency changes: interpolates to new frequency over 500ms.
 */
export function useHeartbeat(viewModel: BuildGraphViewModel): UseHeartbeatResult {
  const [brightnessMultipliers, setBrightnessMultipliers] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [breathingScales, setBreathingScales] = useState<Map<string, number>>(() => new Map());
  const [isActive, setIsActive] = useState(false);

  const stateRef = useRef<HeartbeatState>({
    phase: 0,
    currentFrequency: ENERGY_CONFIG.defaultHeartbeatHz,
    targetFrequency: ENERGY_CONFIG.defaultHeartbeatHz,
    freqInterpStartTime: 0,
    freqInterpStartValue: ENERGY_CONFIG.defaultHeartbeatHz,
    isInterpolatingFreq: false,
    wasActive: false,
    deactivationStartTime: 0,
    deactivationStartMultipliers: new Map(),
  });

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const prevFrequencyRef = useRef<number>(viewModel.heartbeat.baseFrequency);

  // Find the highest-energy node for ripple origin
  const highestEnergyNodeId = useRef<string | null>(null);

  // ─── Detect frequency changes and trigger interpolation ─────────────────

  useEffect(() => {
    const newFreq = viewModel.heartbeat.baseFrequency;
    const prevFreq = prevFrequencyRef.current;

    if (Math.abs(newFreq - prevFreq) > 0.001) {
      const state = stateRef.current;
      state.targetFrequency = newFreq;
      state.freqInterpStartTime = performance.now();
      state.freqInterpStartValue = state.currentFrequency;
      state.isInterpolatingFreq = true;
      prevFrequencyRef.current = newFreq;
    }
  }, [viewModel.heartbeat.baseFrequency]);

  // ─── Detect active→inactive transition ──────────────────────────────────

  useEffect(() => {
    const state = stateRef.current;
    const nowActive = viewModel.heartbeat.isActive;

    if (state.wasActive && !nowActive) {
      // Transitioning from active to inactive — start deactivation fade
      state.deactivationStartTime = performance.now();
      // Snapshot current multipliers for smooth fade
      state.deactivationStartMultipliers = new Map(brightnessMultipliers);
    }

    state.wasActive = nowActive;
    setIsActive(nowActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewModel.heartbeat.isActive]);

  // ─── Update highest-energy node reference ───────────────────────────────

  useEffect(() => {
    let maxEnergy = -1;
    let maxId: string | null = null;
    for (const node of viewModel.nodes) {
      if (node.energyLevel > maxEnergy) {
        maxEnergy = node.energyLevel;
        maxId = node.id;
      }
    }
    highestEnergyNodeId.current = maxId;
  }, [viewModel.nodes]);

  // ─── Animation Loop ─────────────────────────────────────────────────────

  const tick = useCallback(
    (now: number) => {
      const state = stateRef.current;
      const deltaMs = lastTimeRef.current === 0 ? 16 : now - lastTimeRef.current;
      lastTimeRef.current = now;
      const deltaSec = deltaMs / 1000;

      // --- Frequency interpolation ---
      if (state.isInterpolatingFreq) {
        const elapsed = now - state.freqInterpStartTime;
        const t = Math.min(elapsed / FREQ_INTERPOLATION_DURATION_MS, 1.0);
        state.currentFrequency =
          state.freqInterpStartValue + (state.targetFrequency - state.freqInterpStartValue) * t;
        if (t >= 1.0) {
          state.isInterpolatingFreq = false;
          state.currentFrequency = state.targetFrequency;
        }
      }

      // --- Advance pulse phase ---
      state.phase += TWO_PI * state.currentFrequency * deltaSec;
      // Keep phase bounded to avoid floating point issues over time
      if (state.phase > TWO_PI * 1000) {
        state.phase -= TWO_PI * 1000;
      }

      const heartbeatActive = viewModel.heartbeat.isActive;
      const pulseIntensity = viewModel.heartbeat.amplitude;
      const nodes = viewModel.nodes;

      // --- Compute brightness multipliers ---
      const nextMultipliers = new Map<string, number>();
      const nextBreathing = new Map<string, number>();

      const pulseDecayMs = ENERGY_CONFIG.pulseDecayMs; // 800ms
      const breathFreq = ENERGY_CONFIG.breathingFrequency; // 0.3 Hz
      const breathAmp = ENERGY_CONFIG.breathingAmplitude; // 0.05

      // Breathing phase (always active, independent of heartbeat)
      const breathingPhase = TWO_PI * breathFreq * (now / 1000);

      if (heartbeatActive) {
        // Pulse is active: compute brightness per node
        const sinPhase = Math.sin(state.phase);

        // Ripple: compute distance-based decay from highest-energy node
        // For simplicity we use node index ordering as a proxy for "distance"
        // (real graph distance would require BFS which is expensive per-frame)
        const highId = highestEnergyNodeId.current;
        let highIndex = 0;
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === highId) {
            highIndex = i;
            break;
          }
        }

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // Ripple decay: nodes farther from highest-energy node get delayed pulse
          // Distance proxy: index difference (normalized to [0, 1])
          const dist = Math.abs(i - highIndex) / Math.max(nodes.length - 1, 1);
          // Ripple arrives later for distant nodes (800ms total propagation window)
          const rippleDelay = dist * pulseDecayMs;
          // Effective phase offset for this node
          const nodePhaseOffset = (rippleDelay / 1000) * TWO_PI * state.currentFrequency;
          const nodeSin = Math.sin(state.phase - nodePhaseOffset);

          // Brightness formula: 1 + pulseIntensity × energyLevel × sin(phase)
          // Clamped so brightness never goes below 1.0 (pulse only adds brightness)
          const brightness = 1 + pulseIntensity * node.energyLevel * Math.max(0, nodeSin);
          nextMultipliers.set(node.id, brightness);

          // Breathing: sinusoidal at breathFreq, amplitude = breathAmp × normalizedSize
          const breathScale = 1 + breathAmp * node.normalizedSize * Math.sin(breathingPhase);
          nextBreathing.set(node.id, breathScale);
        }
      } else {
        // Heartbeat inactive — check if we're in deactivation transition
        const elapsed = now - state.deactivationStartTime;
        const inDeactivation = elapsed < DEACTIVATION_DURATION_MS && state.deactivationStartTime > 0;

        for (const node of nodes) {
          if (inDeactivation) {
            // Interpolate from stored deactivation start value back to 1.0
            const t = Math.min(elapsed / DEACTIVATION_DURATION_MS, 1.0);
            const startVal = state.deactivationStartMultipliers.get(node.id) ?? 1.0;
            const brightness = startVal + (1.0 - startVal) * t;
            nextMultipliers.set(node.id, brightness);
          } else {
            // Fully inactive: brightness = 1.0
            nextMultipliers.set(node.id, 1.0);
          }

          // Breathing always active
          const breathScale = 1 + breathAmp * node.normalizedSize * Math.sin(breathingPhase);
          nextBreathing.set(node.id, breathScale);
        }
      }

      setBrightnessMultipliers(nextMultipliers);
      setBreathingScales(nextBreathing);

      // Continue animation loop
      rafIdRef.current = requestAnimationFrame(tick);
    },
    [viewModel],
  );

  // ─── Start/Stop animation loop ──────────────────────────────────────────

  useEffect(() => {
    if (viewModel.nodes.length === 0) {
      setBrightnessMultipliers(new Map());
      setBreathingScales(new Map());
      return;
    }

    lastTimeRef.current = 0;
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [tick, viewModel.nodes.length]);

  return {
    brightnessMultipliers,
    breathingScales,
    isActive,
  };
}
