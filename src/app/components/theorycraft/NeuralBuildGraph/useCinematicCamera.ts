import * as THREE from 'three';

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
