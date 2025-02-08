import { io } from 'socket.io-client';

const socket = io();

export function joinGame(gameId: string) {
  socket.emit('joinGame', gameId);
}

export function onGameStart(callback: (game: any) => void) {
  socket.on('gameStart', callback);
}

export function cleanup() {
  socket.removeAllListeners();
}