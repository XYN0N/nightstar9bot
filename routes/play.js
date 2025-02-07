const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GameSession = require('../models/GameSession');

router.post('/', async (req, res) => {
  const { playerId, betAmount } = req.body;
  try {
    const player1 = await User.findById(playerId);
    if (!player1 || player1.stars < betAmount) {
      return res.status(400).json({ message: 'Insufficient stars or player not found' });
    }

    const player2 = await User.findOne({ _id: { $ne: player1._id }, stars: { $gte: betAmount } });
    if (!player2) {
      return res.status(404).json({ message: 'No available opponents' });
    }

    const player1Number = Math.floor(Math.random() * 100) + 1;
    const player2Number = Math.floor(Math.random() * 100) + 1;

    const winner = player1Number > player2Number ? player1 : player2;
    const loser = winner._id.equals(player1._id) ? player2 : player1;

    winner.stars += betAmount;
    winner.totalWinnings += betAmount;
    winner.wins += 1;
    winner.updateBadges();
    loser.stars -= betAmount;
    loser.losses += 1;

    await winner.save();
    await loser.save();

    const gameSession = new GameSession({
      player1: player1._id,
      player2: player2._id,
      betAmount,
      winner: winner._id,
      status: 'completed'
    });

    await gameSession.save();

    res.json({ message: `${winner.name} wins!`, winner, player1Number, player2Number });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;