import "reflect-metadata";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { Bot, Context } from "grammy";
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
import { verifyTelegramWebAppData } from './middleware/auth.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = path.join(process.cwd(), 'dist');

const app = express();
const httpServer = createServer(app);
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Initialize Redis with retry strategy
const redis = new Redis(REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Colyseus
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer })
});

gameServer.define("game", GameRoom);

// Middleware
app.use(express.json());

// Helper function to get user profile photo
async function getUserProfilePhoto(userId: number): Promise<string> {
  try {
    const userInfo = await bot.api.getUserProfilePhotos(userId);
    if (userInfo.photos.length > 0) {
      const file = await bot.api.getFile(userInfo.photos[0][0].file_id);
      return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    }
  } catch (error) {
    console.error('Error getting profile photo:', error);
  }
  return '';
}

// Helper function to check if user has started the bot
async function hasUserStartedBot(userId: number): Promise<boolean> {
  try {
    const chatMember = await bot.api.getChatMember('@starnight9bot', userId);
    return chatMember.status !== 'left' && chatMember.status !== 'kicked';
  } catch (error) {
    console.error('Error checking bot start status:', error);
    return false;
  }
}

// API Routes
app.post('/api/auth/initialize', verifyTelegramWebAppData, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has started the bot
    const hasStarted = await hasUserStartedBot(telegramUser.id);
    if (!hasStarted) {
      return res.status(401).json({ 
        error: 'Please start the bot first',
        botUsername: process.env.BOT_USERNAME || 'starnight9bot'
      });
    }

    // Get or create user
    let user = await User.findOne({ telegramId: telegramUser.id });
    
    if (!user) {
      // Get user's profile photo
      const photoUrl = await getUserProfilePhoto(telegramUser.id);
      
      // Create new user
      user = await User.create({
        telegramId: telegramUser.id,
        username: telegramUser.username || `user${telegramUser.id}`,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl,
        stars: 100, // Starting amount
        lastActive: new Date()
      });
    } else {
      // Update user's info
      user.username = telegramUser.username || user.username;
      user.firstName = telegramUser.first_name;
      user.lastName = telegramUser.last_name;
      user.lastActive = new Date();
      await user.save();
    }

    // Store session in Redis
    const sessionKey = `session:${telegramUser.id}`;
    const sessionData = {
      id: user._id,
      telegramId: user.telegramId,
      username: user.username,
      photoUrl: user.photoUrl,
      stars: user.stars,
      isPremium: user.isPremium,
      totalWins: user.totalWins,
      totalLosses: user.totalLosses,
      totalEarnings: user.totalEarnings
    };

    await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 86400); // 24 hours

    res.json(sessionData);
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

// Bot commands
bot.command("start", async (ctx) => {
  try {
    const user = ctx.from;
    if (!user) return;

    // Get user profile photo
    const photoUrl = await getUserProfilePhoto(user.id);

    // Create or update user
    const userData = await User.findOneAndUpdate(
      { telegramId: user.id },
      {
        $set: {
          username: user.username || `user${user.id}`,
          firstName: user.first_name,
          lastName: user.last_name,
          photoUrl,
          lastActive: new Date()
        },
        $setOnInsert: {
          stars: 100,
          totalWins: 0,
          totalLosses: 0,
          totalEarnings: 0
        }
      },
      { upsert: true, new: true }
    );

    // Create session immediately
    const sessionKey = `session:${user.id}`;
    const sessionData = {
      id: userData._id,
      telegramId: userData.telegramId,
      username: userData.username,
      photoUrl: userData.photoUrl,
      stars: userData.stars,
      isPremium: userData.isPremium,
      totalWins: userData.totalWins,
      totalLosses: userData.totalLosses,
      totalEarnings: userData.totalEarnings
    };

    await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 86400);

    // Send welcome message with web app button
    const webAppUrl = process.env.APP_URL || 'https://nightstar9bot-d607ada78002.herokuapp.com';
    await ctx.reply(
      'Welcome to StarNight! 🌟\n\nYour account has been created with 100 stars to start playing!\n\nClick the button below to start playing!',
      {
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '🎮 Play Now', 
              web_app: { url: webAppUrl } 
            }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, there was an error. Please try again later.');
  }
});

// Serve static files
app.use(express.static(distPath));

// Colyseus monitor
app.use('/colyseus', monitor());

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
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