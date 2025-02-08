import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['colyseus.js']
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/colyseus': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
});