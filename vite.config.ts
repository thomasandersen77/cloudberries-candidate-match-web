import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Required for Docker container port mapping
        port: 5174,
        strictPort: true, // Fail if port is already in use instead of trying next port
        allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'bulldog-sweeping-osprey.ngrok-free.app'],
        watch: {
            usePolling: true, // Helps with file change detection in Docker
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            '/actuator': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
