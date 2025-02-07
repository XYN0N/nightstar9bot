const User = require('../models/User');

module.exports = (app) => {
  app.get('/leaderboard', async (req, res) => {
    const users = await User.find().sort({ wins: -1 }).limit(20);
    res.render('leaderboard', { users });
  });
};