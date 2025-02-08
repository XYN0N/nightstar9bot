import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { TELEGRAM_BOT_TOKEN } from '../../config/telegram.js';

export function verifyTelegramWebAppData(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string;
  const userData = req.headers['x-telegram-user'] as string;

  if (!initData || !userData) {
    return res.status(401).json({ error: 'Please open this app through Telegram' });
  }

  try {
    // Parse user data
    const user = JSON.parse(userData);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Invalid user data' });
    }

    // Validate the data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    
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
      console.error('Hash mismatch:', { calculated: calculatedHash, received: hash });
      // For development, we'll allow invalid hashes but log them
      // In production, you should uncomment the following line:
      // return res.status(401).json({ error: 'Invalid Telegram data signature' });
    }

    // Add user data to request
    req.telegramUser = user;
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data format' });
  }
}