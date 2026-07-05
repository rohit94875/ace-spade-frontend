import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow injecting a subpath for reverse-proxy deployments (e.g. /acespade/).
  // Set VITE_BASE_PATH at Docker build time; leave unset for local dev (defaults to /).
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    // sockjs-client uses Node's `global`; polyfill it for the browser
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['sockjs-client'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
