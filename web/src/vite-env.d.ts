/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket URL of the multiplayer server (defaults to the deployed server). */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
