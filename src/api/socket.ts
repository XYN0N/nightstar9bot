import { io } from 'socket.io-client';

// In production, use the same origin (Heroku URL)
const socket = io('/', {
  transports: ['websocket'],
  autoConnect: true,
  path: '/socket.io'
});

// Add connection event handlers
socket.on('connect', () => {
  console.log('Socket connected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export function joinGame(gameId: string) {
  socket.emit('joinGame', gameId);
}

export function onGameStart(callback: (game: any) => void) {
  socket.on('gameStart', callback);
}

export function cleanup() {
  socket.removeAllListeners();
}