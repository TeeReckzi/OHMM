import '@testing-library/jest-dom';

// Polyfill ResizeObserver for Recharts in jsdom environment
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;
