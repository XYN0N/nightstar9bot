const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const GameSession = require('../models/GameSession');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const name = `${msg.from.first_name} ${msg.from.last_name || ''}`;
  const telegramId = msg.from.id;

  bot.getUserProfilePhotos(telegramId, 0, 1).then((photos) => {
    const photoUrl = photos.total_count > 0 ? photos.photos[0][0].file_id : null;

    User.findOneAndUpdate(
      { telegramId },
      { username, name, profilePhoto: photoUrl, lastLogin: new Date() },
      { upsert: true, new: true },
      (err, user) => {
        if (err) {
          bot.sendMessage(chatId, 'Error saving user data.');
        } else {
          bot.sendMessage(chatId, `Welcome, ${name}! Start betting now.`);
        }
      }
    );
  }).catch((err) => {
    console.error('Error fetching profile photo:', err);
    bot.sendMessage(chatId, 'Error fetching profile photo.');
  });
});

bot.onText(/\/profile/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  User.findOne({ telegramId }, (err, user) => {
    if (err || !user) {
      bot.sendMessage(chatId, 'User profile not found.');
    } else {
      const profileMessage = `
        Name: ${user.name}
        Username: ${user.username}
        Stars: ${user.stars} 🌟
        Wins: ${user.wins}
        Losses: ${user.losses}
        Badges: ${'🏆'.repeat(user.badges)}
      `;
      bot.sendMessage(chatId, profileMessage);
    }
  });
});

bot.onText(/\/challenge (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const betAmount = parseInt(match[1]);
  const telegramId = msg.from.id;

  User.findOne({ telegramId }, async (err, player1) => {
    if (err || !player1 || player1.stars < betAmount) {
      bot.sendMessage(chatId, 'Insufficient stars or player not found.');
      return;
    }

    const player2 = await User.findOne({ _id: { $ne: player1._id }, stars: { $gte: betAmount } });
    if (!player2) {
      bot.sendMessage(chatId, 'No available opponents.');
      return;
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

    bot.sendMessage(chatId, `${winner.name} wins with number ${player1Number} vs ${player2Number}!`);
  });
});