import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { TELEGRAM_BOT_TOKEN } from '../../config/telegram.js';
import { User } from '../models/User.js';

export async function verifyTelegramWebAppData(req: Request, res: Response, next: NextFunction) {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      return res.status(401).json({ error: 'Please open this app through Telegram' });
    }

    // Parse the init data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const queryId = urlParams.get('query_id');
    const user = urlParams.get('user');

    if (!hash || !user) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Parse user data
    const userData = JSON.parse(user);
    if (!userData || !userData.id) {
      return res.status(401).json({ error: 'Invalid user data' });
    }

    // Skip validation in development
    if (process.env.NODE_ENV === 'development') {
      req.telegramUser = userData;
      return next();
    }

    // Validate hash in production
    urlParams.delete('hash');
    
    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secret = crypto.createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();
    
    const calculatedHash = crypto.createHmac('sha256', secret)
      .update(params)
      .digest('hex');
    
    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid Telegram data signature' });
    }

    // Check if user exists
    const dbUser = await User.findOne({ telegramId: userData.id });
    if (!dbUser) {
      return res.status(401).json({ 
        error: 'Please start the bot first',
        botUsername: process.env.BOT_USERNAME || 'starnight9bot'
      });
    }

    req.telegramUser = userData;
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data format' });
  }
}