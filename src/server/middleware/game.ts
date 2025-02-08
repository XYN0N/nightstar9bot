import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';

export async function validateGameRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const telegramUser = req.telegramUser;
    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ telegramId: telegramUser.id });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.stars < (req.body.betAmount || 0)) {
      return res.status(400).json({ error: 'Insufficient stars' });
    }

    req.gameUser = user;
    next();
  } catch (error) {
    console.error('Game validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}