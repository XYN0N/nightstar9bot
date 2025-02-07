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
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
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

// Rotte
app.get('/', (req, res) => {
  res.render('index', { telegramBotToken: process.env.TELEGRAM_BOT_TOKEN });
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