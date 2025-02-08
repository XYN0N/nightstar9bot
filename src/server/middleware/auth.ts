import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { TELEGRAM_BOT_TOKEN } from '../../config/telegram.js';

export function verifyTelegramWebAppData(req: Request, res: Response, next: NextFunction) {
  // In development mode, skip verification
  if (process.env.NODE_ENV === 'development') {
    req.telegramUser = {
      id: 123456789,
      first_name: 'Test',
      username: 'test_user',
      language_code: 'en'
    };
    return next();
  }

  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      return res.status(401).json({ error: 'No Telegram data provided' });
    }

    // Parse and validate the data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Remove hash from data before checking
    urlParams.delete('hash');

    // Sort parameters alphabetically
    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Calculate HMAC-SHA256
    const secret = crypto.createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto.createHmac('sha256', secret)
      .update(params)
      .digest('hex');

    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid Telegram data signature' });
    }

    // Parse user data
    const userData = JSON.parse(urlParams.get('user') || '{}');
    req.telegramUser = userData;
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data format' });
  }
}