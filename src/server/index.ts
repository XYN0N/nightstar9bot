import express from 'express';
import { createServer } from 'http';
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { Bot } from "grammy";
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
import { verifyTelegramWebAppData } from './middleware/auth.js';
import { validateGameRequest } from './middleware/game.js';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Important: Calculate the correct dist path
const distPath = path.join(__dirname, '../../../dist/client');

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
    family: 4
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

// API Routes
app.post('/api/auth/initialize', verifyTelegramWebAppData, async (req: Request, res: Response) => {
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
      username: telegramUser.username || 'Anonymous',
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      photoUrl,
      lastActive: new Date()
    };

    const user = await User.findOneAndUpdate(
      { telegramId: telegramUser.id },
      { 
        $set: userData,
        $setOnInsert: { stars: 100 }
      },
      { upsert: true, new: true }
    );

    // Store session in Redis
    const sessionKey = `session:${telegramUser.id}`;
    await redis.set(sessionKey, JSON.stringify(user), 'EX', 86400);

    res.json(user);
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

// Add this new route for claiming stars
app.post('/api/stars/claim', verifyTelegramWebAppData, async (req: Request, res: Response) => {
  try {
    if (!req.telegramUser?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ telegramId: req.telegramUser.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.canClaimStars()) {
      const nextClaimTime = user.lastClaim ? new Date(user.lastClaim.getTime() + 3 * 60 * 60 * 1000) : new Date();
      return res.status(400).json({ 
        error: 'You can only claim stars every 3 hours',
        nextClaimTime
      });
    }

    user.stars += 100;
    user.lastClaim = new Date();
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Error claiming stars:', error);
    res.status(500).json({ error: 'Failed to claim stars' });
  }
});

// Update leaderboard route to sort by total earnings
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .sort({ totalEarnings: -1 })
      .limit(50)
      .select('username photoUrl totalWins totalEarnings isPremium');

    const leaderboard = users.map((user, index) => ({
      user: {
        id: user._id,
        username: user.username,
        photoUrl: user.photoUrl,
        totalWins: user.totalWins,
        totalEarnings: user.totalEarnings,
        isPremium: user.isPremium
      },
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Bot commands
bot.command("start", async (ctx) => {
  try {
    const webAppUrl = process.env.APP_URL || 'https://nightstar9bot-d607ada78002.herokuapp.com/';
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

// IMPORTANT: Order of routes matters!
// 1. API routes (already set up above)
// 2. Colyseus monitor
app.use('/colyseus', monitor());

// 3. Static files
app.use(express.static(distPath));

// 4. Catch-all route - MUST be last
app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Serving static files from:', distPath);
});