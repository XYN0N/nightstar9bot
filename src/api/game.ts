import axios from 'axios';
import { Game } from '../types';

// Get the API URL based on environment
const getAPIURL = () => {
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getAPIURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
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