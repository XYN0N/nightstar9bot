const User = require('../models/User');

module.exports = (app, bot) => {
  app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/');
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/');
    }
    res.render('profile', { user });
  });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let user = await User.findOne({ telegramId: chatId });
    if (!user) {
      user = new User({
        telegramId: chatId,
        username: msg.from.username,
        profilePhoto: await bot.getUserProfilePhotos(chatId).then(p => p.photos[0][0].file_id)
      });
      await user.save();
    }
    // Salva l'utente nella sessione
    req.session.userId = user._id;
    res.redirect('/profile');
  });
};