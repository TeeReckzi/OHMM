/**
 * TemporalPlayback — Combat chain playback hook and controls
 *
 * Provides a `useTemporalPlayback` hook that drives temporal chain animation:
 * - Highlights active node (energyLevel → 1.0) on each frame
 * - Animates directed particle burst along activeEdgeId
 * - Dims inactive nodes to 30% of base energyLevel
 * - Restores all nodes to base energyLevel within 800ms on playback end
 * - Supports looping (restart from frame 0 after final frame)
 * - Advances frames proportional to timestamp gaps at cycleDuration × playbackSpeed
 *
 * Also exports a TemporalPlayback UI component with play/pause/speed controls.
 *
 * Validates: Requirements 7.5, 7.6, 7.7, 7.8
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import type {
  CombatTemporalChain,
  GraphNode,
} from "@/lib/ohmm/theorycraft/buildGraph.types";
import { ENERGY_CONFIG } from "@/lib/ohmm/theorycraft/buildGraph.constants";

// ─── Hook Interface ───────────────────────────────────────────────────────────

export interface UseTemporalPlaybackResult {
  /** Whether playback is currently active */
  isPlaying: boolean;
  /** Current frame index */
  currentFrameIndex: number;
  /** Current active node ID */
  activeNodeId: string | null;
  /** Current active edge ID */
  activeEdgeId: string | null;
  /** Energy override per node during playback */
  energyOverrides: Map<string, number>;
  /** Start playback */
  play: () => void;
  /** Stop playback */
  stop: () => void;
  /** Toggle play/stop */
  toggle: () => void;
  /** Playback speed multiplier */
  playbackSpeed: number;
  /** Set playback speed */
  setPlaybackSpeed: (speed: number) => void;
}

// ─── Hook Implementation ──────────────────────────────────────────────────────

/**
 * Drives temporal chain animation through graph nodes/edges.
 *
 * Frame timing is proportional to timestamp gaps:
 *   frameDisplayTime = (gap / totalDuration) × cycleDuration × (1 / playbackSpeed)
 *
 * On each frame: active node → energy 1.0, others → 30% base.
 * On stop/end: restore over 800ms (ENERGY_CONFIG.pulseDecayMs).
 */
