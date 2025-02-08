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
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/colyseus': {
        target: 'ws://localhost:3000',
        ws: true
      }
    },
    host: true, // Add this to allow external access
    strictPort: true // Add this to ensure the port doesn't change
  }
});