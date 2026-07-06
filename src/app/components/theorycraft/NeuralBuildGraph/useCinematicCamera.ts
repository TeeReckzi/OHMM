import * as THREE from 'three';
import { useRef, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PositionsRef } from './useNodeDrag';

/**
 * State for the cinematic camera system (zoom-to-fit, focus-on-node, auto-orbit).
 */
export interface CinematicCameraState {
  /** Whether the camera is currently animating */
  isAnimating: boolean;
  /** Animation mode */
  mode: 'idle' | 'zoom-to-fit' | 'focus-on-node' | 'auto-orbit';
  /** Lerp progress [0, 1] */
  progress: number;
  /** Start position for interpolation */
  fromPosition: THREE.Vector3;
  /** Target position for interpolation */
  toPosition: THREE.Vector3;
  /** Start target (look-at) for interpolation */
  fromTarget: THREE.Vector3;
  /** End target (look-at) for interpolation */
  toTarget: THREE.Vector3;
  /** Duration of current animation in ms */
  duration: number;
  /** Idle timer — seconds since last user interaction */
  idleTime: number;
  /** Auto-orbit speed (radians/sec, slow: 0.05) */
  orbitSpeed: number;
}

/**
 * Per-instance particle color slot for InstancedBufferAttribute.
 * RGB color components for a single particle instance.
 */
export interface ParticleColorSlot {
  r: number;
  g: number;
  b: number;
}

/**
 * Public API returned by useCinematicCamera.
 */
export interface CinematicCameraAPI {
  /** Trigger zoom-to-fit all nodes */
  zoomToFit: (positions: Map<string, { x: number; y: number; z: number }>) => void;
  /** Focus camera on a specific node */
  focusOnNode: (nodeId: string) => void;
  /** Stop any in-progress animation */
  stopAnimation: () => void;
  /** Whether camera is currently animating */
  isAnimating: boolean;
  /** Current camera mode */
  mode: CinematicCameraState['mode'];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ZOOM_TO_FIT_DURATION_MS = 600;
const FOCUS_ON_NODE_DURATION_MS = 400;
const PADDING_FACTOR = 1.15;
const MIN_DISTANCE = 5; // prevent camera from going inside geometry
const DEFAULT_NODE_RADIUS = 1.0; // nodes range 0.4–1.2, default ~1.0
const FOCUS_CLEARANCE_FACTOR = 2; // 2× node-radius clearance for framing

// ─── Easing ───────────────────────────────────────────────────────────────────

/** Ease-out-cubic: decelerating to zero velocity */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Compute Zoom-to-Fit ──────────────────────────────────────────────────────

/**
 * Compute camera position that fits all nodes in view.
 *
 * Preconditions:
 *   - positions map is non-empty
 *   - camera.fov is defined
 *
 * Postconditions:
 *   - Camera position shows all nodes with 15% padding
 *   - Camera target is set to centroid of all positions
 *   - All nodes project to NDC within [-1, 1] after positioning
 */
export function computeZoomToFit(
  positions: Map<string, { x: number; y: number; z: number }>,
  camera: THREE.PerspectiveCamera,
): { position: THREE.Vector3; target: THREE.Vector3 } {
  // Step 1: Compute bounding box
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  for (const pos of positions.values()) {
    min.x = Math.min(min.x, pos.x);
    min.y = Math.min(min.y, pos.y);
    min.z = Math.min(min.z, pos.z);
    max.x = Math.max(max.x, pos.x);
    max.y = Math.max(max.y, pos.y);
    max.z = Math.max(max.z, pos.z);
  }

  // Step 2: Compute centroid and bounding sphere radius
  const centroid = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);

  // Bounding sphere radius: max distance from centroid to any point
  let radius = 0;
  for (const pos of positions.values()) {
    const dist = Math.sqrt(
      (pos.x - centroid.x) ** 2 +
      (pos.y - centroid.y) ** 2 +
      (pos.z - centroid.z) ** 2
    );
    if (dist > radius) radius = dist;
  }

  // Handle edge case: single node or all nodes at same position
  if (radius < 0.1) radius = 5;

  // Step 3: Compute distance for FOV (with 15% padding)
  // Account for both horizontal and vertical FOV — use the more constraining one
  const fovRad = (camera.fov * Math.PI) / 180;
  const aspectRatio = camera.aspect || 1;
  const vFovHalf = fovRad / 2;
  const hFovHalf = Math.atan(Math.tan(vFovHalf) * aspectRatio);
  const effectiveHalfFov = Math.min(vFovHalf, hFovHalf);

  const distance = Math.max(
    (radius * PADDING_FACTOR) / Math.sin(effectiveHalfFov),
    MIN_DISTANCE
  );

  // Step 4: Position camera along current viewing direction from centroid
  const direction = camera.position.clone().sub(centroid);
  if (direction.lengthSq() < 0.001) {
    // Camera is at centroid — use default direction
    direction.set(0, 0, 1);
  }
  direction.normalize();
  const position = centroid.clone().add(direction.multiplyScalar(distance));

