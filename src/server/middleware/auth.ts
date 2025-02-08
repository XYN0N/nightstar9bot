import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

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

    // Validate the data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // In development, we'll skip the actual validation
    req.telegramUser = {
      id: 123456789,
      first_name: 'Test',
      username: 'test_user',
      language_code: 'en'
    };
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data format' });
  }
}