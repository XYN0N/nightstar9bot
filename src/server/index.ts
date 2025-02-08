// Add this route for finding matches
app.post('/api/game/find-match', verifyTelegramWebAppData, validateGameRequest, async (req: Request, res: Response) => {
  try {
    const { betAmount } = req.body;
    const telegramId = req.telegramUser?.id;

    if (!telegramId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user and check their stars
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.stars < betAmount) {
      return res.status(400).json({ error: 'Insufficient stars' });
    }

    // Deduct stars immediately
    user.stars -= betAmount;
    await user.save();

    // Try to find an existing game waiting for a player
    let game = await Game.findOne({ 
      status: 'waiting',
      betAmount,
      player1: { $ne: user.telegramId }
    });

    if (game) {
      // Join existing game
      game.player2 = user.telegramId;
      game.status = 'playing';
      await game.save();
    } else {
      // Create new game
      game = await Game.create({
        player1: user.telegramId,
        betAmount,
        status: 'waiting'
      });
    }

    res.json(game);
  } catch (error) {
    console.error('Error finding match:', error);
    res.status(500).json({ error: 'Failed to find match' });
  }
});