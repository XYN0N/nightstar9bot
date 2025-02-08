import "reflect-metadata";
import express from 'express';
import { createServer } from 'http';
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { Bot } from "grammy";
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { GameRoom } from "./rooms/GameRoom.js";
import { User } from './models/User.js';
import { verifyTelegramWebAppData } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate paths
const rootDir = path.resolve(__dirname, '../../..');
const distDir = path.join(rootDir, 'dist');
const clientDir = path.join(distDir, 'client');

const app = express();
const httpServer = createServer(app);

// Enable CORS for development
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
  credentials: true
}));

// Middleware
app.use(express.json());

// Initialize Redis with retry strategy
const redis = new Redis(process.env.REDIS_URL || '', {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Connect to MongoDB with retries
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL || '');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectMongoDB, 5000);
  }
};

connectMongoDB();

// Initialize Telegram bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

// Initialize Colyseus
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

// Register game room
gameServer.define("game", GameRoom);

// API Routes
app.use('/api', verifyTelegramWebAppData);

app.post('/api/auth/initialize', async (req, res) => {
  try {
    // In development, create a mock user
    if (process.env.NODE_ENV === 'development') {
      const mockUser = {
        id: 506336274,
        username: 'Test User',
        stars: 100,
        totalWins: 0,
        totalLosses: 0,
        totalEarnings: 0,
        badges: [],
        isPremium: false,
        photoUrl: '',
        referralCode: 'TEST123'
      };
      return res.json(mockUser);
    }

    const telegramUser = req.telegramUser;
    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let user = await User.findOne({ telegramId: telegramUser.id });
    
    if (!user) {
      user = await User.create({
        telegramId: telegramUser.id,
        username: telegramUser.username || `user${telegramUser.id}`,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        stars: 100
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

// Colyseus monitor
app.use('/colyseus', monitor());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Ensure client directory exists
  if (!fs.existsSync(clientDir)) {
    console.error('Client directory not found:', clientDir);
    process.exit(1);
  }

  app.use(express.static(clientDir));
  
  // Serve index.html for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
} else {
  // In development, proxy non-API requests to Vite dev server
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
    } else {
      res.redirect('http://localhost:5173' + req.path);
    }
  });
}

// Start bot
bot.start().catch(err => {
  console.error('Error starting bot:', err);
});

// Start server
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Client directory:', clientDir);
});