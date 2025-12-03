import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['@mantine/core', '@mantine/hooks', '@emotion/react', '@emotion/styled'],
                    utils: ['axios', '@tanstack/react-query', 'date-fns']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
})