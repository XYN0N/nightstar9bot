// Use import.meta.env for client-side environment variables
export const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
export const ADMIN_ID = parseInt(import.meta.env.VITE_ADMIN_ID || '506336274');
export const GOOGLE_WALLET_API_KEY = import.meta.env.VITE_GOOGLE_WALLET_API_KEY || '';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';

export const STAR_PACKAGES = [
  { stars: 100, price: 2.29 },
  { stars: 250, price: 5.79 },
  { stars: 500, price: 11.59 },
  { stars: 750, price: 17.48 },
  { stars: 1000, price: 22.99 }
] as const;