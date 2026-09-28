/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_API_BASE?: string;
  readonly VITE_SITE_PUBLIC_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Année du build (vite.config.ts, `define`), commune au bundle du navigateur et au prérendu. */
declare const __BUILD_YEAR__: number;
