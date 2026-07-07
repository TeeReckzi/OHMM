// Shared OHMM conversion layer for the Figma UI (src/app/App.tsx).
// Core formulas, resolvers, and engine live under src/ohai/src/*.
// This barrel provides a stable bridge surface for UI→engine communication.

export { loadoutMapToBuildSelection } from './convertLoadout';
