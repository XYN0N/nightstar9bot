import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['colyseus.js']
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '/colyseus': {
          target: 'ws://localhost:3000',
          ws: true
        }
      },
      host: true,
      strictPort: true
    },
    define: {
      'process.env': {}
    }
  };
});