  return { position, target: centroid };
}

// ─── Default State ────────────────────────────────────────────────────────────

function createDefaultState(): CinematicCameraState {
  return {
    isAnimating: false,
    mode: 'idle',
    progress: 0,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    duration: ZOOM_TO_FIT_DURATION_MS,
    idleTime: 0,
    orbitSpeed: 0.05,
  };
}

// ─── Spherical Lerp Helper ────────────────────────────────────────────────────

/**
 * Spherical linear interpolation for camera position relative to target.
 * Produces a natural arc rather than a straight line.
 *
 * Pre-allocated vector arguments avoid per-frame allocation.
 */
function slerpPosition(
  from: THREE.Vector3,
  to: THREE.Vector3,
  target: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  // Convert positions to spherical coordinates relative to the target
  const fromOffset = from.clone().sub(target);
  const toOffset = to.clone().sub(target);

  const fromSpherical = new THREE.Spherical().setFromVector3(fromOffset);
  const toSpherical = new THREE.Spherical().setFromVector3(toOffset);

  // Interpolate spherical components
  const radius = fromSpherical.radius + (toSpherical.radius - fromSpherical.radius) * t;
  const phi = fromSpherical.phi + (toSpherical.phi - fromSpherical.phi) * t;
  const theta = fromSpherical.theta + (toSpherical.theta - fromSpherical.theta) * t;

  // Convert back to cartesian and add target offset
  out.setFromSpherical(new THREE.Spherical(radius, phi, theta)).add(target);
  return out;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Cinematic camera hook providing zoom-to-fit, focus-on-node, and auto-orbit.
 *
 * Called UNCONDITIONALLY — mode gates behavior inside useFrame callback.
 * Uses spherical linear interpolation for natural camera arcs.
 * Pre-allocates all THREE.js working objects to avoid per-frame GC pressure.
 *
 * Requirements: 4.1, 4.5, 4.6, 3.1
 */
export function useCinematicCamera(
  positionsRef: React.RefObject<PositionsRef>,
  controlsRef: React.RefObject<any>,
): CinematicCameraAPI {
  const { camera, gl } = useThree();
  const stateRef = useRef<CinematicCameraState>(createDefaultState());

  // Pre-allocated working vectors (Req 18.4 — no per-frame allocations)
  const workingVec = useRef(new THREE.Vector3());
  const workingTarget = useRef(new THREE.Vector3());

  // ─── useFrame: Animation Loop (called unconditionally, mode gates inside) ───
  useFrame((_, delta) => {
    const state = stateRef.current;

    if (state.mode === 'zoom-to-fit' || state.mode === 'focus-on-node') {
      // Advance lerp progress: delta is in seconds, duration is in ms
      state.progress += delta / (state.duration / 1000);
      state.progress = Math.min(state.progress, 1.0);

      const t = easeOutCubic(state.progress);

      // Interpolate target (look-at) linearly
      const currentTarget = workingTarget.current.lerpVectors(
        state.fromTarget,
        state.toTarget,
        t,
      );

      // Spherical linear interpolation for natural camera arc
      slerpPosition(
        state.fromPosition,
        state.toPosition,
        currentTarget,
        t,
        workingVec.current,
      );

      // Apply to camera
      (camera as THREE.PerspectiveCamera).position.copy(workingVec.current);

      // Update OrbitControls target
      if (controlsRef.current) {
        controlsRef.current.target.copy(currentTarget);
        controlsRef.current.update();
      }

      // Animation complete
      if (state.progress >= 1.0) {
        state.mode = 'idle';
        state.isAnimating = false;
        state.idleTime = 0;
      }
    } else if (state.mode === 'auto-orbit') {
      const positions = positionsRef.current?.current;
      const centroid = new THREE.Vector3(0, 0, 0);
      if (positions && positions.size > 0) {
        for (const pos of positions.values()) {
          centroid.x += pos.x;
          centroid.y += pos.y;
          centroid.z += pos.z;
        }
        centroid.divideScalar(positions.size);
      }

      const offset = camera.position.clone().sub(centroid);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += state.orbitSpeed * delta;
      spherical.makeSafe();

      camera.position.setFromSpherical(spherical).add(centroid);
      camera.lookAt(centroid);
      if (controlsRef.current) {
        controlsRef.current.target.copy(centroid);
        controlsRef.current.update();
      }
    } else if (state.mode === 'idle') {
      state.idleTime += delta;
      if (state.idleTime >= 10.0) {
        state.mode = 'auto-orbit';
        state.idleTime = 0;
      }
    }
  });

  // ─── zoomToFit ──────────────────────────────────────────────────────────────

  const zoomToFit = useCallback(
    (positions: Map<string, { x: number; y: number; z: number }>) => {
      if (positions.size === 0) return;

      const perspCamera = camera as THREE.PerspectiveCamera;
      const { position: targetPos, target: targetLookAt } = computeZoomToFit(
        positions,
        perspCamera,
      );

      const state = stateRef.current;

      // Reset animation progress to 0.0 before each new zoom-to-fit (Req 4.1)
      state.progress = 0.0;
      state.mode = 'zoom-to-fit';
      state.isAnimating = true;
      state.duration = ZOOM_TO_FIT_DURATION_MS;

      // Capture current camera state as "from" values
      state.fromPosition.copy(perspCamera.position);
      state.toPosition.copy(targetPos);

      // Current OrbitControls target as "from" look-at
      if (controlsRef.current) {
        state.fromTarget.copy(controlsRef.current.target);
      } else {
        state.fromTarget.set(0, 0, 0);
      }
      state.toTarget.copy(targetLookAt);
    },
    [camera, controlsRef],
  );

  // ─── focusOnNode ─────────────────────────────────────────────────────────────

  /**
   * Focus camera on a specific node with 2× node-radius clearance.
   * Completes in 400ms. If called during an in-progress animation, cancels at
   * current interpolated position and starts new lerp from there.
   *
   * Requirements: 4.2, 4.7
   */
  const focusOnNode = useCallback(
    (nodeId: string) => {
      const positions = positionsRef.current;
      if (!positions) return;

      const nodePos = positions.current.get(nodeId);
      if (!nodePos) return;

      const perspCamera = camera as THREE.PerspectiveCamera;
      const state = stateRef.current;

      // Compute framing distance: place camera so the node fills the view
      // with 2× node-radius clearance. distance = (radius * clearanceFactor) / sin(fov/2)
      const fovRad = (perspCamera.fov * Math.PI) / 180;
      const framingDistance = Math.max(
        (DEFAULT_NODE_RADIUS * FOCUS_CLEARANCE_FACTOR * 4) / Math.sin(fovRad / 2),
        MIN_DISTANCE,
      );

      const nodeVec = new THREE.Vector3(nodePos.x, nodePos.y, nodePos.z);

      // Determine approach direction: use current camera direction toward the node
      const direction = perspCamera.position.clone().sub(nodeVec);
      if (direction.lengthSq() < 0.001) {
        // Camera is on top of the node — use default direction
        direction.set(0, 0.5, 1);
      }
      direction.normalize();

      const targetCameraPos = nodeVec.clone().add(direction.multiplyScalar(framingDistance));

      // If an animation is in-progress, capture current interpolated position as "from"
      // (cancels the running animation and starts new lerp from current spot)
      let fromPos: THREE.Vector3;
      let fromTarget: THREE.Vector3;

      if (state.isAnimating && state.progress > 0 && state.progress < 1) {
        // Read current camera position (already interpolated by useFrame)
        fromPos = perspCamera.position.clone();
        fromTarget = controlsRef.current
          ? controlsRef.current.target.clone()
          : new THREE.Vector3(0, 0, 0);
      } else {
        fromPos = perspCamera.position.clone();
        fromTarget = controlsRef.current
          ? controlsRef.current.target.clone()
          : new THREE.Vector3(0, 0, 0);
      }

      // Start new focus-on-node animation
      state.progress = 0.0;
      state.mode = 'focus-on-node';
      state.isAnimating = true;
      state.duration = FOCUS_ON_NODE_DURATION_MS;
      state.fromPosition.copy(fromPos);
      state.toPosition.copy(targetCameraPos);
      state.fromTarget.copy(fromTarget);
      state.toTarget.copy(nodeVec);
    },
    [camera, controlsRef, positionsRef],
  );

  // ─── stopAnimation ──────────────────────────────────────────────────────────

  const stopAnimation = useCallback(() => {
    const state = stateRef.current;
    state.mode = 'idle';
    state.isAnimating = false;
    state.progress = 0;
  }, []);

  // ─── User Interaction Cancellation ──────────────────────────────────────────
  // Listen for pointerdown/wheel on the canvas — immediately cancel scripted
  // camera animations at the current interpolated position (Req 4.7).

  useEffect(() => {
    const canvas = gl.domElement;

    const handleInteraction = () => {
      const state = stateRef.current;
      state.idleTime = 0;
      if (state.mode === 'auto-orbit') {
        state.mode = 'idle';
        state.isAnimating = false;
        state.progress = 0;
      } else if (state.isAnimating && (state.mode === 'zoom-to-fit' || state.mode === 'focus-on-node')) {
        // Cancel at current interpolated position — camera stays where it is
        state.mode = 'idle';
        state.isAnimating = false;
        state.progress = 0;
      }
    };

    canvas.addEventListener('pointerdown', handleInteraction);
    canvas.addEventListener('pointermove', handleInteraction);
    canvas.addEventListener('wheel', handleInteraction);

    return () => {
      canvas.removeEventListener('pointerdown', handleInteraction);
      canvas.removeEventListener('pointermove', handleInteraction);
      canvas.removeEventListener('wheel', handleInteraction);
    };
  }, [gl]);

  // ─── Return API ─────────────────────────────────────────────────────────────

  return {
    zoomToFit,
    focusOnNode,
    stopAnimation,
    isAnimating: stateRef.current.isAnimating,
    mode: stateRef.current.mode,
  };
}
