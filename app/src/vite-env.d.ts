/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
