/// <reference types="vite/client" />

// Vite handles CSS imports at build time; this declaration lets TypeScript
// understand the stylesheet side-effect import in main.tsx.
declare module '*.css';
