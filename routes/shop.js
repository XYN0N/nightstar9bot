const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/buy', async (req, res) => {
  const { telegramId, stars } = req.body;
  try {
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.stars += stars;
    await user.save();
    res.json({ message: `Successfully purchased ${stars} stars!` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;