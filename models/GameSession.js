const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  betAmount: Number,
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
});

module.exports = mongoose.model('GameSession', GameSessionSchema);