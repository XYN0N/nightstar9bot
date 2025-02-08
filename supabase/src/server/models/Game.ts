import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  player1: { type: Number, required: true }, // Telegram ID
  player2: { type: Number },
  betAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  winner: { type: Number },
  coinSide: {
    type: String,
    enum: ['heads', 'tails']
  },
  createdAt: { type: Date, default: Date.now }
});

export const Game = mongoose.model('Game', GameSchema);