import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export function verifyTelegramWebAppData(req: Request, res: Response, next: NextFunction) {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    
    // In development, allow mock data
    if (process.env.NODE_ENV === 'development') {
      const mockUser = {
        id: 506336274,
        first_name: 'Test',
        username: 'test_user'
      };
      req.telegramUser = mockUser;
      return next();
    }

    if (!initData) {
      return res.status(401).json({ 
        error: 'Please open this app through Telegram',
        botUsername: process.env.BOT_USERNAME
      });
    }

    // Parse the init data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const user = urlParams.get('user');

    if (!hash || !user) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Parse user data
    const userData = JSON.parse(user);
    if (!userData || !userData.id) {
      return res.status(401).json({ error: 'Invalid user data' });
    }

    // Validate hash
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();
    
    const generatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    if (generatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid Telegram data signature' });
    }

    req.telegramUser = userData;
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data format' });
  }
}