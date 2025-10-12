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
        allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'bulldog-sweeping-osprey.ngrok-free.app'],
        watch: {
            usePolling: true, // Helps with file change detection in Docker
        },
        proxy: {
            // New canonical mapping: backend serves under /api
            '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },

            // Backwards-compat for existing dev calls without /api prefix
            '/auth': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/consultants': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/skills': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/chatbot': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/cv': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/embeddings': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/matches': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/project-requests': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/cv-score': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },
            '/health': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => path.replace(/^\/health/, '/api/health') },
            '/actuator': { target: 'http://localhost:8080', changeOrigin: true, secure: false, rewrite: (path) => '/api' + path },

            // Analytics service (teknologi-barometer-service) on :8082 during dev
            '/analytics': { target: 'http://localhost:8082', changeOrigin: true, secure: false },
        },
    },
});
