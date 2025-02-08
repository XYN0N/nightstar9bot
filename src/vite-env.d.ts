/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp: {
      ready: () => void;
      expand: () => void;
      initData: string;
    };
  };
}

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_TOKEN: string;
  readonly VITE_ADMIN_ID: string;
  readonly VITE_GOOGLE_WALLET_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_CLIENT_SECRET: string;
  readonly VITE_REDIS_URL: string;
  readonly VITE_MONGODB_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}