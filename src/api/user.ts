import axios from 'axios';
import { User, LeaderboardEntry } from '../types';

const api = axios.create({
  baseURL: '/',
  withCredentials: true
});

export async function getUserData(): Promise<User> {
  try {
    const response = await api.post('/api/auth/initialize');
    return response.data;
  } catch (error) {
    if (import.meta.env.DEV) {
      return {
        id: 1,
        username: 'Test User',
        photoUrl: '',
        stars: 100,
        totalWins: 0,
        totalLosses: 0,
        totalEarnings: 0,
        badges: [],
        isPremium: false,
        referralCode: 'TEST123'
      };
    }
    throw error;
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await api.get('/api/leaderboard');
  return response.data;
}

export async function earnStars(type: 'click' | 'referral'): Promise<User> {
  const response = await api.post('/api/stars/claim');
  return response.data;
}