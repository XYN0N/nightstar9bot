const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

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