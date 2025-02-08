// Import environment variables directly in development
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
const ADMIN_ID = Number(import.meta.env.VITE_ADMIN_ID) || 506336274;
const GOOGLE_WALLET_API_KEY = import.meta.env.VITE_GOOGLE_WALLET_API_KEY || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';

const STAR_PACKAGES = [
  { stars: 100, price: 2.29 },
  { stars: 250, price: 5.79 },
  { stars: 500, price: 11.59 },
  { stars: 750, price: 17.48 },
  { stars: 1000, price: 22.99 }
] as const;

export {
  TELEGRAM_BOT_TOKEN,
  ADMIN_ID,
  GOOGLE_WALLET_API_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  STAR_PACKAGES
};