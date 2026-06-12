/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_AUTH_MODE?: 'subprotocol' | 'query';
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
