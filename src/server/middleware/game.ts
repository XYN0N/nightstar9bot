import { Request, Response, NextFunction } from 'express';

export function validateGameRequest(req: Request, res: Response, next: NextFunction) {
  // In development mode, skip validation
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const { betAmount } = req.body;
    if (!betAmount || betAmount < 15 || betAmount > 100) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    next();
  } catch (error) {
    console.error('Game validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}