import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/private-financial-planner/',
  build: {
    chunkSizeWarningLimit: 600,
  },
});
