import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output built files directly into the FastAPI static directory
    outDir: '../backend/static',
    emptyOutDir: true,
  },
  server: {
    // In dev mode, proxy API calls to the FastAPI backend
    proxy: {
      '/login':    { target: 'http://localhost:8001', changeOrigin: true },
      '/signup':   { target: 'http://localhost:8001', changeOrigin: true },
      '/me':       { target: 'http://localhost:8001', changeOrigin: true },
      '/workers':  { target: 'http://localhost:8001', changeOrigin: true },
      '/policies': { target: 'http://localhost:8001', changeOrigin: true },
      '/claims':   { target: 'http://localhost:8001', changeOrigin: true },
      '/payouts':  { target: 'http://localhost:8001', changeOrigin: true },
      '/dashboard': { target: 'http://localhost:8001', changeOrigin: true },
      '/onboarding': { target: 'http://localhost:8001', changeOrigin: true },
      '/health':   { target: 'http://localhost:8001', changeOrigin: true },
    },
  },
})
