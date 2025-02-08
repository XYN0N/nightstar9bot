// Add these routes after the existing /api/auth/initialize route

app.post('/api/stars/earn', async (req: express.Request, res: express.Response) => {
  try {
    const { type } = req.body;
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ telegramId: telegramUser.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const lastClaim = user.lastClaim || new Date(0);
    const timeDiff = now.getTime() - lastClaim.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (type === 'click') {
      if (hoursDiff < 24) {
        return res.status(400).json({ error: 'You can only claim stars once per day' });
      }

      user.stars += 1;
      user.lastClaim = now;
      await user.save();

      return res.json(user);
    }

    res.status(400).json({ error: 'Invalid earn type' });
  } catch (error) {
    console.error('Error earning stars:', error);
    res.status(500).json({ error: 'Failed to earn stars' });
  }
});