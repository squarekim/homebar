import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' 로 상대경로 산출 → GitHub Pages 및 추후 Capacitor(file://) 양쪽 호환
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '홈바 플랫폼',
        short_name: '홈바',
        description: '내 취향·재고 기반 위스키/칵테일 홈바 플랫폼',
        theme_color: '#0F1613',
        background_color: '#0F1613',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ],
  build: {
    outDir: 'dist',
    target: 'es2020'
  }
});
