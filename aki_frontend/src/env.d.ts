/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_GOOGLE_GA4: string;
  readonly API_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
