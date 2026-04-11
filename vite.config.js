import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ── Build optimizations ──────────────────────────────────────
  build: {
    // Modern targets only — smaller, faster bundles
    target: 'es2020',

    // Enable CSS code splitting so pages only load the CSS they need
    cssCodeSplit: true,

    // Increase warning limit slightly (leaflet/supabase are big)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Manual chunk splitting — each vendor loads independently
        // and is cached by the browser between page loads
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'vendor-react'
          if (id.includes('node_modules/react-router'))
            return 'vendor-router'
          if (id.includes('node_modules/@supabase'))
            return 'vendor-supabase'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet'))
            return 'vendor-leaflet'
        },
        // Content-hash filenames → permanent browser caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // Minify with esbuild (default, fastest)
    minify: 'esbuild',
  },

  // Drop console/debugger in production (top-level esbuild key — Vite 8)
  esbuild: {
    drop: ['console', 'debugger'],
  },

  // ── Dev server ───────────────────────────────────────────────
  server: {
    // Security headers for local dev (mirrored in production by your host)
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // ── Preview server (vite preview) ───────────────────────────
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    },
  },
})
