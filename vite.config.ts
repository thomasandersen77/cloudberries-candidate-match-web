import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',
        emptyOutDir: true
    },
    server: {
        host: true, // Required for Docker container port mapping
        port: 5174,
        strictPort: true, // Fail if port is already in use instead of trying next port
        allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0'],
        watch: {
            usePolling: true, // Helps with file change detection in Docker
        },
        proxy: {
            // Canonical mapping: frontend calls /api/*; proxy strips prefix and forwards to backend root
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
            // Route analytics to the same backend locally (endpoints live in candidate-match)
            '/analytics': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
