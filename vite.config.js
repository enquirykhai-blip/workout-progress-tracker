import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/workout-progress-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Workout Progress Tracker',
        short_name: 'Workout',
        description: 'Track your 5-day workout split — log sets, hit PRs, watch your progress.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/workout-progress-tracker/',
        scope: '/workout-progress-tracker/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the built app shell so it opens (and lets you view already-synced
        // data) even with no signal; Firebase calls still need real network.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
