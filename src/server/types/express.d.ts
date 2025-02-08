import { Document } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      telegramUser?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
      gameUser?: Document & {
        telegramId: number;
        username: string;
        stars: number;
        [key: string]: any;
      };
    }
  }
}

export {};