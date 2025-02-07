const User = require('../models/User');

module.exports = (app, bot, google) => {
  app.get('/challenges', (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/');
    }
    res.render('challenges');
  });

  app.post('/challenges/start', async (req, res) => {
    const { bet } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/');
    }
    if (user.stars < bet) {
      return res.status(400).send('Insufficient stars');
    }

    const opponent = await User.findOne({ _id: { $ne: user._id }, stars: { $gte: bet } });
    if (!opponent) {
      return res.status(400).send('No opponents available');
    }

    // Trasferisci le stelle al wallet temporaneo
    user.stars -= bet;
    user.walletStars += bet;
    opponent.stars -= bet;
    opponent.walletStars += bet;

    await user.save();
    await opponent.save();

    const userNumber = Math.floor(Math.random() * 100) + 1;
    const opponentNumber = Math.floor(Math.random() * 100) + 1;
    const winner = userNumber > opponentNumber ? user : opponent;
    const loser = winner._id.equals(user._id) ? opponent : user;

    // Trasferisci le stelle al vincitore
    winner.walletStars += loser.walletStars;
    loser.walletStars = 0;

    winner.wins += 1;
    loser.losses += 1;

    await winner.save();
    await loser.save();

    res.send({ winner: winner.username, userNumber, opponentNumber });
  });
};