require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3000;

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Connessione a Redis
const redisClient = redis.createClient(process.env.REDIS_URL);
redisClient.on('connect', () => {
  console.log('Redis connected');
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
app.set('view engine', 'ejs');

// Inizializzazione del bot Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
bot.on('polling_error', (error) => console.log(error));

// Rotte
require('./routes/profile')(app, bot);
require('./routes/challenges')(app, bot, google);
require('./routes/recharge')(app, bot, google);
require('./routes/leaderboard')(app, bot);

// Avvio del server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});