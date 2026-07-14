import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const scriptPath = resolve(process.cwd(), "src/ohai/scripts/audit-build-data-integrity.ts");

describe("data integrity audit scan exclusions", () => {
  it("does not scan its own generated reports or validator source by default", () => {
    const source = readFileSync(scriptPath, "utf8");

    expect(source).toContain("'docs/generated/'");
    expect(source).toContain("'docs/reports/'");
    expect(source).toContain("'src/ohai/scripts/audit-build-data-integrity.ts'");
    expect(source).toContain("shouldScanFile");
    expect(source).toContain("--full-report");
  });
});
