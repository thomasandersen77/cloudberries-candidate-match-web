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
            '/auth': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/consultants': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/skills': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/chatbot': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/cv': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/embeddings': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/matches': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/project-requests': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/cv-score': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/health': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
            '/actuator': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
        },
    },
});
