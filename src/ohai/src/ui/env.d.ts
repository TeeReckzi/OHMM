/// <reference types="vite/client" />

// Allow CSS module imports in TypeScript (Vite handles these at build time)
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
