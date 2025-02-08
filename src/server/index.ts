import express from 'express';
import { createServer } from 'http';
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameRoom } from "./rooms/GameRoom.js";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate the correct dist path - go up three levels to reach project root
const distPath = path.join(__dirname, '../../client');

const app = express();
const httpServer = createServer(app);

// Enable CORS for development
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
  credentials: true
}));

// Middleware
app.use(express.json());

// Initialize Colyseus
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

// Register game room
gameServer.define("game", GameRoom);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes - in development, skip auth
if (process.env.NODE_ENV === 'development') {
  app.use('/api/*', (req, res, next) => {
    req.telegramUser = {
      id: 123456789,
      first_name: 'Test',
      username: 'test_user',
      language_code: 'en'
    };
    next();
  });
}

// Game routes
app.post('/api/game/find-match', async (req, res) => {
  try {
    const room = await gameServer.create("game", { betAmount: req.body.betAmount });
    res.json({ roomId: room.roomId });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Colyseus monitor
app.use('/colyseus', monitor());

// Serve static files from the Vite build output
app.use(express.static(distPath));

// Handle client-side routing - send index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/colyseus/')) {
    return next();
  }
  
  // Send the index.html file
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Serving static files from:', distPath);
});