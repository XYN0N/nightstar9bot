// Environment variables
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const ADMIN_ID = parseInt(process.env.ADMIN_ID || '506336274', 10);
export const GOOGLE_WALLET_API_KEY = process.env.GOOGLE_WALLET_API_KEY || '';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Star package configurations
export const STAR_PACKAGES = [
  { stars: 100, price: 2.29 },
  { stars: 250, price: 5.79 },
  { stars: 500, price: 11.59 },
  { stars: 750, price: 17.48 },
  { stars: 1000, price: 22.99 }
] as const;