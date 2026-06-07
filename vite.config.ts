import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { fileURLToPath, URL } from 'node:url';
import manifest from './src/manifest';

// Muninn build config: Vite + CRXJS (Manifest V3) + React + TypeScript.
// CRXJS reads the typed manifest from src/manifest.ts and wires up the
// popup, options page, and content scripts with proper HMR in dev.
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Vitest configuration lives here so unit tests share the same resolver.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  server: {
    // CRXJS recommends a stable port + strictPort for the dev HMR socket.
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
});