export function useTemporalPlayback(
  temporalChain: CombatTemporalChain | null,
  nodes: GraphNode[]
): UseTemporalPlaybackResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [energyOverrides, setEnergyOverrides] = useState<Map<string, number>>(
    () => new Map()
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Refs for animation loop to avoid stale closures
  const rafIdRef = useRef<number | null>(null);
  const frameStartRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const restoreRafRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  /**
   * Compute how long to display each frame based on proportional timestamp gaps.
   * Total cycle = cycleDuration / playbackSpeed
   * Each frame duration = (gap / totalTimestampRange) × totalCycle
   */
  const getFrameDuration = useCallback(
    (frameIndex: number): number => {
      if (!temporalChain || temporalChain.frames.length < 2) return 0;

      const frames = temporalChain.frames;
      const totalRange =
        frames[frames.length - 1].timestamp - frames[0].timestamp;

      if (totalRange <= 0) {
        // Uniform distribution when all timestamps are the same
        return (temporalChain.cycleDuration / playbackSpeed) / frames.length;
      }

      // Gap from current frame to next (or use last gap for final frame)
      const nextIndex = frameIndex + 1;
      if (nextIndex >= frames.length) {
        // Last frame — use gap from previous
        const prevGap =
          frames[frameIndex].timestamp - frames[frameIndex - 1].timestamp;
        return (
          (prevGap / totalRange) *
          (temporalChain.cycleDuration / playbackSpeed)
        );
      }

      const gap = frames[nextIndex].timestamp - frames[frameIndex].timestamp;
      return (
        (gap / totalRange) * (temporalChain.cycleDuration / playbackSpeed)
      );
    },
    [temporalChain, playbackSpeed]
  );

  /**
   * Apply energy overrides for a given frame:
   * - Active node → 1.0
   * - All other nodes → 0.3 × their base energyLevel
   */
  const applyFrameState = useCallback(
    (frameIndex: number) => {
      if (!temporalChain) return;
      const frame = temporalChain.frames[frameIndex];
      if (!frame) return;

      setCurrentFrameIndex(frameIndex);
      setActiveNodeId(frame.activeNodeId);
      setActiveEdgeId(frame.activeEdgeId);

      const overrides = new Map<string, number>();
      for (const node of nodes) {
        if (node.id === frame.activeNodeId) {
          overrides.set(node.id, ENERGY_CONFIG.maxEnergy); // 1.0
        } else {
          overrides.set(node.id, node.energyLevel * 0.3);
        }
      }
      setEnergyOverrides(overrides);
    },
    [temporalChain, nodes]
  );

  /**
   * Smoothly restore all nodes to base energyLevel over 800ms.
   * Uses requestAnimationFrame with linear interpolation.
   */
  const restoreEnergy = useCallback(() => {
    const duration = ENERGY_CONFIG.pulseDecayMs; // 800ms
    const startTime = performance.now();

    // Capture current overrides at restore start
    const startOverrides = new Map<string, number>();
    for (const node of nodes) {
      startOverrides.set(node.id, node.energyLevel * 0.3);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress >= 1.0) {
        // Fully restored — clear overrides
        setEnergyOverrides(new Map());
        setActiveNodeId(null);
        setActiveEdgeId(null);
        restoreRafRef.current = null;
        return;
      }

      // Lerp from dimmed state (30% base) back to full base
      const overrides = new Map<string, number>();
      for (const node of nodes) {
        const from = startOverrides.get(node.id) ?? node.energyLevel * 0.3;
        const to = node.energyLevel;
        overrides.set(node.id, from + (to - from) * progress);
      }
      setEnergyOverrides(overrides);
      restoreRafRef.current = requestAnimationFrame(animate);
    };

    restoreRafRef.current = requestAnimationFrame(animate);
  }, [nodes]);

  /**
   * Main animation loop: advance frames based on proportional timing.
   */
  const tick = useCallback(
    (now: number) => {
      if (!isPlayingRef.current || !temporalChain) return;

      const elapsed = now - frameStartRef.current;
      const frameDuration = getFrameDuration(currentFrameRef.current);

      if (elapsed >= frameDuration) {
        // Advance to next frame
        const nextFrame = currentFrameRef.current + 1;

        if (nextFrame >= temporalChain.frames.length) {
          // Reached end of chain
          if (temporalChain.isLooping) {
            // Restart from frame 0 (Req 7.7)
            currentFrameRef.current = 0;
            frameStartRef.current = now;
            applyFrameState(0);
          } else {
            // Stop and restore (Req 7.6)
            setIsPlaying(false);
            isPlayingRef.current = false;
            restoreEnergy();
            rafIdRef.current = null;
            return;
          }
        } else {
          currentFrameRef.current = nextFrame;
          frameStartRef.current = now;
          applyFrameState(nextFrame);
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [temporalChain, getFrameDuration, applyFrameState, restoreEnergy]
  );

  // ─── Controls ─────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    if (!temporalChain || temporalChain.frames.length === 0) return;

    // Cancel any ongoing restore animation
    if (restoreRafRef.current !== null) {
      cancelAnimationFrame(restoreRafRef.current);
      restoreRafRef.current = null;
    }

    currentFrameRef.current = 0;
    frameStartRef.current = performance.now();
    setIsPlaying(true);
    isPlayingRef.current = true;

    // Apply first frame immediately
    applyFrameState(0);

    // Start animation loop
    rafIdRef.current = requestAnimationFrame(tick);
  }, [temporalChain, applyFrameState, tick]);

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
    currentFrameRef.current = 0;
    setCurrentFrameIndex(0);

    // Restore all nodes over 800ms (Req 7.6)
    restoreEnergy();
  }, [restoreEnergy]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (restoreRafRef.current !== null) {
        cancelAnimationFrame(restoreRafRef.current);
      }
    };
  }, []);

  // Stop playback if chain changes
  useEffect(() => {
    if (isPlayingRef.current) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporalChain]);

  // If no chain, return inactive defaults
  if (!temporalChain) {
    return {
      isPlaying: false,
      currentFrameIndex: 0,
      activeNodeId: null,
      activeEdgeId: null,
      energyOverrides: new Map(),
      play: () => {},
      stop: () => {},
      toggle: () => {},
      playbackSpeed,
      setPlaybackSpeed,
    };
  }

  return {
    isPlaying,
    currentFrameIndex,
    activeNodeId,
    activeEdgeId,
    energyOverrides,
    play,
    stop,
    toggle,
    playbackSpeed,
    setPlaybackSpeed,
  };
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface TemporalPlaybackProps {
  /** The temporal chain to play back */
  temporalChain: CombatTemporalChain | null;
  /** Graph nodes (used for energy override computation) */
  nodes: GraphNode[];
  /** Called with current playback state on each change */
  onStateChange?: (state: UseTemporalPlaybackResult) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * TemporalPlayback — UI controls for temporal chain playback.
 *
 * Renders play/pause button, frame counter, and speed controls.
 * Uses `useTemporalPlayback` internally and reports state via `onStateChange`.
 */
export function TemporalPlayback({
  temporalChain,
  nodes,
  onStateChange,
}: TemporalPlaybackProps): JSX.Element {
  const playback = useTemporalPlayback(temporalChain, nodes);

  // Notify parent of state changes
  const prevStateRef = useRef<string>("");
  useEffect(() => {
    const stateKey = `${playback.isPlaying}:${playback.currentFrameIndex}:${playback.activeNodeId}:${playback.playbackSpeed}`;
    if (stateKey !== prevStateRef.current) {
      prevStateRef.current = stateKey;
      onStateChange?.(playback);
    }
  }, [
    playback.isPlaying,
    playback.currentFrameIndex,
    playback.activeNodeId,
    playback.playbackSpeed,
    onStateChange,
    playback,
  ]);

  const totalFrames = temporalChain?.frames.length ?? 0;
  const isDisabled = !temporalChain || totalFrames === 0;

  const speedOptions = [0.25, 0.5, 1.0, 2.0, 4.0];

  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-900/80 px-3 py-2">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={playback.toggle}
        disabled={isDisabled}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={playback.isPlaying ? "Pause playback" : "Play playback"}
      >
        {playback.isPlaying ? (
          // Pause icon
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="2" y="1" width="3" height="10" rx="0.5" />
            <rect x="7" y="1" width="3" height="10" rx="0.5" />
          </svg>
        ) : (
          // Play icon
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <polygon points="2,0 12,6 2,12" />
          </svg>
        )}
      </button>

      {/* Frame Counter */}
      <span className="min-w-[60px] text-xs tabular-nums text-neutral-400">
        {playback.currentFrameIndex + 1} / {totalFrames || "—"}
      </span>

      {/* Speed Control */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-neutral-500">Speed:</span>
        <select
          value={playback.playbackSpeed}
          onChange={(e) => playback.setPlaybackSpeed(Number(e.target.value))}
          disabled={isDisabled}
          className="h-6 rounded border border-neutral-700 bg-neutral-800 px-1 text-xs text-neutral-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Playback speed"
        >
          {speedOptions.map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
      </div>

      {/* Loop Indicator */}
      {temporalChain?.isLooping && (
        <span
          className="text-xs text-neutral-500"
          title="Playback will loop continuously"
        >
          ↻
        </span>
      )}
    </div>
  );
}
