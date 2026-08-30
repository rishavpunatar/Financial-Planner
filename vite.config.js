import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets keep the app portable across a custom domain, GitHub Pages,
  // and static commercial hosting without a code change.
  base: './',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
  },
});
