const User = require('../models/User');
const { google } = require('googleapis');

module.exports = (app, bot, google) => {
  app.get('/recharge', (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/');
    }
    res.render('recharge', { googleWalletAPIKey: process.env.GOOGLE_WALLET_API_KEY });
  });

  app.post('/recharge', async (req, res) => {
    const { amount, paymentData } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/');
    }

    // Verifica del pagamento con Google Wallet
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    google.options({ auth: oauth2Client });

    try {
      const response = await google.walletobjects().genericclass.insert({
        resource: {
          id: `user-${user.telegramId}`,
          classId: 'YOUR_CLASS_ID',
          issuerName: 'Your Company Name',
          reviewStatus: 'underReview',
          messages: [
            {
              header: 'Payment Successful',
              body: `You have successfully purchased ${amount} stars.`
            }
          ]
        }
      });

      if (response.status === 200) {
        user.stars += amount;
        await user.save();
        res.redirect('/profile');
      } else {
        res.status(500).send('Payment failed');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Payment failed');
    }
  });

  bot.onText(/\/buy_stars/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Click the button below to buy stars', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '15 Stars', callback_data: 'buy_15_stars' },
            { text: '50 Stars', callback_data: 'buy_50_stars' },
            { text: '100 Stars', callback_data: 'buy_100_stars' }
          ]
        ]
      }
    });
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const user = await User.findOne({ telegramId: chatId });
    if (!user) {
      return;
    }

    let amount;
    if (query.data === 'buy_15_stars') {
      amount = 15;
    } else if (query.data === 'buy_50_stars') {
      amount = 50;
    } else if (query.data === 'buy_100_stars') {
      amount = 100;
    }

    // Aggiungi le stelle all'utente
    user.stars += amount;
    await user.save();

    bot.sendMessage(chatId, `You have successfully purchased ${amount} stars!`);
  });
};