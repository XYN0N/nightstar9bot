import { io } from 'socket.io-client';

// Get the WebSocket URL based on environment
const getWebSocketURL = () => {
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const socket = io(getWebSocketURL(), {
  transports: ['websocket'],
  autoConnect: true,
  path: '/socket.io',
  withCredentials: true
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