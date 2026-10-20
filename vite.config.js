import { defineConfig } from 'vite';

// Plain static frontend. No environment variables or backend are required.
export default defineConfig({
  server: { port: 5173, open: false },
  preview: { port: 4173 },
});
