import axios from 'axios';
import { Game } from '../types';

// Use the production URL or fallback to development
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://nightstar9bot-d607ada78002.herokuapp.com'
  : 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export async function findMatch(betAmount: number): Promise<Game> {
  const response = await api.post('/api/game/find-match', { betAmount });
  return response.data;
}

export async function getGameStatus(gameId: string): Promise<Game> {
  const response = await api.get(`/api/game/${gameId}`);
  return response.data;
}

export async function joinGame(gameId: string): Promise<void> {
  await api.post(`/api/game/${gameId}/join`);
}