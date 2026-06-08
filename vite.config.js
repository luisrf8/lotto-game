import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-core'
          }

          if (id.includes('zustand')) {
            return 'state-core'
          }

          if (id.includes('framer-motion')) {
            return 'motion'
          }

          if (id.includes('video.js') || id.includes('hls.js')) {
            return 'streaming'
          }

          return 'vendor'
        },
      },
    },
  },
})
