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
import { GameRoom } from "./rooms/GameRoom.js";
import { TELEGRAM_BOT_TOKEN, ADMIN_ID } from '../config/telegram.js';
import { REDIS_URL, MONGODB_URL } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const redis = new Redis(REDIS_URL);

// Connect to MongoDB with retries
const connectWithRetry = () => {
  mongoose.connect(MONGODB_URL)
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

// Middleware to verify and parse Telegram WebApp data
const verifyTelegramWebAppData = (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) {
    return res.status(401).json({ error: 'No Telegram data provided' });
  }

  try {
    const data = Object.fromEntries(new URLSearchParams(initData));
    if (!data.user) {
      return res.status(401).json({ error: 'No user data found' });
    }
    req.telegramUser = JSON.parse(data.user);
    next();
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    res.status(401).json({ error: 'Invalid Telegram data' });
  }
};

// Apply middleware to protected routes
app.use('/api/*', verifyTelegramWebAppData);

// Serve static files
app.use(express.static(path.join(__dirname, '../../')));

// Monitor endpoint (admin only)
app.use("/colyseus", (req, res, next) => {
  if (req.telegramUser?.id === ADMIN_ID) {
    return monitor()(req, res, next);
  }
  res.status(403).json({ error: 'Unauthorized' });
});

// Models
const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  photoUrl: { type: String },
  stars: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  badges: [String],
  firstName: { type: String },
  lastName: { type: String },
  languageCode: { type: String },
  lastActive: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// API Routes
app.post('/api/auth/initialize', async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
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
      languageCode: telegramUser.language_code,
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

    res.json(user);
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

// Bot commands
bot.command("start", async (ctx) => {
  try {
    const webAppUrl = 'https://nightstar9bot-d607ada78002.herokuapp.com/';
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
bot.start();

// Start server
const PORT = process.env.PORT || 3000;
gameServer.listen(PORT);
console.log(`Server running on port ${PORT}`);