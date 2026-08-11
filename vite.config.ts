import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        parpadeometro: resolve(import.meta.dirname, 'parpadeometro/index.html'),
        status: resolve(import.meta.dirname, 'status/index.html'),
        db: resolve(import.meta.dirname, 'db/index.html'),
        reps: resolve(import.meta.dirname, 'reps/index.html'),
        repsAceptar: resolve(import.meta.dirname, 'reps/aceptar.html'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'parpadeometro/icons/icon.svg',
        'status/icons/icon.svg',
        'status/icons/icon-192.png',
        'status/icons/icon-512.png',
        'status/icons/apple-touch-icon.png',
        'status/manifest.webmanifest',
        'db/icons/icon.svg',
        'db/icons/icon-192.png',
        'db/icons/icon-512.png',
        'db/icons/apple-touch-icon.png',
        'db/manifest.webmanifest',
        'reps/icons/icon.svg',
        'reps/icons/icon-192.png',
        'reps/icons/icon-512.png',
        'reps/icons/apple-touch-icon.png',
        'reps/manifest.webmanifest',
      ],
      manifest: {
        name: 'Habertronic Orión',
        short_name: 'Orión',
        description:
          'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
        theme_color: '#163a4a',
        background_color: '#e4eceb',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/parpadeometro/, /^\/status/, /^\/db/, /^\/reps/],
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
        // WASM ~12MB: no precache; runtime cache below.
        globIgnores: ['**/parpadeometro/wasm/**'],
        runtimeCaching: [
          {
            urlPattern: /\/parpadeometro\/wasm\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-wasm-v1',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-cdn-v2',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-models-v2',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
