import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_BOT_TOKEN, ADMIN_ID } from '../config/telegram';
import { REDIS_URL, MONGODB_URL } from '../config/database';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const redis = new Redis(REDIS_URL);
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Connect to MongoDB
mongoose.connect(MONGODB_URL);

// Middleware
app.use(express.json());

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

// Routes
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

  // Find waiting game or create new one
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

    // Notify players
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

// Socket.IO
io.on('connection', (socket) => {
  socket.on('joinGame', (gameId) => {
    socket.join(`game:${gameId}`);
  });
});

// Telegram Bot
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ telegramId: chatId });

  if (!user) {
    const newUser = new User({
      telegramId: chatId,
      username: msg.from?.username || 'Anonymous',
      photoUrl: msg.from?.photo?.big_file_id,
      stars: 0,
    });
    await newUser.save();
    bot.sendMessage(chatId, 'Welcome to StarNight! 🌟');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});