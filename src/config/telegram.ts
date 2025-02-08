// Use process.env for server-side code
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID) || 506336274;
const GOOGLE_WALLET_API_KEY = process.env.GOOGLE_WALLET_API_KEY || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

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