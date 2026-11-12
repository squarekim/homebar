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
          name: '홈바',
          short_name: '홈바',
          description: '가진 술로 만들 수 있는 칵테일과 취향에 맞는 위스키를 찾아요',
          theme_color: '#F6F4EF',
          background_color: '#F6F4EF',
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
          // 글꼴(woff2)은 미리 받아 두지 않는다 — 한글 글꼴 파일이 수백 개라, 쓰인 글자의 파일만 그때그때 받아 저장한다
          globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
          // 웹 글꼴(Google Fonts)도 기기에 저장한다. 저장하지 않으면 설치한 앱·오프라인·느린 망에서
          // 글꼴을 못 받아 휴대폰에 설정한 글꼴(system-ui)로 보인다.
          runtimeCaching: [
            {
              urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'font',
              handler: 'CacheFirst',
              options: { cacheName: 'app-fonts', expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files',
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        }
      })
    ],
    build: {
      outDir: isPublic ? 'dist-public' : 'dist',
      target: 'es2020'
    }
  };
});
