import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_BOT_TOKEN, ADMIN_ID } from '../config/telegram.js';
import { REDIS_URL, MONGODB_URL } from '../config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
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

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Middleware
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../../')));

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
  initData: { type: String },
  lastActive: { type: Date, default: Date.now }
});

const GameSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  betAmount: { type: Number, required: true },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coinSide: { type: String, enum: ['heads', 'tails'] },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Game = mongoose.model('Game', GameSchema);

// API Routes
app.get('/api/user', async (req, res) => {
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

app.get('/api/leaderboard', async (req, res) => {
  const users = await User.find()
    .sort({ totalEarnings: -1 })
    .limit(10);

  res.json(users.map((user, index) => ({ user, rank: index + 1 })));
});

app.post('/api/game/match', async (req, res) => {
  const { betAmount } = req.body;
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.stars < betAmount) return res.status(400).json({ error: 'Insufficient stars' });

  let game = await Game.findOne({ status: 'waiting', betAmount })
    .populate('player1')
    .populate('player2');

  if (!game) {
    game = new Game({
      player1: user._id,
      betAmount,
    });
    await game.save();
  } else {
    game.player2 = user._id;
    game.status = 'playing';
    game.coinSide = Math.random() < 0.5 ? 'heads' : 'tails';
    await game.save();

    io.to(`game:${game._id}`).emit('gameStart', game);
  }

  res.json(game);
});

app.get('/api/game/:id', async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate('player1')
    .populate('player2')
    .populate('winner');

  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('joinGame', (gameId) => {
    socket.join(`game:${gameId}`);
  });
});

// Telegram Bot Commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    // Get user profile photos
    let photoUrl = '';
    try {
      const photos = await bot.getUserProfilePhotos(msg.from?.id || chatId);
      if (photos.photos.length > 0) {
        const fileId = photos.photos[0][0].file_id;
        const file = await bot.getFile(fileId);
        photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      }
    } catch (error) {
      console.error('Error getting profile photo:', error);
    }

    // Create or update user
    const userData = {
      telegramId: chatId,
      username: msg.from?.username || 'Anonymous',
      firstName: msg.from?.first_name,
      lastName: msg.from?.last_name,
      languageCode: msg.from?.language_code,
      photoUrl,
      lastActive: new Date(),
      initData: msg.web_app_data?.data || ''
    };

    const user = await User.findOneAndUpdate(
      { telegramId: chatId },
      { $set: userData },
      { upsert: true, new: true }
    );

    // Send welcome message with web app link
    const webAppUrl = 'https://nightstar9bot-d607ada78002.herokuapp.com/';
    const keyboard = {
      inline_keyboard: [
        [{
          text: '🎮 Play Now',
          web_app: { url: webAppUrl }
        }]
      ]
    };

    const welcomeMessage = user.stars === 0 
      ? `Welcome to StarNight! 🌟\n\nGet ready to challenge other players and win stars! You'll receive 100 stars to start playing.`
      : `Welcome back to StarNight! 🌟\n\nYou have ${user.stars} stars. Ready to play?`;

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });

    // Give initial stars to new users
    if (user.stars === 0) {
      user.stars = 100;
      await user.save();
      await bot.sendMessage(chatId, '🎁 You received 100 stars! Use them wisely!');
    }

  } catch (error) {
    console.error('Error in /start command:', error);
    bot.sendMessage(chatId, 'Sorry, there was an error. Please try again later.');
  }
});

// General message handler
bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/')) return; // Skip command messages

  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegramId: chatId });
    if (!user) {
      bot.sendMessage(chatId, 'Please use /start to begin playing!');
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Error handling for bot polling
bot.on('polling_error', (error) => {
  console.log('Bot polling error:', error);
  bot.stopPolling();
  setTimeout(() => {
    bot.startPolling();
  }, 10000);
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});