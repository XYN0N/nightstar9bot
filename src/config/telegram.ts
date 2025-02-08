// Use environment variables for sensitive data
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7996379094:AAGGvxufeR9Pxsq3vBA8nY6Ti-zIVHsHV3c';
export const ADMIN_ID = parseInt(process.env.ADMIN_ID || '506336274');
export const GOOGLE_WALLET_API_KEY = process.env.GOOGLE_WALLET_API_KEY || 'AIzaSyDg1aF7vn8FGShHsfVRmLwrSV203d028Sg';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '655968772922-d922fbcp0jr7svnq4ul8ua28liaj7m4v.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';

export const STAR_PACKAGES = [
  { stars: 100, price: 2.29 },
  { stars: 250, price: 5.79 },
  { stars: 500, price: 11.59 },
  { stars: 750, price: 17.48 },
  { stars: 1000, price: 22.99 }
] as const;