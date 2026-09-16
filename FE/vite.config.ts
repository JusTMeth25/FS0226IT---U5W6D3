import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser only talks to Vite: /api is forwarded to the Spring backend,
    // which is the only place that knows the OpenRouter API key.
    proxy: {
      '/api': process.env.BACKEND_URL ?? 'http://127.0.0.1:8080',
    },
  },
})
