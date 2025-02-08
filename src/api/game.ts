import axios from 'axios';
import { Game } from '../types';

export async function findMatch(betAmount: number): Promise<Game> {
  const response = await axios.post('/api/game/match', { betAmount });
  return response.data;
}

export async function getGameStatus(gameId: string): Promise<Game> {
  const response = await axios.get(`/api/game/${gameId}`);
  return response.data;
}