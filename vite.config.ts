import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true
      },
      '/colyseus': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});