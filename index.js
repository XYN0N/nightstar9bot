require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Connessione a Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: () => 1000 // Reconnect every second
  }
});

redisClient.on('connect', () => {
  console.log('Redis connected');
});

redisClient.on('error', (err) => {
  console.log('Redis connection error:', err);
});

// Configurazione sessione
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2 ore di inattività
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inizializzazione del bot Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
bot.on('polling_error', (error) => console.log(error));

// Gestione del comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const profilePhoto = await bot.getUserProfilePhotos(chatId).then(p => p.photos[0][0].file_id).catch(() => null);

  // Genera un token univoco per l'utente
  const token = crypto.randomBytes(16).toString('hex');

  // Salva il token in Redis con una scadenza di 10 minuti
  redisClient.setex(token, 600, JSON.stringify({ chatId, username, profilePhoto }));

  // Invia il link di login all'utente
  bot.sendMessage(chatId, `Clicca sul seguente link per accedere alla tua home: https://nightstar9bot.herokuapp.com/login/${token}`);
});

// Rotte
app.get('/', (req, res) => {
  res.render('index', { telegramBotToken: process.env.TELEGRAM_BOT_TOKEN });
});

app.get('/login/:token', (req, res) => {
  const token = req.params.token;

  // Verifica il token in Redis
  redisClient.get(token, async (err, data) => {
    if (err || !data) {
      return res.status(400).send('Token non valido o scaduto.');
    }

    const userData = JSON.parse(data);

    // Registra l'utente nel database
    let user = await User.findOne({ telegramId: userData.chatId });
    if (!user) {
      user = new User({
        telegramId: userData.chatId,
        username: userData.username,
        profilePhoto: userData.profilePhoto,
        stars: 0,
        walletStars: 0,
        wins: 0,
        losses: 0
      });
      await user.save();
    }

    // Salva l'ID utente nella sessione
    req.session.userId = user._id;

    // Elimina il token da Redis
    redisClient.del(token);

    // Reindirizza alla home
    res.redirect('/home');
  });
});

app.get('/home', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.render('home');
});

require('./routes/profile')(app, bot);
require('./routes/challenges')(app, bot, google);
require('./routes/recharge')(app, bot, google);
require('./routes/leaderboard')(app, bot);

// Avvio del server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});