import axios from 'axios';
import { User, LeaderboardEntry } from '../types';

export async function getUserData(): Promise<User> {
  const response = await axios.get('/api/user');
  return response.data;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await axios.get('/api/leaderboard');
  return response.data;
}

export async function earnStars(type: 'click' | 'referral'): Promise<User> {
  const response = await axios.post('/api/stars/earn', { type });
  return response.data;
}