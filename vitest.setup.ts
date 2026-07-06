// vitest.setup.ts
// Mock process.exit to prevent property tests from terminating the Vitest test runner.

process.exit = ((code?: string | number | null | undefined): never => {
  if (code !== 0 && code !== '0') {
    throw new Error(`process.exit called with failure code: ${code}`);
  }
  // For exit code 0, do nothing and let the test runner proceed.
  // We cast this to any to satisfy the 'never' return type compiler requirement.
  return undefined as any;
}) as any;
