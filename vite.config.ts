import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Required for Docker container port mapping
    port: 5174,
    watch: {
      usePolling: true, // Helps with file change detection in Docker
    },
  },
});