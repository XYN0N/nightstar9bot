import "reflect-metadata";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { Bot } from "grammy";
import express from 'express';
import { createServer } from 'http';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs-extra';
import { GameRoom } from "./rooms/GameRoom.js";
import { TELEGRAM_BOT_TOKEN, ADMIN_ID } from '../config/telegram.js';
import { REDIS_URL, MONGODB_URL } from '../config/database.js';
import { User } from './models/User.js';
import { Game } from './models/Game.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Important: Calculate the correct dist path
const distPath = path.join(__dirname, '../../dist');

const app = express();
const httpServer = createServer(app);

// Initialize Redis with retry strategy
const redis = new Redis(REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Connect to MongoDB with retries and options
const connectWithRetry = () => {
  mongoose.connect(MONGODB_URL, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
  })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Initialize Telegram bot with grammY
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Initialize Colyseus
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

// Register game room
gameServer.define("game", GameRoom);

// Middleware
app.use(express.json());

// Function to validate Telegram WebApp data
function validateTelegramWebAppData(initData: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;
    
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
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
  }
}

// Middleware to verify and parse Telegram WebApp data
const verifyTelegramWebAppData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const initData = req.headers['x-telegram-init-data'] as string;
  const userData = req.headers['x-telegram-user'];
  
  if (!initData || !userData) {
    return res.status(401).json({ error: 'Please open this app through Telegram' });
  }

  try {
    // Validate the data
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Parse and validate user data
    const user = JSON.parse(userData as string);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Invalid user data' });
    }

    req.telegramUser = user;
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data format' });
  }
};

// API Routes
app.post('/api/auth/initialize', async (req: express.Request, res: express.Response) => {
  try {
    const telegramUser = req.telegramUser;
    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile photo
    let photoUrl = '';
    try {
      const userInfo = await bot.api.getUserProfilePhotos(telegramUser.id);
      if (userInfo.photos.length > 0) {
        const file = await bot.api.getFile(userInfo.photos[0][0].file_id);
        photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      }
    } catch (error) {
      console.error('Error getting profile photo:', error);
    }

    // Create or update user
    const userData = {
      telegramId: telegramUser.id,
      username: telegramUser.username || telegramUser.first_name || 'Anonymous',
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      languageCode: telegramUser.language_code,
      photoUrl,
      lastActive: new Date()
    };

    const user = await User.findOneAndUpdate(
      { telegramId: telegramUser.id },
      { 
        $set: userData,
        $setOnInsert: { stars: 100 } // Only set stars if this is a new user
      },
      { upsert: true, new: true }
    );

    // Store session in Redis
    const sessionKey = `session:${telegramUser.id}`;
    await redis.set(sessionKey, JSON.stringify(user), 'EX', 86400); // 24 hours

    res.json(user);
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

// Add new route for earning stars
app.post('/api/stars/earn', verifyTelegramWebAppData, async (req, res) => {
  try {
    const { type } = req.body;
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let starsToAdd = 0;
    switch (type) {
      case 'click':
        starsToAdd = 1;
        break;
      case 'referral':
        starsToAdd = 100;
        break;
      default:
        return res.status(400).json({ error: 'Invalid earn type' });
    }

    // Update user's stars in database
    const user = await User.findOneAndUpdate(
      { telegramId: telegramUser.id },
      { $inc: { stars: starsToAdd } },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    console.error('Error earning stars:', error);
    res.status(500).json({ error: 'Failed to earn stars' });
  }
});

// Add route for leaderboard
app.get('/api/leaderboard', verifyTelegramWebAppData, async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .sort({ totalWins: -1, totalEarnings: -1 })
      .limit(20)
      .select('username photoUrl totalWins totalEarnings isPremium');

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Add route for game matchmaking
app.post('/api/game/find-match', verifyTelegramWebAppData, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const telegramUser = req.telegramUser;

    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find a waiting game or create a new one
    const waitingGame = await Game.findOne({
      status: 'waiting',
      betAmount,
      player2: null
    });

    if (waitingGame) {
      // Join existing game
      waitingGame.player2 = telegramUser.id;
      waitingGame.status = 'playing';
      await waitingGame.save();
      return res.json(waitingGame);
    }

    // Create new game
    const newGame = new Game({
      player1: telegramUser.id,
      betAmount,
      status: 'waiting'
    });
    await newGame.save();

    res.json(newGame);
  } catch (error) {
    console.error('Error finding match:', error);
    res.status(500).json({ error: 'Failed to find match' });
  }
});

// IMPORTANT: Order of routes matters!
// 1. API routes (already set up above)
// 2. Colyseus monitor
app.use('/colyseus', monitor());

// 3. Static files
app.use(express.static(distPath));

// 4. Catch-all route - MUST be last
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Bot commands
bot.command("start", async (ctx) => {
  try {
    const webAppUrl = process.env.APP_URL || 'https://t.me/starnight9bot/app';
    await ctx.reply('Welcome to StarNight! 🌟\n\nClick the button below to start playing!', {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎮 Play Now',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    });
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, there was an error. Please try again later.');
  }
});

// Start bot
bot.start().catch(err => {
  console.error('Error starting bot:', err);
});

// Start server
const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});