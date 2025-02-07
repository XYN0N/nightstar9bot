const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const profileRoutes = require('../routes/profile');
const leaderboardRoutes = require('../routes/leaderboard');
const shopRoutes = require('../routes/shop');
const playRoutes = require('../routes/play');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const redis = require('redis');
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

let matchmakingQueue = [];

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.type === 'find-match') {
            const player = await User.findById(data.playerId);
            if (!player || player.stars < data.betAmount) {
                ws.send(JSON.stringify({ type: 'error', message: 'Insufficient stars or player not found.' }));
                return;
            }
            
            const opponent = matchmakingQueue.find(p => p.betAmount === data.betAmount && p.playerId !== data.playerId);
            if (opponent) {
                const player2 = await User.findById(opponent.playerId);
                ws.send(JSON.stringify({ type: 'match-found', player1: player, player2: player2 }));
                opponent.ws.send(JSON.stringify({ type: 'match-found', player1: player, player2: player2 }));
                matchmakingQueue = matchmakingQueue.filter(p => p.playerId !== data.playerId && p.playerId !== opponent.playerId);
                
                // Start game logic
                startGame(player, player2, data.betAmount);
            } else {
                matchmakingQueue.push({ ws, playerId: data.playerId, betAmount: data.betAmount });
            }
        }
    });

    ws.on('close', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.ws !== ws);
    });
});

app.use('/api/profile', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/play', playRoutes);

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${server.address().port}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

function broadcastLeaderboardUpdate() {
    User.find().sort({ wins: -1 }).limit(20).then(leaderboard => {
        const data = JSON.stringify({ type: 'leaderboard-update', leaderboard });
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
}

// Listen for changes in the database and broadcast updates
const changeStream = GameSession.watch();
changeStream.on('change', (change) => {
    if (change.operationType === 'update' || change.operationType === 'insert') {
        broadcastLeaderboardUpdate();
    }
});

async function startGame(player1, player2, betAmount) {
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

    bot.sendMessage(winner.telegramId, `Congratulations! You won ${betAmount} stars in a match against ${loser.name}.`);
    bot.sendMessage(loser.telegramId, `Sorry, you lost ${betAmount} stars in a match against ${winner.name}.`);
}