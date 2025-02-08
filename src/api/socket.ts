import { io } from 'socket.io-client';

// Use the production URL or fallback to development
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'wss://nightstar9bot-d607ada78002.herokuapp.com'
  : 'ws://localhost:3000';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true
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