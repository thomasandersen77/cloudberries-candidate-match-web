import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    if (id.includes('@mui') || id.includes('@emotion') || id.includes('@fontsource')) {
                        return 'vendor-mui';
                    }

                    if (id.includes('react-router-dom')) {
                        return 'vendor-router';
                    }

                    if (id.includes('@tanstack/react-query')) {
                        return 'vendor-react-query';
                    }

                    if (id.includes('react-markdown')) {
                        return 'vendor-markdown';
                    }

                    if (id.includes('react') || id.includes('scheduler')) {
                        return 'vendor-react';
                    }

                    return 'vendor';
                },
            },
        },
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
            // Preserve /api so requests forward to backend /api/* (matches spring.mvc.servlet.path)
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
