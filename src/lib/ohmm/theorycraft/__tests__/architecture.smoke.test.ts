/**
 * Phase 4B — Architectural Smoke Tests
 *
 * Verifies structural constraints of the theorycraft module:
 * - View model files must not import React
 * - Component files must not import engine modules directly
 * - App.tsx must not contain theorycraft orchestration logic
 *
 * Validates: Requirements 10.1, 10.4, 2.4, 4.4, 5.8, 7.4, 9.4
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Resolve project root (5 levels up from __tests__ directory)
const projectRoot = path.resolve(__dirname, "../../../../..");

/** Helper: read file content from project root */
function readSource(relativePath: string): string {
  const fullPath = path.resolve(projectRoot, relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Architecture: View model files must not import React", () => {
  const vmFiles = [
    "src/lib/ohmm/theorycraft/heroMetrics.vm.ts",
    "src/lib/ohmm/theorycraft/formulaExplainer.vm.ts",
    "src/lib/ohmm/theorycraft/setBonusTracker.vm.ts",
    "src/lib/ohmm/theorycraft/statWeightCalculator.vm.ts",
    "src/lib/ohmm/theorycraft/buildComparison.vm.ts",
    "src/lib/ohmm/theorycraft/orchestrator.ts",
    "src/lib/ohmm/theorycraft/utils.ts",
  ];

  const reactImportPattern = /import.*from\s+['"]react['"]/;
  const reactRequirePattern = /require\s*\(\s*['"]react['"]\s*\)/;

  it.each(vmFiles)("%s does not import React", (filePath) => {
    const content = readSource(filePath);
    expect(content).not.toMatch(reactImportPattern);
    expect(content).not.toMatch(reactRequirePattern);
  });
});

describe("Architecture: Component files must not import engine modules directly", () => {
  const componentFiles = [
    "src/app/components/theorycraft/HeroMetricsBar.tsx",
    "src/app/components/theorycraft/FormulaExplainer.tsx",
    "src/app/components/theorycraft/SetBonusTracker.tsx",
    "src/app/components/theorycraft/StatWeightCalculator.tsx",
    "src/app/components/theorycraft/BuildComparisonView.tsx",
    "src/app/components/theorycraft/TheoryCraftPanel.tsx",
  ];

  const engineImportPattern = /import.*from\s+['"]@\/ohai\/src\/engine/;

  it.each(componentFiles)("%s does not import from engine", (filePath) => {
    const content = readSource(filePath);
    expect(content).not.toMatch(engineImportPattern);
  });
});

describe("Architecture: App.tsx has no theorycraft orchestration logic", () => {
  const orchestrationSymbols = [
    "deriveHeroMetrics",
    "deriveFormulaExplainer",
    "deriveSetBonusTracker",
    "deriveStatWeights",
    "deriveBuildComparison",
    "computeTheoryCraftState",
    "useTheoryCraft",
  ];

  let appContent: string;

  it("App.tsx can be read", () => {
    appContent = readSource("src/app/App.tsx");
    expect(appContent).toBeDefined();
  });

  it.each(orchestrationSymbols)(
    "App.tsx does not contain %s",
    (symbol) => {
      const content = readSource("src/app/App.tsx");
      expect(content).not.toMatch(new RegExp(symbol));
    }
  );

  it("App.tsx DOES contain TheoryCraftPanel (mount point is allowed)", () => {
    const content = readSource("src/app/App.tsx");
    expect(content).toMatch(/TheoryCraftPanel/);
  });
});
