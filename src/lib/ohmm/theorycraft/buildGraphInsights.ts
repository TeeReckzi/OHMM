/**
 * AI-style natural language insight generation for build graphs.
 * This module lives in the View_Model layer and MUST NOT import Three.js, React, or any rendering library.
 */

/**
 * A single actionable insight about the build graph.
 */
export interface BuildInsight {
  /** Unique insight ID */
  id: string;
  /** Insight category */
  category: 'bottleneck' | 'upgrade' | 'synergy' | 'warning' | 'optimization';
  /** Severity/importance (higher = more impactful) */
  priority: number;
  /** One-line summary */
  title: string;
  /** Detailed explanation (1-2 sentences) */
  description: string;
  /** Related node IDs */
  relatedNodes: string[];
  /** Confidence in the insight */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Result of the build insight generation containing ordered insights and overall rating.
 */
export interface BuildInsightsResult {
  /** Ordered insights (highest priority first) */
  insights: BuildInsight[];
  /** Overall build rating */
  overallRating: 'weak' | 'average' | 'strong' | 'optimal';
  /** Generated summary paragraph */
  summary: string;
}
