/**
 * Minimal harness validation test.
 * Verifies that Vitest is configured correctly and can run.
 */
import { describe, it, expect } from 'vitest';

describe('Test harness', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('has access to jsdom environment', () => {
    expect(typeof document).toBe('object');
    expect(document.createElement).toBeDefined();
  });
});
