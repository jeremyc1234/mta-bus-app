// global.d.ts
export {};

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}