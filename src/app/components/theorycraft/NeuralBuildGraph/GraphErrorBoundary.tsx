/**
 * GraphErrorBoundary — Catches render errors from the 3D scene
 * and falls back gracefully without taking down TheoryCraftPanel.
 *
 * Catches:
 * - WebGL context errors
 * - Three.js shader compilation failures
 * - React hooks violations (shouldn't happen post-fix, but safety net)
 * - Any unhandled throw from R3F Canvas tree
 */

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GraphErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[NeuralBuildGraph] Render error caught by boundary:", error.message);
    this.props.onError?.(error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 p-6 text-center">
          <p className="text-xs font-medium text-red-400">
            3D graph encountered an error
          </p>
          <p className="text-[10px] text-neutral-500 max-w-[280px]">
            {this.state.error?.message ?? "Unknown rendering error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-1 text-[11px] text-neutral-300 transition-colors hover:bg-neutral-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
