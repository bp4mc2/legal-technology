import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  server: {
    port: 3000, // You can change this port if needed
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Adjust if your Flask API runs on a different port
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true, // Enable source maps for easier debugging
  },
});
