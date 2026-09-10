/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** 빌드 시각 · 커밋 (vite define 으로 주입) */
declare const __BUILD__: string;

interface ImportMetaEnv {
  readonly VITE_PUBLIC?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
