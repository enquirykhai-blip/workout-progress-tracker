import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// Shown in Settings so devices can be compared at a glance.
function buildVersion() {
  let sha = ''
  try {
    sha = execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    // not a git checkout
  }
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return sha ? `${stamp} UTC · ${sha}` : `${stamp} UTC`
}

// https://vite.dev/config/
export default defineConfig({
  base: '/workout-progress-tracker/',
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version waits until the user taps "Update" (or the
      // app is fully closed), so it never reloads mid-workout.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Workout Progress Tracker',
        short_name: 'Workout',
        description: 'Track your 4-day workout split — log sets, hit PRs, watch your progress.',
        theme_color: '#efefef',
        background_color: '#efefef',
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
