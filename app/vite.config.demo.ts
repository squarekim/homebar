import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { publicSeedPlugin } from './scripts/publicSeedPlugin.mjs';

// 데모 전용: 전체 앱을 단일 HTML 로 인라인(서비스워커/외부 자산 없음). 라이브 링크·아티팩트용.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [mode === 'public' && publicSeedPlugin(), react(), viteSingleFile()],
  build: {
    outDir: mode === 'public' ? 'dist-demo-public' : 'dist-demo',
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { input: 'index.demo.html' },
  },
}));
