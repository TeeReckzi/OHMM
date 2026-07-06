import * as THREE from 'three';
import { useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import type { ForceSimulation } from './ForceSimulation';

/**
 * Mutable position reference shared between useForceGraph and GraphNode3D.
 * Updated every useFrame tick — consumers read directly, no React re-renders.
 */
export interface PositionsRef {
  /** Mutable map updated every useFrame tick — nodes read directly */
  current: Map<string, { x: number; y: number; z: number }>;
  /** Frame counter incremented on each update — consumers check for staleness */
  frameId: number;
}

/**
 * State for the node drag gesture interaction.
 */
export interface NodeDragState {
  /** Whether a drag is currently in progress */
  isDragging: boolean;
  /** The node ID being dragged (null if not dragging) */
  draggedNodeId: string | null;
  /** Drag plane normal (perpendicular to camera) */
  planeNormal: THREE.Vector3;
  /** Offset from node center to pointer at drag start */
  offset: THREE.Vector3;
}

/**
 * Hook for dragging 3D graph nodes via @use-gesture/react.
 *
 * Projects pointer movement onto a plane perpendicular to the camera through
 * the node's world position. Pins the node in ForceSimulation during and after
 * drag. Distinguishes clicks from drags — only pins on actual movement.
 *
 * Called unconditionally (Requirement 3.2) — use `options.disabled` to gate behavior.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 3.2
 */
export function useNodeDrag(
  nodeId: string,
  positionsRef: React.RefObject<PositionsRef>,
  simulationRef: React.RefObject<ForceSimulation | null>,
  camera: THREE.Camera,
  controlsRef: React.RefObject<any>,
  options?: { disabled?: boolean }
): { bind: (...args: any[]) => any; isDragging: boolean } {
  // Pre-allocated working objects to avoid per-frame allocations (Req 18.4)
  const planeRef = useRef(new THREE.Plane());
  const intersectPoint = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const lastValidPos = useRef(new THREE.Vector3());
  const hasMoved = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const bind = useDrag(
    ({ active, xy: [px, py], first, last }) => {
      // Gate behavior via disabled option — hook is always called (Req 3.2)
      if (options?.disabled) return;

      if (first) {
        hasMoved.current = false;

        // Compute drag plane: perpendicular to camera direction, through node position
        const nodePos = positionsRef.current?.current.get(nodeId);
        if (!nodePos) return;

        const worldPos = new THREE.Vector3(nodePos.x, nodePos.y, nodePos.z);
        lastValidPos.current.copy(worldPos);

        const cameraDir = camera.getWorldDirection(new THREE.Vector3());
        planeRef.current.setFromNormalAndCoplanarPoint(cameraDir, worldPos);

        // Disable OrbitControls on drag start (Req 5.1)
        if (controlsRef.current) controlsRef.current.enabled = false;
        setIsDragging(true);

        // Reheat simulation so connected nodes react (Req 5.6)
        simulationRef.current?.reheat();
      }

      // Detect actual movement (distinguish click from drag — Req 5.3)
      if (active && !first) {
        hasMoved.current = true;
      }

      // Cast ray from pointer through camera onto drag plane
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((px - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((py - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(
        new THREE.Vector2(ndcX, ndcY),
        camera
      );

      const hit = raycaster.current.ray.intersectPlane(
        planeRef.current,
        intersectPoint.current
      );

      if (hit) {
        // Valid intersection — update position (Req 5.2)
        lastValidPos.current.copy(intersectPoint.current);
        const { x, y, z } = intersectPoint.current;
        simulationRef.current?.pinNode(nodeId, x, y, z);
      }
      // If intersection fails, retain node at last valid position (Req 5.4)

      if (last) {
        setIsDragging(false);
        // Re-enable OrbitControls on drag end (Req 5.1)
        if (controlsRef.current) controlsRef.current.enabled = true;

        // Only pin permanently if there was actual movement — click does NOT pin (Req 5.3, 5.7)
        if (hasMoved.current) {
          const { x, y, z } = lastValidPos.current;
          simulationRef.current?.pinNode(nodeId, x, y, z);
        }
      }
    },
    { pointer: { touch: true } }
  );

  return { bind, isDragging };
}
