import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Manual chunk splitting — keeps vendor libraries in separate,
    // long-lived cached bundles separate from app code.
    rollupOptions: {
      output: {
        // rolldown (Vite 8) requires manualChunks as a function, not an object
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-router';
          }
        },
      },
    },
  },
})

