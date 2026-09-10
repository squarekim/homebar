import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { makePublicSeed } from './scripts/makePublicSeed.mjs';
import { publicSeedPlugin } from './scripts/publicSeedPlugin.mjs';
import { execSync } from 'node:child_process';

/** 배포된 결과물이 어느 커밋인지 화면에서 확인할 수 있게 빌드 시각·커밋을 심는다 */
function buildStamp() {
  const at = new Date().toISOString().slice(0, 16).replace('T', ' ');
  let sha = 'local';
  try { sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* git 없는 환경 */ }
  return `${at} · ${sha}`;
}

// base './' 로 상대경로 산출 → GitHub Pages 및 추후 Capacitor(file://) 양쪽 호환
// mode 'public' → 개인 보유 데이터가 빠진 seed.public.ts 를 대신 번들한다(.env.public).
export default defineConfig(({ mode }) => {
  const isPublic = mode === 'public';
  if (isPublic) {
    const r = makePublicSeed();
    // eslint-disable-next-line no-console
    console.log(`[public] 개인 데이터 제외 — 보유 주류 ${r.removedBottles}종 · 개인 재고 ${r.removedOwned}건 · 매트릭스 ${r.removedMatrix}행`);
  }
  return {
    base: './',
    define: { __BUILD__: JSON.stringify(buildStamp()) },
    plugins: [
      isPublic && publicSeedPlugin(),
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
      outDir: isPublic ? 'dist-public' : 'dist',
      target: 'es2020'
    }
  };
});
