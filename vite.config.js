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
        manualChunks: {
          // React core — rarely changes, cached aggressively
          'vendor-react': ['react', 'react-dom'],
          // Router — separate from react so updates to one don't bust the other
          'vendor-router': ['react-router-dom'],
          // Supabase — large, changes rarely
          'vendor-supabase': ['@supabase/supabase-js'],
          // Leaflet map — only loaded when MapPage is visited
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
        },
        // Content-hash filenames → permanent browser caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // Minify with esbuild (default, fastest)
    minify: 'esbuild',

    // Remove console.* and debugger in production
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
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
